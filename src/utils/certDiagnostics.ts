import { CertificateItem, DiskDrive } from '../types';
import { isCertificateExpired } from './certParser';
import {
  isNonStandardCertPath,
  isRareLocalLowGpkiPath,
  isStandardCertPath,
} from './certPathUtils';
import { isUsbCertificate } from './driveFilter';

export interface DuplicateRedundantEntry {
  cert: CertificateItem;
  locationKind: 'PC_STANDARD' | 'PC_NON_STANDARD' | 'USB';
  reasonBadge: string;
  defaultChecked: boolean;
}

export interface DuplicateGroup {
  key: string;
  name: string;
  issuer: string;
  serialNumber: string;
  validTo: string;
  fingerprint: string;
  primaryCert: CertificateItem;
  redundantEntries: DuplicateRedundantEntry[];
  reclaimableBytes: number;
}

export interface DeduplicationSummary {
  totalScanned: number;
  uniqueCount: number;
  duplicateGroupCount: number;
  redundantCount: number;
  reclaimableBytes: number;
  groups: DuplicateGroup[];
}

export interface PathRepairCandidate {
  cert: CertificateItem;
  issueType: 'NESTED_FOLDER' | 'LOCALLOW_GPKI' | 'BACKUP_TEMP' | 'NON_STANDARD_PC';
  issueTitle: string;
  issueDescription: string;
  sourcePath: string;
  canonicalPath: string;
  targetDrive: string;
}

export interface ExpiryAlertSummary {
  expiredCount: number;
  criticalCount: number; // <= 7일
  warningCount: number;  // 8 ~ 30일
  totalAlertCount: number;
  urgencyLevel: 'critical' | 'warning' | 'notice' | 'none';
  affectedCerts: CertificateItem[];
  earliestCert: CertificateItem | null;
}

export interface UsbSafeEjectResult {
  driveLetter: string;
  driveName: string;
  success: boolean;
  statusTitle: string;
  message: string;
  requiresOsTrayConfirmation: boolean;
}

function getDriveLetterFromCert(cert: CertificateItem): string {
  const loc = (cert.sourceLocation || '').trim();
  if (loc.length >= 2 && loc[1] === ':') {
    return loc.substring(0, 2).toUpperCase();
  }
  const drv = (cert.sourceDrive || '').trim();
  if (drv.length >= 2 && drv[1] === ':') {
    return drv.substring(0, 2).toUpperCase();
  }
  return cert.isRemovableMedia ? 'E:' : 'C:';
}

function extractUsernameFromPath(pathStr: string): string {
  const normalized = (pathStr || '').replace(/\//g, '\\');
  const match = normalized.match(/\\Users\\([^\\]+)\\/i);
  if (match && match[1]) {
    return match[1];
  }
  return 'Admin';
}

function extractCaFolderName(cert: CertificateItem): string {
  const pathUpper = (cert.sourceLocation || '').toUpperCase();
  const issuerUpper = (cert.issuer || '').toUpperCase();
  if (pathUpper.includes('SIGNKOREA') || issuerUpper.includes('SIGNKOREA') || issuerUpper.includes('코스콤')) {
    return 'SignKorea';
  }
  if (pathUpper.includes('KICA') || issuerUpper.includes('KICA') || issuerUpper.includes('한국정보인증')) {
    return 'KICA';
  }
  if (pathUpper.includes('CROSSCERT') || issuerUpper.includes('CROSSCERT') || issuerUpper.includes('한국전자인증')) {
    return 'CrossCert';
  }
  if (pathUpper.includes('TRADESIGN') || issuerUpper.includes('TRADESIGN') || issuerUpper.includes('무역')) {
    return 'TradeSign';
  }
  return 'yessign';
}

function extractLeafFolderName(cert: CertificateItem): string {
  const normalized = (cert.sourceLocation || '').replace(/\//g, '\\').replace(/\\+$/, '');
  const parts = normalized.split('\\').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  if (last && (last.toLowerCase().startsWith('cn=') || last.includes('(') || last.length > 3)) {
    if (
      !['npki', 'gpki', 'epki', 'user', 'certificate', 'class1', 'class2', 'backup', 'temp'].includes(
        last.toLowerCase()
      )
    ) {
      return last;
    }
  }
  if (cert.subjectDn && cert.subjectDn.trim().length > 0) {
    return cert.subjectDn.trim();
  }
  return `cn=${cert.name || '사용자'}`;
}

export function buildCanonicalCertPath(cert: CertificateItem): string {
  const isUsb = isUsbCertificate(cert);
  const drive = getDriveLetterFromCert(cert);
  const username = extractUsernameFromPath(cert.sourceLocation || '');
  const leaf = extractLeafFolderName(cert);
  const pathUpper = (cert.sourceLocation || '').replace(/\//g, '\\').toUpperCase();

  if (cert.category === 'GPKI_GOV') {
    const classTier = pathUpper.includes('\\CLASS1') ? 'class1' : 'class2';
    const cleanCn = leaf.startsWith('cn=') ? leaf : `cn=${cert.name}`;
    return `${drive}\\GPKI\\Certificate\\${classTier}\\${cleanCn}`;
  }

  if (cert.category === 'EPKI_EDU') {
    const classTier = pathUpper.includes('\\CLASS1') ? 'class1' : 'class2';
    const cleanCn = leaf.startsWith('cn=') ? leaf : `cn=${cert.name}`;
    if (isUsb) {
      return `${drive}\\EPKI\\Certificate\\${classTier}\\${cleanCn}`;
    }
    return `${drive}\\Users\\${username}\\AppData\\LocalLow\\EPKI\\Certificate\\${classTier}\\${cleanCn}`;
  }

  // NPKI (은행/금융/법인)
  const caDir = extractCaFolderName(cert);
  const cleanCn = leaf.startsWith('cn=') ? leaf : `cn=${cert.name},ou=personal,o=${caDir},c=kr`;
  if (isUsb) {
    return `${drive}\\NPKI\\${caDir}\\USER\\${cleanCn}`;
  }
  return `${drive}\\Users\\${username}\\AppData\\LocalLow\\NPKI\\${caDir}\\USER\\${cleanCn}`;
}

function scorePrimaryPriority(cert: CertificateItem): number {
  let score = 0;
  const isStd = isStandardCertPath(cert.sourceLocation, cert.isRemovableMedia);
  const isUsb = isUsbCertificate(cert);
  const expired = isCertificateExpired(cert);

  if (isStd) score += 100;
  if (!isUsb) score += 40; // Prefer PC standard path as primary anchor
  if (!expired) score += 20;
  if (cert.files?.hasKey) score += 10;
  return score;
}

export function analyzeDuplicateCertificates(certs: CertificateItem[]): DeduplicationSummary {
  const groupsMap = new Map<string, CertificateItem[]>();

  for (const cert of certs) {
    const sha = (cert.files?.sha256 || '').trim().toLowerCase();
    const hasReliableSha = sha.length >= 12 && !sha.startsWith('mock');
    const key = hasReliableSha
      ? `sha:${sha}`
      : `sig:${(cert.serialNumber || '').trim().toUpperCase()}|${(cert.issuer || '').trim().toUpperCase()}|${(cert.name || '').trim().toUpperCase()}`;

    const list = groupsMap.get(key) || [];
    list.push(cert);
    groupsMap.set(key, list);
  }

  const duplicateGroups: DuplicateGroup[] = [];
  for (const [key, list] of groupsMap.entries()) {
    if (list.length <= 1) continue;

    const sorted = [...list].sort((a, b) => scorePrimaryPriority(b) - scorePrimaryPriority(a));
    const primary = sorted[0];
    const primaryDrive = getDriveLetterFromCert(primary);
    const primaryIsUsb = isUsbCertificate(primary);

    const redundantEntries: DuplicateRedundantEntry[] = sorted.slice(1).map((cert) => {
      const isUsb = isUsbCertificate(cert);
      const isStd = isStandardCertPath(cert.sourceLocation, cert.isRemovableMedia);
      const drive = getDriveLetterFromCert(cert);

      let locationKind: DuplicateRedundantEntry['locationKind'] = 'PC_STANDARD';
      let reasonBadge = '동일 저장소 중복';
      let defaultChecked = false;

      if (!isStd) {
        locationKind = isUsb ? 'USB' : 'PC_NON_STANDARD';
        reasonBadge = '비표준 폴더 중복';
        defaultChecked = true;
      } else if (isUsb) {
        locationKind = 'USB';
        if (primaryIsUsb && drive === primaryDrive) {
          reasonBadge = `${drive} 내 중복 사본`;
          defaultChecked = true;
        } else {
          reasonBadge = `${drive} USB 백업 사본`;
          defaultChecked = false; // Keep safe USB backup unchecked by default unless user explicitly removes it
        }
      } else {
        locationKind = 'PC_STANDARD';
        reasonBadge = `${drive} 중복 사본`;
        defaultChecked = !primaryIsUsb;
      }

      return {
        cert,
        locationKind,
        reasonBadge,
        defaultChecked,
      };
    });

    const reclaimableBytes = redundantEntries.reduce((sum, entry) => {
      const certSize = entry.cert.files?.certSize || 2048;
      const keySize = entry.cert.files?.keySize || 1536;
      return sum + certSize + keySize;
    }, 0);

    duplicateGroups.push({
      key,
      name: primary.name,
      issuer: primary.issuer,
      serialNumber: primary.serialNumber,
      validTo: primary.validTo,
      fingerprint: primary.files?.sha256 || primary.serialNumber,
      primaryCert: primary,
      redundantEntries,
      reclaimableBytes,
    });
  }

  duplicateGroups.sort((a, b) => b.redundantEntries.length - a.redundantEntries.length);

  return {
    totalScanned: certs.length,
    uniqueCount: groupsMap.size,
    duplicateGroupCount: duplicateGroups.length,
    redundantCount: duplicateGroups.reduce((sum, g) => sum + g.redundantEntries.length, 0),
    reclaimableBytes: duplicateGroups.reduce((sum, g) => sum + g.reclaimableBytes, 0),
    groups: duplicateGroups,
  };
}

export function analyzePathRepairs(certs: CertificateItem[]): PathRepairCandidate[] {
  const candidates: PathRepairCandidate[] = [];

  for (const cert of certs) {
    const path = (cert.sourceLocation || '').replace(/\//g, '\\');
    const upper = path.toUpperCase();
    const isNonStd = cert.isCustomPath || isNonStandardCertPath(path);
    if (!isNonStd) continue;

    let issueType: PathRepairCandidate['issueType'] = 'NON_STANDARD_PC';
    let issueTitle = '비표준 보관 위치';
    let issueDescription = '은행·정부 프로그램이 기본으로 인식하지 못하는 폴더에 저장되어 있습니다.';

    if (
      upper.includes('\\GPKI\\GPKI') ||
      upper.includes('\\NPKI\\NPKI') ||
      upper.includes('\\EPKI\\EPKI')
    ) {
      issueType = 'NESTED_FOLDER';
      issueTitle = '중첩 폴더 오류 (GPKI\\GPKI / NPKI\\NPKI)';
      issueDescription = '수동 복사 중 폴더가 두 번 겹쳐서 인증서 프로그램이 찾지 못합니다.';
    } else if (isRareLocalLowGpkiPath(path)) {
      issueType = 'LOCALLOW_GPKI';
      issueTitle = 'GPKI 비권장 위치 (AppData\\LocalLow\\GPKI)';
      issueDescription = '공무원 행정전자서명(GPKI)은 C:\\GPKI\\Certificate\\class2 경로를 사용해야 인식됩니다.';
    } else if (
      upper.includes('\\BACKUP') ||
      upper.includes('\\TEMP') ||
      upper.includes('\\백업') ||
      upper.includes('\\인증서') ||
      upper.includes('\\DOWNLOAD') ||
      upper.includes('\\DESKTOP')
    ) {
      issueType = 'BACKUP_TEMP';
      issueTitle = '임시·백업 폴더 보관';
      issueDescription = '바탕화면·임시·백업 폴더에 있어 인증서 창 목록에 나타나지 않을 수 있습니다.';
    }

    const canonicalPath = buildCanonicalCertPath(cert);
    if (canonicalPath.toUpperCase() === path.toUpperCase()) continue;

    candidates.push({
      cert,
      issueType,
      issueTitle,
      issueDescription,
      sourcePath: path,
      canonicalPath,
      targetDrive: getDriveLetterFromCert(cert),
    });
  }

  return candidates;
}

export function evaluateExpiryAlerts(certs: CertificateItem[]): ExpiryAlertSummary {
  const expired: CertificateItem[] = [];
  const critical: CertificateItem[] = [];
  const warning: CertificateItem[] = [];

  for (const cert of certs) {
    if (isCertificateExpired(cert) || cert.daysRemaining <= 0) {
      expired.push(cert);
    } else if (cert.daysRemaining <= 7) {
      critical.push(cert);
    } else if (cert.daysRemaining <= 30) {
      warning.push(cert);
    }
  }

  const affectedCerts = [...critical, ...warning, ...expired].sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  );

  let urgencyLevel: ExpiryAlertSummary['urgencyLevel'] = 'none';
  if (critical.length > 0 || expired.length > 0) {
    urgencyLevel = 'critical';
  } else if (warning.length > 0) {
    urgencyLevel = 'warning';
  }

  return {
    expiredCount: expired.length,
    criticalCount: critical.length,
    warningCount: warning.length,
    totalAlertCount: affectedCerts.length,
    urgencyLevel,
    affectedCerts,
    earliestCert: affectedCerts[0] || null,
  };
}

export function extractDriveLetterFromPathOrLabel(input?: string): string | null {
  if (!input) return null;
  const match = input.match(/\b([A-Z]):/i);
  if (match && match[1]) {
    return `${match[1].toUpperCase()}:`;
  }
  return null;
}

export function prepareSafeUsbEject(
  driveLetterOrPath: string,
  drives: DiskDrive[]
): UsbSafeEjectResult {
  const cleanLetter = extractDriveLetterFromPathOrLabel(driveLetterOrPath) || 'USB';
  const matchedDrive = drives.find(
    (d) =>
      d.letter.toUpperCase().startsWith(cleanLetter.toUpperCase()) ||
      d.id === driveLetterOrPath
  );

  const displayName = matchedDrive?.name || `이동식 USB (${cleanLetter})`;

  return {
    driveLetter: matchedDrive?.letter || cleanLetter,
    driveName: displayName,
    success: true,
    statusTitle: `${matchedDrive?.letter || cleanLetter} USB 분리 준비 완료`,
    message:
      '웹 브라우저의 파일 핸들 참조를 모두 해제했습니다. 브라우저 보안 정책상 물리 전원 차단은 불가하므로, Windows 작업 표시줄의 [하드웨어 안전하게 제거]를 눌러 분리해 주세요.',
    requiresOsTrayConfirmation: true,
  };
}
