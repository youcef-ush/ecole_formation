import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { Payment } from '../entities/Payment.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/enrollments
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const enrollments = await enrollmentRepo.find({
      relations: ['student', 'session', 'session.course', 'payments'],
      order: { enrolledAt: 'DESC' },
    });

    res.json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
});

// POST /api/enrollments
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { studentId, sessionId, notes } = req.body;

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    // Vérifier si l'étudiant est déjà inscrit
    const existing = await enrollmentRepo.findOne({
      where: { studentId, sessionId },
    });

    if (existing) {
      throw new AppError('Étudiant déjà inscrit à cette session', 409);
    }

    const enrollment = enrollmentRepo.create({
      studentId,
      sessionId,
      notes,
      status: EnrollmentStatus.PENDING,
    });

    await enrollmentRepo.save(enrollment);

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
});

// POST /api/enrollments/:id/pay - Valider un paiement
router.post('/:id/pay', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, reference, notes } = req.body;

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const enrollment = await enrollmentRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!enrollment) {
      throw new AppError('Inscription non trouvée', 404);
    }

    // Créer le paiement
    const payment = paymentRepo.create({
      enrollmentId: enrollment.id,
      amount,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      reference,
      notes,
    });

    await paymentRepo.save(payment);

    // Mettre à jour le statut de l'inscription
    enrollment.status = EnrollmentStatus.PAID;
    await enrollmentRepo.save(enrollment);

    res.json({
      success: true,
      message: 'Paiement validé avec succès',
      data: { enrollment, payment },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
