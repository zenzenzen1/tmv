-- Migration V18: Create fields table
-- Description: Creates table for training and competition fields

CREATE TABLE fields (
    id VARCHAR(36) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fields table
CREATE INDEX idx_fields_location ON fields(location);
CREATE INDEX idx_fields_is_used ON fields(is_used);

