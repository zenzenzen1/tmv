-- Migration V14: Drop scoring system tables
-- Description: Drops all scoring-related tables

DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS match_sessions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS judges CASCADE;
DROP TABLE IF EXISTS dev_match_references CASCADE;

DROP FUNCTION IF EXISTS get_test_match_id(VARCHAR);


