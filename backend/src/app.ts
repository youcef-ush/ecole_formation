import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { initializeDatabase } from './config/database.config';
import { swaggerSpec } from './config/swagger.config';
import authRoutes from './routes/auth.routes';
import studentsRoutes from './routes/students.routes';
import trainersRoutes from './routes/trainers.routes';
import coursesRoutes from './routes/courses.routes';
import sessionsRoutes from './routes/sessions.routes';
import enrollmentsRoutes from './routes/enrollments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import roomsRoutes from './routes/rooms.routes';
import timeslotsRoutes from './routes/timeslots.routes';
import registrationsRoutes from './routes/registrations.routes';
import paymentsRoutes from './routes/payments.routes';
import financeRoutes from './routes/finance.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
});
app.use('/api', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'École de Formation API',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/time-slots', timeslotsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/finance', financeRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
