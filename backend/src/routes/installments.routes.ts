import { Router } from 'express'
import { AppDataSource } from '../config/database.config'
import { InstallmentPayment } from '../entities/InstallmentPayment.entity'
import { Registration } from '../entities/Registration.entity'
import { authenticate } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'

const router = Router()
const installmentPaymentRepository = AppDataSource.getRepository(InstallmentPayment)
const registrationRepository = AppDataSource.getRepository(Registration)

// Créer un plan de paiement échelonné pour une inscription
router.post('/registrations/:id/installment-plan', authenticate, async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id)
    const { totalAmount, deposit, numberOfInstallments, installmentAmount } = req.body

    const registration = await registrationRepository.findOne({
      where: { id: registrationId },
    })

    if (!registration) {
      throw new AppError('Inscription non trouvée', 404)
    }

    // Enregistrer le plan
    registration.installmentPlan = {
      totalAmount,
      deposit,
      numberOfInstallments,
      installmentAmount,
    }

    await registrationRepository.save(registration)

    // Créer les échéances de paiement
    const installments: InstallmentPayment[] = []
    const registrationDate = new Date(registration.createdAt)

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(registrationDate)
      dueDate.setMonth(dueDate.getMonth() + i)

      const installment = installmentPaymentRepository.create({
        registration: registration,
        installmentNumber: i,
        amount: installmentAmount,
        dueDate: dueDate,
        status: 'PENDING',
      })

      installments.push(installment)
    }

    await installmentPaymentRepository.save(installments)

    // Récupérer l'inscription mise à jour avec les paiements
    const updatedRegistration = await registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['installmentPayments'],
    })

    res.json({
      success: true,
      message: 'Plan de paiement créé avec succès',
      data: updatedRegistration,
    })
  } catch (error) {
    next(error)
  }
})

// Enregistrer un paiement d'échéance
router.post('/installment-payments/:id/pay', authenticate, async (req, res, next) => {
  try {
    const installmentId = parseInt(req.params.id)
    const { paymentMethod, paymentDate } = req.body

    const installment = await installmentPaymentRepository.findOne({
      where: { id: installmentId },
    })

    if (!installment) {
      throw new AppError('Échéance non trouvée', 404)
    }

    installment.paymentDate = new Date(paymentDate)
    installment.paymentMethod = paymentMethod
    installment.status = 'PAID'

    await installmentPaymentRepository.save(installment)

    res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: installment,
    })
  } catch (error) {
    next(error)
  }
})

// Mettre à jour le statut des échéances en retard (à exécuter via cron job)
router.post('/installment-payments/update-overdue', authenticate, async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueInstallments = await installmentPaymentRepository.find({
      where: {
        status: 'PENDING',
      },
    })

    let updatedCount = 0

    for (const installment of overdueInstallments) {
      const dueDate = new Date(installment.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        installment.status = 'OVERDUE'
        await installmentPaymentRepository.save(installment)
        updatedCount++
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} échéances mises à jour en retard`,
      data: { updatedCount },
    })
  } catch (error) {
    next(error)
  }
})

// Obtenir toutes les échéances d'une inscription
router.get('/registrations/:id/installments', authenticate, async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id)

    const installments = await installmentPaymentRepository.find({
      where: { registration: { id: registrationId } },
      order: { installmentNumber: 'ASC' },
    })

    res.json({
      success: true,
      data: installments,
    })
  } catch (error) {
    next(error)
  }
})

// Obtenir toutes les échéances à venir (prochains 30 jours)
router.get('/installment-payments/upcoming', authenticate, async (req, res, next) => {
  try {
    const today = new Date()
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(today.getDate() + 30)

    const upcomingInstallments = await installmentPaymentRepository
      .createQueryBuilder('installment')
      .leftJoinAndSelect('installment.registration', 'registration')
      .leftJoinAndSelect('registration.course', 'course')
      .where('installment.status = :status', { status: 'PENDING' })
      .andWhere('installment.dueDate BETWEEN :today AND :thirtyDays', {
        today: today.toISOString().split('T')[0],
        thirtyDays: thirtyDaysLater.toISOString().split('T')[0],
      })
      .orderBy('installment.dueDate', 'ASC')
      .getMany()

    res.json({
      success: true,
      data: upcomingInstallments,
    })
  } catch (error) {
    next(error)
  }
})

export default router
