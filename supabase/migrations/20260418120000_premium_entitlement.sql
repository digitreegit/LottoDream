-- ============================================
-- Premium entitlement + purchases ledger
-- ============================================
-- Adds a one-time "premium" unlock to profiles and records each purchase.
-- The Stripe / Apple / Google webhooks are expected to flip `subscription_tier`
-- to 'premium' and insert a matching row in `purchases` (server-side only via
-- the `service_role` key or an Edge Function). Client-side RLS below keeps
-- regular users read-only against their own ledger.

-- 1. Extend profiles with premium columns
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

-- 2. Purchases ledger (audit trail for one-time unlocks / refunds)
CREATE TABLE IF NOT EXISTS public.purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,                 -- 'premium_unlock'
  provider TEXT NOT NULL,                    -- 'stripe' | 'apple_iap' | 'google_iap' | 'manual'
  provider_transaction_id TEXT,              -- Stripe session/PaymentIntent id, Apple/Google order id
  amount_cents INTEGER NOT NULL,             -- 499 for $4.99
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed'   -- 'pending' | 'completed' | 'refunded' | 'failed'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  raw_payload JSONB,                         -- keep full provider payload for reconciliation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON public.purchases(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_provider_txid
  ON public.purchases(provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users may read their own purchases (for receipts / order history)
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Writes only via service_role (webhooks / Edge Functions). No client insert/update policy.

-- 3. Convenience view the client can read to check entitlement without exposing ledger details.
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
