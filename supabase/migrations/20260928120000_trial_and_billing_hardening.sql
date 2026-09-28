-- ============================================================
-- 14-day no-card free trial + billing column hardening
--
-- 1. SECURITY FIX: "Users can update own profile" let any signed-in user set
--    `subscription_tier = 'premium'` on their own row from the browser.
--    A BEFORE INSERT/UPDATE trigger now pins every billing column for
--    non-service-role callers. Only Edge Functions (service_role) can change
--    them.
-- 2. Trial bookkeeping: `trial_used_at` (one free trial per account) and
--    `has_payment_method` (drives the "add a card to keep Premium" CTA).
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_payment_method BOOLEAN NOT NULL DEFAULT FALSE;

-- Anyone who already had a Stripe trial has used theirs.
UPDATE public.profiles p
SET trial_used_at = COALESCE(p.trial_used_at, s.first_created)
FROM (
  SELECT user_id, MIN(created_at) AS first_created
  FROM public.subscriptions
  WHERE trial_end IS NOT NULL
  GROUP BY user_id
) s
WHERE s.user_id = p.id AND p.trial_used_at IS NULL;

-- ── Billing column guard ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role (Edge Functions / webhook) and direct DB sessions
  -- (SQL editor, migrations, the signup trigger) are trusted.
  IF COALESCE(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_tier    := 'basic';
    NEW.subscription_status  := NULL;
    NEW.premium_since        := NULL;
    NEW.premium_source       := NULL;
    NEW.premium_receipt_id   := NULL;
    NEW.stripe_customer_id   := NULL;
    NEW.current_period_end   := NULL;
    NEW.trial_end            := NULL;
    NEW.cancel_at_period_end := FALSE;
    NEW.trial_used_at        := NULL;
    NEW.has_payment_method   := FALSE;
  ELSE
    NEW.subscription_tier    := OLD.subscription_tier;
    NEW.subscription_status  := OLD.subscription_status;
    NEW.premium_since        := OLD.premium_since;
    NEW.premium_source       := OLD.premium_source;
    NEW.premium_receipt_id   := OLD.premium_receipt_id;
    NEW.stripe_customer_id   := OLD.stripe_customer_id;
    NEW.current_period_end   := OLD.current_period_end;
    NEW.trial_end            := OLD.trial_end;
    NEW.cancel_at_period_end := OLD.cancel_at_period_end;
    NEW.trial_used_at        := OLD.trial_used_at;
    NEW.has_payment_method   := OLD.has_payment_method;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_billing_columns ON public.profiles;
CREATE TRIGGER protect_profile_billing_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_columns();

-- ── Entitlement view ──────────────────────────────────────────
-- DROP + CREATE: CREATE OR REPLACE VIEW can't reorder/insert columns.
DROP VIEW IF EXISTS public.my_entitlement;
CREATE VIEW public.my_entitlement
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
    (p.subscription_tier = 'premium') AS is_premium,
    p.trial_used_at,
    p.has_payment_method,
    (p.trial_used_at IS NULL) AS trial_eligible
  FROM public.profiles p
  WHERE auth.uid() = p.id;

GRANT SELECT ON public.my_entitlement TO authenticated;
