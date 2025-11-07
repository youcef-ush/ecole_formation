-- Migration: Mise à jour de l'enum RegistrationStatus et ajout des nouveaux champs
-- Date: 2025-11-07
-- Description: Mise à jour du processus d'inscription avec paiement séparé de la validation

-- 1. Supprimer l'ancien type enum et le recréer
ALTER TABLE registrations ALTER COLUMN status TYPE VARCHAR(50);
DROP TYPE IF EXISTS registrations_status_enum CASCADE;

CREATE TYPE registrations_status_enum AS ENUM (
  'En attente',
  'Frais payés',
  'Validée',
  'Refusée'
);

-- 2. Convertir les anciennes valeurs vers les nouvelles
UPDATE registrations 
SET status = CASE 
  WHEN status = 'En attente de paiement' THEN 'En attente'
  WHEN status = 'Validée par Finance' THEN 'Validée'
  WHEN status = 'Refusée' THEN 'Refusée'
  ELSE 'En attente'
END;

-- 3. Réappliquer le type enum à la colonne
ALTER TABLE registrations ALTER COLUMN status TYPE registrations_status_enum USING status::registrations_status_enum;

-- 4. Créer l'enum pour les méthodes de paiement s'il n'existe pas
DROP TYPE IF EXISTS payment_method_enum CASCADE;
CREATE TYPE payment_method_enum AS ENUM (
  'Espèces',
  'Carte bancaire',
  'Virement bancaire',
  'Chèque'
);

-- 5. Ajouter les nouveaux champs pour le paiement (si pas déjà existants)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "paymentMethod" payment_method_enum,
ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "isValidated" BOOLEAN DEFAULT false;

-- 6. Ajouter le champ qrCode à la table students (si pas déjà existant)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS "qrCode" VARCHAR(255) UNIQUE;

-- 7. Mettre à jour isValidated pour les inscriptions déjà validées
UPDATE registrations 
SET "isValidated" = true 
WHERE status = 'Validée';

-- 8. Créer un index sur le QR Code pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_students_qrcode ON students("qrCode");

COMMENT ON COLUMN registrations."paymentMethod" IS 'Méthode de paiement des frais d''inscription';
COMMENT ON COLUMN registrations."amountPaid" IS 'Montant payé pour les frais d''inscription';
COMMENT ON COLUMN registrations."isValidated" IS 'Indique si l''inscription a été validée (étudiant créé)';
COMMENT ON COLUMN students."qrCode" IS 'Code QR unique de l''étudiant au format STU-{id}-{timestamp}';
