-- Add denormalized content filter columns to performance_matches
ALTER TABLE performance_matches
ADD COLUMN IF NOT EXISTS fist_config_id VARCHAR(36),
ADD COLUMN IF NOT EXISTS fist_item_id VARCHAR(36),
ADD COLUMN IF NOT EXISTS music_content_id VARCHAR(36);

-- Optional simple indexes to speed up filtering by content
CREATE INDEX IF NOT EXISTS idx_performance_matches_fist_config_id ON performance_matches(fist_config_id);
CREATE INDEX IF NOT EXISTS idx_performance_matches_fist_item_id ON performance_matches(fist_item_id);
CREATE INDEX IF NOT EXISTS idx_performance_matches_music_content_id ON performance_matches(music_content_id);

