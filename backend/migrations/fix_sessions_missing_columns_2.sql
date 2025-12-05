-- Migration: Add remaining missing columns to sessions table
-- Date: 2025-11-29

-- Add roomId column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "roomId" INTEGER;

-- Add timeSlotId column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "timeSlotId" INTEGER;

-- Add startTime column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "startTime" TIME;

-- Add endTime column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "endTime" TIME;

SELECT '✅ Migration terminée: Colonnes roomId, timeSlotId, startTime, endTime ajoutées à sessions' as status;
