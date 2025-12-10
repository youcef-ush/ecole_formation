import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User.entity';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Identifiants invalides
 *       403:
 *         description: Compte désactivé
 */
// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new AppError('Identifiants invalides', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Identifiants invalides', 401);
    }

    if (!user.isActive) {
      throw new AppError('Compte désactivé', 403);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        accessToken: token,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@ecole.dz
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, trainer, student]
 *                 example: admin
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       409:
 *         description: Email déjà utilisé
 */
// POST /api/auth/register (Admin only - will be protected later)
router.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    const userRepo = AppDataSource.getRepository(User);

    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email déjà utilisé', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepo.create({
      email,
      password: hashedPassword,
      role: role || 'admin',
    });

    await userRepo.save(user);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
