# 🌐 K-인증서 매니저 (K-Certificate Manager) v1.7.0 공식 구글 블로그 배포 원고

본 문서는 **구글 블로그(Blogger)** 포스팅을 위한 배포용 표준 문서입니다.  
사용자의 편집 환경에 맞춰 **[1. 작성 모드 (서식 있는 텍스트)]** 와 **[2. HTML 편집 모드]** 2가지 형태로 완벽하게 제공됩니다.

---

# [1. 작성 모드 (서식 있는 텍스트 - Visual Compose Mode)]
> **💡 사용법**: 아래의 내용을 그대로 복사(Ctrl+C)하여 구글 블로거 글쓰기 화면의 **'작성 모드 (서식 있는 텍스트)'**에 붙여넣기(Ctrl+V) 하시면 모든 스타일과 서식이 즉시 적용됩니다.

---

### [제목]
[K-인증서 매니저 v1.7.0] 공무원·은행 공동인증서 보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식) 시스템 구축 & UI 최적화 업데이트

---

### [본문]
대한민국 공무원·교직원 행정전자서명 인증서(GPKI, EPKI)와 금융결제원 공동인증서(NPKI)를 안전하게 탐색하고 USB 드라이브 및 PC로 복사·백업하는 오픈소스 데스크톱 보안 솔루션 **'K-인증서 매니저(K-Certificate Manager) v1.7.0'** 정식 버전이 출시되었습니다!

이번 v1.7.0 마이너 릴리스에서는 공공기관 및 기업 보안 규정 준수(Compliance)를 완벽하게 충족하기 위한 **'보안 영구 삭제 증적 감사 로그(Secure Deletion Audit Records)'** 시스템이 전면 신설되었습니다. 휴지통 비우기 및 개별 영구 삭제 시 인증서 고유 식별자(SubjectDN), 원본 파일 디렉터리 경로, SHA-256 전자지문이 손실 없이 영구 보존되며, 작업 로그 모달에서 즉각 검색 및 1-클릭 클립보드 복사, `.log` 감사 보고서 내보내기가 가능합니다.

또한 만료 인증서 일괄 정리 시 휴지통 동기화 카운트 일치화, 보관함 컬럼 가변 너비 교정, 스크롤바 디자인 및 호버 트랜지션 고도화, 앱 시작 시 상세 사이드바 해제(닫힘) 최적화로 사용 편의성이 대폭 강화되었습니다.

---

### [업데이트 (v1.7.0 신규 기능)]
1. 🛡️ **보안 영구 삭제 증적 감사 로그(Secure Deletion Audit Records) 전면 도입**:
   - 휴지통 비우기 및 개별 영구 삭제 시 삭제 대상 인증서의 고유 식별자(`SubjectDN`), 원본 디스크 파일 경로, 발급기관, 일련번호, SHA-256 무결성 전자지문 감사 보존.
2. 📋 **작업 감사 모달(`AppActivityLogModal`) 전용 '보안 삭제 증적' 탭 신설**:
   - 전용 탭에서 영구 삭제 증적 목록 확인, SubjectDN/경로/시리얼 통합 검색, 1-클릭 클립보드 복사 기능 완비.
3. 📄 **감사 보고서(`.log`) 포렌식 증적 섹션 자동 추출**:
   - 시스템 작업 로그 내보내기 시 `[보안 삭제 증적 감사 보고서]` 섹션 자동 생성으로 보안 감사 증빙 서류 즉각 대응.
4. 🗑️ **만료 인증서 일괄 정리 시 휴지통 동기화 카운트 불일치 근본 해소**:
   - 만료 인증서 정리 시 이동된 인증서가 휴지통에 즉각 1:1 동기화되어 카운트 정합성 100% 확보.
5. 📏 **인증서 보관함 경로 상태 컬럼 반응형 가변 너비(`Width="*" MinWidth="100"`) 교정**:
   - 창 크기와 사이드바 상태에 따라 컬럼이 부드럽게 줄어들고 늘어나도록 가변 레이아웃 보장 및 가로 스크롤바 활성화.
6. 🎨 **스크롤바 썸(Thumb) 두께 및 마우스 호버 트랜지션 고도화**:
   - `border-width` 2.5px 슬림화 및 호버 시 부드러운 전환 효과(`transition`) 추가.
7. 🚀 **앱 시작 시 상세 사이드바 기본 해제(닫힘) 상태 적용**:
   - 앱 구동 시 메인 인증서 보관함 DataGrid가 화면 전체 너비를 시원하게 활용하도록 기본값 최적화.

---

### [앱 그림]
*(아래 캡처 화면을 블로그 이미지로 삽입해 주세요)*

📷 **[K-인증서 매니저 메인 보관함 및 보안 삭제 증적 감사 로그 화면]**  
- 깔끔한 다크/라이트 테마와 함께 1번부터 시작하는 고정 인덱스 열, 가변 반응형 컬럼, 보안 삭제 증적 탭이 유기적으로 조화된 인터페이스.

---

### [다운로드]
공식 GitHub 릴리스 저장소에서 최신 단일 설치파일(`Setup.exe`)을 안전하게 내려받으실 수 있습니다.

- 📥 **설치 관리자 다운로드 (GitHub)**: [kcert-manager-v1.7.0-setup.exe 다운로드](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.0)
- 🐙 **공식 GitHub 소스코드 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)

---

### [버전정보]
- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **소프트웨어 버전**: v1.7.0 (Semantic Versioning 2.0.0)
- **릴리스 일자**: 2026년 10월 27일
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt`, 영어 `LICENSE_EN.txt` 2종 라이선스 정의 탑재 - 개인/기업/공공기관 영구 무료)

---

### [시스템 요구 사항]
- **지원 운영체제**: Microsoft Windows 10 (1809 이상) / Windows 11 (x64 / ARM64 지원)
- **런타임 환경**: 단일 설치파일(`kcert-manager-v1.7.0-setup.exe`)에 자체 내장 (별도 런타임 설치 불필요)
- **메모리 / 디스크**: 최소 RAM 512MB 이상 / 저장공간 150MB 여유 공간

---

### [제작자 및 공식 채널 안내]
- **제작자 (Author)**: AhBiYout
- **공식 블로그 (Blogger)**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **공식 홈페이지**: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/) ((주)씨아이에스넷 CISNet)
- **공식 소스코드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)

---

### [전체 업데이트 (이전 릴리스 기능 개선 히스토리)]
- **v1.7.0 (2026-10-27)**: 보안 영구 삭제 증적 감사 로그(SubjectDN, 원본경로, SHA-256 전자지문 포렌식) 전면 구축, AppActivityLogModal 증적 전용 탭/검색/원클릭 복사, 만료 정리 휴지통 카운트 불일치 근본 해소, 경로 상태 반응형 컬럼 교정, 스크롤바 호버 트랜지션 고도화.
- **v1.6.5 (2026-10-25)**: 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화(Web/WPF), DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 감사 로그 1번 인덱스 열 신설 및 동적 재색인, C# .NET 10 / .NET 8 빌드 무결성 확보.
- **v1.6.4 (2026-10-24)**: 일체형 타이틀바 창 제어 버튼(최소/최대/닫기) 가로 스크롤 밀림 방지 독립 Auto 컬럼 격리, 인증서 보관함 DataGrid 확정 폭 및 물리 스크롤바 유지, .NET 10 / .NET 8 자동 감지 컴파일 파이프라인 정합성 완성.
- **v1.6.3 (2026-10-23)**: 상세 사이드바 닫힘 시 DataGrid 자동 가로 반응형 확장, PC ➔ USB 복사하기 전용 일체형 대화상자(820x640) 개편.
- **v1.6.2 (2026-10-22)**: 작업 감사 로그(Activity Log) 전용 팝업 대화상자 신설, 백업/복원/삭제 전체 세부 이력 및 .log 내보내기 구축.
- **v1.6.1 (2026-10-21)**: 인스톨러 방화벽 인바운드 규칙 4종 자동 등록 및 삭제 시 완전 제거, 윈도우 알림 배너 0x800704ec 차단 방지 가이드 연동.
- **v1.6.0 (2026-10-20)**: GitHub Releases REST API 기반 3계층(3-Tier) 실시간 자동 업데이트 감지 및 전용 알림창 구축.
- **v1.5.0 (2026-10-18)**: 100% C# 순수 창작 코어 라이브러리(`KCert.Core.dll`) 전환, ASN.1 바이너리 파서, 무결성 SHA-256 검증기, 제로 의존성 DLL 아키텍처 완성.
- **v1.4.0 (2026-10-15)**: 4대 테마 시스템(스마트 다크, 클래식 라이트, 포레스트 에메랄드, 딥 오션 네이비), 일체형 커스텀 윈도우 크롬 적용.
- **v1.3.0 (2026-10-12)**: USB ➔ PC 역방향 가져오기 마법사, 중복 인증서 덮어쓰기 방지 스마트 가드 탑재.
- **v1.2.0 (2026-10-10)**: 만료/타인 인증서 안전 격리 휴지통 시스템, 1-클릭 원위치 복원 및 영구 파쇄 기능 신설.
- **v1.1.0 (2026-10-08)**: 대한민국 6대 발급기관(금융결제원, 코스콤, 한국정보인증, 행정안전부, 교육부 등) OID 역해석 엔진 탑재.
- **v1.0.0 (2026-10-05)**: GPKI/EPKI/NPKI 인증서 자동 탐색 및 이동식 디스크(USB) 1-클릭 백업 최초 정식 릴리스.

---

### [추천 태그]
인증서관리,인증서복사,공동인증서,GPKI,NPKI,인증서백업,보안삭제,포렌식,감사로그,C#WPF,윈도우앱,KCertManager,Certificate,Backup,Forensics,SecureDelete,AuditLog,Windows11,OpenSource

---
---

# [2. 구글 블로거 HTML 편집 모드 (HTML Code Mode)]
> **💡 사용법**: 아래의 HTML 코드를 전체 복사하여 구글 블로거 글쓰기 화면 좌측 상단의 연필 모양 아이콘을 눌러 **'HTML 보기'**로 전환한 후 그대로 붙여넣기 하시면 완벽한 디자인과 반응형 박스로 게시글이 렌더링됩니다.

```html
<!-- K-Certificate Manager v1.7.0 Google Blogger Post Body Start -->
<div style="font-family: 'Pretendard', 'Malgun Gothic', -apple-system, sans-serif; line-height: 1.75; color: #1e293b; max-width: 840px; margin: 0 auto; padding: 10px;">

  <!-- Hero Header Banner -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%); padding: 32px 24px; border-radius: 14px; text-align: center; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3); margin-bottom: 28px;">
    <div style="display: inline-block; background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; color: #7dd3fc; margin-bottom: 12px; letter-spacing: 0.5px;">
      공식 정식 배포 릴리스 · v1.7.0
    </div>
    <h1 style="font-size: 26px; font-weight: 800; margin: 0 0 10px 0; line-height: 1.4; color: #ffffff;">
      🛡️ K-인증서 매니저 (K-Certificate Manager) v1.7.0
    </h1>
    <p style="font-size: 15px; margin: 0; color: #cbd5e1; font-weight: 400;">
      보안 영구 삭제 증적 감사 로그(SubjectDN 포렌식) 시스템 구축 &amp; 보관함 UI 고도화
    </p>
  </div>

  <!-- Intro Text Box -->
  <div style="background: #f8fafc; border-left: 5px solid #2563eb; padding: 18px 20px; border-radius: 0 10px 10px 0; margin-bottom: 24px; font-size: 15px; color: #334155;">
    대한민국 공무원·교직원 행정전자서명 인증서(<strong>GPKI, EPKI</strong>)와 금융 공동인증서(<strong>NPKI</strong>)를 안전하게 관리하는 오픈소스 데스크톱 보안 유틸리티 <strong>'K-인증서 매니저 v1.7.0'</strong> 정식 버전이 출시되었습니다.<br/><br/>
    이번 버전에서는 공공기관 및 기업의 엄격한 보안 감사 요건을 충족하기 위해 <strong>'보안 영구 삭제 증적 감사 로그(Secure Deletion Audit Trail)'</strong>를 전면 구축하여, 삭제 대상 인증서의 <strong>SubjectDN 고유 식별자, 원본 디렉터리 경로, SHA-256 전자지문</strong>을 완벽 보존하고 원클릭 복사 및 <code>.log</code> 감사 보고서로 즉각 추출할 수 있습니다.
  </div>

  <!-- Key Updates Section -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <h3 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
      ✨ v1.7.0 핵심 신규 기능 및 주요 개선
    </h3>
    <ul style="padding-left: 20px; margin: 0; font-size: 14.5px; color: #334155; line-height: 1.8;">
      <li><strong>보안 영구 삭제 증적 감사 로그 시스템 전면 신설</strong>: 휴지통 비우기 및 개별 영구 삭제 시 SubjectDN, 원본 절대경로, SHA-256 전자지문 자동 영구 보존.</li>
      <li><strong>작업 감사 모달 전용 탭 완비</strong>: <code>AppActivityLogModal</code> 내 '보안 삭제 증적' 탭 제공, 실시간 검색 필터 및 1-클릭 클립보드 복사 지원.</li>
      <li><strong>감사 보고서(<code>.log</code>) 포렌식 증적 섹션 자동 생성</strong>: 시스템 로그 내보내기 시 법적·감사적 증빙이 가능한 포렌식 감사 블록 자동 출력.</li>
      <li><strong>만료 인증서 일괄 정리 휴지통 카운트 불일치 근본 해결</strong>: 만료 정리 후 휴지통 표시 개수와 격리 인증서 수가 100% 일치하도록 동기화 로직 개선.</li>
      <li><strong>보관함 경로 상태 반응형 컬럼 교정</strong>: <code>Width="*" MinWidth="100"</code> 반응형 가변 너비로 교정하여 창 축소 시에도 매끄럽게 조절되고 가로 스크롤바 활성화.</li>
      <li><strong>스크롤바 썸(Thumb) 두께 및 호버 트랜지션 고도화</strong>: 2.5px 슬림형 테두리 및 부드러운 배경색 전환 효과 적용.</li>
      <li><strong>앱 시작 시 상세 사이드바 기본 해제(닫힘) 상태 적용</strong>: 넓고 쾌적한 보관함 목록 뷰포트 제공.</li>
    </ul>
  </div>

  <!-- App Screenshot Guide Section -->
  <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
    <h4 style="font-size: 16px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0;">
      📸 K-인증서 매니저 v1.7.0 메인 대시보드 및 감사 로그 뷰
    </h4>
    <div style="border: 2px dashed #94a3b8; border-radius: 10px; padding: 36px 16px; background: #ffffff; color: #64748b; font-size: 14px;">
      [구글 블로거 글쓰기 편집기에서 <strong>'이미지 삽입'</strong> 기능을 이용해 메인 프로그램 스크린샷 이미지를 이곳에 등록하세요]
      <div style="font-weight: bold; margin-top: 6px; color: #0284c7;">
        🛡️ 보안 영구 삭제 증적 탭 · SubjectDN 및 원본 경로 1-클릭 복사 인터페이스 탑재
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
    <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.7.0" target="_blank" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);">
      📥 kcert-manager-v1.7.0-setup.exe 다운로드 (GitHub)
    </a>
  </div>

  <!-- Version & Requirements Table -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <h3 style="font-size: 17px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
      ⚙️ 버전 정보 및 시스템 요구 사항
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px;">소프트웨어 버전</td><td style="color: #1e293b; font-weight: bold;">v1.7.0 (Semantic Versioning 2.0.0)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">릴리스 일자</td><td style="color: #1e293b;">2026년 10월 27일</td></tr>
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
      📜 전체 업데이트 (v1.0.0 ~ v1.7.0 기능 개선 히스토리)
    </h3>
    <div style="font-size: 13.5px; color: #475569; line-height: 1.75; max-height: 300px; overflow-y: auto; padding-right: 8px;">
      <div style="margin-bottom: 10px;"><strong>v1.7.0 (2026-10-27)</strong>: 보안 영구 삭제 증적 감사 로그(SubjectDN, 원본경로, SHA-256 전자지문 포렌식) 전면 구축, AppActivityLogModal 증적 전용 탭/검색/원클릭 복사, 만료 정리 휴지통 카운트 불일치 근본 해소, 경로 상태 반응형 컬럼 교정, 스크롤바 호버 트랜지션 고도화.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.5 (2026-10-25)</strong>: 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화(Web/WPF), DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 감사 로그 1번 인덱스 열 신설 및 동적 재색인, C# .NET 10 / .NET 8 빌드 무결성 확보.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.4 (2026-10-24)</strong>: 타이틀바 창 제어 버튼(최소/최대/닫기) 상시 노출 독립 Auto 컬럼 격리, 인증서 보관함 DataGrid 확정 폭 및 물리 스크롤 유지, .NET 10 / .NET 8 자동 감지 컴파일 파이프라인 정합성 완성.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.3 (2026-10-23)</strong>: 상세 사이드바 닫힘 시 DataGrid 자동 가로 반응형 확장, PC ➔ USB 복사하기 전용 대화상자(820x640) 일체형 개편.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.2 (2026-10-22)</strong>: 작업 감사 로그(Activity Log) 전용 팝업 대화상자 신설, 백업/복원/삭제 전체 세부 이력 및 .log 내보내기 구축.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.1 (2026-10-21)</strong>: 인스톨러 방화벽 인바운드 규칙 4종 자동 등록 및 삭제 시 완전 제거, 윈도우 알림 배너 차단 방지 가이드 연동.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.0 (2026-10-20)</strong>: GitHub Releases REST API 기반 3계층(3-Tier) 실시간 자동 업데이트 감지 및 전용 알림창 구축.</div>
      <div style="margin-bottom: 10px;"><strong>v1.5.0 (2026-10-18)</strong>: 100% C# 순수 창작 코어 라이브러리(KCert.Core.dll) 전환, ASN.1 바이너리 파서, 무결성 SHA-256 검증기, 제로 의존성 DLL 아키텍처 완성.</div>
      <div style="margin-bottom: 10px;"><strong>v1.4.0 (2026-10-15)</strong>: 4대 테마 시스템(스마트 다크, 클래식 라이트, 포레스트 에메랄드, 딥 오션 네이비), 일체형 커스텀 윈도우 크롬 적용.</div>
      <div style="margin-bottom: 10px;"><strong>v1.3.0 (2026-10-12)</strong>: USB ➔ PC 역방향 가져오기 마법사, 중복 인증서 덮어쓰기 방지 스마트 가드 탑재.</div>
      <div style="margin-bottom: 10px;"><strong>v1.2.0 (2026-10-10)</strong>: 만료/타인 인증서 안전 격리 휴지통 시스템, 1-클릭 원위치 복원 및 영구 파쇄 기능 신설.</div>
      <div style="margin-bottom: 10px;"><strong>v1.1.0 (2026-10-08)</strong>: 대한민국 6대 발급기관(금융결제원, 코스콤, 한국정보인증, 행정안전부, 교육부 등) OID 역해석 엔진 탑재.</div>
      <div><strong>v1.0.0 (2026-10-05)</strong>: GPKI/EPKI/NPKI 인증서 자동 탐색 및 이동식 디스크(USB) 1-클릭 백업 최초 정식 릴리스.</div>
    </div>
  </div>

  <!-- Recommended Tags Banner -->
  <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #64748b; line-height: 1.6;">
    <strong style="color: #334155;">🏷️ 추천 태그 (Blogger 라벨 입력란에 붙여넣기):</strong><br/>
    <code style="background: #e2e8f0; padding: 3px 6px; border-radius: 4px; color: #0f172a; font-family: monospace; display: inline-block; margin-top: 4px;">
      인증서관리,인증서복사,공동인증서,GPKI,NPKI,인증서백업,보안삭제,포렌식,감사로그,C#WPF,윈도우앱,KCertManager,Certificate,Backup,Forensics,SecureDelete,AuditLog,Windows11,OpenSource
    </code>
  </div>

</div>
<!-- K-Certificate Manager v1.7.0 Google Blogger Post Body End -->
```
