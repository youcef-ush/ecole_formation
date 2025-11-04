# 🏗️ Architecture Technique - École de Formation V1

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [Base de Données](#base-de-données)
6. [Sécurité](#sécurité)
7. [Déploiement](#déploiement)

---

## Vue d'ensemble

### Principes Architecturaux

- **Séparation Frontend/Backend** : Architecture découplée
- **API REST** : Communication via HTTP/JSON
- **TypeScript** : Type safety sur toute la stack
- **Modulaire** : Composants réutilisables et extensibles

### Stack Technologique

```
┌─────────────────┐
│    Frontend     │  React + TypeScript
│   (Port 5173)   │  Vite, MUI, React Query
└────────┬────────┘
         │ HTTP/REST
         │ JSON
┌────────▼────────┐
│     Backend     │  Node.js + Express + TypeScript
│   (Port 3000)   │  TypeORM, JWT
└────────┬────────┘
         │ SQL
┌────────▼────────┐
│   PostgreSQL    │  Base de données relationnelle
│   (Port 5432)   │
└─────────────────┘
```

---

## Architecture Globale

### Schéma de l'Architecture

```
┌──────────────────────────────────────────────────┐
│                   UTILISATEUR                     │
│             (Navigateur Web)                      │
└─────────────────┬────────────────────────────────┘
                  │ HTTPS
┌─────────────────▼────────────────────────────────┐
│               FRONTEND (React)                    │
│  ┌──────────────────────────────────────────┐   │
│  │  Components  │  Pages  │  Services       │   │
│  │  ─────────────────────────────────────   │   │
│  │  - Dashboard │  Auth   │  API Client     │   │
│  │  - Tables    │  Admin  │  React Query    │   │
│  │  - Forms     │  ...    │  Axios          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼────────────────────────────────┐
│            BACKEND (Node.js/Express)              │
│  ┌──────────────────────────────────────────┐   │
│  │  Routes  │  Controllers  │  Middleware   │   │
│  │  ────────────────────────────────────    │   │
│  │  Auth    │  Business     │  Auth JWT     │   │
│  │  Users   │  Logic        │  Validation   │   │
│  │  ...     │               │  Error        │   │
│  └─────────────────┬────────────────────────┘   │
└────────────────────┼────────────────────────────┘
                     │ TypeORM
┌────────────────────▼────────────────────────────┐
│              BASE DE DONNÉES                      │
│              (PostgreSQL)                         │
│  ┌──────────────────────────────────────────┐   │
│  │  Tables: users, students, trainers,      │   │
│  │  courses, sessions, enrollments,         │   │
│  │  payments, etc.                          │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Frontend

### Technologies

- **React** 18.2+ : Bibliothèque UI
- **TypeScript** 5+ : Typage statique
- **Vite** : Build tool rapide
- **Material-UI (MUI)** : Bibliothèque de composants
- **React Router** 6+ : Routing
- **React Query** : Gestion du cache et des requêtes
- **Axios** : Client HTTP
- **Formik + Yup** : Gestion des formulaires et validation

### Structure des Dossiers

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── common/          # Boutons, inputs, etc.
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   └── specific/        # Composants métier
│   │
│   ├── pages/               # Pages principales
│   │   ├── Dashboard/       # Page d'accueil
│   │   ├── Students/        # Gestion étudiants
│   │   ├── Trainers/        # Gestion formateurs
│   │   ├── Courses/         # Catalogue formations
│   │   ├── Sessions/        # Sessions
│   │   ├── Enrollments/     # Inscriptions
│   │   └── Auth/            # Login, Register
│   │
│   ├── services/            # Appels API
│   │   ├── api.ts           # Configuration Axios
│   │   ├── auth.service.ts
│   │   ├── students.service.ts
│   │   └── ...
│   │
│   ├── hooks/               # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   └── ...
│   │
│   ├── types/               # Types TypeScript
│   │   ├── user.types.ts
│   │   ├── student.types.ts
│   │   └── ...
│   │
│   ├── utils/               # Utilitaires
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── styles/              # Styles globaux
│   ├── App.tsx              # Composant principal
│   ├── main.tsx             # Point d'entrée
│   └── vite-env.d.ts
│
├── public/                  # Assets statiques
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env
```

### Flux de Données

```
User Action → Component → Service (API Call) → Backend
     ↑                                              ↓
     └──────────── React Query Cache ←──────────────┘
```

### Exemple de Composant

```typescript
// src/pages/Students/StudentList.tsx
import { useQuery } from 'react-query';
import { getStudents } from '@/services/students.service';

export const StudentList = () => {
  const { data, isLoading, error } = useQuery('students', getStudents);

  if (isLoading) return <Loader />;
  if (error) return <Error message={error.message} />;

  return (
    <Table>
      {data.map(student => (
        <StudentRow key={student.id} student={student} />
      ))}
    </Table>
  );
};
```

---

## Backend

### Technologies

- **Node.js** 18+ : Runtime JavaScript
- **Express** 4+ : Framework web
- **TypeScript** 5+ : Typage statique
- **TypeORM** 0.3+ : ORM
- **PostgreSQL** 14+ : Base de données
- **JWT** : Authentification
- **Bcrypt** : Hashage des mots de passe
- **Class Validator** : Validation des DTOs

### Structure des Dossiers

```
backend/
├── src/
│   ├── entities/            # Modèles TypeORM
│   │   ├── User.entity.ts
│   │   ├── Student.entity.ts
│   │   ├── Trainer.entity.ts
│   │   ├── Course.entity.ts
│   │   ├── Session.entity.ts
│   │   ├── Enrollment.entity.ts
│   │   └── Payment.entity.ts
│   │
│   ├── routes/              # Routes Express
│   │   ├── auth.routes.ts
│   │   ├── students.routes.ts
│   │   ├── trainers.routes.ts
│   │   ├── courses.routes.ts
│   │   ├── sessions.routes.ts
│   │   └── enrollments.routes.ts
│   │
│   ├── controllers/         # Logique métier
│   │   ├── auth.controller.ts
│   │   ├── students.controller.ts
│   │   └── ...
│   │
│   ├── services/            # Services métier
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── ...
│   │
│   ├── middleware/          # Middleware Express
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── dto/                 # Data Transfer Objects
│   │   ├── create-student.dto.ts
│   │   ├── update-student.dto.ts
│   │   └── ...
│   │
│   ├── utils/               # Utilitaires
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── validators.ts
│   │
│   ├── config/              # Configuration
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   │
│   ├── migrations/          # Migrations de BDD
│   ├── app.ts               # Configuration Express
│   └── server.ts            # Point d'entrée
│
├── tests/                   # Tests unitaires/intégration
├── package.json
├── tsconfig.json
└── .env
```

### API REST Endpoints

#### Authentification
```
POST   /api/auth/login       # Connexion
POST   /api/auth/register    # Inscription (admin uniquement)
POST   /api/auth/refresh     # Renouveler le token
GET    /api/auth/me          # Profil utilisateur connecté
```

#### Étudiants
```
GET    /api/students         # Liste des étudiants
GET    /api/students/:id     # Détails d'un étudiant
POST   /api/students         # Créer un étudiant
PUT    /api/students/:id     # Modifier un étudiant
DELETE /api/students/:id     # Supprimer un étudiant
```

#### Formateurs
```
GET    /api/trainers         # Liste des formateurs
GET    /api/trainers/:id     # Détails d'un formateur
POST   /api/trainers         # Créer un formateur
PUT    /api/trainers/:id     # Modifier un formateur
DELETE /api/trainers/:id     # Supprimer un formateur
```

#### Formations
```
GET    /api/courses          # Liste des formations
GET    /api/courses/:id      # Détails d'une formation
POST   /api/courses          # Créer une formation
PUT    /api/courses/:id      # Modifier une formation
DELETE /api/courses/:id      # Supprimer une formation
```

#### Sessions
```
GET    /api/sessions         # Liste des sessions
GET    /api/sessions/:id     # Détails d'une session
POST   /api/sessions         # Créer une session
PUT    /api/sessions/:id     # Modifier une session
DELETE /api/sessions/:id     # Supprimer une session
```

#### Inscriptions
```
GET    /api/enrollments      # Liste des inscriptions
GET    /api/enrollments/:id  # Détails d'une inscription
POST   /api/enrollments      # Créer une inscription
PUT    /api/enrollments/:id  # Modifier une inscription
DELETE /api/enrollments/:id  # Supprimer une inscription
POST   /api/enrollments/:id/pay  # Valider un paiement
```

#### Dashboard
```
GET    /api/dashboard/stats  # Statistiques générales
GET    /api/dashboard/charts # Données pour graphiques
```

### Exemple de Controller

```typescript
// src/controllers/students.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '@/config/database';
import { Student } from '@/entities/Student.entity';

export class StudentsController {
  async getAll(req: Request, res: Response) {
    const studentRepo = AppDataSource.getRepository(Student);
    const students = await studentRepo.find();
    return res.json(students);
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOneBy({ id: parseInt(id) });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    return res.json(student);
  }

  async create(req: Request, res: Response) {
    const studentRepo = AppDataSource.getRepository(Student);
    const student = studentRepo.create(req.body);
    await studentRepo.save(student);
    return res.status(201).json(student);
  }
}
```

---

## Base de Données

### Schéma Relationnel

```sql
-- Users (Utilisateurs système)
users
├── id (PK)
├── email
├── password_hash
├── role (admin, trainer, student)
├── created_at
└── updated_at

-- Students (Étudiants)
students
├── id (PK)
├── user_id (FK → users)
├── first_name
├── last_name
├── date_of_birth
├── phone
├── address
├── created_at
└── updated_at

-- Trainers (Formateurs)
trainers
├── id (PK)
├── user_id (FK → users)
├── first_name
├── last_name
├── specialties (JSON)
├── phone
├── created_at
└── updated_at

-- Courses (Formations)
courses
├── id (PK)
├── title
├── description
├── category
├── duration_hours
├── price
├── prerequisites
├── is_active
├── created_at
└── updated_at

-- Sessions (Sessions de cours)
sessions
├── id (PK)
├── course_id (FK → courses)
├── trainer_id (FK → trainers)
├── start_date
├── end_date
├── capacity
├── location
├── created_at
└── updated_at

-- Enrollments (Inscriptions)
enrollments
├── id (PK)
├── student_id (FK → students)
├── session_id (FK → sessions)
├── status (pending, paid, cancelled)
├── enrolled_at
├── created_at
└── updated_at

-- Payments (Paiements)
payments
├── id (PK)
├── enrollment_id (FK → enrollments)
├── amount
├── payment_method
├── payment_date
├── notes
├── created_at
└── updated_at
```

### Relations

```
users ──1:1── students
users ──1:1── trainers

courses ──1:N── sessions
trainers ──1:N── sessions

students ──1:N── enrollments
sessions ──1:N── enrollments

enrollments ──1:N── payments
```

---

## Sécurité

### Authentification

- **JWT (JSON Web Tokens)**
  - Token d'accès : 15 minutes de validité
  - Refresh token : 7 jours de validité
  - Stockage : HttpOnly cookies (sécurisé)

### Autorisation

- **Rôles** :
  - `admin` : Tous les droits
  - `trainer` : Lecture (ses sessions uniquement) - V2+
  - `student` : Lecture (son profil uniquement) - V3+

### Protection

- ✅ **Hashage des mots de passe** : Bcrypt avec salt
- ✅ **Validation des entrées** : Class Validator
- ✅ **Protection CSRF** : Tokens CSRF
- ✅ **Rate Limiting** : Limite de requêtes par IP
- ✅ **HTTPS** : Chiffrement des communications
- ✅ **CORS** : Configuration stricte

---

## Déploiement

### Docker

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ecole_formation
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://admin:secure_password@postgres:5432/ecole_formation
      JWT_SECRET: your_jwt_secret

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Cloud (AWS, DigitalOcean, etc.)

- **Frontend** : Vercel, Netlify, ou S3 + CloudFront
- **Backend** : EC2, Heroku, ou DigitalOcean Droplet
- **Base de données** : RDS PostgreSQL, ou Managed Database

---

**Document maintenu à jour** | **Version 1.0.0** | **Novembre 2025**
