-- Drop legacy columns that are no longer used
-- Remove detail_sub_competition_type column and its index
ALTER TABLE athletes DROP COLUMN IF EXISTS detail_sub_competition_type;
DROP INDEX IF EXISTS idx_athletes_detail_sub_competition_type;

-- Remove fist_item_id column and its index (switched to fist_config_id for Quyền)
ALTER TABLE athletes DROP COLUMN IF EXISTS fist_item_id;
DROP INDEX IF EXISTS idx_athletes_fist_item_id;
