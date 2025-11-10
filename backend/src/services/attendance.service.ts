import { AppDataSource } from '../config/database.config';
import { Attendance, AttendanceStatus, ScanMethod } from '../entities/Attendance.entity';
import { AttendanceReport } from '../entities/AttendanceReport.entity';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';
import { AppError } from '../middleware/error.middleware';
import { QrCodeService } from './qrcode.service';
import { AccessControlService } from './access-control.service';

/**
 * Service de gestion des présences
 * 
 * Gère :
 * - Enregistrement des présences (QR scan ou manuel)
 * - Génération de rapports quotidiens/mensuels
 * - Détection des absences répétées
 * - Mise à jour automatique des statistiques
 */
export class AttendanceService {
  private attendanceRepository = AppDataSource.getRepository(Attendance);
  private reportRepository = AppDataSource.getRepository(AttendanceReport);
  private studentRepository = AppDataSource.getRepository(Student);
  private sessionRepository = AppDataSource.getRepository(Session);
  
  private qrCodeService: QrCodeService;
  private accessControlService: AccessControlService;

  constructor() {
    this.qrCodeService = new QrCodeService();
    this.accessControlService = new AccessControlService();
  }

  // Seuil d'absences pour alerte
  private readonly ALERT_THRESHOLD = 3;

  /**
   * Enregistre une présence via scan QR
   * 
   * Processus :
   * 1. Valider les QR codes (session + étudiant)
   * 2. Vérifier le contrôle d'accès (paiements)
   * 3. Enregistrer la présence avec le statut approprié
   * 4. Mettre à jour les statistiques
   * 
   * @param sessionQrCode - QR code de la session
   * @param studentQrCode - QR code badge de l'étudiant
   * @returns Présence enregistrée avec détails d'accès
   */
  async recordAttendance(
    sessionQrCode: string,
    studentQrCode: string
  ): Promise<{
    attendance: Attendance;
    accessStatus: {
      allowed: boolean;
      status: 'granted' | 'warning' | 'denied';
      message: string;
    };
  }> {
    // 1. Valider le QR code de la session
    const session = await this.qrCodeService.validateSessionQr(sessionQrCode);
    
    // 2. Valider le QR code de l'étudiant
    const student = await this.qrCodeService.validateStudentQr(studentQrCode);

    // 3. Vérifier le contrôle d'accès (inscription + paiements)
    const accessResult = await this.accessControlService.checkAndLogAccess(
      student.id,
      session.id
    );

    // 4. Déterminer le statut de présence selon le contrôle d'accès
    let attendanceStatus: AttendanceStatus;
    let note: string | undefined;
    let paymentValidated = true;
    let paymentAlert: string | undefined;

    if (accessResult.status === 'granted') {
      // ✅ Accès OK - Présent
      attendanceStatus = AttendanceStatus.PRESENT;
    } else if (accessResult.status === 'warning') {
      // ⚠️ Avertissement paiement - Présent avec alerte
      attendanceStatus = AttendanceStatus.PRESENT;
      paymentValidated = false;
      paymentAlert = accessResult.message;
      note = `⚠️ ${accessResult.message}`;
    } else {
      // ❌ Accès refusé - Ne devrait pas arriver ici car checkAndLogAccess lève une erreur
      throw new AppError(accessResult.message, 403);
    }

    // 5. Vérifier qu'il n'y a pas déjà une présence enregistrée
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: student.id,
        sessionId: session.id,
      },
    });

    if (existingAttendance) {
      throw new AppError(
        `Présence déjà enregistrée pour ${student.firstName} ${student.lastName} à cette session`,
        409
      );
    }

    // 6. Créer l'enregistrement de présence
    const attendance = this.attendanceRepository.create({
      studentId: student.id,
      sessionId: session.id,
      scanTime: new Date(),
      scanMethod: ScanMethod.QR_SCAN,
      status: attendanceStatus,
      note,
      paymentValidated,
      paymentAlert,
    });

    await this.attendanceRepository.save(attendance);

    // 7. Mettre à jour le compteur de présences de la session
    if (session.currentAttendance !== undefined) {
      session.currentAttendance += 1;
      await this.sessionRepository.save(session);
    }

    // 8. Mettre à jour le rapport mensuel
    await this.updateMonthlyReport(student.id, session.course!.id);

    console.log(
      `✅ Présence enregistrée: ${student.firstName} ${student.lastName} → ${session.monthLabel || 'Session #' + session.id}`
    );

    // Charger les relations pour le retour
    const savedAttendance = await this.attendanceRepository.findOne({
      where: { id: attendance.id },
      relations: ['student', 'session'],
    });

    return {
      attendance: savedAttendance!,
      accessStatus: {
        allowed: accessResult.allowed,
        status: accessResult.status,
        message: accessResult.message,
      },
    };
  }

  /**
   * Enregistre une présence manuellement (par admin)
   * 
   * @param sessionId - ID de la session
   * @param studentId - ID de l'étudiant
   * @param status - Statut de présence
   * @param note - Note optionnelle
   * @param recordedById - ID de l'admin qui enregistre
   * @returns Présence enregistrée
   */
  async recordManualAttendance(
    sessionId: number,
    studentId: number,
    status: AttendanceStatus,
    note?: string,
    recordedById?: number
  ): Promise<Attendance> {
    // 1. Vérifier que la session existe
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new AppError(`Session avec ID ${sessionId} introuvable`, 404);
    }

    // 2. Vérifier que l'étudiant existe
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError(`Étudiant avec ID ${studentId} introuvable`, 404);
    }

    // 3. Vérifier qu'il n'y a pas déjà une présence
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId,
        sessionId,
      },
    });

    if (existingAttendance) {
      // Mettre à jour la présence existante
      existingAttendance.status = status;
      existingAttendance.note = note;
      existingAttendance.scanMethod = ScanMethod.MANUAL;
      existingAttendance.recordedById = recordedById;
      existingAttendance.scanTime = new Date();

      await this.attendanceRepository.save(existingAttendance);
      
      console.log(
        `🔄 Présence mise à jour (manuel): ${student.firstName} ${student.lastName} → ${status}`
      );

      return existingAttendance;
    }

    // 4. Créer une nouvelle présence
    const attendance = this.attendanceRepository.create({
      studentId,
      sessionId,
      scanTime: new Date(),
      scanMethod: ScanMethod.MANUAL,
      status,
      note,
      recordedById,
      paymentValidated: true, // Pas de validation paiement en mode manuel
    });

    await this.attendanceRepository.save(attendance);

    // 5. Mettre à jour le rapport mensuel
    await this.updateMonthlyReport(studentId, session.course!.id);

    console.log(
      `✅ Présence ajoutée manuellement: ${student.firstName} ${student.lastName} → ${status}`
    );

    return attendance;
  }

  /**
   * Génère un rapport quotidien des présences d'une session
   * 
   * @param sessionId - ID de la session
   * @param date - Date du rapport (optionnel, défaut: aujourd'hui)
   * @returns Rapport avec liste des présents/absents
   */
  async generateDailyReport(
    sessionId: number,
    date?: Date
  ): Promise<{
    session: Session;
    date: Date;
    totalExpected: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
    attendances: Attendance[];
    absentStudents: Student[];
  }> {
    const targetDate = date || new Date();

    // 1. Récupérer la session
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new AppError(`Session avec ID ${sessionId} introuvable`, 404);
    }

    // 2. Récupérer toutes les présences de cette session
    const attendances = await this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student'],
      order: { scanTime: 'ASC' },
    });

    // 3. Calculer les statistiques
    const present = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absent = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const late = attendances.filter((a) => a.status === AttendanceStatus.LATE).length;
    const excused = attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length;

    // 4. Récupérer les étudiants inscrits à la formation
    const totalExpected = session.capacity || 0; // Ou calculer depuis enrollments

    // 5. Trouver les étudiants absents (pas de présence enregistrée)
    const presentStudentIds = attendances.map((a) => a.studentId);
    
    // TODO: Récupérer tous les étudiants inscrits et filtrer ceux qui sont absents
    // Pour l'instant, liste vide
    const absentStudents: Student[] = [];

    const attendanceRate = totalExpected > 0 
      ? (present / totalExpected) * 100 
      : 0;

    return {
      session,
      date: targetDate,
      totalExpected,
      present,
      absent,
      late,
      excused,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      attendances,
      absentStudents,
    };
  }

  /**
   * Vérifie si un étudiant a des absences répétées
   * Retourne une alerte si >= 3 absences consécutives
   * 
   * @param studentId - ID de l'étudiant
   * @param courseId - ID de la formation
   * @returns Objet avec alerte et nombre d'absences
   */
  async checkRepeatedAbsences(
    studentId: number,
    courseId: number
  ): Promise<{
    hasAlert: boolean;
    consecutiveAbsences: number;
    totalAbsences: number;
    message?: string;
  }> {
    // 1. Récupérer toutes les sessions de cette formation
    const sessions = await this.sessionRepository.find({
      where: { course: { id: courseId } },
      order: { startDate: 'DESC' },
      take: 10, // Dernières 10 sessions
    });

    if (sessions.length === 0) {
      return {
        hasAlert: false,
        consecutiveAbsences: 0,
        totalAbsences: 0,
      };
    }

    // 2. Récupérer les présences de cet étudiant pour ces sessions
    const sessionIds = sessions.map((s) => s.id);
    const attendances = await this.attendanceRepository.find({
      where: {
        studentId,
        sessionId: sessionIds as any, // TypeORM supporte IN
      },
      order: { scanTime: 'DESC' },
    });

    // 3. Créer un map sessionId → présence
    const attendanceMap = new Map<number, Attendance>();
    attendances.forEach((a) => attendanceMap.set(a.sessionId, a));

    // 4. Compter les absences consécutives (depuis la session la plus récente)
    let consecutiveAbsences = 0;
    let totalAbsences = 0;

    for (const session of sessions) {
      const attendance = attendanceMap.get(session.id);

      if (!attendance || attendance.status === AttendanceStatus.ABSENT) {
        consecutiveAbsences++;
        totalAbsences++;
      } else {
        // Présence trouvée, stop le compteur consécutif
        if (consecutiveAbsences > 0) break;
      }
    }

    // 5. Compter toutes les absences (non consécutives)
    totalAbsences = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT
    ).length;

    // 6. Générer l'alerte si >= 3 absences consécutives
    const hasAlert = consecutiveAbsences >= this.ALERT_THRESHOLD;
    const message = hasAlert
      ? `⚠️ ALERTE: ${consecutiveAbsences} absence(s) consécutive(s) détectée(s)`
      : undefined;

    return {
      hasAlert,
      consecutiveAbsences,
      totalAbsences,
      message,
    };
  }

  /**
   * Met à jour le rapport mensuel d'un étudiant
   * Calcule automatiquement les statistiques à partir des présences
   * 
   * @param studentId - ID de l'étudiant
   * @param courseId - ID de la formation
   */
  async updateMonthlyReport(studentId: number, courseId: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // 1. Récupérer toutes les sessions de ce mois pour cette formation
    const sessions = await this.sessionRepository.find({
      where: { course: { id: courseId } },
    });

    const sessionIdsThisMonth = sessions
      .filter((s) => {
        const sessionDate = new Date(s.startDate);
        return (
          sessionDate.getMonth() + 1 === month &&
          sessionDate.getFullYear() === year
        );
      })
      .map((s) => s.id);

    if (sessionIdsThisMonth.length === 0) {
      return; // Pas de sessions ce mois-ci
    }

    // 2. Récupérer les présences de cet étudiant pour ce mois
    const attendances = await this.attendanceRepository.find({
      where: {
        studentId,
        sessionId: sessionIdsThisMonth as any,
      },
    });

    // 3. Calculer les statistiques
    const totalSessions = sessionIdsThisMonth.length;
    const presentCount = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT
    ).length;
    const absentCount = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT
    ).length;
    const lateCount = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE
    ).length;
    const excusedCount = attendances.filter(
      (a) => a.status === AttendanceStatus.EXCUSED
    ).length;

    const attendanceRate = totalSessions > 0 
      ? (presentCount / totalSessions) * 100 
      : 0;

    // 4. Vérifier les absences répétées
    const alertCheck = await this.checkRepeatedAbsences(studentId, courseId);

    // 5. Récupérer ou créer le rapport
    let report = await this.reportRepository.findOne({
      where: { studentId, courseId, month, year },
    });

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    if (report) {
      // Mettre à jour le rapport existant
      report.totalSessions = totalSessions;
      report.presentCount = presentCount;
      report.absentCount = absentCount;
      report.lateCount = lateCount;
      report.excusedCount = excusedCount;
      report.attendanceRate = Math.round(attendanceRate * 100) / 100;
      report.hasAlert = alertCheck.hasAlert;
      report.alertMessage = alertCheck.message;
    } else {
      // Créer un nouveau rapport
      report = this.reportRepository.create({
        studentId,
        courseId,
        month,
        year,
        monthLabel,
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        hasAlert: alertCheck.hasAlert,
        alertMessage: alertCheck.message,
      });
    }

    await this.reportRepository.save(report);

    console.log(
      `📊 Rapport mensuel mis à jour: Étudiant ${studentId} - ${monthLabel} (${attendanceRate.toFixed(1)}%)`
    );
  }

  /**
   * Récupère le rapport mensuel d'un étudiant
   * 
   * @param studentId - ID de l'étudiant
   * @param courseId - ID de la formation
   * @param month - Mois (1-12)
   * @param year - Année
   * @returns Rapport mensuel ou null
   */
  async getMonthlyReport(
    studentId: number,
    courseId: number,
    month?: number,
    year?: number
  ): Promise<AttendanceReport | null> {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    return await this.reportRepository.findOne({
      where: { studentId, courseId, month: targetMonth, year: targetYear },
      relations: ['student', 'course'],
    });
  }

  /**
   * Récupère tous les rapports d'un étudiant
   * 
   * @param studentId - ID de l'étudiant
   * @returns Liste des rapports mensuels
   */
  async getStudentReports(studentId: number): Promise<AttendanceReport[]> {
    return await this.reportRepository.find({
      where: { studentId },
      relations: ['course'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }
}
