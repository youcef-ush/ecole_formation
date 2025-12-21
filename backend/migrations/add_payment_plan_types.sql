-- Migration pour ajouter les types de plans de paiement

-- 1. Créer le type enum pour les plans de paiement
DO $$ BEGIN
    CREATE TYPE payment_plan_type AS ENUM ('UNIQUE', 'MONTHLY', 'INSTALLMENTS', 'CONSUMPTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ajouter la colonne type (par défaut UNIQUE)
ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS type payment_plan_type DEFAULT 'UNIQUE';

-- 3. Ajouter la colonne remaining_sessions (pour type CONSUMPTION)
ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS remaining_sessions INTEGER NULL;

-- 4. Ajouter la colonne day_of_month (pour type MONTHLY, par défaut le 5)
ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS day_of_month INTEGER DEFAULT 5;

-- 5. Ajouter des commentaires pour documentation
COMMENT ON COLUMN payment_plans.type IS 'Type de plan: UNIQUE (paiement unique), MONTHLY (abonnement mensuel), INSTALLMENTS (tranches échelonnées), CONSUMPTION (pack de séances)';
COMMENT ON COLUMN payment_plans.remaining_sessions IS 'Pour type CONSUMPTION: nombre de séances restantes dans le pack';
COMMENT ON COLUMN payment_plans.day_of_month IS 'Pour type MONTHLY: jour du mois pour le paiement (1-31), par défaut le 5';
COMMENT ON COLUMN payment_plans.number_of_installments IS 'Nombre d''échéances/mois/tranches ou crédit total de séances';

-- 6. Mettre à jour les plans existants s'il y en a
UPDATE payment_plans SET type = 'UNIQUE' WHERE type IS NULL;
