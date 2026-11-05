# 🌐 K-인증서 매니저 (K-Certificate Manager) v1.8.0 공식 구글 블로그 배포 원고

본 문서는 **구글 블로그(Blogger)** 포스팅을 위한 배포용 표준 문서입니다.  
사용자의 편집 환경에 맞춰 **[1. 작성 모드 (서식 있는 텍스트)]** 와 **[2. HTML 편집 모드]** 2가지 형태로 완벽하게 제공됩니다.

---

# [1. 작성 모드 (서식 있는 텍스트 - Visual Compose Mode)]
> **💡 사용법**: 아래의 내용을 그대로 복사(Ctrl+C)하여 구글 블로거 글쓰기 화면의 **'작성 모드 (서식 있는 텍스트)'**에 붙여넣기(Ctrl+V) 하시면 모든 스타일과 서식이 즉시 적용됩니다.

---

### [제목]
[K-인증서 매니저 v1.8.0] 순수 창작 독립 DLL(KCert.Core / KCert.Crypto) 탑재, 상단 헤더 가로바 스크롤러 & 전역 고대비 툴팁 시스템 릴리스

---

### [본문]
대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융결제원 공동인증서(NPKI)를 안전하게 탐색하고 USB 드라이브 및 PC로 복사·백업하는 오픈소스 데스크톱 보안 솔루션 **'K-인증서 매니저(K-Certificate Manager) v1.8.0'** 정식 버전이 출시되었습니다!

이번 v1.8.0 릴리스는 **소프트웨어 버전 관리(Semantic Versioning: MAJOR.MINOR.PATCH) 원칙에 따른 공식 MINOR 판정**으로, 외부 라이브러리 의존성 0%의 **순수 창작 독립 C# 코어 DLL 2종(`KCert.Core.dll`, `KCert.Crypto.dll`)을 분리 구축**하고, 상단 헤더 메뉴의 접근성을 극대화하는 **'가로바 스크롤러(Horizontal ScrollBar)' 및 마우스 휠 네비게이션**, 그리고 다크/회색/화이트/베이지 전 테마에서 선명한 시인성을 보장하는 **'전역 고대비 툴팁(ToolTip) 시스템'**을 공식 탑재하였습니다.

이제 어떠한 3rd-party 보안 소프트웨어 없이도 순수 C# 네이티브 알고리즘을 통해 초고속 ASN.1 파싱과 KISA 표준 SEED-128 암호화 무결성 검증을 수행하며, 좁은 화면이나 다크 모드 환경에서도 모든 메뉴와 도움말을 쾌적하고 명확하게 탐색할 수 있습니다.

---

### [업데이트 (v1.8.0 신규 기능 및 개선 사항)]
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

### [다운로드 및 배포 정보]
- 📥 **설치 관리자 다운로드 (GitHub)**: [kcert-manager-v1.8.0-setup.exe 다운로드](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.8.0)
- 💻 **공식 깃허브 소스코드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- 🌐 **개발사 공식 홈페이지**: [(주)청운정보시스템 (cisnet.co.kr)](http://www.cisnet.co.kr/)
- 📝 **공식 블로그**: [AhBiYout Vibe Blog](https://ahbiyoutvibe.blogspot.com/)

---

### [소프트웨어 사양 안내]
- **소프트웨어 버전**: v1.8.0 (Semantic Versioning 2.0.0 MINOR Release)
- **배포 라이선스**: Free Use / MIT License (개인, 공공기관, 기업 무상 이용)
- **개발 언어 및 프레임워크**: C# .NET 10.0 / .NET 8.0 WPF MVVM + React 19 TypeScript
- **코어 아키텍처**: 순수 창작 `KCert.Core.dll` + `KCert.Crypto.dll` (외부 3rd-party DLL 0%)
- **지원 인증서**: 대한민국 금융결제원/코스콤/한국정보인증 NPKI, 행정안전부 GPKI, 교육부 EPKI
- **설치 방식**: Inno Setup 무인 설치(`/SILENT`) 및 정규 다중 파일(Unpacked) 설치 지원

---

### [추천 검색 태그]
공동인증서, 공인인증서복사, GPKI, EPKI, NPKI, USB인증서복사, 인증서백업, KCertCore, 순수창작DLL, 가로바스크롤, 고대비툴팁, K인증서매니저, 무료인증서관리프로그램, 행정전자서명, 오픈소스보안, 청운정보시스템

---

# [2. HTML 편집 모드 (Direct HTML Mode)]
> **💡 사용법**: 아래의 HTML 코드를 전체 복사(Ctrl+C)하여 구글 블로거 글쓰기 화면 우측 상단의 연필/HTML 아이콘을 눌러 **'HTML 보기'**로 전환한 후 그대로 붙여넣기(Ctrl+V) 하시면 완벽한 반응형 모던 카드로 발행됩니다.

---

```html
<!-- K-Certificate Manager v1.8.0 Google Blogger Post Body Start -->
<div style="font-family: 'Pretendard', 'Malgun Gothic', -apple-system, sans-serif; line-height: 1.75; color: #1e293b; max-width: 840px; margin: 0 auto; padding: 10px;">

  <!-- Hero Header Banner Card -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%); border-radius: 14px; padding: 32px 24px; color: #ffffff; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.35); text-align: center;">
    <div style="display: inline-block; background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(147, 197, 253, 0.4); padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 14px; color: #93c5fd; letter-spacing: 0.5px;">
      공식 정식 배포 릴리스 · v1.8.0 MINOR
    </div>
    <h1 style="font-size: 26px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.35; color: #ffffff;">
      🛡️ K-인증서 매니저 (K-Certificate Manager) v1.8.0
    </h1>
    <p style="font-size: 15px; margin: 0; color: #cbd5e1; line-height: 1.6;">
      순수 창작 독립 DLL(KCert.Core / KCert.Crypto) 탑재 · 상단 헤더 가로바 스크롤러 · 전역 고대비 툴팁 시스템
    </p>
  </div>

  <!-- Summary Introduction -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    <p style="margin-top: 0; font-size: 15.5px; line-height: 1.8;">
      대한민국 공무원·교직원 행정전자서명 인증서(<strong>GPKI, EPKI</strong>)와 금융 공동인증서(<strong>NPKI</strong>)를 안전하게 관리하는 오픈소스 데스크톱 보안 유틸리티 <strong>'K-인증서 매니저 v1.8.0'</strong> 정식 버전이 출시되었습니다.<br/><br/>
      이번 v1.8.0 버전은 <strong>Semantic Versioning 3단계 분리 원칙에 입각한 대규모 기능 승격(MINOR)</strong>으로, 외부 3rd-party 의존성이 전혀 없는 <strong>순수 창작 독립 C# 코어 DLL 2종(KCert.Core.dll, KCert.Crypto.dll)</strong>을 분리 탑재하였습니다. 또한 상단 메뉴 툴바의 편의성을 극대화한 <strong>'가로바 스크롤러(Horizontal ScrollBar)' 및 마우스 휠 네비게이션</strong>, 다크 테마를 포함한 4대 테마 전반에서 글자가 선명하게 보이는 <strong>'전역 고대비 툴팁 시스템'</strong>이 공식 적용되었습니다.
    </p>
  </div>

  <!-- Key Features Grid -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h3 style="margin-top: 0; font-size: 18px; color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 16px;">
      ✨ v1.8.0 핵심 신규 기능 및 주요 개선
    </h3>
    <ul style="padding-left: 20px; margin-bottom: 0; font-size: 14.5px; line-height: 1.85;">
      <li style="margin-bottom: 12px;">
        <strong>🧩 순수 창작 독립 C# 코어 & 암호화 DLL 2종 구축:</strong><br/>
        대한민국 공인인증서 X.509 v3 규격, ASN.1/DER 파서, OID 분류, USB 감시, 안전 격리 휴지통 엔진(<code>KCert.Core.dll</code>) 및 KISA 표준 SEED-128 암호화, PKCS#8 개인키 복호화, VID 신원확인 엔진(<code>KCert.Crypto.dll</code>)의 완전 모듈화.
      </li>
      <li style="margin-bottom: 12px;">
        <strong>↔️ 상단 헤더 가로바 스크롤(Horizontal ScrollBar) & 마우스 휠 연동:</strong><br/>
        상단 헤더 높이를 64px로 최적화하고 상시 가로 스크롤바 표출. 툴바 위에서 마우스 휠 조작 시 좌우 가로 스크롤이 부드럽게 작동하며, 윈도우 드래그와의 간섭을 완벽 분리.
      </li>
      <li style="margin-bottom: 12px;">
        <strong>💬 4대 테마 전역 고대비 툴팁(ToolTip) 시스템 탑재:</strong><br/>
        다크 테마에서 흰색 배경에 흰색 글자가 겹치던 시인성 결함을 완벽히 해결. 다크/회색/화이트/베이지 전 테마에서 WCAG AAA 12:1+ 고대비를 만족하는 다크 플로팅 카드 + 화이트 텍스트 적용.
      </li>
      <li style="margin-bottom: 12px;">
        <strong>📏 Semantic Versioning 3단계(MAJOR.MINOR.PATCH) 관리 체계 확립:</strong><br/>
        변경 규모별 3단계 의사결정 매트릭스(Decision Tree) 및 8대 핵심 파일 동기화 체크리스트 표준화.
      </li>
      <li>
        <strong>🎚️ 헤더 실시간 볼륨 슬라이더 & WPF SettingsDialog.xaml 완비:</strong><br/>
        원클릭 음소거 토글, 볼륨 조절 슬라이더, 성공 알림음(SuccessChime) 테스트 및 로컬 영구 설정 보존.
      </li>
    </ul>
  </div>

  <!-- Download CTA Banner -->
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 26px; text-align: center; color: #ffffff; margin-bottom: 24px; border: 1px solid #334155;">
    <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">
      🚀 지금 바로 K-인증서 매니저 v1.8.0을 만나보세요!
    </h3>
    <p style="margin: 0 0 18px 0; font-size: 14.5px; color: #94a3b8;">
      Windows 11 / 10 완벽 호환 · 단일 설치파일 무상 제공 · 오픈소스 MIT 라이선스
    </p>
    <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.8.0" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
      📥 kcert-manager-v1.8.0-setup.exe 정식 다운로드 (GitHub)
    </a>
  </div>

  <!-- Software Metadata Table -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h4 style="margin: 0 0 14px 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
      📋 공식 사양 정보
    </h4>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px;">소프트웨어 버전</td><td style="color: #1e293b; font-weight: bold;">v1.8.0 (Semantic Versioning 2.0.0 MINOR)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">배포 라이선스</td><td style="color: #059669; font-weight: bold;">Free Use / MIT License (개인·기업·공공기관 무료)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">개발사 / 소속</td><td><a href="http://www.cisnet.co.kr/" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">(주)청운정보시스템</a> · 개발자: AhBiYout</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">소스코드 저장소</td><td><a href="https://github.com/AhBiYout-all/K-Certificate-Manager" target="_blank" style="color: #2563eb; text-decoration: none;">GitHub @AhBiYout-all/K-Certificate-Manager</a></td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #64748b;">기술 블로그</td><td><a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" style="color: #2563eb; text-decoration: none;">AhBiYout Vibe 공식 블로그</a></td></tr>
    </table>
  </div>

</div>
<!-- K-Certificate Manager v1.8.0 Google Blogger Post Body End -->
```
