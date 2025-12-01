-- ============================================
-- Migration: Ajouter colonne certificate à la table courses
-- Date: 10 Novembre 2025
-- ============================================

-- Créer l'ENUM pour les certificats
DO $$ BEGIN
    CREATE TYPE course_certificate AS ENUM ('Certificat école', 'CQP', 'Diplôme État', 'Aucun');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Le type course_certificate existe déjà';
END $$;

-- Ajouter la colonne certificate
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS certificate course_certificate DEFAULT 'Certificat école';

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name = 'certificate';
