
-- Migration: Fix missing columns in students table
-- Date: 2025-11-27

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "city" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "postalCode" VARCHAR(20);

SELECT '✅ Migration terminée: Colonnes city et postalCode ajoutées' as status;
