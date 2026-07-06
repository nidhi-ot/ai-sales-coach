ALTER TABLE scorecards
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS error_message TEXT;

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
