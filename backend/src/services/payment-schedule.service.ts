import { AppDataSource } from '../config/database.config';
import { PaymentSchedule, PaymentScheduleStatus } from '../entities/PaymentSchedule.entity';
import { Course, CourseType } from '../entities/Course.entity';
import { Registration } from '../entities/Registration.entity';

/**
 * Service de génération automatique des échéanciers de paiement
 * 
 * 3 patterns de paiement :
 * - TUTORING (GROUP/INDIVIDUAL) : 10 paiements mensuels de Septembre à Juin
 * - QUALIFYING ≥3 mois : N paiements mensuels selon la durée
 * - QUALIFYING <3 mois : 2 paiements (50% + 50%)
 */
export class PaymentScheduleService {
  private scheduleRepository = AppDataSource.getRepository(PaymentSchedule);
  private courseRepository = AppDataSource.getRepository(Course);
  private registrationRepository = AppDataSource.getRepository(Registration);

  /**
   * Génère automatiquement l'échéancier de paiement pour une inscription
   * @param enrollmentId - ID de l'enrollment (inscription)
   * @param courseId - ID de la formation
   * @param startDate - Date de début (pour TUTORING, commence en Septembre)
   * @param endDate - Date de fin (optionnel pour TUTORING)
   * @returns Liste des échéanciers créés
   */
  async generatePaymentSchedule(
    enrollmentId: number,
    courseId: number,
    startDate: Date,
    endDate?: Date
  ): Promise<PaymentSchedule[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error(`Formation avec ID ${courseId} introuvable`);
    }

    // Sélectionner la méthode de génération selon le type
    switch (course.type) {
      case CourseType.TUTORING_GROUP:
      case CourseType.TUTORING_INDIVIDUAL:
        return this.generateTutoringPayments(enrollmentId, course, startDate);
      
      case CourseType.QUALIFYING:
        if (!endDate) {
          throw new Error('endDate requis pour les formations qualifiantes');
        }
        
        const durationMonths = this.calculateDurationInMonths(startDate, endDate);
        
        if (durationMonths < 3) {
          return this.generateShortPayments(enrollmentId, course);
        } else {
          return this.generateQualifyingPayments(enrollmentId, course, startDate, endDate);
        }
      
      default:
        throw new Error(`Type de formation non supporté: ${course.type}`);
    }
  }

  /**
   * Génère 10 paiements mensuels pour les cours de soutien (Septembre → Juin)
   */
  private async generateTutoringPayments(
    enrollmentId: number,
    course: Course,
    startDate: Date
  ): Promise<PaymentSchedule[]> {
    const schedules: PaymentSchedule[] = [];
    const startYear = startDate.getFullYear();
    
    // Prix mensuel
    const monthlyAmount = course.pricePerMonth || (course.price / 10);
    
    // Mois de soutien scolaire : Septembre (9) à Juin (6)
    const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
    const monthNames = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'
    ];

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const monthName = monthNames[i];
      
      // Calculer l'année correcte (Jan-Jun = année suivante)
      const year = month >= 9 ? startYear : startYear + 1;
      
      // Date d'échéance : le 5 de chaque mois
      const dueDate = new Date(year, month - 1, 5);
      
      const schedule = this.scheduleRepository.create({
        enrollmentId,
        amount: monthlyAmount,
        dueDate,
        installmentNumber: i + 1,
        status: PaymentScheduleStatus.EN_ATTENTE,
        notes: `Paiement mensuel ${i + 1}/10 - ${monthName} ${year}`,
      });

      schedules.push(schedule);
    }

    await this.scheduleRepository.save(schedules);
    
    console.log(`✅ ${schedules.length} échéanciers générés pour le cours de soutien: ${course.title}`);
    return schedules;
  }

  /**
   * Génère N paiements mensuels pour les formations qualifiantes longues (≥3 mois)
   */
  private async generateQualifyingPayments(
    enrollmentId: number,
    course: Course,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentSchedule[]> {
    const schedules: PaymentSchedule[] = [];
    const durationMonths = this.calculateDurationInMonths(startDate, endDate);
    
    // Prix mensuel
    const monthlyAmount = course.pricePerMonth || (course.price / durationMonths);
    
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < durationMonths; i++) {
      const month = currentDate.getMonth() + 1; // 1-12
      const year = currentDate.getFullYear();
      const monthName = this.getMonthName(month);
      
      // Date d'échéance : le 5 de chaque mois
      const dueDate = new Date(year, month - 1, 5);
      
      const schedule = this.scheduleRepository.create({
        enrollmentId,
        amount: monthlyAmount,
        dueDate,
        installmentNumber: i + 1,
        status: PaymentScheduleStatus.EN_ATTENTE,
        notes: `Paiement ${i + 1}/${durationMonths} - ${monthName} ${year}`,
      });

      schedules.push(schedule);
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    await this.scheduleRepository.save(schedules);
    
    console.log(`✅ ${schedules.length} échéanciers générés pour la formation qualifiante: ${course.title}`);
    return schedules;
  }

  /**
   * Génère 2 paiements pour les formations courtes (<3 mois)
   * Pattern : 50% au début + 50% au milieu/fin
   */
  private async generateShortPayments(
    enrollmentId: number,
    course: Course
  ): Promise<PaymentSchedule[]> {
    const schedules: PaymentSchedule[] = [];
    
    // Diviser en 2 paiements de 50%
    const halfAmount = course.price / 2;
    
    // Premier paiement : immédiat (date d'inscription)
    const firstPayment = this.scheduleRepository.create({
      enrollmentId,
      amount: halfAmount,
      dueDate: new Date(), // Aujourd'hui
      installmentNumber: 1,
      status: PaymentScheduleStatus.EN_ATTENTE,
      notes: 'Premier paiement - 50% du montant total',
    });

    schedules.push(firstPayment);
    
    // Deuxième paiement : 30 jours après (ou à mi-parcours)
    const secondDueDate = new Date();
    secondDueDate.setDate(secondDueDate.getDate() + 30);
    
    const secondPayment = this.scheduleRepository.create({
      enrollmentId,
      amount: halfAmount,
      dueDate: secondDueDate,
      installmentNumber: 2,
      status: PaymentScheduleStatus.EN_ATTENTE,
      notes: 'Deuxième paiement - 50% restant',
    });

    schedules.push(secondPayment);
    
    await this.scheduleRepository.save(schedules);
    
    console.log(`✅ ${schedules.length} échéanciers générés pour la formation courte: ${course.title}`);
    return schedules;
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
   * Supprime tous les échéanciers d'une inscription
   * Utile si on veut régénérer les échéanciers
   */
  async deletePaymentSchedules(enrollmentId: number): Promise<void> {
    await this.scheduleRepository.delete({ enrollmentId });
    console.log(`🗑️  Échéanciers supprimés pour l'inscription ID ${enrollmentId}`);
  }

  /**
   * Vérifie si une inscription a déjà des échéanciers
   */
  async hasPaymentSchedules(enrollmentId: number): Promise<boolean> {
    const count = await this.scheduleRepository.count({
      where: { enrollmentId },
    });
    return count > 0;
  }
}
