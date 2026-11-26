# 📝 K-Certificate Manager 패치노트 (Release Notes)

본 문서는 **K-인증서 매니저(K-Certificate Manager)**의 버전별 변경 이력, 신규 기능, 보안 패치 및 버그 수정 사항을 상세히 기록한 공식 릴리스 문서입니다.

---

## 📌 버전 명명 규칙 (Semantic Versioning 2.0.0)

- **`MAJOR` (주 버전, X.0.0)**: 기존 아키텍처와 호환되지 않는 대규모 구조 변경 또는 핵심 보안 엔진의 전면 개편.
- **`MINOR` (부 버전, 1.X.0)**: 하위 호환성을 유지하면서 새로운 기능 추가 (예: 알림음 설정 및 볼륨 조절, 에러 알림 모달 추가 등).
- **`PATCH` (수정 버전, 1.4.X)**: 하위 호환성을 유지하는 버그 수정, 성능 최적화, 보안 하드닝 패치 및 UI/UX 개선.

> **💡 개발 수칙**: 코드 수정 시 특이점이나 기능 확장이 발생하면 본 패치노트에 기록하고 버전을 업데이트하며, 앱 화면(`src/version.ts`, 헤더/사이드바) 및 자동 빌드 스크립트(`build.bat`)의 버전 표기를 동시에 동기화해야 합니다.

---

### 🚀 [v2.2.0] - 2026-11-21
**변경 구분**: `MINOR` (2026 국내 인증서 정책·RSA 3072-bit 보안 강도 진단 및 4대 동향 가이드 통합(Web & WPF), WPF 앱 시작 무응답(응답없음) 해소 3단계 비블로킹 초기 스캔 엔진 탑재, 8대 영역 `v2.2.0` 버전 동기화)
#### ✨ 주요 신규 기능 및 성능·안정화 (Features, Security Posture & Startup Engine)
- **WPF 앱 시작 무응답(응답없음) 해소 & 3단계 비블로킹 초기 스캔 엔진 (`MainViewModel`, `CertificateScannerService`, `CertLocationScanner`, `FastScanPipeline`, `UsbStorageGuard`, `NativeStorageInterop`, `UsbDriveWatcher`, `MainWindow`)**:
  - **Phase-0 Local Fast-Pass (`ScanLocalFastAsync`)**: 앱 시작 시 로컬 표준 인증서 경로(`AppData\LocalLow\NPKI`, `C:\GPKI`, `C:\EPKI` 등)를 먼저 비동기 스캔해 UI를 즉시 렌더링한 뒤, 이동식·외부 드라이브를 후속 Deep-Pass로 분리 탐색.
  - **OS `DriveType` 사전 필터 및 드라이브 타임아웃 가드**: 연결이 끊긴 SMB 네트워크 드라이브(`DriveType.Network`), 광학 드라이브(`CDRom`), RAM 디스크를 `IsReady`/`CreateFile` 호출 이전에 차단하고 드라이브별 시간제한 프로브를 적용해 I/O 행(Hang) 원천 제거.
  - **재귀 순환 방어·취소·배치 갱신**: `FileAttributes.ReparsePoint` 심볼릭 링크/정션 무한 루프 방어, `_scanCts` 기반 이전 스캔 즉시 취소, Deep-Pass 발견 항목 배치 UI 반영으로 UI 스레드 포화 차단.
- **2026 RSA 3072-bit 상향(2027.02 의무화) 및 인증서 보안 강도 진단 스위트 (Web & WPF)**:
  - `RSA-3072` / `ECDSA-256` 보안 강도 기준 평가, `RSA-2048` 이하 또는 취약 해시/만료 예정 인증서 식별 및 갱신 안내 배지·진단 리포트 제공 (`certParser.ts`, `SecurityPostureCard`, `KoreanCertPolicyOids.cs`, `CertificateItem.cs`).
- **2026 국내 인증 동향 4대 핵심 주제 통합 (Web & WPF & 가이드 문서)**:
  - **1) RSA 3072-bit 상향 및 보안강도 진단**, **2) GPKI·EPKI 비액티브엑스(Non-ActiveX) 및 클라우드 전환 안내**, **3) 금융인증서·민간 간편인증 비교 및 갱신 가이드**, **4) 모바일 신분증(8종) 전자서명 및 2026 법령 동향**을 Web 모달(`SecurityGuideModal.tsx`, `DiagnosticsRepairModal.tsx`, `RenewalGuidanceModal.tsx`)과 WPF 다이얼로그(`SecurityGuideDialog.xaml`, `DiagnosticsRepairDialog.xaml`, `RenewalGuidanceDialog.xaml`)·툴바에 동시 반영.
- **8대 영역 `v2.2.0` 공식 버전 동기화**:
  - `package.json`, `src/version.ts`, `TrashModal.tsx`, WPF 3종 `.csproj`, `UpdateCheckerService.cs`, XAML/CS UI(`MainWindow`, `AboutDialog`, `UpdateNotificationDialog`), `installer.iss`, `build.ps1/.bat/.cmd`, `.github/workflows/build.yml`, `README.md` 및 `/docs` 문서 전체를 `v2.2.0`으로 동기화.

#### 🛠️ 최신 안정화 · 4차 심층 전수 감사 반영 (2026-11-23)
- **눈이 편안한 저눈부심 회색·베이지 테마 개편 & 전 화면 대비 교정 (Web & WPF)**:
  - **회색 테마 (*Misty Mineral Slate*, `#CCD4DF` / `#DFE5EC`)** 및 **베이지 테마 (*Warm Oat Paper*, `#E6DFD1` / `#F1ECE1`)**로 눈부심과 블루라이트 피로를 줄이고 고가독성 잉크·에스프레소 텍스트 대비 확보 (`src/index.css`, `App.tsx`, `MainViewModel.ApplyTheme`).
  - Web Tailwind CSS v4 `@custom-variant dark` 선언 추가로 OS 다크 모드에서 화이트/회색/베이지 테마 사용 시 `dark:` 클래스가 잘못 적용되던 현상 차단 및 `Sidebar.tsx`·`CertificateList.tsx` 하드코딩 색상 토큰화.
  - WPF `App.xaml` `AccentAmberBrush` 신설 및 `MainWindow.xaml`, `ExpiredCleanupDialog`, `CertificateDetailDialog`, `RenewalGuidanceDialog`, `DiagnosticsRepairDialog`, `SecurityGuideDialog`, `AboutDialog`, `TrashDialog` 내 하드코딩 밝은/어두운 hex 색상을 `DynamicResource` 테마 브러시로 전환.
- **인증서 보관함 선택 복사 · 필터 보기 · 단일 행 클릭 3중 격리 (Web & WPF)**:
  - Web `resolveSelectedBackupCerts` 및 `CertificateList` 필터 전체선택이 항상 **체크된 ID(`selectedIds`) ∩ 현재 표시 목록(`visibleCertificates`)** 교집합만 반환·토글하도록 재구성해 숨은 필터 항목이나 단일 행 상세 클릭(`inspectedCert`)이 의도치 않게 섞여 복사되는 오류 차단.
  - WPF `NextGuidedStep`, `ExecuteGuidedCopy`, `CertDataGrid_SelectionChanged`, `BackupAllAsync`, `BackupAll_Click`에서도 행 클릭만으로 체크박스(`IsSelected`)가 자동 변경되거나 필터 밖 `_allCertificates`로 fallback되던 동작을 제거하고 현재 `FilteredCertificates` 기준으로 일원화.
- **시작 테마 복원 및 워크플로우·수명주기 교정 (Web & WPF)**:
  - WPF `App.xaml.cs`, `MainWindow.xaml.cs` 시작 시 하드코딩 `"dark"` 대신 `SettingsService`에 저장된 사용자 테마 즉시 적용 및 `SettingsDialog.xaml.cs` 레거시 파스텔 별칭(`pastel-*`, `classic`) 매핑 보완.
  - Web `SettingsModal.tsx` 기본 테마 정합화 및 `App.tsx` `handleSelectWorkflow('pc_to_usb')` 0건 안내 유지·USB 마운트 리스너 `handleRefreshRef` 최신 참조 호출 교정.

#### 🛠️ 5차 심층 전수 감사 · 수명주기 및 라이트/회색/베이지 전 창 대비 완성 (2026-11-23)
- **WPF 선택 카드 유동 테두리·사이드바·이벤트 수명주기 결함 수정 (`WpfAnimatedBorderHelper.cs`, `MainWindow.xaml.cs`, `UsbTransferViewModel.cs`, `UsbTransferDialog.xaml.cs`, `MainViewModel.cs`)**:
  - `WpfAnimatedBorderHelper.ApplyBorderGlow`가 `BgCardBrush` 휘도를 판별해 회색/베이지/화이트 테마의 선택 드라이브 카드에 `SelectedRowBgBrush`(`#DBEAFE` 계열)와 부드러운 `0.28` 글로우를 적용함으로써 어두운 텍스트가 짙은 남색 배경에 묻히던 현상을 완전 해결.
  - `MainWindow.xaml.cs`가 `CurrentTheme` 변경 시 `SidebarTargetDriveBorder`를 즉시 재렌더링하도록 보강하고, `UsbTransferViewModel`에 `IDisposable`·`DetachCertEvents()`를 구현해 `UsbTransferDialog` 종료 시 인증서 `PropertyChanged` 핸들러 누수를 차단.
- **WPF 6대 `DataGrid` + 8종 다이얼로그·모델 전 창 테마 브러시 통일**:
  - `PcToUsbTransferDialog`, `UsbTransferDialog`, `TrashDialog`, `SearchLocationsDialog`, `BackupHistoryDialog`, `ActivityLogDialog` DataGrid 선택 스타일을 `SelectedRowBgBrush`/`SelectedRowTextBrush` 기반으로 일원화.
  - `OperationCompleteDialog`, `DuplicateConflictDialog`, `TargetDrivePickerDialog`, `CertificateDetailDialog`, `MainWindow`, `DiagnosticsRepairDialog`, `RenewalGuidanceDialog` 및 `CertificateItem`·`AppLogItem`·`RenewalInstitutionItem`의 파스텔 hex 텍스트를 `DynamicResource` 브러시 및 `DataTrigger`(`Posture`, `SummaryTone`, `SecurityPosture`)로 전환.
- **Web 7대 컴포넌트 CSS 토큰 일원화 (`SimpleTransferHero`, `ConnectedDrivesBar`, `Header`, `Sidebar`, `CertificateList`, `CertificateDetailSidebar`, `DiagnosticsRepairModal`)**:
  - 모든 하드코딩 파스텔 녹색/호박/적색/청색 hex 값을 `var(--wpf-accent-green)`, `var(--wpf-accent-text)`, `var(--wpf-badge-expiring-text)`, `var(--wpf-accent-rose)`, `var(--wpf-selected-row-secondary)`로 이관해 4대 테마 전 구간에서 명도 대비를 일관되게 보장.

#### 🛠️ 6차 심층 전수 감사 · 경로 안전성 및 WPF 빌드 정합성 완성 (2026-11-23)
- **WPF 핵심 코어 경로 검증 결함 수정 (`SafetyTrashManager.cs`)**:
  - `IsSafeCertificateDirectoryPath`가 기존에 무조건 `NPKI`, `GPKI`, `EPKI`, `MPKI`, `CERT`, `인증서`, `공인인증` 하드코딩 토큰이 포함된 경로만 허용해 비표준 사용자 폴더(`C:\Users\Admin\Desktop\개인백업` 등)나 수동 복원 폴더에서 휴지통 `Restore()`와 `Undo`가 영구 실패하던 문제를 교정. 엄격한 OS 중요 시스템/드라이브 루트/프로필 루트/휴지통 볼륨 차단 리스트 검증 방식으로 전환해 안전한 사용자 백업 폴더 휴지통 격리 및 복원을 완벽 지원하도록 개선.
- **WPF 상세 창 C# 컴파일 에러 수정 (`CertificateDetailDialog.xaml.cs`)**:
  - `CryptoSecurityPosture` 열거형 참조 누락으로 발생한 CS0103 빌드 에러를 해결하기 위해 누락된 `using KCert.Core.Parser;` 네임스페이스 지시문을 추가하여 `dotnet build` 파이프라인 정합성 확보.

#### 🛠️ UI 및 사용자 경험(UX) 고도화 · 인터페이스 폴리시 (2026-11-24)
- **인증서 목록 및 검색 UX 고도화 (`CertificateList.tsx`, `src/index.css`)**:
  - 상단 툴바와 검색 바 영역의 반응형 간격 및 포커스 링을 세련되게 다듬고, 키워드 검색 시 즉시 초기화(`X`) 버튼 및 필터 초기화 가시성 강화.
  - 다크, 회색(*Misty Mineral Slate*), 베이지(*Warm Oat Paper*), 화이트 4대 테마 전반에서 카드 호버, 선택 행, 배지 텍스트의 명도 대비와 부드러운 전환 효과 보강.

#### 🛠️ 상단 헤더 네이티브 창 드래그 기능 구현 및 7차 심층 감사 (2026-11-24)
- **상단 헤더 네이티브 창 드래그 구현 (`Header.tsx`)**:
  - 상단 헤더 컨테이너 `<header>`에 `-webkit-app-region: drag;` 및 `app-region: drag;`를 적용하여 데스크톱 웹 환경(Electron 등)에서 네이티브 창과 동일한 마우스 드래그 이동 편의성을 제공하고, 우측 액션 버튼 및 메뉴 컨테이너에는 `-webkit-app-region: no-drag;`를 적용하여 클릭 및 상호작용 장애를 원천 차단.
- **선택 복사 정합성 최종 재확인 (`App.tsx`, `CertificateList.tsx`, `MainViewModel.cs`)**:
  - `resolveSelectedBackupCerts`와 `visibleCertificates` 간 교집합 계산 및 WPF `FilteredCertificates.Where(x => x.IsSelected)` 일원화 상태 최종 감사 완료.

#### 🛠️ 8차 심층 전수 감사 · 다중 디스크 선택 복사 건수 정합화 및 안정화 (2026-11-25)
- **다중 디스크 선택 복사 건수 오차 및 대상 경로 중복 해소 (Web & WPF)**:
  - 서로 다른 디스크(`C:`, `D:`, `USB`)에 분산된 인증서를 선택해 복사할 때 `backupService.ts`(`copyCertificatesToDisk`, `writeCertificatesToDirectoryHandle`)가 `copiedCertIds` 및 중복 제거된 대상 표준 경로 기준 실제 복사 건수를 반환하도록 일원화하고, `BackupModal.tsx` 중복 로그(`seenLogTargetPaths`)·실패 카운트(`actualCopyable.length`)·자가 복사(`isSameDriveSelfCopy`) 필터와 `App.tsx` `handleBackupSuccess` 드라이브별 반영 건수를 정확히 동기화.
  - WPF `MainViewModel.cs`, `PcToUsbTransferViewModel.cs`, `UsbTransferViewModel.cs`, `TargetDrivePickerDialog.xaml.cs`에서 자가 복사·동일 대상 경로 중복 제외 기준 실제 복사 성공 건수·진행률·완료 안내와 `UpdateDriveCertificateCounts` 보관 배지 수치를 일치시키고, 드라이브 새로고침 시 기존 보관 건수 배지가 유지되도록 교정.
- **선택 복사 엄격 격리 & 비동기 예외/상태 가드 (`App.tsx`, `TargetDrivePickerModal.tsx`, `MainWindow.xaml.cs`)**:
  - `handleOpenGeneralBackupModal`에서 선택 항목이 `0건`일 때 상세 보기(`inspectedCert`)로 대체 복사되던 fallback을 제거해 `resolveSelectedBackupCerts`로 걸러진 `selectedVisibleCertificates`만 전달.
  - `TargetDrivePickerModal.tsx` 자가 복사 항목의 중복 충돌 오표시 제거 및 `MainWindow.xaml.cs` `OpenTargetDrivePickerForCertificatesAsync` 비동기 `await` 보강.

#### 🚀 PC↔USB 양방향 통합 단일 전송 엔진(Unified Bidirectional Transfer Engine) 전면 재작성 (2026-11-26)
- **Web & WPF 단일 2단계(Plan ➔ Execute) 양방향 전송 아키텍처 구축 (`unifiedTransferEngine.ts`, `UnifiedTransferEngine.cs`)**:
  - `PC_TO_USB`, `USB_TO_PC`, `DISK_TO_DISK`, `USB_TO_USB` 방향을 하나의 `TransferPlan` 파이프라인으로 통합해 경로 해석·자가 복사(`SKIP_SELF_COPY`)·다중 디스크 동일 대상 병합(`SKIP_BATCH_DUPLICATE`)·중복 충돌 전략(`overwrite`, `archive_old`/`rename`, `skip`)을 실행 전 불변 계획으로 사전 확정합니다.
  - 기존 모달 및 다이얼로그(`BackupModal`, `UsbToPcModal`, `MainViewModel`, `PcToUsbTransferViewModel`, `UsbTransferViewModel`, `TargetDrivePickerDialog`)의 화면 구조는 유지한 채 내부 엔진만 전면 교체하고, 실행 전 **"실행 계획 미리보기"** 요약과 실제 복사 건수가 100% 일치하도록 일원화했습니다.

#### 🛡️ 5회 반복 심층 자아성찰 · 통합 전송 엔진 엣지케이스 & 수명주기 교정 (2026-11-26)
- **Web 계획·핸들 아카이빙·UI 피드백 정교화 (`unifiedTransferEngine.ts`, `backupService.ts`, `BackupModal.tsx`, `UsbToPcModal.tsx`, `App.tsx`)**:
  - `buildTransferPlan`에서 개별 `skip` 항목이 후속 `overwrite`/`archive_old` 동일 목적지 항목을 차단하지 않도록 목적지 키 등록 순서를 교정하고, `sourceLocation` 드라이브 문자 우선 판별 및 `writeCertificatesToDirectoryHandle` `_backup_YYYYMMDD` 기존 파일 아카이빙을 보완했습니다.
  - `BackupModal` 사용자별 중복 결정(`customDuplicateDecisions`) 보존, `UsbToPcModal` 0건 건너뜀 시 축하 모션 차단 및 `App.tsx` `resultCertificates` 직접 동기화를 반영했습니다.
- **WPF 비동기 예외·부분 실패·`WasSkipped` 정합화 (`UnifiedTransferEngine.cs`, `CertificateBackupService.cs`, `CertificateDetailDialog.xaml.cs`, `TargetDrivePickerDialog.xaml.cs`, `PcToUsbTransferViewModel.cs`, `UsbTransferViewModel.cs`, `MainViewModel.cs`)**:
  - 단일 복사 Wrapper(`BackupCertificateToDrive`, `CopyCertificateToLocalPc`)가 `WasSkipped`를 성공으로 오보고하지 않도록 교정하고, `CertificateDetailDialog` 비동기 `await` 적용 및 `TargetDrivePickerDialog` `IsDriveAllSelfCopy` 단일화를 적용했습니다.
  - `PcToUsbTransferViewModel`과 `UsbTransferViewModel` 실행부에 `try/catch/finally { IsBusy = false; }` 안전 가드를 추가하고, 부분 실패 시 거짓 완료 창 대신 실패 상세 안내를 표출하도록 수정했습니다.

---

### 🚀 [v2.1.1] - 2026-11-16 (최신 안정화 반영: 2026-11-18)
**변경 구분**: `PATCH` (복사 완료 폴더 실제 드라이브 루트 탐색기 타겟팅 보강, 비표준 정위치 복구 후 안전 휴지통 격리 워크플로우 완성, `Class1` 기관·특수목적 인증서 개인키 페어링·GPKI/EPKI 구분 배지·사이드바 필터 신설 및 Web/WPF 5차 심층 전수 감사 안정화)
#### ✨ 주요 보강 및 안정화 (Improvements, Bug Fixes & Stability)
- **`Class1` 기관·특수목적 인증서 스캔, GPKI·EPKI 구분 배지 & 사이드바 `'CLASS1'` 필터 (Web & WPF)**:
  - **개인키 페어링 정밀 스캔 (`CertLocationScanner.cs`, `CertificateScannerService.cs`, `certParser.ts`, `certPathUtils.ts`)**: `C:\GPKI\Certificate\class1`, EPKI, USB `class1` 경로에서 개인키(`.key`/`.pri`) 쌍을 보유한 실사용 기관/특수목적 인증서만 선별 표출하고 Root/CA/CRL 및 중복 `_env.cer`를 필터링하며, PC↔USB 전송 및 `CertIntegrityDoctor.Diagnose(..., specificDerPath)`에서도 `class1` 계층을 보존·정밀 진단합니다.
  - **기관 체계 구분 배지 & 사이드바 필터 (`Sidebar.tsx`, `CertificateList.tsx`, `CertificateItem.cs`, `MainWindow.xaml`, `MainViewModel.cs`)**: `CLASS1 · 공무원(GPKI)`(인디고), `CLASS1 · 교육(EPKI)`(틸), `CLASS1 · 기관`(슬레이트) 구분 배지를 제공하고, 사이드바 `'CLASS1'`(`CLASS1 · 기관/특수목적`) 카테고리 필터 및 키워드(`class1`, `공무원`, `행정`, `교육`, `학교`, `기관`, `관인`, `특수`) 검색을 지원합니다.
- **복사 완료 폴더 탐색기 타겟팅 보강 (`OperationCompleteModal.tsx`, `BackupModal.tsx`, `OperationCompleteDialog.xaml.cs`)**:
  - `'복사된 폴더 열기'` 클릭 시 `resolveCopiedFolderPath`로 드라이브 문자 뒤 누락 백슬래시(`\`)와 `targetPath`·`targetDiskName` 조합을 정규화해 실제 드라이브 루트(`E:\NPKI\...` 등)를 정확히 열도록 개선하고, Web 환경에서 `window.open`/`alert` 없이 안전 브리지·로컬 링크·폴더 피커·클립보드 폴백을 지원.
- **비표준 경로 정위치 복구 마법사·휴지통 격리 워크플로우 완성 (`App.tsx` `handleRepairFolders`, `DiagnosticsRepairDialog.xaml.cs`, `CertIntegrityDoctor.cs`)**:
  - 표준 경로 복사 완료 후 중복 방지 및 ID 기준 검증을 거쳐 원본 비표준 폴더를 즉시 안전 휴지통(`SafetyTrash`)으로 이동하고, 복구·격리 결과를 활동 로그(`RESTORE`/`DELETE`)와 성공 토스트 알림에 기록·노출.
  - WPF `CertIntegrityDoctor.RepairToStandardHierarchy`에 동일 폴더 조기 반환 및 동일 파일 자기덮어쓰기 `IOException` 방지 가드 추가.
- **전수 감사(Pass 1~5) 및 CI 컴파일·수명주기·JSON 안전성 일괄 교정**:
  - **CI `.NET`/`WPF` 컴파일 및 널 안전성 해결**: `DiagnosticsRepairDialog.xaml.cs` 누락 `System.Text.RegularExpressions` 참조(`Regex`/`RegexOptions`) 추가 및 `CertificateScannerService.cs`·`CertificateBackupService.cs` `CS8601`/`CS8604` 널 가능 참조 경고 해소.
  - **WPF 수명주기·Dispatcher·예외 방어**: `MainViewModel.cs` `DispatchSafe` 종료 상태 가드·중복 `DriveArrived` 제거·`UndoDelete`/`ExecuteBackupWithConflictOptionAsync` 예외 방어·`RestoreFilteredIndices()`, `MainWindow.xaml.cs`·`UsbTransferDialog.xaml.cs`·`PcToUsbTransferViewModel.cs`·`UpdateNotificationDialog.xaml.cs` 핸들러/`CancellationTokenSource` 해제, `TrashDialog`/`CertificateDetailDialog`/`ExpiredCleanupDialog`/`TargetDrivePickerDialog` 비동기 `try/catch`·`TryCreateBrush`·`Owner` 정합화.
  - **Web 리스너·타이머 누수 제거 & JSON/스토리지 가드**: `Header.tsx`, `SettingsModal.tsx`, `AppActivityLogModal.tsx`, `BackupModal.tsx`, `UsbToPcModal.tsx`, `StartupWorkflowModal.tsx`, `App.tsx`, `CertificateList.tsx`의 타이머 및 윈도우 리사이즈/드래그 리스너 cleanup 보강, `protectedVaultStorage.ts`·`renewalStore.ts`·`activityLogger.ts`·`backupService.ts`의 배열/범위/프로토타입 오염(`__proto__`) 및 null-safe 비교 가드 적용.
  - `usbToPcService.ts` / `backupService.ts` / `driveFilter.ts` / `certPathUtils.ts` / `certParser.ts`: 이동식 드라이브 문자 정제, `USB:\` 표준 경로 인식, `sourceLocation` 폴더명 정규화, TradeSign `NPKI_CORP` 분류 추가 및 `skip` 0건 전용 안내 화면 구현.
  - `KCert.Core` (`SafetyTrashManager.cs`, `CertTransferEngine.cs`, `KCertAntiDuplicationEngine.cs`, `FastScanPipeline.cs`): `ReadOnly` 속성 재귀 해제, PC 표준 원본 우선(`PrimaryInstance`) 선정, `\MPKI` GPKI 분류 보완.
  - **8대 영역 버전 동기화**: `package.json`, `src/version.ts`, WPF 3종 `.csproj`, `UpdateCheckerService.cs`, XAML/CS UI, `installer.iss`, `build.ps1/.bat/.cmd`, `.github/workflows/build.yml`, `/docs` 및 블로그 원고 전체를 `v2.1.1`로 일괄 동기화.

---

### 🚀 [v2.1.0] - 2026-11-13
**변경 구분**: `MINOR` (앱 내 직접 다운로드·무인 셀프 설치 자동 업데이트 엔진 탑재, WPF-Web 다크 테마 통합 및 반응형 CSS Grid `auto-fill` 인증서 카드 레이아웃 적용, 전역 UI 쉬운 일상 표현 우선 개편, 3차 심층 전수 감사 버그 일괄 수정)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **GitHub 이동 없는 앱 내 자동 다운로드 및 무인 셀프 설치 엔진 탑재 (WPF & Web)**:
  - **C# WPF (`UpdateCheckerService.cs`, `UpdateNotificationDialog.xaml/.cs`, `MainViewModel.cs`)**: 시작 시 또는 수동 확인 시 뜨는 업데이트 알림 창에서 `[확인 (자동 다운로드 · 설치)]` 버튼 클릭 시 외부 브라우저로 이동하지 않고 설치 패키지(`kcert-manager-v*-setup.exe`)를 직접 스트리밍 다운로드.
  - PE 실행 파일(`MZ`)·ZIP(`PK`) 매직 바이트 검증 및 분리 실행 PowerShell 스크립트(`apply_self_update.ps1`)를 통한 무인 설치(`/SILENT /SUPPRESSMSGBOXES /NORESTART /CLOSEAPPLICATIONS`)·자동 재실행 지원.
  - **Web 콘솔 (`updateChecker.ts`, `UpdateModal.tsx`)**: 외부 링크 이동 대신 인앱 3단계(스트림 다운로드 ➔ WebCrypto SHA-256 검증 ➔ Cache Storage 갱신 및 `kcert_web_installed_version` 반영) 진행률 표시 구현.
- **WPF 데스크톱 디자인 Web 콘솔 통합 및 반응형 CSS Grid `auto-fill` 카드 레이아웃 적용**:
  - Web 콘솔 기본 테마를 WPF 다크 테마(`#0F1219` / `#1A1F2C`)로 통일하고, `[data-theme="dark"]` 및 `[data-theme="pastel-black"]` 내 밝은 모달/그라데이션/파스텔 배지 대비 결함을 토큰 단위 선택자로 완벽 교정(`src/index.css`).
  - `CertificateList.tsx`에 화면 폭에 따라 카드가 자동 리플로우(Reflow)되는 CSS Grid `repeat(auto-fill, minmax(300px, 1fr))` 반응형 카드 레이아웃 및 카드/테이블 뷰 전환 기능 적용.
- **전역 UI 쉬운 일상 표현 우선 + 전문 용어 병기 개편 (Web 26개 모듈 & WPF 전역 다이얼로그)**:
  - 장문의 경로·FAQ·절차 설명을 1줄 핵심 요약 + 기본 접힘 토글(`더보기` / WPF `Expander`)로 정리하고, `비밀키`→`개인키`, `출발지/도착지`→`원본 위치/저장 위치`, `탐색 경로`→`찾는 위치`, `무결성/자가진단`→`파일 손상 검사(SHA-256)/보안 점검`으로 통일.
- **3차 심층 전수 감사(Self-Reflection & Deep Audit) 결함 수정**:
  - **WPF `C:\` 드라이브 자가 복사 판별 수정 (`TargetDrivePickerDialog.xaml.cs`)**: `CertificateBackupService`의 실제 저장 경로(`ResolveEffectiveDestinationRoot`) 기준으로 비교하여 `C:\Users\...\AppData\LocalLow\NPKI` 인증서의 `C:` 재복사 차단 누락 해결.
  - **Web 비동기 상태 및 예외 처리 보강**: `usbToPcService.ts` 내 `AbortError`(사용자 폴더 선택 취소) 불필요 재시도 제거; `App.tsx`의 `certificatesRef`·`handleRefreshRef` 도입으로 stale closure 해소 및 `handleTogglePath` 사용자 추가 인증서 보존; `StartupWorkflowModal.tsx` 단계 전환 정리.

---

### 🚀 [v2.0.0] - 2026-11-10
**변경 구분**: `MAJOR` (드라이브 카드 전면 60fps 무한 유동 그라데이션 테두리(Animated Moving Border Glow) 및 네온 글로우 발광 브러시 탑재, Windows DPAPI / AES-256 이중 암호화 보호 보관소 완성, 제한된 USB 복구 엔진 신설, 만료 정리창 984px(20% 확장) 가독성 극대화, Inno Setup 무인 설치 및 방화벽 사전 등록 정식 인스톨러 완성, `/dist/v2.0.0/` 버전별 하위 폴더 분리 배포 파이프라인 완비)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **드라이브 카드 시각적 시인성 극대화를 위한 무한 유동 애니메이션 테두리(Animated Moving Border Glow) 전면 탑재 (WPF & Web)**:
  - **C# WPF 데스크톱 애니메이션 브러시 헬퍼 (`WpfAnimatedBorderHelper.cs`)**:
    - WPF `LinearGradientBrush`와 `PointAnimation` (StartPoint/EndPoint 대각 2.2초/3.5초 무한 루프, `AutoReverse = true`)을 결합한 60fps 무한 유동 그라데이션 테두리 및 14px `DropShadowEffect` 네온 글로우 발광 헬퍼 개발.
    - **선택된 드라이브 카드**: 선명한 무지개 네온 그라데이션 (`#2563EB` ➔ `#10B981` ➔ `#F59E0B` ➔ `#6366F1`) + 14px 네온 글로우 발광.
    - **미선택 USB 드라이브 카드**: 은은한 에메랄드/청록 그라데이션 (`#059669` ➔ `#34D399` ➔ `#0EA5E9`).
    - **미선택 로컬 디스크 카드**: 푸른빛 은은한 블루 그라데이션 (`#1E3A8A` ➔ `#3B82F6` ➔ `#6366F1`).
  - **WPF 전 대상 드라이브 카드 컨테이너 일괄 탑재**:
    - `TargetDrivePickerDialog.xaml.cs`: 복사 목적지 선택 팝업 내 모든 물리 드라이브 카드 동적 무한 유동 적용.
    - `MainWindow.xaml` & `MainWindow.xaml.cs`: 메인 화면 좌측 사이드바 `복사 / 백업 대상 드라이브` 선택 카드(`SidebarTargetDriveBorder`) 및 간편 모드 백업 카드 적용.
    - `PcToUsbTransferDialog.xaml` & `UsbTransferDialog.xaml`: PC ➔ USB 목적지 카드 및 USB ➔ PC 소스 카드 실시간 동적 유동 테두리 적용.
  - **React Web SPA 100% Visual Parity 동기화 (`index.css`, `QuickTransferConfigCard.tsx`)**:
    - `index.css` 내 2중 레이어 `background-clip: padding-box, border-box` 테크닉 및 `neonGlowPulse` 애니메이션 탑재로 웹과 C# 데스크톱 100% 시각적 대칭 확립.
- **암호화 보호 보관소 (Encrypted Protected Vault) 아키텍처 완성 (Web & WPF)**:
  - Windows DPAPI(CurrentUser) 및 AES-256 특수 암호화로 매니페스트(`protected_restored_manifest.dat`) 격리 보호 및 포렌식 보안 감사 증적(`[🔍 보안 증적]`) 모달 연동.
- **제한된 USB 복구 (`💾 USB로 제한 복구`) 기능 완비**:
  - 특수 보관소 내 인증서를 로컬 PC 오염 방지를 위해 오직 이동식 USB 메모리의 표준 규격 경로(`\NPKI`, `\GPKI`, `\EPKI`)로만 안전 복구 허용.
- **만료 인증서 정리 대화상자 (ExpiredCleanupDialog) 984px 가로 너비 20% 확장 (WPF)**:
  - 긴 디스크 경로(`AppData\LocalLow\NPKI\...`)와 발급기관명, 만료일자 메타데이터의 시인성 및 가독성 극대화.
- **Inno Setup 정식 인스톨러 완성 및 무인 설치 지원 (`installer.iss`)**:
  - Unpacked Multi-File 개별 파일 설치, 기존 실행 프로세스 강제 종료(`TerminateAppProcesses`), 방화벽 규칙 사전 조용 자동 등록 및 `/VERYSILENT /NORESTART` 무인 설치 지원.
- **버전 번호별 하위 폴더 분리 배포 구조 개편 (`/dist/v2.0.0/`)**:
  - 메인 `/dist` 디렉터리 아래 `/dist/v2.0.0/web`, `/win-x64`, `/core-dll`, `/unpacked`, `/installer` 독립 하위 폴더로 산출물 체계적 분리적재.

---

### 🚀 [v1.9.0] - 2026-11-06
**변경 구분**: `MINOR` (암호화 보호 보관소(Encrypted Vault) 및 제한된 USB 복구(`💾 USB로 제한 복구`) 신설, 만료 인증서 정리창 가로 너비 20% 확대, Inno Setup 무인 설치 및 방화벽 자동 등록 지원, 빌드 산출물 메인 /dist 디렉터리 내 버전 번호별 하위 폴더 분리 배포 구조 개편)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **암호화 보호 보관소 (Encrypted Protected Vault) 아키텍처 및 고도화 (Web & WPF)**:
  - **보안 강화**: 삭제 취소(Undo) 또는 복원된 인증서의 이력 매니페스트(`protected_restored_manifest.dat`)를 Windows DPAPI(CurrentUser 보안 컨텍스트) 및 AES-256 특수 암호화로 격리 저장.
  - **실시간 보안 인스펙터 (Cryptographic Inspector)**: 보관소 파일 크기, SHA-256 무결성 체크섬, DPAPI / AES-256 암호화 알고리즘 상태를 실시간 배너로 표출.
  - **보관소 자가진단 (Live Self-Test)**: 암호화 매니페스트의 복호화 가능 여부, 매직 헤더(`AES\x01` / `KCERT_PROTECTED_VAULT_V1`), 파일 무결성을 원클릭으로 검증하는 진단 도구 제공.
  - **암호화 백업 내보내기 (`.dat`)**: 원본 개인키 노출 없이 암호화된 상태 그대로 안전하게 외부에 백업할 수 있는 전용 내보내기 지원.
  - **포렌식 보안 감사 증적 (`[🔍 보안 증적]`)**: 각 복원 인증서별 소유자 DN, 발급자 DN, 유효기간, 복구 전·후 SHA-256 무결성 검증, DPAPI/AES-256 보호 상태를 담은 포렌식 감사 증적 모달 탑재.
  - **실시간 검색 및 카테고리 필터링**: 보관소 내 인증서명/발급기관/일련번호 실시간 검색창 및 `전체`, `NPKI`, `GPKI`, `EPKI` 분류 콤보박스 연동.
  - **무단 접근 차단**: 현재 로그인한 OS 사용자 외 타 사용자나 외부 프로세스가 보관소 파일을 탈취하더라도 내용을 읽을 수 없도록 기밀성 확보.
  - **C# WPF 데스크톱 완벽 적용**: `System.Security.Cryptography.ProtectedData` (8.0.0) NuGet 패키지를 도입하여 데스크톱 네이티브 DPAPI 보호 매니페스트를 구현하고, 휴지통 대화상자(`TrashDialog.xaml`) 상단에 실시간 보안 암호화 상태 안내 배너 탑재.
  - **자동 마이그레이션**: 기존의 평문 JSON 매니페스트를 첫 실행 시 암호화 바이너리 데이터로 안전하게 자동 전환하고 레거시 파일을 파기.
- **만료 인증서 정리 대화상자 (ExpiredCleanupDialog) 가로 너비 20% 대폭 확장 (WPF)**:
  - 사용자 편의성 및 가독성 개선을 위해 기존 `Width="820"`에서 `Width="984"`로 가로 너비를 20% 확대.
  - 긴 디스크 경로(`AppData\LocalLow\NPKI\...`)와 발급기관명, 만료일자 메타데이터가 잘림 없이 시원하게 표시되어 정리 대상 인증서를 한눈에 파악 가능.
- **제한된 USB 복구 (`💾 USB로 제한 복구`) 기능 신설**:
  - **사용자 요청 사항**: "복원된 항목 보관소 내용을 다시 복원이 가능하도록 제한된(usb복구) 복구를 지원합니다."
  - **기능 구현**: 특수 보관소 내 인증서를 '이동식 USB 메모리'의 표준 규격 경로(`\NPKI`, `\GPKI`, `\EPKI`)로만 다시 복구할 수 있는 전용 핸들러 탑재.
  - **안전 장치**: 로컬 컴퓨터의 시스템 폴더 오염 및 파일 임의 생성을 방지하기 위해 반드시 USB 매체 연결이 확인된 경우에만 복구를 허용하며, 복구 시 SHA-256 무결성 쌍 검증을 즉시 수행.
- **Inno Setup 정식 인스톨러 완성 및 배포 환경 최적화**:
  - **Unpacked Multi-File**: 불필요한 포터블 팩킹 없이 개별 필수 파일 지정 설치로 설치 용량 최적화 및 안정성 확보.
  - **실행 프로세스 강제 종료**: 설치/제거 전 실행 중인 앱을 감지하여 안전하게 종료 처리(`TerminateAppProcesses`).
  - **방화벽 조용 사전 등록**: `netsh.exe`를 사용하여 앱의 기본 이름 및 버전 포함 이름을 Windows Defender 방화벽 규칙에 자동으로 조용 등록.
  - **무인 설치 지원**: `/VERYSILENT /NORESTART` 파라미터를 통한 기업용 무인 배포 옵션 완비.
- **빌드 파이프라인 개편: `/dist/v{version}/` 버전 번호별 하위 폴더 분리 배포 구조 적용**:
  - **사용자 요청 사항**: "Modify the project build scripts to output results into distinct, version-numbered subfolders under a main /dist directory (e.g., /dist/v1.8.0/win-x64, /dist/v1.8.0/installer) instead of a flat structure."
  - **버전별 하위 디렉터리 체계 구축**: 모든 빌드 스크립트(`build.ps1`, `build.bat`, `build.cmd`, `installer.iss`, `.github/workflows/build.yml`)를 메인 `/dist/v1.9.0/` 디렉터리 아래 개별 모듈별 독립 하위 폴더로 산출물을 생성하도록 전면 개편:
    - `/dist/v1.9.0/web`: Vite 기반 웹 관리 콘솔 번들 (Single Page Application 정적 산출물)
    - `/dist/v1.9.0/win-x64`: C# WPF 데스크톱 독립 실행형 단일 바이너리 (`KCertManager.exe`, `KCertManager-Lite.exe`)
    - `/dist/v1.9.0/core-dll`: 순수 창작 독립 C# DLL 라이브러리 (`KCert.Core.dll`, `KCert.Crypto.dll`)
    - `/dist/v1.9.0/unpacked`: 설치 마법사 없이 즉시 구동 가능한 정규 멀티 파일 폴더 풀림 포터블 패키지
    - `/dist/v1.9.0/installer`: Inno Setup 정식 윈도우 인스톨러 설치 실행 파일 (`kcert-manager-v1.9.0-setup.exe`)
  - **재귀 폴더 복사 방지 필터링**: Vite 웹 빌드 시 `dist/` 내부의 `v*` 하위 폴더가 웹 자산이나 인스톨러에 중복·재귀 포함되지 않도록 `-Exclude "v*"` 및 `Excludes: "v*"` 필터 규칙 적용.
- **드라이브 카드 시각적 시인성 극대화를 위한 무한 유동 애니메이션 테두리(Animated Moving Border Glow) 탑재 (WPF & Web)**:
  - **C# WPF 데스크톱 공통 애니메이션 헬퍼 (`WpfAnimatedBorderHelper.cs`)**:
    - WPF `LinearGradientBrush`와 `PointAnimation` (StartPoint/EndPoint 대각 2.2초/3.5초 무한 루프, `AutoReverse = true`)을 결합한 60fps 무한 유동 그라데이션 테두리 및 14px `DropShadowEffect` 네온 글로우 발광 헬퍼 개발.
    - **선택된 드라이브 카드**: 선명한 무지개 네온 그라데이션 (`#2563EB` ➔ `#10B981` ➔ `#F59E0B` ➔ `#6366F1`) + 14px 네온 글로우 발광.
    - **미선택 USB 드라이브 카드**: 은은한 에메랄드/청록 그라데이션 (`#059669` ➔ `#34D399` ➔ `#0EA5E9`).
    - **미선택 로컬 디스크 카드**: 푸른빛 은은한 블루 그라데이션 (`#1E3A8A` ➔ `#3B82F6` ➔ `#6366F1`).
  - **WPF 전 대상 드라이브 카드 컨테이너 일괄 탑재**:
    - `TargetDrivePickerDialog.xaml.cs`: 복사 목적지 선택 팝업 내 모든 물리 드라이브 카드 동적 무한 유동 적용.
    - `MainWindow.xaml` & `MainWindow.xaml.cs`: 메인 화면 좌측 사이드바 `복사 / 백업 대상 드라이브` 선택 카드(`SidebarTargetDriveBorder`) 및 간편 모드 백업 카드 적용.
    - `PcToUsbTransferDialog.xaml` & `UsbTransferDialog.xaml`: PC ➔ USB 목적지 카드 및 USB ➔ PC 소스 카드 실시간 동적 유동 테두리 적용.
  - **React Web SPA 100% Visual Parity 동기화 (`index.css`, `QuickTransferConfigCard.tsx`)**:
    - `index.css` 내 2중 레이어 `background-clip: padding-box, border-box` 테크닉 및 `neonGlowPulse` 애니메이션 탑재로 웹과 C# 데스크톱 100% 시각적 대칭 확립.
- **공공기관 공식 채널 문서화**:
  - 구글 블로거(Blogger) [작성 모드 / HTML 편집 모드] 원고 및 깃허브 기술 명세(`GITHUB_DOCS.md`) v1.9.0 최신화.

---

### 🚀 [v1.8.0] - 2026-10-31
**변경 구분**: `MINOR` (순수 창작 독립 DLL 모듈화 분리(`KCert.Core.dll`, `KCert.Crypto.dll`), 상단 헤더 가로바 스크롤러(Horizontal ScrollBar) 및 마우스 휠 가로 탐색 연동, 4대 테마 전역 고대비 툴팁(ToolTip) 시스템 신설, Semantic Versioning 3단계 분리 원칙 확립)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **순수 창작 독립 C# 코어 & 암호화 DLL 2종 분리 및 솔루션 아키텍처 개편**:
  - **`KCert.Core.dll`**: 대한민국 공인인증서(NPKI, GPKI, EPKI)의 X.509 v3 규격, ASN.1/DER 파서, 발급기관 고유 OID 판별, USB 자동 감시 및 안전 격리 휴지통 엔진을 외부 3rd-party 의존성 0%의 순수 C# 독립 라이브러리로 분리 구축.
  - **`KCert.Crypto.dll`**: KISA 표준 대칭키 SEED-128-CBC 암호화, PKCS#8 개인키(`signPri.key`) 복호화, VID 무결성 검증, RSA-SHA256 전자서명 순수 C# 엔진을 독립 라이브러리로 구현.
  - **`KCertManager.sln` 다중 프로젝트 구조 확립**: 메인 데스크톱 WPF 프로젝트와 2개 코어 DLL 프로젝트의 명확한 책임 분리 및 빌드 의존성 확립.
  - 기술 설계 명세서 등록 (`docs/KCERT_CORE_DLL_SPEC.md`, `docs/KCERT_CORE_DLL_DESIGN_SPECIFICATION.md`, `docs/KCERT_CRYPTO_DLL_SPECIFICATION.md`).
- **상단 헤더 가로바 스크롤(Horizontal ScrollBar) 신설 및 마우스 휠 연동 (Web & WPF)**:
  - **사용자 요청 사항**: "상단 빨간색 부분에 가로바 스크롤을 생성 해주세요."
  - **WPF 데스크톱 헤더 (`MainWindow.xaml`)**:
    - 상단 헤더 높이를 `64px`로 최적화하고 상단 메뉴 ScrollViewer를 `HorizontalScrollBarVisibility="Visible"`로 설정하여 상시 가로 스크롤바 노출.
    - `HorizontalAlignment="Stretch"`로 전개하여 윈도우 조작 버튼과 브랜드 로고 사이의 전 영역을 가로 스크롤 바로 커버.
    - `PreviewMouseWheel="HeaderScrollViewer_PreviewMouseWheel"` 핸들러를 구축하여 툴바 위에서 마우스 휠 조작 시 좌우 가로 스크롤(`ScrollToHorizontalOffset`)이 부드럽게 동작하도록 지원.
    - 윈도우 드래그(`Header_MouseLeftButtonDown`) 필터를 강화하여 스크롤바 및 썸 조작 시 창 이동 간섭을 완벽히 차단.
  - **Web 프리뷰 (`src/components/Header.tsx`)**:
    - 상단 액션 툴바에 `overflow-x-auto`, `scrollbar-thin` 및 마우스 휠 가로 스크롤러(`handleHeaderWheel`)를 탑재하여 화면 폭이 좁은 환경에서도 상단 툴의 가로 탐색 지원.
- **4대 테마 전역 고대비 툴팁(ToolTip) 시스템 신설 및 글자 시인성 완벽 복원 (WPF & Web)**:
  - **사용자 요청 사항**: "툴팁 글자색이 테마와 맞지 않아 글이 보이지 않음"
  - **원인 해결**: Windows OS의 기본 백색 툴팁 배경과 WPF 전역 TextBlock 스타일의 백색 글자색(`TextPrimaryBrush`) 충돌로 인한 White on White 시인성 불량 해결.
  - **`App.xaml` 전역 ToolTip 스타일 구축**: 전용 `ToolTipBgBrush`, `ToolTipTextBrush`, `ToolTipBorderBrush`를 신설하고, 템플릿 내부 `ContentPresenter.Resources`에 전용 TextBlock 스타일을 강제 적용하여 전역 폰트 색상의 간섭을 원천 차단.
  - **4대 테마 동적 바인딩 (`MainViewModel.ApplyTheme`)**: 다크(Dark), 회색(Gray), 베이지(Beige), 화이트(White) 전 테마에서 WCAG AAA 12:1+ 고대비를 보장하는 다크 플로팅 카드 + 선명한 화이트 텍스트 조합 제공.
  - **표시 품질 최적화**: 툴팁 반응 속도(250ms), 설명 읽기 시간(15초 유지), 버튼 간 전환 속도(100ms) 튜닝.
- **소프트웨어 버전 관리(Semantic Versioning: MAJOR.MINOR.PATCH) 3단계 분리 정책 확립**:
  - `docs/VERSIONING_POLICY.md`에 변경 규모별 의사결정 판정 매트릭스(Decision Tree) 및 8대 필수 동기화 영역 명문화.
  - 신규 DLL 아키텍처 개편 및 네비게이션 가로바 스크롤러, 전역 툴팁 시스템 확장에 맞춰 **v1.8.0 MINOR 정식 승격**.
- **MSBuild XML 파싱 및 빌드 파이프라인 무결성 확보**:
  - `KCert.Crypto.csproj` 내 특수문자(`&amp;`) 엔티티 오류 `MSB4025` 완벽 해소.
  - 전체 22개 WPF XAML 및 CSPROJ 유효성 검증 통과.

### 🚀 [v1.7.2] - 2026-10-31
**변경 구분**: `PATCH` (상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 모달 접근성 직관화, WPF 전용 SettingsDialog 신설 및 SettingsService 영구 설정 연동, '다시 표시하지 않음' Two-Way 바인딩 확립)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **상단 헤더 가로 볼륨 슬라이더 바(Horizontal Sound Slider Bar) 직접 구축 (Web & WPF)**:
  - **사용자 요청 사항**: "상단헤더에 가로 슬라이더 바 생성. ⚙️ [환경 설정] 모달이 없음."
  - **Web 헤더 툴바 (`src/components/Header.tsx`)**:
    - 상단 헤더 중앙에 `[🔊/🔇 원클릭 음소거 토글]` + `알림음:` 라벨 + **`가로 범위 슬라이더(<input type="range" min="0" max="100"/>)`** + `볼륨 수치(40% / OFF)` + `[▶ 미리듣기]` 버튼 위젯을 상시 노출.
    - 슬라이더 조작 시 `audioFeedback.ts`와 즉시 연동되며 `SOUND_SETTINGS_CHANGED_EVENT` 전역 이벤트를 발행하여 모든 모달 및 위젯과 실시간 동기화.
  - **WPF 데스크톱 헤더 (`MainWindow.xaml`, `MainViewModel.cs`)**:
    - 상단 헤더 툴바에 `<Slider Width="70" Minimum="0" Maximum="100" Value="{Binding SoundVolume, Mode=TwoWay}"/>` 가로 슬라이더 바, `SoundIcon`(🔊/🔉/🔇), `SoundVolumeText`(40%/OFF), `ToggleSoundCommand`, `TestSoundCommand` 연동.
    - 인증서 복사/백업 완료 시 `IsSoundEnabled && SoundVolume > 0` 여부를 판별하여 청각 효과음 재생.
- **돋보이는 ⚙️ [환경 설정] 버튼 상단 헤더 상시 노출 및 WPF SettingsDialog 신설**:
  - Web 상단 헤더 툴바에 가로 슬라이더 바 바로 옆에 눈에 띄는 **`⚙️ 환경 설정`** 버튼을 영구 배치하여 언제든 1-클릭으로 설정 창 호출 가능.
  - Windows C# WPF 데스크톱에 전용 **`SettingsDialog.xaml` / `SettingsDialog.xaml.cs`** 신설:
    - 알림음(SuccessChime) 사용 여부 체크박스, 가로 슬라이더 바, 볼륨 실시간 표시, 🎵 효과음 미리듣기.
    - 다크 / 회색 / 화이트 / 베이지 4대 테마 라디오 버튼 선택기.
    - 초보자용 간편 모드 / 전문가용 상세 모드 UI 전환기.
    - 기본값으로 복원(`ResetDefaults`) 및 닫기 액션 지원.
- **WPF `SettingsService` 영구 설정 연동 및 '다시 표시하지 않음' Two-Way 바인딩**:
  - `%LocalAppData%\KCertManager\kcert_settings.json` 기반의 전용 설정 관리 싱글톤 서비스(`SettingsService.cs`) 신설.
  - `MainViewModel.DontShowStartupWorkflowAgain` 속성을 구현하고, `SettingsDialog.xaml`의 CheckBox에 `IsChecked="{Binding DontShowStartupWorkflowAgain, Mode=TwoWay}"`로 완벽한 양방향 데이터 바인딩 확립.
  - XAML 컴파일 시 비표준 `Spacing` 속성을 완전히 배제하고 표준 마진을 적용하여 GitHub Actions 및 Release 컴파일 에러(`MC3072`, `CS1061`) 원천 차단.

### 🚀 [v1.7.1] - 2026-10-28
**변경 구분**: `PATCH` (만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화 개선, 휴지통 매니페스트 메타데이터 보존, GitHub Actions Node.js 24/22 LTS 런타임 전환)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **만료 인증서 정리 및 일괄 삭제 시 삭제 수량과 안전 격리 휴지통 수량 1:1 완벽 동기화 (Web & WPF)**:
  - **사용자 요청 사항**: "만료인증서 정리 전/후 숫자 차이남 (컴퓨터 로컬 만료 인증서 22개 정리 후 휴지통 항목 수량이 14개로 표시되는 불일치 현상 개선)"
  - **원인 해결 (`SafetyTrashManager.cs`)**:
    - 동일 폴더 내 다수 키페어 또는 비표준 경로를 가진 인증서 22건을 일괄 삭제할 때, 앞선 인증서가 폴더를 이동하여 후속 인증서의 `Directory.Exists` 검사가 `false`가 되더라도 **모든 삭제 인증서 항목을 `trash_manifest.json`에 100% 누락 없이 격리 기록**하도록 `MoveToTrash` 엔진 수정.
    - 활성 보관함에서 차감된 삭제 개수(22개)와 안전 격리 휴지통에 보관된 개수(22개)가 오차 없이 100% 일치하도록 정합성 확립.
  - **휴지통 매니페스트 메타데이터 보존 (`TrashQuarantineItem`)**:
    - `TrashQuarantineItem` 모델에 `IssuerName`, `Category`, `NotAfter` 필드를 신설하여, 휴지통 열람 시 발급기관명이 "알 수 없음" 대신 원본 인증서 정보(금융결제원, 행정안전부 등)로 정밀하게 표시되도록 보완.
  - **웹 애플리케이션 ID 기반 1:1 동기화 정밀화 (`App.tsx`, `CertificateCleanupModal.tsx`)**:
    - `handleDeleteCertificates`에서 시리얼번호 중복 필터링을 제거하고 고유 `id` 기준으로 엄격하게 매핑하여 삭제 개수와 휴지통 개수의 일치 보장.
    - `isCertificateExpired` 통합 헬퍼 함수를 통해 메인 목록, 만료 모달, 휴지통 간 만료 판정 기준 일원화.
- **GitHub Actions 워크플로 Node.js 24 Next-Gen / Node.js 22 LTS 전환 (`.github/workflows/build.yml`)**:
  - GitHub Actions 환경의 Node.js 20 Deprecated (2026년 4월 EOL) 공식 경고에 선제 대응하여 최신 `node-version: '24'` 및 `node-version: '22'` 런타임으로 공식 전환 완료.
- **문서화 및 구글 블로거 배포 원고 최신화 (`docs/`)**:
  - 사용자 매뉴얼(`USER_GUIDE.md`), 패치노트(`PATCHNOTES.md`), 작업로그(`WORK_LOG.md`), 구글 블로그 포스팅 원고(`BLOG_v1.7.1.md`, `BLOGGER_POST_COMPOSE_MODE.md`, `BLOGGER_POST_HTML_MODE.html`) 최신 배포.

### 🚀 [v1.7.0] - 2026-10-27
**변경 구분**: `MINOR` (인증서 복사·백업 성공 알림음(SuccessChime) ON/OFF 및 볼륨 조절 기능 추가, 보안 영구 삭제 증적 감사 로그 시스템 신설, 컬럼 최소 폭 30px 자유 조절 및 발급기관 공식 기관명 표시, 목록 세로 구분선 및 여백 밀도 컨트롤 구축)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **인증서 복사·백업 완료 성공 알림음 (SuccessChime) ON/OFF 및 볼륨 조절 기능 (`SettingsModal.tsx`, `audioFeedback.ts`)**:
  - **사용자 요청 사항**: "인증서 복사나 백업 작업이 완료되었을 때 재생되는 성공 알림음(SuccessChime)을 사용자가 설정에서 ON/OFF하거나 볼륨을 조절할 수 있는 기능을 '설정 모달'에 추가하세요."
  - **성공 알림음 ON/OFF 토글 스위치**: 환경 설정 모달(`SettingsModal.tsx`)에서 완료 알림음 출력을 자유롭게 켜고 끌 수 있는 직관적 블루 펄스 스위치 제공.
  - **볼륨 조절 슬라이더 (0% ~ 100%) & 음량 아이콘**: 1% 단위 미세 볼륨 조절 슬라이더 및 음량 레벨별 아이콘(음소거/저음/고음) 가시화.
  - **빠른 볼륨 프리셋 버튼 5종**: `[음소거(0%)]`, `[조용히(25%)]`, `[보통(50%)]`, `[크게(80%)]`, `[최대(100%)]` 원클릭 프리셋 제공.
  - **소리 미리듣기 / 테스트 버튼**: 모달 내에서 조절한 음량 크기로 성공 차임음(`Eb5 -> G5 -> C6`)을 즉시 청음 및 확인할 수 있는 테스트 버튼 연동.
  - **설정 영구 보존**: 브라우저 `localStorage`(`kcert_sound_settings`)에 자동 저장되어 PC ➔ USB, USB ➔ PC 등 모든 복사 및 백업 완결 시 사용자 설정을 엄격 준수.
- **보안 삭제 증적 로그 (Secure Deletion Audit Records) 감사 시스템 전면 구축 (Web & WPF)**:
  - **사용자 요청 사항**: "휴지통 비우기 및 개별 영구 삭제 작업 시, 삭제된 파일의 상세 경로와 인증서 고유 식별자(SubjectDN)를 기록하는 '보안 삭제 증적 로그' 기능을 AppActivityLogModal에 추가"
  - **데이터 모델 신설 (`SecureDeletionEvidenceItem`)**: 영구 삭제된 인증서 고유 식별자(`SubjectDN`), 인증서명(`name`), 발급기관(`issuer`), 일련번호(`serialNumber`), 원본 디렉터리 경로(`sourceLocation`), 개별 파일 목록(`signCert.der`, `signPri.key`), 삭제 타임스탬프(`deletedAt`), 삭제 방식(`permanentMethod: 'trash_empty' | 'trash_single_delete'`), SHA-256 무결성 전자지문(`sha256`)을 독립 구조체로 캡처 및 영구 보존.
  - **작업 감사 모달 내 전용 탭 신설 (`AppActivityLogModal.tsx`)**:
    - 상단 `🛡️ 보안 삭제 증적 (N건)` 탭 신설 및 삭제 증적 전용 뷰 제공.
    - 증적 검색 필터(SubjectDN, 파일 경로, 일련번호 실시간 검색) 및 통계 배지(총 영구 삭제 건수, 최신 삭제 일시 등) 완비.
    - 인증서 고유 식별자(SubjectDN) 및 원본 파일 디렉터리 경로의 1-클릭 클립보드 복사(복사 피드백 토스트 포함) 지원.
  - **감사 보고서(`.log`) 내보내기 확장 (`activityLogger.ts`)**:
    - 시스템 작업 로그 내보내기 시, `[보안 삭제 증적 감사 보고서 (FORENSIC AUDIT TRAIL)]` 전용 섹션을 자동 생성하여 규정 준수(Compliance) 및 전자 감사 증적 파일 완벽 추출.
  - **C# WPF 데스크톱 휴지통 영구 삭제 증적 연동 (`TrashDialog.xaml.cs`)**:
    - 휴지통 비우기 및 영구 삭제 실행 시, 삭제 대상 인증서 이름과 원본 파일 디스크 경로를 누락 없이 캡처하여 감사 로그 시스템에 기록하도록 보강.
- **인증서 명칭·저장 경로 및 상태 컬럼 최소 폭 자유 조절(30px) 및 발급기관 공식 기관명 표시 (`src/utils/issuerUtils.ts`, `CertificateList.tsx`)**:
  - '인증서 명칭 및 경로'와 '상태' 컬럼의 최소 폭 제한을 `30px`로 완화하여 마우스 드래그로 원하는 만큼 축소 가능하도록 보장.
  - 대한민국 5대 공인인증기관(금융결제원, 코스콤, 한국정보인증, 한국전자인증, 한국무역정보통신) 및 정부/공공 CA(행정안전부 GPKI, 교육부 EPKI, 국방부 MPKI 등)의 정확한 공식 기관명 및 브랜드 뱃지 연동.
- **인증서 보관함 세로 구분선(Vertical Grid Lines) 전면 도입 및 여백 밀도 조절 컨트롤 (`CertificateList.tsx`)**:
  - 데이터 셀 간 선명한 세로 구분선(`border-r`)을 적용하여 컬럼 경계를 시각적으로 가늠하기 용이하도록 개선.
  - 상단 툴바에 [좌우 여백: 좁게 | 보통 | 넓게] 3단계 프리셋 셀렉터 및 컬럼 너비 초기화 버튼 구축.
- **만료 인증서 일괄 정리 시 휴지통 동기화 및 카운트 불일치 근본 해소 (`CertificateCleanupModal.tsx`)**:
  - 만료 인증서 정리 실행 시 이동된 인증서들을 실시간으로 휴지통 상태(`trashList`) 및 통계 카운터에 즉각 일괄 반영하여, 만료 정리 후 휴지통에 표시되는 개수와 실제 격리 파일 수가 정확하게 1:1 일치하도록 동기화 로직 전면 개선.
- **스크롤바 썸(Thumb) 테두리 두께 및 호버 트랜지션 디자인 고도화 (`src/index.css`)**:
  - `::-webkit-scrollbar-thumb`의 `border-width`를 미세 조정(2.5px)하고 호버(`:hover`) 및 활성화(`:active`) 시 부드러운 배경색 전환 애니메이션(`transition: background-color 0.2s`) 적용.
- **앱 시작 시 인증서 상세 사이드바 기본 해제(닫힘) 보장 (`App.tsx`, `MainViewModel.cs`)**:
  - 첫 실행 시 사이드바가 닫힌 상태로 시작하여 인증서 목록 테이블이 화면 가로폭을 시원하게 사용할 수 있도록 기본값 최적화.

### 🚀 [v1.6.5] - 2026-10-25
**변경 구분**: `PATCH` (최좌측 1번 인덱스(1, 2, 3...) 일원화, DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 로그 인덱스 열 신설, C# 빌드 오류 CS0103 해소)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **최좌측 1번부터 시작하는 인덱스(번호: 1, 2, 3...) 전면 도입 및 일원화 (Web & WPF)**:
  - **사용자 요청 사항**: "Web(React)과 데스크톱(WPF)의 모든 테이블에서 최좌측 1번 인덱스 부터 시작"
  - **웹(React) 모달 및 테이블 전체 1-based 동기화**: 메인 인증서 테이블(`CertificateList.tsx`), 간편 백업(`BackupModal.tsx`), 백업 이력(`BackupHistoryPanel.tsx`), USB ➔ PC 가져오기(`UsbToPcModal.tsx`), 만료 정리(`CertificateCleanupModal.tsx`), 휴지통(`TrashModal.tsx`), 작업완료 안내(`OperationCompleteModal.tsx`), 갱신 안내(`RenewalGuidanceModal.tsx`), USB 감지 팝업(`UsbDetectedPromptModal.tsx`) 등 전체 뷰에서 순번을 1부터 시작(`1, 2, 3...`)하도록 일원화.
  - **데스크톱(WPF) DataGrid 및 대화상자 전체 1-based 정합성 확보**: 메인 DataGrid (`MainWindow.xaml`), PC ➔ USB 복사 (`PcToUsbTransferDialog.xaml`), USB ➔ PC 가져오기 (`UsbTransferDialog.xaml`), 만료 정리 (`ExpiredCleanupDialog.xaml`), 휴지통 (`TrashDialog.xaml`), 백업 이력 (`BackupHistoryDialog.xaml`), 작업 로그 (`ActivityLogDialog.xaml`), 작업완료 안내 (`OperationCompleteDialog.xaml`).
  - **자동 카운팅 데이터 바인딩**: ViewModel 및 컴포넌트 목록 바인딩 시 정렬 및 검색 필터링 상태에 맞춰 1부터 시작하는 순번(`IndexNumber = i + 1`)이 실시간 계산 및 자동 할당되도록 구현.
- **최좌측 인덱스(번호) 열 상시 고정(Frozen & Sticky Column) 보장 (데스크톱 & 모바일 뷰 전면 대응)**:
  - **WPF DataGrid 6종 `FrozenColumnCount="1"` 적용**: 메인 인증서 DataGrid, 백업 이력, 휴지통, 작업 로그, PC ➔ USB 복사, USB ➔ PC 가져오기 창에서 가로 스크롤바를 우측으로 끝까지 패닝하더라도 최좌측 1번 인덱스(번호) 열이 화면 좌측에 단단히 고정되어 항상 표시됨.
  - **React Web `sticky left-0` 고정 열 구축**: 모바일 및 좁은 화면/가로 스크롤 상태에서도 `CertificateList.tsx`의 1번 인덱스 열에 `sticky left-0 z-10` 및 테마별 배경색(`bg-slate-50 dark:bg-slate-900`)을 적용하여 컬럼이 배경에 묻히거나 스크롤에 밀려 사라지지 않도록 UI 개선.
- **작업 로그(Activity Log) 대화상자 고정 1-based 번호 열 신설 및 동적 재색인 연동**:
  - `AppLogItem.cs`: 감사 로그 모델에 `public int IndexNumber { get; set; }` 신설.
  - `ActivityLogDialog.xaml`: `FrozenColumnCount="1"` 및 1번 인덱스 텍스트 컬럼(`<DataGridTextColumn Header="번호" Binding="{Binding IndexNumber}" Width="50" ... />`) 신규 추가.
  - `ActivityLogService.cs`: 신규 로그 추가 시 최신 항목을 1번으로 지정하고, 기존 로그 항목들의 번호를 1부터 시작하도록 자동 재색인(`_logs[i].IndexNumber = i + 1;`)하여 일관된 번호 체계 유지.
- **앱 시작 시 인증서 상세 정보 사이드바 기본 해제(닫힘) 상태 적용 (`MainViewModel.cs`)**:
  - 앱 첫 실행 시 우측 상세 정보 사이드바가 기본적으로 닫힌 상태(`_isCertificateDetailSidebarVisible = false`)로 구동되어 메인 인증서 보관함 DataGrid가 화면 전체 가로 폭을 시원하게 활용하도록 개선.
- **인증서 보관함 목록 "인증서 명칭 (CN) 및 경로 상태" 컬럼 동적 가로폭 조정 보장 (`MainWindow.xaml`, `CertificateList.tsx`)**:
  - 고정 폭(`Width="640"`) 대신 반응형 가변 너비(`Width="*" MinWidth="260"`)를 부여하여, 창 크기를 줄이거나 늘릴 때, 또는 상세 사이드바를 열고 닫을 때 컬럼이 억지로 강제 고정되지 않고 유연하게 늘어나고 줄어들도록 교정.
- **C# .NET 10 / .NET 8 릴리스 빌드 오류 CS0103 해소 (`MainViewModel.cs`)**:
  - `MainViewModel.cs` 내 백업 히스토리 삭제/새로고침 시 호출되는 `UpdateBackupHistoryIndices()` 메서드 정의 누락으로 발생하던 빌드 에러(`error CS0103: The name 'UpdateBackupHistoryIndices' does not exist in the current context`)를 완벽하게 해소하여 GitHub Actions 및 로컬 빌드 무결성 확보.

### 🚀 [v1.6.4] - 2026-10-25
**변경 구분**: `PATCH` (작업완료 안내 팝업창 생성, 창 제어 버튼 고정, 가로 스크롤바 사라짐 방지)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **작업완료 안내 전용 팝업창(Operation Complete Modal/Dialog) 신설 (Web & WPF 전면 연동)**:
  - **사용자 요청 사항**: 기존에 복사/백업/가져오기 작업 성공 후 수 초 뒤 사라지는 하단 토스트나 일반 윈도우 단색 알림창 대신, 상세 완료 내역을 한눈에 확인하고 필요한 후속 조치를 취할 수 있는 전용 팝업창(모달 대화상자) 신규 구현.
  - **공통 주요 구성 요소**:
    - **에메랄드 성공 헤더 배너**: 작업 성공 배지(SUCCESS), "🛡️ SHA-256 데이터 무결성 검증 통과" 실드 배지, 명확한 작업 타이틀 및 설명.
    - **3대 핵심 메트릭 카드**: 복사 완료 건수(N건 성공), 데이터 무결성(SHA-256 100% 일치), 완료 시각(년-월-일 시:분:초).
    - **복사 경로 시각화 (Route Flow)**: 출발지(Source, 예: 내 컴퓨터 AppData\LocalLow\NPKI) ➔ 도착지(Destination, 예: E:\NPKI 이동식 USB)를 한눈에 볼 수 있는 경로 카드.
    - **복사 완료 인증서 목록 (Certificate ListBox/Card)**: 복사된 인증서 이름(소유자명 CN), 발급기관 및 정책, 전자서명 키 페어(`signCert.der + signPri.key`) 검증 배지.
    - **작업 완료 후 활용 가이드 (Practical Next Steps Guide)**:
      - USB 대상: 타 PC 은행/정부24 로그인 시 [이동식 디스크] 선택 방법 및 윈도우 트레이 '하드웨어 안전하게 제거' 권장 수칙 안내.
      - PC 대상: 웹 브라우저/금융 프로그램에서 [하드디스크] 즉시 사용 방법 및 공용 PC 사용 시 삭제 보안 수칙 안내.
    - **원클릭 편의 액션 버튼**:
      - `[📋 결과 텍스트 복사]`: 작업 완료 보고서 요약 텍스트 클립보드 복사.
      - `[📁 대상 폴더 열기]`: 파일 탐색기(Explorer)로 저장된 대상 폴더 즉시 열기 (WPF).
      - `[📜 백업 이력 보기]`: 백업/복사 히스토리 패널로 즉시 이동 (Web).
      - `[✓ 확인 (닫기)]`: 팝업 닫기.
  - **WPF 데스크톱 네이티브 연동**: `OperationCompleteDialog.xaml`, `.xaml.cs` 및 `UserFriendlyMessageHelper.ShowOperationComplete(...)`를 구축하여 `MainViewModel`, `PcToUsbTransferViewModel`, `UsbTransferViewModel`에서 복사 성공 시 즉시 팝업.
  - **React 웹 에디션 연동**: `OperationCompleteModal.tsx` 구축 및 `App.tsx`의 `handleBackupSuccess`, `handleImportFromUsbSuccess`에 전면 연동.
- **오른쪽 상단 윈도우 창 제어 버튼(최소화 / 최대화 / 닫기) 독립 고정 및 창 크기 변경 시 상시 노출 보장 (`MainWindow.xaml`)**:
  - 기존 헤더 도구들과 동일 `StackPanel`에 함께 묶여 있어 창 크기를 줄였을 때 화면 밖으로 밀려나 사라지던 구조적 결함 해결.
  - 상단 타이틀바 Grid의 `Column="1" (*)`에 헤더 기능 도구들을 격리하고, `Column="2" (Auto)`에 오직 최소화(`─`), 최대화/복원(`□`), 닫기(`✕`) 버튼만을 독립 배치.
  - 창 크기를 최소 규격(`MinWidth="1100"`)이나 소형 디스플레이 해상도로 축소하더라도 창 제어 버튼이 항상 화면 최우측 상단에 100% 온전하게 고정 노출되어 클릭 및 조작 보장.
- **인증서 목록(CertificateList) 항목 간 수평 구분선(border-bottom) 및 선택/비선택 시각적 간격 고도화 (`CertificateList.tsx`)**:
  - 각 인증서 행(`<tr>`) 간 명확한 수평 구분선(`border-b border-slate-200/90`, 다크 테마 `border-b-slate-800`)을 적용하여 대량의 인증서 열람 시 가독성과 행 식별력 대폭 개선.
  - 비선택 행에 `border-l-4 border-l-transparent`를 부여하여 선택 시 컬럼 텍스트가 좌우로 흔들리는 레이아웃 점핑 현상 방지.
  - 선택된 행에는 `py-4`의 여유로운 수직 패딩, `border-l-4 border-l-blue-600`, `border-b-2 border-b-blue-400`, `shadow-xs` 및 은은한 배경 하이라이트를 부여하여 비선택 행(`py-3.5`)과의 명확한 시각적 층위 및 간격을 형성.
- **인증서 보관함 목록 DataGrid 상시 가로바(가로 스크롤바) 사라짐 방지 및 고정 최적폭 지정 (`MainWindow.xaml`, `App.xaml`, `CertificateList.tsx`)**:
  - `CertDataGrid`의 가변 너비(`Width="*"`) 컬럼을 확정 너비(`Width="640" MinWidth="520"`)로 전환하여 사이드바를 닫거나 창을 최대화할 때 스크롤 영역이 0으로 수축되어 가로바가 사라지던 결함을 완벽 해결.
  - 논리 스크롤 대신 픽셀 단위 물리 스크롤(`ScrollViewer.CanContentScroll="False"`)을 활성화하여 컬럼 점프 없는 부드러운 가로 패닝 지원.
  - 스크롤바 트랙 배경(`#161B26`) 및 상단 경계선(`#2D3546`), 비활성 인디케이터(`InactiveThumb`)를 도입하여 어떠한 화면 배율에서도 가로바 트랙 구조가 배경에 묻혀 소멸되지 않도록 보장.
  - 웹 관리 콘솔(`CertificateList.tsx`) 테이블의 최소 가로폭을 `min-w-[1280px]`로 상향하여 상시 가로 스크롤 활성화.
- **PC ➔ USB/디스크 복사창 목적지 드라이브 기본 C: 드라이브 자동 선택 및 콤보박스 상시 활성화 (`PcToUsbTransferDialog.xaml`, `PcToUsbTransferViewModel.cs`)**:
  - 이동식 USB 메모리가 꽂혀 있지 않은 상태에서도 로컬 시스템 드라이브(`C:\ [로컬 디스크 (시스템)]`) 및 연결된 모든 준비된 디스크를 콤보박스에 표시하고 기본값으로 자동 선택.
  - 드라이브 선택 콤보박스 비활성화(`IsEnabled="False"`)를 제거하여 상시 활성화(`IsEnabled="True"`)로 전환.
- **인증서 목록(DataGrid) 상시 노출 및 화면 차단(블로커) 제거**:
  - USB 미연결 시 인증서 목록 전체를 가리던 전면 빈 화면 블로커를 제거하고, 인증서 목록(DataGrid)을 상시 표시하도록 개선.
  - USB 미연결 시 상단에 컴팩트 안내 팁 배너(`💡 이동식 USB 메모리가 연결되지 않아 기본 로컬 디스크(C:\)가 선택되었습니다...`)를 제공하여 인증서 선택 및 열람을 방해하지 않음.
- **로컬 디스크(C:\) 복사 및 USB 복사 동시 지원**:
  - 복사 실행 버튼 텍스트를 대상 드라이브에 따라 동적 전환(`선택한 인증서 USB로 복사 시작` 또는 `선택한 인증서 디스크(C:)로 복사 시작`).
  - C: 드라이브 선택 시 권한 거부 오류 방지를 위해 표준 보관소(`AppData\LocalLow\NPKI`)로 안전 라우팅.

### 🚀 [v1.6.3] - 2026-10-21
**변경 구분**: `PATCH` (상세 사이드바 닫힘 시 목록창 가로 반응형 자동 확장 및 시작가이드 PC➔USB 복사 창 형식 통일)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **인증서 보관함 목록창(DataGrid) 가로 전체 확장 및 여백(빈칸) 자동 채움 (`MainWindow.xaml`, `MainWindow.xaml.cs`)**:
  - 상세 정보 사이드바를 닫았을 때 발생하는 우측 빈 공간(빈칸)을 목록창이 가로로 자연스럽게 늘어나 채우도록 `ColDetailSidebar`의 너비/최대너비/최소너비 축소 로직 정규화.
  - `CertDataGrid`의 `인증서 명칭 (CN) 및 경로 상태` 컬럼에 `Width="*" MinWidth="340"`을 적용하여 창 너비 변화 및 사이드바 개폐에 맞춰 DataGrid 행 전체가 100% 가로 너비로 균등 확장되도록 지원.
- **시작가이드 PC ➔ USB 복사하기 전용 대화창 구축 및 USB ➔ PC와 창 형식 일체화 (`PcToUsbTransferDialog.xaml`, `PcToUsbTransferViewModel.cs`)**:
  - `UsbTransferDialog`와 100% 동일한 대화상자 규격(820x640)과 레이아웃(헤더, 대상 USB 메모리 선택 콤보박스 및 갱신 버튼, PC 인증서 선택 DataGrid, 중복 처리 옵션 라디오버튼 그룹, 하단 실시간 상태바 및 원클릭 복사 시작 버튼)을 갖춘 전용 `PcToUsbTransferDialog` 신설.
  - 시작가이드에서 'PC ➔ USB 복사하기' 선택 시 해당 대화창이 직관적으로 실행되어 일관된 사용자 경험 제공.

### 🚀 [v1.6.2] - 2026-10-20
**변경 구분**: `PATCH` (드라이브 쓰기 오류 및 권한 문제 시 명확한 에러 알림 모달 추가)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **인증서 복사 중 드라이브 쓰기 오류 및 권한 거부 알림 모달 구축 (`CopyErrorAlertModal.tsx`, `userFriendlyError.ts`)**:
  - USB 쓰기 금지(Write-Protected), 브라우저/시스템 파일 접근 권한 거부(Permission Denied), 저장 공간 부족(Disk Full), USB 장치 연결 해제(I/O 통신 오류) 등 실패 원인별 맞춤형 배지 및 해결 조치 체크리스트 제공.
  - 기술적 진단 로그 원클릭 복사, `[🔄 다시 시도]`, `[📁 다른 드라이브 선택]` 기능 탑재.

### 🚀 [v1.6.1] - 2026-10-20
**변경 구분**: `MINOR` (복사 완료 알림음 설정 및 볼륨 조절 슬라이더, 미리듣기 기능 추가)
#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **인증서 복사 완료 알림음(SuccessChime) 제어 기능 추가 (`audioFeedback.ts`, `SettingsModal.tsx`)**:
  - Web Audio API 하모닉 완료음 ON/OFF 토글 및 0~100% 볼륨 조절 슬라이더, 소리 미리듣기 테스트 및 볼륨 프리셋 제공 (`localStorage` 저장).

### 🚀 [v1.5.0] - 2026-10-08 / 최신 패치 (2026-10-14)
**변경 구분**: `MINOR` (마이너 대규모 기능 통합 - 시작 작업 선택 창, 순서별 가이드 모션 오버레이, SHA-256 무결성 확인 완료 실드 배지, 자가 복사 금지 필터링, 대상 지정 복사 팝업, 테마 드롭다운 등 Web/WPF 네이티브 완벽 동기화 및 릴리스)
#### ✨ 최근 긴급 패치 (2026-10-14 KST)
- **시작가이드 복사 오류 및 선택 오류 완벽 교정**:
  - `PC ➔ USB 복사하기` 가이드 모션 실행 시 PC 로컬 인증서가 1순위로 자동 선택되도록 개선.
  - DataGrid 행 선택 시 체크박스 및 선택 상태 동기화 누락을 해결(`CertDataGrid_SelectionChanged`).
  - 동일 드라이브 문자(루트 `C:\ == C:\`) 오판단으로 인해 AppData에서 C:\NPKI 등 다른 폴더로 복사 시에도 '자가 복사'로 오인하여 건너뛰던 결함을 정밀 교정.
  - 파일 덮어쓰기 시 Windows 읽기 전용(`ReadOnly`) 속성으로 인한 `UnauthorizedAccessException` 오류 방지 로직 적용(`FileAttributes.Normal`).
  - 가이드 배너에 `[⚡ 지금 대상 USB로 복사 시작]` 버튼을 직접 제공하여 즉각 복사 창 호출 지원.
- **인증서 전체 규격 및 상세 내용 조회용 가로/세로 스크롤 사이드바 구축**:
  - 메인 인증서 DataGrid에 `HorizontalScrollBarVisibility="Auto"` 및 `VerticalScrollBarVisibility="Auto"` 적용.
