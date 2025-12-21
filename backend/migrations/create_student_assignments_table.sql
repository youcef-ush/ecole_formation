-- Migration: Create student_assignments table
-- Date: 2024
-- Description: Create table to manage student assignments to courses with payment plans

CREATE TABLE IF NOT EXISTS student_assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    payment_plan_id INTEGER NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE NULL,

    -- Ensure unique active assignment per student-course combination
    UNIQUE(student_id, course_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_course_id ON student_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_payment_plan_id ON student_assignments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_status ON student_assignments(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_assignments_updated_at
    BEFORE UPDATE ON student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_student_assignments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE student_assignments IS 'Table linking students to courses with specific payment plans';
COMMENT ON COLUMN student_assignments.student_id IS 'Reference to the student';
COMMENT ON COLUMN student_assignments.course_id IS 'Reference to the course';
COMMENT ON COLUMN student_assignments.payment_plan_id IS 'Reference to the payment plan for this assignment';
COMMENT ON COLUMN student_assignments.total_amount IS 'Total amount for this specific assignment';
COMMENT ON COLUMN student_assignments.status IS 'Status of the assignment: ACTIVE, COMPLETED, CANCELLED, SUSPENDED';
COMMENT ON COLUMN student_assignments.completed_at IS 'Timestamp when assignment was completed';