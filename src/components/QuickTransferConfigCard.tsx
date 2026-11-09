import React, { useState, useMemo } from 'react';
import { 
  HardDrive, 
  FolderOpen, 
  ArrowLeftRight, 
  ArrowDownLeft, 
  Laptop, 
  ChevronDown, 
  PlusCircle, 
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  FileKey,
  Filter,
  Check,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';
import { DiskDrive, SearchPath } from '../types';
import { getAvailableUsbCertificates } from '../utils/usbToPcService';

interface QuickTransferConfigCardProps {
  searchPaths: SearchPath[];
  availableDrives: DiskDrive[];
  selectedDriveId: string;
  onSelectDriveId: (id: string) => void;
  onTogglePathsPanel: () => void;
  onOpenCustomDirectory: () => void;
  onOpenUsbToPcModal: (targetDriveLetter?: string) => void;
  onSimulateUsbMount?: () => void;
}

export const QuickTransferConfigCard: React.FC<QuickTransferConfigCardProps> = ({
  searchPaths,
  availableDrives,
  selectedDriveId,
  onSelectDriveId,
  onTogglePathsPanel,
  onOpenCustomDirectory,
  onOpenUsbToPcModal,
  onSimulateUsbMount,
}) => {
  const [transferMode, setTransferMode] = useState<'PC_TO_USB' | 'USB_TO_PC'>('PC_TO_USB');
  const [onlyWithCertsFilter, setOnlyWithCertsFilter] = useState<boolean>(false);
  const [selectedUsbLetter, setSelectedUsbLetter] = useState<string>('E');

  const primaryPath = searchPaths.find(p => p.enabled && p.type === 'default_npki') || searchPaths[0];
  const enabledCount = searchPaths.filter(p => p.enabled).length;

  const removableDrivesWithStats = useMemo(() => {
    const list = availableDrives.filter(d => d.type === 'removable' || d.busType === 'USB').map(drive => {
      const letterClean = drive.letter.replace(':', '').toUpperCase();
      const certs = getAvailableUsbCertificates(availableDrives, letterClean);
      return { drive, letterClean, certs, certCount: certs.length };
    });
    list.sort((a, b) => b.certCount - a.certCount);
    return list;
  }, [availableDrives]);

  const activeUsbDriveInfo = useMemo(() => {
    return removableDrivesWithStats.find(d => d.letterClean === selectedUsbLetter) || removableDrivesWithStats[0];
  }, [removableDrivesWithStats, selectedUsbLetter]);

  return (
    <div className="space-y-3">
      {/* Direction Bar - Compact */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setTransferMode('PC_TO_USB')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                transferMode === 'PC_TO_USB' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              PC ➔ USB 백업
            </button>
            <button
              onClick={() => {
                setTransferMode('USB_TO_PC');
                if (removableDrivesWithStats.length > 0) setSelectedUsbLetter(removableDrivesWithStats[0].letterClean);
              }}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                transferMode === 'USB_TO_PC' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              USB ➔ PC 복사
            </button>
          </div>
          <button onClick={() => setTransferMode(prev => prev === 'PC_TO_USB' ? 'USB_TO_PC' : 'PC_TO_USB')} className="p-1 text-slate-400 hover:text-slate-600">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          실시간 하드웨어 감시 활성
        </div>
      </div>

      {/* Cards - Tighter */}
      {transferMode === 'USB_TO_PC' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase">1. 원본 USB 선택</label>
              {removableDrivesWithStats.filter(d => d.certCount > 0).length > 0 && (
                <button onClick={() => setOnlyWithCertsFilter(!onlyWithCertsFilter)} className={`text-[9px] px-1.5 py-0.5 rounded border ${onlyWithCertsFilter ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  인증서 있는 USB만
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
              {removableDrivesWithStats.filter(d => !onlyWithCertsFilter || d.certCount > 0).map(item => (
                <div key={item.drive.id} onClick={() => setSelectedUsbLetter(item.letterClean)} className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${activeUsbDriveInfo?.letterClean === item.letterClean ? 'bg-amber-50 border-amber-500 animated-drive-card-subtle' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-mono font-bold px-1 rounded border ${item.certCount > 0 ? 'bg-amber-100 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{item.drive.letter}</span>
                    <span className="text-[11px] font-bold text-slate-800 truncate">{item.drive.name.split('(')[0]}</span>
                  </div>
                  {item.certCount > 0 && <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-bold">{item.certCount}건</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">2. 복사 도착지 (로컬 PC)</label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 break-all mb-2">
                C:\Users\Admin\AppData\LocalLow
              </div>
              <p className="text-[10px] text-blue-700 bg-blue-50 p-2 rounded leading-tight">
                표준 보관함(AppData)으로 복사하여 은행/공공 서비스 로그인 시 하드디스크 인식을 가능하게 합니다.
              </p>
            </div>
            <button onClick={() => onOpenUsbToPcModal(activeUsbDriveInfo?.letterClean)} className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>{activeUsbDriveInfo?.drive.letter || 'USB'} ➔ PC로 복사하기</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">1. 원본 위치 (컴퓨터)</label>
            <div className="flex gap-2 mb-2">
              <input readOnly value={primaryPath?.path || ''} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-600 font-mono" />
              <button onClick={onTogglePathsPanel} className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-lg shrink-0">변경</button>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>{enabledCount}개 표준 경로 감시 중</span>
              <button onClick={onOpenCustomDirectory} className="text-blue-600 font-medium">+ 폴더 선택</button>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">2. 대상 USB 드라이브</label>
            <div className="flex gap-2 mb-2">
              <select value={selectedDriveId} onChange={e => onSelectDriveId(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium cursor-pointer">
                {availableDrives.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.type === 'removable' ? '💾' : '🖥️'} {d.letter} {d.name} ({d.freeSpace})
                  </option>
                ))}
              </select>
              <button onClick={onOpenCustomDirectory} className="px-2 py-1 bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg shrink-0">새 경로</button>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>대상에 NPKI/GPKI 폴더 자동 생성</span>
              <button onClick={() => setTransferMode('USB_TO_PC')} className="text-emerald-600 font-semibold">USB ➔ PC 모드 전환 ➔</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


