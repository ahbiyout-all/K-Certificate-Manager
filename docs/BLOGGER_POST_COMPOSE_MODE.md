# [구글 블로거 전용 배포 원고: 작성 모드 (서식 있는 텍스트)]

> **💡 구글 블로그(Blogger) 등록 방법**:
> 1. 구글 블로거 글쓰기 화면으로 이동합니다.
> 2. 좌측 상단 모드가 **'작성 모드 (서식 있는 텍스트)'**로 되어 있는지 확인합니다.
> 3. 아래의 **[제목]**과 **[본문 내용]**을 복사하여 그대로 붙여넣기(Ctrl+V) 하시면 모든 볼드, 리스트, 링크 및 서식이 깔끔하게 자동 적용됩니다.

---

## 📌 [글 제목 (Title)]
[K-인증서 매니저 v1.7.2] 상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 모달 신설, C# WPF Two-Way 바인딩 최적화 업데이트

---

## 📝 [본문 내용 (Body Content)]

대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융결제원 공동인증서(NPKI)를 안전하게 탐색하고 USB 드라이브 및 PC로 복사·백업하는 오픈소스 데스크톱 보안 솔루션 **'K-인증서 매니저(K-Certificate Manager) v1.7.2'** 정식 버전이 출시되었습니다!

이번 v1.7.2 릴리스에서는 사용자 여러분의 작업 동선과 편의성을 극대화하기 위해, **메인 상단 헤더 툴바에 '가로 볼륨 조절 슬라이더 바'를 직접 탑재**하고 **눈에 잘 띄는 ⚙️ [환경 설정] 버튼**을 상시 노출하도록 인터페이스를 대폭 혁신하였습니다.

이제 환경 설정 창을 따로 찾아 열지 않고도 헤더에서 실시간으로 성공 알림음 볼륨을 드래그하여 조절하거나 원클릭 음소거/스피커 토글, 미리듣기 재생을 수행할 수 있습니다. 또한, Windows C# WPF 데스크톱 에디션에 전용 환경 설정 대화상자(`SettingsDialog.xaml`)와 로컬 설정 영구 저장 서비스(`SettingsService.cs`)가 구축되어, 앱 시작 가이드 '다시 표시하지 않음' 옵션 및 개인 설정이 완벽하게 보존됩니다.

---

### ✨ v1.7.2 핵심 신규 기능 및 주요 개선 사항

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

### 📷 [스크린샷 안내]
*(블로그 등록 시 메인 화면 및 상단 헤더 볼륨 슬라이더 바, ⚙️ 환경 설정 창 캡처 이미지를 본문에 삽입해 주세요)*

- **[스크린샷 1]**: 상단 헤더 가로 슬라이더 바와 실시간 볼륨 수치 및 [⚙️ 환경 설정] 버튼 노출 화면
- **[스크린샷 2]**: 신설된 Windows WPF 전용 `SettingsDialog.xaml` 환경 설정 대화상자 및 테마 선택 화면

---

### 📥 [다운로드 안내]
공식 GitHub 릴리스 저장소에서 최신 단일 설치파일(`Setup.exe`)을 안전하게 내려받으실 수 있습니다.

- 📥 **설치 관리자 다운로드 (GitHub)**: [kcert-manager-v1.7.2-setup.exe 다운로드](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.2)
- 🐙 **공식 GitHub 소스코드 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)

---

### 📋 [프로그램 사양 및 시스템 요구사항]
- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **소프트웨어 버전**: v1.7.2 (Semantic Versioning 2.0.0)
- **개발자**: AhBiYout (GitHub: [AhBiYout-all](https://github.com/AhBiYout-all))
- **공식 웹사이트**: [https://www.cisnet.co.kr/](https://www.cisnet.co.kr/) ((주)씨아이에스넷 CISNet)
- **공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **지원 운영체제**: Microsoft Windows 10 / 11 (64-bit 권장)
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt` 및 영어 `LICENSE_EN.txt` 2종 라이선스 공식 채택)
- **런타임 환경**: 단일 설치파일(`kcert-manager-v1.7.2-setup.exe`)에 자체 내장 (별도 런타임 설치 불필요)

---

### 📜 [패치 내역 요약]
- **v1.7.2 (2026-10-31)**: 상단 헤더 가로 볼륨 슬라이더 바 & ⚙️ 환경 설정 모달 상시 노출, C# WPF SettingsDialog 신설, SettingsService 로컬 영구 저장소 연동, '다시 표시하지 않음' Two-Way 바인딩 확립, XAML Spacing 제거로 CI 컴파일 완전 안정화.
- **v1.7.1 (2026-10-28)**: 만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화 개선, 휴지통 매니페스트 메타데이터(발급기관명/유효기간) 복원 보존, GitHub Actions Node.js 24/22 LTS 런타임 전환.
- **v1.7.0 (2026-10-27)**: 보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식) 시스템 신설, 성공 알림음 ON/OFF 및 볼륨 조절 슬라이더 구축, 컬럼 최소 폭 30px 자유 조절, 목록 세로 구분선 및 여백 밀도 컨트롤 도입.
