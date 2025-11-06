BEGIN;

-- Fully defensive migration to avoid transaction aborts
DO $$
DECLARE
  has_competition_id boolean;
  has_tournament_id  boolean;
  has_index_comp_email boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='athletes' AND column_name='competition_id'
  ) INTO has_competition_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='athletes' AND column_name='tournament_id'
  ) INTO has_tournament_id;

  SELECT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname='idx_athlete_competition_email' AND n.nspname='public'
  ) INTO has_index_comp_email;

  -- Drop index first if it exists (to allow column rename/drop)
  IF has_index_comp_email THEN
    EXECUTE 'DROP INDEX public.idx_athlete_competition_email';
  END IF;

  -- Case 1: cả hai cột cùng tồn tại -> gộp dữ liệu, drop competition_id, rename tournament_id
  IF has_competition_id AND has_tournament_id THEN
    EXECUTE 'UPDATE public.athletes SET tournament_id = COALESCE(tournament_id, competition_id) WHERE tournament_id IS NULL AND competition_id IS NOT NULL';
    EXECUTE 'ALTER TABLE public.athletes DROP COLUMN competition_id';
    EXECUTE 'ALTER TABLE public.athletes RENAME COLUMN tournament_id TO competition_id';

  -- Case 2: chỉ có tournament_id -> chỉ cần rename
  ELSIF NOT has_competition_id AND has_tournament_id THEN
    EXECUTE 'ALTER TABLE public.athletes RENAME COLUMN tournament_id TO competition_id';

  -- Case 3: chỉ có competition_id -> không làm gì với cột; coi như đã đúng
  ELSE
    -- nothing to do
  END IF;

  -- Recreate index nếu chưa có
  IF NOT has_index_comp_email THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_competition_email ON public.athletes(competition_id, email)';
  ELSE
    -- Sau khi rename, index đã drop ở trên, tạo lại
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_competition_email ON public.athletes(competition_id, email)';
  END IF;
END$$;

-- Optional: enforce NOT NULL once data is consistent
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM public.athletes WHERE competition_id IS NULL) THEN
--     ALTER TABLE public.athletes ALTER COLUMN competition_id SET NOT NULL;
--   END IF;
-- END$$;

COMMIT;


