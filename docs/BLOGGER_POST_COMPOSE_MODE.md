# 📢 [구글 블로그 원고 - 작성 모드 (서식 있는 텍스트 / Compose Mode)]
# 프로젝트: K-Certificate Manager (K-인증서 매니저) v2.1.0

---

## 1. 제목 (Title)
**K-인증서 매니저 v2.1.0 정식 릴리스: GitHub 이동 없는 앱 내 자동 다운로드·무인 셀프 설치, 반응형 카드 그리드 & 다크 테마 통합, 쉬운 일상 표현 UI 개편**

---

## 2. 본문 (Body)
대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(`C:\`)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v2.1.0** 정식 버전이 출시되었습니다.

이번 `v2.1.0` 릴리스는 별도 브라우저로 GitHub 웹사이트에 이동해 설치 파일을 직접 찾던 번거로움을 없애고, **업데이트 안내 창에서 `[확인 (자동 다운로드 · 설치)]`만 누르면 앱 내부에서 설치 패키지를 내려받아 무인 셀프 설치 및 자동 재실행까지 한 번에 완료**되도록 대폭 개선되었습니다. 또한 C# WPF 데스크톱의 눈이 편안한 다크 테마(`#0F1219`)를 Web 관리 콘솔에도 기본 적용하고, 화면 너비에 따라 카드가 자동 리플로우(Reflow)되는 **CSS Grid `auto-fill` 반응형 인증서 카드 목록**과 **쉬운 일상 표현 우선 + `더보기` 접이식 안내 UI**로 누구나 직관적으로 인증서를 관리할 수 있습니다.

---

## 3. 업데이트 (Recent Updates)
- 🚀 **GitHub 이동 없는 앱 내 자동 다운로드 · 무인 셀프 설치 엔진 탑재 (WPF & Web)**:
  - **C# WPF 데스크톱**: 시작 시 또는 수동 확인 시 뜨는 업데이트 창에서 `[확인 (자동 다운로드 · 설치)]` 클릭 시 브라우저 이동 없이 `kcert-manager-v*-setup.exe`를 직접 스트리밍 다운로드(진행률·MB 실시간 표시), PE 실행 파일(`MZ`/`PK`) 검증 후 숨김 스크립트(`apply_self_update.ps1`)로 무인 업데이트(`/SILENT /SUPPRESSMSGBOXES /NORESTART /CLOSEAPPLICATIONS`) 및 자동 재실행까지 원스톱 처리.
  - **Web 관리 콘솔**: 외부 링크 이동 없이 앱 내부 3단계(스트림 다운로드 ➔ 파일 손상 검사(SHA-256) ➔ 오프라인 캐시 갱신)로 즉시 최신 버전 반영.
- 🎨 **WPF-Web 다크 테마 통합 & 반응형 CSS Grid `auto-fill` 인증서 카드 레이아웃 적용**:
  - Web 콘솔 기본 테마를 WPF 다크 테마(`#0F1219` 캔버스 / `#1A1F2C` 카드)로 통일하고, 다크·파스텔 블랙 테마에서 모달 배경·그라데이션·파스텔 배지가 밝게 깨지던 대비 결함을 완전 교정.
  - 인증서 목록(`CertificateList`)에 화면 폭에 맞춰 1열~3열 이상으로 자동 리플로우되는 CSS Grid `repeat(auto-fill, minmax(300px, 1fr))` 반응형 카드 뷰를 기본 탑재하고, 기존 `표 보기`와 원클릭 전환 지원.
- 💬 **전역 UI 쉬운 일상 표현 우선 + 접이식 `더보기` UI 개편 (Web & WPF)**:
  - 긴 경로 설명·FAQ·복사 후 가이드를 1줄 핵심 요약 + 기본 접힘 토글(`더보기` / WPF `Expander`)로 정리해 첫 화면 집중도 극대화.
  - `비밀키`→`개인키`, `출발지/도착지`→`원본 위치/저장 위치`, `탐색 경로`→`찾는 위치`, `무결성/자가진단`→`파일 손상 검사(SHA-256) / 보안 점검` 등 쉬운 표현으로 전면 통일(필요시 전문 용어 병기).
- 🛡️ **3차 심층 전수 감사(Deep Audit) 결함 일괄 수정**:
  - **WPF `C:\` 드라이브 자가 복사 차단 보강**: `C:\Users\...\AppData\LocalLow\NPKI` 인증서를 `C:`로 재복사하려 할 때 실제 저장 경로 기준으로 동일 드라이브 자가 복사를 정밀 차단.
  - **Web 비동기 상태·취소 예외 안정화**: 폴더 선택기 사용자 취소(`AbortError`) 시 불필요한 3회 재시도 제거 및 최신 상태(Ref) 기반 목록 새로고침(`F5`)·경로 토글 일관성 보강.
- 🔒 **암호화 보호 보관함(DPAPI / AES-256) & 60fps 유동 애니메이션 테두리 완비 (`v1.9.0 ~ v2.0.0`)**:
  - 복원 매니페스트(`protected_restored_manifest.dat`) 이중 암호화 보호, 이동식 USB 전용 안전 복구(`💾 USB로 제한 복구`), 984px 광폭 만료 정리창, 60fps 무한 유동 네온 테두리(`WpfAnimatedBorderHelper`) 기본 탑재.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v2.1.0 통합 다크 인터페이스 & 인앱 자동 업데이트]
- 상단 툴바: 🔊 볼륨 슬라이더 | ⚙️ 환경 설정 | 💾 PC ➔ USB | 📥 USB ➔ PC | ✨ 업데이트 확인
- 업데이트 창: [확인 (자동 다운로드 · 설치)] ➔ 다운로드 진행률 ➔ 무결성 검증 ➔ 무인 셀프 설치·재실행
- 중앙 목록(Web/WPF): 반응형 CSS Grid(auto-fill) 인증서 카드 뷰 ↔ 고정 인덱스 표 보기(1-Based)
- 하단 / 보관함: 유동 네온 테두리 드라이브 상태바 · 암호화 보호 보관함(DPAPI/AES-256) · 접이식 더보기
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- 💾 **공식 구글 블로그 다운로드 안내**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 및 자동 업데이트 안내**: `kcert-manager-v2.1.0-setup.exe` 파일을 실행하면 바탕화면 바로가기 생성 및 Windows 방화벽 규칙 자동 등록과 함께 설치되며, 이미 설치된 환경에서는 앱 시작 시 뜨는 업데이트 창에서 **`[확인 (자동 다운로드 · 설치)]`** 버튼만으로 자동 업데이트가 완료됩니다. *(기업용 무인 설치 옵션: `/VERYSILENT /NORESTART`)*

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v2.1.0` (Semantic Versioning 2.0.0 준수)
- **코어 라이브러리**: `KCert.Core.dll` v2.1.0 / `KCert.Crypto.dll` v2.1.0
- **릴리스 일자**: 2026년 11월 13일

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
