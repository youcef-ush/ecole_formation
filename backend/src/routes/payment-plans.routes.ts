import { Router } from 'express';
import { PaymentPlanController } from '../controllers/payment-plan.controller';

const router = Router();
const controller = new PaymentPlanController();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;