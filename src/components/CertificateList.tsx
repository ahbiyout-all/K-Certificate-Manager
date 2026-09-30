import React, { useState, useMemo } from 'react';
import { 
  CertificateItem, 
  CertCategory,
  DiskDrive
} from '../types';
import { isNonStandardCertPath } from '../utils/certPathUtils';
import { filterPhysicalDrivesOnly } from '../utils/driveFilter';
import { 
  Search, 
  Copy, 
  Eye, 
  HardDrive, 
  Laptop,
  Building2, 
  User, 
  Briefcase, 
  Calendar, 
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileKey,
  Trash2,
  Lock,
  ArrowUpDown,
  CalendarX,
  Users,
  RotateCcw,
  ArrowDownLeft,
  FileText,
  Sparkles,
  ChevronRight,
  Cpu,
  LayoutGrid,
  SlidersHorizontal,
  Zap,
  Monitor,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface CertificateListProps {
  certificates: CertificateItem[];
  selectedIds: string[];
  recentlyCopiedIds?: string[];
  availableDrives?: DiskDrive[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onSelectFilteredIds?: (ids: string[]) => void;
  onClearSelection: () => void;
  onSelectCategory?: (category: 'ALL' | 'GOV' | 'BANK' | 'CORP') => void;
  onOpenBackupModal: () => void;
  onSelectTargetDriveAndBackup?: (driveId: string) => void;
  onOpenDetailModal: (cert: CertificateItem) => void;
  onQuickBackupSingle: (cert: CertificateItem) => void;
  onOpenCleanupModal: (mode: 'EXPIRED' | 'OTHER_USERS' | 'SELECTED') => void;
  onRequestDeleteSingle: (cert: CertificateItem) => void;
  onDeleteCustomCert?: (id: string) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onOpenUsbToPc?: (driveLetter?: string) => void;
  onOpenDesktopApp?: () => void;
  onOpenUsbDiagnostic?: () => void;
  onOpenActivityLogs?: () => void;
  logCount?: number;
  onRefresh?: () => void;
  isScanning?: boolean;
  onOpenRenewalGuidance?: (targets?: CertificateItem[]) => void;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates,
  selectedIds,
  recentlyCopiedIds = [],
  availableDrives = [],
  onToggleSelect,
  onSelectAll,
  onSelectFilteredIds,
  onClearSelection,
  onOpenBackupModal,
  onSelectTargetDriveAndBackup,
  onOpenDetailModal,
  onQuickBackupSingle,
  onOpenCleanupModal,
  onRequestDeleteSingle,
  onDeleteCustomCert,
  onOpenTrash,
  trashCount = 0,
  onOpenUsbToPc,
  onOpenDesktopApp,
  onOpenUsbDiagnostic,
  onOpenActivityLogs,
  logCount = 0,
  onRefresh,
  isScanning = false,
  onOpenRenewalGuidance,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VALID' | 'EXPIRING' | 'EXPIRED' | 'GOV' | 'BANK' | 'CORP' | 'NON_STANDARD'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'LOCAL' | 'REMOVABLE'>('ALL');
  const [onlyDrivesWithCerts, setOnlyDrivesWithCerts] = useState<boolean>(false);
  
  // USB 드라이브 현황 표시 모드: 'basic'(기본 표시) | 'advanced'(고급 표시)
  const [driveDisplayMode, setDriveDisplayMode] = useState<'basic' | 'advanced'>(() => {
    try {
      const saved = localStorage.getItem('kcert_drive_display_mode');
      if (saved === 'basic' || saved === 'advanced') return saved;
    } catch (e) {
      // ignore
    }
    return 'basic'; // 기본 표시로 직관적 시작, 고급 표시로 1클릭 전환 가능
  });

  const [copiedVsnId, setCopiedVsnId] = useState<string | null>(null);

  const handleCopyVsn = (driveId: string, vsn: string) => {
    try {
      navigator.clipboard.writeText(vsn);
      setCopiedVsnId(driveId);
      setTimeout(() => setCopiedVsnId(null), 1500);
    } catch (e) {
      // fallback
    }
  };

  // Helper function to check if cert is on removable USB
  const isUsbCertificate = (cert: CertificateItem): boolean => {
    const loc = (cert.sourceLocation || '').toUpperCase();
    const drv = (cert.sourceDrive || '').toUpperCase();
    return drv.includes('이동식') || drv.includes('USB') || loc.startsWith('E:') || loc.startsWith('F:') || loc.startsWith('G:') || loc.startsWith('H:');
  };

  const getDriveLetter = (cert: CertificateItem): string => {
    if (cert.sourceLocation && cert.sourceLocation.length >= 2 && cert.sourceLocation[1] === ':') {
      return cert.sourceLocation.substring(0, 2);
    }
    if (cert.sourceDrive && cert.sourceDrive.length >= 2 && cert.sourceDrive[1] === ':') {
      return cert.sourceDrive.substring(0, 2);
    }
    return 'C:';
  };

  // Connected drives analysis for backup targets (실제 물리적 디스크 및 USB만 표시, 가상디스크/클라우드/시디롬 제외)
  const backupDrives = useMemo(() => {
    const physicalOnly = filterPhysicalDrivesOnly(availableDrives);
    return physicalOnly.filter(d => !d.letter.toUpperCase().startsWith('C:'));
  }, [availableDrives]);

  const backupDrivesWithStats = useMemo(() => {
    const list = backupDrives.map(drive => {
      const letterClean = drive.letter.replace(':', '').toUpperCase();
      const certsInDrive = certificates.filter(c => {
        const loc = (c.sourceLocation || '').toUpperCase();
        const drv = (c.sourceDrive || '').toUpperCase();
        return loc.startsWith(letterClean + ':') || drv.startsWith(letterClean + ':');
      });

      // 장치 종류별 명칭 및 버튼 문구 결정
      let kindLabel = drive.deviceKindLabel;
      let buttonText = '⚡ 이 USB로 백업';
      let badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-400/30';

      if (drive.deviceKind === 'external_ssd' || drive.name.toLowerCase().includes('ssd')) {
        kindLabel = '외장 SSD';
        buttonText = '⚡ 이 외장 SSD로 백업';
        badgeBg = 'bg-purple-500/25 text-purple-300 border-purple-400/30';
      } else if (drive.deviceKind === 'fast_usb' || drive.name.toLowerCase().includes('3.0') || drive.name.toLowerCase().includes('3.1') || drive.name.toLowerCase().includes('ultra') || drive.name.toLowerCase().includes('extreme')) {
        kindLabel = '고속 USB 메모리';
        buttonText = '⚡ 이 고속 USB로 백업';
        badgeBg = 'bg-cyan-500/25 text-cyan-300 border-cyan-400/30';
      } else if (drive.deviceKind === 'internal_fixed' || drive.type === 'fixed') {
        kindLabel = '내장 디스크';
        buttonText = '⚡ 이 내장 디스크로 백업';
        badgeBg = 'bg-slate-700 text-slate-300 border-slate-600';
      } else {
        kindLabel = '이동식 USB 메모리';
        buttonText = '⚡ 이 USB로 백업';
        badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      }

      return {
        ...drive,
        certCount: certsInDrive.length,
        certs: certsInDrive,
        isEmpty: certsInDrive.length === 0,
        kindLabel,
        buttonText,
        badgeBg,
      };
    });

    // Priority Sort: Drives containing certificates FIRST (descending by certCount)
    list.sort((a, b) => {
      if (b.certCount !== a.certCount) {
        return b.certCount - a.certCount;
      }
      return a.letter.localeCompare(b.letter);
    });

    return list;
  }, [backupDrives, certificates]);

  const drivesWithCertsCount = useMemo(() => {
    return backupDrivesWithStats.filter(d => d.certCount > 0).length;
  }, [backupDrivesWithStats]);

  const sortedBackupDrivesWithStats = useMemo(() => {
    if (onlyDrivesWithCerts) {
      return backupDrivesWithStats.filter(d => d.certCount > 0);
    }
    return backupDrivesWithStats;
  }, [backupDrivesWithStats, onlyDrivesWithCerts]);

  const emptyBackupDrives = useMemo(() => {
    return backupDrivesWithStats.filter(d => d.isEmpty);
  }, [backupDrivesWithStats]);

  // Filtered certificates
  const filteredCerts = useMemo(() => {
    return certificates.filter(cert => {
      // Category & Status filter
      if (categoryFilter === 'VALID' && cert.status !== 'valid') {
        return false;
      }
      if (categoryFilter === 'EXPIRED' && cert.status !== 'expired') {
        return false;
      }
      if (categoryFilter === 'EXPIRING' && cert.status !== 'expiring') {
        return false;
      }
      if (categoryFilter === 'GOV' && cert.category !== 'GPKI_GOV' && cert.category !== 'EPKI_EDU') {
        return false;
      }
      if (categoryFilter === 'BANK' && cert.category !== 'NPKI_BANK') {
        return false;
      }
      if (categoryFilter === 'CORP' && cert.category !== 'NPKI_CORP') {
        return false;
      }
      if (categoryFilter === 'NON_STANDARD' && !cert.isCustomPath && !isNonStandardCertPath(cert.sourceLocation)) {
        return false;
      }

      // Source filter
      const isUsb = isUsbCertificate(cert);
      if (sourceFilter === 'LOCAL' && isUsb) {
        return false;
      }
      if (sourceFilter === 'REMOVABLE' && !isUsb) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cert.name.toLowerCase().includes(q);
        const matchIssuer = cert.issuer.toLowerCase().includes(q);
        const matchCa = (cert.caSignatureName || '').toLowerCase().includes(q);
        const matchDept = (cert.departmentOrOrg || '').toLowerCase().includes(q);
        const matchPolicy = cert.policy.toLowerCase().includes(q);
        const matchSerial = cert.serialNumber.toLowerCase().includes(q);
        const matchPath = cert.sourceLocation.toLowerCase().includes(q);
        const matchLocationType = isUsb ? 'usb 이동식' : '컴퓨터 pc 로컬';
        return matchName || matchIssuer || matchCa || matchDept || matchPolicy || matchSerial || matchPath || matchLocationType.includes(q);
      }

      return true;
    });
  }, [certificates, categoryFilter, sourceFilter, searchQuery]);

  const allFilteredSelected = filteredCerts.length > 0 && filteredCerts.every(c => selectedIds.includes(c.id));

  const handleToggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else {
      const ids = filteredCerts.map(c => c.id);
      if (onSelectFilteredIds) {
        onSelectFilteredIds(ids);
      } else {
        onSelectAll();
      }
    }
  };

  // Category & status counts
  const validCount = certificates.filter(c => c.status === 'valid').length;
  const expiredCount = certificates.filter(c => c.status === 'expired').length;
  const expiringSoonCount = certificates.filter(c => c.status === 'expiring').length;
  const govCount = certificates.filter(c => c.category === 'GPKI_GOV' || c.category === 'EPKI_EDU').length;
  const bankCount = certificates.filter(c => c.category === 'NPKI_BANK').length;
  const corpCount = certificates.filter(c => c.category === 'NPKI_CORP').length;
  const nonStandardCount = certificates.filter(c => c.isCustomPath || isNonStandardCertPath(c.sourceLocation)).length;
  const localPcCount = certificates.filter(c => !isUsbCertificate(c)).length;
  const usbCount = certificates.filter(c => isUsbCertificate(c)).length;
  
  // Distinct users count
  const distinctUsers = useMemo(() => {
    return Array.from(new Set(certificates.map(c => c.name)));
  }, [certificates]);

  const getCategoryLabel = (cert: CertificateItem | CertCategory) => {
    if (typeof cert !== 'string') {
      const isUnnamed = cert.name.includes('미지정') || cert.name.includes('미식별');
      if (cert.isSystemCa) {
        return cert.category === 'EPKI_EDU' ? '교육부 시스템 CA (EPKI)' : '행정전자서명 시스템 CA (GPKI)';
      }
      if (cert.isInstitutional) {
        return cert.category === 'EPKI_EDU' ? '교육기관용/관인 (EPKI)' : '행정기관용/관인 (GPKI)';
      }
      if (isUnnamed) {
        switch (cert.category) {
          case 'GPKI_GOV':
            return 'GPKI (명칭 미지정)';
          case 'EPKI_EDU':
            return 'EPKI (명칭 미지정)';
          case 'NPKI_CORP':
            return '법인 NPKI (명칭 미지정)';
          case 'NPKI_BANK':
            return 'NPKI (명칭 미지정)';
          case 'UNKNOWN':
          default:
            return '미분류 / 명칭 미지정';
        }
      }
      switch (cert.category) {
        case 'GPKI_GOV':
          return '공무원인증서 (GPKI)';
        case 'EPKI_EDU':
          return '교육행정 (EPKI)';
        case 'NPKI_CORP':
          return '법인/기업 (NPKI)';
        case 'NPKI_BANK':
          return '금융인증서 (NPKI)';
        case 'UNKNOWN':
        default:
          return '미분류 / 명칭 미지정';
      }
    }
    switch (cert) {
      case 'GPKI_GOV':
        return '공무원인증서 (GPKI)';
      case 'EPKI_EDU':
        return '교육행정 (EPKI)';
      case 'NPKI_CORP':
        return '법인/기업 (NPKI)';
      case 'NPKI_BANK':
        return '금융인증서 (NPKI)';
      case 'UNKNOWN':
      default:
        return '미분류 / 명칭 미지정';
    }
  };

  const getStatusBadge = (cert: CertificateItem) => {
    if (cert.status === 'expired') {
      return (
        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border border-rose-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          <span>만료됨</span>
        </span>
      );
    }
    if (cert.status === 'expiring') {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border border-amber-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          <span>만료임박 (D-{cert.daysRemaining})</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-300 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
        <span>유효함</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Connected Drives Status Bar (Shows ALL connected backup drives: External SSD, Fast USB, Removable USB, Local Data Disk) */}
      {backupDrivesWithStats.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-3.5 sm:p-4 text-white shadow-sm border border-indigo-900/60 space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Title, Badges, and Mode Subtext */}
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-colors ${
                driveDisplayMode === 'basic'
                  ? 'bg-blue-600/20 border-blue-400/40 text-blue-400'
                  : 'bg-indigo-600/20 border-indigo-400/40 text-indigo-400'
              }`}>
                {driveDisplayMode === 'basic' ? <LayoutGrid className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    연결된 백업 드라이브 현황
                    <span className="text-xs text-slate-300 font-normal">
                      ({backupDrivesWithStats.length}개 인식)
                    </span>
                  </span>
                  
                  {driveDisplayMode === 'basic' ? (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                      <span>기본 표시 모드</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full font-bold flex items-center gap-1">
                      <SlidersHorizontal className="w-2.5 h-2.5" />
                      <span>고급 표시 모드 (VSN·WMI)</span>
                    </span>
                  )}

                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>인증서 보유 우선 정렬</span>
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {driveDisplayMode === 'basic'
                    ? '💡 기본 모드: 용량 현황과 원클릭 핵심 버튼(컴퓨터로 복사 · 백업)을 직관적으로 확인합니다.'
                    : '💡 고급 모드: 하드웨어 고유 VSN 시리얼 번호, 파일시스템, WMI 정밀 진단 및 듀얼 복사 기능을 제공합니다.'}
                </p>
              </div>
            </div>

            {/* Right: Display Mode Toggle & Filter Actions */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
              {/* [기본 표시] vs [고급 표시] Toggle Segment */}
              <div className="inline-flex p-0.5 bg-slate-950/90 rounded-lg border border-slate-700/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setDriveDisplayMode('basic');
                    try { localStorage.setItem('kcert_drive_display_mode', 'basic'); } catch (e) {}
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    driveDisplayMode === 'basic'
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="일반 사용자를 위해 용량 게이지와 원클릭 핵심 액션을 간결하게 표시합니다"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>기본 표시</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDriveDisplayMode('advanced');
                    try { localStorage.setItem('kcert_drive_display_mode', 'advanced'); } catch (e) {}
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    driveDisplayMode === 'advanced'
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="하드웨어 VSN 식별자, 파일시스템, WMI 정밀 정보 및 다중 액션을 표시합니다"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>고급 표시</span>
                  <span className="text-[10px] px-1 py-0.2 bg-indigo-950 text-indigo-200 border border-indigo-500/40 rounded font-mono">
                    상세
                  </span>
                </button>
              </div>

              {/* Filter: Drives with Certs */}
              {drivesWithCertsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyDrivesWithCerts(!onlyDrivesWithCerts)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlyDrivesWithCerts
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-400/30'
                  }`}
                  title="인증서가 포함된 드라이브만 추려 봅니다"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>인증서 보유만 ({drivesWithCertsCount})</span>
                </button>
              )}

              {/* Advanced Mode: WMI Diagnostic Button */}
              {driveDisplayMode === 'advanced' && onOpenUsbDiagnostic && (
                <button
                  type="button"
                  onClick={onOpenUsbDiagnostic}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-xs border border-indigo-500/50"
                  title="USB 장치 식별자(Volume Serial Number) 및 Windows WMI 진단창 열기"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>WMI 진단</span>
                </button>
              )}

              {/* Removable Only Filter Button */}
              <button
                type="button"
                onClick={() => setSourceFilter(sourceFilter === 'REMOVABLE' ? 'ALL' : 'REMOVABLE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceFilter === 'REMOVABLE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
                title="목록에서 이동식 USB 매체에 보관된 인증서만 필터링합니다"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>USB 필터 ({usbCount})</span>
              </button>
            </div>
          </div>

          {/* Drives Grid: Rendered based on driveDisplayMode */}
          {driveDisplayMode === 'basic' ? (
            /* ======================================================== */
            /* [기본 표시 (Basic View)]: 깔끔한 용량 게이지 & 원클릭 버튼 */
            /* ======================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {sortedBackupDrivesWithStats.map(drive => {
                const hasCerts = drive.certCount > 0;
                const freePercent = drive.freePercentage ?? 80;
                const usedPercent = Math.max(5, Math.min(100, 100 - freePercent));

                return (
                  <div
                    key={drive.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      hasCerts
                        ? 'bg-slate-800/90 border-amber-400/60 ring-1 ring-amber-400/20 shadow-md hover:border-amber-400'
                        : drive.isEmpty
                        ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 shadow-xs'
                        : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top: Drive Letter & Device Name & Status Badge */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            hasCerts
                              ? 'text-amber-300 bg-amber-400/20 border-amber-400/40'
                              : 'text-blue-300 bg-blue-500/20 border-blue-400/30'
                          }`}>
                            {drive.letter}
                          </span>
                          <span className="text-xs font-bold text-white truncate" title={drive.name}>
                            {drive.name.split('(')[0].trim()}
                          </span>
                        </div>

                        {hasCerts ? (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-full border bg-amber-400/20 text-amber-300 border-amber-400/40 shrink-0 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>인증서 {drive.certCount}건</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 font-medium rounded-full border bg-slate-700/60 text-slate-300 border-slate-600/60 shrink-0">
                            {drive.isEmpty ? '빈 드라이브' : '인증서 없음'}
                          </span>
                        )}
                      </div>

                      {/* Middle: Visual Storage Gauge Bar */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">저장 공간</span>
                          <span className="text-slate-200 font-medium">
                            여유 <strong className="text-white">{drive.freeSpace}</strong>
                            {drive.totalSpace && <span className="text-slate-400"> / {drive.totalSpace}</span>}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden p-0.5 flex">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              hasCerts ? 'bg-gradient-to-r from-amber-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                            }`}
                            style={{ width: `${usedPercent}%` }}
                            title={`사용률 약 ${usedPercent}%`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Clear, Single Primary Action Button */}
                    <div className="pt-2 border-t border-slate-700/60">
                      {hasCerts ? (
                        <button
                          type="button"
                          onClick={() => onOpenUsbToPc && onOpenUsbToPc(drive.letter.replace(':', ''))}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          title={`${drive.letter} 드라이브의 인증서를 내 컴퓨터(AppData\\LocalLow)로 복사합니다`}
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>컴퓨터로 복사 ({drive.certCount}건)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectTargetDriveAndBackup) {
                              onSelectTargetDriveAndBackup(drive.id);
                            } else {
                              onOpenBackupModal();
                            }
                          }}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            drive.isEmpty
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                          title={`${drive.letter} 드라이브로 선택한 인증서를 백업합니다`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>이 드라이브로 백업</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ======================================================== */
            /* [고급 표시 (Advanced View)]: VSN 식별자, WMI, 듀얼 액션 */
            /* ======================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {sortedBackupDrivesWithStats.map(drive => {
                const hasCerts = drive.certCount > 0;
                const isCopied = copiedVsnId === drive.id;

                return (
                  <div
                    key={drive.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      hasCerts
                        ? 'bg-gradient-to-b from-slate-800 to-indigo-950/90 border-amber-400 ring-1 ring-amber-400/20 shadow-md'
                        : drive.isEmpty
                        ? 'bg-slate-800/90 border-slate-700 hover:border-slate-600 shadow-xs'
                        : 'bg-slate-800/90 border-slate-700 hover:border-emerald-500/50 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Row: Letter, Name, Kind Badge */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            hasCerts
                              ? 'text-amber-300 bg-amber-400/20 border-amber-400/40'
                              : 'text-slate-300 bg-slate-700 border-slate-600'
                          }`}>
                            {drive.letter}
                          </span>
                          <span className="text-xs font-bold text-white truncate" title={drive.name}>
                            {drive.name.split('(')[0].trim()}
                          </span>
                        </div>

                        <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded border shrink-0 ${
                          hasCerts ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : drive.badgeBg
                        }`}>
                          {hasCerts ? '인증서 보관' : drive.kindLabel}
                        </span>
                      </div>

                      {/* Middle: Specs & Certificate Status */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                        <span>여유: <strong className="text-white">{drive.freeSpace}</strong></span>
                        <span className="text-[10px]">
                          {hasCerts ? (
                            <span className="font-extrabold text-amber-300 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 inline" /> 인증서 {drive.certCount}건 (추천)
                            </span>
                          ) : drive.isEmpty ? (
                            <span className="text-slate-400 font-medium">빈 드라이브</span>
                          ) : (
                            <span className="text-slate-400">인증서 없음</span>
                          )}
                        </span>
                      </div>

                      {/* Advanced Specs: FileSystem & BusType */}
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 bg-slate-900/80 rounded border border-slate-700/80 font-mono text-slate-300">
                            {drive.fileSystem || 'FAT32'}
                          </span>
                          <span className="px-1.5 py-0.2 bg-slate-900/80 rounded border border-slate-700/80 text-slate-300">
                            {drive.busType || 'USB'}
                          </span>
                        </div>

                        {drive.wmiStatus && (
                          <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            WMI {drive.wmiStatus}
                          </span>
                        )}
                      </div>

                      {/* Volume Serial Number (VSN) Pill with 1-Click Copy */}
                      {drive.volumeSerialNumber && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-indigo-300/90 font-mono">
                          <span className="text-slate-400">VSN:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyVsn(drive.id, drive.volumeSerialNumber!)}
                            className="bg-indigo-950/90 hover:bg-indigo-900/90 px-1.5 py-0.5 rounded border border-indigo-800/60 font-semibold text-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="볼륨 시리얼 번호(VSN) 클립보드 복사"
                          >
                            <span>{drive.volumeSerialNumber}</span>
                            {isCopied ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-indigo-400 opacity-70" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions Row: Dual Actions for Advanced Mode */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700/60">
                      {hasCerts ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenUsbToPc && onOpenUsbToPc(drive.letter.replace(':', ''))}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            title={`${drive.letter} 드라이브의 인증서를 내 컴퓨터로 복사합니다`}
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>컴퓨터로 복사 ({drive.certCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectTargetDriveAndBackup) {
                                onSelectTargetDriveAndBackup(drive.id);
                              } else {
                                onOpenBackupModal();
                              }
                            }}
                            className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                            title={`${drive.letter} (${drive.kindLabel}) 드라이브로 백업`}
                          >
                            <span>백업</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectTargetDriveAndBackup) {
                              onSelectTargetDriveAndBackup(drive.id);
                            } else {
                              onOpenBackupModal();
                            }
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            drive.isEmpty
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                          title={`${drive.letter} (${drive.kindLabel}) 드라이브로 선택한 인증서를 복사합니다`}
                        >
                          <span>{drive.buttonText}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top Filter & Search Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col gap-3.5">
          {/* Row 1: Location & Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Storage Location Pills [전체 | 컴퓨터 | USB] */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setSourceFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                  sourceFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm ring-2 ring-slate-400/30 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                전체 매체 ({certificates.length})
              </button>

              <button
                type="button"
                onClick={() => setSourceFilter('LOCAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  sourceFilter === 'LOCAL'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40 font-extrabold'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>컴퓨터 ({localPcCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceFilter('REMOVABLE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  sourceFilter === 'REMOVABLE'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40 font-extrabold'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>USB ({usbCount})</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative flex-1 sm:w-72 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="이름, 소속, 발급기관, USB/컴퓨터 검색..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 mr-1">분류 & 상태:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 ({certificates.length})
            </button>

            {/* Status: Valid (유효함) */}
            <button
              type="button"
              onClick={() => setCategoryFilter('VALID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 border ${
                categoryFilter === 'VALID'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40 font-extrabold'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="정상 사용 가능한 유효한 인증서만 필터링합니다."
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>유효함 ({validCount})</span>
            </button>

            {/* Status: Expiring Soon (만료 임박) */}
            {expiringSoonCount > 0 && (
              <button
                type="button"
                onClick={() => setCategoryFilter('EXPIRING')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 border ${
                  categoryFilter === 'EXPIRING'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/40 font-extrabold'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title="30일 이내에 만료 예정인 갱신 대상 인증서입니다."
              >
                <Clock className="w-3.5 h-3.5" />
                <span>만료 임박 ({expiringSoonCount})</span>
              </button>
            )}

            {/* Status: Expired (만료됨) */}
            {expiredCount > 0 && (
              <button
                type="button"
                onClick={() => setCategoryFilter('EXPIRED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 border ${
                  categoryFilter === 'EXPIRED'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-400/40 font-extrabold'
                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                }`}
                title="유효기간이 만료되어 정리가 필요한 인증서입니다."
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>만료됨 ({expiredCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCategoryFilter('GOV')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'GOV'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40 font-extrabold'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              공무원 GPKI/EPKI ({govCount})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('BANK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'BANK'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40 font-extrabold'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              은행/개인 NPKI ({bankCount})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('CORP')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'CORP'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/40 font-extrabold'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              법인 NPKI ({corpCount})
            </button>

            {nonStandardCount > 0 && (
              <button
                type="button"
                onClick={() => setCategoryFilter('NON_STANDARD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'NON_STANDARD'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40 font-extrabold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                }`}
                title="일반 인증서 프로그램(은행/정부 ActiveX)이 인식하지 못하는 비표준 위치에 저장된 인증서입니다."
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>⚠️ 비표준 위치 ({nonStandardCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50 rounded-t-xl gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-700">
              검색된 인증서 목록 (총 {filteredCerts.length}개)
            </h2>
            {onRefresh && (
              <button
                type="button"
                id="btn-list-refresh"
                onClick={onRefresh}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
                title="인증서 보관함 및 드라이브 새로고침 (유효기간 재계산)"
              >
                <RefreshCw className={`w-3 h-3 text-blue-600 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? '새로고침 중...' : '새로고침'}</span>
              </button>
            )}
            {selectedIds.length > 0 && (
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {selectedIds.length}개 선택됨
              </span>
            )}
          </div>

          {/* Action buttons: Cleanup options & Selection toggles */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 1. 만료된 인증서 삭제 바로가기 버튼 */}
            {expiredCount > 0 && (
              <button
                type="button"
                onClick={() => onOpenCleanupModal('EXPIRED')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="만료된 인증서 확인 및 영구 삭제"
              >
                <CalendarX className="w-3.5 h-3.5 text-rose-600" />
                <span>만료 인증서 삭제 ({expiredCount}건)</span>
              </button>
            )}

            {/* 2. 다른 사용자 인증서 정리 버튼 */}
            {distinctUsers.length > 1 && (
              <button
                type="button"
                onClick={() => onOpenCleanupModal('OTHER_USERS')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="공용 PC 내 타인 인증서 일괄 정리"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>다른 사용자 인증서 정리</span>
              </button>
            )}

            {/* 3. 일괄 갱신 안내 버튼 */}
            {onOpenRenewalGuidance && (
              <button
                type="button"
                id="btn-top-renewal-guidance"
                onClick={() => {
                  const selected = certificates.filter(c => selectedIds.includes(c.id));
                  onOpenRenewalGuidance(selected.length > 0 ? selected : undefined);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  selectedIds.length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
                title="선택된 인증서의 발급기관(행안부, 교육부, 은행 등) 갱신 홈페이지 바로가기 링크 모달 열기"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>일괄 갱신 안내{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
              </button>
            )}

            {/* 4. 선택 삭제 버튼 */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenCleanupModal('SELECTED')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="선택된 인증서 일괄 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 삭제 ({selectedIds.length})</span>
              </button>
            )}

            {/* 4. 휴지통 바로가기 버튼 */}
            {onOpenTrash && (
              <button
                type="button"
                onClick={onOpenTrash}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="삭제된 인증서 임시 보관 휴지통 열기 (복구 가능)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>휴지통</span>
                {trashCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-bold ml-0.5">
                    {trashCount}
                  </span>
                )}
              </button>
            )}

            {/* 5. USB에서 PC로 가져오기 버튼 */}
            {onOpenUsbToPc && (
              <button
                type="button"
                onClick={() => onOpenUsbToPc()}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="USB 메모리에 있는 인증서를 내 PC로 가져오기 (반대 경로)"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>USB ➔ PC 넣기</span>
              </button>
            )}

            {/* 5-1. 데스크탑 앱 바로가기 버튼 */}
            {onOpenDesktopApp && (
              <button
                type="button"
                onClick={onOpenDesktopApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="C# WPF 네이티브 데스크톱 앱 (.NET 8)"
              >
                <Monitor className="w-3.5 h-3.5 text-sky-600" />
                <span>데스크탑 앱</span>
              </button>
            )}

            {/* 6. 작업 로그 바로가기 버튼 */}
            {onOpenActivityLogs && (
              <button
                type="button"
                onClick={onOpenActivityLogs}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="앱 작업 및 감사 로그 확인"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>작업 로그</span>
                {logCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-bold ml-0.5">
                    {logCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={handleToggleSelectAllFiltered}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                {allFilteredSelected ? '선택 해제' : '목록 전체 선택'}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-slate-500 font-bold hover:underline cursor-pointer"
              >
                전체 해제
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px]">
          {filteredCerts.length === 0 ? (
            <div className="py-14 text-center">
              <FileKey className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">조건에 일치하는 인증서가 없습니다.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                검색어를 초기화하거나 상단의 [직접 폴더 선택]을 통해 인증서 디렉토리를 불러와 주세요.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/90 border-b border-slate-200 text-[12px] text-slate-700 uppercase font-bold tracking-wider z-10">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAllFiltered}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-28">보관 위치</th>
                  <th className="p-4">인증서 종류</th>
                  <th className="p-4">사용자명</th>
                  <th className="p-4">발급기관 / 서명기관(CA)</th>
                  <th className="p-4">만료일</th>
                  <th className="p-4">상태</th>
                  <th className="p-4 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 text-slate-600">
                {filteredCerts.map(cert => {
                  const isSelected = selectedIds.includes(cert.id);
                  const isRecentlyCopied = recentlyCopiedIds.includes(cert.id);
                  const isUsb = isUsbCertificate(cert);
                  const driveLetter = getDriveLetter(cert);
                  const isNonStandard = cert.isCustomPath || isNonStandardCertPath(cert.sourceLocation);

                  return (
                    <tr
                      key={cert.id}
                      className={`transition-all duration-300 ${
                        isRecentlyCopied
                          ? 'animate-copied-row bg-emerald-100/70 border-l-4 border-l-emerald-500 shadow-xs'
                          : isNonStandard
                            ? isSelected
                              ? 'bg-amber-100/90 border-l-4 border-l-amber-500'
                              : 'bg-amber-50/60 hover:bg-amber-100/70 border-l-4 border-l-amber-500'
                            : isSelected
                              ? 'bg-blue-50/40 hover:bg-slate-50/70'
                              : cert.status === 'expired'
                                ? 'bg-rose-50/20 hover:bg-rose-50/40'
                                : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(cert.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Storage Location Badge Column [USB / 컴퓨터] */}
                      <td className="p-4 whitespace-nowrap">
                        {isUsb ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                            isRecentlyCopied
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <HardDrive className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>USB</span>
                            <span className="text-[10px] text-emerald-600 font-mono font-normal">({driveLetter})</span>
                          </div>
                        ) : (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                            isRecentlyCopied
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-500/30'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            <Laptop className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span>컴퓨터</span>
                            <span className="text-[10px] text-slate-500 font-mono font-normal">({driveLetter})</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{getCategoryLabel(cert)}</span>
                          {cert.isSystemCa && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                              시스템 CA
                            </span>
                          )}
                          {cert.isInstitutional && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200">
                              기관/관인
                            </span>
                          )}
                          {cert.isCustomAdded && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded border border-teal-200">
                              수동 추가
                            </span>
                          )}
                          {isRecentlyCopied && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold shadow-xs animate-pulse">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>복사 완료</span>
                            </span>
                          )}
                        </div>
                        <div 
                          className="text-[11px] text-slate-600 font-medium break-all mt-1 font-mono flex items-start gap-1 bg-slate-50/70 p-1 rounded border border-slate-200/50 group/path"
                          title={`인증서 전체 저장 경로: ${cert.sourceLocation}`}
                        >
                          <span className="select-all leading-relaxed">{cert.sourceLocation}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(cert.sourceLocation);
                              alert('인증서 전체 경로가 클립보드에 복사되었습니다.');
                            }}
                            className="opacity-0 group-hover/path:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-blue-600 rounded shrink-0 cursor-pointer"
                            title="전체 경로 클립보드 복사"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {isNonStandard && (
                          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-amber-100/80 text-amber-900 border border-amber-300 rounded text-[10px] font-bold shadow-2xs" title="일반 인증서 프로그램(은행/정부)이 인식하지 못하는 위치입니다. [USB ➔ PC] 또는 [정 위치 복사]가 필요합니다.">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>⚠️ 비표준 위치 (은행/정부 미인식)</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isNonStandard ? (
                            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-md border border-amber-300 shadow-2xs shrink-0" title="비표준 경로 보관 인증서">
                              <FileKey className="w-4 h-4 text-amber-600" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                              <FileKey className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{cert.name}</span>
                              {isNonStandard && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold shrink-0">
                                  ⚠️ 비표준
                                </span>
                              )}
                            </div>
                            {cert.departmentOrOrg && (
                              <div className="text-xs text-slate-500 truncate max-w-xs">
                                {cert.departmentOrOrg}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-700">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">{cert.issuer}</div>
                        {cert.caSignatureName && (
                          <div className="text-[11px] text-blue-700 font-mono mt-1 flex items-center gap-1 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/70 w-fit max-w-[240px]" title={`기관 서명 이름 (CA Name): ${cert.caSignatureName}`}>
                            <span className="truncate">{cert.caSignatureName}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-700">{cert.validTo}</td>

                      <td className="p-4">{getStatusBadge(cert)}</td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetailModal(cert)}
                            className="p-1.5 px-2.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors cursor-pointer"
                            title="상세 정보 보기"
                          >
                            상세
                          </button>
                          {onOpenRenewalGuidance && (
                            <button
                              type="button"
                              onClick={() => onOpenRenewalGuidance([cert])}
                              className={`p-1.5 px-2 text-xs rounded font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                                cert.status === 'expiring' || cert.status === 'expired'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              }`}
                              title={`${cert.issuer} 갱신 안내 및 홈페이지 바로가기`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>갱신</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onQuickBackupSingle(cert)}
                            className="p-1.5 px-2.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-medium border border-blue-200 transition-colors cursor-pointer"
                            title="이 인증서만 단독 복사"
                          >
                            복사
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDeleteSingle(cert)}
                            className="p-1.5 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="이 인증서 영구 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Action Bar (from Design HTML) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 shadow-2xs">
            <span className="text-xs font-bold text-blue-700 mr-2">선택된 항목:</span>
            <span className="text-sm font-bold text-blue-800">{selectedIds.length}건</span>
          </div>
          <p className="text-xs text-slate-500">
            * 이동식 매체(USB)로 복사 시 기존 인증서는 안전하게 유지됩니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center space-x-3 shrink-0">
          {onOpenRenewalGuidance && (
            <button
              type="button"
              id="btn-bottom-renewal-guidance"
              onClick={() => {
                const selected = certificates.filter(c => selectedIds.includes(c.id));
                onOpenRenewalGuidance(selected.length > 0 ? selected : undefined);
              }}
              className="px-4 py-3 border border-indigo-300 bg-indigo-50 text-indigo-800 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              title="선택된 인증서의 발급기관(행안부, 교육부, 은행 등) 갱신 홈페이지 바로가기 링크 모달"
            >
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              <span>일괄 갱신 안내 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenCleanupModal('SELECTED')}
              className="px-4 py-3 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>선택 삭제 ({selectedIds.length})</span>
            </button>
          )}

          {onOpenUsbToPc && (
            <button
              type="button"
              onClick={() => onOpenUsbToPc()}
              className="px-5 py-3 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>USB ➔ PC 넣기 (반대경로)</span>
            </button>
          )}

          {onOpenDesktopApp && (
            <button
              type="button"
              onClick={onOpenDesktopApp}
              className="px-4 py-3 border border-sky-300 bg-sky-50 text-sky-800 rounded-lg text-sm font-bold hover:bg-sky-100 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Windows C# WPF 네이티브 데스크톱 앱 (.NET 8)"
            >
              <Monitor className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">데스크탑 앱</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSelectAll();
              onOpenBackupModal();
            }}
            className="px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            전체 일괄 백업
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedIds.length === 0) {
                onSelectAll();
              }
              onOpenBackupModal();
            }}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all cursor-pointer"
          >
            인증서 복사 시작
          </button>
        </div>
      </div>
    </div>
  );
};


