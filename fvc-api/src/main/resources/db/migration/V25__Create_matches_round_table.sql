-- Create matches_round table to manage individual rounds
-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS matches_round (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    round_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    red_score INTEGER NOT NULL DEFAULT 0,
    blue_score INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_matches_round_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT uk_matches_round_match_round UNIQUE (match_id, round_number),
    CONSTRAINT chk_matches_round_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'PAUSED', 'ENDED'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matches_round_match ON matches_round(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_round_round_number ON matches_round(match_id, round_number);

-- Migrate existing matches to create initial rounds
-- For each match, create rounds based on total_rounds
DO $$
DECLARE
    match_record RECORD;
    round_num INTEGER;
BEGIN
    FOR match_record IN SELECT id, total_rounds, current_round, status FROM matches WHERE deleted_at IS NULL
    LOOP
        -- Create rounds for this match
        FOR round_num IN 1..match_record.total_rounds
        LOOP
            INSERT INTO matches_round (
                id,
                match_id,
                round_number,
                status,
                started_at,
                red_score,
                blue_score,
                created_at,
                updated_at
            )
            VALUES (
                uuid_generate_v4()::TEXT,
                match_record.id,
                round_num,
                CASE 
                    WHEN round_num < match_record.current_round THEN 'ENDED'
                    WHEN round_num = match_record.current_round AND match_record.status = 'IN_PROGRESS' THEN 'IN_PROGRESS'
                    WHEN round_num = match_record.current_round AND match_record.status = 'PAUSED' THEN 'PAUSED'
                    WHEN match_record.status = 'ENDED' AND round_num <= match_record.current_round THEN 'ENDED'
                    ELSE 'PENDING'
                END,
                CASE WHEN round_num <= match_record.current_round AND match_record.status IN ('IN_PROGRESS', 'PAUSED', 'ENDED') 
                     THEN CURRENT_TIMESTAMP 
                     ELSE NULL 
                END,
                0,
                0,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (match_id, round_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

