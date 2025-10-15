-- Update athlete table structure to support hierarchical competition fields
-- Remove old content column and add new hierarchical fields

-- First, drop the old content column if it exists
ALTER TABLE athletes DROP COLUMN IF EXISTS content;

-- Add new hierarchical competition fields
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS sub_competition_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS detail_sub_competition_type VARCHAR(100);

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_athletes_sub_competition_type ON athletes(sub_competition_type);
CREATE INDEX IF NOT EXISTS idx_athletes_detail_sub_competition_type ON athletes(detail_sub_competition_type);

-- Add comments for documentation
COMMENT ON COLUMN athletes.sub_competition_type IS 'Sub competition type like Song luyện, Đa luyện, Hạng cân';
COMMENT ON COLUMN athletes.detail_sub_competition_type IS 'Detail sub competition type like Song luyện 1, Võ nhạc 1, etc.';
