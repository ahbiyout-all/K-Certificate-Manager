# K-인증서 매니저 GitHub 개발·CI/CD 및 릴리스 배포 가이드 (GitHub Guide)

본 문서는 **K-인증서 매니저 (K-Certificate Manager)**의 GitHub 공식 저장소 운영, GitHub Actions CI/CD 자동화 파이프라인, 릴리스(Releases) 배포 프로세스 및 보안 정책을 종합 안내합니다.

---

## 📌 1. GitHub 공식 저장소 개요

- **저장소 명칭**: `K-Certificate-Manager`
- **공식 GitHub 주소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **이슈 트래커 (Issues)**: [https://github.com/AhBiYout-all/K-Certificate-Manager/issues](https://github.com/AhBiYout-all/K-Certificate-Manager/issues)
- **릴리스 저장소 (Releases)**: [https://github.com/AhBiYout-all/K-Certificate-Manager/releases](https://github.com/AhBiYout-all/K-Certificate-Manager/releases)
- **소유자/관리자**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **소속**: [(주)씨아이에스넷 (CISNet)](https://www.cisnet.co.kr)
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt` & 영어 `LICENSE_EN.txt` 2종 라이선스 공식 채택)

---

## 🌿 2. 브랜치 전략 및 Git 태그 정책

### 1) 브랜치 구조 (Branch Model)
* **`main`**: 상시 배포 가능한 프로덕션 브랜치. 태그(`v*`) 푸시 또는 main 푸시 시 자동으로 Windows 데스크톱 인스톨러 빌드 및 GitHub Releases 배포가 트리거됩니다.
* **`develop`**: 차기 버전 기능 개발 및 통합 브랜치. CI 매트릭스(`ci.yml`) 검증이 자동 실행됩니다.
* **`feature/*` / `bugfix/*`**: 신규 기능 구현 및 결함 수정을 위한 작업 브랜치.

### 2) 시맨틱 버저닝 (SemVer 2.0.0) 태깅
* 태그 형식: `v{MAJOR}.{MINOR}.{PATCH}` (예: `v1.7.2`)
* 태그 생성 시 GitHub Actions가 버전 문자열을 추출하여 Inno Setup 인스톨러 컴파일 및 GitHub Release 본문을 자동 생성합니다.
* 동적 버전 판별 3단계 파이프라인:
  1. **1차 기준**: Git Tag 문자열 (예: `v1.7.2` ➔ `1.7.2`)
  2. **2차 기준**: `package.json`의 `"version"` 필드
  3. **3차 기준**: `docs/PATCHNOTES.md` 상단 최신 릴리스 헤더 (`### 🚀 [v1.7.2]`)

---

## ⚡ 3. GitHub Actions CI/CD 워크플로 아키텍처

본 저장소는 `.github/workflows/` 디렉터리에 2개의 독립 워크플로를 구축하여 코드 품질과 배포 무결성을 보장합니다.

```
.github/workflows/
├── ci.yml       # [Web Quality Matrix] Node 22 LTS / Node 24 교차 검증 및 빌드 테스트
└── build.yml    # [Windows Desktop CI & Release] WPF 컴파일, Inno Setup 패키징, Release 자동 발행
```

### 1) Web Quality Matrix CI (`.github/workflows/ci.yml`)
* **트리거**: `main`, `develop` 푸시 및 풀 리퀘스트(PR) 발생 시 실행
* **러너 매트릭스**:
  * 운영체제: `ubuntu-latest`, `windows-latest`
  * Node.js 런타임: `22` (Active LTS) 및 `24` (Next-Gen)
* **주요 작업**:
  1. 소스코드 체크아웃 (`actions/checkout@v4`)
  2. 의존성 무결성 설치 (`npm ci` 또는 `npm install`)
  3. 코드 스타일 및 TypeScript 컴파일 검증 (`npm run lint` / `tsc --noEmit`)
  4. Vite 프로덕션 웹 번들 빌드 (`npm run build`)
  5. `dist/index.html` 산출물 유효성 검증

### 2) Windows 데스크톱 빌드 및 릴리스 (`.github/workflows/build.yml`)
* **트리거**: `v*` 태그 푸시, `main` 브랜치 푸시 또는 수동 실행(`workflow_dispatch`)
* **러너 환경**: `windows-latest`
* **주요 단계**:
  1. **버전 자동 감지**: `package.json` 및 Git 참조에서 릴리스 버전(`1.7.2`) 추출
  2. **런타임 환경 구성**: Node.js 24 런타임 및 .NET 10.0 / 8.0 SDK 설치
  3. **Web 콘솔 빌드**: `npm run build`를 통해 `dist/` 정적 번들 생성
  4. **C# WPF 데스크톱 컴파일**:
     * 순수 코어 라이브러리 `KCert.Core.dll` 빌드
     * 정식 독립 실행형 데스크톱 앱 `KCertManager_v1.7.2.exe` (Self-Contained) 빌드
     * 초경량 에디션 `KCertManager-Lite_v1.7.2.exe` (Framework-Dependent) 빌드
  5. **Inno Setup 인스톨러 패키징**:
     * Inno Setup 6 자동 다운로드 및 ISCC 컴파일
     * 폴더 풀림(Unpacked Multi-File) 레이아웃 설치 프로그램 `kcert-manager-v1.7.2-setup.exe` 생성
     * Windows 방화벽 인바운드 규칙 사전 등록 및 무인 설치 스위치 검증
  6. **GitHub Release 자동 발행 (`softprops/action-gh-release@v2`)**:
     * 태그 기반 Release 생성 및 릴리스 노트 자동 등록
     * 공식 설치 파일(`release/07_Installer/kcert-manager-v1.7.2-setup.exe`) 단독 첨부 배포

---

## 📦 4. 최신 v1.7.2 GitHub Release 배포 명세

* **릴리스 태그**: `v1.7.2`
* **릴리스 타이틀**: `K-Certificate Manager v1.7.2`
* **공식 첨부 자산 (Assets)**:
  * `kcert-manager-v1.7.2-setup.exe` (~40MB, Inno Setup 윈도우 정식 설치 프로그램)
* **핵심 기능 요약**:
  1. **상단 헤더 가로 볼륨 슬라이더 바 상시 탑재**: 원클릭 음소거 토글, 0%~100% 범위 슬라이더, 볼륨 수치, 미리듣기(▶) 버튼 일체형 배치
  2. **눈에 잘 띄는 [⚙️ 환경 설정] 버튼 상시 노출**: 가로 슬라이더 바 바로 옆에 배치하여 설정 창 접근 편의성 극대화
  3. **Windows C# WPF 데스크톱 전용 `SettingsDialog.xaml` 신설**: 알림음 ON/OFF, 미리듣기, 4대 테마, 모드 전환
  4. **로컬 환경 설정 영구 저장 서비스 (`SettingsService.cs`) 구축**: `%LocalAppData%\KCertManager\kcert_settings.json` 연동
  5. **'다시 표시하지 않음' CheckBox Two-Way 양방향 바인딩 및 XAML Spacing 제거로 CI 빌드 무결성 확보**
  6. **만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화 (v1.7.1 계승)**
  7. **Node.js 24 Next-Gen 및 Node.js 22 LTS CI/CD 런타임 최신화**

---

## 🔄 5. GitHub 기반 3계층(3-Tier) 실시간 자동 업데이트 엔진

K-인증서 매니저는 사용자가 최신 버전을 놓치지 않도록 GitHub REST API를 활용한 3단계 폴백 감지 파이프라인을 탑재하고 있습니다:

```
[ 1단계: /repos/:owner/:repo/releases/latest ]
       │ (404 Not Found 발생 시 즉시 폴백)
       ▼
[ 2단계: /repos/:owner/:repo/releases (전체 목록) ]
       │ (릴리스 목록 미발행 시 즉시 폴백)
       ▼
[ 3단계: /repos/:owner/:repo/tags (Git 태그 직결 엔드포인트) ]
       │
       ▼
[ 최신 v1.7.2 버전 즉각 감지 & 상단 헤더 업데이트 알림 배지 점등 ]
```

* **타임스탬프 캐시 버스팅**: `?_t=Date.now()` 파라미터 및 `Cache-Control: no-cache` 헤더를 적용하여 GitHub API의 로컬 브라우저/프록시 캐시 문제를 완전 해결
* **시맨틱 버전 비교 (`compareSemver`)**: 문자열 비교가 아닌 MAJOR, MINOR, PATCH 숫자 단위 비교로 정확한 업데이트 여부 판정

---

## 🔒 6. 보안 하드닝 및 Git 추적 방어 정책 (.gitignore)

GitHub 공개 저장소 운영 시 민감한 개인 인증서 정보가 원격에 유출되지 않도록 강력한 `.gitignore` 규칙을 적용하고 있습니다:

1. **전자서명 개인키 및 공인인증서 원천 차단**:
   * `*.der`, `*.cer`, `*.crt` (공개키 인증서)
   * `*.key`, `*.pri` (개인키 파일)
   * `*.pfx`, `*.p12` (복합 인증서 패키지)
2. **보안 감사 및 격리 휴지통 데이터 보호**:
   * `trash/`, `SafetyTrash/` (임시 격리 보관소)
   * `*.log`, `audit/` (로컬 감사 증적 로그)
   * `kcert_settings.json` (개인 환경 설정 파일)
3. **대용량 컴파일 바이너리 방어 (GitHub 100MB 단일 파일 제한 준수)**:
   * `release/`, `dist/`, `bin/`, `obj/`
   * `node_modules/`, `*.tmp`

---

## 🤝 7. GitHub 오픈소스 기여 및 이슈 보고

1. **버그 제보 (Bug Report)**:
   * [GitHub Issues](https://github.com/AhBiYout-all/K-Certificate-Manager/issues)에서 새로운 이슈를 생성합니다.
   * 운영체제 버전(Windows 10 / 11), 사용 중인 K-인증서 매니저 버전(예: `v1.7.2`), 오류 발생 경로 및 스크린샷을 첨부해 주시면 신속히 반영됩니다.
2. **기능 제안 (Feature Request)**:
   * 새로운 공인인증서 경로 지원, UI 편의 기능 등 다양한 아이디어를 Issue로 남겨주세요.
3. **Pull Request (PR) 가이드**:
   * `develop` 브랜치에서 분기하여 작업 후 PR을 제출해 주시기 바랍니다.
   * 제출 전 반드시 로컬에서 `npm run lint` 및 `npm run build`를 통과해야 합니다.
