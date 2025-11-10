-- Migration: Ajouter les champs QR à la table sessions
-- Tâche 6: Support du système de QR code pour les sessions
-- Date: 2025-11-10

-- 1. Ajouter la colonne sessionQrCode (unique)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "sessionQrCode" VARCHAR(255) UNIQUE;

-- 2. Ajouter la colonne qrExpiresAt (date d'expiration du QR)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "qrExpiresAt" TIMESTAMP;

-- 3. Ajouter la colonne currentAttendance (nombre de présents)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "currentAttendance" INTEGER DEFAULT 0;

-- 4. Ajouter la colonne isActive (session active/inactive)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- 5. Mettre à jour les sessions existantes
UPDATE sessions 
SET 
  "currentAttendance" = 0,
  "isActive" = true
WHERE "currentAttendance" IS NULL OR "isActive" IS NULL;

-- 6. Créer un index sur sessionQrCode pour optimiser les scans
CREATE INDEX IF NOT EXISTS idx_sessions_qr_code 
ON sessions("sessionQrCode");

-- 7. Créer un index sur isActive pour filtrer les sessions actives
CREATE INDEX IF NOT EXISTS idx_sessions_is_active 
ON sessions("isActive");

-- 8. Créer un index composé pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_sessions_active_course 
ON sessions("isActive", "courseId", "startDate");

-- 9. Vérification finale
SELECT 
  COUNT(*) as total_sessions,
  COUNT("sessionQrCode") as sessions_with_qr,
  COUNT(*) - COUNT("sessionQrCode") as sessions_without_qr,
  SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_sessions,
  SUM("currentAttendance") as total_attendance
FROM sessions;

-- Message de succès
SELECT '✅ Migration terminée: Champs QR ajoutés à sessions' as status;
