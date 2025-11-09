import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { PaymentSchedule, PaymentScheduleStatus } from '../entities/PaymentSchedule.entity';
import { PaymentTransaction } from '../entities/PaymentTransaction.entity';
import { Enrollment } from '../entities/Enrollment.entity';
import { Course, CourseType } from '../entities/Course.entity';
import { Student } from '../entities/Student.entity';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Générer les échéanciers de paiement pour une affectation
router.post('/generate/:enrollmentId', authenticate, async (req: Request, res: Response) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);

    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    const courseRepo = AppDataSource.getRepository(Course);

    // Vérifier si l'affectation existe
    const enrollment = await enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'student']
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Affectation non trouvée' });
    }

    // Vérifier si un échéancier existe déjà
    const existingSchedules = await scheduleRepo.find({
      where: { enrollmentId }
    });

    if (existingSchedules.length > 0) {
      return res.status(400).json({ 
        message: 'Un échéancier existe déjà pour cette affectation',
        schedules: existingSchedules 
      });
    }

    const course = enrollment.course;

    // Vérifier que le cours a les informations nécessaires
    if (!course.durationMonths || !course.pricePerMonth) {
      return res.status(400).json({ 
        message: 'Le cours doit avoir une durée (durationMonths) et un prix par mois (pricePerMonth)' 
      });
    }

    const schedules: PaymentSchedule[] = [];
    const enrollmentDate = new Date(enrollment.enrolledAt);
    const coursePrice = parseFloat(course.price.toString());
    const durationMonths = course.durationMonths;
    const pricePerMonth = parseFloat(course.pricePerMonth.toString());

    // Logique de génération selon le type de cours
    if (course.type === CourseType.TUTORING_GROUP || course.type === CourseType.TUTORING_INDIVIDUAL || course.type === CourseType.TUTORING_ONLINE) {
      // Pour le soutien scolaire : 12 échéances mensuelles
      for (let i = 1; i <= 12; i++) {
        const dueDate = new Date(enrollmentDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const schedule = new PaymentSchedule();
        schedule.enrollment = enrollment;
        schedule.installmentNumber = i;
        schedule.amount = pricePerMonth;
        schedule.dueDate = dueDate;
        schedule.status = PaymentScheduleStatus.EN_ATTENTE;
        
        schedules.push(schedule);
      }
    } else if (durationMonths >= 3) {
      // Pour les formations longues (≥3 mois) : paiements mensuels
      const monthlyAmount = coursePrice / durationMonths;
      
      for (let i = 1; i <= durationMonths; i++) {
        const dueDate = new Date(enrollmentDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1); // Premier paiement le jour de l'inscription
        
        const schedule = new PaymentSchedule();
        schedule.enrollment = enrollment;
        schedule.installmentNumber = i;
        schedule.amount = monthlyAmount;
        schedule.dueDate = dueDate;
        schedule.status = PaymentScheduleStatus.EN_ATTENTE;
        
        schedules.push(schedule);
      }
    } else {
      // Pour les formations courtes (<3 mois) : 2 échéances de 50%
      const halfPrice = coursePrice / 2;
      
      // Première échéance : à l'inscription
      const firstSchedule = new PaymentSchedule();
      firstSchedule.enrollment = enrollment;
      firstSchedule.installmentNumber = 1;
      firstSchedule.amount = halfPrice;
      firstSchedule.dueDate = enrollmentDate;
      firstSchedule.status = PaymentScheduleStatus.EN_ATTENTE;
      schedules.push(firstSchedule);
      
      // Deuxième échéance : à mi-parcours
      const midDate = new Date(enrollmentDate);
      midDate.setMonth(midDate.getMonth() + Math.floor(durationMonths / 2));
      
      const secondSchedule = new PaymentSchedule();
      secondSchedule.enrollment = enrollment;
      secondSchedule.installmentNumber = 2;
      secondSchedule.amount = halfPrice;
      secondSchedule.dueDate = midDate;
      secondSchedule.status = PaymentScheduleStatus.EN_ATTENTE;
      schedules.push(secondSchedule);
    }

    // Sauvegarder toutes les échéances
    await scheduleRepo.save(schedules);

    return res.status(201).json({
      message: 'Échéancier généré avec succès',
      schedules,
      summary: {
        totalAmount: coursePrice,
        numberOfInstallments: schedules.length,
        courseType: course.type,
        durationMonths
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la génération de l\'échéancier:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Obtenir l'échéancier d'une affectation
router.get('/enrollment/:enrollmentId', authenticate, async (req: Request, res: Response) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);

    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    
    const schedules = await scheduleRepo.find({
      where: { enrollmentId },
      order: { installmentNumber: 'ASC' }
    });

    if (schedules.length === 0) {
      return res.status(404).json({ message: 'Aucun échéancier trouvé pour cette affectation' });
    }

    // Calculer les statistiques
    const totalAmount = schedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
    const paidAmount = schedules.reduce((sum, s) => sum + parseFloat(s.paidAmount.toString()), 0);
    const remainingAmount = totalAmount - paidAmount;
    const paidCount = schedules.filter(s => s.status === 'Payé').length;
    const overdueCount = schedules.filter(s => s.status === 'En retard').length;

    return res.json({
      schedules,
      summary: {
        totalAmount,
        paidAmount,
        remainingAmount,
        totalInstallments: schedules.length,
        paidInstallments: paidCount,
        overdueInstallments: overdueCount
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'échéancier:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Obtenir tous les échéanciers (avec filtres optionnels)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, studentId } = req.query;

    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    let query = scheduleRepo.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'course')
      .orderBy('schedule.dueDate', 'ASC');

    if (status) {
      query = query.andWhere('schedule.status = :status', { status });
    }

    if (studentId) {
      query = query.andWhere('enrollment.studentId = :studentId', { studentId: parseInt(studentId as string) });
    }

    const schedules = await query.getMany();

    return res.json(schedules);

  } catch (error: any) {
    console.error('Erreur lors de la récupération des échéanciers:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Obtenir les paiements en retard
router.get('/overdue', authenticate, async (req: Request, res: Response) => {
  try {
    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);

    const overdueSchedules = await scheduleRepo.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('enrollment.course', 'course')
      .where('schedule.dueDate < :today', { today: new Date() })
      .andWhere('schedule.status IN (:...statuses)', { statuses: ['En attente', 'Paiement partiel'] })
      .orderBy('schedule.dueDate', 'ASC')
      .getMany();

    return res.json(overdueSchedules);

  } catch (error: any) {
    console.error('Erreur lors de la récupération des paiements en retard:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Enregistrer un paiement
router.post('/:scheduleId/pay', authenticate, async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const { amount, paymentMethod, paymentDate, reference, receivedBy, notes } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ message: 'Le montant et la méthode de paiement sont requis' });
    }

    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    const transactionRepo = AppDataSource.getRepository(PaymentTransaction);

    const schedule = await scheduleRepo.findOne({
      where: { id: scheduleId },
      relations: ['enrollment', 'enrollment.student']
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Échéance non trouvée' });
    }

    // Calculer le nouveau montant payé
    const paidAmount = parseFloat(schedule.paidAmount.toString());
    const newPaidAmount = paidAmount + parseFloat(amount);
    const totalAmount = parseFloat(schedule.amount.toString());

    // Mettre à jour l'échéance
    schedule.paidAmount = newPaidAmount;
    schedule.paymentMethod = paymentMethod;
    schedule.notes = notes || schedule.notes;

    // Déterminer le nouveau statut
    if (newPaidAmount >= totalAmount) {
      schedule.status = PaymentScheduleStatus.PAYE;
      schedule.paidDate = paymentDate ? new Date(paymentDate) : new Date();
    } else if (newPaidAmount > 0) {
      schedule.status = PaymentScheduleStatus.PARTIEL;
    }

    await scheduleRepo.save(schedule);

    // Créer une transaction
    const transaction = transactionRepo.create({
      scheduleId,
      enrollmentId: schedule.enrollmentId,
      studentId: schedule.enrollment.student.id,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      reference,
      receivedBy,
      notes
    });

    await transactionRepo.save(transaction);

    // Recharger l'échéance avec toutes les relations
    const updatedSchedule = await scheduleRepo.findOne({
      where: { id: scheduleId },
      relations: ['enrollment', 'enrollment.student', 'enrollment.course']
    });

    return res.json({
      message: 'Paiement enregistré avec succès',
      schedule: updatedSchedule,
      transaction,
      summary: {
        totalAmount,
        paidAmount: newPaidAmount,
        remainingAmount: totalAmount - newPaidAmount,
        status: schedule.status
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Obtenir l'historique des transactions pour une échéance
router.get('/:scheduleId/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);

    const transactionRepo = AppDataSource.getRepository(PaymentTransaction);
    
    const transactions = await transactionRepo.find({
      where: { scheduleId },
      order: { createdAt: 'DESC' }
    });

    return res.json(transactions);

  } catch (error: any) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Obtenir toutes les transactions d'un étudiant
router.get('/student/:studentId/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const transactionRepo = AppDataSource.getRepository(PaymentTransaction);
    
    const transactions = await transactionRepo.find({
      where: { studentId },
      relations: ['schedule', 'enrollment', 'enrollment.course'],
      order: { createdAt: 'DESC' }
    });

    const totalPaid = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return res.json({
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalPaid
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une échéance
router.put('/:scheduleId', authenticate, async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const { amount, dueDate, status, notes } = req.body;

    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    
    const schedule = await scheduleRepo.findOne({
      where: { id: scheduleId }
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Échéance non trouvée' });
    }

    // Mettre à jour les champs fournis
    if (amount !== undefined) schedule.amount = amount;
    if (dueDate) schedule.dueDate = new Date(dueDate);
    if (status) schedule.status = status;
    if (notes !== undefined) schedule.notes = notes;

    await scheduleRepo.save(schedule);

    return res.json({
      message: 'Échéance mise à jour avec succès',
      schedule
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'échéance:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Supprimer un échéancier complet (admin uniquement)
router.delete('/enrollment/:enrollmentId', authenticate, async (req: Request, res: Response) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);

    const scheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    
    const schedules = await scheduleRepo.find({
      where: { enrollmentId }
    });

    if (schedules.length === 0) {
      return res.status(404).json({ message: 'Aucun échéancier trouvé' });
    }

    // Vérifier qu'aucun paiement n'a été effectué
    const hasPaidSchedules = schedules.some(s => parseFloat(s.paidAmount.toString()) > 0);
    
    if (hasPaidSchedules) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer un échéancier avec des paiements effectués' 
      });
    }

    await scheduleRepo.remove(schedules);

    return res.json({
      message: 'Échéancier supprimé avec succès',
      deletedCount: schedules.length
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'échéancier:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
