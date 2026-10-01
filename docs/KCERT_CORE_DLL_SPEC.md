# KCert.Core.dll 순수 창작 코어 라이브러리 상세 기술 명세서

대한민국 공인/공동(NPKI), 행정전자서명(GPKI), 교육부(EPKI) 인증서 처리를 위해 순수 C#과 .NET 표준 암호화 프리미티브만으로 독자 설계·구현된 **`KCert.Core.dll`**의 내부 동작 원리, 모듈 아키텍처, 데이터 포맷 및 보안 인터페이스 명세서입니다.

---

## 📌 1. 라이브러리 개요 및 설계 철학

### 1.1 기본 정보
- **어셈블리 명칭**: `KCert.Core.dll`
- **버전**: `v1.4.5`
- **대상 프레임워크**: `.NET 10.0` (`net10.0-windows`) 및 `.NET 8.0` (`net8.0-windows`) 자동 호환
- **네임스페이스**: `KCert.Core.*`
- **저작권 및 개발자**: AhBiYout (CISNet: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/), 블로그: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
- **라이선스**: Free Use / MIT License — 한국어(`LICENSE_KR.txt`) 및 영어(`LICENSE_EN.txt`) 2종 정의 (공공·금융·기업·개인 무료 이용)

### 1.2 제로 외부 종속성 (Zero Third-Party Dependencies)
기존 인증서 도구들이 BouncyCastle이나 외부 폐쇄형 보안 모듈(ActiveX/NPAPI 잔재)에 의존했던 것과 달리, **`KCert.Core.dll`은 외부 서드파티 라이브러리를 단 하나도 참조하지 않습니다.**
- Windows 운영체제 표준 커널 암호화 제공자(`System.Security.Cryptography`)와 WMI 하드웨어 인터페이스(`System.Management`)만을 조합하여 경량성, 고속성 및 보안 감사의 투명성을 달성했습니다.
- 외부 라이브러리 취약점(CVE) 전파 위험을 근원적으로 차단합니다.

---

## 🏛️ 2. 4대 핵심 모듈 아키텍처

```
KCert.Core.dll
├── 1. Parser (KCert.Core.Parser)
│   ├── KoreanCertPolicyOids.cs    : 한국 5대 공인기관·GPKI·EPKI OID 역해석 엔진
│   ├── CertPairValidator.cs       : DER+KEY 무결성 및 X.509 유효성/만료 판별기
│   ├── KCertMetadata.cs           : 통합 메타데이터 모델 (소유자, 기관, 용도, 해시)
│   └── KCertParser.cs             : 원클릭 고속 메타데이터 추출 진입점
│
├── 2. Discovery (KCert.Core.Discovery)
│   ├── CertLocationScanner.cs     : Windows 표준 경로 및 안전 재귀 탐색 엔진
│   └── DiscoveredCertLocation.cs  : 발견된 물리적 파일 경로 및 드라이브 모델
│
├── 3. Vault (KCert.Core.Vault)
│   ├── CertTransferEngine.cs      : 원자적(Atomic) 2단계 안전 전송 및 해시 롤백 엔진
│   ├── CertVaultPacker.cs         : AES-256 + PBKDF2 암호화 금고(.kcertpack) 엔진
│   └── SafetyTrashManager.cs      : 오삭제 방지 안전 격리소 및 원클릭 복원 엔진
│
└── 4. HardwareGuard (KCert.Core.HardwareGuard)
    ├── UsbStorageGuard.cs         : WMI 실시간 USB 핫플러그(삽입/제거) 감시 엔진
    ├── UsbDriveInfoItem.cs        : 볼륨 라벨, 파일시스템(FAT32/NTFS), 용량 모델
    └── UsbDriveEventArgs.cs       : 600ms 지연 디바운스 이벤트 인자 모델
```

---

## 🔍 3. 모듈별 동작 원리 및 세부 명세

### 3.1 모듈 1: `KCert.Core.Parser` (한국형 정책 OID 및 인증서 무결성 판별)

#### 1) OID 역해석 메커니즘 (`KoreanCertPolicyOids.cs`)
대한민국 전자서명법에 따른 5대 공인인증기관(금융결제원, 코스콤, 한국정보인증, 한국전자인증, 한국무역정보통신)과 행정전자서명(GPKI), 교육부(EPKI)의 `Certificate Policies (2.5.29.32)` 확장 필드를 바이트 수준에서 검사하여 용도를 자동 분류합니다.

| 분류 | 기관 | 대표 OID | 해석 용도 |
| :--- | :--- | :--- | :--- |
| **NPKI** | 금융결제원 (yessign) | `1.2.410.200004.5.2.1.2`<br>`1.2.410.200004.5.1.1.5` | 개인 은행/신용카드/보험용<br>법인 기업 뱅킹용 |
| **NPKI** | 코스콤 (SignKorea) | `1.2.410.200004.5.1.1.7`<br>`1.2.410.200004.5.2.1.1` | 증권/선물/보험 거래용<br>범용(증권전용) |
| **NPKI** | 한국정보인증 (KICA) | `1.2.410.200004.5.2.1.7`<br>`1.2.410.200004.5.1.1.9` | 전자거래 범용 개인용<br>전자거래 범용 법인용 |
| **NPKI** | 한국전자인증 (CrossCert) | `1.2.410.200004.5.2.1.3` | 개인 범용 공동인증서 |
| **NPKI** | 한국무역정보통신 (TradeSign) | `1.2.410.200012.1.1.1` | 무역 EDI 및 전자세금계산서용 |
| **GPKI** | 정부공동인증센터 | `1.2.410.100001.5.1.1.1` | 행정전자서명 공무원용 |
| **EPKI** | 교육부인증센터 | `1.2.410.100001.5.2.1.1` | 교육행정 전자서명 (NEIS/교직원) |

#### 2) 공개키/개인키 쌍 무결성 검증 (`CertPairValidator.cs`)
- **ASN.1 매직 바이트 검사**: `signPri.key` 파일의 첫 바이트가 ASN.1 SEQUENCE(`0x30`)로 시작하는 PKCS#8 표준 암호화 블록인지 실시간 확인합니다.
- **최소 파일 크기 규격**: DER 인증서(최소 128B 이상) 및 암호화 개인키(최소 64B 이상) 규격을 확인하여 0바이트 깨짐 파일을 필터링합니다.
- **만료 상태 정밀 계산**: `NotBefore`(발효일)와 `NotAfter`(만료일)을 기준으로 다음 4가지 상태를 판별합니다:
  - `Valid`: 유효기간이 30일 초과 남아 있는 정상 인증서
  - `ExpiringSoon`: 유효기간이 30일 이내로 도래한 갱신 필요 인증서
  - `Expired`: 유효기간이 경과한 폐기 대상 인증서
  - `Corrupted`: 파일 헤더 손상으로 파싱이 불가능한 비정상 상태

---

### 3.2 모듈 2: `KCert.Core.Discovery` (지능형 표준 경로 자동 탐색)

#### 1) 표준 탐색 루트 집계 (`CertLocationScanner.cs`)
Windows 운영체제 상에서 인증서가 저장되는 모든 표준/비표준 위치를 결합합니다:
1. `C:\Users\{UserName}\AppData\LocalLow\{NPKI|GPKI|EPKI}` (가장 대표적 최신 경로)
2. `C:\Users\{UserName}\{NPKI|GPKI|EPKI}` (구버전 호환 경로)
3. `C:\{NPKI|GPKI|EPKI}` (루트 직하 구형 뱅킹 모듈 경로)
4. 모든 활성 이동식 디스크(USB) 루트: `{DriveLetter}:\{NPKI|GPKI|EPKI}`

#### 2) 접근 권한 방어형 안전 BFS 탐색
일반 `Directory.GetFiles(..., SearchOption.AllDirectories)` 호출 시 Windows 특수 시스템 디렉터리 접근 시 `UnauthorizedAccessException` 예외로 프로그램이 중단되는 문제를 완벽히 해결했습니다:
- 큐(Queue) 기반 BFS 순회 구조 채택
- `System Volume Information`, `$RECYCLE.BIN`, `Windows`, `Program Files` 등 접근 불가 시스템 폴더 목록 자동 배제
- 심볼릭 링크(Junction Point) 루프 방지 및 안전한 `try-catch` 스킵 처리

---

### 3.3 모듈 3: `KCert.Core.Vault` (암호화 금고 패키징 & 원자적 트랜잭션)

#### 1) 원자적 2단계 안전 복사 (`CertTransferEngine.cs`)
인증서 복사 중 USB가 갑자기 분리되거나 전원이 꺼지는 비정상 상황에서 파일이 손상되는 것을 방지하기 위해 트랜잭션 메커니즘을 적용했습니다:
```
[원본 디렉터리]                 [대상 디렉터리]
 signCert.der  ──(복사)──>  signCert.der.tmp
 signPri.key   ──(복사)──>  signPri.key.tmp
                                 │
                     [SHA-256 해시 대조]
                                 │
                  ┌──────────────┴──────────────┐
             (일치 시)                      (불일치 시)
                 ▼                              ▼
      원자적 Rename 확정                *.tmp 파일 즉시 파기
   signCert.der / signPri.key            (트랜잭션 롤백)
```

#### 2) 독자적 보안 백업 패키지 규격 (`.kcertpack` / `CertVaultPacker.cs`)
인증서 공개키와 개인키를 단일 파일로 압축 암호화하여 이동식 미디어나 클라우드에 안전하게 보관할 수 있는 바이너리 규격입니다.

**바이너리 헤더 및 구조 (Layout):**
```
+---------------+----------------+---------------+-------------------+----------------------+
| MAGIC (10B)   | Salt (16B)     | IV (16B)      | HMAC-SHA256 (32B) | AES-256-CBC Payload  |
| "KCERTPACK1"  | Cryptographic  | AES Init Vec  | Integrity Hash    | (Manifest + DER+KEY) |
+---------------+----------------+---------------+-------------------+----------------------+
```
- **키 유도 (KDF)**: `Rfc2898DeriveBytes` (PBKDF2) 알고리즘 적용, **100,000회(Iterations)** 반복 해싱으로 무차별 대입 공격(Brute Force) 방어
- **대칭 암호화**: `AES-256-CBC` (PKCS7 패딩)
- **무결성 서명 (MAC)**: 암호문과 Salt, IV를 결합한 `HMAC-SHA256` 태그를 생성하고, 복호화 시 상용 암호학 표준인 `CryptographicOperations.FixedTimeEquals`를 사용하여 타이밍 공격(Timing Attack)을 차단한 상태에서 유효성 검증

#### 3) 안전 휴지통 격리 시스템 (`SafetyTrashManager.cs`)
- 사용자의 실수에 의한 영구 삭제 사고를 차단하기 위해 원본 인증서를 `%LocalAppData%\KCertManager\SafetyTrash\{UUID}` 격리소로 안전 이동
- `trash_manifest.json`에 원본 경로(`OriginalDirectoryPath`), 소유자명, 삭제일시 기록
- 원클릭 즉시 복원(`Restore`) 시 원래 디렉터리 트리로 100% 원복

---

### 3.4 모듈 4: `KCert.Core.HardwareGuard` (무결성 USB 감시 및 파일시스템 가드)

#### 1) WMI 핫플러그 비동기 감시 (`UsbStorageGuard.cs`)
- WMI 쿼리 `SELECT * FROM Win32_VolumeChangeEvent`를 백그라운드 스레드에서 감시:
  - `EventType = 2`: 장치 삽입 (Device Arrival)
  - `EventType = 3`: 장치 제거 (Device Removal)
- **지능형 600ms 디바운스(Debounce)**: 윈도우 OS가 USB 드라이브를 인식한 직후 파일시스템 마운트가 완전히 완료되기 전에 접근하여 발생하는 I/O 오류를 방지하기 위해 600ms 동안 이벤트를 지연 통합 처리합니다.

#### 2) 파일시스템 및 쓰기 잠금 프로브 검사 (`CheckWritable`)
- 물리적 쓰기 금지 스위치가 켜진 USB나 NTFS 권한 잠금 상태를 감지하기 위해 임시 프로브 파일(`.kcert_probe_{guid}.tmp`)을 무해하게 생성 후 즉시 삭제하는 방식으로 쓰기 가능 여부를 검증합니다.

---

## 💻 4. 프로그래밍 인터페이스 (C# 활용 예제)

### 4.1 인증서 파싱 및 정책 판별
```csharp
using KCert.Core.Parser;

// 1. 단일 인증서 파일 또는 폴더 파싱
KCertMetadata? cert = KCertParser.Parse(@"C:\Users\Admin\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동");

if (cert != null)
{
    Console.WriteLine($"소유자: {cert.CommonName}");
    Console.WriteLine($"발급기관: {cert.Issuer}");
    Console.WriteLine($"체계 분류: {cert.SystemType}"); // NPKI, GPKI, EPKI
    Console.WriteLine($"용도: {cert.DisplayUsage}");      // 예: 개인 은행/보험용
    Console.WriteLine($"유효기간: {cert.ValidFrom:d} ~ {cert.ValidTo:d} ({cert.DaysRemaining}일 남음)");
    Console.WriteLine($"키페어 무결성: {cert.IsPairIntegrityValid} ({cert.IntegrityMessage})");
}
```

### 4.2 안전한 시스템 전역 인증서 자동 탐색
```csharp
using KCert.Core.Discovery;

var scanner = new CertLocationScanner();
var results = await scanner.DiscoverAllAsync();

foreach (var item in results)
{
    Console.WriteLine($"[{item.Category}] {item.DirectoryPath} (USB여부: {item.IsRemovableMedia})");
}
```

### 4.3 AES-256 금고 패키징 및 복원
```csharp
using KCert.Core.Vault;

string certDir = @"C:\Users\Admin\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동";
string vaultFile = @"D:\MyCertificates\backup_hong.kcertpack";

// 패키징 암호화
CertVaultPacker.PackCertificate(certDir, vaultFile, "MySecurePassword123!");

// 복원
var (success, msg, manifest) = CertVaultPacker.UnpackCertificate(
    vaultFile,
    @"C:\Users\Admin\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동",
    "MySecurePassword123!");
```

---

## 🛡️ 5. 보안 감사 및 규정 준수 (Security & Compliance)

1. **메모리 내 평문 격리**: 개인키 복호화 비밀번호는 전송이나 파일에 영구 기록되지 않으며 암호화 루틴 완료 즉시 메모리에서 해제됩니다.
2. **원격 전송 제로 (0% Outbound Network)**: `KCert.Core.dll`의 어떤 클래스도 `System.Net` 또는 네트워크 소켓을 생성하지 않으며 외부 인터넷 통신을 엄격히 금지합니다.
3. **무차별 대입 및 변조 방지**: PBKDF2(100,000 iters) + AES-256 + HMAC-SHA256 결합 구조로 데이터 변조 시 복호화를 즉시 차단합니다.

---

## 📦 6. 빌드 및 배포 산출물

- **솔루션 프로젝트**: `/src-wpf/KCert.Core/KCert.Core.csproj`
- **컴파일 결과물**: `release/05_WpfDesktop/KCert.Core.dll`
- **배포 인스톨러 연동**: Inno Setup (`installer.iss`) 및 `build.bat` 5단계 빌드 시 자동으로 컴파일되어 단독 DLL 및 WPF 앱에 포함됩니다.
