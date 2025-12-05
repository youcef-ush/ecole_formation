-- Migration: Add ALL missing columns to installment_payments table
-- Date: 2025-11-29

-- Add installmentNumber column
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "installmentNumber" INTEGER;

-- Add amount column
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "amount" DECIMAL(10, 2);

-- Add dueDate column
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "dueDate" DATE;

-- Add paymentDate column
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "paymentDate" DATE;

-- Add paymentMethod column
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(255);

-- Add status column (enum or text)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_payment_status_enum') THEN
        CREATE TYPE installment_payment_status_enum AS ENUM ('PENDING', 'PAID', 'OVERDUE');
    END IF;
END $$;

ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS "status" installment_payment_status_enum DEFAULT 'PENDING';

SELECT '✅ Migration terminée: Toutes les colonnes manquantes ajoutées à installment_payments' as status;
