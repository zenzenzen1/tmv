-- Update competition_roles table to allow null user_id and add email column
ALTER TABLE competition_roles 
    ALTER COLUMN user_id DROP NOT NULL;

-- Add email column as nullable first (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'competition_roles' 
                   AND column_name = 'email') THEN
        ALTER TABLE competition_roles 
        ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Update existing records (if any) - for now just set to empty string
UPDATE competition_roles 
SET email = ''
WHERE email IS NULL;

-- Now make email NOT NULL
ALTER TABLE competition_roles 
    ALTER COLUMN email SET NOT NULL;

-- Update unique constraint to handle null user_id
ALTER TABLE competition_roles 
    DROP CONSTRAINT IF EXISTS uk_competition_roles_competition_user_role;

-- Create new unique constraint that allows null user_id
-- For system users: competition_id + user_id + role must be unique
-- For non-system users: competition_id + email + role must be unique
CREATE UNIQUE INDEX uk_competition_roles_system_user 
    ON competition_roles (competition_id, user_id, role) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX uk_competition_roles_email 
    ON competition_roles (competition_id, email, role) 
    WHERE user_id IS NULL;
