import { AppDataSource } from '../config/database.config';
import { Session, SessionStatus } from '../entities/Session.entity';
import { Course, CourseType } from '../entities/Course.entity';

/**
 * Service de génération automatique des sessions selon le type de formation
 * 
 * 3 patterns de génération :
 * - TUTORING (GROUP/INDIVIDUAL) : 10 sessions mensuelles de Septembre à Juin (pas Juillet/Août)
 * - QUALIFYING ≥3 mois : N sessions mensuelles selon la durée
 * - QUALIFYING <3 mois : 1-2 sessions (split la durée en 2)
 */
export class SessionGeneratorService {
  private sessionRepository = AppDataSource.getRepository(Session);
  private courseRepository = AppDataSource.getRepository(Course);

  /**
   * Génère automatiquement les sessions pour une formation
   * @param courseId - ID de la formation
   * @param startDate - Date de début de la formation
   * @param endDate - Date de fin de la formation (optionnel pour TUTORING)
   * @returns Liste des sessions créées
   */
  async generateSessionsForCourse(
    courseId: number,
    startDate: Date,
    endDate?: Date
  ): Promise<Session[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['trainer', 'roomEntity', 'timeSlotEntity'],
    });

    if (!course) {
      throw new Error(`Formation avec ID ${courseId} introuvable`);
    }

    // Sélectionner la méthode de génération selon le type
    switch (course.type) {
      case CourseType.TUTORING_GROUP:
      case CourseType.TUTORING_INDIVIDUAL:
        return this.generateSessionsForTutoring(course, startDate);
      
      case CourseType.QUALIFYING:
        if (!endDate) {
          throw new Error('endDate requis pour les formations qualifiantes');
        }
        
        // Vérifier la durée pour choisir le pattern
        const durationMonths = this.calculateDurationInMonths(startDate, endDate);
        
        if (durationMonths < 3) {
          return this.generateSessionsForShort(course, startDate, endDate);
        } else {
          return this.generateSessionsForQualifying(course, startDate, endDate);
        }
      
      default:
        throw new Error(`Type de formation non supporté: ${course.type}`);
    }
  }

  /**
   * Génère 10 sessions mensuelles pour les cours de soutien (Septembre → Juin)
   * Pas de sessions en Juillet et Août
   */
  private async generateSessionsForTutoring(course: Course, startDate: Date): Promise<Session[]> {
    const sessions: Session[] = [];
    const startYear = startDate.getFullYear();
    
    // Mois de soutien scolaire : Septembre (9) à Juin (6)
    const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // Sep, Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun
    const monthNames = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'
    ];

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const monthName = monthNames[i];
      
      // Calculer l'année correcte (Jan-Jun = année suivante)
      const year = month >= 9 ? startYear : startYear + 1;
      
      // Créer la session mensuelle
      const session = this.sessionRepository.create({
        courseId: course.id,
        trainerId: course.trainerId,
        roomId: course.roomId,
        timeSlotId: course.timeSlotId,
        
        // Dates : 1er jour du mois au dernier jour du mois
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0), // Dernier jour du mois
        
        // Labels
        monthLabel: `${monthName} ${year}`,
        month: month,
        year: year,
        
        // Horaires (copie du schedule si disponible)
        daysOfWeek: course.schedule, // Ex: "Lundi,Mercredi,Vendredi"
        
        // Capacité
        capacity: course.maxStudents || 20,
        enrolledCount: 0,
        currentAttendance: 0,
        
        // Localisation
        location: course.roomEntity?.name || course.room || 'À définir',
        
        // Prix (prix mensuel)
        price: course.pricePerMonth || (course.price ? course.price / 10 : null),
        
        // Statut
        status: SessionStatus.UPCOMING,
        isActive: true,
        
        notes: `Session mensuelle de ${monthName} - ${course.title}`,
      });

      sessions.push(session);
    }

    // Sauvegarder toutes les sessions
    await this.sessionRepository.save(sessions);
    
    console.log(`✅ ${sessions.length} sessions générées pour le cours de soutien: ${course.title}`);
    return sessions;
  }

  /**
   * Génère N sessions mensuelles pour les formations qualifiantes longues (≥3 mois)
   */
  private async generateSessionsForQualifying(course: Course, startDate: Date, endDate: Date): Promise<Session[]> {
    const sessions: Session[] = [];
    const durationMonths = this.calculateDurationInMonths(startDate, endDate);
    
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < durationMonths; i++) {
      const month = currentDate.getMonth() + 1; // 1-12
      const year = currentDate.getFullYear();
      const monthName = this.getMonthName(month);
      
      // Date de fin de la session (dernier jour du mois ou date de fin du cours)
      const sessionEndDate = new Date(year, month, 0); // Dernier jour du mois
      const courseEndDate = new Date(endDate);
      const finalEndDate = sessionEndDate > courseEndDate ? courseEndDate : sessionEndDate;
      
      const session = this.sessionRepository.create({
        courseId: course.id,
        trainerId: course.trainerId,
        roomId: course.roomId,
        timeSlotId: course.timeSlotId,
        
        startDate: new Date(currentDate),
        endDate: finalEndDate,
        
        monthLabel: `${monthName} ${year}`,
        month: month,
        year: year,
        
        daysOfWeek: course.schedule,
        
        capacity: course.maxStudents || 20,
        enrolledCount: 0,
        currentAttendance: 0,
        
        location: course.roomEntity?.name || course.room || 'À définir',
        price: course.pricePerMonth || (course.price ? course.price / durationMonths : null),
        
        status: SessionStatus.UPCOMING,
        isActive: true,
        
        notes: `Session ${i + 1}/${durationMonths} - ${course.title}`,
      });

      sessions.push(session);
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    await this.sessionRepository.save(sessions);
    
    console.log(`✅ ${sessions.length} sessions générées pour la formation qualifiante: ${course.title}`);
    return sessions;
  }

  /**
   * Génère 1-2 sessions pour les formations courtes (<3 mois)
   * La durée est divisée en 2 périodes égales
   */
  private async generateSessionsForShort(course: Course, startDate: Date, endDate: Date): Promise<Session[]> {
    const sessions: Session[] = [];
    const durationDays = this.calculateDurationInDays(startDate, endDate);
    
    // Si moins de 30 jours → 1 session, sinon 2 sessions
    const sessionCount = durationDays < 30 ? 1 : 2;
    const daysPerSession = Math.floor(durationDays / sessionCount);
    
    let currentStartDate = new Date(startDate);
    
    for (let i = 0; i < sessionCount; i++) {
      // Calculer la date de fin de cette session
      const sessionEndDate = new Date(currentStartDate);
      sessionEndDate.setDate(sessionEndDate.getDate() + daysPerSession - 1);
      
      // Pour la dernière session, utiliser la date de fin du cours
      if (i === sessionCount - 1) {
        sessionEndDate.setTime(endDate.getTime());
      }
      
      const month = currentStartDate.getMonth() + 1;
      const year = currentStartDate.getFullYear();
      const monthName = this.getMonthName(month);
      
      const session = this.sessionRepository.create({
        courseId: course.id,
        trainerId: course.trainerId,
        roomId: course.roomId,
        timeSlotId: course.timeSlotId,
        
        startDate: new Date(currentStartDate),
        endDate: sessionEndDate,
        
        monthLabel: `${monthName} ${year} - Session ${i + 1}`,
        month: month,
        year: year,
        
        daysOfWeek: course.schedule,
        
        capacity: course.maxStudents || 20,
        enrolledCount: 0,
        currentAttendance: 0,
        
        location: course.roomEntity?.name || course.room || 'À définir',
        price: course.price ? course.price / 2 : null, // Diviser en 2 paiements
        
        status: SessionStatus.UPCOMING,
        isActive: true,
        
        notes: `Session ${i + 1}/${sessionCount} - Formation courte - ${course.title}`,
      });

      sessions.push(session);
      
      // Passer à la période suivante
      currentStartDate = new Date(sessionEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
    }

    await this.sessionRepository.save(sessions);
    
    console.log(`✅ ${sessions.length} sessions générées pour la formation courte: ${course.title}`);
    return sessions;
  }

  /**
   * Calcule la durée en mois entre 2 dates
   */
  private calculateDurationInMonths(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    return yearDiff * 12 + monthDiff + 1; // +1 pour inclure le mois de début
  }

  /**
   * Calcule la durée en jours entre 2 dates
   */
  private calculateDurationInDays(startDate: Date, endDate: Date): number {
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
  }

  /**
   * Retourne le nom du mois en français
   */
  private getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }

  /**
   * Supprime toutes les sessions d'une formation
   * Utile si on veut régénérer les sessions
   */
  async deleteSessionsForCourse(courseId: number): Promise<void> {
    await this.sessionRepository.delete({ courseId });
    console.log(`🗑️  Sessions supprimées pour la formation ID ${courseId}`);
  }
}
