-- Update submitted_application_forms table to allow null user_id and add email column
ALTER TABLE submitted_application_forms 
    ALTER COLUMN user_id DROP NOT NULL;

-- Add email column as nullable first (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submitted_application_forms' 
                   AND column_name = 'email') THEN
        ALTER TABLE submitted_application_forms 
        ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Update existing records to set email from form_data JSON
UPDATE submitted_application_forms 
SET email = form_data::json->>'email'
WHERE email IS NULL;

-- Now make email NOT NULL
ALTER TABLE submitted_application_forms 
    ALTER COLUMN email SET NOT NULL;
