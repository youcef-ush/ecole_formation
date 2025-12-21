-- Migration: Reconstruction complète de la base avec nouvelle architecture
-- Date: 2025-12-17
-- Description: Enrollment = formulaire inscription, Student = entité créée après paiement

-- ============================================
-- 1. SUPPRESSION DE TOUTES LES TABLES
-- ============================================
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS payment_plans CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les types ENUM s'ils existent
DROP TYPE IF EXISTS student_status CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS course_type CASCADE;
DROP TYPE IF EXISTS price_model CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS installment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================
-- 2. CRÉATION DES TYPES ENUM
-- ============================================
CREATE TYPE student_status AS ENUM ('PENDING', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE course_type AS ENUM ('ABONNEMENT', 'PACK_HEURES');
CREATE TYPE price_model AS ENUM ('MONTHLY', 'GLOBAL');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'CHECK', 'TRANSFER');
CREATE TYPE payment_type AS ENUM ('REGISTRATION', 'INSTALLMENT', 'SESSION');
CREATE TYPE installment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');

-- ============================================
-- 3. CRÉATION DES TABLES
-- ============================================

-- Table: users (Admin/Staff)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'STAFF',
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: trainers (Formateurs)
CREATE TABLE trainers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: courses (Formations)
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  trainer_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
  type course_type DEFAULT 'ABONNEMENT',
  price_model price_model DEFAULT 'MONTHLY',
  duration_months INTEGER,
  total_hours INTEGER,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: enrollments (Inscriptions - formulaire initial, ISOLÉE)
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  course_id INTEGER,  -- Simple info, pas de FK
  course_title VARCHAR(255),
  registration_fee DECIMAL(10, 2) DEFAULT 0,
  is_registration_fee_paid BOOLEAN DEFAULT FALSE,
  registration_fee_paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: students (Étudiants - ENTITÉ CENTRALE créée après paiement)
-- Note: payment_plan_id sera ajouté après création de payment_plans
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  badge_qr_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  status student_status DEFAULT 'ACTIVE',
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_plan_id INTEGER,  -- FK sera ajoutée après
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: payment_plans (Plans de paiement)
CREATE TABLE payment_plans (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  number_of_installments INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter FK payment_plan_id après création de payment_plans
ALTER TABLE students 
ADD CONSTRAINT fk_students_payment_plan 
FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE SET NULL;

-- Table: installments (Échéances)
CREATE TABLE installments (
  id SERIAL PRIMARY KEY,
  student_assignment_id INTEGER NOT NULL REFERENCES student_assignments(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMP,
  status installment_status DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments (Paiements)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method DEFAULT 'CASH',
  payment_type payment_type DEFAULT 'REGISTRATION',
  payment_date TIMESTAMP NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: access_logs (Logs de scan QR)
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  access_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CRÉATION DES INDEX
-- ============================================
CREATE INDEX idx_students_enrollment_id ON students(enrollment_id);
CREATE INDEX idx_students_qr_code ON students(qr_code);
CREATE INDEX idx_students_course_id ON students(course_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_access_logs_student_id ON access_logs(student_id);
CREATE INDEX idx_installments_payment_plan_id ON installments(payment_plan_id);
CREATE INDEX idx_courses_trainer_id ON courses(trainer_id);

-- ============================================
-- 5. DONNÉES INITIALES
-- ============================================

-- Créer un utilisateur admin par défaut
-- Mot de passe: admin123 (hashé avec bcrypt, tu devras le changer)
INSERT INTO users (username, password, role, email) 
VALUES ('admin', '$2b$10$rHzXK8qVXQ9h9fQZXRvNM.YH9vLqB3.jRgH6fGKxX7fGFZQZ3gXZK', 'ADMIN', 'admin@ecole.com');

COMMENT ON TABLE enrollments IS 'Formulaires d''inscription avant création étudiant';
COMMENT ON TABLE students IS 'Étudiants validés avec QR code (créés après paiement)';
COMMENT ON COLUMN students.enrollment_id IS 'Lien unique vers le formulaire d''inscription d''origine';
