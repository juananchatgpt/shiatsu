ALTER TABLE member_profiles
  ADD COLUMN IF NOT EXISTS twitter_url TEXT;

ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS teaching_level TEXT,
  ADD COLUMN IF NOT EXISTS teaching_schools TEXT,
  ADD COLUMN IF NOT EXISTS teaching_since_year INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_profiles_teaching_since_year_check'
  ) THEN
    ALTER TABLE professional_profiles
      ADD CONSTRAINT professional_profiles_teaching_since_year_check
      CHECK (teaching_since_year IS NULL OR teaching_since_year BETWEEN 1900 AND 2100);
  END IF;
END $$;

UPDATE member_profiles p
SET twitter_url = NULLIF(BTRIM(m.legacy_data->>'twitter'), '')
FROM memberships m
WHERE m.id = p.membership_id
  AND p.twitter_url IS NULL
  AND NULLIF(BTRIM(m.legacy_data->>'twitter'), '') IS NOT NULL;

UPDATE professional_profiles p
SET teaching_level = COALESCE(p.teaching_level, NULLIF(BTRIM(m.legacy_data->>'nivel-ensenanza-profesor'), '')),
    teaching_schools = COALESCE(p.teaching_schools, NULLIF(BTRIM(m.legacy_data->>'escuelas-imparte-profesor'), '')),
    teaching_since_year = COALESCE(
      p.teaching_since_year,
      CASE
        WHEN BTRIM(m.legacy_data->>'inicio-docencia-year-profesor') ~ '^[0-9]{4}$'
          THEN (BTRIM(m.legacy_data->>'inicio-docencia-year-profesor'))::INTEGER
        ELSE NULL
      END
    )
FROM memberships m
WHERE m.id = p.membership_id;

UPDATE memberships
SET internal_notes = NULLIF(BTRIM(legacy_data->>'observaciones'), '')
WHERE internal_notes IS NULL
  AND NULLIF(BTRIM(legacy_data->>'observaciones'), '') IS NOT NULL;
