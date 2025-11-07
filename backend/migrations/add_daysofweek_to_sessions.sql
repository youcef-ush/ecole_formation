-- Migration pour ajouter le champ daysOfWeek aux sessions
-- Date: 2025-11-05

-- Ajouter la colonne daysOfWeek
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "daysOfWeek" VARCHAR(255) NULL;

-- Ajouter un commentaire
COMMENT ON COLUMN sessions."daysOfWeek" IS 'Jours de la semaine pour les sessions (ex: "Lundi,Mercredi,Vendredi")';

-- Exemple de mise à jour pour les sessions existantes (optionnel)
-- UPDATE sessions SET "daysOfWeek" = 'Lundi,Mercredi,Vendredi' WHERE "daysOfWeek" IS NULL;
