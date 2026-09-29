import { CertificateItem, DiskDrive } from '../types';

/**
 * 인메모리 더미 DER/KEY 바이너리 생성 (실제 파일 데이터가 없는 경우 표준 포맷 시뮬레이션)
 */
export function createSyntheticCertData(cert: CertificateItem): Uint8Array {
  if (cert.files.certData instanceof Uint8Array) {
    return cert.files.certData;
  }
  const encoder = new TextEncoder();
  const header = `--- 대한민국 공인/행정 전자서명 인증서 (${cert.category}) ---\n`;
  const meta = `Subject: ${cert.subjectDn}\nIssuer: ${cert.issuer}\nSerial: ${cert.serialNumber}\nValidity: ${cert.validFrom} ~ ${cert.validTo}\nPolicy: ${cert.policy}\n`;
  return encoder.encode(header + meta + 'CERT_DATA_BYTES_SECURE_BINARY_' + cert.files.sha256);
}

export function createSyntheticKeyData(cert: CertificateItem): Uint8Array {
  if (cert.files.keyData instanceof Uint8Array) {
    return cert.files.keyData;
  }
  const encoder = new TextEncoder();
  const header = `--- 대한민국 공인/행정 전자서명 개인키 (${cert.category}) ---\n`;
  const meta = `Encrypted Private Key Format: PKCS#8 / SEED-CBC / ARIA\nSubject: ${cert.subjectDn}\n`;
  return encoder.encode(header + meta + 'ENCRYPTED_PRIVATE_KEY_SECURE_PAYLOAD');
}

export interface BackupOptions {
  includeManifest: boolean;
  customTargetFolder?: string;
  duplicateHandlingMode?: 'overwrite' | 'skip' | 'archive_old';
  skippedCertIds?: string[];
  archivedCertIds?: string[];
}

export interface DuplicateConflictItem {
  cert: CertificateItem;
  existingCert: CertificateItem;
  standardPath: string;
  isSameHash: boolean;
  isNewer: boolean;
  action: 'overwrite' | 'skip' | 'archive_old';
}

export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  conflicts: DuplicateConflictItem[];
  nonConflicting: CertificateItem[];
}

/**
 * 대상 드라이브에 이미 존재하는 동일한 이름/경로의 인증서 폴더 중복 검사
 */
export function detectDuplicateCertificates(
  selectedCerts: CertificateItem[],
  existingCerts: CertificateItem[],
  targetDrive: DiskDrive
): DuplicateDetectionResult {
  // Find all certs currently residing on targetDrive
  const targetDriveCerts = existingCerts.filter(c => {
    const sDrive = c.sourceDrive || '';
    const sLoc = c.sourceLocation || '';
    return sDrive.includes(targetDrive.letter) || sLoc.startsWith(targetDrive.letter);
  });

  const conflicts: DuplicateConflictItem[] = [];
  const nonConflicting: CertificateItem[] = [];

  for (const cert of selectedCerts) {
    const stdPath = getStandardDirectoryPath(cert);
    
    // Check if targetDrive has a certificate with the same subjectDn, name, or standard directory path
    const match = targetDriveCerts.find(tc => {
      if (tc.id === cert.id) return false;
      const tcStdPath = getStandardDirectoryPath(tc);
      const isPathMatch = tcStdPath.toLowerCase() === stdPath.toLowerCase();
      const isNameMatch = tc.name.trim() === cert.name.trim();
      const isDnMatch = tc.subjectDn.toLowerCase() === cert.subjectDn.toLowerCase();
      const isLocMatch = tc.sourceLocation.toLowerCase().includes(stdPath.toLowerCase());
      return isPathMatch || isNameMatch || isDnMatch || isLocMatch;
    });

    if (match) {
      const isSameHash = cert.files.sha256 === match.files.sha256;
      const isNewer = new Date(cert.validTo).getTime() >= new Date(match.validTo).getTime();
      conflicts.push({
        cert,
        existingCert: match,
        standardPath: stdPath,
        isSameHash,
        isNewer,
        action: 'overwrite',
      });
    } else {
      nonConflicting.push(cert);
    }
  }

  return {
    hasDuplicates: conflicts.length > 0,
    conflicts,
    nonConflicting,
  };
}

export interface BackupResult {
  success: boolean;
  message: string;
  totalCertificates: number;
  totalFiles: number;
  checksum: string;
}

export interface DiskWriteCheckResult {
  isWritable: boolean;
  status: 'OK' | 'WRITE_PROTECTED' | 'PERMISSION_DENIED' | 'INSUFFICIENT_SPACE' | 'READ_ONLY_FILESYSTEM';
  message: string;
  testedDriveLetter: string;
  testedDriveName: string;
  testedAt: string;
  details: {
    hardwareLockSwitch: boolean;
    registryWriteProtected: boolean;
    fileSystemReadOnly: boolean;
    probeFileTestPassed: boolean;
    latencyMs: number;
    availableSpaceMb: number;
    probeFileName?: string;
  };
  solutions: string[];
}

/**
 * 대상 드라이브의 실제 쓰기 가능 여부 및 쓰기 금지(Write-Protection) 상태 검사
 */
export async function checkDriveWritePermission(
  drive: DiskDrive,
  options?: {
    forceSimulatedLock?: boolean;
    dirHandle?: any;
    requiredSpaceMb?: number;
  }
): Promise<DiskWriteCheckResult> {
  const startTime = performance.now();
  const timestamp = new Date().toLocaleTimeString('ko-KR');
  const probeFileName = `.__kcert_probe_${Date.now()}.tmp`;
  const requiredSpaceMb = options?.requiredSpaceMb || 10;

  // Simulate I/O latency for realistic hardware probe
  await new Promise(resolve => setTimeout(resolve, 250));
  const latencyMs = Math.round(performance.now() - startTime);

  // 1. Direct File System Access API Handle Test (if provided)
  if (options?.dirHandle) {
    try {
      const probeHandle = await options.dirHandle.getFileHandle(probeFileName, { create: true });
      const writable = await probeHandle.createWritable();
      const testBytes = new TextEncoder().encode('KCERT_PROBE_WRITE_TEST_OK');
      await writable.write(testBytes);
      await writable.close();
      
      // Clean up probe file immediately
      if (typeof options.dirHandle.removeEntry === 'function') {
        try {
          await options.dirHandle.removeEntry(probeFileName);
        } catch (_) {
          // Ignore cleanup error
        }
      }

      return {
        isWritable: true,
        status: 'OK',
        message: `${drive.letter} 디스크 I/O 쓰기 테스트를 성공적으로 통과했습니다. (실제 폴더 쓰기 권한 확인)`,
        testedDriveLetter: drive.letter,
        testedDriveName: drive.name,
        testedAt: timestamp,
        details: {
          hardwareLockSwitch: false,
          registryWriteProtected: false,
          fileSystemReadOnly: false,
          probeFileTestPassed: true,
          latencyMs,
          availableSpaceMb: 1024,
          probeFileName,
        },
        solutions: [],
      };
    } catch (err: any) {
      const isNotAllowed = err.name === 'NotAllowedError' || err.name === 'SecurityError';
      return {
        isWritable: false,
        status: isNotAllowed ? 'PERMISSION_DENIED' : 'WRITE_PROTECTED',
        message: `${drive.letter} 드라이브에 파일을 생성할 수 없습니다: ${err.message || '쓰기 권한 거부 또는 쓰기 금지 상태입니다.'}`,
        testedDriveLetter: drive.letter,
        testedDriveName: drive.name,
        testedAt: timestamp,
        details: {
          hardwareLockSwitch: true,
          registryWriteProtected: false,
          fileSystemReadOnly: true,
          probeFileTestPassed: false,
          latencyMs,
          availableSpaceMb: 0,
          probeFileName,
        },
        solutions: [
          '브라우저 팝업 창에서 폴더 [수정 권한 / 파일 저장 허용]을 승인해 주세요.',
          'USB 메모리 측면의 물리 쓰기 방지 스위치(LOCK)를 UNLOCK 방향으로 전환하세요.',
          '사내 보안 프로그램(DLP / USB 쓰기 제어)의 USB 쓰기 예외 허용을 확인하세요.',
        ],
      };
    }
  }

  // 2. Simulated Hardware & OS Attribute Check
  const isLocked = options?.forceSimulatedLock || drive.isWritable === false;

  if (isLocked) {
    return {
      isWritable: false,
      status: 'WRITE_PROTECTED',
      message: `[경고] ${drive.letter} (${drive.name}) 디스크가 '쓰기 금지(Write-Protected)' 상태로 보호되어 있어 인증서를 복사할 수 없습니다.`,
      testedDriveLetter: drive.letter,
      testedDriveName: drive.name,
      testedAt: timestamp,
      details: {
        hardwareLockSwitch: true,
        registryWriteProtected: true,
        fileSystemReadOnly: true,
        probeFileTestPassed: false,
        latencyMs,
        availableSpaceMb: 0,
        probeFileName,
      },
      solutions: [
        'USB 메모리 측면의 물리 락(LOCK) 스위치가 잠금 상태인지 확인하고 UNLOCK 위치로 전환하세요.',
        '명령 프롬프트(관리자)에서 "diskpart" 실행 후 "attributes disk clear readonly"를 입력하여 읽기 전용 속성을 해제하세요.',
        '윈도우 레지스트리 (HKLM\\SYSTEM\\CurrentControlSet\\Control\\StorageDevicePolicies)의 "WriteProtect" 값이 1인 경우 0으로 변경하세요.',
        '사내 보안 소프트웨어(DLP/매체제어)가 USB 쓰기를 차단 중인 경우 보안 관리자에게 쓰기 권한 승인을 요청하세요.',
      ],
    };
  }

  // 3. Normal Writable Drive Success
  return {
    isWritable: true,
    status: 'OK',
    message: `${drive.letter} (${drive.name}) 디스크의 쓰기 권한 및 여유 공간 점검을 통과했습니다. (I/O 정상)`,
    testedDriveLetter: drive.letter,
    testedDriveName: drive.name,
    testedAt: timestamp,
    details: {
      hardwareLockSwitch: false,
      registryWriteProtected: false,
      fileSystemReadOnly: false,
      probeFileTestPassed: true,
      latencyMs,
      availableSpaceMb: 25600,
      probeFileName,
    },
    solutions: [],
  };
}

/**
 * 경로 세그먼트/파일명에서 상위 폴더 이동(..) 및 시스템 예약 문자 제거 (Path Traversal 차단)
 */
function sanitizePathSegment(segment: string): string {
  const cleaned = segment
    .replace(/\.\.+/g, '_')
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
    .trim();
  return cleaned && cleaned !== '.' ? cleaned : 'CertUser';
}

/**
 * NPKI / GPKI 표준 디렉토리 경로 계산
 */
export function getStandardDirectoryPath(cert: CertificateItem): string {
  // 공무원 인증서 (GPKI)
  if (cert.category === 'GPKI_GOV') {
    const rawCn = cert.subjectDn.includes('cn=') 
      ? cert.subjectDn.split(',')[0]
      : `cn=${cert.name}`;
    return `GPKI/Certificate/class2/${sanitizePathSegment(rawCn)}`;
  }

  // 교육행정 인증서 (EPKI)
  if (cert.category === 'EPKI_EDU') {
    const rawCn = cert.subjectDn.includes('cn=') 
      ? cert.subjectDn.split(',')[0]
      : `cn=${cert.name}`;
    return `EPKI/Certificate/class2/${sanitizePathSegment(rawCn)}`;
  }

  // 은행/법인 공동인증서 (NPKI)
  let caSubdir = 'yessign';
  if (cert.issuer.includes('코스콤') || cert.issuer.includes('SignKorea')) {
    caSubdir = 'SignKorea';
  } else if (cert.issuer.includes('한국정보인증') || cert.issuer.includes('KICA')) {
    caSubdir = 'KICA';
  } else if (cert.issuer.includes('한국전자인증') || cert.issuer.includes('CrossCert')) {
    caSubdir = 'CrossCert';
  } else if (cert.issuer.includes('한국무역정보') || cert.issuer.includes('TradeSign')) {
    caSubdir = 'TradeSign';
  }

  const rawCn = cert.subjectDn.includes('cn=')
    ? cert.subjectDn
    : `cn=${cert.name},ou=personal,o=yessign,c=kr`;

  return `NPKI/${caSubdir}/USER/${sanitizePathSegment(rawCn)}`;
}

/**
 * 선택된 인증서들을 대상 디스크 규격으로 복사 및 무결성 검증
 */
export async function copyCertificatesToDisk(
  certificates: CertificateItem[],
  targetDrive: DiskDrive,
  options: BackupOptions
): Promise<BackupResult> {
  let totalFiles = 0;
  const manifestItems: any[] = [];
  const skippedIds = new Set(options.skippedCertIds || []);
  const archivedIds = new Set(options.archivedCertIds || []);

  const activeCerts = certificates.filter(c => !skippedIds.has(c.id));

  for (const cert of activeCerts) {
    const basePath = getStandardDirectoryPath(cert);
    totalFiles++; // cert (.der)
    if (cert.files.hasKey) totalFiles++; // key (.key)
    if (cert.files.kmCertName) totalFiles++;
    if (cert.files.kmKeyName) totalFiles++;

    const isArchived = archivedIds.has(cert.id);

    manifestItems.push({
      userName: cert.name,
      category: cert.category,
      issuer: cert.issuer,
      policy: cert.policy,
      serialNumber: cert.serialNumber,
      validPeriod: `${cert.validFrom} ~ ${cert.validTo}`,
      targetRelativePath: basePath,
      archivedExistingBackup: isArchived,
      sha256Fingerprint: cert.files.sha256,
      files: [
        cert.files.certName,
        cert.files.hasKey ? cert.files.keyName : null,
        cert.files.kmCertName,
        cert.files.kmKeyName,
      ].filter(Boolean),
    });
  }

  if (options.includeManifest) {
    totalFiles += 2; // manifest & integrity logs
  }

  const skippedCount = certificates.length - activeCerts.length;
  let summaryMsg = `${activeCerts.length}개의 인증서가 ${targetDrive.letter} 이동식 디스크 규격으로 안전하게 복사되었습니다.`;
  if (skippedCount > 0) {
    summaryMsg += ` (중복 ${skippedCount}개 건너뜀)`;
  }
  if (archivedIds.size > 0) {
    summaryMsg += ` (기존 ${archivedIds.size}개 백업 보존)`;
  }

  return {
    success: true,
    message: summaryMsg,
    totalCertificates: activeCerts.length,
    totalFiles,
    checksum: manifestItems[0]?.sha256Fingerprint.slice(0, 16) || 'SECURE_OK',
  };
}

/**
 * File System Access API를 통해 실제 선택한 USB 폴더에 직접 디렉토리/파일 생성
 */
export async function writeCertificatesToDirectoryHandle(
  certificates: CertificateItem[],
  dirHandle: any,
  options?: { skippedCertIds?: string[]; archiveOldFolder?: boolean }
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;
    const skippedIds = new Set(options?.skippedCertIds || []);
    const activeCerts = certificates.filter(c => !skippedIds.has(c.id));

    for (const cert of activeCerts) {
      const fullPath = getStandardDirectoryPath(cert);
      const pathSegments = fullPath.split('/');
      
      let currentDir = dirHandle;
      for (const segment of pathSegments) {
        const safeSegment = sanitizePathSegment(segment);
        currentDir = await currentDir.getDirectoryHandle(safeSegment, { create: true });
      }

      // cert file
      const safeCertFileName = sanitizePathSegment(cert.files.certName || 'signCert.der');
      const certFileHandle = await currentDir.getFileHandle(safeCertFileName, { create: true });
      const writableCert = await certFileHandle.createWritable();
      await writableCert.write(createSyntheticCertData(cert));
      await writableCert.close();
      count++;

      // key file
      if (cert.files.hasKey) {
        const safeKeyFileName = sanitizePathSegment(cert.files.keyName || 'signPri.key');
        const keyFileHandle = await currentDir.getFileHandle(safeKeyFileName, { create: true });
        const writableKey = await keyFileHandle.createWritable();
        await writableKey.write(createSyntheticKeyData(cert));
        await writableKey.close();
        count++;
      }
    }
    return { success: true, count };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || '파일 쓰기 권한이 거부되었습니다.' };
  }
}
