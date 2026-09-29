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

### 🛡️ v1.4.3의 완벽한 해결책: 3계층(3-Tier) 다중 폴백 엔진
새로 업그레이드된 업데이트 체커는 아래의 **3단계 다계층 폴백(Fallback)**과 **타임스탬프 캐시 버스팅(`?_t=Date.now()`)**을 수행하여, 태그만 올라와 있어도 즉시 신규 버전을 감지합니다!

```
[ 1단계: /releases/latest ] ──(404 발생 시 즉시 폴백)──►
[ 2단계: /releases (전체 릴리스 목록) ] ──(비어있을 시 즉시 폴백)──►
[ 3단계: /tags (Git 태그 직결 엔드포인트) ] ──► 최신 v1.4.3 태그 즉시 감지 & 알림 점등!
```

---

## 🏗️ 2. 자동 업데이트 동작 흐름도

```
[ 개발자 PC ]
  │ 1. push_to_github.bat 실행 (v1.4.3 태그 및 소스 업로드)
  │ 2. (선택) GitHub 웹에서 'Draft a new release' -> 'v1.4.3' 선택 후 Publish
  ▼
[ GitHub 원격 저장소 ]
  │ Tags: v1.4.3 등록 완료
  │ Releases: v1.4.3 등록 완료
  ▼
[ 사용자 환경 (웹 & WPF 데스크톱) ]
  │ 1. 앱 첫 실행 시 또는 [업데이트 확인] 버튼 클릭 시
  │ 2. 3-Tier API 비동기 조회 (releases/latest -> releases -> tags)
  ▼
[ 업데이트 감지 시 ]
  ├─ 1) 우측 하단 토스트 알림: "✨ 새 버전 v1.4.3이 출시되었습니다!"
  ├─ 2) 상단 헤더 / 사이드바 [업데이트 확인] 버튼에 주황색 펄스 뱃지 점등
  ├─ 3) 업데이트 모달(UpdateModal)에서 버전 비교 & 릴리스 노트 & 직링크 다운로드 제공
  └─ 4) [새 버전 다운로드] 원클릭 이동
```

---

## 💻 3. 플랫폼별 구현 파일

### 1) 웹 브라우저 에디션 (React + TypeScript)
- **`src/utils/updateChecker.ts`**:
  - `checkForAppUpdates()`: 3-Tier 폴백 및 `Cache-Control: no-cache, no-store` 캐시 버스팅
  - `compareSemver(v1, v2)`: 정규식 기반 시맨틱 버전(MAJOR.MINOR.PATCH) 완벽 파싱
- **`src/components/UpdateModal.tsx`**:
  - 감지 경로(`detectionSource`: 공식 릴리스 / 릴리스 목록 / Git 태그) 및 확인 시각 투명 표시
  - [다시 확인(Recheck)] 버튼 내장

### 2) Windows C# WPF 데스크톱 에디션 (.NET)
- **`src-wpf/KCertManager.Wpf/Services/UpdateCheckerService.cs`**:
  - `HttpClient` 기반 비동기 3-Tier REST 호출
  - 첨부 파일(`.zip` / `.exe`) 자동 링크 파싱 및 웹 브라우저 다운로드 연동

---

## 🚀 4. GitHub 릴리스 완벽 배포 가이드 (Step-by-Step)

1. **배포 스크립트 실행**:
   - `push_to_github.bat` (또는 `push_to_github.ps1`) 실행
   - 최신 소스코드와 `v1.4.3` 태그가 GitHub에 자동 푸시됩니다.

2. **GitHub Releases 등록 (권장)**:
   - 브라우저로 저장소 접속: `https://github.com/ahbiyout-all/K-Certificate-Manager/releases`
   - **[Draft a new release]** 버튼 클릭
   - **Choose a tag**: 방금 푸시된 `v1.4.3` 선택
   - **Release title**: `K-Certificate Manager v1.4.3 (Full-Bleed Icon & WebAudio Feedback)`
   - **Description**: 주요 업데이트 내용 입력
   - **[Publish release]** 클릭
   - ➔ 즉시 전 세계 모든 사용자의 앱에 업데이트 모달 및 뱃지가 뜹니다.

---

## 🎨 5. 바탕화면 아이콘 최대 크기(Full-Bleed) 개선 사양
- **기존 문제점**: 기존 아이콘의 외부 투명 여백으로 인해 윈도우 바탕화면에서 작게 축소되어 보임.
- **v1.4.3 개선 사항**:
  - 캔버스의 96%를 꽉 채우는 **Full-Bleed 스퀘어클(Squircle) & 골드 메탈릭 방패 프레임** 적용.
  - 고대비 네이비/미드나이트 블루 배경 위에 황금 열쇠 및 공공 인증서 인장을 초대형으로 배치.
  - Windows 표준 다중 해상도(256x256, 128x128, 64x64, 48x48, 32x32, 16x16) 완벽 패키징으로 모든 배율(100%~250%)에서 큼직하고 선명하게 표시.
