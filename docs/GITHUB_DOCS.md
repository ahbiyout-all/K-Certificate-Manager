# 🐙 GitHub Documentation: K-Certificate Manager (K-인증서 매니저) v2.1.0

---

## 📌 Overview & Repository Structure

**K-Certificate Manager (K-인증서 매니저)**는 대한민국 공무원 행정전자서명(GPKI/EPKI/MPKI) 및 금융 공동인증서(NPKI)를 자동 탐색하고, PC와 이동식 USB 메모리 간에 양방향으로 안전하게 복사·백업·복원하는 오픈소스 보안 관리 도구입니다.

### 🌟 Key Features in v2.1.0
1. **In-App Auto-Download & Silent Self-Update (`UpdateCheckerService.cs`, `updateChecker.ts`)**: 업데이트 창에서 확인 클릭 시 GitHub 웹페이지로 이동하지 않고 설치 패키지를 직접 다운로드·검증(PE `MZ` / SHA-256) 후 무인 셀프 설치(`/SILENT`) 및 자동 재실행까지 원스톱 처리.
2. **WPF-Web Visual Parity & Responsive CSS Grid `auto-fill` (`CertificateList.tsx`, `index.css`)**: WPF 다크 테마(`#0F1219` / `#1A1F2C`)를 Web 콘솔에 동일 적용하고, 화면 너비에 맞춰 카드가 자동 리플로우되는 CSS Grid `auto-fill` 레이아웃 및 다크/파스텔 블랙 모달 고대비 교정 완비.
3. **Plain-Korean-First UX & Collapsible Details (Web & WPF)**: 어려운 기술 용어를 쉬운 일상 표현+용어 병기로 통일하고 긴 설명을 접이식 토글(`더보기` / WPF `Expander`)로 정리해 사용자 인식률 극대화.
4. **C:\ Self-Copy Guard & Async State Hardening**: WPF `TargetDrivePickerDialog`의 실제 저장 경로(`AppData\LocalLow` vs `C:\GPKI`) 기준 자가 복사 차단 보정 및 Web `AbortError` 재시도 방지·최신 상태 참조(`certificatesRef`) 안정화.
5. **Pure C# Core DLL Architecture (`KCert.Core.dll` & `KCert.Crypto.dll`)**: 외부 의존성 0%의 순수 X.509/ASN.1 파서 및 SEED-128 / ARIA / RSA-SHA256 암호화 라이브러리 탑재.
6. **Encrypted Vault & Restricted USB Recovery (`💾 USB로 복구`)**: Windows DPAPI(CurrentUser) 및 AES-256 이중 암호화 보관소(`protected_restored_manifest.dat`) 및 PC 오염 방지를 위한 USB 전용 복원 기능.
7. **Inno Setup Production Installer (`installer.iss`)**: Unpacked Multi-File 구조 설치, 기존 프로세스 안전 종료(`TerminateAppProcesses`), 방화벽 규칙 사전 자동 등록 및 `/VERYSILENT /NORESTART` 무인 설치 지원.
8. **Version-Numbered Subfolders Build Pipeline (`build.ps1`, `build.bat`, `build.cmd`)**: `/dist/v2.1.0/` 하위(`web`, `win-x64`, `core-dll`, `unpacked`, `installer`)에 모든 산출물을 체계적으로 분리 적재.

---

## 🛠️ Build & Packaging Workflow

### 1. Web Edition (React + Vite)
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# TypeScript 정적 검사 및 프로덕션 번들 빌드 (dist/)
npm run lint
npm run build
```

### 2. Desktop Edition (C# WPF / .NET 10 & 8)
```powershell
# 통합 자동 빌드 스크립트 실행
.\build.ps1

# 빌드 결과물 (dist/v2.1.0/ 폴더 생성)
# ├── web/           (Vite 프로덕션 번들)
# ├── win-x64/       (C# WPF 데스크톱 실행 바이너리 KCertManager.exe & Lite)
# ├── core-dll/      (순수 독립 C# DLL KCert.Core.dll / KCert.Crypto.dll)
# ├── unpacked/      (클린 무설치 폴더 풀림 구조)
# └── installer/     (Inno Setup kcert-manager-v2.1.0-setup.exe)
```

---

## 🔒 Inno Setup Installer Specifications (`installer.iss`)

- **AppID**: `{{8F5B123A-4C2E-497B-902B-6277D8C7B8E1}}`
- **Installation Directory**: `{autopf}\K-Certificate Manager` (Unpacked Multi-File)
- **Silent Install Support**: `kcert-manager-v2.1.0-setup.exe /VERYSILENT /NORESTART`
- **Firewall Registration (netsh.exe)**:
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager"`
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager v2.1.0"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저 v2.1.0"`

---

## 📜 Official Channels & Developer Info

- **Developer**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **Company**: (주)청운정보시스템 ( cisnet.co.kr ) ([https://www.cisnet.co.kr](https://www.cisnet.co.kr))
- **Official Blog**: AhBi Vibe Log ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
- **GitHub Profile & Repository**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **License**: MIT License (Korean / English Dual License)
