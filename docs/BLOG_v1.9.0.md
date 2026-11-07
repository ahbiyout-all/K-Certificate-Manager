# 📢 [구글 블로그 원고 - 작성 모드 (서식 있는 텍스트 / Compose Mode)]
# 프로젝트: K-Certificate Manager (K-인증서 매니저) v1.9.0

---

## 1. 제목 (Title)
**K-인증서 매니저 v1.9.0 정식 릴리스: 암호화 특수 보관소 & USB 제한 복구 신설, 공무원(GPKI·EPKI) & 금융 공동인증서(NPKI) 보안 관리 솔루션**

---

## 2. 본문 (Body)
대한민국 공무원 행정전자서명(GPKI), 교육부 전자서명(EPKI), 국방부 전자서명(MPKI) 및 시중은행 금융 공동인증서(NPKI)를 컴퓨터(C:\)와 이동식 USB 메모리 간에 간편하고 안전하게 일괄 복사·백업·이동할 수 있는 통합 공인인증서 관리 프로그램 **K-인증서 매니저(K-Certificate Manager) v1.9.0** 정식 버전이 출시되었습니다.

이번 v1.9.0 버전에서는 보안성이 대폭 강화된 **암호화 특수 보관소**와 **제한된 USB 복구** 기능을 새롭게 선보입니다. 삭제 취소나 복원 시 발생하는 이력 데이터를 Windows DPAPI 및 AES-256으로 이중 암호화하여 철저히 격리하며, 인증서 복구 시 반드시 USB 매체를 통해서만 가능하도록 제한하여 시스템 오염을 원천 차단했습니다.

---

## 3. 업데이트 (Recent Updates)
- 🔒 **암호화 보호 보관소 (Encrypted Protected Vault) 신설**: 복원 이력 매니페스트(`protected_restored_manifest.dat`)를 Windows DPAPI(CurrentUser) 및 AES-256으로 암호화하여 무단 접근 완벽 차단.
- 💾 **제한된 USB 복구 (`💾 USB로 제한 복구`) 지원**: 특수 보관소 내 인증서를 이동식 USB 메모리의 표준 규격 경로(`\NPKI`, `\GPKI`, `\EPKI`)로만 안전하게 복구 허용하여 PC 시스템 폴더 오염 방지.
- ⚙️ **Inno Setup 정식 인스톨러 완성 및 무인 설치 지원**: 설치 시 기존 프로세스 자동 종료, 프로그램 추가/제거 등록, 방화벽 규칙 조용 등록 및 `/VERYSILENT` 무인 설치 옵션 완비.
- 🚀 **빌드 파이프라인 구조화**: 자동 빌드 산출물을 번호별 독립 폴더(`01_WebBundle`, `02_WpfDesktop`, `07_Installer` 등)로 자동 분류하여 배포 관리 편의성 증대.
- 🎨 **UI 시인성 고도화**: 상단 툴바 마우스 휠 가로 탐색 연동 및 4대 테마 전역 고대비 툴팁 시스템 탑재.

---

## 4. 앱 그림 (App Screenshot)
*(블로그 게시 시 아래 그림 위치에 프로그램 실행 캡처 이미지를 삽입하세요)*

```text
[📷 K-인증서 매니저 v1.9.0 실행 화면]
- 상단: 🔊 볼륨 슬라이더 | ⚙️ 환경 설정 | 💾 PC ➔ USB | 📥 USB ➔ PC | 🗑️ 안전 휴지통
- 중앙: 암호화 상태가 표시된 특수 보관소 및 SHA-256 무결성 검증 테이블
- 하단: 드라이브(NVMe/USB) 상세 상태바
```

---

## 5. 다운로드 (Download)
- 📦 **공식 깃허브 최신 릴리스 다운로드**: [https://github.com/AhBiYout-all/K-Certificate-Manager/releases](https://github.com/AhBiYout-all/K-Certificate-Manager/releases)
- 💾 **웹 에디션 실시간 체험 (무설치 브라우저 버전)**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- ⚙️ **설치 방법**: `kcert-manager-v1.9.0-setup.exe` 실행 시 바탕화면 바로가기 및 방화벽 자동 등록과 함께 10초 내 설치 완료. (무인 설치: `/VERYSILENT /NORESTART`)

---

## 6. 버전정보 (Version Info)
- **최신 정식 버전**: `v1.9.0` (Semantic Versioning 2.0.0 준수)
- **코어 라이브러리**: `KCert.Core.dll` v1.9.0 / `KCert.Crypto.dll` v1.9.0
- **릴리스 일자**: 2026년 11월 6일

---

## 7. 시스템 요구 사항 (System Requirements)
- **운영체제**: Windows 11 / Windows 10
- **런타임**: .NET 10.0 또는 .NET 8.0 Desktop Runtime (Self-Contained 지원)
- **디스크 공간**: 약 35 MB 이상의 여유 공간
- **지원 매체**: 내장 SSD/HDD, 이동식 USB 메모리, 외장 SSD

---

## 8. 제작자 및 공식 채널 안내 (Developer & Official Channels)
- **개발자 (Developer)**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **소속 회사**: (주)청운정보시스템 ([https://www.cisnet.co.kr](https://www.cisnet.co.kr))
- **개발자 기술 블로그**: AhBi Vibe Log ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))

---

## 9. 전체 업데이트 이력 (Full Update History)

### 🚀 [v1.9.0] - 2026-11
- **암호화 보호 보관소 및 USB 전용 제한 복구 신설**.
- **Inno Setup 정식 인스톨러 및 방화벽 규칙 자동 등록**.
- **빌드 파이프라인 번호별 산출물 구조화**.

### 🚀 [v1.8.0] - 2026-10
- **독립 C# 코어 & 암호화 DLL 2종 모듈화**.
- **상단 헤더 가로바 스크롤 및 마우스 휠 연동**.
- **4대 테마 전역 고대비 툴팁 시스템 신설**.

### 🚀 [v1.7.2] - 2026-10
- **상단 헤더 가로 볼륨 슬라이더 바 직접 탑재**.
- **⚙️ 환경 설정 모달 & SettingsDialog 구축**.

---

## 10. 추천 태그 (Recommended Tags)
**공인인증서,공무원인증서,GPKI,EPKI,NPKI,USB복사,인증서백업,K인증서매니저,인증서이동,공동인증서,KCertManager,CertificateManager,USBBackup,GPKICopy,NPKICopy**
