import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'École de Formation API',
      version: '1.0.0',
      description: 'API REST pour la gestion d\'une école de formation - Gestion des étudiants, formateurs, formations, sessions et inscriptions',
      contact: {
        name: 'École de Formation',
        email: 'contact@ecole-formation.dz',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT obtenu via /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', format: 'email', example: 'admin@ecole.dz' },
            role: { type: 'string', enum: ['admin', 'trainer', 'student'], example: 'admin' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'Ahmed' },
            lastName: { type: 'string', example: 'Benali' },
            email: { type: 'string', format: 'email', example: 'ahmed@email.com' },
            phone: { type: 'string', example: '0555123456' },
            dateOfBirth: { type: 'string', format: 'date', example: '2000-01-15' },
            address: { type: 'string', example: 'Alger, Algérie' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Trainer: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'Fatima' },
            lastName: { type: 'string', example: 'Zohra' },
            email: { type: 'string', format: 'email', example: 'fatima@ecole.dz' },
            phone: { type: 'string', example: '0666789012' },
            specialties: { type: 'array', items: { type: 'string' }, example: ['JavaScript', 'React', 'Node.js'] },
            bio: { type: 'string', example: 'Formatrice expérimentée en développement web' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Développement Web Full Stack' },
            description: { type: 'string', example: 'Formation complète en développement web' },
            category: { 
              type: 'string', 
              enum: ['programming', 'design', 'business', 'marketing', 'languages', 'other'],
              example: 'programming' 
            },
            duration: { type: 'number', example: 120, description: 'Durée en heures' },
            price: { type: 'number', example: 50000, description: 'Prix en DA' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            courseId: { type: 'number', example: 1 },
            trainerId: { type: 'number', example: 1 },
            startDate: { type: 'string', format: 'date-time', example: '2025-12-01T09:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2025-12-31T17:00:00Z' },
            capacity: { type: 'number', example: 20 },
            status: { 
              type: 'string', 
              enum: ['planned', 'ongoing', 'completed', 'cancelled'],
              example: 'planned' 
            },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            studentId: { type: 'number', example: 1 },
            sessionId: { type: 'number', example: 1 },
            enrollmentDate: { type: 'string', format: 'date-time' },
            status: { 
              type: 'string', 
              enum: ['pending', 'paid', 'cancelled'],
              example: 'pending' 
            },
            totalAmount: { type: 'number', example: 50000 },
            paidAmount: { type: 'number', example: 0 },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            enrollmentId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 25000 },
            paymentDate: { type: 'string', format: 'date-time' },
            paymentMethod: { 
              type: 'string', 
              enum: ['cash', 'check', 'transfer', 'card'],
              example: 'cash' 
            },
            notes: { type: 'string', example: 'Premier versement' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@ecole.dz' },
            password: { type: 'string', format: 'password', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalStudents: { type: 'number', example: 150 },
            totalTrainers: { type: 'number', example: 25 },
            totalCourses: { type: 'number', example: 30 },
            totalRevenue: { type: 'number', example: 5000000 },
            activeEnrollments: { type: 'number', example: 45 },
            upcomingSessions: { type: 'number', example: 8 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Une erreur est survenue' },
            statusCode: { type: 'number', example: 400 },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
