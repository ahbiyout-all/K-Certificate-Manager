# K-인증서 매니저 C# WPF MVVM 데스크톱 버전 개발 가이드

K-Certificate Manager (K-인증서 매니저)의 **C# .NET 10 / .NET 8 WPF MVVM 네이티브 윈도우 데스크톱 애플리케이션 (`v1.4.2`)** 아키텍처 및 빌드 가이드입니다.

---

## 🏗️ 1. 프로젝트 아키텍처 (MVVM Pattern)

```
KCertManager.sln (솔루션 파일)
├── src-wpf/KCert.Core/               # 순수 창작 코어 라이브러리 (KCert.Core.dll)
│   ├── KCert.Core.csproj             # .NET 10.0 / .NET 8.0 제로 외부의존성 코어 DLL 프로젝트
│   ├── Common/                       # 사용자 친화적 한국어 예외 변환기 (UserFriendlyError.cs)
│   ├── Parser/                       # 한국 5대기관·GPKI·EPKI OID 역해석 및 정밀 무결성 검증 (512KB DoS 가드 포함)
│   │   ├── KoreanCertPolicyOids.cs
│   │   ├── CertPairValidator.cs
│   │   ├── KCertMetadata.cs
│   │   └── KCertParser.cs
│   ├── Discovery/                    # Windows 전역 & 이동식 디스크 안전 BFS 자동 탐색
│   │   ├── DiscoveredCertLocation.cs
│   │   └── CertLocationScanner.cs
│   ├── Vault/                        # 화이트리스트 원자적 전송, Path Traversal 방어, 안전 휴지통
│   │   ├── CertTransferEngine.cs
│   │   └── SafetyTrashManager.cs
│   └── HardwareGuard/                # WMI 핫플러그 실시간 감시 & 600ms 디바운스
│       └── UsbStorageGuard.cs
│
└── src-wpf/KCertManager.Wpf/         # 데스크톱 MVVM UI 애플리케이션
    ├── KCertManager.Wpf.csproj       # KCert.Core 프로젝트 참조 연동 (.NET 10 / .NET 8 멀티 타깃)
    ├── App.xaml / App.xaml.cs        # 전역 리소스, 4종 컬러 테마 및 TitleBar 버튼 스타일
    ├── Common/
    │   ├── ViewModelBase.cs          # INotifyPropertyChanged 기본 구현체
    │   └── RelayCommand.cs           # ICommand 커맨드 바인딩 래퍼
    ├── Models/
    │   ├── CertificateItem.cs        # 인증서 정보 (GPKI, EPKI, NPKI, 만료/무결성 상태)
    │   ├── DriveItem.cs              # USB 이동식 및 로컬 디스크 정보
    │   ├── BackupHistoryItem.cs      # 백업 이력 및 SHA-256 검증
    │   └── TrashItem.cs              # 휴지통 및 실행 취소 복원 모델
    ├── Services/
    │   ├── CertificateScannerService.cs  # KCert.Core.Discovery & Parser 위임 호출
    │   ├── CertificateBackupService.cs   # KCert.Core.Vault 원자적 전송 & 격리 위임
    │   ├── UsbDriveWatcher.cs            # KCert.Core.HardwareGuard 핫플러그 위임
    │   └── UserFriendlyMessageHelper.cs  # 한국어 친화적 오류/해결 방법 안내 대화상자 도우미
    ├── ViewModels/
    │   ├── MainViewModel.cs          # 메인 화면 상태, 4종 테마 전환, 검색/필터링, 백업/삭제
    │   └── UsbTransferViewModel.cs   # USB ➔ PC 역방향 가져오기 다이얼로그 뷰모델
    └── Views/
        ├── MainWindow.xaml / .cs     # 모던 일체형 타이틀바(WindowChrome) 메인 WPF 윈도우 UI
        ├── UsbTransferDialog.xaml / .cs  # USB ➔ PC 가져오기 창
        ├── RenewalGuidanceDialog.xaml / .cs # 인증서 갱신 안내 및 공식 포털 연결 창
        └── AboutDialog.xaml / .cs    # 프로그램 정보 및 한·영 2종 라이선스 고지 창
```

> 📖 `KCert.Core.dll`의 상세 내부 메커니즘, OID 표 및 보안 하드닝 구조는 [`KCERT_CORE_DLL_SPEC.md`](./KCERT_CORE_DLL_SPEC.md)를 참조하세요.

---

## ⚡ 2. 핵심 기능 및 기술 구현 특징

1. **모던 일체형 타이틀바 (`WindowChrome`) & 4종 테마**:
   - Windows 기본 흰색 타이틀바를 제거하고, 앱 내부 헤더(`🛡️ K-인증서 매니저 v1.4.2`) 우측에 최소화(`─`), 최대화/복원(`□`/`❐`), 종료(`✕`) 버튼을 일체화.
   - 다크 · 회색 · 화이트 · 베이지 4가지 테마 전환 시 타이틀바부터 하단 상태바까지 완벽 색상 동기화.
2. **순수 C# X.509 파서 (`System.Security.Cryptography.X509Certificates`)**:
   - `signCert.der` 바이너리로부터 Subject DN, CN, 발급자(CA), 유효기간, 일련번호, 암호 알고리즘을 네이티브로 직접 추출 (512KB 초과 비정상 파일 DoS 방어 포함).
3. **화이트리스트 기반 무결성 전송 (SHA-256 & Path Traversal 차단)**:
   - `.der`, `.cer`, `.crt`, `.key`, `.pri`, `.pfx`, `.p12`, `.pem` 확장자만 선별 복사하여 악성 실행파일 동반 복사를 차단하고, `Path.GetFullPath` 정규화로 상위 경로 이탈을 원천 방어.
4. **실시간 USB 핫플러그 감지 (`System.Management` WMI)**:
   - `Win32_VolumeChangeEvent`를 구독하여 USB 메모리를 꽂거나 뽑는 즉시 드라이브 콤보박스 및 목록 자동 갱신.
5. **역방향 가져오기 (USB ➔ PC) 및 안전 휴지통 (`SafetyTrash`)**:
   - USB 내의 `NPKI`, `GPKI`, `EPKI` 폴더를 스캔하여 로컬 PC의 `AppData\LocalLow` 경로로 자동 복원 및 삭제 시 안전 격리/원클릭 복원 지원.

---

## 🚀 3. 빌드 및 실행 방법

### 요구 사항
- **Windows 10 / 11 (x64 / ARM64)**
- **.NET 10.0 SDK** 또는 **.NET 8.0 SDK** (Visual Studio 2022 이상)

### 📦 2가지 배포 바이너리 비교 (Full vs Lite)

| 구분 | 파일명 | 예상 용량 | .NET 런타임 설치 필요 여부 | 특징 및 권장 환경 |
| :--- | :--- | :--- | :--- | :--- |
| **데스크톱 풀버전** | `KCertManager_v1.4.2.exe` | **약 60~75MB** | **불필요 (완전 단독 실행)** | .NET 런타임 및 WPF 라이브러리가 내장된 독립 실행형(Self-Contained). 모든 윈도우 PC에서 바로 실행 가능. |
| **라이트 에디션** | `KCertManager-Lite_v1.4.2.exe` | **약 1~2MB** | **필요 (.NET Desktop Runtime)** | 초경량 프레임워크 종속형(Framework-Dependent). 네트워크 전송 및 USB 보관에 최적화된 초소형 바이너리. |

> 💡 **두 파일의 용량이 동일(약 1~2MB)하게 나오는 경우 원인 및 해결책:**
> - `build.bat` 실행 시 로컬 환경에 `.NET 8 win-x64 런타임 팩`이 캐시되어 있지 않으면, 1차 독립실행형 빌드가 프레임워크 종속 모드로 자동 폴백되어 두 파일이 모두 라이트 버전과 동일한 옵션으로 빌드됩니다.
> - **해결 방법**: 인터넷이 연결된 상태에서 아래 명령어를 1회 실행하여 런타임 팩을 복원한 후 다시 빌드하면 정상적으로 65MB 풀버전이 생성됩니다:
>   ```cmd
>   dotnet restore src-wpf\KCertManager.Wpf\KCertManager.Wpf.csproj -r win-x64
>   ```

### CLI 명령어로 직접 빌드하기
```powershell
# 프로젝트 폴더 이동
cd src-wpf/KCertManager.Wpf

# 1. 풀버전 독립 실행형(Self-Contained) 빌드 (~65MB)
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -o ../../release/05_WpfDesktop

# 2. 라이트버전 프레임워크 종속형(Framework-Dependent) 빌드 (~1.5MB)
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o ../../release/05_WpfLite
```

---

## 🏢 4. 문의 및 라이선스 정보

- **소프트웨어**: K-Certificate Manager (K-인증서 매니저)
- **저작권자**: AhBiYout ([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
- **기술 지원**: cisnet.co.kr ([http://www.cisnet.co.kr/](http://www.cisnet.co.kr/))
- **라이선스**: 무료 배포 및 사용 허가 (Free License)
