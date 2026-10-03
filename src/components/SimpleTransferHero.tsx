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
  const removableDrives = availableDrives.filter(d => d.type === 'removable');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Top Banner Bar: Mode Switch & Friendly Reassurance */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            초보자도 1초 만에 가능한 간편 인증서 이동
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            인터넷 전송 없는 100% 로컬 보안 복사
          </span>
        </div>

        {/* View Mode Toggle: [간편 모드] vs [상세 모드] */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onToggleAppViewMode('simple')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              appViewMode === 'simple'
                ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="일반 사용자를 위해 복잡한 설정을 숨기고 인증서 목록과 원클릭 복사 버튼에 집중합니다."
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>간편 모드</span>
            <span className="text-[10px] px-1 py-0.2 bg-blue-500/30 text-white rounded font-normal">
              추천
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleAppViewMode('advanced')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              appViewMode === 'advanced'
                ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="드라이브 정밀 진단(WMI/VSN), 상세 탐색 경로 및 백업 이력을 모두 펼쳐봅니다."
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>상세 모드</span>
          </button>
        </div>
      </div>

      {/* Main Action Flow Box */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Direction Switcher (Clean & Clear) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTransferMode('PC_TO_USB')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                transferMode === 'PC_TO_USB'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>🖥️ 내 PC ➔ 💾 USB로 복사 (백업)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTransferMode('USB_TO_PC');
                onOpenUsbToPcModal();
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                transferMode === 'USB_TO_PC'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>💾 USB ➔ 🖥️ 내 PC로 가져오기</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>GPKI·EPKI(행정/교육) 및 NPKI(금융/은행) 완전 호환</span>
          </div>
        </div>

        {/* Action Panel */}
        {transferMode === 'PC_TO_USB' ? (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Step Visualizer */}
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              {/* Step 1: Selected Certs */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400 font-medium">복사할 인증서</div>
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {selectedCount > 0 ? (
                      <span className="text-blue-700">
                        {selectedCount}개 선택됨 <span className="text-slate-400 font-normal">/ 전체 {totalCount}개</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        선택 없음 (클릭 시 전체 복사)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block shrink-0" />

              {/* Step 2: Target Drive */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400 font-medium">복사할 목적지</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                    <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {selectedDrive ? `${selectedDrive.letter} ${selectedDrive.name.split('(')[0]}` : 'USB 없음'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenTargetDrivePicker}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 shrink-0"
                  title="다른 드라이브나 USB로 변경"
                >
                  변경
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedCount === 0) {
                    onSelectAll();
                  }
                  onStartBackup();
                }}
                className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {selectedCount > 0 ? `${selectedCount}개 인증서 USB로 즉시 복사` : '전체 인증서 USB로 즉시 복사'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  USB에 보관된 인증서를 현재 내 컴퓨터로 안전하게 가져옵니다
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  외부 USB에 들어있는 GPKI, EPKI, NPKI 인증서를 자동으로 검색하여 로컬 보관함으로 옮깁니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenUsbToPcModal}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>USB ➔ PC 복사 마법사 열기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
