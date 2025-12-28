
import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Course } from '../entities/Course.entity';
import { Enrollment } from "../entities/Enrollment.entity";
import { Payment } from '../entities/Payment.entity';
import { Installment, InstallmentStatus } from '../entities/Installment.entity';
import { AccessLog } from '../entities/AccessLog.entity'; // Replaces Attendance
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { Between, LessThanOrEqual, In } from 'typeorm';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.RECEPTION));

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const studentRepo = AppDataSource.getRepository(Student);
    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Nombre total d'étudiants
    const totalStudents = await studentRepo.count();

    // Nombre de formations actives
    const activeCourses = await courseRepo.count();

    // Nombre d'inscriptions (paid enrollments)
    const activeEnrollments = await enrollmentRepo.count({
      where: { isRegistrationFeePaid: true }
    });

    // Revenus totaux (somme des paiements)
    const paymentsResult = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const totalRevenue = parseFloat(paymentsResult?.total || '0');

    res.json({
      success: true,
      data: {
        totalStudents,
        activeCourses,
        activeEnrollments,
        totalRevenue,
        pendingEnrollments: 0 // Concept changed, pending is mostly about debt now
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/attendance-stats --> Renamed/Refactored to Access Stats
router.get('/attendance-stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const logRepo = AppDataSource.getRepository(AccessLog);

    // Total scans today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayScans = await logRepo.count({
      where: {
        // TypeORM date comparison might need tweak, using simple count for now or query builder
      }
    });

    // Total Granted vs Denied (All time or recent)
    const { AccessStatus } = await import("../entities/AccessLog.entity");
    const grantedCount = await logRepo.count({ where: { status: AccessStatus.GRANTED } });
    const deniedCount = await logRepo.count({ where: { status: AccessStatus.DENIED } });

    res.json({
      success: true,
      data: {
        grantedCount,
        deniedCount,
        // Detailed stats can be added later
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/payment-alerts
router.get('/payment-alerts', async (req: AuthRequest, res: Response, next) => {
  try {
    const installmentRepo = AppDataSource.getRepository(Installment);
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const alerts = await installmentRepo.find({
      where: {
        status: In([InstallmentStatus.PENDING, InstallmentStatus.OVERDUE]),
        dueDate: LessThanOrEqual(nextWeekStr)
      },
      relations: ['studentAssignment', 'studentAssignment.student', 'studentAssignment.student.enrollment', 'studentAssignment.course'],
      order: {
        dueDate: 'ASC'
      }
    });

    const formattedAlerts = alerts.map(inst => {
      const dueDateObj = new Date(inst.dueDate);
      const diffTime = dueDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        id: inst.id,
        studentName: `${inst.studentAssignment.student.enrollment.firstName} ${inst.studentAssignment.student.enrollment.lastName}`,
        courseTitle: inst.studentAssignment.course.title,
        amount: inst.amount,
        dueDate: inst.dueDate,
        daysRemaining: diffDays
      };
    });

    res.json({
      success: true,
      data: formattedAlerts
    });
  } catch (error) {
    next(error);
  }
});

export default router;
