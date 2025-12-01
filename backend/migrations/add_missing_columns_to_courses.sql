-- Migration: Ajouter les colonnes manquantes à la table courses
-- Date: 2025-11-10
-- Description: Ajout des colonnes durationHours, durationDescription, price, pricePerSession, 
--              prerequisites, minAge, maxStudents, practicalContent, teacherName, room, 
--              schedule, trainerId, roomId, timeSlotId

-- Ajouter durationHours
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "durationHours" INTEGER DEFAULT 0;

-- Ajouter durationDescription
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "durationDescription" VARCHAR(255);

-- Ajouter price (prix total)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "price" NUMERIC(10,2) DEFAULT 0;

-- Ajouter pricePerSession (pour cours particuliers)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "pricePerSession" NUMERIC(10,2) DEFAULT 0;

-- Ajouter prerequisites
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "prerequisites" TEXT;

-- Ajouter minAge
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "minAge" INTEGER;

-- Ajouter maxStudents
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "maxStudents" INTEGER;

-- Ajouter practicalContent
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "practicalContent" TEXT;

-- Ajouter teacherName (legacy)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "teacherName" VARCHAR(255);

-- Ajouter room (legacy)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "room" VARCHAR(255);

-- Ajouter schedule (legacy)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "schedule" TEXT;

-- Ajouter trainerId (relation vers trainers)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "trainerId" INTEGER;

-- Ajouter roomId (relation vers rooms)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "roomId" INTEGER;

-- Ajouter timeSlotId (relation vers time_slots)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "timeSlotId" INTEGER;

-- Ajouter les contraintes de clés étrangères
ALTER TABLE courses 
  DROP CONSTRAINT IF EXISTS "courses_trainerId_fkey";

ALTER TABLE courses 
  ADD CONSTRAINT "courses_trainerId_fkey" 
  FOREIGN KEY ("trainerId") 
  REFERENCES trainers(id) 
  ON DELETE SET NULL;

ALTER TABLE courses 
  DROP CONSTRAINT IF EXISTS "courses_roomId_fkey";

ALTER TABLE courses 
  ADD CONSTRAINT "courses_roomId_fkey" 
  FOREIGN KEY ("roomId") 
  REFERENCES rooms(id) 
  ON DELETE SET NULL;

ALTER TABLE courses 
  DROP CONSTRAINT IF EXISTS "courses_timeSlotId_fkey";

ALTER TABLE courses 
  ADD CONSTRAINT "courses_timeSlotId_fkey" 
  FOREIGN KEY ("timeSlotId") 
  REFERENCES time_slots(id) 
  ON DELETE SET NULL;

-- Afficher la structure mise à jour
\d courses
