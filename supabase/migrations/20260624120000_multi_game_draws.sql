-- ============================================================
-- Multi-game draw tables (generalized numbers[] + bonus shape)
-- Run once in Supabase Dashboard -> SQL Editor.
--
-- Existing Powerball (`draws`) and Mega Millions (`draws_megamillions`)
-- keep their legacy n1..n5 / powerball columns. New games use a generalized
-- shape so they can support variable main-number counts (5, 6, 20) and
-- optional bonus balls.
-- ============================================================

-- Generic factory via explicit tables (Supabase SQL editor friendly).

-- Cash4Life: 5 main (1-60) + Cash Ball (1-4)
CREATE TABLE IF NOT EXISTS draws_cash4life (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL,
  numbers SMALLINT[] NOT NULL,
  bonus SMALLINT,
  slot TEXT,
  multiplier SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (draw_date)
);

-- Take 5: 5 main (1-39), no bonus, two draws per day (midday/evening)
CREATE TABLE IF NOT EXISTS draws_take5 (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL,
  numbers SMALLINT[] NOT NULL,
  bonus SMALLINT,
  slot TEXT,
  multiplier SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (draw_date, slot)
);

-- NY Lotto: 6 main (1-59) + Bonus (1-59)
CREATE TABLE IF NOT EXISTS draws_nylotto (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL,
  numbers SMALLINT[] NOT NULL,
  bonus SMALLINT,
  slot TEXT,
  multiplier SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (draw_date)
);

-- Pick 10: 20 main (1-80), no bonus
CREATE TABLE IF NOT EXISTS draws_pick10 (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL,
  numbers SMALLINT[] NOT NULL,
  bonus SMALLINT,
  slot TEXT,
  multiplier SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (draw_date)
);

CREATE INDEX IF NOT EXISTS idx_draws_cash4life_date ON draws_cash4life(draw_date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_take5_date ON draws_take5(draw_date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_nylotto_date ON draws_nylotto(draw_date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_pick10_date ON draws_pick10(draw_date DESC);

-- Draw results are public reference data: enable RLS with public read,
-- writes happen via service role / sync job only.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['draws_cash4life', 'draws_take5', 'draws_nylotto', 'draws_pick10']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public read %1$s" ON %1$s;', t);
    EXECUTE format('CREATE POLICY "Public read %1$s" ON %1$s FOR SELECT USING (true);', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated upsert %1$s" ON %1$s;', t);
    EXECUTE format('CREATE POLICY "Authenticated upsert %1$s" ON %1$s FOR INSERT WITH CHECK (auth.role() = ''authenticated'');', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated update %1$s" ON %1$s;', t);
    EXECUTE format('CREATE POLICY "Authenticated update %1$s" ON %1$s FOR UPDATE USING (auth.role() = ''authenticated'');', t);
  END LOOP;
END $$;
