-- Migration: Changer installments pour utiliser student_payment_plan_id au lieu de payment_plan_id
-- Date: 2025-12-20

-- 1. Renommer la colonne payment_plan_id en student_payment_plan_id
ALTER TABLE installments
RENAME COLUMN payment_plan_id TO student_payment_plan_id;

-- 2. Supprimer l'ancien index
DROP INDEX IF EXISTS idx_installments_payment_plan_id;

-- 3. Créer le nouvel index
CREATE INDEX idx_installments_student_payment_plan_id ON installments(student_payment_plan_id);

-- 4. Supprimer l'ancienne FK si elle existe
ALTER TABLE installments
DROP CONSTRAINT IF EXISTS installments_payment_plan_id_fkey;

-- 5. Ajouter la nouvelle FK vers student_payment_plans
ALTER TABLE installments
ADD CONSTRAINT fk_installments_student_payment_plan
FOREIGN KEY (student_payment_plan_id) REFERENCES student_payment_plans(id) ON DELETE CASCADE;

SELECT '✅ Migration terminée: installments utilise maintenant student_payment_plan_id' as status;