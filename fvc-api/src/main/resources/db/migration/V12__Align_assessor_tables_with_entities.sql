-- Align database schema with JPA entity mappings for Assessor and AssessorScore
-- 1) Rename table assessors -> match_assessors if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'assessors'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'match_assessors'
  ) THEN
    EXECUTE 'ALTER TABLE assessors RENAME TO match_assessors';
  END IF;
END $$;

-- 2) Ensure required columns exist on match_assessors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'match_assessors'
  ) THEN
    -- performance_match_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'match_assessors' AND column_name = 'performance_match_id'
    ) THEN
      EXECUTE 'ALTER TABLE match_assessors ADD COLUMN performance_match_id UUID NULL';
    END IF;
    -- performance_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'match_assessors' AND column_name = 'performance_id'
    ) THEN
      EXECUTE 'ALTER TABLE match_assessors ADD COLUMN performance_id UUID NULL';
    END IF;
    -- match_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'match_assessors' AND column_name = 'match_id'
    ) THEN
      EXECUTE 'ALTER TABLE match_assessors ADD COLUMN match_id VARCHAR(255) NULL';
    END IF;
    -- role
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'match_assessors' AND column_name = 'role'
    ) THEN
      EXECUTE 'ALTER TABLE match_assessors ADD COLUMN role VARCHAR(20) NULL';
    END IF;
    -- position
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'match_assessors' AND column_name = 'position'
    ) THEN
      EXECUTE 'ALTER TABLE match_assessors ADD COLUMN position INTEGER NULL';
    END IF;
    -- notes
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'match_assessors' AND column_name = 'notes'
    ) THEN
      EXECUTE 'ALTER TABLE match_assessors ADD COLUMN notes VARCHAR(500) NULL';
    END IF;
  END IF;
END $$;

-- 3) Ensure unique constraints exist per entity comments
-- Drop possible conflicting unique constraints if they exist
DO $$
BEGIN
  -- Drop uk_assessor_competition if present (from older schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'uk_assessor_competition'
  ) THEN
    EXECUTE 'ALTER TABLE match_assessors DROP CONSTRAINT uk_assessor_competition';
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore if table doesn't exist yet
  NULL;
END $$;

-- Create new unique constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'uk_match_assessor_performance'
  ) THEN
    EXECUTE 'ALTER TABLE match_assessors ADD CONSTRAINT uk_match_assessor_performance UNIQUE (user_id, performance_id)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'uk_match_assessor_performance_match'
  ) THEN
    EXECUTE 'ALTER TABLE match_assessors ADD CONSTRAINT uk_match_assessor_performance_match UNIQUE (performance_match_id, user_id)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'uk_match_assessor_match_user_role'
  ) THEN
    EXECUTE 'ALTER TABLE match_assessors ADD CONSTRAINT uk_match_assessor_match_user_role UNIQUE (match_id, user_id, role)';
  END IF;
END $$;

-- 4) Point assessor_scores.assessor_id FK to match_assessors(id)
DO $$
DECLARE
  fk_name text;
BEGIN
  -- Find existing FK name on assessor_scores.assessor_id if any
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'assessor_scores'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'assessor_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE assessor_scores DROP CONSTRAINT %I', fk_name);
  END IF;

  -- Add FK to match_assessors
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'match_assessors'
  ) THEN
    EXECUTE 'ALTER TABLE assessor_scores ADD CONSTRAINT fk_assessor_scores_assessor FOREIGN KEY (assessor_id) REFERENCES match_assessors(id)';
  END IF;
END $$;


