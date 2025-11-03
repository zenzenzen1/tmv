-- Create PerformanceMatch table for quyền/võ nhạc matches
-- This migration creates performance_matches table and renames assessors to match_assessors

-- Create performance_matches table
CREATE TABLE performance_matches (
    id UUID PRIMARY KEY,
    competition_id UUID NOT NULL,
    performance_id UUID NOT NULL UNIQUE,
    match_order INTEGER,
    scheduled_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    content_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (performance_id) REFERENCES performances(id),
    
    CONSTRAINT chk_performance_match_content_type CHECK (content_type IN ('QUYEN', 'MUSIC')),
    CONSTRAINT chk_performance_match_status CHECK (status IN ('PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Create indexes for performance_matches
CREATE INDEX idx_performance_matches_competition ON performance_matches(competition_id);
CREATE INDEX idx_performance_matches_performance ON performance_matches(performance_id);
CREATE INDEX idx_performance_matches_content_type ON performance_matches(content_type);
CREATE INDEX idx_performance_matches_status ON performance_matches(status);
CREATE INDEX idx_performance_matches_match_order ON performance_matches(competition_id, match_order);

-- Rename assessors table to match_assessors
ALTER TABLE assessors RENAME TO match_assessors;

-- Rename constraint names to match new table name
DO $$
BEGIN
    -- Drop old constraints and indexes
    DROP INDEX IF EXISTS uk_assessor_performance;
    DROP INDEX IF EXISTS uk_assessor_match_user_role;
    DROP INDEX IF EXISTS idx_assessors_performance_id;
    DROP INDEX IF EXISTS idx_assessors_match_id;
    DROP INDEX IF EXISTS idx_assessors_role;
    DROP INDEX IF EXISTS idx_assessors_position;
    
    -- Drop foreign key constraints
    ALTER TABLE match_assessors 
        DROP CONSTRAINT IF EXISTS assessors_performance_id_fkey;
    
    -- Recreate foreign key with new name
    ALTER TABLE match_assessors 
        ADD CONSTRAINT match_assessors_performance_id_fkey 
        FOREIGN KEY (performance_id) REFERENCES performances(id);
END $$;

-- Add performance_match_id column to match_assessors
ALTER TABLE match_assessors 
    ADD COLUMN IF NOT EXISTS performance_match_id UUID;

-- Add foreign key for performance_match_id
ALTER TABLE match_assessors 
    ADD CONSTRAINT match_assessors_performance_match_id_fkey 
    FOREIGN KEY (performance_match_id) REFERENCES performance_matches(id);

-- Create new unique constraints for match_assessors
-- For performance-level assessors (quyền/võ nhạc): one user per performance
CREATE UNIQUE INDEX uk_match_assessor_performance 
    ON match_assessors (user_id, performance_id) 
    WHERE performance_id IS NOT NULL;

-- For performance match assessors: one user per performance_match
CREATE UNIQUE INDEX uk_match_assessor_performance_match 
    ON match_assessors (performance_match_id, user_id) 
    WHERE performance_match_id IS NOT NULL;

-- For match-level assessors (đối kháng): one role per match per user
CREATE UNIQUE INDEX uk_match_assessor_match_user_role 
    ON match_assessors (match_id, user_id, role) 
    WHERE match_id IS NOT NULL AND role IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_match_assessors_performance_id ON match_assessors(performance_id);
CREATE INDEX IF NOT EXISTS idx_match_assessors_performance_match_id ON match_assessors(performance_match_id);
CREATE INDEX IF NOT EXISTS idx_match_assessors_match_id ON match_assessors(match_id);
CREATE INDEX IF NOT EXISTS idx_match_assessors_role ON match_assessors(role);
CREATE INDEX IF NOT EXISTS idx_match_assessors_position ON match_assessors(match_id, position);
CREATE INDEX IF NOT EXISTS idx_match_assessors_user_id ON match_assessors(user_id);
CREATE INDEX IF NOT EXISTS idx_match_assessors_specialization ON match_assessors(specialization);

