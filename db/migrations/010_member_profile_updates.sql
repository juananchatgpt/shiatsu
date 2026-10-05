-- Cambios solicitados para los perfiles y las nuevas cuotas.
ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS home_visit_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_visit_notes TEXT;

ALTER TABLE membership_documents
  DROP CONSTRAINT IF EXISTS membership_documents_kind_check;

ALTER TABLE membership_documents
  ADD CONSTRAINT membership_documents_kind_check
  CHECK (kind IN ('professional_qualification', 'school_program', 'school_teachers', 'school_direction', 'registration_document', 'other'));

UPDATE app_settings
SET value = jsonb_set(
  jsonb_set(value, '{professional}', '10000'::jsonb),
  '{school}', '12000'::jsonb
), updated_at = now()
WHERE key = 'fees';
