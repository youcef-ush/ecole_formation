
import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Course } from '../entities/Course.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * GET /api/courses
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const courses = await courseRepo.find({ where: { isActive: true } });

    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/courses/:id
 */
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({
      where: { id: parseInt(req.params.id) },
      // relations: ['sessions'], // Sessions removed
    });

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/courses
 */
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);

    const courseData = {
      ...req.body,
      // Ensure defaults
      durationMonths: req.body.durationMonths || 1,
      totalPrice: req.body.totalPrice || 0,
    };

    const newCourse = courseRepo.create(courseData);
    const savedCourse = await courseRepo.save(newCourse);

    // Auto-generation logic for sessions/schedules REMOVED as it relies on deleted services/tables.
    // The new logic generates installments ON ENROLLMENT, not on course creation.

    res.status(201).json({
      success: true,
      data: savedCourse
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/courses/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({ where: { id: parseInt(req.params.id) } });

    if (!course) {
      throw new AppError('Formation non trouvée', 404);
    }

    courseRepo.merge(course, req.body);
    await courseRepo.save(course);

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

export default router;
