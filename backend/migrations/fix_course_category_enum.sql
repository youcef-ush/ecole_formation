-- Migration: Corriger l'ENUM course_category avec les bonnes valeurs
-- Date: 2025-11-10
-- Description: Remplacer les valeurs anglaises par les valeurs françaises

-- Étape 1: Créer un nouvel ENUM avec les bonnes valeurs
DROP TYPE IF EXISTS course_category_new CASCADE;
CREATE TYPE course_category_new AS ENUM (
    'Soutien scolaire',
    'Formation professionnelle',
    'Développement personnel',
    'Langues',
    'Cuisine',
    'Couture',
    'Informatique',
    'Autre'
);

-- Étape 2: Convertir la colonne category pour utiliser le nouveau type
-- D'abord, convertir en TEXT
ALTER TABLE courses ALTER COLUMN category TYPE TEXT;

-- Étape 3: Mettre à jour les valeurs existantes (si elles existent)
UPDATE courses SET category = 'Soutien scolaire' WHERE category = 'academics';
UPDATE courses SET category = 'Formation professionnelle' WHERE category = 'professional';
UPDATE courses SET category = 'Langues' WHERE category = 'languages';
UPDATE courses SET category = 'Autre' WHERE category = 'arts';

-- Étape 4: Supprimer l'ancien ENUM et renommer le nouveau
DROP TYPE IF EXISTS course_category CASCADE;
ALTER TYPE course_category_new RENAME TO course_category;

-- Étape 5: Convertir la colonne pour utiliser le nouvel ENUM
ALTER TABLE courses 
  ALTER COLUMN category TYPE course_category 
  USING category::course_category;

-- Vérifier les valeurs de l'ENUM
SELECT unnest(enum_range(NULL::course_category)) AS valeur;
