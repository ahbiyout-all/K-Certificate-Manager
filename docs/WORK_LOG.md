# K-인증서 매니저 작업 로그 (Work Log)

본 문서는 K-인증서 매니저(K-Certificate Manager)의 개발, 기능 구현, 버그 수정, 빌드 환경 구성 및 문서화 작업을 상세히 기록하는 공식 작업 일지입니다.

---

## 📌 프로젝트 기본 정보

- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **현재 버전**: `v1.4.3` (Semantic Versioning 2.0.0)
- **개발자**: AhBiYout
- **구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **공식 홈페이지**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/) (CISNet)
- **대상 환경**: Windows 10/11, Web/Electron 기반 환경, CRLF 빌드 스크립트

---

## 📅 작업 기록 상세 내역

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
