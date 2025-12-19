import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Trainer } from '../entities/Trainer.entity';
import { Course } from '../entities/Course.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';
import { uploadCV } from '../config/upload.config';
import path from 'path';
import fs from 'fs';

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

// GET /api/trainers/:id/courses - Récupérer les formations d'un formateur
router.get('/:id/courses', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const courses = await courseRepo.find({
      where: { trainerId: parseInt(req.params.id) },
    });

    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

// POST /api/trainers/:id/upload-cv - Upload CV PDF
router.post('/:id/upload-cv', uploadCV.single('cv'), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.file) {
      throw new AppError('Aucun fichier fourni', 400);
    }

    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!trainer) {
      // Supprimer le fichier uploadé si le formateur n'existe pas
      fs.unlinkSync(req.file.path);
      throw new AppError('Formateur non trouvé', 404);
    }

    // Supprimer l'ancien CV si existe
    if (trainer.cv) {
      const oldCvPath = path.join(__dirname, '../../uploads/cvs', trainer.cv);
      if (fs.existsSync(oldCvPath)) {
        fs.unlinkSync(oldCvPath);
      }
    }

    // Sauvegarder le nom du fichier dans la base de données
    trainer.cv = req.file.filename;
    await trainerRepo.save(trainer);

    res.json({ 
      success: true, 
      message: 'CV uploadé avec succès',
      data: { 
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// GET /api/trainers/:id/cv - Télécharger le CV
router.get('/:id/cv', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!trainer) {
      throw new AppError('Formateur non trouvé', 404);
    }

    if (!trainer.cv) {
      throw new AppError('Aucun CV disponible pour ce formateur', 404);
    }

    const cvPath = path.join(__dirname, '../../uploads/cvs', trainer.cv);
    
    if (!fs.existsSync(cvPath)) {
      throw new AppError('Fichier CV introuvable', 404);
    }

    res.download(cvPath);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trainers/:id/cv - Supprimer le CV
router.delete('/:id/cv', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!trainer) {
      throw new AppError('Formateur non trouvé', 404);
    }

    if (trainer.cv) {
      const cvPath = path.join(__dirname, '../../uploads/cvs', trainer.cv);
      if (fs.existsSync(cvPath)) {
        fs.unlinkSync(cvPath);
      }
      trainer.cv = null;
      await trainerRepo.save(trainer);
    }

    res.json({ success: true, message: 'CV supprimé avec succès' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trainers/:id - Supprimer un formateur
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!trainer) {
      throw new AppError('Formateur non trouvé', 404);
    }

    // Supprimer le CV s'il existe
    if (trainer.cv) {
      const cvPath = path.join(__dirname, '../../uploads/cvs', trainer.cv);
      if (fs.existsSync(cvPath)) {
        fs.unlinkSync(cvPath);
      }
    }

    await trainerRepo.remove(trainer);

    res.json({ 
      success: true, 
      message: 'Formateur supprimé avec succès' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;
