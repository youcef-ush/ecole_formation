-- Migration: Add sessionId to registrations table
-- Date: 2025-11-29

-- Add sessionId column if it doesn't exist
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "sessionId" INTEGER;

-- Add foreign key constraint to sessions table (drop first if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_registrations_session') THEN
        ALTER TABLE registrations
        ADD CONSTRAINT "FK_registrations_session"
        FOREIGN KEY ("sessionId") REFERENCES sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add studentId column if it doesn't exist (for validated registrations)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "studentId" INTEGER;

-- Add foreign key constraint to students table (drop first if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_registrations_student') THEN
        ALTER TABLE registrations
        ADD CONSTRAINT "FK_registrations_student"
        FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE SET NULL;
    END IF;
END $$;

SELECT '✅ Migration terminée: Colonnes sessionId et studentId ajoutées à registrations' as status;
