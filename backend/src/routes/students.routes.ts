import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { User, UserRole } from '../entities/User.entity';
import { Enrollment } from "../entities/Enrollment.entity";
import { PaymentPlan } from '../entities/PaymentPlan.entity';
import { StudentPaymentPlan } from '../entities/StudentPaymentPlan.entity';
import { Installment } from '../entities/Installment.entity';
import { Payment } from '../entities/Payment.entity';
import { StudentAssignment } from '../entities/StudentAssignment.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { QrCodeService } from '../services/qrcode.service';

const router = Router();
const qrCodeService = new QrCodeService();

// Protect all routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.RECEPTION));

// GET /api/students - Liste de tous les étudiants
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const studentRepo = AppDataSource.getRepository(Student);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const students = await studentRepo.find({
      relations: [
        'enrollment', 
        'course', 
        'studentPaymentPlans', 
        'studentPaymentPlans.paymentPlan',
        'studentAssignments',
        'studentAssignments.course',
        'studentAssignments.paymentPlan'
      ],
      order: { createdAt: 'DESC' },
    });

    // Enrichir avec les infos de paiement
    const studentsWithPaymentInfo = await Promise.all(students.map(async (student) => {
      let totalPaid = 0;
      let nextInstallment = null;

      try {
        // Calculer le total payé
        const payments = await paymentRepo.find({ where: { studentId: student.id } });
        totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        // Trouver la prochaine échéance
        const assignments = await AppDataSource.getRepository(StudentAssignment).find({
          where: { student: { id: student.id } },
          relations: ['installments'],
        });

        const allInstallments = assignments.flatMap(a => a.installments || []);
        const pendingInstallments = allInstallments
          .filter(i => i.status !== 'PAID')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        if (pendingInstallments.length > 0) {
          nextInstallment = {
            dueDate: pendingInstallments[0].dueDate,
            amount: pendingInstallments[0].amount
          };
        }
      } catch (err) {
        console.warn(`Error calculating payment info for student ${student.id}`, err);
      }

      return {
        ...student,
        totalPaid,
        nextInstallment
      };
    }));

    res.json({
      success: true,
      data: studentsWithPaymentInfo,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/students/payment-status - Liste des étudiants avec statut de paiement
router.get('/payment-status', async (req: AuthRequest, res: Response, next) => {
  try {
    const studentRepo = AppDataSource.getRepository(Student);

    // Récupérer tous les étudiants avec leurs relations de base
    const students = await studentRepo.find({
      relations: ['enrollment', 'course'],
      order: { createdAt: 'DESC' },
    });

    // Calculer les informations de paiement pour chaque étudiant
    const studentsWithPaymentStatus = await Promise.all(
      students.map(async (student) => {
        try {
          // Récupérer les assignments (échéanciers) de l'étudiant avec leurs échéances
          const assignments = await AppDataSource.getRepository(StudentAssignment).find({
            where: { student: { id: student.id } },
            relations: ['installments', 'paymentPlan', 'course'],
            order: { createdAt: 'DESC' },
          });

          // Récupérer toutes les échéances de tous les assignments
          const allInstallments = assignments.flatMap(assignment => assignment.installments || []);
          
          // Échéances payées triées par date de paiement (la plus récente en premier)
          const paidInstallments = allInstallments
            .filter(inst => inst.status === 'PAID' && inst.paidDate)
            .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime());

          // Dernier paiement
          const lastPaymentDate = paidInstallments.length > 0 ? paidInstallments[0].paidDate : null;
          const lastPaymentAmount = paidInstallments.length > 0 ? Number(paidInstallments[0].amount) : null;

          // Calculer le total payé
          const totalPaid = paidInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);

          // Trouver la prochaine échéance (première non payée, triée par date d'échéance)
          const pendingInstallments = allInstallments
            .filter(installment => installment.status !== 'PAID')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

          const nextInstallment = pendingInstallments.length > 0 ? {
            id: pendingInstallments[0].id,
            dueDate: pendingInstallments[0].dueDate,
            amount: Number(pendingInstallments[0].amount),
          } : null;

          return {
            id: student.id,
            firstName: student.enrollment?.firstName || '',
            lastName: student.enrollment?.lastName || '',
            email: student.enrollment?.email || '',
            phone: student.enrollment?.phone || '',
            lastPaymentDate,
            lastPaymentAmount,
            totalPaid,
            nextInstallment,
            assignments, // Ajouter les assignments complets avec installments
          };
        } catch (error) {
          // En cas d'erreur pour un étudiant, retourner avec des valeurs par défaut
          console.warn(`Erreur calcul paiement pour étudiant ${student.id}:`, error);
          return {
            id: student.id,
            firstName: student.enrollment?.firstName || '',
            lastName: student.enrollment?.lastName || '',
            email: student.enrollment?.email || '',
            phone: student.enrollment?.phone || '',
            lastPaymentDate: null,
            lastPaymentAmount: null,
            totalPaid: 0,
            nextInstallment: null,
            assignments: [], // Ajouter assignments vide en cas d'erreur
          };
        }
      })
    );

    // Trier par date du dernier paiement (les plus récents en premier)
    studentsWithPaymentStatus.sort((a, b) => {
      if (!a.lastPaymentDate && !b.lastPaymentDate) return 0;
      if (!a.lastPaymentDate) return 1;
      if (!b.lastPaymentDate) return -1;
      return new Date(b.lastPaymentDate).getTime() - new Date(a.lastPaymentDate).getTime();
    });

    res.json({
      success: true,
      data: studentsWithPaymentStatus,
    });
  } catch (error) {
    console.error('Erreur dans payment-status:', error);
    next(error);
  }
});

// GET /api/students/:id - Détails d'un étudiant
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const studentRepo = AppDataSource.getRepository(Student);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const student = await studentRepo.findOne({
      where: { id: parseInt(id) },
      relations: [
        'enrollment', 
        'course', 
        'studentPaymentPlans', 
        'studentPaymentPlans.paymentPlan',
        'studentAssignments',
        'studentAssignments.course',
        'studentAssignments.paymentPlan',
        'studentAssignments.installments'
      ],
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    // Calculer les infos de paiement
    let totalPaid = 0;
    let nextInstallment = null;

    try {
      // Calculer le total payé
      const payments = await paymentRepo.find({ where: { studentId: student.id } });
      totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Trouver la prochaine échéance
      const assignments = await AppDataSource.getRepository(StudentAssignment).find({
        where: { student: { id: student.id } },
        relations: ['installments'],
      });

      const allInstallments = assignments.flatMap(a => a.installments || []);
      const pendingInstallments = allInstallments
        .filter(i => i.status !== 'PAID')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (pendingInstallments.length > 0) {
        nextInstallment = {
          dueDate: pendingInstallments[0].dueDate,
          amount: pendingInstallments[0].amount
        };
      }
    } catch (err) {
      console.warn(`Error calculating payment info for student ${student.id}`, err);
    }

    res.json({
      success: true,
      data: {
        ...student,
        totalPaid,
        nextInstallment
      },
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
    const { isActive, status, firstName, lastName, email, phone, address } = req.body;

    const studentRepo = AppDataSource.getRepository(Student);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    
    const student = await studentRepo.findOne({ 
      where: { id: parseInt(id) },
      relations: ['enrollment']
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    // Mise à jour des informations de l'étudiant (Enrollment)
    if (student.enrollment) {
      let enrollmentUpdated = false;
      if (firstName !== undefined) {
        student.enrollment.firstName = firstName;
        enrollmentUpdated = true;
      }
      if (lastName !== undefined) {
        student.enrollment.lastName = lastName;
        enrollmentUpdated = true;
      }
      if (email !== undefined) {
        student.enrollment.email = email;
        enrollmentUpdated = true;
      }
      if (phone !== undefined) {
        student.enrollment.phone = phone;
        enrollmentUpdated = true;
      }
      if (address !== undefined) {
        student.enrollment.address = address;
        enrollmentUpdated = true;
      }

      if (enrollmentUpdated) {
        await enrollmentRepo.save(student.enrollment);
      }
    }

    // Mise à jour du statut de l'étudiant
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
