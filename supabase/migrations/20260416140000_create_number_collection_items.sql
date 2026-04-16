-- Personal number collections (favorites / analysis & history notes)
-- Run in Supabase SQL Editor after auth.users exists.

CREATE TABLE IF NOT EXISTS number_collection_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game TEXT NOT NULL DEFAULT 'powerball',
  name TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  n1 SMALLINT NOT NULL,
  n2 SMALLINT NOT NULL,
  n3 SMALLINT NOT NULL,
  n4 SMALLINT NOT NULL,
  n5 SMALLINT NOT NULL,
  powerball SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_number_collection_user ON number_collection_items(user_id, created_at DESC);

ALTER TABLE number_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own number collection" ON number_collection_items;
DROP POLICY IF EXISTS "Users can insert own number collection" ON number_collection_items;
DROP POLICY IF EXISTS "Users can update own number collection" ON number_collection_items;
DROP POLICY IF EXISTS "Users can delete own number collection" ON number_collection_items;

CREATE POLICY "Users can select own number collection" ON number_collection_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own number collection" ON number_collection_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own number collection" ON number_collection_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own number collection" ON number_collection_items
  FOR DELETE USING (auth.uid() = user_id);
