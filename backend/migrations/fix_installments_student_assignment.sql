-- Migration: Changer installments pour utiliser student_assignment_id au lieu de student_payment_plan_id
-- Date: 2025-12-20

-- 1. Renommer la colonne
ALTER TABLE installments
RENAME COLUMN student_payment_plan_id TO student_assignment_id;

-- 2. Supprimer l'ancien index
DROP INDEX IF EXISTS idx_installments_student_payment_plan_id;

-- 3. Créer le nouvel index
CREATE INDEX idx_installments_student_assignment_id ON installments(student_assignment_id);

-- 4. Supprimer l'ancienne FK
ALTER TABLE installments
DROP CONSTRAINT IF EXISTS fk_installments_student_payment_plan;

-- 5. Ajouter la nouvelle FK
ALTER TABLE installments
ADD CONSTRAINT fk_installments_student_assignment
FOREIGN KEY (student_assignment_id) REFERENCES student_assignments(id) ON DELETE CASCADE;

SELECT '✅ Migration terminée: installments utilise maintenant student_assignment_id' as status;