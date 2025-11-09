-- Mise à jour de l'enum courses_type_enum pour accepter les nouvelles valeurs
-- Date: 2025-11-09

-- 1. Ajouter les nouvelles valeurs à l'enum
ALTER TYPE courses_type_enum ADD VALUE IF NOT EXISTS 'TUTORING_GROUP';
ALTER TYPE courses_type_enum ADD VALUE IF NOT EXISTS 'TUTORING_INDIVIDUAL';
ALTER TYPE courses_type_enum ADD VALUE IF NOT EXISTS 'QUALIFYING';

-- 2. Mettre à jour les enregistrements existants (si nécessaire)
UPDATE courses 
SET type = 'TUTORING_GROUP' 
WHERE type = 'Soutien Scolaire (Groupe)';

UPDATE courses 
SET type = 'TUTORING_INDIVIDUAL' 
WHERE type = 'Soutien Scolaire (Individuel)';

UPDATE courses 
SET type = 'QUALIFYING' 
WHERE type = 'Formation Qualifiante';

-- 3. Vérifier les résultats
SELECT DISTINCT type FROM courses;
