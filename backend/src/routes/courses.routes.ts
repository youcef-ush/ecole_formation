import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Course } from '../entities/Course.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/courses
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const courses = await courseRepo.find({ where: { isActive: true } });

    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['sessions'],
    });

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

// POST /api/courses
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = courseRepo.create(req.body);
    await courseRepo.save(course);

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

export default router;
