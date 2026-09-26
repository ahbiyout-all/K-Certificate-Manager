# K-Certificate Manager 자동 업데이트 구성 가이드 (Auto-Update Architecture)

본 문서는 **K-인증서 매니저(K-Certificate Manager)**의 웹 에디션 및 Windows C# WPF 데스크톱 에디션에 적용된 **GitHub Releases 기반 실시간 자동 업데이트 아키텍처**와 배포 워크플로를 설명합니다.

---

## 🏗️ 1. 자동 업데이트 아키텍처 개요

K-인증서 매니저는 복잡한 외부 유료 서버나 자체 CDN 없이, **GitHub의 공식 릴리스 API(`GitHub Releases REST API`)**를 활용하여 전 세계 어디서나 안전하고 빠른 무중단 버전 체크 및 다운로드를 제공합니다.

```
[개발자 배포]
  │ push_to_github.bat 실행 (태그: v1.4.3 푸시)
  ▼
[GitHub Cloud Actions]
  │ .github/workflows/build.yml 자동 실행
  │ ├─ .NET 8/10 데스크톱 컴파일 및 zip 압축
  │ └─ GitHub Releases에 'v1.4.3' 및 설치 파일 자동 등록
  ▼
[사용자 환경 (웹 및 데스크톱)]
  │ 앱 실행 시 백그라운드에서 GitHub API 비동기 조회
  │ (https://api.github.com/repos/ahbiyout-all/K-Certificate-Manager/releases/latest)
  ▼
[신규 버전 감지 시]
  │ 현재 버전(v1.4.2) vs 최신 버전(v1.4.3) Semver 비교
  │ ├─ 상단 헤더 / 사이드바 '업데이트 확인' 버튼에 강조 배지 표시
  │ ├─ 업데이트 알림 모달(UpdateModal) 팝업
  │ └─ 새 버전 변경 내역 안내 및 원클릭 다운로드 제공
```

---

## 💻 2. 플랫폼별 구현 내역

### 1) 웹 브라우저 에디션 (React + Vite)
- **핵심 서비스 파일**: `src/utils/updateChecker.ts`
  - `checkForAppUpdates()`: GitHub Releases API 비동기 Fetch (타임아웃 6초 방어)
  - `compareSemver(v1, v2)`: Semantic Versioning(MAJOR.MINOR.PATCH) 정밀 비교
  - 최신 릴리스 본문(Markdown 변경 내역) 및 데스크톱 zip 다운로드 직링크 자동 추출
- **UI 컴포넌트**: `src/components/UpdateModal.tsx`
  - 상단 헤더 및 사이드바에서 [업데이트 확인] 버튼을 누르면 즉시 조회 결과 표시
  - 최신 버전인 경우 안전 안내 메시지 표시, 새 버전인 경우 릴리스 노트와 원클릭 다운로드 버튼 제공

### 2) Windows C# WPF 데스크톱 에디션 (.NET)
- **핵심 서비스 파일**: `src-wpf/KCertManager.Wpf/Services/UpdateCheckerService.cs`
  - `CheckForUpdatesAsync()`: `HttpClient` 비동기 호출 (User-Agent 헤더 및 6초 타임아웃)
  - `IsVersionNewer()`: .NET `System.Version` 기반 버전 비교
  - 첨부된 `.zip` 및 `.exe` 파일 자동 감지 및 웹 브라우저 다운로드 연동

---

## 🚀 3. 새 버전 배포 시 릴리스 발행 절차

개발자가 새 버전을 배포할 때 사용자가 즉시 업데이트를 받아볼 수 있게 하는 방법은 매우 간단합니다:

1. **버전 번호 갱신**:
   - `package.json`: `"version": "1.4.3"`
   - `src/version.ts`: `export const APP_VERSION = '1.4.3';`
   - `src-wpf/KCertManager.Wpf/Services/UpdateCheckerService.cs`: `CURRENT_VERSION = "1.4.3";`
2. **`push_to_github.bat` 실행**:
   - 더블 클릭하여 실행하면 `v1.4.3` 태그가 자동으로 GitHub에 푸시됩니다.
3. **GitHub Actions 자동 처리**:
   - GitHub가 태그를 감지하여 릴리스 노트를 작성하고 `KCertManager-v1.4.3-WPF-Desktop.zip`을 첨부합니다.
4. **사용자 자동 수신**:
   - 전 세계 사용자의 앱 화면에 "새 버전(v1.4.3)이 출시되었습니다!" 알림이 뜨며 즉시 업데이트를 받을 수 있습니다.

---

## 🔒 4. 보안 및 안정성 설계
- **GitHub 공식 HTTPS API 통신**: 중간자 공격(MITM) 방지 및 안전한 암호화 채널 보장
- **비간섭 백그라운드 체크**: 오프라인 상태이거나 네트워크 오류 발생 시 사용자 작업을 방해하지 않고 조용히 기본값으로 폴백
- **공식 SHA-256 무결성 검증 지원**: 릴리스된 바이너리는 위변조 검사 완료 후 배포
