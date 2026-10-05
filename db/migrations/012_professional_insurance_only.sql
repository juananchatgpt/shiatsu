-- El seguro se asocia a socios profesionales, no a cuentas de escuela.
UPDATE memberships
SET insurance_selected = false,
    insurance_fee_cents = 0
WHERE member_type <> 'professional';

ALTER TABLE memberships
  DROP CONSTRAINT IF EXISTS memberships_insurance_professional_only;

ALTER TABLE memberships
  ADD CONSTRAINT memberships_insurance_professional_only
  CHECK (member_type = 'professional' OR (insurance_selected = false AND insurance_fee_cents = 0));
