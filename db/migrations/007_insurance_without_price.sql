-- El seguro se conserva solo como interés del socio, sin importe asociado en fase 1.
UPDATE memberships
SET insurance_fee_cents = 0, updated_at = now()
WHERE insurance_fee_cents <> 0;

UPDATE app_settings
SET value = jsonb_set(value, '{insurance}', '0'::jsonb), updated_at = now()
WHERE key = 'fees';
