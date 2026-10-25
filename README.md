# K-Certificate Manager (K-인증서 매니저) v1.6.5

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-v1.6.5-green.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)
![.NET](https://img.shields.io/badge/.NET-8.0%20%7C%2010.0-512bd4.svg)
![WPF](https://img.shields.io/badge/Desktop-WPF%20C%23-blue.svg)

**대한민국 공무원 행정전자서명(GPKI/EPKI) 및 금융 공동인증서(NPKI) 자동 탐색·USB 일괄 백업 & PC 역방향 복사 통합 보안 관리 솔루션**

[공식 블로그](https://ahbiyoutvibe.blogspot.com/) • [GitHub 저장소](https://github.com/AhBiYout-all/K-Certificate-Manager) • [회사 홈페이지 (CISNet)](https://www.cisnet.co.kr)

</div>

---

## 🚀 최신 릴리스 정보 (Latest Release: v1.6.5)

> **버전**: `v1.6.5` (최신 안정화 빌드)  
> **출시일**: 2026-10-25  
> **상세 변경 내역**: [docs/PATCHNOTES.md](./docs/PATCHNOTES.md)

### 🌟 v1.6.5 핵심 업데이트 내용
- **Web & WPF 모든 테이블 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화**: 메인 인증서 목록, PC ➔ USB 복사창, USB ➔ PC 가져오기창, 만료 정리, 휴지통, 백업 이력, 작업 감사 로그 등 전체 뷰의 최좌측 열 번호가 1번부터 시작하도록 일관되게 적용
- **최좌측 인덱스 열 상시 고정 (Frozen & Sticky Column)**: 데스크톱 WPF DataGrid `FrozenColumnCount="1"` 및 웹 React `sticky left-0 z-10`을 적용하여 가로 스크롤 시에도 최좌측 1번 인덱스 열이 화면에 고정 노출
- **작업 완료 안내 전용 팝업창 신설 (`OperationCompleteDialog` / `OperationCompleteModal`)**: 복사/가져오기 성공 시 에메랄드 성공 배지, SHA-256 데이터 무결성 100% 검증, 출발지➔도착지 경로, 인증서 목록 및 실용 후속 조치 가이드를 제공하는 전용 팝업창 전면 연동
- **오른쪽 상단 창 제어 버튼(최소/최대/닫기) 독립 격리 고정**: 창 크기를 줄여도 상단 창 제어 버튼이 화면 밖으로 밀려나지 않고 최우측 상단에 100% 온전하게 고정 노출 보장
- **드라이브 쓰기 오류 및 권한 문제 시 명확한 에러 알림 모달 (`CopyErrorAlertModal`)**: USB 쓰기 금지(Write-Protected), 권한 거부, 디스크 용량 부족 등 I/O 예외 발생 시 단계별 조치 가이드 및 원클릭 재시도 제공
- **작업 감사 로그(Activity Log) 1번 인덱스 열 신설 및 동적 재색인**: 실시간 보안 감사 로그에 최좌측 1번 인덱스 열 신설 및 최신 항목 자동 재색인 파이프라인 탑재
- **C# .NET 10 / .NET 8 릴리스 빌드 파이프라인 무결성 확보**: `UpdateBackupHistoryIndices` 구현으로 CS0103 컴파일 에러 해소 및 Inno Setup 설치 프로그램(`kcert-manager-v1.6.5-setup.exe`) 빌드 무결성 보장

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
│   ├── KCert.Core/               # 순수 .NET 암호화 및 인증서 탐색 코어 DLL
│   └── KCertManager.Wpf/         # WPF 네이티브 데스크톱 UI 앱
├── docs/                         # 상세 기술 및 아키텍처 문서
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

빌드가 완료되면 `release/` 폴더에 배포용 포터블 실행 파일 및 Inno Setup 설치 프로그램(`setup.exe`)이 생성됩니다.

---

## 📤 GitHub에 올리는 방법 (How to Push to GitHub)

본 프로젝트에는 GitHub 원클릭 업로드 스크립트(`push_to_github.bat`)가 포함되어 있습니다.

### 방법 1. 원클릭 배치 파일 사용 (가장 간단)
1. GitHub([https://github.com/new](https://github.com/new))에서 **`K-Certificate-Manager`** 이름으로 새 빈 저장소를 생성합니다.
2. 프로젝트 루트의 **`push_to_github.bat`** 파일을 더블 클릭하여 실행합니다.
3. 브라우저 GitHub 인증 창이 열리면 로그인 및 승인을 완료합니다.

### 방법 2. Git CLI 수동 업로드

```bash
# 1. Git 저장소 초기화
git init
git config user.name "AhBiYout-all"
git config user.email "AhBiYout-all@users.noreply.github.com"

# 2. 파일 스테이징 및 커밋
git add .
git commit -m "feat: release K-Certificate Manager v1.6.5"

# 3. 원격 저장소 연결 및 푸시
git branch -M main
git remote add origin https://github.com/AhBiYout-all/K-Certificate-Manager.git
git push -u origin main --force
```

---

## 📜 라이선스 및 저작권 (License)

- **License**: MIT License (한국어/영어 듀얼 라이선스 정의)
- **Copyright (c) 2026 AhBiYout**. All rights reserved.
- 자세한 라이선스 조항은 [LICENSE.txt](./LICENSE.txt) 또는 [docs/LICENSE.md](./docs/LICENSE.md)를 참조하십시오.

---

## 📞 문의 및 개발자 정보 (Contact)

- **개발자 (Developer)**: AhBiYout
- **GitHub 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속 회사**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr) ((주)씨아이에스넷 CISNet)


