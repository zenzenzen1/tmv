-- Add new fields to competitions table
ALTER TABLE competitions 
ADD COLUMN description VARCHAR(1000),
ADD COLUMN location VARCHAR(200),
ADD COLUMN opening_ceremony_time TIME,
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- Add indexes for better performance
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_start_date ON competitions(start_date);
CREATE INDEX idx_competitions_location ON competitions(location);

-- Add check constraint for status values
ALTER TABLE competitions 
ADD CONSTRAINT chk_competitions_status 
CHECK (status IN ('DRAFT', 'OPEN_REGISTRATION', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'));

