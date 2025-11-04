import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Room } from '../entities/Room.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/rooms - Récupérer toutes les salles
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const roomRepo = AppDataSource.getRepository(Room);
    const rooms = await roomRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
});

// GET /api/rooms/:id - Récupérer une salle par ID
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['sessions'],
    });

    if (!room) {
      throw new AppError('Salle non trouvée', 404);
    }

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

// POST /api/rooms - Créer une nouvelle salle
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const roomRepo = AppDataSource.getRepository(Room);

    // Vérifier si une salle avec le même nom existe déjà
    const existingRoom = await roomRepo.findOne({
      where: { name: req.body.name },
    });

    if (existingRoom) {
      throw new AppError('Une salle avec ce nom existe déjà', 400);
    }

    const room = roomRepo.create(req.body);
    await roomRepo.save(room);

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

// PUT /api/rooms/:id - Mettre à jour une salle
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!room) {
      throw new AppError('Salle non trouvée', 404);
    }

    // Vérifier si le nouveau nom existe déjà (si modifié)
    if (req.body.name && req.body.name !== room.name) {
      const existingRoom = await roomRepo.findOne({
        where: { name: req.body.name },
      });

      if (existingRoom) {
        throw new AppError('Une salle avec ce nom existe déjà', 400);
      }
    }

    roomRepo.merge(room, req.body);
    await roomRepo.save(room);

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rooms/:id - Supprimer une salle
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['sessions'],
    });

    if (!room) {
      throw new AppError('Salle non trouvée', 404);
    }

    // Vérifier qu'aucune session active n'utilise cette salle
    const activeSessions = room.sessions?.filter(
      (s) => s.status === 'À venir' || s.status === 'En cours'
    );

    if (activeSessions && activeSessions.length > 0) {
      throw new AppError(
        'Impossible de supprimer cette salle car elle est utilisée par des sessions actives',
        400
      );
    }

    await roomRepo.remove(room);

    res.json({ success: true, message: 'Salle supprimée avec succès' });
  } catch (error) {
    next(error);
  }
});

// GET /api/rooms/:id/availability - Vérifier la disponibilité d'une salle
router.get('/:id/availability', async (req: AuthRequest, res: Response, next) => {
  try {
    const { date, timeSlotId } = req.query;

    if (!date || !timeSlotId) {
      throw new AppError('Date et créneau requis', 400);
    }

    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['sessions', 'sessions.timeSlot'],
    });

    if (!room) {
      throw new AppError('Salle non trouvée', 404);
    }

    // Vérifier si une session existe déjà pour cette date et ce créneau
    const existingSession = room.sessions?.find(
      (s) =>
        s.startDate.toString() === date &&
        s.timeSlotId === parseInt(timeSlotId as string) &&
        s.status !== 'Annulée'
    );

    res.json({
      success: true,
      data: {
        available: !existingSession,
        message: existingSession
          ? 'Créneau non disponible pour cette salle'
          : 'Créneau disponible',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
