-- Create draw_sessions table
CREATE TABLE draw_sessions (
    id VARCHAR(36) PRIMARY KEY,
    competition_id VARCHAR(36) NOT NULL,
    weight_class_id VARCHAR(36) NOT NULL,
    draw_type VARCHAR(20) NOT NULL,
    drawn_by VARCHAR(36) NOT NULL,
    draw_date TIMESTAMP NOT NULL,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_draw_sessions_competition_weight (competition_id, weight_class_id),
    INDEX idx_draw_sessions_draw_date (draw_date),
    INDEX idx_draw_sessions_final (is_final)
);

-- Create draw_results table
CREATE TABLE draw_results (
    id VARCHAR(36) PRIMARY KEY,
    draw_session_id VARCHAR(36) NOT NULL,
    athlete_id VARCHAR(36) NOT NULL,
    seed_number INT NOT NULL,
    athlete_name VARCHAR(200) NOT NULL,
    athlete_club VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (draw_session_id) REFERENCES draw_sessions(id) ON DELETE CASCADE,
    INDEX idx_draw_results_session (draw_session_id),
    INDEX idx_draw_results_athlete (athlete_id),
    INDEX idx_draw_results_seed (seed_number),
    UNIQUE KEY uk_draw_results_session_athlete (draw_session_id, athlete_id)
);
