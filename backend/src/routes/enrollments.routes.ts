import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Enrollment } from '../entities/Enrollment.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { EnrollmentService } from '../services/enrollment.service';
import { UserRole } from '../entities/User.entity';

const router = Router();
const enrollmentService = new EnrollmentService();

// Protect all routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.RECEPTION));

// GET /api/enrollments - Liste de toutes les inscriptions
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/enrollments/:id - Détails d'une inscription
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const enrollment = await enrollmentService.getEnrollmentById(parseInt(id));

    if (!enrollment) {
      throw new AppError('Inscription non trouvée', 404);
    }

    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/enrollments - Créer une nouvelle inscription
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const enrollmentData = req.body;

    const enrollment = await enrollmentService.createEnrollment(enrollmentData);

    res.status(201).json({
      success: true,
      message: 'Inscription créée avec succès',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/enrollments/:id/mark-paid - Marquer comme payé (crée Student avec QR)
router.post('/:id/mark-paid', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    
    const result = await enrollmentService.markEnrollmentPaid(parseInt(id));

    res.json({
      success: true,
      message: 'Paiement validé et étudiant créé avec succès',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/enrollments/:id - Modifier une inscription
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const enrollment = await enrollmentService.updateEnrollment(parseInt(id), updateData);

    res.json({
      success: true,
      message: 'Inscription modifiée avec succès',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/enrollments/:id - Supprimer une inscription
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    await enrollmentService.deleteEnrollment(parseInt(id));

    res.json({
      success: true,
      message: 'Inscription supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
