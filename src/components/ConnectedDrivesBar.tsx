import React, { useState } from 'react';
import { 
  HardDrive, 
  Cpu, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Usb, 
  Database,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { DiskDrive } from '../types';
import { isExcludedVirtualOrCloudDrive, filterPhysicalDrivesOnly } from '../utils/driveFilter';
import { getDriveBadgeStyle } from '../utils/driveBadgeUtils';

interface ConnectedDrivesBarProps {
  availableDrives: DiskDrive[];
  selectedDriveId: string;
  onSelectDriveId: (id: string) => void;
  onOpenUsbToPc?: (driveLetter?: string) => void;
}

export const ConnectedDrivesBar: React.FC<ConnectedDrivesBarProps> = ({
  availableDrives,
  selectedDriveId,
  onSelectDriveId,
  onOpenUsbToPc,
}) => {
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [filterType, setFilterType] = useState<'all' | 'removable'>('all');

  const physicalOnlyDrives = filterPhysicalDrivesOnly(availableDrives);

  const filteredDrives = physicalOnlyDrives.filter(d => {
    if (filterType === 'removable') {
      return d.type === 'removable' || d.busType === 'USB';
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 transition-all h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800">연결된 물리 드라이브</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterType('removable')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'removable' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              USB
            </button>
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'basic' ? 'advanced' : 'basic')}
            className={`p-1 rounded-lg border transition-all cursor-pointer ${
              viewMode === 'advanced' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
            }`}
            title="고급 표시 토글"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Drive Cards - Denser */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 pt-2 flex-1 overflow-y-auto max-h-[300px] scrollbar-thin">
        {filteredDrives.map(drive => {
          if (!drive) return null;
          const isSelected = selectedDriveId === drive.id;
          const driveBadge = getDriveBadgeStyle(drive);
          const isUsb = drive.type === 'removable' || drive.busType === 'USB';

          return (
            <div
              key={drive.id}
              onClick={() => onSelectDriveId(drive.id)}
              className={`p-2.5 rounded-lg border-2 transition-all cursor-pointer relative flex flex-col gap-1.5 ${
                isSelected ? driveBadge.cardSelectedClass : driveBadge.cardNormalClass
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className={`${driveBadge.letterBadgeClass} scale-90`}>{drive.letter}</span>
                  <span className="font-extrabold text-[11px] text-slate-950 truncate max-w-[80px]">
                    {drive.name.split('(')[0]}
                  </span>
                </div>
                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm" />}
              </div>

              <div className="space-y-1">
                <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      drive.freePercentage < 15 ? 'bg-rose-500' : isUsb ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, 100 - drive.freePercentage))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                  <span>여유 {drive.freeSpace}</span>
                  <span className="font-mono">{drive.totalSpace}</span>
                </div>
              </div>

              {viewMode === 'advanced' && (
                <div className="pt-1.5 border-t border-slate-100 text-[9px] text-slate-600 space-y-0.5 font-mono">
                  <div className="flex justify-between"><span>모델:</span><span className="truncate max-w-[100px]">{drive.physicalModel || drive.diskMediaType}</span></div>
                  <div className="flex justify-between"><span>버스:</span><span>{drive.busType || (isUsb ? 'USB' : 'SATA')}</span></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
