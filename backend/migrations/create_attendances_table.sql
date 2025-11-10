-- Migration: Créer la table attendances
-- Tâche 7: Système de gestion des présences avec QR code
-- Date: 2025-11-10

-- 1. Créer l'enum pour ScanMethod
DO $$ BEGIN
    CREATE TYPE "ScanMethod" AS ENUM ('Scan QR', 'Saisie Manuelle', 'Ajout Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Créer l'enum pour AttendanceStatus
DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('Présent', 'Absent', 'Retard', 'Justifié');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Créer la table attendances
CREATE TABLE IF NOT EXISTS attendances (
  id SERIAL PRIMARY KEY,
  "scanTime" TIMESTAMP NOT NULL,
  "scanMethod" "ScanMethod" DEFAULT 'Scan QR' NOT NULL,
  status "AttendanceStatus" DEFAULT 'Présent' NOT NULL,
  note TEXT,
  "paymentValidated" BOOLEAN DEFAULT true NOT NULL,
  "paymentAlert" VARCHAR(255),
  "studentId" INTEGER NOT NULL,
  "sessionId" INTEGER NOT NULL,
  "recordedById" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Contraintes de clés étrangères
  CONSTRAINT "FK_attendances_student" FOREIGN KEY ("studentId") 
    REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT "FK_attendances_session" FOREIGN KEY ("sessionId") 
    REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT "FK_attendances_user" FOREIGN KEY ("recordedById") 
    REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_attendances_student 
ON attendances("studentId");

CREATE INDEX IF NOT EXISTS idx_attendances_session 
ON attendances("sessionId");

CREATE INDEX IF NOT EXISTS idx_attendances_scan_time 
ON attendances("scanTime");

CREATE INDEX IF NOT EXISTS idx_attendances_status 
ON attendances(status);

-- 5. Créer un index composé pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_attendances_session_student 
ON attendances("sessionId", "studentId", "scanTime");

-- 6. Créer une contrainte unique pour éviter les doublons (1 scan par étudiant par session)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendances_unique_scan 
ON attendances("sessionId", "studentId", DATE("scanTime"));

-- 7. Vérification finale
SELECT 
  COUNT(*) as total_attendances,
  COUNT(DISTINCT "studentId") as unique_students,
  COUNT(DISTINCT "sessionId") as unique_sessions
FROM attendances;

-- Message de succès
SELECT '✅ Migration terminée: Table attendances créée avec index' as status;
