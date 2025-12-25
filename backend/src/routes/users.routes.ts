import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { User, UserRole } from '../entities/User.entity';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcrypt';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN)); // Seul l'admin peut gérer les utilisateurs

// GET /api/users - Liste tous les utilisateurs
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({
      select: ['id', 'username', 'email', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Créer un nouvel utilisateur (admin ou reception)
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { username, password, email, role } = req.body;

    // Validation
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password et role sont requis',
      });
    }

    // Vérifier que le rôle est valide (ADMIN ou RECEPTION uniquement)
    if (role !== UserRole.ADMIN && role !== UserRole.RECEPTION) {
      return res.status(400).json({
        success: false,
        message: 'Le rôle doit être ADMIN ou RECEPTION',
      });
    }

    const userRepo = AppDataSource.getRepository(User);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await userRepo.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur existe déjà',
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = userRepo.create({
      username,
      password: hashedPassword,
      email,
      role,
    });

    await userRepo.save(newUser);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userRepo = AppDataSource.getRepository(User);

    // Ne pas permettre de supprimer son propre compte
    if (req.user?.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    const user = await userRepo.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    await userRepo.remove(user);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
