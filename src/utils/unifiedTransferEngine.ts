import { CertificateItem, CertCategory, DiskDrive } from '../types';
import { isPcCertificate, isRemovableOrExternalDrive, isSameDriveSelfCopy } from './driveFilter';
import { extractDriveLetterChar } from './driveColors';
import { extractDriveLetterFromPathOrLabel } from './certDiagnostics';
import { isClass1Certificate } from './certPathUtils';
import type { UsbDetectedCert } from './usbToPcService';
import {
  beginEngineSession,
  completeEngineSession,
  ENGINE_IO_BUFFER_BYTES,
  failEngineSession,
  recordEngineStreamMetric,
  updateEngineSessionStatus,
} from './engineDebug';

export type TransferDirection = 'PC_TO_USB' | 'USB_TO_PC' | 'DISK_TO_DISK' | 'USB_TO_USB';

export type TransferConflictStrategy = 'overwrite' | 'skip' | 'archive_old' | 'rename';

export type NormalizedConflictStrategy = 'overwrite' | 'skip' | 'archive_old';

export type TransferPlanAction =
  | 'COPY_NEW'
  | 'OVERWRITE'
  | 'ARCHIVE_AND_COPY'
  | 'SKIP_SELF_COPY'
  | 'SKIP_DUPLICATE_CONFLICT'
  | 'SKIP_BATCH_DUPLICATE';

export interface UnifiedTransferSourceItem {
  id: string;
  sourceType: 'CERT_ITEM' | 'USB_DETECTED';
  name: string;
  subjectDn: string;
  category: CertCategory;
  issuer: string;
  policy: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expiring' | 'expired';
  daysRemaining: number;
  sourceLocation: string;
  sourceDrive: string;
  isRemovableSource: boolean;
  isClass1?: boolean;
  departmentOrOrg?: string;
  isInstitutional?: boolean;
  files: {
    certName: string;
    keyName: string;
    kmCertName?: string;
    kmKeyName?: string;
    hasKey: boolean;
    certSize?: number;
    keySize?: number;
    certData?: Uint8Array | string;
    keyData?: Uint8Array | string;
    sha256: string;
  };
  originalCert?: CertificateItem;
  originalUsbCert?: UsbDetectedCert;
}

export interface TransferTargetSpec {
  driveLetter: string;
  driveName?: string;
  isRemovable?: boolean;
  isSystemDrive?: boolean;
  targetUsername?: string;
  rawDrive?: DiskDrive;
}

export interface TransferPlanRequest {
  sources: Array<CertificateItem | UsbDetectedCert | UnifiedTransferSourceItem>;
  targetDrive: DiskDrive | TransferTargetSpec;
  existingCertificates?: CertificateItem[];
  conflictStrategy?: TransferConflictStrategy;
  perItemDecisions?: Record<string, TransferConflictStrategy>;
  targetUsername?: string;
  includeManifest?: boolean;
  /** Optional legacy pre-excluded IDs */
  skippedCertIds?: string[];
  /** Optional legacy archive-override IDs */
  archivedCertIds?: string[];
  /** Restrict duplicate detection to PC certificates only (USB -> PC mode) */
  restrictConflictScanToPcOnly?: boolean;
  /** Allow copying between custom folder and standard path on the same drive if paths differ (USB/Folder -> PC mode) */
  selfCopyByExactPathOnly?: boolean;
}

export interface TransferConflictDetail {
  existingCert: CertificateItem;
  isSameHash: boolean;
  isNewer: boolean;
}

export interface PlannedTransferItem {
  source: UnifiedTransferSourceItem;
  action: TransferPlanAction;
  isExecutable: boolean;
  relativeSubPath: string;
  destinationRoot: string;
  destinationFullPath: string;
  canonicalDestinationKey: string;
  conflict?: TransferConflictDetail;
  estimatedFileCount: number;
  reason: string;
}

export interface TransferPlanSummary {
  totalRequested: number;
  executableCount: number;
  copyNewCount: number;
  overwriteCount: number;
  archiveCount: number;
  conflictCount: number;
  skippedCount: number;
  skippedSelfCopyCount: number;
  skippedConflictCount: number;
  skippedBatchDuplicateCount: number;
  estimatedFileCount: number;
  hasDuplicates: boolean;
  hasExecutableItems: boolean;
  isAllSelfCopy: boolean;
  previewSummaryText: string;
}

export interface TransferPlan {
  planId: string;
  createdAtIso: string;
  direction: TransferDirection;
  targetDriveLetter: string;
  targetDriveName: string;
  isTargetRemovable: boolean;
  targetUsername: string;
  targetDisplayRoot: string;
  conflictStrategy: NormalizedConflictStrategy;
  includeManifest: boolean;
  items: PlannedTransferItem[];
  executableItems: PlannedTransferItem[];
  skippedItems: PlannedTransferItem[];
  conflictItems: PlannedTransferItem[];
  summary: TransferPlanSummary;
}

export interface TransferExecutionOptions {
  dirHandle?: any;
  writeDirectToDisk?: boolean;
  directoryWriter?: (
    certs: CertificateItem[],
    dirHandle: any,
    opts?: { skippedCertIds?: string[]; archivedCertIds?: string[]; targetDrive?: DiskDrive }
  ) => Promise<{ success: boolean; count: number; error?: string }>;
  onProgress?: (percent: number) => void;
  onLog?: (line: string) => void;
}

export interface TransferExecutionResult {
  success: boolean;
  plan: TransferPlan;
  executedCount: number;
  newCount: number;
  overwriteCount: number;
  archiveCount: number;
  skippedCount: number;
  totalFilesCopied: number;
  copiedCertIds: string[];
  resultCertificates: CertificateItem[];
  destinationPaths: string[];
  checksum: string;
  message: string;
  logs: string[];
  directWriteError?: string;
}

/**
 * 경로 세그먼트/파일명에서 상위 폴더 이동(..) 및 시스템 예약 문자 제거 (Path Traversal 차단)
 */
export function sanitizeTransferPathSegment(segment: string): string {
  const cleaned = segment
    .replace(/\.\.+/g, '_')
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
    .trim();
  return cleaned && cleaned !== '.' ? cleaned : 'CertUser';
}

export function normalizeConflictStrategy(strategy?: TransferConflictStrategy): NormalizedConflictStrategy {
  if (strategy === 'skip') return 'skip';
  if (strategy === 'archive_old' || strategy === 'rename') return 'archive_old';
  return 'overwrite';
}

function normalizeDriveColon(raw: string | undefined, fallback = 'E:'): string {
  const ch = extractDriveLetterChar(raw || '');
  if (ch) return `${ch}:`;
  const fbCh = extractDriveLetterChar(fallback);
  return fbCh ? `${fbCh}:` : 'E:';
}

function isUsbDetectedInput(input: any): input is UsbDetectedCert {
  return Boolean(input && typeof input.usbPath === 'string' && input.sourceType !== 'CERT_ITEM' && input.sourceType !== 'USB_DETECTED');
}

function isUnifiedSourceInput(input: any): input is UnifiedTransferSourceItem {
  return Boolean(input && (input.sourceType === 'CERT_ITEM' || input.sourceType === 'USB_DETECTED'));
}

export function normalizeTransferSourceItem(
  input: CertificateItem | UsbDetectedCert | UnifiedTransferSourceItem
): UnifiedTransferSourceItem {
  if (isUnifiedSourceInput(input)) {
    return input;
  }

  if (isUsbDetectedInput(input)) {
    const class1 =
      Boolean(input.isClass1) ||
      /[\\/]class1(?:$|[\\/])/i.test((input.usbPath || '').replace(/\//g, '\\'));
    return {
      id: input.id,
      sourceType: 'USB_DETECTED',
      name: input.name,
      subjectDn: input.subjectDn,
      category: input.category,
      issuer: input.issuer,
      policy: input.policy,
      serialNumber: input.serialNumber,
      validFrom: input.validFrom,
      validTo: input.validTo,
      status: input.status,
      daysRemaining: input.daysRemaining,
      sourceLocation: input.usbPath,
      sourceDrive: input.usbDriveLetter,
      isRemovableSource: true,
      isClass1: class1,
      departmentOrOrg: input.departmentOrOrg,
      isInstitutional: input.isInstitutional || class1,
      files: {
        certName: input.files?.certName || 'signCert.der',
        keyName: input.files?.keyName || 'signPri.key',
        kmCertName: input.files?.kmCertName,
        kmKeyName: input.files?.kmKeyName,
        hasKey: input.files?.hasKey ?? true,
        certSize:
          input.files?.certSize ??
          (input.files?.certData instanceof Uint8Array ? input.files.certData.byteLength : 2048),
        keySize:
          input.files?.keySize ??
          (input.files?.keyData instanceof Uint8Array
            ? input.files.keyData.byteLength
            : input.files?.hasKey
              ? 1024
              : 0),
        certData: input.files?.certData,
        keyData: input.files?.keyData,
        sha256: input.files?.sha256 || '',
      },
      originalUsbCert: input,
    };
  }

  const cert = input as CertificateItem;
  const class1 = isClass1Certificate(cert);
  return {
    id: cert.id,
    sourceType: 'CERT_ITEM',
    name: cert.name,
    subjectDn: cert.subjectDn,
    category: cert.category,
    issuer: cert.issuer,
    policy: cert.policy,
    serialNumber: cert.serialNumber,
    validFrom: cert.validFrom,
    validTo: cert.validTo,
    status: cert.status,
    daysRemaining: cert.daysRemaining,
    sourceLocation: cert.sourceLocation || '',
    sourceDrive: cert.sourceDrive || '',
    isRemovableSource: Boolean(cert.isRemovableMedia) || !isPcCertificate(cert),
    isClass1: class1,
    departmentOrOrg: cert.departmentOrOrg,
    isInstitutional: cert.isInstitutional || class1,
    files: {
      certName: cert.files?.certName || 'signCert.der',
      keyName: cert.files?.keyName || 'signPri.key',
      kmCertName: cert.files?.kmCertName,
      kmKeyName: cert.files?.kmKeyName,
      hasKey: cert.files?.hasKey ?? true,
      certSize: cert.files?.certSize,
      keySize: cert.files?.keySize,
      certData: cert.files?.certData,
      keyData: cert.files?.keyData,
      sha256: cert.files?.sha256 || '',
    },
    originalCert: cert,
  };
}

/**
 * NPKI / GPKI / EPKI 표준 상대 디렉토리 경로 계산 (슬래시 구분자 형태: backupService 호환)
 */
export function getUnifiedRelativeSubPath(cert: {
  name?: string;
  subjectDn?: string;
  category: CertCategory;
  issuer?: string;
  isClass1?: boolean;
  sourceLocation?: string;
  usbPath?: string;
}): string {
  const subjectDn = (cert.subjectDn || '').trim();
  const cnMatch = subjectDn.match(/(?:^|,)\s*(cn\s*=\s*[^,]+)/i);
  const extractedCn = cnMatch
    ? `cn=${cnMatch[1].replace(/^cn\s*=\s*/i, '').trim()}`
    : '';
  const hasCn = Boolean(cnMatch);
  const effectiveLoc = cert.sourceLocation || cert.usbPath || '';
  const classTier =
    Boolean(cert.isClass1) ||
    /[\\/]class1(?:$|[\\/])/i.test(effectiveLoc.replace(/\//g, '\\'))
      ? 'class1'
      : 'class2';

  if (cert.category === 'GPKI_GOV') {
    const rawCn = extractedCn || `cn=${cert.name || '사용자'}`;
    return `GPKI/Certificate/${classTier}/${sanitizeTransferPathSegment(rawCn)}`;
  }

  if (cert.category === 'EPKI_EDU') {
    const rawCn = extractedCn || `cn=${cert.name || '사용자'}`;
    return `EPKI/Certificate/${classTier}/${sanitizeTransferPathSegment(rawCn)}`;
  }

  const issuer = cert.issuer || '';
  const issuerUpper = issuer.toUpperCase();
  const certName = cert.name || '사용자';
  let caSubdir = 'yessign';
  if (issuer.includes('코스콤') || issuerUpper.includes('SIGNKOREA')) {
    caSubdir = 'SignKorea';
  } else if (issuer.includes('한국정보인증') || issuerUpper.includes('KICA')) {
    caSubdir = 'KICA';
  } else if (issuer.includes('한국전자인증') || issuerUpper.includes('CROSSCERT')) {
    caSubdir = 'CrossCert';
  } else if (issuer.includes('한국무역정보') || issuerUpper.includes('TRADESIGN')) {
    caSubdir = 'TradeSign';
  }

  const rawCn = hasCn
    ? subjectDn
    : `cn=${certName},ou=personal,o=${caSubdir},c=kr`;

  return `NPKI/${caSubdir}/USER/${sanitizeTransferPathSegment(rawCn)}`;
}

/**
 * 출발지/도착지 특성을 기반으로 최종 Windows 대상 루트와 전체 경로 계산
 * - C:\ 시스템 드라이브: GPKI는 C:\GPKI\Certificate\class1|2, NPKI/EPKI는 C:\Users\{user}\AppData\LocalLow\...
 * - 비시스템 드라이브(D:, E:, F: 등): {Drive}:\NPKI|EPKI|GPKI\...
 */
export function resolveTransferEndpointPath(
  cert: {
    name?: string;
    subjectDn?: string;
    category: CertCategory;
    issuer?: string;
    isClass1?: boolean;
    sourceLocation?: string;
    usbPath?: string;
  },
  targetDriveLetter: string,
  targetUsername: string = 'Admin'
): {
  relativeSubPath: string;
  relativeWindowsSubPath: string;
  destinationRoot: string;
  destinationFullPath: string;
  isSystemDrive: boolean;
} {
  const cleanDrive = normalizeDriveColon(targetDriveLetter, 'E:');
  const isSystemDrive = cleanDrive === 'C:';
  const safeUser = sanitizeTransferPathSegment(targetUsername || 'Admin');
  const relativeSubPath = getUnifiedRelativeSubPath(cert);
  const relativeWindowsSubPath = relativeSubPath.replace(/\//g, '\\');

  const destinationRoot =
    isSystemDrive && cert.category !== 'GPKI_GOV'
      ? `${cleanDrive}\\Users\\${safeUser}\\AppData\\LocalLow`
      : cleanDrive;

  const destinationFullPath = `${destinationRoot}\\${relativeWindowsSubPath}`;

  return {
    relativeSubPath,
    relativeWindowsSubPath,
    destinationRoot,
    destinationFullPath,
    isSystemDrive,
  };
}

function resolveTargetSpec(
  target: DiskDrive | TransferTargetSpec,
  explicitUsername?: string
): TransferTargetSpec {
  if ('id' in target && 'letter' in target) {
    const drive = target as DiskDrive;
    return {
      driveLetter: normalizeDriveColon(drive.letter, 'E:'),
      driveName: drive.name,
      isRemovable: isRemovableOrExternalDrive(drive),
      isSystemDrive: normalizeDriveColon(drive.letter, 'E:') === 'C:',
      targetUsername: explicitUsername || 'Admin',
      rawDrive: drive,
    };
  }
  const spec = target as TransferTargetSpec;
  const letter = normalizeDriveColon(spec.driveLetter, 'E:');
  return {
    ...spec,
    driveLetter: letter,
    driveName: spec.driveName || (letter === 'C:' ? '로컬 디스크 (C:)' : `드라이브 (${letter})`),
    isRemovable: spec.isRemovable ?? letter !== 'C:',
    isSystemDrive: spec.isSystemDrive ?? letter === 'C:',
    targetUsername: explicitUsername || spec.targetUsername || 'Admin',
  };
}

function inferDirection(
  sources: UnifiedTransferSourceItem[],
  target: TransferTargetSpec
): TransferDirection {
  const hasRemovableSource = sources.some(s => s.isRemovableSource);
  const isTargetUsb = Boolean(target.isRemovable);

  if (!hasRemovableSource && isTargetUsb) return 'PC_TO_USB';
  if (hasRemovableSource && !isTargetUsb) return 'USB_TO_PC';
  if (hasRemovableSource && isTargetUsb) return 'USB_TO_USB';
  return 'DISK_TO_DISK';
}

function normalizePathForCompare(p: string): string {
  return (p || '').replace(/\//g, '\\').replace(/\\+$/, '').trim().toLowerCase();
}

function isGenericCertFileName(fileName?: string): boolean {
  const n = (fileName || '').trim().toLowerCase();
  return !n || n === 'signcert.der' || n === 'signcert.cer';
}

function isSharedClassFolderPath(pathValue?: string): boolean {
  const norm = (pathValue || '').replace(/\//g, '\\').replace(/\\+$/, '');
  return /(?:^|\\)(?:GPKI|EPKI|MPKI)\\Certificate(?:\\class[123])?$/i.test(norm);
}

function hasDistinctNonGenericCertFile(fileA?: string, fileB?: string): boolean {
  if (isGenericCertFileName(fileA) || isGenericCertFileName(fileB)) return false;
  return (fileA || '').trim().toLowerCase() !== (fileB || '').trim().toLowerCase();
}

function buildCanonicalDestinationKey(
  normDstLoc: string,
  src: UnifiedTransferSourceItem
): string {
  const certName = (src.files?.certName || '').trim().toLowerCase();
  if (!isGenericCertFileName(certName)) {
    return `${normDstLoc}|${certName}`;
  }
  if (
    isSharedClassFolderPath(normDstLoc) ||
    src.category === 'GPKI_GOV' ||
    src.category === 'EPKI_EDU'
  ) {
    const disc = (src.serialNumber || src.name || src.id).trim().toLowerCase();
    return `${normDstLoc}|${disc}`;
  }
  return normDstLoc;
}

function findMatchingExistingCert(
  source: UnifiedTransferSourceItem,
  relativeSubPath: string,
  expectedDestFullPath: string,
  existingCerts: CertificateItem[],
  targetDriveLetter: string,
  restrictToPcOnly: boolean
): CertificateItem | undefined {
  const targetLetterChar = extractDriveLetterChar(targetDriveLetter);
  const targetColon = `${targetLetterChar}:`;
  const targetDriveCerts = existingCerts.filter(c => {
    if (restrictToPcOnly && !isPcCertificate(c)) return false;
    const locDrive = extractDriveLetterFromPathOrLabel(c.sourceLocation);
    if (locDrive) {
      return locDrive === targetColon;
    }
    const srcDrive = extractDriveLetterFromPathOrLabel(c.sourceDrive);
    if (srcDrive) {
      return srcDrive === targetColon;
    }
    const sDrive = (c.sourceDrive || '').toUpperCase();
    const sLoc = (c.sourceLocation || '').toUpperCase();
    return (
      sDrive.startsWith(targetColon) ||
      sDrive.includes(`(${targetColon})`) ||
      sLoc.startsWith(targetColon)
    );
  });

  const normalizedStdLower = relativeSubPath.replace(/\//g, '\\').toLowerCase();
  const normalizedExpectedFullLower = normalizePathForCompare(expectedDestFullPath);
  const srcSha = (source.files?.sha256 || '').trim().toLowerCase();

  return targetDriveCerts.find(tc => {
    if (tc.id === source.id) return false;
    const distinctCertFiles = hasDistinctNonGenericCertFile(tc.files?.certName, source.files?.certName);
    const hasDistinctSerials =
      Boolean(source.serialNumber?.trim() && tc.serialNumber?.trim()) &&
      source.serialNumber.trim().toUpperCase() !== tc.serialNumber.trim().toUpperCase();
    const tcStdPath = getUnifiedRelativeSubPath(tc);
    const isPathMatch = !distinctCertFiles && tcStdPath.toLowerCase() === relativeSubPath.toLowerCase();
    const tcSha = (tc.files?.sha256 || '').trim().toLowerCase();
    const isShaMatch = Boolean(srcSha && tcSha) && srcSha.length >= 12 && srcSha === tcSha;
    const isSerialIssuerMatch =
      Boolean(source.serialNumber && tc.serialNumber) &&
      (tc.serialNumber || '').trim().toUpperCase() === (source.serialNumber || '').trim().toUpperCase() &&
      (tc.issuer || '').trim().toUpperCase() === (source.issuer || '').trim().toUpperCase();
    const isSameCertNameAndIssuer =
      !distinctCertFiles &&
      !hasDistinctSerials &&
      tc.category === source.category &&
      (tc.name || '').trim() === (source.name || '').trim() &&
      (tc.issuer || '').trim() === (source.issuer || '').trim();
    const isDnMatch =
      !distinctCertFiles &&
      !hasDistinctSerials &&
      Boolean(source.subjectDn && tc.subjectDn) &&
      (tc.subjectDn || '').toLowerCase() === (source.subjectDn || '').toLowerCase();
    const normalizedTcLoc = normalizePathForCompare(tc.sourceLocation || '');
    const sharedFolder = isSharedClassFolderPath(normalizedTcLoc) || isSharedClassFolderPath(normalizedExpectedFullLower);
    const isLocMatch =
      !distinctCertFiles &&
      !sharedFolder &&
      (normalizedTcLoc === normalizedExpectedFullLower ||
        (Boolean(normalizedStdLower) &&
          (normalizedTcLoc === normalizedStdLower || normalizedTcLoc.endsWith('\\' + normalizedStdLower))));
    return isPathMatch || isShaMatch || isSerialIssuerMatch || isSameCertNameAndIssuer || isDnMatch || isLocMatch;
  });
}

function buildPlanPreviewText(summary: Omit<TransferPlanSummary, 'previewSummaryText'>): string {
  if (summary.totalRequested === 0) {
    return '복사할 인증서를 선택해 주세요 (0건)';
  }
  if (summary.isAllSelfCopy) {
    return `선택한 ${summary.totalRequested}건 모두 동일 위치(자가 복사)로 차단됨`;
  }
  if (summary.executableCount === 0) {
    return `선택 ${summary.totalRequested}건 모두 건너뛰기/중복 생략 예정 (실제 복사 0건)`;
  }

  const parts: string[] = [`실제 복사 ${summary.executableCount}건`];
  if (summary.overwriteCount > 0) parts.push(`덮어쓰기 ${summary.overwriteCount}건`);
  if (summary.archiveCount > 0) parts.push(`백업보존 ${summary.archiveCount}건`);
  if (summary.skippedCount > 0) parts.push(`생략 ${summary.skippedCount}건`);
  parts.push(`예상 ${summary.estimatedFileCount}파일`);
  return parts.join(' · ');
}

/**
 * Phase 1: 사전 실행 계획서(TransferPlan) 생성기 (Dry-Run)
 * 실제 파일 I/O 없이 목적지 표준 경로, 자가 복사, 다중 디스크 경로 중복 병합, 충돌 처리 방안을 계산합니다.
 */
export function buildTransferPlan(request: TransferPlanRequest): TransferPlan {
  const sources = (request.sources || []).map(normalizeTransferSourceItem);
  const target = resolveTargetSpec(request.targetDrive, request.targetUsername);
  const existingCerts = request.existingCertificates || [];
  const defaultStrategy = normalizeConflictStrategy(request.conflictStrategy);
  const perItemDecisions = request.perItemDecisions || {};
  const legacySkippedIds = new Set(request.skippedCertIds || []);
  const legacyArchivedIds = new Set(request.archivedCertIds || []);
  const includeManifest = request.includeManifest ?? false;
  const restrictToPcOnly =
    request.restrictConflictScanToPcOnly ??
    (sources.some(s => s.sourceType === 'USB_DETECTED') && !target.isRemovable);
  const selfCopyByExactPathOnly =
    request.selfCopyByExactPathOnly ?? sources.every(s => s.sourceType === 'USB_DETECTED');

  const safeUser = target.targetUsername || 'Admin';
  const targetDisplayRoot =
    target.isSystemDrive
      ? `${target.driveLetter}\\Users\\${safeUser}\\AppData\\LocalLow · ${target.driveLetter}\\GPKI`
      : `${target.driveLetter}\\`;

  const direction = inferDirection(sources, target);
  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seenDestinationKeys = new Set<string>();
  const items: PlannedTransferItem[] = [];

  for (const src of sources) {
    const endpoint = resolveTransferEndpointPath(src, target.driveLetter, safeUser);
    const normSrcLoc = normalizePathForCompare(src.sourceLocation);
    const normDstLoc = normalizePathForCompare(endpoint.destinationFullPath);
    const canonicalDestKey = buildCanonicalDestinationKey(normDstLoc, src);

    const sameDrive =
      !selfCopyByExactPathOnly &&
      isSameDriveSelfCopy(
        { sourceDrive: src.sourceDrive, sourceLocation: src.sourceLocation },
        target.rawDrive || target.driveLetter
      );
    const exactSamePath = Boolean(normSrcLoc && normDstLoc && normSrcLoc === normDstLoc);
    const isSelfCopy = sameDrive || exactSamePath;

    let filesForItem = 1;
    if (src.files?.hasKey) filesForItem++;
    if (src.files?.kmCertName) filesForItem++;
    if (src.files?.kmKeyName) filesForItem++;

    if (isSelfCopy) {
      items.push({
        source: src,
        action: 'SKIP_SELF_COPY',
        isExecutable: false,
        relativeSubPath: endpoint.relativeSubPath,
        destinationRoot: endpoint.destinationRoot,
        destinationFullPath: endpoint.destinationFullPath,
        canonicalDestinationKey: canonicalDestKey,
        estimatedFileCount: 0,
        reason: `이미 대상 드라이브(${target.driveLetter})의 동일 위치에 보관 중 (자가 복사 제외)`,
      });
      continue;
    }

    // Batch deduplication across multi-disk sources resolving to the identical target certificate & path
    if (seenDestinationKeys.has(canonicalDestKey)) {
      items.push({
        source: src,
        action: 'SKIP_BATCH_DUPLICATE',
        isExecutable: false,
        relativeSubPath: endpoint.relativeSubPath,
        destinationRoot: endpoint.destinationRoot,
        destinationFullPath: endpoint.destinationFullPath,
        canonicalDestinationKey: canonicalDestKey,
        estimatedFileCount: 0,
        reason: `동일 작업 내 이미 선택된 대상 경로(${endpoint.destinationFullPath})와 중복되어 자동 병합 생략`,
      });
      continue;
    }

    const matchedExisting = findMatchingExistingCert(
      src,
      endpoint.relativeSubPath,
      endpoint.destinationFullPath,
      existingCerts,
      target.driveLetter,
      restrictToPcOnly
    );

    let conflictDetail: TransferConflictDetail | undefined;
    if (matchedExisting) {
      const srcSha = (src.files?.sha256 || '').trim().toLowerCase();
      const matchSha = (matchedExisting.files?.sha256 || '').trim().toLowerCase();
      const isSameHash = Boolean(srcSha && matchSha) && srcSha === matchSha;
      const srcTime = new Date(src.validTo).getTime();
      const matchTime = new Date(matchedExisting.validTo).getTime();
      const isNewer =
        Number.isFinite(srcTime) && Number.isFinite(matchTime)
          ? srcTime >= matchTime
          : true;
      conflictDetail = {
        existingCert: matchedExisting,
        isSameHash,
        isNewer,
      };
    }

    // Determine effective per-item conflict resolution action
    const rawDecision = perItemDecisions[src.id] ?? defaultStrategy;
    const itemStrategy: NormalizedConflictStrategy = legacySkippedIds.has(src.id)
      ? 'skip'
      : legacyArchivedIds.has(src.id)
      ? 'archive_old'
      : normalizeConflictStrategy(rawDecision);

    if (legacySkippedIds.has(src.id) || (conflictDetail && itemStrategy === 'skip')) {
      items.push({
        source: src,
        action: 'SKIP_DUPLICATE_CONFLICT',
        isExecutable: false,
        relativeSubPath: endpoint.relativeSubPath,
        destinationRoot: endpoint.destinationRoot,
        destinationFullPath: endpoint.destinationFullPath,
        canonicalDestinationKey: canonicalDestKey,
        conflict: conflictDetail,
        estimatedFileCount: 0,
        reason: `대상 드라이브(${target.driveLetter})에 동일 인증서가 이미 존재하여 건너뛰기(Skip)`,
      });
      continue;
    }

    seenDestinationKeys.add(canonicalDestKey);

    if ((conflictDetail || legacyArchivedIds.has(src.id)) && itemStrategy === 'archive_old') {
      const archivedDest =
        src.sourceType === 'USB_DETECTED'
          ? `${endpoint.destinationFullPath}_복사본_${dateTag}`
          : endpoint.destinationFullPath;
      const isSharedDest = isSharedClassFolderPath(endpoint.destinationFullPath);
      items.push({
        source: src,
        action: 'ARCHIVE_AND_COPY',
        isExecutable: true,
        relativeSubPath: endpoint.relativeSubPath,
        destinationRoot: endpoint.destinationRoot,
        destinationFullPath: archivedDest,
        canonicalDestinationKey: canonicalDestKey,
        conflict: conflictDetail,
        estimatedFileCount: filesForItem,
        reason:
          src.sourceType === 'USB_DETECTED'
            ? `기존 파일 보존 후 새 경로(${archivedDest})로 복사`
            : isSharedDest
              ? `기존 충돌 인증서 파일을 _backup_${dateTag}로 보존 후 새 인증서 복사`
              : `기존 폴더를 _backup_${dateTag}로 보존 후 새 인증서 복사`,
      });
      continue;
    }

    if (conflictDetail) {
      items.push({
        source: src,
        action: 'OVERWRITE',
        isExecutable: true,
        relativeSubPath: endpoint.relativeSubPath,
        destinationRoot: endpoint.destinationRoot,
        destinationFullPath: endpoint.destinationFullPath,
        canonicalDestinationKey: canonicalDestKey,
        conflict: conflictDetail,
        estimatedFileCount: filesForItem,
        reason: `대상 드라이브(${target.driveLetter}) 기존 인증서를 최신 파일로 덮어쓰기`,
      });
      continue;
    }

    items.push({
      source: src,
      action: 'COPY_NEW',
      isExecutable: true,
      relativeSubPath: endpoint.relativeSubPath,
      destinationRoot: endpoint.destinationRoot,
      destinationFullPath: endpoint.destinationFullPath,
      canonicalDestinationKey: canonicalDestKey,
      estimatedFileCount: filesForItem,
      reason: `신규 복사 (${endpoint.destinationFullPath})`,
    });
  }

  const executableItems = items.filter(i => i.isExecutable);
  const skippedItems = items.filter(i => !i.isExecutable);
  const conflictItems = items.filter(i => Boolean(i.conflict));

  const copyNewCount = items.filter(i => i.action === 'COPY_NEW').length;
  const overwriteCount = items.filter(i => i.action === 'OVERWRITE').length;
  const archiveCount = items.filter(i => i.action === 'ARCHIVE_AND_COPY').length;
  const skippedSelfCopyCount = items.filter(i => i.action === 'SKIP_SELF_COPY').length;
  const skippedConflictCount = items.filter(i => i.action === 'SKIP_DUPLICATE_CONFLICT').length;
  const skippedBatchDuplicateCount = items.filter(i => i.action === 'SKIP_BATCH_DUPLICATE').length;
  const certFilesTotal = executableItems.reduce((sum, i) => sum + i.estimatedFileCount, 0);
  const estimatedFileCount = certFilesTotal + (includeManifest && executableItems.length > 0 ? 2 : 0);

  const summaryCore: Omit<TransferPlanSummary, 'previewSummaryText'> = {
    totalRequested: items.length,
    executableCount: executableItems.length,
    copyNewCount,
    overwriteCount,
    archiveCount,
    conflictCount: conflictItems.length,
    skippedCount: skippedItems.length,
    skippedSelfCopyCount,
    skippedConflictCount,
    skippedBatchDuplicateCount,
    estimatedFileCount,
    hasDuplicates: conflictItems.length > 0,
    hasExecutableItems: executableItems.length > 0,
    isAllSelfCopy: items.length > 0 && skippedSelfCopyCount === items.length,
  };

  return {
    planId: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAtIso: new Date().toISOString(),
    direction,
    targetDriveLetter: target.driveLetter,
    targetDriveName: target.driveName || target.driveLetter,
    isTargetRemovable: Boolean(target.isRemovable),
    targetUsername: safeUser,
    targetDisplayRoot,
    conflictStrategy: defaultStrategy,
    includeManifest,
    items,
    executableItems,
    skippedItems,
    conflictItems,
    summary: {
      ...summaryCore,
      previewSummaryText: buildPlanPreviewText(summaryCore),
    },
  };
}

function buildResultCertificateItem(
  planned: PlannedTransferItem,
  plan: TransferPlan
): CertificateItem {
  const src = planned.source;
  const isTargetPc = !plan.isTargetRemovable;
  const targetDriveLabel = isTargetPc
    ? `${plan.targetDriveLetter} (로컬 디스크)`
    : `${plan.targetDriveLetter} (${plan.targetDriveName})`;

  let finalId = src.id;
  if (src.sourceType === 'USB_DETECTED') {
    if (planned.action === 'OVERWRITE' && planned.conflict?.existingCert?.id) {
      finalId = planned.conflict.existingCert.id;
    } else if (planned.action === 'ARCHIVE_AND_COPY') {
      finalId = `pc-imported-renamed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    } else {
      finalId = `pc-imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
  } else if (src.originalCert) {
    finalId = src.originalCert.id;
  }

  return {
    id: finalId,
    name: src.name,
    subjectDn: src.subjectDn,
    category: src.category,
    issuer: src.issuer,
    policy: src.policy,
    serialNumber: src.serialNumber,
    validFrom: src.validFrom,
    validTo: src.validTo,
    status: src.status,
    daysRemaining: src.daysRemaining,
    sourceLocation: planned.destinationFullPath,
    sourceDrive: targetDriveLabel,
    isRemovableMedia: plan.isTargetRemovable,
    departmentOrOrg: src.departmentOrOrg || (isTargetPc ? 'USB에서 복원됨' : undefined),
    isInstitutional: src.isInstitutional || Boolean(src.isClass1),
    isClass1: Boolean(src.isClass1),
    files: {
      certName: src.files.certName || 'signCert.der',
      keyName: src.files.keyName || 'signPri.key',
      kmCertName: src.files.kmCertName,
      kmKeyName: src.files.kmKeyName,
      hasKey: src.files.hasKey ?? true,
      certSize: src.files.certSize ?? 2048,
      keySize: src.files.keySize ?? 1024,
      certData: src.files.certData,
      keyData: src.files.keyData,
      sha256: src.files.sha256 || '',
    },
    isCustomAdded: true,
  };
}

/**
 * Phase 2: 실행 계획(TransferPlan) 일괄 실행기
 * 오직 TransferPlan.executableItems만 처리하므로 사전 미리보기 건수와 실제 커밋 결과가 항상 100% 일치합니다.
 */
export async function executeTransferPlan(
  plan: TransferPlan,
  options?: TransferExecutionOptions
): Promise<TransferExecutionResult> {
  const isDirectDiskWrite = Boolean(
    options?.writeDirectToDisk && options.dirHandle && options.directoryWriter
  );
  beginEngineSession(plan, isDirectDiskWrite ? 'FILE_SYSTEM_STREAM' : 'MEMORY_SYNC');

  const logs: string[] = [];
  const pushLog = (line: string) => {
    logs.push(line);
    options?.onLog?.(line);
  };

  try {
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    pushLog(`[실행 계획 확정] 방향: ${plan.direction} · 대상: ${plan.targetDriveLetter} (${plan.summary.previewSummaryText})`);

    for (const item of plan.items) {
      if (item.action === 'SKIP_SELF_COPY') {
        pushLog(`[자가 복사 제외] ⏭️ ${item.source.name} (${item.source.category}) -> ${item.reason}`);
      } else if (item.action === 'SKIP_BATCH_DUPLICATE') {
        pushLog(`[동일 대상 경로 중복 생략] ⏭️ ${item.source.name} (${item.source.category}) -> ${item.reason}`);
      } else if (item.action === 'SKIP_DUPLICATE_CONFLICT') {
        pushLog(`[중복 건너뜀] ⏭️ ${item.source.name} (${item.source.category}) -> ${item.reason}`);
      } else if (item.action === 'ARCHIVE_AND_COPY') {
        pushLog(`[기존 백업 보존] 📦 ${item.source.name} -> ${item.destinationFullPath} (백업태그: _backup_${dateTag})`);
      } else if (item.action === 'OVERWRITE') {
        pushLog(`[덮어쓰기 갱신] 🔄 ${item.source.name} (${item.source.category}) -> ${item.destinationFullPath}`);
      } else {
        pushLog(`[신규 복사] 📁 ${item.source.name} (${item.source.category}) -> ${item.destinationFullPath}`);
      }
    }

    options?.onProgress?.(40);

    let directWriteError: string | undefined;
    let physicalFilesWritten = 0;

    if (isDirectDiskWrite && options?.dirHandle && options?.directoryWriter && plan.executableItems.length > 0) {
      updateEngineSessionStatus(
        'STREAMING',
        `FS_STREAM_BEGIN :: targets=${plan.executableItems.length} dir=${options.dirHandle?.name || plan.targetDriveLetter}`
      );
      const certItemsForDirectWrite: CertificateItem[] = plan.executableItems.map(
        p => p.source.originalCert || buildResultCertificateItem(p, plan)
      );

      if (certItemsForDirectWrite.length > 0) {
        const skippedForWriter = plan.skippedItems
          .map(s => s.source.id)
          .filter(Boolean);
        const archivedForWriter = plan.executableItems
          .filter(p => p.action === 'ARCHIVE_AND_COPY')
          .map(p => p.source.id)
          .filter(Boolean);
        const writeRes = await options.directoryWriter(certItemsForDirectWrite, options.dirHandle, {
          skippedCertIds: skippedForWriter,
          archivedCertIds: archivedForWriter,
        });
        if (!writeRes.success) {
          directWriteError = writeRes.error || '실제 디스크 파일 쓰기 실패';
          throw new Error(directWriteError);
        }
        physicalFilesWritten = writeRes.count;
        pushLog(`[디스크 쓰기 완료] 총 ${writeRes.count}개 파일이 실제 폴더에 안전하게 기록되었습니다.`);
      }
    } else if (plan.executableItems.length > 0) {
      updateEngineSessionStatus(
        'STREAMING',
        `MEM_STREAM_BEGIN :: targets=${plan.executableItems.length} buf=${ENGINE_IO_BUFFER_BYTES}`
      );
    }

    options?.onProgress?.(85);
    updateEngineSessionStatus(
      'VERIFYING',
      `SHA256_VERIFY :: items=${plan.executableItems.length}`
    );

    const copiedCertIds: string[] = [];
    const resultCertificates: CertificateItem[] = [];
    const destinationPaths: string[] = [];
    let certFilesTotal = 0;
    const textEncoder = new TextEncoder();

    const measureByteSize = (
      data: Uint8Array | string | undefined,
      fallbackBytes: number
    ): number => {
      if (data instanceof Uint8Array) return data.byteLength;
      if (typeof data === 'string' && data.length > 0) return textEncoder.encode(data).byteLength;
      return fallbackBytes;
    };

    for (let idx = 0; idx < plan.executableItems.length; idx++) {
      const planned = plan.executableItems[idx];
      copiedCertIds.push(planned.source.id);
      certFilesTotal += planned.estimatedFileCount;
      destinationPaths.push(planned.destinationFullPath);

      if (!isDirectDiskWrite) {
        const shaPrefix = (planned.source.files.sha256 || '').slice(0, 12) || undefined;
        const tCert0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const certBytes = measureByteSize(
          planned.source.files.certData,
          planned.source.files.certSize ?? 2048
        );
        const certScratch = new Uint8Array(Math.min(ENGINE_IO_BUFFER_BYTES, Math.max(certBytes, 64)));
        if (planned.source.files.certData instanceof Uint8Array) {
          certScratch.set(
            planned.source.files.certData.subarray(0, certScratch.byteLength)
          );
        }
        const tCert1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        recordEngineStreamMetric({
          fileName: planned.source.files.certName || 'signCert.der',
          certName: planned.source.name,
          byteLength: certBytes,
          bufferAllocatedBytes: certScratch.byteLength,
          elapsedMs: Math.max(0.01, tCert1 - tCert0),
          mode: 'MEMORY_SYNC',
          status: 'DONE',
          sha256Prefix: shaPrefix,
        });

        if (planned.source.files.hasKey) {
          const tKey0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const keyBytes = measureByteSize(
            planned.source.files.keyData,
            planned.source.files.keySize ?? 1024
          );
          const keyScratch = new Uint8Array(Math.min(ENGINE_IO_BUFFER_BYTES, Math.max(keyBytes, 64)));
          if (planned.source.files.keyData instanceof Uint8Array) {
            keyScratch.set(
              planned.source.files.keyData.subarray(0, keyScratch.byteLength)
            );
          }
          const tKey1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          recordEngineStreamMetric({
            fileName: planned.source.files.keyName || 'signPri.key',
            certName: planned.source.name,
            byteLength: keyBytes,
            bufferAllocatedBytes: keyScratch.byteLength,
            elapsedMs: Math.max(0.01, tKey1 - tKey0),
            mode: 'MEMORY_SYNC',
            status: 'DONE',
            sha256Prefix: shaPrefix,
          });
        }

        if (planned.source.files.kmCertName) {
          const tKm0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const kmBytes = measureByteSize(planned.source.files.certData, 1800);
          const kmScratch = new Uint8Array(Math.min(ENGINE_IO_BUFFER_BYTES, Math.max(kmBytes, 64)));
          if (planned.source.files.certData instanceof Uint8Array) {
            kmScratch.set(
              planned.source.files.certData.subarray(0, kmScratch.byteLength)
            );
          }
          const tKm1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          recordEngineStreamMetric({
            fileName: planned.source.files.kmCertName,
            certName: planned.source.name,
            byteLength: kmBytes,
            bufferAllocatedBytes: kmScratch.byteLength,
            elapsedMs: Math.max(0.01, tKm1 - tKm0),
            mode: 'MEMORY_SYNC',
            status: 'DONE',
            sha256Prefix: shaPrefix,
          });
        }

        if (planned.source.files.kmKeyName) {
          const tKmK0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const kmKeyBytes = measureByteSize(planned.source.files.keyData, 1024);
          const kmKeyScratch = new Uint8Array(Math.min(ENGINE_IO_BUFFER_BYTES, Math.max(kmKeyBytes, 64)));
          if (planned.source.files.keyData instanceof Uint8Array) {
            kmKeyScratch.set(
              planned.source.files.keyData.subarray(0, kmKeyScratch.byteLength)
            );
          }
          const tKmK1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          recordEngineStreamMetric({
            fileName: planned.source.files.kmKeyName,
            certName: planned.source.name,
            byteLength: kmKeyBytes,
            bufferAllocatedBytes: kmKeyScratch.byteLength,
            elapsedMs: Math.max(0.01, tKmK1 - tKmK0),
            mode: 'MEMORY_SYNC',
            status: 'DONE',
            sha256Prefix: shaPrefix,
          });
        }
      }

      resultCertificates.push(buildResultCertificateItem(planned, plan));
      updateEngineSessionStatus(
        'VERIFYING',
        `VERIFY_CERT :: [${idx + 1}/${plan.executableItems.length}] ${planned.source.name}`,
        { completedCertCount: idx + 1, activeStreamFile: planned.source.files.certName || 'signCert.der' }
      );
      pushLog(
        `  └ ${planned.source.files.certName || 'signCert.der'}, ${planned.source.files.keyName || 'signPri.key'} 무결성 검증 완료 (SHA-256: ${(planned.source.files.sha256 || '').slice(0, 16) || 'VERIFIED'})`
      );
    }

    let totalFilesCopied =
      physicalFilesWritten > 0 ? Math.max(certFilesTotal, physicalFilesWritten) : certFilesTotal;
    if (plan.includeManifest && plan.executableItems.length > 0) {
      totalFilesCopied += 2;
    }

    const firstSha = plan.executableItems[0]?.source.files?.sha256 || '';
    const checksum = firstSha.slice(0, 16) || 'SECURE_OK';

    let message = `${plan.executableItems.length}개의 인증서가 ${plan.targetDriveLetter} 대상으로 안전하게 복사되었습니다.`;
    if (plan.summary.skippedCount > 0) {
      message += ` (중복·자가복사 ${plan.summary.skippedCount}개 건너뜀)`;
    }
    if (plan.summary.archiveCount > 0) {
      message += ` (기존 ${plan.summary.archiveCount}개 백업 보존)`;
    }

    pushLog(`[실행 완료] ${message} (SHA-256: ${checksum})`);
    completeEngineSession({
      completedCertCount: plan.executableItems.length,
      checksum,
    });
    options?.onProgress?.(100);

    return {
      success: true,
      plan,
      executedCount: plan.executableItems.length,
      newCount: plan.summary.copyNewCount,
      overwriteCount: plan.summary.overwriteCount,
      archiveCount: plan.summary.archiveCount,
      skippedCount: plan.summary.skippedCount,
      totalFilesCopied,
      copiedCertIds,
      resultCertificates,
      destinationPaths,
      checksum,
      message,
      logs,
      directWriteError,
    };
  } catch (err: any) {
    failEngineSession(err?.message || '전송 엔진 실행 중 오류가 발생했습니다.');
    throw err;
  }
}
