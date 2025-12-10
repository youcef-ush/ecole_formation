-- Create payment_plans table
CREATE TABLE IF NOT EXISTS payment_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    installments_count INTEGER NOT NULL,
    interval_days INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add payment_plan_id to enrollments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_plan_id') THEN
        ALTER TABLE enrollments ADD COLUMN payment_plan_id INTEGER REFERENCES payment_plans(id) ON DELETE SET NULL;
    END IF;
END $$;