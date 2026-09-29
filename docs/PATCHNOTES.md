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

### 🚀 [v1.4.3] - 2026-09-28
**변경 구분**: `PATCH` (3계층 GitHub 자동 업데이트 엔진, 바탕화면 Full-Bleed 고대비 아이콘 패키징, 인증서 복사 완료 시 CSS 깜빡임 애니메이션 및 Web Audio API 화음 알림음 추가, 첫 실행 기본 베이지 테마 적용)

#### ✨ 주요 개선 및 신규 기능 (Improvements & Features)
- **3계층(3-Tier) GitHub 자동 업데이트 감지 엔진 도입 (`updateChecker.ts`, `UpdateCheckerService.cs`)**
  - **발생 원인 해결**: 기존에는 GitHub Releases 공식 릴리스(`/releases/latest`)만 조회하여, 사용자가 `push_to_github.bat`를 통해 Git Tag(`v1.4.3`)만 푸시하고 GitHub 웹에서 Release 발행을 하지 않은 경우 `404 Not Found`가 발생하여 업데이트가 누락되던 문제를 완벽 해결.
  - **3단계 자동 폴백**: `1단계(/releases/latest)` ➔ `2단계(/releases 목록)` ➔ `3단계(/tags Git 태그 직결)` 순으로 자동 탐색하여 태그만 생성되어도 즉시 신규 버전을 감지하고 알림을 띄웁니다.
  - **캐시 버스팅**: `?_t=Date.now()` 및 `Cache-Control: no-cache` 헤더를 적용하여 프록시/브라우저의 이전 404 캐시로 인한 알림 지연을 방어.
  - **업데이트 모달 고도화 (`UpdateModal.tsx`)**: 감지 출처(공식 릴리스 / 릴리스 목록 / Git 태그) 및 확인 시각 투명 표시, [다시 확인] 버튼 추가.
- **바탕화면 아이콘 꽉 찬 최대 크기(Full-Bleed) 개선 (`Assets/app.ico`, `app-logo.png`)**
  - 캔버스의 96%를 꽉 채우는 고대비 스퀘어클(Squircle) 및 황금 메탈릭 방패 프레임 디자인 적용.
  - 외부 투명 여백을 최소화하여 Windows 바탕화면 및 파일 탐색기에서 큼직하고 웅장하게 표시.
  - 256x256, 128x128, 64x64, 48x48, 32x32, 16x16 멀티 해상도 Windows 표준 ICO 완전 패키징.
- **인증서 복사 성공 시 행 하이라이트 깜빡임 CSS 애니메이션 (`rowCopiedFlash` / `animate-copied-row`)**
  - 인증서 디스크 백업(`BackupModal`) 및 USB ➔ 컴퓨터 복사(`UsbToPcModal`) 성공 시 `CertificateList` 내 대상 행들이 에메랄드 빛으로 2회 부드럽게 깜빡이는 키프레임 애니메이션 적용.
  - 복사 완료된 행 우측에 `✨ 복사 완료` 뱃지를 표시하여 사용자가 작업 대상 인증서를 즉시 시각적으로 확인 가능.
- **Web Audio API 기반 무음원 고품질 완료 알림음 (`audioFeedback.ts`)**
  - 외부 오디오 파일(.mp3, .wav) 로딩 없이 브라우저 내장 Web Audio API 오실레이터를 사용하여 3단계 상승 하모닉 차임(`Eb5 ➔ G5 ➔ C6`)을 정밀 합성 재생.
  - 복사 완료 시 청각적 안정감과 명확한 작업 종료 피드백 제공.
  - Windows C# 데스크톱 WPF 앱에서도 Windows `SystemSounds.Asterisk` 사운드 연동 완료.
- **첫 실행 시 기본 테마 '포근한 크림 베이지(Warm Cream Beige)' 설정 (`App.tsx`, `index.css`)**
  - 저장된 설정이 없는 최초 실행 사용자에게 눈이 편안하고 포근한 감성의 베이지 테마를 기본값으로 적용.
  - 다크, 회색, 화이트, 베이지 4대 테마 전반의 텍스트 대비(Contrast) 및 테이블 헤더 시인성 고도화.
- **GitHub 업로드 스크립트 및 릴리스 배포 가이드 갱신 (`push_to_github.bat`, `push_to_github.ps1`, `docs/AUTO_UPDATE_GUIDE.md`)**
  - 버전 `1.4.3` 동기화 및 릴리스 발행 팁 안내 출력.

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
