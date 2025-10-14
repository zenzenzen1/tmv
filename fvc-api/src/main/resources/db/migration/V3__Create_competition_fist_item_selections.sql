-- Create competition_fist_item_selections table
CREATE TABLE competition_fist_item_selections (
    id VARCHAR(36) PRIMARY KEY,
    competition_id VARCHAR(36) NOT NULL,
    vovinam_fist_config_id VARCHAR(36) NOT NULL,
    vovinam_fist_item_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (vovinam_fist_config_id) REFERENCES vovinam_fist_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (vovinam_fist_item_id) REFERENCES vovinam_fist_items(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_competition_fist_selection (competition_id, vovinam_fist_config_id, vovinam_fist_item_id)
);
