import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Payment } from '../entities/Payment.entity';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();
const paymentRepository = AppDataSource.getRepository(Payment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Liste tous les paiements
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des paiements
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const payments = await paymentRepository.find({
      relations: ['enrollment', 'enrollment.student', 'enrollment.session', 'enrollment.session.course'],
      order: { paymentDate: 'DESC' },
    });

    // Restructurer pour inclure le cours directement
    const paymentsWithCourse = payments.map((payment) => ({
      ...payment,
      student: payment.enrollment?.student || null,
      course: payment.enrollment?.session?.course || null,
    }));

    res.json({
      success: true,
      data: paymentsWithCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Récupère un paiement par ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await paymentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['enrollment', 'enrollment.student', 'enrollment.session', 'enrollment.session.course'],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paiement',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/payments/student/{studentId}:
 *   get:
 *     summary: Récupère les paiements d'un étudiant
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/student/:studentId', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const payments = await paymentRepository.find({
      where: { 
        enrollment: { studentId: parseInt(studentId) }
      },
      relations: ['enrollment', 'enrollment.student', 'enrollment.session', 'enrollment.session.course'],
      order: { paymentDate: 'DESC' },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
