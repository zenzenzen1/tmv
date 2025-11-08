-- Restore tournament_id on athletes (without removing competition_id)
-- Safe to run multiple times

BEGIN;

-- 1) Add column tournament_id if missing
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS tournament_id varchar(255);

-- 2) Backfill tournament_id from competition_id when null
UPDATE public.athletes
SET tournament_id = COALESCE(tournament_id, competition_id)
WHERE tournament_id IS NULL;

-- 3) Create supporting index (unique with email) if you used it previously
CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_tournament_email
  ON public.athletes(tournament_id, email);

-- 4) Recreate FK on tournament_id -> competitions(id) if desired
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema='public'
      AND table_name='athletes'
      AND constraint_type='FOREIGN KEY'
      AND constraint_name='fk_athletes_tournament'
  ) THEN
    ALTER TABLE public.athletes
      ADD CONSTRAINT fk_athletes_tournament
      FOREIGN KEY (tournament_id) REFERENCES public.competitions(id);
  END IF;
END$$;

COMMIT;



