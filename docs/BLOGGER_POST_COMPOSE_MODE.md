# 📢 [구글 블로그 원고 - 작성 모드 (서식 있는 텍스트 / Compose Mode)]
# 프로젝트: K-Certificate Manager (K-인증서 매니저) v1.9.0

---

## 1. 제목 (Title)
**K-인증서 매니저 v1.9.0 정식 릴리스: 공무원(GPKI·EPKI) & 금융 공동인증서(NPKI) 원클릭 USB 이동·백업, 암호화 보호 보관소 & USB 제한 복구 솔루션**

---

## 2. 본문 (Body)
대한민국 공무원 행정전자서명(GPKI), 교육부 전자서명(EPKI), 국방부 전자서명(MPKI) 및 시중은행 금융 공동인증서(NPKI)를 컴퓨터(C:\)와 이동식 USB 메모리 간에 간편하고 안전하게 일괄 복사·백업·이동할 수 있는 통합 공인인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v1.9.0** 정식 버전이 출시되었습니다.

ActiveX나 별도 보안 프로그램 설치 없이, 지능형 딥스캔 엔진이 시스템 내 모든 공인인증서를 자동 감지하며, Windows DPAPI / AES-256 특수 암호화로 보호되는 **암호화 보호 보관소(Encrypted Protected Vault)**와 **제한된 USB 복구 (`💾 USB로 제한 복구`)** 기능을 제공하여 소중한 인증서의 오염이나 임의 유출을 완벽하게 차단합니다. 또한 만료 인증서 정리창 가로 너비를 20% 확대하여 가독성을 높였고, 정식 Inno Setup 무인 설치와 방화벽 자동 등록을 지원합니다.

---

## 3. 업데이트 (Recent Updates)
- 🔒 **암호화 보호 보관소 (Encrypted Protected Vault) 신설 (Web & WPF)**: 복원된 항목의 매니페스트(`protected_restored_manifest.dat`)를 Windows DPAPI(CurrentUser) 및 AES-256으로 이중 암호화하여 현재 사용자 외 타인의 무단 접근 완벽 차단.
- 💾 **제한된 USB 복구 (`💾 USB로 제한 복구`) 지원**: 특수 보관소 내 인증서를 로컬 PC 오염 방지를 위해 오직 이동식 USB 메모리의 표준 규격 경로(`\NPKI`, `\GPKI`, `\EPKI`)로만 안전 복구 허용.
- 📏 **만료 인증서 정리창 (ExpiredCleanupDialog) 가로 너비 20% 대폭 확대**: 기존 `Width="820"`에서 `Width="984"`로 가로 크기를 확대하여 저장 경로 및 만료 상태, 발급기관명의 가독성과 시인성 극대화.
- ⚙️ **Inno Setup 정식 인스톨러 완성 및 무인 설치 지원**: Unpacked Multi-File 개별 파일 설치, 기존 실행 프로세스 강제 종료(`TerminateAppProcesses`), Windows 프로그램 추가/제거 정식 등록, 방화벽 규칙 사전 조용 자동 등록 및 `/VERYSILENT /NORESTART` 무인 설치 지원.
- 🚀 **빌드 파이프라인 정리 및 산출물 구조화**: 자동 빌드 결과물을 번호별 독립 폴더(`01_WebBundle`, `02_WpfDesktop`, `04_CoreDll`, `05_UnpackedApp`, `07_Installer`)로 깔끔하게 분리 생성.
- 🧩 **순수 독립 C# 코어 & 암호화 DLL 탑재**: 3rd-party 의존성 0%의 `KCert.Core.dll` (X.509/ASN.1/OID 파서) 및 `KCert.Crypto.dll` (SEED-128/PKCS#8/RSA-SHA256) 완비.
- 🎵 **완료 알림음(SuccessChime) 피드백 및 상단 헤더 볼륨 슬라이더**: 복사/백업 완료 알림음 및 0~100% 가로 슬라이더 바, 4대 테마 전역 고대비 툴팁 시스템 연동.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v1.9.0 메인 컨트롤 인터페이스]
- 상단 툴바: 🔊 볼륨 슬라이더 | ⚙️ 환경 설정 | 💾 PC ➔ USB | 📥 USB ➔ PC | 🗑️ 안전 휴지통
- 중앙 테이블: 순번(1-based), 인증서명, 발급기관, 만료일자, 상태 배지, 원본 경로, SHA-256 무결성
- 만료 인증서 정리창: 984px 광폭 대화상자로 긴 NPKI/GPKI/EPKI 경로 한눈에 조회
- 하단 영역: 연결된 드라이브(NVMe/SATA/USB) 상태바 및 고급 관리 설정
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all](https://github.com/AhBiYout-all)
- 💾 **공식 구글 블로그 다운로드 안내**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 방법**: 다운로드 받은 `kcert-manager-v1.9.0-setup.exe` 파일을 실행하면 마법사의 안내에 따라 바탕화면 바로가기 생성 및 방화벽 자동 등록과 함께 안전하게 설치가 완료됩니다. (무인 무대화창 설치: `/VERYSILENT /NORESTART`)

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v1.9.0` (Semantic Versioning 2.0.0 준수)
- **코어 라이브러리**: `KCert.Core.dll` v1.9.0 / `KCert.Crypto.dll` v1.9.0
- **릴리스 일자**: 2026년 11월 6일

---

## 7. 시스템 요구 사항 (System Requirements)
- **운영체제**: Windows 11 / Windows 10 (64-bit / 32-bit 지원)
- **런타임**: .NET 10.0 또는 .NET 8.0 Desktop Runtime (Self-Contained 패키지는 추가 설치 불필요)
- **디스크 공간**: 약 35 MB 이상의 여유 공간
- **지원 매체**: 내장 SSD/HDD, 이동식 USB 메모리, 외장 SSD, 가상 드라이브

---

## 8. 제작자 및 공식 채널 안내 (Developer & Official Channels)
- **개발자**: AhBiYout
- **GitHub 저장소**: [https://github.com/AhBiYout-all](https://github.com/AhBiYout-all)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr)
- **소속회사**: (주)청운정보시스템 ( cisnet.co.kr )

---

## 9. 전체 업데이트 (Full Update History)

### 🚀 [v1.9.0] - 2026-11-06
- **암호화 보호 보관소 구축**: 복원 이력 매니페스트(`protected_restored_manifest.dat`)를 Windows DPAPI(CurrentUser) 및 AES-256 이중 암호화하여 타인의 무단 접근 완벽 차단.
- **제한된 USB 복구 (`💾 USB로 제한 복구`) 신설**: 로컬 PC 파일 오염 방지를 위해 외장 USB 메모리(`\NPKI`, `\GPKI`, `\EPKI`)로만 안전 복구 허용.
- **만료 인증서 정리창 (ExpiredCleanupDialog) 가로 너비 20% 대폭 확대**: 기존 820px에서 984px로 확장하여 긴 인증서 저장 경로 시인성 극대화.
- **Inno Setup 정식 인스톨러 배포 최적화**: Unpacked Multi-File 개별 파일 설치, 기존 프로세스 강제 종료, 프로그램 추가/제거 등록, 방화벽 조용 자동 등록 및 무인 설치(`/VERYSILENT`) 완비.
- **빌드 파이프라인 번호별 폴더 분리**: `release/` 하위 `01_WebBundle`, `02_WpfDesktop`, `04_CoreDll`, `05_UnpackedApp`, `07_Installer` 등 체계적 폴더 적재.

### 🚀 [v1.8.0] - 2026-10-31
- **독립 C# 코어 & 암호화 DLL 2종 분리**: 3rd-party 의존성 0%의 `KCert.Core.dll` 및 `KCert.Crypto.dll` 독립 라이브러리 모듈화.
- **상단 헤더 가로바 스크롤러 및 마우스 휠 연동**: 툴바 위 마우스 휠 조작 시 좌우 가로 스크롤 지원 및 창 드래그 간섭 차단.
- **4대 테마 전역 고대비 툴팁 시스템 신설**: 다크, 회색, 베이지, 화이트 전 테마에서 WCAG AAA 고대비 폰트 가독성 확보.

### 🚀 [v1.7.2] - 2026-10-31
- **상단 헤더 가로 볼륨 슬라이더 바 탑재**: 원클릭 음소거 및 0~100% 가로 슬라이더 바, 소리 미리듣기 상시 노출.
- **⚙️ 환경 설정 모달 & SettingsDialog 구축**: 테마 선택, 알림음 볼륨, 시작 안내 설정 영구 보존.

### 🚀 [v1.7.1] - 2026-10-28
- **만료 인증서 정리 수량과 안전 격리 휴지통 수량 1:1 완벽 동기화**: `trash_manifest.json` 메타데이터 누락 방지 및 카운트 일치 보장.
- **GitHub Actions 런타임 최신화**: Node.js 24 및 22 LTS 공식 워크플로 전환.

### 🚀 [v1.7.0] - 2026-10-27
- **인증서 복사·백업 성공 알림음(SuccessChime) 제어 기능 탑재**: 완료 알림음 ON/OFF 및 볼륨 조절 슬라이더, 프리셋 버튼 제공.
- **보안 삭제 증적 로그 감사 시스템 신설**: 영구 삭제 파일 경로, SubjectDN, 일련번호, SHA-256 증적 캡처 및 감사 보고서(`.log`) 내보내기 지원.
- **인증서 목록 컬럼 최소 폭 자유 조절(30px) 및 세로 그리드 구분선 도입**.

### 🚀 [v1.6.5] - 2026-10-25
- **최좌측 1번 인덱스(1, 2, 3...) 일원화**: 모든 테이블 및 대화상자에서 번호 1부터 시작하도록 통일.
- **최좌측 번호 열 상시 고정(Frozen & Sticky Column) 보장**: 가로 스크롤 시에도 1번 열 고정 표시.
- **작업 로그 대화상자 고정 번호 열 신설 및 동적 재색인 연동**.

### 🚀 [v1.6.4] - 2026-10-25
- **작업완료 안내 전용 팝업창(Operation Complete Dialog) 신설**: 출발지/도착지 경로 시각화, SHA-256 무결성 실드 배지, 대상 폴더 열기 지원.
- **윈도우 창 제어 버튼(최소화/최대화/닫기) 독립 고정**: 창 크기 축소 시에도 상시 노출 보장.
- **인증서 DataGrid 상시 가로 스크롤바 사라짐 방지 및 목적지 드라이브 기본 C: 자동 선택 지원**.

### 🚀 [v1.6.3] - 2026-10-21
- **상세 사이드바 닫힘 시 목록창 가로 반응형 자동 확장 및 여백 채움**.
- **시작가이드 PC ➔ USB 복사하기 전용 대화창 구축**: USB ➔ PC 대화창과의 레이아웃 형식 일체화.

### 🚀 [v1.6.2] - 2026-10-20
- **드라이브 쓰기 오류 및 권한 거부 전용 알림 모달 구축**: 원인별 해결 조치 체크리스트 제공.

### 🚀 [v1.6.1] - 2026-10-20
- **인증서 복사 완료 알림음(SuccessChime) 및 음량 제어 슬라이더 연동**.

### 🚀 [v1.5.0] - 2026-10-08
- **시작 작업 선택 마법사(PC➔USB, USB➔PC) 및 단계별 가이드 모션 오버레이 구축**.
- **SHA-256 전자서명 무결성 검증 실드 배지 및 자가 복사 방지 필터링 탑재**.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,USB복사,인증서백업,K인증서매니저,인증서이동,공동인증서,KCertManager,CertificateManager,USBBackup,GPKICopy,NPKICopy**
*(태그 수: 15개 / 총 138자 - 한글 및 영어 혼용, 20개 이하 및 200자 이내 규칙 준수)*
