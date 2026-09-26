# K-인증서 매니저 패치노트 (Patch Notes)

본 문서는 **Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH)** 규격에 의거하여 소프트웨어 변경 내역과 릴리스 히스토리를 엄격히 관리합니다.

---

## 🏷️ 버전 관리 원칙 (Semantic Versioning Rules)

버전 번호는 **`MAJOR.MINOR.PATCH`** 형태(예: `1.2.0`)로 정의되며, 변경 규모에 따라 3단계로 명확히 분리하여 관리합니다:

1. **MAJOR (주 버전 상향: X.0.0)**
   - 기존 인증서 저장 구조 또는 백업 규격과의 하위 호환성이 깨지는 대규모 아키텍처 개편 시 증가합니다.
   - 예: 인증서 데이터베이스 구조의 전면 개편, 지원 OS 플랫폼의 근본적 전환 등.
2. **MINOR (부 버전 상향: x.Y.0)**
   - 기존 기능의 호환성을 유지하면서 새로운 핵심 기능이 추가되거나 대규모 기능 확장이 이루어질 때 증가합니다.
   - 예: 만료 인증서 및 타인 인증서 삭제 도구 추가, 인증서 휴지통 및 실행 취소(Undo) 시스템 도입 등.
   - MINOR 버전 증가 시 PATCH 번호는 0으로 초기화됩니다.
3. **PATCH (패치 버전 상향: x.y.Z)**
   - 기존 기능의 호환성을 유지하면서 버그 수정(Bugfix), UI/UX 디테일 개선, 성능 튜닝, 경미한 텍스트 수정 시 증가합니다.
   - 예: 만료일 카운트 표시 오차 수정, 툴팁 표시 스타일 개선, 드라이브 용량 표시 오류 수정 등.

> **💡 개발 수칙**: 코드 수정 시 특이점이나 기능 확장이 발생하면 본 패치노트에 기록하고 버전을 업데이트하며, 앱 화면(`src/version.ts`, 헤더/사이드바) 및 자동 빌드 스크립트(`build.bat`)의 버전 표기를 동시에 동기화해야 합니다.

---

## 📋 버전 릴리스 내역

### 🚀 [v1.4.2] - 2026-09-26
**변경 구분**: `PATCH` (모던 일체형 타이틀바 적용, 7대 보안 하드닝 패치, 한·영 2종 라이선스 정의, 친화적 한국어 에러 가이드, .NET 10 지원 및 4종 테마 시스템)

#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **C# WPF 모던 일체형 타이틀바 (`WindowChrome`) 적용 (`MainWindow.xaml`, `MainWindow.xaml.cs`, `App.xaml`)**
  - 상단 흰색 Windows 기본 제목 표시줄과 개발용 문구(`- C# WPF MVVM`)를 제거하고, 앱 내부 **`🛡️ K-인증서 매니저 v1.4.2` 상단 헤더 바를 창 타이틀바로 일체화**.
  - 헤더 우측 끝에 **최소화(`[ ─ ]`) · 최대화/복원(`[ □ ]`/`[ ❐ ]`) · 종료(`[ ✕ ]`, 마우스 오버 시 레드 강조)** 버튼 통합 배치.
  - 상단 헤더 빈 영역 마우스 드래그 창 이동, 더블클릭 최대화/복원, 창 테두리 리사이즈 및 Windows Aero Snap 완벽 지원.
  - 4가지 테마(다크 · 회색 · 화이트 · 베이지) 변경 시 상단 타이틀바부터 사이드바, 하단 상태 표시줄까지 전체 색상 완벽 연동.
- **전역 7대 보안 취약점 하드닝 패치 (Security Hardening)**
  - **인증서 복사 화이트리스트 및 Path Traversal 차단 (`CertTransferEngine.cs`, `backupService.ts`)**: `.der`, `.cer`, `.crt`, `.key`, `.pri`, `.pfx`, `.p12`, `.pem` 확장자만 복사를 허용하여 감염된 USB 내 악성 실행파일(`.exe`, `.bat`, `.dll` 등) 동반 복사를 원천 차단하고, `Path.GetFullPath` 정규화 검증으로 상위 디렉터리 이탈(`..\`) 공격 방어.
  - **외부 URL 실행 및 탐색기 인자 주입 방어 (`RenewalGuidanceDialog.xaml.cs`, `MainWindow.xaml.cs`, `AboutDialog.xaml.cs`, `CertificateDetailDialog.xaml.cs`)**: `Uri.TryCreate`로 오직 `https://` 및 `http://` 스킴만 브라우저 실행을 허용하고, `explorer.exe` 실행 시 `UseShellExecute = false` 및 `ArgumentList` 분리 적용.
  - **웹 기관 디렉터리 JSON 검증 강화 (`renewalStore.ts`)**: 외부 JSON 가져오기 시 위험 스킴(`javascript:`, `data:`, `vbscript:`, `file:`) 및 프로토타입 오염 키(`__proto__`, `constructor`, `prototype`) 유입 원천 차단.
  - **안전 휴지통 복원 경로 검증 (`SafetyTrashManager.cs`)**: 격리 폴더가 실제 `SafetyTrash` 내부에 위치하는지 검증하고, 복원 대상 경로가 드라이브 루트(`C:\`)나 Windows 시스템 폴더(`Windows`, `System32`)인 경우 복원 차단.
  - **대용량 위조 파일 DoS 방어 (`KCertParser.cs`, `certParser.ts`, `usbToPcService.ts`)**: 512KB 초과 비정상 파일 파싱 즉시 스킵 및 파일 스트림(`File.OpenRead`) 기반 SHA-256 해시 계산.
  - **로컬 웹 서버 네트워크 격리 (`run-web.cmd`)**: `--host 127.0.0.1` 루프백 전용 바인딩으로 공용/사내망 외부 기기 접근 차단.
  - **GitHub 업로드 보안 및 대용량 파일 차단 (`push_to_github.bat`, `.gitignore`)**: `release/`, `bin/`, `obj/` 빌드 산출물 Git 추적 제외(100MB 제한 오류 방지) 및 GitHub 공식 프라이버시 보호 이메일(`noreply`) 기본 적용.
- **한국어(`LICENSE_KR.txt`) 및 영어(`LICENSE_EN.txt`) 2종 라이선스 정의 체계 구축**
  - 한국어 전용(`LICENSE_KR.txt`), 영어 전용(`LICENSE_EN.txt`), 한·영 통합본(`LICENSE.txt`) 및 `docs/LICENSE.md` 완비.
  - Inno Setup(`installer.iss`) 설치 언어별 라이선스 자동 연동 및 앱 내 한·영 전환 뷰어 제공.
- **사용자 친화적 한국어 에러 메시지 및 해결 방법 안내 시스템 (`UserFriendlyError.cs`, `UserFriendlyMessageHelper.cs`, `userFriendlyError.ts`)**
  - 권한 부족, USB 미인식/쓰기 금지, 파일 사용 중(금융 보안 프로그램 점유), 인증서 손상 등의 예외를 알기 쉬운 한국어 설명과 단계별 해결 팁으로 변환 안내.
- **.NET 10.0 (`net10.0-windows`) 및 .NET 8.0 (`net8.0-windows`) 멀티 타깃 자동 감지 빌드 (`build.bat`, `build.ps1`)**
  - 시스템에 설치된 .NET SDK 버전을 자동 감지하여 `.NET 10` 또는 `.NET 8`로 최적 컴파일 수행.
  - USB 연결 시 작업을 방해하던 자동실행 팝업 마법사를 제거하고 조용한 백그라운드 인식 + 사용자 수동 실행 방식으로 개선.
- **파스텔 톤 모노크롬 및 4대 테마 시스템 (`src/data/themes.ts`, `src/index.css`, WPF 4-Theme)**
  - 웹(파스텔 화이트·파스텔 그레이·파스텔 블랙·클래식 블루) 및 WPF(다크·회색·화이트·베이지) 원클릭 테마 스위처 및 `localStorage` 영구 보존.
- **GitHub Actions CI/CD 클라우드 빌드 및 릴리스 배포 파이프라인 구축 (`.github/workflows/build.yml`, `push_to_github.bat`)**
  - 원격 푸시 시 Windows Server 러너에서 Web(Vite) 및 C# WPF 데스크톱 앱을 자동 컴파일하고 무결성을 검증.
  - `push_to_github.bat` 실행 시 `package.json` 버전을 동적 추출하여 Git 릴리스 태그(`v1.4.2`)를 자동 생성 및 푸시하며, GitHub Releases에 정식 배포 zip 파일을 자동 등록.
- **GitHub Releases 기반 실시간 자동 업데이트 감지 시스템 (`updateChecker.ts`, `UpdateModal.tsx`, `UpdateCheckerService.cs`, `docs/AUTO_UPDATE_GUIDE.md`)**
  - 앱 시작 시 및 헤더/사이드바의 [업데이트 확인] 클릭 시 GitHub 최신 릴리스 API를 비동기 조회하여 SemVer 기반 신규 버전 자동 감지.
  - 새 버전 출시 시 강조 배지 점등, 릴리스 노트 팝업 표시 및 원클릭 바이너리 다운로드 연동 지원.
- **문서 동기화**: `/docs` 내 전 문서 `v1.4.2` 최신 사양 반영 및 `AUTO_UPDATE_GUIDE.md` 신규 수록 완료.

---

### 🚀 [v1.4.1] - 2026-09-10
**변경 구분**: `PATCH` (Inno Setup 설치 시 폴더 풀림(Unpacked Multi-File) 구조 구현, 중복 및 불필요 파일 팩킹 원천 제거, 설치 패키지 슬림화)

#### ✨ 주요 개선 및 패키징 최적화 (Improvements & Packaging Optimization)
- **연결된 USB 드라이브 현황 기본 표시(Basic) 및 고급 표시(Advanced) 전환 기능 구현 (`CertificateList.tsx`)**
  - **사용자 맞춤형 2단 뷰 토글**: 드라이브 현황 상단에 `[📋 기본 표시]`와 `[⚙️ 고급 표시]` 세그먼트 버튼을 추가하여 필요에 따라 화면 정보 밀도를 즉시 전환.
  - **기본 표시 (Basic Mode)**: 복잡한 하드웨어 시리얼/WMI 코드를 가리고, 사용률/여유 공간을 시각화한 **슬림 게이지 바(Progress Bar)**와 원클릭 명확 액션(`컴퓨터로 복사` 또는 `이 드라이브로 백업`)만 간결히 제공하여 일반 사용자 가독성 극대화.
  - **고급 표시 (Advanced Mode)**: 하드웨어 고유 VSN 식별자 칩 및 **원클릭 클립보드 복사(Copy)**, 파일시스템(`FAT32`/`exFAT`/`NTFS`), 버스 규격(`USB`/`NVMe`), WMI 정밀 진단 연계, `컴퓨터로 복사` + `백업` **듀얼 액션 버튼** 배치.
  - **모드 기억(Persistence)**: `localStorage` 연동으로 사용자가 선택한 표시 모드를 영구 보존.
- **인스톨러 중복 팩킹(Duplicate Packing) 및 불필요 파일 유입 완전 제거 (`installer.iss`)**
  - **70MB 바이너리 중복 제거**: 기존에 `KCertManager_v1.4.1.exe`와 `KCertManager.exe`가 2벌 모두 패킹되어 140MB로 팽창되던 현상을 수정. 단일 정규 실행 파일(`KCertManager.exe`, 라이트버전 `KCertManager-Lite.exe`, 코어 `KCert.Core.dll`)만 1벌씩 정확히 지정하여 인스톨러 용량 50% 절감.
  - **무차별 와일드카드(`release\05_WpfDesktop\*`) 제거**: 폴더 내 중간 컴파일 산출물이나 중복 파일이 유입되지 않도록 정규 파일명만 선별 지정.
  - **런처 스크립트 단일화**: 레거시/중복 스크립트(`run.bat`, `start.bat`, `kcert-manager.bat`, `run-web.ps1` 등)를 배포에서 제외하고, 필수 런처(`kcert-manager.cmd`, `kcert-manager.vbs`, `run-web.cmd`) 3종만 정갈하게 패킹.
  - **개발 소스 파일 배포 제외**: `package.json`, 루트의 개발용 `index.html`, `metadata.json` 등 최종 사용자에게 불필요한 개발 환경 설정 파일을 배포 목록에서 완전히 제외.
  - **문서 매뉴얼 정제**: 내부 개발 일지(`WORK_LOG.md`)를 제외하고 필수 사용자 및 기술 매뉴얼(`USER_GUIDE.md`, `PATCHNOTES.md`, `VERSIONING_POLICY.md`, `KCERT_CORE_DLL_SPEC.md`, `BUILD_GUIDE.md`, `LICENSE.md`, `README.md`)만 `{app}\docs\`에 정갈하게 전개.
- **Inno Setup 폴더 풀림(Unpacked Multi-File) 구조 공식 구현**
  - 대상 디렉터리(`{autopf}\K-Certificate Manager`) 내에 단일 파일 압축 캡슐화가 아닌, 실행 파일, 스크립트, 웹 번들(`dist\`), 매뉴얼(`docs\`)이 원본 트리 그대로 개별 파일로 완전히 풀려 설치됨.
- **무설치 패키지 조립(`build.bat` Step 6) 동기화**
  - `release\06_UnpackedApp\` 생성 시에도 동일한 원칙을 적용하여 중복 실행 바이너리 및 불필요한 스크립트를 제외한 깨끗한 포터블 패키지 조립.
- **시작 메뉴 바로가기 및 [설치 폴더 열기] 지원**
  - `C# WPF 데스크톱 풀버전`, `C# WPF 경량 에디션`, `웹 버전 바로가기` 제공.
  - **`설치 폴더 열기 (Unpacked Multi-File)`**: `explorer.exe "{app}"` 바로가기를 등록하여 사용자가 설치된 개별 파일들을 윈도우 탐색기에서 즉시 확인 가능.
  - 설치 완료 마법사 옵션에 '설치 폴더 열기' 체크박스 추가.
- **완전 언인스톨 클린업 (`[UninstallDelete]`)**
  - 프로그램 삭제 시 전개된 모든 개별 파일과 폴더를 찌꺼기 없이 100% 완전 삭제.

---

### 🚀 [v1.4.0] - 2026-09-09
**변경 구분**: `MINOR` (실시간 USB 마운트 감지 & 지능형 복사 안내, 3회 자동 재시도, 인증서 드라이브 우선 정렬 및 데스크톱 양방향 통합)

#### ✨ 주요 신규 기능 (New Features)
- **실시간 이동식 USB 마운트 감지 및 지능형 프롬프트 시스템 (`UsbDetectedPromptModal.tsx`, `UsbDetectedBanner.tsx`)**
  - 새로운 이동식 드라이브(USB) 연결 시 하드웨어 이벤트를 감지하여 인증서 보유 여부를 600ms 이내에 자동 스캔.
  - 인증서(`NPKI`/`GPKI`/`EPKI`)가 발견된 경우, 즉시 화면 상단에 **[새로운 USB가 연결되었습니다: 컴퓨터로 인증서 복사하기]** 대화상자(Modal) 및 배너(Banner)를 띄워 사용자가 1클릭으로 복사 작업을 개시할 수 있도록 지원.
  - 동일한 USB에 대한 무한 팝업 방지를 위해 세션 기반 디바운스 및 "다시 보지 않기" 상태 저장 적용.
- **USB 쓰기/읽기 불안정 대비 최대 3회 자동 재시도 (Automatic 3-Step Retry Pipeline) 구현**
  - USB 연결 해제, 지연 락, 일시적 Windows I/O 오류 발생 시 즉시 실패 처리하지 않고 지수 백오프(Exponential Backoff: 500ms, 1000ms, 1500ms)를 적용하여 최대 3회 자동 재시도.
  - 각 재시도 회차 및 복구 성공 로그를 실시간 감사 로그(`activityLogger.ts`)에 자동 기록.
- **인증서 보유 USB 드라이브 상단 우선 정렬 (Priority Auto-Sorting) 및 시각적 추천 강조**
  - 복사 대상 또는 백업 대상 드라이브 목록에서 인증서가 발견된 드라이브를 최상단에 자동 배치(인증서 개수 내림차순 정렬).
  - 앰버/골드 하이라이트 테두리, 은은한 배경 그라데이션, `⭐ 인증서 N건 발견 (추천)` 뱃지 부여.
  - **[인증서 보유 드라이브만 (N개)]** 원클릭 필터링 토글 버튼을 추가하여 빈 드라이브를 가리고 목적 드라이브만 즉시 선별 가능.
- **데스크톱 대시보드 퀵 전송 카드 양방향 전환 지원 (`QuickTransferConfigCard.tsx`)**
  - `🖥️ PC ➔ 💾 USB 백업`과 `💾 USB ➔ 🖥️ 내 PC 복사` 모드를 대시보드 상단에서 탭 클릭 한 번으로 전환.
  - 모달을 열지 않고도 메인 화면의 각 드라이브 카드에서 **[📥 컴퓨터로 복사 (N건)]** 액션 버튼을 직접 호출 가능.
- **자동 빌드 스크립트(`build.bat`) 영문 표준화 및 산출물 버전 접미사 자동화**
  - Windows 배치 스크립트를 영문(English) 기반으로 전면 리팩토링 및 Windows 표준 CRLF(`\r\n`) 적용.
  - C# WPF 네이티브 실행 파일 및 인스톨러 이름 끝에 버전을 자동 부착하여 생성:
    - `KCertManager_v1.4.0.exe`
    - `KCertManager-Lite_v1.4.0.exe`
    - `kcert-manager-v1.4.0-setup.exe`
- **버전 관리 표준 정책 문서 신설 (`docs/VERSIONING_POLICY.md`)**
  - SemVer 3단계(MAJOR.MINOR.PATCH) 원칙, 버전 상향 시 필수 동기화 체크리스트(코드, UI, 인스톨러, 빌드 스크립트, 문서) 공식 규정 수립.

#### 🔧 UI & 동기화 개선 (Improvements)
- 전체 애플리케이션 버전 표기를 `v1.4.0`으로 갱신 (`package.json`, `src/version.ts`, `installer.iss`, `CoreSpecModal.tsx`, 사이드바).
- 공식 메타데이터 링크를 구글 블로그([ahbivibelog.blogspot.com](https://ahbivibelog.blogspot.com/)), 회사 홈페이지([www.cisnet.co.kr](http://www.cisnet.co.kr/)), 개발자([AhBiYout])로 일원화.

---

### 🚀 [v1.3.0] - 2026-09-04
**변경 구분**: `MINOR` (반대 경로: USB에서 PC로 인증서 넣기/가져오기 시스템 도입)

#### ✨ 주요 신규 기능 (New Features)
- **Inno Setup 폴더 풀림(Unpacked Multi-File) 설치 파이프라인 구현 (`installer.iss`)**
  - 설치 디렉터리(`C:\Program Files (x86)\K-Certificate Manager`)에 압축 해제된 다중 파일/폴더 전체 계층을 고스란히 전개하는 표준 Inno Setup 6/5 스크립트 작성.
  - `dist/` 웹 번들, `docs/` 가이드 문서, `kcert-manager.cmd` 및 `kcert-manager.vbs` 무음 런처 자동 구성.
  - 시작 메뉴 프로그램 그룹, 바탕화면 바로가기 및 완벽한 언인스톨(Uninstall) 루틴 지원.
  - `build.bat` 스크립트 내 `ISCC.exe` 자동 탐색 및 `kcert-manager-v1.3.0-setup.exe` 빌드 자동화 연동.
- **소프트웨어 라이선스 & 법적 고지 체계 완비 (`LICENSE.txt`, `docs/LICENSE.md`, `LicenseModal.tsx`)**
  - 저작권(AhBiYout), 영구 무상 이용 허가(Free/Permissive License), 오픈소스 라이브러리(React, Vite, Lucide, Tailwind, JSZip, Motion) 고지.
  - Inno Setup 인스톨러 라이선스 약관 페이지(`LicenseFile=LICENSE.txt`) 및 앱 내 전용 모달 연동.
- **앱 실시간 작업 및 감사 로그 시스템 구축 (`activityLogger.ts`, `AppActivityLogModal.tsx`)**
  - 디스크 스캔, USB 복사 백업, USB➔PC 역방향 가져오기, 삭제/휴지통, Undo 복구의 전 과정을 실시간 로깅 및 로컬 영속화.
  - 작업 로그 전용 뷰어, 카테고리/심각도 필터, `.log` 텍스트 파일 내보내기 제공.
- **USB ➔ 컴퓨터(PC) 반대 경로 인증서 복사/가져오기 시스템 (`usbToPcService`)**
  - 기존 PC ➔ USB 복사 방향 외에, 외부 USB 드라이브나 백업 매체에 저장된 인증서를 로컬 PC의 표준 인증서 보관함(`AppData\LocalLow`)으로 복원·가져오는 역방향 전송 파이프라인 구현.
  - 인증서 카테고리(NPKI, GPKI, EPKI)별 표준 계층 경로 자동 생성 및 매핑:
    - NPKI: `C:\Users\{Username}\AppData\LocalLow\NPKI\{CA}\USER\{Subject}`
    - GPKI: `C:\Users\{Username}\AppData\LocalLow\gpki\certificate\class{n}\...`
    - EPKI: `C:\Users\{Username}\AppData\LocalLow\epki\...`
- **다양한 외부 매체 탐색 모드 제공 (`UsbToPcModal`)**
  - **드라이브 스캔**: 연결된 이동식 USB 디스크 내 `NPKI`/`GPKI`/`EPKI` 폴더 자동 탐색.
  - **직접 폴더 선택 (Browser File System Access API)**: 사용자가 USB 내 특정 폴더를 직접 선택하여 즉시 파싱.
  - **백업 ZIP 파일 업로드**: USB에 압축된 `.zip` 인증서 백업 파일 업로드 및 클라이언트 사이드 파싱(`jszip`).
- **충돌 방지 및 대상 PC 계정 설정**
  - 대상 Windows 사용자 계정명(`Admin`, 사용자 지정 등) 입력 및 경로 자동 계산.
  - 이미 PC에 존재하는 인증서와 비교하여 중복 시 덮어쓰기(Overwrite) 여부 옵션 제어.
  - 전송 진행률 및 단계별 상세 파일 로그 제공.

#### 🔧 UI 반영 및 바로가기 동기화
- 상단 퀵 전송 설정 영역에 **[반대 경로 복사 지원: USB ➔ 컴퓨터]** 안내 배너 및 바로가기 버튼 추가.
- 상단 헤더, 좌측 사이드바 내비게이션, 인증서 목록 툴바, 하단 메인 액션 바에 **[USB ➔ PC 넣기]** 원클릭 실행 버튼 배치.
- 전체 애플리케이션 버전 표기를 `v1.3.0`으로 갱신.
- Windows 자동 빌드 스크립트(`build.bat`) 산출물 버전 연동(`kcert-manager-v1.3.0.exe`).

---

### 📦 [v1.2.0] - 2026-09-04
**변경 구분**: `MINOR` (신규 핵심 시스템 및 문서 체계 도입)

#### ✨ 주요 신규 기능 (New Features)
- **인증서 휴지통 (Recycle Bin) 시스템 구축**
  - 삭제된 인증서가 완전히 지워지기 전, 안전하게 임시 보관되는 휴지통 모달(`TrashModal`) 구현.
  - 삭제 일시, 삭제 사유, 원본 경로 메타데이터를 함께 보존.
  - 개별 복원, 선택 복원, 전체 일괄 복원 및 선택 영구 삭제, 휴지통 비우기 지원.
  - 브라우저 로컬 저장소(`localStorage`)와 연동하여 세션 간 임시 보관 데이터 보존.
- **삭제 즉시 실행 취소 (Undo Toast) 기능**
  - 인증서 삭제 직후 우측 상단 토스트 알림에 **[실행 취소]** 액션 버튼을 즉시 제공하여 원클릭 복구 가능.
- **문서화 및 개발자 정보 체계화**
  - `/docs` 디렉터리 내 공식 가이드라인(`README.md`, `PATCHNOTES.md`, `USER_GUIDE.md`, `BUILD_GUIDE.md`) 구축.
  - Windows 자동 빌드 스크립트(`build.bat`) 제작 및 버전 자동 연동.
  - 개발자(`AhBiYout`), 구글 블로그([ahbivibelog.blogspot.com](https://ahbivibelog.blogspot.com/)), 회사 홈페이지([www.cisnet.co.kr](http://www.cisnet.co.kr/)) 정보 공식 등록.

#### 🔧 개선 및 UI 반영 (Improvements)
- 사이드바, 헤더, 인증서 목록 툴바에 실시간 휴지통 항목 수 배지 및 바로가기 연동.
- 앱 좌측 사이드바 하단에 버전(`v1.2.0`) 및 개발자/회사/블로그 공식 링크 뱃지 추가.

---

### 📦 [v1.1.0] - 2026-09-03
**변경 구분**: `MINOR` (인증서 정리 및 삭제 기능 추가)

#### ✨ 주요 신규 기능 (New Features)
- **만료된 인증서 일괄 정리 기능**
  - 유효기간이 지난 인증서(Expired)를 자동 선별하여 일괄 삭제할 수 있는 전용 모달 제공.
- **다른 사용자 인증서 분리 정리 기능**
  - 공용 PC 또는 행정 단말기에서 타인의 인증서 파일(NPKI/GPKI 사용자 폴더)을 선택하여 정리할 수 있는 기능 추가.
- **개별 및 선택 항목 일괄 삭제 기능**
  - 인증서 목록 행 단위 개별 삭제 및 다중 체크박스 선택 삭제 도구 추가.

#### 🛡️ 안전 장치 (Safety)
- 무단 삭제 방지를 위한 최종 확인 체크박스 메커니즘 적용.

---

### 🌟 [v1.0.0] - 2026-09-02
**변경 구분**: `MAJOR` (최초 정식 릴리스)

#### ✨ 초기 핵심 기능 (Initial Release)
- **GPKI/EPKI/NPKI 표준 디렉터리 자동 탐색 엔진**
  - Windows 프로필 및 디스크 내 인증서 쌍(`signCert.der`, `signPri.key`) 무결성 탐색.
- **이동식 디스크(USB) 백업 매니저**
  - 드라이브 탐색, 용량 확인, 폴더 자동 생성 및 원클릭 일괄/선택 복사.
- **ZIP 압축 내보내기 & SHA-256 검증**
  - JSZip 기반 패키징 및 백업 히스토리 로깅.
- **공공기관 보안 수칙 및 가이드라인 모달 제공**.

---

## 👤 프로젝트 메타데이터
- **Developer**: AhBiYout
- **Company**: CISNet ([http://www.cisnet.co.kr/](http://www.cisnet.co.kr/))
- **Google Blog**: [https://ahbivibelog.blogspot.com/](https://ahbivibelog.blogspot.com/)
