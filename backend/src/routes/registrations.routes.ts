import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Registration, RegistrationStatus } from '../entities/Registration.entity';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import bcrypt from 'bcrypt';

const router = Router();
const registrationRepository = AppDataSource.getRepository(Registration);
const studentRepository = AppDataSource.getRepository(Student);
const userRepository = AppDataSource.getRepository(User);
const courseRepository = AppDataSource.getRepository(Course);

/**
 * @swagger
 * /api/registrations:
 *   get:
 *     summary: Liste toutes les demandes d'inscription
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [En attente de paiement, Validée par Finance, Refusée]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des inscriptions
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const queryBuilder = registrationRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.course', 'course')
      .orderBy('registration.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('registration.status = :status', { status });
    }

    const registrations = await queryBuilder.getMany();

    res.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des inscriptions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations/{id}:
 *   get:
 *     summary: Récupère une inscription par ID
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['course'],
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée',
      });
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'inscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Créer une nouvelle demande d'inscription
 *     tags: [Registrations]
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
 *               - courseId
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               courseId:
 *                 type: integer
 *               notes:
 *                 type: string
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, courseId, notes } = req.body;

    // Validation
    if (!firstName || !lastName || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom et formation sont obligatoires',
      });
    }

    // Vérifier que la formation existe
    const course = await courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Formation non trouvée',
      });
    }

    // Créer l'inscription avec statut "En attente de paiement"
    const registration = registrationRepository.create({
      firstName,
      lastName,
      email,
      phone,
      courseId,
      notes,
      status: RegistrationStatus.PENDING_PAYMENT,
    });

    await registrationRepository.save(registration);

    // Recharger avec la relation course
    const savedRegistration = await registrationRepository.findOne({
      where: { id: registration.id },
      relations: ['course'],
    });

    res.status(201).json({
      success: true,
      message: 'Inscription créée avec succès',
      data: savedRegistration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'inscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations/{id}/validate:
 *   post:
 *     summary: Valider une inscription et créer l'étudiant
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.post('/:id/validate', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['course'],
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée',
      });
    }

    if (registration.status === RegistrationStatus.VALIDATED) {
      return res.status(400).json({
        success: false,
        message: 'Cette inscription est déjà validée',
      });
    }

    // Créer un utilisateur pour l'étudiant
    const hashedPassword = await bcrypt.hash('Etudiant123', 10);
    const user = userRepository.create({
      email: registration.email || `${registration.firstName}.${registration.lastName}@ecole.dz`.toLowerCase(),
      password: hashedPassword,
      role: UserRole.STUDENT,
    });

    await userRepository.save(user);

    // Créer l'étudiant dans la base de données
    const student = studentRepository.create({
      firstName: registration.firstName,
      lastName: registration.lastName,
      dateOfBirth: new Date('2000-01-01'), // Date par défaut, à modifier plus tard
      phone: registration.phone || '',
      address: '',
      userId: user.id,
    });

    await studentRepository.save(student);

    // Mettre à jour l'inscription
    registration.status = RegistrationStatus.VALIDATED;
    registration.validatedAt = new Date();
    registration.validatedBy = userId;
    registration.studentId = student.id;

    await registrationRepository.save(registration);

    res.json({
      success: true,
      message: 'Inscription validée et étudiant créé avec succès',
      data: {
        registration,
        student,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'inscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations/{id}/reject:
 *   post:
 *     summary: Refuser une inscription
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 */
router.post('/:id/reject', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée',
      });
    }

    registration.status = RegistrationStatus.REJECTED;
    if (notes) {
      registration.notes = notes;
    }

    await registrationRepository.save(registration);

    res.json({
      success: true,
      message: 'Inscription refusée',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus de l\'inscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations/{id}:
 *   put:
 *     summary: Modifier une inscription
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, courseId, notes } = req.body;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée',
      });
    }

    // Ne pas permettre de modifier une inscription déjà validée
    if (registration.status === RegistrationStatus.VALIDATED) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une inscription déjà validée',
      });
    }

    // Mettre à jour les champs
    if (firstName) registration.firstName = firstName;
    if (lastName) registration.lastName = lastName;
    if (email !== undefined) registration.email = email;
    if (phone !== undefined) registration.phone = phone;
    if (courseId) registration.courseId = courseId;
    if (notes !== undefined) registration.notes = notes;

    await registrationRepository.save(registration);

    // Recharger avec la relation
    const updatedRegistration = await registrationRepository.findOne({
      where: { id: registration.id },
      relations: ['course'],
    });

    res.json({
      success: true,
      message: 'Inscription mise à jour',
      data: updatedRegistration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations/{id}:
 *   delete:
 *     summary: Supprimer une inscription
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée',
      });
    }

    // Ne pas permettre de supprimer une inscription validée
    if (registration.status === RegistrationStatus.VALIDATED) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une inscription validée',
      });
    }

    await registrationRepository.remove(registration);

    res.json({
      success: true,
      message: 'Inscription supprimée',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
