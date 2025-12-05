-- Migration: Fix Registration Status Enum to English
-- Date: 2025-11-29

-- 1. Remove default value
ALTER TABLE registrations ALTER COLUMN status DROP DEFAULT;

-- 2. Change column to text temporarily
ALTER TABLE registrations ALTER COLUMN status TYPE VARCHAR(255);

-- 3. Update existing values (French -> English)
UPDATE registrations SET status = 'PENDING' WHERE status = 'En attente';
UPDATE registrations SET status = 'PAID' WHERE status = 'Frais payés';
UPDATE registrations SET status = 'VALIDATED' WHERE status = 'Validée';
UPDATE registrations SET status = 'REJECTED' WHERE status = 'Refusée';

-- Ensure all statuses are valid English values (fallback for any others)
UPDATE registrations SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'PAID', 'VALIDATED', 'REJECTED');

-- 4. Drop old enum type
DROP TYPE IF EXISTS registrations_status_enum CASCADE;

-- 5. Create new enum type
CREATE TYPE registrations_status_enum AS ENUM ('PENDING', 'PAID', 'VALIDATED', 'REJECTED');

-- 6. Convert column back to enum
ALTER TABLE registrations ALTER COLUMN status TYPE registrations_status_enum USING status::registrations_status_enum;

-- 7. Restore default
ALTER TABLE registrations ALTER COLUMN status SET DEFAULT 'PENDING';

SELECT '✅ Migration terminée: Enum registrations_status_enum mis à jour en anglais' as status;
