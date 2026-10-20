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
