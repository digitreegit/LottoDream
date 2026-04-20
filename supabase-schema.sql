-- ============================================
-- Supabase DB Schema for LottoDream
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Powerball draw history
CREATE TABLE IF NOT EXISTS draws (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL UNIQUE,
  n1 SMALLINT NOT NULL CHECK (n1 BETWEEN 1 AND 69),
  n2 SMALLINT NOT NULL CHECK (n2 BETWEEN 1 AND 69),
  n3 SMALLINT NOT NULL CHECK (n3 BETWEEN 1 AND 69),
  n4 SMALLINT NOT NULL CHECK (n4 BETWEEN 1 AND 69),
  n5 SMALLINT NOT NULL CHECK (n5 BETWEEN 1 AND 69),
  powerball SMALLINT NOT NULL CHECK (powerball BETWEEN 1 AND 26),
  powerplay SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draws_date ON draws(draw_date DESC);

-- 1b. Mega Millions draw history
CREATE TABLE IF NOT EXISTS draws_megamillions (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL UNIQUE,
  n1 SMALLINT NOT NULL CHECK (n1 BETWEEN 1 AND 70),
  n2 SMALLINT NOT NULL CHECK (n2 BETWEEN 1 AND 70),
  n3 SMALLINT NOT NULL CHECK (n3 BETWEEN 1 AND 70),
  n4 SMALLINT NOT NULL CHECK (n4 BETWEEN 1 AND 70),
  n5 SMALLINT NOT NULL CHECK (n5 BETWEEN 1 AND 70),
  powerball SMALLINT NOT NULL CHECK (powerball BETWEEN 1 AND 25),
  powerplay SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draws_mm_date ON draws_megamillions(draw_date DESC);

-- 2. User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  points INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Points transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  type TEXT NOT NULL, -- 'purchase', 'ticket', 'prize', 'referral', 'refund'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ticket purchases
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  game TEXT NOT NULL DEFAULT 'powerball',
  n1 SMALLINT NOT NULL,
  n2 SMALLINT NOT NULL,
  n3 SMALLINT NOT NULL,
  n4 SMALLINT NOT NULL,
  n5 SMALLINT NOT NULL,
  powerball SMALLINT NOT NULL,
  draw_date DATE NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, purchased, drawn, won, lost
  prize_tier TEXT, -- 'jackpot','2nd','3rd','4th','5th','6th','7th','8th','9th'
  prize_amount DECIMAL(12,2) DEFAULT 0,
  photo_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id, created_at DESC);
CREATE INDEX idx_tickets_draw ON tickets(draw_date);

-- 5. Analysis cache (pre-computed stats)
CREATE TABLE IF NOT EXISTS stats_cache (
  id BIGSERIAL PRIMARY KEY,
  stat_type TEXT NOT NULL, -- 'frequency', 'hot_cold', 'pairs', 'distribution'
  stat_range TEXT NOT NULL, -- 'all', 'last_50', 'last_100'
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_stats_type_range ON stats_cache(stat_type, stat_range);

-- 6. Saved/favorite number sets
CREATE TABLE IF NOT EXISTS saved_numbers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
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

-- Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws_megamillions ENABLE ROW LEVEL SECURITY;

-- Public read for draws
CREATE POLICY "Draws are viewable by everyone" ON draws FOR SELECT USING (true);
CREATE POLICY "Draws MM are viewable by everyone" ON draws_megamillions FOR SELECT USING (true);

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tickets: users can read/insert their own
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Point transactions: users can view their own
CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Saved numbers: explicit policies so INSERT gets WITH CHECK (FOR ALL USING alone can block inserts)
CREATE POLICY "Users can select own saved numbers" ON saved_numbers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved numbers" ON saved_numbers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved numbers" ON saved_numbers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved numbers" ON saved_numbers
  FOR DELETE USING (auth.uid() = user_id);

-- Function: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  generated_referral TEXT;
  attempt INTEGER := 0;
BEGIN
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  final_username := base_username;

  LOOP
    generated_referral := substr(
      md5(random()::text || clock_timestamp()::text || NEW.id::text || attempt::text),
      1,
      8
    );

    BEGIN
      INSERT INTO public.profiles (id, username, email, referral_code)
      VALUES (
        NEW.id,
        final_username,
        NEW.email,
        generated_referral
      );
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        attempt := attempt + 1;
        final_username := base_username || '_' || attempt::text;
        IF attempt > 20 THEN
          RAISE;
        END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
