import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import bcrypt from 'bcrypt';

const router = Router();

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
      relations: ['user', 'enrollments', 'enrollments.course', 'enrollments.session'],
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

export default router;
