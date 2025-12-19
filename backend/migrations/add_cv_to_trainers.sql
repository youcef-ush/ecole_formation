-- Ajouter la colonne CV aux formateurs
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS cv_path TEXT;
