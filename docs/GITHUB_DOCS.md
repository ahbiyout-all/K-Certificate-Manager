# 🐙 GitHub Documentation: K-Certificate Manager (K-인증서 매니저) v1.9.0

---

## 📌 Overview & Repository Structure

**K-Certificate Manager**는 대한민국 공무원 행정전자서명(GPKI/EPKI/MPKI) 및 금융 공동인증서(NPKI)를 자동 탐색하고 이동식 USB 메모리 간 일괄 복사·백업·이동하는 오픈소스 보안 관리 도구입니다.

### 🌟 Key Features in v1.9.0
1. **Pure C# Core DLL Architecture (`KCert.Core.dll` & `KCert.Crypto.dll`)**: 3rd-party 의존성 0%의 순수 X.509/ASN.1 파서 및 SEED-128 / RSA-SHA256 암호화 라이브러리.
2. **Encrypted Vault & Restricted USB Recovery (`💾 USB로 제한 복구`)**: Windows DPAPI / AES-256 특수 암호화 보관소 및 파일 오염 방지를 위한 USB 매체 전용 제한 복구 기능.
3. **Inno Setup Production Installer (`installer.iss`)**: Unpacked Multi-File 구조 개별 설치, 프로세스 강제 종료, 프로그램 추가/제거 등록, 방화벽 규칙 사전 등록 및 무인 설치(`/VERYSILENT`) 지원.
4. **Header Horizontal Scroll & High Contrast ToolTips**: 상단 메뉴 마우스 휠 가로 탐색 및 4대 테마 전역 고대비 툴팁 적용.

---

## 🛠️ Build & Packaging Workflow

### 1. Web Edition (React + Vite)
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 번들 빌드 (dist/)
npm run build
```

### 2. Desktop Edition (C# WPF / .NET 10 & 8)
```powershell
# 통합 자동 빌드 스크립트 실행
.\build.ps1

# 빌드 결과물 (release/ 폴더 생성)
# ├── 01_WebBundle/       (Vite 프로덕션 번들)
# ├── 02_WpfDesktop/      (C# WPF 데스크톱 실행 바이너리)
# ├── 03_WpfLite/         (초경량 라이트 에디션)
# ├── 04_CoreDll/         (KCert.Core.dll / KCert.Crypto.dll)
# ├── 05_UnpackedApp/     (클린 무설치 폴더 풀림 구조)
# └── 07_Installer/       (Inno Setup kcert-manager-v1.9.0-setup.exe)
```

---

## 🔒 Inno Setup Installer Specifications (`installer.iss`)

- **AppID**: `{{8F5B123A-4C2E-497B-902B-6277D8C7B8E1}}`
- **Installation Directory**: `{autopf}\K-Certificate Manager` (Unpacked Multi-File)
- **Silent Install Support**: `kcert-manager-v1.9.0-setup.exe /VERYSILENT /NORESTART`
- **Firewall Registration**:
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager"`
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager v1.9.0"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저 v1.9.0"`

---

## 📜 Official Channels & Developer Info

- **Developer**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **Company**: (주)청운정보시스템 ([https://www.cisnet.co.kr](https://www.cisnet.co.kr))
- **Official Blog**: AhBi Vibe Log ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
- **License**: MIT License (Korean / English Dual License)
