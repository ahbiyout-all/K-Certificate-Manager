import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ChevronRight, 
  Zap, 
  Usb, 
  Laptop, 
  FileKey,
  Sparkles,
  Check
} from 'lucide-react';
import { DiskDrive, CertificateItem } from '../types';
import { filterPhysicalDrivesOnly, isSameDriveSelfCopy } from '../utils/driveFilter';

interface TargetDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCerts: CertificateItem[];
  availableDrives: DiskDrive[];
  onConfirmTargetDrive: (driveId: string) => void;
}

export const TargetDrivePickerModal: React.FC<TargetDrivePickerModalProps> = ({
  isOpen,
  onClose,
  selectedCerts,
  availableDrives,
  onConfirmTargetDrive,
}) => {
  // Physical drives only (exclude virtual, CD-ROM, cloud drives)
  const physicalDrives = filterPhysicalDrivesOnly(availableDrives);

  // Preferred USB drive
  const preferredUsb = physicalDrives.find(
    d => d.type === 'removable' || d.busType === 'USB' || d.deviceKind === 'fast_usb' || d.deviceKind === 'external_ssd'
  );

  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (preferredUsb) {
        setSelectedId(preferredUsb.id);
      } else if (physicalDrives.length > 0) {
        // If no USB is attached, don't auto-select C: drive, but clear or pick non-C drive
        const nonC = physicalDrives.find(d => !d.letter.toUpperCase().startsWith('C:'));
        setSelectedId(nonC ? nonC.id : '');
      } else {
        setSelectedId('');
      }
    }
  }, [isOpen, availableDrives]);

  if (!isOpen) return null;

  const activeDrive = physicalDrives.find(d => d.id === selectedId) || null;

  // Check if selected drive is self-copying all certs
  const isSelfCopy = activeDrive
    ? selectedCerts.length > 0 && selectedCerts.every(c => isSameDriveSelfCopy(c, activeDrive))
    : false;

  const handleSelectDriveCard = (drive: DiskDrive) => {
    setSelectedId(drive.id);
  };

  const handleConfirm = () => {
    if (!activeDrive) {
      alert('복사를 진행할 목적지 디스크를 먼저 선택해 주세요.');
      return;
    }
    if (isSelfCopy) {
      alert(`[자가 복사 금지] 선택한 인증서가 이미 ${activeDrive.letter} 드라이브에 위치해 있습니다. 타 드라이브(USB 메모리 등)를 목적지로 지정해 주세요.`);
      return;
    }
    onConfirmTargetDrive(activeDrive.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <HardDrive className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📁 복사 목적지 디스크 지정</span>
                <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full font-semibold">
                  인증서 {selectedCerts.length}건
                </span>
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                인증서를 안전하게 복사 보관할 이동식 USB 메모리 또는 디스크를 선택해 주세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Summary Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileKey className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                복사 대상: {selectedCerts.map(c => c.name).slice(0, 2).join(', ')}
                {selectedCerts.length > 2 ? ` 외 ${selectedCerts.length - 2}건` : ''}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold rounded shrink-0">
              총 {selectedCerts.length}개 선택됨
            </span>
          </div>

          {/* Drive List Header */}
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-800 dark:text-slate-200">
              목적지 디스크 목록 (클릭하여 선택):
            </label>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              USB 꽂으면 자동 인식
            </span>
          </div>

          {/* Physical Drives Grid */}
          <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {physicalDrives.map(drive => {
              const isSelected = drive.id === selectedId;
              const isRemovable = drive.type === 'removable' || drive.busType === 'USB';
              const isDriveSelfCopy = selectedCerts.length > 0 && selectedCerts.every(c => isSameDriveSelfCopy(c, drive));

              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
              let badgeLabel = drive.deviceKindLabel || (isRemovable ? '이동식 USB' : '내장 디스크');

              if (drive.deviceKind === 'external_ssd') {
                badgeColor = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800';
                badgeLabel = '외장 SSD';
              } else if (drive.deviceKind === 'fast_usb') {
                badgeColor = 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800';
                badgeLabel = '고속 USB 메모리';
              } else if (isRemovable) {
                badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
                badgeLabel = '이동식 USB';
              }

              return (
                <div
                  key={drive.id}
                  onClick={() => handleSelectDriveCard(drive)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex items-center justify-between gap-3 active:scale-[0.99] ${
                    isSelected
                      ? isDriveSelfCopy
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 ring-2 ring-rose-500/30 shadow-md'
                        : 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/30 shadow-md'
                      : isDriveSelfCopy
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-rose-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-blue-400 hover:bg-blue-50/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isRemovable
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {isRemovable ? <Usb className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                          {drive.letter}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {drive.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold border ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>여유 공간: <strong className="text-slate-800 dark:text-slate-200">{drive.freeSpace}</strong></span>
                        {drive.totalSpace && (
                          <span className="text-slate-400 font-mono">/ {drive.totalSpace}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDriveSelfCopy && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>자가 복사 금지</span>
                      </span>
                    )}

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs animate-scaleIn">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notice Banner if No USB Connected */}
          {!preferredUsb && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-950 dark:text-amber-100">
                  💡 이동식 USB 메모리가 연결되지 않았습니다.
                </div>
                <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  인증서를 USB 메모리로 복사하시려면 USB를 컴퓨터 포트에 연결해 주세요. 연결 시 목적지 목록이 즉시 새로고침됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Self-copy error banner */}
          {isSelfCopy && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-900 dark:text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-950 dark:text-rose-100">
                  🛑 동일 디스크 자가 복사 제한
                </div>
                <p className="mt-0.5 text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  선택한 인증서가 이미 {activeDrive?.letter} 드라이브에 저장되어 있습니다. 자기 자신 디스크로는 복사할 수 없으니 다른 목적지 드라이브(USB 메모리 등)를 선택해 주세요.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!activeDrive || isSelfCopy}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
              !activeDrive
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : isSelfCopy
                  ? 'bg-rose-300 text-white cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>
              {activeDrive
                ? isSelfCopy
                  ? '자가 복사 금지'
                  : `${activeDrive.letter} (${activeDrive.name.split('(')[0].trim()})로 복사 시작`
                : '목적지 디스크 선택 필요'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
