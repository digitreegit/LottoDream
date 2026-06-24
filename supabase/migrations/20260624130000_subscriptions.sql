-- ============================================================
-- Monthly subscription state (Stripe) + profile sync columns
-- Run once in Supabase Dashboard -> SQL Editor.
--
-- The `stripe-webhook` Edge Function (service_role) is the only writer of
-- `subscriptions` and of the subscription columns on `profiles`. Clients read
-- their own row via RLS. `profiles.subscription_tier` stays the single boolean
-- gate the app reads ('premium' when status is active/trialing).
-- ============================================================

-- 1. Subscription columns on profiles (synced by webhook)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Allow 'stripe' premium_source already; ensure column exists from prior migration.

-- 2. Subscriptions ledger (one active row per user, history kept)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL,                      -- trialing | active | past_due | canceled | ...
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users may read their own subscription rows.
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Writes only via service_role (Edge Function webhook). No client write policy.

-- 3. Refresh entitlement view to surface subscription state.
CREATE OR REPLACE VIEW public.my_entitlement
WITH (security_invoker = true) AS
  SELECT
    p.id AS user_id,
    p.subscription_tier,
    p.subscription_status,
    p.premium_since,
    p.premium_source,
    p.current_period_end,
    p.trial_end,
    p.cancel_at_period_end,
    (p.subscription_tier = 'premium') AS is_premium
  FROM public.profiles p
  WHERE auth.uid() = p.id;

GRANT SELECT ON public.my_entitlement TO authenticated;
