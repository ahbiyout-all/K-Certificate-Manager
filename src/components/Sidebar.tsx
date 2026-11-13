import React from 'react';
import { Globe, HardDrive, Laptop, AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import { DiskDrive } from '../types';
import { filterPhysicalDrivesOnly } from '../utils/driveFilter';

export type SidebarCategoryFilter = 'ALL' | 'GPKI' | 'EPKI' | 'NPKI' | 'EXPIRED' | 'NON_STANDARD';
export type SidebarSourceFilter = 'ALL' | 'LOCAL' | 'REMOVABLE';

interface SidebarProps {
  categoryFilter: SidebarCategoryFilter;
  sourceFilter: SidebarSourceFilter;
  onSelectCategoryFilter: (cat: SidebarCategoryFilter) => void;
  onSelectSourceFilter: (src: SidebarSourceFilter) => void;
  counts: {
    total: number;
    gpki: number;
    epki: number;
    npki: number;
    expired: number;
    nonStandard: number;
    pc: number;
    usb: number;
  };
  availableDrives: DiskDrive[];
  selectedDriveId: string;
  onSelectDriveId: (id: string) => void;
  onOpenTargetDrivePicker?: () => void;
  onOpenRenewalGuidance?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categoryFilter,
  sourceFilter,
  onSelectCategoryFilter,
  onSelectSourceFilter,
  counts,
  availableDrives,
  selectedDriveId,
  onSelectDriveId,
  onOpenTargetDrivePicker,
  onOpenRenewalGuidance,
  onCloseMobile,
}) => {
  const physicalDrives = filterPhysicalDrivesOnly(availableDrives);
  const selectedDrive =
    physicalDrives.find(d => d.id === selectedDriveId) ||
    physicalDrives.find(d => d.type === 'removable') ||
    physicalDrives[0];

  const handleCatClick = (cat: SidebarCategoryFilter) => {
    onSelectCategoryFilter(cat);
    if (cat === 'ALL') {
      onSelectSourceFilter('ALL');
    }
    onCloseMobile?.();
  };

  const handleSourceClick = (src: SidebarSourceFilter) => {
    onSelectSourceFilter(sourceFilter === src ? 'ALL' : src);
    onCloseMobile?.();
  };

  return (
    <aside
      id="app-sidebar"
      className="wpf-native w-[260px] flex flex-col justify-between h-full p-3.5 shrink-0 select-none overflow-y-auto"
      style={{
        backgroundColor: 'var(--wpf-bg-card)',
        borderRight: '1px solid var(--wpf-border)',
        color: 'var(--wpf-text-primary)',
      }}
    >
      {/* Top Filter Navigation Stack (Matches WPF MainWindow.xaml lines 278-367) */}
      <div className="space-y-1">
        <div
          className="text-[11px] font-bold px-2 pb-1.5"
          style={{ color: 'var(--wpf-text-muted)' }}
        >
          인증서 카테고리
        </div>

        {/* 전체 인증서 */}
        <button
          type="button"
          onClick={() => handleCatClick('ALL')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            categoryFilter === 'ALL' && sourceFilter === 'ALL' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span className="truncate">전체 인증서</span>
          <span
            className="font-bold tabular-nums shrink-0 ml-2"
            style={{
              color:
                categoryFilter === 'ALL' && sourceFilter === 'ALL'
                  ? '#FFFFFF'
                  : 'var(--wpf-accent-text)',
            }}
          >
            {counts.total}
          </span>
        </button>

        {/* GPKI */}
        <button
          type="button"
          onClick={() => handleCatClick('GPKI')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            categoryFilter === 'GPKI' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span className="truncate">공무원 인증서 (GPKI)</span>
          <span
            className="tabular-nums shrink-0 ml-2"
            style={{
              color: categoryFilter === 'GPKI' ? '#FFFFFF' : 'var(--wpf-accent-text)',
            }}
          >
            {counts.gpki}
          </span>
        </button>

        {/* EPKI */}
        <button
          type="button"
          onClick={() => handleCatClick('EPKI')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            categoryFilter === 'EPKI' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span className="truncate">교육기관 인증서 (EPKI)</span>
          <span
            className="tabular-nums shrink-0 ml-2"
            style={{
              color: categoryFilter === 'EPKI' ? '#FFFFFF' : 'var(--wpf-accent-text)',
            }}
          >
            {counts.epki}
          </span>
        </button>

        {/* NPKI */}
        <button
          type="button"
          onClick={() => handleCatClick('NPKI')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            categoryFilter === 'NPKI' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span className="truncate">은행·공동 인증서 (NPKI)</span>
          <span
            className="tabular-nums shrink-0 ml-2"
            style={{
              color: categoryFilter === 'NPKI' ? '#FFFFFF' : 'var(--wpf-accent-text)',
            }}
          >
            {counts.npki}
          </span>
        </button>

        {/* 만료된 인증서 */}
        <button
          type="button"
          onClick={() => handleCatClick('EXPIRED')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            categoryFilter === 'EXPIRED' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span
            className="truncate"
            style={{ color: categoryFilter === 'EXPIRED' ? '#FFFFFF' : '#E11D48' }}
          >
            만료된 인증서
          </span>
          <span
            className="font-bold tabular-nums shrink-0 ml-2"
            style={{ color: categoryFilter === 'EXPIRED' ? '#FFFFFF' : '#E11D48' }}
          >
            {counts.expired}
          </span>
        </button>

        {/* 비표준 위치 인증서 */}
        <button
          type="button"
          onClick={() => handleCatClick('NON_STANDARD')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            categoryFilter === 'NON_STANDARD' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span
            className="flex items-center gap-1.5 truncate"
            style={{ color: categoryFilter === 'NON_STANDARD' ? '#FFFFFF' : '#D97706' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">다른 폴더 인증서</span>
          </span>
          <span
            className="font-bold tabular-nums shrink-0 ml-2"
            style={{ color: categoryFilter === 'NON_STANDARD' ? '#FFFFFF' : '#D97706' }}
          >
            {counts.nonStandard}
          </span>
        </button>

        {/* Divider */}
        <div className="my-2.5" style={{ borderTop: '1px solid var(--wpf-border)' }} />

        <div
          className="text-[11px] font-bold px-2 pb-1.5"
          style={{ color: 'var(--wpf-text-muted)' }}
        >
          저장 위치
        </div>

        {/* 컴퓨터 (로컬 보관함) */}
        <button
          type="button"
          onClick={() => handleSourceClick('LOCAL')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            sourceFilter === 'LOCAL' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Laptop className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">내 컴퓨터</span>
          </span>
          <span
            className="font-semibold tabular-nums shrink-0 ml-2"
            style={{
              color: sourceFilter === 'LOCAL' ? '#FFFFFF' : 'var(--wpf-accent-text)',
            }}
          >
            {counts.pc}
          </span>
        </button>

        {/* USB (이동식 저장소) */}
        <button
          type="button"
          onClick={() => handleSourceClick('REMOVABLE')}
          className={`wpf-native w-full flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer text-left wpf-nav-radio ${
            sourceFilter === 'REMOVABLE' ? 'wpf-nav-radio-active' : ''
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">USB 메모리</span>
          </span>
          <span
            className="font-bold tabular-nums shrink-0 ml-2"
            style={{
              color: sourceFilter === 'REMOVABLE' ? '#FFFFFF' : '#10B981',
            }}
          >
            {counts.usb}
          </span>
        </button>

        {/* Divider */}
        <div className="my-3" style={{ borderTop: '1px solid var(--wpf-border)' }} />

        <div
          className="text-[11px] font-bold px-2 pb-1.5"
          style={{ color: 'var(--wpf-text-muted)' }}
        >
          인증서 서비스 센터
        </div>

        {onOpenRenewalGuidance && (
          <button
            type="button"
            onClick={() => {
              onOpenRenewalGuidance();
              onCloseMobile?.();
            }}
            className="wpf-btn-primary wpf-native w-full h-[38px] px-3 flex items-center justify-center gap-2 text-[13px] font-bold cursor-pointer"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>인증서 갱신 안내</span>
          </button>
        )}
      </div>

      {/* Bottom Pinned Stack (Matches WPF MainWindow.xaml lines 231-276) */}
      <div className="mt-4 space-y-3 shrink-0">
        {/* Target USB / Disk Drive Selector Card */}
        <div
          className="wpf-native animated-drive-card rounded-[8px] p-3"
          style={{ ['--card-inner-bg' as string]: 'var(--wpf-bg-dark)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[11px] font-bold"
              style={{ color: 'var(--wpf-accent-text)' }}
            >
              복사 / 백업 대상 드라이브
            </span>
            {onOpenTargetDrivePicker && (
              <button
                type="button"
                onClick={onOpenTargetDrivePicker}
                className="wpf-native text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer hover:underline"
                style={{ color: 'var(--wpf-accent-text)' }}
                title="드라이브 선택 창 열기"
              >
                <span>상세 선택</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={selectedDrive?.id || ''}
            onChange={(e) => onSelectDriveId(e.target.value)}
            className="wpf-native w-full h-9 px-2 rounded-[6px] text-xs font-semibold cursor-pointer focus:outline-none mb-1.5"
            style={{
              backgroundColor: 'var(--wpf-bg-card)',
              border: '1px solid var(--wpf-border)',
              color: 'var(--wpf-text-primary)',
            }}
          >
            {physicalDrives.length === 0 ? (
              <option value="">(사용 가능한 드라이브 없음)</option>
            ) : (
              physicalDrives.map((d) => {
                const isUsb = d.type === 'removable' || d.busType === 'USB';
                return (
                  <option key={d.id} value={d.id}>
                    [{d.letter}] {isUsb ? '[이동식 USB]' : '[로컬 디스크]'} {d.name.split('(')[0].trim()}
                  </option>
                );
              })
            )}
          </select>

          <div
            className="text-[10px] tabular-nums truncate"
            style={{ color: 'var(--wpf-text-secondary)' }}
          >
            {selectedDrive
              ? `여유 ${selectedDrive.freeSpace} / 전체 ${selectedDrive.totalSpace}`
              : '(사용 가능한 드라이브 없음)'}
          </div>
        </div>

        {/* Local Sandbox Isolation Card */}
        <div
          className="wpf-native rounded-[8px] p-2.5"
          style={{
            backgroundColor: 'var(--wpf-bg-dark)',
            border: '1px solid #10B981',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="text-[11px] font-bold text-[#10B981]">
              오프라인 로컬 보호
            </span>
          </div>
          <p
            className="text-[10px] leading-snug"
            style={{ color: 'var(--wpf-text-secondary)' }}
          >
            외부 전송 없이 내 기기에서만 처리
          </p>
        </div>

        {/* Copyright */}
        <div
          className="px-0.5 text-[10px]"
          style={{ color: 'var(--wpf-text-muted)' }}
        >
          저작권: AhBiYout
        </div>
      </div>
    </aside>
  );
};
