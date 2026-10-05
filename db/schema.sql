-- APSE · Gestión de socios · PostgreSQL 13+
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, full_name TEXT, role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  active BOOLEAN NOT NULL DEFAULT true, password_reset_required BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_number TEXT UNIQUE, member_type TEXT NOT NULL CHECK (member_type IN ('student', 'professional', 'school')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pre_registered', 'active', 'inactive', 'suspended', 'rejected')),
  insurance_selected BOOLEAN NOT NULL DEFAULT false, base_fee_cents INTEGER NOT NULL CHECK (base_fee_cents >= 0),
  insurance_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (insurance_fee_cents >= 0), anniversary_date DATE,
  directory_opt_in BOOLEAN NOT NULL DEFAULT false, privacy_accepted_at TIMESTAMPTZ NOT NULL,
  rejection_reason TEXT, internal_notes TEXT, approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ, profile_completed_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ, payment_confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  legacy_source_id TEXT, legacy_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (member_type = 'professional' OR (insurance_selected = false AND insurance_fee_cents = 0))
);
CREATE SEQUENCE IF NOT EXISTS member_number_seq START 1;
CREATE TABLE IF NOT EXISTS member_profiles (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL DEFAULT '', identity_document TEXT, phone TEXT, secondary_phone TEXT,
  address TEXT, postal_code TEXT, city TEXT, province TEXT, public_name TEXT, public_email TEXT, public_phone TEXT,
  public_address TEXT, public_address_opt_in BOOLEAN NOT NULL DEFAULT false, public_postal_code TEXT, public_city TEXT, public_province TEXT, website TEXT, bio TEXT,
  facebook_url TEXT, instagram_url TEXT, youtube_url TEXT, twitter_url TEXT, photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS student_profiles (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE, school_origin TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS professional_profiles (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE,
  training_school TEXT, qualification_summary TEXT, teaching_level TEXT, teaching_schools TEXT,
  teaching_since_year INTEGER CHECK (teaching_since_year IS NULL OR teaching_since_year BETWEEN 1900 AND 2100),
  home_visit_available BOOLEAN NOT NULL DEFAULT false, home_visit_notes TEXT
);
CREATE TABLE IF NOT EXISTS school_profiles (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE,
  responsible_professional_membership_id UUID UNIQUE REFERENCES memberships(id) ON DELETE RESTRICT,
  school_name TEXT NOT NULL, description TEXT, program_summary TEXT, teachers_summary TEXT, direction_experience_summary TEXT,
  center_type TEXT, languages TEXT
);
CREATE TABLE IF NOT EXISTS membership_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('professional_qualification', 'school_program', 'school_teachers', 'school_direction', 'registration_document', 'other')),
  original_name TEXT NOT NULL, storage_key TEXT, mime_type TEXT NOT NULL, size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  content BYTEA, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (content IS NULL OR octet_length(content) <= 5242880)
);
CREATE TABLE IF NOT EXISTS membership_profile_photos (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/gif')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  content BYTEA NOT NULL,
  source TEXT NOT NULL DEFAULT 'member_upload' CHECK (source IN ('wordpress','member_upload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (octet_length(content) = size_bytes)
);
CREATE TABLE IF NOT EXISTS membership_cover_images (
  membership_id UUID PRIMARY KEY REFERENCES memberships(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/gif')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  content BYTEA NOT NULL,
  source TEXT NOT NULL DEFAULT 'member_upload' CHECK (source IN ('wordpress','member_upload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (octet_length(content) = size_bytes)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organizer_membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  title TEXT NOT NULL, description TEXT NOT NULL, image_url TEXT, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false, timezone TEXT NOT NULL DEFAULT 'Europe/Madrid',
  modality TEXT NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person', 'online', 'hybrid')),
  venue_name TEXT, address TEXT, city TEXT, province TEXT, postal_code TEXT, country TEXT NOT NULL DEFAULT 'España',
  registration_url TEXT, public_contact TEXT, is_free BOOLEAN NOT NULL DEFAULT true,
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0), currency TEXT NOT NULL DEFAULT 'EUR',
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'cancelled')),
  moderation_notes TEXT, submitted_at TIMESTAMPTZ, reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at >= starts_at), CHECK (is_free OR price_cents IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS communication_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, subject TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '', body_text TEXT NOT NULL DEFAULT '', audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'archived')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS communication_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), draft_id UUID NOT NULL REFERENCES communication_drafts(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled', 'prepared')),
  recipient_count INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS communication_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), batch_id UUID NOT NULL REFERENCES communication_batches(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE, recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_sent' CHECK (status IN ('not_sent')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, membership_id)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY, actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS request_rate_limits (
  key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 1, expires_at TIMESTAMPTZ NOT NULL
);
INSERT INTO app_settings (key, value) VALUES
  ('fees', '{"student":4000,"professional":10000,"school":12000,"insurance":0}'::jsonb),
  ('communications', '{"bulkSendingEnabled":false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_type_status ON memberships(member_type, status);
CREATE INDEX IF NOT EXISTS idx_memberships_directory ON memberships(directory_opt_in, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_legacy_source ON memberships(legacy_source_id) WHERE legacy_source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_public_search ON member_profiles(public_province, public_name);
CREATE INDEX IF NOT EXISTS idx_documents_membership ON membership_documents(membership_id);
CREATE INDEX IF NOT EXISTS idx_events_public ON events(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_membership_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
