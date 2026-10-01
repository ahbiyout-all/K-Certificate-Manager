# 📝 K-Certificate Manager 패치노트 (Release Notes)

본 문서는 **K-인증서 매니저(K-Certificate Manager)**의 버전별 변경 이력, 신규 기능, 보안 패치 및 버그 수정 사항을 상세히 기록한 공식 릴리스 문서입니다.

---

## 📌 버전 명명 규칙 (Semantic Versioning 2.0.0)
- **`MAJOR` (주 버전, X.0.0)**: 기존 아키텍처와 호환되지 않는 대규모 구조 변경 또는 핵심 보안 엔진의 전면 개편.
- **`MINOR` (부 버전, 1.X.0)**: 하위 호환성을 유지하면서 새로운 기능 추가 (예: 일괄 갱신 포털 모달, USB 역방향 복사 마법사, 테마 시스템 추가 등).
- **`PATCH` (수정 버전, 1.4.X)**: 하위 호환성을 유지하는 버그 수정, 성능 최적화, 보안 하드닝 패치 및 UI/UX 개선.
   - 예: 만료일 카운트 표시 오차 수정, 툴팁 표시 스타일 개선, 드라이브 용량 표시 오류 수정 등.

> **💡 개발 수칙**: 코드 수정 시 특이점이나 기능 확장이 발생하면 본 패치노트에 기록하고 버전을 업데이트하며, 앱 화면(`src/version.ts`, 헤더/사이드바) 및 자동 빌드 스크립트(`build.bat`)의 버전 표기를 동시에 동기화해야 합니다.

---

## 📋 버전 릴리스 내역

### 🚀 [v1.4.5] - 2026-09-30
**변경 구분**: `PATCH` (패치노트 및 package.json 기반 자동 동적 갱신 파이프라인 구축, 대상 디스크 지정 전용 팝업창 탑재, WPF 상태바 동적 바인딩, 전 테마 고대비 시안성 개편 및 자가 복사 금지)

#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **패치노트(`docs/PATCHNOTES.md`) 및 `package.json` 기반 자동 동적 버전 갱신 파이프라인 전면 구축 (`push_to_github.bat`, `push_to_github.ps1`, `build.bat`, `.github/workflows/build.yml`)**
  - **1차 (기계 표준 규격)**: `package.json`의 `"version"` 필드를 Node.js 및 PowerShell로 실시간 자동 추출하여 `%APP_VER%` 변수에 할당.
  - **2차 (패치노트 직결 연동)**: Node 환경이 아니거나 누락된 경우에도 `docs/PATCHNOTES.md` 상단 최신 릴리스 헤더(`### 🚀 [vX.X.X]`)를 정규식으로 직접 추출하여 `%APP_VER%`에 자동 반영.
  - **3차 (완전 자동화 스크립트)**: `push_to_github.bat`, `push_to_github.ps1`, `build.bat`, `.github/workflows/build.yml` 모두에서 수동 버전 하드코딩을 제거하여, 패치노트 작성 및 버전 변경 시 커밋 메시지, 창 타이틀, Git 태그, 인스톨러 파일명이 100% 일괄 동기화.
- **선택/전체 일괄 복사 시 대상 디스크 지정 전용 팝업창 (`TargetDrivePickerModal.tsx`) 신규 탑재**
  - "전체 일괄 백업", "인증서 복사 시작", "개별 복사" 클릭 시 복사를 진행할 이동식 USB 또는 물리 디스크를 직관적으로 먼저 지정할 수 있는 전용 팝업 모달 제공.
  - USB가 꽂히지 않았을 때 내장 C: 드라이브로의 자동 오복사를 원천 차단하고 `💡 고속 USB 메모리를 연결해 주세요` 안내 카드를 명확하게 점등.
- **C# WPF 상태표시줄 버전 동적 바인딩 (`AppVersion`) 및 XAML 하드코딩 완전 제거**
  - `MainWindow.xaml` 795번째 줄 상태 표시줄의 `Text="v1.4.3"` 하드코딩을 제거하고, 뷰모델의 `AppVersion` 속성(`Text="{Binding AppVersion, FallbackValue='v1.4.5'}"`)과 100% 동적 연동하여 최신 인스톨러 설치 후 구버전으로 오인식되던 현상을 근본적으로 해결.
- **전 테마(다크, 회색, 화이트, 베이지) 글자 시인성 및 고대비(WCAG AA/AAA) 전면 개편 (`src/index.css`)**
  - **다크/파스텔블랙 테마**: 배지/경고 박스 내부 어두운 글자색(`text-blue-900`, `text-amber-900`, `text-rose-900` 등)이 밝은 파스텔 형광 톤(#bfdbfe, #fef08a, #fecdd3, #a7f3d0)으로 자동 치환되도록 오버라이드하여 시안성 대폭 향상.
  - **회색/화이트/베이지 테마**:
    - 본문 텍스트, 카드 제목, 테이블 항목의 텍스트 색상을 진한 슬레이트/차콜 톤(#0f172a, #1e293b, #334155, #1c1917)으로 강화하여 배경과 뚜렷하게 분리.
    - 사이드바 및 어두운 모달 헤더(`bg-slate-900`) 영역의 내부 서브 텍스트가 일반 오버라이드 규칙에 의해 검은색으로 뭉개지던 현상을 범위 보호(Scope Protection) 스타일로 전면 해결.
- **같은 디스크 나 USB에 있는 인증서는 스스로 자신에게 복사 금지 (`driveFilter.ts`, `BackupModal.tsx`, `backupService.ts`, `CertTransferEngine.cs`)**
  - **자가 복사(Self-Copy) 사전 점검 규칙**: 선택한 인증서가 이미 복사 목적지 드라이브(예: E: USB ➔ E: USB, 또는 C: 내장 ➔ C: 내장)에 보관되어 있을 경우, 원본 인증서 무의미한 덮어쓰기 및 데이터 손상 방지를 위해 자가 복사를 엄격히 제한.
  - **인터랙티브 UI 및 경고 배너**:
    - 목적지 드라이브 카드 상단에 `🚫 자가 복사 금지` 전용 배지 표시.
    - 선택한 인증서 전체가 대상 드라이브에 존재 시 `🛑 동일 디스크/USB 자가 복사 금지` 경고 박스를 출력하고 [복사 시작] 버튼 자동 비활성화.
    - 일부 선택 항목만 자가 복사인 경우, 해당 항목 수량(`자가 복사 제외 N건`)을 명시하고 실제 백업 연산에서 대상 항목만 안전하게 자동 제외.
  - **백엔드/엔진 이중 방어**: C# WPF 전송 엔진(`CertTransferEngine.cs`) 및 TypeScript 서비스(`backupService.ts`) 양쪽에 경로 검증 로직을 탑재하여 비정상 복사 시도를 이중으로 물리 차단.
- **인증서 상태('유효함' vs '만료됨') 명확한 색상 구분 및 퀵 필터 버튼 탑재**
  - **`유효함 (Valid)`**: 싱그러운 에메랄드 그린 테마 (`bg-emerald-100 text-emerald-800 border-emerald-300`, `✓ 유효함`) 적용.
  - **`만료됨 (Expired)`**: 시시각각 눈에 띄는 로즈 레드 테마 (`bg-rose-100 text-rose-800 border-rose-300`, `✕ 만료됨`) 적용.
  - **`만료 임박 (Expiring Soon)`**: 앰버 오렌지 테마 (`bg-amber-100 text-amber-800 border-amber-300`, `⚠️ 만료 임박 D-X`) 적용.
  - 테이블 상단 전용 상태 필터 탭(전체, 유효함, 만료 임박, 만료됨)을 탑재하여 클릭 한 번으로 수량 카운트 확인 및 즉시 필터링 지원.
- **실제 물리적 디스크 및 USB 전용 목록화 (CD-ROM, 가상 디스크, 구글 드라이브 등 스토리지 제외)**
  - CD-ROM/DVD, ISO 마운트 드라이브, RAM Disk, VHD/VHDX 가상 디스크, Google Drive, OneDrive, Dropbox, RaiDrive 등 클라우드 마운트 드라이브 완전 제외.
  - 실제 컴퓨터에 탑재된 NVMe M.2 SSD, SATA SSD/HDD 및 연결된 USB 플래시 메모리/외장 SSD만 탐색 및 표시.
- **인증서 보관함 목록 양방향 정렬 기능 탑재 (WPF & Web)**
  - **WPF 데스크톱**: 메인 화면 `DataGrid`의 컬럼 헤더 클릭 시 구분(분류), 저장 위치, 인증서 명칭(CN), 발급기관, 만료일자, 상태 등의 전체 항목이 오름차순/내림차순으로 막힘없이 정렬되도록 MVVM 연동형 커스텀 정렬 메커니즘을 전면 구축.
  - **React 웹 에디션**: 기존 테이블 헤더에 정렬 화살표(`lucide-react` ArrowUpDown) 표시 및 헤더 버튼 이벤트 연동으로 정합성 확보.
- **WPF 모든 팝업 다이얼로그(창) 동적 테마 완벽 연동 및 글자 시인성 강화**
  - `AboutDialog`, `ActivityLogDialog`, `BackupHistoryDialog`, `CertificateDetailDialog`, `ExpiredCleanupDialog`, `RenewalGuidanceDialog`, `SearchLocationsDialog`, `SecurityGuideDialog`, `TrashDialog`, `UsbTransferDialog` 등 프로그램 내에 존재하는 모든 서브 팝업창의 배경 및 텍스트 스타일에 `{DynamicResource}` 바인딩을 강제 적용.
  - 화이트, 그레이, 베이지 테마로 변경 시 서브창 본문이나 표 데이터의 일부 글씨들이 보이지 않거나 배경과 유사한 색으로 뭉개지던 시인성 가시성 결함을 100% 영구 전수 교정.
  - **스마트 테마 감지 (`IsCurrentThemeDark`)**: 만료 정리 마법사(`ExpiredCleanupDialog`) 등의 다이얼로그 내부 코드-비하인드에 런타임 어둡기 자동 검출기(IsCurrentThemeDark)를 배치하여, 액티브 테마 상태에 어울리는 최적의 전경색(경고문 대비)을 가변 계산 주입.
- **Windows 배치 파일 개행 문자 규격 튜닝 (CRLF 오프셋 버그 원천 픽스)**
  - Windows의 명령 프롬프트(`cmd.exe`) 환경에서 스크립트 실행 제어가 어긋나거나 명령이 누락되던 현상을 원천 방지하기 위해, 모든 스크립트 파일(`.bat`, `.cmd`)을 Windows 고유 규격인 CRLF(`\r\n`) 방식으로 완전 인코딩 일괄 교정 완료.

---

### 🚀 [v1.4.4] - 2026-09-30
**변경 구분**: `PATCH` (상태 '유효함'/'만료됨' 명확한 색상 구분 체계 구축, 시디롬·가상디스크·클라우드 드라이브 표시 원천 제외 및 실제 물리 디스크/USB 목록화 강화, 문서 최신화)

#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **복사 및 백업 모달 내 파일 충돌 해결 옵션 UI 전면 탑재 (`BackupModal.tsx`, `UsbToPcModal.tsx`)**
  - **`⚡ 스마트 덮어쓰기 (overwrite)`**: 목적지 드라이브에 동일 파일/인증서 존재 시 최신 유효기간 파일로 자동 교체.
  - **`📁 이름 변경 보존 (archive_old/rename)`**: 기존 원본 폴더를 유지하고 백업본 폴더명 뒤에 날짜/버전(`_복사본_날짜`)을 부가하여 둘 다 보존.
  - **`⏭️ 건너뛰기 (skip)`**: 동일 인증서가 이미 존재하는 경우 복사 대상에서 스킵.
- **인증서 상태('유효함' / '만료 임박' / '만료됨') 명확한 색상 구분 및 전용 퀵 필터 탭 탑재**
  - **유효함 (Valid)**: 싱그러운 에메랄드 그린 테마 (`bg-emerald-100 text-emerald-800 border-emerald-300`, `✓ 유효함`) 적용으로 정상 사용 가능한 인증서를 직관적으로 식별.
  - **만료됨 (Expired)**: 뚜렷한 로즈 레드 테마 (`bg-rose-100 text-rose-800 border-rose-300`, 펄스 도트, `✕ 만료됨`) 적용으로 폐기 및 정리 대상 인증서를 한눈에 인지.
  - **만료 임박 (Expiring Soon)**: 시인성 높은 앰버 오렌지 테마 (`bg-amber-100 text-amber-800 border-amber-300`, `⚠️ 만료 임박 D-X`) 적용.
  - **테이블 상단 상태별 퀵 필터**: 전체 / 유효함 / 만료 임박 / 만료됨 탭을 분리하여 상태별 원클릭 즉시 필터링 지원.
  - **상세정보 모달 및 WPF 다이얼로그**: 상단에 상태별 색상 강조 배너 및 명세 카드 추가.
- **PC 내 시디롬, 가상 디스크, 구글 드라이브/원드라이브 등 클라우드 드라이브 표시 완전 제외 (`driveFilter.ts`, `UsbDriveWatcher.cs`, `UsbStorageGuard.cs`)**
  - **광학/시디롬 디스크 제외**: CD-ROM/DVD 물리 드라이브, ISO 마운트 드라이브, CDFS/UDF/ISO9660 포맷을 목록에서 원천 배제.
  - **가상 디스크 제외**: RAM Disk, VHD/VHDX, ImDisk, Daemon Tools, WinCDEmu, VMware/VirtualBox 가상 드라이브 배제.
  - **클라우드 스토리지 가상 드라이브 제외**: Google Drive (구글 드라이브), Microsoft OneDrive (원드라이브), Dropbox (드롭박스), iCloud Drive, Box, RaiDrive (레이드라이브), CloudDrive, WebDAV 등 클라우드 동기화 가상 드라이브 완벽 필터링.
  - **실제 물리적 디스크 & USB만 목록화**: 본체 내장 NVMe M.2 SSD, SATA SSD/HDD 및 외장 USB 메모리, 이동식 저장매체만 안전하게 탐색 및 표시.

---

### 🚀 [v1.4.3] - 2026-09-30
**변경 구분**: `PATCH` (명칭 미지정 인증서 구분 체계 개선, 만료 인증서 정리 필터링 오인식 오류 수정, 휴지통 전체 선택 복원 기능 탑재, 인증서 보관 경로 텍스트 잘림 방지, 사용자 3D 메탈릭 K-방패 아이콘 전수 교체, 바탕화면 투명 배경 최대 크기 패키징)

#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **구분(Category)에서 명칭 미지정 인증서 파일 정의 및 분류 체계 개선 (`certParser.ts`, `KCertParser.cs`)**
  - 인증서 소유자명(CN)이 없는 파일에 대해 맹목적으로 금융 NPKI를 지정하던 문제를 해결하고, 발급처 및 경로에 따라 `GPKI (명칭 미지정)`, `EPKI (명칭 미지정)`, `NPKI (명칭 미지정)`, `미분류 / 명칭 미지정`으로 정확히 분기 표시.
  - 소유자명에도 `[명칭 미지정] {소속기관}`으로 표기하여 식별성 강화.
- **만료 인증서 정리에서 사용 가능한 인증서 오인식 오류 해결 (`CertificateCleanupModal.tsx`, `CertPairValidator.cs`)**
  - 한국 인증서 만료 기준(만료일자 23:59:59까지 유효)을 엄격히 적용하여, 당일 만료 예정이거나 만료 임박(30일 이내)의 정상 사용 가능한 인증서가 만료 정리 대상으로 오인식되는 오류를 100% 원천 차단.
- **인증서 휴지통(Trash Vault) 일괄 전체 선택 및 일괄 복원 기능 탑재 (`TrashModal.tsx`, `TrashDialog.xaml`)**
  - Web 및 WPF 양쪽 환경에 `[☑️ 전체 선택]`, `[선택 해제]` 툴바 버튼과 체크박스 컬럼을 추가하여 삭제된 인증서를 한 번에 선택하여 원클릭 일괄 복원 지원.
- **인증서 보관 경로 텍스트 잘림 방지 (`CertificateList.tsx`, `MainWindow.xaml` 등)**
  - Web UI: 강제 축소(`truncate max-w-xs`)를 해제하고 `break-all font-mono`와 호버 시 `[📋 전체 경로 복사]` 버튼을 제공.
  - WPF UI: `DirectoryPath` 텍스트블록에 `TextWrapping="Wrap"` 및 `ToolTip`을 적용하여 경로가 잘리지 않고 온전히 확인 가능.
- **사용자 제공 3D 메탈릭 K-Shield 방패 엠블럼 전수 적용 (`app.ico`, `app-logo.png`)**
  - **새로운 엠블럼 디자인**: 좌측 로열 코발트 블루 / 우측 실버 크롬 분할 방패 및 중앙 3D 입체 치즐 K 로고가 결합된 최신 보안 엠블럼 전면 도입.
  - **100% 완전 투명 배경 (Alpha = 0)**: 아이콘 외곽의 사각 박스 타일을 완전 제거하여, Windows 바탕화면 바로 가기 배치 시 사용자의 배경화면 그림이나 주변 아이콘을 일체 가리지 않도록 개선.
  - **최대 크기(Full-Bleed 96%) 캔버스 충진**: 방패 실루엣 자체가 캔버스 경계를 꽉 채우도록 정밀 패딩 및 크롭하여 바탕화면에서 시원하고 웅장하게 표시.
  - **멀티 해상도 32-bit RGBA 투명 ICO 패키징**: `256x256`, `128x128`, `64x64`, `48x48`, `32x32`, `16x16` 전 규격 32비트 알파 채널 적용 완료.
- **상단 헤더 버전 표기 정리 및 좌측 하단 일원화 (`MainWindow.xaml`, `Header.tsx`)**
  - **WPF 데스크톱 앱**: 상단 타이틀바 로고 우측의 중복 버전 뱃지를 제거하고, 창 좌측 하단 상태바(`StatusBar`)에 `v1.4.3 | 준비 완료...` 형태로 단일 표시하여 상단 여백 확보 및 시각적 정돈.
  - **React 웹 에디션**: 상단 헤더의 중복 버전 안내 텍스트를 제거하고, 좌측 사이드바 및 하단 정보 영역에서만 일관되게 표시.
- **Windows 배치 파일(`push_to_github.bat`) Unix LF 오프셋 버그 완전 해결 및 `.gitattributes` 영구 고정**
  - **원인 분석**: `push_to_github.bat` 파일이 Unix LF(`\n`)로 저장되어 있어, Windows `cmd.exe`가 2바이트 개행(`\r\n`)을 기준으로 계산하는 파일 포인터가 매 줄 1바이트씩 어긋나 `echo` ➔ `'cho'`, `set` ➔ `'t'`, `:FAILURE` ➔ `'URE'` 등으로 명령어가 잘려 실행되던 현상 해결.
  - **CRLF 정규화**: `push_to_github.bat` (CRLF: 99, LF: 0), `build.bat` (CRLF: 463, LF: 0), `run-web.cmd` (CRLF: 67, LF: 0), `push_to_github.ps1` (CRLF: 126, LF: 0) 전수 변환 완료.
  - **`.gitattributes` 신규 생성**: `*.bat text eol=crlf`, `*.cmd text eol=crlf`, `*.ps1 text eol=crlf` 규칙을 설정하여 향후 Git 체크아웃 시에도 CRLF가 영구 보존되도록 방어.
- **실시간 수동 업데이트 확인(Manual Check) 기능 구축 (`UpdateModal.tsx`, `MainWindow.xaml`)**
  - 웹 에디션: 상단 헤더 및 좌측 사이드바에 `[🔄 수동 업데이트 확인]` 전용 버튼 배치, 모달 내 `[지금 수동 확인]` 실시간 API 조회 툴바 및 개발자 가상 버전 시뮬레이터 제공.
  - WPF 데스크톱: 상단 메뉴에 `[✨ 업데이트 확인]` 명령 버튼 및 `CheckUpdatesCommand`를 추가하여 원클릭으로 GitHub 최신 릴리스 확인 및 다운로드 다이얼로그 연동.
- **3계층(3-Tier) GitHub 자동 업데이트 감지 엔진 도입 (`updateChecker.ts`, `UpdateCheckerService.cs`)**
  - `1단계(/releases/latest)` ➔ `2단계(/releases 목록)` ➔ `3단계(/tags Git 태그 직결)` 순으로 자동 탐색하여 Git 태그만 올라와도 즉시 신규 버전을 감지하고 알림을 표시.
  - `?_t=Date.now()` 및 `Cache-Control: no-cache` 헤더로 프록시 캐시 우회.
- **인증서 복사 성공 시 행 하이라이트 깜빡임 CSS 애니메이션 (`rowCopiedFlash`)**
  - 인증서 디스크 백업 및 USB ➔ 컴퓨터 복사 성공 시 해당 행들이 에메랄드 빛으로 2회 부드럽게 깜빡이는 애니메이션 및 `✨ 복사 완료` 뱃지 노출.
- **Web Audio API 기반 무음원 고품질 완료 알림음 (`audioFeedback.ts`)**
  - 외부 오디오 파일 없이 Web Audio API 오실레이터를 통해 3단계 상승 하모닉 차임(`Eb5 ➔ G5 ➔ C6`) 합성 재생.
- **첫 실행 시 기본 테마 '포근한 크림 베이지(Warm Cream Beige)' 설정 (`App.tsx`, `index.css`)**

---

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
