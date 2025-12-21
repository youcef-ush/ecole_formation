import { Router } from 'express';
import { StudentPaymentPlanController } from '../controllers/student-payment-plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new StudentPaymentPlanController();

// Routes protégées
router.use(authenticate);

// Créer des échéances personnalisées pour une affectation
router.post('/:id/installments', controller.createInstallments);

export default router;
