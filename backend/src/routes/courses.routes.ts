import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Course } from '../entities/Course.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';
import { SessionGeneratorService } from '../services/session-generator.service';
import { PaymentScheduleService } from '../services/payment-schedule.service';
import { Enrollment } from '../entities/Enrollment.entity';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Liste toutes les formations actives
 *     description: Retourne toutes les formations avec leurs relations (formateur, salle, créneau)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des formations
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const courses = await courseRepo.find({ where: { isActive: true } });

    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Récupère une formation par ID
 *     description: Retourne les détails d'une formation avec ses sessions
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la formation
 *     responses:
 *       200:
 *         description: Détails de la formation
 *       404:
 *         description: Formation non trouvée
 */
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['sessions'],
    });

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Créer une nouvelle formation
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - category
 *               - duration
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre de la formation
 *               description:
 *                 type: string
 *                 description: Description de la formation
 *               type:
 *                 type: string
 *                 enum: [Formation, Soutien]
 *                 description: Type de formation
 *               category:
 *                 type: string
 *                 enum: [Informatique, Langues, Gestion, Autres]
 *                 description: Catégorie de la formation
 *               duration:
 *                 type: integer
 *                 description: Durée en heures
 *               price:
 *                 type: number
 *                 description: Prix de la formation
 *               certificate:
 *                 type: string
 *                 enum: [Diplôme, Attestation, Certificat, Aucun]
 *                 description: Type de certificat délivré
 *               trainerId:
 *                 type: integer
 *                 description: ID du formateur
 *               roomId:
 *                 type: integer
 *                 description: ID de la salle
 *               timeSlotId:
 *                 type: integer
 *                 description: ID du créneau horaire
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Date de début de la formation (requis pour auto-génération)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Date de fin de la formation (optionnel pour TUTORING)
 *               autoGenerateSessions:
 *                 type: boolean
 *                 description: Générer automatiquement les sessions (défaut true)
 *               autoGeneratePayments:
 *                 type: boolean
 *                 description: Générer automatiquement les échéanciers pour les enrollments existants (défaut true)
 *     responses:
 *       201:
 *         description: Formation créée avec succès
 */
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    
    // Assurer que les champs requis ont des valeurs par défaut
    const courseData = {
      ...req.body,
      durationHours: req.body.durationHours || 0,
      price: req.body.price || 0,
    };
    
    const newCourse = courseRepo.create(courseData);
    const savedCourse = await courseRepo.save(newCourse);
    
    // Normaliser en objet unique si c'est un tableau
    const course = Array.isArray(savedCourse) ? savedCourse[0] : savedCourse;

    // 🔥 AUTO-GÉNÉRATION DES SESSIONS (Task 10.4)
    const autoGenerateSessions = req.body.autoGenerateSessions !== false; // Par défaut true
    let generatedSessions: any[] = [];
    
    if (autoGenerateSessions && course.startDate) {
      try {
        const sessionGenerator = new SessionGeneratorService();
        generatedSessions = await sessionGenerator.generateSessionsForCourse(
          course.id,
          new Date(course.startDate),
          course.endDate ? new Date(course.endDate) : undefined
        );
        console.log(`✅ ${generatedSessions.length} sessions générées pour la formation "${course.title}"`);
      } catch (sessionError) {
        // Log l'erreur mais ne bloque pas la création de la formation
        console.error('❌ Erreur génération sessions:', sessionError);
      }
    }

    // 🔥 AUTO-GÉNÉRATION DES ÉCHÉANCIERS POUR LES ENROLLMENTS EXISTANTS (Task 10.4)
    const autoGeneratePayments = req.body.autoGeneratePayments !== false; // Par défaut true
    let generatedSchedulesCount = 0;
    
    if (autoGeneratePayments && course.startDate) {
      try {
        const paymentScheduleService = new PaymentScheduleService();
        
        // Récupérer tous les enrollments liés à cette formation
        const enrollments = await enrollmentRepo.find({
          where: { courseId: course.id },
        });

        // Générer l'échéancier pour chaque enrollment
        for (const enrollment of enrollments) {
          const hasSchedules = await paymentScheduleService.hasPaymentSchedules(enrollment.id);
          
          if (!hasSchedules) {
            await paymentScheduleService.generatePaymentSchedule(
              enrollment.id,
              course.id,
              new Date(course.startDate),
              course.endDate ? new Date(course.endDate) : undefined
            );
            generatedSchedulesCount++;
          }
        }
        
        if (generatedSchedulesCount > 0) {
          console.log(`✅ Échéanciers générés pour ${generatedSchedulesCount} enrollment(s)`);
        }
      } catch (paymentError) {
        // Log l'erreur mais ne bloque pas la création de la formation
        console.error('❌ Erreur génération échéanciers:', paymentError);
      }
    }

    res.status(201).json({ 
      success: true, 
      data: course,
      generated: {
        sessions: generatedSessions.length,
        paymentSchedules: generatedSchedulesCount,
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/courses/:id
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!course) {
      throw new AppError('Formation non trouvée', 404);
    }

    courseRepo.merge(course, req.body);
    await courseRepo.save(course);

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

export default router;
