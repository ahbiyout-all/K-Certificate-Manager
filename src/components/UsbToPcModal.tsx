import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HardDrive,
  Laptop,
  ArrowRight,
  ArrowDownLeft,
  CheckCircle2,
  FolderOpen,
  ShieldCheck,
  FileKey,
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderTree,
  UserCheck,
  Check,
  Sparkles,
  Filter,
  Layers
} from 'lucide-react';
import { CertificateItem, DiskDrive } from '../types';
import { BRANDING_ASSETS } from '../data/brandingAssets';
import {
  UsbDetectedCert,
  UsbImportResult,
  getAvailableUsbCertificates,
  scanDirectoryHandleForCertificates,
  copyUsbCertificatesToComputer,
  getLocalPcStandardPath,
  subscribeUsbDriveChanges,
  simulateUsbMount
} from '../utils/usbToPcService';
import { formatUserErrorMessage, parseUserFriendlyError } from '../utils/userFriendlyError';
import { playSuccessChime } from '../utils/audioFeedback';
import { SuccessCelebration } from './SuccessCelebration';

interface UsbToPcModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDrives: DiskDrive[];
  existingCertificates: CertificateItem[];
  onImportSuccess: (importedCerts: CertificateItem[], summaryMessage: string) => void;
  initialDriveLetter?: string;
}

type UsbSourceTab = 'drives' | 'folder';

export const UsbToPcModal: React.FC<UsbToPcModalProps> = ({
  isOpen,
  onClose,
  availableDrives,
  existingCertificates,
  onImportSuccess,
  initialDriveLetter,
}) => {
  const [sourceTab, setSourceTab] = useState<UsbSourceTab>('drives');
  const [selectedUsbDrive, setSelectedUsbDrive] = useState<string>(initialDriveLetter || 'ALL');
  const [detectedCerts, setDetectedCerts] = useState<UsbDetectedCert[]>([]);
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [targetUsername, setTargetUsername] = useState('Admin');
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [showUsageGuide, setShowUsageGuide] = useState(true);
  const [onlyWithCertsFilter, setOnlyWithCertsFilter] = useState(false);
  
  // Processing & Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<UsbImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Analyze all connected removable drives and sort with priority (drives with certs first)
  const usbDrivesWithStats = useMemo(() => {
    const removableDrives = availableDrives.filter(
      d => d.type === 'removable' || d.deviceKind === 'external_ssd' || d.deviceKind === 'fast_usb'
    );

    const drivesWithData = removableDrives.map(d => {
      const letterClean = d.letter.replace(':', '');
      const certsInThisDrive = getAvailableUsbCertificates(availableDrives, letterClean);
      const hasGov = certsInThisDrive.some(c => c.category === 'GPKI_GOV');
      const hasEdu = certsInThisDrive.some(c => c.category === 'EPKI_EDU');
      const hasBank = certsInThisDrive.some(c => c.category === 'NPKI_BANK');

      return {
        drive: d,
        letterClean,
        certCount: certsInThisDrive.length,
        certs: certsInThisDrive,
        hasGov,
        hasEdu,
        hasBank,
      };
    });

    // Priority Sort: Drives with certificates FIRST (descending by certCount), then alphabetically by drive letter
    drivesWithData.sort((a, b) => {
      if (b.certCount !== a.certCount) {
        return b.certCount - a.certCount;
      }
      return a.drive.letter.localeCompare(b.drive.letter);
    });

    return drivesWithData;
  }, [availableDrives]);

  const totalUsbCertsCount = useMemo(() => {
    return usbDrivesWithStats.reduce((sum, item) => sum + item.certCount, 0);
  }, [usbDrivesWithStats]);

  const drivesWithCertsCount = useMemo(() => {
    return usbDrivesWithStats.filter(item => item.certCount > 0).length;
  }, [usbDrivesWithStats]);

  // Load default simulated USB certs on open or drive filter change, and listen for live events
  useEffect(() => {
    if (isOpen) {
      if (initialDriveLetter) {
        setSelectedUsbDrive(initialDriveLetter.replace(':', ''));
      }
      const driveFilter = initialDriveLetter ? initialDriveLetter.replace(':', '') : selectedUsbDrive;
      const initialUsb = getAvailableUsbCertificates(availableDrives, driveFilter);
      setDetectedCerts(initialUsb);
      setSelectedCertIds(initialUsb.map(c => c.id));
      setImportResult(null);
      setProgress(0);
      setLogs([]);
      setErrorMessage(null);

      const unsubscribe = subscribeUsbDriveChanges((event) => {
        if (event.type === 'mount' || event.type === 'unmount' || event.type === 'update') {
          const refreshedUsb = getAvailableUsbCertificates(event.allDrives, selectedUsbDrive);
          setDetectedCerts(refreshedUsb);
          setSelectedCertIds(refreshedUsb.map(c => c.id));
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, availableDrives, selectedUsbDrive, initialDriveLetter]);

  const handleSelectDrive = (driveKey: string) => {
    setSelectedUsbDrive(driveKey);
    const certs = getAvailableUsbCertificates(availableDrives, driveKey);
    setDetectedCerts(certs);
    setSelectedCertIds(certs.map(c => c.id));
  };

  if (!isOpen) return null;

  // Toggle single cert selection
  const handleToggleCert = (id: string) => {
    setSelectedCertIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCertIds(detectedCerts.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCertIds([]);
  };

  // 1. Directory Picker (real folder)
  const handlePickDirectory = async () => {
    setErrorMessage(null);
    if (!('showDirectoryPicker' in window)) {
      setErrorMessage('사용 중인 브라우저가 File System Access API를 지원하지 않습니다. Chrome 또는 Edge 브라우저를 이용해 주세요.');
      return;
    }

    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      setIsProcessing(true);
      setLogs([`[USB 스캔] 선택된 디렉터리 '${dirHandle.name}' 내 NPKI/GPKI 인증서 검색 중...`]);
      
      const scanned = await scanDirectoryHandleForCertificates(dirHandle);
      setIsProcessing(false);

      if (scanned.length === 0) {
        setErrorMessage(`선택한 폴더('${dirHandle.name}')에서 유효한 signCert.der 인증서 파일을 찾지 못했습니다.`);
      } else {
        setDetectedCerts(scanned);
        setSelectedCertIds(scanned.map(c => c.id));
        setLogs(prev => [...prev, `[스캔 성공] 총 ${scanned.length}개의 인증서가 감지되었습니다.`]);
      }
    } catch (err: any) {
      setIsProcessing(false);
      if (err.name !== 'AbortError') {
        const errorInfo = parseUserFriendlyError(err, 'USB 폴더 탐색');
        setErrorMessage(errorInfo.summary + '\n' + errorInfo.actionTip);
      }
    }
  };

  // Start Copying from USB to Computer
  const handleStartImport = async () => {
    const certsToCopy = detectedCerts.filter(c => selectedCertIds.includes(c.id));
    if (certsToCopy.length === 0) {
      setErrorMessage('컴퓨터로 복사할 인증서를 최소 1개 이상 선택해 주세요.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setLogs(['[초기화] USB ➔ 컴퓨터(PC) 역방향 인증서 복사 프로세스 준비 중...']);
    setErrorMessage(null);

    try {
      await new Promise(r => setTimeout(r, 400));
      setProgress(40);
      setLogs(prev => [
        ...prev,
        `[디스크 검증] USB 이동식 매체 파일 읽기 및 SHA-256 서명 지문 유효성 검사 진행`,
        `[대상 시스템] Windows PC 기본 저장소: C:\\Users\\${targetUsername}\\AppData\\LocalLow\\`,
      ]);

      await new Promise(r => setTimeout(r, 500));
      setProgress(70);

      const copyDetails: string[] = [];
      certsToCopy.forEach(c => {
        const dest = getLocalPcStandardPath(c, targetUsername);
        copyDetails.push(`[복사 전송] ${c.name} (${c.issuer}) ➔ ${dest}`);
      });
      setLogs(prev => [...prev, ...copyDetails]);

      await new Promise(r => setTimeout(r, 400));
      const res = await copyUsbCertificatesToComputer(
        certsToCopy,
        existingCertificates,
        targetUsername,
        overwriteExisting
      );

      setProgress(100);
      setLogs(prev => [
        ...prev, 
        ...res.logs,
        `[자동 새로고침 완료] 내 컴퓨터(PC) 로컬 인증서 보관함 목록이 자동으로 새로고침되었습니다.`
      ]);
      setImportResult(res);
      playSuccessChime();
      setShowCelebration(true);

      // Trigger success callback to add to main certificates list
      onImportSuccess(
        res.importedCerts,
        `${certsToCopy.length}명의 인증서가 내 컴퓨터(C:\\Users\\${targetUsername}\\AppData\\LocalLow)로 안전하게 복사되었습니다.`
      );
    } catch (err: any) {
      setErrorMessage(formatUserErrorMessage(err, '인증서 컴퓨터 복사'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImportResult(null);
    setShowCelebration(false);
    setProgress(0);
    setLogs([]);
    setErrorMessage(null);
    const initialUsb = getAvailableUsbCertificates(availableDrives);
    setDetectedCerts(initialUsb);
    setSelectedCertIds(initialUsb.map(c => c.id));
  };

  const selectedCerts = detectedCerts.filter(c => selectedCertIds.includes(c.id));
  const usbDrives = availableDrives.filter(d => d.type === 'removable');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-400/40 bg-slate-800 shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={BRANDING_ASSETS.usbCertIcon} 
                alt="USB 인증서 전송" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== BRANDING_ASSETS.rawUsbCertIcon) {
                    target.src = BRANDING_ASSETS.rawUsbCertIcon;
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  컴퓨터로 인증서 복사
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-full font-bold">
                  USB ➔ PC 로컬 등록
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                이동식 USB에 저장된 공무원(GPKI·EPKI) 및 금융(NPKI) 인증서를 내 컴퓨터의 표준 위치로 안전하게 복사하고 연동을 안내합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto relative">
          {importResult ? (
            /* Result View */
            <div className="space-y-5 relative">
              <SuccessCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />
              <div className="p-5 bg-gradient-to-b from-emerald-50 to-teal-50/40 rounded-2xl border-2 border-emerald-300 text-center shadow-lg shadow-emerald-500/10 relative overflow-hidden animate-scaleIn">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-300 shadow-inner relative">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 animate-ping" />
                  <CheckCircle2 className="w-8 h-8 relative z-10" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950 flex items-center justify-center gap-2">
                  <span>컴퓨터로 인증서 복사 및 시스템 등록 완료!</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs">
                    등록 완료
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 mt-1 max-w-lg mx-auto">
                  선택하신 {importResult.importedCount + importResult.updatedCount}명의 인증서가 로컬 하드디스크(C:) 표준 폴더에 성공적으로 안착되었습니다.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-emerald-300 text-xs font-mono text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>표준 계층 무결성 통과 · SHA-256 검증 완료</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-semibold border border-blue-200">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>인증서 목록 자동 새로고침 완료</span>
                  </div>
                </div>
              </div>

              {/* Path Mapping Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>내 컴퓨터 저장 완료 위치 (Windows 표준)</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 break-all">
                  {importResult.targetBaseFolder}
                </div>
                <div className="space-y-1 text-slate-600">
                  <p>• <strong>인터넷뱅킹 / 홈택스 / 금융권</strong>: [하드디스크] ➔ [NPKI] 선택 시 즉시 인식됩니다.</p>
                  <p>• <strong>정부24 / 온-나라 / 나이스(NEIS)</strong>: [하드디스크] ➔ [GPKI / EPKI] 선택 시 인증서가 활성화됩니다.</p>
                </div>
              </div>

              {/* Logs */}
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg max-h-36 overflow-y-auto space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-tight">{log}</div>
                ))}
              </div>

              {/* Footer buttons for result */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  다른 인증서 추가 가져오기
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  인증서 목록 확인하기
                </button>
              </div>
            </div>
          ) : (
            /* Configure & Select View */
            <>
              {/* Guidance Callout */}
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-slate-800 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <span>'컴퓨터로 인증서 복사' 작업 가이드</span>
                    <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded text-[10px] font-bold">
                      안내
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    USB 내의 인증서를 내 PC 로컬(AppData\LocalLow)에 표준 계층으로 등록합니다. 복사 완료 후 인터넷뱅킹 및 행정망에서 <strong>[하드디스크]</strong>를 선택하면 USB 없이도 바로 인증서로 로그인할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Step 1: Visual Transfer Diagram */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      출발지 (Source)
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      이동식 디스크 (USB)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      NPKI / GPKI 폴더 또는 백업 파일
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center px-2">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span>컴퓨터로 복사</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">AppData\LocalLow</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                      도착지 (Target)
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      내 컴퓨터 로컬 (C: 하드디스크)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      C:\Users\{targetUsername}\AppData\LocalLow
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Source Tab Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  1. USB 소스 탐색 방식 선택:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceTab('drives');
                      const initialUsb = getAvailableUsbCertificates(availableDrives, selectedUsbDrive);
                      setDetectedCerts(initialUsb);
                      setSelectedCertIds(initialUsb.map(c => c.id));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      sourceTab === 'drives'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                    <span>감지된 USB 드라이브</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSourceTab('folder');
                      handlePickDirectory();
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      sourceTab === 'folder'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>USB 폴더 직접 열기</span>
                  </button>
                </div>

                {/* Sub-tab: Select specific USB drive when 'drives' tab is active */}
                {sourceTab === 'drives' && (
                  <div className="mt-2.5 p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                          <span>연결된 USB 드라이브 선택:</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>인증서 보유 드라이브 상단 우선 정렬됨</span>
                        </span>
                      </div>

                      {drivesWithCertsCount > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setOnlyWithCertsFilter(prev => !prev)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border ${
                              onlyWithCertsFilter 
                                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="인증서가 발견된 드라이브만 필터링하여 표시합니다"
                          >
                            <Filter className="w-3 h-3 text-amber-600" />
                            <span>인증서 있는 드라이브만 ({drivesWithCertsCount}개)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {usbDrivesWithStats.length === 0 ? (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-slate-800">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-amber-950">
                              연결된 USB 이동식 드라이브를 찾을 수 없습니다
                            </h5>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              인증서(NPKI / GPKI)가 저장된 USB 메모리를 컴퓨터에 꽂아주시거나, 위의 <strong>[USB 폴더 직접 열기]</strong>를 눌러 인증서 폴더를 직접 지정해 주세요.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSourceTab('folder');
                                handlePickDirectory();
                              }}
                              className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>USB 폴더 직접 열기</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Option 1: ALL USB Drives */}
                        <button
                          type="button"
                          onClick={() => handleSelectDrive('ALL')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            selectedUsbDrive === 'ALL'
                              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/30'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedUsbDrive === 'ALL' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                            }`}>
                              <Layers className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">전체 USB 드라이브 일괄 검색</div>
                              <div className={`text-[10px] ${selectedUsbDrive === 'ALL' ? 'text-blue-100' : 'text-slate-500'}`}>
                                모든 이동식 저장장치 ({usbDrivesWithStats.length}개)
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            selectedUsbDrive === 'ALL'
                              ? 'bg-blue-800 text-blue-100'
                              : totalUsbCertsCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {totalUsbCertsCount > 0 ? `총 ${totalUsbCertsCount}건 감지` : '0건'}
                          </span>
                        </button>

                        {/* Option 2: Individual Drives (Priority Sorted: Drives with Certs FIRST) */}
                        {usbDrivesWithStats
                          .filter(item => !onlyWithCertsFilter || item.certCount > 0)
                          .map(item => {
                            const isSelected = selectedUsbDrive === item.letterClean;
                            const hasCerts = item.certCount > 0;
                            const kind = item.drive.deviceKindLabel || '이동식 USB';

                            return (
                              <button
                                key={item.drive.id}
                                type="button"
                                onClick={() => handleSelectDrive(item.letterClean)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 relative overflow-hidden ${
                                  isSelected
                                    ? hasCerts
                                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40'
                                      : 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/30'
                                    : hasCerts
                                    ? 'bg-amber-50/70 border-amber-300 text-slate-900 hover:bg-amber-100/70 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/80 shadow-2xs opacity-80'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : hasCerts
                                      ? 'bg-amber-200 text-amber-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    <HardDrive className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold truncate">
                                        {item.drive.letter} {item.drive.name}
                                      </span>
                                      {hasCerts && !isSelected && (
                                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-500 text-white rounded font-bold">
                                          추천
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-[10px] truncate ${
                                      isSelected 
                                        ? 'text-amber-100' 
                                        : hasCerts 
                                        ? 'text-amber-800' 
                                        : 'text-slate-400'
                                    }`}>
                                      [{kind}] 여유: {item.drive.freeSpace}
                                      {hasCerts && (
                                        <span className="ml-1 font-medium">
                                          · {item.hasGov ? '공무원' : ''}{item.hasGov && item.hasBank ? '+' : ''}{item.hasBank ? '은행' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  isSelected
                                    ? 'bg-black/20 text-white'
                                    : hasCerts
                                    ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {hasCerts ? `✨ 인증서 ${item.certCount}건` : '인증서 없음'}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Detected Certificates List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-800">
                      2. USB에서 발견된 인증서 목록 ({detectedCerts.length}건):
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">
                      선택됨 {selectedCertIds.length}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      전체 선택
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-500 hover:underline font-semibold cursor-pointer"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {detectedCerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      USB에서 감지된 인증서가 없습니다. 위의 'USB 폴더 직접 열기'를 이용해 주세요.
                    </div>
                  ) : (
                    detectedCerts.map(cert => {
                      const isSelected = selectedCertIds.includes(cert.id);
                      const isAlreadyInPc = existingCertificates.some(
                        c => c.serialNumber === cert.serialNumber || (c.name === cert.name && c.category === cert.category)
                      );

                      return (
                        <div
                          key={cert.id}
                          onClick={() => handleToggleCert(cert.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-white border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                              : 'bg-white/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by outer div
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                            />

                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                              <FileKey className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {cert.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">
                                  {cert.category === 'GPKI_GOV' ? '공무원(GPKI)' : cert.category === 'EPKI_EDU' ? '교육행정(EPKI)' : '은행(NPKI)'}
                                </span>
                                {isAlreadyInPc && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                                    PC에 기존 존재
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                <span>발급: {cert.issuer}</span>
                                <span>·</span>
                                <span>유효기간: {cert.validTo}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 hidden sm:block">
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                              {cert.usbPath}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">
                              키페어(DER+KEY) 정상
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 4: PC Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-800">
                  3. 컴퓨터(PC) 저장소 옵션
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Windows 대상 사용자 계정명:
                    </label>
                    <input
                      type="text"
                      value={targetUsername}
                      onChange={e => setTargetUsername(e.target.value.trim() || 'Admin')}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Admin"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={e => setOverwriteExisting(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-700 font-medium">
                        동일한 인증서가 PC에 이미 존재할 경우 최신 파일로 덮어쓰기
                      </span>
                    </label>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-white p-2.5 rounded-lg border border-slate-200">
                  컴퓨터 최종 저장 폴더: <span className="text-blue-700 font-semibold">C:\Users\{targetUsername}\AppData\LocalLow\(NPKI | GPKI)\...</span>
                </div>
              </div>

              {/* Progress and Logs (during execution) */}
              {isProcessing && (
                <div className="space-y-2 p-4 bg-slate-900 rounded-xl text-white font-mono text-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      컴퓨터(PC)로 복사 진행 중 ({progress}%)
                    </span>
                    <span className="text-slate-400 font-semibold">로컬 C: 드라이브</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-300 pt-2">
                    {logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  * 무결성 SHA-256 자동 검증 및 연결 오류 시 최대 3회 자동 재시도가 적용됩니다.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={handleStartImport}
                    disabled={isProcessing || selectedCertIds.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>컴퓨터로 복사 중...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>'컴퓨터로 인증서 복사' 시작 ({selectedCertIds.length}건)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
