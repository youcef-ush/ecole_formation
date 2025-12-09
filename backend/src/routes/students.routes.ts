
import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { QrCodeService } from '../services/qrcode.service';
import bcrypt from 'bcrypt';

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
      relations: ['enrollments', 'enrollments.course'],
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
      relations: ['enrollments', 'enrollments.course', 'accessLogs'],
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

// POST /api/students - Créer un nouvel étudiant
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth, phone, address, qrCode } = req.body;

    if (!firstName || !lastName) {
      throw new AppError('Nom et Prénom obligatoires', 400);
    }

    const studentRepo = AppDataSource.getRepository(Student);

    // Optional User creation skipped for brevity if not strictly needed or handle if email provided
    // Taking simplified route: Create Student directly

    const student = new Student();
    student.firstName = firstName;
    student.lastName = lastName;
    student.phone = phone;
    student.address = address;
    student.birthDate = dateOfBirth; // Assuming string or date handled
    // QR Code: Use provided or generate temp
    student.qrCode = qrCode || `TEMP-${Date.now()}`;

    // Check if email provided to link user? (Leaving out for now to match new schema focus)

    await studentRepo.save(student);

    // Generate real badge if not provided
    if (!qrCode) {
      await qrCodeService.generateStudentBadge(student.id);
    }

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès',
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/students/:id - Modifier un étudiant
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, address } = req.body;

    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({ where: { id: parseInt(id) } });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    studentRepo.merge(student, {
      firstName,
      lastName,
      phone,
      address,
    });

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
      relations: ['enrollments'],
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    // Vérifier si l'étudiant a des inscriptions actives
    const activeEnrollments = student.enrollments?.filter(
      (e) => e.status === EnrollmentStatus.ACTIVE
    );

    if (activeEnrollments && activeEnrollments.length > 0) {
      throw new AppError('Impossible de supprimer un étudiant avec des inscriptions actives', 400);
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

// Generate Badge
router.post('/:id/generate-badge', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({ where: { id: parseInt(id) } });

    if (!student) throw new AppError('Étudiant non trouvé', 404);

    const qrData = await qrCodeService.generateStudentBadge(student.id);

    res.json({
      success: true,
      data: { qrCode: qrData }
    });
  } catch (error) {
    next(error);
  }
});

// Validate Badge
router.get('/validate-badge/:qrCode', async (req: AuthRequest, res: Response, next) => {
  try {
    const { qrCode } = req.params;
    const student = await qrCodeService.validateStudentQr(qrCode);

    res.json({
      success: true,
      message: 'Badge valide',
      data: student
    });
  } catch (error) {
    next(error);
  }
});

export default router;
