# 🌐 K-인증서 매니저 (K-Certificate Manager) v1.7.1 공식 구글 블로그 배포 원고

본 문서는 **구글 블로그(Blogger)** 포스팅을 위한 배포용 표준 문서입니다.  
사용자의 편집 환경에 맞춰 **[1. 작성 모드 (서식 있는 텍스트)]** 와 **[2. HTML 편집 모드]** 2가지 형태로 완벽하게 제공됩니다.

---

# [1. 작성 모드 (서식 있는 텍스트 - Visual Compose Mode)]
> **💡 사용법**: 아래의 내용을 그대로 복사(Ctrl+C)하여 구글 블로거 글쓰기 화면의 **'작성 모드 (서식 있는 텍스트)'**에 붙여넣기(Ctrl+V) 하시면 모든 스타일과 서식이 즉시 적용됩니다.

---

### [제목]
[K-인증서 매니저 v1.7.1] 만료 인증서 정리-휴지통 수량 100% 동기화 개선, 성공 알림음 볼륨 조절 & 컬럼 유연 조절 업데이트

---

### [본문]
대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융결제원 공동인증서(NPKI)를 안전하게 탐색하고 USB 드라이브 및 PC로 복사·백업하는 오픈소스 데스크톱 보안 솔루션 **'K-인증서 매니저(K-Certificate Manager) v1.7.1'** 정식 버전이 출시되었습니다!

이번 v1.7.1 릴리스에서는 사용자 여러분의 소중한 피드백을 적극 반영하여, 만료 인증서 일괄 정리 시 삭제된 인증서 개수와 안전 격리 휴지통에 보관되는 인증서 개수 간의 불일치 문제를 근본적으로 해소하였습니다. 이제 PC 로컬이나 USB에서 만료 인증서 22건을 정리하면 휴지통에도 정확히 22건이 누락 없이 1:1로 격리 보관되며, 발급기관명과 유효기간 등 상세 정보가 온전히 복원됩니다.

또한, 인증서 복사나 백업이 완료되었을 때 울리는 성공 알림음(SuccessChime)의 ON/OFF 토글 및 세밀한 볼륨 조절 슬라이더, 인증서 목록의 세로 구분선 및 좌우 여백 밀도 조절 기능, 인증서 명칭·경로·상태 컬럼의 최소 폭(30px) 자유 조절 기능이 함께 제공되어 한층 쾌적한 작업 환경을 선사합니다.

---

### [업데이트 (v1.7.1 신규 기능 및 개선 사항)]
1. 🗑️ **만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 일치화**:
   - PC 로컬 또는 USB 메모리에서 만료 인증서를 일괄 정리할 때, 동일 디렉터리를 공유하거나 비표준 경로를 가진 인증서라도 `trash_manifest.json`에 1:1로 정확하게 격리 기록되어 삭제 수량과 휴지통 보관 수량이 완벽하게 동기화됩니다.
2. 🏷️ **휴지통 매니페스트 메타데이터 완벽 복원 및 표시**:
   - 휴지통에 격리 보관된 인증서의 발급기관명(금융결제원, 행정안전부, 교육부 등), 인증서 분류(NPKI/GPKI/EPKI), 유효기간(만료일시) 정보가 보존되어 "알 수 없음" 표시 없이 원래의 세부 규격을 선명하게 조회할 수 있습니다.
3. 🔔 **성공 알림음(SuccessChime) ON/OFF 및 볼륨 조절 기능 (`설정 모달`)**:
   - 인증서 복사/백업 완료 시 재생되는 알림음을 사용자가 원하는 대로 켜고 끌 수 있으며, 0%~100% 슬라이더 및 5종 원클릭 볼륨 프리셋(음소거/25%/50%/80%/100%), 소리 미리듣기 테스트 버튼을 제공합니다.
4. 📏 **인증서 목록 세로 구분선(Vertical Grid Lines) 및 좌우 여백 밀도 조절**:
   - 각 컬럼 사이에 선명한 세로 구분선을 도입하여 컬럼 경계를 시각적으로 명확히 파악할 수 있으며, [좌우 여백: 좁게 | 보통 | 넓게] 3단계 프리셋으로 데이터 밀도를 자유롭게 조절할 수 있습니다.
5. 🔍 **인증서 명칭·경로·상태 컬럼 최소 폭(30px) 자유 조절 및 공식 발급기관명 표기**:
   - 컬럼 최소 폭 제한을 30px로 대폭 완화하여 사용자가 원하는 레이아웃으로 컬럼 폭을 자유롭게 리사이징할 수 있으며, 정부 및 공인 CA의 공식 기관명 뱃지를 정확하게 표시합니다.
6. 🛡️ **보안 영구 삭제 증적 감사 로그 (SubjectDN 포렌식) 시스템 연동**:
   - 휴지통 비우기 및 개별 영구 삭제 시 삭제 대상 인증서의 고유 식별자(`SubjectDN`), 원본 디스크 경로, SHA-256 전자지문 포렌식 증적이 작업 로그에 안전하게 보존됩니다.
7. 🚀 **GitHub Actions Node.js 24 Next-Gen / Node.js 22 LTS 런타임 전환**:
   - Node.js 20 EOL 대응을 완료하여 차세대 런타임 환경에서 빠르고 안전한 CI/CD 빌드 파이프라인을 구축했습니다.

---

### [앱 그림]
*(아래 캡처 화면을 블로그 이미지로 삽입해 주세요)*

📷 **[K-인증서 매니저 메인 보관함 및 만료 인증서 안전 정리 화면]**  
- 깔끔한 다크/라이트 테마와 함께 세로 구분선, 유연한 컬럼 리사이징, 안전 격리 휴지통 수량 100% 동기화가 적용된 메인 화면.

---

### [다운로드]
공식 GitHub 릴리스 저장소에서 최신 단일 설치파일(`Setup.exe`)을 안전하게 내려받으실 수 있습니다.

- 📥 **설치 관리자 다운로드 (GitHub)**: [kcert-manager-v1.7.1-setup.exe 다운로드](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.1)
- 🐙 **공식 GitHub 소스코드 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)

---

### [버전정보]
- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **소프트웨어 버전**: v1.7.1 (Semantic Versioning 2.0.0)
- **릴리스 일자**: 2026년 10월 28일
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt`, 영어 `LICENSE_EN.txt` 2종 라이선스 탑재 - 개인/기업/공공기관 영구 무료)

---

### [시스템 요구 사항]
- **지원 운영체제**: Microsoft Windows 10 (1809 이상) / Windows 11 (x64 / ARM64 지원)
- **런타임 환경**: 단일 설치파일(`kcert-manager-v1.7.1-setup.exe`)에 자체 내장 (별도 런타임 설치 불필요)
- **메모리 / 디스크**: 최소 RAM 512MB 이상 / 저장공간 150MB 여유 공간

---

### [제작자 및 공식 채널 안내]
- **제작자 (Author)**: AhBiYout
- **공식 블로그 (Blogger)**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **공식 홈페이지**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/) ((주)씨아이에스넷 CISNet)
- **공식 소스코드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)

---

### [전체 업데이트 (이전 릴리스 기능 개선 히스토리)]
- **v1.7.1 (2026-10-28)**: 만료 인증서 정리-안전 격리 휴지통 수량 100% 동기화 개선, 휴지통 매니페스트 메타데이터 보존, GitHub Actions Node.js 24/22 LTS 런타임 전환.
- **v1.7.0 (2026-10-27)**: 보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식), AppActivityLogModal 증적 전용 탭/검색, 성공 알림음 ON/OFF 및 볼륨 조절 슬라이더, 목록 세로 구분선 및 여백 밀도 조절, 컬럼 최소 폭 30px 자유 조절.
- **v1.6.5 (2026-10-25)**: 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화, DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 감사 로그 1번 인덱스 열 신설 및 동적 재색인.
- **v1.6.4 (2026-10-24)**: 타이틀바 창 제어 버튼 상시 노출 독립 Auto 컬럼 격리, 보관함 DataGrid 확정 폭 및 물리 스크롤바 유지.
- **v1.6.3 (2026-10-23)**: 상세 사이드바 닫힘 시 DataGrid 자동 가로 반응형 확장, PC ➔ USB 복사하기 전용 대화상자(820x640) 개편.
- **v1.6.2 (2026-10-22)**: 작업 감사 로그(Activity Log) 전용 팝업 대화상자 신설, 백업/복원/삭제 전체 세부 이력 및 .log 내보내기 구축.
- **v1.6.1 (2026-10-21)**: 인스톨러 방화벽 인바운드 규칙 4종 자동 등록 및 삭제 시 완전 제거, 윈도우 알림 배너 차단 방지 가이드 연동.
- **v1.6.0 (2026-10-20)**: GitHub Releases REST API 기반 3계층(3-Tier) 실시간 자동 업데이트 감지 및 전용 알림창 구축.
- **v1.5.0 (2026-10-18)**: 100% C# 순수 창작 코어 라이브러리(KCert.Core.dll) 전환, ASN.1 바이너리 파서, 무결성 SHA-256 검증기.
- **v1.4.0 (2026-10-15)**: 4대 테마 시스템(스마트 다크, 클래식 라이트, 포레스트 에메랄드, 딥 오션 네이비), 일체형 커스텀 윈도우 크롬 적용.
- **v1.3.0 (2026-10-12)**: USB ➔ PC 역방향 가져오기 마법사, 중복 인증서 덮어쓰기 방지 스마트 가드 탑재.
- **v1.2.0 (2026-10-10)**: 만료/타인 인증서 안전 격리 휴지통 시스템, 1-클릭 원위치 복원 및 영구 파쇄 기능 신설.
- **v1.1.0 (2026-10-08)**: 대한민국 6대 발급기관 OID 역해석 엔진 탑재.
- **v1.0.0 (2026-10-05)**: GPKI/EPKI/NPKI 인증서 자동 탐색 및 이동식 디스크(USB) 1-클릭 백업 최초 정식 릴리스.

---

### [추천 태그]
인증서관리,인증서복사,공동인증서,GPKI,NPKI,인증서백업,만료인증서정리,휴지통동기화,알림음설정,C#WPF,윈도우앱,KCertManager,Certificate,Backup,TrashVault,VolumeControl,Node24,Windows11,OpenSource

---
---

# [2. 구글 블로거 HTML 편집 모드 (HTML Code Mode)]
> **💡 사용법**: 아래의 HTML 코드를 전체 복사하여 구글 블로거 글쓰기 화면 좌측 상단의 연필 모양 아이콘을 눌러 **'HTML 보기'**로 전환한 후 그대로 붙여넣기 하시면 완벽한 디자인과 반응형 박스로 게시글이 렌더링됩니다.

```html
<!-- K-Certificate Manager v1.7.1 Google Blogger Post Body Start -->
<div style="font-family: 'Pretendard', 'Malgun Gothic', -apple-system, sans-serif; line-height: 1.75; color: #1e293b; max-width: 840px; margin: 0 auto; padding: 10px;">

  <!-- Hero Header Banner -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%); padding: 32px 24px; border-radius: 14px; text-align: center; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3); margin-bottom: 28px;">
    <div style="display: inline-block; background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; color: #7dd3fc; margin-bottom: 12px; letter-spacing: 0.5px;">
      공식 정식 배포 릴리스 · v1.7.1
    </div>
    <h1 style="font-size: 26px; font-weight: 800; margin: 0 0 10px 0; line-height: 1.4; color: #ffffff;">
      🛡️ K-인증서 매니저 (K-Certificate Manager) v1.7.1
    </h1>
    <p style="font-size: 15px; margin: 0; color: #cbd5e1; font-weight: 400;">
      만료 인증서 정리-휴지통 수량 100% 동기화 개선 &amp; 성공 알림음 볼륨 조절 업데이트
    </p>
  </div>

  <!-- Intro Text Box -->
  <div style="background: #f8fafc; border-left: 5px solid #2563eb; padding: 18px 20px; border-radius: 0 10px 10px 0; margin-bottom: 24px; font-size: 15px; color: #334155;">
    대한민국 공무원·교직원 행정전자서명 인증서(<strong>GPKI, EPKI</strong>)와 금융 공동인증서(<strong>NPKI</strong>)를 안전하게 관리하는 오픈소스 데스크톱 보안 유틸리티 <strong>'K-인증서 매니저 v1.7.1'</strong> 정식 버전이 출시되었습니다.<br/><br/>
    이번 v1.7.1 버전에서는 만료 인증서 일괄 정리 시 <strong>삭제된 인증서 수량(예: 22건)과 안전 격리 휴지통 수량이 정확히 1:1로 일치</strong>하도록 동기화 매니페스트 엔진을 전면 고도화하였으며, 휴지통 보관 시 발급기관명과 유효기간이 완벽하게 보존됩니다. 또한 <strong>성공 알림음(SuccessChime) ON/OFF 및 볼륨 조절 슬라이더</strong>, <strong>인증서 목록 세로 구분선 및 여백 밀도 컨트롤</strong>이 추가되었습니다.
  </div>

  <!-- Key Updates Section -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <h3 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
      ✨ v1.7.1 핵심 신규 기능 및 주요 개선
    </h3>
    <ul style="padding-left: 20px; margin: 0; font-size: 14.5px; color: #334155; line-height: 1.8;">
      <li><strong>만료 인증서 안전 정리 시 삭제 수량과 안전 격리 휴지통 수량 100% 동기화</strong>: 22개 만료 인증서 정리 시 휴지통에도 정확히 22개가 1:1로 격리 보관되도록 매니페스트(<code>trash_manifest.json</code>) 생성 엔진 개선.</li>
      <li><strong>휴지통 매니페스트 메타데이터 완벽 복원</strong>: 격리 보관소 열람 시 발급기관명(금융결제원, 행정안전부 등), 인증서 분류, 만료일자가 원본 그대로 선명하게 출력.</li>
      <li><strong>성공 알림음(SuccessChime) ON/OFF 및 볼륨 조절 슬라이더</strong>: 환경 설정 모달(<code>SettingsModal</code>)에서 알림음 토글 스위치, 0%~100% 볼륨 슬라이더, 5종 음량 프리셋, 미리듣기 테스트 지원.</li>
      <li><strong>인증서 보관함 세로 구분선 및 여백 밀도 조절</strong>: 데이터 셀 간 세로선(<code>border-r</code>) 적용 및 [좌우 여백: 좁게 | 보통 | 넓게] 3단계 프리셋 제공.</li>
      <li><strong>인증서 명칭·경로·상태 컬럼 최소 폭(30px) 자유 조절 및 공식 발급기관명 표기</strong>: 유연한 마우스 드래그 리사이징 및 대한민국 주요 CA 공식 명칭 뱃지 연동.</li>
      <li><strong>보안 영구 삭제 증적 감사 로그 (SubjectDN 포렌식) 시스템 연동</strong>: 삭제 대상 인증서의 고유 식별자(SubjectDN), 원본 경로, SHA-256 전자지문 영구 보존 및 1-클릭 클립보드 복사.</li>
      <li><strong>GitHub Actions 워크플로 Node.js 24 Next-Gen / Node.js 22 LTS 전환</strong>: Node.js 20 Deprecated &amp; EOL 공식 대응으로 CI 빌드 환경 현대화.</li>
    </ul>
  </div>

  <!-- App Screenshot Guide Section -->
  <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
    <h4 style="font-size: 16px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0;">
      📸 K-인증서 매니저 v1.7.1 메인 대시보드 및 만료 정리 뷰
    </h4>
    <div style="border: 2px dashed #94a3b8; border-radius: 10px; padding: 36px 16px; background: #ffffff; color: #64748b; font-size: 14px;">
      [구글 블로거 글쓰기 편집기에서 <strong>'이미지 삽입'</strong> 기능을 이용해 프로그램 스크린샷 이미지를 이곳에 등록하세요]
      <div style="font-weight: bold; margin-top: 6px; color: #0284c7;">
        🗑️ 만료 인증서 안전 정리 · 안전 격리 휴지통 수량 100% 일치 동기화 인터페이스
      </div>
    </div>
  </div>

  <!-- Download Section -->
  <div style="background: linear-gradient(to right, #ecfdf5, #f0fdf4); border: 1px solid #a7f3d0; border-radius: 12px; padding: 22px; margin-bottom: 24px; text-align: center;">
    <h3 style="font-size: 18px; font-weight: bold; color: #065f46; margin-top: 0; margin-bottom: 12px;">
      📥 공식 단일 설치파일 (Setup.exe) 다운로드
    </h3>
    <p style="font-size: 14px; color: #047857; margin-bottom: 16px;">
      방화벽 인바운드 규칙 자동 등록, 바탕화면/시작메뉴 바로가기 지원 정식 Inno Setup 인스톨러 배포본
    </p>
    <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.1" target="_blank" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);">
      📥 kcert-manager-v1.7.1-setup.exe 다운로드 (GitHub)
    </a>
  </div>

  <!-- Version & Requirements Table -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <h3 style="font-size: 17px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
      ⚙️ 버전 정보 및 시스템 요구 사항
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px;">소프트웨어 버전</td><td style="color: #1e293b; font-weight: bold;">v1.7.1 (Semantic Versioning 2.0.0)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">릴리스 일자</td><td style="color: #1e293b;">2026년 10월 28일</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">지원 운영체제</td><td style="color: #1e293b;">Microsoft Windows 10 (1809+) / Windows 11 (x64 / ARM64)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">런타임 환경</td><td style="color: #1e293b;">단일 설치 인스톨러 자체 내장 (별도 런타임 설치 불필요)</td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #64748b;">소프트웨어 라이선스</td><td style="color: #1e293b;">Free Use / MIT License (개인·기업·공공기관 100% 무료)</td></tr>
    </table>
  </div>

  <!-- Author & Official Channels -->
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; font-size: 14px;">
    <h4 style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 8px 0;">
      👨‍💻 제작자 및 공식 채널
    </h4>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #475569;">
      <li><strong>제작자</strong>: AhBiYout</li>
      <li><strong>공식 블로그</strong>: <a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">https://ahbiyoutvibe.blogspot.com/</a></li>
      <li><strong>공식 홈페이지</strong>: <a href="http://www.cisnet.co.kr/" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">http://www.cisnet.co.kr/</a> ((주)씨아이에스넷 CISNet)</li>
      <li><strong>GitHub 저장소</strong>: <a href="https://github.com/AhBiYout-all/K-Certificate-Manager" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">https://github.com/AhBiYout-all/K-Certificate-Manager</a></li>
    </ul>
  </div>

  <!-- Full Release History Box -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <h3 style="font-size: 17px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
      📜 전체 업데이트 (v1.0.0 ~ v1.7.1 기능 개선 히스토리)
    </h3>
    <div style="font-size: 13.5px; color: #475569; line-height: 1.75; max-height: 300px; overflow-y: auto; padding-right: 8px;">
      <div style="margin-bottom: 10px;"><strong>v1.7.1 (2026-10-28)</strong>: 만료 인증서 정리-안전 격리 휴지통 수량 100% 동기화 개선, 휴지통 매니페스트 메타데이터 보존, GitHub Actions Node.js 24/22 LTS 런타임 전환.</div>
      <div style="margin-bottom: 10px;"><strong>v1.7.0 (2026-10-27)</strong>: 보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식), AppActivityLogModal 증적 전용 탭/검색, 성공 알림음 ON/OFF 및 볼륨 조절 슬라이더, 목록 세로 구분선 및 여백 밀도 조절, 컬럼 최소 폭 30px 자유 조절.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.5 (2026-10-25)</strong>: 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화, DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 감사 로그 1번 인덱스 열 신설 및 동적 재색인.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.4 (2026-10-24)</strong>: 타이틀바 창 제어 버튼 상시 노출 독립 Auto 컬럼 격리, 보관함 DataGrid 확정 폭 및 물리 스크롤바 유지.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.3 (2026-10-23)</strong>: 상세 사이드바 닫힘 시 DataGrid 자동 가로 반응형 확장, PC ➔ USB 복사하기 전용 대화상자(820x640) 개편.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.2 (2026-10-22)</strong>: 작업 감사 로그(Activity Log) 전용 팝업 대화상자 신설, 백업/복원/삭제 전체 세부 이력 및 .log 내보내기 구축.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.1 (2026-10-21)</strong>: 인스톨러 방화벽 인바운드 규칙 4종 자동 등록 및 삭제 시 완전 제거, 윈도우 알림 배너 차단 방지 가이드 연동.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.0 (2026-10-20)</strong>: GitHub Releases REST API 기반 3계층(3-Tier) 실시간 자동 업데이트 감지 및 전용 알림창 구축.</div>
      <div style="margin-bottom: 10px;"><strong>v1.5.0 (2026-10-18)</strong>: 100% C# 순수 창작 코어 라이브러리(KCert.Core.dll) 전환, ASN.1 바이너리 파서, 무결성 SHA-256 검증기.</div>
      <div style="margin-bottom: 10px;"><strong>v1.4.0 (2026-10-15)</strong>: 4대 테마 시스템(스마트 다크, 클래식 라이트, 포레스트 에메랄드, 딥 오션 네이비), 일체형 커스텀 윈도우 크롬 적용.</div>
      <div style="margin-bottom: 10px;"><strong>v1.3.0 (2026-10-12)</strong>: USB ➔ PC 역방향 가져오기 마법사, 중복 인증서 덮어쓰기 방지 스마트 가드 탑재.</div>
      <div style="margin-bottom: 10px;"><strong>v1.2.0 (2026-10-10)</strong>: 만료/타인 인증서 안전 격리 휴지통 시스템, 1-클릭 원위치 복원 및 영구 파쇄 기능 신설.</div>
      <div style="margin-bottom: 10px;"><strong>v1.1.0 (2026-10-08)</strong>: 대한민국 6대 발급기관 OID 역해석 엔진 탑재.</div>
      <div><strong>v1.0.0 (2026-10-05)</strong>: GPKI/EPKI/NPKI 인증서 자동 탐색 및 이동식 디스크(USB) 1-클릭 백업 최초 정식 릴리스.</div>
    </div>
  </div>

  <!-- Recommended Tags Banner -->
  <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #64748b; line-height: 1.6;">
    <strong style="color: #334155;">🏷️ 추천 태그 (Blogger 라벨 입력란에 붙여넣기):</strong><br/>
    <code style="background: #e2e8f0; padding: 3px 6px; border-radius: 4px; color: #0f172a; font-family: monospace; display: inline-block; margin-top: 4px;">
      인증서관리,인증서복사,공동인증서,GPKI,NPKI,인증서백업,만료인증서정리,휴지통동기화,알림음설정,C#WPF,윈도우앱,KCertManager,Certificate,Backup,TrashVault,VolumeControl,Node24,Windows11,OpenSource
    </code>
  </div>

</div>
<!-- K-Certificate Manager v1.7.1 Google Blogger Post Body End -->
```
