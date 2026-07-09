CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Business Profiles (per-company config)
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  framework TEXT NOT NULL CHECK (framework IN ('BANT', 'MEDDIC', 'SPIN')),
  context_data JSONB,-- Industry, typical objections, etc.
  products TEXT,
  icp TEXT,
  objections TEXT,
  language TEXT DEFAULT 'en' CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$'), 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Salesperson Accounts (auth users, per-person identity)
CREATE TABLE salesperson_accounts (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT NOT NULL,
  employee_id TEXT,
  business_id UUID REFERENCES business_profiles(id),
  role TEXT NOT NULL CHECK (role IN ('rep', 'manager', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_salesperson_accounts_business ON salesperson_accounts(business_id);
CREATE INDEX idx_salesperson_accounts_employee ON salesperson_accounts(employee_id);

CREATE OR REPLACE FUNCTION update_admin_member(
  p_member_id UUID,
  p_business_id UUID,
  p_role TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS salesperson_accounts
LANGUAGE plpgsql
AS $$
DECLARE
  target_account salesperson_accounts%ROWTYPE;
  active_admin_count INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::TEXT, 0));

  SELECT *
  INTO target_account
  FROM salesperson_accounts
  WHERE id = p_member_id
    AND business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF target_account.role = 'admin'
     AND COALESCE(target_account.is_active, TRUE)
     AND (
       (p_role IS NOT NULL AND p_role <> 'admin')
       OR p_is_active IS FALSE
     ) THEN
    SELECT COUNT(*)
    INTO active_admin_count
    FROM salesperson_accounts
    WHERE business_id = p_business_id
      AND role = 'admin'
      AND is_active = TRUE
      AND id <> p_member_id;

    IF active_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last active admin from the business';
    END IF;
  END IF;

  UPDATE salesperson_accounts
  SET
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_member_id
    AND business_id = p_business_id
  RETURNING * INTO target_account;

  RETURN target_account;
END;
$$;

CREATE OR REPLACE FUNCTION delete_member_data(
  p_member_id UUID,
  p_business_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  target_account salesperson_accounts%ROWTYPE;
  other_active_admin_count INTEGER;
BEGIN
  SELECT *
  INTO target_account
  FROM salesperson_accounts
  WHERE id = p_member_id
    AND business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF target_account.role = 'admin'
     AND COALESCE(target_account.is_active, TRUE) THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::TEXT, 0));

    SELECT COUNT(*)
    INTO other_active_admin_count
    FROM salesperson_accounts
    WHERE business_id = p_business_id
      AND role = 'admin'
      AND is_active = TRUE
      AND id <> p_member_id;

    IF other_active_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last active admin from the business';
    END IF;
  END IF;

  DELETE FROM transcripts
  WHERE session_id IN (
    SELECT id
    FROM sessions
    WHERE rep_id = p_member_id
      AND business_id = p_business_id
  );

  DELETE FROM scorecards
  WHERE session_id IN (
    SELECT id
    FROM sessions
    WHERE rep_id = p_member_id
      AND business_id = p_business_id
  );

  DELETE FROM sessions
  WHERE rep_id = p_member_id
    AND business_id = p_business_id;

  DELETE FROM salesperson_profiles
  WHERE rep_id = p_member_id
    AND business_id = p_business_id;

  DELETE FROM salesperson_accounts
  WHERE id = p_member_id
    AND business_id = p_business_id;
END;
$$;

-- 3. Invites (admin-generated invite links)
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES business_profiles(id),
  role TEXT NOT NULL CHECK (role IN ('rep', 'manager', 'admin')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(email);

-- 4. Salesperson Profiles (versioned, insert-only)
CREATE TABLE salesperson_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_id UUID NOT NULL, -- References auth.users
  version INTEGER NOT NULL,
  business_id UUID REFERENCES business_profiles(id),
  call_id UUID, -- FK to sessions, nullable for v0
  metric_scores JSONB NOT NULL, -- { "rapport": 7, "objection_handling": 5, ... }
  weakest_dimension TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_id, version)
);
CREATE INDEX idx_salesperson_profiles_rep_latest ON salesperson_profiles(rep_id, version DESC);

CREATE OR REPLACE FUNCTION create_salesperson_profile_version(
  p_rep_id UUID,
  p_business_id UUID,
  p_call_id UUID,
  p_metric_scores JSONB,
  p_weakest_dimension TEXT
)
RETURNS salesperson_profiles
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_profile salesperson_profiles%ROWTYPE;
  next_version INTEGER;
BEGIN
  -- Serialize version allocation per rep so concurrent completed calls cannot
  -- read the same latest version and insert duplicate next versions.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_rep_id::TEXT, 0));

  SELECT *
  INTO inserted_profile
  FROM salesperson_profiles
  WHERE call_id = p_call_id
  LIMIT 1;

  IF FOUND THEN
    RETURN inserted_profile;
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1
  INTO next_version
  FROM salesperson_profiles
  WHERE rep_id = p_rep_id;

  INSERT INTO salesperson_profiles (
    rep_id,
    business_id,
    version,
    call_id,
    metric_scores,
    weakest_dimension
  )
  VALUES (
    p_rep_id,
    p_business_id,
    next_version,
    p_call_id,
    p_metric_scores,
    p_weakest_dimension
  )
  RETURNING * INTO inserted_profile;

  RETURN inserted_profile;
END;
$$;

-- 5. Sessions (live calls)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_id UUID NOT NULL,
  business_id UUID REFERENCES business_profiles(id),
  scenario TEXT NOT NULL CHECK (scenario IN ('cold_call', 'hot_call', 'directsales', 'meeting')),
  profile_version INTEGER, -- Which profile version was used for this call
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB -- Ephemeral token ID, client info, etc.
);

-- 6. Transcripts (conversation text)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('rep', 'ai_customer')),
  text TEXT NOT NULL,
  timestamp_offset_ms INTEGER, -- Milliseconds from session start
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_transcripts_session ON transcripts(session_id, timestamp_offset_ms);
CREATE UNIQUE INDEX idx_transcripts_session_timestamp_speaker
  ON transcripts(session_id, timestamp_offset_ms, speaker);

-- 7. Scorecards (per-call analysis)
CREATE TABLE scorecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL,
  business_id UUID REFERENCES business_profiles(id),
  
  -- Deterministic metrics
  call_duration_seconds INTEGER,
  rep_talk_percentage DECIMAL(5,2), -- % of time rep spoke
  interruptions_count INTEGER,
  filler_words_count INTEGER,
  
  -- Rubric-graded metrics (1-10 scale)
  rapport_score INTEGER CHECK (rapport_score BETWEEN 1 AND 10),
  needs_discovery_score INTEGER CHECK (needs_discovery_score BETWEEN 1 AND 10),
  objection_handling_score INTEGER CHECK (objection_handling_score BETWEEN 1 AND 10),
  closing_score INTEGER CHECK (closing_score BETWEEN 1 AND 10),
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 10),
  
  -- Framework-specific scores (JSONB for flexibility)
  framework_scores JSONB, -- { "BANT": { "budget": 8, "authority": 6, ... } }
  
  -- Qualitative feedback
  strengths TEXT[],
  improvement_areas TEXT[],
  feedback_summary TEXT,
  

  -- Durable background scoring lifecycle
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'generated', 'failed')),
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_scorecards_rep ON scorecards(rep_id, created_at DESC);

-- Row-Level Security (RLS)
ALTER TABLE salesperson_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

-- Policy: Reps can only see their own data
CREATE POLICY rep_own_profiles ON salesperson_profiles FOR SELECT
  USING (auth.uid() = rep_id);

CREATE POLICY rep_own_sessions ON sessions FOR ALL
  USING (auth.uid() = rep_id);

CREATE POLICY rep_own_transcripts ON transcripts FOR SELECT
  USING (session_id IN (SELECT id FROM sessions WHERE rep_id = auth.uid()));

CREATE POLICY rep_own_scorecards ON scorecards FOR SELECT
  USING (auth.uid() = rep_id);
