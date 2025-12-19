-- Migration: Update course_category to VARCHAR instead of ENUM

-- 1. Supprimer la contrainte de type enum
ALTER TABLE courses ALTER COLUMN category DROP DEFAULT;

-- 2. Convertir la colonne en VARCHAR
ALTER TABLE courses ALTER COLUMN category TYPE VARCHAR(255);

-- 3. Mettre à jour les données existantes vers les nouvelles valeurs
UPDATE courses 
SET category = CASE 
    WHEN category LIKE 'PROFESSIONAL%' THEN 'Formation professionnelle'
    WHEN category LIKE 'TUTORING%' THEN 'Soutien scolaire'
    WHEN category LIKE 'PERSONAL%' THEN 'Développement personnel'
    ELSE category
END
WHERE category IS NOT NULL;

-- 4. Supprimer l'ancien type enum s'il existe
DROP TYPE IF EXISTS course_category CASCADE;

-- 5. Ajouter un commentaire
COMMENT ON COLUMN courses.category IS 'Catégorie principale de la formation : Formation professionnelle, Soutien scolaire, ou Développement personnel';

