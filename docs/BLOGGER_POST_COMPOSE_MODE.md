# [구글 블로거 전용 배포 원고: 작성 모드 (서식 있는 텍스트)]

> **💡 구글 블로그(Blogger) 등록 방법**:
> 1. 구글 블로거 글쓰기 화면으로 이동합니다.
> 2. 좌측 상단 모드가 **'작성 모드 (서식 있는 텍스트)'**로 되어 있는지 확인합니다.
> 3. 아래의 **[제목]**과 **[본문 내용]**을 복사하여 그대로 붙여넣기(Ctrl+V) 하시면 모든 볼드, 리스트, 링크 및 서식이 깔끔하게 자동 적용됩니다.

---

## 📌 [글 제목 (Title)]
[K-인증서 매니저 v1.8.0] 순수 창작 독립 DLL(KCert.Core / KCert.Crypto) 탑재, 상단 헤더 가로바 스크롤러 & 전역 고대비 툴팁 시스템 릴리스

---

## 📝 [본문 내용 (Body Content)]

대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융결제원 공동인증서(NPKI)를 안전하게 탐색하고 USB 드라이브 및 PC로 복사·백업하는 오픈소스 데스크톱 보안 솔루션 **'K-인증서 매니저(K-Certificate Manager) v1.8.0'** 정식 버전이 출시되었습니다!

이번 v1.8.0 릴리스는 **소프트웨어 버전 관리(Semantic Versioning: MAJOR.MINOR.PATCH) 원칙에 따른 공식 MINOR 판정**으로, 외부 라이브러리 의존성 0%의 **순수 창작 독립 C# 코어 DLL 2종(`KCert.Core.dll`, `KCert.Crypto.dll`)을 분리 구축**하고, 상단 헤더 메뉴의 접근성을 극대화하는 **'가로바 스크롤러(Horizontal ScrollBar)' 및 마우스 휠 네비게이션**, 그리고 다크/회색/화이트/베이지 전 테마에서 선명한 시인성을 보장하는 **'전역 고대비 툴팁(ToolTip) 시스템'**을 공식 탑재하였습니다.

이제 어떠한 3rd-party 보안 소프트웨어 없이도 순수 C# 네이티브 알고리즘을 통해 초고속 ASN.1 파싱과 KISA 표준 SEED-128 암호화 무결성 검증을 수행하며, 좁은 화면이나 다크 모드 환경에서도 모든 메뉴와 도움말을 쾌적하고 명확하게 탐색할 수 있습니다.

---

### ✨ v1.8.0 핵심 신규 기능 및 주요 개선 사항

1. 🧩 **순수 창작 독립 C# 코어 & 암호화 DLL 2종 분리 (`KCert.Core.dll`, `KCert.Crypto.dll`)**:
   - **`KCert.Core.dll`**: 대한민국 공인인증서 X.509 v3 바이너리 규격, 순수 ASN.1/DER 파서, 5대 공인기관 및 행안부/교육부 고유 OID 지능형 분류 엔진, USB 자동 감시 및 안전 격리 휴지통 엔진을 외부 의존성 0%의 C# 클래스 라이브러리로 전면 모듈화.
   - **`KCert.Crypto.dll`**: KISA 표준 대칭키 SEED-128-CBC 암호화, PKCS#8 개인키(`signPri.key`) 복호화, VID 신원확인 및 RSA-SHA256 전자서명 순수 C# 엔진을 독립 라이브러리로 분리.
   - **다중 프로젝트 솔루션 구조 (`KCertManager.sln`)**: 메인 데스크톱 WPF와 2개 코어 DLL 간의 명확한 아키텍처 계층화 및 유지보수성 확립.

2. ↔️ **상단 헤더 가로바 스크롤(Horizontal ScrollBar) 신설 및 마우스 휠 연동 (Web & WPF)**:
   - 상단 헤더 높이를 `64px`로 최적화하고 상단 메뉴 ScrollViewer에 `HorizontalScrollBarVisibility="Visible"`을 적용하여 가로 스크롤바를 직관적으로 상시 노출.
   - 상단 메뉴 영역 어디서든 마우스 휠을 돌리면 좌우 가로 스크롤(`ScrollToHorizontalOffset`)이 즉각 동작하도록 `PreviewMouseWheel` 파이프라인 구축.
   - 윈도우 캡션 드래그(`DragMove`)와 가로 스크롤바/썸/슬라이더 조작을 완벽히 분리하여 조작 시 창 이동 간섭 원천 차단.

3. 💬 **4대 테마 전역 고대비 툴팁(ToolTip) 시스템 구축 (White on White 시인성 불량 완벽 해결)**:
   - 다크 테마에서 Windows 기본 흰색 툴팁 배경과 흰색 글자색이 겹쳐 글씨가 보이지 않던 문제를 근본적으로 해소.
   - `App.xaml`에 전용 `ToolTipBgBrush`, `ToolTipTextBrush`, `ToolTipBorderBrush`를 신설하고 `ContentPresenter.Resources` 스타일 격리를 통해 전역 글자색 간섭 차단.
   - 다크, 회색, 베이지, 화이트 전 테마에서 WCAG AAA 12:1+ 고대비를 보장하는 다크 플로팅 카드 + 선명한 화이트 텍스트 조합 제공.
   - 툴팁 반응 딜레이(250ms) 및 설명 지속 시간(15초)을 최적화하여 긴 한글 설명도 여유롭게 확인 가능.

4. 📏 **소프트웨어 버전 관리(Semantic Versioning: MAJOR.MINOR.PATCH) 3단계 분리 정책 확립**:
   - `docs/VERSIONING_POLICY.md`에 변경 규모별 3단계(MAJOR / MINOR / PATCH) 판정 매트릭스와 8대 필수 동기화 체크리스트를 체계화하여 엄격한 품질 보증 달성.

5. 🛠️ **MSBuild XML 엔티티 파싱 오류 해결 및 CI 안정화**:
   - `KCert.Crypto.csproj` 내 특수문자(`&amp;`) 엔티티 오류를 해결하고 전체 22개 WPF XAML 및 CSPROJ 유효성 검증 100% 통과.

6. 🎚️ **상단 헤더 실시간 볼륨 슬라이더 및 WPF 전용 환경 설정 대화상자 (`SettingsDialog.xaml`) 계승**:
   - 원클릭 음소거 토글, 0%~100% 볼륨 조절 슬라이더, 성공 알림음(SuccessChime) 테스트 청음 및 로컬 영구 설정 보존.

---

### 📥 [공식 다운로드 및 릴리스 링크]

- **공식 설치 프로그램 다운로드 (GitHub)**: [kcert-manager-v1.8.0-setup.exe](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.8.0)
- **GitHub 오픈소스 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **개발사 공식 웹사이트**: [(주)씨아이에스넷 (CISNet)](http://www.cisnet.co.kr/)
- **공식 기술 블로그**: [AhBiYout Vibe Blog](https://ahbiyoutvibe.blogspot.com/)

---

### 📋 [소프트웨어 기술 사양]
- **버전**: v1.8.0 (Semantic Versioning 2.0.0 MINOR Release)
- **라이선스**: Free Use / MIT License (개인·기업·공공기관 누구나 무료 이용)
- **지원 OS**: Windows 11 / Windows 10 (64-bit)
- **개발 환경**: .NET 10.0 / .NET 8.0 WPF MVVM + React 19 TypeScript
- **코어 엔진**: 순수 창작 `KCert.Core.dll` + `KCert.Crypto.dll` (외부 3rd-party 의존성 0%)

---

### 🏷️ [추천 검색 태그]
공동인증서, 공인인증서복사, GPKI, EPKI, NPKI, USB인증서복사, 인증서백업, KCertCore, 순수창작DLL, 가로바스크롤, 고대비툴팁, K인증서매니저, 무료인증서관리프로그램, 행정전자서명, 오픈소스보안, 씨아이에스넷
