import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Trainer } from '../entities/Trainer.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /api/trainers:
 *   get:
 *     summary: Liste tous les formateurs
 *     description: Retourne tous les formateurs avec leurs informations utilisateur
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des formateurs
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainers = await trainerRepo.find();

    res.json({ success: true, data: trainers });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/trainers/{id}:
 *   get:
 *     summary: Récupère un formateur par ID
 *     description: Retourne les détails d'un formateur avec ses sessions et formations
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du formateur
 *     responses:
 *       200:
 *         description: Détails du formateur
 *       404:
 *         description: Formateur non trouvé
 */
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['courses'],
    });

    res.json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/trainers:
 *   post:
 *     summary: Créer un nouveau formateur
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - specialty
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Prénom du formateur
 *               lastName:
 *                 type: string
 *                 description: Nom du formateur
 *               specialty:
 *                 type: string
 *                 description: Spécialité du formateur
 *               phone:
 *                 type: string
 *                 description: Téléphone du formateur
 *               email:
 *                 type: string
 *                 description: Email du formateur (optionnel)
 *     responses:
 *       201:
 *         description: Formateur créé avec succès
 */
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = trainerRepo.create(req.body);
    await trainerRepo.save(trainer);

    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
});

// PUT /api/trainers/:id
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!trainer) {
      throw new AppError('Formateur non trouvé', 404);
    }

    trainerRepo.merge(trainer, req.body);
    await trainerRepo.save(trainer);

    res.json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
});

export default router;
