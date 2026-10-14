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
  // Mode toggle: 'basic' (기본 표시) vs 'advanced' (고급 표시: NVMe/SATA/USB 포트 및 SSD/HDD 매체 구분, 시리얼, 버스)
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  // Filter: 'all' (전체 드라이브: NVMe/SATA/USB) vs 'removable' (이동식 USB만)
  const [filterType, setFilterType] = useState<'all' | 'removable'>('all');

  // 가상 디스크, 시디롬, 구글 드라이브/클라우드 드라이브 원천 제외
  const physicalOnlyDrives = filterPhysicalDrivesOnly(availableDrives);

  const filteredDrives = physicalOnlyDrives.filter(d => {
    if (filterType === 'removable') {
      return d.type === 'removable' || d.busType === 'USB';
    }
    return true;
  });

  const physicalUsbCount = physicalOnlyDrives.filter(d => d.type === 'removable' || d.busType === 'USB').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 transition-all">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                연결된 물리 드라이브 현황
              </h3>
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-full">
                실제 물리 디스크 {physicalOnlyDrives.length}개 (USB {physicalUsbCount}개)
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              컴퓨터 내부 NVMe / SATA 물리 포트(SSD·HDD) 및 외장 USB만 목록화 (가상디스크·CD-ROM·클라우드 드라이브 제외)
            </p>
          </div>
        </div>

        {/* Controls: Filter & Basic/Advanced View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Filter: All vs USB */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 디스크
            </button>
            <button
              type="button"
              onClick={() => setFilterType('removable')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === 'removable'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              이동식 USB만
            </button>
          </div>

          {/* View Mode: Basic (기본 표시) vs Advanced (고급 표시) */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('basic')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'basic'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="드라이브 문자, 이름, 여유 용량 위주의 깔끔한 기본 표시"
            >
              <span>기본 표시</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('advanced')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'advanced'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="NVMe/SATA 포트 구분, SSD/HDD 매체, 볼륨 시리얼 번호, 파일시스템 상세 표시"
            >
              <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
              <span>고급 표시</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Drive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
        {filteredDrives.map(drive => {
          if (!drive) return null;
          const isSelected = selectedDriveId === drive.id;
          const driveName = drive.name || '';
          const driveDesc = drive.description || '';
          const isCdRom = drive.isCdRom || drive.type === 'cdrom' || drive.deviceKind === 'cdrom' || drive.deviceKind === 'virtual_cd' || driveName.toLowerCase().includes('cd-rom') || driveName.toLowerCase().includes('dvd') || drive.fileSystem === 'UDF' || drive.fileSystem === 'CDFS';
          const isUsb = !isCdRom && (drive.type === 'removable' || drive.busType === 'USB');
          const isNvme = !isCdRom && (drive.isNvme || drive.busType === 'NVMe' || driveName.toLowerCase().includes('nvme') || drive.pnpDeviceId?.toLowerCase().includes('980_pro'));
          const isSata = !isCdRom && (drive.isSata || drive.busType === 'SATA' || (!isUsb && !isNvme));
          const isHdd = !isCdRom && (drive.isHdd || drive.diskMediaType === 'HDD' || driveName.toLowerCase().includes('hdd') || driveDesc.includes('하드디스크'));

          // Determine badge label and colors
          let hardwareLabel = '[외장 USB 메모리]';
          let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';

          if (isCdRom) {
            hardwareLabel = '[가상/물리 CD-ROM]';
            badgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
          } else if (isNvme) {
            hardwareLabel = '[내장 NVMe M.2 SSD]';
            badgeBg = 'bg-purple-50 text-purple-800 border-purple-200';
          } else if (isSata && isHdd) {
            hardwareLabel = '[내장 SATA 포트 HDD]';
            badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
          } else if (isSata) {
            hardwareLabel = '[내장 SATA 포트 SSD]';
            badgeBg = 'bg-sky-50 text-sky-800 border-sky-200';
          } else if (drive.deviceKind === 'external_ssd') {
            hardwareLabel = '[외장 USB SSD]';
            badgeBg = 'bg-teal-50 text-teal-800 border-teal-200';
          }

          return (
            <div
              key={drive.id}
              onClick={() => onSelectDriveId(drive.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                  : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200'
              }`}
            >
              <div>
                {/* Top Row: Letter, Hardware Tag & Selection indicator */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      {drive.letter}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 border rounded font-bold tracking-tight ${badgeBg}`}>
                      {hardwareLabel}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-600 text-white rounded font-bold">
                      대상 선택됨
                    </span>
                  )}
                </div>

                {/* Drive Name */}
                <div className="font-bold text-xs text-slate-800 truncate mb-1">
                  {drive.name}
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 my-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      drive.freePercentage < 15 ? 'bg-rose-500' : isUsb ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, 100 - drive.freePercentage))}%` }}
                  />
                </div>

                {/* Capacity Text */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>여유 {drive.freeSpace}</span>
                  <span className="font-mono text-slate-700">{drive.totalSpace}</span>
                </div>
              </div>

              {/* Advanced Mode Details */}
              {viewMode === 'advanced' && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-700 space-y-1 font-mono">
                  {/* Physical Model & Media */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-sans font-medium">물리 모델:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={drive.physicalModel || drive.name}>
                      {drive.physicalModel ? drive.physicalModel.split(' ')[0] + ' ' + (drive.physicalModel.split(' ')[1] || '') : (drive.diskMediaType || '디스크')}
                    </span>
                  </div>

                  {/* Bus & File System */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-sans font-medium">버스 / 포맷:</span>
                    <span className="font-bold text-slate-900">
                      {isNvme ? 'NVMe PCIe' : isSata ? 'SATA3' : 'USB 3.0'} · {drive.fileSystem || 'NTFS'}
                    </span>
                  </div>

                  {/* Serial Number & WMI Health */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-sans font-medium">볼륨 시리얼:</span>
                    <span className="text-indigo-700 font-bold">
                      {drive.volumeSerialNumber || 'A4F2-89B1'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
