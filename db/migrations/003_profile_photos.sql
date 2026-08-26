CREATE TABLE IF NOT EXISTS membership_profile_photos (
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
