-- Migration: Retirer sessionId de la table enrollments
-- Tâche 10.1: Architecture Enrollment→Course (pas Enrollment→Session)
-- Date: 2025-11-10

-- 1. Supprimer la contrainte de clé étrangère si elle existe
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS "FK_enrollments_session";

-- 2. Retirer la colonne sessionId
ALTER TABLE enrollments 
DROP COLUMN IF EXISTS "sessionId";

-- 3. Rendre courseId NOT NULL (obligatoire)
-- D'abord mettre à jour les valeurs NULL si elles existent
UPDATE enrollments 
SET "courseId" = (
  SELECT id FROM courses LIMIT 1
)
WHERE "courseId" IS NULL;

-- Puis ajouter la contrainte NOT NULL
ALTER TABLE enrollments 
ALTER COLUMN "courseId" SET NOT NULL;

-- 4. Vérification finale
SELECT 
  COUNT(*) as total_enrollments,
  COUNT("courseId") as enrollments_with_course,
  COUNT(*) - COUNT("courseId") as enrollments_without_course
FROM enrollments;

-- Message de succès
SELECT '✅ Migration terminée: sessionId retiré de enrollments' as status;
