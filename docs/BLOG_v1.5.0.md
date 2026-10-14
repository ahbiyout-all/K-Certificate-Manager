# 🛡️ K-Certificate Manager Google Blog Release Post (v1.5.0)

본 문서는 **K-인증서 매니저 (K-Certificate Manager)** v1.5.0 정식 배포를 위한 공식 구글 블로그(Blogger) 게시용 마크다운 원고입니다.

---

### 1. 제목
**[K-인증서 매니저] v1.5.0 정식 출시! GPKI/EPKI/NPKI 인증서 안전 복사·백업 솔루션 (방화벽 자동 등록·무인 설치·Node 24 CI/CD)**

---

### 2. 본문
안녕하세요! 대한민국 공무원·교직원 행정전자서명 인증서(**GPKI / EPKI**)와 금융 공동인증서(**NPKI**)를 가장 안전하고 간편하게 탐색하고 백업할 수 있는 솔루션, **K-인증서 매니저 (K-Certificate Manager) v1.5.0** 버전이 정식 출시되었습니다.

인증서 복사를 위해 복잡한 `AppData\LocalLow` 숨김 폴더나 복잡한 시스템 경로를 일일이 찾으실 필요가 없습니다. **K-인증서 매니저**는 원클릭으로 PC와 USB 간의 양방향 복사, SHA-256 무결성 검증, 만료일 알림, 다크/화이트/회색/베이지 4대 테마를 제공합니다.

이번 v1.5.0 메이저/마이너 통합 릴리스에서는 **Windows 방화벽 인바운드 규칙 자동 사전 등록**, **무인(Silent) 설치 옵션 지원**, **GitHub Actions Node.js 24 최신 런타임 업그레이드**, **인스톨러 파일 단독 릴리스 정제**, **비동작 플랫폼(APK/iOS) 완전 정리** 등 운영 편의성과 배포 안정성을 대폭 강화했습니다.

---

### 3. 업데이트 내용
#### 🚀 v1.5.0 핵심 업데이트 내역
1. **Windows 방화벽 인바운드 규칙 자동/사전 등록 (`installer.iss`)**
   - Inno Setup 설치 시 백그라운드에서 `netsh advfirewall` 명령을 실행하여 기본 앱 이름(`K-Certificate Manager`, `K-인증서 매니저`)과 버전 포함 이름(`... v1.5.0`) 총 4종의 인바운드 규칙을 사전 자동 등록하며, 앱 삭제 시 자동으로 정리합니다.
2. **무인 설치(Silent Install) 완벽 지원**
   - 엔터프라이즈 환경 및 시스템 관리자를 위해 `/SILENT` 및 `/VERYSILENT` 스위치를 통한 무인 설치를 지원합니다.
3. **기존 설치 감지 및 업그레이드 선택 지원**
   - 이전 버전이 설치되어 있을 경우 대화상자를 통해 [클린 재설치], [덮어쓰기 업그레이드], [취소]를 직관적으로 선택할 수 있습니다.
4. **GitHub Actions 최신 Node.js 24 런타임 전환**
   - Node.js 20 EOL(지원 종료)에 선제적으로 대응하여 최신 LTS/차세대 Node.js 24 환경으로 CI/CD 워크플로를 전면 전환했습니다.
5. **릴리스 배포 자산 정제 (인스톨러 단독 첨부)**
   - GitHub Releases 첨부 파일에 불필요한 포터블 ZIP이나 중복 파일을 배제하고 정규 설치 프로그램(`kcert-manager-v1.5.0-setup.exe`)만 단독 첨부하여 다운로드 혼선을 원천 방지했습니다.
6. **플랫폼 최적화 (APK/iOS 내용 완전 제거)**
   - Windows Desktop (.NET WPF) 및 Web Management Console 전용 환경에 맞추어 미동작 플랫폼인 모바일(APK/iOS) 관련 서술과 워크플로를 완전 제거했습니다.
7. **시작 시 작업 선택 창 (PC➔USB, USB➔PC, 대시보드) & 순서별 가이드 모션 연동**
8. **SHA-256 체크섬 대조 '무결성 확인 완료' 녹색 실드 배지 실시간 토스트 연동**
9. **자가 복사(Self-Copy) 금지 보호막 및 목적지 디스크 수동 지정 팝업**
10. **드라이브 문자별(C, D, E, F...) 고유 배지 색상 및 WCAG 초고대비 글자 시인성 보장**

---

### 4. 앱 그림
*(블로그 등록 시 스크린샷 이미지를 첨부해 주세요)*

> 🖼️ **[K-인증서 매니저 v1.5.0 메인 대시보드 화면]**  
> *(드라이브 문자별 고유 배지 색상, 4대 테마 드롭다운 및 시작 가이드 모션 배너)*
>
> 🖼️ **[시작 작업 선택 창 및 순서별 가이드 모션]**  
> *(PC➔USB 복사, USB➔PC 가져오기, 메인 대시보드 진입 3대 모달 화면)*
>
> 🖼️ **[Inno Setup 정식 설치 프로그램 화면]**  
> *(방화벽 자동 등록 및 폴더 풀림 개별 파일 설치 구조)*

---

### 5. 다운로드
- **공식 설치 프로그램 (Setup Installer)**:
  - 파일명: `kcert-manager-v1.5.0-setup.exe`
  - 다운로드 링크: [https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.5.0](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.5.0)
- **GitHub 최신 릴리스 목록**:
  - [https://github.com/AhBiYout-all/K-Certificate-Manager/releases](https://github.com/AhBiYout-all/K-Certificate-Manager/releases)

---

### 6. 버전 정보
- **소프트웨어 버전**: `v1.5.0` (Semantic Versioning 2.0.0)
- **릴리스 일자**: 2026-10-08
- **라이선스**: MIT License (한국어/영어 2종 라이선스 정의 탑재, 개인/기업/공공기관 무료)

---

### 7. 시스템 요구 사항
- **운영체제**: Microsoft Windows 10 / 11 (64-bit x64 / ARM64)
- **프레임워크**: .NET 10.0 또는 .NET 8.0 (독립 실행형 풀버전은 런타임 내장으로 설치 불필요)
- **웹 브라우저**: Microsoft Edge, Google Chrome, Whale 등 최신 웹 브라우저
- **저장 공간**: 여유 디스크 공간 150MB 이상

---

### 8. 제작자 및 공식 채널 안내
- **개발자**: AhBiYout
- **GitHub 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 기술 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속 회사**: [(주)씨아이에스넷 (CISNet)](https://www.cisnet.co.kr/)

---

### 9. 전체 업데이트 이력
- **v1.5.0 (2026-10-08)**: Windows 방화벽 인바운드 규칙 자동 등록, Inno Setup 무인 설치(`/SILENT`) 지원, 기존 버전 삭제/덮어쓰기 분기, Node 24 Actions 적용, 릴리스 인스톨러 단독 첨부, APK/iOS 미지원 내용 정리, 시작 작업 선택 창 및 SHA-256 무결성 배지 연동.
- **v1.4.5 (2026-10-06)**: 대상 디스크 지정 팝업창, 자가 복사(Self-Copy) 금지 규칙, 드라이브별 고유 색상 배지, 테마 드롭다운 전환.
- **v1.4.3 (2026-10-04)**: GitHub Releases 3-Tier 실시간 자동 업데이트 체커 탑재, 다크 테마 시작 시인성 3중 보정.
- **v1.4.0 (2026-10-01)**: C# WPF 데스크톱 네이티브 GUI 앱 탑재, 모던 일체형 타이틀바(`WindowChrome`), 4대 컬러 테마 시스템.
- **v1.3.0 (2026-09-28)**: USB ➔ PC 역방향 가져오기 파이프라인, 지수 백오프 자동 재시도, 안전 휴지통(`SafetyTrash`) 구현.
- **v1.2.0 (2026-09-24)**: 순수 창작 코어 라이브러리(`KCert.Core.dll`) ASN.1 DER 파서 및 PKCS#8 키 분석기 탑재.
- **v1.0.0 (2026-09-15)**: NPKI, GPKI, EPKI 공인/공동인증서 자동 탐색 및 USB 일괄 백업 웹 솔루션 최초 릴리스.

---

### 10. 추천 태그
공동인증서,GPKI,EPKI,NPKI,인증서복사,인증서백업,USB복사,KCertManager,AhBiYout,CISNet,Certificate,InnoSetup,WPF,DotNet,Security
