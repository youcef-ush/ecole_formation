-- Migration: Ajouter courseId à la table enrollments
-- Description: Permet aux enrollments d'être liés directement à une formation plutôt qu'obligatoirement à une session
-- Date: 2025-11-08

-- 1. Ajouter la colonne courseId (nullable temporairement pour migration)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS "courseId" INTEGER;

-- 2. Remplir courseId à partir des sessions existantes
UPDATE enrollments 
SET "courseId" = sessions."courseId"
FROM sessions
WHERE enrollments."sessionId" = sessions.id
AND enrollments."courseId" IS NULL;

-- 3. Rendre courseId NOT NULL après avoir rempli les données
ALTER TABLE enrollments ALTER COLUMN "courseId" SET NOT NULL;

-- 4. Rendre sessionId nullable (optionnel maintenant)
ALTER TABLE enrollments ALTER COLUMN "sessionId" DROP NOT NULL;

-- 5. Ajouter la contrainte de clé étrangère
ALTER TABLE enrollments 
ADD CONSTRAINT "FK_enrollments_course" 
FOREIGN KEY ("courseId") 
REFERENCES courses(id) 
ON DELETE CASCADE;

-- 6. Modifier la contrainte unique pour éviter les doublons (étudiant + formation)
-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS "UQ_student_session";

-- Ajouter la nouvelle contrainte unique sur studentId + courseId
ALTER TABLE enrollments 
ADD CONSTRAINT "UQ_student_course" 
UNIQUE ("studentId", "courseId");

-- Note: sessionId devient optionnel, permettant des affectations directes à une formation
-- sans session spécifique
