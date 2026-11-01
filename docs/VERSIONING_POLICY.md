# 📌 K-인증서 매니저 소프트웨어 버전 관리 정책 (Semantic Versioning Policy)

본 문서는 **K-인증서 매니저(K-Certificate Manager)** 프로젝트의 체계적인 릴리스 품질 보증과 무결성 유지를 위해, **Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH)** 원칙에 입각하여 변경 규모에 맞춘 3단계 버전 분리 기준 및 전역 코드베이스 동기화 프로세스를 규정합니다.

---

## 🎯 1. 3단계 버전 분리 원칙 (Three-Tier Semantic Versioning Matrix)

소프트웨어 버전 번호는 반드시 **`MAJOR.MINOR.PATCH`** (예: `1.8.0`) 3단계 포맷을 엄격히 준수하며, 코드 변경의 규모와 성격에 따라 명확하게 분리하여 승격합니다.

```text
    v 1 . 8 . 0
      │   │   └── [3단계] PATCH (패치 버전) : 하위 호환 버그 수정, 빌드 스크립트 픽스, 단순 오탈자/스타일 미세 조정
      │   └────── [2단계] MINOR (마이너 버전) : 하위 호환성 유지 + 순수 창작 DLL 분리, 신규 기능·엔진·UI 위젯 추가
      └────────── [1단계] MAJOR (메이저 버전) : 하위 호환성 단절, 아키텍처 전면 재설계, 비호환 저장소 마이그레이션
```

### 1) [1단계] MAJOR (주 버전: X.0.0)
- **정의**: 기존 버전과의 **하위 호환성이 깨지는 파괴적 변경(Breaking Changes)**이 발생할 때 승격합니다.
- **적용 기준**:
  - 기존 인증서 저장 구조(`AppData\LocalLow\NPKI` 등) 또는 백업 규격과의 하위 호환성이 완전히 단절될 때.
  - 지원 운영체제나 런타임 플랫폼의 근본적 전환 (.NET WPF 데스크톱에서 크로스플랫폼 완전 재작성 등).
  - 데이터 저장소 규격 또는 암호화 저장 방식의 비호환 마이그레이션.
- **버전 규칙**:
  - `MAJOR` 숫자가 1 증가하면, `MINOR`와 `PATCH`는 반드시 `0`으로 초기화됩니다 (예: `1.8.0` ➔ `2.0.0`).

### 2) [2단계] MINOR (부 버전: x.Y.0)
- **정의**: 기존 사용 환경의 **하위 호환성을 100% 유지하면서, 새로운 모듈·엔진·핵심 기능이 추가**될 때 승격합니다.
- **적용 기준**:
  - **순수 창작 독립 DLL 분리 및 아키텍처 모듈화** (`KCert.Core.dll`, `KCert.Crypto.dll` 신설).
  - **신규 사용자 인터페이스 위젯 탑재** (상단 헤더 가로바 스크롤러 `HorizontalScrollBar`, 마우스 휠 가로 스크롤 연동, 실시간 볼륨 슬라이더 및 음소거 토글).
  - **전역 서브시스템 신설** (4대 테마 연동 전역 고대비 툴팁 `ToolTip` 시스템, 보안 영구 삭제 증적 감사 로그 포렌식 시스템).
  - 역방향(USB ➔ PC) 인증서 복사 및 복원 모달, 환경 설정 모달 신설.
- **버전 규칙**:
  - `MINOR` 숫자가 1 증가하면, `PATCH`는 반드시 `0`으로 초기화됩니다 (예: `1.7.2` ➔ `1.8.0`).

### 3) [3단계] PATCH (수정 버전: x.y.Z)
- **정의**: 기존 기능 및 API의 하위 호환성을 유지하면서, **발견된 결함(Bugfix)을 수정하거나 내부 로직을 안정화**할 때 승격합니다.
- **적용 기준**:
  - 컴파일 및 빌드 오류 해결 (MSBuild XML 엔티티 파싱 에러 `&amp;` 수정 등).
  - UI 렌더링 결함 해결 (다크 테마 툴팁 글자색 시인성 불량 픽스 등).
  - 오탈자 수정, 라벨 텍스트 다듬기, 도움말 툴팁 문구 보강.
  - 성능 최적화, 메모리 누수 방지, 단순 마진/패딩 미세 조정.
- **버전 규칙**:
  - `PATCH` 숫자가 순차적으로 1씩 증가합니다 (예: `1.8.0` ➔ `1.8.1`).

---

## 🧭 2. 변경 규모 판정 의사결정 트리 (Decision Tree)

```text
[코드 변경 발생]
       │
       ├─► Q1. 기존 데이터/사용자 환경의 하위 호환성이 깨지는가?
       │     ├─► [YES] ──────► [MAJOR 버전 승격] (예: v2.0.0)
       │     └─► [NO]
       │           │
       ├─► Q2. 신규 DLL, 핵심 엔진, 신규 네비게이션/위젯 등 기능 확장이 있는가?
       │     ├─► [YES] ──────► [MINOR 버전 승격] (예: v1.8.0)
       │     └─► [NO]
       │           │
       └─► Q3. 버그 수정, XML 파싱 에러 해결, 툴팁 색상 수정, 오탈자 보완인가?
             └─► [YES] ──────► [PATCH 버전 승격] (예: v1.8.1)
```

---

## 🔄 3. 전역 코드베이스 동기화 체크리스트 (8대 필수 영역)

버전 승격이 결정되면, 일관성을 보장하기 위해 **반드시 다음 8개 핵심 영역을 100% 동시에 업데이트**해야 합니다:

| 번호 | 대상 영역 / 파일 | 필수 동기화 내용 |
| :---: | :--- | :--- |
| **1** | `package.json` | `"version": "x.y.z"` 갱신 |
| **2** | `src/version.ts` | `APP_VERSION = 'x.y.z'`, `APP_RELEASE_DATE` 갱신 |
| **3** | C# WPF 데스크톱 프로젝트 (`KCertManager.Wpf.csproj`) | `<Version>`, `<AssemblyVersion>`, `<FileVersion>` 동기화 |
| **4** | 순수 창작 코어 라이브러리 (`KCert.Core.csproj`, `KCert.Crypto.csproj`) | `<Version>`, `<AssemblyVersion>`, `<FileVersion>` 동기화 |
| **5** | 데스크톱 자동 업데이트 서비스 (`UpdateCheckerService.cs`) | `CURRENT_VERSION = "x.y.z"` 갱신 |
| **6** | Inno Setup 윈도우 인스톨러 스크립트 (`installer.iss`) | `#define MyAppVersion "x.y.z"` 및 산출물 파일명 동기화 |
| **7** | 자동 빌드 및 CI 워크플로 (`build.ps1`, `.github/workflows/build.yml`) | 버전 추출 및 기본 폴백 버전 동기화 |
| **8** | 공식 기술 및 배포 문서 (`docs/PATCHNOTES.md`, `README.md`, `USER_GUIDE.md`, `BLOG_*.md`, `WORK_LOG.md`) | 신규 버전 릴리스 명세, 변경 내역 및 블로그 원고 작성 |

---

## ⚙️ 4. 공식 배포 산출물 명명 규격

빌드 파이프라인에서 생성되는 실행 파일(EXE)은 사용자가 파일명만으로 릴리스 버전을 명확히 식별할 수 있도록 아래의 명명 규격을 따릅니다:

1. **Inno Setup 공식 윈도우 정식 설치 인스톨러 (Multi-File Unpacked Setup)**:
   - 파일명: `release\07_Installer\kcert-manager-v{MAJOR.MINOR.PATCH}-setup.exe`
   - 예시: `kcert-manager-v1.8.0-setup.exe`
2. **C# WPF 데스크톱 단일 실행 파일 (Self-Contained Standalone)**:
   - 파일명: `release\05_WpfDesktop\KCertManager_v{MAJOR.MINOR.PATCH}.exe`
   - 예시: `KCertManager_v1.8.0.exe`
3. **C# WPF 초경량 프레임워크 종속 실행 파일 (Framework-Dependent)**:
   - 파일명: `release\05_WpfDesktop\KCertManager-Lite_v{MAJOR.MINOR.PATCH}.exe`
   - 예시: `KCertManager-Lite_v1.8.0.exe`

---

## 👤 5. 공식 메타데이터 및 문의처
- **개발자**: AhBiYout (GitHub: [AhBiYout-all](https://github.com/AhBiYout-all))
- **공식 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **회사 홈페이지**: [https://www.cisnet.co.kr/](https://www.cisnet.co.kr/) ((주)씨아이에스넷 CISNet)

