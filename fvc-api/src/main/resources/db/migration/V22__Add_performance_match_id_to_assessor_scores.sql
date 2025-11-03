-- Add performance_match_id to assessor_scores and migrate existing data
ALTER TABLE assessor_scores
ADD COLUMN IF NOT EXISTS performance_match_id UUID;

-- Backfill from assessor -> performance_match if possible
UPDATE assessor_scores s
SET performance_match_id = a.performance_match_id
FROM match_assessors a
WHERE s.assessor_id = a.id
  AND s.performance_match_id IS NULL
  AND a.performance_match_id IS NOT NULL;

-- Create FK and index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_assessor_scores_performance_match') THEN
    ALTER TABLE assessor_scores
    ADD CONSTRAINT fk_assessor_scores_performance_match
      FOREIGN KEY (performance_match_id)
      REFERENCES performance_matches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assessor_scores_performance_match
  ON assessor_scores(performance_match_id);

-- Drop old unique and add new unique by (performance_match_id, assessor_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uk_performance_assessor') THEN
    ALTER TABLE assessor_scores DROP CONSTRAINT uk_performance_assessor;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uk_match_assessor_unique') THEN
    ALTER TABLE assessor_scores
      ADD CONSTRAINT uk_match_assessor_unique UNIQUE (performance_match_id, assessor_id);
  END IF;
END $$;


