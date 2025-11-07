import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Course } from '../entities/Course.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

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
 *     responses:
 *       201:
 *         description: Formation créée avec succès
 */
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = courseRepo.create(req.body);
    await courseRepo.save(course);

    res.status(201).json({ success: true, data: course });
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
