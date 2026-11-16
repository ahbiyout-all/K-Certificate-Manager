# K-Certificate Manager (K-인증서 매니저) v2.1.1

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-v2.1.1-green.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)
![.NET](https://img.shields.io/badge/.NET-8.0%20%7C%2010.0-512bd4.svg)
![WPF](https://img.shields.io/badge/Desktop-WPF%20C%23-blue.svg)

**대한민국 공무원 행정전자서명(GPKI/EPKI) 및 금융 공동인증서(NPKI) 자동 탐색·USB 일괄 백업 & PC 역방향 복사 통합 보안 관리 솔루션**

[공식 블로그](https://ahbiyoutvibe.blogspot.com/) • [GitHub 저장소](https://github.com/ahbiyout-all/K-Certificate-Manager) • [소속 회사 (청운정보시스템)](https://www.cisnet.co.kr)

</div>

---

## 🚀 최신 릴리스 정보 (Latest Release: v2.1.1)

> **버전**: `v2.1.1` (Semantic Versioning 2.0.0 PATCH Release)  
> **출시일**: 2026-11-16  
> **상세 변경 내역**: [docs/PATCHNOTES.md](./docs/PATCHNOTES.md) • [GitHub 문서](./docs/GITHUB_DOCS.md) • [GitHub 배포 가이드](./docs/GITHUB_GUIDE.md) • [버전 관리 정책](./docs/VERSIONING_POLICY.md)

### 🌟 v2.1.1 핵심 업데이트 및 안정화 내용
- **복사된 폴더 탐색기 드라이브 루트 정밀 타겟팅 (`OperationCompleteModal`, `BackupModal`, `OperationCompleteDialog`)**:
  - `'복사된 폴더 열기'` 클릭 시 `resolveCopiedFolderPath`로 드라이브 문자 뒤 누락 백슬래시(`\`)와 `targetPath`·`targetDiskName` 조합을 정규화해 실제 드라이브 루트(`E:\NPKI\...` 등)를 정확히 지정·호출 (`window.open`/`alert` 미사용 안전 폴백 포함)
- **비표준 경로 정위치 복구 마법사·안전 휴지통 격리 워크플로우 완성 (`App.tsx`, `DiagnosticsRepairDialog`, `CertIntegrityDoctor`)**:
  - 비표준 경로 인증서를 표준 위치로 복사한 직후 중복 ID 정리 후 원본을 안전 휴지통(`SafetyTrash`)으로 즉시 격리 이동하고 `RESTORE`/`DELETE` 활동 로그와 성공 토스트를 일관되게 기록·표시
  - WPF `CertIntegrityDoctor.RepairToStandardHierarchy`에 동일 폴더 조기 반환 및 동일 파일 자기덮어쓰기 `IOException` 방지 가드 적용
- **전수 감사 기반 경로·중복·무결성 안정화 (Web & WPF)**:
  - **Web**: `skip` 전략으로 실제 복사 `0`건일 때 허위 `"0건 완료"` 모달 대신 `중복 건너뛰기 완료` 화면과 `INFO` 로그·토스트만 출력 (`UsbToPcModal`, `App.tsx`); `USB:\NPKI|GPKI\Certificate|EPKI\Certificate` 표준 경로 인식(`certPathUtils.ts`), `sourceLocation` 폴더명 정규화·TradeSign 법인(`NPKI_CORP`) 분류(`certParser.ts`), `class1` 계층·발급기관+일련번호 중복 판정·외장 SSD/고속 USB 필터 통일(`usbToPcService.ts`, `backupService.ts`, `driveFilter.ts`)
  - **WPF**: `SafetyTrashManager` 볼륨 간 이동·덮어쓰기 전 `ReadOnly` 속성 재귀 해제, `CertTransferEngine`/`CertificateBackupService`/`UsbTransferViewModel` `class1` 계층 보존 및 동적 시스템 드라이브 적용, `KCertAntiDuplicationEngine` PC 표준 경로 우선(`PrimaryInstance`) 보존 및 SHA-256 누락 폴백 그룹핑, `FastScanPipeline` 말단 `\MPKI` GPKI 인식 보강
- **v2.1.0 ~ v2.0.0 핵심 기반 계승**:
  - GitHub 이동 없는 인앱 자동 다운로드·무인 셀프 설치 엔진(`UpdateCheckerService` & `updateChecker.ts`), WPF-Web 다크 테마(`#0F1219` / `#1A1F2C`) 통합 & CSS Grid `auto-fill` 반응형 카드 뷰, 전역 쉬운 일상 표현 + `더보기`/`Expander` UI, 60fps 무한 유동 애니메이션 테두리, Windows DPAPI/AES-256 암호화 보호 보관함, `/dist/v2.1.1/` 버전별 분리 배포 파이프라인 완비

---

## 📌 프로젝트 소개 (Overview)

<div align="center">
  <img src="docs/screenshots/main-screen.png" alt="K-인증서 매니저 메인 화면" width="850" />
</div>

**K-인증서 매니저 (K-Certificate Manager)**는 복잡하고 번거로운 대한민국 공인/공동인증서(NPKI), 정부 행정전자서명(GPKI), 교육부 전자서명(EPKI)을 한곳에서 안전하게 탐색하고 관리할 수 있도록 설계된 도구입니다.

- **표준 저장 경로 자동 스캔**: `AppData\LocalLow`, `C:\GPKI`, `C:\EPKI` 등 주요 시스템 경로 자동 인식
- **원클릭 USB 백업**: 선택한 인증서를 USB 메모리나 외장 드라이브의 표준 규격 폴더로 안전하게 복사
- **USB ➔ PC 역방향 가져오기**: USB에 저장된 인증서를 내 컴퓨터의 표준 보관함으로 원클릭 등록
- **SHA-256 무결성 검증**: 개인키(`signPri.key`)와 인증서(`signCert.der`)의 위변조 방지 및 트랜잭션 검증
- **듀얼 플랫폼 지원**: 최신 웹 브라우저 에디션(React + Vite) 및 Windows C# WPF 네이티브 데스크톱 에디션 제공

---

## ✨ 핵심 기능 (Key Features)

### 1. 전 규격 인증서 자동 탐색 및 식별
- **은행/신용카드/보험용 (NPKI)**: 금융결제원(yessign), 한국정보인증(KICA), 코스콤(SignKorea) 등
- **공무원 행정전자서명 (GPKI)**: 정부24, 온-나라 시스템, 행정안전부 행정기관용 인증서
- **교육부 전자서명 (EPKI)**: NEIS(나이스), K-에듀파인 교직원 전자서명

### 2. 양방향 안전 복사 및 스마트 감지
- **PC ➔ USB 일괄 백업**: 대상 드라이브의 포맷 형식(FAT32/exFAT/NTFS) 및 용량 분석 후 안전 복사
- **USB ➔ PC 역방향 복사**: 외부 USB 메모리 연결 시 자동 감지 모달 팝업 및 로컬 컴퓨터 등록 지원
- **충돌 방지 및 덮어쓰기 제어**: 동일 인증서 존재 시 버전/유효기간 비교 후 선택적 갱신

### 3. 직관적인 사용자 경험 & 보안
- **8종 테마 지원**: 다크, 화이트, 그레이, 베이지, 파스텔 화이트/그레이/블랙/베이지
- **안전 보관 휴지통**: 실수로 삭제된 인증서의 임시 보관 및 원클릭 복구 기능
- **작업 감사 로그 (Audit Logs)**: 백업, 복사, 복원 등 모든 파일 I/O 작업 기록 저장 및 내보내기

---

## 📂 프로젝트 구조 (Repository Structure)

```
K-Certificate-Manager/
├── src/                          # [웹 에디션] React 19 + TypeScript + Tailwind CSS
│   ├── components/               # UI 모달, 인증서 목록, 드라이브 패널, 헤더/사이드바
│   ├── data/                     # 기본 인증서 데이터 및 브랜딩 에셋
│   ├── utils/                    # USB I/O 서비스, 인증서 파서, 에러 핸들러
│   ├── types.ts                  # 핵심 인터페이스 및 데이터 모델
│   └── App.tsx                   # 메인 애플리케이션 컴포넌트
├── src-wpf/                      # [데스크톱 에디션] Windows C# WPF
│   ├── KCert.Core/               # X.509 파서, ASN.1, OID, USB 감시 순수 C# 코어 DLL
│   ├── KCert.Crypto/             # SEED-128, PKCS#8 복호화, RSA-SHA256 순수 암호화 DLL
│   └── KCertManager.Wpf/         # WPF 네이티브 데스크톱 UI 앱
├── docs/                         # 상세 기술 및 아키텍처 문서
│   ├── VERSIONING_POLICY.md      # SemVer 2.0.0 (MAJOR.MINOR.PATCH) 3단계 버전 관리 정책
│   ├── GITHUB_GUIDE.md           # GitHub CI/CD 및 릴리스 배포 가이드
│   ├── ARCHITECTURE.md           # 파일 시스템 규격 및 보안 설계 원칙
│   ├── KCERT_CORE_DLL_SPEC.md    # KCert.Core.dll 기술 명세서
│   └── BUILD_GUIDE.md            # Windows 자동화 빌드 가이드
├── build.bat                     # Windows 원클릭 자동 빌드 스크립트
├── build.ps1                     # PowerShell 기반 통합 빌드 도구
├── push_to_github.bat            # GitHub 원클릭 자동 커밋 및 푸시 스크립트
├── installer.iss                 # Inno Setup 윈도우 인스톨러 스크립트
└── package.json                  # Node.js 패키지 설정
```

---

## 🚀 빠른 시작 (Getting Started)

### 웹 에디션 실행 (Local Web App)

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### Windows 네이티브 데스크톱 빌드 (WPF / .NET)

프로젝트 루트의 `build.bat`을 더블 클릭하여 실행하거나 터미널에서 다음 명령어를 입력합니다:

```cmd
# 자동 빌드 및 패키징 실행
build.bat
```

빌드가 완료되면 `dist/v2.1.1/` 폴더에 버전별 하위 디렉터리(`web`, `win-x64`, `core-dll`, `unpacked`, `installer`)로 배포용 포터블 실행 파일 및 Inno Setup 설치 프로그램(`kcert-manager-v2.1.1-setup.exe`)이 체계적으로 분리 생성됩니다.

---

## 📜 라이선스 및 저작권 (License)

- **License**: MIT License (한국어/영어 듀얼 라이선스 정의)
- **Copyright (c) 2026 AhBiYout**. All rights reserved.
- 자세한 라이선스 조항은 [LICENSE.txt](./LICENSE.txt) 또는 [docs/LICENSE.md](./docs/LICENSE.md)를 참조하십시오.

---

## 📞 문의 및 개발자 정보 (Contact)

- **개발자 (Developer)**: AhBiYout
- **GitHub 저장소**: [https://github.com/ahbiyout-all/K-Certificate-Manager](https://github.com/ahbiyout-all/K-Certificate-Manager)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr)
- **소속 회사**: (주)청운정보시스템 ( cisnet.co.kr )


