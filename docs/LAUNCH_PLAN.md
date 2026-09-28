# LottoDream 출시 플랜 — 14일 무료 트라이얼 + Stripe 구독 + Web/iOS/Android

## 1. 제품 구조

| 플랜 | 가격 | 내용 |
|---|---|---|
| Free | $0 | Pure Random, 추첨 히스토리, 잭팟 정보 |
| Premium Trial | 14일 무료 · **카드 불필요** · 계정당 1회 | Premium 전체 |
| Premium | $4.99/월 (Stripe) | AI 모드 5종, Fortune, 분석, 무제한 저장 |

### 사용자 상태 머신

```
Free ──[Start 14-day free trial]──▶ Trialing (카드 없음)
                                     │  ├─[Add card]──▶ Trialing (카드 있음) ──14일 후──▶ Active ($4.99/월)
                                     │  └─14일 후 카드 없음 ──▶ Stripe가 자동 취소 ──▶ Free (과금 없음)
Free(트라이얼 사용함) ──[Subscribe]──▶ Stripe Checkout ──▶ Active
Active ──결제 실패──▶ Past due ──[Update payment method]──▶ Active
Active ──[Manage → Cancel]──▶ 기간 종료 시 Free
```

Pricing 화면의 CTA는 이 상태에 따라 자동으로 바뀝니다
(`src/screens/PricingScreen.tsx`, `src/hooks/useEntitlement.ts`).

## 2. 아키텍처

```
Web(Vercel) / iOS / Android  ── 같은 Expo 코드베이스
        │  supabase.functions.invoke(...)
        ▼
Supabase Edge Functions
  start-trial                   카드 없는 14일 트라이얼 (Stripe subscription 직접 생성)
  create-checkout-session       다음 단계를 서버가 결정: 트라이얼 카드 추가(setup) / 구독 / 포털
  create-billing-portal-session 관리·해지
  delete-account                구독 즉시 해지 + 계정 삭제 (스토어 필수 요건)
  stripe-webhook                Stripe → profiles / subscriptions 동기화
        ▼
Postgres: profiles (결제 컬럼은 service_role만 쓰기 가능), subscriptions
```

**네이티브 결제 흐름:** 앱 → `WebBrowser.openAuthSessionAsync(stripeUrl)` → Stripe →
`https://lottodream.net/?checkout=success&app_return=1` → `src/web-init.ts`가
`lottodream://billing?...`로 튕겨줌 → 인앱 브라우저가 닫히고 권한 갱신.

## 3. 배포 체크리스트

### 3-1. Stripe (Test 모드로 먼저 진행한 뒤 Live 모드에서 반복)
1. Product "LottoDream Premium" → Recurring price **$4.99 / month** → `price_...` 복사
2. Settings → Billing → Customer portal: 해지, 결제수단 변경, 인보이스 내역 활성화
3. Settings → Billing → Subscriptions and emails: **trial ending reminder 이메일** 켜기
   (트라이얼 종료 7일 전 안내. 카드 없는 트라이얼 전환율에 핵심입니다)
4. Developers → Webhooks → Endpoint 추가
   `https://<PROJECT>.supabase.co/functions/v1/stripe-webhook`
   이벤트: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `customer.subscription.trial_will_end`, `invoice.paid`, `invoice.payment_failed`
5. (권장) Stripe Tax 활성화

### 3-2. Supabase
```bash
supabase link --project-ref <PROJECT>
supabase db push                       # 20260928120000_trial_and_billing_hardening.sql 포함
supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PREMIUM_PRICE_ID=price_... PREMIUM_TRIAL_DAYS=14 APP_URL=https://lottodream.net
supabase functions deploy start-trial create-checkout-session \
  create-billing-portal-session delete-account
supabase functions deploy stripe-webhook --no-verify-jwt
```
> ⚠️ 이전 버전 문서는 시크릿 이름을 `STRIPE_PRICE_ID`로 안내했지만, 함수가 실제로 읽는 이름은
> `STRIPE_PREMIUM_PRICE_ID`입니다.

Database → Replication에서 `profiles` 테이블의 Realtime을 켜두면 결제 직후 화면이 즉시 갱신됩니다.

### 3-3. Web (Vercel)
- Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `vercel.json`이 이미 `expo export --platform web` + SPA rewrite를 설정해 둔 상태입니다.

### 3-4. iOS / Android (EAS)
```bash
npm i -g eas-cli && eas login
eas init                                   # projectId를 app.json에 기록
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value ... --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value ... --environment production
eas build --profile preview --platform android     # 내부 테스트용 APK
eas build --profile production --platform all
eas submit --profile production --platform ios     # eas.json의 appleId/ascAppId/teamId 채우기
eas submit --profile production --platform android # secrets/play-service-account.json 필요
```

## 4. ⚠️ 스토어 정책 리스크 (반드시 읽어주세요)

앱 안에서 디지털 구독을 Stripe로 판매하는 것은 스토어 정책상 민감한 영역입니다.

- **iOS (미국 스토어):** 2025년 Epic v. Apple 판결 이후 미국 스토어프런트에서는 외부 결제
  링크/버튼이 허용됩니다. 이 앱은 Powerball 등 미국 복권이 대상이라 미국 출시가 기본 전제입니다.
  **미국 외 국가에 출시하면 IAP가 필요합니다.** App Store Connect에서 판매 국가를 미국으로 제한하세요.
- **리젝 시 플랜 B:** `EXPO_PUBLIC_IOS_PURCHASE_MODE=web_only`로 빌드하면 iOS에서 모든 구매/트라이얼
  CTA가 숨겨지고 "웹에서 관리" 안내만 표시됩니다(웹에서 구독하면 앱에도 권한이 동기화됩니다).
- **Android (Google Play):** 미국은 Epic v. Google 이후 외부 링크가 허용되는 방향이지만,
  제출 시점의 Play 결제 정책(외부 제안 프로그램 등록 여부)을 확인해야 합니다.
- **장기적 대안:** RevenueCat으로 iOS/Android IAP를 붙이고 Stripe(Web)와 권한을 통합하는 방법이
  있습니다. `premium_source`에 `apple_iap` / `google_iap`가 이미 스키마에 준비돼 있습니다.
- **복권 카테고리:** 티켓 판매가 아닌 "분석/엔터테인먼트" 앱임을 앱 설명과 리뷰 노트에 명시하세요
  (Apple 5.3 대응). 앱 내 고지 문구는 이미 FAQ와 약관에 있습니다.
- **계정 삭제:** 앱 내 삭제가 필수입니다(Apple 5.1.1(v)). My Page → Delete account로 구현했습니다.

## 5. QA 시나리오 (Stripe Test 모드)
- [ ] 신규 가입 → Start 14-day free trial → 즉시 Premium, 카드 입력 없음
- [ ] 트라이얼 중 "Keep Premium — add a card" → `4242 4242 4242 4242` → My Page 배지 유지, `has_payment_method = true`
- [ ] Stripe Test Clock으로 15일 경과 처리: 카드 없음 → Free로 복귀, 카드 있음 → Active + 인보이스 $4.99
- [ ] 트라이얼을 이미 쓴 계정 → CTA가 "Subscribe — $4.99/month", Checkout에 trial 없음
- [ ] `4000 0000 0000 0341`(결제 실패) → Past due 배지 → Update payment method
- [ ] iOS/Android: Checkout 완료 → 인앱 브라우저 자동 종료 → 권한 즉시 반영
- [ ] 브라우저 콘솔에서 `profiles.update({subscription_tier:'premium'})` 시도 → 값이 바뀌지 않아야 함
- [ ] Delete account → Stripe 구독 canceled, auth user 삭제

## 6. 남은 과제 (다음 스프린트 후보)
- Free 저장 한도가 문구마다 다르고(Landing "20", Pricing "3") 코드에서 강제하지 않음 → 정책 확정 필요
- 트라이얼 D-3 인앱 배너 / 푸시 알림
- 연간 플랜 (예: $39.99/년) — Stripe price만 추가하면 됨
- 네이티브 OAuth(Google) 리다이렉트 점검, 앱 아이콘/스크린샷/스토어 메타데이터
- `lotto-deploy.zip` 등 레포 내 빌드 산출물 정리
