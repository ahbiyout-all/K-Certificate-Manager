# 🐙 GitHub Documentation: K-Certificate Manager (K-인증서 매니저) v2.0.0

---

## 📌 Overview & Repository Structure

**K-Certificate Manager**는 대한민국 공무원 행정전자서명(GPKI/EPKI/MPKI) 및 금융 공동인증서(NPKI)를 자동 탐색하고 이동식 USB 메모리 간 일괄 복사·백업·이동하는 오픈소스 보안 관리 도구입니다.

### 🌟 Key Features in v2.0.0
1. **Pure C# Core DLL Architecture (`KCert.Core.dll` & `KCert.Crypto.dll`)**: 3rd-party 의존성 0%의 순수 X.509/ASN.1 파서 및 SEED-128 / RSA-SHA256 암호화 라이브러리 탑재.
2. **Encrypted Vault & Restricted USB Recovery (`💾 USB로 제한 복구`)**: Windows DPAPI(CurrentUser) 및 AES-256 특수 암호화 보관소(`protected_restored_manifest.dat`) 구축 및 로컬 PC 파일 오염 방지를 위한 외장 USB 매체 전용 제한 복구 기능.
3. **WPF Native DPAPI Vault Integration**: `System.Security.Cryptography.ProtectedData` (8.0.0) NuGet 패키지 탑재 및 `TrashDialog` 실시간 보안 암호화 상태 안내 배너 연동.
4. **ExpiredCleanupDialog 20% Width Expansion**: 만료 인증서 정리창 너비를 기존 `820px`에서 `984px`로 20% 확대하여 긴 인증서 저장 경로와 만료일자 가독성 극대화.
5. **Inno Setup Production Installer (`installer.iss`)**: Unpacked Multi-File 구조 개별 파일 설치, 기존 프로세스 강제 종료(`TerminateAppProcesses`), Windows 프로그램 추가/제거 정식 등록, 방화벽 규칙 사전 조용 등록 및 무인 설치(`/VERYSILENT /NORESTART`) 지원.
6. **Version-Numbered Subfolders Build Pipeline (`build.ps1`, `build.bat`, `build.cmd`)**: 메인 `/dist` 디렉터리 아래 버전 번호별 하위 폴더(`/dist/v2.0.0/web`, `/win-x64`, `/core-dll`, `/unpacked`, `/installer`)로 모든 산출물을 명확히 분리 생성.
7. **Header Horizontal Scroll & High Contrast ToolTips**: 상단 메뉴 마우스 휠 가로 탐색 및 4대 테마 전역 고대비 툴팁 적용.
8. **Dynamic Animated Moving Border Glow (`WpfAnimatedBorderHelper.cs` & `index.css`)**: 60fps 무한 유동 그라데이션 테두리 및 네온 글로우 발광 펄스 브러시를 WPF 데스크톱 메인 사이드바(`SidebarTargetDriveBorder`), 피커 팝업, PC➔USB/USB➔PC 전용 다이얼로그 및 Web 컴포넌트에 전면 탑재.

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

# 빌드 결과물 (dist/v2.0.0/ 폴더 생성)
# ├── web/           (Vite 프로덕션 번들)
# ├── win-x64/       (C# WPF 데스크톱 실행 바이너리 KCertManager.exe & Lite)
# ├── core-dll/      (순수 독립 C# DLL KCert.Core.dll / KCert.Crypto.dll)
# ├── unpacked/      (클린 무설치 폴더 풀림 구조)
# └── installer/     (Inno Setup kcert-manager-v2.0.0-setup.exe)
```

---

## 🔒 Inno Setup Installer Specifications (`installer.iss`)

- **AppID**: `{{8F5B123A-4C2E-497B-902B-6277D8C7B8E1}}`
- **Installation Directory**: `{autopf}\K-Certificate Manager` (Unpacked Multi-File)
- **Silent Install Support**: `kcert-manager-v2.0.0-setup.exe /VERYSILENT /NORESTART`
- **Firewall Registration (netsh.exe)**:
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager"`
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager v2.0.0"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저 v2.0.0"`

---

## 📜 Official Channels & Developer Info

- **Developer**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **Company**: (주)청운정보시스템 ( cisnet.co.kr ) ([https://www.cisnet.co.kr](https://www.cisnet.co.kr))
- **Official Blog**: AhBi Vibe Log ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
- **GitHub Profile & Repository**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **License**: MIT License (Korean / English Dual License)
