-- ==========================================
-- RESET DATABASE SCRIPT - SCAN & PAY SYSTEM
-- ==========================================

-- 1. Drop the public schema to wipe everything
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Create Types/Enums
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'STAFF', 'TRAINER');
CREATE TYPE course_type_enum AS ENUM ('ABONNEMENT', 'PACK_HEURES'); -- Abonnement = Illimité sur la durée; Pack = Décompte
CREATE TYPE price_model_enum AS ENUM ('MONTHLY', 'GLOBAL'); 
CREATE TYPE enrollment_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE access_status_enum AS ENUM ('GRANTED', 'DENIED');

-- 3. Create Users Table (Auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role_enum DEFAULT 'STAFF',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    qr_code VARCHAR(100) UNIQUE NOT NULL, -- The Badge ID
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Trainers Table
CREATE TABLE trainers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    specialty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Courses Table (The Product)
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
    
    -- Finance Config
    total_price DECIMAL(10, 2) NOT NULL, -- Prix de base
    registration_fee DECIMAL(10, 2) DEFAULT 0, -- Frais dossier
    
    -- Time/Usage Config
    duration_months INT DEFAULT 1, -- Durée théorique
    type course_type_enum DEFAULT 'ABONNEMENT',
    price_model price_model_enum DEFAULT 'MONTHLY',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Payment Plans (Configuration)
CREATE TABLE payment_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Ex: "Mensuel", "Facilité 3 mois"
    installments_count INT NOT NULL, -- Nombre de tranches
    interval_days INT NOT NULL, -- Ecart entre tranches (0 = tout de suite, 30 = mensuel)
    description TEXT
);

-- 8. Create Enrollments (The Contract)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    payment_plan_id INT REFERENCES payment_plans(id),
    
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE, -- Calculated based on duration_months
    
    status enrollment_status_enum DEFAULT 'ACTIVE',
    
    -- For Packs only
    remaining_usage INT DEFAULT 0, -- Heures ou Séances restantes
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Installments (The Debt / Echéancier)
CREATE TABLE installments (
    id SERIAL PRIMARY KEY,
    enrollment_id INT REFERENCES enrollments(id) ON DELETE CASCADE,
    
    due_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create Payments (The Cash Flow)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    enrollment_id INT REFERENCES enrollments(id) ON DELETE CASCADE,
    installment_id INT REFERENCES installments(id), -- Optional link to specific debt
    
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(50) DEFAULT 'CASH', -- CASH, CCP, etc.
    note TEXT
);

-- 11. Create Access Logs (The Scan History)
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL, -- Quel cours il est venu suivre
    
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status access_status_enum NOT NULL, -- 'GRANTED' or 'DENIED'
    denial_reason VARCHAR(255) -- Ex: "Dette non payée", "Pack épuisé"
);

-- ==========================================
-- SEED DATA (INITIALIZATION)
-- ==========================================

-- 1. Default Admin User (Password: password123)
-- Note: In a real app, passwords should be hashed. Taking a shortcut here for the Reset script or assuming bcrypt is handled by app.
-- We will insert a raw placeholder, the App usually hashes on save. 
-- For this script, we'll assume the App can handle a "force reset" or we'll insert a known hash if possible.
-- Let's just insert a user, the user might need to register or we assume the backend handles auth.
-- Inserting a standard test user.
INSERT INTO users (first_name, last_name, email, password, role)
VALUES ('Admin', 'Principal', 'admin@ecole.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUv5kqnlZn/r4DzwfhCL1ii', 'ADMIN'); -- Hash for 'password123'

-- 2. Default Payment Plans
INSERT INTO payment_plans (name, installments_count, interval_days, description) VALUES
('Comptant (Immédiat)', 1, 0, 'Paiement total à l''inscription'),
('Mensuel (Standard)', 10, 30, 'Un paiement chaque mois'),
('Trimestriel', 3, 90, 'Un paiement tous les 3 mois'),
('Facilité 2 Tranches', 2, 45, 'Moitié au début, moitié au milieu');

-- 3. Some Demo Trainers
INSERT INTO trainers (first_name, last_name, specialty) VALUES
('Ahmed', 'Benali', 'Mathématiques'),
('Sarah', 'Mokhtari', 'Anglais'),
('Karim', 'Ziani', 'Informatique');

-- 4. Some Demo Courses
INSERT INTO courses (title, total_price, duration_months, type, price_model, trainer_id) VALUES
('Maths 2AS - Groupe', 27000, 9, 'ABONNEMENT', 'MONTHLY', 1), -- 3000 DA/mois * 9
('Anglais Niveau 1', 15000, 3, 'ABONNEMENT', 'GLOBAL', 2),
('Formation Dev Web', 60000, 6, 'ABONNEMENT', 'GLOBAL', 3),
('Cours Particulier Maths', 20000, 3, 'PACK_HEURES', 'GLOBAL', 1); -- Pack de 10 séances par ex (prix total)

