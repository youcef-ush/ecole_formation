-- Ajouter la colonne status et denial_reason à la table access_logs

-- Créer l'enum pour le statut
DO $$ BEGIN
    CREATE TYPE access_status AS ENUM ('GRANTED', 'DENIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter la colonne status (par défaut GRANTED pour les anciens enregistrements)
ALTER TABLE access_logs 
ADD COLUMN IF NOT EXISTS status access_status DEFAULT 'GRANTED';

-- Ajouter la colonne denial_reason
ALTER TABLE access_logs 
ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Retirer la valeur par défaut après avoir rempli les anciennes lignes
ALTER TABLE access_logs 
ALTER COLUMN status DROP DEFAULT;
