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
  // Transfer Direction: 'PC_TO_USB' (컴퓨터 ➔ USB 백업) or 'USB_TO_PC' (USB ➔ 컴퓨터 복사)
  const [transferMode, setTransferMode] = useState<'PC_TO_USB' | 'USB_TO_PC'>('PC_TO_USB');
  const [onlyWithCertsFilter, setOnlyWithCertsFilter] = useState<boolean>(false);
  const [selectedUsbLetter, setSelectedUsbLetter] = useState<string>('E');

  // Find primary active source path
  const primaryPath = searchPaths.find(p => p.enabled && p.type === 'default_npki') || searchPaths[0];
  const enabledCount = searchPaths.filter(p => p.enabled).length;
  const removableDrivesCount = availableDrives.filter(d => d.type === 'removable').length;

  // Analyze all removable & external drives for certificates
  const removableDrivesWithStats = useMemo(() => {
    const removableDrives = availableDrives.filter(
      d => d.type === 'removable' || d.deviceKind === 'external_ssd' || d.deviceKind === 'fast_usb'
    );

    const list = removableDrives.map(drive => {
      const letterClean = drive.letter.replace(':', '').toUpperCase();
      const certs = getAvailableUsbCertificates(availableDrives, letterClean);
      const hasGov = certs.some(c => c.category === 'GPKI_GOV');
      const hasEdu = certs.some(c => c.category === 'EPKI_EDU');
      const hasBank = certs.some(c => c.category === 'NPKI_BANK');
      const hasCorp = certs.some(c => c.category === 'NPKI_CORP');

      return {
        drive,
        letterClean,
        certs,
        certCount: certs.length,
        hasGov,
        hasEdu,
        hasBank,
        hasCorp,
      };
    });

    // Priority sort: Drives with certificates FIRST (descending by certCount), then alphabetically by drive letter
    list.sort((a, b) => {
      if (b.certCount !== a.certCount) {
        return b.certCount - a.certCount;
      }
      return a.drive.letter.localeCompare(b.drive.letter);
    });

    return list;
  }, [availableDrives]);

  const totalUsbCertsCount = useMemo(() => {
    return removableDrivesWithStats.reduce((acc, d) => acc + d.certCount, 0);
  }, [removableDrivesWithStats]);

  const drivesWithCertsCount = useMemo(() => {
    return removableDrivesWithStats.filter(d => d.certCount > 0).length;
  }, [removableDrivesWithStats]);

  // Filtered drives based on toggle
  const displayedUsbDrives = useMemo(() => {
    if (onlyWithCertsFilter) {
      return removableDrivesWithStats.filter(d => d.certCount > 0);
    }
    return removableDrivesWithStats;
  }, [removableDrivesWithStats, onlyWithCertsFilter]);

  // Current active USB drive for USB -> PC mode
  const activeUsbDriveInfo = useMemo(() => {
    return (
      removableDrivesWithStats.find(d => d.letterClean === selectedUsbLetter) ||
      removableDrivesWithStats.find(d => d.certCount > 0) ||
      removableDrivesWithStats[0]
    );
  }, [removableDrivesWithStats, selectedUsbLetter]);

  return (
    <div className="space-y-4">
      {/* 1. Desktop Transfer Direction Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Direction Toggle Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 uppercase tracking-wider hidden sm:inline">
            작업 방향:
          </span>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTransferMode('PC_TO_USB')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                transferMode === 'PC_TO_USB'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>🖥️ PC ➔ 💾 USB 백업</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTransferMode('USB_TO_PC');
                if (removableDrivesWithStats.length > 0 && (!selectedUsbLetter || !removableDrivesWithStats.some(d => d.letterClean === selectedUsbLetter))) {
                  const firstWithCerts = removableDrivesWithStats.find(d => d.certCount > 0) || removableDrivesWithStats[0];
                  if (firstWithCerts) setSelectedUsbLetter(firstWithCerts.letterClean);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                transferMode === 'USB_TO_PC'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>💾 USB ➔ 🖥️ 내 PC 복사</span>
              {totalUsbCertsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  transferMode === 'USB_TO_PC' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {totalUsbCertsCount}건 발견
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTransferMode(prev => prev === 'PC_TO_USB' ? 'USB_TO_PC' : 'PC_TO_USB')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="복사 방향 상호 전환 (PC ➔ USB / USB ➔ PC)"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Status badge & Shortcut */}
        <div className="flex items-center gap-2 text-xs w-full md:w-auto justify-between md:justify-end">
          {transferMode === 'USB_TO_PC' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>인증서 보유 USB 우선 정렬 활성화</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{removableDrivesCount}개 이동식 디바이스 연결됨</span>
            </span>
          )}

          {onSimulateUsbMount && (
            <button
              type="button"
              onClick={onSimulateUsbMount}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-300 transition-all cursor-pointer shadow-2xs"
              title="새로운 이동식 USB 드라이브 연결을 시뮬레이션합니다"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>새 USB 연결 시뮬레이션</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Transfer Configuration Cards (Depending on Direction) */}
      {transferMode === 'USB_TO_PC' ? (
        /* MODE: USB ➔ 내 PC 복사 ('컴퓨터로 인증서 복사') */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Source USB Drive Selection (With Priority Sorting & Highlighting) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  1. 원본 USB 드라이브 선택
                </label>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold">
                  ⭐ 인증서 보유 상단 정렬
                </span>
              </div>

              {/* Filter Button */}
              {drivesWithCertsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyWithCertsFilter(!onlyWithCertsFilter)}
                  className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    onlyWithCertsFilter
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>인증서 있는 USB만 ({drivesWithCertsCount})</span>
                </button>
              )}
            </div>

            {/* USB Drives Priority List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {displayedUsbDrives.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  연결된 이동식 드라이브 중 표시할 장치가 없습니다.
                </div>
              ) : (
                displayedUsbDrives.map(item => {
                  const isSelected = activeUsbDriveInfo?.letterClean === item.letterClean;
                  const hasCerts = item.certCount > 0;

                  return (
                    <div
                      key={item.drive.id}
                      onClick={() => setSelectedUsbLetter(item.letterClean)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? hasCerts
                            ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/30 shadow-xs'
                            : 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/30 shadow-xs'
                          : hasCerts
                          ? 'bg-gradient-to-r from-amber-50/40 to-slate-50 border-amber-300 hover:border-amber-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          hasCerts ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <HardDrive className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded border ${
                              hasCerts ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
                              {item.drive.letter}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate" title={item.drive.name}>
                              {item.drive.name}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                            <span>여유: {item.drive.freeSpace}</span>
                            {hasCerts ? (
                              <span className="font-bold text-amber-700 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>인증서 {item.certCount}건 발견 (추천)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">인증서 없음</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.hasGov && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                            공무원(GPKI)
                          </span>
                        )}
                        {item.hasBank && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                            금융(NPKI)
                          </span>
                        )}

                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected USB Certificate Preview Pill */}
            {activeUsbDriveInfo && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <FileKey className="w-3.5 h-3.5 text-indigo-600" />
                    <span>선택된 {activeUsbDriveInfo.drive.letter} 드라이브 인증서 목록 ({activeUsbDriveInfo.certCount}건)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {activeUsbDriveInfo.certCount > 0 ? '복사 가능' : '인증서 없음'}
                  </span>
                </div>

                {activeUsbDriveInfo.certCount > 0 ? (
                  <div className="space-y-1">
                    {activeUsbDriveInfo.certs.map(cert => (
                      <div key={cert.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-200/80">
                        <span className="font-semibold text-slate-800 truncate">
                          {cert.name} ({cert.issuer})
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          만료 D-{cert.daysRemaining}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    선택한 USB 드라이브에 NPKI/GPKI 인증서가 없습니다. 목록 상단의 인증서 보유 드라이브를 선택해 주세요.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Destination Location (Local PC AppData\LocalLow) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  2. 복사 도착지 (내 PC 로컬 하드디스크)
                </label>
                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  표준 시스템 폴더 지정됨
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block mb-1">복사 대상 위치 (Windows 표준 NPKI/GPKI 경로):</span>
                <input
                  type="text"
                  readOnly
                  value="C:\Users\Admin\AppData\LocalLow"
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono select-all focus:outline-none"
                />
              </div>

              <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>'컴퓨터로 인증서 복사' 효과</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  복사 완료 후 인터넷뱅킹 및 정부24, 홈택스 등 공공 서비스 로그인 시 <strong>[하드디스크]</strong>를 선택하면 USB 연결 없이도 내 PC에서 즉시 인증서 로그인이 가능합니다.
                </p>
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenUsbToPcModal(activeUsbDriveInfo?.letterClean)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  {activeUsbDriveInfo?.drive.letter || 'USB'} 드라이브 인증서 컴퓨터로 복사하기
                  {activeUsbDriveInfo?.certCount ? ` (${activeUsbDriveInfo.certCount}건)` : ''}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>* signCert.der 및 개인키(signPri.key) 무결성 자동 보장</span>
                <button
                  type="button"
                  onClick={() => onOpenUsbToPcModal()}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold cursor-pointer"
                >
                  복사 설정 상세 열기...
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE: 내 컴퓨터 ➔ USB 백업 (기본 모드) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Source Location Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. 원본 소스 위치 (컴퓨터 로컬)
              </label>
              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                {enabledCount}개 표준 위치 활성화
              </span>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                readOnly
                value={primaryPath ? primaryPath.path : 'C:\\Users\\Admin\\AppData\\LocalLow\\NPKI'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-mono select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                title={primaryPath ? primaryPath.path : ''}
              />
              <button
                type="button"
                onClick={onTogglePathsPanel}
                className="px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                경로 변경 / 상세
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>GPKI(행정) · EPKI(교육) · NPKI(금융) 폴더 자동 포함</span>
              <button
                type="button"
                onClick={onOpenCustomDirectory}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
              >
                + 직접 폴더 선택
              </button>
            </div>
          </div>

          {/* 2. Target Drive Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. 복사 대상 드라이브 선택 (PC ➔ USB)
              </label>
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {removableDrivesCount}개 USB 실시간 감지됨
              </span>
            </div>

            <div className="flex space-x-2">
              <select
                value={selectedDriveId}
                onChange={e => onSelectDriveId(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                {availableDrives.map(drive => {
                  const kind = drive.deviceKindLabel || (drive.type === 'removable' ? '이동식 USB' : '내장 디스크');
                  const icon = drive.deviceKind === 'external_ssd' ? '⚡' : drive.deviceKind === 'fast_usb' ? '🚀' : drive.type === 'removable' ? '💾' : '🖥️';
                  return (
                    <option key={drive.id} value={drive.id}>
                      {icon} [{kind}] {drive.letter} {drive.name} ({drive.freeSpace} 여유) {drive.description?.includes('인증서 없는') || drive.description?.includes('새 백업') ? '✨(신규 백업 추천)' : ''}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={onOpenCustomDirectory}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="새로운 디스크나 폴더를 브라우저에서 직접 선택합니다"
              >
                새 경로...
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>* 대상 드라이브에 NPKI / GPKI 표준 계층 폴더가 자동 생성됩니다.</span>
              <button
                type="button"
                onClick={() => setTransferMode('USB_TO_PC')}
                className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                반대 방향: USB ➔ 내 PC 복사 ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


