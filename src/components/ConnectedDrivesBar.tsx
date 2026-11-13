import React, { useState, useMemo } from 'react';
import { HardDrive, Cpu, Check, Copy, ArrowDownLeft, Save } from 'lucide-react';
import { DiskDrive, CertificateItem } from '../types';
import { filterPhysicalDrivesOnly } from '../utils/driveFilter';
import { getDriveColorInfo } from '../utils/driveColors';

interface ConnectedDrivesBarProps {
  availableDrives: DiskDrive[];
  certificates?: CertificateItem[];
  selectedDriveId: string;
  onSelectDriveId: (id: string) => void;
  onBackupToDrive?: (driveId: string) => void;
  onOpenUsbToPc?: (driveLetter?: string) => void;
  onOpenUsbDiagnostic?: () => void;
}

export const ConnectedDrivesBar: React.FC<ConnectedDrivesBarProps> = ({
  availableDrives,
  certificates = [],
  selectedDriveId,
  onSelectDriveId,
  onBackupToDrive,
  onOpenUsbToPc,
  onOpenUsbDiagnostic,
}) => {
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>(() => {
    try {
      const saved = localStorage.getItem('kcert_drive_display_mode');
      if (saved === 'basic' || saved === 'advanced') return saved;
    } catch {}
    return 'basic';
  });
  const [filterType, setFilterType] = useState<'removable' | 'all'>('removable');
  const [copiedVsnId, setCopiedVsnId] = useState<string | null>(null);

  const physicalOnlyDrives = useMemo(() => filterPhysicalDrivesOnly(availableDrives), [availableDrives]);

  const filteredDrives = useMemo(() => {
    return physicalOnlyDrives.filter(d => {
      if (filterType === 'removable') {
        return d.type === 'removable' || d.busType === 'USB';
      }
      return true;
    });
  }, [physicalOnlyDrives, filterType]);

  const handleSetViewMode = (mode: 'basic' | 'advanced') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kcert_drive_display_mode', mode);
    } catch {}
  };

  const handleCopyVsn = (e: React.MouseEvent, driveId: string, vsn: string) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(vsn);
      setCopiedVsnId(driveId);
      setTimeout(() => setCopiedVsnId(null), 1500);
    } catch {}
  };

  return (
    <div
      className="wpf-card wpf-native p-3"
      style={{
        backgroundColor: 'var(--wpf-bg-card)',
        border: '1px solid var(--wpf-border)',
        borderRadius: '8px',
      }}
    >
      {/* Top Header Bar (Matches WPF MainWindow.xaml lines 495-534) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <HardDrive className="w-4 h-4" style={{ color: 'var(--wpf-accent-text)' }} />
          <span
            className="text-xs font-bold"
            style={{ color: 'var(--wpf-accent-text)' }}
          >
            연결된 드라이브 현황
          </span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full tabular-nums"
            style={{
              backgroundColor: 'var(--wpf-bg-dark)',
              border: '1px solid var(--wpf-border)',
              color: 'var(--wpf-text-secondary)',
            }}
          >
            총 {filteredDrives.length}개 감지됨
          </span>
        </div>

        {/* Center Scope Toggle */}
        <div
          className="inline-flex p-0.5 rounded-[6px]"
          style={{
            backgroundColor: 'var(--wpf-bg-dark)',
            border: '1px solid var(--wpf-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterType('removable')}
            className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'removable' ? 'bg-[#2563EB] text-white' : ''
            }`}
            style={filterType !== 'removable' ? { color: 'var(--wpf-text-secondary)' } : undefined}
          >
            USB 백업 드라이브
          </button>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'all' ? 'bg-[#2563EB] text-white' : ''
            }`}
            style={filterType !== 'all' ? { color: 'var(--wpf-text-secondary)' } : undefined}
          >
            PC 내부(NVMe/SATA) 포함 전체
          </button>
        </div>

        {/* Right Display Mode Toggle + WMI Diagnostic */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--wpf-text-secondary)' }}>
            표시 방식:
          </span>
          <div
            className="inline-flex p-0.5 rounded-[6px]"
            style={{
              backgroundColor: 'var(--wpf-bg-dark)',
              border: '1px solid var(--wpf-border)',
            }}
          >
            <button
              type="button"
              onClick={() => handleSetViewMode('basic')}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'basic' ? 'bg-[#2563EB] text-white' : ''
              }`}
              style={viewMode !== 'basic' ? { color: 'var(--wpf-text-secondary)' } : undefined}
            >
              기본 표시
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('advanced')}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'advanced' ? 'bg-[#2563EB] text-white' : ''
              }`}
              style={viewMode !== 'advanced' ? { color: 'var(--wpf-text-secondary)' } : undefined}
            >
              고급 표시
            </button>
          </div>

          {viewMode === 'advanced' && onOpenUsbDiagnostic && (
            <button
              type="button"
              onClick={onOpenUsbDiagnostic}
              className="wpf-btn-secondary wpf-native px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="USB 장치 식별자 및 WMI 진단"
            >
              <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--wpf-accent-text)' }} />
              <span>WMI 진단</span>
            </button>
          )}
        </div>
      </div>

      {/* Drive Cards Wrap/Grid (Matches WPF ItemsControl WrapPanel MinWidth=270) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {filteredDrives.map(drive => {
          const isSelected = selectedDriveId === drive.id;
          const isUsb = drive.type === 'removable' || drive.busType === 'USB';
          const dColor = getDriveColorInfo(drive.letter);
          const letterClean = drive.letter.replace(':', '').toUpperCase();
          const certCount = certificates.filter(c => {
            const loc = (c.sourceLocation || '').toUpperCase();
            const drv = (c.sourceDrive || '').toUpperCase();
            return loc.startsWith(letterClean + ':') || drv.startsWith(letterClean + ':');
          }).length;
          const hasCerts = certCount > 0;

          return (
            <div
              key={drive.id}
              onClick={() => onSelectDriveId(drive.id)}
              className={`wpf-native rounded-[6px] px-3 py-2 cursor-pointer transition-colors flex flex-col justify-between gap-2 ${
                isSelected ? 'ring-1 ring-[#3B82F6]' : ''
              }`}
              style={{
                backgroundColor: 'var(--wpf-bg-dark)',
                border: isSelected ? '1px solid #3B82F6' : '1px solid var(--wpf-border)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[11px] font-mono font-extrabold px-1.5 py-0.5 rounded-[4px] border shrink-0"
                      style={{
                        backgroundColor: dColor.bgHex,
                        borderColor: dColor.borderHex,
                        color: '#FFFFFF',
                      }}
                    >
                      [{dColor.letter}]
                    </span>
                    <span
                      className="text-[13px] font-extrabold truncate max-w-[130px]"
                      style={{ color: 'var(--wpf-text-primary)' }}
                      title={drive.name}
                    >
                      {drive.name.split('(')[0].trim()}
                    </span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[3px] shrink-0"
                      style={{
                        backgroundColor: 'var(--wpf-badge-cat-bg)',
                        color: 'var(--wpf-badge-cat-text)',
                      }}
                    >
                      {drive.physicalPortDetail || (isUsb ? '외장 USB' : '내부 디스크')}
                    </span>
                  </div>

                  <div
                    className="text-[10px] tabular-nums"
                    style={{ color: 'var(--wpf-text-secondary)' }}
                  >
                    여유 {drive.freeSpace} / {drive.totalSpace}
                  </div>

                  <div>
                    <span
                      className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px]"
                      style={{
                        backgroundColor: hasCerts
                          ? 'var(--wpf-badge-valid-bg)'
                          : 'var(--wpf-badge-expiring-bg)',
                        color: hasCerts
                          ? 'var(--wpf-badge-valid-text)'
                          : 'var(--wpf-badge-expiring-text)',
                      }}
                    >
                      {hasCerts ? `인증서 ${certCount}건 보관` : '빈 드라이브 (백업 추천)'}
                    </span>
                  </div>
                </div>

                {/* Right Quick Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBackupToDrive) {
                        onBackupToDrive(drive.id);
                      } else {
                        onSelectDriveId(drive.id);
                      }
                    }}
                    className="wpf-btn-secondary wpf-native px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title={`${drive.letter} 드라이브로 백업`}
                  >
                    <Save className="w-3 h-3" />
                    <span>백업</span>
                  </button>
                  {isUsb && hasCerts && onOpenUsbToPc && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUsbToPc(letterClean);
                      }}
                      className="wpf-btn-secondary wpf-native px-2.5 py-1 text-[11px] font-semibold text-[#10B981] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title={`${drive.letter} 인증서를 컴퓨터로 가져오기`}
                    >
                      <ArrowDownLeft className="w-3 h-3" />
                      <span>가져오기</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Metadata Row (Matches WPF IsDriveAdvancedMode) */}
              {viewMode === 'advanced' && (
                <div
                  className="pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono"
                  style={{
                    borderTop: '1px solid var(--wpf-border)',
                    color: 'var(--wpf-text-muted)',
                  }}
                >
                  <span className="truncate max-w-[160px]" title={drive.physicalModel || drive.diskMediaType}>
                    {drive.fileSystem || 'FAT32'} · {drive.busType || (isUsb ? 'USB' : 'NVMe/SATA')}
                  </span>
                  {drive.volumeSerialNumber && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyVsn(e, drive.id, drive.volumeSerialNumber!)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] cursor-pointer hover:opacity-85"
                      style={{
                        backgroundColor: 'var(--wpf-bg-card)',
                        border: '1px solid var(--wpf-border)',
                        color: 'var(--wpf-accent-text)',
                      }}
                      title="볼륨 시리얼 번호 복사"
                    >
                      <span>VSN: {drive.volumeSerialNumber}</span>
                      {copiedVsnId === drive.id ? (
                        <Check className="w-2.5 h-2.5 text-[#10B981]" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
