import React, { useState, useMemo } from 'react';
import {
  CertificateItem,
  CertCategory,
  DiskDrive
} from '../types';
import { isNonStandardCertPath, isRareLocalLowGpkiPath } from '../utils/certPathUtils';
import { isCertificateExpired } from '../utils/certParser';
import { isUsbCertificate as isUsbCertHelper } from '../utils/driveFilter';
import { getDriveColorInfo } from '../utils/driveColors';
import { getAccurateIssuerInfo } from '../utils/issuerUtils';
import {
  Search,
  Copy,
  HardDrive,
  Laptop,
  FileKey,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ArrowDownLeft,
  SlidersHorizontal,
  Zap,
  KeyRound,
  Save,
  Sparkles,
  Check,
  X,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown
} from 'lucide-react';
import { SidebarCategoryFilter, SidebarSourceFilter } from './Sidebar';

export function filterCertificatesByCriteria(
  certificates: CertificateItem[],
  categoryFilter: SidebarCategoryFilter,
  sourceFilter: SidebarSourceFilter,
  searchQuery = ''
): CertificateItem[] {
  return certificates.filter(cert => {
    if (categoryFilter === 'GPKI' && cert.category !== 'GPKI_GOV') return false;
    if (categoryFilter === 'EPKI' && cert.category !== 'EPKI_EDU') return false;
    if (categoryFilter === 'NPKI' && cert.category !== 'NPKI_BANK' && cert.category !== 'NPKI_CORP') return false;
    if (categoryFilter === 'EXPIRED' && !isCertificateExpired(cert)) return false;
    if (categoryFilter === 'NON_STANDARD' && !cert.isCustomPath && !isNonStandardCertPath(cert.sourceLocation)) return false;

    const isUsb = isUsbCertHelper(cert);
    if (sourceFilter === 'LOCAL' && isUsb) return false;
    if (sourceFilter === 'REMOVABLE' && !isUsb) return false;

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
      return (
        matchName ||
        matchIssuer ||
        matchCa ||
        matchDept ||
        matchPolicy ||
        matchSerial ||
        matchPath ||
        matchLocationType.includes(q)
      );
    }

    return true;
  });
}

interface CertificateListProps {
  certificates: CertificateItem[];
  selectedIds: string[];
  recentlyCopiedIds?: string[];
  inspectedCertId?: string | null;
  availableDrives?: DiskDrive[];
  categoryFilter: SidebarCategoryFilter;
  sourceFilter: SidebarSourceFilter;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onResetFilters?: () => void;
  onInspectCert?: (cert: CertificateItem) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onSelectFilteredIds?: (ids: string[]) => void;
  onClearSelection: () => void;
  onOpenBackupModal: () => void;
  onBackupAll?: () => void;
  onOpenDetailModal: (cert: CertificateItem) => void;
  onQuickBackupSingle: (cert: CertificateItem) => void;
  onOpenCleanupModal: (mode: 'EXPIRED' | 'OTHER_USERS' | 'SELECTED') => void;
  onRequestDeleteSingle: (cert: CertificateItem) => void;
  onUndoDelete?: () => void;
  canUndo?: boolean;
  onOpenUsbToPc?: (driveLetter?: string) => void;
  onNotifyCopy?: (msg: string) => void;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates,
  selectedIds,
  recentlyCopiedIds = [],
  inspectedCertId = null,
  categoryFilter,
  sourceFilter,
  searchQuery,
  onSearchQueryChange,
  onResetFilters,
  onInspectCert,
  onToggleSelect,
  onSelectAll,
  onSelectFilteredIds,
  onClearSelection,
  onOpenBackupModal,
  onBackupAll,
  onOpenDetailModal,
  onQuickBackupSingle,
  onOpenCleanupModal,
  onRequestDeleteSingle,
  onUndoDelete,
  canUndo = false,
  onOpenUsbToPc,
  onNotifyCopy,
}) => {
  const DEFAULT_COL_WIDTHS = useMemo(() => ({
    index: 46,
    select: 44,
    category: 112,
    storage: 132,
    nameAndPath: 340,
    issuer: 195,
    notAfter: 108,
    status: 102,
    privateKey: 74,
    actions: 174,
  }), []);

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('kcert_wpf_col_widths_v2');
      if (saved) {
        return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_COL_WIDTHS;
  });

  const [paddingDensity, setPaddingDensity] = useState<'compact' | 'normal' | 'spacious'>(() => {
    try {
      const saved = localStorage.getItem('kcert_col_padding_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'spacious') return saved;
    } catch {}
    return 'normal';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('kcert_cert_list_view_mode');
      if (saved === 'grid' || saved === 'table') return saved;
    } catch {}
    return 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kcert_cert_list_view_mode', mode);
    } catch {}
  };

  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'category' | 'storage' | 'name' | 'issuer' | 'notAfter' | 'status'>('notAfter');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);

  const handleStartResize = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 100;
    setResizingCol(colKey);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minW = colKey === 'index' || colKey === 'select' ? 32 : 45;
      const newWidth = Math.max(minW, startWidth + deltaX);
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      setResizingCol(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setColWidths(current => {
        try {
          localStorage.setItem('kcert_wpf_col_widths_v2', JSON.stringify(current));
        } catch {}
        return current;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResetColWidths = () => {
    setColWidths(DEFAULT_COL_WIDTHS);
    setPaddingDensity('normal');
    try {
      localStorage.removeItem('kcert_wpf_col_widths_v2');
      localStorage.setItem('kcert_col_padding_density', 'normal');
    } catch {}
  };

  const handleSetPaddingDensity = (density: 'compact' | 'normal' | 'spacious') => {
    setPaddingDensity(density);
    try {
      localStorage.setItem('kcert_col_padding_density', density);
    } catch {}
  };

  const totalTableWidth = useMemo(() => {
    return (Object.values(colWidths) as unknown[]).reduce<number>(
      (acc, w) => acc + (typeof w === 'number' ? w : 100),
      0
    );
  }, [colWidths]);

  const getDriveLetter = (cert: CertificateItem): string => {
    if (cert.sourceLocation && cert.sourceLocation.length >= 2 && cert.sourceLocation[1] === ':') {
      return cert.sourceLocation.substring(0, 2);
    }
    if (cert.sourceDrive && cert.sourceDrive.length >= 2 && cert.sourceDrive[1] === ':') {
      return cert.sourceDrive.substring(0, 2);
    }
    return 'C:';
  };

  const getCategoryShortBadge = (cat: CertCategory) => {
    switch (cat) {
      case 'GPKI_GOV': return 'GPKI 행정';
      case 'EPKI_EDU': return 'EPKI 교육';
      case 'NPKI_CORP': return 'NPKI 법인';
      case 'NPKI_BANK': return 'NPKI 금융';
      default: return '미분류';
    }
  };

  const filteredCerts = useMemo(
    () => filterCertificatesByCriteria(certificates, categoryFilter, sourceFilter, searchQuery),
    [certificates, categoryFilter, sourceFilter, searchQuery]
  );

  const sortedFilteredCerts = useMemo(() => {
    const list = [...filteredCerts];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortBy === 'category') {
        valA = getCategoryShortBadge(a.category);
        valB = getCategoryShortBadge(b.category);
      } else if (sortBy === 'storage') {
        valA = isUsbCertHelper(a) ? 'USB' : 'PC';
        valB = isUsbCertHelper(b) ? 'USB' : 'PC';
      } else if (sortBy === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortBy === 'issuer') {
        valA = a.issuer;
        valB = b.issuer;
      } else if (sortBy === 'notAfter') {
        valA = new Date(a.validTo).getTime() || 0;
        valB = new Date(b.validTo).getTime() || 0;
      } else if (sortBy === 'status') {
        valA = a.status;
        valB = b.status;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredCerts, sortBy, sortOrder]);

  const allFilteredSelected =
    sortedFilteredCerts.length > 0 && sortedFilteredCerts.every(c => selectedIds.includes(c.id));

  const handleToggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else if (onSelectFilteredIds) {
      onSelectFilteredIds(sortedFilteredCerts.map(c => c.id));
    } else {
      onSelectAll();
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderColResizer = (colKey: string) => (
    <div
      onMouseDown={(e) => handleStartResize(colKey, e)}
      className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-30 select-none flex items-center justify-center transition-colors ${
        resizingCol === colKey ? 'bg-[#3B82F6]/30' : 'hover:bg-[#3B82F6]/20'
      }`}
      title="좌우 드래그: 컬럼 너비 조절"
    >
      <div
        className="w-[1px] h-full"
        style={{ backgroundColor: resizingCol === colKey ? '#3B82F6' : 'var(--wpf-border)' }}
      />
    </div>
  );

  const thPadding =
    paddingDensity === 'compact'
      ? 'px-2 py-1.5 text-[11px]'
      : paddingDensity === 'spacious'
      ? 'px-3.5 py-2.5 text-xs'
      : 'px-2.5 py-2 text-xs';

  const cellPadding =
    paddingDensity === 'compact'
      ? 'px-2 py-1.5'
      : paddingDensity === 'spacious'
      ? 'px-3.5 py-3'
      : 'px-2.5 py-2';

  const getStatusBadge = (cert: CertificateItem) => {
    if (isCertificateExpired(cert)) {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold border whitespace-nowrap"
          style={{
            backgroundColor: 'var(--wpf-badge-expired-bg)',
            borderColor: 'var(--wpf-badge-expired-border)',
            color: 'var(--wpf-badge-expired-text)',
          }}
        >
          만료됨
        </span>
      );
    }
    if (cert.status === 'expiring') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold border whitespace-nowrap tabular-nums"
          style={{
            backgroundColor: 'var(--wpf-badge-expiring-bg)',
            borderColor: 'var(--wpf-badge-expiring-border)',
            color: 'var(--wpf-badge-expiring-text)',
          }}
        >
          만료임박 D-{cert.daysRemaining}
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold border whitespace-nowrap"
        style={{
          backgroundColor: 'var(--wpf-badge-valid-bg)',
          borderColor: 'var(--wpf-badge-valid-border)',
          color: 'var(--wpf-badge-valid-text)',
        }}
      >
        유효
      </span>
    );
  };

  const hasActiveFilter = categoryFilter !== 'ALL' || sourceFilter !== 'ALL' || searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3.5">
      {/* Main WPF DataGrid Card Container */}
      <div
        className="wpf-card wpf-native flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--wpf-bg-card)',
          border: '1px solid var(--wpf-border)',
          borderRadius: '8px',
        }}
      >
        {/* Compact Grid Toolbar (Search + Active Filter + Column Density Controls) */}
        <div
          className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0"
          style={{
            backgroundColor: 'var(--wpf-bg-dark)',
            borderBottom: '1px solid var(--wpf-border)',
          }}
        >
          {/* Left: Search Box & Filter Reset */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
            <div className="relative flex-1">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--wpf-text-muted)' }}
              />
              <input
                type="text"
                placeholder="인증서 명칭(CN), 발급기관, 경로, 일련번호 검색..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="wpf-native w-full h-8 pl-8 pr-7 rounded-[6px] text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                style={{
                  backgroundColor: 'var(--wpf-bg-card)',
                  border: '1px solid var(--wpf-border)',
                  color: 'var(--wpf-text-primary)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--wpf-text-muted)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilter && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="wpf-btn-secondary wpf-native px-2 py-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* Right: Selection Summary, Sort, View Toggle & Column Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {viewMode === 'grid' && sortedFilteredCerts.length > 0 && (
              <label
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-[4px] cursor-pointer select-none whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--wpf-bg-card)',
                  border: '1px solid var(--wpf-border)',
                  color: 'var(--wpf-text-secondary)',
                }}
              >
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleToggleSelectAllFiltered}
                  className="wpf-native w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                />
                <span>전체 선택</span>
              </label>
            )}

            <span
              className="text-xs font-semibold tabular-nums px-2 py-1 rounded-[4px] whitespace-nowrap"
              style={{
                backgroundColor: 'var(--wpf-bg-card)',
                border: '1px solid var(--wpf-border)',
                color: 'var(--wpf-accent-text)',
              }}
            >
              선택: {selectedIds.length} / {sortedFilteredCerts.length}건
            </span>

            {viewMode === 'grid' && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px]"
                style={{
                  backgroundColor: 'var(--wpf-bg-card)',
                  border: '1px solid var(--wpf-border)',
                }}
              >
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="정렬 기준"
                  className="wpf-native text-[11px] font-semibold bg-transparent focus:outline-none cursor-pointer pr-1"
                  style={{ color: 'var(--wpf-text-primary)' }}
                >
                  <option value="notAfter">만료일자순</option>
                  <option value="name">이름순</option>
                  <option value="category">구분순</option>
                  <option value="storage">저장위치순</option>
                  <option value="issuer">발급기관순</option>
                  <option value="status">상태순</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-1 rounded-[4px] cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--wpf-accent-text)' }}
                  title={sortOrder === 'asc' ? '오름차순 (클릭하여 내림차순 전환)' : '내림차순 (클릭하여 오름차순 전환)'}
                >
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>
            )}

            {viewMode === 'table' && (
              <div
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-[6px]"
                style={{
                  backgroundColor: 'var(--wpf-bg-card)',
                  border: '1px solid var(--wpf-border)',
                }}
              >
                <SlidersHorizontal className="w-3 h-3 mr-0.5" style={{ color: 'var(--wpf-accent-text)' }} />
                {(['compact', 'normal', 'spacious'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSetPaddingDensity(mode)}
                    className={`px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      paddingDensity === mode ? 'bg-[#2563EB] text-white' : ''
                    }`}
                    style={paddingDensity !== mode ? { color: 'var(--wpf-text-secondary)' } : undefined}
                  >
                    {mode === 'compact' ? '좁게' : mode === 'normal' ? '보통' : '넓게'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleResetColWidths}
                  className="px-1.5 py-0.5 text-[10.5px] font-semibold cursor-pointer hover:underline ml-0.5"
                  style={{ color: 'var(--wpf-text-muted)' }}
                  title="컬럼 너비 초기화"
                >
                  ↺
                </button>
              </div>
            )}

            {/* Responsive Card Grid vs Table Switcher */}
            <div
              className="flex items-center gap-1 p-0.5 rounded-[6px]"
              style={{
                backgroundColor: 'var(--wpf-bg-card)',
                border: '1px solid var(--wpf-border)',
              }}
            >
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'grid' ? 'bg-[#2563EB] text-white' : ''
                }`}
                style={viewMode !== 'grid' ? { color: 'var(--wpf-text-secondary)' } : undefined}
                title="반응형 카드 그리드 보기 (CSS Grid auto-fill)"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>카드</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('table')}
                className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'table' ? 'bg-[#2563EB] text-white' : ''
                }`}
                style={viewMode !== 'table' ? { color: 'var(--wpf-text-secondary)' } : undefined}
                title="상세 표(DataGrid) 보기"
              >
                <TableIcon className="w-3 h-3" />
                <span>표</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Certificate Content (Responsive Auto-Fill Card Grid or WPF DataGrid) */}
        <div className="flex-1 overflow-auto min-h-[280px] max-h-[600px] lg:max-h-none">
          {sortedFilteredCerts.length === 0 ? (
            <div className="py-16 text-center px-4">
              <FileKey className="w-11 h-11 mx-auto mb-3 opacity-50" style={{ color: 'var(--wpf-text-muted)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--wpf-text-primary)' }}>
                조건에 일치하는 인증서가 없습니다.
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--wpf-text-secondary)' }}>
                좌측 카테고리 필터를 변경하거나 검색어를 초기화해 주세요.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div
              className="cert-grid-autofill p-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              }}
            >
              {sortedFilteredCerts.map((cert, index) => {
                const isSelected = selectedIds.includes(cert.id);
                const isInspected = inspectedCertId === cert.id;
                const isRecentlyCopied = recentlyCopiedIds.includes(cert.id);
                const isUsb = isUsbCertHelper(cert);
                const driveLetter = getDriveLetter(cert);
                const dColor = getDriveColorInfo(driveLetter);
                const isRareGpki = isRareLocalLowGpkiPath(cert.sourceLocation);
                const isNonStandard = isRareGpki || cert.isCustomPath || isNonStandardCertPath(cert.sourceLocation);
                const issuerInfo = getAccurateIssuerInfo(cert.issuer, cert.caSignatureName, cert.subjectDn);

                const cardBg = isRecentlyCopied
                  ? 'var(--wpf-copied-row)'
                  : isInspected
                  ? 'var(--wpf-selected-row)'
                  : 'var(--wpf-bg-dark)';

                const cardText = isInspected
                  ? 'var(--wpf-selected-row-text)'
                  : isRecentlyCopied
                  ? 'var(--wpf-copied-row-text)'
                  : 'var(--wpf-text-primary)';

                const cardSecondary = isInspected
                  ? 'var(--wpf-selected-row-secondary)'
                  : isRecentlyCopied
                  ? 'var(--wpf-copied-row-secondary)'
                  : 'var(--wpf-text-secondary)';

                const cardBorder = isInspected
                  ? '#3B82F6'
                  : isSelected
                  ? 'var(--wpf-accent-blue)'
                  : 'var(--wpf-border)';

                return (
                  <article
                    key={cert.id}
                    onClick={() => onInspectCert?.(cert)}
                    onDoubleClick={() => onOpenDetailModal(cert)}
                    className={`wpf-native rounded-[8px] p-4 flex flex-col justify-between gap-3 cursor-pointer transition-colors ${
                      isRecentlyCopied ? 'animate-copied-row' : ''
                    }`}
                    style={{
                      backgroundColor: cardBg,
                      color: cardText,
                      border: `1px solid ${cardBorder}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isInspected && !isRecentlyCopied) {
                        e.currentTarget.style.backgroundColor = 'var(--wpf-bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isInspected && !isRecentlyCopied) {
                        e.currentTarget.style.backgroundColor = cardBg;
                      }
                    }}
                  >
                    {/* Card Top Strip: Checkbox + Index + Drive Tag + Status */}
                    <div className="flex flex-col gap-2.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="flex items-center gap-2 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect(cert.id)}
                            aria-label={`${cert.name} 선택`}
                            className="wpf-native w-4 h-4 accent-[#2563EB] cursor-pointer shrink-0"
                          />
                          <span
                            className="font-mono text-[11px] font-bold tabular-nums shrink-0"
                            style={{ color: cardSecondary }}
                          >
                            #{String(index + 1).padStart(2, '0')}
                          </span>
                          <div
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold border shrink-0 whitespace-nowrap"
                            style={{
                              backgroundColor: dColor.bgHex,
                              borderColor: dColor.borderHex,
                              color: '#FFFFFF',
                            }}
                            title={`보관 위치: ${isUsb ? '이동식 USB' : '컴퓨터 로컬 디스크'} (${driveLetter})`}
                          >
                            {isUsb ? (
                              <HardDrive className="w-3 h-3 shrink-0" />
                            ) : (
                              <Laptop className="w-3 h-3 shrink-0" />
                            )}
                            <span>{isUsb ? 'USB' : 'PC'}</span>
                            <span className="font-mono text-[10px] font-extrabold">
                              {dColor.letter}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isRecentlyCopied && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] bg-[#10B981] text-white whitespace-nowrap">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>복사됨</span>
                            </span>
                          )}
                          {getStatusBadge(cert)}
                        </div>
                      </div>

                      {/* Primary Title & Unboxed Typographic Metadata */}
                      <div className="min-w-0">
                        <h3
                          className="font-bold text-[14px] leading-snug truncate"
                          title={cert.name}
                        >
                          {cert.name}
                        </h3>
                        <div
                          className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px]"
                          style={{ color: cardSecondary }}
                        >
                          <span className="font-semibold">{getCategoryShortBadge(cert.category)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[#10B981]">
                            <KeyRound className="w-3 h-3 shrink-0" />
                            <span>비밀키 보유</span>
                          </span>
                          {isNonStandard && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className="inline-flex items-center gap-0.5 font-semibold"
                                style={{ color: 'var(--wpf-badge-expiring-text)' }}
                                title={isRareGpki ? '실무 미사용 GPKI 예외 경로' : '일반 인증서 창 미인식 비표준 위치'}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{isRareGpki ? '비권장 경로' : '비표준 위치'}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Structured Info Rows (Hairline Divider, Zero Nested Cards) */}
                      <div
                        className="pt-2.5 space-y-1.5 text-xs"
                        style={{ borderTop: '1px solid var(--wpf-border)' }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] shrink-0" style={{ color: cardSecondary }}>
                            발급기관
                          </span>
                          <span
                            className="font-semibold truncate text-right"
                            title={`${issuerInfo.officialOrgName}${cert.caSignatureName ? ` (${cert.caSignatureName})` : ''}`}
                          >
                            {issuerInfo.officialOrgName}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] shrink-0" style={{ color: cardSecondary }}>
                            만료일자
                          </span>
                          <span className="font-mono font-semibold tabular-nums">
                            {cert.validTo}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 min-w-0 pt-0.5">
                          <span
                            className="text-[10.5px] font-mono truncate flex-1"
                            style={{ color: cardSecondary }}
                            title={cert.sourceLocation}
                          >
                            {cert.sourceLocation}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                navigator.clipboard.writeText(cert.sourceLocation);
                                setCopiedPathId(cert.id);
                                onNotifyCopy?.(`📋 경로가 클립보드에 복사되었습니다: ${cert.sourceLocation}`);
                                setTimeout(() => setCopiedPathId(null), 1500);
                              } catch {}
                            }}
                            className="p-1 rounded-[4px] shrink-0 cursor-pointer hover:opacity-80"
                            title="경로 복사"
                          >
                            {copiedPathId === cert.id ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" style={{ color: isInspected ? cardText : 'var(--wpf-accent-text)' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div
                      className="pt-2.5 flex items-center justify-between gap-2"
                      style={{ borderTop: '1px solid var(--wpf-border)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onQuickBackupSingle(cert)}
                        className="wpf-btn-primary wpf-native flex-1 px-3 py-1.5 text-[11.5px] inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        title="이 인증서만 복사 대상 디스크를 지정하여 복사합니다."
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenDetailModal(cert)}
                        className="wpf-btn-secondary wpf-native flex-1 px-3 py-1.5 text-[11.5px] inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        title="인증서 전문 규격 팝업 보기"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>상세</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRequestDeleteSingle(cert)}
                        className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-[#F43F5E] inline-flex items-center justify-center cursor-pointer shrink-0"
                        title="휴지통으로 안전 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <table
              className={`table-fixed text-left border-collapse wpf-native ${resizingCol ? 'select-none' : ''}`}
              style={{
                width: `${totalTableWidth}px`,
                minWidth: '100%',
                color: 'var(--wpf-text-primary)',
              }}
            >
              <thead
                className="sticky top-0 z-20"
                style={{
                  backgroundColor: 'var(--wpf-bg-dark)',
                  color: 'var(--wpf-text-secondary)',
                  borderBottom: '1px solid var(--wpf-border)',
                }}
              >
                <tr>
                  {/* 1. 번호 */}
                  <th
                    style={{
                      width: `${colWidths.index}px`,
                      borderRight: '1px solid var(--wpf-border)',
                      backgroundColor: 'var(--wpf-bg-dark)',
                    }}
                    className={`${thPadding} text-center font-semibold sticky left-0 z-30 relative`}
                  >
                    번호
                    {renderColResizer('index')}
                  </th>

                  {/* 2. 선택 체크박스 */}
                  <th
                    style={{
                      width: `${colWidths.select}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} text-center relative`}
                  >
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAllFiltered}
                      className="wpf-native w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                      title="목록 전체 선택 / 해제"
                    />
                    {renderColResizer('select')}
                  </th>

                  {/* 3. 구분 */}
                  <th
                    style={{
                      width: `${colWidths.category}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} font-semibold relative`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('category')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline max-w-full"
                    >
                      <span className="truncate">구분</span>
                      <span className="text-[10px] opacity-60">
                        {sortBy === 'category' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                    {renderColResizer('category')}
                  </th>

                  {/* 4. 저장 위치 */}
                  <th
                    style={{
                      width: `${colWidths.storage}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} font-semibold relative`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('storage')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline max-w-full"
                    >
                      <span className="truncate">저장 위치</span>
                      <span className="text-[10px] opacity-60">
                        {sortBy === 'storage' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                    {renderColResizer('storage')}
                  </th>

                  {/* 5. 인증서 명칭 (CN) 및 경로 상태 */}
                  <th
                    style={{
                      width: `${colWidths.nameAndPath}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} font-semibold relative`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline max-w-full"
                    >
                      <span className="truncate">인증서 명칭 (CN) 및 경로 상태</span>
                      <span className="text-[10px] opacity-60">
                        {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                    {renderColResizer('nameAndPath')}
                  </th>

                  {/* 6. 발급기관 */}
                  <th
                    style={{
                      width: `${colWidths.issuer}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} font-semibold relative`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('issuer')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline max-w-full"
                    >
                      <span className="truncate">발급기관</span>
                      <span className="text-[10px] opacity-60">
                        {sortBy === 'issuer' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                    {renderColResizer('issuer')}
                  </th>

                  {/* 7. 만료일자 */}
                  <th
                    style={{
                      width: `${colWidths.notAfter}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} font-semibold relative`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('notAfter')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline max-w-full"
                    >
                      <span className="truncate">만료일자</span>
                      <span className="text-[10px] opacity-60">
                        {sortBy === 'notAfter' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                    {renderColResizer('notAfter')}
                  </th>

                  {/* 8. 상태 */}
                  <th
                    style={{
                      width: `${colWidths.status}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} font-semibold relative`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline max-w-full"
                    >
                      <span className="truncate">상태</span>
                      <span className="text-[10px] opacity-60">
                        {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                    {renderColResizer('status')}
                  </th>

                  {/* 9. 비밀키 */}
                  <th
                    style={{
                      width: `${colWidths.privateKey}px`,
                      borderRight: '1px solid var(--wpf-border)',
                    }}
                    className={`${thPadding} text-center font-semibold relative`}
                  >
                    비밀키
                    {renderColResizer('privateKey')}
                  </th>

                  {/* 10. 작업 / 복사 */}
                  <th
                    style={{ width: `${colWidths.actions}px` }}
                    className={`${thPadding} text-center font-semibold`}
                  >
                    작업 / 복사
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedFilteredCerts.map((cert, index) => {
                  const isSelected = selectedIds.includes(cert.id);
                  const isInspected = inspectedCertId === cert.id;
                  const isRecentlyCopied = recentlyCopiedIds.includes(cert.id);
                  const isUsb = isUsbCertHelper(cert);
                  const driveLetter = getDriveLetter(cert);
                  const dColor = getDriveColorInfo(driveLetter);
                  const isRareGpki = isRareLocalLowGpkiPath(cert.sourceLocation);
                  const isNonStandard = isRareGpki || cert.isCustomPath || isNonStandardCertPath(cert.sourceLocation);
                  const issuerInfo = getAccurateIssuerInfo(cert.issuer, cert.caSignatureName, cert.subjectDn);

                  const rowBg = isRecentlyCopied
                    ? 'var(--wpf-copied-row)'
                    : isInspected
                    ? 'var(--wpf-selected-row)'
                    : index % 2 === 1
                    ? 'var(--wpf-bg-dark)'
                    : 'var(--wpf-bg-card)';

                  const rowTextColor = isInspected
                    ? 'var(--wpf-selected-row-text)'
                    : isRecentlyCopied
                    ? 'var(--wpf-copied-row-text)'
                    : 'var(--wpf-text-primary)';

                  return (
                    <tr
                      key={cert.id}
                      onClick={() => onInspectCert?.(cert)}
                      onDoubleClick={() => onOpenDetailModal(cert)}
                      className={`cursor-pointer transition-colors h-[48px] ${
                        isRecentlyCopied ? 'animate-copied-row' : ''
                      }`}
                      style={{
                        backgroundColor: rowBg,
                        color: rowTextColor,
                        borderBottom: '1px solid var(--wpf-border)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isInspected && !isRecentlyCopied) {
                          e.currentTarget.style.backgroundColor = 'var(--wpf-bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isInspected && !isRecentlyCopied) {
                          e.currentTarget.style.backgroundColor = rowBg;
                        }
                      }}
                    >
                      {/* 1. 번호 */}
                      <td
                        style={{
                          width: `${colWidths.index}px`,
                          backgroundColor: rowBg,
                          borderRight: '1px solid var(--wpf-border)',
                          color: isInspected ? rowTextColor : 'var(--wpf-text-secondary)',
                        }}
                        className={`${cellPadding} text-center font-mono font-bold text-[11px] tabular-nums sticky left-0 z-10`}
                      >
                        {index + 1}
                      </td>

                      {/* 2. 선택 체크박스 */}
                      <td
                        style={{
                          width: `${colWidths.select}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} text-center`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(cert.id)}
                          className="wpf-native w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                        />
                      </td>

                      {/* 3. 구분 Badge */}
                      <td
                        style={{
                          width: `${colWidths.category}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} overflow-hidden`}
                      >
                        <span
                          className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[4px] whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--wpf-badge-cat-bg)',
                            color: 'var(--wpf-badge-cat-text)',
                          }}
                        >
                          {getCategoryShortBadge(cert.category)}
                        </span>
                      </td>

                      {/* 4. 저장 위치 Badge */}
                      <td
                        style={{
                          width: `${colWidths.storage}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} whitespace-nowrap`}
                      >
                        <div
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-bold border"
                          style={{
                            backgroundColor: dColor.bgHex,
                            borderColor: dColor.borderHex,
                            color: '#FFFFFF',
                          }}
                          title={`보관 위치: ${isUsb ? '이동식 USB' : '컴퓨터 로컬 디스크'} (${driveLetter})`}
                        >
                          {isUsb ? (
                            <HardDrive className="w-3 h-3 shrink-0" />
                          ) : (
                            <Laptop className="w-3 h-3 shrink-0" />
                          )}
                          <span>{isUsb ? 'USB' : '컴퓨터'}</span>
                          <span
                            className="text-[10px] font-mono font-extrabold px-1 rounded-[3px] border"
                            style={{
                              backgroundColor: dColor.tagBgHex,
                              borderColor: dColor.tagBorderHex,
                              color: '#FFFFFF',
                            }}
                          >
                            {dColor.letter}
                          </span>
                        </div>
                      </td>

                      {/* 5. 인증서 명칭 (CN) 및 경로 상태 */}
                      <td
                        style={{
                          width: `${colWidths.nameAndPath}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} overflow-hidden`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-[13px] truncate" title={cert.name}>
                            {cert.name}
                          </span>
                          {isNonStandard && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border shrink-0 whitespace-nowrap"
                              style={{
                                backgroundColor: 'var(--wpf-badge-expiring-bg)',
                                borderColor: 'var(--wpf-badge-expiring-border)',
                                color: 'var(--wpf-badge-expiring-text)',
                              }}
                              title={isRareGpki ? '실무 미사용 GPKI 예외 경로' : '일반 인증서 창 미인식 비표준 위치'}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span>{isRareGpki ? '비권장 경로' : '비표준 위치'}</span>
                            </span>
                          )}
                          {isRecentlyCopied && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#10B981] text-white shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>복사됨</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1.5 mt-0.5 min-w-0 group/path">
                          <span
                            className="text-[10.5px] font-mono truncate"
                            style={{ color: isInspected ? 'var(--wpf-selected-row-secondary)' : isRecentlyCopied ? 'var(--wpf-copied-row-secondary)' : 'var(--wpf-text-secondary)' }}
                            title={cert.sourceLocation}
                          >
                            {cert.sourceLocation}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                navigator.clipboard.writeText(cert.sourceLocation);
                                setCopiedPathId(cert.id);
                                onNotifyCopy?.(`📋 경로가 클립보드에 복사되었습니다: ${cert.sourceLocation}`);
                                setTimeout(() => setCopiedPathId(null), 1500);
                              } catch {}
                            }}
                            className="opacity-0 group-hover/path:opacity-100 transition-opacity p-0.5 rounded shrink-0 cursor-pointer"
                            title="경로 복사"
                          >
                            {copiedPathId === cert.id ? (
                              <Check className="w-3 h-3 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3 h-3" style={{ color: 'var(--wpf-accent-text)' }} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 6. 발급기관 */}
                      <td
                        style={{
                          width: `${colWidths.issuer}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} overflow-hidden`}
                      >
                        <div className="text-xs font-semibold truncate" title={issuerInfo.officialOrgName}>
                          {issuerInfo.officialOrgName}
                        </div>
                        <div
                          className="text-[10px] truncate"
                          style={{ color: isInspected ? 'var(--wpf-selected-row-secondary)' : isRecentlyCopied ? 'var(--wpf-copied-row-secondary)' : 'var(--wpf-text-secondary)' }}
                          title={cert.caSignatureName || issuerInfo.centerName}
                        >
                          {cert.caSignatureName || issuerInfo.centerName}
                        </div>
                      </td>

                      {/* 7. 만료일자 */}
                      <td
                        style={{
                          width: `${colWidths.notAfter}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} font-mono text-xs tabular-nums whitespace-nowrap`}
                      >
                        {cert.validTo}
                      </td>

                      {/* 8. 상태 */}
                      <td
                        style={{
                          width: `${colWidths.status}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding}`}
                      >
                        {getStatusBadge(cert)}
                      </td>

                      {/* 9. 비밀키 */}
                      <td
                        style={{
                          width: `${colWidths.privateKey}px`,
                          borderRight: '1px solid var(--wpf-border)',
                        }}
                        className={`${cellPadding} text-center whitespace-nowrap`}
                      >
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">
                          <KeyRound className="w-3 h-3" />
                          <span>보유</span>
                        </span>
                      </td>

                      {/* 10. 작업 / 복사 */}
                      <td
                        style={{ width: `${colWidths.actions}px` }}
                        className={`${cellPadding} text-center`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickBackupSingle(cert)}
                            className="wpf-btn-primary wpf-native px-2 py-1 text-[11px] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="이 인증서만 복사 대상 디스크를 지정하여 복사합니다."
                          >
                            <Save className="w-3 h-3" />
                            <span>복사</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDetailModal(cert)}
                            className="wpf-btn-secondary wpf-native px-2 py-1 text-[11px] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="인증서 전문 규격 팝업 보기"
                          >
                            <Search className="w-3 h-3" />
                            <span>상세</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRequestDeleteSingle(cert)}
                            className="wpf-btn-secondary wpf-native p-1 text-[#F43F5E] cursor-pointer"
                            title="휴지통으로 안전 삭제"
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

      {/* Row 3: Bottom Bulk Action Controls (Matches WPF MainWindow.xaml lines 1241-1285) */}
      <div
        className="wpf-card wpf-native p-3.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0"
        style={{
          backgroundColor: 'var(--wpf-bg-card)',
          border: '1px solid var(--wpf-border)',
          borderRadius: '8px',
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {onOpenUsbToPc && (
            <button
              type="button"
              onClick={() => onOpenUsbToPc()}
              className="wpf-btn-secondary wpf-native px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[#10B981]">USB ➔ PC 넣기</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (hasActiveFilter && onSelectFilteredIds) {
                onSelectFilteredIds(sortedFilteredCerts.map(c => c.id));
              } else {
                onSelectAll();
              }
            }}
            className="wpf-btn-secondary wpf-native px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            전체 선택
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="wpf-btn-secondary wpf-native px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            선택 해제
          </button>

          <button
            type="button"
            onClick={() => onOpenCleanupModal('SELECTED')}
            className="wpf-btn-secondary wpf-native px-3 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{ color: '#E11D48' }}
          >
            선택 항목 일괄 삭제
          </button>

          {canUndo && onUndoDelete && (
            <button
              type="button"
              onClick={onUndoDelete}
              className="wpf-btn-secondary wpf-native px-3 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              style={{ color: '#10B981' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>삭제 취소</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenCleanupModal('EXPIRED')}
            className="wpf-btn-secondary wpf-native px-3 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{ color: '#D97706' }}
          >
            🧹 만료 정리
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="wpf-btn-primary wpf-native px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="복사 목적지 디스크(USB 메모리 또는 로컬 디스크)를 지정하는 팝업창을 띄우고 선택한 인증서를 복사합니다."
          >
            <Save className="w-3.5 h-3.5" />
            <span>선택 인증서 복사 / 백업</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onBackupAll) {
                onBackupAll();
              } else {
                onSelectAll();
                onOpenBackupModal();
              }
            }}
            className="wpf-btn-success wpf-native px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="복사 목적지 디스크(USB 메모리 또는 로컬 디스크)를 지정하는 팝업창을 띄우고 전체 인증서를 일괄 복사합니다."
          >
            <Zap className="w-3.5 h-3.5" />
            <span>전체 일괄 복사 / 백업</span>
          </button>
        </div>
      </div>
    </div>
  );
};
