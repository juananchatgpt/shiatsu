-- APSE · Unifica el flujo operativo de altas en cuatro estados.
-- Se conservan las fechas y responsables históricos de aprobación/pago.

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;

UPDATE memberships
SET status = 'active',
    member_number = COALESCE(member_number, nextval('member_number_seq')::text),
    anniversary_date = COALESCE(anniversary_date, CURRENT_DATE)
WHERE status = 'pre_registered'
  AND profile_completed_at IS NOT NULL
  AND payment_confirmed_at IS NOT NULL;

UPDATE memberships SET status = 'pending' WHERE status = 'pre_registered';
UPDATE memberships SET status = 'inactive' WHERE status = 'suspended';

ALTER TABLE memberships
  ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('pending', 'active', 'inactive', 'rejected'));
