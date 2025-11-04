import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Trainer } from '../entities/Trainer.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/trainers
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainers = await trainerRepo.find({ relations: ['user'] });

    res.json({ success: true, data: trainers });
  } catch (error) {
    next(error);
  }
});

// GET /api/trainers/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = await trainerRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['user', 'sessions', 'sessions.course'],
    });

    res.json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
});

// POST /api/trainers
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const trainer = trainerRepo.create(req.body);
    await trainerRepo.save(trainer);

    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
});

export default router;
