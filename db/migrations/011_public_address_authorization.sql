-- La dirección privada nunca se publica. La dirección de directorio requiere autorización expresa.
ALTER TABLE member_profiles
  ADD COLUMN IF NOT EXISTS public_address_opt_in BOOLEAN NOT NULL DEFAULT false;
