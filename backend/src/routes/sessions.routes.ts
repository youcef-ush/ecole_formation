import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Session, SessionStatus } from '../entities/Session.entity';
import { SessionPayment, PaymentType, PaymentMethod } from '../entities/SessionPayment.entity';
import { Enrollment } from '../entities/Enrollment.entity';
import { Course } from '../entities/Course.entity';
import { Room } from '../entities/Room.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';
import { In } from 'typeorm';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/sessions
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);
    const sessionPaymentRepo = AppDataSource.getRepository(SessionPayment);

    // Récupérer le mois et l'année depuis les paramètres de requête
    const { month, year } = req.query;

    // Si aucun filtre n'est fourni, utiliser le mois courant
    const currentDate = new Date();
    const filterMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1; // JS months are 0-indexed
    const filterYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const sessions = await sessionRepo.find({
      where: {
        month: filterMonth,
        year: filterYear,
      },
      relations: [
        'course',
        'trainer',
        'room',
        'timeSlot',
      ],
      order: { startDate: 'ASC' },
    });

    // Charger les enrollments et sessionPayments pour chaque session
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    for (const session of sessions) {
      if (session.course) {
        // Récupérer les enrollments pour cette formation
        const enrollments = await enrollmentRepo.find({
          where: { courseId: session.course.id },
          relations: ['student'],
        });

        if (enrollments.length > 0) {
          const studentIds = enrollments.map(e => e.studentId);
          const payments = await sessionPaymentRepo.find({
            where: {
              sessionId: session.id,
              studentId: In(studentIds),
            },
          });

          // Ajouter les payments aux enrollments correspondants
          for (const enrollment of enrollments) {
            (enrollment as any).sessionPayments = payments.filter(
              p => p.studentId === enrollment.studentId
            );
          }

          // Ajouter les enrollments à la session pour le retour
          (session as any).enrollments = enrollments;
        }
      }
    }

    res.json({
      success: true,
      data: sessions,
      filter: {
        month: filterMonth,
        year: filterYear,
        monthLabel: getMonthLabel(filterMonth, filterYear)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Fonction helper pour obtenir le label du mois
function getMonthLabel(month: number, year: number): string {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${monthNames[month - 1]} ${year}`;
}

// POST /api/sessions
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = sessionRepo.create(req.body);
    await sessionRepo.save(session);

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sessions/generate-monthly:
 *   post:
 *     summary: Générer automatiquement les sessions mensuelles pour une année scolaire
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - trainerId
 *               - schoolYear
 *               - monthlyPrice
 *               - startTime
 *               - endTime
 *               - capacity
 *               - location
 *             properties:
 *               courseId:
 *                 type: integer
 *               trainerId:
 *                 type: integer
 *               roomId:
 *                 type: integer
 *               timeSlotId:
 *                 type: integer
 *               schoolYear:
 *                 type: string
 *                 example: "2025-2026"
 *               monthlyPrice:
 *                 type: number
 *                 example: 5000
 *               startTime:
 *                 type: string
 *                 example: "14:00"
 *               endTime:
 *                 type: string
 *                 example: "16:00"
 *               capacity:
 *                 type: integer
 *                 example: 15
 *               location:
 *                 type: string
 *                 example: "Salle A101"
 *     responses:
 *       201:
 *         description: Sessions créées avec succès
 */
router.post('/generate-monthly', async (req: AuthRequest, res: Response, next) => {
  try {
    const {
      courseId,
      trainerId,
      roomId,
      timeSlotId,
      schoolYear, // ex: "2025-2026"
      monthlyPrice,
      startTime,
      endTime,
      capacity,
      location,
      daysOfWeek, // ex: "Lundi,Mercredi,Vendredi"
    } = req.body;

    if (!courseId || !schoolYear || !monthlyPrice || !capacity) {
      throw new AppError('Champs requis manquants (courseId, schoolYear, monthlyPrice, capacity)', 400);
    }

    // Vérifier que la formation existe
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({
      where: { id: courseId },
      relations: ['trainer'] // Récupérer le formateur de la formation
    });

    if (!course) {
      throw new AppError('Formation non trouvée', 404);
    }

    // Utiliser le formateur de la formation si non spécifié
    const finalTrainerId = trainerId || course.trainer?.id;

    if (!finalTrainerId) {
      throw new AppError('Aucun formateur trouvé pour cette formation', 400);
    }

    // Récupérer une salle disponible si roomId n'est pas fourni
    const roomRepo = AppDataSource.getRepository(Room);
    let finalRoomId = roomId;

    if (!finalRoomId) {
      const availableRoom = await roomRepo.findOne({
        where: { isActive: true },
        order: { capacity: 'DESC' }
      });

      if (availableRoom) {
        finalRoomId = availableRoom.id;
      }
    }

    const sessionRepo = AppDataSource.getRepository(Session);

    // Définir les mois de l'année scolaire (Septembre à Juin)
    const schoolMonths = [
      { month: 9, name: 'Septembre', year: parseInt(schoolYear.split('-')[0]) },
      { month: 10, name: 'Octobre', year: parseInt(schoolYear.split('-')[0]) },
      { month: 11, name: 'Novembre', year: parseInt(schoolYear.split('-')[0]) },
      { month: 12, name: 'Décembre', year: parseInt(schoolYear.split('-')[0]) },
      { month: 1, name: 'Janvier', year: parseInt(schoolYear.split('-')[1]) },
      { month: 2, name: 'Février', year: parseInt(schoolYear.split('-')[1]) },
      { month: 3, name: 'Mars', year: parseInt(schoolYear.split('-')[1]) },
      { month: 4, name: 'Avril', year: parseInt(schoolYear.split('-')[1]) },
      { month: 5, name: 'Mai', year: parseInt(schoolYear.split('-')[1]) },
      { month: 6, name: 'Juin', year: parseInt(schoolYear.split('-')[1]) },
    ];

    const createdSessions = [];

    for (const monthData of schoolMonths) {
      // Calculer le premier et dernier jour du mois
      const startDate = new Date(monthData.year, monthData.month - 1, 1);
      const endDate = new Date(monthData.year, monthData.month, 0); // Dernier jour du mois

      const session = sessionRepo.create({
        courseId,
        trainerId: finalTrainerId,
        roomId: finalRoomId || null,
        timeSlotId: timeSlotId || null,
        startDate,
        endDate,
        startTime: startTime || null,
        endTime: endTime || null,
        daysOfWeek: daysOfWeek || null, // Jours de la semaine
        capacity,
        location: location || course.title, // Utiliser le nom de la formation si pas de location
        price: monthlyPrice,
        status: SessionStatus.UPCOMING,
        monthLabel: `${monthData.name} ${monthData.year}`,
        month: monthData.month,
        year: monthData.year,
        notes: `Session mensuelle générée automatiquement pour l'année scolaire ${schoolYear}${daysOfWeek ? ` - Jours: ${daysOfWeek}` : ''}`,
      });

      const savedSession = await sessionRepo.save(session);
      createdSessions.push(savedSession);
    }

    res.status(201).json({
      success: true,
      message: `${createdSessions.length} sessions créées avec succès pour l'année scolaire ${schoolYear}`,
      data: createdSessions,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sessions/:id
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({ where: { id: parseInt(req.params.id) } });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    sessionRepo.merge(session, req.body);
    await sessionRepo.save(session);

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/payments - Valider un paiement de session
router.post('/:id/payments', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { enrollmentId, amount, paymentMethod, paymentDate, paymentType } = req.body;

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const sessionPaymentRepo = AppDataSource.getRepository(SessionPayment);

    // Récupérer l'enrollment pour obtenir le studentId
    const enrollment = await enrollmentRepo.findOne({
      where: { id: parseInt(enrollmentId) },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new AppError('Inscription non trouvée', 404);
    }

    // Vérifier si un paiement existe déjà pour cet étudiant et cette session
    const existingPayment = await sessionPaymentRepo.findOne({
      where: {
        studentId: enrollment.studentId,
        sessionId: parseInt(id),
        paymentType: paymentType || PaymentType.SESSION_FEE,
      },
    });

    if (existingPayment) {
      throw new AppError('Un paiement existe déjà pour cet étudiant et cette session', 400);
    }

    // Créer le paiement de session
    const sessionPayment = sessionPaymentRepo.create({
      studentId: enrollment.studentId,
      sessionId: parseInt(id),
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      paymentDate: new Date(paymentDate),
      paymentType: paymentType || PaymentType.SESSION_FEE,
    });

    await sessionPaymentRepo.save(sessionPayment);

    res.status(201).json({
      success: true,
      message: 'Paiement validé avec succès',
      data: sessionPayment,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
