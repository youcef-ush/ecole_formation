-- Migration: Fix missing columns in enrollments table
-- Date: 2025-11-29

-- Add enrolledAt column if it doesn't exist
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS "enrolledAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt column if it doesn't exist
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have proper timestamps
UPDATE enrollments 
SET "enrolledAt" = COALESCE("enrolledAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "enrolledAt" IS NULL OR "updatedAt" IS NULL;

SELECT '✅ Migration terminée: Colonnes enrolledAt et updatedAt ajoutées à enrollments' as status;
