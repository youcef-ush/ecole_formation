import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { Enrollment } from "../entities/Enrollment.entity";
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { QrCodeService } from '../services/qrcode.service';

const router = Router();
const qrCodeService = new QrCodeService();

// Protect all routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/students - Liste de tous les étudiants
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const studentRepo = AppDataSource.getRepository(Student);
    const students = await studentRepo.find({
      relations: ['enrollment', 'course', 'paymentPlan'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id - Détails d'un étudiant
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const studentRepo = AppDataSource.getRepository(Student);

    const student = await studentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['enrollment', 'course', 'paymentPlan', 'paymentPlan.installments', 'payments', 'accessLogs'],
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/students - Créer un étudiant (Note: normalement via markEnrollmentPaid)
// Cette route est pour des cas exceptionnels
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { enrollmentId, courseId } = req.body;

    if (!enrollmentId || !courseId) {
      throw new AppError('enrollmentId et courseId sont obligatoires', 400);
    }

    const studentRepo = AppDataSource.getRepository(Student);

    // Créer étudiant temporaire (normalement via enrollment.service)
    const student = studentRepo.create({
      enrollmentId,
      courseId,
      qrCode: `TEMP-${Date.now()}`,
      isActive: true
    });

    await studentRepo.save(student);

    // Générer QR badge
    await qrCodeService.generateStudentBadge(student.id);
    const updatedStudent = await studentRepo.findOne({
      where: { id: student.id },
      relations: ['enrollment', 'course']
    });

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/students/:id - Modifier un étudiant
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({ where: { id: parseInt(id) } });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    if (isActive !== undefined) student.isActive = isActive;
    if (status !== undefined) student.status = status;

    await studentRepo.save(student);

    res.json({
      success: true,
      message: 'Étudiant modifié avec succès',
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/students/:id - Supprimer un étudiant
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const studentRepo = AppDataSource.getRepository(Student);

    const student = await studentRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    await studentRepo.remove(student);

    res.json({
      success: true,
      message: 'Étudiant supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/students/:id/regenerate-qr - Regénérer le QR code
router.post('/:id/regenerate-qr', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const studentRepo = AppDataSource.getRepository(Student);

    const student = await studentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['enrollment']
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    await qrCodeService.generateStudentBadge(student.id);

    const updatedStudent = await studentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['enrollment']
    });

    res.json({
      success: true,
      message: 'QR code régénéré avec succès',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
