ALTER TABLE membership_documents
  ALTER COLUMN storage_key DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS content BYTEA;

ALTER TABLE membership_documents
  ADD CONSTRAINT membership_documents_content_size
  CHECK (content IS NULL OR octet_length(content) <= 5242880);
