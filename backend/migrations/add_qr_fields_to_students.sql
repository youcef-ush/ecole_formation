-- Migration: Ajouter les champs QR à la table students
-- Tâche 5: Support du système de badges QR pour les étudiants
-- Date: 2025-11-10

-- 1. Ajouter la colonne badgeQrCode (unique)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "badgeQrCode" VARCHAR(255) UNIQUE;

-- 2. Ajouter la colonne badgeExpiry (date d'expiration du badge)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "badgeExpiry" DATE;

-- 3. Ajouter la colonne isActive (statut actif/inactif)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- 4. Ajouter la colonne emergencyContact (contact d'urgence)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "emergencyContact" VARCHAR(255);

-- 5. Ajouter la colonne schoolLevel (niveau scolaire)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "schoolLevel" VARCHAR(100);

-- 6. Mettre à jour les étudiants existants (isActive = true par défaut)
UPDATE students 
SET "isActive" = true 
WHERE "isActive" IS NULL;

-- 7. Créer un index sur badgeQrCode pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_students_badge_qr 
ON students("badgeQrCode");

-- 8. Créer un index sur isActive pour filtrer les étudiants actifs
CREATE INDEX IF NOT EXISTS idx_students_is_active 
ON students("isActive");

-- 9. Vérification finale
SELECT 
  COUNT(*) as total_students,
  COUNT("badgeQrCode") as students_with_badge,
  COUNT(*) - COUNT("badgeQrCode") as students_without_badge,
  SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_students
FROM students;

-- Message de succès
SELECT '✅ Migration terminée: Champs QR ajoutés à students' as status;
