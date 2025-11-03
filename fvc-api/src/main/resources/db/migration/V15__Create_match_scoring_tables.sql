-- Migration V15: Create match scoring system tables
-- Description: Creates tables for real-time match scoring with WebSocket support

-- Create matches table
CREATE TABLE matches (
    id VARCHAR(36) PRIMARY KEY,
    competition_id VARCHAR(36) NOT NULL,
    weight_class_id VARCHAR(36),
    round_type VARCHAR(50) NOT NULL,
    red_athlete_id VARCHAR(36) NOT NULL,
    blue_athlete_id VARCHAR(36) NOT NULL,
    red_athlete_name VARCHAR(200) NOT NULL,
    blue_athlete_name VARCHAR(200) NOT NULL,
    red_athlete_unit VARCHAR(200),
    blue_athlete_unit VARCHAR(200),
    red_athlete_sbt_number VARCHAR(50),
    blue_athlete_sbt_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    current_round INT NOT NULL DEFAULT 1,
    total_rounds INT NOT NULL DEFAULT 3,
    round_duration_seconds INT NOT NULL DEFAULT 120,
    time_remaining_seconds INT NOT NULL DEFAULT 120,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    winner_corner VARCHAR(10),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create match_events table
CREATE TABLE match_events (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    round INT NOT NULL,
    timestamp_in_round_seconds INT NOT NULL,
    judge_id VARCHAR(36),
    corner VARCHAR(10),
    event_type VARCHAR(30) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Create match_scoreboard_snapshots table
CREATE TABLE match_scoreboard_snapshots (
    match_id VARCHAR(36) PRIMARY KEY,
    last_event_id VARCHAR(36),
    red_score INT NOT NULL DEFAULT 0,
    blue_score INT NOT NULL DEFAULT 0,
    red_medical_timeout_count INT NOT NULL DEFAULT 0,
    blue_medical_timeout_count INT NOT NULL DEFAULT 0,
    red_warning_count INT NOT NULL DEFAULT 0,
    blue_warning_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (last_event_id) REFERENCES match_events(id) ON DELETE SET NULL
);

-- Create indexes for matches table
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_weight_class ON matches(weight_class_id);

-- Create indexes for match_events table
CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_match_round_time ON match_events(match_id, round, timestamp_in_round_seconds);
CREATE INDEX idx_match_events_match_created ON match_events(match_id, created_at);
CREATE INDEX idx_match_events_match_round ON match_events(match_id, round);
CREATE INDEX idx_match_events_created_at ON match_events(created_at DESC);

