-- ============================================================
-- Generalize saved number storage for multi-game support.
-- Run once in Supabase Dashboard -> SQL Editor.
--
-- Older games (Powerball/Mega Millions) stored exactly 5 mains + a bonus in
-- n1..n5 / powerball columns. New games can have 6 or 20 main numbers and may
-- have no bonus, so we add generalized numbers[] + bonus columns and relax the
-- legacy NOT NULL constraints.
-- ============================================================

-- saved_numbers
ALTER TABLE public.saved_numbers
  ADD COLUMN IF NOT EXISTS numbers SMALLINT[];
ALTER TABLE public.saved_numbers
  ADD COLUMN IF NOT EXISTS bonus SMALLINT;
ALTER TABLE public.saved_numbers ALTER COLUMN n1 DROP NOT NULL;
ALTER TABLE public.saved_numbers ALTER COLUMN n2 DROP NOT NULL;
ALTER TABLE public.saved_numbers ALTER COLUMN n3 DROP NOT NULL;
ALTER TABLE public.saved_numbers ALTER COLUMN n4 DROP NOT NULL;
ALTER TABLE public.saved_numbers ALTER COLUMN n5 DROP NOT NULL;
ALTER TABLE public.saved_numbers ALTER COLUMN powerball DROP NOT NULL;

-- Backfill numbers/bonus from legacy columns where missing.
UPDATE public.saved_numbers
  SET numbers = ARRAY[n1, n2, n3, n4, n5]
  WHERE numbers IS NULL AND n1 IS NOT NULL;
UPDATE public.saved_numbers
  SET bonus = powerball
  WHERE bonus IS NULL AND powerball IS NOT NULL;

-- number_collection_items (may not exist yet in some projects)
DO $$
BEGIN
  IF to_regclass('public.number_collection_items') IS NOT NULL THEN
    ALTER TABLE public.number_collection_items ADD COLUMN IF NOT EXISTS numbers SMALLINT[];
    ALTER TABLE public.number_collection_items ADD COLUMN IF NOT EXISTS bonus SMALLINT;
    ALTER TABLE public.number_collection_items ALTER COLUMN n1 DROP NOT NULL;
    ALTER TABLE public.number_collection_items ALTER COLUMN n2 DROP NOT NULL;
    ALTER TABLE public.number_collection_items ALTER COLUMN n3 DROP NOT NULL;
    ALTER TABLE public.number_collection_items ALTER COLUMN n4 DROP NOT NULL;
    ALTER TABLE public.number_collection_items ALTER COLUMN n5 DROP NOT NULL;
    ALTER TABLE public.number_collection_items ALTER COLUMN powerball DROP NOT NULL;

    UPDATE public.number_collection_items
      SET numbers = ARRAY[n1, n2, n3, n4, n5]
      WHERE numbers IS NULL AND n1 IS NOT NULL;
    UPDATE public.number_collection_items
      SET bonus = powerball
      WHERE bonus IS NULL AND powerball IS NOT NULL;
  END IF;
END $$;
