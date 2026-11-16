# 📢 K-인증서 매니저 v2.1.1 구글 블로그 배포 통합 문서
> 구글 블로거(Blogger) 게시 시 아래의 **`[작성 모드 (서식 있는 텍스트)]`** 또는 **`[HTML 편집 모드]`** 중 원하는 모드를 선택해 그대로 복사·붙여넣기 하세요.

---

# Part A. [작성 모드 (서식 있는 텍스트 / Compose Mode)]

## 1. 제목 (Title)
**K-인증서 매니저 v2.1.1 정식 릴리스: 복사 폴더 드라이브 루트 타겟팅, 비표준 정위치 복구·휴지통 격리, 중복 건너뛰기 안내 및 전수 감사 안정화**

---

## 2. 본문 (Body)
대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(`C:\`)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v2.1.1** 정식 버전이 출시되었습니다.

이번 `v2.1.1` 패치 릴리스는 `v2.1.0`의 **인앱 자동 다운로드·무인 셀프 설치, WPF-Web 다크 테마 통합, CSS Grid `auto-fill` 반응형 카드 목록, 쉬운 일상 표현 UI**를 기반으로, 실제 사용 환경에서 발생할 수 있는 경로·중복·복구 워크플로우의 세밀한 오류를 전면 보완했습니다. 특히 **'복사된 폴더 열기' 시 실제 드라이브 루트(`E:\NPKI\...`) 정밀 연결**, **비표준 위치 인증서의 정위치 복구 후 원본 즉시 안전 휴지통 격리·로그·토스트 연동**, **중복 건너뛰기(`skip`) `0건` 전용 안내**, **PC 표준 경로 우선 중복 판정**까지 한층 단단해진 신뢰성을 제공합니다.

---

## 3. 업데이트 (Recent Updates)
- 📁 **복사 완료 폴더 실제 드라이브 루트(`E:\NPKI\...`) 탐색기 타겟팅 보강 (`OperationCompleteModal`, `BackupModal`, `OperationCompleteDialog`)**:
  - `'복사된 폴더 열기'` 클릭 시 드라이브 문자 뒤 누락 백슬래시(`\`)와 하위 경로 조합을 정규화해 실제 대상 드라이브 루트를 정확히 열어주며, Web 환경에서도 안전 브리지·폴더 피커·클립보드 폴백을 지원합니다.
- 🧹 **비표준 경로 정위치 복구 마법사·안전 휴지통 격리 워크플로우 완성 (`handleRepairFolders`, `DiagnosticsRepairDialog`, `CertIntegrityDoctor`)**:
  - 중첩 폴더나 비표준 경로 인증서를 표준 위치로 복사한 직후 중복 ID를 정리해 원본을 안전 휴지통(`SafetyTrash`)으로 즉시 격리하고 활동 로그(`RESTORE`/`DELETE`)·성공 토스트를 기록하며, 동일 경로 자기덮어쓰기 `IOException`을 사전 차단합니다.
- 🛡️ **중복 건너뛰기(`skip`) 0건 가드 및 Web/WPF 전수 감사 경로·무결성 교정**:
  - **Web**: `skip` 옵션으로 실제 복사 `0`건일 때 허위 `"0건 완료"` 대신 `중복 건너뛰기 완료` 화면과 `INFO` 로그·토스트만 표시; `USB:\NPKI|GPKI\Certificate|EPKI\Certificate` 표준 경로 및 TradeSign 법인(`NPKI_CORP`) 분류·`class1` 계층·외장 SSD/고속 USB 필터 통일.
  - **WPF**: `SafetyTrashManager` 읽기 전용(`ReadOnly`) 속성 재귀 해제, `KCertAntiDuplicationEngine` PC 표준 원본 우선 선정 및 폴백 그룹핑, `FastScanPipeline` 말단 `\MPKI` GPKI 인식 보강.
- 🚀 **인앱 자동 다운로드·무인 셀프 설치 & WPF-Web 다크 테마·반응형 카드 UI (`v2.1.0` 기반 계승)**:
  - GitHub 웹사이트 이동 없이 업데이트 창 `[확인 (자동 다운로드 · 설치)]` 클릭만으로 다운로드·검증(`MZ`/SHA-256)·무인 설치·재실행까지 원스톱 처리하며, 통합 다크 테마(`#0F1219`), CSS Grid `auto-fill` 카드 레이아웃, 쉬운 일상 표현 + `더보기` UI, DPAPI/AES-256 암호화 보호 보관함, 60fps 유동 네온 테두리를 제공합니다.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v2.1.1 통합 다크 인터페이스 & 인앱 자동 업데이트]
- 상단 툴바: 🔊 볼륨 슬라이더 | ⚙️ 환경 설정 | 💾 PC ➔ USB | 📥 USB ➔ PC | ✨ 업데이트 확인
- 업데이트 창: [확인 (자동 다운로드 · 설치)] ➔ 다운로드 진행률 ➔ 무결성 검증 ➔ 무인 셀프 설치·재실행
- 중앙 목록(Web/WPF): 반응형 CSS Grid(auto-fill) 인증서 카드 뷰 ↔ 고정 인덱스 표 보기(1-Based)
- 작업 완료·복구: 📁 실제 드라이브 루트(E:\NPKI\...) 폴더 열기 · 비표준 정위치 복구 후 안전 휴지통 격리
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- 💾 **공식 구글 블로그 다운로드 안내**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 및 자동 업데이트 안내**: `kcert-manager-v2.1.1-setup.exe` 파일을 실행하면 바탕화면 바로가기 생성 및 Windows 방화벽 규칙 자동 등록과 함께 설치되며, 이미 설치된 환경에서는 앱 시작 시 뜨는 업데이트 창에서 **`[확인 (자동 다운로드 · 설치)]`** 버튼만으로 자동 업데이트가 완료됩니다. *(기업용 무인 설치 옵션: `/VERYSILENT /NORESTART`)*

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v2.1.1` (Semantic Versioning 2.0.0 PATCH Release)
- **코어 라이브러리**: `KCert.Core.dll` v2.1.1 / `KCert.Crypto.dll` v2.1.1
- **릴리스 일자**: 2026년 11월 16일

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
- **[v2.1.1] - 2026-11-16**: 복사 완료 폴더 실제 드라이브 루트(`E:\NPKI\...`) 탐색기 타겟팅 보강, 비표준 정위치 복구 후 안전 휴지통 격리 및 활동 로그·토스트 연동, 중복 `skip` 0건 가드, `USB:\` 표준 경로·`certParser` 정규화·TradeSign `NPKI_CORP` 추가 및 WPF `SafetyTrashManager`/`KCertAntiDuplicationEngine`/`CertIntegrityDoctor`/`FastScanPipeline` 안정화.
- **[v2.1.0] - 2026-11-13**: GitHub 이동 없는 인앱 자동 다운로드·무인 셀프 설치 엔진, WPF-Web 다크 테마 통합 & CSS Grid `auto-fill` 반응형 카드 레이아웃, 쉬운 일상 표현 + `더보기` UI 개편, 3차 감사 수정(`C:\` 자가 복사 차단 보강 등).
- **[v2.0.0] - 2026-11-10**: 60fps 무한 유동 애니메이션 테두리 전면 탑재(WPF & Web), `/dist/v2.0.0/` 분리 빌드 파이프라인 확립.
- **[v1.9.0] - 2026-11-06**: DPAPI/AES-256 암호화 보호 보관함, 제한된 USB 복구, 984px 만료 정리창, Inno Setup 무인 설치 최적화.
- **[v1.8.0 ~ v1.5.0]**: `KCert.Core.dll`/`KCert.Crypto.dll` 분리, 4대 테마 고대비 툴팁, 볼륨 슬라이더 & 환경 설정, 보안 삭제 증적 감사, 1-Based 고정 인덱스 열, 시작 마법사 및 SHA-256 검증 배지 구축.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,USB복사,인증서백업,K인증서매니저,인증서이동,공동인증서,KCertManager,CertificateManager,USBBackup,GPKICopy,NPKICopy**
*(태그 수: 15개 / 총 138자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*

---

# Part B. [HTML 편집 모드 (HTML Edit Mode)]

> 아래 HTML 코드를 Blogger 글쓰기 화면 상단 좌측 연필 아이콘 ➔ **HTML 보기**에 그대로 붙여넣으세요.

```html
<!-- K-Certificate Manager (K-인증서 매니저) v2.1.1 - Blogger HTML Edit Mode -->
<h1 style="color: #0f172a; font-size: 24px; font-weight: bold; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
  K-인증서 매니저 v2.1.1 정식 릴리스: 복사 폴더 드라이브 루트 타겟팅, 비표준 정위치 복구·휴지통 격리, 중복 건너뛰기 안내 및 전수 감사 안정화
</h1>

<div style="font-size: 15px; line-height: 1.75; color: #334155; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 25px;">
  <p style="margin-top: 0;">
    대한민국 공무원 인증서(GPKI), 교육기관 인증서(EPKI), 국방부 인증서(MPKI) 및 은행·공동 인증서(NPKI)를 내 컴퓨터(<code>C:\</code>)와 이동식 USB 메모리 간에 안전하게 복사·백업·이동할 수 있는 통합 인증서 관리 프로그램 <strong>K-인증서 매니저(K-Certificate Manager) v2.1.1</strong> 정식 버전이 출시되었습니다.
  </p>
  <p style="margin-bottom: 0;">
    이번 <strong>v2.1.1</strong> 패치 릴리스는 <code>v2.1.0</code>의 <strong>인앱 자동 다운로드·무인 셀프 설치, WPF-Web 다크 테마 통합, CSS Grid <code>auto-fill</code> 반응형 카드 목록, 쉬운 일상 표현 UI</strong>를 기반으로, 실제 사용 환경에서 발생할 수 있는 경로·중복·복구 워크플로우의 세밀한 오류를 전면 보완했습니다. 특히 <strong>'복사된 폴더 열기' 시 실제 드라이브 루트(<code>E:\NPKI\...</code>) 정밀 연결</strong>, <strong>비표준 위치 인증서의 정위치 복구 후 원본 즉시 안전 휴지통 격리·로그·토스트 연동</strong>, <strong>중복 건너뛰기(<code>skip</code>) 0건 전용 안내</strong>, <strong>PC 표준 경로 우선 중복 판정</strong>까지 한층 단단해진 신뢰성을 제공합니다.
  </p>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #10b981; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  ✨ 3. 주요 업데이트 (Recent Highlights)
</h2>
<ul style="font-size: 14.5px; line-height: 1.75; color: #475569; padding-left: 20px; margin-bottom: 25px;">
  <li><strong>📁 복사 완료 폴더 실제 드라이브 루트(<code>E:\NPKI\...</code>) 탐색기 타겟팅 보강</strong>: <code>OperationCompleteModal</code> · <code>BackupModal</code> · <code>OperationCompleteDialog</code>에서 <code>'복사된 폴더 열기'</code> 클릭 시 드라이브 문자 뒤 누락 백슬래시(<code>\</code>)와 하위 경로 조합을 정규화해 실제 드라이브 루트를 정확히 열어주며, Web 환경에서도 안전 브리지·폴더 피커·클립보드 폴백을 지원합니다.</li>
  <li><strong>🧹 비표준 경로 정위치 복구 마법사·안전 휴지통 격리 워크플로우 완성</strong>: <code>handleRepairFolders</code> · <code>DiagnosticsRepairDialog</code> · <code>CertIntegrityDoctor</code>에서 표준 경로 복사 완료 후 중복 ID를 정리해 원본을 안전 휴지통(<code>SafetyTrash</code>)으로 즉시 격리하고 활동 로그(<code>RESTORE</code>/<code>DELETE</code>)·성공 토스트를 기록하며, 동일 경로 자기덮어쓰기 <code>IOException</code>을 사전 차단합니다.</li>
  <li><strong>🛡️ 중복 건너뛰기(<code>skip</code>) 0건 가드 및 Web/WPF 전수 감사 경로·무결성 교정</strong>:
    <ul>
      <li><strong>Web 관리 콘솔</strong>: <code>skip</code> 옵션으로 실제 복사 <code>0</code>건일 때 허위 <code>"0건 완료"</code> 대신 <code>중복 건너뛰기 완료</code> 화면과 <code>INFO</code> 로그·토스트만 표시; <code>USB:\NPKI|GPKI\Certificate|EPKI\Certificate</code> 표준 경로 및 TradeSign 법인(<code>NPKI_CORP</code>) 분류·<code>class1</code> 계층·외장 SSD/고속 USB 필터 통일.</li>
      <li><strong>C# WPF 데스크톱</strong>: <code>SafetyTrashManager</code> 읽기 전용(<code>ReadOnly</code>) 속성 재귀 해제, <code>KCertAntiDuplicationEngine</code> PC 표준 원본 우선 선정 및 폴백 그룹핑, <code>FastScanPipeline</code> 말단 <code>\MPKI</code> GPKI 인식 보강.</li>
    </ul>
  </li>
  <li><strong>🚀 인앱 자동 다운로드·무인 셀프 설치 &amp; WPF-Web 다크 테마·반응형 카드 UI (<code>v2.1.0</code> 계승)</strong>: 업데이트 창 <code>[확인 (자동 다운로드 · 설치)]</code> 원스톱 셀프 업데이트, 통합 다크 테마(<code>#0F1219</code>), CSS Grid <code>auto-fill</code> 카드 레이아웃, 쉬운 일상 표현 + <code>더보기</code> UI, DPAPI/AES-256 암호화 보호 보관함, 60fps 유동 네온 테두리를 제공합니다.</li>
</ul>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #3b82f6; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  📷 4. 앱 화면 안내 (App Visual)
</h2>
<div style="text-align: center; margin-top: 15px; margin-bottom: 25px; background: #0f1219; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; padding: 25px;">
  <div style="font-size: 32px; margin-bottom: 10px;">💻 🔄 🛡️</div>
  <div style="font-size: 16px; font-weight: bold; color: #38bdf8;">K-인증서 매니저 v2.1.1 통합 다크 인터페이스 &amp; 인앱 자동 업데이트</div>
  <p style="font-size: 13px; color: #94a3b8; margin-top: 8px; margin-bottom: 0;">
    실제 드라이브 루트(E:\NPKI\...) 폴더 열기 · 비표준 정위치 복구·휴지통 격리 · 중복 건너뛰기 0건 안내 · 인앱 셀프 업데이트
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
    <strong>설치 및 자동 업데이트 안내:</strong> <code>kcert-manager-v2.1.1-setup.exe</code> 실행 시 바탕화면 바로가기 생성 및 방화벽 자동 등록과 함께 설치가 완료되며, 기존 설치 사용자는 앱 시작 시 뜨는 업데이트 창에서 <strong><code>[확인 (자동 다운로드 · 설치)]</code></strong> 버튼만으로 자동 업데이트가 완료됩니다.<br />
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
    <td style="padding: 10px; color: #2563eb; font-weight: bold;">v2.1.1 (Semantic Versioning 2.0.0 PATCH)</td>
  </tr>
  <tr style="border-bottom: 1px solid #e2e8f0;">
    <td style="padding: 10px; font-weight: bold;">독립 코어 DLL</td>
    <td style="padding: 10px;"><code>KCert.Core.dll</code> v2.1.1 / <code>KCert.Crypto.dll</code> v2.1.1</td>
  </tr>
  <tr>
    <td style="padding: 10px; font-weight: bold;">릴리스 일자</td>
    <td style="padding: 10px;">2026년 11월 16일</td>
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
  <p style="margin-top: 0; font-weight: bold; color: #0f172a;">[v2.1.1] - 2026-11-16</p>
  <ul>
    <li>복사 완료 폴더 실제 드라이브 루트(<code>E:\NPKI\...</code>) 탐색기 타겟팅 보강(<code>OperationCompleteModal</code> / <code>OperationCompleteDialog</code>).</li>
    <li>비표준 경로 정위치 복구 마법사·안전 휴지통 격리 및 활동 로그·토스트 연동 완성, 동일 경로 자기덮어쓰기 <code>IOException</code> 방지 가드 적용.</li>
    <li>Web 중복 <code>skip</code> 0건 가드, <code>USB:\</code> 표준 경로·<code>certParser</code> 폴더 정규화·TradeSign <code>NPKI_CORP</code> 분류 추가 및 WPF <code>SafetyTrashManager</code> 읽기 전용 해제·<code>KCertAntiDuplicationEngine</code> PC 원본 우선 정렬·<code>FastScanPipeline</code> <code>\MPKI</code> 인식 보강.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a;">[v2.1.0] - 2026-11-13</p>
  <ul>
    <li>GitHub 이동 없는 인앱 자동 다운로드·무인 셀프 설치 엔진 탑재, WPF-Web 다크 테마 통합 &amp; CSS Grid <code>auto-fill</code> 반응형 카드 레이아웃, 쉬운 일상 표현 + <code>더보기</code> UI 개편, 3차 감사 수정(<code>C:\</code> 자가 복사 차단 보강 등).</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a;">[v2.0.0] - 2026-11-10</p>
  <ul>
    <li>60fps 무한 유동 애니메이션 테두리 전면 탑재(WPF &amp; Web), <code>/dist/v2.0.0/</code> 분리 빌드 파이프라인 확립.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a;">[v1.9.0] - 2026-11-06</p>
  <ul>
    <li>DPAPI/AES-256 암호화 보호 보관함, 제한된 USB 복구(<code>💾 USB로 제한 복구</code>), 984px 만료 정리창, Inno Setup 무인 설치 최적화.</li>
  </ul>
  <p style="font-weight: bold; color: #0f172a; margin-bottom: 0;">[v1.8.0 ~ v1.5.0]</p>
  <ul style="margin-bottom: 0;">
    <li><code>KCert.Core.dll</code>/<code>KCert.Crypto.dll</code> 분리, 4대 테마 고대비 툴팁, 볼륨 슬라이더 &amp; 환경 설정, 보안 삭제 증적 감사, 1-Based 고정 인덱스 열, 시작 마법사 및 SHA-256 검증 배지 구축.</li>
  </ul>
</div>

<h2 style="color: #1e293b; font-size: 18px; font-weight: bold; border-left: 4px solid #f43f5e; padding-left: 10px; margin-top: 25px; margin-bottom: 12px;">
  🏷️ 10. 추천 태그 (Recommended Tags)
</h2>
<div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; font-size: 13px; color: #9f1239; font-weight: bold; margin-bottom: 10px;">
  공인인증서,공무원인증서,GPKI,EPKI,NPKI,USB복사,인증서백업,K인증서매니저,인증서이동,공동인증서,KCertManager,CertificateManager,USBBackup,GPKICopy,NPKICopy
</div>
<div style="font-size: 12px; color: #94a3b8;">
  *(태그 수: 15개 / 총 138자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*
</div>
```
