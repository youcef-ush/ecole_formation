import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Course } from '../entities/Course.entity';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { Payment } from '../entities/Payment.entity';
import { Attendance, AttendanceStatus } from '../entities/Attendance.entity';
import { Session } from '../entities/Session.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtenir les statistiques du tableau de bord
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin uniquement)
 */
// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const studentRepo = AppDataSource.getRepository(Student);
    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Nombre total d'étudiants
    const totalStudents = await studentRepo.count();

    // Nombre de formations actives
    const activeCourses = await courseRepo.count({ where: { isActive: true } });

    // Nombre d'inscriptions en cours (Payé ou En attente)
    const activeEnrollments = await enrollmentRepo.count({
      where: [
        { status: EnrollmentStatus.PAID },
        { status: EnrollmentStatus.PENDING },
      ],
    });

    // Revenus totaux (somme des paiements)
    const paymentsResult = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const totalRevenue = parseFloat(paymentsResult?.total || '0');

    // Inscriptions en attente
    const pendingEnrollments = await enrollmentRepo.count({
      where: { status: EnrollmentStatus.PENDING },
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeCourses,
        activeEnrollments,
        totalRevenue,
        pendingEnrollments,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dashboard/attendance-stats:
 *   get:
 *     summary: Obtenir les statistiques de présences (Tâches 28-29)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques de présences récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSessions:
 *                       type: number
 *                     totalAttendances:
 *                       type: number
 *                     attendanceRate:
 *                       type: number
 *                     absentStudents:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin uniquement)
 */
// GET /api/dashboard/attendance-stats (Tâche 30)
router.get('/attendance-stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);
    const attendanceRepo = AppDataSource.getRepository(Attendance);

    // Nombre total de sessions passées (startDate <= aujourd'hui)
    const totalSessions = await sessionRepo
      .createQueryBuilder('session')
      .where('session.startDate <= :today', { today: new Date() })
      .getCount();

    // Nombre total de présences enregistrées (status = 'present')
    const totalAttendances = await attendanceRepo.count({
      where: { status: AttendanceStatus.PRESENT },
    });

    // Taux de présence global
    const attendanceRate = totalSessions > 0 
      ? (totalAttendances / totalSessions) * 100 
      : 0;

    // Top 5 étudiants avec absences répétées (3+ absences)
    const absentStudentsRaw = await attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoin('attendance.student', 'student')
      .select('student.id', 'studentId')
      .addSelect("CONCAT(student.firstName, ' ', student.lastName)", 'studentName')
      .addSelect('COUNT(*)', 'absenceCount')
      .addSelect('MAX(attendance.checkInTime)', 'lastAbsenceDate')
      .where('attendance.status = :status', { status: AttendanceStatus.ABSENT })
      .groupBy('student.id, student.firstName, student.lastName')
      .having('COUNT(*) >= 3')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany();

    // Calculer les absences consécutives pour chaque étudiant
    const absentStudents = await Promise.all(
      absentStudentsRaw.map(async (student) => {
        // Récupérer les 10 dernières présences de l'étudiant
        const recentAttendances = await attendanceRepo.find({
          where: { student: { id: student.studentId } },
          order: { scanTime: 'DESC' },
          take: 10,
        });

        // Compter les absences consécutives
        let consecutiveAbsences = 0;
        for (const att of recentAttendances) {
          if (att.status === AttendanceStatus.ABSENT) {
            consecutiveAbsences++;
          } else {
            break;
          }
        }

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          absenceCount: parseInt(student.absenceCount),
          consecutiveAbsences,
          lastAbsenceDate: student.lastAbsenceDate,
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalSessions,
        totalAttendances,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        absentStudents,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
