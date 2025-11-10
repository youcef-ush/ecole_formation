-- Migration: Créer la table attendance_reports
-- Tâche 8: Rapports mensuels de présence par étudiant/formation
-- Date: 2025-11-10

-- 1. Créer la table attendance_reports
CREATE TABLE IF NOT EXISTS attendance_reports (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  "monthLabel" VARCHAR(50) NOT NULL,
  "totalSessions" INTEGER DEFAULT 0 NOT NULL,
  "presentCount" INTEGER DEFAULT 0 NOT NULL,
  "absentCount" INTEGER DEFAULT 0 NOT NULL,
  "lateCount" INTEGER DEFAULT 0 NOT NULL,
  "excusedCount" INTEGER DEFAULT 0 NOT NULL,
  "attendanceRate" DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  "hasAlert" BOOLEAN DEFAULT false NOT NULL,
  "alertMessage" TEXT,
  "studentId" INTEGER NOT NULL,
  "courseId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Contraintes de clés étrangères
  CONSTRAINT "FK_attendance_reports_student" FOREIGN KEY ("studentId") 
    REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT "FK_attendance_reports_course" FOREIGN KEY ("courseId") 
    REFERENCES courses(id) ON DELETE CASCADE
);

-- 2. Créer une contrainte unique (1 rapport par étudiant/formation/mois/année)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_reports_unique 
ON attendance_reports("studentId", "courseId", month, year);

-- 3. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_attendance_reports_student 
ON attendance_reports("studentId");

CREATE INDEX IF NOT EXISTS idx_attendance_reports_course 
ON attendance_reports("courseId");

CREATE INDEX IF NOT EXISTS idx_attendance_reports_month_year 
ON attendance_reports(year, month);

CREATE INDEX IF NOT EXISTS idx_attendance_reports_alert 
ON attendance_reports("hasAlert") WHERE "hasAlert" = true;

-- 4. Créer un index composé pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_attendance_reports_student_course_date 
ON attendance_reports("studentId", "courseId", year, month);

-- 5. Vérification finale
SELECT 
  COUNT(*) as total_reports,
  COUNT(DISTINCT "studentId") as unique_students,
  COUNT(DISTINCT "courseId") as unique_courses,
  AVG("attendanceRate") as avg_attendance_rate,
  SUM(CASE WHEN "hasAlert" = true THEN 1 ELSE 0 END) as reports_with_alerts
FROM attendance_reports;

-- Message de succès
SELECT '✅ Migration terminée: Table attendance_reports créée avec contraintes' as status;
