import React, { useState } from 'react';
import { 
  HardDrive, 
  ArrowRight, 
  Download, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  FolderSync,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';
import { getDriveColorInfo } from '../utils/driveColors';
import { getInlineDriveBadge } from '../utils/driveBadgeUtils';
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
  selectedIds,
  availableDrives,
  selectedDriveId,
  appViewMode,
  onToggleAppViewMode,
  onOpenTargetDrivePicker,
  onStartBackup,
  onOpenUsbToPcModal,
  onSelectAll,
}) => {
  const [transferMode, setTransferMode] = useState<'PC_TO_USB' | 'USB_TO_PC'>('PC_TO_USB');

  // Selected destination drive
  const selectedDrive = availableDrives.find(d => d.id === selectedDriveId) ||
    availableDrives.find(d => d.type === 'removable') ||
    availableDrives[0];

  const selectedCount = selectedIds.length;
  const totalCount = certificates.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Top Banner Bar - Compact */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-slate-800 truncate">
            인터넷 전송 없는 100% 로컬 보안 복사
          </span>
        </div>

        {/* View Mode Toggle - Compact */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onToggleAppViewMode('simple')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              appViewMode === 'simple' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>간편</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleAppViewMode('advanced')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              appViewMode === 'advanced' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>상세</span>
          </button>
        </div>
      </div>

      {/* Main Action Flow Box - Tighter */}
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setTransferMode('PC_TO_USB')}
              className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                transferMode === 'PC_TO_USB' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>PC ➔ USB (백업)</span>
            </button>
            <button
              onClick={() => {
                setTransferMode('USB_TO_PC');
                onOpenUsbToPcModal();
              }}
              className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                transferMode === 'USB_TO_PC' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>USB ➔ PC (가져오기)</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>NPKI·GPKI·EPKI 보안 호환</span>
          </div>
        </div>

        {/* Action Panel - Tighter */}
        {transferMode === 'PC_TO_USB' ? (
          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 text-xs font-bold">1</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-400 font-medium leading-none mb-1">인증서 선택</div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {selectedCount > 0 ? (
                      <span className="text-blue-700">{selectedCount}개 선택됨</span>
                    ) : (
                      <span className="text-amber-700">미선택 (전체 복사)</span>
                    )}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block shrink-0" />

              <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 text-xs font-bold">2</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-400 font-medium leading-none mb-1">복사 목적지</div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                    {selectedDrive ? (
                      <>
                        <span className={getInlineDriveBadge(selectedDrive.letter).fullBadgeClass}>
                          {selectedDrive.letter}
                        </span>
                        <span className="truncate">{selectedDrive.name.split('(')[0]}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium">USB 없음</span>
                    )}
                  </div>
                </div>
                <button onClick={onOpenTargetDrivePicker} className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold rounded border border-slate-200 cursor-pointer shrink-0">변경</button>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedCount === 0) onSelectAll();
                onStartBackup();
              }}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-extrabold shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{selectedCount > 0 ? `${selectedCount}개 USB 복사` : '전체 USB 복사'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">
                USB 인증서를 내 컴퓨터로 안전하게 가져오기
              </div>
            </div>
            <button onClick={onOpenUsbToPcModal} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
              <span>가져오기 마법사 시작</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
