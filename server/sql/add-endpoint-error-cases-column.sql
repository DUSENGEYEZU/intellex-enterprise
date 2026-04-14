-- Run once against the Intellex database (synchronize is off).
-- Adds support for multiple documented error cases per endpoint.

ALTER TABLE endpoint
  ADD COLUMN IF NOT EXISTS error_cases text NULL;

COMMENT ON COLUMN endpoint.error_cases IS 'JSON array: [{ "case_title": string, "sample_error_object": string }]';
