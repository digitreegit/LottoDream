-- Fix: "Could not find the table 'public.saved_numbers' in the schema cache"
-- Run once in Supabase Dashboard → SQL Editor.
-- user_id → auth.users (not public.profiles) so this works even if `profiles` is not created yet.

CREATE TABLE IF NOT EXISTS saved_numbers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game TEXT NOT NULL DEFAULT 'powerball',
  name TEXT,
  n1 SMALLINT NOT NULL,
  n2 SMALLINT NOT NULL,
  n3 SMALLINT NOT NULL,
  n4 SMALLINT NOT NULL,
  n5 SMALLINT NOT NULL,
  powerball SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_numbers_user ON saved_numbers(user_id, created_at DESC);

ALTER TABLE saved_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own saved numbers" ON saved_numbers;
DROP POLICY IF EXISTS "Users can insert own saved numbers" ON saved_numbers;
DROP POLICY IF EXISTS "Users can update own saved numbers" ON saved_numbers;
DROP POLICY IF EXISTS "Users can delete own saved numbers" ON saved_numbers;

CREATE POLICY "Users can select own saved numbers" ON saved_numbers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved numbers" ON saved_numbers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved numbers" ON saved_numbers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved numbers" ON saved_numbers
  FOR DELETE USING (auth.uid() = user_id);
