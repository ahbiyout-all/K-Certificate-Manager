# K-인증서 매니저 시스템 아키텍처 (Architecture)

본 문서는 K-인증서 매니저의 내부 구조, 파일 시스템 탐색 메커니즘, 그리고 보안 설계 원칙을 기술합니다.

---

## 1. 인증서 파일 시스템 규격

### 1.1 인증서 파일 쌍 (Keypair)
대한민국 공인/공동인증서 및 행정전자서명 인증서는 항상 2개의 파일로 구성됩니다:
- `signCert.der`: X.509 v3 형식의 공개키 인증서 (DER 바이너리 포맷)
- `signPri.key`: PKCS#8 형식의 개인키 암호화 파일 (SEED / ARIA / AES 암호화)

### 1.2 표준 디렉터리 경로 매핑
| 체계 | 표준 로컬 디렉터리 경로 | 발급 기관 | 용도 |
| :--- | :--- | :--- | :--- |
| **GPKI** | `C:\Users\{User}\AppData\LocalLow\GPKI\Certificate\class\{UserCN}` | 정부공동인증센터 | 중앙행정기관, 지자체 공무원 |
| **EPKI** | `C:\Users\{User}\AppData\LocalLow\EPKI\Certificate\class\{UserCN}` | 교육부행정전자서명센터 | 시도교육청, 국공사립 초중고대학 |
| **NPKI** | `C:\Users\{User}\AppData\LocalLow\NPKI\{Yessign, KICA, CrossCert...}\User\{UserCN}` | 금융결제원, 코스콤, 한국정보인증 등 | 은행, 증권, 보험, 범용 공동인증 |

---

## 2. 안전한 삭제 및 휴지통(Recycle Bin) 격리 설계

1. **활성 인증서 목록과 휴지통 분리**
   - 활성 목록(`certificates`): 탐색된 유효한 인증서 목록.
   - 휴지통 저장소(`kcert_trash_items`): 삭제된 인증서와 삭제 일시(`deletedAt`), 삭제 사유(`deleteReason`), 원본 경로(`originalPath`)를 보존.
2. **실행 취소(Undo) 윈도우**
   - 삭제 작업 즉시 반응형 토스트를 통해 8.5초 동안 원클릭 즉시 복구 기회를 보장.
3. **복구 무결성**
   - 휴지통 복구 시 중복 검사를 거쳐 원본 상태와 동일한 키페어 파일 구조로 안전하게 환원.

---

## 3. USB ➔ PC 역방향 전송 파이프라인 (Reverse Transfer Architecture)

1. **외부 매체 탐색 레이어 (`usbToPcService.ts`)**
   - **Removable Drive Scan**: 이동식 볼륨 내 표준 루트(`D:\NPKI`, `E:\GPKI` 등) 재귀 탐색.
   - **Native File System Access API (`showDirectoryPicker`)**: 브라우저 보안 샌드박스를 준수하면서 사용자 동의 하에 USB 폴더 내 `signCert.der`, `signPri.key` 파일 쌍 추출.
   - **Client-side ZIP Streaming Engine (`jszip`)**: 압축된 백업 파일의 구조를 바이너리 수준에서 파싱하여 인증서 디렉터리 구조 자동 해석.
2. **대상 PC 표준 경로 매핑 및 배치 규칙**
   - NPKI: `C:\Users\{TargetUser}\AppData\LocalLow\NPKI\{Issuer}\USER\{Subject}`
   - GPKI: `C:\Users\{TargetUser}\AppData\LocalLow\gpki\certificate\class1\{Subject}`
   - EPKI: `C:\Users\{TargetUser}\AppData\LocalLow\epki\{Subject}`
3. **충돌 처리 정책 (3-Way Duplicate Conflict Resolution)**
   - 동일한 Subject DN 또는 이름이 목적지에 존재하는 경우:
     - **`overwrite` (스마트 덮어쓰기)**: 유효기간 및 시리얼 번호를 비교하여 최신 인증서로 자동 교체.
     - **`rename` (이름 변경 보존)**: 원본을 삭제하지 않고 `_복사본_날짜` 타임스탬프 또는 버전을 붙여 원본과 대상 모두 안전하게 보존.
     - **`skip` (동일 파일 건너뛰기)**: 무의미한 중복 복사를 방지하도록 스킵.

---

## 4. 물리 스토리지 정밀 필터 아키텍처 (`driveFilter.ts`, `UsbDriveWatcher.cs`)

1. **광학/가상/클라우드 드라이브 필터링 엔진**
   - **CD-ROM / DVD / Optical**: `DriveType.CDRom`, `DRIVE_CDROM` API, CDFS/UDF/ISO9660 포맷 원천 제외.
   - **Virtual Disks**: RAM Disk, VHD/VHDX, ImDisk, Daemon Tools, WinCDEmu, VMware/VirtualBox 가상 드라이브 제외.
   - **Cloud Storage Drives**: Google Drive, Microsoft OneDrive, Dropbox, iCloud, Box, RaiDrive, CloudDrive 등 클라우드 동기화 드라이브 완벽 배제.
2. **물리 스토리지 화이트리스트**
   - 본체 내장 NVMe M.2 SSD, SATA SSD/HDD 및 외장 USB 메모리, 이동식 저장매체만 식별 및 표시.

---

## 5. 복사 목적지 선택 및 동일 디스크 자가 복사(Self-Copy) 금지 아키텍처

1. **대상 디스크 지정 팝업 모달 (`TargetDrivePickerModal.tsx`)**:
   - 일괄 복사 요청 시 타깃 드라이브를 먼저 선택하는 전용 UI 컴포넌트를 렌더링.
   - 물리 드라이브 목록을 실시간으로 가져와 카드 형태로 제공하며, 이동식 미연결 시 C: 드라이브 오복사 경고 및 안내 카드를 표출.
2. **자가 복사(Self-Copy) 사전 차단 규칙 (`isSameDriveSelfCopy`)**:
   - 원본 인증서가 위치한 루트 드라이브 문자(예: `C:\...`의 `C:`, 또는 `E:\...`의 `E:`)와 목적지 드라이브 문자를 정규화 대조.
   - 동일 드라이브인 경우 복사 엔진 진입을 차단하고 `🚫 자가 복사 금지` 잠금 상태를 유지하여 원본 덮어쓰기 데이터 손상을 원천 방지.

---

## 6. KCert.Core.dll 순수 창작 코어 라이브러리 5대 서브시스템 아키텍처

데스크톱 네이티브 에디션 및 독립 실행 툴킷을 위한 100% C# .NET 8 / .NET 10 순수 창작 DLL (`KCert.Core.dll`) 구조:

1. **`KCert.Core.Parser` (순수 ASN.1 파싱 & OID 분석 서브시스템)**:
   - 순수 ASN.1 DER 바이너리 TLV 파서 및 OID 인코더/디코더 (`KCertAsn1Reader.cs`)
   - PKCS#8 개인키 암호화 알고리즘(SEED, ARIA, AES, 3DES, PBKDF2) 정밀 분석기 (`KCertKeyAnalyzer.cs`)
   - NPKI 8대 공인기관, GPKI, EPKI, MPKI 한국형 정책 OID 역해석 엔진 (`KoreanCertPolicyOids.cs`)
   - `signCert.der` + `signPri.key` 키 쌍 정합성 및 만료 임박(30일) 정밀 판별기 (`CertPairValidator.cs`)
   - 원클릭 고속 메타데이터 추출기 (`KCertParser.cs`)
2. **`KCert.Core.Discovery` (2단계 초고속 탐색 서브시스템)**:
   - 2단계 분리형(Fast-Pass 0.1초 즉시 로딩 + Deep-Pass 백그라운드 스트리밍) 스캔 파이프라인 (`FastScanPipeline.cs`)
   - `AppData\LocalLow`, 사용자 홈, C:\ 루트, 연결된 USB 표준 경로 지능형 자동 탐색 (`CertLocationScanner.cs`)
   - 권한 거부 및 시스템 특수 폴더 자동 스킵 안전 BFS 재귀 탐색기
3. **`KCert.Core.Diagnostics` (지능형 진단 & 중복 탐지 서브시스템)**:
   - 비표준/중첩 디렉터리 정밀 진단 및 표준 계층 경로 자동 복구(Auto-Repair) 엔진 (`CertIntegrityDoctor.cs`)
   - 시스템 전역 드라이브(C/D/E/USB) 중복 인증서 클러스터링 및 잉여 복사본 분석 엔진 (`KCertAntiDuplicationEngine.cs`)
   - 만료 위험 5단계 평가 및 인증기관별 공식 갱신 포털 자동 라우팅 엔진 (`CertExpirationAlarmEngine.cs`)
4. **`KCert.Core.Vault` (보안 금고 & 원자적 트랜잭션 서브시스템)**:
   - 원본-대상 해시 검증 및 실패 시 자동 롤백을 지원하는 원자적 전송기 (`CertTransferEngine.cs`)
   - AES-256-GCM + PBKDF2(10만 회) 기반 독자 보안 금고 패키징/복원 엔진 (`CertVaultPacker.cs`, `.kcertpack`)
   - 국제 표준 PKCS#12 (.pfx / .p12) 상호 변환 및 추출 엔진 (`CertBundleSecurityEngine.cs`)
   - 오삭제 방지 로컬 격리소 및 원클릭 복구 관리자 (`SafetyTrashManager.cs`)
5. **`KCert.Core.HardwareGuard` & `Common` (하드웨어 감시 & 개인정보 보호)**:
   - Win32 `DeviceIoControl` 기반 물리 스토리지 버스(USB, NVMe, SATA) 네이티브 쿼리 (`NativeStorageInterop.cs`)
   - WMI `Win32_VolumeChangeEvent` 기반 실시간 USB 핫플러그 비동기 감시 (`UsbStorageGuard.cs`, 300ms 디바운스)
   - 주민등록번호, 사업자등록번호, VID 개인식별값 안전 마스킹 엔진 (`CertSanitizer.cs`)

> 📖 상세 동작 원리, 바이너리 헤더 레이아웃, 수학적 공식 및 API 예제는 [`PURE_CREATIVE_DLL_ARCHITECTURE.md`](./PURE_CREATIVE_DLL_ARCHITECTURE.md) 및 [`KCERT_CORE_DLL_SPEC.md`](./KCERT_CORE_DLL_SPEC.md) 문서를 참조하십시오.

---

## 7. 샌드박스 및 7대 보안 하드닝 보증 (Security Architecture)

1. **100% Client-Side Memory Isolation (외부 전송 제로)**:
   - 인증서의 개인키(`signPri.key`)와 비밀번호는 원격 서버로 절대 전송되지 않으며, 비밀번호를 입력받거나 복호화하지 않고 암호화된 원본 바이너리 그대로만 안전하게 처리합니다.
2. **화이트리스트 확장자 필터링 (악성 실행파일 동반 복사 차단)**:
   - `CertTransferEngine` 복사 시 `.der`, `.cer`, `.crt`, `.key`, `.pri`, `.pfx`, `.p12`, `.pem` 확장자만 허용하여 감염된 USB 내 `.exe`, `.bat`, `.dll`, `.vbs` 등의 동반 복사를 원천 차단합니다.
3. **정규화 경로 검증 (Path Traversal 차단)**:
   - `Path.GetFullPath` 및 세그먼트 정화를 통해 `..\` 상위 경로 이탈 공격을 차단하고, `SafetyTrashManager` 복원 시에도 드라이브 루트(`C:\`)나 Windows 시스템 폴더(`Windows`, `System32`) 접근을 거부합니다.
4. **외부 실행 프로토콜 및 명령줄 인자 격리**:
   - 외부 URL 실행 시 `Uri.TryCreate`로 오직 `https://` 및 `http://`만 허용하며, `explorer.exe` 호출 시 `UseShellExecute = false` 및 `ArgumentList` 분리 방식을 적용합니다.
5. **512KB 파일 크기 상한 (DoS 메모리 고갈 방어)**:
   - C# 및 웹 인증서 파서에서 512KB를 초과하는 비정상 더미 파일은 즉시 스킵하고, 해시 계산 시 파일 스트림(`File.OpenRead`)을 사용합니다.
6. **웹 기관 디렉터리 스킴 정화 및 로컬 웹 서버 격리**:
   - JSON 가져오기 시 `javascript:`, `data:` 스킴과 `__proto__` 오염을 차단하며, `run-web.cmd` 구동 시 `--host 127.0.0.1` 루프백 전용 바인딩으로 외부 네트워크 노출을 차단합니다.
7. **SHA-256 원자적 트랜잭션 검증**:
   - 임시 파일(`.tmp`) 복사 후 SHA-256 체크섬이 100% 일치할 때만 최종 파일로 확정(Commit)하고 불일치 시 즉시 롤백합니다.

---

## 8. 3단계 자동 동적 버전 갱신 파이프라인 (SSOT Architecture)

1. **1차 기준 (기계 표준 규격)**: `package.json`의 `"version"` 필드에서 Node.js/PowerShell 동적 추출.
2. **2차 기준 (패치노트 직결)**: 누락 또는 비Node 환경 시 `docs/PATCHNOTES.md` 상단 최신 릴리스 헤더(`### 🚀 [vX.X.X]`) 정규식 파싱.
3. **3차 기준**: 최종 안전 기본값 폴백.
4. **스크립트 통합**: `build.bat`, `push_to_github.bat`, `push_to_github.ps1`, `.github/workflows/build.yml` 전 영역에서 단일 소스 원칙(Single Source of Truth)을 유지합니다.

---

## 9. 시작 시 순차 모달 시퀀스 & 가이드 모션 오버레이 아키텍처

1. **시작 시 순차 모달 흐름 (`StartupWorkflowModal.tsx`)**:
   - 어플리케이션 구동 시 `checkForAppUpdates` 비동기 조회가 최우선 실행됩니다.
   - 신규 업데이트가 감지된 경우 업데이트 모달(`UpdateModal`)이 먼저 표시되며, 모달 종료 시 또는 최신 버전 상태일 때 작업 선택 다이얼로그(`StartupWorkflowModal`)가 자동으로 바통을 받아 실행됩니다.
   - 3가지 시작 경로 제공: `pc_to_usb` (PC ➔ USB 백업 가이드), `usb_to_pc` (USB ➔ PC 복원 가이드), `dashboard` (메인 관리 화면 직접 진입).
2. **단계별 가이드 모션 컨트롤러 (`GuidedWorkflowOverlay.tsx`)**:
   - 작업 선택 시 화면 하단에 1단계 ➔ 2단계 ➔ 3단계 인터랙티브 오버레이 바 및 CSS 키프레임 포커스 펄스링(`pulseRing`, `pulseEmeraldRing`) 애니메이션이 구동됩니다.
   - **1단계**: 컴퓨터 또는 USB 내 복사 대상 인증서 선택 가이드 및 전체 선택 지원.
   - **2단계**: 백업 대상 USB 지정 및 전용 드라이브 피커 / 가져오기 모달 자동 연동.
   - **3단계**: 원자적 파일 복사 실행, Web Audio API 성공 차임 재생 및 `[무결성 확인 완료 (SHA-256)]` 인증 배지 토스트 연동.

---

## 10. 메타데이터 & 개발자
- **개발자**: AhBiYout (GitHub: [AhBiYout-all](https://github.com/AhBiYout-all))
- **공식 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **회사 홈페이지**: [https://www.cisnet.co.kr/](https://www.cisnet.co.kr/)
- **버전**: `v1.5.0` (SemVer 2.0.0)
