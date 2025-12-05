-- Migration: Add notes to registrations table
-- Date: 2025-11-29

-- Add notes column if it doesn't exist
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

SELECT '✅ Migration terminée: Colonne notes ajoutée à registrations' as status;
