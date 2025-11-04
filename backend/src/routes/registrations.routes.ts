import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Registration, RegistrationStatus } from '../entities/Registration.entity';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';
import { Session } from '../entities/Session.entity';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import bcrypt from 'bcrypt';

const router = Router();
const registrationRepository = AppDataSource.getRepository(Registration);
const studentRepository = AppDataSource.getRepository(Student);
const userRepository = AppDataSource.getRepository(User);
const courseRepository = AppDataSource.getRepository(Course);
const sessionRepository = AppDataSource.getRepository(Session);
const enrollmentRepository = AppDataSource.getRepository(Enrollment);

/**
 * @swagger
 * /api/registrations:
 *   get:
 *     summary: Liste toutes les demandes d'inscription
 *     description: Retourne toutes les inscriptions avec leurs formations et sessions associées
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
 *         description: Liste des inscriptions avec les relations course et session chargées
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const queryBuilder = registrationRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.course', 'course')
      .leftJoinAndSelect('registration.session', 'session')
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
 *     description: Retourne les détails d'une inscription avec sa formation et sa session associées
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'inscription
 *     responses:
 *       200:
 *         description: Détails de l'inscription
 *       404:
 *         description: Inscription non trouvée
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['course', 'session'],
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
 *               - sessionId
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Prénom du candidat
 *               lastName:
 *                 type: string
 *                 description: Nom du candidat
 *               email:
 *                 type: string
 *                 description: Email du candidat
 *               phone:
 *                 type: string
 *                 description: Téléphone du candidat
 *               courseId:
 *                 type: integer
 *                 description: ID de la formation choisie
 *               sessionId:
 *                 type: integer
 *                 description: ID de la session à laquelle s'inscrire (obligatoire)
 *               notes:
 *                 type: string
 *                 description: Notes ou commentaires sur l'inscription
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, courseId, sessionId, notes } = req.body;

    // Validation
    if (!firstName || !lastName || !courseId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, formation et session sont obligatoires',
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

    // Vérifier que la session existe
    const session = await sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée',
      });
    }

    // Créer l'inscription avec statut "En attente de paiement"
    const registration = registrationRepository.create({
      firstName,
      lastName,
      email,
      phone,
      courseId,
      sessionId,
      notes,
      status: RegistrationStatus.PENDING_PAYMENT,
    });

    await registrationRepository.save(registration);

    // Recharger avec les relations course et session
    const savedRegistration = await registrationRepository.findOne({
      where: { id: registration.id },
      relations: ['course', 'session'],
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
 *     summary: Valider une inscription et créer automatiquement l'étudiant + affectation
 *     description: |
 *       Cette route effectue les opérations suivantes en une seule validation :
 *       1. Crée un compte utilisateur pour l'étudiant
 *       2. Crée la fiche étudiant avec les informations du candidat
 *       3. Crée automatiquement l'affectation (enrollment) à la session choisie lors de l'inscription
 *       4. Met à jour le statut de l'inscription à "Validée par Finance"
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'inscription à valider
 *     responses:
 *       200:
 *         description: Inscription validée, étudiant créé et affecté à la session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration:
 *                       type: object
 *                       description: L'inscription validée
 *                     student:
 *                       type: object
 *                       description: L'étudiant créé
 *                     enrollment:
 *                       type: object
 *                       description: L'affectation créée automatiquement
 *       400:
 *         description: Inscription déjà validée ou aucune session associée
 *       404:
 *         description: Inscription non trouvée
 */
router.post('/:id/validate', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const registration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['course', 'session'],
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

    // Vérifier que la session existe
    if (!registration.sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune session n\'est associée à cette inscription',
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

    // NOUVEAU : Créer automatiquement l'affectation (enrollment) à la session
    const enrollment = enrollmentRepository.create({
      studentId: student.id,
      sessionId: registration.sessionId,
      status: EnrollmentStatus.PENDING,
      notes: `Affectation automatique depuis l'inscription #${registration.id}`,
    });

    await enrollmentRepository.save(enrollment);

    // Mettre à jour l'inscription
    registration.status = RegistrationStatus.VALIDATED;
    registration.validatedAt = new Date();
    registration.validatedBy = userId;
    registration.studentId = student.id;

    await registrationRepository.save(registration);

    res.json({
      success: true,
      message: 'Inscription validée, étudiant créé et affecté à la session avec succès',
      data: {
        registration,
        student,
        enrollment,
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
 *     description: Permet de modifier les informations d'une inscription non validée. Les inscriptions déjà validées ne peuvent pas être modifiées.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'inscription
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               sessionId:
 *                 type: integer
 *                 description: ID de la session
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inscription mise à jour
 *       400:
 *         description: Impossible de modifier une inscription validée
 *       404:
 *         description: Inscription non trouvée
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, courseId, sessionId, notes } = req.body;

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
    if (sessionId !== undefined) registration.sessionId = sessionId;
    if (notes !== undefined) registration.notes = notes;

    await registrationRepository.save(registration);

    // Recharger avec les relations
    const updatedRegistration = await registrationRepository.findOne({
      where: { id: registration.id },
      relations: ['course', 'session'],
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
 *     description: Supprime une inscription non validée. Les inscriptions validées ne peuvent pas être supprimées.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'inscription à supprimer
 *     responses:
 *       200:
 *         description: Inscription supprimée
 *       400:
 *         description: Impossible de supprimer une inscription validée
 *       404:
 *         description: Inscription non trouvée
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
