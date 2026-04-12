# LottoDream 앱 출시 가이드

## 📱 iOS & Android 앱 스토어 출시 단계별 가이드

## 1️⃣ 사전 준비

### 필수 도구 설치
```bash
# EAS CLI 설치
npm install -g eas-cli

# 설치 확인
eas --version
```

### Expo 계정 설정
```bash
# Expo 계정이 없다면 가입
eas login

# 또는 기존 계정으로 로그인
eas logout
eas login
```

---

## 2️⃣ 아이콘 & 스플래시 이미지 준비

### 필요한 이미지 파일:
```
assets/
├── icon.png              (1024x1024px - 앱 아이콘)
├── adaptive-icon.png     (1024x1024px - Android 적응형 아이콘)
├── splash-icon.png       (1242x2436px - 스플래시 화면)
└── favicon.png           (192x192px - 웹 파비콘)
```

**권장사항:**
- 배경이 투명한 PNG 형식 사용
- 아이콘은 정사각형이 아닌 원형 또는 자유로운 모양 가능
- 스플래시는 앱 로딩 시 표시되는 이미지

### 자동 생성 도구 (선택사항)
```bash
# Expo 아이콘 생성 도구 사용
# https://www.figma.com/community에서 Expo Icon 템플릿 검색
```

---

## 3️⃣ 코드 서명 및 인증서 설정

### iOS 인증서 (App Store)

#### Option A: Expo에서 자동 관리 (권장)
```bash
# iOS 프로비저닝 프로필 자동 생성
eas build --platform ios --local
```

#### Option B: 수동 관리
1. [Apple Developer](https://developer.apple.com/) 계정 생성 ($99/년)
2. Certificate, Identifier, Profiles 생성
3. `eas.json`에서 다음 설정:
```json
"ios": {
  "appleId": "your-apple-id@example.com",
  "appleTeamId": "YOUR_TEAM_ID"
}
```

### Android 인증서 (Play Store)

#### 키 스토어 생성
```bash
# 키 스토어 생성 (처음 1회만)
keytool -genkey -v -keystore ~/lottodream.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias lottodream_key

# 입력할 정보:
# - Password: 안전한 비밀번호 저장
# - First and last name: Your Name
# - Organizational Unit: Engineering
# - Organization: LottoDream
# - City/Locality: Seoul
# - State/Province: Seoul
# - Country Code: KR
```

#### EAS에 키 스토어 업로드
```bash
eas credentials
# 메뉴: Android > com.lottodream.app > Keystore
# > Set up a keystore from a file
```

---

## 4️⃣ 빌드 프로세스

### 개발 빌드 (테스트용)
```bash
# iOS 시뮬레이터 빌드
eas build --platform ios --profile preview

# Android APK 빌드 (테스트)
eas build --platform android --profile preview
```

### 프로덕션 빌드

```bash
# iOS 프로덕션 빌드 (IPA)
eas build --platform ios --profile production

# Android 프로덕션 빌드 (AAB - App Bundle)
eas build --platform android --profile production

# 둘 다 빌드
eas build -p all --profile production
```

**빌드 상태 확인:**
```bash
eas build:list
eas build:view <build-id>
```

---

## 5️⃣ App Store 출시 (iOS)

### 1단계: Apple Developer 등록
- [Apple Developer](https://developer.apple.com/)에서 유료 멤버십 가입 ($99/년)
- 개인정보 및 결제 정보 등록

### 2단계: App ID & Bundle ID 생성
```
Certificates, IDs & Profiles > Identifiers > +
- Bundle ID: com.lottodream.app (app.json과 동일해야 함)
```

### 3단계: TestFlight에서 테스트
```bash
# 자동 제출 (권장)
eas submit --platform ios --profile production

# 또는 수동:
# 1. [App Store Connect](https://appstoreconnect.apple.com/) 접속
# 2. "My Apps" > "+"
# 3. "New App" 클릭
# 4. App Information, Pricing & Availability 작성
# 5. TestFlight에 빌드 업로드 및 테스트
```

### 4단계: App Review 및 승인
- 앱 심사 가이드라인 준수 확인
- App Privacy Policy 작성 (필수)
- 스크린샷 및 앱 미리보기 제공
- 검토 제출

### 5단계: 승인 후 배포
- TestFlight에서 최종 테스트
- "Release for Sale" 클릭하여 배포

---

## 6️⃣ Play Store 출시 (Android)

### 1단계: Google Play 개발자 계정 등록
- [Google Play Console](https://play.google.com/console/) 접속
- $25 일회 비용 지불
- 개인정보 등록

### 2단계: 앱 생성
```
"Create app" > 앱 이름: "LottoDream"
- Default Language: English
- App Category: Lifestyle
```

### 3단계: 앱 정보 작성
```
App details:
- 앱 이름, 설명, 스크린샷 업로드
- 콘텐츠 등급
- 대상 연령
- 개인정보 보호정책
```

### 4단계: 자동 제출
```bash
eas submit --platform android --profile production
```

또는 수동 제출:
```
Google Play Console > Internal testing > Build
> 프로덕션 빌드 (AAB) 업로드
```

### 5단계: 검수 및 승인
- 자동화된 검사 실행
- Google Play 정책 준수 확인
- 보통 몇 시간 내 승인

### 6단계: 배포
- "Manage releases" > "Production"
- "Create release" > 빌드 선택 > "Review"
- 배포 날짜 설정 > "Start rollout"

---

## 7️⃣ 필수 문서 준비

### Privacy Policy (필수)
```
https://www.freeprivacypolicy.com/ 또는
https://www.iubenda.com/ 에서 생성

필수 항목:
- 개인정보 수집 및 사용 설명
- Supabase 데이터 보안
- 타사 SDK 정책
```

### Terms of Service (권장)
```
앱 사용 약관 작성
```

### Support Email
```
예: lottodream-support@gmail.com
앱스토어에 표시될 연락처
```

---

## 8️⃣ 버전 관리

### 버전 업데이트 방법
```bash
# app.json에서 수정
{
  "version": "1.0.1",
  "ios": {
    "buildNumber": "2"
  },
  "android": {
    "versionCode": 2
  }
}

# 그 다음 다시 빌드
eas build -p all --profile production
```

**버전 관례:**
- Semantic Versioning: MAJOR.MINOR.PATCH (1.0.0)
- iOS buildNumber: 1부터 증가
- Android versionCode: 1부터 증가

---

## 9️⃣ 배포 후 관리

### 앱 모니터링
```bash
# 앱 분석 통계 확인
# - Google Play Console 또는 App Store Connect 대시보드

# 사용자 피드백 확인
# - 리뷰 및 평점 모니터링
# - 버그 리포트 확인
```

### 긴급 패치
```bash
# 버그 수정 후
npm version patch  # 1.0.0 -> 1.0.1

# 다시 빌드
eas build -p all --profile production

# 다시 제출
eas submit -p all --profile production
```

---

## 🔟 문제 해결

### 빌드 실패
```bash
# 로그 확인
eas build:view <build-id>

# 일반적인 원인:
# 1. app.json 문법 오류
# 2. 인증서 만료
# 3. 의존성 호환성 문제

# 해결:
npx expo prebuild --clean
npm install
eas build --platform [ios|android] --profile production
```

### 제출 실패
```bash
# 수동으로 확인
eas submit --platform ios --profile production --verbose

# Apple: 앱 심사 거절 사유 확인
# Google: 정책 위반 확인
```

### 앱 실행 안 됨
```bash
# 빌드 로그에서 에러 메시지 확인
eas build:list
eas build:view <build-id>

# Supabase 연결 확인
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## 다음 단계

1. **아이콘 & 이미지 준비** ✅
2. **app.json 및 eas.json 검토** ✅ (완료)
3. **EAS CLI 설치 및 로그인** (다음)
4. **빌드 테스트**
5. **스토어 계정 생성**
6. **제출 및 심사**

**추가 리소스:**
- [Expo 공식 가이드](https://docs.expo.dev/build/setup/)
- [iOS App Store 제출](https://docs.expo.dev/submit/ios/)
- [Android Play Store 제출](https://docs.expo.dev/submit/android/)
