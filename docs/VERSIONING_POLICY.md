# K-인증서 매니저 소프트웨어 버전 관리 정책 (Semantic Versioning Policy)

본 문서는 **K-인증서 매니저(K-Certificate Manager)** 프로젝트의 체계적인 릴리스 및 품질 보증을 위해 **Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH)** 원칙에 따른 3단계 버전 분류 기준과 코드 수정 발생 시의 필수 동기화 프로세스를 규정합니다.

---

## 📌 1. 3단계 버전 관리 원칙 (Three-Tier Semantic Versioning)

소프트웨어 버전 번호는 반드시 **`MAJOR.MINOR.PATCH`** (예: `1.4.0`) 규격을 준수하며, 변경의 성격과 규모에 따라 3단계로 엄격히 분리하여 갱신합니다.

```text
    v 1 . 4 . 0
      │   │   └── PATCH : 버그 수정, 텍스트 다듬기, 성능 최적화 (기능 변경 없음)
      │   └────── MINOR : 호환 가능한 신규 기능 추가, 핵심 워크플로 확장 (하위 호환 유지)
      └────────── MAJOR : 아키텍처 전면 개편, 하위 호환성 파괴, 플랫폼 전환
```

### 1) MAJOR (주 버전: X.0.0)
- **적용 조건**:
  - 기존 인증서 저장 구조(`AppData\LocalLow\NPKI` 등) 또는 백업 규격과의 하위 호환성이 깨지는 대규모 아키텍처 개편.
  - 지원 운영체제나 런타임 플랫폼의 근본적 전환.
  - 데이터베이스 스키마 또는 암호화 저장 방식의 비호환 마이그레이션.
- **규칙**:
  - `MAJOR` 숫자가 증가하면 `MINOR`와 `PATCH`는 반드시 `0`으로 초기화됩니다 (예: `1.4.2` ➔ `2.0.0`).

### 2) MINOR (부 버전: x.Y.0)
- **적용 조건**:
  - 기존 사용 환경의 하위 호환성을 완벽히 유지하면서 새로운 주요 기능이나 워크플로가 추가될 때.
  - 예시:
    - 실시간 USB 마운트 감지 및 지능형 복사 팝업/배너 시스템 도입.
    - USB 쓰기 실패 시 지수 백오프 기반 최대 3회 자동 재시도 파이프라인 추가.
    - 인증서 보유 드라이브 자동 최상단 정렬 및 시각적 골드 배지 추천 시스템.
    - 데스크톱 대시보드 퀵 전송 카드의 양방향(`PC➔USB`, `USB➔PC`) 통합.
    - 역방향(USB ➔ PC) 인증서 복사 및 복원 모달 신설.
    - 만료/타인 인증서 삭제 도구 및 임시 보관 휴지통/실행 취소(Undo) 기능 도입.
- **규칙**:
  - `MINOR` 숫자가 증가하면 `PATCH`는 반드시 `0`으로 초기화됩니다 (예: `1.3.2` ➔ `1.4.0`).

### 3) PATCH (패치 버전: x.y.Z)
- **적용 조건**:
  - 기존 기능 및 API의 호환성을 유지하면서 발견된 결함(Bugfix)을 수정할 때.
  - UI 레이아웃의 미세한 마진/패딩/색상 조정 및 타이포그래피 정돈.
  - 오탈자 수정, 번역 문구 개선, 도움말 툴팁 보완.
  - 내부 로직의 경미한 리팩토링이나 메모리 누수 방지 등 비기능적 최적화.
- **규칙**:
  - `PATCH` 숫자가 순차적으로 1씩 증가합니다 (예: `1.4.0` ➔ `1.4.1`).

---

## 🔄 2. 코드 수정 및 특이점 발생 시 동기화 체크리스트

코드 수정이나 신규 기능 개발 시, 특이점(기능 추가, 정책 변경, 결함 수정 등)이 발생하면 **반드시 다음 6개 영역을 동시에 업데이트**해야 합니다:

| 번호 | 대상 파일 | 동기화 내용 |
| :---: | :--- | :--- |
| **1** | `package.json` | `"version": "x.y.z"` 갱신 |
| **2** | `src/version.ts` | `APP_VERSION = 'x.y.z'` 및 `APP_RELEASE_DATE` 갱신 |
| **3** | UI 컴포넌트 | 헤더, 사이드바, `CoreSpecModal.tsx`, `LicenseModal.tsx`의 버전 표기 일치 |
| **4** | `installer.iss` | `#define MyAppVersion "x.y.z"` 및 출력 실행 파일명 갱신 |
| **5** | `build.bat` | `APP_VER=x.y.z` 및 산출물 파일명(`KCertManager_vx.y.z.exe`) 자동 연동 |
| **6** | `docs/PATCHNOTES.md` | 신규 버전에 대한 상세 변경 내역(신규 기능, 개선점, 버그 수정) 기록 |
| **7** | `docs/README.md` 등 | 문서 내 현재 버전 표기 및 신규 기능 매뉴얼 최신화 |

---

## ⚙️ 3. 자동 빌드 스크립트 산출물 명명 규격 (Executable Naming Convention)

`build.bat` 실행 시 생성되는 결과물 실행 파일(EXE)은 사용자가 파일명만 보고도 소프트웨어의 릴리스 버전을 명확히 식별할 수 있도록 **반드시 패치노트에 일치하는 버전 접미사(Version Suffix)**가 자동으로 부여되어야 합니다:

1. **C# WPF 데스크톱 풀버전 (Standalone Self-Contained)**:
   - 파일명: `release\05_WpfDesktop\KCertManager_v{MAJOR.MINOR.PATCH}.exe`
   - 예시: `KCertManager_v1.4.1.exe`
2. **C# WPF 초경량 라이트 에디션 (Framework-Dependent)**:
   - 파일명: `release\05_WpfDesktop\KCertManager-Lite_v{MAJOR.MINOR.PATCH}.exe`
   - 예시: `KCertManager-Lite_v1.4.1.exe`
3. **Inno Setup 공식 통합 설치 인스톨러 (Unpacked Multi-File)**:
   - 파일명: `release\07_Installer\kcert-manager-v{MAJOR.MINOR.PATCH}-setup.exe`
   - 예시: `kcert-manager-v1.4.1-setup.exe`

---

## 👤 4. 공식 메타데이터 및 문의처
- **개발자**: AhBiYout
- **구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **회사 홈페이지**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/)
