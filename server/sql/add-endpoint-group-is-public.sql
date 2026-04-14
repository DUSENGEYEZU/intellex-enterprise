-- Public catalog flag for API groups (share group documentation without login)
ALTER TABLE endpoint_group
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_endpoint_group_is_public ON endpoint_group (is_public)
  WHERE is_public = true;
