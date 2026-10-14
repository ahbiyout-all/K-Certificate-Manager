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

/**
 * Checks if a certificate is stored on the exact same drive as the target drive letter
 * (Self-Copy prohibition rule: USB E: ➔ USB E: or Local D: ➔ Local D: is prohibited)
 */
export function isSameDriveSelfCopy(
  cert: { sourceDrive?: string; sourceLocation?: string },
  targetDriveLetterOrObj: string | Partial<DiskDrive> | null | undefined
): boolean {
  if (!cert || !targetDriveLetterOrObj) return false;

  let targetLetter = typeof targetDriveLetterOrObj === 'string' 
    ? targetDriveLetterOrObj 
    : targetDriveLetterOrObj.letter || '';

  targetLetter = targetLetter.trim().replace(':', '').toUpperCase();
  if (!targetLetter) return false;

  const sourceDriveClean = (cert.sourceDrive || '').trim().toUpperCase();
  const sourceLocClean = (cert.sourceLocation || '').trim().toUpperCase();

  // Check if sourceLocation starts with "E:" or "E:\"
  if (sourceLocClean.startsWith(`${targetLetter}:`) || sourceLocClean.startsWith(`${targetLetter}\\`)) {
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
