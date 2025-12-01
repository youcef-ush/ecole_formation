-- Suppression de la colonne isActive de trainers
ALTER TABLE trainers DROP COLUMN "isActive";

-- Vérification
\d trainers
