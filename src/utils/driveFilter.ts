import { DiskDrive } from '../types';

/**
 * Checks if a drive is a virtual disk, optical disc (CD/DVD), or cloud storage virtual drive
 * (Google Drive, OneDrive, Dropbox, iCloud, RaiDrive, Box, etc.) to be excluded from display.
 */
export function isExcludedVirtualOrCloudDrive(drive: Partial<DiskDrive> | null | undefined): boolean {
  if (!drive) return true;

  const letter = (drive.letter || '').toUpperCase();
  const name = (drive.name || '').toUpperCase();
  const desc = (drive.description || '').toUpperCase();
  const physicalModel = (drive.physicalModel || '').toUpperCase();
  const pnpId = (drive.pnpDeviceId || '').toUpperCase();
  const fileSystem = (drive.fileSystem || '').toUpperCase();
  const busType = (drive.busType || '').toUpperCase();
  const deviceKind = (drive.deviceKind || '').toLowerCase();

  // 1. CD-ROM / DVD / Optical / ISO
  if (
    drive.isCdRom === true ||
    drive.type === 'cdrom' ||
    deviceKind === 'cdrom' ||
    deviceKind === 'virtual_cd' ||
    fileSystem === 'CDFS' ||
    fileSystem === 'UDF' ||
    fileSystem === 'ISO9660' ||
    name.includes('CD-ROM') ||
    name.includes('CDROM') ||
    name.includes('DVD') ||
    name.includes('광학') ||
    name.includes('ISO') ||
    desc.includes('CD-ROM') ||
    desc.includes('DVD') ||
    physicalModel.includes('CDROM') ||
    physicalModel.includes('CD-ROM') ||
    physicalModel.includes('DVD')
  ) {
    return true;
  }

  // 2. Virtual Disks (RAM disks, VHD, VirtualBox, VMware, ImDisk, Daemon Tools, etc.)
  if (
    busType === 'VIRTUAL' ||
    busType === 'RAMDISK' ||
    deviceKind === 'virtual_disk' ||
    name.includes('VIRTUAL') ||
    name.includes('가상 디스크') ||
    name.includes('가상디스크') ||
    name.includes('RAM DISK') ||
    name.includes('RAMDISK') ||
    name.includes('IMDISK') ||
    name.includes('DAEMON') ||
    name.includes('POWERISO') ||
    name.includes('ULTRAISO') ||
    name.includes('CLONEDRIVE') ||
    name.includes('WINCDE') ||
    name.includes('ALCOHOL') ||
    name.includes('VMWARE') ||
    name.includes('VBOX') ||
    name.includes('VHD') ||
    physicalModel.includes('VIRTUAL') ||
    physicalModel.includes('IMDISK') ||
    physicalModel.includes('RAMDISK') ||
    physicalModel.includes('VMWARE') ||
    physicalModel.includes('VBOX') ||
    pnpId.includes('VIRTUAL') ||
    pnpId.includes('RAMDISK')
  ) {
    return true;
  }

  // 3. Cloud Storage Drives (Google Drive, OneDrive, Dropbox, iCloud, Box, RaiDrive, NetDrive, etc.)
  if (
    drive.type === 'network' ||
    deviceKind === 'network' ||
    name.includes('GOOGLE DRIVE') ||
    name.includes('GOOGLEDRIVE') ||
    name.includes('구글 드라이브') ||
    name.includes('구글드라이브') ||
    name.includes('GOOGLE') ||
    name.includes('ONEDRIVE') ||
    name.includes('ONE DRIVE') ||
    name.includes('원드라이브') ||
    name.includes('DROPBOX') ||
    name.includes('드롭박스') ||
    name.includes('ICLOUD') ||
    name.includes('아이클라우드') ||
    name.includes('BOX DRIVE') ||
    name.includes('BOX SYNC') ||
    name.includes('RAIDRIVE') ||
    name.includes('레이드라이브') ||
    name.includes('CLOUDDRIVE') ||
    name.includes('NETDRIVE') ||
    name.includes('WEBDAV') ||
    desc.includes('구글') ||
    desc.includes('클라우드') ||
    desc.includes('CLOUD') ||
    desc.includes('ONEDRIVE') ||
    desc.includes('DROPBOX') ||
    fileSystem.includes('GOOGLE') ||
    fileSystem.includes('CLOUD') ||
    physicalModel.includes('GOOGLE') ||
    physicalModel.includes('ONEDRIVE') ||
    physicalModel.includes('DROPBOX') ||
    physicalModel.includes('RAIDRIVE')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true ONLY if the drive is an actual physical fixed disk (NVMe, SATA)
 * or a physical removable USB / flash storage.
 */
export function isPhysicalOrUsbDrive(drive: Partial<DiskDrive> | null | undefined): boolean {
  if (!drive) return false;
  if (isExcludedVirtualOrCloudDrive(drive)) return false;

  const isUsb = drive.type === 'removable' || drive.busType === 'USB';
  const isPhysicalFixed = drive.type === 'fixed' && (drive.isNvme || drive.isSata || drive.busType === 'NVMe' || drive.busType === 'SATA' || drive.busType === 'Internal' || drive.busType === 'NVMe/SATA');

  return isUsb || isPhysicalFixed || drive.type === 'removable' || drive.type === 'fixed';
}

/**
 * Filters any list of DiskDrives to strictly retain only physical disks and USBs.
 */
export function filterPhysicalDrivesOnly(drives: DiskDrive[]): DiskDrive[] {
  return drives.filter(d => isPhysicalOrUsbDrive(d));
}

export type DriveSortMode = 'device_priority' | 'drive_letter';

/**
 * Returns true if the drive is a removable USB flash drive, fast USB, or external USB SSD.
 */
export function isRemovableOrExternalDrive(drive: Partial<DiskDrive> | null | undefined): boolean {
  if (!drive) return false;
  return (
    drive.type === 'removable' ||
    drive.busType === 'USB' ||
    drive.deviceKind === 'fast_usb' ||
    drive.deviceKind === 'usb_flash' ||
    drive.deviceKind === 'external_ssd'
  );
}

function getNormalizedDriveLetterForSort(letter?: string): string {
  if (!letter) return 'ZZ';
  const trimmed = letter.trim();
  const colonMatch = trimmed.match(/(?:^|[^A-Za-z])([A-Za-z]):/);
  if (colonMatch?.[1]) return colonMatch[1].toUpperCase();
  const singleMatch = trimmed.match(/^([A-Za-z])$/);
  if (singleMatch?.[1]) return singleMatch[1].toUpperCase();
  return 'ZZ';
}

/**
 * Assigns a deterministic priority rank based on device kind:
 * 0: Fast USB (USB 3.0+), 1: Removable USB Flash, 2: External USB SSD,
 * 3: Other USB device, 4: Internal secondary disk (D:, etc.), 5: System disk (C:)
 */
export function getDriveKindPriorityRank(drive: Partial<DiskDrive>): number {
  const kind = (drive.deviceKind || '').toLowerCase();
  const name = (drive.name || '').toUpperCase();
  const desc = (drive.description || '').toUpperCase();
  const letterChar = getNormalizedDriveLetterForSort(drive.letter);

  if (
    kind === 'fast_usb' ||
    (isRemovableOrExternalDrive(drive) &&
      (name.includes('3.0') || name.includes('3.1') || name.includes('ULTRA') || name.includes('EXTREME')))
  ) {
    return 0;
  }

  if (kind === 'usb_flash' || drive.type === 'removable') {
    return 1;
  }

  if (
    kind === 'external_ssd' ||
    (drive.busType === 'USB' && (name.includes('SSD') || desc.includes('SSD') || drive.diskMediaType === 'SSD'))
  ) {
    return 2;
  }

  if (drive.busType === 'USB') {
    return 3;
  }

  if (letterChar !== 'C') {
    return 4;
  }

  return 5;
}

/**
 * Sorts drives automatically by device kind priority and/or drive letter.
 */
export function sortDrivesByPriority(
  drives: DiskDrive[],
  mode: DriveSortMode = 'device_priority'
): DiskDrive[] {
  return [...drives].sort((a, b) => {
    const rankA = getDriveKindPriorityRank(a);
    const rankB = getDriveKindPriorityRank(b);
    const letterA = getNormalizedDriveLetterForSort(a.letter);
    const letterB = getNormalizedDriveLetterForSort(b.letter);

    if (mode === 'drive_letter') {
      if (letterA !== letterB) return letterA.localeCompare(letterB);
      if (rankA !== rankB) return rankA - rankB;
    } else {
      if (rankA !== rankB) return rankA - rankB;
      if (letterA !== letterB) return letterA.localeCompare(letterB);
    }

    return (a.name || '').localeCompare(b.name || '', 'ko');
  });
}

/**
 * Checks if a certificate is stored on the exact same drive as the target drive letter
 * (Self-Copy prohibition rule: USB E: ➔ USB E: or Local D: ➔ Local D: is prohibited)
 */
export function isSameDriveSelfCopy(
  cert: { sourceDrive?: string; sourceLocation?: string },
  targetDriveLetterOrObj: string | Partial<DiskDrive> | null | undefined
): boolean {
  if (!cert || !targetDriveLetterOrObj) return false;

  const rawTarget = typeof targetDriveLetterOrObj === 'string'
    ? targetDriveLetterOrObj
    : targetDriveLetterOrObj.letter || '';

  const trimmedTarget = rawTarget.trim();
  const targetMatch =
    trimmedTarget.match(/(?:^|[^A-Za-z])([A-Za-z]):/) ||
    trimmedTarget.match(/\(([A-Za-z]):?\)/) ||
    trimmedTarget.match(/(?:^|[^A-Za-z])([A-Za-z])(?=$|[^A-Za-z])/);
  const targetLetter = (targetMatch ? targetMatch[1] : '').toUpperCase();
  if (!targetLetter) return false;

  const sourceDriveClean = (cert.sourceDrive || '').trim().toUpperCase();
  const sourceLocClean = (cert.sourceLocation || '').trim().toUpperCase();

  // Check if sourceLocation starts with "E:"
  if (sourceLocClean.startsWith(`${targetLetter}:`)) {
    return true;
  }

  // Check if sourceDrive mentions drive letter e.g. "E: (이동식 USB)" or "E:"
  if (
    sourceDriveClean.startsWith(`${targetLetter}:`) ||
    sourceDriveClean.includes(`(${targetLetter}:)`) ||
    sourceDriveClean.includes(` ${targetLetter}:`)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether a certificate is stored on the local PC (C: drive, local AppData/ProgramData/Desktop/Documents).
 */
export function isPcCertificate(
  cert: { sourceDrive?: string; sourceLocation?: string; isRemovableMedia?: boolean }
): boolean {
  if (cert.isRemovableMedia === true) return false;
  if (cert.isRemovableMedia === false) return true;

  const sourceDrive = (cert.sourceDrive || '').toUpperCase();
  const sourceLoc = (cert.sourceLocation || '').trim().toUpperCase();

  // Explicit removable flags
  if (
    sourceDrive.includes('이동식') ||
    sourceDrive.includes('외장') ||
    sourceDrive.includes('EXTERNAL') ||
    sourceDrive.includes('USB') ||
    sourceDrive.includes('REMOVABLE') ||
    sourceLoc.startsWith('USB:\\') ||
    sourceLoc.startsWith('USB:/')
  ) {
    return false;
  }

  const removableDriveLocRegex = /^[E-Z]:/;
  const removableDriveLabelRegex = /(?:^|[^A-Z])[E-Z]:|\([E-Z]\)/;
  if (removableDriveLocRegex.test(sourceLoc) || removableDriveLabelRegex.test(sourceDrive)) {
    // Only treat as PC if explicitly labeled as internal/local disk without USB cues
    if (!sourceDrive.includes('내장') && !sourceDrive.includes('로컬 디스크')) {
      return false;
    }
  }

  // PC / C: / D: standard indicators (avoid matching "PC:" as "C:")
  if (/(?:^|[^A-Z])C:|\(C\)/.test(sourceDrive) || sourceDrive.includes('컴퓨터') || sourceDrive.includes('로컬')) {
    return true;
  }
  if (/^[CD]:/.test(sourceLoc) || sourceLoc.includes('APPDATA') || sourceLoc.includes('LOCALLOW') || sourceLoc.includes('PROGRAMDATA') || sourceLoc.includes('USERS')) {
    return true;
  }

  return !sourceDrive.includes('USB') && !sourceDrive.includes('이동식');
}

/**
 * Checks whether a certificate is stored on removable USB / external media.
 */
export function isUsbCertificate(
  cert: { sourceDrive?: string; sourceLocation?: string; isRemovableMedia?: boolean }
): boolean {
  return !isPcCertificate(cert);
}

