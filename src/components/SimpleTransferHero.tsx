import React from 'react';
import { Zap, Download, HardDrive } from 'lucide-react';
import { getDriveColorInfo } from '../utils/driveColors';
import { filterPhysicalDrivesOnly } from '../utils/driveFilter';
import { DiskDrive, CertificateItem } from '../types';

interface SimpleTransferHeroProps {
  certificates: CertificateItem[];
  selectedIds: string[];
  availableDrives: DiskDrive[];
  selectedDriveId: string;
  appViewMode: 'simple' | 'advanced';
  onToggleAppViewMode: (mode: 'simple' | 'advanced') => void;
  onOpenTargetDrivePicker: () => void;
  onStartBackup: () => void;
  onOpenUsbToPcModal: () => void;
  onSelectAll: () => void;
}

export const SimpleTransferHero: React.FC<SimpleTransferHeroProps> = ({
  certificates,
  availableDrives,
  selectedDriveId,
  onOpenTargetDrivePicker,
  onStartBackup,
  onOpenUsbToPcModal,
  onSelectAll,
}) => {
  const physicalDrives = filterPhysicalDrivesOnly(availableDrives);
  const selectedDrive =
    physicalDrives.find(d => d.id === selectedDriveId) ||
    physicalDrives.find(d => d.type === 'removable') ||
    physicalDrives[0];

  const driveColor = selectedDrive ? getDriveColorInfo(selectedDrive.letter) : null;

  return (
    <div
      className="wpf-card wpf-native px-3.5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5"
      style={{
        backgroundColor: 'var(--wpf-bg-card)',
        border: '1px solid var(--wpf-border)',
        borderRadius: '8px',
      }}
    >
      {/* Left: Quick Backup Target Drive Summary (Matches WPF MainWindow.xaml lines 431-468) */}
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span
          className="inline-flex items-center gap-1 text-[13px] font-bold shrink-0"
          style={{ color: 'var(--wpf-accent-text)' }}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>간편 백업</span>
        </span>

        <span
          className="text-xs shrink-0"
          style={{ color: 'var(--wpf-text-secondary)' }}
        >
          복사 대상:
        </span>

        <button
          type="button"
          onClick={onOpenTargetDrivePicker}
          className="wpf-native animated-drive-card-subtle inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] cursor-pointer transition-transform hover:scale-[1.01]"
          style={{ ['--card-inner-bg' as string]: 'var(--wpf-bg-dark)' }}
          title="클릭하여 복사 대상 드라이브를 변경합니다"
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--wpf-accent-text)' }} />
          {selectedDrive && driveColor ? (
            <>
              <span
                className="text-[11px] font-mono font-extrabold px-1.5 py-0.5 rounded-[4px] border shrink-0"
                style={{
                  backgroundColor: driveColor.bgHex,
                  borderColor: driveColor.borderHex,
                  color: '#FFFFFF',
                }}
              >
                [{driveColor.letter}]
              </span>
              <span
                className="text-xs font-bold truncate max-w-[200px]"
                style={{ color: 'var(--wpf-accent-text)' }}
              >
                {selectedDrive.name}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold" style={{ color: 'var(--wpf-text-muted)' }}>
              (연결된 USB 없음)
            </span>
          )}
        </button>

        {selectedDrive && (
          <span
            className="text-[11px] tabular-nums shrink-0"
            style={{ color: 'var(--wpf-text-secondary)' }}
          >
            여유 {selectedDrive.freeSpace} / {selectedDrive.totalSpace}
          </span>
        )}
      </div>

      {/* Right: One-Click All Copy + USB -> PC Import (Matches WPF MainWindow.xaml lines 470-483) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (certificates.length > 0) onSelectAll();
            onStartBackup();
          }}
          className="wpf-btn-success wpf-native px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          title="전체 인증서를 선택된 대상 드라이브로 즉시 원클릭 일괄 복사합니다."
        >
          <Zap className="w-3.5 h-3.5" />
          <span>원클릭 전체 복사</span>
        </button>

        <button
          type="button"
          onClick={onOpenUsbToPcModal}
          className="wpf-btn-secondary wpf-native px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          title="USB에 있는 인증서를 PC로 안전하게 복사해 넣습니다."
        >
          <Download className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="font-semibold text-[#10B981]">USB ➔ PC 넣기</span>
        </button>
      </div>
    </div>
  );
};
