ALTER TABLE memberships
  DROP CONSTRAINT IF EXISTS memberships_status_check;

ALTER TABLE memberships
  ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('pending', 'pre_registered', 'active', 'inactive', 'suspended', 'rejected'));

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Los socios que ya estaban activos antes de incorporar este flujo no deben volver a pasar
-- por pre-registro. Se marca su situación como histórica usando las fechas ya disponibles.
UPDATE memberships
SET profile_completed_at = COALESCE(profile_completed_at, approved_at, created_at),
    payment_confirmed_at = COALESCE(payment_confirmed_at, approved_at, created_at),
    payment_confirmed_by = COALESCE(payment_confirmed_by, approved_by)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_memberships_registration_workflow
  ON memberships(status, profile_completed_at, payment_confirmed_at);
