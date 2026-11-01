# KCert.Core.dll 주요 설계 사양서 (Core Design Specification)

> **소프트웨어 명칭**: K-인증서 매니저 (K-Certificate Manager)  
> **핵심 컴포넌트**: `KCert.Core.dll` (v1.7.2 / Core v1.4.5)  
> **개발자**: AhBiYout (CISNet: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/), 블로그: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))  
> **대상 프레임워크**: `.NET 8.0` (`net8.0-windows`) & `.NET 10.0` (`net10.0-windows`) 멀티 타깃  
> **의존성 규격**: 외부 서드파티 라이브러리 참조 0개 (**Zero Third-Party Dependency**, Pure C# Managed Implementation)  
> **문서 상태**: 공식 승인 아키텍처 사양서 (Production Grade Approved)

---

## 📑 목차 (Table of Contents)

1. [시스템 개요 및 설계 철학](#1-시스템-개요-및-설계-철학)
2. [기능 명세 (Functional Specifications)](#2-기능-명세-functional-specifications)
   - 2.1 Parser 서브시스템 (`KCert.Core.Parser`)
   - 2.2 Discovery 서브시스템 (`KCert.Core.Discovery`)
   - 2.3 Diagnostics 서브시스템 (`KCert.Core.Diagnostics`)
   - 2.4 Vault 서브시스템 (`KCert.Core.Vault`)
   - 2.5 HardwareGuard 서브시스템 (`KCert.Core.HardwareGuard`)
   - 2.6 Common 서브시스템 (`KCert.Core.Common`)
3. [동작 원리 (Operating Principles & Internal Mechanisms)](#3-동작-원리-operating-principles--internal-mechanisms)
   - 3.1 무할당(Zero-Allocation) 순수 ASN.1 DER TLV 바이트 파싱
   - 3.2 7비트 VLQ 기반 OID 역해석 알고리즘
   - 3.3 PKCS#8 개인키 파라미터 구조 분석
   - 3.4 2단계 분리형(Fast-Pass / Deep-Pass) 초고속 스캔 파이프라인
   - 3.5 Win32 네이티브 `DeviceIoControl` 스토리지 버스 식별
   - 3.6 원자적 2단계 파일 전송 및 SHA-256 무결성 롤백 트랜잭션
   - 3.7 비표준·중첩 폴더 정규화(Canonical Auto-Repair) 치료 원리
4. [데이터 흐름 (Data Flow Architecture)](#4-데이터-흐름-data-flow-architecture)
   - 4.1 엔드투엔드 전체 라이프사이클 데이터 파이프라인
   - 4.2 스토리지 탐색 및 메타데이터 파싱 흐름
   - 4.3 인증서 안전 전송 및 백업 트랜잭션 흐름
   - 4.4 결함 진단 및 1클릭 표준화 치료 흐름
   - 4.5 PFX 번들 변환 및 `KCert.Crypto` 상호 운용 흐름
5. [에러 처리 전략 (Error Handling Strategy & Fault Tolerance)](#5-에러-처리-전략-error-handling-strategy--fault-tolerance)
   - 5.1 계층화된 무중단 방어 원칙 (Fail-Safe Non-Blocking Design)
   - 5.2 파일 시스템 및 I/O 예외 대응 매트릭스
   - 5.3 암호학적 변조 및 바이너리 손상 방어
   - 5.4 기술적 예외를 사용자 조치 가이드로 변환하는 `UserFriendlyError` 10대 패턴
6. [.NET 8 WPF 환경과의 연동 방식 (Integration with .NET 8 / WPF)](#6-net-8-wpf-환경과의-연동-방식-integration-with-net-8--wpf)
   - 6.1 비동기 작업 패턴 (TAP, Task-based Asynchronous Pattern) 및 CancellationToken
   - 6.2 UI 스레드 분리 및 Dispatcher 안전성 보장
   - 6.3 MVVM 패턴 (`ViewModelBase`, `RelayCommand`, `ObservableCollection<T>`) 바인딩 연계
   - 6.4 WPF 서비스 계층과의 결합도 최소화 구조
   - 6.5 단일 파일 배포 (`PublishSingleFile`) 최적화
7. [공용 API 레퍼런스 및 C# 코드 예제](#7-공용-api-레퍼런스-및-c-코드-예제)

---

## 1. 시스템 개요 및 설계 철학

`KCert.Core.dll`은 대한민국 공인/공동인증서(NPKI), 정부/행정전자서명(GPKI), 교육기관전자서명(EPKI), 국방전자서명(MPKI) 체계 전반을 로컬 환경에서 안전하게 관리하기 위해 순수 C#으로 100% 독자 설계된 핵심 엔진 라이브러리입니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   KCert.Core.dll 시스템 아키텍처                       │
├────────────────────────────────────────────────────────────────────────┤
│  [Parser]          [Discovery]        [Diagnostics]      [Vault]       │
│  - KCertParser     - FastScanPipeline - CertIntegrityDoctor - Transfer │
│  - Asn1Reader      - CertScanner      - AntiDuplication  - BundleSec   │
│  - KeyAnalyzer     - LocationModel    - ExpirationAlarm  - VaultPacker │
│  - PolicyOids                                            - SafetyTrash │
├────────────────────────────────────────────────────────────────────────┤
│  [HardwareGuard]                      [Common]                         │
│  - NativeStorageInterop (Win32)       - UserFriendlyError (10 Patterns)│
│  - UsbStorageGuard (WMI Event)        - CertSanitizer (PII Masking)    │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ (연동)
┌───────────────────────────────────┴────────────────────────────────────┐
│  KCert.Crypto.dll (순수 암호화 엔진 듀오)                              │
│  - KisaSeedEngine (RFC 4269)          - KisaAriaEngine (RFC 5794)      │
│  - KCertPrivateKeyDecryptor           - KCertVidEngine (영지식 VID)    │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 핵심 설계 철학
1. **제로 외부 의존성 (Zero Third-Party Dependencies)**:  
   BouncyCastle이나 구형 ActiveX/NPAPI 네이티브 바이너리를 일절 사용하지 않습니다. .NET 8/10 런타임의 표준 기본 클래스 라이브러리(BCL)와 Windows 네이티브 API만을 사용하여 보안 취약점 공격 벡터(Supply Chain Attack)를 근본적으로 차단합니다.
2. **에어갭 보안 (Air-Gapped & Offline Ready)**:  
   원격 네트워크 통신 네임스페이스(`System.Net`) 코드가 완전히 배제된 순수 로컬 전용 라이브러리로, 군부대, 금융사 폐쇄망, 정부 행정망에서도 어떠한 데이터 유출 우려 없이 안전하게 실행됩니다.
3. **무할당 고속 처리 (Zero-Allocation High Performance)**:  
   수천 개의 파일과 디렉터리를 순회할 때 발생하는 가비지 컬렉터(GC) 압력을 최소화하기 위해 ASN.1 바이너리를 메모리 복사 없이 포인터 및 오프셋 기반으로 직접 해석합니다.
4. **결함 허용성과 사용자 중심성 (Fault Tolerance & Usability)**:  
   손상된 인증서, 중첩된 디렉터리, 권한 거부 드라이브 등 열악한 환경에서도 프로그램이 비정상 종료(Crash)되지 않으며, 사용자에게 명확한 해결 가이드를 제공합니다.

---

## 2. 기능 명세 (Functional Specifications)

`KCert.Core.dll`은 총 6개 네임스페이스의 18개 핵심 클래스로 분할 구성되어 있습니다.

### 2.1 Parser 서브시스템 (`KCert.Core.Parser`)

| 클래스/타입 | 주요 메서드 및 인터페이스 | 기능 설명 |
| :--- | :--- | :--- |
| **`KCertParser`** | `Parse(string derOrFolderPath)`<br/>`ParseFromBytes(byte[] derBytes, string folderPath)` | 단일 인증서 파일(`.der`) 또는 인증서 폴더 경로를 수신하여 서명 체계(NPKI/GPKI/EPKI), 발급기관, 주체명(CN), 유효기간, 잔여일수, 지문(SHA-256)이 담긴 `KCertMetadata`를 생성. |
| **`KCertAsn1Reader`** | `ReadTlv(byte[] data, ref int offset)`<br/>`ExtractAllOids(byte[] derBytes)`<br/>`DecodeOid(byte[] rawData, int offset, int length)` | ITU-T X.690 DER 인코딩 바이트 스트림을 순차 탐색하여 Tag, Length, Value를 분해하고 정책 식별자(OID)를 디코딩. |
| **`KCertKeyAnalyzer`** | `AnalyzeKeyFile(string keyPath)`<br/>`AnalyzeKeyBytes(byte[] keyBytes)` | 개인키 파일(`signPri.key`)의 PKCS#8 구조를 파싱하여 대칭키 알고리즘(SEED-CBC, ARIA, 3DES, AES), PBKDF2 Salt(바이트수), 반복 횟수(Iterations), IV 규격을 분석. |
| **`KoreanCertPolicyOids`** | `ClassifyOid(string oid)`<br/>`GetAllSupportedOids()` | 국내 8대 공인인증기관(yessign, signgate, crosscert, tradesign, inipass, KICA) 및 행정(GPKI), 교육(EPKI), 국방(MPKI) 고유 OID를 분류하여 용도(은행용, 범용, 전자세금용 등) 매핑. |
| **`CertPairValidator`** | `ValidatePair(string derPath, string keyPath)`<br/>`CheckExpiration(DateTime notAfter)` | 공개키 인증서와 개인키의 파일 존재 여부, 파일 헤더 유효성, 날짜 만료 여부 및 구조적 이상 유무를 사전 검증. |

### 2.2 Discovery 서브시스템 (`KCert.Core.Discovery`)

| 클래스/타입 | 주요 메서드 및 인터페이스 | 기능 설명 |
| :--- | :--- | :--- |
| **`FastScanPipeline`** | `ScanFastAsync(CancellationToken ct)`<br/>`ScanDeepBackgroundAsync(Action<DiscoveredCertLocation> onFound, ...)` | **2단계 분리형 스캔 파이프라인**.<br/>- 1단계 (Fast-Pass): 표준 경로(`LocalLow\NPKI` 등)를 0.05~0.1초 내에 병렬 스캔하여 UI에 즉시 로딩.<br/>- 2단계 (Deep-Pass): C:, D:, 외장 드라이브의 심층 폴더를 백그라운드에서 실시간 스트리밍 탐색. |
| **`CertLocationScanner`** | `GetStandardRoots()`<br/>`ScanDriveFast(DriveInfo drive, ...)`<br/>`ScanDriveDeep(DriveInfo drive, ...)` | Windows 시스템 드라이브 및 외장 드라이브의 디렉터리 트리를 순회하며 `signCert.der`를 안전하게 탐색. 접근 거부(`UnauthorizedAccessException`) 폴더는 무시하고 계속 진행. |
| **`DiscoveredCertLocation`** | `DerFilePath`, `KeyFilePath`, `KmDerPath`, `KmKeyPath`, `DriveLetter`, `IsStandardPath`, `MediaKind` | 디스크에서 탐지된 인증서 구성 파일들의 절대 경로 및 매체 분류(로컬 고정 디스크, USB 이동식 디스크) 모델. |

### 2.3 Diagnostics 서브시스템 (`KCert.Core.Diagnostics`)

| 클래스/타입 | 주요 메서드 및 인터페이스 | 기능 설명 |
| :--- | :--- | :--- |
| **`CertIntegrityDoctor`** | `Diagnose(string folderPath)`<br/>`RepairToStandardHierarchy(string source, string destRoot)` | - **진단**: 중첩 폴더(`.../NPKI/NPKI/...`), 개인키 누락, 0바이트 손상, ASN.1 헤더 깨짐, 만료, 비표준 경로 등 9대 이상 징후(`CertAnomalyFlags`) 판별.<br/>- **치료**: 비표준/중첩 폴더를 표준 계층 구조(`NPKI/{Issuer}/USER/cn=...`)로 재배치하고 읽기 전용 속성 자동 해제. |
| **`KCertAntiDuplicationEngine`**| `AnalyzeDuplicates(IEnumerable<KCertMetadata> certs)` | 전체 드라이브에 걸쳐 산재된 동일 인증서(SHA-256 지문 및 일련번호 일치)를 그룹화하고 중복 잉여 파일 정리 시 회수 가능한 디스크 용량 계산. |
| **`CertExpirationAlarmEngine`** | `EvaluateRisk(DateTime validTo)` | 만료일까지 남은 일수를 기준으로 위험 등급(만료, 7일 이내 임박, 30일 이내 주의, 정상) 판정 및 사용자 경고 플래그 생성. |

### 2.4 Vault 서브시스템 (`KCert.Core.Vault`)

| 클래스/타입 | 주요 메서드 및 인터페이스 | 기능 설명 |
| :--- | :--- | :--- |
| **`CertTransferEngine`** | `Transfer(string srcDir, string targetDrive, string relPath)`<br/>`ResolveRelativePath(string fullPath)` | - **원자적 전송**: 임시 파일(`.tmp`) 복사 ➔ 읽기 전용 속성 해제 ➔ 원자적 이동 ➔ SHA-256 무결성 전수 검증.<br/>- **보안 하드닝**: 확장자 화이트리스트 검사, 상위 경로 조작(Path Traversal `..`) 차단, 자가 복사 금지. |
| **`CertBundleSecurityEngine`**| `ExportToPfx(string der, string key, string pfx, string pass)`<br/>`ExtractDerFromPfx(string pfx, string pass, string outDir)` | - 분리형 한국 인증서(`signCert.der` + `signPri.key`)를 국제 표준 PKCS#12 (`.pfx` / `.p12`) 포맷으로 결합 내보내기 (`KCert.Crypto` 복호화 연동).<br/>- PFX 번들에서 공개키 및 개인키를 무손실 분리 추출. |
| **`CertVaultPacker`** | `Pack(IEnumerable<string> certDirs, string vaultPath, string pass)`<br/>`Unpack(string vaultPath, string pass, string targetRoot)` | PBKDF2(100,000회 스트레칭) 및 AES-256-GCM 인증 암호화 기반 보안 금고(`.kcertpack`) 패키징 및 복원. |
| **`SafetyTrashManager`** | `MoveToTrash(string certDir)`<br/>`RestoreFromTrash(TrashItem item)`<br/>`PurgeTrash()` | 인증서 오삭제 시 즉시 삭제하지 않고 안전 격리 보관소(`SafetyTrash`)로 이동하여 1클릭 원위치 복원 및 감사 로그 기록 지원. |

### 2.5 HardwareGuard 서브시스템 (`KCert.Core.HardwareGuard`)

| 클래스/타입 | 주요 메서드 및 인터페이스 | 기능 설명 |
| :--- | :--- | :--- |
| **`NativeStorageInterop`** | `QueryBusType(string driveLetter)`<br/>`IsRemovableBus(string driveLetter)` | Win32 `Kernel32.dll`의 `CreateFile` 및 `DeviceIoControl`(`IOCTL_STORAGE_QUERY_PROPERTY`)을 직접 호출하여 드라이브의 실제 물리 버스(`BusTypeUsb`, `BusTypeNvme`, `BusTypeSata`)를 정확히 판별. |
| **`UsbStorageGuard`** | `StartMonitoring()`<br/>`StopMonitoring()`<br/>`event EventHandler<UsbDriveEventArgs> DrivesChanged` | WMI `__InstanceCreationEvent` 및 `__InstanceDeletionEvent`를 비동기 구독하여 USB 연결/해제를 실시간 감지하고 300ms 디바운스 필터를 거쳐 UI에 통지. |
| **`UsbDriveInfoItem`** | `DriveLetter`, `VolumeLabel`, `FileSystem`, `TotalSize`, `FreeSpace`, `BusType`, `IsReadOnlyLocked` | 드라이브의 볼륨 라벨, 파일시스템(FAT32/NTFS/exFAT), 용량 정보 및 물리적 쓰기 금지(Lock) 상태를 제공하는 데이터 모델. |

### 2.6 Common 서브시스템 (`KCert.Core.Common`)

| 클래스/타입 | 주요 메서드 및 인터페이스 | 기능 설명 |
| :--- | :--- | :--- |
| **`UserFriendlyError`** | `Explain(Exception ex, string context)` | 시스템/파일/보안 관련 복잡한 원시 예외(`UnauthorizedAccessException`, `IOException`, `CryptographicException` 등)를 10가지 범주의 사용자 눈높이 해결 가이드(`UserErrorMessage`)로 변환. |
| **`CertSanitizer`** | `MaskPersonalIdentifier(string raw)`<br/>`ParseCleanSubject(string rawCn)`<br/>`SanitizeFileSystemName(string name)` | 인증서 주체명에 포함된 주민등록번호(`******-*******`) 및 사업자번호 마스킹 처리, 파일시스템에 허용되지 않는 특수문자 안전 정제. |

---

## 3. 동작 원리 (Operating Principles & Internal Mechanisms)

### 3.1 무할당(Zero-Allocation) 순수 ASN.1 DER TLV 바이트 파싱

인증서(`.der`) 및 개인키(`.key`)는 ITU-T X.690 표준의 DER(Distinguished Encoding Rules) 형식으로 부호화되어 있습니다. 기존 라이브러리들이 전체 트리를 객체 그래프로 역직렬화하여 메모리를 낭비하던 것과 달리, `KCertAsn1Reader`는 0-Allocation 기반 바이트 포인터 순회 방식을 적용합니다.

```
+-----------+---------------------------------+---------------------------------+
| Tag (1B)  | Length (1~5 바이트)             | Value (L 바이트의 원시 페이로드) |
+-----------+---------------------------------+---------------------------------+
```

1. **Tag 파싱**: 1바이트를 읽어 클래스, 형태(Primitive vs Constructed), 태그 번호를 식별합니다.
   - `0x30`: SEQUENCE (Constructed)
   - `0x06`: OBJECT IDENTIFIER (Primitive)
   - `0x04`: OCTET STRING (Primitive)
2. **Length 파싱 (Definite Length Form)**:
   - **Short Form**: 최상위 비트(MSB)가 0인 경우 (`byte < 0x80`), 해당 바이트 자체가 데이터 길이($0 \sim 127$).
   - **Long Form**: 최상위 비트(MSB)가 1인 경우, 하위 7비트(`byte & 0x7F`)가 길이를 나타내는 후속 바이트의 개수 $N$을 의미. 이후 $N$개 바이트를 빅엔디언(Big-Endian) 정수로 환산.
3. **Value 건너뛰기/참조**: 메모리 복사(`Array.Copy`) 없이 원본 바이트 배열의 오프셋 범위(`[offset, offset + Length)`)만을 참조하여 즉시 다음 TLV 형제로 이동합니다.

### 3.2 7비트 VLQ 기반 OID 역해석 알고리즘

ASN.1 OID 바이트 스트림(Tag `0x06`)은 ITU-T X.690 규격에 따라 7비트 가변 길이 수치(VLQ, Variable-Length Quantity)로 인코딩됩니다.

$$\text{First Byte } B_0 \Longrightarrow \text{Node}_0 = \min\left(\left\lfloor \frac{B_0}{40} \right\rfloor, 2\right), \quad \text{Node}_1 = B_0 - (\text{Node}_0 \times 40)$$

이후의 각 노드는 8번째 최상위 비트(MSB, `0x80`)가 1이면 후속 바이트와 연속됨을 뜻하며, MSB가 0인 바이트에 도달할 때까지 7비트씩 좌측 시프트(`<< 7`)하여 누산합니다.

$$\text{SubIdentifier} = \sum_{i=0}^{k} (B_i \ \& \ 0x7F) \times 128^{k-i}$$

`KCertAsn1Reader`는 이 수식을 순수 비트 연산으로 구현하여 `1.2.410.200004.5.2.1.1`과 같은 금융 OID 문자열을 마이크로초 단위로 추출합니다.

### 3.3 PKCS#8 개인키 파라미터 구조 분석

개인키 파일(`signPri.key`)의 내부 구조(`EncryptedPrivateKeyInfo`)를 해체하여 암호화 속성을 확인합니다.

```asn1
EncryptedPrivateKeyInfo ::= SEQUENCE {
    encryptionAlgorithm   AlgorithmIdentifier {
        algorithm         OBJECT IDENTIFIER (1.2.840.113549.1.5.13 - PBES2),
        parameters        SEQUENCE {
            keyDerivationFunc AlgorithmIdentifier {
                algorithm     OBJECT IDENTIFIER (1.2.840.113549.1.5.12 - PBKDF2),
                parameters    SEQUENCE {
                    salt           OCTET STRING (8~16 Bytes),
                    iterationCount INTEGER (예: 2048 또는 100000)
                }
            },
            encryptionScheme  AlgorithmIdentifier {
                algorithm     OBJECT IDENTIFIER (1.2.410.200004.1.4 - KISA SEED-CBC),
                parameters    OCTET STRING (IV, 16 Bytes)
            }
        }
    },
    encryptedData         OCTET STRING
}
```

`KCertKeyAnalyzer`는 이 구조를 해석하여 사용자가 패스워드를 입력하기 전에도 암호화 알고리즘 종류(SEED-128, ARIA, 3DES, AES)와 반복 회수를 진단 창에 정확히 출력합니다.

### 3.4 2단계 분리형(Fast-Pass / Deep-Pass) 초고속 스캔 파이프라인

수십만 개의 파일이 존재하는 1TB~2TB 이상의 대용량 SSD/외장하드에서 전체 탐색을 수행하면 앱 시작 시 30초 이상의 프리징이 발생합니다. 이를 극복하기 위해 **2단계 분리형 파이프라인**을 구현했습니다.

```
[앱 실행 또는 새로고침]
         │
         ├───► [1단계: Fast-Pass Pipeline] ─── (소요시간: 0.05초 ~ 0.1초)
         │       • AppData\LocalLow\NPKI, GPKI, EPKI 표준 경로
         │       • 장착된 USB 드라이브의 루트 직하위 폴더 (깊이 <= 3)
         │       • Parallel.ForEach 기반 고속 수집 ➔ 메타데이터 파싱
         │       • UI DataGrid에 즉각 바인딩 완료 (체감 지연 0ms)
         │
         └───► [2단계: Deep-Pass Background] ── (백그라운드 비동기)
                 • 로컬 고정 디스크 (C:\, D:\, E:\) 심층 폴더
                 • 사용자 지정 비표준 디렉터리
                 • ConcurrentDictionary를 통한 중복 체크
                 • 새 인증서 발견 시마다 UI Dispatcher로 스트리밍 추가
```

### 3.5 Win32 네이티브 DeviceIoControl 스토리지 버스 식별

.NET의 기본 `DriveInfo.DriveType`은 고속 외장 SSD나 외장 NVMe 케이스를 `DriveType.Fixed`로 잘못 보고하는 결함이 있습니다.  
`KCert.Core.HardwareGuard.NativeStorageInterop`은 Win32 커널 I/O를 직접 질의합니다:

1. `Kernel32.dll`의 `CreateFile(@"\\.\E:", ...)`로 볼륨 핸들 오픈.
2. `DeviceIoControl` 함수에 `IOCTL_STORAGE_QUERY_PROPERTY`(`0x002D1400`) 제어 코드와 `StorageDeviceProperty`(`0`)를 전달.
3. 반환된 `STORAGE_DEVICE_DESCRIPTOR` 구조체에서 `STORAGE_BUS_TYPE` 열거형 필드를 읽음:
   - `BusTypeUsb` (`0x07`): 실제 물리적 USB 버스
   - `BusTypeNvme` (`0x11`) / `BusTypeSata` (`0x0B`): 내장/외장 고속 버스
이를 통해 외장 SSD라도 USB 포트에 연결된 장치를 100% 신뢰성 있게 포착합니다.

### 3.6 원자적 2단계 파일 전송 및 SHA-256 무결성 롤백 트랜잭션

인증서 복사 중 USB가 강제로 뽑히거나 시스템이 다운되었을 때 원본과 대상 파일이 깨지는 것을 방지하기 위해 **원자적 2단계 커밋(Two-Phase Commit)** 기법을 사용합니다.

```
[1단계: 임시 스테이징]
  원본 signCert.der ──► signCert.der.tmp (복사) + 원본 SHA-256 해시 산출
  원본 signPri.key  ──► signPri.key.tmp  (복사) + 원본 SHA-256 해시 산출

[2단계: 교체 및 속성 보정]
  기존 대상 파일 존재 시: ReadOnly 속성 강제 해제(Normal) 후 삭제
  임시 파일(.tmp)을 최종 파일명으로 File.Move 원자적 교체
  대상 파일 ReadOnly 속성 해제

[3단계: 전수 검증 및 롤백]
  생성된 최종 파일들의 SHA-256 해시를 재계산하여 원본 해시와 대조
  불일치 발생 시: 대상 디렉터리의 복사 파일 일괄 삭제(Rollback) 후 실패 반환
```

### 3.7 비표준·중첩 폴더 정규화(Canonical Auto-Repair) 치료 원리

사용자가 수동으로 폴더를 복사하다가 발생하는 `NPKI\NPKI\yessign\...` 또는 `바탕화면\인증서\홍길동\`과 같은 비표준 폴더는 금융사 전자서명 플러그인(VeraPort, AnySign 등)에서 전혀 인식되지 않습니다.  
`CertIntegrityDoctor`는 다음 절차로 이를 자동 치료합니다:

1. `signCert.der`를 읽어 발급기관(Issuer)과 소유자 주체명(Subject DN, `cn=홍길동()0004...`)을 추출.
2. 발급기관 정책 OID를 매핑하여 최적의 표준 디렉터리 경로를 자동 생성:
   - 금융결제원: `NPKI\yessign\USER\cn=...`
   - 코스콤(SignKorea): `NPKI\SignKorea\USER\cn=...`
   - 행정전자서명: `GPKI\Certificate\class1\cn=...`
3. 대상 위치에 폴더를 생성하고, 파일명 대소문자를 표준 규격(`signCert.der`, `signPri.key`, `kmCert.der`, `kmPri.key`)으로 정규화하여 안전하게 복원 이동.

---

## 4. 데이터 흐름 (Data Flow Architecture)

### 4.1 엔드투엔드 전체 라이프사이클 데이터 파이프라인

```
┌─────────────────┐       ┌────────────────────┐       ┌─────────────────────┐
│  물리 디스크    │ ───►  │ FastScanPipeline   │ ───►  │ KCertAsn1Reader     │
│  (HDD/SSD/USB)  │       │ (표준/심층 스캔)   │       │ (바이너리 DER 파싱) │
└─────────────────┘       └────────────────────┘       └─────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────┐       ┌────────────────────┐       ┌─────────────────────┐
│  WPF UI 계층    │ ◄───  │ CertificateItem    │ ◄───  │ KCertMetadata       │
│  (DataGrid 표시)│       │ (WPF Observable)   │       │ (정규 메타데이터)   │
└─────────────────┘       └────────────────────┘       └─────────────────────┘
         │
         ├──────────────────────────────────────────────┐
         ▼                                              ▼
┌─────────────────┐                            ┌─────────────────────┐
│ CertTransfer    │                            │ CertIntegrityDoctor │
│ (원자적 USB복사)│                            │ (구조 진단 및 복구) │
└─────────────────┘                            └─────────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                            ┌─────────────────────┐
│ SHA-256 검증 및 │                            │ 표준 경로 정규화    │
│ 이력 감사 기록  │                            │ (Canonical Repair)  │
└─────────────────┘                            └─────────────────────┘
```

### 4.2 스토리지 탐색 및 메타데이터 파싱 흐름
1. `UsbStorageGuard`가 시스템 드라이브 목록(`DriveInfo.GetDrives()`) 및 USB 변경 이벤트를 수신합니다.
2. `FastScanPipeline.ScanFastAsync`가 실행되어 `AppData\LocalLow\NPKI` 및 USB 루트의 인증서 경로(`DiscoveredCertLocation`)를 수집합니다.
3. 각 경로의 `signCert.der` 파일 바이트를 `KCertParser`에 전달합니다.
4. `KCertAsn1Reader`가 X.509 확장 필드에서 `CertificatePolicies` OID(`2.5.29.32`)를 추출합니다.
5. `KoreanCertPolicyOids`가 OID를 `CertPolicyInfo`(기관명: 금융결제원, 용도: 은행/보험용)로 변환합니다.
6. 최종 데이터가 `KCertMetadata`로 패키징되어 WPF `CertificateItem`으로 투영됩니다.

### 4.3 인증서 안전 전송 및 백업 트랜잭션 흐름
1. 사용자가 인증서와 대상 드라이브(예: `E:\`)를 선택하고 백업을 요청합니다.
2. `CertTransferEngine.ResolveRelativePath`가 원본 경로의 계층 구조(`NPKI\yessign\USER\...`)를 보존한 상대 경로를 계산합니다.
3. 대상 디렉터리에 상위 디렉터리 탐색(`..`) 및 화이트리스트 확장자 필터링을 적용합니다.
4. 모든 파일을 임시 파일(`.tmp`)로 복사 후 SHA-256 체크섬을 계산합니다.
5. 읽기 전용 속성을 해제하고 원자적으로 대상 파일로 교체합니다.
6. 대상 파일들의 SHA-256 해시를 검증하여 100% 일치할 경우 `BackupHistoryItem`에 무결성 증적을 기록합니다.

### 4.4 결함 진단 및 1클릭 표준화 치료 흐름
1. `CertIntegrityDoctor.Diagnose`가 인증서 폴더 내 파일 세트와 상위 경로를 검사합니다.
2. 경로 내 `\GPKI\GPKI\` 또는 `\NPKI\NPKI\` 등 중첩 폴더가 발견되면 `NestedFolderError` 플래그를 설정합니다.
3. `signPri.key` 부재, 0바이트 손상, ASN.1 첫 바이트 `0x30` 불일치를 정밀 분석합니다.
4. 수리 요청 시 `RepairToStandardHierarchy`가 대상 루트의 표준 경로로 파일을 정규화 복사하고 읽기 전용 락을 해제합니다.

### 4.5 PFX 번들 변환 및 KCert.Crypto 상호 운용 흐름
1. 사용자가 분리형 한국 인증서의 PFX 변환을 요청합니다.
2. `CertBundleSecurityEngine.ExportToPfx`가 호출됩니다.
3. `signPri.key`의 PKCS#8 암호화 페이로드를 `KCert.Crypto.KCertPrivateKeyDecryptor`에 전달하여 사용자가 입력한 비밀번호로 복호화합니다.
4. 복호화된 개인키 바이트로부터 .NET `RSA` 인스턴스를 인스턴스화합니다.
5. `X509Certificate2.CopyWithPrivateKey(rsa)`를 호출하여 공개키 인증서에 개인키를 바인딩합니다.
6. `certWithKey.Export(X509ContentType.Pfx, password)`를 통해 국제 표준 PKCS#12 바이너리를 출력합니다.

---

## 5. 에러 처리 전략 (Error Handling Strategy & Fault Tolerance)

### 5.1 계층화된 무중단 방어 원칙 (Fail-Safe Non-Blocking Design)

`KCert.Core.dll`의 모든 public API는 **결함 격리(Fault Isolation)** 원칙에 따라 설계되었습니다. 단 하나의 파일이 손상되었거나 접근이 거부되었다고 해서 전체 탐색 또는 백업 작업이 중단되지 않습니다.

- **스캐너 계층**: 특정 폴더 접근 거부 시 해당 폴더만 건너뛰고 나머지 트리를 계속 탐색.
- **파서 계층**: 바이트 길이가 부족하거나 형식이 깨진 인증서는 예외를 던지는 대신 `null`을 반환하고 활동 로그에 경고 기록.
- **전송 계층**: 다중 선택 백업 시 한 건이 실패하더라도 다른 인증서 백업을 계속 진행하며, 실패 항목만 상세 사유 보고.

### 5.2 파일 시스템 및 I/O 예외 대응 매트릭스

| 예외 유형 | 원인 시나리오 | KCert.Core 내부 방어 및 해결 전략 |
| :--- | :--- | :--- |
| **`UnauthorizedAccessException`** | 윈도우 시스템 폴더 접근 또는 대상 파일이 '읽기 전용' 속성일 때 | 파일 덮어쓰기 전 `File.GetAttributes`로 `ReadOnly` 속성을 확인하고 `FileAttributes.Normal`로 강제 해제 후 작업 수행. |
| **`PathTooLongException`** | 인증서 폴더가 260자(MAX_PATH)를 초과하는 깊은 경로에 위치할 때 | `Path.GetFullPath` 정규화 및 Win32 Long Path 프리픽스(`\\?\`) 친화적 경로 변환 적용. |
| **`DriveNotFoundException`**<br/>**`DirectoryNotFoundException`** | 파일 복사 도중 사용자가 USB를 물리적으로 분리했을 때 | 열려 있는 임시 파일 스트림을 `finally` 블록에서 안전하게 닫고 리소스 누수를 방지하며 트랜잭션 중단. |
| **`IOException` (Sharing Violation)** | 인터넷 뱅킹 보안 프로그램이 인증서 파일을 배타적 락(Lock)하고 있을 때 | 즉시 실패하지 않고 `FileShare.ReadWrite` 모드로 읽기 시도. 실패 시 다른 프로세스 사용 중 안내. |
| **`IOException` (Disk Full)** | USB 메모리의 잔여 용량이 부족할 때 | 복사 전 소요 용량을 사전 계산하여 대상 드라이브의 `AvailableFreeSpace`와 비교, 부족 시 사전 차단. |

### 5.3 암호학적 변조 및 바이너리 손상 방어

1. **파일 헤더 사전 검증 (Magic Byte Check)**:  
   ASN.1 파싱 전 파일 크기가 32바이트 미만이거나 첫 바이트가 `0x30`(SEQUENCE)이 아닌 경우 즉시 파싱을 중단하여 DoS 공격 및 런타임 크래시를 방지합니다.
2. **최대 허용 크기 제한 (Max File Size Quota)**:  
   단일 인증서/키 파일의 크기가 5MB를 초과하면 악의적인 더미 파일로 간주하여 처리를 거부합니다.
3. **타이밍 공격(Timing Attack) 방어**:  
   보안 금고 해제 및 무결성 대조 시 상수 시간 비교(`CryptographicOperations.FixedTimeEquals`)를 적용하여 패스워드 추측 공격을 차단합니다.

### 5.4 기술적 예외를 사용자 조치 가이드로 변환하는 UserFriendlyError 10대 패턴

`KCert.Core.Common.UserFriendlyError`는 런타임 예외를 다음 10대 직관적 사용자 조치 가이드로 변환하여 WPF 대화상자에 표시합니다:

1. **접근 권한 확인 필요**: 관리자 권한 실행 안내 및 폴더 읽기/쓰기 권한 점검 가이드.
2. **USB 저장 장치 연결 확인**: USB 단자 접촉 상태, 내 컴퓨터 인식 여부 확인 안내.
3. **인증서 파일 위치 확인 필요**: 파일 이동/삭제 가능성 안내 및 새로고침 권고.
4. **저장 공간 부족 / 쓰기 금지**: USB 측면 Lock 스위치 해제 및 디스크 여유 공간 확보 안내.
5. **파일 사용 중 안내**: 금융 보안 프로그램, 웹 브라우저, 윈도우 탐색기 닫기 안내.
6. **경로 길이 초과 안내**: 260자 초과 폴더명을 표준 NPKI 경로로 이동하도록 안내.
7. **인증서 파일 형식 오류**: ASN.1/PKCS 헤더 손상 감지 및 인증서 재발급 권고.
8. **클립보드 사용 지연**: 다른 프로그램의 클립보드 락 발생 시 1~2초 후 재시도 안내.
9. **외부 프로세스 실행 실패**: 기본 웹 브라우저 또는 파일 탐색기 연결 상태 확인 안내.
10. **일반 시스템 예외**: 백업 이력 및 로그 확인 후 재시도 안내.

---

## 6. .NET 8 WPF 환경과의 연동 방식 (Integration with .NET 8 / WPF)

### 6.1 비동기 작업 패턴 (TAP) 및 CancellationToken 연동

`KCert.Core.dll`의 모든 장기 실행 I/O 메서드는 C# 8.0+ Task-based Asynchronous Pattern (TAP)을 준수하며 `CancellationToken`을 매개변수로 지원합니다.

```csharp
// 비동기 스캔 호출 예시 (UI 프리징 완전 방지)
public async Task RefreshCertificatesAsync(CancellationToken ct = default)
{
    IsBusy = true;
    try
    {
        // 1단계 Fast-Pass (0.1초 즉각 로딩)
        var fastList = await _scannerService.ScanFastPassAsync(ct);
        UpdateUiList(fastList);

        // 2단계 Deep-Pass (백그라운드 실시간 갱신)
        await _scannerService.ScanDeepPassBackgroundAsync(newCert =>
        {
            Application.Current.Dispatcher.InvokeAsync(() =>
            {
                Certificates.Add(newCert);
            });
        }, existingPaths, existingSignatures, ct);
    }
    finally
    {
        IsBusy = false;
    }
}
```

### 6.2 UI 스레드 분리 및 Dispatcher 안전성 보장

WPF 환경에서는 UI 요소(`ObservableCollection<T>`, `DataGrid`)에 대한 수정이 오직 UI 스레드(Dispatcher Thread)에서만 허용됩니다.
- `KCert.Core.dll` 내부 엔진은 특정 UI 프레임워크(WPF)에 종속되지 않는 **순수 비동기 태스크**로 동작하며, 완료된 결과 또는 스트리밍 콜백(`Action<T>`)을 발생시킵니다.
- WPF 상위 계층(`KCertManager.Wpf`)의 ViewModel은 `Dispatcher.InvokeAsync`를 통해 스레드 간 컨텍스트 전환을 안전하게 처리합니다.

### 6.3 MVVM 패턴 바인딩 연계

WPF의 MVVM(Model-View-ViewModel) 아키텍처와 완벽하게 융합되도록 모델이 설계되었습니다:
- **Model**: `KCertMetadata` ➔ WPF `CertificateItem`으로 래핑되어 `INotifyPropertyChanged` 이벤트 제공.
- **View**: `MainWindow.xaml`의 `<DataGrid ItemsSource="{Binding FilteredCertificates}">`에 직결 바인딩.
- **Command**: `RelayCommand`를 통해 `RefreshCommand`, `BackupSelectedCommand`, `RepairCommand`와 1:1 매핑.

### 6.4 WPF 서비스 계층과의 결합도 최소화 구조

```
[KCertManager.Wpf (Presentation Layer)]
      │
      ▼ (의존)
[Services Layer: CertificateScannerService, CertificateBackupService, UsbDriveWatcher]
      │
      ▼ (의존)
[KCert.Core.dll (Core Engines)] ◄─── (상호 연동) ───► [KCert.Crypto.dll]
```

UI 프레젠테이션 계층이 `KCert.Core`의 내부 엔진을 직접 조작하지 않고, `CertificateScannerService`와 `CertificateBackupService`라는 추상화된 Facade 서비스를 통해 소통함으로써 코드 결합도를 최소화하고 단위 테스트(Unit Testing) 용이성을 극대화했습니다.

### 6.5 단일 파일 배포 (`PublishSingleFile`) 최적화

`KCert.Core.dll`은 외부 C++ DLL이나 런타임 종속 파일(`.so`, `.dylib`)을 전혀 포함하지 않는 100% IL(Intermediate Language) 매니지드 코드입니다.  
따라서 `.NET 8`의 정적 컴파일 및 단일 파일 배포 시 추가 설정 없이 완벽하게 단일 `.exe` 바이너리 내부로 패키징됩니다:
```xml
<PublishSingleFile>true</PublishSingleFile>
<IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
<EnableCompressionInSingleFile>true</EnableCompressionInSingleFile>
```

---

## 7. 공용 API 레퍼런스 및 C# 코드 예제

### 7.1 단일 인증서 파싱 및 정책 OID 식별
```csharp
using KCert.Core.Parser;

string certFolder = @"C:\Users\Admin\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동()0004011234567";
KCertMetadata? cert = KCertParser.Parse(certFolder);

if (cert != null)
{
    Console.WriteLine($"소유자 성명: {cert.CommonName}");
    Console.WriteLine($"발급 기관: {cert.Issuer}");
    Console.WriteLine($"용도 구분: {cert.DisplayUsage}"); // 예: 개인/은행/보험용
    Console.WriteLine($"체계: {cert.SystemType}");         // NPKI, GPKI, EPKI
    Console.WriteLine($"유효기간: {cert.ValidTo:yyyy-MM-dd} (잔여 {cert.DaysRemaining}일)");
    Console.WriteLine($"지문(SHA-256): {cert.FingerprintSha256}");
}
```

### 7.2 비표준/중첩 폴더 진단 및 표준 위치 자동 복구 (Auto-Repair)
```csharp
using KCert.Core.Diagnostics;

string abnormalFolder = @"E:\백업폴더\NPKI\NPKI\yessign\USER\cn=홍길동";

// 1. 상태 진단
CertDiagnosisReport report = CertIntegrityDoctor.Diagnose(abnormalFolder);

if (!report.IsHealthy)
{
    Console.WriteLine($"감지된 결함: {report.Anomalies}");
    foreach (var issue in report.DetailedIssues)
    {
        Console.WriteLine($" - {issue}");
    }

    // 2. 표준 위치로 1클릭 복구 실행 (AppData\LocalLow 또는 지정 루트)
    string targetRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "AppData", "LocalLow");
    CertRepairResult repair = CertIntegrityDoctor.RepairToStandardHierarchy(abnormalFolder, targetRoot);

    if (repair.IsSuccess)
    {
        Console.WriteLine($"복구 완료! 정규화 경로: {repair.RepairedPath}");
    }
}
```

### 7.3 원자적 안전 백업 및 SHA-256 무결성 검증
```csharp
using KCert.Core.Vault;

string sourceDir = @"C:\Users\Admin\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동";
string targetUsb = @"E:\";
string relativeSubPath = CertTransferEngine.ResolveRelativePath(sourceDir);

// 트랜잭션 전송 수행
CertTransferResult result = CertTransferEngine.Transfer(sourceDir, targetUsb, relativeSubPath);

if (result.IsSuccess)
{
    Console.WriteLine($"백업 성공: {result.DestinationDirectory}");
    Console.WriteLine($"무결성 해시(SHA-256): {result.DerSha256}");
    Console.WriteLine($"전송 크기: {result.TotalBytesCopied:N0} 바이트");
}
else
{
    Console.WriteLine($"백업 취소/실패: {result.Message}");
}
```

### 7.4 표준 PKCS#12 (PFX) 변환 내보내기 (KCert.Crypto 연동)
```csharp
using KCert.Core.Vault;

string derPath = @"C:\Cert\signCert.der";
string keyPath = @"C:\Cert\signPri.key";
string pfxPath = @"C:\Backup\my_cert.pfx";
string password = "UserPassword1234!";

// DER + KEY -> PFX 변환 실행
bool success = CertBundleSecurityEngine.ExportToPfx(derPath, keyPath, pfxPath, password);
if (success)
{
    Console.WriteLine("국제 표준 PKCS#12 PFX 번들 생성 완료 (홈택스/모바일 즉시 사용 가능)");
}
```

---

## 8. 결론 및 배포 산출물 안내

`KCert.Core.dll`은 과거 수십 년간 외산 라이브러리(BouncyCastle)나 불안정한 ActiveX 레거시에 의존하던 대한민국 공인인증서 생태계를 **순수 100% C# Managed 기술로 완전히 독립시킨 차세대 코어 라이브러리**입니다.

- **어셈블리 빌드 출력**: `bin/Release/net8.0-windows/KCert.Core.dll` 및 `bin/Release/net10.0-windows/KCert.Core.dll`
- **배포 및 통합 위치**: `release/05_WpfDesktop/KCert.Core.dll`
- **소스코드 경로**: `/src-wpf/KCert.Core/`
- **라이선스**: Free Use / MIT License (한국어 `LICENSE_KR.txt`, 영어 `LICENSE_EN.txt`)
- **기술 지원**: AhBiYout (CISNet: [http://www.cisnet.co.kr/](http://www.cisnet.co.kr/), 블로그: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))
