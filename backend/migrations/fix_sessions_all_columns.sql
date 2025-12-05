-- Migration: Add ALL missing columns to sessions table
-- Date: 2025-11-29

-- Add capacity column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "capacity" INTEGER DEFAULT 20;

-- Add enrolledCount column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "enrolledCount" INTEGER DEFAULT 0;

-- Add location column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "location" VARCHAR(255);

-- Add price column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "price" DECIMAL(10, 2);

-- Add status column (enum or text)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sessions_status_enum') THEN
        CREATE TYPE sessions_status_enum AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "status" sessions_status_enum DEFAULT 'UPCOMING';

-- Add notes column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add sessionQrCode column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "sessionQrCode" VARCHAR(255);

-- Add qrExpiresAt column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "qrExpiresAt" TIMESTAMP;

-- Add currentAttendance column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "currentAttendance" INTEGER DEFAULT 0;

-- Add isActive column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Add monthLabel column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "monthLabel" VARCHAR(50);

-- Add year column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "year" INTEGER;

-- Add month column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "month" INTEGER;

-- Add daysOfWeek column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "daysOfWeek" VARCHAR(255);

SELECT '✅ Migration terminée: Toutes les colonnes manquantes ajoutées à sessions' as status;
