-- Migration pour ajouter les paiements échelonnés
-- Date: 2025-11-05

-- Créer la table installment_payments
CREATE TABLE IF NOT EXISTS installment_payments (
  id SERIAL PRIMARY KEY,
  "registrationId" INTEGER NOT NULL,
  "installmentNumber" INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  "dueDate" DATE NOT NULL,
  "paymentDate" DATE NULL,
  "paymentMethod" VARCHAR(50) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registration
    FOREIGN KEY ("registrationId")
    REFERENCES registrations(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_status
    CHECK (status IN ('PENDING', 'PAID', 'OVERDUE'))
);

-- Ajouter la colonne installmentPlan à registrations
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "installmentPlan" JSONB NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_installment_registration 
ON installment_payments("registrationId");

CREATE INDEX IF NOT EXISTS idx_installment_status 
ON installment_payments(status);

CREATE INDEX IF NOT EXISTS idx_installment_duedate 
ON installment_payments("dueDate");

-- Commentaires
COMMENT ON TABLE installment_payments IS 'Tableau des paiements échelonnés pour les inscriptions';
COMMENT ON COLUMN installment_payments."installmentNumber" IS 'Numéro de la tranche (1, 2, 3...)';
COMMENT ON COLUMN installment_payments.status IS 'Statut: PENDING, PAID, OVERDUE';
COMMENT ON COLUMN registrations."installmentPlan" IS 'Plan de paiement JSON: {totalAmount, deposit, numberOfInstallments, installmentAmount}';
