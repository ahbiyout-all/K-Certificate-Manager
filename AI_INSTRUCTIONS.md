# 🤖 K-인증서 매니저 AI 개발 행동 강령 및 유지보수 가이드 (AI_INSTRUCTIONS.md)

본 문서는 **K-인증서 매니저 (K-Certificate Manager)** 프로젝트의 유지보수, 기능 확장, 디버깅 및 배포 작업을 수행하는 AI 코딩 엔지니어가 반드시 준수해야 하는 행동 강령, 프로젝트 컨텍스트, 기술 아키텍처 및 품질 보증 규칙을 정의합니다.

---

## 📌 1. 기본 행동 수칙 및 자아검증 (Self-Reflection)

1. **실현 가능성 검증 (Feasibility Check)**:
   - 오직 실제 Windows 및 Web 환경에서 구현 및 실행이 가능한 기술 범위 내에서만 구조를 설계합니다.
   - 가상의 API나 지원되지 않는 문법을 사용하지 않으며, 네이티브 OS API와 표준 라이브러리를 우선합니다.
2. **단계별 순차 진행 (Sequential Execution)**:
   - 무리하게 다수의 파일을 한 번에 일괄 변경하지 않고, 수립된 로드맵 순서에 맞춰 한 단계씩 논리적으로 작업을 진행합니다.
3. **미구현 코드 점검 (Completeness Audit)**:
   - 작업 전/후로 미구현되거나 누락된 TODO/Stub 코드가 남아 있는지 기존 코드베이스와 정밀 비교합니다.
4. **환각(Hallucination) 방지**:
   - 작성한 코드가 실제 컴파일될 소스 파일에 완전하고 깨끗한 블록으로 반영되는지 스스로 검증하며, 프리뷰에만 존재하고 파일에 미반영되는 현상이 없도록 합니다.
5. **자아성찰 수정을 로드맵에 반영 (Self-Correction Loop)**:
   - 검증 과정(`compile_applet`, `lint_applet`, 테스트)에서 오류나 미흡한 점이 확인되면 즉시 원인을 분석하고 다음 로드맵 순서에 따라 정밀하게 수정을 완료합니다.

---

## 🏗️ 2. 프로젝트 컨텍스트 및 기술 스택

### 2.1 소프트웨어 개요
- **명칭**: K-인증서 매니저 (K-Certificate Manager)
- **개발자 / 저작권**: AhBiYout (CISNet: http://www.cisnet.co.kr/ | 블로그: https://ahbiyoutvibe.blogspot.com/)
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt` 및 영어 `LICENSE_EN.txt` 2종 라이선스 공식 체계)
- **목적**: 대한민국 공무원 행정전자서명(GPKI), 교직원 교육부 전자서명(EPKI), 금융·개인 공동인증서(NPKI)를 안전하게 탐색하고 USB 양방향 백업/복원 및 무결성 검증을 제공하는 통합 솔루션.

### 2.2 듀얼 플랫폼 아키텍처
| 구분 | 웹 에디션 (Web SPA) | 윈도우 데스크톱 에디션 (Native Desktop) |
| :--- | :--- | :--- |
| **기반 기술** | **React 19 + TypeScript + Vite 6.2** | **C# .NET 10.0 / .NET 8.0 WPF (MVVM)** |
| **스타일링 / UI** | Tailwind CSS v4, Lucide Icons, 모던 카드 UI | XAML, WindowChrome 일체형 모던 프레임리스 |
| **핵심 라이브러리** | `src/utils/certParser.ts`, `usbService.ts` | **`KCert.Core.dll` (순수 창작 독립 코어 DLL)** |
| **서드파티 의존성** | 무설치 브라우저 구동 (Zero NPAPI/ActiveX) | **외부 서드파티 제로** (표준 .NET 암호화만 사용) |
| **패키징** | Vite Production Bundle (`release/04_WebBundle`) | Single-File Executable (`release/05_WpfDesktop`) |
| **배포 규격** | Inno Setup 6 (`installer.iss`) 폴더 풀림(Unpacked Multi-File) 무설치/정식 설치 마법사 에디션 지원 |

---

## 🛡️ 3. 핵심 기능 및 보안 아키텍처 규칙

### 3.1 7대 보안 하드닝 (Security Hardening)
1. **화이트리스트 확장자 필터링**: 파일 복사/백업 시 `.der`, `.cer`, `.crt`, `.key`, `.pri`, `.pfx`, `.p12`, `.pem`만 허용하며, 악성 실행파일(`.exe`, `.bat` 등) 전파 원천 차단.
2. **Path Traversal 방지**: 모든 경로는 `Path.GetFullPath` 및 정규화 검증을 거쳐 상위 경로(`../`) 이탈 차단.
3. **512KB DoS 가드**: 비정상적으로 거대한 위조 인증서 파일로부터 메모리 고갈 방어.
4. **SHA-256 원자적 트랜잭션**: 임시 파일(`.tmp`) 복사 후 해시 100% 일치 시에만 최종 확정(Commit).
5. **동일 디스크/USB 내 자가 복사(Self-Copy) 금지**: 원본 인증서가 위치한 동일 드라이브(예: `E:` ➔ `E:`)로의 복사를 원천 차단하고 잠금 배지/경고 제공.
6. **물리 디스크 전용 감지**: CD-ROM/DVD, 가상디스크(VHD/RAMDisk), 클라우드 마운트 드라이브(구글 드라이브, 원드라이브, 드롭박스, 레이드라이브 등)를 목록에서 제외하고 실제 물리 디스크 및 USB만 표시.
7. **복사 목적지 디스크 지정 팝업창 (`TargetDrivePickerModal.tsx`)**: 복사 실행 전 대상 디스크를 선택하도록 유도하여 USB 미연결 시 C: 드라이브 오복사 방지.

### 3.2 4대 테마 시스템 및 WCAG 고대비 원칙
- **지원 테마**: 다크(`dark`), 회색(`gray`), 화이트(`white`), 베이지(`beige`).
- **시안성 보장**: 모든 테마에서 본문 텍스트와 배경의 명암비가 WCAG AA/AAA 규격을 만족해야 하며, 버튼 클릭 시 액티브 스케일 피드백을 제공합니다.

---

## ⚙️ 4. 빌드 및 배포 자동화 파이프라인

### 4.1 3단계 자동 동적 버전 갱신 파이프라인
프로젝트는 패치노트(`docs/PATCHNOTES.md`) 및 `package.json`을 단일 진실 공급원(SSOT)으로 삼아 버전을 자동으로 판별합니다:
1. **1차 기준**: `package.json`의 `"version"` 필드 (Node.js 및 PowerShell 지원)
2. **2차 기준**: `docs/PATCHNOTES.md` 상단 최신 릴리스 헤더(`### 🚀 [vX.X.X]`) 정규식 파싱
3. **3차 기준**: 안전 기본값 fallback

### 4.2 버전 동기화 필수 파일 목록
버전을 올릴 때(예: `v1.4.5` ➔ `v1.4.6`) 아래 파일들이 반드시 동시에 동기화되어야 합니다:
- `package.json` (`"version": "X.Y.Z"`)
- `src-wpf/KCertManager.Wpf/KCertManager.Wpf.csproj` (`<Version>`, `<AssemblyVersion>`, `<FileVersion>`)
- `src-wpf/KCert.Core/KCert.Core.csproj` (`<Version>`, `<AssemblyVersion>`, `<FileVersion>`)
- `src-wpf/KCertManager.Wpf/Services/UpdateCheckerService.cs` (`CURRENT_VERSION = "X.Y.Z"`)
- `installer.iss` (`#define MyAppVersion "X.Y.Z"`)
- `README.md` (상단 타이틀, 뱃지, 최신 릴리스 섹션)
- `docs/PATCHNOTES.md` (신규 릴리스 섹션 추가)
- `docs/WORK_LOG.md` (해당 작업 차수 기록)
- `LICENSE.txt`, `LICENSE_KR.txt`, `LICENSE_EN.txt` (버전 표기)

### 4.3 빌드 스크립트 작성 규칙
- Windows 배치 스크립트(`build.bat`, `push_to_github.bat`)는 반드시 **Windows CRLF** 줄바꿈 인코딩을 유지합니다.
- PowerShell 환경변수 주입 시 `Out-File` 대신 **`[System.IO.File]::AppendAllText`**를 사용하여 개행 문자(`\r`) 오염으로 인한 `invalid path 'CRLF:'` 에러를 원천 차단합니다.

---

## 📂 5. 깃허브(GitHub) 업로드 및 릴리스 규칙

1. **저장소 구조**:
   - `src/` : 웹 에디션 소스 코드 (React + TypeScript)
   - `src-wpf/` : 데스크톱 에디션 C# 소스 코드 (`KCert.Core`, `KCertManager.Wpf`)
   - `docs/` : 기술 명세서, 가이드, 패치노트, 작업 로그
   - `build.bat`, `build.ps1` : 원클릭 로컬 자동 빌드 스크립트
   - `push_to_github.bat`, `push_to_github.ps1` : GitHub 원클릭 업로드 스크립트
   - `installer.iss` : Inno Setup 공식 인스톨러 스크립트
2. **대용량 파일 격리**:
   - `release/`, `dist/`, `node_modules/`, `**/bin/`, `**/obj/` 폴더는 GitHub 100MB 용량 제한을 초과하므로 Git 추적에서 철저히 제외합니다.
3. **릴리스 관리**:
   - `push_to_github.bat`을 통해 소스코드와 `vX.Y.Z` 태그가 푸시되면, GitHub Releases (`/releases/new`)에서 해당 태그를 선택하고 빌드 산출물(`setup.exe`, `Desktop.zip`, `Standalone.exe`)을 첨부하여 `[Publish release]`를 완료합니다.

---

## 🔍 6. AI 점검 체크리스트 (작업 완료 전 필수 확인)

- [ ] `compile_applet` 도구를 호출하여 전체 빌드가 성공하는가?
- [ ] `lint_applet` 도구를 호출하여 TypeScript 구문 오류나 누락된 import가 없는가?
- [ ] WPF XAML 파일에 고정된 하드코딩 버전 문자열이 남아있지 않고 `AppVersion` 바인딩을 사용하는가?
- [ ] 신규 기능 추가 시 `docs/PATCHNOTES.md`와 `docs/WORK_LOG.md`에 누락 없이 기록되었는가?
- [ ] 파일 시스템에 불필요한 임시 파일이나 콜론(`:`)이 들어간 금지 파일명이 생성되지 않았는가?
