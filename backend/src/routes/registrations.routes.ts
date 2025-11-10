import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Registration, RegistrationStatus, PaymentMethod } from '../entities/Registration.entity';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';
import { Session } from '../entities/Session.entity';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { QrCodeService } from '../services/qrcode.service';
import bcrypt from 'bcrypt';

const router = Router();
const registrationRepository = AppDataSource.getRepository(Registration);
const studentRepository = AppDataSource.getRepository(Student);
const userRepository = AppDataSource.getRepository(User);
const courseRepository = AppDataSource.getRepository(Course);
const sessionRepository = AppDataSource.getRepository(Session);
const enrollmentRepository = AppDataSource.getRepository(Enrollment);
const qrCodeService = new QrCodeService();

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
    const { status, hasInstallments } = req.query;

    const queryBuilder = registrationRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.course', 'course')
      .leftJoinAndSelect('registration.session', 'session')
      .leftJoinAndSelect('registration.installmentPayments', 'installmentPayments')
      .orderBy('registration.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('registration.status = :status', { status });
    }

    if (hasInstallments === 'true') {
      queryBuilder.andWhere('registration.installmentPlan IS NOT NULL');
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
 *     summary: Créer une nouvelle demande d'inscription (candidature)
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
 *               - registrationFee
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
 *                 description: ID de la session à laquelle s'inscrire
 *               registrationFee:
 *                 type: number
 *                 description: Montant des frais d'inscription
 *               notes:
 *                 type: string
 *                 description: Notes ou commentaires sur l'inscription
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, courseId, sessionId, registrationFee, notes } = req.body;

    // Validation
    if (!firstName || !lastName || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom et formation sont obligatoires',
      });
    }

    // Vérifier s'il existe déjà un étudiant avec le même nom et prénom
    const existingStudent = await studentRepository
      .createQueryBuilder('student')
      .where('LOWER(student.firstName) = LOWER(:firstName)', { firstName })
      .andWhere('LOWER(student.lastName) = LOWER(:lastName)', { lastName })
      .getOne();

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Un étudiant avec le nom "${firstName} ${lastName}" existe déjà dans le système`,
        code: 'DUPLICATE_STUDENT',
      });
    }

    // Vérifier s'il existe déjà une inscription en attente avec le même nom et prénom
    const existingRegistration = await registrationRepository
      .createQueryBuilder('registration')
      .where('LOWER(registration.firstName) = LOWER(:firstName)', { firstName })
      .andWhere('LOWER(registration.lastName) = LOWER(:lastName)', { lastName })
      .andWhere('registration.status != :rejectedStatus', { rejectedStatus: RegistrationStatus.REJECTED })
      .getOne();

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: `Une inscription pour "${firstName} ${lastName}" existe déjà (${existingRegistration.status})`,
        code: 'DUPLICATE_REGISTRATION',
        existingRegistration,
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

    // Vérifier que la session existe (si fournie)
    if (sessionId) {
      const session = await sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session non trouvée',
        });
      }
    }

    // Créer l'inscription avec statut "En attente"
    const registration = registrationRepository.create({
      firstName,
      lastName,
      email,
      phone,
      courseId,
      sessionId: sessionId || null, // Optionnel
      registrationFee: registrationFee || 0, // Optionnel, peut être défini à 0 initialement
      notes,
      status: RegistrationStatus.PENDING,
      registrationFeePaid: false,
      isValidated: false,
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
 * /api/registrations/{id}/pay:
 *   put:
 *     summary: Marquer les frais d'inscription comme payés
 *     description: Met à jour le statut de paiement après réception des frais d'inscription
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - amountPaid
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, BANK_TRANSFER, CHECK]
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Paiement enregistré avec succès
 *       404:
 *         description: Inscription non trouvée
 */
router.put('/:id/pay', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amountPaid, registrationFee } = req.body;

    if (!paymentMethod || !amountPaid) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement et montant sont obligatoires',
      });
    }

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

    // Mettre à jour les frais si fournis
    if (registrationFee) {
      registration.registrationFee = registrationFee;
    }

    // Marquer comme payé
    registration.registrationFeePaid = true;
    registration.registrationFeePaidAt = new Date();
    registration.paymentMethod = paymentMethod;
    registration.amountPaid = amountPaid;
    registration.status = RegistrationStatus.PAID;

    await registrationRepository.save(registration);

    res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du paiement',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/registrations/{id}/validate:
 *   post:
 *     summary: Valider une inscription et créer automatiquement l'étudiant avec QR Code
 *     description: |
 *       NOUVEAU PROCESSUS :
 *       1. Vérifie que les frais d'inscription sont payés
 *       2. Crée un compte utilisateur pour l'étudiant
 *       3. Crée la fiche étudiant avec un QR Code unique (format: STU-{id}-{timestamp})
 *       4. Crée automatiquement l'affectation à la session
 *       5. Met à jour le statut à "Validée"
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
 *         description: Inscription validée, étudiant créé avec QR Code
 *       400:
 *         description: Frais non payés ou inscription déjà validée
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

    // Recharger pour s'assurer d'avoir les dernières données (après le paiement)
    const refreshedRegistration = await registrationRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['course', 'session'],
    });

    if (!refreshedRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée après rechargement',
      });
    }

    // Vérifier que les frais sont payés avant validation
    if (!refreshedRegistration.registrationFeePaid) {
      return res.status(400).json({
        success: false,
        message: 'Les frais d\'inscription doivent être payés avant validation',
        debug: {
          registrationFeePaid: refreshedRegistration.registrationFeePaid,
          registrationFee: refreshedRegistration.registrationFee,
          amountPaid: refreshedRegistration.amountPaid,
        }
      });
    }

    if (refreshedRegistration.isValidated) {
      return res.status(400).json({
        success: false,
        message: 'Cette inscription est déjà validée',
      });
    }

    // Créer un utilisateur pour l'étudiant
    const hashedPassword = await bcrypt.hash('Etudiant123', 10);
    
    // Générer un email unique si non fourni ou si doublon
    let emailToUse = refreshedRegistration.email;
    
    if (!emailToUse) {
      // Générer un email unique basé sur nom + timestamp
      const timestamp = Date.now();
      emailToUse = `${refreshedRegistration.firstName}.${refreshedRegistration.lastName}.${timestamp}@inspiredacademy.dz`.toLowerCase();
    } else {
      // Vérifier si l'email existe déjà et générer un email unique si nécessaire
      const existingUser = await userRepository.findOne({
        where: { email: emailToUse },
      });

      if (existingUser) {
        // Email existe, générer un email unique avec timestamp
        const timestamp = Date.now();
        const [localPart, domain] = emailToUse.split('@');
        emailToUse = `${localPart}.${timestamp}@${domain || 'inspiredacademy.dz'}`;
      }
    }

    const user = userRepository.create({
      email: emailToUse,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });

    await userRepository.save(user);

    // Créer l'étudiant dans la base de données
    const student = studentRepository.create({
      firstName: refreshedRegistration.firstName,
      lastName: refreshedRegistration.lastName,
      dateOfBirth: new Date('2000-01-01'), // Date par défaut, à modifier plus tard
      phone: refreshedRegistration.phone || '',
      address: '',
      userId: user.id,
    });

    await studentRepository.save(student);

    // AUTO-GÉNÉRATION DU BADGE QR CODE (Tâche 17)
    // Générer le badge QR code avec le service (valide 12 mois par défaut)
    const badgeQrCodeDataUrl = await qrCodeService.generateStudentBadge(student.id, 12);
    const badgeExpiry = new Date();
    badgeExpiry.setMonth(badgeExpiry.getMonth() + 12);

    student.badgeQrCode = badgeQrCodeDataUrl;
    student.badgeExpiry = badgeExpiry;
    
    // Aussi garder l'ancien format pour compatibilité
    const timestamp = Date.now();
    student.qrCode = `STU-${student.id}-${timestamp}`;
    
    await studentRepository.save(student);

    // Créer automatiquement l'affectation (enrollment) à la FORMATION
    let enrollment = null;
    if (refreshedRegistration.courseId) {
      enrollment = enrollmentRepository.create({
        studentId: student.id,
        courseId: refreshedRegistration.courseId,
        status: EnrollmentStatus.PENDING,
        notes: `Affectation automatique depuis l'inscription #${refreshedRegistration.id}`,
      });

      await enrollmentRepository.save(enrollment);

      // NOUVEAU : Générer automatiquement les échéanciers de paiement
      const course = refreshedRegistration.course;
      if (course && course.durationMonths && course.pricePerMonth) {
        try {
          const PaymentSchedule = (await import('../entities/PaymentSchedule.entity')).PaymentSchedule;
          const PaymentScheduleStatus = (await import('../entities/PaymentSchedule.entity')).PaymentScheduleStatus;
          const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
          
          const enrollmentDate = new Date();
          const durationMonths = course.durationMonths;
          const pricePerMonth = parseFloat(course.pricePerMonth.toString());

          // Générer les échéanciers mensuels
          const schedules: any[] = [];
          for (let i = 1; i <= durationMonths; i++) {
            const dueDate = new Date(enrollmentDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            
            const schedule = scheduleRepo.create({
              enrollmentId: enrollment.id,
              installmentNumber: i,
              amount: pricePerMonth,
              dueDate: dueDate,
              status: PaymentScheduleStatus.EN_ATTENTE,
              paidAmount: 0,
            });
            
            schedules.push(schedule);
          }
          
          await scheduleRepo.save(schedules);
          console.log(`✅ ${schedules.length} échéanciers générés automatiquement pour l'enrollment #${enrollment.id}`);
        } catch (scheduleError) {
          console.error('❌ Erreur lors de la génération des échéanciers:', scheduleError);
          // On ne bloque pas la validation si les échéanciers échouent
        }
      }
    }

    // Mettre à jour l'inscription
    refreshedRegistration.status = RegistrationStatus.VALIDATED;
    refreshedRegistration.isValidated = true;
    refreshedRegistration.validatedAt = new Date();
    refreshedRegistration.validatedBy = userId;
    refreshedRegistration.studentId = student.id;

    await registrationRepository.save(refreshedRegistration);

    res.json({
      success: true,
      message: enrollment 
        ? 'Inscription validée avec succès - Étudiant créé avec badge QR Code et affecté à la formation'
        : 'Inscription validée avec succès - Étudiant créé avec badge QR Code (pas de formation assignée)',
      data: {
        registration: refreshedRegistration,
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone,
          badgeQrCode: student.badgeQrCode, // Badge QR Code (Data URL)
          badgeExpiry: student.badgeExpiry,
          qrCode: student.qrCode, // Ancien format pour compatibilité
        },
        enrollment,
      },
    });
  } catch (error) {
    console.error('Erreur validation complète:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'inscription',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
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
