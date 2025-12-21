
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
import authRoutes from './routes/auth.routes';
import studentsRoutes from './routes/students.routes';
import trainersRoutes from './routes/trainers.routes';
import coursesRoutes from './routes/courses.routes';
import enrollmentsRoutes from './routes/enrollments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import paymentsRoutes from './routes/payments.routes';
import scanRoutes from './routes/scan.routes';
import paymentPlansRoutes from './routes/payment-plans.routes';
import studentPaymentPlansRoutes from './routes/student-payment-plans.routes';
import studentAssignmentsRoutes from './routes/student-assignments.routes';
import { errorHandler } from './middleware/error.middleware';
import { translateQueryParams, translateRequestBody } from './middleware/translation.middleware';

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

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Translation middleware (French <-> English enum conversion)
app.use('/api', translateQueryParams);
app.use('/api', translateRequestBody);

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
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/payment-plans', paymentPlansRoutes);
app.use('/api/student-payment-plans', studentPaymentPlansRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentAssignmentsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
