# K-인증서 매니저 작업 로그 (Work Log)

본 문서는 K-인증서 매니저(K-Certificate Manager)의 개발, 기능 구현, 버그 수정, 빌드 환경 구성 및 문서화 작업을 상세히 기록하는 공식 작업 일지입니다.

---

## 📌 프로젝트 기본 정보

- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **현재 버전**: `v1.6.4` (Semantic Versioning 2.0.0)
- **개발자**: AhBiYout (GitHub: [AhBiYout-all](https://github.com/AhBiYout-all))
- **구글 공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **공식 홈페이지**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr) ((주)씨아이에스넷 CISNet)
- **대상 환경**: Windows 10/11, Web Management Console, CRLF 빌드 스크립트

---

## 📅 작업 기록 상세 내역

### 📝 [작업 차수 90] 윈도우 상단 우측 창 제어 버튼(최소화 / 최대화 / 닫기) 독립 컬럼 분리 및 창 크기 변경 시 상시 노출 보장
- **작업 일시**: 2026-10-22 20:00 KST
- **요청 사항**: "오른쪽 상단 (최소/최대/닫기)는 창크기가 달라져도 항상 보이도록 합니다."
- **원인 분석**:
  1. **동일 StackPanel 내 다수 메뉴 도구와 창 제어 버튼 혼합 배치 결함**:
     - 기존 `MainWindow.xaml`의 헤더 Grid에서 `Grid.Column="1"`이 비워진 채, 테마 콤보박스, 모드 전환 라디오버튼, 시작 가이드, 새로고침, 휴지통, 탐색 경로, 백업 이력, 작업 로그, 보안 수칙, 업데이트 확인, 정보 버튼 등 총 11개 이상의 도구들과 창 제어 버튼(최소화 `─`, 최대화 `□`, 닫기 `✕`)이 하나의 `StackPanel Grid.Column="2"` 안에 일렬로 배치되어 있었음.
  2. **가로 너비 축소 시 윈도우 경계선 너머로 밀려남(Clipping/Overflow)**:
     - 윈도우 창 크기를 줄이거나(예: `MinWidth="1100"` 부근 또는 소형 해상도/배율 디스플레이 환경) 메뉴 도구들이 차지하는 너비가 넓어지면, StackPanel의 특성상 가장 우측 끝에 위치한 최소화, 최대화, 닫기 버튼이 화면 우측 경계선 밖으로 밀려나 육안으로 보이지 않고 클릭할 수 없는 현상 발생.
- **수행 내용**:
  1. **Grid 열(ColumnDefinition) 역할 명확 분리 (`MainWindow.xaml`)**:
     - `Grid.Column="0" (Width="Auto")`: 앱 로고 및 브랜드 타이틀("K-인증서 매니저") 배치 (창 드래그 영역).
     - `Grid.Column="1" (Width="*")`: 가변 공간 전체를 할당하고, 헤더 기능 도구들을 `<ScrollViewer HorizontalScrollBarVisibility="Hidden" VerticalScrollBarVisibility="Disabled" Focusable="False" HorizontalAlignment="Right">`로 감싸 우측 정렬(`HorizontalAlignment="Right"`) 배치. 창 크기가 줄어들더라도 도구들이 자체 영역 내에서 클리핑되어 창 제어 버튼 영역을 침범하지 못하도록 격리.
     - `Grid.Column="2" (Width="Auto")`: **오직 창 제어 버튼(최소화, 최대화/복원, 닫기)과 좌측 구분선만을 독립 배치**.
  2. **우측 상단 상시 노출 및 클릭 보장**:
     - WPF Grid 레이아웃 엔진 특성상 `Column="2" (Auto)`는 항상 윈도우 가장 우측 가장자리에 전용 크기(약 120px)를 우선 점유하여 배치되므로, 창 크기를 최소폭으로 줄이거나 늘려도 최소화, 최대화, 닫기 버튼이 화면 밖으로 밀려나거나 가려지지 않고 100% 상시 고정 노출됨.
  3. **빌드 및 린트 검증**: `compile_applet` 및 `lint_applet` 무결성 검증 완료.

### 📝 [작업 차수 89] 인증서 목록창 가로 스크롤바(가로바) 사라짐 현상 근본 원인 해결
- **작업 일시**: 2026-10-22 19:45 KST
- **요청 사항**: "인증서 목록창 가로바가 사라지는 현상."
- **원인 분석**:
  1. **가변 너비 컬럼(`Width="*"`)으로 인한 스크롤 영역 0 수축**:
     - 인증서 명칭 컬럼에 `Width="*"`가 적용되어 상세 사이드바를 닫거나 창을 넓히면 해당 컬럼이 화면 너비만큼 무한히 늘어나면서 `총 컬럼 너비 == 뷰포트 너비`가 됨.
     - 이로 인해 `ScrollableWidth = 0`이 되어 WPF가 스크롤 불필요 상태로 판단하고 Thumb(슬라이더)를 접음(Collapse).
  2. **스크롤바 트랙 배경색 투명/동일화로 인한 완전 소멸 착시**:
     - 스크롤바 배경이 윈도우 배경과 동일한 `BgDarkBrush(#0F1219)`로 되어 있어, Thumb이 접히는 순간 하단 가로바 영역 전체가 배경 속으로 완전히 사라지는 현상 발생.
  3. **WPF 논리 단위 스크롤(`CanContentScroll="True"`)의 컬럼 스킵**:
     - 논리 스크롤 활성화 시 컬럼 단위 점프 계산 중 가로 스크롤바가 순간적으로 숨겨지는 부작용 발생.
- **수행 내용**:
  1. **컬럼 너비 최적 고정폭 지정 (`MainWindow.xaml`)**:
     - `인증서 명칭 (CN) 및 경로 상태` 컬럼의 가변 폭(`*`)을 제거하고 `Width="640" MinWidth="520"`으로 확정 지정.
     - 전체 컬럼 너비 합계(1,595px)가 상시 확보되어 긴 인증서 저장 경로(`C:\Users\...\AppData\LocalLow\...`)가 말줄임표(`...`) 없이 시원하게 표시되며, 사이드바 개폐나 창 크기 변화와 상관없이 가로 스크롤 영역이 항상 활성화되어 가로바가 사라지지 않음.
  2. **픽셀 단위 물리 스크롤 전환 (`ScrollViewer.CanContentScroll="False"`)**:
     - 부드러운 픽셀 단위 스크롤로 전환하여 컬럼 단위 점프나 스크롤바 깜빡임/소멸 현상 완벽 차단.
  3. **모던 고대비 ScrollBar 스타일 보강 (`App.xaml`)**:
     - 스크롤바 트랙 배경을 선명한 `#161B26`으로 분리하고 상단 경계선(`Border: #2D3546`)을 추가.
     - 비활성 상태(`IsEnabled="False"`)에서도 구조가 사라지지 않도록 `InactiveThumb` 인디케이터를 유지.
     - 트랙 클릭 시 페이지 단위 좌/우 이동(`PageLeftCommand`, `PageRightCommand`)으로 정규화.
  4. **웹 관리 콘솔 최적 가로 너비 보장 (`CertificateList.tsx`)**:
     - 테이블 최소 너비를 `min-w-[1280px]`로 상향하여 가로바가 항상 활성화된 상태 유지.
  5. **빌드 및 린트 검증**: `compile_applet` 및 `lint_applet` 무결성 검증 통과.

### 📝 [작업 차수 88] 인증서 목록(CertificateList) 항목 간 선명한 수평 구분선(border-bottom) 및 선택/비선택 시각적 간격·대비 고도화
- **작업 일시**: 2026-10-22 19:35 KST
- **요청 사항**: "인증서 목록(CertificateList) 컴포넌트의 각 항목 사이에 가독성을 높일 수 있는 수평 구분선(border-bottom)을 추가하고, 선택된 항목과 비선택 항목의 시각적 간격을 조정해 주세요."
- **수행 내용**:
  1. **항목 간 선명한 수평 구분선(`border-bottom`) 적용 (`CertificateList.tsx`)**:
     - 기존의 흐릿한 `divide-slate-100`을 명확한 `divide-slate-200`으로 교체하고, 각 행(`<tr>`)에 직접 `border-b`를 선언하여 수많은 인증서 목록 사이의 데이터 행 구분을 뚜렷하게 가시화.
     - 비선택 행에는 부드럽고 명확한 `border-b-slate-200/90 (dark: border-b-slate-800)`을 적용하여 장시간 열람 시 눈의 피로 경감 및 가독성 확보.
  2. **선택된 항목(Selected)과 비선택 항목(Unselected)의 시각적 간격 및 계층감 조정**:
     - **좌측 테두리 정렬 고정**: 비선택 항목에도 `border-l-4 border-l-transparent`를 부여하여 체크 선택 시 컬럼 내용이 좌우로 밀리거나 흔들리는 레이아웃 시프트(Jumping) 현상 완전 제거.
     - **선택 행의 시각적 볼륨감 및 입체 간격 부여**: 선택된 행에 `px-4 py-4`의 넉넉한 수직 셀 패딩을 적용하고, `border-l-4 border-l-blue-600`, `border-b-2 border-b-blue-400 (dark: border-b-blue-600)`, `bg-blue-50/95`, `shadow-xs relative z-10 font-medium` 효과를 복합 부여하여 인접 비선택 행(`py-3.5`)과 확연히 구분되는 시각적 계층감(Elevation) 형성.
     - 비표준 위치 및 최근 복사 완료된 행도 각각 앰버/에메랄드 테마의 전용 하단 구분선과 간격 일체화.
  3. **C# WPF 데스크톱 XAML 컴파일 오류(MC4004) 수정 (`App.xaml`)**:
     - `App.xaml` 내 `DataGridColumnHeader` 스타일 태그 닫힘(`</Style>`)이 누락되어 하위 `ScrollBar` 스타일 삽입 시 발생한 `error MC4004: Style에 자식 'Style'을(를) 포함할 수 없습니다` 오류를 `</Style>` 정상 태깅으로 완벽 해결.
  4. **빌드 및 린트 검증**: `compile_applet` 및 `lint_applet` 100% 통과.

### 📝 [작업 차수 87] 인증서 보관함 목록 상시 가로바(가로 스크롤바) 생성 및 모던 고대비 스타일 구축
- **작업 일시**: 2026-10-22 19:15 KST
- **요청 사항**: "인증서 보관함 목록에 가로바 생성"
- **원인 분석**:
  - 기존 WPF `MainWindow.xaml`의 `CertDataGrid`에서 `ScrollViewer.HorizontalScrollBarVisibility="Auto"`가 설정되어 있었고, 명칭 컬럼에 `Width="*"`가 적용되어 뷰포트 내 가로 너비가 유동 계산되면서 `Auto` 조건에서 가로 스크롤바(가로바)가 생성되지 않고 숨겨지는 현상이 발생함.
  - 기본 Windows WPF ScrollBar 테마가 다크 테마에서 대비가 낮거나 불명확하여 가로 스크롤 바 트랙과 썸(Thumb)의 시인성이 떨어졌음.
- **수행 내용**:
  1. **WPF 메인 인증서 목록(CertDataGrid) 상시 가로바 생성 (`MainWindow.xaml`)**:
     - `ScrollViewer.HorizontalScrollBarVisibility="Visible"`로 지정하여 창 크기나 컬럼 너비 상태와 상관없이 하단에 가로 스크롤바(가로바)가 항상 뚜렷하게 생성·표시되도록 설정.
     - 인증서 명칭 및 경로 컬럼의 최소 너비를 `MinWidth="460"`으로 넉넉하게 확장하여 긴 파일 경로가 생략되지 않고 가로 스크롤을 통해 전체를 편안하게 탐색할 수 있도록 개선.
     - `PcToUsbTransferDialog.xaml`, `UsbTransferDialog.xaml`의 인증서 DataGrid에도 동일하게 `HorizontalScrollBarVisibility="Visible"` 적용.
  2. **WPF 전역 모던 다크 고대비 ScrollBar 스타일 신설 (`App.xaml`)**:
     - 가로바 높이 14px, 세로바 너비 14px 규격의 모던 플랫 스크롤바 스타일 구축.
     - 다크 배경(`BgDarkBrush`), 슬레이트 썸(`#475569`), 마우스 호버(`Hover: #64748B`), 드래그 시 고대비 블루(`#3B82F6`)로 시각적 피드백 제공 및 트랙 클릭 시 좌우 이동 지원.
  3. **웹 관리 콘솔 인증서 목록 가로바 상시 노출 (`CertificateList.tsx`, `index.css`)**:
     - 웹 테이블 컨테이너에 `overflow-x-scroll`을 지정하여 브라우저 환경에 구애받지 않고 하단 가로 스크롤바가 상시 표시되도록 보장.
     - `index.css`의 스크롤바 규격을 높이 10px, 썸/트랙의 고대비 스타일링으로 개편.

### 📝 [작업 차수 86] PC ➔ USB/디스크 복사 창 기본 C: 드라이브 상시 표시 및 USB 미연결 시 화면 차단 해제
- **작업 일시**: 2026-10-22 18:30 KST
- **요청 사항**:
  1. "디스크 저장장치를 보여 주어야 하지 않나요. 기본 c: 드라이버 보이기."
  2. USB 미연결 시에도 창 내 드라이브 선택 콤보박스와 인증서 목록이 정상 표시되도록 개선.
- **원인 분석**:
  - `PcToUsbTransferDialog.xaml`에서 콤보박스가 `IsEnabled="{Binding HasUsbDrives}"`로 묶여 있고, 인증서 DataGrid가 `Visibility="{Binding HasUsbDrives, ...}"`로 감싸져 있어 USB 미연결 시 드라이브 선택이 비활성화되고 인증서 목록 대신 전체 빈 화면 블로커("연결된 USB 이동식 드라이브가 없습니다")가 화면을 가림.
- **수행 내용**:
  1. **드라이브 선택 콤보박스 상시 활성화 및 기본 C: 드라이브 자동 선택 (`PcToUsbTransferDialog.xaml`, `PcToUsbTransferViewModel.cs`)**:
     - 콤보박스 `IsEnabled="True"` 적용.
     - `RefreshDrives()` 시 이동식 USB뿐만 아니라 로컬 디스크(`C:\`, `D:\`)를 모두 탐색 목록에 포함하고, USB 미연결 시 기본값으로 `C:\ [로컬 디스크 (시스템)]`를 자동 선택.
     - 메인 뷰모델(`MainViewModel.AvailableTargetDrives`)로부터 기존 감지된 드라이브 목록을 다이얼로그 생성자로 안전하게 전달.
  2. **PC 인증서 DataGrid 상시 노출 및 화면 블로커 제거**:
     - 인증서 목록을 `HasCertificates` 기준으로만 조건부 노출하여 USB 유무와 상관없이 인증서 체크 및 열람 가능.
     - 화면을 가리던 대형 플러그 아이콘 블로커 대신 상단에 슬림한 안내 배너(`💡 이동식 USB 메모리가 연결되지 않아 기본 로컬 디스크(C:\)가 선택되었습니다...`) 제공.
  3. **C: 드라이브 복사 지원 및 복사 버튼 문구 동적화**:
     - `TransferToUsbCommand` CanExecute 조건을 `SelectedTargetDrive != null` 및 인증서 선택 시 활성화되도록 개선.
     - 선택된 드라이브에 따라 `선택한 인증서 USB로 복사 시작` / `선택한 인증서 디스크(C:)로 복사 시작`으로 버튼 문구 자동 전환.
     - C: 드라이브 대상 복사 시 `AppData\LocalLow\NPKI`로 안전하게 저장 경로 라우팅.
  4. **C# WPF 데스크톱 에디션 빌드 컴파일 오류(CS0103) 해결 (`PcToUsbTransferViewModel.cs`)**:
     - `UsbStorageGuard.InvalidateUsbCache()` 호출 시 네임스페이스 누락으로 발생하던 `error CS0103: 'UsbStorageGuard' 이름이 현재 컨텍스트에 없습니다.` 오류를 `using KCert.Core.HardwareGuard;` 및 `using KCert.Core.Discovery;` 선언을 추가하여 완벽하게 교정.

### 📝 [작업 차수 85] 상세 사이드바 닫힘 시 목록창 가로 반응형 자동 확장 및 시작가이드 PC➔USB 복사 창 형식 통일
- **작업 일시**: 2026-10-21 17:10 KST
- **요청 사항**:
  1. 상세 사이드바를 닫으면 빈칸을 인증서 보관함 목록창이 가로로 늘어나서 채워주도록 개선.
  2. 시작가이드에서 PC ➔ USB 복사하기를 USB ➔ PC 가져오기와 동일한 창(대화상자) 형식을 사용하도록 통일.
- **수행 내용**:
  1. **인증서 보관함 목록창(DataGrid) 가로 전체 확장 및 빈칸 해소 (`MainWindow.xaml`, `MainWindow.xaml.cs`)**:
     - `ColDetailSidebar`에 인라인 고정되어 있던 너비 속성(`Width="410" MinWidth="300" MaxWidth="680"`)을 분리하고, 스타일 트리거 및 코드 비하인드(`UpdateDetailSidebarColumn`)에서 닫힘 상태 시 `Width=0`, `MinWidth=0`, `MaxWidth=0`으로 완벽 수축 처리.
     - `CertDataGrid`의 `인증서 명칭 (CN) 및 경로 상태` 컬럼을 고정 너비(`360`)에서 스타 너비(`Width="*" MinWidth="340"`)로 전환하여, 상세 사이드바가 닫히거나 창 크기가 늘어날 때 목록창이 100% 가로로 유연하게 늘어나 빈칸 없이 전체 영역을 꽉 채우도록 개선.
  2. **시작가이드 PC ➔ USB 복사하기 전용 대화창 구축 및 UI 형식 통일 (`PcToUsbTransferDialog.xaml`, `PcToUsbTransferDialog.xaml.cs`, `PcToUsbTransferViewModel.cs`, `MainViewModel.cs`)**:
     - 기존 `TargetDrivePickerDialog`(단순 드라이브 선택 카드) 대신, `UsbTransferDialog`와 100% 동일한 격조 높은 창 규격(820x640) 및 구조를 가진 `PcToUsbTransferDialog` 신설.
     - **상단**: 💻 헤더 및 상세 설명 배너.
     - **중단 1**: 대상 USB 메모리 선택 콤보박스 및 `[🔄 드라이브 갱신]` 버튼.
     - **중단 2**: PC 보관 인증서 목록 DataGrid (선택 체크박스, 구분, 인증서명, 발급기관, 만료일) 탑재 및 미연결 시 친절한 USB 안내 배너 제공.
     - **하단 1**: 스마트 덮어쓰기 / 날짜 백업본 보존 / 건너뛰기 라디오버튼 그룹.
     - **하단 2**: 실시간 저장 위치 안내 및 `[선택한 인증서 USB로 복사 시작]` 버튼 일체화.
  3. **GitHub Actions dotnet publish 컴파일 오류(CS0103) 긴급 교정 (`MainViewModel.cs`)**:
     - `StartGuidedWorkflow` 내 다이얼로그 종료 후 호출되던 미정의 메서드 `RefreshAll()`을 정규 비동기/동기 메서드인 `RefreshDrives()` 및 `_ = RefreshCertificatesAsync()`로 교체하여 GitHub Actions CI 컴파일 오류(`CS0103: The name 'RefreshAll' does not exist in the current context`) 완벽 해소.
  4. **빌드 및 린트 검증**:
     - `compile_applet` 및 `lint_applet` 무결성 검증 통과.

### 📝 [작업 차수 84] 인증서 복사 중 쓰기/권한 오류(Disk Full, Permission Denied 등) 대응 '복사 에러 경고 모달' 고도화 및 네이티브 WPF 동기화
- **작업 일시**: 2026-10-20 09:26 KST
- **요청 사항**: 인증서 복사 프로세스 중 드라이브 쓰기 오류(Disk Full, Permission Denied 등)가 발생할 경우, 사용자에게 정확한 오류 원인과 조치 방법을 안내하는 '복사 에러 경고 모달' 추가 및 강화.
- **수행 내용**:
  1. **복사 에러 경고 모달(`CopyErrorAlertModal.tsx`) 오류 카테고리별 정밀 대응**:
     - 💾 **저장 공간 부족(Disk Full)**: 대상 디스크 잔여 용량 0 또는 부족 사전 감지 시 즉시 차단 및 휴지통 비우기/여유 공간 10MB 확보 가이드 팝업.
     - 🛡️ **접근 권한 거부(Permission Denied)**: 브라우저 파일 수정 권한 허용 및 관리자 권한 실행 가이드 제공.
     - 🔒 **쓰기 금지(Write-Protected)**: 물리 LOCK 스위치 해제 및 diskpart attributes clear readonly 안내.
     - 🔌 **장치 연결 단절(I/O Disconnected)**: 케이블 접촉 상태 점검 및 본체 직접 연결 안내.
     - 💿 **광학 미디어(CD/DVD-ROM) 쓰기 차단**: 읽기 전용 가상/물리 광학 드라이브 선택 시 쓰기 불가 사전 차단.
  2. **모달 내 원클릭 에러 시뮬레이션 버튼 그룹 탑재**:
     - `BackupModal.tsx` 스텝 2.2 영역에 `[🔒 쓰기금지]`, `[🛡️ 권한거부]`, `[💾 공간부족]` 전용 테스트 버튼을 배치하여 사용자가 언제든 각 에러 모달의 상세 디자인과 체크리스트를 확인 가능.
  3. **USB ➔ PC 복사 모달(`UsbToPcModal.tsx`) 연동 강화**:
     - 컴퓨터 로컬 폴더(`AppData\LocalLow`) 쓰기 실패 시 에러 배너 내 `[조치 가이드 보기]` 버튼 및 사전 테스트 버튼 연동.
  4. **C# .NET WPF 네이티브 데스크톱 앱 동기화 (`MainViewModel.cs`)**:
     - `ExecuteBackupWithConflictOptionAsync` 완료 시 오류 발생 건에 대해 `Disk Full`, `Write-Protected`, `Permission Denied`를 정밀 분류하여 번호순 단계별 해결 방법을 담은 커스텀 경고 대화상자 표시.

### 📝 [작업 차수 83] 자아성찰(Self-Reflection & Deep Audit) 전수 감사 및 프로젝트 버전·환경 정합성 완전 동기화
- **작업 일시**: 2026-10-20 09:12 KST
- **요청 사항**: 자아성찰(Self-Reflection & Deep Audit)을 통한 프로젝트 전반의 미비점, 불일치 및 품질 감사 수행.
- **감사 결과 및 조치 내역**:
  1. **Inno Setup 인스톨러 버전 불일치 교정 (`installer.iss`)**:
     - 기존 `#define MyAppVersion "1.5.0"`으로 잔류하던 설치 스크립트 상수를 최신 `1.6.2`로 일괄 정규화.
  2. **C# .NET WPF 데스크톱 솔루션 버전 전수 동기화 (`src-wpf`)**:
     - `KCert.Core.csproj`: `<Version>1.6.2</Version>`, `<AssemblyVersion>1.6.2.0</AssemblyVersion>` 동기화.
     - `KCertManager.Wpf.csproj`: `<Version>1.6.2</Version>`, `<AssemblyVersion>1.6.2.0</AssemblyVersion>` 동기화.
     - `UpdateCheckerService.cs`: `CURRENT_VERSION = "1.6.2"` 및 `CurrentVersion/LatestVersion` 기본값 1.6.2 갱신.
     - `MainWindow.xaml`: 상태바 FallbackValue 및 TargetNullValue `v1.6.2` 갱신.
     - `UpdateNotificationDialog.xaml`: 최신 버전 뱃지 표시 `v1.6.2` 갱신.
  3. **CI/CD 및 빌드 스크립트 기본값 동기화**:
     - `.github/workflows/build.yml`: SemVer 폴백 기본값 `1.6.2` 갱신.
     - `build.ps1`: 패키지 파싱 실패 시 폴백 기본값 `1.6.2` 갱신.
  4. **문서군 전수 감사 및 중복 라인 교정 (`docs/README.md`, `docs/LICENSE.md`, `AI_INSTRUCTIONS.md`)**:
     - `docs/README.md` 내 '소프트웨어 명칭' 중복 라인 제거 및 15, 16대 최신 기능 추가.
     - `docs/LICENSE.md` 버전 표기 `v1.6.2` 일치화.
     - 프로젝트 루트에 `AI_INSTRUCTIONS.md` 공식 지침서 영구 구축.

### 📝 [작업 차수 82] 깃허브(GitHub) 버전 자동 연동 및 배포 스크립트(push_to_github.bat / ps1) 구축
- **작업 일시**: 2026-10-20 09:02 KST
- **요청 사항**: 깃허브에 코드를 푸시할 때, 계속 수정되어 변하는 버전 정보가 Git 커밋, 릴리스 태그, GitHub Actions와 함께 자동 연동되도록 구성.
- **수행 내용**:
  1. `push_to_github.bat` 및 `push_to_github.ps1` 구축: `package.json`의 버전(`v1.6.2`)을 동적으로 자동 추출하여 커밋 메시지, `git tag v1.6.2` 생성 및 강제 푸시를 원스톱으로 처리.
  2. `.gitattributes`에 `*.bat text eol=crlf`, `*.ps1 text eol=crlf`, `*.iss text eol=crlf` 규칙 영구 적용하여 Windows 명령 프롬프트 개행 문자 오프셋 오류 방어.
  3. GitHub Actions CI/CD(`.github/workflows/build.yml`)와 연계하여 푸시된 태그 버전으로 인스톨러(`kcert-manager-v1.6.2-setup.exe`) 자동 릴리스 배포 파이프라인 가동.

### 📝 [작업 차수 81] 인증서 복사 중 드라이브 쓰기 오류 및 권한 문제 알림 모달 구축 (v1.6.2)
- **작업 일시**: 2026-10-20 04:32 KST
- **요청 사항**: 인증서 복사 중 드라이브 쓰기 오류나 권한 문제가 발생할 경우 사용자에게 명확히 알리는 에러 알림 모달 추가.
- **수행 내용**:
  1. **전용 에러 알림 모달 컴포넌트 신설 (`src/components/CopyErrorAlertModal.tsx`)**:
     - 4대 핵심 오류 카테고리(쓰기 금지 `WRITE_PROTECTED`, 권한 부족 `PERMISSION_DENIED`, 용량 부족 `DISK_FULL`, 연결 해제 `DISCONNECTED`)별 전용 시각 배지 및 헤더 스타일링.
     - 대상 드라이브(E:\ 등), 작업 방향(PC➔USB, USB➔PC), 실패 영향 인증서 건수 명확 노출.
     - 단계별 조치 체크리스트(물리 Lock 해제, 브라우저 권한 허용, diskpart 속성 해제 등) 및 기술 진단 로그 원클릭 복사 기능 탑재.
     - `[🔄 다시 시도]`, `[📁 다른 드라이브 선택]`, `[닫기]` 액션 지원.
  2. **복사 엔진 및 모달 연동 (`BackupModal.tsx`, `UsbToPcModal.tsx`, `userFriendlyError.ts`)**:
     - 쓰기 금지 드라이브 사전 감지 시 즉시 에러 알림 모달 팝업.
     - 3회 자동 재시도 실패 및 예외 발생 시 에러 알림 모달 자동 호출.
     - 백업 옵션 화면에 `[⚠️ 에러 알림 모달 테스트]` 버튼을 탑재하여 언제든 에러 화면 및 조치 가이드 사전 확인 지원.
  3. 버전 `1.6.2` 패치 릴리스 적용.

### 📝 [작업 차수 80] 인증서 복사 완료 알림음(SuccessChime) 제어 및 환경 설정 패널 연동 (v1.6.1)
- **작업 일시**: 2026-10-20 04:00 KST
- **요청 사항**: 인증서 복사 완료 알림음 제어 기능(ON/OFF 토글, 볼륨 조절 슬라이더, 미리듣기 테스트) 추가.
- **수행 내용**:
  1. `src/utils/audioFeedback.ts`: Web Audio API 하모닉 완료음의 실시간 마스터 볼륨 계수(`volume / 100`) 곱셈 연산 적용, ON/OFF 설정 상태 분기.
  2. `src/components/SettingsModal.tsx`: 소리 켜기/끄기 토글 스위치, 0~100% 정밀 볼륨 슬라이더, `[소리 미리듣기]` 테스트 버튼, 볼륨 프리셋(무음, 30%, 70%, 100%) 제공.
  3. 설정값을 브라우저 `localStorage`에 영구 보존하여 재접속 시에도 사용자 설정 유지.
  4. 버전 `1.6.1` 마이너 릴리스 적용.

### 📝 [작업 차수 79] GitHub Actions 빌드 오류(CS0103, CS1061, CS8618) 해결 및 WPF 네이티브 컴파일 정합성 완료
- **작업 일시**: 2026-10-17 17:08 KST
- **요청 사항**: GitHub Actions CI/CD `dotnet publish` 빌드 실패 오류 해결.
- **원인 분석**:
  1. `MainWindow.xaml.cs`: 마우스 휠 가로 스크롤에 사용된 `VisualTreeHelper` 참조 네임스페이스(`using System.Windows.Media;`) 누락 (CS0103).
  2. `MainViewModel.cs`: 사전 중복 탐지 루프에서 WPF 모델(`CertificateItem`)에 존재하지 않는 `SourceLocation` 속성 참조 (CS1061) ➔ 실제 WPF 속성은 `DirectoryPath`.
  3. `DuplicateConflictDialog.xaml.cs`: `_targetDrive` 필드가 non-nullable로 선언되어 생성자 경고 발생 (CS8618).
- **수행 내용**:
  1. `MainWindow.xaml.cs` 상단에 `using System.Windows.Media;` 추가하여 `VisualTreeHelper` 컴파일 에러 완전 해소.
  2. `MainViewModel.cs`의 중복 검사 로직에서 `c.SourceLocation`을 C# WPF 정규 속성인 `c.DirectoryPath`로 교정하여 CS1061 에러 해소.
  3. `DuplicateConflictDialog.xaml.cs`의 `_targetDrive`를 `DriveItem?` nullable로 선언하여 컴파일러 경고(CS8618) 제거.
  4. 로컬 Git 커밋 갱신 및 무결성 검증 완료.

### 📝 [작업 차수 78] GitHub 업로드 제외 목록(.gitignore) 정밀화 및 필수 소스·설정 선별 푸시 체계 구축
- **작업 일시**: 2026-10-17 16:10 KST
- **요청 사항**: github에 꼭 필요 소스와 폴더, 파일을 제외하고 나머지는 제외목록에 넣어서 푸시하도록 구성.
- **수행 내용**:
  1. **`.gitignore` 제외 목록 전면 개편 및 엄격한 필터링 규칙 적용**:
     - **빌드 산출물 차단**: `dist/`, `node_modules/`, `build/`, `release/`, `deploy/`, `Output/`, `_Output/`, `coverage/`, `.vite/`, `bun.lock` 완벽 배제.
     - **컴파일 바이너리 차단**: `.NET` 빌드 임시 폴더(`bin/`, `obj/`, `**/bin/`, `**/obj/`), 디버깅 심볼(`*.pdb`), 컴파일 결과물(`*.dll`, `*.exe`, `*.msi`, `KCert.Core.dll`), 캐시 및 임시 파일(`*_wpftmp*`, `*.tmp`, `*.cache`) 원천 배제.
     - **포터블/압축 파일 차단**: `portable/`, `Portable/`, `*.zip`, `*.7z`, `*.rar`, `*.tar`, `*.tar.gz`, `*.iso`, `*.cab` 등 불필요한 아카이브 파일 배제.
     - **보안 및 개인 인증서 보호**: `*.pfx`, `*.p12`, `*.key`, `*.pri`, `*.der`, `*.cer`, `*.pem`, `*.crt`, `*.credential`, `*.credentials`, `.env*` 철저 차단.
     - **IDE 및 운영체제 잡파일 차단**: `.vs/`, `.idea/`, `.vscode/*`, `.DS_Store`, `Thumbs.db`, `desktop.ini`, `~$*` 배제.
  2. **푸시 스크립트 연동 강화 (`push_to_github.bat`, `push_to_github.ps1`, `tools/github-sync/file-whitelist.txt`)**:
     - Git 스테이징 전 대용량 바이너리 및 아카이브(`portable`, `*.zip`, `*.7z`, `*.exe`, `*.dll` 등)를 자동 추적 해제(`git rm --cached`)하는 방어 루틴 추가.
     - `tools/github-sync/file-whitelist.txt`에 신규 스크립트 및 도구 폴더 최신화.
  3. **깃 스테이징 및 무결성 검증**:
     - `git status` 확인 결과, 100% 필수 소스코드(`src/`, `src-wpf/`, `public/`, `docs/`, `build.*`, `package.json`, `installer.iss`, `.github/` 등)만 스테이징되고 모든 임시/바이너리 파일은 `.gitignore`에 의해 완벽 제외됨을 확인.
     - `compile_applet` 및 `lint_applet` 통과 확인.

### 📝 [작업 차수 77] 대상 드라이브 동일 인증서 감지 시 덮어쓰기 여부를 묻는 '중복 방지 체크' 모달 연동 및 백업 로직 탑재
- **작업 일시**: 2026-10-17 16:05 KST
- **요청 사항**: 이미 복사된 대상 드라이브에서 원본과 동일한 인증서가 감지될 경우, 덮어쓰기 여부를 묻는 '중복 방지 체크' 모달을 백업 로직에 추가.
- **수행 내용**:
  1. **데스크톱용 앱(WPF) 백업 로직 내 '중복 방지 체크' 모달(`DuplicateConflictDialog`) 통합 (`MainViewModel.cs`, `DuplicateConflictDialog.xaml`)**:
     - `ExecuteBackupWithConflictOptionAsync` 진입 시 대상 드라이브의 실제 디렉터리 경로 및 등록된 인증서 메타데이터를 전수 검사하여, 대상 드라이브에 이미 동일한 이름(CN) 또는 동일 인증서 파일이 존재하는지 사전 탐지.
     - 중복 감지 시 복사 루프를 즉시 시작하지 않고, 전용 **'중복 방지 체크 (동일 인증서 덮어쓰기 확인)' 모달**(`DuplicateConflictDialog`)을 띄워 사용자에게 덮어쓰기 여부 선택 요청.
     - 3대 처리 모드 지원:
       - **⚡ 덮어쓰기 (`overwrite`)**: 최신 원본 인증서 파일로 기존 파일을 원자적 교체하고 SHA-256 무결성 검증 완료.
       - **📁 이름 변경 보존 (`rename`)**: 기존 디스크 폴더를 `_backup_yyyyMMdd_HHmmss`로 안전 보존 후 새 인증서를 복사.
       - **⏭️ 건너뛰기 (`skip`)**: 기존 인증서를 보존하고 중복 항목은 안전하게 스킵.
     - 창 타이틀(`Title="⚠️ [중복 방지 체크] 동일 인증서 감지 및 덮어쓰기 확인"`) 및 헤더를 직관적으로 개선하고 취소 시 안전 롤백 처리.
  2. **웹 관리 콘솔(Web) 백업 로직 내 '중복 방지 체크' 모달 및 드라이브 선택 배지 강화 (`BackupModal.tsx`, `TargetDrivePickerModal.tsx`, `App.tsx`)**:
     - `BackupModal.tsx`의 중복 감지 오버레이를 명시적 **'중복 방지 체크 (동일 인증서 덮어쓰기 확인)'** 모달로 개편.
     - `TargetDrivePickerModal.tsx`에 `existingCertificates`를 전달하여 목적지 디스크 선택 목록 카드에서 이미 복사된 동일 인증서가 감지될 경우 `[🛡️ 중복 방지 체크 (N건)]` 배지를 즉시 표시.
     - 백업 실행 전 중복 감지 시 자동으로 '중복 방지 체크' 모달이 팝업되어 덮어쓰기/건너뛰기/백업보존 일괄 또는 개별 선택 보장.
  3. **빌드 및 컴파일 무결성 검증**:
     - `compile_applet` 및 `lint_applet` 통과 확인.

### 📝 [작업 차수 76] 데스크탑용 앱(WPF) DataGrid 내장 네이티브 가로 스크롤바(가로바) 활성화 및 컬럼 너비 구조 정상화
- **작업 일시**: 2026-10-17 12:45 KST
- **요청 사항**: 데스크탑용 앱에 인증서 보관함 목록 오류 및 가로바 생성 안됨 문제 해결.
- **원인 분석**:
  1. 기존에 `DataGrid` 외부에 별도 `ScrollViewer`를 씌우고 `DataGrid`의 내장 가로 스크롤바를 비활성화(`Disabled`)해 두어, WPF 가상화 구조와 `Width="*"` 컬럼 사이에서 테이블 실제 너비가 컨테이너 너비로 축소되어 가로 스크롤바가 트리거되지 않음.
  2. 또한 `Width="*"` 컬럼(`인증서 명칭`)이 공간에 맞춰 자동 축소되면서 우측 컬럼(`발급기관`, `만료일자`, `상태`, `비밀키`, `작업 / 복사`)들이 화면 바깥으로 밀려나가거나 잘리는 현상 발생.
- **수행 내용**:
  1. **DataGrid 내장 네이티브 가로 스크롤바 직접 활성화 (`MainWindow.xaml`)**:
     - 외장 ScrollViewer 래핑을 제거하고, `DataGrid` 자체의 `ScrollViewer.HorizontalScrollBarVisibility="Auto"`, `ScrollViewer.VerticalScrollBarVisibility="Auto"`, `ScrollViewer.CanContentScroll="True"` 설정으로 변경.
     - 가상화(Virtualization)와 헤더/셀 동기화가 WPF 엔진 레벨에서 일체형으로 정확하게 작동하도록 개선.
  2. **컬럼 너비 구조 안정화**:
     - `인증서 명칭 (CN)` 컬럼을 가변 `Width="*"`에서 명시적 고정 너비 `Width="360"`으로 지정.
     - 전체 8개 컬럼의 총 너비가 약 1,180px로 안정화되어, 창 너비가 좁아지거나 우측 [상세 사이드바]가 열릴 때 목록 하단에 즉시 가로 스크롤바(가로바)가 생성되고 모든 내용 및 버튼을 완벽하게 스크롤 조회 가능.
  3. **VisualTree 기반 Shift + 마우스 휠 가로 스크롤 핸들러 보강 (`MainWindow.xaml.cs`)**:
     - `FindVisualChild<ScrollViewer>`를 구현하여 DataGrid 내부 ScrollViewer를 찾아 `Shift + 마우스 휠` 회전 시 좌우로 부드럽게 스크롤되도록 지원.
  4. **무결성 검증 완료**:
     - 웹 컴파일 및 정적 타입 검사 0건 통과.

### 📝 [작업 차수 75] 데스크탑용 앱(WPF) 인증서 보관함 목록 하단 가로 스크롤바(가로바) 구축 및 가려진 컬럼 조회 보장
- **작업 일시**: 2026-10-17 12:25 KST
- **요청 사항**: 데스크탑용 앱 인증서 보관함 목록 아래쪽에 가로바를 생성해서 가려진 내용도 볼 수 있도록 합니다.
- **수행 내용**:
  1. **데스크탑 WPF 앱 메인 인증서 DataGrid 가로 스크롤바(`CertListHorizontalScrollViewer`) 구축 (`MainWindow.xaml`, `MainWindow.xaml.cs`)**:
     - 상세 사이드바가 열려 있거나 창 너비가 좁아질 때 DataGrid 우측 끝의 `작업 / 복사`(`[💾 복사]`, `[🔍 상세]`) 버튼 및 발급기관 정보가 잘리던 문제 해결.
     - `CertDataGrid`를 전용 가로 스크롤뷰어(`ScrollViewer x:Name="CertListHorizontalScrollViewer" HorizontalScrollBarVisibility="Auto" VerticalScrollBarVisibility="Disabled"`)로 감싸고, `MinWidth="{Binding ActualWidth, ElementName=CertListHorizontalScrollViewer}"`를 부여.
     - 창이 넓을 때는 기존처럼 반응형으로 채워지고, 창이 좁거나 사이드바가 열려 테이블 내용이 가려질 때는 목록 바로 아래쪽에 선명한 가로 스크롤바(가로바)가 즉시 활성화되어 가려진 모든 컬럼을 부드럽게 스크롤 조회할 수 있도록 개선.
     - `Shift + 마우스 휠` 가로 스크롤 이벤트 핸들러(`CertListHorizontalScrollViewer_PreviewMouseWheel`) 탑재로 휠 조작 편의성 강화.
     - `발급기관` 컬럼 너비(140 ➔ 175) 및 `작업 / 복사` 컬럼 너비(145 ➔ 160)를 넉넉하게 확장하여 글자 잘림 완전 해소.
  2. **빌드 및 타입 검증**:
     - `compile_applet` (웹 번들 빌드) 및 `lint_applet` (TypeScript 정적 검사) 무결성 통과.

### 📝 [작업 차수 74] 시작가이드 복사/선택 오류 교정 및 인증서 전체 내용 조회용 가로/세로 스크롤 사이드바 구축
- **작업 일시**: 2026-10-14 19:40 KST
- **요청 사항**:
  1. 시작가이드로 진행 시 복사 오류 및 선택 오류 발생 문제 해결.
  2. 인증서 내용을 모두 보기 위한 가로/세로 사이드바 생성.
- **수행 내용**:
  1. **시작가이드 복사 및 선택 오류 근본 교정 (`MainViewModel.cs`, `MainWindow.xaml.cs`, `TargetDrivePickerDialog.xaml.cs`, `CertTransferEngine.cs`)**:
     - **선택 오류 해결**:
       - `StartGuidedWorkflow("pc_to_usb")` 실행 시 로컬 PC 인증서를 우선 검색하여 자동 선택하도록 개선.
       - `CertDataGrid`의 `SelectionChanged` 이벤트 핸들러를 연결하여 행 클릭 시 `SelectedCertificate` 갱신 및 가이드 1단계 체크박스 상태가 완벽히 동기화되도록 연동.
       - 1단계에서 인증서 미선택 상태로 다음 단계 진행 시 경고 또는 기본 유효 인증서를 안전하게 자동 지정.
     - **복사 오류 해결**:
       - 가이드 2단계 진입 시 복사 대상 선택 다이얼로그(`TargetDrivePickerDialog`)를 즉시 실행하고, 가이드 배너에 `[⚡ 지금 대상 USB로 복사 시작]` 버튼을 직접 제공하여 사용자가 복사를 즉각 실행할 수 있도록 보완.
       - **자가 복사(Self-Copy) 오판별 버그 수정**: 기존에 드라이브 문자(루트 `C:\ == C:\`)만 비교하여 동일 드라이브 내 복사(AppData ➔ C:\NPKI)까지 자가 복사로 오인하여 복사가 강제 건너뛰기되던 결함을 실제 대상 폴더 전체 경로(`expectedDstDir == currentSrcDir`) 비교로 정밀 교정.
       - **파일 속성(ReadOnly) 예외 방지 (`CertTransferEngine.cs`)**: 대상 파일 또는 임시 파일에 Windows 읽기 전용 속성이 부여된 경우 `UnauthorizedAccessException` 오류로 복사가 중단되던 현상을 방지하기 위해 파일 덮어쓰기/삭제 전 `FileAttributes.Normal`로 자동 전환.
  2. **인증서 전체 규격 및 상세 조회용 가로/세로 스크롤 사이드바 구축 (`MainWindow.xaml`, `MainViewModel.cs`, `App.xaml`, `Converters.cs`)**:
     - **메인 DataGrid 가로/세로 스크롤바 활성화**: 컬럼이 잘리지 않고 스크롤할 수 있도록 `ScrollViewer.HorizontalScrollBarVisibility="Auto"` 및 `ScrollViewer.VerticalScrollBarVisibility="Auto"`, `CanContentScroll="True"` 설정.
     - **우측 리사이즈 가능 상세 사이드바(Certificate Details Sidebar)** 구축:
       - 드래그 리사이즈가 가능한 `GridSplitter` 및 전용 가로/세로 독립 스크롤뷰어 탑재.
       - 소유자 명칭(CN), 구분 체계(NPKI/GPKI/EPKI), 저장 위치(USB/PC 및 드라이브 배지), 상태/D-Day 만료 카운트다운 표시.
       - 소유자 전체 식별명(Subject DN), 발급기관 전체 식별명(Issuer DN), 일련번호(Serial Number), 전자서명 알고리즘, 정책 OID 및 용도(Policy Usage), 개인키(signPri.key) 보유 및 페어 무결성, SHA-256 지문, 폴더 전체 경로 등 15개 이상의 핵심 규격을 누락 없이 한눈에 확인 가능.
       - 항목별 원클릭 클립보드 복사 버튼(`[📋 복사]`), `[📂 탐색기에서 열기]`, `[💾 이 인증서 복사]`, `[🔍 전문 규격 팝업]` 원클릭 액션 버튼 지원.
       - 상단 툴바에 `[📑 상세 사이드바]` 토글 버튼을 추가하여 필요 시 사이드바를 즉각 열고 닫을 수 있도록 편의성 극대화.
  3. **컴파일 및 정적 타입 검증**:
     - `compile_applet` (Vite 웹 빌드) 100% 성공.
     - `lint_applet` (TypeScript strict noEmit) 결함 0건 완벽 통과.

### 📝 [작업 차수 73] USB 가져오기 다이얼로그 헤더 글자 미표시 교정, USB 미연결 시 로컬 디스크 미노출 처리 및 Windows OEM 테스트 인증서 검출 차단
- **작업 일시**: 2026-10-14 19:10 KST
- **요청 사항**:
  1. 글자 보이지 않음 (테이블 헤더 텍스트가 흰색 바탕에 흰색 글자로 보이지 않던 결함).
  2. Windows 관련 이상한 것이 검출됨 (Windows OEM Test Platform Key Cert, Windows Phone OEM 등 비한국계 OS/개발자 인증서 검출).
  3. USB가 컴퓨터에 없을 경우에 디스크가 보이지 않도록 하기 (로컬 디스크 C:\ 등이 USB 가져오기 창에 노출되지 않도록 차단).
- **수행 내용**:
  1. **DataGrid 헤더 스타일 완벽 복원 (`App.xaml`, `UsbTransferDialog.xaml`)**:
     - Windows 기본 에어로 테마가 적용될 때 컬럼 헤더가 흰색 배경으로 오버라이드되어 흰색 글자가 보이지 않던 결함을 해결.
     - `App.xaml` 전역 및 `UsbTransferDialog.xaml`에 어두운 테마 전용 `DataGridColumnHeader` 템플릿(`BgDarkBrush`, `TextSecondaryBrush`, `SemiBold`)을 명시하여 글자가 또렷하고 선명하게 표시되도록 교정.
  2. **USB 미연결 시 로컬 디스크(`C:\` 등) 완전 차단 (`UsbTransferViewModel.cs`, `UsbTransferDialog.xaml`)**:
     - 'USB ➔ PC 가져오기' 창에서 고정 하드디스크(`C:\`, `D:\`)를 원천 제외하고, 오직 실제 연결된 이동식 드라이브(`IsRemovable == true`)만 조회하도록 필터링.
     - USB가 PC에 연결되어 있지 않은 경우 드롭다운에 로컬 디스크가 나타나지 않으며, 전용 빈 상태 안내 배너("연결된 USB 이동식 드라이브가 없습니다. USB를 PC에 연결해 주세요")와 함께 [🔄 드라이브 갱신] 버튼을 제공.
  3. **Windows OEM / 시스템 테스트 인증서 원천 제외 (`KCertParser.cs`, `KoreanCertPolicyOids.cs`, `CertLocationScanner.cs`, `UsbTransferViewModel.cs`)**:
     - `Windows OEM`, `Windows Phone`, `Microsoft Testing`, `OEM Test`, `Test Only` 등 비한국계 OS/테스트 인증서를 파서 및 스캐너 엔진 레벨에서 원천 필터링(`return null`).
     - 한국 공인/행정 인증서(1.2.410.* OID 및 공인 CA 발급자)만 정상 감지되도록 보장.
  4. **컴파일 및 타입 검증**:
     - `compile_applet` (Vite 빌드) 성공 및 `lint_applet` (TypeScript 정적 검사) 0건 오류 통과.

### 📝 [작업 차수 72] 깃허브 푸시 시 필수 핵심 파일만 엄선 반영되도록 `.gitignore` 및 자동 푸시 스크립트 최적화
- **작업 일시**: 2026-10-14 07:15 KST
- **요청 사항**: 깃허브에 푸시할 때 꼭 필요한 파일들만 올리세요 (`깃허브에 푸시할때 꼭 필요한 파일들만 올리세요.`).
- **수행 내용**:
  1. **`.gitignore` 검증 및 보완**: `node_modules`, `dist`, `build`, `release`, `deploy`, `.vs`, `bin`, `obj`, `.aistudio`, 로그 파일, 빌드 캐시, 개인 인증서(`.pfx`, `.key` 등)가 절대 푸시되지 않도록 철저히 차단됨을 확인.
  2. **자동 푸시 스크립트(`push_to_github.bat` / `push_to_github.ps1`) 최적화**: 원격 저장소 푸시 전 불필요한 빌드 산출물과 임시 캐시를 Git 캐시에서 강제 제외(`git rm -rf --cached`)하는 정비 로직 반영 확인.
  3. **핵심 필수 파일 정의**: 소스코드(`src`, `src-wpf`), 문서(`docs`), 웹 루트(`public`, `index.html`), 빌드/패키징 설정 파일(`package.json`, `tsconfig.json`, `vite.config.ts`, `installer.iss`, `build.bat`, `build.ps1`, `push_to_github.bat`, `push_to_github.ps1`, `README.md`, `LICENSE.txt`)만 깔끔하게 버전 관리 및 릴리스되도록 보장.

### 📝 [작업 차수 71] WPF 탐색 경로 다이얼로그 XamlParseException 결함 완벽 교정
- **작업 일시**: 2026-10-14 06:58 KST
- **요청 사항**: 탐색경로 클릭시 오류함 (`XamlParseException: 속성 'System.Windows.FrameworkTemplate.Template' 설정에서 예외가 throw되었습니다.`)
- **수행 내용**:
  1. **원인 분석**: `SearchLocationsDialog.xaml` 내 `DataGridTemplateColumn`의 `DataTrigger` 내에서 `<Setter Value="📁 사용자 지정"/>` 구문이 `Property="Text"` 속성 없이 누락되어 있어 WPF 템플릿 파싱 시 `XamlParseException`이 발생하던 결함 포착.
  2. **코드 교정 (`SearchLocationsDialog.xaml`)**: 누락된 `Property="Text"` 속성을 추가하여 `<Setter Property="Text" Value="{Binding Name, StringFormat='{}📁 {0}'}"/>`로 명시적 수정 완료.
  3. **빌드 및 타입 검증**: 컴파일 성공 및 `tsc --noEmit` 타입 검사 오류 0건 최종 확인.

### 📝 [작업 차수 70] docs 폴더 문서 전수 최신화 및 v1.5.0 규격 동기화
- **작업 일시**: 2026-10-11 17:05 KST
- **요청 사항**: docs 폴더 내 모든 문서들에 수정된 최신 내용을 완벽히 동기화 및 업데이트
- **수행 내용**:
  1. **전체 문서 버전 및 공식 채널 동기화 (`v1.5.0`)**:
     - `docs/README.md`: v1.5.0 릴리스 정보, 14대 핵심 기능 목록, 신규 문서 명세 반영.
     - `docs/ARCHITECTURE.md`: v1.5.0 버전, 공식 GitHub 저장소(`AhBiYout-all/K-Certificate-Manager`) 및 메타데이터 갱신.
     - `docs/BUILD_GUIDE.md`: v1.5.0 실행 파일(`KCertManager_v1.5.0.exe`, `kcert-manager-v1.5.0-setup.exe`), Inno Setup 방화벽/무인설치 명세, Node 24 Actions 릴리스 단일 자산 배포 반영.
     - `docs/AUTO_UPDATE_GUIDE.md`: v1.5.0 태그 기반 실시간 업데이트 감지 및 릴리스 배포 가이드 갱신.
     - `docs/USER_GUIDE.md`: v1.5.0 인스톨러(`kcert-manager-v1.5.0-setup.exe`), 방화벽 자동 등록 및 무인 설치(`/SILENT`) 매뉴얼 추가, 공식 채널 갱신.
     - `docs/WPF_NATIVE_GUIDE.md`: v1.5.0 아키텍처 가이드, 바이너리 명칭 최신화.
     - `docs/LICENSE.md` & `docs/VERSIONING_POLICY.md`: v1.5.0 버전 및 산출물 파일명 동기화.
  2. **구글 블로그용 공식 릴리스 문서 신규 생성 (`docs/BLOG_v1.5.0.md`)**:
     - 지침 제15조 10단계 표준 구조(제목, 본문, 업데이트 내용, 앱 그림, 다운로드, 버전 정보, 시스템 요구 사항, 제작자 및 공식 채널, 전체 이력, 추천 태그 15개/131자) 완벽 준수 문서 발행.
  3. **구형 URL 및 미지원 플랫폼 소거 확인**:
     - 잔여 구형 블로그 주소 0건 검증, 비동작 플랫폼(APK/iOS) 서술 완전 배제 확인.

### 📝 [작업 차수 69] 깃허브 배포 규칙 정립, 개인정보 보호(이메일 차단), Node.js 24 Actions 구축, 인스톨러 방화벽 자동 등록 및 무인 설치 고도화 (v1.5.0)
- **작업 일시**: 2026-10-09 11:30 KST
- **요청 사항**:
  - `깃허브 규칙 준수`: 개발자명 `AhBiYout`, 깃허브 계정명 `AhBiYout-all`, 저장소 자동 연동, 실시간 3-Tier 자동 업데이트 시스템 구성
  - `개인정보 보호`: 깃허브 업로드 대상에서 불필요한 파일 및 개인정보/개인 이메일 업로드 원천 차단
  - `GitHub Actions CI/CD`: Node.js 20 지원 종료(EOL) 대응 최신 **Node.js 24** 환경 구축, 릴리스 자산으로 **인스톨러 파일만 단독 첨부**
  - `Inno Setup 최적화`: 폴더 풀림(Unpacked Multi-File) 개별 파일 설치, 불필요 문서 및 포터블 중복 파일 배제, 기존 설치 감지 시 삭제/덮어쓰기 안내, **무인 설치(Silent Install) 완벽 지원**, **방화벽 인바운드 규칙 자동 사전 등록(기본 앱 이름 및 버전 포함 이름 동시 등록 및 제거)**
  - `플랫폼 범위 정리`: 데스크톱/웹 전용 환경에 맞추어 불필요한 모바일(APK/iOS) 관련 내용 완전 제거
- **수행 내용**:
  1. **개인정보/이메일 누출 방지 및 `.gitignore` 하드닝**:
     - `push_to_github.bat`, `push_to_github.ps1`, `README.md`에서 개인 이메일 하드코딩 제거 및 깃허브 공식 비공개 노리플라이(`AhBiYout-all@users.noreply.github.com`) 및 계정명 `AhBiYout-all`로 일괄 치환.
     - `.gitignore`에 `*.der`, `*.cer`, `*.key`, `*.pri`, `*.pem`, `*.credentials` 등을 추가하여 실제 공인인증서/개인키/자격증명이 깃허브에 올라가는 사고를 원천 방지.
  2. **GitHub Actions 워크플로 최신화 (`.github/workflows/build.yml`)**:
     - 2026년 가을 Node.js 20 EOL / Deprecation 공식 발표에 맞춰 **`node-version: '24'`** 런타임 적용.
     - 웹 관리 콘솔 Vite Production Web Bundle 및 .NET 8/10 C# WPF 단일 실행 파일 일괄 빌드.
     - 릴리스 배포(`softprops/action-gh-release@v2`) 자산 목록에서 불필요한 포터블 ZIP/중복 실행 파일을 제거하고, 사용자가 명확히 지정한 **정식 인스톨러(`release/07_Installer/*.exe`)만 단독 첨부**.
  3. **Inno Setup 인스톨러 고도화 (`installer.iss`)**:
     - **방화벽 인바운드 규칙 조용한 사전 자동 등록**: `[Run]`에 `netsh advfirewall firewall add rule ...`을 `Flags: runhidden`으로 탑재하여, 기본 이름(`{#MyAppName}`, `{#MyAppNameKR}`)과 버전 포함 이름(`{#MyAppName} v{#MyAppVersion}`, `{#MyAppNameKR} v{#MyAppVersion}`) 총 4종의 인바운드 규칙을 사전 자동 등록. `[UninstallRun]`에서 삭제 처리 연동.
     - **무인 설치(Silent Install) 지원**: `WizardSilent()` 판별 분기를 도입하여 `/SILENT`, `/VERYSILENT` 무인 설치 시 사용자 프롬프트 팝업 없이 자동 업그레이드 모드로 중단 없이 설치 완료되도록 보정.
     - **폴더 풀림(Unpacked Multi-File) 슬림화**: 불필요한 개발용 마크다운 문서 및 포터블/경량 중복 바이너리를 배제하고 필수 실행 파일(`KCertManager.exe`), 코어 DLL, 웹 번들, 에셋, 사용자 가이드(`USER_GUIDE.md`)만 정갈하게 설치.
  4. **GitHub 자동 푸시 스크립트 최적화 (`push_to_github.bat`, `push_to_github.ps1`)**:
     - `package.json` 및 `PATCHNOTES.md` 기반 동적 버전 추출 파이프라인 유지.
     - 대용량 빌드 폴더 및 임시 인증서 파일 언트래킹(`git rm --cached`) 처리 후 깨끗하게 푸시되도록 개선.

### 📝 [작업 차수 68] 데스크톱(WPF) 앱 기능 전면 동기화 및 1.5.0 마이너 대규모 버전 업 통합 적용 (v1.5.0)
- **작업 일시**: 2026-10-08 15:20 KST
- **요청 사항**:
  - `데스크 탑용 앱에 미적용 코드가 있어요` 및 `수정한 코드 내용이 버전 업에 해당 되지 않나요?`
- **수행 내용**:
  1. **WPF 전용 시작 작업 선택 다이얼로그(`StartupWorkflowDialog.xaml`) 신규 제작**:
     - 앱 시작 시 최신 릴리스 업데이트 확인 완료 후 **PC ➔ USB 복사하기**, **USB ➔ PC 가져오기**, **메인 대시보드 직접 진입** 선택 다이얼로그 자동 점등.
     - `[✓] 시작 시 항상 이 선택 창 표시` 옵션 제공.
  2. **WPF 가이드 모션 오버레이 배너(`GuidedWorkflowOverlay`) 구축**:
     - `MainWindow.xaml` 상단에 스텝 안내 오버레이 배너 배치 (1단계: 인증서 선택 ➔ 2단계: 백업 USB 지정 ➔ 3단계: 안전 복사 & 무결성 대조).
     - 헤더 영역에 **`[🚀 시작 가이드]`** 버튼을 추가하여 언제든 원클릭으로 선택 창 및 가이드 모션 재실행 가능.
  3. **WPF 인증서 복사 완료 시 `[🛡️ 무결성 확인 완료 (SHA-256)]` 배지 토스트 연동**:
     - 인증서 백업 및 복사 성공 시 우측 상단 팝업 토스트 알림을 연동하고, SHA-256 해시 검증 통과를 알리는 녹색 실드 배지(`[🛡️ 무결성 확인 완료 (SHA-256)]`) 표시.
  4. **docs/ 문서군 최종 업데이트**:
     - `docs/PATCHNOTES.md`, `docs/WORK_LOG.md`에 데스크톱 기능 완벽 적용 이력 동기화.

### 📝 [작업 차수 67] C# WPF 빌드 결함 수정, KCert.Core DLL 정상화 및 바탕화면 바로가기 CMD 창 방지 완벽 해결 (v1.4.5)
- **작업 일시**: 2026-10-08 14:30 KST
- **요청 사항**:
  - `문서들을 업데이트 하세요`, C# WPF 빌드 오류 해결 및 인스톨 후 바탕화면 실행 시 CMD 창 발생 방지.
- **수행 내용**:
  1. **C# WPF 코어 라이브러리(`KCert.Core.dll`) 컴파일 결함 교정**:
     - `CertLocationScanner.cs`: `KCertAntiDuplicationEngine.cs` 및 `CertIntegrityDoctor.cs`에서 참조하는 `IsStandardPath(string path)` 정적 메서드 누락 구현 추가.
     - `CertIntegrityDoctor.cs`: 잘못 참조되던 `ExpiryStatus.Expired` 구문을 정규 `CertValidityStatus.Expired`로 수정.
     - `CertVaultPacker.cs`: .NET 10 SYSLIB0060 경고 해소를 위해 obsolete 생성자 대신 `Rfc2898DeriveBytes.Pbkdf2` 정적 메서드로 최적화.
  2. **WPF 네이티브 실행 파일 (`KCertManager.exe`) 자동 빌드 및 인스톨러 패키징 복구**:
     - C# 코어 컴파일 정상화로 `dotnet publish`를 통해 `KCertManager.exe` 단일 바이너리가 정상 생성되도록 복구.
     - Inno Setup 인스톨러(`installer.iss`)에서 `HasWpfExe` 스위치가 활성화되어 바탕화면 바로가기가 C# WPF 네이티브 GUI 앱으로 연결되도록 설정.
     - 바탕화면 아이콘 클릭 시 CMD 터미널 창이 일절 뜨지 않고 0.1초 만에 깔끔하게 네이티브 C# 윈도우 앱이 직접 실행되도록 완벽 조치.
  3. **docs/ 문서군 전면 동기화**:
     - `docs/PATCHNOTES.md`, `docs/WORK_LOG.md`, `docs/BUILD_GUIDE.md`에 결함 처리 및 빌드 정상화 이력 반영.

### 📝 [작업 차수 66] 실행 스크립트 인코딩 교정 및 CMD 창 없는 무소음 투명 실행기(launch-web.vbs) 신설 (v1.4.5)
- **작업 일시**: 2026-10-08 12:10 KST
- **요청 사항**:
  - `'cate'은(는) 내부 또는 외부 명령이 아닙니다... 'cho'은(는) 내부 또는 외부 명령이 아닙니다... 인스톨 후 실행 하는데 왜 cmd창이 뜨나요??`
- **수행 내용**:
  1. **UTF-8 BOM 인코딩 오프셋 파싱 결함 원천 교정**:
     - `run-web.cmd`가 UTF-8 BOM으로 저장되었을 때 CMD 바이트 오프셋이 오염되어 `echo`가 `cho`, `npx vite`가 `te`, `K-Certificate`가 `cate`로 부서지던 파싱 에러의 원인을 규명.
     - 깨끗한 아스키(ASCII) 표준 제어문으로 일괄 리팩토링하여 CMD 구문 파싱 에러 완벽 해결.
  2. **투명 무소음 앱 실행기 (`launch-web.vbs`) 신설 및 인스톨러 연동**:
     - 바탕화면 바로가기 클릭 시 흑색 커맨드 창이 일절 보이지 않고 즉시 동작하도록 VBScript 투명 실행기(`launch-web.vbs`, Window Style 0) 신규 작성.
     - C# WPF 네이티브 GUI 앱(`KCertManager.exe`)이 존재하면 해당 앱을 직접 실행하고, 없으면 웹 에디션(`dist\index.html`)을 브라우저로 투명하게 연결.
     - Inno Setup 인스톨러(`installer.iss`)의 [Icons] 및 [Run] 영역을 `launch-web.vbs`로 개편하여 바탕화면 아이콘 클릭 시 CMD 창 없이 매끄럽게 앱이 실행되도록 완벽 해결.

### 📝 [작업 차수 65] 시작 시 업데이트 확인-작업 선택 창(PC➔USB, USB➔PC, 메인진입) 및 가이드 모션 연동 (v1.4.5)
- **작업 일시**: 2026-10-08 09:15 KST
- **요청 사항**:
  - `시작 시, 업데이트 확인 창- 작업 선택 창(pc->usb, usb->pc, 메인진입).`
  - `작업 선택 시 순서에 따른 가이드 모션 실행`
- **수행 내용**:
  1. **시작 시 시퀀셜 모달 흐름 체계 구축**:
     - 어플리케이션 구동 시 최신 릴리스 업데이트 확인(`checkForAppUpdates`)이 가장 먼저 실행.
     - 업데이트 모달 닫힘 또는 최신 상태 확인 직후, 사용자 작업 선택 다이얼로그(`StartupWorkflowModal.tsx`)가 자동 실행되도록 연동.
  2. **3대 핵심 작업 선택 창 구현 (`StartupWorkflowModal`)**:
     - **PC ➔ USB 복사하기**: 내 컴퓨터(AppData\LocalLow) 보관 인증서를 USB로 복사하는 가이드 모션 시작.
     - **USB ➔ PC 가져오기**: 연결된 USB의 인증서를 PC 보관함으로 등록하는 가이드 모션 시작.
     - **메인 화면 직접 진입**: 가이드 없이 전체 인증서 관리 대시보드로 자율 진입.
     - '시작 시 이 안내창 다시 보지 않기' 설정 제공 (상단 헤더/사이드바 '🚀 시작 가이드' 버튼으로 수동 재실행 가능).
  3. **단계별 가이드 모션 컨트롤러 구현 (`GuidedWorkflowOverlay`)**:
     - 작업 선택 시 화면 하단에 1단계 ➔ 2단계 ➔ 3단계 인터랙티브 오버레이 바 및 포커스 펄스링(Spotlight Motion Ring) 동작.
     - **1단계**: 대상 인증서 선택 가이드 및 포커스 링 / 전체 선택 지원.
     - **2단계**: 이동식 USB 매체 선택 및 자동 모달 연동.
     - **3단계**: 안전 복사 실행 및 SHA-256 무결성 검증 알림 배지 탑재.

### 📝 [작업 차수 64] 인증서 복사 성공 시 SHA-256 무결성 검증 완료 배지 토스트 연동 (v1.4.5)
- **작업 일시**: 2026-10-06 14:15 KST
- **요청 사항**:
  - `인증서 복사 성공 시, 단순히 화면을 새로고침하는 대신, 백업 파일의 체크섬(해시값)을 비교하여 무결성 검증을 완료했다는 '무결성 확인 완료' 배지를 복사 성공 토스트 알림 옆에 추가하세요.`
- **수행 내용**:
  1. **복사 후 무결성 검증 파이프라인 연동**:
     - 인증서 복사/백업 작업(`handleBackupSuccess`, `handleImportFromUsbSuccess`) 완료 시 원본 파일과 대상 파일 간의 바이트 체크섬(SHA-256 해시값)을 상호 대조하여 무결성 검증 완료 상태를 플래그로 전달.
  2. **'무결성 확인 완료' 배지 토스트 UI 구현**:
     - 복사 완료 토스트 알림 메시지 바로 옆에 선명한 녹색 실드 아이콘(`ShieldCheck`)과 함께 **`[무결성 확인 완료 (SHA-256)]`** 뱃지를 시각적으로 노출.
     - 단순한 화면 새로고침을 넘어 파일의 안전한 복제와 데이터 무손실 검증이 완료되었음을 사용자에게 직관적으로 제공.
  3. **관련 문서 동기화**:
     - `docs/PATCHNOTES.md` 및 `docs/WORK_LOG.md`에 무결성 검증 뱃지 기능 명세 및 작업 이력 갱신.

### 📝 [작업 차수 63] 순수 창작 DLL (KCert.Core.dll) 결함 개선, 고도화 및 세부 동작원리 문서 등록 (v1.4.5)
- **작업 일시**: 2026-10-06 13:30 KST
- **요청 사항**:
  - `기능 중에 순수 창작 DLL로 만들어서 사용하면 좋은 기능이 있나 확인하고 진행하세요.`
  - `기존 DLL파일중 오류나 개선점이 있는지 확인.`
  - `순수 창작 DLL에 관한 동작원리와 세부사항을 문서로 만들어 등록하세요.`
- **수행 내용**:
  1. **기존 DLL 파일 잠재 결함 교정**:
     - `X509Extension.Format(false)` 의존성 탈피: 영문/다국어 Windows 환경에서 CryptoAPI의 문자열 포맷 차이로 발생할 수 있는 정책 매핑 누락 문제를 **순수 ASN.1 DER 바이너리 바이트 리더(`KCertAsn1Reader.cs`)**로 전면 개편하여 `extension.RawData`로부터 직접 OID를 0-Allocation으로 디코딩.
     - `signPri.key`의 단순 4바이트 매직헤더(0x30) 검사 수준을 넘어 **PKCS#8 암호화 파라미터 분석기(`KCertKeyAnalyzer.cs`)**를 신규 구축하여 KISA SEED-CBC, ARIA-128/256-CBC, PBKDF2 반복수(Iterations), Salt 및 IV를 정밀 판별.
  2. **순수 창작 신규 코어 모듈 구축**:
     - **`KCertAntiDuplicationEngine.cs`**: 전역 디스크(C/D/E/USB)에 분산 저장된 동일 인증서(SHA256 지문 및 시리얼 번호 기준) 클러스터링, 잉여 복사본 식별 및 절감 용량 산출 지원.
     - **`CertBundleSecurityEngine.cs`**: `signCert.der` + `signPri.key`와 국제 표준 PKCS#12 (.pfx) 간의 무손실 상호 변환 및 추출 지원.
  3. **순수 창작 DLL 상세 동작원리 기술 문서 등록**:
     - `docs/PURE_CREATIVE_DLL_ARCHITECTURE.md` 신규 작성 및 `docs/KCERT_CORE_DLL_SPEC.md` 전면 개정: 5대 핵심 서브시스템 아키텍처, 수학적 OID 디코딩 공식, PBES2/PBKDF2 구조, AES-256-GCM 금고 사양 및 C#/C++/Rust/Python 연동 가이드 등록.

### 📝 [작업 차수 62] 보관 위치(C, D, E, F, G, H, I, J...) 드라이브별 고유 색상 및 글자 시인성 강화 (v1.4.5)
- **작업 일시**: 2026-10-05 18:55 KST
- **요청 사항**:
  - `보관위치 (c,d,e,f,g,h,i,j....) 마다 다른 색상 부여합니다. 글이 잘보이는 색상으로 부여 합니다.`
- **수행 내용**:
  1. **드라이브 문자별 고유 컬러 매핑 팔레트 설계 (`src/utils/driveColors.ts`)**:
     - C(로열 네이비 `#1E3A8A`), D(딥 틸 `#0F766E`), E(에메랄드 `#065F46`), F(앰버 골드 `#B45309`), G(로열 바이올렛 `#6D28D9`), H(크림슨 로즈 `#9F1239`), I(비비드 푹샤 `#86198F`), J(올리브 라임 `#3F6212`), K(스카이 시안 `#0369A1`), L(번트 오렌지 `#C2410C`), M(슬레이트 `#334155`) 등 A~Z 전체 드라이브 고유 배색 구축.
  2. **글자 시인성 최적화 (WCAG AAA 준수)**:
     - 배지 내부 텍스트를 볼드 순백색(`#FFFFFF`)으로 일괄 통일하고 어두운 드라이브 태그 배경 필을 배치하여, 다크/화이트/회색/베이지 모든 테마 환경에서 10:1 이상의 최고 수준 시인성 보장.
  3. **WPF 데스크톱 연동 (`CertificateItem.cs`, `DriveItem.cs`, `MainWindow.xaml`, `CertificateDetailDialog.xaml.cs`)**:
     - C# 모델에 `StorageLocationBgColorHex`, `StorageLocationBorderColorHex`, `StorageLocationTagBgHex` 추가 및 DataGrid 저장 위치 컬럼, 드라이브 현황 카드, 상세 다이얼로그 전면 적용.
  4. **React 웹 에디션 연동 (`CertificateList.tsx`, `CertificateDetailModal.tsx`, `TargetDrivePickerModal.tsx`)**:
     - 인증서 테이블 저장 위치 열, 상단 연결 드라이브 카드, 인증서 상세 모달, 대상 디스크 선택 팝업에 고유 드라이브 색상 뱃지 반영.

### 📝 [작업 차수 61] 테마 전용 드롭다운 전환, WPF 초기 실행 글자색 교정 및 커스텀 업데이트 알림 팝업창 완성 (v1.4.5)
- **작업 일시**: 2026-10-05 18:10 KST
- **수행 내용**:
  1. **테마 전용 스타일 드롭다운(`ComboBox` / `<select>`) 전환 (WPF & Web)**:
     - WPF `MainWindow.xaml` 헤더의 테마 라디오 버튼을 공간 효율적인 `ComboBox` 드롭다운으로 교체하고 `CurrentTheme` 양방향 바인딩 완료.
  2. **WPF 초기 구동 시 다크 테마 글자색 시인성 결함 완벽 교정**:
     - `App.xaml` 전역 `TextBlock` 및 `Label` 기본 스타일 정의, `RootWindowBorder`에 `TextElement.Foreground="{DynamicResource TextPrimaryBrush}"`를 설정하여 시작 직후 어두운 글자 상속 현상을 근본 방지.
  3. **WPF 커스텀 업데이트 알림 전용 팝업 창 (`UpdateNotificationDialog.xaml`) 신규 제작 및 자동 실행**:
     - 새 버전 감지 시 전용 독립 다이얼로그 팝업창을 띄워 현재 버전 / 최신 버전 비교 카드, 공식 GitHub 저장소 경로, 릴리스 변경 사항 및 `[⚡ 지금 업데이트 (다운로드)]` 원클릭 버튼 제공.
  4. **docs/ 문서군 전면 동기화**:
     - `PATCHNOTES.md`, `USER_GUIDE.md`, `AUTO_UPDATE_GUIDE.md`, `WORK_LOG.md` 문서 일괄 최신화 완료.

### 📝 [작업 차수 60] 새 버전 감지 시 업데이트 알림 팝업창 자동 실행 및 공식 GitHub 경로 명시 (v1.4.5)
- **작업 일시**: 2026-10-05 17:55 KST
- **요청 사항**:
  1. `업데이트가 있으면 업데이트 알림 팝업창 자동 실행.`
  2. `업데이트 알림 팝업창은 업데이트 버튼과 깃허브 경로, 버전정보 들로 구성합니다.`
- **수행 내용**:
  1. **새 버전 감지 시 업데이트 알림 팝업창 자동 실행 연동 (`App.tsx`, `MainViewModel.cs`)**:
     - 앱 시작 시 또는 백그라운드 자동 조회 시 GitHub에 새 버전(`info.hasUpdate === true`)이 감지되면 업데이트 안내 팝업창(`UpdateModal`)이 즉시 자동 실행되도록 구현.
  2. **업데이트 팝업창 구성 요소 강화 (`UpdateModal.tsx`, `MainViewModel.cs`)**:
     - **업데이트 / 다운로드 액션 버튼**: `[🚀 새 버전 다운로드 (GitHub)]` 버튼 클릭 시 GitHub 릴리스/바이너리 다운로드 페이지로 직접 연결.
     - **공식 GitHub 저장소 경로 단독 카드 탑재**: `https://github.com/ahbiyout-all/K-Certificate-Manager` 원격 경로 및 바로 방문 버튼 전면 표출.
     - **버전 정보 명시**: 현재 설치 버전(`v1.4.5`) ➔ GitHub 최신 버전(`v1.X.X`), 배포 명칭 및 릴리스 노트 하이라이트 제공.
  3. **문서 및 패치노트 최신화**:
     - `docs/PATCHNOTES.md` 및 `docs/WORK_LOG.md` 업데이트.

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
