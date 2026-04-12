# 🎯 iOS & Android 앱 출시 - 최종 체크리스트

## 현재 프로젝트 상태 ✅

```
✅ Expo React Native 프로젝트 구성 완료
✅ app.json - iOS & Android 설정 완료
✅ eas.json - 빌드 프로필 설정 완료
✅ 웹 애플리케이션 구현 완료
✅ 모바일 네비게이션 구현 완료
✅ Supabase 통합 완료
✅ 인증 시스템 완료
✅ 게임 기능 완료
✅ UI/UX 업데이트 완료
```

---

## 🚀 지금 할 일 (순서대로)

### 1️⃣ 로컬 테스트 (15분) - 필수
```bash
cd /Users/hoyonglee/Documents/LottoDream

# 의존성 확인
npm install

# iOS 시뮬레이터에서 테스트 (Mac)
npm run ios

# 또는 웹에서 테스트
npm run web
```

**확인 사항:**
- [ ] 앱이 정상 실행됨
- [ ] 로그인 화면이 나타남
- [ ] 메뉴 네비게이션 동작 확인
- [ ] 버튼 호버 효과 (웹) 또는 탭 효과 (앱) 확인

---

### 2️⃣ EAS 계정 설정 (2분) - 필수
```bash
# 터미널에서
eas login

# 또는 기존 계정이 있다면
eas logout
eas login
```

---

### 3️⃣ 아이콘 & 스플래시 이미지 준비 (30분) - 중요
몇 가지 옵션이 있습니다:

**Option A: 온라인 생성 (추천)**
1. https://www.figma.com/community - "App Icon"으로 검색
2. Figma를 사용해 아이콘 디자인
3. 아래 크기로 내보내기:
   - `icon.png`: 1024x1024px
   - `adaptive-icon.png`: 1024x1024px (Android)
   - `splash-icon.png`: 1242x2436px
4. `assets/` 폴더에 저장

**Option B: 디자인 도구 사용**
- Canva Pro (templates 사용)
- Adobe Express (무료)
- Photoshop/GIMP

**Option C: 자동 생성 (빠른 테스트용)**
```bash
# Expo의 자동 아이콘 생성 (기본 제공)
# 기본 제공되는 icon.png를 사용해도 빌드 가능
# 나중에 앱스토어 제출 전에 원하는 이미지로 변경
```

---

### 4️⃣ 첫 번째 빌드 테스트 (30분)
```bash
# Android APK 생성 (가장 빠름)
eas build --platform android --profile preview

# 또는 iOS (필요시 - Mac에서만 가능)
eas build --platform ios --profile preview
```

**빌드 상태 확인:**
```bash
# 빌드 진행 상황 확인
eas build:list

# 상세 로그 보기
eas build:view <build-id>
```

---

### 5️⃣ 프로덕션 빌드 준비 (10분)

app.json 버전 업데이트:
```json
{
  "version": "1.0.0",
  "ios": {
    "buildNumber": "1"
  },
  "android": {
    "versionCode": 1
  }
}
```

---

### 6️⃣ 스토어 계정 생성 (앱 출시 전)

#### 🍎 iOS App Store
```
1. Apple ID 생성 (무료)
   → https://appleid.apple.com
   
2. Apple Developer 등록 ($99/년)
   → https://developer.apple.com
   
3. App Store Connect 접속
   → https://appstoreconnect.apple.com
   
4. "My Apps" → "새 앱"
   - 앱 이름: LottoDream
   - 번들 ID: com.lottodream.app
   - SKU: lottodream-1
   - 사용자 액세스: 단일 사용자
```

#### 🤖 Android Play Store
```
1. Google Play 개발자 계정 등록 ($25 일회)
   → https://play.google.com/console
   
2. "앱 만들기"
   - 앱 이름: LottoDream
   - 기본 언어: English (또는 한국어)
   - 앱: 체크
   
3. 필수 정보 입력
   - 설명, 스크린샷
   - 콘텐츠 등급 설정
```

---

### 7️⃣ 프로덕션 빌드 (각각 5-30분)

```bash
# 모든 플랫폼 프로덕션 빌드
eas build -p all --profile production

# 또는 개별적으로
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

### 8️⃣ 앱 스토어 제출 (자동화)

```bash
# iOS 제출
eas submit --platform ios --profile production

# Android 제출
eas submit --platform android --profile production

# 둘 다 제출
eas submit -p all --profile production
```

**자동 제출이 안 되면 (수동):**
1. 빌드 파일 다운로드
2. 각 스토어 콘솔에서 수동 업로드

---

## 📝 필수 정보 & 문서

### Privacy Policy (필수)
앱스토어 제출 전에 준비:
- 개인정보 수집 설명
- Supabase에 저장되는 데이터
- 사용자 권한 설명
- 연락처

**생성 도구:**
- https://www.freeprivacypolicy.com/ (무료)
- https://www.iubenda.com/ (무료 + 유료)

### 앱 스크린샷
- iPhone 6.7" (또는 iPad)
- 최소 2개 이상
- 주요 기능 보여주기

### 앱 미리보기 (iOS 선택사항)
- 15-30초 동영상
- 앱 사용 흐름 시연

---

## ⚠️ 주의사항

### 1. Bundle ID 확인
```json
// app.json
{
  "ios": {
    "bundleIdentifier": "com.lottodream.app"
  },
  "android": {
    "package": "com.lottodream.app"
  }
}
```
- **중요**: 한 번 설정하면 변경 불가능!
- 스토어에서 처음 제출할 때 이 ID로 등록됨

### 2. 환경 변수
```bash
# .env 파일 확인
cat .env

# 필수:
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. 버전 번호
- iOS: `version` + `buildNumber` 모두 증가
- Android: `versionCode` 증가
- 매 빌드마다 증가해야 함

### 4. 앱스토어 심사 시간
- iOS: 보통 24-48시간
- Android: 보통 2-4시간

---

## 📊 시간 예상

| 단계 | 시간 | 필수 |
|------|------|------|
| 로컬 테스트 | 15분 | ✅ |
| EAS 로그인 | 2분 | ✅ |
| 아이콘 준비 | 30분 | ✅ |
| 첫 빌드 | 30분 | ✅ |
| 스토어 계정 | 1시간 | ✅ |
| 프로덕션 빌드 | 45분 | ✅ |
| 스토어 제출 | 10분 | ✅ |
| 심사 대기 | 1-48시간 | (자동) |
| **총 예상시간** | **3-4시간** | - |

---

## 🔗 중요 링크

### 공식 문서
- [Expo Docs](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/setup/)
- [EAS Submit](https://docs.expo.dev/submit/ios/)

### 스토어 제출
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)

### 정책
- [App Store 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play 정책](https://play.google.com/about/developer-content-policy/)

### 생성 도구
- [Privacy Policy 생성](https://www.freeprivacypolicy.com/)
- [아이콘 생성](https://www.figma.com/community)

---

## 💡 유용한 팁

### 빌드 최적화
```bash
# 캐시 초기화 후 빌드
rm -rf .expo .metro-cache
eas build --platform android --profile production
```

### 로그 보기
```bash
# 상세 로그로 빌드 (문제 발생 시)
eas build --platform android --profile production --verbose
```

### 빌드 목록 확인
```bash
# 지금까지 빌드한 목록
eas build:list

# 특정 빌드 상세 정보
eas build:view <build-id>
```

### 빠른 테스트
```bash
# 개발 빌드로 빨리 테스트
eas build --platform android --profile preview

# 프로덕션 빌드는 최종 확인용
eas build --platform android --profile production
```

---

## ✅ 최종 체크리스트

시작 전에 확인:
- [ ] Node.js v18 이상 설치됨
- [ ] EAS CLI 설치됨 (`npm install -g eas-cli`)
- [ ] Expo 계정 생성 및 로그인됨
- [ ] `.env` 파일이 올바르게 설정됨
- [ ] `app.json`의 번들 ID 확인됨
- [ ] 아이콘 이미지 준비됨 (또는 기본값 사용)

준비가 끝나면:
```bash
npm run ios  # 또는 npm run android - 로컬 테스트
eas build -p all --profile production  # 프로덕션 빌드
eas submit -p all --profile production  # 스토어 제출
```

**축하합니다! 이제 앱 출시 준비가 완료되었습니다! 🚀**
