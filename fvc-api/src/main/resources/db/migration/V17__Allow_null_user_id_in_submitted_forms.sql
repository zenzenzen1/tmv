-- Allow user_id to be null in submitted_application_forms
-- This enables guest users to submit forms without authentication
ALTER TABLE submitted_application_forms 
    ALTER COLUMN user_id DROP NOT NULL;

