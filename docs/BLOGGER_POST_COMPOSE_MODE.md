# 📢 [구글 블로그 원고 - 작성 모드 (서식 있는 텍스트 / Compose Mode)]
# 프로젝트: K-Certificate Manager (K-인증서 매니저) v1.9.0

---

## 1. 제목 (Title)
**K-인증서 매니저 v1.9.0 정식 릴리스: 공무원(GPKI·EPKI) & 금융 공동인증서(NPKI) 원클릭 USB 이동·백업, 암호화 특수 보관소 & 제한 복구 관리 솔루션**

---

## 2. 본문 (Body)
대한민국 공무원 행정전자서명(GPKI), 교육부 전자서명(EPKI), 국방부 전자서명(MPKI) 및 시중은행 금융 공동인증서(NPKI)를 컴퓨터(C:\)와 이동식 USB 메모리 간에 간편하고 안전하게 일괄 복사·백업·이동할 수 있는 통합 공인인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v1.9.0** 정식 버전이 출시되었습니다.

ActiveX나 복잡한 보안 프로그램 설치 없이, 지능형 딥스캔 엔진이 시스템 내 모든 공인인증서를 자동 감지하며, Windows DPAPI / AES-256 암호화로 보호되는 **안전 격리 휴지통**과 **특수 보관소**, **제한된 USB 복구** 기능을 제공하여 소중한 인증서의 오염이나 임의 유출을 완벽하게 차단합니다.

---

## 3. 업데이트 (Recent Updates)
- 🔒 **보호 보관소 및 제한된 USB 복구 (`💾 USB로 제한 복구`) 신설**: 특수 보관소 내 복원된 인증서를 외부 파일 오염 방지 목적으로 이동식 USB 메모리의 표준 규격 경로(`\NPKI`, `\GPKI`, `\EPKI`)로만 안전하게 복구 허용.
- 🔐 **Windows DPAPI 및 AES-256 특수 암호화 저장소 구축**: 삭제 및 복원 항목 매니페스트(`protected_restored_manifest.dat`)를 CurrentUser 보안 컨텍스트로 암호화하여 제3자의 무단 접근 차단.
- ⚙️ **Inno Setup 정비 및 무인 설치(Silent Install) 지원**: 설치 시 기존 실행 프로세스 안전 종료, Windows 프로그램 추가/제거 정식 등록, 방화벽 규칙 자동 조용 등록 지원.
- 🎵 **완료 알림음(SuccessChime) 피드백 및 볼륨 제어 완비**: 복사 완료 알림음(3음 하모닉 상승 차임) 탑재 및 상단 슬라이더 바/환경 설정 모달을 통한 음량 조절 지원.
- 🎨 **4대 테마 전역 고대비 툴팁(ToolTip) 및 세로 구분선 가시성 최적화**: 다크, 회색, 베이지, 화이트 테마 전반의 시인성 완벽 보장.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v1.9.0 메인 실행 화면]
- 상단 툴바: 🔊 볼륨 슬라이더 | ⚙️ 환경 설정 | 💾 PC ➔ USB | 📥 USB ➔ PC | 🗑️ 안전 휴지통
- 중앙 테이블: 인증서명, 발급기관, 유효기간, 잔여일수, 상태 배지, 원본 경로, SHA-256 무결성
- 하단 영역: 연결된 드라이브(NVMe/SATA/USB) 상태바 및 고급 관리 설정
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager/releases](https://github.com/AhBiYout-all/K-Certificate-Manager/releases)
- 💾 **웹 에디션 실시간 체험 (무설치 브라우저 버전)**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 방법**: 다운로드 받은 `kcert-manager-v1.9.0-setup.exe` 파일을 실행하면 마법사의 안내에 따라 바탕화면 바로가기 생성 및 방화벽 자동 등록과 함께 10초 내 설치가 완료됩니다. (무인 설치 옵션: `/VERYSILENT /NORESTART`)

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v1.9.0` (Semantic Versioning 2.0.0 준수)
- **코어 라이브러리**: `KCert.Core.dll` v1.9.0 / `KCert.Crypto.dll` v1.9.0
- **릴리스 일자**: 2026년 11월

---

## 7. 시스템 요구 사항 (System Requirements)
- **운영체제**: Windows 11 / Windows 10 (64-bit / 32-bit 지원)
- **런타임**: .NET 10.0 또는 .NET 8.0 Desktop Runtime (Self-Contained 패키지는 추가 설치 불필요)
- **디스크 공간**: 약 35 MB 이상의 여유 공간
- **지원 매체**: 내장 SSD/HDD, 이동식 USB 메모리, 외장 SSD, 가상 드라이브

---

## 8. 제작자 및 공식 채널 안내 (Developer & Official Channels)
- **개발자 (Developer)**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **소속 회사**: (주)청운정보시스템 ( cisnet.co.kr ) ([https://www.cisnet.co.kr](https://www.cisnet.co.kr))
- **공식 GitHub 저장소**: [https://github.com/AhBiYout-all](https://github.com/AhBiYout-all)
- **개발자 기술 블로그**: AhBi Vibe Log ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))

---

## 9. 전체 업데이트 이력 (Full Update History)

### 🚀 [v1.9.0] - 2026-11
- **독립 C# 코어 & 암호화 DLL 모듈화**: `KCert.Core.dll` (ASN.1 DER 파서 및 OID 분석 엔진) 및 `KCert.Crypto.dll` (SEED-128-CBC 및 RSA-SHA256 서명 엔진) 분리 구축.
- **암호화 보호 보관소 및 제한된 USB 복구**: 특수 보관소 매니페스트 Windows DPAPI / AES-256 암호화 저장 및 USB 전용 제한 복구 기능 연동.
- **Inno Setup 설치 환경 고도화**: 프로세스 강제 종료, 정식 추가/제거 등록, 방화벽 조용 등록 및 무인 설치(`/VERYSILENT`) 지원.
- **헤더 가로 스크롤 및 4대 테마 전역 고대비 툴팁**: 상단 툴바 마우스 휠 가로 탐색 및 툴팁 시인성 완벽 복원.

### 🚀 [v1.7.2] - 2026-10
- **상단 헤더 가로 볼륨 슬라이더 바 직접 탑재**: 음량(0%~100%) 미세 조정 및 미리듣기 지원.
- **⚙️ 환경 설정 모달 & SettingsDialog 구축**: 다크/회색/화이트/베이지 테마 및 알림음 설정 영구 보존.

### 🚀 [v1.7.1] - 2026-10
- **만료 인증서 정리 수량과 휴지통 개수 1:1 완벽 동기화**: `trash_manifest.json` 메타데이터 누락 방지 및 정합성 보장.

### 🚀 [v1.7.0] - 2026-10
- **보안 삭제 증적 감사 로그 (Secure Deletion Audit Trail) 신설**: 영구 삭제 파일 상세 경로, SubjectDN, SHA-256 캡처 및 감사 보고서 내보내기 지원.
- **인증서 목록 컬럼 최소 폭 자유 조절(30px) 및 세로 구분선 도입**.

### 🚀 [v1.6.5] - 2026-10
- **최좌측 1번 인덱스(1, 2, 3...) 일원화 및 DataGrid 최좌측 고정열(Frozen Column) 보장**.

### 🚀 [v1.6.4] - 2026-10
- **작업완료 안내 전용 팝업창(Operation Complete Modal/Dialog) 신설**: 출발지/목적지 경로 시각화, 무결성 배지, 1-클릭 폴더 열기 지원.

### 🚀 [v1.6.3] - 2026-10
- **PC ➔ USB 전용 대화창 구축**: USB ➔ PC 대화창과의 규격 일체화.

### 🚀 [v1.6.2] - 2026-10
- **드라이브 쓰기 오류 및 권한 거부 알림 모달 구축**.

### 🚀 [v1.6.1] - 2026-10
- **인증서 복사 완료 알림음(SuccessChime) 제어 기능 추가**.

### 🚀 [v1.5.0] - 2026-10
- **시작 작업 선택 마법사(PC➔USB, USB➔PC) 및 단계별 가이드 모션 오버레이 전면 구축**.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,USB복사,인증서백업,K인증서매니저,인증서이동,공동인증서,KCertManager,CertificateManager,USBBackup,GPKICopy,NPKICopy**
*(태그 수: 15개 / 총 138자 - 한글 및 영어 혼용)*
