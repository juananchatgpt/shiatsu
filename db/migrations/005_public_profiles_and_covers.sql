ALTER TABLE school_profiles
  ADD COLUMN IF NOT EXISTS center_type TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT;

CREATE TABLE IF NOT EXISTS membership_cover_images (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/gif')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  content BYTEA NOT NULL,
  source TEXT NOT NULL DEFAULT 'member_upload' CHECK (source IN ('wordpress','member_upload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (octet_length(content) = size_bytes)
);

UPDATE school_profiles sc
SET center_type = CASE
      WHEN m.legacy_data->>'tipo-centro' LIKE '%Centro Asociado%' THEN 'Centro asociado'
      WHEN m.legacy_data->>'tipo-centro' LIKE '%Escuela%' THEN 'Escuela'
      WHEN sc.school_name ILIKE '%instituto%' THEN 'Instituto'
      ELSE sc.center_type
    END,
    languages = CASE
      WHEN m.legacy_data->>'languages' LIKE '%Catal%' THEN 'Català, Inglés, Español'
      WHEN m.legacy_data->>'languages' LIKE '%Portugu%' THEN 'Inglés, Español, Portugués'
      WHEN m.legacy_data->>'languages' LIKE '%Alem%' THEN 'Alemán, Inglés, Español'
      WHEN m.legacy_data->>'languages' LIKE '%Ingl%' THEN 'Inglés, Español'
      WHEN m.legacy_data->>'languages' LIKE '%Espa%' THEN 'Español'
      ELSE sc.languages
    END
FROM memberships m
WHERE m.id=sc.membership_id;

UPDATE member_profiles p
SET public_email=LOWER(NULLIF(BTRIM(m.legacy_data->>'user_email'), ''))
FROM memberships m
WHERE m.id=p.membership_id AND m.member_type='school' AND p.public_email IS NULL
  AND NULLIF(BTRIM(m.legacy_data->>'user_email'), '') IS NOT NULL;

UPDATE school_profiles SET description=NULL WHERE LOWER(BTRIM(description))='x';
UPDATE school_profiles SET teachers_summary=NULL WHERE BTRIM(teachers_summary)='1';
UPDATE member_profiles SET bio=NULL WHERE LOWER(BTRIM(bio))='x';
