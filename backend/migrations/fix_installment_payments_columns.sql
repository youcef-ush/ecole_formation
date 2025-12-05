-- Migration: Add registrationId to installment_payments table
-- Date: 2025-11-29

-- Add registrationId column if it doesn't exist
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "registrationId" INTEGER;

-- Add foreign key constraint to registrations table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_installment_payments_registration') THEN
        ALTER TABLE installment_payments
        ADD CONSTRAINT "FK_installment_payments_registration"
        FOREIGN KEY ("registrationId") REFERENCES registrations(id) ON DELETE CASCADE;
    END IF;
END $$;

SELECT '✅ Migration terminée: Colonne registrationId ajoutée à installment_payments' as status;
