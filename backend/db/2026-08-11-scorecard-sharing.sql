ALTER TABLE scorecards
  ADD COLUMN IF NOT EXISTS shared_with_manager BOOLEAN NOT NULL DEFAULT false;
