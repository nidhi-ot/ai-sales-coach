ALTER TABLE scorecards
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

UPDATE scorecards
SET status = CASE
    WHEN overall_score IS NOT NULL THEN 'generated'
    WHEN feedback_summary = 'Analysis pending (stub).' THEN 'failed'
    WHEN COALESCE(feedback_summary, '') <> 'Analysis processing.' THEN 'failed'
    ELSE status
  END;

UPDATE scorecards
SET processing_started_at = NULL
WHERE status IN ('generated', 'failed');

UPDATE scorecards
SET processing_started_at = COALESCE(processing_started_at, created_at, NOW())
WHERE status = 'processing';

DO $$
BEGIN
  ALTER TABLE scorecards
    ADD CONSTRAINT scorecards_status_check
    CHECK (status IN ('processing', 'generated', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

WITH ranked_transcripts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, timestamp_offset_ms, speaker
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS duplicate_rank
  FROM transcripts
)
DELETE FROM transcripts
WHERE id IN (
  SELECT id
  FROM ranked_transcripts
  WHERE duplicate_rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transcripts_session_timestamp_speaker
  ON transcripts(session_id, timestamp_offset_ms, speaker);
