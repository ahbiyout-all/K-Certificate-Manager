# K-Certificate Manager (K-인증서 매니저) v1.7.2

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-v1.7.2-green.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)
![.NET](https://img.shields.io/badge/.NET-8.0%20%7C%2010.0-512bd4.svg)
![WPF](https://img.shields.io/badge/Desktop-WPF%20C%23-blue.svg)

**대한민국 공무원 행정전자서명(GPKI/EPKI) 및 금융 공동인증서(NPKI) 자동 탐색·USB 일괄 백업 & PC 역방향 복사 통합 보안 관리 솔루션**

[공식 블로그](https://ahbiyoutvibe.blogspot.com/) • [GitHub 저장소](https://github.com/AhBiYout-all/K-Certificate-Manager) • [회사 홈페이지 (CISNet)](https://www.cisnet.co.kr)

</div>

---

## 🚀 최신 릴리스 정보 (Latest Release: v1.7.2)

> **버전**: `v1.7.2` (최신 안정화 빌드)  
> **출시일**: 2026-10-31  
> **상세 변경 내역**: [docs/PATCHNOTES.md](./docs/PATCHNOTES.md) • [GitHub 배포 가이드](./docs/GITHUB_GUIDE.md)

### 🌟 v1.7.2 핵심 업데이트 내용
- **상단 헤더 가로 볼륨 슬라이더 바 (Horizontal Sound Slider Bar) 상시 탑재**: 메인 상단 헤더 중앙에 원클릭 음소거/스피커 토글, 0%~100% 범위 슬라이더, 볼륨 수치(40% / OFF), 알림음 미리듣기(▶) 버튼을 일체형으로 배치하여 작업 중 언제든 즉각 음량 제어
- **눈에 잘 띄는 [⚙️ 환경 설정] 버튼 상시 노출**: 가로 슬라이더 바 바로 옆에 시인성이 뛰어난 환경 설정 버튼을 영구 배치하여 설정 창 접근 편의성 극대화
- **Windows C# WPF 데스크톱 전용 `SettingsDialog.xaml` 신설**: 알림음 ON/OFF, 가로 슬라이더 바, 효과음 미리듣기, 4대 테마(다크/회색/화이트/베이지) 선택, 간편/상세 모드 전환, 시작 가이드 옵션 대화상자 탑재
- **로컬 환경 설정 영구 저장 서비스 (`SettingsService.cs`) 구축**: `%LocalAppData%\KCertManager\kcert_settings.json`을 통해 사용자 개인 환경설정 영구 보존
- **'다시 표시하지 않음' CheckBox Two-Way 양방향 바인딩 및 CI 빌드 안정화**: `SettingsDialog.xaml`의 체크박스를 `MainViewModel.DontShowStartupWorkflowAgain`에 `Mode=TwoWay`로 양방향 바인딩하여 설정 상태 실시간 반영 및 XAML 비표준 `Spacing` 속성 완전 제거로 CI 컴파일 무결성 확보
- **만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화 (v1.7.1 계승)**: PC 로컬 및 USB 메모리에서 만료 인증서 일괄 정리 시 삭제 수량과 휴지통 보관 수량이 오차 없이 1:1로 일치하며 발급기관명과 유효기간 메타데이터 완벽 복원
- **GitHub Actions Node.js 24 Next-Gen / Node.js 22 LTS 전환**: Node.js 20 Deprecated & EOL 대응 완료 및 CI/CD 워크플로 현대화

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


