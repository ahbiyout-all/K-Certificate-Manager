# 📢 [구글 블로그 원고 - 작성 모드 (서식 있는 텍스트 / Compose Mode)]
# 프로젝트: K-Certificate Manager (K-인증서 매니저) v2.2.0

---

## 1. 제목 (Title)
**K-인증서 매니저 v2.2.0 정식 릴리스: 2026 국내 인증 동향·RSA 3072-bit 보안강도 점검, 시작 무응답 해소 3단계 초고속 스캔 및 전수 감사 안정화**

---

## 2. 본문 (Body)
대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(`C:\`)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v2.2.0** 정식 버전이 출시되었습니다.

이번 `v2.2.0` 정식 마이너(MINOR) 릴리스는 **2027년 2월 15일 시행 예정인 5대 공동인증기관 RSA 3072-bit 보안강도 상향 일정**과 **GPKI·EPKI 비액티브엑스(HTML5) 전환, 2026년 8월 28일 전자정부법 시행령 기반 모바일 신분증 8종 확대, 금융·민간 간편인증 비교 가이드**를 웹 콘솔과 C# WPF 데스크톱 앱 모두에 오프라인 분석 기능으로 전면 탑재했습니다. 또한 앱 시작 직후 멈춤 현상을 원천 해소하는 **3단계 비차단 시작 스캔 파이프라인**과 3차례 심층 전수 감사 수정까지 완료해 한층 쾌적하고 정확한 인증서 관리 경험을 제공합니다.

---

## 3. 업데이트 (Recent Updates)
- 🔐 **오프라인 X.509 RSA 3072-bit 보안강도 점검 & 진단 탭 신설 (`certParser`, `KCertParser`, `DiagnosticsRepairModal`, `DiagnosticsRepairDialog`)**:
  - 보유 중인 로컬 인증서의 공개키 비트 길이(RSA 1024/2048/3072/4096-bit, ECDSA)와 서명 알고리즘(SHA-1 / SHA-256)을 오프라인으로 즉시 분석해 **`3072-bit 권장`**, **`2048-bit 전환 대상`**, **`1024-bit·SHA-1 취약`** 3단계로 진단합니다.
  - 기존 2048-bit 인증서는 만료일까지 정상 사용 가능하며, 1024-bit·SHA-1 취약 인증서만 즉시 재발급 경고를 표시합니다. `진단 및 복구` 창 내 **`보안강도 점검 (3072-bit)`** 탭과 원클릭 점검 리포트 복사를 지원합니다.
- 📰 **2026 국내 인증서 법령 동향 & 7대 인증 체계 한눈에 비교 (`SecurityGuideModal`, `SecurityGuideDialog`, `RenewalGuidanceDialog`)**:
  - 상단 헤더 `[보안 수칙·동향]` 창에 **`2026 보안강도·법령 동향`**과 **`국내 인증서 전체 비교`** 탭을 추가해 로컬 파일 기반(GPKI·EPKI·MPKI·NPKI)과 클라우드/모바일 인증서(금융인증서 YesKey·민간 간편인증·모바일 신분증)의 차이, 보관 방법, 갱신 팁을 손쉽게 비교할 수 있습니다.
  - 기관별 갱신 안내 창에도 비액티브엑스 전환·3072-bit 적용 일정·이니텍(INITECH) 전환 안내가 함께 수록되었습니다.
- ⚡ **WPF 앱 시작 직후 `응답없음` 원천 해소 — 3단계 비차단 시작 스캔 (`FastScanPipeline`, `CertLocationScanner`, `MainViewModel`)**:
  - 앱 구동 직후 **`0단계 Local Fast-Pass`**(내 PC 표준 경로 0.05초 즉시 표시) ➔ **`1단계 Drive Fast-Pass`**(준비된 이동식 드라이브 병렬 스캔) ➔ **`2단계 Deep-Pass`**(비표준·심층 경로 백그라운드 스트리밍)로 분리하고, OS `DriveType` 기반 네트워크·광학 드라이브 차단 및 바운디드 드라이브 준비 검사(`IsDriveReadyBounded`)를 도입해 UI 멈춤 현상을 완벽히 해결했습니다.
- 🛡️ **개인 성명 오분류 교정 · 발급기관 정밀 매칭 & Web/WPF 심층 전수 감사 안정화 (작업 차수 191~193)**:
  - `김지원`, `이정원`, `김진실` 등 일반 개인 성명이 단일 음절(`원`, `실`, `부`, `청`, `처`) 매칭으로 `(기관용)`으로 오분류되던 파서 결함을 문맥 기반으로 교정했습니다.
  - `CertIntegrityDoctor` 동적 개인키 파일명 보고 및 GPKI/EPKI `cn=` 단일 RDN 표준 경로 정밀화, `RenewalGuidanceDialog`·`renewalStore` 발급기관(Issuer) 우선 매칭으로 NPKI 인증서 오분류를 차단했습니다.
  - WPF `DispatchSafeAsync`·`SafeGetFullPath`·`SearchLocationsDialog` Fast-Pass 유지, Web 비동기 클립보드 예외 처리·새로고침 시퀀스 가드·`targetDrive` 널 가드 및 기관 고객센터 번호 정합성을 완비했습니다.
- 🚀 **인앱 자동 다운로드·무인 셀프 설치 & `Class1` 기관 필터 계승 (`v2.1.x`)**:
  - 업데이트 창 `[확인 (자동 다운로드 · 설치)]` 원스톱 업데이트, 통합 다크 테마(`#0F1219`), CSS Grid `auto-fill` 카드 레이아웃, `Class1` 기관 배지·필터, DPAPI/AES-256 보호 보관함 및 60fps 유동 네온 테두리를 그대로 계승·제공합니다.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v2.2.0 3단계 초고속 스캔 & RSA 3072-bit 보안강도 점검]
- 상단 툴바: 🛡️ 보안 수칙·동향 | 🏥 진단·복구(보안강도 점검) | 💾 PC ➔ USB | 📥 USB ➔ PC | ✨ 업데이트 확인
- 목록 배지: RSA 3072-bit 권장(녹색) / 2048-bit 전환 대상(청색) / 1024-bit·SHA-1 취약(적색) & CLASS1 기관 배지
- 진단·복구 창: [보안강도 점검 (3072-bit)] 탭 · 등급별 필터 · 원클릭 리포트 복사 · 비표준 경로 정위치 복구
- 보안 수칙 창: [2026 보안강도·법령 동향] & [국내 인증서 전체 비교 (7대 체계)]
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- 💾 **공식 구글 블로그 다운로드 안내**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 및 자동 업데이트 안내**: `kcert-manager-v2.2.0-setup.exe` 파일을 실행하면 바탕화면 바로가기 생성 및 Windows 방화벽 규칙 자동 등록과 함께 설치되며, 이미 설치된 환경에서는 앱 시작 시 뜨는 업데이트 창에서 **`[확인 (자동 다운로드 · 설치)]`** 버튼만으로 자동 업데이트가 완료됩니다. *(기업용 무인 설치 옵션: `/VERYSILENT /NORESTART`)*

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v2.2.0` (Semantic Versioning 2.0.0 MINOR Release)
- **코어 라이브러리**: `KCert.Core.dll` v2.2.0 / `KCert.Crypto.dll` v2.2.0
- **릴리스 일자**: 2026년 11월 21일

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

### 🚀 [v2.2.0] - 2026-11-21
- **오프라인 X.509 RSA 3072-bit 보안강도 점검 & 진단 탭 신설**: Web/WPF 양쪽에서 1024/2048/3072/4096-bit, ECDSA, SHA-1 여부를 분석해 `3072-bit 권장` / `2048-bit 전환 대상` / `1024-bit·SHA-1 취약` 3단계 배지와 `보안강도 점검 (3072-bit)` 진단 탭 제공.
- **2026 국내 인증서 법령 동향 & 7대 인증 체계 비교 UI 통합**: `SecurityGuideModal`/`SecurityGuideDialog` 및 `RenewalGuidanceDialog`에 2027.02.15 RSA 3072-bit 전환, GPKI·EPKI 비액티브엑스, 2026.08.28 모바일 신분증 8종 동향 수록.
- **WPF 시작 무응답 해소 3단계 비차단 시작 스캔**: `0단계 Local Fast-Pass` ➔ `1단계 Drive Fast-Pass` ➔ `2단계 Deep-Pass` 분리, OS `DriveType` 필터, 병렬 바운디드 `IsDriveReadyBounded` 및 단일 `DrivesChanged` 디바운스 적용.
- **전수 감사 안정화(작업 차수 191~193)**: 개인 성명 `(기관용)` 오분류 교정, `CertIntegrityDoctor` 동적 키 파일명 & `cn=` 표준 경로 정밀화, 발급기관(Issuer) 우선 갱신 매칭, WPF `DispatchSafeAsync`·`SafeGetFullPath` 및 Web 비동기 클립보드·시퀀스·널 가드 완비.

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

### 🚀 [v1.7.2 ~ v1.5.0] - 2026-10-08 ~ 2026-10-31
- **상단 헤더 가로 볼륨 슬라이더 바 & `SettingsDialog`, 만료 정리-휴지통 1:1 동기화, 보안 삭제 증적 로그, 1-Based 고정 인덱스 열, 작업 완료 팝업, 드라이브 오류 모달, 시작 작업 선택 마법사 및 SHA-256 검증 배지 구축**.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,RSA3072,보안강도점검,모바일신분증,USB복사,인증서백업,K인증서매니저,공동인증서,KCertManager,USBBackup,GPKICopy**
*(태그 수: 15개 / 총 139자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*
