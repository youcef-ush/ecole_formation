-- Migration: Add category and monthly_price to courses table

-- Create course_category enum type
DO $$ BEGIN
    CREATE TYPE course_category AS ENUM (
        'TUTORING_MATH',
        'TUTORING_PHYSICS',
        'TUTORING_CHEMISTRY',
        'TUTORING_BIOLOGY',
        'TUTORING_FRENCH',
        'TUTORING_ENGLISH',
        'TUTORING_ARABIC',
        'TUTORING_PHILOSOPHY',
        'TUTORING_HISTORY',
        'TUTORING_GEOGRAPHY',
        'PROFESSIONAL_WEB_DEV',
        'PROFESSIONAL_MOBILE_DEV',
        'PROFESSIONAL_DATA_SCIENCE',
        'PROFESSIONAL_DESIGN',
        'PROFESSIONAL_MARKETING',
        'PROFESSIONAL_ACCOUNTING',
        'PROFESSIONAL_MANAGEMENT',
        'PROFESSIONAL_LANGUAGES',
        'PROFESSIONAL_COOKING',
        'PROFESSIONAL_BEAUTY',
        'PERSONAL_DEVELOPMENT',
        'PERSONAL_COMMUNICATION',
        'PERSONAL_LEADERSHIP'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS category course_category;

-- Add monthly_price column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2);

-- Add comment
COMMENT ON COLUMN courses.category IS 'Category of the course (Tutoring, Professional, Personal Development)';
COMMENT ON COLUMN courses.monthly_price IS 'Monthly price for tutoring courses';
