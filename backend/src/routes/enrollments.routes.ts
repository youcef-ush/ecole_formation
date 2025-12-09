
import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';

const router = Router();
const controller = new EnrollmentController();

router.post('/', controller.create);
router.get('/student/:studentId', controller.getByStudent);

export default router;
