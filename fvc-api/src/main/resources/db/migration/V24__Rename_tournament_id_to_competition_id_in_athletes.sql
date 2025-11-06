-- Rename tournament_id to competition_id in athletes table
-- This migration renames the column and updates the unique index

-- Step 1: Drop the old unique index if it exists
DROP INDEX IF EXISTS idx_athlete_tournament_email;

-- Step 2: Rename the column from tournament_id to competition_id
ALTER TABLE athletes RENAME COLUMN tournament_id TO competition_id;

-- Step 3: Create the new unique index with the new column name
CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_competition_email 
ON athletes(competition_id, email);

