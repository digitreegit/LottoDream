# LottoDream launch checklist (US)

Billing model: **14-day free trial (card required, one per account) → $4.99/month or $39.99/year.**
Web pays with **Stripe**; iOS/Android pay with **App Store / Google Play in-app purchase** via **RevenueCat**.
Both webhooks write to `public.subscriptions`, and `refresh_entitlement()` derives `profiles.subscription_tier`.

```
Web  ── Stripe Checkout ──► stripe-webhook ─────┐
iOS  ── StoreKit ─► RevenueCat ─► revenuecat-webhook ─┼─► subscriptions ─► refresh_entitlement() ─► profiles
Android ─ Play Billing ─► RevenueCat ─┘                │
```

## 1. Supabase

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push                      # applies migrations incl. 20260928120000_billing_hardening
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy delete-account
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy jackpots --no-verify-jwt        # public landing-page jackpots
```

Secrets (`supabase secrets set KEY=value`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `PREMIUM_TRIAL_DAYS=14`, `APP_URL=https://lottodream.net`,
`REVENUECAT_API_KEY`, `REVENUECAT_WEBHOOK_AUTH`.

If migrations were previously pasted into the SQL editor by hand, check that `public.subscriptions`
exists; the old `20260624130000` migration failed on the view step and rolled back.

## 2. Stripe (test mode first, then live)

1. Product **LottoDream Premium** with two recurring prices: $4.99/month and $39.99/year → secrets above.
2. Webhook endpoint `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`, with events
   `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`.
3. Billing portal: enable cancel + switch between the two prices.
4. Settings → Emails: turn on trial-ending reminder emails.
5. Test with card `4242 4242 4242 4242` and confirm the profile flips to `trialing`.

## 3. App Store Connect / Google Play Console

- **iOS**: create the app (`com.lottodream.app`), sign the Paid Apps agreement, and add tax/banking info.
  Subscription group "Premium" with `premium_monthly` and `premium_yearly`, each with a 2-week free-trial introductory offer.
  Enrol in the **App Store Small Business Program** (15% commission).
- **Android**: create the app, then a subscription `premium` with base plans `monthly` and `yearly`, each with a 14-day free-trial offer.
  Create a service account for EAS submit and RevenueCat (`secrets/google-play-service-account.json`).
- Distribution: **United States only** on both stores.
- Category: Entertainment. Keep the "no one can predict lottery numbers" disclaimers; reviewers look for them.

## 4. RevenueCat

1. Create a project and add the iOS app (App Store Connect API key / In-App Purchase key) and the Android app (service account).
2. Entitlement **`premium`**, with all four store products attached.
3. Current offering containing packages **Monthly** and **Annual**.
4. Integrations → Webhooks: URL `https://<PROJECT_REF>.supabase.co/functions/v1/revenuecat-webhook`,
   Authorization header = the same value as `REVENUECAT_WEBHOOK_AUTH`.
5. Public SDK keys → EAS env vars below. Secret API key → `REVENUECAT_API_KEY`.

## 5. Web (Vercel)

Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `vercel.json` already builds
`expo export --platform web` with SPA rewrites. Add the domain `lottodream.net`.

## 6. Apps (EAS)

```bash
npm i -g eas-cli && eas login && eas init
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value ...
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value ...
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_...
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_...
eas build --profile development --platform ios     # IAP needs a dev build; Expo Go cannot do purchases
eas build --profile production --platform all
eas submit --platform ios && eas submit --platform android
```

Fill `submit.production.ios.ascAppId` in `eas.json`. Repeat the `eas env:create` calls for `development` / `preview`.

## 7. Pre-submission tests

- [ ] Web: sign up → trial checkout → Premium unlocked → portal cancel → `cancel_at_period_end` shown
- [ ] Web: a second checkout after cancelling is charged immediately (no second trial)
- [ ] iOS sandbox + Android license tester: purchase monthly and yearly, **Restore purchases**, and cancel in the store
- [ ] A user who subscribed on web sees Premium in the app, and the app does not offer a second purchase
- [ ] Delete account (MyPage) → user removed, Stripe subscription cancelled
- [ ] App Review notes: demo account credentials, and a note that Premium is purchased via IAP in-app
