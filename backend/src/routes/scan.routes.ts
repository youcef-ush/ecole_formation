
import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';

const router = Router();
const scanController = new ScanController();

router.post('/', scanController.scan);
router.get('/history', scanController.getHistory);

export default router;
