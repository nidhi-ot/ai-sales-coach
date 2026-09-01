CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  company TEXT CHECK (company IS NULL OR char_length(company) <= 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status_created
  ON access_requests(status, created_at DESC);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE access_requests FROM anon, authenticated;
