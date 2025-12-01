-- ============================================
-- Migration: Ajouter colonne 'type' à la table rooms
-- Date: 10 Novembre 2025
-- ============================================

-- Créer l'ENUM room_type s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE room_type AS ENUM ('Théorique', 'Pratique', 'Informatique', 'Atelier');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Le type room_type existe déjà';
END $$;

-- Ajouter la colonne type à la table rooms
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS type room_type DEFAULT 'Théorique';

-- Mettre à jour les contraintes
ALTER TABLE rooms 
ALTER COLUMN name SET UNIQUE;

-- Renommer la colonne equipment en description si elle existe
DO $$ BEGIN
    ALTER TABLE rooms RENAME COLUMN equipment TO description;
EXCEPTION
    WHEN undefined_column THEN 
        RAISE NOTICE 'La colonne equipment n''existe pas';
END $$;

-- Vérification
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'rooms'
ORDER BY ordinal_position;
