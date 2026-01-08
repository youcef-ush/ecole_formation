-- Migration: Add workshop_date field to courses table for one-day workshops
-- Date: 2026-01-08

ALTER TABLE courses ADD COLUMN workshop_date DATE;

-- Update existing courses with "Atelier" category to have a default workshop date (tomorrow)
UPDATE courses
SET workshop_date = CURRENT_DATE + INTERVAL '1 day'
WHERE category = 'Atelier';

-- Add comment to the column
COMMENT ON COLUMN courses.workshop_date IS 'Date of the workshop for one-day Atelier category courses';