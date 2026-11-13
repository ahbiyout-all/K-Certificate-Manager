# K-Certificate Manager 자동 업데이트 및 릴리스 배포 가이드 (Auto-Update Architecture)

본 문서는 **K-인증서 매니저(K-Certificate Manager)**의 웹 에디션 및 Windows C# WPF 데스크톱 에디션에 적용된 **GitHub 기반 3계층(3-Tier) 실시간 자동 업데이트 엔진**과 **GitHub 릴리스 발행 절차**를 상세히 설명합니다.

---

## 🔍 1. 1.4.2 버전에서 1.4.3 업데이트 알림이 안 떴던 원인 및 해결책

### 🚨 발생 원인 분석
1. **GitHub의 'Git Tag' vs 'GitHub Release' 구조적 차이**:
   - `push_to_github.bat`를 통해 `git push origin v1.4.3`을 실행하면 GitHub에 **Git Tag(태그)**가 올라갑니다.
   - 그러나 GitHub REST API의 `/repos/:owner/:repo/releases/latest` 엔드포인트는 GitHub 웹 UI에서 **'Release(릴리스)'를 정식으로 Draft/Publish 하거나 Actions가 Release 객체를 생성하기 전까지는 `404 Not Found`**를 반환합니다.
   - 기존 업데이트 체커가 `/releases/latest`의 단일 응답에만 의존했기 때문에, 정식 Release 버튼을 누르기 전인 Tag-only 상태에서는 업데이트가 없다고 판정되었습니다.
2. **브라우저/네트워크 캐싱**:
   - GitHub API 응답이 이전 404 상태로 로컬 캐시되어 새 릴리스가 등록된 직후에도 즉시 갱신되지 않는 현상.

### 🛡️ 3계층(3-Tier) 다중 폴백 & 인앱 자동 셀프 설치 엔진 (`v2.1.0`)
업데이트 체커는 **3단계 다계층 폴백(Fallback)**과 **타임스탬프 캐시 버스팅(`?_t=Date.now()`)**으로 신규 버전을 즉시 감지하며, 사용자가 업데이트 창에서 확인을 누르면 **GitHub 웹페이지로 이동하지 않고 앱 내부에서 직접 다운로드·검증 후 셀프 설치**를 수행합니다.

```
[ 1단계: /releases/latest ] ──(404 발생 시 즉시 폴백)──►
[ 2단계: /releases (전체 릴리스 목록) ] ──(비어있을 시 즉시 폴백)──►
[ 3단계: /tags (Git 태그 직결 엔드포인트) ] ──► 최신 v2.1.0 태그 및 설치 에셋 즉시 감지!
```

---

## 🏗️ 2. 자동 업데이트 및 셀프 설치 동작 흐름도

```
[ 개발자 PC ]
  │ 1. v2.1.0 태그 및 소스 푸시
  │ 2. GitHub Actions 자동 빌드 및 릴리스 인스톨러(kcert-manager-v2.1.0-setup.exe) 생성
  ▼
[ 사용자 환경 (WPF 데스크톱 & Web) ]
  │ 1. 앱 시작 1.2초 후 또는 [업데이트 확인] 클릭 시 3-Tier API 비동기 조회
  │ 2. 새 버전 감지 시 업데이트 알림 창 자동 표시
  ▼
[ 확인 (자동 다운로드 · 설치) 클릭 시 ]
  ├─ (WPF) 1) %TEMP%\KCertManager_AutoUpdate\v2.1.0\ 로 스트리밍 다운로드 + 실시간 진행률 표시
  ├─ (WPF) 2) PE 실행 파일(MZ) / ZIP(PK) 헤더 및 용량 무결성 검증
  ├─ (WPF) 3) 분리 PowerShell 업데이터(apply_self_update.ps1) 실행 → 앱 안전 종료 → /SILENT 무인 설치 → 자동 재시작
  └─ (Web) 스트림 다운로드 → WebCrypto SHA-256 검증 → Cache Storage 갱신 & 설치 버전 상태 즉시 반영
```

---

## 💻 3. 플랫폼별 구현 파일

### 1) 웹 브라우저 에디션 (React + TypeScript)
- **`src/utils/updateChecker.ts`**:
  - `checkForAppUpdates()`: 3-Tier 폴백 및 `Cache-Control: no-cache, no-store` 캐시 버스팅
  - `compareSemver(v1, v2)`: 시맨틱 버전(MAJOR.MINOR.PATCH) 숫자 단위 비교
  - `runInAppSelfUpdate()`: 외부 브라우저 이동 없이 3단계 인앱 다운로드·SHA-256 검증·버전 상태 반영 수행
- **`src/components/UpdateModal.tsx`**:
  - `[확인 (자동 다운로드 · 설치)]` 버튼, 실시간 진행률 프로그레스 바, SHA-256 해시 결과, `[다시 확인]` 기능 제공

### 2) Windows C# WPF 데스크톱 에디션 (.NET)
- **`src-wpf/KCertManager.Wpf/Services/UpdateCheckerService.cs`**:
  - `CheckForUpdatesAsync()`: 비동기 3-Tier REST 호출 및 `kcert-manager-v*-setup.exe` 에셋 자동 매칭
  - `DownloadAndInstallAsync()`: 실시간 `IProgress<UpdateInstallProgress>` 스트리밍 다운로드, 바이너리 헤더 검증 및 `apply_self_update.ps1` 무인 설치 스크립트 구동
- **`src-wpf/KCertManager.Wpf/Views/UpdateNotificationDialog.xaml` / `.xaml.cs`**:
  - 새 버전 감지 시 자동 팝업, `[확인 (자동 다운로드 · 설치)]` 클릭 시 진행률/단계 표시 및 실패 시 인라인 재시도 지원
- **`src-wpf/KCertManager.Wpf/ViewModels/MainViewModel.cs`**:
  - **시작 시 백그라운드 자동 확인**: UI 렌더링 1.2초 후 `CheckForAppUpdatesAsync(isSilentWhenUpToDate: true)` 실행
  - **대화형 폴백 안전장치**: 다이얼로그 생성 예외 시에도 외부 브라우저를 열지 않고 `DownloadAndInstallAsync`로 직접 셀프 설치 연계

---

## 🚀 4. GitHub 릴리스 배포 가이드 (Step-by-Step)

1. **Git 태그 및 소스 푸시**:
   - 최신 소스와 `v2.1.0` 태그를 GitHub에 푸시합니다.
2. **GitHub Releases 발행 확인**:
   - `.github/workflows/build.yml`이 자동으로 Inno Setup 설치 프로그램(`kcert-manager-v2.1.0-setup.exe`)을 빌드해 Release 에셋으로 첨부합니다.
   - 수동 발행 시에도 `https://github.com/AhBiYout-all/K-Certificate-Manager/releases/new`에서 `v2.1.0` 태그 선택 후 `kcert-manager-v2.1.0-setup.exe`를 첨부해 Publish 합니다.
   - Publish 즉시 기존 버전 사용자 앱에서 자동 다운로드 및 무인 셀프 설치가 동작합니다.

---

## 🎨 5. 바탕화면 아이콘 최대 크기(Full-Bleed) 개선 사양
- **기존 문제점**: 기존 아이콘의 외부 투명 여백으로 인해 윈도우 바탕화면에서 작게 축소되어 보임.
- **v1.4.3 개선 사항**:
  - 캔버스의 96%를 꽉 채우는 **Full-Bleed 스퀘어클(Squircle) & 골드 메탈릭 방패 프레임** 적용.
  - 고대비 네이비/미드나이트 블루 배경 위에 황금 열쇠 및 공공 인증서 인장을 초대형으로 배치.
  - Windows 표준 다중 해상도(256x256, 128x128, 64x64, 48x48, 32x32, 16x16) 완벽 패키징으로 모든 배율(100%~250%)에서 큼직하고 선명하게 표시.
