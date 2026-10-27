# 📝 K-Certificate Manager 패치노트 (Release Notes)

본 문서는 **K-인증서 매니저(K-Certificate Manager)**의 버전별 변경 이력, 신규 기능, 보안 패치 및 버그 수정 사항을 상세히 기록한 공식 릴리스 문서입니다.

---

## 📌 버전 명명 규칙 (Semantic Versioning 2.0.0)

- **`MAJOR` (주 버전, X.0.0)**: 기존 아키텍처와 호환되지 않는 대규모 구조 변경 또는 핵심 보안 엔진의 전면 개편.
- **`MINOR` (부 버전, 1.X.0)**: 하위 호환성을 유지하면서 새로운 기능 추가 (예: 알림음 설정 및 볼륨 조절, 에러 알림 모달 추가 등).
- **`PATCH` (수정 버전, 1.4.X)**: 하위 호환성을 유지하는 버그 수정, 성능 최적화, 보안 하드닝 패치 및 UI/UX 개선.

> **💡 개발 수칙**: 코드 수정 시 특이점이나 기능 확장이 발생하면 본 패치노트에 기록하고 버전을 업데이트하며, 앱 화면(`src/version.ts`, 헤더/사이드바) 및 자동 빌드 스크립트(`build.bat`)의 버전 표기를 동시에 동기화해야 합니다.

---

## 📋 버전 릴리스 내역

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
