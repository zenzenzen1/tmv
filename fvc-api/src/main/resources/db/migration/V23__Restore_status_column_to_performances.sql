-- Restore status column to performances table if it was removed
-- This migration adds back the status column if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'performances' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE performances ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

