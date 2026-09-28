-- ============================================================
-- Billing hardening + multi-provider entitlement
--
-- 1. Clients can no longer write billing columns on `profiles`
--    (previously "Users can update own profile" let anyone self-grant Premium).
-- 2. `subscriptions` holds rows from every provider: Stripe (web), Apple and
--    Google (in-app purchase via RevenueCat). `refresh_entitlement()` derives
--    the profile's Premium state from the best row, so one provider expiring
--    never clobbers another that is still active.
-- 3. `has_used_trial` lets checkout skip the free trial for returning users.
-- ============================================================

-- 1. Profile columns ------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT;          -- 'monthly' | 'yearly'

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_premium_source_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_premium_source_check
    CHECK (premium_source IN ('stripe', 'apple', 'google', 'apple_iap', 'google_iap', 'manual'));

-- Block client writes to billing columns. Only service_role (Edge Functions)
-- and direct SQL (postgres, where auth.role() is NULL) may change them.
CREATE OR REPLACE FUNCTION public.protect_billing_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_tier    := 'basic';
    NEW.subscription_status  := NULL;
    NEW.subscription_plan    := NULL;
    NEW.premium_since        := NULL;
    NEW.premium_source       := NULL;
    NEW.premium_receipt_id   := NULL;
    NEW.stripe_customer_id   := NULL;
    NEW.current_period_end   := NULL;
    NEW.trial_end            := NULL;
    NEW.cancel_at_period_end := FALSE;
    NEW.has_used_trial       := FALSE;
    RETURN NEW;
  END IF;

  IF NEW.subscription_tier    IS DISTINCT FROM OLD.subscription_tier
  OR NEW.subscription_status  IS DISTINCT FROM OLD.subscription_status
  OR NEW.subscription_plan    IS DISTINCT FROM OLD.subscription_plan
  OR NEW.premium_since        IS DISTINCT FROM OLD.premium_since
  OR NEW.premium_source       IS DISTINCT FROM OLD.premium_source
  OR NEW.premium_receipt_id   IS DISTINCT FROM OLD.premium_receipt_id
  OR NEW.stripe_customer_id   IS DISTINCT FROM OLD.stripe_customer_id
  OR NEW.current_period_end   IS DISTINCT FROM OLD.current_period_end
  OR NEW.trial_end            IS DISTINCT FROM OLD.trial_end
  OR NEW.cancel_at_period_end IS DISTINCT FROM OLD.cancel_at_period_end
  OR NEW.has_used_trial       IS DISTINCT FROM OLD.has_used_trial
  THEN
    RAISE EXCEPTION 'Billing fields are read-only' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_billing_columns ON public.profiles;
CREATE TRIGGER protect_billing_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_billing_columns();

-- 2. Multi-provider subscriptions -----------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'stripe';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan TEXT;                       -- 'monthly' | 'yearly'

UPDATE public.subscriptions
  SET provider_subscription_id = stripe_subscription_id
  WHERE provider_subscription_id IS NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN provider_subscription_id SET NOT NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN stripe_customer_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN stripe_subscription_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_provider_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_provider_check
    CHECK (provider IN ('stripe', 'apple', 'google'));

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_provider_sub_key;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_provider_sub_key
    UNIQUE (provider, provider_subscription_id);

-- 3. Entitlement derivation ------------------------------------------------
-- Picks the subscription that grants access for the longest (active/trialing),
-- falling back to the most recently updated row for display. Leaves manually
-- granted Premium alone when the user has no subscription rows at all.
CREATE OR REPLACE FUNCTION public.refresh_entitlement(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  best       public.subscriptions%ROWTYPE;
  is_premium BOOLEAN;
  was_trial  BOOLEAN;
BEGIN
  SELECT * INTO best
  FROM public.subscriptions
  WHERE user_id = p_user_id
  ORDER BY
    (status IN ('active', 'trialing')) DESC,
    current_period_end DESC NULLS LAST,
    updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id AND trial_end IS NOT NULL
  ) INTO was_trial;

  is_premium := best.status IN ('active', 'trialing');

  UPDATE public.profiles p
  SET
    subscription_tier    = CASE WHEN is_premium THEN 'premium' ELSE 'basic' END,
    subscription_status  = best.status,
    subscription_plan    = best.plan,
    premium_source       = best.provider,
    premium_since        = CASE
                             WHEN NOT is_premium THEN NULL
                             WHEN p.subscription_tier = 'premium' THEN COALESCE(p.premium_since, NOW())
                             ELSE NOW()
                           END,
    current_period_end   = best.current_period_end,
    trial_end            = best.trial_end,
    cancel_at_period_end = COALESCE(best.cancel_at_period_end, FALSE),
    has_used_trial       = p.has_used_trial OR was_trial
  WHERE p.id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_entitlement(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_entitlement(UUID) TO service_role;

-- 4. Entitlement view ------------------------------------------------------
DROP VIEW IF EXISTS public.my_entitlement;
CREATE VIEW public.my_entitlement
WITH (security_invoker = true) AS
  SELECT
    p.id AS user_id,
    p.subscription_tier,
    p.subscription_status,
    p.subscription_plan,
    p.premium_since,
    p.premium_source,
    p.current_period_end,
    p.trial_end,
    p.cancel_at_period_end,
    p.has_used_trial,
    (p.subscription_tier = 'premium') AS is_premium
  FROM public.profiles p
  WHERE auth.uid() = p.id;

GRANT SELECT ON public.my_entitlement TO authenticated;

-- 5. Account deletion must cascade ----------------------------------------
-- Tables created from the legacy supabase-schema.sql reference profiles
-- without ON DELETE, which would block auth.admin.deleteUser(). Rebuild any
-- such FK: referrals are nulled, everything else is deleted with the user.
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT c.conname, c.conrelid::regclass AS tbl, a.attname AS col,
           c.confrelid::regclass AS ref_tbl
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND c.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
      AND c.confdeltype NOT IN ('c', 'n')           -- not CASCADE / SET NULL
      AND array_length(c.conkey, 1) = 1
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.tbl, fk.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE %s',
      fk.tbl, fk.conname, fk.col, fk.ref_tbl,
      CASE WHEN fk.col = 'referred_by' THEN 'SET NULL' ELSE 'CASCADE' END
    );
  END LOOP;
END $$;
