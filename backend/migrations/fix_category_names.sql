-- Migration: Rename 'Développement personnel' category to 'Atelier'
-- Date: 2026-01-08

UPDATE courses 
SET category = 'Atelier' 
WHERE category = 'Développement personnel';

-- Ensure workshop_date is set for converted courses
UPDATE courses
SET workshop_date = CURRENT_DATE + INTERVAL '1 day'
WHERE category = 'Atelier' AND workshop_date IS NULL;