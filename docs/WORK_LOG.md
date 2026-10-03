# K-인증서 매니저 작업 로그 (Work Log)

본 문서는 K-인증서 매니저(K-Certificate Manager)의 개발, 기능 구현, 버그 수정, 빌드 환경 구성 및 문서화 작업을 상세히 기록하는 공식 작업 일지입니다.

---

## 📌 프로젝트 기본 정보

- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **현재 버전**: `v1.4.5` (Semantic Versioning 2.0.0)
- **개발자**: AhBiYout
- **구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **공식 홈페이지**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/) (CISNet)
- **대상 환경**: Windows 10/11, Web/Electron 기반 환경, CRLF 빌드 스크립트

---

## 📅 작업 기록 상세 내역

### 📝 [작업 차수 59] WPF 다크 테마 시작 직후 글자 흑색(미표시) 렌더링 결함 3중 안전 완전 해결 (v1.4.5)
- **작업 일시**: 2026-10-03 14:15 KST
- **요청 사항**:
  1. `첫번째 이미지가 바로 시작 할때 이미지 이고 2번째 이미지가 다른 테마를 선택했다가 다시 다크 테마로 돌아 왔을때 인데, 글자가 어두운 흑색(보이지 않음)에서 회색으로 바뀝니다.`
  2. `docs폴더 문서를 업데이트 하세요.`
- **원인 분석**:
  - `App.xaml` 정적 리소스 팔레트에 `AccentTextBrush` 및 `MutedTextBrush` 정의가 누락되어 있었음.
  - 프로그램 초기 실행 시 `ApplyTheme("dark")`가 명시적으로 즉각 호출되지 않아, WPF 엔진이 해당 브러시를 찾지 못하고 Windows OS 기본 텍스트 색상인 검은색(`#000000`)으로 폴백 렌더링하여 어두운 배경에 텍스트가 묻혀 보이지 않음.
  - 사용자가 다른 테마를 선택했다가 다시 다크 테마를 누르면 비로소 C# 이벤트 핸들러가 `ApplyTheme("dark")`를 호출하면서 해당 브러시들을 동적으로 생성하여 회색/하늘색으로 보이게 되었던 문제.
- **수행 내용**:
  1. **`App.xaml` 정적 리소스에 브러시 및 색상 영구 선언**:
     - `AccentText` (`#60A5FA`), `MutedText` (`#94A3B8`) 및 `AccentTextBrush`, `MutedTextBrush`를 직접 선언하여 XAML 파싱 첫 순간부터 100% 준비.
  2. **`MainViewModel.cs` 생성자 즉시 테마 바인딩**:
     - `public MainViewModel()` 진입 시 `ApplyTheme(_currentTheme);`를 즉각 실행.
  3. **`App.xaml.cs` 및 `MainWindow.xaml.cs` 윈도우 초기화 전 테마 사전 적용**:
     - 창 렌더링 직전(`InitializeComponent()` 호출 전)에 테마를 완벽히 활성화하여 시작 시 글자 색상 지연이나 깜빡임 없이 선명하게 표시.
  4. **공식 문서 최신화**:
     - `docs/PATCHNOTES.md`, `docs/WORK_LOG.md`, `docs/AUTO_UPDATE_GUIDE.md`, `docs/WPF_NATIVE_GUIDE.md` 동기화.

### 📝 [작업 차수 58] 데스크톱 앱(C# WPF) 시작 시 백그라운드 자동 업데이트 확인 파이프라인 및 SemVer 2.0.0 검증 (v1.4.5)
- **작업 일시**: 2026-10-03 11:20 KST
- **요청 사항**:
  1. `앱 시작시에 자동으로 업데이트 확인 후 다음 동작으로 무엇을 하나요.`
  2. `[1단계] 백그라운드 업데이트 비동기 확인 -- 다시 점검 해주세요.`
  3. `데스크톱 앱(C# WPF)은 "시작 시 자동 조회 하도록 해주세요."`
  4. `Semantic Versioning 2.0.0 규칙에 맞게 진행되고 있나요`
- **수행 내용**:
  1. **데스크톱 앱(C# WPF) 시작 시 백그라운드 자동 업데이트 확인 파이프라인 구축**:
     - `MainViewModel.cs`의 비동기 백그라운드 초기화 태스크(`Task.Run`)에서 UI 렌더링 완료 1.2초 후 `CheckForAppUpdatesAsync(isSilentWhenUpToDate: true)`를 안전하게 자동 실행.
     - **새 버전 발견 시**: 즉시 업데이트 안내 및 다운로드 링크 확인 다이얼로그 팝업.
     - **최신 버전이거나 오프라인/폐쇄망일 때**: 업무 방해를 막기 위해 에러/확인 창 없이 하단 상태바에 조용히 `"준비 완료 (최신 버전 확인됨)"`으로 상태만 점등 (침묵 모드).
     - **수동 버튼 클릭 시**: 사용자가 명시적으로 눌렀을 때만 "현재 최신 버전입니다" 확인 창 출력.
  2. **Semantic Versioning 2.0.0 (SemVer 2.0.0) 명세 100% 완전 준수 체계화**:
     - `MAJOR(1) . MINOR(4) . PATCH(5)` 3단위 정량 규칙 확립.
     - `src/utils/updateChecker.ts`와 `UpdateCheckerService.cs`의 프리릴리스 비교 알고리즘 검증.
     - `package.json`, `.csproj`, `version.ts`, 배포 배치 스크립트 전역 버전 동기화 확인.

### 📝 [작업 차수 57] 일반 사용자 인지 과부하 해소를 위한 화면 단순화(간편 모드 / 상세 모드 듀얼 UX) 및 구글 블로그 공식 배포 (v1.4.5)
- **작업 일시**: 2026-10-03 09:30 KST
- **요청 사항**:
  1. `구글블로그에 사용할 최신 내용을 '제목-본문-업데이트-앱 그림-다운로드-버전정보-시스템 요구 사항-제작자 및 공식 채널 안내-전체 업데이트-추천 태그' 순서로 생성.`
  2. `[전체 업데이트] 에는 모든 계발 내용을 넣어 주세요. (v1.0.0 ~ v1.4.5 누락 없이 복원)`
  3. `위 블로그에 올릴 내용도 문서로 만들어서 다음 업데이트에 자료로 사용합니다. (docs/BLOG_v1.4.5.md)`
  4. `일반 사용자에게 화면이 너무 어지럽지 않을까 생각듭니다.`
  5. `데스크 탑 앱에도 적용된것인가요`
- **수행 내용**:
  1. **구글 블로그 공식 홍보 문서 작성 및 보존 (`docs/BLOG_v1.4.5.md`)**:
     - v1.0.0 최초 출시부터 v1.4.5에 이르는 전 개발 역사를 일목요연하게 복원 정리하여 영구 보존.
  2. **일반 사용자 친화적 [간편 모드] vs [상세 모드] 듀얼 UX 개편**:
     - **React 웹 에디션**: 상단에 복잡하던 원본/목적지 설정 패널과 중복 드라이브 목록을 제거하고, `SimpleTransferHero` 원클릭 직관 대시보드를 기본 배치.
     - **WPF 데스크톱**:
       - `[간편 모드]` 기본 활성화 시, 상단에 거대하게 자리잡고 있던 하드웨어 진단 카드들을 깔끔한 **1줄 원클릭 액션 바**(`⚡ 간편 백업: 대상 드라이브 [💾 USB] | [⚡ 원클릭 전체 복사] | [📥 USB ➔ PC 넣기]`)로 압축하여 인증서 목록(DataGrid)을 탁 트이게 노출.
       - 헤더에서 6대 부가 도구(탐색 경로, 백업 이력, 작업 로그, 보안 수칙, 업데이트 확인, 정보)를 숨겨 인지 부하 차단.
       - `[상세 모드]` 선택 시 NVMe/SATA/USB 포트, 파티션 라벨, 모델명 및 6대 고급 도구 버튼 활성화.

### 📝 [작업 차수 56] WPF 보관함 목록 양방향 정렬, 모든 팝업 다이얼로그 동적 테마 연동 및 배치 파일 CRLF 튜닝 (v1.4.5)
- **작업 일시**: 2026-09-30 23:40 KST
- **요청 사항**:
  1. `인증서 보관함 목록에 정렬 기능을 넣어주세요.`
  2. `다크이외에 글이 보이지 않음. 다른 팝업창도 테마적용을 할 수 있을까요, 팝업창 모두 다크 테마로만 되어 있어요.`
  3. `push_to_github.bat 가 unix로 저장되서 오류나는거 같아요.`
  4. `docs폴더 문서를 업데이트 합니다.`
- **수행 내용**:
  1. **인증서 보관함 목록 양방향 정렬 기능 탑재 (WPF & Web)**:
     - **WPF 데스크톱**: 메인 화면 `DataGrid`의 컬럼 헤더 클릭 시 구분(분류), 저장 위치, 인증서 명칭(CN), 발급기관, 만료일자, 상태 등의 전체 항목이 오름차순/내림차순으로 원활하게 정렬되도록 MVVM 연동형 커스텀 정렬 메커니즘 전면 가동.
     - **React 웹 에디션**: 테이블 헤더 컬럼에 정렬 아이콘 배치 및 `handleSort` 함수 바인딩으로 정합성 확보.
  2. **WPF 모든 팝업 다이얼로그 동적 테마 완벽 연동**:
     - `AboutDialog`, `ActivityLogDialog`, `BackupHistoryDialog`, `CertificateDetailDialog`, `ExpiredCleanupDialog`, `RenewalGuidanceDialog`, `SearchLocationsDialog`, `SecurityGuideDialog`, `TrashDialog`, `UsbTransferDialog` 등 사내 보조창 전체의 하드코딩 색상을 전수 축출하고 `{DynamicResource}` 브러시로 전면 튜닝.
     - 화이트, 그레이, 베이지 테마 적용 시 팝업 내용이나 데이터 표 내부 텍스트가 뭉개지거나 안 보이는 가시성 버그를 100% 전수 해결.
     - 만료 정리창 등 코드-비하인드에서 텍스트 색상을 제어하던 컴포넌트에 런타임 어둡기 분석기(`IsCurrentThemeDark`)를 장착하여, 밝은 테마일 때도 고대비(고대비 에메랄드/앰버/로즈 색상) 전경색이 완벽 유지되도록 보완.
  3. **배치 스크립트 파일 CRLF 개행 인코딩 일괄 교정**:
     - Windows `cmd.exe`에서 행 오프셋 어긋남 문법 에러가 발생하는 것을 방지하기 위해 `push_to_github.bat`, `build.bat`, `run-web.cmd` 파일을 Windows 표준 CRLF(`\r\n`) 방식으로 완전 인코딩 개체 정돈 완료.
  4. **공식 문서 최신화**:
     - `docs/PATCHNOTES.md` 및 `docs/WORK_LOG.md`에 최신 변경 내역을 누락 없이 업데이트.

### 📝 [작업 차수 55] 패치노트 및 package.json 기반 자동 동적 갱신 파이프라인 구축, WPF 상태바 동적 바인딩 및 복사 목적지 팝업 모달 탑재 (v1.4.5)
- **작업 일시**: 2026-09-30 18:10 KST
- **요청 사항**:
  1. `선택/전체 일괄 복사시에 대상 디스크를 지정하는 팝업창을 띄우도록 합니다.`
  2. `kcert-manager-v1.4.5-setup.exe 설치하고 실행하니 구버전으로 인식함.`
  3. `'APP_VER=1.4.5' 이 정보는 패치노트를 기준으로 자동으로 갱신되나요?`
  4. `'패치노트 및 package.json 기반 자동 동적 갱신 적용'을 위 파일에 추가해서 내용을 갱신 해주세요.`
- **수행 내용**:
  1. **패치노트 및 package.json 기반 3단계 자동 동적 버전 갱신 파이프라인 전면 구축 (`push_to_github.bat`, `push_to_github.ps1`, `build.bat`, `.github/workflows/build.yml`)**:
     - 기존 `push_to_github.bat` 및 `build.bat`에 남아있던 고정 버전(`APP_VER=1.4.x`) 하드코딩을 완전히 제거.
     - **1차 (기계 표준 규격)**: Node.js 및 PowerShell을 통해 `package.json`의 `"version"` 필드를 동적으로 자동 추출.
     - **2차 (패치노트 직결 연동)**: Node 환경이 아니거나 누락된 경우에도 `docs/PATCHNOTES.md` 상단 최신 릴리스 헤더(`### 🚀 [vX.X.X]`)를 정규식으로 직접 추출하여 `%APP_VER%`에 자동 할당.
     - **3차 (완전 자동 동기화)**: 창 제목, 커밋 메시지, Git 태그, 인스톨러 컴파일 옵션까지 100% 동적으로 일괄 적용.
  2. **복사 목적지 디스크 지정 전용 팝업 모달 신규 개발 (`TargetDrivePickerModal.tsx`, `App.tsx`)**:
     - "전체 일괄 백업", "인증서 복사 시작", "개별 복사" 버튼 클릭 시 복사를 진행할 이동식 USB 및 물리 디스크를 직관적으로 먼저 선택할 수 있는 전용 팝업 모달 제공.
     - 물리 디스크만 안전하게 필터링하여 카드 형태로 제공하며, 선택 즉시 시각적 액티브 반응 및 `⚡ [E: SanDisk]로 복사 시작` 원클릭 연결.
     - USB 미연결 시 `💡 이동식 USB 메모리가 연결되지 않았습니다` 안내 배너 출력 및 자가 복사(Self-Copy) 드라이브 선택 사전 차단.
  3. **C# WPF 상태표시줄 버전 동적 바인딩 및 XAML 하드코딩 제거 (`MainWindow.xaml`, `MainViewModel.cs`, `AboutDialog.xaml.cs`)**:
     - `MainWindow.xaml` 상태바 좌측의 `Text="v1.4.3"` 하드코딩을 제거하고, 뷰모델의 `AppVersion` 속성(`Text="{Binding AppVersion, FallbackValue='v1.4.5'}"`)과 100% 동적 연동.
     - 최신 인스톨러(`kcert-manager-v1.4.5-setup.exe`) 설치 후 좌측 하단에 `v1.4.3` 구버전으로 오인식되던 문제를 완벽하게 해결.
  4. **GitHub Actions 빌드 스크립트 CRLF 버그 픽스 및 루트 파일 정돈**:
     - PowerShell `Out-File`로 인해 `$env:GITHUB_ENV`에 주입되던 `\r\n`(CRLF) 개행 문제를 `[System.IO.File]::AppendAllText`로 원천 차단하여 `invalid path 'CRLF:'` 에러 완전 제거.
     - 소스 루트에 우발적으로 생성되었던 0바이트 `CRLF:` 파일 제거.
  5. **문서 및 리드미 최신화**:
     - `README.md`, `docs/PATCHNOTES.md`, `docs/BUILD_GUIDE.md`, `docs/USER_GUIDE.md`, `docs/WPF_NATIVE_GUIDE.md` 전 파일의 버전 및 기술 내역을 `v1.4.5`로 100% 동기화 완료.

---

### 📝 [작업 차수 54] 전 테마 글자 시인성·고대비 개편, 자가 복사 금지 및 파일 충돌 해결 옵션 UI 반영 (v1.4.5)
- **작업 일시**: 2026-09-30 17:15 KST
- **요청 사항**:
  1. `각 테마에서 글자가 주변색과 비슷해서 [어둡거나, 밝아서] 사용자 시안성이 떨어지는 곳이 많음.`
  2. `같은 디스크 나 usb에 있는 인증서는 스스로 자신에게 복사 금지.`
  3. `BackupModal.tsx 파일에 파일 덮어쓰기 여부를 결정하는 '파일 충돌 해결 옵션(건너뛰기, 덮어쓰기, 이름 변경)' UI를 추가하여 사용자가 복사 충돌 시나리오를 직접 선택할 수 있도록 개선하세요.`
  4. `문서들을 업데이트 하세요.`
- **수행 내용**:
  1. **전 테마(다크, 회색, 화이트, 베이지) 글자 시인성 및 고대비(WCAG AA/AAA) 전면 개편 (`src/index.css`)**:
     - **다크/파스텔블랙 테마**: 배지/알림 상자 내 어두운 글자색(`text-blue-900`, `text-amber-900`, `text-rose-900` 등)이 검은 톤으로 남던 문제 해결. 밝은 형광 톤(#bfdbfe, #fef08a, #fecdd3, #a7f3d0)으로 자동 치환되도록 오버라이드 오케스트레이션.
     - **회색/화이트/베이지 테마**:
       - 본문 및 카드 내부 부제목/설명문 텍스트를 고대비 슬레이트/차콜 톤(#0f172a, #1e293b, #334155, #1c1917)으로 조정하여 주변 배경과 명확히 구분.
       - 사이드바(#app-sidebar) 및 어두운 모달 헤더(`bg-slate-900`) 영역의 내부 서브 텍스트가 일반 오버라이드 스타일로 인해 어두워지던 현상을 범위 보호(Scope Protection) CSS 규칙으로 전면 보정.
  2. **동일 디스크 및 USB 내 자가 복사(Self-Copy) 금지 규칙 구현 (`driveFilter.ts`, `BackupModal.tsx`, `backupService.ts`, `CertTransferEngine.cs`)**:
     - **자가 복사 사전 점검 함수 (`isSameDriveSelfCopy`)**: 선택한 인증서가 이미 복사 목적지 드라이브(예: E: USB ➔ E: USB)에 위치하는 경우 이를 즉시 판별.
     - **인터랙티브 경고 및 버튼 제어**:
       - 선택 항목 전체가 대상 드라이브에 있는 경우 `🛑 동일 디스크 자가 복사 금지` 경고 배너를 표시하고 [복사 시작] 버튼을 자동 비활성화.
       - 일부 항목만 대상 드라이브에 있는 경우 해당 항목을 자가 복사 제외 항목(`자가 복사 제외 N건`)으로 분리 및 로그 출력.
       - C# WPF 엔진(`CertTransferEngine.cs`)에도 동일 디스크 복사 차단 검증을 추가하여 원본 인증서 무의미한 덮어쓰기 방지.
  3. **복사/백업 모달 내 파일 충돌 해결 옵션 UI 추가 (`BackupModal.tsx`)**:
     - **스마트 덮어쓰기 (overwrite)**, **이름 변경 보존 (archive_old)**, **건너뛰기 (skip)** 3가지 선택 카드를 제공하여 사용자가 직접 충돌 처리 방침을 선택 가능.
  4. **문서 및 버전 현행화**:
     - `src/version.ts`, `docs/PATCHNOTES.md`, `docs/WORK_LOG.md` 버전을 `v1.4.5`로 업데이트 완료.

---

### 📝 [작업 차수 53] 상태 '유효함'/'만료됨' 명확한 색상 구분 및 시디롬·가상디스크·클라우드 드라이브 표시 제외 (v1.4.4)
- **작업 일시**: 2026-09-30 16:30 KST
- **요청 사항**:
  1. `상태 '유효함' '만료됨' 다른 색으로 구분하기.`
  2. `pc 내부에 있는 시디롬,가상디스크,구글 드라이브(기타 다른 회사 드라이브 포함) 표시에서 제외 하고 실제 물리적 디스크,usb 들만 목록화 합니다.`
  3. `docs폴더 문서를 업데이트 합니다.`
- **수행 내용**:
  1. **상태 '유효함' / '만료 임박' / '만료됨' 시각적 색상 구분 강화 및 전용 퀵 필터 탭 제공**:
     - **유효함 (Valid)**: 에메랄드 그린 (`bg-emerald-100 text-emerald-800 border-emerald-300`, `✓ 유효함`) 적용으로 정상 서명 가능한 인증서를 뚜렷하게 시각화.
     - **만료됨 (Expired)**: 로즈 레드 (`bg-rose-100 text-rose-800 border-rose-300`, 펄스 도트, `✕ 만료됨`) 적용으로 즉시 폐기/정리가 필요한 인증서 강조.
     - **만료 임박 (Expiring Soon)**: 앰버 오렌지 (`bg-amber-100 text-amber-800 border-amber-300`, `⚠️ 만료 임박`) 적용.
     - **테이블 상단 퀵 필터 탭**: 전체 / 유효함 / 만료 임박 / 만료됨 전용 버튼을 배치하여 상태별 즉각적인 필터링 지원.
     - **상세정보 모달 및 WPF 다이얼로그**: 상단에 상태별 색상 강조 배너 및 명세 카드를 추가하여 인증서 유효 여부를 직관적으로 확인.
  2. **PC 내부 시디롬, 가상 디스크, 구글 드라이브 등 클라우드 드라이브 표시 원천 제외 (`driveFilter.ts`, `UsbDriveWatcher.cs`, `UsbStorageGuard.cs`)**:
     - **광학/시디롬 디스크 제외**: CD-ROM/DVD 드라이브, ISO 마운트 드라이브, CDFS/UDF/ISO9660 포맷을 목록에서 완전 배제.
     - **가상 디스크 제외**: RAM Disk, VHD/VHDX, ImDisk, Daemon Tools, WinCDEmu, VMware/VirtualBox 가상 드라이브 배제.
     - **클라우드 스토리지 가상 드라이브 제외**: Google Drive (구글 드라이브), Microsoft OneDrive (원드라이브), Dropbox (드롭박스), iCloud Drive, Box, RaiDrive (레이드라이브), CloudDrive, WebDAV 등 클라우드 동기화 가상 드라이브 완벽 필터링.
     - **실제 물리적 디스크 & USB만 목록화**: 본체 내장 NVMe M.2 SSD, SATA SSD/HDD 및 외장 USB 메모리, 이동식 저장매체만 안전하게 탐색 및 표시.
  3. **문서 현행화**:
     - `docs/PATCHNOTES.md`, `docs/WORK_LOG.md`에 v1.4.4 변경 사항을 빠짐없이 기록 완료.

---

### 📝 [작업 차수 52] 명칭 미지정 인증서 구분 개선, 만료 정리 필터링 오류 수정, 휴지통 전체 선택 복원 및 경로 텍스트 잘림 방지 (v1.4.3)
- **작업 일시**: 2026-09-30 15:40 KST
- **요청 사항**:
  1. `구분에서 인증서 명칭이 없는 파일에 대한 정의 다시 개선.`
  2. `만료 인증서 정리에서 사용가능한 인증서를 인식하는 오류 발생.`
  3. `휴지통에서 복구할때 전체 선택 가능하도록 개선.`
  4. `인증서 경로가 짤리지 않도록 개선.`
- **수행 내용**:
  1. **구분(Category) 및 명칭 미지정 인증서 정의 정밀 개선**:
     - 인증서 소유자명(CN)이 없는 인증서 파일에 대해 이전의 맹목적인 `NPKI(금융인증서)` 기본값 할당 오류를 배제.
     - 발급기관/OU/경로 체계에 따라 `GPKI (명칭 미지정)`, `EPKI (명칭 미지정)`, `법인 NPKI (명칭 미지정)`, `NPKI (명칭 미지정)`, `미분류 / 명칭 미지정`으로 명확히 세분화하여 표시.
     - 소유자명 필드에도 `[명칭 미지정] {소속기관}` 또는 `미식별 인증서 (명칭 미지정)`으로 사용자 혼란 방지.
  2. **만료 인증서 정리에서 정상 사용 가능 인증서 오인식 오류 완전 해결**:
     - 원인: 자정(00:00:00) 기준 비교 및 `now < notBefore` 음수 오프셋 계산 버그로 인해 당일 만료 예정 또는 만료 임박(30일 이내)의 정상 사용 가능한 인증서가 만료 대상으로 오인식되던 문제.
     - 해결: 대한민국 인증서 표준(만료 당일 23:59:59까지 유효)을 엄격히 적용. `valid` 및 `expiring` 인증서는 만료 정리 목록에서 100% 원천 배제하고, `daysRemaining <= 0` 및 만료일자 23:59:59를 초과한 인증서만 정확히 정리 대상으로 지정.
  3. **인증서 휴지통(Trash Vault) 일괄 전체 선택 및 일괄 복원 기능 탑재**:
     - Web 및 WPF 양쪽 환경에 `[☑️ 전체 선택]`, `[선택 해제]` 툴바 버튼과 체크박스 컬럼 추가.
     - `[↩️ 선택한 인증서 복원 (N건)]` 및 `[↩️ 휴지통 전체 일괄 복원]` 기능을 통해 대량의 삭제 인증서를 한 번에 원본 경로로 안전하게 복구할 수 있도록 개선.
  4. **인증서 보관 경로 텍스트 잘림 방지 (No Truncation)**:
     - Web UI: 테이블 및 모달에서 `truncate max-w-xs` 강제 축소를 제거하고, `break-all font-mono`와 호버 시 `[📋 전체 경로 복사]` 버튼 및 툴팁을 제공하여 긴 경로도 한눈에 확인 가능.
     - WPF UI: `DirectoryPath` 텍스트블록에 `TextWrapping="Wrap"` 및 `ToolTip="{Binding DirectoryPath}"`를 전수 적용하여 DataGrid 창 크기와 관계없이 경로가 잘리지 않고 온전히 표시되도록 개선.
- **영향 파일**:
  - `src/types.ts`, `src/utils/certParser.ts`, `src/components/CertificateList.tsx`
  - `src/components/CertificateCleanupModal.tsx`, `src/components/TrashModal.tsx`, `src/components/CertificateDetailModal.tsx`
  - `src-wpf/KCert.Core/Parser/CertPairValidator.cs`, `src-wpf/KCert.Core/Parser/KCertParser.cs`
  - `src-wpf/KCertManager.Wpf/Models/CertificateItem.cs`, `src-wpf/KCertManager.Wpf/Models/BackupHistoryItem.cs`
  - `src-wpf/KCertManager.Wpf/Views/TrashDialog.xaml`, `src-wpf/KCertManager.Wpf/Views/TrashDialog.xaml.cs`
  - `src-wpf/KCertManager.Wpf/Views/MainWindow.xaml`, `src-wpf/KCertManager.Wpf/Views/ExpiredCleanupDialog.xaml`
  - `docs/WORK_LOG.md`, `docs/PATCHNOTES.md`

---

### 📝 [작업 차수 51] 사용자 제공 3D 메탈릭 K-Shield 방패 아이콘 적용 및 투명 바탕화면 패키징 (v1.4.3)
- **작업 일시**: 2026-09-29 19:25 KST
- **요청 사항**:
  - `아이콘을 이 파일로 변경.` (K-Certificate-main.png)
- **수행 내용**:
  1. **사용자 제공 3D 메탈릭 K-Shield 방패 엠블럼 전수 적용**:
     - 좌측 블루/우측 실버 크롬 분할 방패 및 3D 각진 K 엠블럼을 고해상도(512x512)로 완벽 추출.
     - 외곽 배경을 완전 투명(`rgba(0,0,0,0)`) 처리하여 바탕화면이나 주변을 가리지 않는 순수 방패 실루엣 구축.
     - 캔버스의 96%를 꽉 채우도록 정밀 크롭 및 중앙 정렬 패딩 적용.
  2. **모든 플랫폼 리소스 일괄 갱신**:
     - Windows WPF 데스크톱 앱: `src-wpf/KCertManager.Wpf/Assets/app.ico`, `app-logo.png`
     - 웹 브라우저 에디션: `public/assets/icons/app-logo.png`, `public/assets/icons/app.ico`, `favicon.ico`
     - 배포 및 인스톨러: `installer.iss`, `app.ico`
- **영향 파일**:
  - `scripts/apply_uploaded_icon.mjs` (신규 생성)
  - `src-wpf/KCertManager.Wpf/Assets/app.ico`, `app-icon.ico`, `app-logo.png` (갱신)
  - `public/assets/icons/app.ico`, `app-icon.ico`, `app-logo.png`, `app-icon.png` (갱신)
  - `public/assets/app.ico`, `public/favicon.ico`, `app.ico` (동기화)
  - `docs/WORK_LOG.md` (수정)

---

### 📝 [작업 차수 50] 상단 헤더 버전 표기 정리 및 배경 투명(Alpha 0) 최대 크기 바탕화면 아이콘 적용 (v1.4.3)
- **작업 일시**: 2026-09-29 19:10 KST
- **요청 사항**:
  - `상단에 버전 정보 제거 합니다 . 왼쪽 하단에 버전 정보가 있습니다.`
  - `바탕화면 바로 가기 아이콘도 크기를 꽉채워서 만들어 주세요.`
  - `아이콘이 주변과 배경을 가리지 않도록 해주세요.`
- **수행 내용**:
  1. **상단 헤더 버전 뱃지 제거 및 왼쪽 하단 상태바 버전 일원화**:
     - Windows WPF `MainWindow.xaml`: 상단 타이틀바 로고 우측의 `v1.4.2` 뱃지를 완전 제거하고, 좌측 하단 상태바(`StatusBar`)에 `v1.4.3`을 명확하게 배치.
     - React 웹 에디션 `Header.tsx`: 타이틀 우측의 `K-Cert Manager v{APP_VERSION}` 텍스트를 제거하고, 좌측 사이드바 및 하단 정보 영역에서만 단일 표시하도록 정돈.
  2. **바탕화면 투명 배경(Alpha 0) 최대 크기 아이콘 패키징 (`scripts/generate_fullsize_icons.mjs`)**:
     - 기존의 사각형 어두운 배경 타일(`<rect>`)을 완전 제거하여 **배경을 100% 투명(`rgba(0,0,0,0)`)**으로 처리.
     - 윈도우 바탕화면에서 아이콘 주변 배경 및 바탕화면 이미지를 불필요한 사각 박스로 가리지 않도록 개선.
     - 보안 방패(Shield) 엠블럼 자체를 캔버스 전체(가로 480px, 세로 484px, 512 기준 95% 이상 점유)로 확장하여 큼직하고 웅장하게 표시.
     - 256, 128, 64, 48, 32, 16 멀티 해상도 32-bit RGBA 투명 ICO 및 PNG 재패키징 완료.
- **영향 파일**:
  - `src-wpf/KCertManager.Wpf/Views/MainWindow.xaml` (수정)
  - `src/components/Header.tsx` (수정)
  - `scripts/generate_fullsize_icons.mjs` (수정)
  - `src-wpf/KCertManager.Wpf/Assets/app.ico`, `app-icon.ico`, `app-logo.png` (재생성)
  - `public/assets/icons/app.ico`, `app-icon.ico`, `app-logo.png`, `app-icon.png` (재생성)
  - `public/assets/app.ico`, `public/favicon.ico`, `app.ico` (동기화)
  - `docs/WORK_LOG.md` (수정)

---

### 📝 [작업 차수 49] 실시간 수동 업데이트 확인(Manual Check) UI 및 데스크톱 WPF 연동 강화 (v1.4.3)
- **작업 일시**: 2026-09-29 16:20 KST
- **요청 사항**:
  - `수동으로 업데이트 확인 할 수 있도록 해주세요.`
- **수행 내용**:
  1. **웹 에디션 실시간 수동 업데이트 확인 툴바 구축 (`UpdateModal.tsx`, `Header.tsx`, `Sidebar.tsx`, `App.tsx`)**:
     - 상단 헤더 및 좌측 사이드바에 `[🔄 수동 업데이트 확인]` 전용 버튼 배치 (조회 중 회전 애니메이션 및 비활성화 처리).
     - 업데이트 모달 내부에 **`[지금 수동 확인]`** 실시간 API 조회 툴바 및 마지막 점검 시간/응답 상태 실시간 피드백 카드 추가.
     - 개발자/사용자 테스트용 **기준 버전 가상 시뮬레이션(Custom Version Test)** 도구 내장 (예: 1.4.2 입력 시 새 버전 감지 팝업 시뮬레이션 가능).
     - 수동 확인 완료 시 성공 차임 사운드 및 토스트 알림 연동.
  2. **Windows C# WPF 데스크톱 앱 수동 업데이트 확인 명령 탑재 (`MainViewModel.cs`, `MainWindow.xaml`)**:
     - `CheckUpdatesCommand`를 추가하고 상단 윈도우 타이틀바 메뉴에 **`[✨ 업데이트 확인]`** 버튼 통합.
     - 최신 버전인 경우 안전 안내 다이얼로그, 신규 릴리스 감지 시 GitHub 릴리스 다운로드 페이지 원클릭 연동 다이얼로그 제공.
- **영향 파일**:
  - `src/components/UpdateModal.tsx` (수정)
  - `src/components/Header.tsx` (수정)
  - `src/components/Sidebar.tsx` (수정)
  - `src/App.tsx` (수정)
  - `src-wpf/KCertManager.Wpf/ViewModels/MainViewModel.cs` (수정)
  - `src-wpf/KCertManager.Wpf/Views/MainWindow.xaml` (수정)
  - `docs/WORK_LOG.md` (수정)

---

### 📝 [작업 차수 48] 3계층 GitHub 자동 업데이트 엔진 구축, 바탕화면 Full-Bleed 아이콘 꽉 찬 크기 패키징 및 릴리스 가이드 동기화 (v1.4.3)
- **작업 일시**: 2026-09-29 13:50 KST
- **요청 사항**:
  - `docs폴더 문서를 업데이트 할때 깃허브에 올리는 내용도 수정해서 업데이트 하세요.`
  - `1.4.2 버전에서 깃허브에 1.4.3 버전으로 업데이트 되었는데 자동업데이트 알림이 안떠요.`
  - `바탕화면 아이콘으로 사용하는 아이콘이 작아서 별로에요, 아이콘 최대크기에 꽉채워서 크게 만들어 주세요.`
- **수행 내용**:
  1. **1.4.2 ➔ 1.4.3 자동 업데이트 알림 미점등 원인 분석 및 3계층(3-Tier) 다중 폴백 엔진 구축**:
     - 원인: `push_to_github.bat`를 통해 `git push origin v1.4.3` 실행 시 Git 태그만 올라가며, GitHub Releases 웹에서 Release 객체를 Publish 하기 전까지 `/releases/latest`가 `404 Not Found`를 반환하여 업데이트가 누락되었음.
     - 해결: `src/utils/updateChecker.ts`와 `UpdateCheckerService.cs`에 3-Tier 폴백(`Tier 1: /releases/latest` ➔ `Tier 2: /releases` ➔ `Tier 3: /tags Git 태그 직결`)을 구현하여 태그만 등록되어도 즉시 신규 버전을 감지하도록 개선.
     - 캐시 버스팅: `?_t=Date.now()` 및 `Cache-Control: no-cache, no-store` 헤더 적용.
     - `UpdateModal.tsx`에 감지 출처(공식 릴리스 / 릴리스 목록 / Git 태그) 및 실시간 [다시 확인] 버튼 추가.
  2. **바탕화면 아이콘 꽉 찬 최대 크기(Full-Bleed) 개선 (`scripts/generate_fullsize_icons.mjs`)**:
     - 캔버스의 96%를 꽉 채우는 고대비 스퀘어클 및 골드 메탈릭 방패 프레임 디자인 적용.
     - 외부 투명 여백을 최소화하여 Windows 바탕화면 및 탐색기에서 큼직하고 시원하게 표시.
     - 256x256, 128x128, 64x64, 48x48, 32x32, 16x16 멀티 해상도 Windows 표준 ICO 및 512x512 고해상도 PNG/JPG 생성 완료.
  3. **GitHub 업로드 스크립트 및 릴리스 배포 가이드 갱신**:
     - `push_to_github.bat`, `push_to_github.ps1`: `APP_VER=1.4.3` 동기화 및 릴리스 발행 팁 안내 출력.
     - `docs/AUTO_UPDATE_GUIDE.md`: 3-Tier 아키텍처 및 Step-by-Step 릴리스 발행 매뉴얼 갱신.
     - `docs/PATCHNOTES.md`, `docs/WORK_LOG.md`, `docs/USER_GUIDE.md`, `docs/README.md` 전 파일 최신 사양 반영.
- **영향 파일**:
  - `scripts/generate_fullsize_icons.mjs` (신규 생성)
  - `src/utils/updateChecker.ts` (수정)
  - `src/components/UpdateModal.tsx` (수정)
  - `src/App.tsx` (수정)
  - `src-wpf/KCertManager.Wpf/Services/UpdateCheckerService.cs` (수정)
  - `src-wpf/KCertManager.Wpf/Assets/app.ico`, `app-icon.ico`, `app-logo.png`, `app-logo.jpg`, `app-icon.jpg`, `favicon.jpg` (재생성)
  - `public/assets/icons/app.ico`, `app-icon.ico`, `app-logo.png`, `app-logo.jpg`, `app-icon.png`, `app-icon.jpg`, `favicon.jpg` (재생성)
  - `push_to_github.bat`, `push_to_github.ps1` (수정)
  - `docs/AUTO_UPDATE_GUIDE.md`, `docs/PATCHNOTES.md`, `docs/WORK_LOG.md`, `docs/USER_GUIDE.md`, `docs/README.md` (수정)

---

### 📝 [작업 차수 47] 인증서 복사 완료 깜빡임 CSS 애니메이션, Web Audio API 화음 사운드 피드백 및 기본 베이지 테마 적용 (v1.4.3)
- **작업 일시**: 2026-09-28 12:05 KST
- **요청 사항**:
  - `앱 첫 시작시 베이지색으로 시작합니다. 앱 업데이트가 있는 경우 어떤 방식으로 동작하나요.`
  - `인증서 복사 작업이 성공적으로 완료되었을 때, 사용자에게 작업 종료를 알리는 시각적 효과와 함께 짧은 알림음을 추가하세요.`
  - `인증서 복사가 성공적으로 완료되었을 때, CertificateList 컴포넌트 내에서 복사된 행들이 짧게 깜빡이는 CSS 애니메이션을 추가하고 Audio API를 사용하여 긍정적인 완료 알림음을 재생하도록 구현하세요.`
  - `docs폴더 문서를 업데이트 합니다.`
- **수행 내용**:
  1. **인증서 복사 행 깜빡임 CSS 애니메이션 (`rowCopiedFlash` / `animate-copied-row`)**:
     - `src/index.css`에 `@keyframes rowCopiedFlash` 정의 (에메랄드 글로우, 박스 섀도우 펄스 및 미세 스케일 바운스 1.8초 지속).
     - `CertificateList.tsx`의 `recentlyCopiedIds` 프롭 연동을 통해 복사된 행에 `animate-copied-row` 클래스 및 `✨ 복사 완료` 뱃지 실시간 표시.
  2. **브라우저 Web Audio API 기반 하모닉 완료 차임 (`src/utils/audioFeedback.ts`)**:
     - 외부 파일 요청 없이 Web Audio API OscillatorNode를 합성하여 `Eb5(622Hz) -> G5(784Hz) -> C6(1046Hz)`의 3단계 상승 아르페지오 화음 생성.
     - Exponential decay envelope을 적용하여 맑고 청량하며 귀가 피로하지 않은 피드백 톤 구현.
     - `BackupModal.tsx`, `UsbToPcModal.tsx`, `App.tsx`의 모든 복사/가져오기 완료 경로에 알림음 연동.
  3. **첫 실행 시 '포근한 크림 베이지(Warm Cream Beige)' 기본 테마 적용 (`App.tsx`)**:
     - 로컬 스토리지에 기존 설정값이 없을 때 기본 테마를 `'beige'`로 초기화.
     - 다크, 회색, 화이트, 베이지 4대 테마 전반의 대비 및 시인성 점검.
  4. **전체 문서 동기화 및 Semantic Versioning 1.4.3 갱신**:
     - `package.json`, `src/version.ts`, `installer.iss`, `KCertManager.Wpf.csproj`, `UpdateCheckerService.cs` 및 `docs/` 전 파일 최신 사양 반영.

---

### 📝 [작업 차수 46] C# WPF 공식 메탈릭 K-방패 로고 탑재, 릴리스 배포 패키지 경량화 & 공식 채널 보안 정돈 (v1.4.2)
- **작업 일시**: 2026-09-27 17:15 KST
- **요청 사항**:
  - `C# WPF 데스크톱 프로그램에 모던하고 고급스러운 공식 K-방패 로고와 아이콘을 정식 탑재하세요.`
  - `GitHub 릴리스 배포 패키지 용량을 최적화하고 배포 스크립트를 정돈하세요.`
- **수행 내용**:
  - `WindowChrome` 일체형 커스텀 타이틀바 및 테마 동기화 적용.
  - 7대 전역 보안 취약점 하드닝 패치 적용.
  - 한/영 라이선스 문서 분리 및 공식 지원 채널 일원화.
