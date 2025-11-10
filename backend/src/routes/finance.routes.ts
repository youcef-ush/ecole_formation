import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Registration, RegistrationStatus } from '../entities/Registration.entity';
import { SessionPayment, PaymentType, PaymentMethod } from '../entities/SessionPayment.entity';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';
import { Enrollment } from '../entities/Enrollment.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /api/finance/registration-fees:
 *   get:
 *     summary: Liste des frais d'inscription
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des inscriptions avec statut de paiement
 */
router.get('/registration-fees', async (req: AuthRequest, res: Response, next) => {
  try {
    const registrationRepo = AppDataSource.getRepository(Registration);
    
    const registrations = await registrationRepo.find({
      relations: ['course', 'session'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/finance/registration-fees/{id}/pay:
 *   post:
 *     summary: Enregistrer le paiement des frais d'inscription
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/registration-fees/:id/pay', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, reference, notes } = req.body;

    const registrationRepo = AppDataSource.getRepository(Registration);
    const registration = await registrationRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!registration) {
      throw new AppError('Inscription non trouvée', 404);
    }

    if (registration.registrationFeePaid) {
      throw new AppError('Les frais d\'inscription ont déjà été payés', 400);
    }

    // Marquer comme payé
    registration.registrationFeePaid = true;
    registration.registrationFeePaidAt = new Date();
    registration.status = RegistrationStatus.VALIDATED;

    await registrationRepo.save(registration);

    // Créer l'enregistrement de paiement si un studentId existe
    if (registration.studentId) {
      const paymentRepo = AppDataSource.getRepository(SessionPayment);
      const payment = paymentRepo.create({
        paymentType: PaymentType.REGISTRATION_FEE,
        amount: amount || registration.registrationFee,
        paymentMethod: paymentMethod || PaymentMethod.CASH,
        paymentDate: paymentDate || new Date(),
        reference,
        notes,
        studentId: registration.studentId,
        registrationId: registration.id,
      });
      await paymentRepo.save(payment);
    }

    res.json({
      success: true,
      message: 'Frais d\'inscription payés avec succès',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/finance/session-payments:
 *   get:
 *     summary: Liste des paiements de sessions
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/session-payments', async (req: AuthRequest, res: Response, next) => {
  try {
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const paymentRepo = AppDataSource.getRepository(SessionPayment);
    const sessionRepo = AppDataSource.getRepository(Session);

    // Récupérer toutes les affectations avec leurs infos (Enrollment → Course maintenant)
    const enrollments = await enrollmentRepo.find({
      relations: ['student', 'student.user', 'course'],
      order: { enrolledAt: 'DESC' },
    });

    // Pour chaque affectation, récupérer les sessions du cours et les paiements
    const enrichedData = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Récupérer toutes les sessions du cours de cet enrollment
        const sessions = await sessionRepo.find({
          where: { courseId: enrollment.courseId },
          order: { startDate: 'ASC' },
        });

        // Récupérer tous les paiements de l'étudiant pour les sessions de ce cours
        const sessionIds = sessions.map(s => s.id);
        const sessionPayments = sessionIds.length > 0 
          ? await paymentRepo
              .createQueryBuilder('payment')
              .where('payment.studentId = :studentId', { studentId: enrollment.studentId })
              .andWhere('payment.sessionId IN (:...sessionIds)', { sessionIds })
              .andWhere('payment.paymentType = :type', { type: PaymentType.SESSION_FEE })
              .orderBy('payment.paymentDate', 'DESC')
              .getMany()
          : [];

        const totalPaid = sessionPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );

        const coursePrice = enrollment.course?.price || 0;

        return {
          enrollmentId: enrollment.id,
          studentId: enrollment.studentId,
          studentName: `${enrollment.student?.firstName} ${enrollment.student?.lastName}`,
          studentEmail: enrollment.student?.user?.email,
          courseTitle: enrollment.course?.title,
          courseId: enrollment.courseId,
          sessionsCount: sessions.length,
          coursePrice: coursePrice,
          totalPaid: totalPaid,
          isPaid: totalPaid >= coursePrice,
          paymentStatus: totalPaid >= coursePrice ? 'Payé' : 'Impayé',
          payments: sessionPayments,
          enrolledAt: enrollment.enrolledAt,
        };
      })
    );

    res.json({
      success: true,
      data: enrichedData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/finance/session-payments/pay:
 *   post:
 *     summary: Enregistrer un paiement de session
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 */
router.post('/session-payments/pay', async (req: AuthRequest, res: Response, next) => {
  try {
    const { studentId, sessionId, amount, paymentMethod, paymentDate, reference, notes } = req.body;

    if (!studentId || !sessionId || !amount) {
      throw new AppError('studentId, sessionId et amount sont requis', 400);
    }

    const paymentRepo = AppDataSource.getRepository(SessionPayment);
    const payment = paymentRepo.create({
      paymentType: PaymentType.SESSION_FEE,
      amount,
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      paymentDate: paymentDate || new Date(),
      reference,
      notes,
      studentId,
      sessionId,
    });

    await paymentRepo.save(payment);

    // Mettre à jour le statut de l'enrollment si nécessaire
    // Note: Enrollment est lié au Course, pas à la Session
    // On ne peut pas facilement trouver l'enrollment via sessionId
    // Il faudrait d'abord récupérer la session, puis trouver l'enrollment par courseId
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (session) {
      const enrollmentRepo = AppDataSource.getRepository(Enrollment);
      const enrollment = await enrollmentRepo.findOne({
        where: { studentId, courseId: session.courseId },
      });

      if (enrollment && enrollment.status !== 'Payé') {
        enrollment.status = 'Payé' as any;
        await enrollmentRepo.save(enrollment);
      }
    }

    res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/finance/monthly-tracking:
 *   get:
 *     summary: Suivi mensuel des paiements (pour soutien scolaire)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/monthly-tracking', async (req: AuthRequest, res: Response, next) => {
  try {
    const { year, courseId } = req.query;
    
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const paymentRepo = AppDataSource.getRepository(SessionPayment);
    const sessionRepo = AppDataSource.getRepository(Session);

    // Construire la requête - Enrollment → Course maintenant
    let enrollmentQuery = enrollmentRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('enrollment.course', 'course')
      .orderBy('student.lastName', 'ASC');

    if (courseId) {
      enrollmentQuery = enrollmentQuery.andWhere('course.id = :courseId', { courseId: parseInt(courseId as string) });
    }

    const enrollments = await enrollmentQuery.getMany();

    // Pour chaque enrollment, récupérer les sessions du cours
    const studentsMap = new Map();

    for (const enrollment of enrollments) {
      const studentId = enrollment.studentId;
      
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          studentId: studentId,
          studentName: `${enrollment.student?.firstName} ${enrollment.student?.lastName}`,
          studentEmail: enrollment.student?.user?.email,
          courseTitle: enrollment.course?.title,
          courseId: enrollment.courseId,
          months: [],
        });
      }

      // Récupérer toutes les sessions de ce cours
      let sessionQuery = sessionRepo
        .createQueryBuilder('session')
        .where('session.courseId = :courseId', { courseId: enrollment.courseId })
        .orderBy('session.year', 'ASC')
        .addOrderBy('session.month', 'ASC');

      if (year) {
        sessionQuery = sessionQuery.andWhere('session.year = :year', { year: parseInt(year as string) });
      }

      const sessions = await sessionQuery.getMany();

      // Pour chaque session, vérifier le paiement
      for (const session of sessions) {
        const payments = await paymentRepo.find({
          where: {
            studentId: studentId,
            sessionId: session.id,
            paymentType: PaymentType.SESSION_FEE,
          },
        });

        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const sessionPrice = session.price || enrollment.course?.price || 0;

        studentsMap.get(studentId).months.push({
          sessionId: session.id,
          courseId: enrollment.courseId,
          month: session.month,
          year: session.year,
          monthLabel: session.monthLabel,
          startDate: session.startDate,
          endDate: session.endDate,
          price: sessionPrice,
          totalPaid: totalPaid,
          isPaid: totalPaid >= sessionPrice,
          paymentStatus: totalPaid >= sessionPrice ? 'Payé' : 'Impayé',
          remainingAmount: Math.max(0, sessionPrice - totalPaid),
          payments: payments,
        });
      }
    }

    const result = Array.from(studentsMap.values());

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/finance/stats:
 *   get:
 *     summary: Statistiques financières
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const paymentRepo = AppDataSource.getRepository(SessionPayment);
    const registrationRepo = AppDataSource.getRepository(Registration);

    // Total des frais d'inscription payés
    const paidRegistrations = await registrationRepo.count({
      where: { registrationFeePaid: true },
    });

    // Total des revenus de sessions
    const sessionPayments = await paymentRepo
      .createQueryBuilder('payment')
      .where('payment.paymentType = :type', { type: PaymentType.SESSION_FEE })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    // Total des frais d'inscription
    const registrationPayments = await paymentRepo
      .createQueryBuilder('payment')
      .where('payment.paymentType = :type', { type: PaymentType.REGISTRATION_FEE })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    res.json({
      success: true,
      data: {
        totalRegistrationsPaid: paidRegistrations,
        totalRegistrationRevenue: Number(registrationPayments?.total || 0),
        totalSessionRevenue: Number(sessionPayments?.total || 0),
        totalRevenue:
          Number(registrationPayments?.total || 0) + Number(sessionPayments?.total || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
