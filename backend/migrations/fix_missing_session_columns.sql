
-- Migration: Fix missing columns in sessions table
-- Date: 2025-11-27

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "startTime" TIME,
ADD COLUMN IF NOT EXISTS "endTime" TIME;

SELECT '✅ Migration terminée: Colonnes startTime et endTime ajoutées à sessions' as status;
