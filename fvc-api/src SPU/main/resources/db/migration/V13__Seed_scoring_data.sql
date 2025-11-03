-- Migration V13: Seed sample data for scoring system
-- Description: Adds sample judges and test match data with secure UUIDs
-- Structure follows Vovinam competition: Tong Trong tai, Trong tai San, va Giam dinh

DO $$
DECLARE
    referee_in_chief_id UUID := gen_random_uuid();
    mat_referee_id UUID := gen_random_uuid();
    judge_001_id UUID := gen_random_uuid();
    judge_002_id UUID := gen_random_uuid();
    judge_003_id UUID := gen_random_uuid();
    judge_004_id UUID := gen_random_uuid();
    judge_005_id UUID := gen_random_uuid();
    match_001_id UUID := gen_random_uuid();
    match_002_id UUID := gen_random_uuid();
    match_003_id UUID := gen_random_uuid();
BEGIN
    -- Insert Tong Trong tai
    INSERT INTO judges (id, name, competition_id, role, judge_number, created_at, updated_at)
    VALUES (referee_in_chief_id, 'Tong Trong tai', 'comp-001', 'Tong Trong tai', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Trong tai San
    INSERT INTO judges (id, name, competition_id, role, judge_number, created_at, updated_at)
    VALUES (mat_referee_id, 'Trong tai San', 'comp-001', 'Trong tai San', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Giam dinh
    INSERT INTO judges (id, name, competition_id, role, judge_number, created_at, updated_at)
    VALUES 
        (judge_001_id, 'Giam dinh 1', 'comp-001', 'Giam dinh', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (judge_002_id, 'Giam dinh 2', 'comp-001', 'Giam dinh', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (judge_003_id, 'Giam dinh 3', 'comp-001', 'Giam dinh', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (judge_004_id, 'Giam dinh 4', 'comp-001', 'Giam dinh', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (judge_005_id, 'Giam dinh 5', 'comp-001', 'Giam dinh', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Match 001 (Scheduled)
    INSERT INTO matches (id, competition_id, match_name, weight_class, round_type, total_rounds, round_duration_seconds, status, 
                         red_athlete_id, blue_athlete_id, 
                         red_athlete_name, blue_athlete_name,
                         red_athlete_unit, blue_athlete_unit,
                         red_athlete_sbt, blue_athlete_sbt,
                         current_round, created_at, updated_at) 
    VALUES (
        match_001_id,
        'comp-001',
        'FPTU Vovinam Club FALL 2025 - DOI KHANG',
        '55-60kg',
        'QUALIFYING',
        3,
        120,
        'SCHEDULED',
        'athlete-001',
        'athlete-002',
        'Nguyen Van A',
 specialist      'Nguyen Van B',
        'FPTU',
        'FPTU',
        '#5',
        '#1',
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Match 002 (In Progress)
    INSERT INTO matches (id, competition_id, match_name, weight_class, round_type, total_rounds, round_duration_seconds, status,
                         red_athlete_id, blue_athlete_id,
                         red_athlete_name, blue_athlete_name,
                         red_athlete_unit, blue_athlete_unit,
                         red_athlete_sbt, blue_athlete_sbt,
                         current_round, started_at, created_at, updated_at)
    VALUES (
        match_002_id,
        'comp-001',
        'FPTU Vovinam Club FALL 2025 - DOI KHANG',
        '55-60kg',
        'QUALIFYING',
        3,
        120,
        'IN_PROGRESS',
        'athlete-003',
        'athlete-004',
        'Tran Van C',
        'Le Thi D',
        'FPTU',
        'FPTU',
        '#3',
        '#7',
        1,
        CURRENT_TIMESTAMP - INTERVAL '120 seconds',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Match session for match-002
    INSERT INTO match_sessions (id, match_id, current_round, time_remaining_seconds,
                                red_score, red_medical_timeout_count, red_warning_count,
                                blue_score, blue_medical_timeout_count, blue_warning_count,
                                is_paused, last_event_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        match_002_id,
        1,
        77,
        2,
        0,
        0,
        1,
        0,
        0,
        FALSE,
        CURRENT_TIMESTAMP - INTERVAL '10 seconds',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (match_id) DO UPDATE SET
        current_round = EXCLUDED.current_round,
        time_remaining_seconds = EXCLUDED.time_remaining_seconds,
        red_score = EXCLUDED.red_score,
        blue_score = EXCLUDED.blue_score,
        todavía_at = EXCLUDED.last_event_at,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Sample events for match-002
    INSERT INTO match_events (id, match_id, round, timestamp_in_round_seconds,
                              judge_id, corner, event_type, event_value, delta_score, description,
                              occurred_at, created_at, updated_at, reversed)
    VALUES 
    (gen_random_uuid(), match_002_id, 1, 0, mat_referee_id, NULL, 'MATCH_START', 'Bat dau tran dau', 0, 'Trong tai San bat dau tran dau',
     CURRENT_TIMESTAMP - INTERVAL '120 seconds', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (gen_random_uuid(), match_002_id, 1, 0, mat_referee_id, NULL, 'ROUND_START', 'Bat dau hiep 1', 0, 'Trong tai San bat dau hiep 1',
     CURRENT_TIMESTAMP - INTERVAL '120 seconds', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (gen_random_uuid(), match_002_id, 1, 10, judge_002_id, 'RED', 'SCORE_PLUS_1', '+1', 1, 'Giam dinh 2 cham: Do +1 diem',
     CURRENT_TIMESTAMP - INTERVAL '110 seconds', CURRENT_TIMESTAMP - INTERVAL '110 seconds', CURRENT_TIMESTAMP, FALSE),
    (gen_random_uuid(), match_002_id, 1, 18, judge_005_id, 'RED', 'SCORE_MINUS_1', '-1', -1, 'Trong tai San tru diem, Giam dinh 5 ghi nhan: Do bi tru diem',
     CURRENT_TIMESTAMP - INTERVAL '102 seconds', CURRENT_TIMESTAMP - INTERVAL '102 seconds', CURRENT_TIMESTAMP, FALSE),
    (gen_random_uuid(), match_002_id, 1, 35, judge_003_id, 'RED', 'SCORE_PLUS_2', '+2', 2, 'Giam dinh 3 cham: Do +2 diem',
     CURRENT_TIMESTAMP - INTERVAL '85 seconds', CURRENT_TIMESTAMP - INTERVAL '85 seconds', CURRENT_TIMESTAMP, FALSE),
    (gen_random_uuid(), match_002_id, 1, 42, judge_001_id, 'BLUE', 'SCORE_PLUS_1', '+1', 1, 'Giam dinh 1 cham: Xanh +1 diem',
     CURRENT_TIMESTAMP - INTERVAL '78 seconds', CURRENT_TIMESTAMP - INTERVAL '78 seconds', CURRENT_TIMESTAMP, FALSE)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Helper function and table
CREATE TABLE IF NOT EXISTS dev_match_references (
    reference_key VARCHAR(50) PRIMARY KEY,
    match_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION get_test_match_id(ref_key VARCHAR(50))
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT match_id FROM dev_match_references WHERE reference_key = ref_key);
END;
$$ LANGUAGE plpgsql;






