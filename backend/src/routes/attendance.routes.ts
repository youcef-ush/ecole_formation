import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Session } from '../entities/Session.entity';
import { AttendanceService } from '../services/attendance.service';
import { QrCodeService } from '../services/qrcode.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();
const attendanceService = new AttendanceService();
const qrCodeService = new QrCodeService();

// Tous les endpoints nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * /api/attendance/validate-scan:
 *   post:
 *     summary: Valider la présence par scan QR (session + étudiant)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionQrCode
 *               - studentQrCode
 *             properties:
 *               sessionQrCode:
 *                 type: string
 *                 description: QR code de la session (format SESSION-{id}-{date}-{timestamp})
 *               studentQrCode:
 *                 type: string
 *                 description: QR code du badge étudiant (format STUDENT-{id}-{timestamp})
 *     responses:
 *       200:
 *         description: Présence enregistrée avec succès
 *       400:
 *         description: QR code invalide ou expiré
 *       403:
 *         description: Accès refusé (paiements en retard)
 *       404:
 *         description: Session ou étudiant non trouvé
 */
router.post('/validate-scan', async (req: AuthRequest, res: Response, next) => {
  try {
    const { sessionQrCode, studentQrCode } = req.body;

    if (!sessionQrCode || !studentQrCode) {
      throw new AppError('Les QR codes de session et étudiant sont requis', 400);
    }

    // Enregistrer la présence via le service (gère toute la logique)
    const result = await attendanceService.recordAttendance(sessionQrCode, studentQrCode);

    res.json({
      success: true,
      message: 'Présence enregistrée avec succès',
      data: {
        attendance: result.attendance,
        accessStatus: result.accessStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/attendance/manual:
 *   post:
 *     summary: Enregistrer une présence manuellement (admin)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - studentId
 *               - status
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 description: ID de la session
 *               studentId:
 *                 type: integer
 *                 description: ID de l'étudiant
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *                 description: Statut de présence
 *               note:
 *                 type: string
 *                 description: Note ou commentaire (optionnel)
 *     responses:
 *       200:
 *         description: Présence enregistrée manuellement
 *       400:
 *         description: Paramètres invalides
 *       403:
 *         description: Non autorisé (réservé aux admins)
 *       404:
 *         description: Session ou étudiant non trouvé
 */
router.post('/manual', authorize(UserRole.ADMIN), async (req: AuthRequest, res: Response, next) => {
  try {
    const { sessionId, studentId, status, note } = req.body;

    if (!sessionId || !studentId || !status) {
      throw new AppError('sessionId, studentId et status sont requis', 400);
    }

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Le statut doit être l'un des suivants: ${validStatuses.join(', ')}`, 400);
    }

    // Enregistrer la présence manuelle
    const attendance = await attendanceService.recordManualAttendance(
      parseInt(sessionId),
      parseInt(studentId),
      status,
      note,
      req.user!.id // ID de l'admin qui enregistre
    );

    // Vérifier les absences répétées
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: parseInt(sessionId) },
      relations: ['course'],
    });

    let absenceAlert = null;
    if (status === 'absent' && session) {
      absenceAlert = await attendanceService.checkRepeatedAbsences(
        parseInt(studentId),
        session.courseId
      );
    }

    res.json({
      success: true,
      message: 'Présence enregistrée manuellement',
      data: {
        attendance,
        absenceAlert,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/attendance/sessions/{id}/attendance:
 *   get:
 *     summary: Obtenir le rapport de présence d'une session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date du rapport (YYYY-MM-DD, optionnel, par défaut aujourd'hui)
 *     responses:
 *       200:
 *         description: Rapport de présence de la session
 *       404:
 *         description: Session non trouvée
 */
router.get('/sessions/:id/attendance', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const sessionId = parseInt(id);
    
    // Vérifier que la session existe
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // Date par défaut : aujourd'hui
    const reportDate = date ? new Date(date as string) : new Date();

    // Générer le rapport quotidien
    const report = await attendanceService.generateDailyReport(sessionId, reportDate);

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          courseId: session.courseId,
          courseTitle: session.course?.title,
          startDate: session.startDate,
          endDate: session.endDate,
          month: session.month,
          year: session.year,
          monthLabel: session.monthLabel,
        },
        date: reportDate,
        statistics: {
          totalExpected: report.totalExpected,
          present: report.present,
          absent: report.absent,
          late: report.late,
          excused: report.excused,
          attendanceRate: report.attendanceRate,
        },
        attendances: report.attendances,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/attendance/sessions/{id}/generate-qr:
 *   post:
 *     summary: Générer un QR code pour une session (admin)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               validityHours:
 *                 type: integer
 *                 description: Durée de validité en heures (défaut 24h)
 *                 default: 24
 *     responses:
 *       200:
 *         description: QR code généré avec succès
 *       403:
 *         description: Non autorisé (réservé aux admins)
 *       404:
 *         description: Session non trouvée
 */
router.post('/sessions/:id/generate-qr', authorize(UserRole.ADMIN), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { validityHours = 24 } = req.body;

    const sessionId = parseInt(id);

    // Vérifier que la session existe
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    // Générer le QR code de la session
    const qrCodeDataUrl = await qrCodeService.generateSessionQr(sessionId, validityHours);

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validityHours);

    // Mettre à jour la session avec le nouveau QR code
    session.sessionQrCode = qrCodeDataUrl;
    session.qrExpiresAt = expiresAt;
    await sessionRepo.save(session);

    res.json({
      success: true,
      message: 'QR code généré avec succès',
      data: {
        sessionId: session.id,
        courseTitle: session.course?.title,
        qrCodeDataUrl,
        qrExpiresAt: expiresAt,
        validityHours,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
