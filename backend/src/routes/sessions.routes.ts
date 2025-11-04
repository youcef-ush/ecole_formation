import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Session } from '../entities/Session.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/sessions
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);
    const sessions = await sessionRepo.find({
      relations: ['course', 'trainer', 'enrollments'],
      order: { startDate: 'DESC' },
    });

    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = sessionRepo.create(req.body);
    await sessionRepo.save(session);

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

export default router;
