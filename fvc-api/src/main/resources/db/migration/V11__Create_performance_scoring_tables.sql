-- Create Performance table
CREATE TABLE performances (
    id UUID PRIMARY KEY,
    competition_id UUID NOT NULL,
    
    -- Team information (chỉ có khi is_team = true)
    is_team BOOLEAN NOT NULL DEFAULT FALSE,
    team_id VARCHAR(255),                    -- "team-001", "team-002"
    team_name VARCHAR(255),                  -- "Team FPTU #1", "Team HCMUS #2"
    
    -- Performance details
    performance_type VARCHAR(20) NOT NULL,   -- INDIVIDUAL, TEAM
    content_type VARCHAR(20) NOT NULL,       -- QUYEN, MUSIC
    content_id UUID,                         -- FK to fist_content hoặc music_content
    
    -- Status and timing
    status VARCHAR(20) NOT NULL,             -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    total_score DECIMAL(5,2),                -- Điểm tổng kết
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    
    -- Constraints
    CHECK (
        (is_team = TRUE AND team_id IS NOT NULL AND team_name IS NOT NULL) OR
        (is_team = FALSE AND team_id IS NULL AND team_name IS NULL)
    )
);

-- Create PerformanceAthletes table
CREATE TABLE performance_athletes (
    id UUID PRIMARY KEY,
    performance_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    team_position INTEGER,                   -- Vị trí trong đội (1, 2, 3...)
    is_captain BOOLEAN DEFAULT FALSE,        -- Đội trưởng
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (performance_id) REFERENCES performances(id),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id),
    
    -- Constraints
    UNIQUE KEY uk_performance_athlete (performance_id, athlete_id),
    UNIQUE KEY uk_performance_team_position (performance_id, team_position)
);

-- Create Assessors table
CREATE TABLE assessors (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    competition_id UUID NOT NULL,
    specialization VARCHAR(20) NOT NULL,     -- QUYEN, MUSIC, FIGHTING
    assigned_by UUID,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    UNIQUE KEY uk_assessor_competition (user_id, competition_id)
);

-- Create AssessorScores table
CREATE TABLE assessor_scores (
    id UUID PRIMARY KEY,
    performance_id UUID NOT NULL,
    assessor_id UUID NOT NULL,
    score DECIMAL(5,2) NOT NULL,             -- Điểm từ 0.0 đến 10.0
    criteria_scores JSONB,                   -- Chi tiết điểm từng tiêu chí
    notes TEXT,                              -- Ghi chú của giám khảo
    submitted_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (performance_id) REFERENCES performances(id),
    FOREIGN KEY (assessor_id) REFERENCES assessors(id),
    
    UNIQUE KEY uk_performance_assessor (performance_id, assessor_id)
);

-- Create indexes for performance
CREATE INDEX idx_performance_competition ON performances(competition_id);
CREATE INDEX idx_performance_team ON performances(team_id);
CREATE INDEX idx_performance_status ON performances(status);
CREATE INDEX idx_performance_type ON performances(performance_type, content_type);

-- Create indexes for performance_athletes
CREATE INDEX idx_performance_athletes_performance ON performance_athletes(performance_id);
CREATE INDEX idx_performance_athletes_athlete ON performance_athletes(athlete_id);

-- Create indexes for assessors
CREATE INDEX idx_assessor_competition ON assessors(competition_id);
CREATE INDEX idx_assessor_specialization ON assessors(specialization);

-- Create indexes for assessor_scores
CREATE INDEX idx_assessor_scores_performance ON assessor_scores(performance_id);
CREATE INDEX idx_assessor_scores_assessor ON assessor_scores(assessor_id);
CREATE INDEX idx_assessor_scores_submitted ON assessor_scores(submitted_at);
