-- ============================================
-- Migration: Nettoyer les ENUMs dupliqués créés par TypeORM
-- Date: 10 Novembre 2025
-- ============================================

-- Supprimer les ENUMs créés automatiquement par TypeORM (avec suffixe _enum)
-- On garde seulement ceux créés manuellement dans reset_database.sql

DROP TYPE IF EXISTS rooms_type_enum CASCADE;
DROP TYPE IF EXISTS time_slots_dayofweek_enum CASCADE;
DROP TYPE IF EXISTS users_role_enum CASCADE;
DROP TYPE IF EXISTS courses_type_enum CASCADE;
DROP TYPE IF EXISTS courses_category_enum CASCADE;
DROP TYPE IF EXISTS courses_certificate_enum CASCADE;
DROP TYPE IF EXISTS enrollments_status_enum CASCADE;
DROP TYPE IF EXISTS registrations_status_enum CASCADE;
DROP TYPE IF EXISTS registrations_paymentmethod_enum CASCADE;
DROP TYPE IF EXISTS payments_paymentmethod_enum CASCADE;
DROP TYPE IF EXISTS sessions_status_enum CASCADE;
DROP TYPE IF EXISTS tutoring_sessions_status_enum CASCADE;
DROP TYPE IF EXISTS session_payments_paymentmethod_enum CASCADE;
DROP TYPE IF EXISTS session_payments_paymenttype_enum CASCADE;
DROP TYPE IF EXISTS installment_payments_status_enum CASCADE;
DROP TYPE IF EXISTS payment_schedules_status_enum CASCADE;
DROP TYPE IF EXISTS attendances_status_enum CASCADE;
DROP TYPE IF EXISTS attendances_scanmethod_enum CASCADE;

-- Vérification: Liste des ENUMs restants (devrait être seulement ceux sans suffixe _enum)
SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
GROUP BY t.typname 
ORDER BY t.typname;
