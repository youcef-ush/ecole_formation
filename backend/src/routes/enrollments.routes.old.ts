
import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';

const router = Router();
const controller = new EnrollmentController();

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/student/:studentId', controller.getByStudent);
router.put('/:id/status', controller.updateStatus);

export default router;
