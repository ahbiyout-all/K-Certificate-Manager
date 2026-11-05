import { DiskDrive } from '../types';

export interface DriveBadgeStyle {
  letterBadgeClass: string;
  typeBadgeClass: string;
  cardSelectedClass: string;
  cardNormalClass: string;
  typeLabel: string;
  driveCategory: 'c_drive' | 'usb_drive' | 'external_ssd' | 'fast_usb' | 'secondary_fixed' | 'cd_rom' | 'network';
  textColorClass: string;
  subtextColorClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

/**
 * High-Contrast, Color-Coded Drive Styling Helper
 * Ensures bold typography, distinct color-coding per drive type,
 * and high contrast ratios across all background and text combinations.
 */
export function getDriveBadgeStyle(drive: DiskDrive | null | undefined): DriveBadgeStyle {
  if (!drive) {
    return {
      letterBadgeClass: 'bg-slate-700 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg font-mono shadow-2xs',
      typeBadgeClass: 'bg-slate-100 text-slate-900 border border-slate-300 font-extrabold text-[11px] px-2 py-0.5 rounded-md',
      cardSelectedClass: 'border-slate-600 bg-slate-100/80 ring-2 ring-slate-400/30',
      cardNormalClass: 'border-slate-200 bg-white hover:border-slate-300',
      typeLabel: '미지정 드라이브',
      driveCategory: 'secondary_fixed',
      textColorClass: 'text-slate-950 font-extrabold',
      subtextColorClass: 'text-slate-700 font-medium',
      iconBgClass: 'bg-slate-100',
      iconColorClass: 'text-slate-700',
    };
  }

  const driveLetter = (drive.letter || '').toUpperCase().trim();
  const driveName = (drive.name || '').toLowerCase();
  const driveDesc = (drive.description || '').toLowerCase();
  const isCdRom = drive.isCdRom || drive.type === 'cdrom' || drive.deviceKind === 'cdrom' || drive.deviceKind === 'virtual_cd' || driveName.includes('cd-rom') || driveName.includes('dvd') || drive.fileSystem === 'UDF' || drive.fileSystem === 'CDFS';
  const isUsb = !isCdRom && (drive.type === 'removable' || drive.busType === 'USB');
  const isExternalSsd = drive.deviceKind === 'external_ssd' || (isUsb && (driveName.includes('ssd') || driveDesc.includes('ssd')));
  const isFastUsb = drive.deviceKind === 'fast_usb' || (isUsb && (driveName.includes('3.0') || driveName.includes('3.1') || driveName.includes('ultra') || driveName.includes('extreme')));
  const isCDrive = driveLetter === 'C:' || (driveLetter.startsWith('C') && drive.type === 'fixed');

  // 1. C: Main Computer System Drive (Deep Royal Blue)
  if (isCDrive) {
    return {
      letterBadgeClass: 'bg-blue-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-lg font-mono shadow-xs border border-blue-800',
      typeBadgeClass: 'bg-blue-100 text-blue-950 border border-blue-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs',
      cardSelectedClass: 'border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/40 shadow-md',
      cardNormalClass: 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/70 hover:border-blue-400',
      typeLabel: '💻 PC 내장 C: 시스템 디스크',
      driveCategory: 'c_drive',
      textColorClass: 'text-blue-950 font-extrabold',
      subtextColorClass: 'text-blue-900 font-semibold',
      iconBgClass: 'bg-blue-600 text-white shadow-2xs',
      iconColorClass: 'text-white',
    };
  }

  // 2. CD-ROM / Virtual ISO (Rose Red)
  if (isCdRom) {
    return {
      letterBadgeClass: 'bg-rose-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-lg font-mono shadow-xs border border-rose-800',
      typeBadgeClass: 'bg-rose-100 text-rose-950 border border-rose-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs',
      cardSelectedClass: 'border-rose-600 bg-rose-50/90 text-rose-950 ring-2 ring-rose-500/40 shadow-md',
      cardNormalClass: 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/70 hover:border-rose-400',
      typeLabel: '💿 가상/물리 CD-ROM',
      driveCategory: 'cd_rom',
      textColorClass: 'text-rose-950 font-extrabold',
      subtextColorClass: 'text-rose-900 font-semibold',
      iconBgClass: 'bg-rose-600 text-white shadow-2xs',
      iconColorClass: 'text-white',
    };
  }

  // 3. External SSD (Vibrant Violet / Purple)
  if (isExternalSsd) {
    return {
      letterBadgeClass: 'bg-purple-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-lg font-mono shadow-xs border border-purple-800',
      typeBadgeClass: 'bg-purple-100 text-purple-950 border border-purple-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs',
      cardSelectedClass: 'border-purple-600 bg-purple-50/90 text-purple-950 ring-2 ring-purple-500/40 shadow-md',
      cardNormalClass: 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/70 hover:border-purple-400',
      typeLabel: '🚀 외장 고속 SSD',
      driveCategory: 'external_ssd',
      textColorClass: 'text-purple-950 font-extrabold',
      subtextColorClass: 'text-purple-900 font-semibold',
      iconBgClass: 'bg-purple-600 text-white shadow-2xs',
      iconColorClass: 'text-white',
    };
  }

  // 4. Fast USB 3.0 / 3.1 (Cyan / Teal)
  if (isFastUsb) {
    return {
      letterBadgeClass: 'bg-sky-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-lg font-mono shadow-xs border border-sky-800',
      typeBadgeClass: 'bg-sky-100 text-sky-950 border border-sky-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs',
      cardSelectedClass: 'border-sky-600 bg-sky-50/90 text-sky-950 ring-2 ring-sky-500/40 shadow-md',
      cardNormalClass: 'border-sky-200 bg-sky-50/30 hover:bg-sky-50/70 hover:border-sky-400',
      typeLabel: '⚡ 고속 USB 3.0 메모리',
      driveCategory: 'fast_usb',
      textColorClass: 'text-sky-950 font-extrabold',
      subtextColorClass: 'text-sky-900 font-semibold',
      iconBgClass: 'bg-sky-600 text-white shadow-2xs',
      iconColorClass: 'text-white',
    };
  }

  // 5. Standard USB Removable Drive (Emerald Green)
  if (isUsb) {
    return {
      letterBadgeClass: 'bg-emerald-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-lg font-mono shadow-xs border border-emerald-800',
      typeBadgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs',
      cardSelectedClass: 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/40 shadow-md',
      cardNormalClass: 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/70 hover:border-emerald-400',
      typeLabel: '💾 이동식 USB 메모리',
      driveCategory: 'usb_drive',
      textColorClass: 'text-emerald-950 font-extrabold',
      subtextColorClass: 'text-emerald-900 font-semibold',
      iconBgClass: 'bg-emerald-600 text-white shadow-2xs',
      iconColorClass: 'text-white',
    };
  }

  // 6. Secondary Internal Fixed Disk (D:, E: HDD/SSD) (Indigo)
  return {
    letterBadgeClass: 'bg-indigo-700 text-white font-extrabold text-sm px-2.5 py-1 rounded-lg font-mono shadow-xs border border-indigo-800',
    typeBadgeClass: 'bg-indigo-100 text-indigo-950 border border-indigo-300 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs',
    cardSelectedClass: 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-2 ring-indigo-500/40 shadow-md',
    cardNormalClass: 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/70 hover:border-indigo-400',
    typeLabel: '💽 내장 보조 디스크',
    driveCategory: 'secondary_fixed',
    textColorClass: 'text-indigo-950 font-extrabold',
    subtextColorClass: 'text-indigo-900 font-semibold',
    iconBgClass: 'bg-indigo-600 text-white shadow-2xs',
    iconColorClass: 'text-white',
  };
}

/**
 * Get quick inline drive letter badge (e.g. [C:], [E:], [F:]) with bold typography & solid background color
 */
export function getInlineDriveBadge(letter: string): { bgClass: string; textClass: string; fullBadgeClass: string } {
  const cleanLetter = (letter || '').toUpperCase().trim();
  if (cleanLetter.startsWith('C')) {
    return {
      bgClass: 'bg-blue-700',
      textClass: 'text-white font-extrabold',
      fullBadgeClass: 'bg-blue-700 text-white font-extrabold text-xs px-2 py-0.5 rounded font-mono shadow-2xs inline-flex items-center gap-1',
    };
  }
  if (cleanLetter.startsWith('D')) {
    return {
      bgClass: 'bg-indigo-700',
      textClass: 'text-white font-extrabold',
      fullBadgeClass: 'bg-indigo-700 text-white font-extrabold text-xs px-2 py-0.5 rounded font-mono shadow-2xs inline-flex items-center gap-1',
    };
  }
  // USB drives E:, F:, G:, H: etc.
  return {
    bgClass: 'bg-emerald-700',
    textClass: 'text-white font-extrabold',
    fullBadgeClass: 'bg-emerald-700 text-white font-extrabold text-xs px-2 py-0.5 rounded font-mono shadow-2xs inline-flex items-center gap-1',
  };
}
