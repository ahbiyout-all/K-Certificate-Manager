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
| **GPKI** | `C:\GPKI\Certificate\class2\{UserCN}` / `class1\{Org}` | 정부공동인증센터 | 중앙행정기관, 지자체 공무원 및 기관·관인(`class1`) |
| **EPKI** | `C:\Users\{User}\AppData\LocalLow\EPKI\Certificate\class2\|class1` (또는 `C:\EPKI\Certificate\...`) | 교육부행정전자서명센터 | 시도교육청, 국공사립 초중고대학 및 교육기관(`class1`) |
| **NPKI** | `C:\Users\{User}\AppData\LocalLow\NPKI\{Yessign, KICA, CrossCert, TradeSign...}\User\{UserCN}` | 금융결제원, 코스콤, 한국정보인증 등 | 은행, 증권, 보험, 범용/법인 공동인증 |

> **💡 `class1` 기관·특수목적 필터링 규칙**: `C:\GPKI\Certificate\class1`, EPKI `class1`, USB `class1` 경로는 다수의 인증서와 루트/CA 파일이 혼재할 수 있으므로, `CertLocationScanner` 및 `CertificateScannerService`가 **개인키(`.key`/`.pri`) 쌍을 보유한 실사용 인증서만 선별**하여 표출하고 Root/CA/CRL 및 중복 `_env.cer`를 자동 제외합니다. 또한 Web·WPF 목록과 사이드바(`CLASS1`)에서 `공무원(GPKI)`·`교육(EPKI)`·`기관` 배지로 구분합니다.

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
   - NPKI: `C:\Users\{TargetUser}\AppData\LocalLow\NPKI\{Issuer}\USER\{Subject}` (비-C 로컬 드라이브 지정 시 `{Drive}:\NPKI\{Issuer}\USER\{Subject}`)
   - GPKI: `{SystemDrive}:\GPKI\Certificate\class1\{Subject}` (또는 `AppData\LocalLow\gpki\certificate\class1\{Subject}`, `class1` 계층 보존)
   - EPKI: `{TargetLocalLowOrDrive}:\EPKI\Certificate\class1\{Subject}` (`class1` 계층 보존)
3. **충돌 처리 정책 및 0건 건너뛰기 가드 (3-Way Duplicate Conflict Resolution)**
   - 동일한 발급기관·일련번호 또는 Subject DN이 목적지에 존재하는 경우:
     - **`overwrite` (스마트 덮어쓰기)**: 유효기간 및 시리얼 번호를 비교하여 최신 인증서로 자동 교체.
     - **`rename` (이름 변경 보존)**: 원본을 삭제하지 않고 `_복사본_날짜` 타임스탬프 또는 버전을 붙여 원본과 대상 모두 안전하게 보존.
     - **`skip` (동일 파일 건너뛰기)**: 무의미한 중복 복사를 방지하도록 스킵하며, 선택 항목 전부가 건너뛰어져 실제 복사 건수가 `0`건인 경우 완료 모달 대신 `INFO` 활동 로그와 토스트 알림으로 명확히 안내합니다.

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

1. **대상 디스크 지정 팝업 모달 (`TargetDrivePickerModal.tsx` / `TargetDrivePickerDialog.xaml.cs`)**:
   - 일괄 복사 요청 시 타깃 드라이브를 먼저 선택하는 전용 UI 컴포넌트를 렌더링.
   - 물리 드라이브 목록을 실시간으로 가져와 카드 형태로 제공하며, 이동식 미연결 시 C: 드라이브 오복사 경고 및 안내 카드를 표출.
2. **자가 복사(Self-Copy) 사전 차단 규칙 & 복사된 폴더 열기 (`isSameDriveSelfCopy` / `ResolveEffectiveDestinationRoot` / `resolveCopiedFolderPath`)**:
   - 원본 인증서가 위치한 루트/표준 보관 경로와 목적지 실제 저장 경로를 정규화 대조.
   - **WPF 실제 목적지 판별 (`ResolveEffectiveDestinationRoot`)**: `CertificateBackupService.BackupCertificateToDrive`와 동일하게 `C:` 선택 시 `NPKI`/`EPKI`는 `%USERPROFILE%\AppData\LocalLow`, `GPKI`는 동적 시스템 드라이브 루트(`Environment.SystemDirectory` 기반)로 환산하여 `C:\Users\...\AppData\LocalLow\NPKI` 인증서가 `C:`로 중복 자가 복사되는 현상을 원천 차단.
   - 동일 드라이브인 경우 복사 엔진 진입을 차단하고 `🚫 자가 복사 금지` 잠금 상태를 유지하여 원본 덮어쓰기 데이터 손상을 원천 방지.
   - **복사된 폴더 탐색기 타겟팅 (`OperationCompleteModal`, `BackupModal`, `OperationCompleteDialog`)**: `resolveCopiedFolderPath`로 드라이브 문자(`E:`)와 하위 경로(`NPKI\...`) 사이의 누락 백슬래시를 보정하여 실제 드라이브 루트(`E:\NPKI\...`)를 정확히 조합하고 탐색기(`explorer.exe`) 또는 Web 브리지·로컬 경로 폴백으로 안전하게 연결.

---

## 6. KCert.Core.dll 순수 창작 코어 라이브러리 5대 서브시스템 아키텍처

데스크톱 네이티브 에디션 및 독립 실행 툴킷을 위한 100% C# .NET 8 / .NET 10 순수 창작 DLL (`KCert.Core.dll`) 구조:

1. **`KCert.Core.Parser` (순수 ASN.1 파싱 & OID 분석 서브시스템)**:
   - 순수 ASN.1 DER 바이너리 TLV 파서 및 OID 인코더/디코더 (`KCertAsn1Reader.cs`)
   - PKCS#8 개인키 암호화 알고리즘(SEED, ARIA, AES, 3DES, PBKDF2) 정밀 분석기 (`KCertKeyAnalyzer.cs`)
   - NPKI 8대 공인기관, GPKI, EPKI, MPKI 한국형 정책 OID 역해석 엔진 (`KoreanCertPolicyOids.cs`) 및 RSA 3072-bit 전환 보안강도(`CertSecurityPosture`) 진단
   - `signCert.der` + `signPri.key` 키 쌍 정합성 및 만료 임박(30일) 정밀 판별기 (`CertPairValidator.cs`)
   - 원클릭 고속 메타데이터 추출기 (`KCertParser.cs` — `personal` OU · 개인 영문병기 패턴 우선 및 문맥 기반 기관 판별, `CryptoSecurityGrade` 산출)
2. **`KCert.Core.Discovery` (3단계 비차단 초고속 탐색 서브시스템)**:
   - **3단계 비차단 분리형 스캔 파이프라인 (`FastScanPipeline.cs`)**: `0단계 Local Fast-Pass` (외장/네트워크 대기 없이 PC 로컬 표준 경로 즉시 스캔) ➔ `1단계 Drive Fast-Pass` (준비된 이동식 드라이브 병렬 스캔) ➔ `2단계 Deep-Pass` (비표준·심층 경로 백그라운드 스트리밍). 말단 `\MPKI`/`/MPKI` 포함 GPKI/EPKI 자동 분류 및 다중 `class1` 스템 매칭(`FindMatchingPrivateKey`)·`SafeGetFullPath` 예외 가드 적용.
   - OS `DriveType` 사전 필터링(네트워크/CD-ROM 차단) + 병렬 바운디드 드라이브 준비 상태 검사(`IsDriveReadyBounded`, 350ms 상한)로 `MainWindow` 시작 시 `응답없음` 원천 제거 (`CertLocationScanner.cs`).
   - 권한 거부 및 시스템 특수 폴더(`CA`, `Root`, `CRL`, `Government of Korea`, `ldap`) 자동 스킵 안전 BFS 재귀 탐색기 및 `SearchLocationsDialog` 기본 경로 적용 시 3단계 Fast-Pass 보존.
3. **`KCert.Core.Diagnostics` (지능형 진단 & 중복 탐지 서브시스템)**:
   - 비표준/중첩 디렉터리 정밀 진단 및 표준 계층 경로 자동 복구(Auto-Repair) 엔진 (`CertIntegrityDoctor.cs` — 동적 개인키 파일명 보고, GPKI/EPKI `cn=` 단일 RDN 경로 정규화 및 다중 인증서 분리 `SubjectDn` 보존, `specificDerPath` 정밀 진단 및 동일 경로 자기덮어쓰기 `IOException` 방지 가드 포함).
   - 시스템 전역 드라이브(C/D/E/USB) 중복 인증서 클러스터링 및 잉여 복사본 분석 엔진 (`KCertAntiDuplicationEngine.cs` — PC 표준 경로를 USB 사본보다 우선 보존하는 `ScorePrimary` 및 `DerSha256` 누락 시 일련번호·발급기관·CN 폴백 그룹핑 적용).
   - 만료 위험 5단계 평가 및 인증기관별 공식 갱신 포털 자동 라우팅 엔진 (`CertExpirationAlarmEngine.cs` — `RenewalGuidanceDialog`/`renewalStore` 발급기관(Issuer) 및 카테고리 우선 매칭 적용).
4. **`KCert.Core.Vault` (보안 금고 & 원자적 트랜잭션 서브시스템)**:
   - 원본-대상 해시 검증 및 실패 시 자동 롤백을 지원하는 원자적 전송기 (`CertTransferEngine.cs` — `class1` 계층 보존 및 말단 `\GPKI`/`\EPKI` 판별)
   - AES-256-GCM + PBKDF2(10만 회) 기반 독자 보안 금고 패키징/복원 엔진 (`CertVaultPacker.cs`, `.kcertpack`)
   - 국제 표준 PKCS#12 (.pfx / .p12) 상호 변환 및 추출 엔진 (`CertBundleSecurityEngine.cs`)
   - 오삭제 방지 로컬 격리소 및 원클릭 복구 관리자 (`SafetyTrashManager.cs` — 볼륨 간 이동·덮어쓰기 전 `ClearReadOnlyAttributesRecursive` 읽기 전용 속성 해제)
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
4. **스크립트 통합**: `build.bat`, `build.cmd`, `build.ps1`, `.github/workflows/build.yml` 전 영역에서 단일 소스 원칙(Single Source of Truth)을 유지합니다.

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

## 10. UI 테이블 & DataGrid 1-Based 고정 인덱스 열(Frozen/Sticky) 아키텍처

1. **최좌측 1-Based 인덱싱 일원화 원칙**:
   - 데이터 컬렉션의 행 번호를 일반 사용자의 카운팅 규칙(`1, 2, 3...`)에 맞춰 최좌측 열 번호로 일관되게 제공하여 가독성과 직관성을 보장합니다.
   - 검색 필터링(`SearchQuery`), 상태 필터(`All`, `Valid`, `Expiring`, `Expired`), 정렬(`SortBy`) 등이 트리거될 때마다 뷰 모델 및 컴포넌트 렌더링 단계에서 `IndexNumber`를 1부터 시작하도록 실시간 재색인합니다 (`IndexNumber = i + 1`).
2. **최좌측 고정 열(Frozen / Sticky Column) 아키텍처**:
   - **WPF Native DataGrid**: `FrozenColumnCount="1"` 속성을 통해 가로 스크롤 시에도 최좌측 1번 인덱스 열이 화면 좌측에 항시 고정(Pinning)되도록 보장합니다. (`MainWindow`, `BackupHistoryDialog`, `TrashDialog`, `ActivityLogDialog`, `PcToUsbTransferDialog`, `UsbTransferDialog`)
   - **Web React Table**: Tailwind CSS `sticky left-0 z-10` 및 고정 배경색을 결합하여, 모바일 뷰포트 및 가로 스크롤 상황에서도 테이블 번호 열이 수평 스크롤에 밀려 사라지지 않도록 보호합니다.
3. **감사 로그(ActivityLog) 동적 재색인 파이프라인**:
   - `AppLogItem`에 `IndexNumber`를 탑재하고, 새 로그가 삽입될 때 최신 로그를 1번으로 두고 기존 항목들을 1부터 시작하도록 자동 재할당(`_logs[i].IndexNumber = i + 1;`)하여 실시간 감사 추적성을 극대화합니다.

---

## 11. 60fps 무한 유동 애니메이션 테두리(Animated Moving Border Glow) 아키텍처

1. **WPF 데스크톱 애니메이션 브러시 엔진 (`WpfAnimatedBorderHelper.cs`)**:
   - `LinearGradientBrush`의 `StartPointProperty` (0,0 ➔ 1,1) 및 `EndPointProperty` (1,1 ➔ 0,0)에 `PointAnimation` (2.2초/3.5초, `AutoReverse = true`, `RepeatBehavior.Forever`)을 바인딩하여 60fps 대각 무한 유동 애니메이션 구현.
   - 드라이브 카드 선택 상태(`isSelected`) 및 매체 종류(`isRemovableUsb`)에 따라 무지개 네온(`Blue`➔`Emerald`➔`Amber`➔`Indigo`) 및 에메랄드/청록 그라데이션 및 14px `DropShadowEffect` 글로우 발광을 동적으로 적용.
   - `TargetDrivePickerDialog`, `MainWindow` (사이드바 `SidebarTargetDriveBorder` 및 간편 백업 카드), `PcToUsbTransferDialog`, `UsbTransferDialog` 전 영역 탑재.
2. **React Web SPA 2중 레이어 무한 유동 테두리 규격 (`src/index.css`)**:
   - `border: 3px solid transparent`, `background-clip: padding-box, border-box`, `background-origin: padding-box, border-box` CSS 구조와 350% 크기의 `linear-gradient` (3초 loop) 및 `neonGlowPulse` 애니메이션을 결합.
   - WPF C# 데스크톱과 Visual Parity 100% 대칭 확립.

---

## 12. GitHub 이동 없는 앱 내 자동 다운로드·무인 셀프 설치 파이프라인 (`v2.1.0`)

1. **WPF 데스크톱 셀프 업데이트 엔진 (`UpdateCheckerService.cs`, `UpdateNotificationDialog.xaml/.cs`)**:
   - GitHub Releases REST API 조회 후 설치 애셋 URL(`https://github.com/AhBiYout-all/K-Certificate-Manager/releases/download/...`) 추출 및 `https://` 스킴·허용 호스트 검증.
   - `DownloadAndInstallAsync`: `%TEMP%\KCertManager_AutoUpdate\v{ver}\` 경로로 설치 파일(`.exe`/`.zip`)을 스트리밍 다운로드하면서 진행률(`IProgress<UpdateDownloadProgress>`) 실시간 보고.
   - PE 실행 파일(`MZ`) 또는 `PK` 매직 바이트 무결성 검증 후, UTF-8 BOM이 포함된 분리 실행 PowerShell 스크립트(`apply_self_update.ps1`)를 작성하여 프로세스 종료 대기 ➔ Inno Setup 무인 설치(`/SILENT /SUPPRESSMSGBOXES /NORESTART /CLOSEAPPLICATIONS`) ➔ `KCertManager.exe` 자동 재실행 ➔ 임시 폴더 정리를 순차 수행.
2. **Web 관리 콘솔 인앱 업데이트 엔진 (`updateChecker.ts`, `UpdateModal.tsx`)**:
   - `runInAppSelfUpdate`: 외부 페이지 이동 없이 `downloading` ➔ `verifying` (WebCrypto `SHA-256`) ➔ `installing` (Cache API 갱신 + `localStorage` `kcert_web_installed_version` 반영) 3단계 진행 상태를 실시간 렌더링.

---

## 13. WPF-Web 4대 테마 통합(저눈부심 회색·베이지 포함), 선택 상태 3중 격리 & 쉬운 표현 UI 아키텍처 (`v2.1.0` ~ `v2.2.0`)

1. **4대 테마 Visual Parity · 저눈부심 회색/베이지 & Tailwind `@custom-variant dark` 격리 (`src/index.css`, `MainViewModel.ApplyTheme`, WPF 전역 XAML)**:
   - Web·WPF 모두 **다크(`#0F1219`)**, **회색(*Misty Mineral Slate*, `#CCD4DF`/`#DFE5EC`)**, **베이지(*Warm Oat Paper*, `#E6DFD1`/`#F1ECE1`)**, **화이트(`#F8FAFC`/`#FFFFFF`)** 4대 테마(및 레거시 `pastel-*` 별칭)를 동적 CSS 변수(`--wpf-accent-*`, `--wpf-selected-row-secondary` 등)와 `DynamicResource` 브러시(`AccentAmberBrush` 포함)로 일치화했습니다.
   - `src/index.css`에 `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *, [data-theme="pastel-black"], [data-theme="pastel-black"] *));`를 명시하여 OS 다크 모드 설정이 Web 회색/베이지/화이트 테마의 Tailwind `dark:` 유틸리티를 오염시키지 않도록 차단했습니다.
   - WPF `WpfAnimatedBorderHelper.ApplyBorderGlow`는 `BgCardBrush`의 상대 휘도(Luminance)를 측정해 다크 테마는 `#142341` + `0.65` 글로우를, 비다크 테마는 `SelectedRowBgBrush` + `0.28` 글로우를 동적 적용하며, `MainWindow.xaml.cs`는 `CurrentTheme` 변경 시 `SidebarTargetDriveBorder`를 즉시 갱신합니다. 또한 6대 대화상자 `DataGrid` 선택 스타일과 보안등급·기관요약 색상을 `DynamicResource` 및 `DataTrigger`로 통합했습니다.
2. **선택 복사 · 필터 보기 · 단일 행 상세 클릭 3중 격리 & 다중 디스크 건수 정합화 (`App.tsx`, `CertificateList.tsx`, `BackupModal.tsx`, `backupService.ts`, `MainViewModel.cs`, `MainWindow.xaml.cs`)**:
   - 체크박스 선택(`selectedIds` / `IsSelected`), 현재 필터링된 보기(`visibleCertificates` / `FilteredCertificates`), 단일 행 상세 클릭(`inspectedCert` / `SelectedCertificate`)을 독립 상태로 분리합니다.
   - `resolveSelectedBackupCerts`, `handleOpenGeneralBackupModal` 및 WPF 일괄·가이드 복사는 항상 `selectedIds ∩ visibleCertificates`(또는 `FilteredCertificates`) 교집합만 산출하고 단일 행 상세 클릭 fallback 없이 전달해 필터 밖 숨김 항목이나 단일 클릭 항목이 의도치 않게 복사되는 현상을 원천 차단합니다.
   - 여러 물리 디스크에서 다중 선택 복사 시 자가 복사(`isSameDriveSelfCopy` / `ResolveEffectiveDestinationRoot`)와 동일 대상 표준 경로 중복을 제거한 실제 복사 ID(`copiedCertIds`) 기준으로 완료 건수, 중복 검사, 이력 및 드라이브별 보관 배지(`UpdateDriveCertificateCounts`)를 일치시키며 새로고침 시 기존 드라이브 배지 수치를 보존합니다.
3. **반응형 CSS Grid `auto-fill` 인증서 목록 (`CertificateList.tsx`)**:
   - `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` 반응형 카드 그리드를 기본 제공하고 `표 보기`와의 전환을 지원해 다양한 뷰포트에서 카드 자동 리플로우 구현.
4. **쉬운 일상 표현 우선 + 접이식 보조 설명 (`더보기` / WPF `Expander`)**:
   - Web 26개 컴포넌트와 WPF 전역 XAML·뷰모델 문구를 `개인키`, `원본 위치/저장 위치`, `찾는 위치`, `파일 손상 검사(SHA-256)` 기준으로 통일하고, 부가 경로/FAQ는 기본 접힘 영역으로 격리.

---

## 14. 수명주기 안전성, Dispatcher 가드 & 스토리지 JSON 스키마 하드닝 (`v2.1.1` ~ `v2.2.0` Pass 5)

1. **WPF UI 스레드 종료 가드 및 이벤트 수명주기 해제 (`DispatchSafe` / `OnClosed` / `IDisposable`)**:
   - `MainViewModel.DispatchSafe` 및 `MainWindow.DispatchUi`가 `Dispatcher.HasShutdownStarted`/`HasShutdownFinished`를 선검사하여 앱 종료 직전 백그라운드 콜백으로 인한 `TaskCanceledException`·무효 디스패치를 차단합니다.
   - `MainWindow`, `UsbTransferViewModel`/`UsbTransferDialog` (`_trackedCerts` + `DetachCertEvents()`), `PcToUsbTransferViewModel`, `UpdateNotificationDialog`는 창 종료 및 재스캔 시 `HwndSource.RemoveHook`, WMI/`PropertyChanged` 핸들러 구독 해제 및 `CancellationTokenSource` 정리를 수행하며, 비동기 UI 핸들러에 예외 방어(`try/catch`)와 `Owner` 바인딩을 강제합니다.
2. **React Web 리스너·타이머 누수 차단 및 엄격한 JSON/스토리지 검증**:
   - `Header`, `SettingsModal`, `AppActivityLogModal`, `BackupModal`, `UsbToPcModal`, `StartupWorkflowModal`, `App`, `CertificateList` 전반에 걸쳐 언마운트 시 `clearTimeout` 및 윈도우 `mousemove`/`mouseup` 리스너 정리를 보장합니다.
   - `protectedVaultStorage.ts`, `renewalStore.ts`, `activityLogger.ts`, `backupService.ts`, `CertificateList.tsx`(`colWidths`)는 `localStorage` 및 JSON 가져오기 파싱 시 `Array.isArray`·필드 타입·허용 숫자 범위(`Number.isFinite`)·`__proto__` 키 차단을 수행합니다.

---

## 15. RSA 3072-bit 보안강도 진단 & 2026 국내 인증 동향 아키텍처 (`v2.2.0`)

1. **오프라인 X.509 공개키 비트 길이 · 서명 알고리즘 판별 (`certParser.ts`, `KCertParser.cs`, `KoreanCertPolicyOids.cs`)**:
   - Web ASN.1 DER 파서와 WPF `System.Security.Cryptography.X509Certificates`에서 RSA 모듈러스 비트 길이(1024 / 2048 / 3072 / 4096-bit) 및 ECDSA 커브·서명 해시(`sha1` / `sha256`)를 자동 추출합니다.
   - KISA 2026 안내 및 2027.02.15 5대 공동인증기관 RSA 3072-bit 상향 로드맵에 맞춰 **`3072-bit 권장` (`Recommended3072`)**, **`2048-bit 전환 대상` (`Transition2048`)**, **`1024-bit·SHA-1 취약` (`WeakLegacy`)** 3단계 보안등급을 산출합니다.
   - 기존 RSA 2048-bit 인증서는 만료일까지 정상 사용 가능하므로 과잉 경고를 배제하고, `1024-bit` 이하 또는 `SHA-1` 인증서만 취약(`⚠️`) 재발급 대상으로 표출합니다.
2. **2026 법령 동향 · 7대 인증 체계 가이드 통합 (`SecurityGuideModal.tsx`, `SecurityGuideDialog.xaml`, `DiagnosticsRepairModal.tsx`, `DiagnosticsRepairDialog.xaml`)**:
   - GPKI·EPKI 비액티브엑스(HTML5) · 모바일 공무원증 병행, 금융인증서(3년) · 민간 간편인증(6개사) 비교, 2026.08.28 「전자정부법 시행령」 모바일 신분증 8종 안내 및 `보안강도 점검 (3072-bit)` 진단 탭·원클릭 리포트 복사를 Web/WPF 양쪽에 동시 구축했습니다.

---

## 16. 메타데이터 & 개발자
- **개발자**: AhBiYout
- **GitHub 저장소**: [https://github.com/AhBiYout-all/K-Certificate-Manager](https://github.com/AhBiYout-all/K-Certificate-Manager)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr)
- **소속회사**: (주)청운정보시스템 ( cisnet.co.kr )
- **버전**: `v2.2.0` (SemVer 2.0.0)

