import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Enrollment } from '../entities/Enrollment.entity';
import { PaymentSchedule, PaymentScheduleStatus } from '../entities/PaymentSchedule.entity';
import { Session } from '../entities/Session.entity';
import { AppError } from '../middleware/error.middleware';

/**
 * Service de contrôle d'accès aux sessions
 * 
 * Gère :
 * - Validation des paiements (blocage après 15 jours de retard)
 * - Vérification des inscriptions
 * - Logs des tentatives d'accès
 */
export class AccessControlService {
  private studentRepository = AppDataSource.getRepository(Student);
  private enrollmentRepository = AppDataSource.getRepository(Enrollment);
  private paymentScheduleRepository = AppDataSource.getRepository(PaymentSchedule);
  private sessionRepository = AppDataSource.getRepository(Session);

  // Délai de grâce en jours avant blocage complet
  private readonly GRACE_PERIOD_DAYS = 15;

  /**
   * Vérifie si un étudiant peut accéder à une session
   * 
   * Vérifications effectuées :
   * 1. Étudiant actif
   * 2. Badge valide
   * 3. Inscrit à la formation de la session
   * 4. Paiements à jour (ou dans la période de grâce)
   * 
   * @param studentId - ID de l'étudiant
   * @param sessionId - ID de la session
   * @returns Objet avec statut d'accès et message
   */
  async checkStudentAccess(
    studentId: number,
    sessionId: number
  ): Promise<{
    allowed: boolean;
    status: 'granted' | 'warning' | 'denied';
    reason?: string;
    message: string;
    paymentStatus?: {
      hasOverduePayments: boolean;
      overdueAmount: number;
      daysOverdue: number;
      nextDueDate?: Date;
    };
  }> {
    // 1. Récupérer l'étudiant
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!student) {
      return {
        allowed: false,
        status: 'denied',
        reason: 'STUDENT_NOT_FOUND',
        message: 'Étudiant introuvable',
      };
    }

    // 2. Vérifier si l'étudiant est actif
    if (!student.isActive) {
      return {
        allowed: false,
        status: 'denied',
        reason: 'STUDENT_INACTIVE',
        message: 'Compte étudiant désactivé. Contactez l\'administration.',
      };
    }

    // 3. Vérifier si le badge a expiré
    if (student.badgeExpiry && new Date() > student.badgeExpiry) {
      return {
        allowed: false,
        status: 'denied',
        reason: 'BADGE_EXPIRED',
        message: `Badge expiré le ${student.badgeExpiry.toLocaleDateString('fr-FR')}. Veuillez renouveler votre badge.`,
      };
    }

    // 4. Récupérer la session
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      return {
        allowed: false,
        status: 'denied',
        reason: 'SESSION_NOT_FOUND',
        message: 'Session introuvable',
      };
    }

    // 5. Vérifier si l'étudiant est inscrit à la formation de cette session
    const enrollment = student.enrollments?.find(
      (e) => e.courseId === session.course?.id
    );

    if (!enrollment) {
      return {
        allowed: false,
        status: 'denied',
        reason: 'NOT_ENROLLED',
        message: 'Vous n\'êtes pas inscrit à cette formation',
      };
    }

    // 6. Vérifier le statut des paiements
    const paymentStatus = await this.validatePaymentStatus(enrollment.id);

    // 7. Décision d'accès selon le statut de paiement
    if (!paymentStatus.hasOverduePayments) {
      // ✅ ACCÈS ACCORDÉ - Paiements à jour
      return {
        allowed: true,
        status: 'granted',
        message: 'Accès autorisé',
        paymentStatus,
      };
    }

    if (paymentStatus.daysOverdue <= this.GRACE_PERIOD_DAYS) {
      // ⚠️ ACCÈS ACCORDÉ AVEC AVERTISSEMENT - Dans la période de grâce
      return {
        allowed: true,
        status: 'warning',
        reason: 'PAYMENT_WARNING',
        message: `Accès autorisé. Attention : paiement en retard de ${paymentStatus.daysOverdue} jour(s). Régularisez avant le ${this.addDays(paymentStatus.nextDueDate || new Date(), this.GRACE_PERIOD_DAYS - paymentStatus.daysOverdue).toLocaleDateString('fr-FR')}`,
        paymentStatus,
      };
    }

    // ❌ ACCÈS REFUSÉ - Retard de paiement > 15 jours
    return {
      allowed: false,
      status: 'denied',
      reason: 'PAYMENT_OVERDUE',
      message: `Accès refusé. Retard de paiement : ${paymentStatus.daysOverdue} jour(s) (${paymentStatus.overdueAmount} DA). Veuillez régulariser votre situation.`,
      paymentStatus,
    };
  }

  /**
   * Valide le statut des paiements d'un enrollment
   * 
   * @param enrollmentId - ID de l'enrollment
   * @returns Statut détaillé des paiements
   */
  async validatePaymentStatus(enrollmentId: number): Promise<{
    hasOverduePayments: boolean;
    overdueAmount: number;
    daysOverdue: number;
    nextDueDate?: Date;
    overdueCount: number;
    totalScheduled: number;
    totalPaid: number;
  }> {
    // Récupérer tous les échéanciers de cet enrollment
    const schedules = await this.paymentScheduleRepository.find({
      where: { enrollmentId },
      order: { dueDate: 'ASC' },
    });

    const now = new Date();
    let hasOverduePayments = false;
    let overdueAmount = 0;
    let maxDaysOverdue = 0;
    let nextDueDate: Date | undefined;
    let overdueCount = 0;
    let totalScheduled = 0;
    let totalPaid = 0;

    for (const schedule of schedules) {
      totalScheduled += Number(schedule.amount);

      if (schedule.status === PaymentScheduleStatus.PAYE) {
        totalPaid += Number(schedule.paidAmount || schedule.amount);
        continue;
      }

      // Paiement non effectué
      if (schedule.status === PaymentScheduleStatus.EN_ATTENTE) {
        const dueDate = new Date(schedule.dueDate);

        if (now > dueDate) {
          // Paiement en retard
          hasOverduePayments = true;
          overdueAmount += Number(schedule.amount);
          overdueCount++;

          const daysOverdue = this.calculateDaysDifference(dueDate, now);
          if (daysOverdue > maxDaysOverdue) {
            maxDaysOverdue = daysOverdue;
          }
        } else {
          // Prochain paiement à venir
          if (!nextDueDate || dueDate < nextDueDate) {
            nextDueDate = dueDate;
          }
        }
      }

      if (schedule.status === PaymentScheduleStatus.EN_RETARD) {
        hasOverduePayments = true;
        overdueAmount += Number(schedule.amount) - Number(schedule.paidAmount || 0);
        overdueCount++;

        const dueDate = new Date(schedule.dueDate);
        const daysOverdue = this.calculateDaysDifference(dueDate, now);
        if (daysOverdue > maxDaysOverdue) {
          maxDaysOverdue = daysOverdue;
        }
      }
    }

    return {
      hasOverduePayments,
      overdueAmount,
      daysOverdue: maxDaysOverdue,
      nextDueDate,
      overdueCount,
      totalScheduled,
      totalPaid,
    };
  }

  /**
   * Enregistre une tentative d'accès (succès ou échec)
   * Utile pour l'audit et la détection de fraudes
   * 
   * @param studentId - ID de l'étudiant
   * @param sessionId - ID de la session
   * @param allowed - Accès accordé ou refusé
   * @param reason - Raison du refus (si applicable)
   */
  async logAccessAttempt(
    studentId: number,
    sessionId: number,
    allowed: boolean,
    reason?: string
  ): Promise<void> {
    const timestamp = new Date();
    const status = allowed ? '✅ ACCORDÉ' : '❌ REFUSÉ';
    const reasonText = reason ? ` (${reason})` : '';

    console.log(
      `[${timestamp.toISOString()}] ${status} - Étudiant ${studentId} → Session ${sessionId}${reasonText}`
    );

    // TODO: Persister dans une table d'audit si nécessaire
    // Actuellement, on utilise juste les logs console
    // Pour une solution plus robuste, créer une table access_logs
  }

  /**
   * Vérifie l'accès et enregistre le log en une seule opération
   * 
   * @param studentId - ID de l'étudiant
   * @param sessionId - ID de la session
   * @returns Résultat de la vérification d'accès
   */
  async checkAndLogAccess(studentId: number, sessionId: number) {
    const accessResult = await this.checkStudentAccess(studentId, sessionId);
    
    await this.logAccessAttempt(
      studentId,
      sessionId,
      accessResult.allowed,
      accessResult.reason
    );

    return accessResult;
  }

  /**
   * Récupère un résumé du statut d'accès pour plusieurs étudiants
   * Utile pour les tableaux de bord
   * 
   * @param sessionId - ID de la session
   * @returns Liste des étudiants avec leur statut d'accès
   */
  async getSessionAccessSummary(sessionId: number): Promise<{
    sessionId: number;
    totalStudents: number;
    accessGranted: number;
    accessWarning: number;
    accessDenied: number;
    students: Array<{
      studentId: number;
      studentName: string;
      status: 'granted' | 'warning' | 'denied';
      message: string;
    }>;
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session || !session.course) {
      throw new AppError('Session ou formation introuvable', 404);
    }

    // Récupérer les enrollments pour cette formation
    const enrollments = await this.enrollmentRepository.find({
      where: { courseId: session.course.id },
      relations: ['student'],
    });

    const students = enrollments.map((e) => e.student).filter(Boolean);
    const summary = {
      sessionId,
      totalStudents: students.length,
      accessGranted: 0,
      accessWarning: 0,
      accessDenied: 0,
      students: [] as Array<{
        studentId: number;
        studentName: string;
        status: 'granted' | 'warning' | 'denied';
        message: string;
      }>,
    };

    for (const student of students) {
      const access = await this.checkStudentAccess(student.id, sessionId);

      summary.students.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        status: access.status,
        message: access.message,
      });

      if (access.status === 'granted') summary.accessGranted++;
      if (access.status === 'warning') summary.accessWarning++;
      if (access.status === 'denied') summary.accessDenied++;
    }

    return summary;
  }

  // ========== MÉTHODES UTILITAIRES ==========

  /**
   * Calcule la différence en jours entre 2 dates
   */
  private calculateDaysDifference(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Ajoute un nombre de jours à une date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
