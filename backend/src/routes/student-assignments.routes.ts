import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Course } from '../entities/Course.entity';
import { PaymentPlan, PaymentPlanType } from '../entities/PaymentPlan.entity';
import { StudentAssignment, AssignmentStatus } from '../entities/StudentAssignment.entity';
import { StudentPaymentPlan } from '../entities/StudentPaymentPlan.entity';
import { Installment, InstallmentStatus } from '../entities/Installment.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.RECEPTION));

// GET /api/students/:studentId/assignments - Liste des affectations d'un étudiant
router.get('/:studentId/assignments', async (req: AuthRequest, res: Response, next) => {
  try {
    const { studentId } = req.params;
    const assignmentRepo = AppDataSource.getRepository(StudentAssignment);

    const assignments = await assignmentRepo.find({
      where: { studentId: parseInt(studentId) },
      relations: ['course', 'paymentPlan', 'installments'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/students/:studentId/assignments - Créer une nouvelle affectation
router.post('/:studentId/assignments', async (req: AuthRequest, res: Response, next) => {
  try {
    const { studentId } = req.params;
    const { courseId, paymentPlanId, totalAmount } = req.body;

    if (!courseId || !paymentPlanId) {
      throw new AppError('Formation et plan de paiement requis', 400);
    }

    const studentRepo = AppDataSource.getRepository(Student);
    const courseRepo = AppDataSource.getRepository(Course);
    const paymentPlanRepo = AppDataSource.getRepository(PaymentPlan);
    const assignmentRepo = AppDataSource.getRepository(StudentAssignment);

    // Vérifier que l'étudiant existe
    const student = await studentRepo.findOne({
      where: { id: parseInt(studentId) }
    });

    if (!student) {
      throw new AppError('Étudiant non trouvé', 404);
    }

    // Vérifier que la formation existe
    const course = await courseRepo.findOne({
      where: { id: courseId }
    });

    if (!course) {
      throw new AppError('Formation non trouvée', 404);
    }

    // Vérifier que le plan de paiement existe
    const paymentPlan = await paymentPlanRepo.findOne({
      where: { id: paymentPlanId }
    });

    if (!paymentPlan) {
      throw new AppError('Plan de paiement non trouvé', 404);
    }

    // Vérifier que cette affectation n'existe pas déjà (même étudiant + même formation)
    const existingAssignment = await assignmentRepo.findOne({
      where: {
        studentId: parseInt(studentId),
        courseId: courseId,
        status: AssignmentStatus.ACTIVE
      }
    });

    if (existingAssignment) {
      throw new AppError('Cet étudiant est déjà affecté à cette formation', 400);
    }

    // Calculer le montant total si non fourni
    let calculatedTotalAmount = totalAmount;
    if (!calculatedTotalAmount) {
      calculatedTotalAmount = course.price || 0;
    }

    // Créer la nouvelle affectation
    const newAssignment = assignmentRepo.create({
      studentId: parseInt(studentId),
      courseId: courseId,
      paymentPlanId: paymentPlanId,
      totalAmount: calculatedTotalAmount,
      status: AssignmentStatus.ACTIVE,
    });

    const savedAssignment = await assignmentRepo.save(newAssignment);

    // Créer les échéances si le plan est de type INSTALLMENTS
    if (paymentPlan.type === PaymentPlanType.INSTALLMENTS && paymentPlan.installmentsCount > 1) {
      const installmentRepo = AppDataSource.getRepository(Installment);
      const installmentAmount = calculatedTotalAmount / paymentPlan.installmentsCount;
      const intervalDays = paymentPlan.intervalDays || 30; // default 30 days

      for (let i = 1; i <= paymentPlan.installmentsCount; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i - 1) * intervalDays);

        const installment = installmentRepo.create({
          studentAssignmentId: savedAssignment.id,
          installmentNumber: i,
          amount: Number(installmentAmount.toFixed(2)),
          dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
          status: InstallmentStatus.PENDING
        });

        await installmentRepo.save(installment);
      }
    }

    // Récupérer l'affectation avec les relations
    const assignmentWithRelations = await assignmentRepo.findOne({
      where: { id: savedAssignment.id },
      relations: ['course', 'paymentPlan', 'student', 'installments'],
    });

    res.status(201).json({
      success: true,
      message: 'Affectation créée avec succès',
      data: assignmentWithRelations,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/students/:studentId/assignments/:assignmentId - Modifier une affectation
router.put('/:studentId/assignments/:assignmentId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { studentId, assignmentId } = req.params;
    const { courseId, paymentPlanId, totalAmount, status } = req.body;

    const assignmentRepo = AppDataSource.getRepository(StudentAssignment);

    const assignment = await assignmentRepo.findOne({
      where: { id: parseInt(assignmentId), studentId: parseInt(studentId) },
      relations: ['course', 'paymentPlan'],
    });

    if (!assignment) {
      throw new AppError('Affectation non trouvée', 404);
    }

    // Mettre à jour les champs fournis
    if (courseId) assignment.courseId = courseId;
    if (paymentPlanId) assignment.paymentPlanId = paymentPlanId;
    if (totalAmount !== undefined) assignment.totalAmount = totalAmount;
    if (status) assignment.status = status;

    if (status === AssignmentStatus.COMPLETED && !assignment.completedAt) {
      assignment.completedAt = new Date();
    }

    const updatedAssignment = await assignmentRepo.save(assignment);

    // Récupérer avec les relations
    const assignmentWithRelations = await assignmentRepo.findOne({
      where: { id: updatedAssignment.id },
      relations: ['course', 'paymentPlan', 'student'],
    });

    res.json({
      success: true,
      message: 'Affectation mise à jour avec succès',
      data: assignmentWithRelations,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/students/:studentId/assignments/:assignmentId - Supprimer une affectation
router.delete('/:studentId/assignments/:assignmentId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { studentId, assignmentId } = req.params;
    const assignmentRepo = AppDataSource.getRepository(StudentAssignment);

    const assignment = await assignmentRepo.findOne({
      where: { id: parseInt(assignmentId), studentId: parseInt(studentId) }
    });

    if (!assignment) {
      throw new AppError('Affectation non trouvée', 404);
    }

    // Marquer comme annulée plutôt que supprimer physiquement
    assignment.status = AssignmentStatus.CANCELLED;
    await assignmentRepo.save(assignment);

    res.json({
      success: true,
      message: 'Affectation annulée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

export default router;