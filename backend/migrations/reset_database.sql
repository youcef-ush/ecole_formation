-- ============================================
-- Script de Réinitialisation Complète de la Base de Données
-- Inspired Academy by Nana
-- Date: 10 Novembre 2025
-- ============================================
-- ⚠️ ATTENTION: Ce script supprime TOUTES les données !
-- Utilisez uniquement pour les tests ou développement
-- ============================================

-- Désactiver les contraintes de clés étrangères temporairement
SET session_replication_role = 'replica';

-- ============================================
-- 1. SUPPRESSION DES TABLES DANS L'ORDRE INVERSE DES DÉPENDANCES
-- ============================================

DROP TABLE IF EXISTS attendance_reports CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS installment_payments CASCADE;
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS session_payments CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS tutoring_sessions CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 2. RECRÉATION DES TYPES ENUM
-- ============================================

-- Types pour Users
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'student', 'parent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types pour Courses
DO $$ BEGIN
    CREATE TYPE course_type AS ENUM ('QUALIFYING', 'TUTORING_GROUP', 'TUTORING_INDIVIDUAL', 'TUTORING_ONLINE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE course_category AS ENUM (
        'Soutien scolaire',
        'Formation professionnelle',
        'Développement personnel',
        'Langues',
        'Cuisine',
        'Couture',
        'Informatique',
        'Autre'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE course_certificate AS ENUM ('Certificat école', 'CQP', 'Diplôme État', 'Aucun');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types pour Enrollments
DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('paid', 'pending', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types pour Payments
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types pour Registrations
DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('En attente de validation', 'En attente de paiement', 'Validée', 'Refusée');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types pour Attendances
DO $$ BEGIN
    CREATE TYPE scan_method AS ENUM ('qr_code', 'manual', 'facial_recognition');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types pour Rooms
DO $$ BEGIN
    CREATE TYPE room_type AS ENUM ('Théorique', 'Pratique', 'Informatique', 'Atelier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. RECRÉATION DES TABLES
-- ============================================

-- Table Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Trainers
CREATE TABLE trainers (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    specialties JSONB,
    bio TEXT,
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type course_type NOT NULL,
    category course_category NOT NULL,
    certificate course_certificate DEFAULT 'Certificat école',
    "durationHours" INTEGER DEFAULT 0,
    "durationDescription" VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0,
    "pricePerSession" DECIMAL(10, 2) DEFAULT 0,
    "pricePerMonth" DECIMAL(10, 2) NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "schoolLevels" VARCHAR(255),
    "lyceeBranches" VARCHAR(255),
    "subjectModule" VARCHAR(255),
    prerequisites TEXT,
    "minAge" INTEGER,
    "maxStudents" INTEGER,
    "practicalContent" TEXT,
    "teacherName" VARCHAR(255),
    room VARCHAR(255),
    schedule TEXT,
    "trainerId" INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
    "roomId" INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    "timeSlotId" INTEGER REFERENCES time_slots(id) ON DELETE SET NULL,
    "startDate" DATE,
    "endDate" DATE,
    "isActive" BOOLEAN DEFAULT true,
    "enrollmentDeadline" DATE,
    "totalPrice" DECIMAL(10, 2),
    "firstPaymentPercentage" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type room_type DEFAULT 'Théorique',
    capacity INTEGER NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Time Slots
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    "dayOfWeek" VARCHAR(20) NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    label VARCHAR(100),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    "parentName" VARCHAR(255),
    "parentPhone" VARCHAR(20),
    "qrCode" VARCHAR(255),
    "badgeQrCode" TEXT,
    "badgeExpiry" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "emergencyContact" VARCHAR(255),
    "schoolLevel" VARCHAR(100),
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Registrations
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    "dateOfBirth" DATE,
    address TEXT,
    "parentName" VARCHAR(255),
    "parentPhone" VARCHAR(20),
    status registration_status DEFAULT 'En attente de validation',
    "rejectionReason" TEXT,
    "courseId" INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    "studentId" INTEGER REFERENCES students(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Sessions
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "monthLabel" VARCHAR(50) NOT NULL,
    "daysOfWeek" TEXT,
    "sessionQrCode" TEXT,
    "qrExpiresAt" TIMESTAMP,
    "currentAttendance" INTEGER DEFAULT 0,
    "enrolledCount" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "courseId" INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    "courseTitle" VARCHAR(255),
    "roomId" INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    "trainerId" INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
    "timeSlotId" INTEGER REFERENCES time_slots(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Tutoring Sessions
CREATE TABLE tutoring_sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "maxStudents" INTEGER,
    "currentStudents" INTEGER DEFAULT 0,
    "sessionPrice" DECIMAL(10, 2),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Planifiée',
    "courseId" INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    "roomId" INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    "trainerId" INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Enrollments
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    "enrollmentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status enrollment_status DEFAULT 'pending',
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    "paidAmount" DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    "courseId" INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    "paymentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" VARCHAR(50),
    notes TEXT,
    "enrollmentId" INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Session Payments
CREATE TABLE session_payments (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    "paymentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" VARCHAR(50),
    notes TEXT,
    "tutoringSessionId" INTEGER REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Payment Transactions
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    "transactionId" VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    "paymentMethod" VARCHAR(50),
    "transactionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    "enrollmentId" INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Payment Schedules
CREATE TABLE payment_schedules (
    id SERIAL PRIMARY KEY,
    "dueDate" DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    "paidAmount" DECIMAL(10, 2) DEFAULT 0,
    status payment_status DEFAULT 'pending',
    "paymentDate" TIMESTAMP,
    "installmentNumber" INTEGER NOT NULL,
    "totalInstallments" INTEGER NOT NULL,
    "enrollmentId" INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Installment Payments
CREATE TABLE installment_payments (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    "paymentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" VARCHAR(50),
    notes TEXT,
    "paymentScheduleId" INTEGER REFERENCES payment_schedules(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Attendances
CREATE TABLE attendances (
    id SERIAL PRIMARY KEY,
    "scanTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method scan_method DEFAULT 'qr_code',
    status attendance_status DEFAULT 'present',
    notes TEXT,
    "accessStatus" VARCHAR(50),
    "accessMessage" TEXT,
    "paymentDelayDays" INTEGER DEFAULT 0,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    "sessionId" INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    "markedById" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Attendance Reports
CREATE TABLE attendance_reports (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "totalSessions" INTEGER DEFAULT 0,
    "presentCount" INTEGER DEFAULT 0,
    "absentCount" INTEGER DEFAULT 0,
    "lateCount" INTEGER DEFAULT 0,
    "excusedCount" INTEGER DEFAULT 0,
    "attendanceRate" DECIMAL(5, 2),
    "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    "courseId" INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", "courseId", month, year)
);

-- ============================================
-- 4. CRÉATION DES INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX idx_students_user ON students("userId");
CREATE INDEX idx_trainers_user ON trainers("userId");
CREATE INDEX idx_enrollments_student ON enrollments("studentId");
CREATE INDEX idx_enrollments_course ON enrollments("courseId");
CREATE INDEX idx_sessions_course ON sessions("courseId");
CREATE INDEX idx_attendances_student ON attendances("studentId");
CREATE INDEX idx_attendances_session ON attendances("sessionId");
CREATE INDEX idx_attendances_scan_time ON attendances("scanTime");
CREATE INDEX idx_payment_schedules_enrollment ON payment_schedules("enrollmentId");
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules("dueDate");
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX idx_attendance_reports_student_course ON attendance_reports("studentId", "courseId");

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- ============================================
-- 5. MESSAGE DE CONFIRMATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Base de données réinitialisée avec succès !';
    RAISE NOTICE '📋 Toutes les tables ont été recréées';
    RAISE NOTICE '🔍 Tous les index ont été créés';
    RAISE NOTICE '⚠️  Toutes les anciennes données ont été supprimées';
END $$;
