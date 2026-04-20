-- ============================================
-- LottoDream: profiles + premium (paste in Supabase SQL Editor, Run once)
-- ============================================
-- If you only ran the premium migration before, profiles never existed (or was
-- rolled back). This file creates public.profiles first, then premium columns.
--
-- Run as ONE query (select all → Run). If you see an error, scroll to the
-- bottom — the failing line is usually the trigger; see comment there.

-- ── 1) profiles table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  points INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── 2) Premium columns on profiles ────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'basic'
    CHECK (subscription_tier IN ('basic', 'premium'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_since TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_source TEXT
    CHECK (premium_source IN ('stripe', 'apple_iap', 'google_iap', 'manual'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_receipt_id TEXT;

-- ── 3) purchases ledger ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_transaction_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON public.purchases(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_provider_txid
  ON public.purchases(provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- ── 4) Entitlement view (client read) ─────────────────────────────
CREATE OR REPLACE VIEW public.my_entitlement
WITH (security_invoker = true) AS
  SELECT
    p.id AS user_id,
    p.subscription_tier,
    p.premium_since,
    p.premium_source,
    (p.subscription_tier = 'premium') AS is_premium
  FROM public.profiles p
  WHERE auth.uid() = p.id;

GRANT SELECT ON public.my_entitlement TO authenticated;

-- ── 5) Sign-up trigger (if this errors, run section 6 alone below) ──
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
-- Use PROCEDURE keyword for broad Postgres compatibility (incl. some hosted versions)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
