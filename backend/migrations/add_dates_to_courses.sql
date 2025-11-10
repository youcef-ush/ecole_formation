-- Migration: Ajouter startDate et endDate à la table courses
-- Date: 2025-11-10
-- Raison: Nécessaire pour SessionGeneratorService et PaymentScheduleService

-- 1. Ajouter la colonne startDate
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS "startDate" DATE;

-- 2. Ajouter la colonne endDate
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS "endDate" DATE;

-- 3. Créer un index sur startDate pour les recherches
CREATE INDEX IF NOT EXISTS idx_courses_start_date 
ON courses("startDate");

-- 4. Créer un index sur endDate
CREATE INDEX IF NOT EXISTS idx_courses_end_date 
ON courses("endDate");

-- 5. Créer un index composé pour les recherches par période
CREATE INDEX IF NOT EXISTS idx_courses_dates 
ON courses("startDate", "endDate");

-- 6. Vérification finale
SELECT 
  COUNT(*) as total_courses,
  COUNT("startDate") as courses_with_start_date,
  COUNT("endDate") as courses_with_end_date,
  COUNT(*) - COUNT("startDate") as courses_without_dates
FROM courses;

-- Message de succès
SELECT '✅ Migration terminée: startDate et endDate ajoutés à courses' as status;
