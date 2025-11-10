-- Ajouter le champ enrolledCount à la table sessions
-- Date: 2025-11-10

-- Ajouter la colonne si elle n'existe pas déjà
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "enrolledCount" integer DEFAULT 0;

-- Mettre à jour le compteur pour les sessions existantes
UPDATE sessions s
SET "enrolledCount" = (
  SELECT COUNT(*)
  FROM enrollments e
  WHERE e."sessionId" = s.id
);

-- Vérifier les résultats
SELECT id, capacity, "enrolledCount", (capacity - "enrolledCount") as "placesDisponibles"
FROM sessions
ORDER BY id;
