# LottoDream 🎱

Powerball 당첨 번호 분석 및 스마트 번호 추천 앱

## Features

### 📊 Data & Analysis
- NY Open Data API에서 2010년 이후 모든 Powerball 추첨 결과 자동 수집
- 전체/최근 10/25/50/100회 다중 범위 통계 분석
- 번호별 출현 빈도, 핫/콜드 번호, 오버듀 번호 추적
- 번호 쌍(pair) 동시출현 분석
- 홀짝 비율, 고저 비율, 합계 범위, 연속번호 비율

### 🎯 Smart Prediction Engine
5가지 모드의 번호 추천:
- **🔥 Hot Numbers** — 자주 출현한 번호 위주, 최근 50회 가중치
- **❄️ Cold Numbers** — 오래 안 나온 번호 위주
- **⚖️ Balanced Mix** — 핫2 + 콜드2 + 중간1 혼합
- **🎯 Anti-Crowd** — 사람들이 안 고르는 패턴 (당첨 시 높은 분배금)
- **🎲 Pure Random** — 완전 랜덤

각 추천에 품질 스코어 제공 (홀짝, 고저 균형, 합계 범위 기반)

### 🔐 User System
- Supabase Auth 기반 회원가입/로그인
- 포인트 시스템
- 번호 저장/즐겨찾기
- 추천인 코드/리퍼럴

### 📱 Screens
- **Home** — 최신 추첨 결과, 핫/콜드 번호, 핵심 통계
- **Analysis** — 히트맵, 상세 빈도표, 쌍 분석
- **Predict** — 5가지 모드 번호 생성
- **History** — 전체 추첨 기록 + 번호 검색
- **My Page** — 프로필, 포인트, 티켓, 설정

## Tech Stack
- **Frontend**: React Native (Expo) + TypeScript
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Data Source**: NY Open Data Powerball API
- **Charts**: Heatmap + stat cards

## Setup

### 1. Install dependencies
```bash
cd LottoDream
npm install
```

### 2. Set up Supabase
1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행
3. `src/config/constants.ts`에 Supabase URL과 Anon Key 입력:
```typescript
export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 3. Run the app
```bash
npx expo start
```

- iOS: `i` 키 또는 Expo Go 앱으로 QR 스캔
- Android: `a` 키 또는 Expo Go 앱으로 QR 스캔

## Project Structure
```
src/
├── config/          # Supabase 클라이언트, 상수
├── services/        # 핵심 비즈니스 로직
│   ├── drawService.ts       # 추첨 데이터 수집/저장
│   ├── analysisEngine.ts    # 통계 분석 엔진
│   ├── predictionEngine.ts  # 번호 추천 엔진
│   └── authService.ts       # 인증
├── hooks/           # React 커스텀 훅
├── components/      # 재사용 UI 컴포넌트
├── screens/         # 앱 화면
├── navigation/      # React Navigation 설정
└── types/           # TypeScript 타입 정의
```

## Data Source
- **NY Open Data**: `https://data.ny.gov/resource/d6yy-54nr.json`
  - 2010년부터 현재까지 모든 Powerball 추첨 결과
  - 자동 업데이트 (추첨 후 반영)
  - 무료, API 키 불필요 (rate limit 있음)

## Business Plan
See `biz-plan-lottodream.rtf` for full business model.

핵심 수익 모델:
- 티켓 대리구매 수수료 (19-25%)
- 포인트 충전 시스템
- 프리미엄 분석 기능 (향후)

## Roadmap
- [ ] 결제 시스템 (Stripe/PayPal) 통합
- [ ] 대리구매 워크플로우 (사진 증빙)
- [ ] 푸시 알림 (추첨 결과, 당첨 알림)
- [ ] Mega Millions 지원 추가
- [ ] 소셜 기능 (커뮤니티, 공유)
- [ ] 고급 ML 모델 (더 정교한 패턴 분석)

## License
Proprietary — All rights reserved.

## Disclaimer
이 앱은 정보 제공 및 오락 목적으로만 사용됩니다.
로또는 확률 게임이며, 과거 데이터가 미래 결과를 보장하지 않습니다.
책임감 있게 플레이해 주세요.
