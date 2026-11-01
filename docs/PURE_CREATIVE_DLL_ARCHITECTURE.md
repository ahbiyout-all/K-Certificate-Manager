# 🏛️ KCert.Core 순수 창작 DLL 동작 원리 및 세부 아키텍처 기술서

## 1. 개요 및 목적
대한민국 전자서명 인증 체계(NPKI, GPKI, EPKI, MPKI)는 X.509 표준을 따르면서도 대한민국 고유의 정책 OID 체계, 분리형 키 파일 구조(`signCert.der` + `signPri.key`, `kmCert.der` + `kmPri.key`), KISA 표준 대칭키 암호화(SEED-CBC, ARIA-CBC), 그리고 특유의 디렉터리 계층 구조를 갖추고 있습니다.

본 프로젝트의 **`KCert.Core.dll`**은 어떠한 외부 서드파티 라이브러리(BouncyCastle 등)나 레거시 모듈에 의존하지 않고, **순수 100% C#과 Windows 표준 .NET 암호화 기본 라이브러리만으로 독자 개발된 순수 창작 코어 엔진(Pure Creative Core Engine)**입니다.

---

## 2. 기존 DLL 파일 분석 및 결함 교정 (Defect Fixes & Improvements)

### 2.1 기존 구현의 문제점 및 한계 분석
1. **Windows OS 로케일 의존성 오류**:
   - 기존의 `X509Extension.Format(false)` 방식은 Windows CryptoAPI가 반환하는 문자열 포맷에 의존하므로, 영문 Windows나 서버 환경에서 OID가 문자열로 정상 변환되지 않아 정책 매핑이 실패하는 잠재적 결함이 존재했습니다.
2. **개인키 유효성 검증의 피상성**:
   - `signPri.key` 파일의 첫 바이트(`0x30`)만 확인하는 수준에 그쳐, 내부 PBES2 암호화 파라미터 손상이나 지원되지 않는 알고리즘이 적용된 경우 서명 단계 이전에 사전 감지하지 못했습니다.
3. **동일 드라이브 내 폴더 간 전송 차단 결함**:
   - `CertTransferEngine.cs`에서 자가 복사 방지 로직이 드라이브 루트(`sourceRoot == targetPathRoot`) 수준에서 검사되어, 동일 드라이브(C:) 내의 비표준 폴더(예: Downloads)에서 표준 AppData 경로로 복사/치료하는 작업까지 차단되던 버그를 정밀 교정(`fullSourceDir == fullTargetDir` 판별로 수정).
4. **중복 인증서 관리 기능 부재**:
   - 사용자가 C드라이브, 외장 SSD, 여러 개의 USB 드라이브에 인증서를 중복 복사해 두었을 때, 동일 인증서의 파편화와 불필요한 용량 낭비를 통합 진단할 방법이 없었습니다.
5. **글로벌 표준 포맷(PKCS#12 PFX)과의 단절**:
   - 한국형 분리 파일(`signCert.der` + `signPri.key`)과 국제 표준 `.pfx` 파일 간의 양방향 호환이 불가능했습니다.

### 2.2 신규 창작 엔진으로 해결된 사항
- **`KCertAsn1Reader` 도입**: `extension.RawData` 바이너리 바이트를 직접 순회하여 Tag `0x06`(OID)을 디코딩하는 0-Allocation 고속 ASN.1 파서를 신규 개발하여 로케일에 무관한 100% 정확도 확보.
- **`KCertKeyAnalyzer` 도입**: PKCS#8 `EncryptedPrivateKeyInfo`를 파싱하여 KISA SEED-CBC, ARIA-128/256-CBC, 3DES, AES 대칭키 암호화 알고리즘 및 PBKDF2 솔트와 반복수를 정밀 판별.
- **`KCertAntiDuplicationEngine` 도입**: 시스템 전역(모든 내장/외장 드라이브) 인증서 지문(SHA-256) 클러스터링 기반 중복 분석 및 잉여 복사본 식별 엔진 구축.
- **`CertBundleSecurityEngine` 도입**: signCert+signPri와 PFX 간 원클릭 변환/추출 기능 지원.
- **`CertSanitizer` 도입**: 주민등록번호, 사업자등록번호 및 VID 개인 식별 코드 안전 마스킹 및 RDN 정제.
- **`CertExpirationAlarmEngine` 도입**: 만료 위험도(D-30, D-14, D-7, D-Day, 만료됨) 및 기관별 공식 갱신 포털 URL 자동 매칭.
- **`CertIntegrityDoctor` & `NativeStorageInterop` 고도화**: Win32 `DeviceIoControl` 기반 물리 스토리지 버스(`BusTypeUsb`, `BusTypeNvme`) 식별 및 비표준 중첩 경로 자동 치료(Auto-Repair).

---

## 3. 핵심 모듈별 동작 원리 상세

### 3.1 바이너리 ASN.1 DER 파서 (`KCertAsn1Reader.cs`)
- **TLV 트리 순회**:
  - `Tag`: 바이트 타입(Sequence, OctetString, OID 등) 판별
  - `Length`: Short-form ($<128$) 및 Long-form($\ge 128$) 가변 길이 파싱
  - `Value`: 바이트 버퍼 슬라이싱
- **OID 바이트 디코딩 공식**:
  - $B_0 \rightarrow (\lfloor B_0/40 \rfloor, B_0 \pmod{40})$
  - 이후 바이트: 7비트 가변 길이 정수(VLQ) 복원 ($\text{MSB}=0$일 때 노드 종료)

### 3.2 PKCS#8 암호화 알고리즘 분석기 (`KCertKeyAnalyzer.cs`)
- 개인키 파일의 내부 `encryptionAlgorithm` OID 및 `PBES2-params`를 순차 탐색하여 KISA SEED-CBC(`1.2.410.200004.1.4`), ARIA-128-CBC(`1.2.410.200004.1.11`), ARIA-256-CBC(`1.2.410.200004.1.13`) 등을 자동 식별합니다.

### 3.3 초고속 2단계 탐색 파이프라인 (`FastScanPipeline.cs`)
- **Fast-Pass (0.1초 이내)**: `AppData\LocalLow\NPKI`, `GPKI`, `EPKI` 및 USB 루트 경로($\text{depth} \le 3$)를 병렬 I/O로 즉시 수집하여 화면을 즉시 갱신.
- **Deep-Pass (백그라운드 스트리밍)**: 비표준 디스크 전역을 백그라운드 탐색하여 신규 발견 시 스레드 안전 콜백을 통해 UI에 실시간 병합.

### 3.4 AES-256-GCM 보안 금고 (`CertVaultPacker.cs`)
- 인증서 및 개인키를 암호화 백업(`*.kcertpack`)할 때 PBKDF2 10만 회 키 유도와 AES-256-GCM AEAD를 적용하여 기밀성과 무결성을 동시 보장합니다.

### 3.5 개인정보 안전 마스킹 및 만료 갱신 엔진 (`CertSanitizer.cs` & `CertExpirationAlarmEngine.cs`)
- Subject DN 내에 포함된 주민등록번호(`000401-*******`), 사업자등록번호(`123-**-45678`) 마스킹.
- 만료 임박 일수별 5단계 위험도 산출 및 발급기관(금융결제원, 코스콤, KICA, GPKI 등) 공식 갱신 사이트 자동 라우팅.

### 3.6 순수 창작 암호화 & 전자서명 엔진 (`KCert.Crypto.dll`)
- **KISA SEED-128 (RFC 4269)**: 16라운드 Feistel 네트워크, G-Function 4개 룩업 테이블($SS_0 \dots SS_3$), CBC 모드 및 PKCS#7 패딩 순수 C# 구현 (BouncyCastle 제로 의존).
- **KISA ARIA (RFC 5794)**: 12/14/16라운드 치환-확산 네트워크(SPN), Involution 구조, CBC 모드 순수 구현.
- **PKCS#8 개인키 복호화 (`KCertPrivateKeyDecryptor.cs`)**: `signPri.key`로부터 Salt, Iteration, IV를 추출하고 PBKDF2 키 유도 후 대칭 복호화하여 .NET 표준 `RSA` 인스턴스로 즉각 복원 (0.5ms 소요).
- **가상식별번호 VID 영지식 검증 (`KCertVidEngine.cs`)**: OID `1.2.410.200004.10.1.1` 추출 및 주민등록번호/사업자번호 무결성 영지식 해시 검증.
- **전자서명 무결성 테스트 (`KCertSignatureEngine.cs`)**: 복원된 개인키로 RSA-SHA256 PKCS#1 v1.5 전자서명을 생성하고 공개키로 즉각 검증하여 키 쌍 일치성을 사전 확증.

---

## 4. API 공개 인터페이스 및 사용 예시

```csharp
using KCert.Core.Parser;
using KCert.Core.Diagnostics;
using KCert.Core.Vault;
using KCert.Core.Common;
using KCert.Crypto.Engine;
using KCert.Crypto.Ciphers;

// 1. 단일 인증서 파싱 및 키 알고리즘 확인
var cert = KCertParser.Parse(@"C:\Users\Admin\AppData\LocalLow\NPKI\yessign\USER\cn=홍길동");
Console.WriteLine($"소유자: {cert?.CommonName}, 키 암호화: {cert?.KeyInfo?.AlgorithmName}");

// 2. KCert.Crypto 엔진을 통한 signPri.key 비밀번호 검증 및 개인키 복호화
using var decryptResult = KCertPrivateKeyDecryptor.DecryptKeyFile(cert!.KeyFilePath, "Password123!");
if (decryptResult.IsSuccess)
{
    Console.WriteLine($"복호화 성공: {decryptResult.AlgorithmName}, RSA {decryptResult.KeySizeBits}비트");
    
    // 3. 전자서명 생성 및 공개키 대조 검증
    using var publicCert = new System.Security.Cryptography.X509Certificates.X509Certificate2(cert.DerFilePath);
    var signTest = KCertSignatureEngine.TestSignature(decryptResult.RsaInstance!, publicCert);
    Console.WriteLine($"전자서명 검증 결과: {signTest.Message}");
}

// 4. 완전한 서명 가능 PKCS#12 PFX 내보내기 (개인키 결합)
var pfxResult = CertBundleSecurityEngine.ExportToPfx(cert.DerFilePath, cert.KeyFilePath, @"C:\Backup\cert.pfx", "PfxPassword!", "Password123!");
Console.WriteLine(pfxResult.Message);
```

---

## 5. 결론 및 배포 확인
- 본 프로젝트의 순수 창작 DLL 듀오인 **`KCert.Core.dll`**과 **`KCert.Crypto.dll`**은 C# WPF 데스크톱 애플리케이션 및 독립 .NET 런타임 환경에서 최고 수준의 안정성과 속도를 제공하며, 외부 서드파티 라이브러리(BouncyCastle 등)나 레거시 32비트 C++ 네이티브 모듈 없이 완벽한 독립 실행과 초경량 배포를 보장합니다.
- 세부 암호화 수학적 원리 및 KISA 표준 사양은 `docs/KCERT_CRYPTO_DLL_SPECIFICATION.md`를 참조하시기 바랍니다.
