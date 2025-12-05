-- Migration: Add ALL missing columns to registrations table
-- Date: 2025-11-29

-- Add registrationFee column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "registrationFee" DECIMAL(10, 2) DEFAULT 0;

-- Add registrationFeePaid column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "registrationFeePaid" BOOLEAN DEFAULT false;

-- Add registrationFeePaidAt column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "registrationFeePaidAt" TIMESTAMP;

-- Add paymentMethod column (using text/varchar if enum type issues exist, or cast to enum)
-- First check if enum exists, if not create it (handled in previous migrations but good to be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registrations_paymentmethod_enum') THEN
        CREATE TYPE registrations_paymentmethod_enum AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'CHECK');
    END IF;
END $$;

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "paymentMethod" registrations_paymentmethod_enum;

-- Add amountPaid column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10, 2);

-- Add isValidated column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "isValidated" BOOLEAN DEFAULT false;

-- Add validatedAt column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "validatedAt" TIMESTAMP;

-- Add validatedBy column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "validatedBy" INTEGER;

-- Add installmentPlan column (JSONB)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "installmentPlan" JSONB;

SELECT '✅ Migration terminée: Toutes les colonnes manquantes ajoutées à registrations' as status;
