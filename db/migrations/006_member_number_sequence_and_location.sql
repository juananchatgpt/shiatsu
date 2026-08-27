-- Mantiene la numeración histórica (solo dígitos) y corrige el primer alta nueva.
UPDATE memberships
SET member_number = '934', updated_at = now()
WHERE id = '4fda7462-72dc-463c-b7ad-070cab5c7f0b'
  AND member_number = 'APSE-00001'
  AND NOT EXISTS (SELECT 1 FROM memberships WHERE member_number = '934');

SELECT setval(
  'member_number_seq',
  GREATEST(
    COALESCE((SELECT MAX(member_number::bigint) FROM memberships WHERE member_number ~ '^[0-9]+$'), 0),
    1
  ),
  true
);

-- El alta inicial solo pedía una ubicación. Se conserva como privada y pública.
UPDATE member_profiles
SET city = COALESCE(city, public_city),
    province = COALESCE(province, public_province),
    updated_at = now()
WHERE membership_id = '4fda7462-72dc-463c-b7ad-070cab5c7f0b';
