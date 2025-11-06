-- Add columns for round types and durations
ALTER TABLE matches_round 
ADD COLUMN IF NOT EXISTS round_type VARCHAR(20) NOT NULL DEFAULT 'MAIN',
ADD COLUMN IF NOT EXISTS scheduled_duration_seconds INTEGER;

-- Add columns for main and tiebreaker durations to matches
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS main_round_duration_seconds INTEGER NOT NULL DEFAULT 120,
ADD COLUMN IF NOT EXISTS tiebreaker_duration_seconds INTEGER NOT NULL DEFAULT 60;

-- Update existing matches to set main_round_duration_seconds from round_duration_seconds
UPDATE matches
SET main_round_duration_seconds = round_duration_seconds
WHERE main_round_duration_seconds IS NULL OR main_round_duration_seconds = 120;

-- Update existing rounds:
-- Round 1-2: MAIN with main_round_duration_seconds
-- Round 3+: TIEBREAKER with tiebreaker_duration_seconds
DO $$
DECLARE
    match_record RECORD;
    round_record RECORD;
BEGIN
    FOR match_record IN SELECT id, main_round_duration_seconds, tiebreaker_duration_seconds FROM matches WHERE deleted_at IS NULL
    LOOP
        -- Update rounds for this match
        FOR round_record IN SELECT id, round_number FROM matches_round WHERE match_id = match_record.id
        LOOP
            IF round_record.round_number <= 2 THEN
                -- Main round
                UPDATE matches_round
                SET round_type = 'MAIN',
                    scheduled_duration_seconds = match_record.main_round_duration_seconds
                WHERE id = round_record.id;
            ELSE
                -- Tiebreaker round
                UPDATE matches_round
                SET round_type = 'TIEBREAKER',
                    scheduled_duration_seconds = match_record.tiebreaker_duration_seconds
                WHERE id = round_record.id;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add constraint for round_type
ALTER TABLE matches_round
ADD CONSTRAINT chk_matches_round_type CHECK (round_type IN ('MAIN', 'TIEBREAKER'));

