-- Migration: Création des tables de paiements échelonnés
-- Date: 2025-11-09

-- 1. Table des échéanciers de paiement
CREATE TABLE IF NOT EXISTS payment_schedules (
  id SERIAL PRIMARY KEY,
  "enrollmentId" INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  "installmentNumber" INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  "dueDate" DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'En attente',
  "paidAmount" DECIMAL(10,2) DEFAULT 0,
  "paidDate" DATE,
  "paymentMethod" VARCHAR(50),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_enrollment_installment UNIQUE("enrollmentId", "installmentNumber")
);

-- 2. Table des transactions de paiement
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  "scheduleId" INTEGER REFERENCES payment_schedules(id),
  "enrollmentId" INTEGER NOT NULL REFERENCES enrollments(id),
  "studentId" INTEGER NOT NULL REFERENCES students(id),
  amount DECIMAL(10,2) NOT NULL,
  "paymentMethod" VARCHAR(50) NOT NULL,
  "paymentDate" DATE NOT NULL,
  reference VARCHAR(100),
  "receivedBy" VARCHAR(100),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 3. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payment_schedule_enrollment ON payment_schedules("enrollmentId");
CREATE INDEX IF NOT EXISTS idx_payment_schedule_due_date ON payment_schedules("dueDate");
CREATE INDEX IF NOT EXISTS idx_payment_schedule_status ON payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_student ON payment_transactions("studentId");
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions("paymentDate");
CREATE INDEX IF NOT EXISTS idx_payment_transactions_enrollment ON payment_transactions("enrollmentId");

-- 4. Ajouter duration_months et price_per_month aux courses si non existant
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "durationMonths" INTEGER DEFAULT 1;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "pricePerMonth" DECIMAL(10,2);

-- 5. Vue pour les paiements en retard
CREATE OR REPLACE VIEW overdue_payments AS
SELECT 
  ps.*,
  s."firstName",
  s."lastName",
  s.phone,
  c.title as course_title,
  c.type as course_type,
  EXTRACT(DAY FROM (NOW() - ps."dueDate"))::INTEGER as days_overdue
FROM payment_schedules ps
JOIN enrollments e ON ps."enrollmentId" = e.id
JOIN students s ON e."studentId" = s.id
JOIN courses c ON e."courseId" = c.id
WHERE ps.status IN ('En attente', 'Paiement partiel')
  AND ps."dueDate" < CURRENT_DATE
ORDER BY ps."dueDate" ASC;

-- 6. Fonction pour mettre à jour automatiquement le statut
CREATE OR REPLACE FUNCTION update_payment_schedule_status()
RETURNS void AS $$
BEGIN
  -- Mettre en retard les paiements dépassés
  UPDATE payment_schedules
  SET status = 'En retard'
  WHERE status = 'En attente'
    AND "dueDate" < CURRENT_DATE;
    
  -- Marquer comme payé si montant complet
  UPDATE payment_schedules
  SET status = 'Payé'
  WHERE "paidAmount" >= amount
    AND status != 'Payé';
    
  -- Marquer comme paiement partiel
  UPDATE payment_schedules
  SET status = 'Paiement partiel'
  WHERE "paidAmount" > 0
    AND "paidAmount" < amount
    AND status NOT IN ('Payé', 'Annulé');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE payment_schedules IS 'Calendrier des échéances de paiement pour chaque inscription';
COMMENT ON TABLE payment_transactions IS 'Historique de toutes les transactions de paiement effectuées';
COMMENT ON VIEW overdue_payments IS 'Vue des paiements en retard avec informations étudiant et formation';
