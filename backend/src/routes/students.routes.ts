import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { QrCodeService } from '../services/qrcode.service';
import bcrypt from 'bcrypt';

const router = Router();
const qrCodeService = new QrCodeService();

// Protect all routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Liste de tous les étudiants
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des étudiants récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 */
// GET /api/students - Liste de tous les étudiants
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const studentRepo = AppDataSource.getRepository(Student);
    const students = await studentRepo.find({
      relations: ['user', 'enrollments', 'enrollments.course'],
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
      relations: ['user', 'enrollments', 'enrollments.course'],
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
    const { email, password, firstName, lastName, dateOfBirth, phone, address, city, postalCode } = req.body;

    if (!email || !password || !firstName || !lastName || !dateOfBirth || !phone) {
      throw new AppError('Tous les champs obligatoires doivent être remplis', 400);
    }

    const userRepo = AppDataSource.getRepository(User);
    const studentRepo = AppDataSource.getRepository(Student);

    // Vérifier si l'email existe déjà
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email déjà utilisé', 409);
    }

    // Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepo.create({
      email,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });
    await userRepo.save(user);

    // Créer l'étudiant
    const student = studentRepo.create({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      phone,
      address,
      city,
      postalCode,
      userId: user.id,
    });
    await studentRepo.save(student);

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
    const { firstName, lastName, dateOfBirth, phone, address, city, postalCode } = req.body;

    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({ where: { id: parseInt(id) } });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    studentRepo.merge(student, {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : student.dateOfBirth,
      phone,
      address,
      city,
      postalCode,
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
      (e) => e.status === 'Payé' || e.status === 'En attente'
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

/**
 * @swagger
 * /api/students/{id}/generate-badge:
 *   post:
 *     summary: Générer ou renouveler le badge QR code d'un étudiant
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'étudiant
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               validityMonths:
 *                 type: integer
 *                 description: Durée de validité en mois (défaut 12 mois)
 *                 default: 12
 *     responses:
 *       200:
 *         description: Badge généré avec succès
 *       404:
 *         description: Étudiant non trouvé
 */
router.post('/:id/generate-badge', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { validityMonths = 12 } = req.body;

    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['user'],
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    // Générer le badge QR code
    const qrCodeDataUrl = await qrCodeService.generateStudentBadge(student.id, validityMonths);

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    // Mettre à jour l'étudiant avec le nouveau badge
    student.badgeQrCode = qrCodeDataUrl;
    student.badgeExpiry = expiresAt;
    await studentRepo.save(student);

    res.json({
      success: true,
      message: 'Badge généré avec succès',
      data: {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        badgeQrCode: qrCodeDataUrl,
        badgeExpiry: expiresAt,
        validityMonths,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/students/{id}/revoke-badge:
 *   put:
 *     summary: Révoquer le badge QR code d'un étudiant
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'étudiant
 *     responses:
 *       200:
 *         description: Badge révoqué avec succès
 *       404:
 *         description: Étudiant non trouvé
 */
router.put('/:id/revoke-badge', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    // Révoquer le badge
    await qrCodeService.revokeStudentBadge(student.id);

    // Mettre à jour l'étudiant
    student.badgeQrCode = null;
    student.badgeExpiry = null;
    await studentRepo.save(student);

    res.json({
      success: true,
      message: 'Badge révoqué avec succès',
      data: {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/students/validate-badge/{qrCode}:
 *   get:
 *     summary: Valider un badge QR code étudiant
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: QR code du badge étudiant
 *     responses:
 *       200:
 *         description: Badge valide
 *       400:
 *         description: Badge invalide ou expiré
 *       404:
 *         description: Étudiant non trouvé
 */
router.get('/validate-badge/:qrCode', async (req: AuthRequest, res: Response, next) => {
  try {
    const { qrCode } = req.params;

    // Valider le QR code via le service (throw AppError si invalide)
    const student = await qrCodeService.validateStudentQr(qrCode);

    res.json({
      success: true,
      message: 'Badge valide',
      data: {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        email: student.user?.email,
        phone: student.phone,
        isActive: student.isActive,
        badgeExpiry: student.badgeExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
