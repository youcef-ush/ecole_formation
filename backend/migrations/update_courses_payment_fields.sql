-- Migration: Ajouter les colonnes pour les échéanciers de paiement aux cours
-- Fichier: update_courses_payment_fields.sql
-- Date: 2025-01-15

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS "durationMonths" integer,
  ADD COLUMN IF NOT EXISTS "pricePerMonth" numeric(10,2);

COMMENT ON COLUMN courses."durationMonths" IS 'Durée de la formation en mois pour calculer les échéanciers';
COMMENT ON COLUMN courses."pricePerMonth" IS 'Prix mensuel pour les cours de soutien scolaire';

-- Exemples de mise à jour pour vos cours existants
-- À adapter selon vos données réelles

-- Mettre à jour les cours de soutien scolaire (paiement mensuel)
UPDATE courses 
SET 
  "pricePerMonth" = CASE 
    WHEN type::text = 'Soutien Scolaire (Groupe)' THEN 3000.00
    WHEN type::text = 'Soutien Scolaire (Individuel)' THEN 5000.00
    WHEN type::text = 'Soutien Scolaire (En ligne)' THEN 4000.00
  END,
  "durationMonths" = 12  -- Le soutien scolaire dure généralement toute l'année
WHERE type::text LIKE 'Soutien Scolaire%';

-- Mettre à jour les formations professionnelles
-- Formations courtes (< 3 mois) - 2 échéances
UPDATE courses 
SET "durationMonths" = 2
WHERE type::text = 'Formation Qualifiante' 
  AND category::text IN ('Cuisine', 'Couture', 'Développement personnel')
  AND "durationMonths" IS NULL
  AND "durationHours" <= 120;

-- Formations moyennes (3-6 mois) - paiements mensuels
UPDATE courses 
SET "durationMonths" = 
  CASE 
    WHEN "durationHours" BETWEEN 121 AND 250 THEN 3
    WHEN "durationHours" BETWEEN 251 AND 400 THEN 4
    WHEN "durationHours" BETWEEN 401 AND 600 THEN 6
    ELSE 3
  END
WHERE type::text = 'Formation Qualifiante' 
  AND "durationMonths" IS NULL;

-- Vérifier les résultats
SELECT 
  id,
  title,
  type::text,
  category::text,
  "durationHours",
  "durationMonths",
  price,
  "pricePerMonth",
  CASE 
    WHEN type::text LIKE 'Soutien Scolaire%' THEN 'Soutien: 12 échéances mensuelles'
    WHEN "durationMonths" >= 3 THEN CONCAT('Formation longue: ', "durationMonths", ' échéances mensuelles')
    WHEN "durationMonths" < 3 THEN 'Formation courte: 2 échéances (50%/50%)'
    ELSE 'NON CONFIGURÉ'
  END as plan_paiement
FROM courses
ORDER BY type, category, title;

-- Afficher les cours qui nécessitent encore une configuration manuelle
SELECT 
  id,
  title,
  type::text,
  category::text,
  "durationHours",
  "durationMonths",
  price,
  "pricePerMonth"
FROM courses
WHERE "durationMonths" IS NULL OR ("pricePerMonth" IS NULL AND type::text LIKE 'Soutien Scolaire%')
ORDER BY id;

-- Ajouter des contraintes de validation (optionnel)
ALTER TABLE courses 
  ADD CONSTRAINT check_duration_months 
  CHECK ("durationMonths" IS NULL OR ("durationMonths" > 0 AND "durationMonths" <= 24));

ALTER TABLE courses 
  ADD CONSTRAINT check_price_per_month 
  CHECK ("pricePerMonth" IS NULL OR "pricePerMonth" > 0);

-- Exemples de valeurs par défaut selon le type de cours
-- Ces valeurs sont à adapter à votre contexte

COMMENT ON TABLE courses IS 'Table des formations avec support des échéanciers de paiement automatiques';
