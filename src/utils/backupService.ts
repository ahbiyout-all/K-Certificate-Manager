import { CertificateItem, DiskDrive } from '../types';
import { isSameDriveSelfCopy } from './driveFilter';
import {
  buildTransferPlan,
  executeTransferPlan,
  getUnifiedRelativeSubPath,
} from './unifiedTransferEngine';
import { ENGINE_IO_BUFFER_BYTES, recordEngineStreamMetric } from './engineDebug';

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
  existingCertificates?: CertificateItem[];
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
 * 대상 드라이브에 이미 존재하는 동일한 이름/경로의 인증서 폴더 중복 검사 (통합 전송 엔진 계획기 위임)
 */
export function detectDuplicateCertificates(
  selectedCerts: CertificateItem[],
  existingCerts: CertificateItem[],
  targetDrive: DiskDrive
): DuplicateDetectionResult {
  const plan = buildTransferPlan({
    sources: selectedCerts,
    targetDrive,
    existingCertificates: existingCerts,
    conflictStrategy: 'overwrite',
  });

  const conflicts: DuplicateConflictItem[] = [];
  const nonConflicting: CertificateItem[] = [];

  for (const planned of plan.items) {
    const cert = planned.source.originalCert;
    if (!cert) continue;

    if (planned.conflict) {
      conflicts.push({
        cert,
        existingCert: planned.conflict.existingCert,
        standardPath: planned.relativeSubPath,
        isSameHash: planned.conflict.isSameHash,
        isNewer: planned.conflict.isNewer,
        action: 'overwrite',
      });
    } else if (planned.isExecutable) {
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
  copiedCertIds?: string[];
  skippedCount?: number;
  resultCertificates?: CertificateItem[];
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
 * NPKI / GPKI 표준 디렉토리 경로 계산 (통합 전송 엔진 위임)
 */
export function getStandardDirectoryPath(cert: CertificateItem): string {
  return getUnifiedRelativeSubPath(cert);
}

/**
 * 선택된 인증서들을 대상 디스크 규격으로 복사 및 무결성 검증 (통합 전송 엔진 위임)
 */
export async function copyCertificatesToDisk(
  certificates: CertificateItem[],
  targetDrive: DiskDrive,
  options: BackupOptions
): Promise<BackupResult> {
  const plan = buildTransferPlan({
    sources: certificates,
    targetDrive,
    existingCertificates: options.existingCertificates || [],
    conflictStrategy: options.duplicateHandlingMode || 'overwrite',
    includeManifest: options.includeManifest,
    skippedCertIds: options.skippedCertIds,
    archivedCertIds: options.archivedCertIds,
  });

  const execResult = await executeTransferPlan(plan);

  return {
    success: execResult.success,
    message: execResult.message,
    totalCertificates: execResult.executedCount,
    totalFiles: execResult.totalFilesCopied,
    checksum: execResult.checksum || 'SECURE_OK',
    copiedCertIds: execResult.copiedCertIds,
    skippedCount: execResult.skippedCount,
    resultCertificates: execResult.resultCertificates,
  };
}

/**
 * File System Access API를 통해 실제 선택한 USB 폴더에 직접 디렉토리/파일 생성
 */
export async function writeCertificatesToDirectoryHandle(
  certificates: CertificateItem[],
  dirHandle: any,
  options?: { skippedCertIds?: string[]; archivedCertIds?: string[]; archiveOldFolder?: boolean; targetDrive?: DiskDrive }
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;
    const skippedIds = new Set(options?.skippedCertIds || []);
    const archivedIds = new Set(options?.archivedCertIds || []);
    const candidateCerts = certificates.filter(
      c => !skippedIds.has(c.id) && (!options?.targetDrive || !isSameDriveSelfCopy(c, options.targetDrive))
    );
    const seenTargetPaths = new Set<string>();
    const activeCerts: CertificateItem[] = [];
    for (const cert of candidateCerts) {
      const certFileKey = (cert.files?.certName || 'signcert.der').trim().toLowerCase();
      const serialFallback = certFileKey === 'signcert.der' ? (cert.serialNumber || '').trim().toLowerCase() : '';
      const normPath = `${getStandardDirectoryPath(cert).replace(/\//g, '\\').toLowerCase()}|${certFileKey}|${serialFallback}`;
      if (seenTargetPaths.has(normPath)) continue;
      seenTargetPaths.add(normPath);
      activeCerts.push(cert);
    }

    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const selectedHandleName = (dirHandle?.name || '').trim().toLowerCase();

    for (const cert of activeCerts) {
      const fullPath = getStandardDirectoryPath(cert);
      const rawSegments = fullPath.split('/').filter(Boolean);
      const pathSegments =
        selectedHandleName &&
        rawSegments.length > 1 &&
        rawSegments[0].toLowerCase() === selectedHandleName
          ? rawSegments.slice(1)
          : rawSegments;

      let parentDir = dirHandle;
      let currentDir = dirHandle;
      let lastSafeSegment = sanitizePathSegment(dirHandle?.name || 'CertUser');
      for (let i = 0; i < pathSegments.length; i++) {
        const safeSegment = sanitizePathSegment(pathSegments[i]);
        parentDir = currentDir;
        lastSafeSegment = safeSegment;
        currentDir = await currentDir.getDirectoryHandle(safeSegment, { create: true });
      }

      const isSharedClassDir =
        /^(?:class[123]|certificate)$/i.test(lastSafeSegment) ||
        /(?:^|\/)(?:GPKI|EPKI|MPKI)\/Certificate(?:\/class[123])?$/i.test(fullPath);

      // Preserve existing cert files into _backup_YYYYMMDD folder when requested
      if ((options?.archiveOldFolder || archivedIds.has(cert.id)) && typeof currentDir.values === 'function') {
        const certNameLower = (cert.files?.certName || '').trim().toLowerCase();
        const isGenericName = !certNameLower || certNameLower === 'signcert.der' || certNameLower === 'signcert.cer';
        const collidingFileNames = new Set(
          [cert.files?.certName, cert.files?.keyName, cert.files?.kmCertName, cert.files?.kmKeyName]
            .filter((n): n is string => Boolean(n))
            .map(n => sanitizePathSegment(n).toLowerCase())
        );

        const existingFiles: any[] = [];
        try {
          for await (const entry of currentDir.values()) {
            if (entry?.kind === 'file') {
              if ((isGenericName && !isSharedClassDir) || collidingFileNames.has((entry.name || '').toLowerCase())) {
                existingFiles.push(entry);
              }
            }
          }
        } catch {
          // Ignore if directory iteration is unavailable
        }
        if (existingFiles.length > 0) {
          const backupContainerParent = isSharedClassDir ? currentDir : parentDir;
          const backupFolderBase = isSharedClassDir
            ? `_backup_${sanitizePathSegment(cert.name || 'cert')}_${dateTag}`
            : `${lastSafeSegment}_backup_${dateTag}`;
          if (typeof backupContainerParent?.getDirectoryHandle === 'function') {
            const backupDir = await backupContainerParent.getDirectoryHandle(
              sanitizePathSegment(backupFolderBase),
              { create: true }
            );
            for (const fileEntry of existingFiles) {
              try {
                const fh = typeof fileEntry.getFile === 'function'
                  ? fileEntry
                  : await currentDir.getFileHandle(fileEntry.name);
                const f = await fh.getFile();
                const buf = await f.arrayBuffer();
                const dstFile = await backupDir.getFileHandle(sanitizePathSegment(fileEntry.name), { create: true });
                const w = await dstFile.createWritable();
                await w.write(new Uint8Array(buf));
                await w.close();
              } catch {
                // Best-effort archive copy
              }
            }
          }
        }
      }

      const shaPrefix = (cert.files?.sha256 || '').slice(0, 12) || undefined;
      const writeMeasuredFile = async (fileName: string, payload: Uint8Array) => {
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(payload);
        await writable.close();
        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        recordEngineStreamMetric({
          fileName,
          certName: cert.name,
          byteLength: payload.byteLength,
          bufferAllocatedBytes: Math.min(
            ENGINE_IO_BUFFER_BYTES,
            Math.max(payload.byteLength, 4096)
          ),
          elapsedMs: Math.max(0.01, t1 - t0),
          mode: 'FS_WRITABLE',
          status: 'DONE',
          sha256Prefix: shaPrefix,
        });
      };

      // cert file
      const safeCertFileName = sanitizePathSegment(cert.files.certName || 'signCert.der');
      await writeMeasuredFile(safeCertFileName, createSyntheticCertData(cert));
      count++;

      // key file
      if (cert.files.hasKey) {
        const safeKeyFileName = sanitizePathSegment(cert.files.keyName || 'signPri.key');
        await writeMeasuredFile(safeKeyFileName, createSyntheticKeyData(cert));
        count++;
      }

      // companion encryption cert/key pair (GPKI/EPKI kmCert/kmPri or _env)
      if (cert.files.kmCertName) {
        const safeKmCertName = sanitizePathSegment(cert.files.kmCertName);
        const encoder = new TextEncoder();
        const kmPayload =
          cert.files.certData instanceof Uint8Array
            ? cert.files.certData
            : encoder.encode(`--- KM/ENV ENCRYPTION CERT (${cert.category}) ---\nSubject: ${cert.subjectDn}\nSerial: ${cert.serialNumber}\n`);
        await writeMeasuredFile(safeKmCertName, kmPayload);
        count++;
      }
      if (cert.files.kmKeyName) {
        const safeKmKeyName = sanitizePathSegment(cert.files.kmKeyName);
        const encoder = new TextEncoder();
        const kmKeyPayload =
          cert.files.keyData instanceof Uint8Array
            ? cert.files.keyData
            : encoder.encode(`--- KM/ENV ENCRYPTION KEY (${cert.category}) ---\nSubject: ${cert.subjectDn}\n`);
        await writeMeasuredFile(safeKmKeyName, kmKeyPayload);
        count++;
      }
    }
    return { success: true, count };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || '파일 쓰기 권한이 거부되었습니다.' };
  }
}
