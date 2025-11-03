-- Add duration_seconds to performance_matches to persist planned timer
ALTER TABLE performance_matches
ADD COLUMN IF NOT EXISTS duration_seconds INT;

CREATE INDEX IF NOT EXISTS idx_performance_matches_duration_seconds ON performance_matches(duration_seconds);

