# 📢 [구글 블로그 원고 - 작성 모드 (서식 있는 텍스트 / Compose Mode)]
# 프로젝트: K-Certificate Manager (K-인증서 매니저) v2.1.1

---

## 1. 제목 (Title)
**K-인증서 매니저 v2.1.1 정식 릴리스: 복사 폴더 드라이브 루트 타겟팅, 비표준 정위치 복구·휴지통 격리, 중복 건너뛰기 안내 및 전수 감사 안정화**

---

## 2. 본문 (Body)
대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(`C:\`)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v2.1.1** 정식 버전이 출시되었습니다.

이번 `v2.1.1` 패치 릴리스는 `v2.1.0`의 **인앱 자동 다운로드·무인 셀프 설치, WPF-Web 다크 테마 통합, CSS Grid `auto-fill` 반응형 카드 목록, 쉬운 일상 표현 UI**를 기반으로, 실제 사용 환경에서 발생할 수 있는 경로·중복·복구 워크플로우의 세밀한 오류를 전면 보완했습니다. 특히 **'복사된 폴더 열기' 시 실제 드라이브 루트(`E:\NPKI\...`) 정밀 연결**, **비표준 위치 인증서의 정위치 복구 후 원본 즉시 안전 휴지통 격리·로그·토스트 연동**, **중복 건너뛰기(`skip`) `0건` 전용 안내**, **PC 표준 경로 우선 중복 판정**까지 한층 단단해진 신뢰성을 제공합니다.

---

## 3. 업데이트 (Recent Updates)
- 🏛️ **`Class1` 기관·특수목적 인증서 구분 배지 & 사이드바 `CLASS1` 필터 신설 (`Sidebar`, `CertificateList`, `MainWindow`, `CertLocationScanner`)**:
  - `C:\GPKI\Certificate\class1`, EPKI, USB `class1` 폴더에서 개인키(`.key`/`.pri`) 쌍을 보유한 실사용 기관 인증서만 선별 표시(Root/CA/CRL 및 중복 `_env.cer` 제외)하며, `CLASS1 · 공무원(GPKI)` / `CLASS1 · 교육(EPKI)` / `CLASS1 · 기관` 배지와 사이드바 `CLASS1` 필터·검색 키워드를 제공합니다.
- 📁 **복사 완료 폴더 실제 드라이브 루트(`E:\NPKI\...`) 탐색기 타겟팅 보강 (`OperationCompleteModal`, `BackupModal`, `OperationCompleteDialog`)**:
  - `'복사된 폴더 열기'` 클릭 시 드라이브 문자 뒤 누락 백슬래시(`\`)와 하위 경로 조합을 정규화해 실제 대상 드라이브 루트를 정확히 열어주며, Web 환경에서도 안전 브리지·폴더 피커·클립보드 폴백을 지원합니다.
- 🧹 **비표준 경로 정위치 복구 마법사·안전 휴지통 격리 워크플로우 완성 (`handleRepairFolders`, `DiagnosticsRepairDialog`, `CertIntegrityDoctor`)**:
  - 중첩 폴더나 비표준 경로 인증서를 표준 위치로 복사한 직후 중복 ID를 정리해 원본을 안전 휴지통(`SafetyTrash`)으로 즉시 격리하고 활동 로그(`RESTORE`/`DELETE`)·성공 토스트를 기록하며, `specificDerPath` 정밀 진단 및 동일 경로 자기덮어쓰기 `IOException`을 사전 차단합니다.
- 🛡️ **중복 건너뛰기(`skip`) 0건 가드 및 Web/WPF 5차 심층 전수 감사 안정화**:
  - **Web**: `skip` 옵션으로 실제 복사 `0`건일 때 허위 `"0건 완료"` 대신 `중복 건너뛰기 완료` 화면과 `INFO` 로그·토스트만 표시; `USB:\NPKI|GPKI\Certificate|EPKI\Certificate` 표준 경로 및 TradeSign `NPKI_CORP` 분류 통일, 타이머·윈도우 리스너 누수 정리 및 `localStorage`/JSON 스키마·프로토타입 오염 방어 강화.
  - **WPF**: `.NET`/`WPF` CI 컴파일(`Regex`/널 참조 경고) 해소, `DispatchSafe`/`OnClosed`/`IDisposable`/비동기 `try/catch` 수명주기 정리, `SafetyTrashManager` 읽기 전용 해제, `KCertAntiDuplicationEngine` PC 원본 우선 선정 및 `FastScanPipeline` 말단 `\MPKI` GPKI 인식 보강.
- 🚀 **인앱 자동 다운로드·무인 셀프 설치 & WPF-Web 다크 테마·반응형 카드 UI (`v2.1.0` 기반 계승)**:
  - GitHub 웹사이트 이동 없이 업데이트 창 `[확인 (자동 다운로드 · 설치)]` 클릭만으로 다운로드·검증(`MZ`/SHA-256)·무인 설치·재실행까지 원스톱 처리하며, 통합 다크 테마(`#0F1219`), CSS Grid `auto-fill` 카드 레이아웃, 쉬운 일상 표현 + `더보기` UI, DPAPI/AES-256 암호화 보호 보관함, 60fps 유동 네온 테두리를 제공합니다.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v2.1.1 통합 다크 인터페이스 & 인앱 자동 업데이트]
- 상단 툴바: 🔊 볼륨 슬라이더 | ⚙️ 환경 설정 | 💾 PC ➔ USB | 📥 USB ➔ PC | ✨ 업데이트 확인
- 업데이트 창: [확인 (자동 다운로드 · 설치)] ➔ 다운로드 진행률 ➔ 무결성 검증 ➔ 무인 셀프 설치·재실행
- 중앙 목록(Web/WPF): 반응형 CSS Grid(auto-fill) 인증서 카드 뷰 ↔ 고정 인덱스 표 보기(1-Based)
- 작업 완료·복구: 📁 실제 드라이브 루트(E:\NPKI\...) 폴더 열기 · 비표준 정위치 복구 후 안전 휴지통 격리
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- 💾 **공식 구글 블로그 다운로드 안내**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 및 자동 업데이트 안내**: `kcert-manager-v2.1.1-setup.exe` 파일을 실행하면 바탕화면 바로가기 생성 및 Windows 방화벽 규칙 자동 등록과 함께 설치되며, 이미 설치된 환경에서는 앱 시작 시 뜨는 업데이트 창에서 **`[확인 (자동 다운로드 · 설치)]`** 버튼만으로 자동 업데이트가 완료됩니다. *(기업용 무인 설치 옵션: `/VERYSILENT /NORESTART`)*

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v2.1.1` (Semantic Versioning 2.0.0 PATCH Release)
- **코어 라이브러리**: `KCert.Core.dll` v2.1.1 / `KCert.Crypto.dll` v2.1.1
- **릴리스 일자**: 2026년 11월 16일

---

## 7. 시스템 요구 사항 (System Requirements)
- **운영체제**: Windows 11 / Windows 10 (64-bit / 32-bit 지원)
- **런타임**: .NET 10.0 또는 .NET 8.0 Desktop Runtime (Self-Contained 패키지는 추가 설치 불필요)
- **디스크 공간**: 약 35 MB 이상의 여유 공간
- **지원 매체**: 내장 SSD/HDD, 이동식 USB 메모리, 외장 SSD, 가상 드라이브

---

## 8. 제작자 및 공식 채널 안내 (Developer & Official Channels)
- **개발자**: AhBiYout
- **GitHub 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr)
- **소속회사**: (주)청운정보시스템 ( cisnet.co.kr )

---

## 9. 전체 업데이트 (Full Update History)

### 🚀 [v2.1.1] - 2026-11-16 (안정화 2026-11-18)
- **`Class1` 기관·특수목적 인증서 구분 배지 & 필터**: `C:\GPKI\Certificate\class1` 등 개인키 쌍 보유 인증서 선별 스캔, `CLASS1 · 공무원(GPKI)`/`교육(EPKI)`/`기관` 배지 및 사이드바 `CLASS1` 필터·키워드 검색 신설.
- **복사 완료 폴더 실제 드라이브 루트(`E:\NPKI\...`) 탐색기 타겟팅 보강**: `OperationCompleteModal` / `OperationCompleteDialog`에서 `'복사된 폴더 열기'` 실행 시 드라이브 문자 및 하위 경로 정규화로 정확한 위치 호출.
- **비표준 경로 정위치 복구 마법사·안전 휴지통 격리 워크플로우 완성**: 표준 경로 복사 후 원본 비표준 폴더 즉시 안전 휴지통(`SafetyTrash`) 이동 및 활동 로그·성공 토스트 연동, `specificDerPath` 정밀 진단 및 동일 경로 자기덮어쓰기 `IOException` 방지.
- **전수 감사(Pass 1~5) 및 CI 컴파일·수명주기·JSON 안전성 교정**: `.NET`/`WPF` CI 컴파일(`Regex`/널 경고) 해소, `DispatchSafe`/`OnClosed`/`IDisposable` 수명주기 정리, Web 타이머·리스너 누수 및 JSON 스키마 방어, 중복 `skip` 0건 가드, `USB:\` 표준 경로 및 `KCertAntiDuplicationEngine` PC 원본 우선 정렬.

### 🚀 [v2.1.0] - 2026-11-13
- **GitHub 이동 없는 앱 내 자동 다운로드 · 무인 셀프 설치 엔진 탑재 (WPF & Web)**: 업데이트 알림 창 `[확인]` 클릭 시 직접 다운로드, `MZ`/`PK` 및 SHA-256 검사, 무인 설치 및 자동 재실행 지원.
- **WPF-Web 다크 테마 통합 & 반응형 CSS Grid `auto-fill` 인증서 카드 레이아웃**: Web 기본 테마를 WPF 다크 테마(`#0F1219`)로 통일하고 모달 대비 결함 완전 교정 및 카드/표 보기 전환 지원.
- **전역 UI 쉬운 일상 표현 우선 + 접이식 `더보기` 토글 개편**: 긴 설명을 1줄 핵심 요약으로 단축하고 `개인키`, `원본 위치/저장 위치`, `찾는 위치`, `파일 손상 검사(SHA-256)`로 용어 통일.
- **3차 심층 전수 감사 수정**: WPF `C:\` 드라이브 자가 복사 차단 보강 및 Web 폴더 선택 취소(`AbortError`)·stale closure 해소.

### 🚀 [v2.0.0] - 2026-11-10
- **60fps 무한 유동 애니메이션 테두리(Animated Moving Border Glow) 전면 탑재 (WPF & Web)**: 선택 드라이브 무지개 네온 발광, USB 에메랄드/청록, 로컬 블루 그라데이션 대각 루프 적용.
- **WPF 데스크톱 UI 대칭 완성 및 `/dist/v2.0.0/` 버전별 분리 빌드 파이프라인 확립**.

### 🚀 [v1.9.0] - 2026-11-06
- **암호화 보호 보관함 구축**: 복원 이력 매니페스트(`protected_restored_manifest.dat`)를 Windows DPAPI(CurrentUser) 및 AES-256 이중 암호화하여 타인의 무단 접근 차단.
- **제한된 USB 복구 (`💾 USB로 제한 복구`) 신설**: 로컬 PC 파일 오염 방지를 위해 외장 USB 메모리(`\NPKI`, `\GPKI`, `\EPKI`)로만 안전 복구 허용.
- **만료 인증서 정리창 (ExpiredCleanupDialog) 가로 너비 20% 대폭 확대**: 기존 820px에서 984px로 확장.
- **Inno Setup 정식 인스톨러 배포 최적화**: Unpacked Multi-File 설치, 기존 프로세스 종료, 방화벽 규칙 자동 등록 및 `/VERYSILENT` 무인 설치 완비.

### 🚀 [v1.8.0] - 2026-10-31
- **독립 C# 코어 & 암호화 DLL 2종 분리**: 3rd-party 의존성 0%의 `KCert.Core.dll` 및 `KCert.Crypto.dll` 모듈화.
- **상단 헤더 가로바 스크롤러·마우스 휠 연동 및 4대 테마 전역 고대비 툴팁 시스템 신설**.

### 🚀 [v1.7.2] - 2026-10-31
- **상단 헤더 가로 볼륨 슬라이더 바 탑재 및 ⚙️ 환경 설정 모달 · `SettingsDialog` 구축**.

### 🚀 [v1.7.1] - 2026-10-28
- **만료 인증서 정리 수량과 안전 휴지통 수량 1:1 동기화 및 GitHub Actions Node.js 24/22 전환**.

### 🚀 [v1.7.0] - 2026-10-27
- **성공 알림음(SuccessChime) 제어, 보안 삭제 증적 로그 감사 시스템 및 30px 컬럼 폭 자유 조절 도입**.

### 🚀 [v1.6.5] - 2026-10-25
- **최좌측 1번 인덱스(1, 2, 3...) 일원화 및 고정열(Frozen & Sticky Column) 보장**.

### 🚀 [v1.6.4] - 2026-10-25
- **작업완료 안내 전용 팝업창 신설 및 윈도우 창 제어 버튼 독립 고정**.

### 🚀 [v1.6.3] - 2026-10-21
- **상세 사이드바 닫힘 시 목록창 자동 확장 및 시작가이드 PC ➔ USB 전용 대화창 통일**.

### 🚀 [v1.6.2] - 2026-10-20
- **드라이브 쓰기 오류 및 권한 거부 전용 알림 모달 구축**.

### 🚀 [v1.6.1] - 2026-10-20
- **인증서 복사 완료 알림음(SuccessChime) 및 음량 제어 슬라이더 연동**.

### 🚀 [v1.5.0] - 2026-10-08
- **시작 작업 선택 마법사(PC➔USB, USB➔PC), 단계별 가이드 모션 및 SHA-256 파일 손상 검사 배지 탑재**.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,USB복사,인증서백업,K인증서매니저,인증서이동,공동인증서,KCertManager,CertificateManager,USBBackup,GPKICopy,NPKICopy**
*(태그 수: 15개 / 총 138자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*
