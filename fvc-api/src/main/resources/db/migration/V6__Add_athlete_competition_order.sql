-- Add competition_order column to athletes table
ALTER TABLE athletes ADD COLUMN competition_order INTEGER;

-- Create index for better performance on order queries
CREATE INDEX idx_athlete_competition_order ON athletes(competition_order);

-- Create index for tournament and order combination
CREATE INDEX idx_athlete_tournament_order ON athletes(tournament_id, competition_order);
