# 📢 K-인증서 매니저 v2.2.0 구글 블로그 배포 통합 문서
> 구글 블로거(Blogger) 게시 시 아래의 **`[작성 모드 (서식 있는 텍스트)]`** 또는 **`[HTML 편집 모드]`** 중 원하는 모드를 선택해 그대로 복사·붙여넣기 하세요.

---

# Part A. [작성 모드 (서식 있는 텍스트 / Compose Mode)]

## 1. 제목 (Title)
**K-인증서 매니저 v2.2.0 정식 릴리스: 2026 국내 인증 동향·RSA 3072-bit 보안강도 점검, 시작 무응답 해소 3단계 초고속 스캔 및 전수 감사 안정화**

---

## 2. 본문 (Body)
대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(`C:\`)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v2.2.0** 정식 버전이 출시되었습니다.

이번 `v2.2.0` 정식 마이너(MINOR) 릴리스는 **2027년 2월 15일 시행 예정인 5대 공동인증기관 RSA 3072-bit 보안강도 상향 일정**과 **GPKI·EPKI 비액티브엑스(HTML5) 전환, 2026년 8월 28일 전자정부법 시행령 기반 모바일 신분증 8종 확대, 금융·민간 간편인증 비교 가이드**를 웹 콘솔과 C# WPF 데스크톱 앱 모두에 오프라인 분석 기능으로 전면 탑재했습니다. 또한 앱 시작 직후 멈춤 현상을 원천 해소하는 **3단계 비차단 시작 스캔 파이프라인**과 3차례 심층 전수 감사 수정까지 완료해 한층 쾌적하고 정확한 인증서 관리 경험을 제공합니다.

---

## 3. 업데이트 (Recent Updates)
- 🔐 **오프라인 X.509 RSA 3072-bit 보안강도 점검 & 진단 탭 신설 (`certParser`, `KCertParser`, `DiagnosticsRepairModal`, `DiagnosticsRepairDialog`)**:
  - 보유 중인 로컬 인증서의 공개키 비트 길이(RSA 1024/2048/3072/4096-bit, ECDSA)와 서명 알고리즘(SHA-1 / SHA-256)을 오프라인으로 즉시 분석해 **`3072-bit 권장`**, **`2048-bit 전환 대상`**, **`1024-bit·SHA-1 취약`** 3단계로 진단합니다.
  - 기존 2048-bit 인증서는 만료일까지 정상 사용 가능하며, 1024-bit·SHA-1 취약 인증서만 즉시 재발급 경고를 표시합니다. `진단 및 복구` 창 내 **`보안강도 점검 (3072-bit)`** 탭과 원클릭 점검 리포트 복사를 지원합니다.
- 📰 **2026 국내 인증서 법령 동향 & 7대 인증 체계 한눈에 비교 (`SecurityGuideModal`, `SecurityGuideDialog`, `RenewalGuidanceDialog`)**:
  - 상단 헤더 `[보안 수칙·동향]` 창에 **`2026 보안강도·법령 동향`**과 **`국내 인증서 전체 비교`** 탭을 추가해 로컬 파일 기반(GPKI·EPKI·MPKI·NPKI)과 클라우드/모바일 인증서(금융인증서 YesKey·민간 간편인증·모바일 신분증)의 차이, 보관 방법, 갱신 팁을 손쉽게 비교할 수 있습니다.
  - 기관별 갱신 안내 창에도 비액티브엑스 전환·3072-bit 적용 일정·이니텍(INITECH) 전환 안내가 함께 수록되었습니다.
- ⚡ **WPF 앱 시작 직후 `응답없음` 원천 해소 — 3단계 비차단 시작 스캔 (`FastScanPipeline`, `CertLocationScanner`, `MainViewModel`)**:
  - 앱 구동 직후 **`0단계 Local Fast-Pass`**(내 PC 표준 경로 0.05초 즉시 표시) ➔ **`1단계 Drive Fast-Pass`**(준비된 이동식 드라이브 병렬 스캔) ➔ **`2단계 Deep-Pass`**(비표준·심층 경로 백그라운드 스트리밍)로 분리하고, OS `DriveType` 기반 네트워크·광학 드라이브 차단 및 바운디드 드라이브 준비 검사(`IsDriveReadyBounded`)를 도입해 UI 멈춤 현상을 완벽히 해결했습니다.
- 🛡️ **개인 성명 오분류 교정 · 발급기관 정밀 매칭 & Web/WPF 심층 전수 감사 안정화 (작업 차수 191~193)**:
  - `김지원`, `이정원`, `김진실` 등 일반 개인 성명이 단일 음절(`원`, `실`, `부`, `청`, `처`) 매칭으로 `(기관용)`으로 오분류되던 파서 결함을 문맥 기반으로 교정했습니다.
  - `CertIntegrityDoctor` 동적 개인키 파일명 보고 및 GPKI/EPKI `cn=` 단일 RDN 표준 경로 정밀화, `RenewalGuidanceDialog`·`renewalStore` 발급기관(Issuer) 우선 매칭으로 NPKI 인증서 오분류를 차단했습니다.
  - WPF `DispatchSafeAsync`·`SafeGetFullPath`·`SearchLocationsDialog` Fast-Pass 유지, Web 비동기 클립보드 예외 처리·새로고침 시퀀스 가드·`targetDrive` 널 가드 및 기관 고객센터 번호 정합성을 완비했습니다.
- 🚀 **인앱 자동 다운로드·무인 셀프 설치 & `Class1` 기관 필터 계승 (`v2.1.x`)**:
  - 업데이트 창 `[확인 (자동 다운로드 · 설치)]` 원스톱 업데이트, 통합 다크 테마(`#0F1219`), CSS Grid `auto-fill` 카드 레이아웃, `Class1` 기관 배지·필터, DPAPI/AES-256 보호 보관함 및 60fps 유동 네온 테두리를 그대로 계승·제공합니다.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v2.2.0 3단계 초고속 스캔 & RSA 3072-bit 보안강도 점검]
- 상단 툴바: 🛡️ 보안 수칙·동향 | 🏥 진단·복구(보안강도 점검) | 💾 PC ➔ USB | 📥 USB ➔ PC | ✨ 업데이트 확인
- 목록 배지: RSA 3072-bit 권장(녹색) / 2048-bit 전환 대상(청색) / 1024-bit·SHA-1 취약(적색) & CLASS1 기관 배지
- 진단·복구 창: [보안강도 점검 (3072-bit)] 탭 · 등급별 필터 · 원클릭 리포트 복사 · 비표준 경로 정위치 복구
- 보안 수칙 창: [2026 보안강도·법령 동향] & [국내 인증서 전체 비교 (7대 체계)]
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- 💾 **공식 구글 블로그 다운로드 안내**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 및 자동 업데이트 안내**: `kcert-manager-v2.2.0-setup.exe` 파일을 실행하면 바탕화면 바로가기 생성 및 Windows 방화벽 규칙 자동 등록과 함께 설치되며, 이미 설치된 환경에서는 앱 시작 시 뜨는 업데이트 창에서 **`[확인 (자동 다운로드 · 설치)]`** 버튼만으로 자동 업데이트가 완료됩니다. *(기업용 무인 설치 옵션: `/VERYSILENT /NORESTART`)*

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v2.2.0` (Semantic Versioning 2.0.0 MINOR Release)
- **코어 라이브러리**: `KCert.Core.dll` v2.2.0 / `KCert.Crypto.dll` v2.2.0
- **릴리스 일자**: 2026년 11월 21일

---

## 7. 시스템 요구 사항 (System Requirements)
- **운영체제**: Windows 11 / Windows 10 (64-bit / 32-bit 지원)
- **런타임**: .NET 10.0 또는 .NET 8.0 Desktop Runtime (Self-Contained 패키지는 추가 설치 불필요)
- **디스크 공간**: 약 35 MB 이상의 여유 공간
- **지원 매체**: 내장 SSD/HDD, 이동식 USB 메모리, 외장 SSD, 가상 드라이브

---

## 8. 제작자 및 공식 채널 안내 (Developer & Official Channels)
- **개발자**: AhBiYout
- **GitHub 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr)
- **소속회사**: (주)청운정보시스템 ( cisnet.co.kr )

---

## 9. 전체 업데이트 (Full Update History)
- **[v2.2.0] - 2026-11-21**: 오프라인 X.509 RSA 3072-bit 보안강도 점검(1024/2048/3072-bit 3단계) 및 `보안강도 점검` 진단 탭 신설, 2026 국내 인증 동향(RSA 3072-bit 전환·GPKI/EPKI 비액티브엑스·2026.08.28 모바일 신분증 8종·금융/간편인증 7대 비교) UI 통합, WPF 시작 무응답 해소 3단계 비차단 시작 스캔(`0단계 Local Fast-Pass ➔ Drive Fast-Pass ➔ Deep-Pass`), 개인 성명 `(기관용)` 오분류·발급기관 우선 매칭·스레드/클립보드/널 안전성 심층 감사(작업 차수 191~193) 완료.
- **[v2.1.1] - 2026-11-16**: `Class1` (`C:\GPKI\Certificate\class1` 등) 개인키 쌍 선별 스캔 · `공무원(GPKI)`/`교육(EPKI)`/`기관` 배지 · 사이드바 `CLASS1` 필터 신설, 복사 완료 폴더 실제 드라이브 루트(`E:\NPKI\...`) 탐색기 타겟팅 보강, 비표준 정위치 복구 후 안전 휴지통 격리, 중복 `skip` 0건 가드, Web/WPF 5차 수명주기·JSON 스키마 안정화.
- **[v2.1.0] - 2026-11-13**: GitHub 이동 없는 인앱 자동 다운로드·무인 셀프 설치 엔진, WPF-Web 다크 테마 통합 & CSS Grid `auto-fill` 반응형 카드 레이아웃, 쉬운 일상 표현 + `더보기` UI 개편, 3차 감사 수정(`C:\` 자가 복사 차단 보강 등).
- **[v2.0.0] - 2026-11-10**: 60fps 무한 유동 애니메이션 테두리 전면 탑재(WPF & Web), `/dist/v2.0.0/` 분리 빌드 파이프라인 확립.
- **[v1.9.0 ~ v1.5.0]**: DPAPI/AES-256 암호화 보호 보관함, `KCert.Core.dll`/`KCert.Crypto.dll` 분리, 보안 삭제 증적 감사, 1-Based 고정 인덱스 열, 시작 마법사 및 SHA-256 검증 배지 구축.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,RSA3072,보안강도점검,모바일신분증,USB복사,인증서백업,K인증서매니저,공동인증서,KCertManager,USBBackup,GPKICopy**
*(태그 수: 15개 / 총 139자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*

---

# Part B. [HTML 편집 모드 (HTML Edit Mode)]

> 아래 HTML 코드를 Blogger 글쓰기 화면 상단 좌측 연필 아이콘 ➔ **HTML 보기**에 그대로 붙여넣으세요.

```html
<!-- K-Certificate Manager (K-인증서 매니저) v2.2.0 - Blogger HTML Edit Mode -->
<h1 style="color: #0f172a; font-size: 24px; font-weight: bold; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
  K-인증서 매니저 v2.2.0 정식 릴리스: 2026 국내 인증 동향·RSA 3072-bit 보안강도 점검, 시작 무응답 해소 3단계 초고속 스캔 및 전수 감사 안정화
</h1>

<div style="font-size: 15px; line-height: 1.75; color: #334155; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 25px;">
  <p style="margin-top: 0;">
    대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(<code>C:\</code>)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 <strong>K-인증서 매니저(K-Certificate Manager) v2.2.0</strong> 정식 버전이 출시되었습니다.
  </p>
  <p style="margin-bottom: 0;">
    이번 <strong>v2.2.0</strong> 정식 마이너(MINOR) 릴리스는 <strong>2027년 2월 15일 시행 예정인 5대 공동인증기관 RSA 3072-bit 보안강도 상향 일정</strong>과 <strong>GPKI·EPKI 비액티브엑스(HTML5) 전환, 2026년 8월 28일 전자정부법 시행령 기반 모바일 신분증 8종 확대, 금융·민간 간편인증 비교 가이드</strong>를 웹 콘솔과 C# WPF 데스크톱 앱 모두에 오프라인 분석 기능으로 전면 탑재했습니다. 또한 앱 시작 직후 멈춤 현상을 원천 해소하는 <strong>3단계 비차단 시작 스캔 파이프라인</strong>과 3차례 심층 전수 감사 수정까지 완료해 한층 쾌적하고 정확한 인증서 관리 경험을 제공합니다.
  </p>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #10b981; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  ✨ 3. 주요 업데이트 (Recent Highlights)
</h2>
<ul style="font-size: 14.5px; line-height: 1.75; color: #475569; padding-left: 20px; margin-bottom: 25px;">
  <li><strong>🔐 오프라인 X.509 RSA 3072-bit 보안강도 점검 &amp; 진단 탭 신설</strong>: 보유 인증서의 공개키 비트 길이(RSA 1024/2048/3072/4096-bit, ECDSA)와 서명 알고리즘을 오프라인 분석해 <code>3072-bit 권장</code> · <code>2048-bit 전환 대상</code> · <code>1024-bit·SHA-1 취약</code> 3단계로 진단하며, 기존 2048-bit 인증서는 만료일까지 정상 사용 가능하도록 정밀 안내합니다. <code>진단 및 복구</code> 창 <strong>보안강도 점검 (3072-bit)</strong> 탭 및 원클릭 리포트 복사를 지원합니다.</li>
  <li><strong>📰 2026 국내 인증서 법령 동향 &amp; 7대 인증 체계 한눈에 비교</strong>: <code>[보안 수칙·동향]</code> 창(<code>SecurityGuideModal</code> / <code>SecurityGuideDialog</code>)에 <strong>2026 보안강도·법령 동향</strong>(RSA 3072-bit, GPKI·EPKI 비액티브엑스, 2026.08.28 모바일 신분증 8종)과 <strong>국내 인증서 전체 비교</strong>(로컬 파일 vs 클라우드/모바일) 탭을 탑재하고 기관별 갱신 안내를 현행화했습니다.</li>
  <li><strong>⚡ WPF 앱 시작 직후 <code>응답없음</code> 원천 해소 — 3단계 비차단 시작 스캔</strong>: <code>0단계 Local Fast-Pass</code> ➔ <code>1단계 Drive Fast-Pass</code> ➔ <code>2단계 Deep-Pass</code> 분리 스캔, OS <code>DriveType</code> 기반 네트워크·광학 드라이브 차단, 병렬 바운디드 드라이브 준비 검사(<code>IsDriveReadyBounded</code>) 및 단일 <code>DrivesChanged</code> 디바운스로 초기 멈춤 현상을 완벽히 해결했습니다.</li>
  <li><strong>🛡️ 개인 성명 오분류 교정 · 발급기관 우선 매칭 &amp; 심층 전수 감사(작업 차수 191~193)</strong>:
    <ul>
      <li><code>김지원</code>·<code>이정원</code>·<code>김진실</code> 등 일반 개인 성명이 <code>(기관용)</code>으로 오분류되던 파서 결함을 문맥 기반으로 교정하고, <code>CertIntegrityDoctor</code> 동적 키 파일명 보고 및 GPKI/EPKI <code>cn=</code> 표준 경로 정밀화를 적용했습니다.</li>
      <li><code>RenewalGuidanceDialog</code> · <code>renewalStore</code> 발급기관(Issuer) 우선 매칭으로 NPKI 인증서 오분류를 차단하고, WPF <code>DispatchSafeAsync</code> · <code>SafeGetFullPath</code> · <code>SearchLocationsDialog</code> Fast-Pass 유지와 Web 비동기 클립보드 예외 처리·새로고침 시퀀스·<code>targetDrive</code> 널 가드 및 고객센터 번호 정합성을 완비했습니다.</li>
    </ul>
  </li>
  <li><strong>🚀 인앱 자동 다운로드·무인 셀프 설치 &amp; <code>Class1</code> 기관 필터 계승 (<code>v2.1.x</code>)</strong>: 업데이트 창 <code>[확인 (자동 다운로드 · 설치)]</code> 원스톱 업데이트, 통합 다크 테마(<code>#0F1219</code>), CSS Grid <code>auto-fill</code> 카드 레이아웃, <code>Class1</code> 기관 배지·필터, DPAPI/AES-256 암호화 보호 보관함, 60fps 유동 네온 테두리를 제공합니다.</li>
</ul>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #3b82f6; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  📷 4. 앱 화면 안내 (App Visual)
</h2>
<div style="text-align: center; margin-top: 15px; margin-bottom: 25px; background: #0f1219; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; padding: 25px;">
  <div style="font-size: 32px; margin-bottom: 10px;">🔐 ⚡ 🛡️</div>
  <div style="font-size: 16px; font-weight: bold; color: #38bdf8;">K-인증서 매니저 v2.2.0 — 3단계 초고속 스캔 &amp; RSA 3072-bit 보안강도 점검</div>
  <p style="font-size: 13px; color: #94a3b8; margin-top: 8px; margin-bottom: 0;">
    0단계 Local Fast-Pass 즉시 로딩 · RSA 3072-bit 보안등급 배지 · 2026 법령 동향 &amp; 7대 인증 체계 비교 · 인앱 셀프 업데이트
  </p>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #f59e0b; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  📦 5. 다운로드 및 설치 안내 (Download)
</h2>
<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-bottom: 25px;">
  <p style="margin-top: 0; font-size: 14.5px;">
    <strong>공식 깃허브 최신 릴리스 다운로드:</strong><br />
    👉 <a href="https://github.com/AhBiYout-all/K-Certificate-Manager" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: bold; text-decoration: underline;">https://github.com/AhBiYout-all/K-Certificate-Manager</a>
  </p>
  <p style="font-size: 14.5px;">
    <strong>공식 구글 블로그 안내:</strong><br />
    👉 <a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: bold; text-decoration: underline;">https://ahbiyoutvibe.blogspot.com/</a>
  </p>
  <p style="margin-bottom: 0; font-size: 14.5px;">
    <strong>설치 및 자동 업데이트 안내:</strong> <code>kcert-manager-v2.2.0-setup.exe</code> 실행 시 바탕화면 바로가기 생성 및 방화벽 자동 등록과 함께 설치가 완료되며, 기존 설치 사용자는 앱 시작 시 뜨는 업데이트 창에서 <strong><code>[확인 (자동 다운로드 · 설치)]</code></strong> 버튼만으로 자동 업데이트가 완료됩니다.<br />
    <em>(기업용 무인 자동 설치 옵션: <code>/VERYSILENT /NORESTART</code>)</em>
  </p>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #8b5cf6; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  📌 6. 버전 정보 (Version Info)
</h2>
<table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 25px; background: #ffffff; border: 1px solid #cbd5e1;">
  <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
    <th style="padding: 10px; text-align: left; width: 30%;">항목</th>
    <th style="padding: 10px; text-align: left;">세부 정보</th>
  </tr>
  <tr style="border-bottom: 1px solid #e2e8f0;">
    <td style="padding: 10px; font-weight: bold;">애플리케이션 버전</td>
    <td style="padding: 10px; color: #2563eb; font-weight: bold;">v2.2.0 (Semantic Versioning 2.0.0 MINOR)</td>
  </tr>
  <tr style="border-bottom: 1px solid #e2e8f0;">
    <td style="padding: 10px; font-weight: bold;">독립 코어 DLL</td>
    <td style="padding: 10px;"><code>KCert.Core.dll</code> v2.2.0 / <code>KCert.Crypto.dll</code> v2.2.0</td>
  </tr>
  <tr>
    <td style="padding: 10px; font-weight: bold;">릴리스 일자</td>
    <td style="padding: 10px;">2026년 11월 21일</td>
  </tr>
</table>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #64748b; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  🖥️ 7. 시스템 요구 사항 (System Requirements)
</h2>
<ul style="font-size: 14px; line-height: 1.7; color: #475569; padding-left: 20px; margin-bottom: 25px;">
  <li><strong>운영체제</strong>: Windows 11 / Windows 10 (64-bit / 32-bit 지원)</li>
  <li><strong>런타임 Framework</strong>: .NET 10.0 또는 .NET 8.0 Desktop Runtime (Self-Contained 패키지는 개별 설치 불필요)</li>
  <li><strong>디스크 용량</strong>: 여유 공간 35 MB 이상</li>
  <li><strong>지원 디바이스</strong>: 내장 SSD/HDD, 이동식 USB 메모리, 외장 SSD, 가상 드라이브</li>
</ul>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #06b6d4; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  🏢 8. 제작자 및 공식 채널 안내 (Developer &amp; Official Channels)
</h2>
<div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 15px; font-size: 14px; line-height: 1.8; margin-bottom: 25px;">
  <div><strong>개발자</strong>: AhBiYout</div>
  <div><strong>GitHub 저장소</strong>: <a href="https://github.com/AhBiYout-all/K-Certificate-Manager" target="_blank" rel="noopener noreferrer" style="color: #0284c7;">https://github.com/AhBiYout-all/K-Certificate-Manager</a></div>
  <div><strong>공식 구글 블로그</strong>: <a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" rel="noopener noreferrer" style="color: #0284c7;">https://ahbiyoutvibe.blogspot.com/</a></div>
  <div><strong>소속</strong>: <a href="https://www.cisnet.co.kr" target="_blank" rel="noopener noreferrer" style="color: #0284c7;">https://www.cisnet.co.kr</a></div>
  <div><strong>소속회사</strong>: (주)청운정보시스템 ( cisnet.co.kr )</div>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #ec4899; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  📜 9. 전체 업데이트 이력 (Full Update History)
</h2>
<div style="font-size: 13.5px; line-height: 1.7; color: #475569; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
  <p style="margin-top: 0; font-weight: bold; color: #0f172a;">[v2.2.0] - 2026-11-21</p>
  <ul>
    <li>오프라인 X.509 RSA 3072-bit 보안강도 점검(1024/2048/3072-bit 3단계) 및 <code>보안강도 점검 (3072-bit)</code> 진단 탭 신설(Web &amp; WPF).</li>
    <li>2026 국내 인증 동향(2027.02.15 RSA 3072-bit 전환 · GPKI/EPKI 비액티브엑스 · 2026.08.28 모바일 신분증 8종 · 7대 인증 체계 비교) 가이드 및 갱신 안내 통합.</li>
    <li>WPF 시작 무응답 해소 3단계 비차단 시작 스캔(<code>0단계 Local Fast-Pass ➔ Drive Fast-Pass ➔ Deep-Pass</code>) · OS <code>DriveType</code> 필터 · 바운디드 드라이브 준비 검사(<code>IsDriveReadyBounded</code>) 적용.</li>
    <li>전수 감사 안정화(작업 차수 191~193): 개인 성명 <code>(기관용)</code> 오분류 교정, <code>CertIntegrityDoctor</code> 동적 키 파일명 &amp; <code>cn=</code> 표준 경로 정밀화, 발급기관(Issuer) 우선 갱신 매칭, WPF <code>DispatchSafeAsync</code>/<code>SafeGetFullPath</code> 및 Web 비동기 클립보드·시퀀스·널 가드 완비.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a;">[v2.1.1] - 2026-11-16</p>
  <ul>
    <li><code>Class1</code> 기관·특수목적 인증서 개인키 쌍 선별 스캔, <code>공무원(GPKI)</code>/<code>교육(EPKI)</code>/<code>기관</code> 구분 배지 및 사이드바 <code>CLASS1</code> 필터·키워드 검색 신설.</li>
    <li>복사 완료 폴더 실제 드라이브 루트(<code>E:\NPKI\...</code>) 탐색기 타겟팅 보강, 비표준 경로 정위치 복구·안전 휴지통 격리 및 5차 수명주기·JSON 스키마 안정화.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a;">[v2.1.0] - 2026-11-13</p>
  <ul>
    <li>GitHub 이동 없는 앱 내 자동 다운로드 · 무인 셀프 설치 엔진 탑재, WPF-Web 다크 테마 통합 &amp; CSS Grid <code>auto-fill</code> 카드 레이아웃, 쉬운 일상 표현 + <code>더보기</code> UI 개편.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a;">[v2.0.0] - 2026-11-10</p>
  <ul>
    <li>60fps 무한 유동 애니메이션 테두리(Animated Moving Border Glow) 전면 탑재 및 <code>/dist/v2.0.0/</code> 분리 빌드 파이프라인 확립.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a; margin-bottom: 0;">[v1.9.0 ~ v1.5.0]</p>
  <ul style="margin-bottom: 0;">
    <li>DPAPI/AES-256 암호화 보호 보관함, <code>KCert.Core.dll</code>/<code>KCert.Crypto.dll</code> 분리, 보안 삭제 증적 감사, 1-Based 고정 인덱스 열, 시작 마법사 및 SHA-256 검증 배지 구축.</li>
  </ul>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #f43f5e; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  🏷️ 10. 추천 태그 (Recommended Tags)
</h2>
<div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; font-size: 13px; color: #9f1239; font-weight: bold; margin-bottom: 10px;">
  공인인증서,공무원인증서,GPKI,EPKI,NPKI,RSA3072,보안강도점검,모바일신분증,USB복사,인증서백업,K인증서매니저,공동인증서,KCertManager,USBBackup,GPKICopy
</div>
<div style="font-size: 12px; color: #94a3b8;">
  *(태그 수: 15개 / 총 139자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*
</div>
```
