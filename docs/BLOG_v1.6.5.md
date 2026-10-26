# 🛡️ K-Certificate Manager Google Blog Release Post (v1.6.5)

본 문서는 **K-인증서 매니저 (K-Certificate Manager)** v1.6.5 공식 구글 블로그(Blogger) 게시용 전용 문서입니다.
블로그 작성 시 사용 환경에 맞춰 **[작성 모드 (서식 있는 텍스트)]** 또는 **[HTML 편집 모드]** 중 원하는 형식을 그대로 복사하여 사용할 수 있도록 구성되었습니다.

---

# 📑 [작성 모드 (서식 있는 텍스트 - Compose Mode)]

구글 블로그 글쓰기 화면에서 **[작성 모드]**일 때 아래 내용을 그대로 복사하여 붙여넣으시면 됩니다.

---

### 1. 제목
**[K-인증서 매니저] v1.6.5 정식 출시! GPKI/EPKI/NPKI 인증서 안전 복사·백업 솔루션 (최좌측 1번 인덱스 일원화·고정열·작업완료 안내창·에러 알림)**

---

### 2. 본문
안녕하세요! 대한민국 공무원·교직원 행정전자서명 인증서(**GPKI / EPKI**)와 금융 공동인증서(**NPKI**)를 가장 안전하고 간편하게 탐색하고 백업할 수 있는 올인원 솔루션, **K-인증서 매니저 (K-Certificate Manager) v1.6.5** 버전이 정식 출시되었습니다.

인증서 복사를 위해 복잡한 `AppData\LocalLow` 숨김 폴더나 시스템 경로를 일일이 헤맬 필요가 없습니다. **K-인증서 매니저**는 원클릭으로 PC와 USB 간의 양방향 복사, SHA-256 무결성 검증, 만료일 알림, 다크/화이트/회색/베이지 4대 테마를 제공합니다.

이번 v1.6.5 릴리스에서는 **Web과 WPF 데스크톱 모든 테이블의 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화**, **가로 스크롤 시 최좌측 인덱스 열 상시 고정(Frozen & Sticky Column)**, **작업 완료 안내 전용 팝업창(3대 핵심 메트릭 카드 및 경로 시각화)**, **오른쪽 상단 창 제어 버튼 독립 격리 고정**, **USB 쓰기 금지/권한 에러 전용 알림 모달**, **작업 감사 로그 1번 인덱스 열 신설** 등 사용자 편의성과 시각적 완성도를 대폭 강화했습니다.

---

### 3. 업데이트
#### 🚀 v1.6.5 핵심 업데이트 내역
1. **최좌측 1번 인덱스(1, 2, 3...) 시작 일원화 (Web & Desktop WPF)**
   - 웹과 윈도우 데스크톱의 모든 인증서 목록, PC➔USB 복사창, USB➔PC 가져오기창, 만료 인증서 정리창, 휴지통, 백업 이력, 작업 감사 로그 등 전체 뷰의 최좌측 번호가 1번부터 시작(`1, 2, 3...`)하도록 일원화되었습니다.
2. **최좌측 인덱스 열 상시 고정 보장 (Frozen & Sticky Column)**
   - 데스크톱 WPF DataGrid에 `FrozenColumnCount="1"`, 웹 React 테이블에 `sticky left-0 z-10`을 적용하여 가로 스크롤바를 우측으로 끝까지 이동해도 최좌측 1번 인덱스 열이 화면에 고정되어 항상 표시됩니다.
3. **작업 완료 안내 전용 팝업창(모달 대화상자) 신설**
   - 인증서 복사/백업/가져오기 성공 시 에메랄드 성공 배너, SHA-256 100% 무결성 검증 배지, 3대 핵심 메트릭 카드(복사 완료 건수, 데이터 무결성, 완료 시각), 출발지➔도착지 경로 시각화 카드 및 실용 후속 조치 가이드를 제공하는 전용 팝업창을 전면 연동했습니다.
4. **오른쪽 상단 창 제어 버튼(최소/최대/닫기) 독립 격리 고정**
   - 창 크기를 최소 규격이나 저해상도로 축소하더라도 최소화(`─`), 최대화/복원(`□`), 닫기(`✕`) 버튼이 화면 밖으로 밀리지 않고 최우측 상단에 100% 온전하게 고정 노출되도록 개선했습니다.
5. **드라이브 쓰기 오류 및 권한 문제 전용 에러 알림 모달 (`CopyErrorAlertModal`)**
   - USB 쓰기 금지(Write-Protected), 권한 거부, 디스크 용량 부족 등 실패 원인별 맞춤형 배지, 단계별 해결 체크리스트, 진단 로그 복사 및 원클릭 재시도를 지원합니다.
6. **인증서 보관함 DataGrid 상시 가로 스크롤바 유지 및 픽셀 물리 스크롤 지원**
   - 사이드바 개폐 시 가로 스크롤바가 사라지는 현상을 원천 방지하고 부드러운 픽셀 스크롤을 제공합니다.
7. **PC ➔ USB 복사창 목적지 드라이브 기본 C: 선택 및 콤보박스 상시 활성화**
   - USB 메모리가 없어도 로컬 디스크(C:\)를 기본 선택하여 즉시 백업할 수 있으며, 인증서 목록(DataGrid)을 가림 없이 상시 표시합니다.
8. **작업 감사 로그(Activity Log) 1번 인덱스 열 신설 및 동적 재색인**
   - 감사 로그 창에 최좌측 1번 인덱스 열을 신설하고 신규 로그 추가 시 최신 항목을 1번으로 자동 재색인합니다.
9. **복사 완료 알림음(SuccessChime) 제어 기능**
   - Web Audio API 완료음 ON/OFF 토글, 0~100% 볼륨 조절 슬라이더 및 미리듣기 테스트를 지원합니다.
10. **.NET 10 / .NET 8 자동 감지 및 릴리스 빌드 파이프라인 무결성 확보**
    - `UpdateBackupHistoryIndices` 빌드 오류를 완벽 해소하고 Inno Setup 설치 프로그램(`kcert-manager-v1.6.5-setup.exe`) 배포 무결성을 보장합니다.

---

### 4. 앱 그림
*(블로그 등록 시 아래 설명에 맞춰 캡처 이미지를 본문에 삽입해 주세요)*

> 🖼️ **[K-인증서 매니저 v1.6.5 메인 대시보드 화면]**  
> *(최좌측 1번 고정 인덱스 열, 드라이브별 고유 배지 색상, 4대 테마 드롭다운 및 모던 일체형 타이틀바)*
>
> 🖼️ **[작업 완료 안내 전용 팝업창 (Operation Complete Dialog)]**  
> *(에메랄드 성공 배너, SHA-256 100% 일치 배지, 3대 메트릭 카드, 출발지➔도착지 경로 흐름도 및 실용 가이드)*
>
> 🖼️ **[PC ➔ USB 복사 및 USB ➔ PC 가져오기 전용 대화상자]**  
> *(최좌측 1번 인덱스 열, 중복 인증서 처리 옵션 라디오버튼 그룹, 드라이브 선택 콤보박스)*
>
> 🖼️ **[Inno Setup 공식 정식 설치 프로그램 화면]**  
> *(Windows 방화벽 인바운드 규칙 자동 사전 등록 및 폴더 풀림 Unpacked Multi-File 설치 구조)*

---

### 5. 다운로드
- **윈도우 정식 설치 프로그램 (Official Setup Installer)**:
  - 파일명: `kcert-manager-v1.6.5-setup.exe`
  - 다운로드 링크: [https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.6.5](https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.6.5)
- **GitHub 최신 릴리스 및 소스코드 저장소**:
  - [https://github.com/AhBiYout-all/K-Certificate-Manager/releases](https://github.com/AhBiYout-all/K-Certificate-Manager/releases)

---

### 6. 버전정보
- **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)
- **소프트웨어 버전**: `v1.6.5` (Semantic Versioning 2.0.0)
- **릴리스 일자**: 2026-10-25
- **빌드 상태**: .NET 10.0 / .NET 8.0 Windows x64 Standalone + Vite Production Bundle
- **라이선스**: MIT License (한국어/영어 2종 라이선스 정의 탑재, 개인/기업/공공기관 무료 이용)

---

### 7. 시스템 요구 사항
- **운영체제**: Microsoft Windows 10 / 11 (64-bit x64 / ARM64)
- **프레임워크**: .NET 10.0 또는 .NET 8.0 (독립 실행형 풀버전은 런타임 내장으로 추가 설치 불필요)
- **웹 브라우저**: Microsoft Edge, Google Chrome, Whale 등 최신 웹 브라우저
- **저장 공간**: 여유 디스크 공간 150MB 이상
- **권한**: 일반 사용자 계정 설치 가능 (`PrivilegesRequired=lowest` 지원)

---

### 8. 제작자 및 공식 채널 안내
- **개발자**: AhBiYout
- **GitHub 공식 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 기술 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속 회사**: [(주)씨아이에스넷 (CISNet)](https://www.cisnet.co.kr/)
- **버그 제보 및 기능 제안**: [GitHub Issues](https://github.com/AhBiYout-all/K-Certificate-Manager/issues)

---

### 9. 전체 업데이트(이전 기록 모두, 기능 개선에 대한 내용만 기록)
- **v1.6.5 (2026-10-25)**: 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화(Web/WPF), DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 감사 로그 1번 인덱스 열 신설 및 동적 재색인, C# .NET 10 / .NET 8 빌드 무결성 확보.
- **v1.6.4 (2026-10-25)**: 작업완료 안내 전용 팝업창(Operation Complete Modal/Dialog) 신설, 우측 상단 창 제어 버튼(최소/최대/닫기) 독립 격리 고정, 인증서 목록 행 간 명확한 수평 구분선 및 시각적 간격 고도화, DataGrid 상시 가로바 유지 및 픽셀 물리 스크롤 지원, PC➔USB 복사창 C: 드라이브 기본 선택 및 콤보박스 상시 활성화.
- **v1.6.3 (2026-10-21)**: 상세 사이드바 닫힘 시 목록창 가로 반응형 자동 확장 및 여백 채움, 시작가이드 PC➔USB 복사 전용 대화창(`PcToUsbTransferDialog`) 구축 및 규격 일체화.
- **v1.6.2 (2026-10-20)**: 드라이브 쓰기 오류 및 권한 문제 시 명확한 에러 알림 모달(`CopyErrorAlertModal`) 구축, 단계별 조치 체크리스트 제공.
- **v1.6.1 (2026-10-20)**: 인증서 복사 완료 알림음(SuccessChime) 제어 기능 추가, 0~100% 볼륨 조절 슬라이더 및 미리듣기 지원.
- **v1.5.0 (2026-10-08 / 2026-10-14)**: 시작 작업 선택 창 및 순서별 가이드 모션 오버레이 연동, SHA-256 체크섬 대조 '무결성 확인 완료' 녹색 실드 배지 실시간 토스트 연동, Windows 방화벽 인바운드 규칙 자동 사전 등록, Inno Setup 무인 설치(`/SILENT`) 지원, 기존 버전 삭제/덮어쓰기 분기, Node.js 24 Actions CI/CD 적용, 단일 인스톨러 배포 정제.
- **v1.4.5 (2026-10-06)**: 대상 디스크 지정 팝업창, 동일 경로 자가 복사(Self-Copy) 금지 보호막, 드라이브 문자별 고유 색상 배지, 4대 테마 드롭다운 컴포넌트 전환.
- **v1.4.3 (2026-10-04)**: GitHub Releases 3-Tier 실시간 자동 업데이트 체커 탑재, 다크 테마 시작 시인성 3중 보정.
- **v1.4.0 (2026-10-01)**: C# WPF 데스크톱 네이티브 GUI 앱 탑재, 모던 일체형 타이틀바(`WindowChrome`), 4대 컬러 테마(다크/회색/화이트/베이지) 시스템 구축.
- **v1.3.0 (2026-09-28)**: USB ➔ PC 역방향 가져오기 파이프라인, 지수 백오프 자동 재시도, 실수 삭제 방지 안전 휴지통(`SafetyTrash`) 구현.
- **v1.2.0 (2026-09-24)**: 순수 창작 코어 라이브러리(`KCert.Core.dll`) ASN.1 DER 파서 및 PKCS#8 키 분석기 탑재.
- **v1.0.0 (2026-09-15)**: NPKI, GPKI, EPKI 공인/공동인증서 자동 탐색 및 USB 일괄 백업 웹 관리 콘솔 최초 릴리스.

---

### 10. 추천 태그
공동인증서,GPKI,EPKI,NPKI,인증서복사,인증서백업,USB복사,인증서관리,KCertManager,AhBiYout,CISNet,Certificate,InnoSetup,WPF,DotNet,Security

*(총 16개 태그 / 공백 제외 137자 - 20개 이하 및 200자 이내 준수)*

---
---

# 🌐 [HTML 편집 모드 (HTML Edit Mode)]

구글 블로그 글쓰기 상단의 **[HTML 편집 모드]**를 선택하신 후, 아래의 HTML 코드를 복사하여 그대로 붙여넣으시면 모바일과 데스크톱 모두에서 세련되게 렌더링됩니다.

```html
<!-- K-Certificate Manager v1.6.5 Google Blogger Post Body Start -->
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', Arial, sans-serif; line-height: 1.7; color: #1e293b; max-width: 860px; margin: 0 auto; padding: 10px 0;">

  <!-- 1. 제목 -->
  <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);">
    <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.5px;">OFFICIAL RELEASE v1.6.5</div>
    <h1 style="margin: 0; font-size: 24px; line-height: 1.4; font-weight: 800; color: #ffffff;">[K-인증서 매니저] v1.6.5 정식 출시! GPKI/EPKI/NPKI 인증서 안전 복사·백업 솔루션</h1>
    <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">최좌측 1번 인덱스 일원화 · 고정열(Frozen/Sticky) · 작업완료 전용 안내창 · 쓰기 에러 알림 모달</p>
  </div>

  <!-- 2. 본문 -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #0284c7; padding-left: 10px; margin: 0 0 14px 0; color: #0f172a;">2. 소프트웨어 소개</h2>
    <p style="margin: 0 0 12px 0;">안녕하세요! 대한민국 공무원·교직원 행정전자서명 인증서(<strong>GPKI / EPKI</strong>)와 금융 공동인증서(<strong>NPKI</strong>)를 가장 안전하고 간편하게 탐색하고 백업할 수 있는 올인원 솔루션, <strong>K-인증서 매니저 (K-Certificate Manager) v1.6.5</strong> 버전이 정식 출시되었습니다.</p>
    <p style="margin: 0 0 12px 0;">인증서 복사를 위해 복잡한 <code>AppData\LocalLow</code> 숨김 폴더나 복잡한 시스템 경로를 일일이 찾으실 필요가 없습니다. <strong>K-인증서 매니저</strong>는 원클릭으로 PC와 USB 간의 양방향 복사, SHA-256 무결성 검증, 만료일 알림, 다크/화이트/회색/베이지 4대 테마를 제공합니다.</p>
    <p style="margin: 0;">이번 v1.6.5 릴리스에서는 <strong>Web과 데스크톱(WPF) 모든 테이블의 최좌측 1번 인덱스(1, 2, 3...) 일원화</strong>, <strong>가로 스크롤 시 최좌측 인덱스 열 상시 고정(Frozen & Sticky Column)</strong>, <strong>작업 완료 안내 전용 팝업창</strong>, <strong>오른쪽 상단 창 제어 버튼 독립 격리 고정</strong>, <strong>USB 쓰기 금지/권한 에러 전용 알림 모달</strong> 등 사용자 편의성을 획기적으로 개선했습니다.</p>
  </div>

  <!-- 3. 업데이트 -->
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #10b981; padding-left: 10px; margin: 0 0 16px 0; color: #0f172a;">3. v1.6.5 핵심 업데이트 내용</h2>
    <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14.5px;">
      <li style="margin-bottom: 10px;"><strong>최좌측 1번 인덱스(1, 2, 3...) 시작 일원화 (Web & Desktop WPF)</strong>: 메인 목록, 복사창, 가져오기창, 만료정리, 휴지통, 백업이력, 작업로그 전체의 최좌측 열 번호가 1번부터 시작하도록 일원화.</li>
      <li style="margin-bottom: 10px;"><strong>최좌측 인덱스 열 상시 고정 (Frozen & Sticky Column)</strong>: 데스크톱 WPF DataGrid(<code>FrozenColumnCount="1"</code>) 및 웹 React(<code>sticky left-0 z-10</code>) 적용으로 가로 스크롤 시에도 최좌측 1번 인덱스 열 상시 고정 노출.</li>
      <li style="margin-bottom: 10px;"><strong>작업 완료 안내 전용 팝업창 신설</strong>: 복사/가져오기 성공 시 에메랄드 성공 배너, SHA-256 100% 무결성 검증 배지, 3대 메트릭 카드(완료 건수, 무결성, 완료 시각), 출발지➔도착지 경로 흐름도 및 실용 후속 조치 가이드 제공.</li>
      <li style="margin-bottom: 10px;"><strong>오른쪽 상단 창 제어 버튼(최소/최대/닫기) 독립 격리 고정</strong>: 창 크기를 축소해도 버튼이 밀려나지 않고 최우측 상단에 100% 온전하게 고정 노출.</li>
      <li style="margin-bottom: 10px;"><strong>드라이브 쓰기 오류 및 권한 문제 전용 에러 알림 모달</strong>: USB 쓰기 금지, 권한 거부, 용량 부족 시 원인별 배지 및 해결 체크리스트 제공.</li>
      <li style="margin-bottom: 10px;"><strong>인증서 보관함 DataGrid 상시 가로바 유지 및 픽셀 물리 스크롤 지원</strong>: 사이드바 개폐 시 가로 스크롤바 소멸 방지.</li>
      <li style="margin-bottom: 10px;"><strong>PC ➔ USB 복사창 C: 드라이브 기본 선택 및 콤보박스 상시 활성화</strong>: USB 미연결 시에도 로컬 디스크 즉시 선택 및 DataGrid 상시 노출.</li>
      <li style="margin-bottom: 10px;"><strong>작업 감사 로그(Activity Log) 1번 인덱스 열 신설 및 동적 재색인</strong>: 최신 로그를 1번으로 자동 재색인.</li>
      <li style="margin-bottom: 10px;"><strong>복사 완료 알림음 제어 기능</strong>: 하모닉 사운드 ON/OFF, 0~100% 볼륨 조절 및 미리듣기 지원.</li>
      <li style="margin-bottom: 0;"><strong>.NET 10 / .NET 8 자동 감지 및 릴리스 빌드 파이프라인 무결성 확보</strong>: Inno Setup 설치 프로그램 빌드 무결성 보장.</li>
    </ul>
  </div>

  <!-- 4. 앱 그림 -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #6366f1; padding-left: 10px; margin: 0 0 16px 0; color: #0f172a;">4. 앱 주요 화면 (스크린샷 안내)</h2>
    <div style="display: grid; grid-template-columns: 1fr; gap: 14px;">
      <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; background: #f8fafc; text-align: center;">
        <span style="font-size: 18px;">🖼️</span>
        <div style="font-weight: bold; margin-top: 4px; color: #1e293b;">[K-인증서 매니저 v1.6.5 메인 대시보드 화면]</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">최좌측 1번 고정 인덱스 열, 드라이브별 고유 배지 색상, 4대 테마 드롭다운 및 모던 일체형 타이틀바</div>
      </div>
      <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; background: #f8fafc; text-align: center;">
        <span style="font-size: 18px;">🖼️</span>
        <div style="font-weight: bold; margin-top: 4px; color: #1e293b;">[작업 완료 안내 전용 팝업창 (Operation Complete Dialog)]</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">에메랄드 성공 배너, SHA-256 100% 일치 배지, 3대 메트릭 카드, 출발지➔도착지 경로 흐름도</div>
      </div>
      <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; background: #f8fafc; text-align: center;">
        <span style="font-size: 18px;">🖼️</span>
        <div style="font-weight: bold; margin-top: 4px; color: #1e293b;">[PC ➔ USB 복사 및 USB ➔ PC 가져오기 전용 대화상자]</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">최좌측 1번 인덱스 열, 중복 인증서 처리 옵션 라디오버튼 그룹, 드라이브 선택 콤보박스</div>
      </div>
    </div>
  </div>

  <!-- 5. 다운로드 -->
  <div style="background: linear-gradient(to right, #ecfdf5, #f0fdf4); border: 1px solid #a7f3d0; border-radius: 10px; padding: 22px 24px; margin-bottom: 24px; text-align: center;">
    <h2 style="font-size: 19px; margin: 0 0 10px 0; color: #065f46;">5. 프로그램 다운로드 (Download)</h2>
    <p style="margin: 0 0 16px 0; font-size: 14.5px; color: #047857;">윈도우 정식 설치 프로그램을 통해 누구나 무료로 안전하게 이용하실 수 있습니다.</p>
    <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/releases/tag/v1.6.5" target="_blank" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);">
      📥 kcert-manager-v1.6.5-setup.exe 다운로드 (GitHub)
    </a>
    <div style="margin-top: 12px; font-size: 13px; color: #065f46;">
      공식 저장소: <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/releases" target="_blank" style="color: #047857; font-weight: bold; text-decoration: underline;">GitHub Releases 목록 바로가기</a>
    </div>
  </div>

  <!-- 6. 버전정보 -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #3b82f6; padding-left: 10px; margin: 0 0 14px 0; color: #0f172a;">6. 버전 정보</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748b;">소프트웨어 명칭</td><td style="color: #1e293b;">K-인증서 매니저 (K-Certificate Manager)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">소프트웨어 버전</td><td style="color: #1e293b; font-weight: bold;">v1.6.5 (Semantic Versioning 2.0.0)</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">릴리스 일자</td><td style="color: #1e293b;">2026-10-25</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">배포 바이너리</td><td style="color: #1e293b;">.NET 10 / .NET 8 Standalone Single-File + Inno Setup</td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #64748b;">라이선스</td><td style="color: #1e293b;">MIT License (개인·공공기관·기업 무료 이용)</td></tr>
    </table>
  </div>

  <!-- 7. 시스템 요구 사항 -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #f59e0b; padding-left: 10px; margin: 0 0 14px 0; color: #0f172a;">7. 시스템 요구 사항</h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
      <li style="margin-bottom: 6px;"><strong>운영체제</strong>: Microsoft Windows 10 / 11 (64-bit x64 / ARM64)</li>
      <li style="margin-bottom: 6px;"><strong>프레임워크</strong>: .NET 10.0 또는 .NET 8.0 (독립 실행형 풀버전은 런타임 내장으로 별도 설치 불필요)</li>
      <li style="margin-bottom: 6px;"><strong>웹 브라우저</strong>: Microsoft Edge, Google Chrome, Naver Whale 등 최신 웹 브라우저</li>
      <li style="margin-bottom: 6px;"><strong>저장 공간</strong>: 여유 디스크 공간 150MB 이상</li>
      <li style="margin-bottom: 0;"><strong>설치 권한</strong>: 관리자 권한 없이도 일반 사용자 계정에 안전 설치 지원</li>
    </ul>
  </div>

  <!-- 8. 제작자 및 공식 채널 안내 -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #8b5cf6; padding-left: 10px; margin: 0 0 14px 0; color: #0f172a;">8. 제작자 및 공식 채널 안내</h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
      <li style="margin-bottom: 6px;"><strong>개발자</strong>: AhBiYout</li>
      <li style="margin-bottom: 6px;"><strong>GitHub 공식 저장소</strong>: <a href="https://github.com/AhBiYout-all/K-Certificate-Manager" target="_blank" style="color: #0284c7; text-decoration: underline;">https://github.com/AhBiYout-all/K-Certificate-Manager</a></li>
      <li style="margin-bottom: 6px;"><strong>공식 기술 블로그</strong>: <a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" style="color: #0284c7; text-decoration: underline;">https://ahbiyoutvibe.blogspot.com/</a></li>
      <li style="margin-bottom: 6px;"><strong>소속 회사</strong>: <a href="https://www.cisnet.co.kr/" target="_blank" style="color: #0284c7; text-decoration: underline;">(주)씨아이에스넷 (CISNet)</a></li>
      <li style="margin-bottom: 0;"><strong>버그 제보 및 기능 제안</strong>: <a href="https://github.com/AhBiYout-all/K-Certificate-Manager/issues" target="_blank" style="color: #0284c7; text-decoration: underline;">GitHub Issues 바로가기</a></li>
    </ul>
  </div>

  <!-- 9. 전체 업데이트(이전 기록 모두, 기능 개선에 대한 내용만 기록) -->
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px 24px; margin-bottom: 24px;">
    <h2 style="font-size: 19px; border-left: 4px solid #0f172a; padding-left: 10px; margin: 0 0 16px 0; color: #0f172a;">9. 전체 업데이트 이력 (기능 개선 중심)</h2>
    <div style="font-size: 13.5px; color: #334155; line-height: 1.8;">
      <div style="margin-bottom: 10px;"><strong>v1.6.5 (2026-10-25)</strong>: 최좌측 1번 인덱스(1, 2, 3...) 시작 일원화(Web/WPF), DataGrid 최좌측 고정열(Frozen/Sticky) 보장, 작업 감사 로그 1번 인덱스 열 신설 및 동적 재색인, C# .NET 10 / .NET 8 빌드 무결성 확보.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.4 (2026-10-25)</strong>: 작업완료 안내 전용 팝업창(Operation Complete Modal/Dialog) 신설, 우측 상단 창 제어 버튼(최소/최대/닫기) 독립 격리 고정, 인증서 목록 행 간 명확한 수평 구분선 및 시각적 간격 고도화, DataGrid 상시 가로바 유지 및 픽셀 물리 스크롤 지원, PC➔USB 복사창 C: 드라이브 기본 선택 및 콤보박스 상시 활성화.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.3 (2026-10-21)</strong>: 상세 사이드바 닫힘 시 목록창 가로 반응형 자동 확장 및 여백 채움, 시작가이드 PC➔USB 복사 전용 대화창(<code>PcToUsbTransferDialog</code>) 구축 및 규격 일체화.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.2 (2026-10-20)</strong>: 드라이브 쓰기 오류 및 권한 문제 시 명확한 에러 알림 모달(<code>CopyErrorAlertModal</code>) 구축, 단계별 조치 체크리스트 제공.</div>
      <div style="margin-bottom: 10px;"><strong>v1.6.1 (2026-10-20)</strong>: 인증서 복사 완료 알림음(SuccessChime) 제어 기능 추가, 0~100% 볼륨 조절 슬라이더 및 미리듣기 지원.</div>
      <div style="margin-bottom: 10px;"><strong>v1.5.0 (2026-10-08 / 2026-10-14)</strong>: 시작 작업 선택 창 및 순서별 가이드 모션 오버레이 연동, SHA-256 체크섬 대조 '무결성 확인 완료' 녹색 실드 배지 실시간 토스트 연동, Windows 방화벽 인바운드 규칙 자동 사전 등록, Inno Setup 무인 설치(<code>/SILENT</code>) 지원, 기존 버전 삭제/덮어쓰기 분기, Node.js 24 Actions CI/CD 적용, 단일 인스톨러 배포 정제.</div>
      <div style="margin-bottom: 10px;"><strong>v1.4.5 (2026-10-06)</strong>: 대상 디스크 지정 팝업창, 동일 경로 자가 복사(Self-Copy) 금지 보호막, 드라이브 문자별 고유 색상 배지, 4대 테마 드롭다운 컴포넌트 전환.</div>
      <div style="margin-bottom: 10px;"><strong>v1.4.3 (2026-10-04)</strong>: GitHub Releases 3-Tier 실시간 자동 업데이트 체커 탑재, 다크 테마 시작 시인성 3중 보정.</div>
      <div style="margin-bottom: 10px;"><strong>v1.4.0 (2026-10-01)</strong>: C# WPF 데스크톱 네이티브 GUI 앱 탑재, 모던 일체형 타이틀바(<code>WindowChrome</code>), 4대 컬러 테마(다크/회색/화이트/베이지) 시스템 구축.</div>
      <div style="margin-bottom: 10px;"><strong>v1.3.0 (2026-09-28)</strong>: USB ➔ PC 역방향 가져오기 파이프라인, 지수 백오프 자동 재시도, 실수 삭제 방지 안전 휴지통(<code>SafetyTrash</code>) 구현.</div>
      <div style="margin-bottom: 10px;"><strong>v1.2.0 (2026-09-24)</strong>: 순수 창작 코어 라이브러리(<code>KCert.Core.dll</code>) ASN.1 DER 파서 및 PKCS#8 키 분석기 탑재.</div>
      <div style="margin-bottom: 0;"><strong>v1.0.0 (2026-09-15)</strong>: NPKI, GPKI, EPKI 공인/공동인증서 자동 탐색 및 USB 일괄 백업 웹 관리 콘솔 최초 릴리스.</div>
    </div>
  </div>

  <!-- 10. 추천 태그 -->
  <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin-top: 20px;">
    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 6px;">🏷️ 추천 태그 (Tags)</div>
    <div style="font-size: 13px; color: #0284c7; word-break: break-all;">
      공동인증서,GPKI,EPKI,NPKI,인증서복사,인증서백업,USB복사,인증서관리,KCertManager,AhBiYout,CISNet,Certificate,InnoSetup,WPF,DotNet,Security
    </div>
  </div>

</div>
<!-- K-Certificate Manager v1.6.5 Google Blogger Post Body End -->
```
