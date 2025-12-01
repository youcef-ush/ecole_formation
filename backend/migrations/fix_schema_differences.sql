-- ============================================
-- Migration: Corriger les différences entre entités et schéma DB
-- Date: 10 Novembre 2025
-- ============================================

-- 1. Ajouter la colonne label à time_slots
ALTER TABLE time_slots 
ADD COLUMN IF NOT EXISTS label VARCHAR(100);

-- 2. Créer l'ENUM day_of_week pour normaliser dayOfWeek
DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Le type day_of_week existe déjà';
END $$;

-- Note: La conversion de VARCHAR vers ENUM nécessiterait de recréer la colonne
-- Pour l'instant, on garde VARCHAR(20) qui est compatible avec TypeORM

-- ============================================
-- Vérifications finales
-- ============================================

SELECT 'Rooms columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'rooms'
ORDER BY ordinal_position;

SELECT '' as separator;
SELECT 'TimeSlots columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'time_slots'
ORDER BY ordinal_position;
