-- ============================================
-- Migration: Corriger la structure de la table trainers
-- Date: 10 Novembre 2025
-- ============================================

-- 1. Supprimer la colonne email (l'email est dans la table users)
ALTER TABLE trainers 
DROP COLUMN IF EXISTS email;

-- 2. Supprimer la colonne isActive (non utilisée dans l'entité)
ALTER TABLE trainers 
DROP COLUMN IF EXISTS isActive;

-- 3. Renommer specialty → specialties et changer le type vers JSONB
ALTER TABLE trainers 
DROP COLUMN IF EXISTS specialty;

ALTER TABLE trainers 
ADD COLUMN IF NOT EXISTS specialties JSONB;

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainers'
ORDER BY ordinal_position;
