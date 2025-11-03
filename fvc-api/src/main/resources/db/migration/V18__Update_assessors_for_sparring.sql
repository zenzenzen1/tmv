-- Update assessors table to support both performance-level (quyền/võ nhạc) and match-level (đối kháng) assessors
-- This migration changes from competition_id to performance_id for quyền/võ nhạc and adds support for sparring matches

-- Rename competition_id to performance_id (quyền/võ nhạc assessors are assigned to specific performances)
ALTER TABLE assessors 
    RENAME COLUMN competition_id TO performance_id;

-- Change foreign key from competitions to performances
ALTER TABLE assessors 
    DROP CONSTRAINT IF EXISTS assessors_competition_id_fkey;
    
ALTER TABLE assessors 
    ADD CONSTRAINT assessors_performance_id_fkey 
    FOREIGN KEY (performance_id) REFERENCES performances(id);

-- Make performance_id nullable (for sparring matches)
ALTER TABLE assessors 
    ALTER COLUMN performance_id DROP NOT NULL;

-- Add match_id column for sparring matches (nullable for quyền/võ nhạc)
ALTER TABLE assessors 
    ADD COLUMN IF NOT EXISTS match_id VARCHAR(255);

-- Add role column (JUDGER/ASSESSOR) for sparring matches (nullable for quyền/võ nhạc)
ALTER TABLE assessors 
    ADD COLUMN IF NOT EXISTS role VARCHAR(20);

-- Add position column for sparring matches (nullable for quyền/võ nhạc)
ALTER TABLE assessors 
    ADD COLUMN IF NOT EXISTS position INTEGER;

-- Add notes column (to match the structure in the image)
ALTER TABLE assessors 
    ADD COLUMN IF NOT EXISTS notes VARCHAR(500);

-- Drop old unique constraint
ALTER TABLE assessors 
    DROP CONSTRAINT IF EXISTS uk_assessor_competition;

-- Create new unique constraint for performance-level assessors (only when performance_id is not null)
-- This ensures one user can only be assessor once per performance
CREATE UNIQUE INDEX uk_assessor_performance 
    ON assessors (user_id, performance_id) 
    WHERE performance_id IS NOT NULL;

-- Create unique constraint for match-level assessors 
-- This ensures one user can only have one role per match
-- Note: For PostgreSQL, partial indexes work well with WHERE clause
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'uk_assessor_match_user_role'
    ) THEN
        CREATE UNIQUE INDEX uk_assessor_match_user_role 
            ON assessors (match_id, user_id, role) 
            WHERE match_id IS NOT NULL AND role IS NOT NULL;
    END IF;
END $$;

-- Update index name from competition to performance
DROP INDEX IF EXISTS idx_assessor_competition;
CREATE INDEX IF NOT EXISTS idx_assessors_performance_id ON assessors(performance_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assessors_match_id ON assessors(match_id);
CREATE INDEX IF NOT EXISTS idx_assessors_role ON assessors(role);
CREATE INDEX IF NOT EXISTS idx_assessors_position ON assessors(match_id, position);

