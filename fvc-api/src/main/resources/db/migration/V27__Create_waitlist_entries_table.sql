-- Create waitlist_entries table for storing waitlist entries when forms are postponed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS waitlist_entries (
    id BIGSERIAL PRIMARY KEY,
    form_type VARCHAR(30) NOT NULL,
    form_data JSONB NOT NULL,
    email VARCHAR(255) NOT NULL,
    user_id VARCHAR(36),
    application_form_config_id VARCHAR(36) NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_waitlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_waitlist_form_config FOREIGN KEY (application_form_config_id) REFERENCES application_form_configs(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_form_config ON waitlist_entries(application_form_config_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_entries(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_processed ON waitlist_entries(is_processed);
CREATE INDEX IF NOT EXISTS idx_waitlist_form_processed ON waitlist_entries(application_form_config_id, is_processed);

-- Create unique constraint to prevent duplicate waitlist entries (same email, same form, not processed)
CREATE UNIQUE INDEX IF NOT EXISTS uk_waitlist_form_email_unprocessed 
ON waitlist_entries(application_form_config_id, LOWER(email)) 
WHERE is_processed = FALSE;

