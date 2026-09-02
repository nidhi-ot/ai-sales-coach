-- Full data audit for AI Sales Coach.
-- Run this in Supabase SQL Editor or psql against the target project.
-- This file is read-only: every executable statement is SELECT-only.
--
-- How to read it:
-- - Result sets named "missing_*", "*_mismatch", "duplicate_*", "orphan_*",
--   or "stale_*" should normally return zero rows.
-- - Non-zero rows are audit findings to review before cleanup.
-- - The RLS simulation block at the bottom is commented out because it needs
--   real rep UUIDs from your environment.

-- ---------------------------------------------------------------------------
-- 1. Canonical table inventory
-- ---------------------------------------------------------------------------

WITH expected_tables(table_name) AS (
  VALUES
    ('business_profiles'),
    ('salesperson_accounts'),
    ('invites'),
    ('salesperson_profiles'),
    ('sessions'),
    ('transcripts'),
    ('scorecards'),
    ('scenario_configs')
)
SELECT
  'missing_table' AS finding,
  expected_tables.table_name
FROM expected_tables
LEFT JOIN information_schema.tables actual
  ON actual.table_schema = 'public'
 AND actual.table_name = expected_tables.table_name
WHERE actual.table_name IS NULL
ORDER BY expected_tables.table_name;

WITH expected_tables(table_name) AS (
  VALUES
    ('business_profiles'),
    ('salesperson_accounts'),
    ('invites'),
    ('salesperson_profiles'),
    ('sessions'),
    ('transcripts'),
    ('scorecards'),
    ('scenario_configs')
)
SELECT
  'unexpected_public_table' AS finding,
  actual.table_name
FROM information_schema.tables actual
LEFT JOIN expected_tables
  ON expected_tables.table_name = actual.table_name
WHERE actual.table_schema = 'public'
  AND actual.table_type = 'BASE TABLE'
  AND expected_tables.table_name IS NULL
ORDER BY actual.table_name;

-- ---------------------------------------------------------------------------
-- 2. Canonical columns
-- ---------------------------------------------------------------------------

WITH expected_columns(table_name, column_name, expected_type, expected_nullable) AS (
  VALUES
    ('business_profiles', 'id', 'uuid', 'NO'),
    ('business_profiles', 'name', 'text', 'NO'),
    ('business_profiles', 'framework', 'text', 'NO'),
    ('business_profiles', 'context_data', 'jsonb', 'YES'),
    ('business_profiles', 'products', 'text', 'YES'),
    ('business_profiles', 'icp', 'text', 'YES'),
    ('business_profiles', 'objections', 'text', 'YES'),
    ('business_profiles', 'language', 'text', 'YES'),
    ('business_profiles', 'created_at', 'timestamp with time zone', 'YES'),
    ('business_profiles', 'updated_at', 'timestamp with time zone', 'YES'),

    ('salesperson_accounts', 'id', 'uuid', 'NO'),
    ('salesperson_accounts', 'full_name', 'text', 'NO'),
    ('salesperson_accounts', 'email', 'text', 'YES'),
    ('salesperson_accounts', 'phone_number', 'text', 'NO'),
    ('salesperson_accounts', 'employee_id', 'text', 'YES'),
    ('salesperson_accounts', 'business_id', 'uuid', 'YES'),
    ('salesperson_accounts', 'role', 'text', 'NO'),
    ('salesperson_accounts', 'is_active', 'boolean', 'NO'),
    ('salesperson_accounts', 'created_at', 'timestamp with time zone', 'YES'),
    ('salesperson_accounts', 'updated_at', 'timestamp with time zone', 'YES'),

    ('invites', 'id', 'uuid', 'NO'),
    ('invites', 'email', 'text', 'NO'),
    ('invites', 'business_id', 'uuid', 'NO'),
    ('invites', 'role', 'text', 'NO'),
    ('invites', 'token', 'text', 'NO'),
    ('invites', 'expires_at', 'timestamp with time zone', 'NO'),
    ('invites', 'used_at', 'timestamp with time zone', 'YES'),
    ('invites', 'created_at', 'timestamp with time zone', 'YES'),

    ('salesperson_profiles', 'id', 'uuid', 'NO'),
    ('salesperson_profiles', 'rep_id', 'uuid', 'NO'),
    ('salesperson_profiles', 'version', 'integer', 'NO'),
    ('salesperson_profiles', 'business_id', 'uuid', 'YES'),
    ('salesperson_profiles', 'call_id', 'uuid', 'YES'),
    ('salesperson_profiles', 'metric_scores', 'jsonb', 'NO'),
    ('salesperson_profiles', 'weakest_dimension', 'text', 'YES'),
    ('salesperson_profiles', 'created_at', 'timestamp with time zone', 'YES'),

    ('sessions', 'id', 'uuid', 'NO'),
    ('sessions', 'rep_id', 'uuid', 'NO'),
    ('sessions', 'business_id', 'uuid', 'YES'),
    ('sessions', 'scenario', 'text', 'NO'),
    ('sessions', 'profile_version', 'integer', 'YES'),
    ('sessions', 'status', 'text', 'YES'),
    ('sessions', 'started_at', 'timestamp with time zone', 'YES'),
    ('sessions', 'ended_at', 'timestamp with time zone', 'YES'),
    ('sessions', 'duration_seconds', 'integer', 'YES'),
    ('sessions', 'metadata', 'jsonb', 'YES'),

    ('transcripts', 'id', 'uuid', 'NO'),
    ('transcripts', 'session_id', 'uuid', 'NO'),
    ('transcripts', 'speaker', 'text', 'NO'),
    ('transcripts', 'text', 'text', 'NO'),
    ('transcripts', 'timestamp_offset_ms', 'integer', 'YES'),
    ('transcripts', 'created_at', 'timestamp with time zone', 'YES'),

    ('scorecards', 'id', 'uuid', 'NO'),
    ('scorecards', 'session_id', 'uuid', 'NO'),
    ('scorecards', 'rep_id', 'uuid', 'NO'),
    ('scorecards', 'business_id', 'uuid', 'YES'),
    ('scorecards', 'call_duration_seconds', 'integer', 'YES'),
    ('scorecards', 'rep_talk_percentage', 'numeric(5,2)', 'YES'),
    ('scorecards', 'interruptions_count', 'integer', 'YES'),
    ('scorecards', 'filler_words_count', 'integer', 'YES'),
    ('scorecards', 'rapport_score', 'integer', 'YES'),
    ('scorecards', 'needs_discovery_score', 'integer', 'YES'),
    ('scorecards', 'objection_handling_score', 'integer', 'YES'),
    ('scorecards', 'closing_score', 'integer', 'YES'),
    ('scorecards', 'overall_score', 'integer', 'YES'),
    ('scorecards', 'framework_scores', 'jsonb', 'YES'),
    ('scorecards', 'strengths', 'text[]', 'YES'),
    ('scorecards', 'improvement_areas', 'text[]', 'YES'),
    ('scorecards', 'feedback_summary', 'text', 'YES'),
    ('scorecards', 'moments', 'jsonb', 'YES'),
    ('scorecards', 'status', 'text', 'YES'),
    ('scorecards', 'error_message', 'text', 'YES'),
    ('scorecards', 'processing_started_at', 'timestamp with time zone', 'YES'),
    ('scorecards', 'shared_with_manager', 'boolean', 'NO'),
    ('scorecards', 'created_at', 'timestamp with time zone', 'YES'),

    ('scenario_configs', 'id', 'uuid', 'NO'),
    ('scenario_configs', 'business_id', 'uuid', 'NO'),
    ('scenario_configs', 'scenario_slug', 'text', 'NO'),
    ('scenario_configs', 'title', 'text', 'YES'),
    ('scenario_configs', 'objective', 'text', 'YES'),
    ('scenario_configs', 'persona_notes', 'text', 'YES'),
    ('scenario_configs', 'created_at', 'timestamp with time zone', 'YES'),
    ('scenario_configs', 'updated_at', 'timestamp with time zone', 'YES')
),
actual_columns AS (
  SELECT
    cols.table_name,
    cols.column_name,
    format_type(attr.atttypid, attr.atttypmod) AS actual_type,
    cols.is_nullable AS actual_nullable
  FROM information_schema.columns cols
  JOIN pg_namespace ns
    ON ns.nspname = cols.table_schema
  JOIN pg_class cls
    ON cls.relnamespace = ns.oid
   AND cls.relname = cols.table_name
  JOIN pg_attribute attr
    ON attr.attrelid = cls.oid
   AND attr.attname = cols.column_name
   AND attr.attnum > 0
   AND NOT attr.attisdropped
  WHERE cols.table_schema = 'public'
)
SELECT
  'missing_column' AS finding,
  expected_columns.table_name,
  expected_columns.column_name,
  expected_columns.expected_type,
  expected_columns.expected_nullable,
  NULL::text AS actual_type,
  NULL::text AS actual_nullable
FROM expected_columns
LEFT JOIN actual_columns
  ON actual_columns.table_name = expected_columns.table_name
 AND actual_columns.column_name = expected_columns.column_name
WHERE actual_columns.column_name IS NULL

UNION ALL

SELECT
  'column_type_mismatch' AS finding,
  expected_columns.table_name,
  expected_columns.column_name,
  expected_columns.expected_type,
  expected_columns.expected_nullable,
  actual_columns.actual_type,
  actual_columns.actual_nullable
FROM expected_columns
JOIN actual_columns
  ON actual_columns.table_name = expected_columns.table_name
 AND actual_columns.column_name = expected_columns.column_name
WHERE actual_columns.actual_type <> expected_columns.expected_type
   OR actual_columns.actual_nullable <> expected_columns.expected_nullable
ORDER BY table_name, column_name, finding;

-- ---------------------------------------------------------------------------
-- 3. Required constraints and indexes
-- ---------------------------------------------------------------------------

WITH expected_constraints(table_name, constraint_name, constraint_type) AS (
  VALUES
    ('business_profiles', 'business_profiles_pkey', 'p'),
    ('salesperson_accounts', 'salesperson_accounts_pkey', 'p'),
    ('invites', 'invites_pkey', 'p'),
    ('invites', 'invites_token_key', 'u'),
    ('salesperson_profiles', 'salesperson_profiles_pkey', 'p'),
    ('salesperson_profiles', 'salesperson_profiles_rep_id_version_key', 'u'),
    ('sessions', 'sessions_pkey', 'p'),
    ('sessions', 'sessions_scenario_check', 'c'),
    ('sessions', 'sessions_status_check', 'c'),
    ('transcripts', 'transcripts_pkey', 'p'),
    ('scorecards', 'scorecards_pkey', 'p'),
    ('scorecards', 'scorecards_session_id_key', 'u'),
    ('scorecards', 'scorecards_status_check', 'c'),
    ('scenario_configs', 'scenario_configs_pkey', 'p'),
    ('scenario_configs', 'scenario_configs_business_id_scenario_slug_key', 'u')
),
actual_constraints AS (
  SELECT
    rel.relname AS table_name,
    con.conname AS constraint_name,
    con.contype::text AS constraint_type
  FROM pg_constraint con
  JOIN pg_class rel
    ON rel.oid = con.conrelid
  JOIN pg_namespace ns
    ON ns.oid = rel.relnamespace
  WHERE ns.nspname = 'public'
)
SELECT
  'missing_constraint' AS finding,
  expected_constraints.table_name,
  expected_constraints.constraint_name,
  expected_constraints.constraint_type
FROM expected_constraints
LEFT JOIN actual_constraints
  ON actual_constraints.table_name = expected_constraints.table_name
 AND actual_constraints.constraint_name = expected_constraints.constraint_name
 AND actual_constraints.constraint_type = expected_constraints.constraint_type
WHERE actual_constraints.constraint_name IS NULL
ORDER BY expected_constraints.table_name, expected_constraints.constraint_name;

WITH expected_indexes(table_name, index_name) AS (
  VALUES
    ('salesperson_accounts', 'idx_salesperson_accounts_business'),
    ('salesperson_accounts', 'idx_salesperson_accounts_employee'),
    ('salesperson_profiles', 'idx_salesperson_profiles_rep_latest'),
    ('transcripts', 'idx_transcripts_session'),
    ('transcripts', 'idx_transcripts_session_timestamp_speaker'),
    ('scorecards', 'idx_scorecards_rep')
),
actual_indexes AS (
  SELECT tablename AS table_name, indexname AS index_name, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT
  'missing_index' AS finding,
  expected_indexes.table_name,
  expected_indexes.index_name
FROM expected_indexes
LEFT JOIN actual_indexes
  ON actual_indexes.table_name = expected_indexes.table_name
 AND actual_indexes.index_name = expected_indexes.index_name
WHERE actual_indexes.index_name IS NULL
ORDER BY expected_indexes.table_name, expected_indexes.index_name;

-- ---------------------------------------------------------------------------
-- 4. RLS policy inventory
-- ---------------------------------------------------------------------------

WITH expected_rls_tables(table_name) AS (
  VALUES
    ('salesperson_profiles'),
    ('sessions'),
    ('transcripts'),
    ('scorecards')
)
SELECT
  'rls_disabled' AS finding,
  cls.relname AS table_name
FROM expected_rls_tables expected
JOIN pg_class cls
  ON cls.relname = expected.table_name
JOIN pg_namespace ns
  ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relrowsecurity IS DISTINCT FROM TRUE
ORDER BY cls.relname;

WITH expected_policies(table_name, policy_name, command) AS (
  VALUES
    ('salesperson_profiles', 'rep_own_profiles', 'SELECT'),
    ('sessions', 'rep_own_sessions', 'ALL'),
    ('transcripts', 'rep_own_transcripts', 'SELECT'),
    ('scorecards', 'rep_own_scorecards', 'SELECT')
)
SELECT
  'missing_policy' AS finding,
  expected_policies.table_name,
  expected_policies.policy_name,
  expected_policies.command
FROM expected_policies
LEFT JOIN pg_policies actual
  ON actual.schemaname = 'public'
 AND actual.tablename = expected_policies.table_name
 AND actual.policyname = expected_policies.policy_name
 AND actual.cmd = expected_policies.command
WHERE actual.policyname IS NULL
ORDER BY expected_policies.table_name, expected_policies.policy_name;

SELECT
  'actual_policy' AS finding,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('salesperson_profiles', 'sessions', 'transcripts', 'scorecards')
ORDER BY tablename, policyname;

-- ---------------------------------------------------------------------------
-- 5. Data volume overview
-- ---------------------------------------------------------------------------

SELECT 'row_count' AS finding, 'business_profiles' AS table_name, COUNT(*) AS row_count FROM business_profiles
UNION ALL
SELECT 'row_count', 'salesperson_accounts', COUNT(*) FROM salesperson_accounts
UNION ALL
SELECT 'row_count', 'salesperson_profiles', COUNT(*) FROM salesperson_profiles
UNION ALL
SELECT 'row_count', 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'row_count', 'transcripts', COUNT(*) FROM transcripts
UNION ALL
SELECT 'row_count', 'scorecards', COUNT(*) FROM scorecards
UNION ALL
SELECT 'row_count', 'scenario_configs', COUNT(*) FROM scenario_configs
ORDER BY table_name;

-- ---------------------------------------------------------------------------
-- 6. Orphans and ownership mismatches
-- ---------------------------------------------------------------------------

SELECT
  'orphan_session_missing_rep_account' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.status,
  sessions.started_at
FROM sessions
LEFT JOIN salesperson_accounts accounts
  ON accounts.id = sessions.rep_id
WHERE accounts.id IS NULL
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'orphan_session_missing_business' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.status,
  sessions.started_at
FROM sessions
LEFT JOIN business_profiles business
  ON business.id = sessions.business_id
WHERE business.id IS NULL
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'session_business_mismatch' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id AS session_business_id,
  accounts.business_id AS account_business_id,
  sessions.status,
  sessions.started_at
FROM sessions
JOIN salesperson_accounts accounts
  ON accounts.id = sessions.rep_id
WHERE sessions.business_id IS DISTINCT FROM accounts.business_id
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'orphan_transcript_missing_session' AS finding,
  transcripts.id AS transcript_id,
  transcripts.session_id,
  transcripts.speaker,
  transcripts.timestamp_offset_ms,
  transcripts.created_at
FROM transcripts
LEFT JOIN sessions
  ON sessions.id = transcripts.session_id
WHERE sessions.id IS NULL
ORDER BY transcripts.created_at DESC NULLS LAST;

SELECT
  'orphan_scorecard_missing_session' AS finding,
  scorecards.id AS scorecard_id,
  scorecards.session_id,
  scorecards.rep_id,
  scorecards.business_id,
  scorecards.status,
  scorecards.created_at
FROM scorecards
LEFT JOIN sessions
  ON sessions.id = scorecards.session_id
WHERE sessions.id IS NULL
ORDER BY scorecards.created_at DESC NULLS LAST;

SELECT
  'scorecard_session_owner_mismatch' AS finding,
  scorecards.id AS scorecard_id,
  scorecards.session_id,
  scorecards.rep_id AS scorecard_rep_id,
  sessions.rep_id AS session_rep_id,
  scorecards.business_id AS scorecard_business_id,
  sessions.business_id AS session_business_id,
  scorecards.status,
  scorecards.created_at
FROM scorecards
JOIN sessions
  ON sessions.id = scorecards.session_id
WHERE scorecards.rep_id IS DISTINCT FROM sessions.rep_id
   OR scorecards.business_id IS DISTINCT FROM sessions.business_id
ORDER BY scorecards.created_at DESC NULLS LAST;

SELECT
  'orphan_profile_missing_rep_account' AS finding,
  profiles.id AS profile_id,
  profiles.rep_id,
  profiles.business_id,
  profiles.version,
  profiles.call_id,
  profiles.created_at
FROM salesperson_profiles profiles
LEFT JOIN salesperson_accounts accounts
  ON accounts.id = profiles.rep_id
WHERE accounts.id IS NULL
ORDER BY profiles.created_at DESC NULLS LAST;

SELECT
  'orphan_profile_missing_business' AS finding,
  profiles.id AS profile_id,
  profiles.rep_id,
  profiles.business_id,
  profiles.version,
  profiles.call_id,
  profiles.created_at
FROM salesperson_profiles profiles
LEFT JOIN business_profiles business
  ON business.id = profiles.business_id
WHERE profiles.business_id IS NOT NULL
  AND business.id IS NULL
ORDER BY profiles.created_at DESC NULLS LAST;

SELECT
  'orphan_profile_missing_session' AS finding,
  profiles.id AS profile_id,
  profiles.rep_id,
  profiles.business_id,
  profiles.version,
  profiles.call_id,
  profiles.created_at
FROM salesperson_profiles profiles
LEFT JOIN sessions
  ON sessions.id = profiles.call_id
WHERE profiles.call_id IS NOT NULL
  AND sessions.id IS NULL
ORDER BY profiles.created_at DESC NULLS LAST;

SELECT
  'profile_session_owner_mismatch' AS finding,
  profiles.id AS profile_id,
  profiles.call_id AS session_id,
  profiles.rep_id AS profile_rep_id,
  sessions.rep_id AS session_rep_id,
  profiles.business_id AS profile_business_id,
  sessions.business_id AS session_business_id,
  profiles.version,
  profiles.created_at
FROM salesperson_profiles profiles
JOIN sessions
  ON sessions.id = profiles.call_id
WHERE profiles.rep_id IS DISTINCT FROM sessions.rep_id
   OR profiles.business_id IS DISTINCT FROM sessions.business_id
ORDER BY profiles.created_at DESC NULLS LAST;

-- ---------------------------------------------------------------------------
-- 7. Demo-week leftovers, stubs, and incomplete processing
-- ---------------------------------------------------------------------------

SELECT
  'stale_active_session' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.status,
  sessions.started_at,
  sessions.ended_at,
  sessions.metadata
FROM sessions
WHERE sessions.status = 'active'
  AND sessions.started_at < NOW() - INTERVAL '2 hours'
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'completed_session_without_transcript' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.status,
  sessions.started_at,
  sessions.ended_at
FROM sessions
WHERE sessions.status = 'completed'
  AND NOT EXISTS (
    SELECT 1
    FROM transcripts
    WHERE transcripts.session_id = sessions.id
  )
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'abandoned_session_with_transcript' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.status,
  sessions.started_at,
  sessions.ended_at,
  COUNT(transcripts.id) AS transcript_count
FROM sessions
JOIN transcripts
  ON transcripts.session_id = sessions.id
WHERE sessions.status = 'abandoned'
GROUP BY sessions.id
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'completed_session_without_scorecard' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.status,
  sessions.started_at,
  sessions.ended_at
FROM sessions
WHERE sessions.status = 'completed'
  AND NOT EXISTS (
    SELECT 1
    FROM scorecards
    WHERE scorecards.session_id = sessions.id
  )
ORDER BY sessions.started_at DESC NULLS LAST;

SELECT
  'stale_processing_scorecard' AS finding,
  scorecards.id AS scorecard_id,
  scorecards.session_id,
  scorecards.rep_id,
  scorecards.business_id,
  scorecards.status,
  scorecards.processing_started_at,
  scorecards.created_at
FROM scorecards
WHERE scorecards.status = 'processing'
  AND COALESCE(scorecards.processing_started_at, scorecards.created_at) < NOW() - INTERVAL '30 minutes'
ORDER BY COALESCE(scorecards.processing_started_at, scorecards.created_at) DESC NULLS LAST;

SELECT
  'stub_or_unfinished_scorecard' AS finding,
  scorecards.id AS scorecard_id,
  scorecards.session_id,
  scorecards.rep_id,
  scorecards.business_id,
  scorecards.status,
  scorecards.overall_score,
  scorecards.feedback_summary,
  scorecards.error_message,
  scorecards.created_at
FROM scorecards
WHERE scorecards.feedback_summary IN ('Analysis pending (stub).', 'Analysis processing.')
   OR scorecards.error_message ILIKE '%stub%'
   OR (
     scorecards.overall_score IS NULL
     AND scorecards.status IN ('generated', 'failed')
   )
ORDER BY scorecards.created_at DESC NULLS LAST;

SELECT
  'generated_scorecard_missing_required_scores' AS finding,
  scorecards.id AS scorecard_id,
  scorecards.session_id,
  scorecards.rep_id,
  scorecards.business_id,
  scorecards.rapport_score,
  scorecards.needs_discovery_score,
  scorecards.objection_handling_score,
  scorecards.closing_score,
  scorecards.overall_score,
  scorecards.created_at
FROM scorecards
WHERE scorecards.status = 'generated'
  AND (
    scorecards.rapport_score IS NULL
    OR scorecards.needs_discovery_score IS NULL
    OR scorecards.objection_handling_score IS NULL
    OR scorecards.closing_score IS NULL
    OR scorecards.overall_score IS NULL
  )
ORDER BY scorecards.created_at DESC NULLS LAST;

-- ---------------------------------------------------------------------------
-- 8. Duplicate rows that should not exist
-- ---------------------------------------------------------------------------

SELECT
  'duplicate_scorecards_per_session' AS finding,
  scorecards.session_id,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(scorecards.id ORDER BY scorecards.created_at, scorecards.id) AS scorecard_ids
FROM scorecards
GROUP BY scorecards.session_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, scorecards.session_id;

SELECT
  'duplicate_transcript_turn' AS finding,
  transcripts.session_id,
  transcripts.timestamp_offset_ms,
  transcripts.speaker,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(transcripts.id ORDER BY transcripts.created_at, transcripts.id) AS transcript_ids
FROM transcripts
GROUP BY transcripts.session_id, transcripts.timestamp_offset_ms, transcripts.speaker
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, transcripts.session_id, transcripts.timestamp_offset_ms;

SELECT
  'duplicate_profile_version' AS finding,
  profiles.rep_id,
  profiles.business_id,
  profiles.version,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(profiles.id ORDER BY profiles.created_at, profiles.id) AS profile_ids
FROM salesperson_profiles profiles
GROUP BY profiles.rep_id, profiles.business_id, profiles.version
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, profiles.rep_id, profiles.business_id, profiles.version;

SELECT
  'duplicate_profile_insert_per_session' AS finding,
  profiles.call_id AS session_id,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(profiles.id ORDER BY profiles.created_at, profiles.id) AS profile_ids
FROM salesperson_profiles profiles
WHERE profiles.call_id IS NOT NULL
GROUP BY profiles.call_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, profiles.call_id;

-- ---------------------------------------------------------------------------
-- 9. Profile version-chain integrity
-- ---------------------------------------------------------------------------

WITH ordered_profiles AS (
  SELECT
    profiles.*,
    MIN(profiles.version) OVER (
      PARTITION BY profiles.rep_id, profiles.business_id
    ) AS min_version,
    LAG(profiles.version) OVER (
      PARTITION BY profiles.rep_id, profiles.business_id
      ORDER BY profiles.version, profiles.created_at, profiles.id
    ) AS previous_version,
    LAG(profiles.created_at) OVER (
      PARTITION BY profiles.rep_id, profiles.business_id
      ORDER BY profiles.version, profiles.created_at, profiles.id
    ) AS previous_created_at
  FROM salesperson_profiles profiles
)
SELECT
  'profile_version_gap_or_bad_start' AS finding,
  ordered_profiles.id AS profile_id,
  ordered_profiles.rep_id,
  ordered_profiles.business_id,
  ordered_profiles.version,
  ordered_profiles.previous_version,
  ordered_profiles.min_version,
  ordered_profiles.call_id,
  ordered_profiles.created_at
FROM ordered_profiles
WHERE (
    ordered_profiles.previous_version IS NULL
    AND ordered_profiles.min_version NOT IN (0, 1)
  )
   OR (
    ordered_profiles.previous_version IS NOT NULL
    AND ordered_profiles.version <> ordered_profiles.previous_version + 1
  )
ORDER BY ordered_profiles.rep_id, ordered_profiles.business_id, ordered_profiles.version;

WITH ordered_profiles AS (
  SELECT
    profiles.*,
    LAG(profiles.created_at) OVER (
      PARTITION BY profiles.rep_id, profiles.business_id
      ORDER BY profiles.version, profiles.id
    ) AS previous_created_at
  FROM salesperson_profiles profiles
)
SELECT
  'profile_created_at_not_monotonic_with_version' AS finding,
  ordered_profiles.id AS profile_id,
  ordered_profiles.rep_id,
  ordered_profiles.business_id,
  ordered_profiles.version,
  ordered_profiles.call_id,
  ordered_profiles.previous_created_at,
  ordered_profiles.created_at
FROM ordered_profiles
WHERE ordered_profiles.previous_created_at IS NOT NULL
  AND ordered_profiles.created_at < ordered_profiles.previous_created_at
ORDER BY ordered_profiles.rep_id, ordered_profiles.business_id, ordered_profiles.version;

SELECT
  'generated_scorecard_without_profile_version' AS finding,
  sessions.id AS session_id,
  sessions.rep_id,
  sessions.business_id,
  sessions.started_at,
  scorecards.id AS scorecard_id,
  scorecards.created_at AS scorecard_created_at
FROM sessions
JOIN scorecards
  ON scorecards.session_id = sessions.id
WHERE sessions.status = 'completed'
  AND scorecards.status = 'generated'
  AND NOT EXISTS (
    SELECT 1
    FROM salesperson_profiles profiles
    WHERE profiles.call_id = sessions.id
  )
ORDER BY sessions.started_at DESC NULLS LAST;

WITH expected_session_profile_versions AS (
  SELECT
    sessions.id AS session_id,
    sessions.rep_id,
    sessions.business_id,
    sessions.profile_version,
    sessions.started_at,
    COALESCE((
      SELECT MAX(profiles.version)
      FROM salesperson_profiles profiles
      WHERE profiles.rep_id = sessions.rep_id
        AND profiles.business_id = sessions.business_id
        AND profiles.created_at <= sessions.started_at
    ), 0) AS expected_profile_version
  FROM sessions
)
SELECT
  'session_profile_version_drift' AS finding,
  session_id,
  rep_id,
  business_id,
  profile_version,
  expected_profile_version,
  started_at
FROM expected_session_profile_versions
WHERE profile_version IS DISTINCT FROM expected_profile_version
ORDER BY started_at DESC NULLS LAST;

SELECT
  'profile_metric_shape_issue' AS finding,
  profiles.id AS profile_id,
  profiles.rep_id,
  profiles.business_id,
  profiles.version,
  profiles.call_id,
  profiles.weakest_dimension,
  profiles.metric_scores,
  profiles.created_at
FROM salesperson_profiles profiles
WHERE jsonb_typeof(profiles.metric_scores) IS DISTINCT FROM 'object'
   OR NOT (profiles.metric_scores ? 'rapport')
   OR NOT (
     profiles.metric_scores ? 'discovery'
     OR profiles.metric_scores ? 'needs_discovery'
   )
   OR NOT (profiles.metric_scores ? 'objection_handling')
   OR NOT (profiles.metric_scores ? 'closing')
   OR (
     profiles.weakest_dimension IS NOT NULL
     AND profiles.weakest_dimension NOT IN (
       'rapport',
       'discovery',
       'needs_discovery',
       'objection_handling',
       'closing'
     )
   )
ORDER BY profiles.created_at DESC NULLS LAST;

-- ---------------------------------------------------------------------------
-- 10. Optional RLS enforcement smoke test
-- ---------------------------------------------------------------------------
--
-- Do not run this with the service-role API key. Service role bypasses RLS.
--
-- Pick two real reps in the same or different businesses:
--   REP_A_UUID = the auth.uid() you are pretending to be
--   REP_B_UUID = a different rep whose rows must be hidden
--   REP_B_SESSION_UUID = a session owned by REP_B_UUID
--
-- Expected:
-- - own_*_visible should be > 0 when that rep has rows.
-- - cross_rep_*_visible should be 0.
-- - If own_* is 0 for a rep that definitely has data, grants or policies are
--   blocking too much and the test is inconclusive.
--
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', 'REP_A_UUID', true);
-- SELECT set_config(
--   'request.jwt.claims',
--   jsonb_build_object('sub', 'REP_A_UUID', 'role', 'authenticated')::text,
--   true
-- );
--
-- SELECT
--   'own_sessions_visible' AS check_name,
--   COUNT(*) AS visible_rows
-- FROM sessions
-- WHERE rep_id = 'REP_A_UUID'::uuid;
--
-- SELECT
--   'cross_rep_sessions_visible' AS check_name,
--   COUNT(*) AS visible_rows
-- FROM sessions
-- WHERE rep_id = 'REP_B_UUID'::uuid;
--
-- SELECT
--   'cross_rep_scorecards_visible' AS check_name,
--   COUNT(*) AS visible_rows
-- FROM scorecards
-- WHERE rep_id = 'REP_B_UUID'::uuid;
--
-- SELECT
--   'cross_rep_profiles_visible' AS check_name,
--   COUNT(*) AS visible_rows
-- FROM salesperson_profiles
-- WHERE rep_id = 'REP_B_UUID'::uuid;
--
-- SELECT
--   'cross_rep_transcripts_visible' AS check_name,
--   COUNT(*) AS visible_rows
-- FROM transcripts
-- WHERE session_id = 'REP_B_SESSION_UUID'::uuid;
--
-- ROLLBACK;
