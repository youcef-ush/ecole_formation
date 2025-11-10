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
      relations: ['student', 'course', 'session', 'session.course', 'payments'],
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
    const { studentId, courseId, sessionId, notes } = req.body;

    if (!courseId) {
      throw new AppError('Le courseId est requis', 400);
    }

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    // Vérifier si l'étudiant est déjà inscrit à cette formation
    const existing = await enrollmentRepo.findOne({
      where: { studentId, courseId },
    });

    if (existing) {
      throw new AppError('Étudiant déjà inscrit à cette formation', 409);
    }

    const enrollment = enrollmentRepo.create({
      studentId,
      courseId,
      notes,
      status: EnrollmentStatus.PENDING,
    });

    await enrollmentRepo.save(enrollment);

    // Retourner l'enrollment avec les relations
    const savedEnrollment = await enrollmentRepo.findOne({
      where: { id: enrollment.id },
      relations: ['student', 'course'],
    });

    res.status(201).json({ success: true, data: savedEnrollment });
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

// GET /api/enrollments/:id/payment-details - Get payment details for receipt
router.get('/:id/payment-details', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    const enrollment = await enrollmentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['student', 'session', 'session.course', 'payments', 'sessionPayments'],
    });

    if (!enrollment) {
      throw new AppError('Inscription non trouvée', 404);
    }

    res.json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/enrollments/:id - Delete an enrollment
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    const enrollment = await enrollmentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['payments', 'session'],
    });

    if (!enrollment) {
      throw new AppError('Inscription non trouvée', 404);
    }

    // Vérifier s'il y a des paiements associés
    if (enrollment.payments && enrollment.payments.length > 0) {
      throw new AppError('Impossible de supprimer une inscription avec des paiements associés', 400);
    }

    // Note: Plus de logique de session car Enrollment n'a plus de sessionId
    // Les sessions sont gérées séparément via Course

    await enrollmentRepo.remove(enrollment);

    res.json({ success: true, message: 'Inscription supprimée avec succès' });
  } catch (error) {
    next(error);
  }
});

export default router;
