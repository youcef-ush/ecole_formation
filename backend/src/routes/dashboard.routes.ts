import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Course } from '../entities/Course.entity';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { Payment } from '../entities/Payment.entity';
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

export default router;
