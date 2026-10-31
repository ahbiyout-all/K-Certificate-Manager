# 🌐 K-인증서 매니저 (K-Certificate Manager) v1.7.2 공식 구글 블로그 배포 원고

본 문서는 **구글 블로그(Blogger)** 포스팅을 위한 배포용 표준 문서입니다.  
사용자의 편집 환경에 맞춰 **[1. 작성 모드 (서식 있는 텍스트)]** 와 **[2. HTML 편집 모드]** 2가지 형태로 완벽하게 제공됩니다.

---

# [1. 작성 모드 (서식 있는 텍스트 - Visual Compose Mode)]
> **💡 사용법**: 아래의 내용을 그대로 복사(Ctrl+C)하여 구글 블로거 글쓰기 화면의 **'작성 모드 (서식 있는 텍스트)'**에 붙여넣기(Ctrl+V) 하시면 모든 스타일과 서식이 즉시 적용됩니다.

---

### [제목]
[K-인증서 매니저 v1.7.2] 상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 모달 신설, C# WPF Two-Way 바인딩 최적화 업데이트

---

### [본문]
대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융결제원 공동인증서(NPKI)를 안전하게 탐색하고 USB 드라이브 및 PC로 복사·백업하는 오픈소스 데스크톱 보안 솔루션 **'K-인증서 매니저(K-Certificate Manager) v1.7.2'** 정식 버전이 출시되었습니다!

이번 v1.7.2 릴리스에서는 사용자 여러분의 작업 동선과 편의성을 극대화하기 위해, **메인 상단 헤더 툴바에 '가로 볼륨 조절 슬라이더 바'를 직접 탑재**하고 **눈에 잘 띄는 ⚙️ [환경 설정] 버튼**을 상시 노출하도록 인터페이스를 대폭 혁신하였습니다.

이제 환경 설정 창을 따로 찾아 열지 않고도 헤더에서 실시간으로 성공 알림음 볼륨을 드래그하여 조절하거나 원클릭 음소거/스피커 토글, 미리듣기 재생을 수행할 수 있습니다. 또한, Windows C# WPF 데스크톱 에디션에 전용 환경 설정 대화상자(`SettingsDialog.xaml`)와 로컬 설정 영구 저장 서비스(`SettingsService.cs`)가 구축되어, 앱 시작 가이드 '다시 표시하지 않음' 옵션 및 개인 설정이 완벽하게 보존됩니다.

---

### [업데이트 (v1.7.2 신규 기능 및 개선 사항)]
1. 🎚️ **상단 헤더 가로 볼륨 슬라이더 바 (Horizontal Sound Slider Bar) 상시 탑재**:
   - 메인 화면 상단 헤더 중앙에 `[🔊/🔇 원클릭 음소거 토글]` + `알림음:` 라벨 + `가로 범위 슬라이더(0%~100%)` + `볼륨 수치(40% / OFF)` + `[▶ 미리듣기/테스트]` 버튼을 배치하여, 작업 중 언제든 즉시 음량을 확인하고 조절할 수 있습니다.
2. ⚙️ **눈에 잘 띄는 [환경 설정] 버튼 상단 헤더 상시 노출**:
   - 상단 헤더 가로 슬라이더 바 바로 옆에 시인성이 뛰어난 `[⚙️ 환경 설정]` 버튼을 영구 배치하여, 클릭 한 번으로 상세 환경 설정 창을 팝업할 수 있습니다.
3. 🖥️ **Windows C# WPF 데스크톱 전용 `SettingsDialog.xaml` 신설**:
   - 기존 WPF 앱에 부재했던 환경 설정 대화상자를 신설하여 알림음 ON/OFF, 가로 슬라이더 바, 🎵 효과음 미리듣기, 4대 테마(다크/회색/화이트/베이지) 선택, 간편/상세 모드 전환을 원스톱으로 제공합니다.
4. 💾 **로컬 환경 설정 영구 저장 서비스 (`SettingsService.cs`) 구축**:
   - `%LocalAppData%\KCertManager\kcert_settings.json`을 통해 사용자가 조절한 알림음 볼륨, 음소거 여부, 테마, 모드, 시작 가이드 옵션이 앱 종료 후에도 안전하게 유지됩니다.
5. 🔗 **'다시 표시하지 않음' CheckBox Two-Way 양방향 바인딩 및 XAML 빌드 안정화**:
   - `SettingsDialog.xaml`의 체크박스를 `MainViewModel.DontShowStartupWorkflowAgain`에 `Mode=TwoWay`로 양방향 바인딩하여 설정 변경이 실시간 동기화되며, XAML 비표준 `Spacing` 속성을 완전히 제거하여 GitHub Actions 릴리스 컴파일 무결성을 확보했습니다.
6. 🗑️ **만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화 (v1.7.1 계승)**:
   - PC 로컬 또는 USB 메모리에서 만료 인증서 일괄 정리 시 삭제 수량과 휴지통 보관 수량이 오차 없이 1:1로 일치하며, 발급기관명과 유효기간 메타데이터가 완벽 복원됩니다.

---

### [앱 그림]
*(아래 캡처 화면을 블로그 이미지로 삽입해 주세요)*

📷 **[K-인증서 매니저 v1.7.2 상단 헤더 가로 슬라이더 바 및 ⚙️ 환경 설정 모달]**  
- 상단 툴바의 가로 볼륨 슬라이더 바와 실시간 볼륨 수치, 돋보이는 ⚙️ 환경 설정 버튼 및 직관적인 환경 설정 대화상자가 적용된 고화질 데스크톱 캡처 화면.

---

### [다운로드]
공식 GitHub 릴리스 저장소에서 최신 단일 설치파일(`Setup.exe`)을 안전하게 내려받으실 수 있습니다.

- 📥 **설치 관리자 다운로드 (GitHub)**: [kcert-manager-v1.7.2-setup.exe 다운로드](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.2)
- 🐙 **공식 GitHub 소스코드 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)

---

### [프로그램 사양 및 시스템 요구사항]
- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **소프트웨어 버전**: v1.7.2 (Semantic Versioning 2.0.0)
- **개발자**: AhBiYout (GitHub: [AhBiYout-all](https://github.com/AhBiYout-all))
- **공식 웹사이트**: [https://www.cisnet.co.kr/](https://www.cisnet.co.kr/) ((주)씨아이에스넷 CISNet)
- **공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **지원 운영체제**: Microsoft Windows 10 / 11 (64-bit 권장)
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt` 및 영어 `LICENSE_EN.txt` 2종 라이선스 공식 채택)
- **런타임 환경**: 단일 설치파일(`kcert-manager-v1.7.2-setup.exe`)에 자체 내장 (별도 런타임 설치 불필요)

---

### [패치 내역 요약]
- **v1.7.2 (2026-10-31)**: 상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 모달 상시 노출, C# WPF SettingsDialog 신설, SettingsService 로컬 영구 저장소 연동, '다시 표시하지 않음' Two-Way 바인딩 확립, XAML Spacing 제거로 CI 컴파일 완전 안정화.
- **v1.7.1 (2026-10-28)**: 만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화 개선, 휴지통 매니페스트 메타데이터(발급기관명/유효기간) 복원 보존, GitHub Actions Node.js 24/22 LTS 런타임 전환.
- **v1.7.0 (2026-10-27)**: 보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식) 시스템 신설, 성공 알림음 ON/OFF 및 볼륨 조절 슬라이더 구축, 컬럼 최소 폭 30px 자유 조절, 목록 세로 구분선 및 여백 밀도 컨트롤 도입.

---
---

# [2. HTML 편집 모드 (HTML Code Mode)]
> **💡 사용법**: 아래의 HTML 코드를 전체 복사(Ctrl+C)하여 구글 블로거 글쓰기 화면 우측 상단의 연필 모양 아이콘을 눌러 **'HTML 보기'**로 전환한 후 그대로 붙여넣기(Ctrl+V) 하시면 완벽한 반응형 모던 카드로 발행됩니다.

```html
<!-- K-Certificate Manager v1.7.2 Google Blogger Post Body Start -->
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Malgun Gothic', sans-serif; line-height: 1.7; color: #334155; max-width: 820px; margin: 0 auto; padding: 10px;">

  <!-- Hero Header Card -->
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; padding: 32px 26px; color: #ffffff; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3); border: 1px solid #334155; text-align: center;">
    <div style="display: inline-block; background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #60a5fa; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px; letter-spacing: 0.5px;">
      공식 정식 배포 릴리스 · v1.7.2
    </div>
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px; line-height: 1.3;">
      🛡️ K-인증서 매니저 (K-Certificate Manager) v1.7.2
    </h1>
    <div style="color: #94a3b8; font-size: 14.5px; max-width: 650px; margin: 0 auto 18px auto;">
      상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 모달 신설, C# WPF Two-Way 바인딩 최적화 릴리스
    </div>
    <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
      <span style="background: rgba(255, 255, 255, 0.1); padding: 5px 12px; border-radius: 6px; font-size: 12px; color: #e2e8f0;">⚡ 상단 헤더 볼륨 슬라이더</span>
      <span style="background: rgba(255, 255, 255, 0.1); padding: 5px 12px; border-radius: 6px; font-size: 12px; color: #e2e8f0;">⚙️ WPF SettingsDialog 신설</span>
      <span style="background: rgba(255, 255, 255, 0.1); padding: 5px 12px; border-radius: 6px; font-size: 12px; color: #e2e8f0;">💾 SettingsService 로컬 영구저장</span>
      <span style="background: rgba(255, 255, 255, 0.1); padding: 5px 12px; border-radius: 6px; font-size: 12px; color: #e2e8f0;">🔒 휴지통 100% 동기화</span>
    </div>
  </div>

  <!-- Intro Text -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
    대한민국 공무원·교직원 행정전자서명 인증서(<strong>GPKI, EPKI</strong>)와 금융 공동인증서(<strong>NPKI</strong>)를 안전하게 관리하는 오픈소스 데스크톱 보안 유틸리티 <strong>'K-인증서 매니저 v1.7.2'</strong> 정식 버전이 출시되었습니다.<br/><br/>
    이번 v1.7.2 릴리스에서는 <strong>상단 헤더 툴바에 가로 볼륨 조절 슬라이더 바를 직접 탑재</strong>하고, <strong>돋보이는 ⚙️ [환경 설정] 버튼을 상시 노출</strong>하여 작업 중 언제든 1-클릭으로 효과음을 제어하고 환경 설정 창을 호출할 수 있습니다. 또한 Windows C# WPF 데스크톱에 전용 <code>SettingsDialog.xaml</code>과 <code>SettingsService.cs</code> 영구 저장소가 구축되어 설정 상태가 완벽하게 유지됩니다.
  </div>

  <!-- Feature List -->
  <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 0 12px 12px 0; padding: 22px; margin-bottom: 24px;">
    <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 14px;">
      ✨ v1.7.2 핵심 신규 기능 및 주요 개선
    </h3>
    <ul style="padding-left: 20px; margin: 0; color: #334155; font-size: 14px;">
      <li style="margin-bottom: 10px;"><strong>🎚️ 상단 헤더 가로 볼륨 슬라이더 바 상시 탑재</strong>: 헤더 중앙에 원클릭 음소거/스피커 토글, 0%~100% 범위 슬라이더, 볼륨 수치(40%/OFF) 및 미리듣기(▶) 버튼 배치.</li>
      <li style="margin-bottom: 10px;"><strong>⚙️ 눈에 잘 띄는 [환경 설정] 버튼 상단 헤더 상시 노출</strong>: 가로 슬라이더 바로 옆에 돋보이는 ⚙️ 환경 설정 버튼을 영구 배치하여 설정 접근성 극대화.</li>
      <li style="margin-bottom: 10px;"><strong>🖥️ C# WPF 데스크톱 전용 SettingsDialog 신설</strong>: 알림음 제어, 🎵 효과음 미리듣기, 4대 테마 선택, 간편/상세 모드 전환, 시작 가이드 옵션 대화상자 탑재.</li>
      <li style="margin-bottom: 10px;"><strong>💾 SettingsService 로컬 영구 저장소 연동</strong>: <code>%LocalAppData%\KCertManager\kcert_settings.json</code>을 통해 사용자 개인 환경설정 영구 보존.</li>
      <li style="margin-bottom: 10px;"><strong>🔗 '다시 표시하지 않음' Two-Way 바인딩 확립</strong>: 체크박스 조작 시 ViewModel 및 설정 파일에 즉시 양방향 반영, XAML Spacing 제거로 CI 빌드 오류 원천 차단.</li>
      <li style="margin-bottom: 0;"><strong>🗑️ 만료 인증서 정리-안전 격리 휴지통 수량 1:1 완벽 일치 (v1.7.1 계승)</strong>: 22건 일괄 정리 시 휴지통에도 정확히 22건 격리 보관되며 발급기관명/유효기간 메타데이터 보존.</li>
    </ul>
  </div>

  <!-- Download Action Banner -->
  <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 22px; margin-bottom: 24px; text-align: center;">
    <div style="font-size: 18px; font-weight: 800; color: #166534; margin-bottom: 8px;">
      📥 K-인증서 매니저 v1.7.2 정식 설치파일 다운로드
    </div>
    <div style="font-size: 13.5px; color: #15803d; margin-bottom: 16px;">
      Inno Setup 무인·슬림 단일 설치파일 (Windows 10 / 11 64-bit 지원)
    </div>
    <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.2" target="_blank" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);">
      📥 kcert-manager-v1.7.2-setup.exe 다운로드 (GitHub)
    </a>
  </div>

  <!-- Software Info Table -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
    <h3 style="color: #0f172a; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
      📋 소프트웨어 명세
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px;">소프트웨어 버전</td><td style="color: #1e293b; font-weight: bold;">v1.7.2 (Semantic Versioning 2.0.0)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">개발자</td><td style="color: #1e293b;">AhBiYout (<a href="https://github.com/AhBiYout-all" target="_blank" style="color: #2563eb; text-decoration: none;">GitHub @AhBiYout-all</a>)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">공식 블로그</td><td style="color: #1e293b;"><a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" style="color: #2563eb; text-decoration: none;">https://ahbiyoutvibe.blogspot.com/</a></td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">공식 홈페이지</td><td style="color: #1e293b;"><a href="https://www.cisnet.co.kr/" target="_blank" style="color: #2563eb; text-decoration: none;">https://www.cisnet.co.kr/</a> ((주)씨아이에스넷 CISNet)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">라이선스</td><td style="color: #1e293b;">Free Use / MIT License (한국어·영어 2종 라이선스 공식 채택)</td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #64748b;">지원 운영체제</td><td style="color: #1e293b;">Microsoft Windows 10 / 11 (64-bit)</td></tr>
    </table>
  </div>

  <!-- Footer History Summary -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px; font-size: 12.5px; color: #64748b;">
    <div style="font-weight: bold; color: #334155; margin-bottom: 8px;">
      📜 최근 릴리스 히스토리 (v1.7.0 ~ v1.7.2)
    </div>
    <div style="margin-bottom: 6px;"><strong>v1.7.2 (2026-10-31)</strong>: 상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 버튼 상시 노출, C# WPF SettingsDialog 신설, SettingsService 영구 저장소 연동, Two-Way 바인딩 및 CI 빌드 완전 안정화.</div>
    <div style="margin-bottom: 6px;"><strong>v1.7.1 (2026-10-28)</strong>: 만료 인증서 정리-휴지통 수량 100% 동기화 개선, 휴지통 매니페스트 메타데이터 보존, GitHub Actions Node.js 24/22 LTS 런타임 전환.</div>
    <div><strong>v1.7.0 (2026-10-27)</strong>: 보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식), 알림음 제어 및 슬라이더, 컬럼 최소 폭 30px 자유 조절, 목록 세로 구분선 및 여백 밀도 조절.</div>
  </div>

</div>
<!-- K-Certificate Manager v1.7.2 Google Blogger Post Body End -->
```
