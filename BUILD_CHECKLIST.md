# 🚀 LottoDream 앱 빌드 & 배포 - 빠른 시작

## 📋 체크리스트

### 1단계: 환경 설정 (5분)
- [ ] Node.js v18+ 설치
- [ ] Expo CLI 설치: `npm install -g eas-cli`
- [ ] Expo 계정 생성: `eas login`or `eas logout && eas login`

### 2단계: 앱 설정 확인 (5분)
- [ ] `app.json` 확인:
  - iOS Bundle ID: `com.lottodream.app`
  - Android Package: `com.lottodream.app`
  - Version: `1.0.0`
  - Build numbers: iOS `buildNumber: "1"`, Android `versionCode: 1`

- [ ] `eas.json` 확인 (자동으로 생성됨)

- [ ] 환경 변수 확인 (`.env` 파일):
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

### 3단계: 아이콘 & 이미지 준비 (10분)
필요한 파일들 (`assets/` 디렉토리):
- [ ] `icon.png` (1024x1024px) - 앱 아이콘
- [ ] `adaptive-icon.png` (1024x1024px) - Android 아이콘
- [ ] `splash-icon.png` (1242x2436px) - 스플래시 화면
- [ ] `favicon.png` (192x192px) - 웹 파비콘

### 4단계: 로컬 테스트 (5분)
```bash
# iOS 시뮬레이터 테스트 (Mac만)
npm run ios

# Android 에뮬레이터 테스트
npm run android

# 웹 테스트
npm run web
```

### 5단계: 프로덕션 빌드 (30분)
```bash
# 개발 빌드 (먼저 테스트)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# 프로덕션 빌드
eas build --platform android --profile production
eas build --platform ios --profile production

# 또는 둘 다
eas build -p all --profile production
```

### 6단계: 스토어 계정 생성 (30분)
- [ ] **iOS**: [App Store Connect](https://appstoreconnect.apple.com/) 계정 + Apple Developer ($99/년)
- [ ] **Android**: [Google Play Console](https://play.google.com/console/) 계정 ($25 일회)

### 7단계: 앱 스토어 제출 (30분)
```bash
# 자동 제출 (권장)
eas submit --platform ios --profile production
eas submit --platform android --profile production

# 또는 수동으로 스토어에서 직접 제출
```

### 8단계: 심사 & 승인 (1-2주)
- [ ] **iOS**: 보통 24-48시간
- [ ] **Android**: 보통 몇 시간

---

## ⚡ 주요 명령어

```bash
# 현재 상태 확인
eas build:list

# 빌드 로그 전체 보기
eas build:view <build-id>

# 인증서 관리
eas credentials

# 로컬에서 iOS 빌드 (Mac만)
eas build --platform ios --local

# 특정 프로필로 빌드
eas build --platform android --profile preview
```

---

## 🔑 중요한 사항

### 환경 변수
```bash
# .env 파일에 설정되어 있어야 함
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY

# 확인 방법
echo $EXPO_PUBLIC_SUPABASE_URL
```

### 번들 ID (Bundle ID)
- 전역적으로 유니크해야 함
- 한 번 설정하면 변경 어려움
- 형식: `com.companyname.appname`
- 현재: `com.lottodream.app`

### 버전 관리
- 매 업데이트마다 증가시켜야 함
- `app.json`에서 수정 후 다시 빌드
- iOS: `buildNumber`와 `version` 모두 증가
- Android: `versionCode` 증가

---

## 📍 각 플랫폼별 특이사항

### iOS (App Store)
- ✅ 자동 서명 지원 (EAS)
- ⚠️ 스크린샷 필수 (최소 1개 크기별)
- ⚠️ Privacy Policy URL 필수
- 🎯 "Build for iOS App Store" 인증서 필요

### Android (Play Store)
- ✅ APK/AAB 자동 생성
- ⚠️ 개인정보 보호정책 필수
- ⚠️ 스크린샷 권장 (최소 2개)
- 🎯 Release 빌드 필요 (production profile)

---

## 🆘 문제 해결

### "Command failed with exit code 1"
```bash
# 1. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 2. 캐시 초기화
eas build --platform android --profile production --verbose
```

### 인증서/키스토어 문제
```bash
# 재설정
eas credentials
# → 옵션에서 Clear 후 다시 생성
```

### Supabase 연결 안 됨
```bash
# .env 파일 확인
cat .env

# 앱에서 출력하기 (temporary)
console.log(process.env.EXPO_PUBLIC_SUPABASE_URL);
```

---

## 📚 추가 문서
- 상세 가이드: [APP_RELEASE_GUIDE.md](./APP_RELEASE_GUIDE.md)
- Expo 공식: https://docs.expo.dev/build/setup/
- App Store 가이드: https://developer.apple.com/app-store/review/guidelines/
- Play Store 가이드: https://play.google.com/about/developer-content-policy/

---

## 🎯 다음 단계

지금 바로:
1. `npm install` - 의존성 확인
2. `npm run ios` 또는 `npm run android` - 로컬 테스트
3. 아이콘/이미지 준비
4. `eas build --platform android --profile preview` - 첫 빌드 테스트

준비 완료되면:
1. 스토어 계정 생성
2. `eas submit` - 앱 스토어에 제출
3. 심사 완료 후 배포!
