-- Migration: Refactoriser PaymentPlan en système template + affectation
-- Date: 2025-12-19
-- Description: PaymentPlan devient un template réutilisable, StudentPaymentPlan gère les affectations

BEGIN;

-- 1. Créer la nouvelle table student_payment_plans (affectations)
CREATE TABLE IF NOT EXISTS student_payment_plans (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    payment_plan_id INTEGER NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    remaining_sessions INTEGER,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sauvegarder les données existantes si nécessaire
-- (Si vous avez déjà des payment_plans avec student_id, il faudra migrer manuellement)

-- 3. Supprimer les anciennes colonnes de payment_plans
ALTER TABLE payment_plans DROP COLUMN IF EXISTS student_id;
ALTER TABLE payment_plans DROP COLUMN IF EXISTS total_amount;
ALTER TABLE payment_plans DROP COLUMN IF EXISTS number_of_installments;
ALTER TABLE payment_plans DROP COLUMN IF EXISTS remaining_sessions;
DROP INDEX IF EXISTS idx_payment_plans_student;

-- 4. Ajouter les nouvelles colonnes pour le template
ALTER TABLE payment_plans 
    ADD COLUMN IF NOT EXISTS name VARCHAR(200) NOT NULL DEFAULT 'Plan par défaut',
    ADD COLUMN IF NOT EXISTS installments_count INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS interval_days INTEGER;

-- 5. Renommer day_of_month si elle existe déjà
ALTER TABLE payment_plans 
    ALTER COLUMN day_of_month DROP NOT NULL,
    ALTER COLUMN day_of_month SET DEFAULT 5;

-- 6. Ajouter la description
ALTER TABLE payment_plans
    ADD COLUMN IF NOT EXISTS description TEXT;

-- 7. Modifier la table installments pour pointer vers student_payment_plans
ALTER TABLE installments 
    DROP CONSTRAINT IF EXISTS installments_payment_plan_id_fkey,
    DROP COLUMN IF EXISTS payment_plan_id,
    ADD COLUMN IF NOT EXISTS student_payment_plan_id INTEGER REFERENCES student_payment_plans(id) ON DELETE CASCADE;

-- 8. Supprimer payment_plan_id de students
ALTER TABLE students 
    DROP COLUMN IF EXISTS payment_plan_id;

-- 9. Index pour performances
CREATE INDEX IF NOT EXISTS idx_student_payment_plans_student ON student_payment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payment_plans_plan ON student_payment_plans(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_spp ON installments(student_payment_plan_id);

COMMIT;
