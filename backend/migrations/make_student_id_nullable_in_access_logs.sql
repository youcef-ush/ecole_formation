-- Rendre student_id nullable dans access_logs pour permettre de logger les scans inconnus
ALTER TABLE access_logs ALTER COLUMN student_id DROP NOT NULL;
