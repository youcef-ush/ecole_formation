import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { TimeSlot } from '../entities/TimeSlot.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/time-slots - Récupérer tous les créneaux
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
    const timeSlots = await timeSlotRepo.find({
      where: { isActive: true },
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });

    res.json({ success: true, data: timeSlots });
  } catch (error) {
    next(error);
  }
});

// GET /api/time-slots/:id - Récupérer un créneau par ID
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
    const timeSlot = await timeSlotRepo.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!timeSlot) {
      throw new AppError('Créneau non trouvé', 404);
    }

    res.json({ success: true, data: timeSlot });
  } catch (error) {
    next(error);
  }
});

// POST /api/time-slots - Créer un nouveau créneau
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);

    // Validation des heures
    const { dayOfWeek, startTime, endTime } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      throw new AppError('Jour, heure de début et heure de fin requis', 400);
    }

    // Vérifier que l'heure de fin est après l'heure de début
    if (startTime >= endTime) {
      throw new AppError("L'heure de fin doit être après l'heure de début", 400);
    }

    // Vérifier si un créneau identique existe déjà
    const existingSlot = await timeSlotRepo.findOne({
      where: {
        dayOfWeek,
        startTime,
        endTime,
      },
    });

    if (existingSlot) {
      throw new AppError('Un créneau identique existe déjà', 400);
    }

    const timeSlot = timeSlotRepo.create(req.body);
    await timeSlotRepo.save(timeSlot);

    res.status(201).json({ success: true, data: timeSlot });
  } catch (error) {
    next(error);
  }
});

// PUT /api/time-slots/:id - Mettre à jour un créneau
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
    const timeSlot = await timeSlotRepo.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!timeSlot) {
      throw new AppError('Créneau non trouvé', 404);
    }

    // Validation des heures si modifiées
    const { startTime, endTime } = req.body;
    if (startTime && endTime && startTime >= endTime) {
      throw new AppError("L'heure de fin doit être après l'heure de début", 400);
    }

    timeSlotRepo.merge(timeSlot, req.body);
    await timeSlotRepo.save(timeSlot);

    res.json({ success: true, data: timeSlot });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/time-slots/:id - Supprimer un créneau
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
    const timeSlot = await timeSlotRepo.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!timeSlot) {
      throw new AppError('Créneau non trouvé', 404);
    }

    await timeSlotRepo.remove(timeSlot);

    res.json({ success: true, message: 'Créneau supprimé avec succès' });
  } catch (error) {
    next(error);
  }
});

// GET /api/time-slots/available/by-room/:roomId - Créneaux disponibles pour une salle et une date
router.get('/available/by-room/:roomId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      throw new AppError('Date requise', 400);
    }

    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
    const allSlots = await timeSlotRepo.find({ where: { isActive: true } });

    // TODO: Filtrer les créneaux déjà occupés pour cette salle et cette date
    // Cela nécessiterait de vérifier les sessions existantes

    res.json({ success: true, data: allSlots });
  } catch (error) {
    next(error);
  }
});

export default router;
