-- Migration: Create session_payments table (v2)
-- Date: 2025-11-29

-- 1. Create Enums if not exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('CASH', 'CHECK', 'BANK_TRANSFER', 'CARD', 'ONLINE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type_enum') THEN
        CREATE TYPE payment_type_enum AS ENUM ('REGISTRATION_FEE', 'SESSION_FEE');
    END IF;
END $$;

-- 2. Create Table without FKs first
CREATE TABLE IF NOT EXISTS session_payments (
    id SERIAL PRIMARY KEY,
    "paymentType" payment_type_enum DEFAULT 'SESSION_FEE',
    amount DECIMAL(10, 2) NOT NULL,
    "paymentMethod" payment_method_enum NOT NULL,
    "paymentDate" DATE NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "studentId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "registrationId" INTEGER
);

-- 3. Add Foreign Keys separately
DO $$ 
BEGIN
    -- Student FK
    BEGIN
        ALTER TABLE session_payments 
        ADD CONSTRAINT fk_session_payments_student 
        FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN 
        NULL;
    END;

    -- Session FK
    BEGIN
        ALTER TABLE session_payments 
        ADD CONSTRAINT fk_session_payments_session 
        FOREIGN KEY ("sessionId") REFERENCES sessions(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN 
        NULL;
    END;
END $$;

SELECT '✅ Migration terminée: Table session_payments créée (v2)' as status;
