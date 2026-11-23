# 🐙 GitHub Documentation: K-Certificate Manager (K-인증서 매니저) v2.2.0

---

## 📌 Overview & Repository Structure

**K-Certificate Manager (K-인증서 매니저)**는 대한민국 공무원 행정전자서명(GPKI/EPKI/MPKI) 및 금융 공동인증서(NPKI)를 자동 탐색하고, PC와 이동식 USB 메모리 간에 양방향으로 안전하게 복사·백업·복원하는 오픈소스 보안 관리 도구입니다.

### 🌟 Key Features in v2.2.0
1. **3-Stage Non-Blocking Startup Scan & WMI Drive Hardening (`FastScanPipeline.cs`, `CertLocationScanner.cs`, `CertificateScannerService.cs`, `MainViewModel.cs`)**:
   - `0단계 Local Fast-Pass` ➔ `1단계 Drive Fast-Pass` ➔ `2단계 Deep-Pass` 비차단 분리 스캔과 OS `DriveType` 필터링, 병렬 바운디드 드라이브 준비 검사(`IsDriveReadyBounded`), 단일 `DrivesChanged` 디바운스 구독으로 앱 시작 직후 `응답없음` 현상을 근본 해소.
2. **2026 Korea Cert Trends Guide & RSA 3072-bit Security Posture (`certParser.ts`, `KoreanCertPolicyOids.cs`, `SecurityGuideModal.tsx`, `SecurityGuideDialog.xaml`, `DiagnosticsRepairModal.tsx`, `DiagnosticsRepairDialog.xaml`)**:
   - 오프라인 X.509 ASN.1 파서로 공개키 비트 길이(1024/2048/3072/4096-bit, ECDSA)와 서명 알고리즘을 분석해 `3072-bit 권장` / `2048-bit 전환 대상` / `1024-bit·SHA-1 취약` 3단계 진단 및 `보안강도 점검 (3072-bit)` 탭 제공.
   - 2027.02.15 5대 공동인증기관 RSA 3072-bit 전환, GPKI·EPKI 비액티브엑스(HTML5)·모바일 공무원증 병행, 금융·간편인증 비교, 2026.08.28 전자정부법 시행령 모바일 신분증 8종 동향 수록 (`SecurityGuideModal` / `SecurityGuideDialog`).
3. **Comprehensive Audit & Accuracy Fixes (Work Orders 191–195)**:
   - 개인 성명(`김지원`, `이정원` 등) `(기관용)` 오분류 교정 (`KCertParser.cs`, `certParser.ts`), `CertIntegrityDoctor` 동적 키 파일명 & GPKI/EPKI `cn=` 표준 경로 정밀화, `RenewalGuidanceDialog`/`renewalStore` 발급기관(Issuer) 우선 매칭으로 NPKI 오매칭 차단.
   - WPF `DispatchSafeAsync` 스레드 안전성·`OpenTargetDrivePickerForCertificatesAsync`·`SafeGetFullPath`·`SearchLocationsDialog` Fast-Pass 유지 및 Web 비동기 클립보드·새로고침 시퀀스 가드·`targetDrive` 널 안전성·기관 콜센터 번호 정합화.
   - **저눈부심 회색(*Misty Mineral Slate*) · 베이지(*Warm Oat Paper*) 테마 & 3중 선택 격리(Work Order 194)**: Tailwind v4 `@custom-variant dark` 교정 및 WPF `DynamicResource` 브러시 전 창 대비 통일, `selectedIds ∩ visibleCertificates` (`FilteredCertificates`) 교집합 기반 정밀 선택 복사 및 WPF 시작 테마 영속화 적용.
   - **5차 수명주기 · 전 창 테마 대비 완성(Work Order 195)**: `WpfAnimatedBorderHelper` 카드 휘도 적응형 선택 배경(`SelectedRowBgBrush`), `MainWindow` `CurrentTheme` 사이드바 테두리 실시간 동기화, `UsbTransferViewModel` `IDisposable` 핸들러 해제, WPF 6대 `DataGrid`·8종 다이얼로그/모델(`DataTrigger` 포함) 및 Web 7대 컴포넌트 CSS 토큰 대비 일원화 완료.
4. **Class1 Institutional Certificate Pairing, Badges & Sidebar Filter (`CertLocationScanner.cs`, `Sidebar.tsx`, `CertificateList.tsx`, `MainWindow.xaml`)**:
   - `C:\GPKI\Certificate\class1`, EPKI, USB `class1` 경로에서 개인키(`.key`/`.pri`) 쌍을 보유한 실사용 기관·특수목적 인증서만 선별 표시하고 `CLASS1 · 공무원(GPKI)` / `CLASS1 · 교육(EPKI)` / `CLASS1 · 기관` 배지 및 `'CLASS1'` 필터 제공.
5. **In-App Auto-Download & Silent Self-Update (`UpdateCheckerService.cs`, `updateChecker.ts`)**: 업데이트 창에서 확인 클릭 시 GitHub 웹페이지로 이동하지 않고 설치 패키지를 직접 다운로드·검증(PE `MZ` / SHA-256) 후 무인 셀프 설치(`/SILENT`) 및 자동 재실행까지 원스톱 처리.
6. **WPF-Web Visual Parity, Pure C# Core DLL & Encrypted Vault (`KCert.Core.dll`, `KCert.Crypto.dll`)**:
   - 통합 다크 테마(`#0F1219`), 반응형 CSS Grid `auto-fill` 카드 뷰, 쉬운 일상 표현 + `더보기`, 외부 의존성 0% 순수 X.509/ASN.1 & SEED-128/ARIA/RSA-SHA256 라이브러리, DPAPI/AES-256 보호 보관함 및 제한된 USB 복구(`💾 USB로 복구`) 제공.
7. **Inno Setup Production Installer (`installer.iss`) & Version-Numbered Build Pipeline**: Unpacked Multi-File 설치, 기존 프로세스 안전 종료(`TerminateAppProcesses`), 방화벽 규칙 사전 자동 등록, `/VERYSILENT /NORESTART` 무인 설치 및 `/dist/v2.2.0/` 모듈별 분리 출력 지원.

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

# 빌드 결과물 (dist/v2.2.0/ 폴더 생성)
# ├── web/           (Vite 프로덕션 번들)
# ├── win-x64/       (C# WPF 데스크톱 실행 바이너리 KCertManager.exe & Lite)
# ├── core-dll/      (순수 독립 C# DLL KCert.Core.dll / KCert.Crypto.dll)
# ├── unpacked/      (클린 무설치 폴더 풀림 구조)
# └── installer/     (Inno Setup kcert-manager-v2.2.0-setup.exe)
```

---

## 🔒 Inno Setup Installer Specifications (`installer.iss`)

- **AppID**: `{{8F5B123A-4C2E-497B-902B-6277D8C7B8E1}}`
- **Installation Directory**: `{autopf}\K-Certificate Manager` (Unpacked Multi-File)
- **Silent Install Support**: `kcert-manager-v2.2.0-setup.exe /VERYSILENT /NORESTART`
- **Firewall Registration (netsh.exe)**:
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager"`
  - `netsh.exe advfirewall firewall add rule name="K-Certificate Manager v2.2.0"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저"`
  - `netsh.exe advfirewall firewall add rule name="K-인증서 매니저 v2.2.0"`

---

## 📜 Official Channels & Developer Info

- **Developer**: AhBiYout (GitHub: [@AhBiYout-all](https://github.com/AhBiYout-all))
- **Company**: (주)청운정보시스템 ( cisnet.co.kr ) ([https://www.cisnet.co.kr](https://www.cisnet.co.kr))
- **Official Blog**: AhBi Vibe Log ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
- **GitHub Profile & Repository**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **License**: MIT License (Korean / English Dual License)
