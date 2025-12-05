-- Migration: Fix Session Status Enum to English
-- Date: 2025-11-29

-- 1. Remove default value
ALTER TABLE sessions ALTER COLUMN status DROP DEFAULT;

-- 2. Change column to text temporarily
ALTER TABLE sessions ALTER COLUMN status TYPE VARCHAR(255);

-- 3. Update existing values (French -> English)
UPDATE sessions SET status = 'UPCOMING' WHERE status = 'À venir';
UPDATE sessions SET status = 'IN_PROGRESS' WHERE status = 'En cours';
UPDATE sessions SET status = 'COMPLETED' WHERE status = 'Terminée';
UPDATE sessions SET status = 'CANCELLED' WHERE status = 'Annulée';

-- Ensure all statuses are valid English values (fallback)
UPDATE sessions SET status = 'UPCOMING' WHERE status NOT IN ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- 4. Drop old enum type if it exists (or create if missing)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sessions_status_enum') THEN
        DROP TYPE sessions_status_enum CASCADE;
    END IF;
END $$;

-- 5. Create new enum type
CREATE TYPE sessions_status_enum AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- 6. Convert column back to enum
ALTER TABLE sessions ALTER COLUMN status TYPE sessions_status_enum USING status::sessions_status_enum;

-- 7. Restore default
ALTER TABLE sessions ALTER COLUMN status SET DEFAULT 'UPCOMING';

SELECT '✅ Migration terminée: Enum sessions_status_enum mis à jour en anglais' as status;
