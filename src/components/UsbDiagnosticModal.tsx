import React, { useState, useEffect, useMemo } from 'react';
import { 
  DiskDrive, 
  WmiQueryLogItem, 
  UsbDiagnosticDeviceReport 
} from '../types';
import { 
  getWindowsWmiDiagnosticReports, 
  getStoredWmiQueryLogs, 
  runInteractiveUsbDiagnostic, 
  clearWmiQueryLogs, 
  exportWmiDiagnosticLogAsText,
  detectUnrecognizedUsbReasons,
  simulateUsbMount
} from '../utils/usbToPcService';
import { 
  HardDrive, 
  Activity, 
  Terminal, 
  HelpCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X, 
  Layers, 
  Cpu, 
  ShieldAlert, 
  Usb, 
  Zap, 
  Search,
  ExternalLink,
  Plus
} from 'lucide-react';

interface UsbDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  drives: DiskDrive[];
  onDrivesUpdated?: (newDrives: DiskDrive[]) => void;
}

export const UsbDiagnosticModal: React.FC<UsbDiagnosticModalProps> = ({
  isOpen,
  onClose,
  drives,
  onDrivesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'devices' | 'wmiLogs' | 'troubleshoot'>('devices');
  const [reports, setReports] = useState<UsbDiagnosticDeviceReport[]>(() => getWindowsWmiDiagnosticReports(drives));
  const [wmiLogs, setWmiLogs] = useState<WmiQueryLogItem[]>(() => getStoredWmiQueryLogs());
  const [selectedDriveLetter, setSelectedDriveLetter] = useState<string>(drives[0]?.letter || 'E:');
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticSummary, setDiagnosticSummary] = useState<string | null>(null);
  
  // Filtering & Copying
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');
  const [copiedVsn, setCopiedVsn] = useState<string | null>(null);
  const [copiedLogs, setCopiedLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReports(getWindowsWmiDiagnosticReports(drives));
      setWmiLogs(getStoredWmiQueryLogs());
      if (drives.length > 0 && !drives.some(d => d.letter === selectedDriveLetter)) {
        setSelectedDriveLetter(drives[0].letter);
      }
    }
  }, [isOpen, drives, selectedDriveLetter]);

  const selectedReport = useMemo(() => {
    return reports.find(r => r.driveLetter.startsWith(selectedDriveLetter)) || reports[0];
  }, [reports, selectedDriveLetter]);

  const selectedDriveIssues = useMemo(() => {
    if (!selectedReport) return [];
    return detectUnrecognizedUsbReasons(selectedReport.driveLetter);
  }, [selectedReport]);

  const filteredLogs = useMemo(() => {
    return wmiLogs.filter(log => {
      const matchesSearch = 
        log.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.output.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [wmiLogs, searchQuery, statusFilter]);

  if (!isOpen) return null;

  const handleCopyVsn = (vsn: string) => {
    navigator.clipboard.writeText(vsn);
    setCopiedVsn(vsn);
    setTimeout(() => setCopiedVsn(null), 2000);
  };

  const handleCopyAllLogs = () => {
    const text = exportWmiDiagnosticLogAsText(drives);
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = exportWmiDiagnosticLogAsText(drives);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kcert_wmi_diagnostic_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setDiagnosticSummary(null);
    try {
      const res = await runInteractiveUsbDiagnostic();
      setReports(res.reports);
      setWmiLogs(res.logs);
      setDiagnosticSummary(res.summary);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const handleClearLogs = () => {
    clearWmiQueryLogs();
    setWmiLogs([]);
  };

  const handleSimulateNewUsb = () => {
    const newDrive = simulateUsbMount();
    if (onDrivesUpdated) {
      onDrivesUpdated([newDrive, ...drives]);
    }
    setReports(getWindowsWmiDiagnosticReports([newDrive, ...drives]));
    setWmiLogs(getStoredWmiQueryLogs());
    setSelectedDriveLetter(newDrive.letter);
    // 진단 모달을 닫아 복사 마법사가 바로 표시되도록 지원
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  USB 드라이브 장치 식별자 & WMI 진단 센터
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Volume Serial Number & WMI Inspector
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                일부 USB/외장 SSD 미인식 원인 정밀 진단, 볼륨 시리얼 번호(VSN) 확인 및 Windows WMI 호출 로그 분석
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Usb className="w-3.5 h-3.5 text-indigo-600" />
              감지된 스토리지: <strong className="text-slate-900">{reports.length}개</strong> (USB/외장 {reports.filter(r => r.busType === 'USB').length}개)
            </span>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              WMI 엔진: <strong className="text-emerald-700">실시간 연동 활성화 (OK)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
              <span>{isRunningDiagnostic ? 'WMI 정밀 스캔 중...' : 'WMI 즉시 정밀 재진단'}</span>
            </button>
            <button
              type="button"
              onClick={handleSimulateNewUsb}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
              title="새 USB 드라이브 꽂기 시뮬레이션"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>가상 USB 추가</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Run Summary Notification */}
        {diagnosticSummary && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{diagnosticSummary}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setDiagnosticSummary(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
            >
              확인
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'devices'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>장치 식별자 & 하드웨어 목록 ({reports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wmiLogs')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'wmiLogs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Windows WMI 호출 로그 ({wmiLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'troubleshoot'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>미인식 원인 자가 진단 및 해결책</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          
          {/* TAB 1: Devices & Volume Serial Numbers */}
          {activeTab === 'devices' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Device Cards List (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    연결된 디스크 드라이브
                  </h3>
                  <span className="text-[11px] text-slate-500">클릭하여 세부 WMI 진단</span>
                </div>

                {reports.map((report) => {
                  const isSelected = selectedDriveLetter === report.driveLetter;
                  const isUsb = report.busType === 'USB';
                  
                  return (
                    <div
                      key={report.driveLetter}
                      onClick={() => setSelectedDriveLetter(report.driveLetter)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                            isUsb 
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isUsb ? <Usb className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{report.driveLetter}</span>
                              <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                                {report.deviceModel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono font-semibold text-slate-600">
                                {report.fileSystem}
                              </span>
                              <span>•</span>
                              <span>{report.freeSpace} 여유</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          report.mountStatus === 'HEALTHY' || report.mountStatus === 'MOUNTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {report.mountStatus === 'HEALTHY' ? '정상 마운트' : report.mountStatus}
                        </span>
                      </div>

                      {/* Volume Serial Number Pill */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">식별자 (VSN):</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded text-xs border border-indigo-200">
                            {report.volumeSerialNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyVsn(report.volumeSerialNumber);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                          title="볼륨 시리얼 번호 복사"
                        >
                          {copiedVsn === report.volumeSerialNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Device Deep Diagnostic Inspection (7 Cols) */}
              <div className="lg:col-span-7">
                {selectedReport ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
                    
                    {/* Top Device Title */}
                    <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {selectedReport.driveLetter} {selectedReport.deviceModel}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {selectedReport.busType} 버스 인터페이스
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          PNP 하드웨어 ID 및 볼륨 파일시스템 WMI 정밀 검사 완료
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">인증서 폴더 감지</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                          selectedReport.isCertRecognized ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {selectedReport.isCertRecognized ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              NPKI/GPKI 발견
                            </>
                          ) : (
                            <>인증서 없음 (빈 드라이브)</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* VSN Highlight Card */}
                    <div className="bg-linear-to-r from-indigo-50/70 to-blue-50/70 border border-indigo-200/80 rounded-lg p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                          드라이브 고유 장치 식별자 (Volume Serial Number)
                        </span>
                        <div className="text-lg font-mono font-black text-indigo-950 mt-0.5 tracking-wider">
                          {selectedReport.volumeSerialNumber}
                        </div>
                        <p className="text-[11px] text-indigo-700/80 mt-0.5">
                          USB 포트 변경 및 재연결 시에도 변하지 않는 고유 식별 코드 (Win32_LogicalDisk)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyVsn(selectedReport.volumeSerialNumber)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedVsn === selectedReport.volumeSerialNumber ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>식별자 복사</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Hardware Spec Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">파일 시스템</span>
                        <span className="font-semibold text-slate-800 text-xs">{selectedReport.fileSystem}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">RMB 미디어 비트</span>
                        <span className={`font-semibold text-xs ${
                          selectedReport.rmbFlag === 'Removable' ? 'text-emerald-700' : 'text-blue-700'
                        }`}>
                          {selectedReport.rmbFlag} (이동식/고정)
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">여유 용량 / 전체</span>
                        <span className="font-semibold text-slate-800 text-xs">{selectedReport.freeSpace} / {selectedReport.totalSize}</span>
                      </div>
                    </div>

                    {/* Diagnostic Summary & Troubleshooting Advice */}
                    <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-800">
                          하드웨어 인식 호환성 진단
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {selectedDriveIssues.map((issue, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-md p-2.5 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              {issue.severity === 'high' ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              ) : issue.severity === 'medium' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span>{issue.reason}</span>
                            </div>
                            <p className="text-slate-600 text-[11px] pl-5 leading-relaxed">
                              💡 <strong>조치 방안:</strong> {issue.solution}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WMI Raw JSON inspector accordion */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        WMI 원시 속성 (Raw WMI Object Props)
                      </span>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-36">
                        {JSON.stringify(selectedReport.wmiRawData, null, 2)}
                      </pre>
                    </div>

                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    좌측에서 검사할 드라이브를 선택하세요.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: WMI Query Calls Console */}
          {activeTab === 'wmiLogs' && (
            <div className="space-y-4">
              
              {/* Filter and Action Controls */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="WMI 쿼리문, 드라이브 문자, DeviceID 검색..."
                    className="w-full bg-transparent border-none focus:outline-hidden text-xs text-slate-800 placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-medium focus:outline-hidden"
                  >
                    <option value="ALL">전체 상태 ({wmiLogs.length})</option>
                    <option value="SUCCESS">SUCCESS (성공)</option>
                    <option value="WARNING">WARNING (경고)</option>
                    <option value="ERROR">ERROR (오류)</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleCopyAllLogs}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>전체 복사</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadLogs}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>.log 다운로드</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                    title="로그 비우기"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>비우기</span>
                  </button>
                </div>
              </div>

              {/* Console Logs Feed */}
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    조건에 일치하는 WMI 쿼리 로그가 없습니다.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-xs shadow-xs border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            log.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                          <span className="text-indigo-400 text-[11px]">({log.latencyMs}ms)</span>
                        </div>

                        <span className="text-slate-400 text-[11px]">
                          Target: <strong className="text-slate-200">{log.target}</strong>
                        </span>
                      </div>

                      {/* Query line */}
                      <div className="text-indigo-300 font-semibold break-all">
                        <span className="text-slate-500 mr-2">&gt;</span>
                        {log.query}
                      </div>

                      {/* Output result */}
                      <div className="bg-slate-950/80 p-2.5 rounded text-emerald-300/90 whitespace-pre-wrap text-[11px] border border-slate-800/80 max-h-32 overflow-y-auto">
                        {log.output}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Troubleshooting Guide */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-4 text-slate-700 text-xs">
              
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    일부 USB가 타 프로그램이나 구형 은행에서 인식되지 않는 5대 원인 및 해결 가이드
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Cause 1: RMB Fixed */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">1</span>
                      <span>Fixed RMB (외장 SSD / 고속 USB의 로컬 디스크 인식)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      <strong>원인:</strong> 최신 USB 3.1/3.2 메모리나 외장 SSD는 윈도우에서 `DriveType.Fixed`(로컬 하드)로 보고되어 구형 은행 프로그램이 이동식 디스크로 찾지 못합니다.
                    </p>
                    <p className="text-emerald-700 font-medium text-[11px] bg-emerald-50 p-2 rounded border border-emerald-200">
                      ✨ <strong>해결됨:</strong> 본 K-인증서 매니저는 `WMI InterfaceType='USB'` 하드웨어 인터페이스를 이중 검사하므로 Fixed 플래그 USB도 완벽 자동 인식합니다.
                    </p>
                  </div>

                  {/* Cause 2: Missing Drive Letter */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">2</span>
                      <span>드라이브 문자(E:, F: 등) 미할당 상태</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      <strong>원인:</strong> 다른 네트워크 드라이브와 충돌하거나 파티션 테이블 오류로 인해 드라이브 문자가 붙지 않아 파일 접근이 차단된 경우입니다.
                    </p>
                    <p className="text-slate-700 text-[11px] bg-white p-2 rounded border border-slate-200">
                      💡 <strong>조치:</strong> <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300">Win+R</kbd> &rarr; <code className="text-indigo-600 font-bold">diskmgmt.msc</code> (디스크 관리) 실행 &rarr; 해당 USB 우클릭 &rarr; [드라이브 문자 및 경로 변경]에서 문자 할당.
                    </p>
                  </div>

                  {/* Cause 3: Write Protection */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">3</span>
                      <span>읽기 전용 잠금 (Write-Protected)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      <strong>원인:</strong> 보안 USB의 물리 스위치가 LOCK 위치에 있거나 사내 보안 소프트웨어(DLP)가 USB 쓰기 권한을 차단한 경우 인증서 복사가 실패합니다.
                    </p>
                    <p className="text-slate-700 text-[11px] bg-white p-2 rounded border border-slate-200">
                      💡 <strong>조치:</strong> USB 측면 물리 락 스위치를 UNLOCK으로 전환하거나, 사내 보안 관리자에게 USB 쓰기 예외 등록을 요청하세요.
                    </p>
                  </div>

                  {/* Cause 4: FileSystem Format */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">4</span>
                      <span>비표준 파일시스템 (exFAT vs FAT32)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      <strong>원인:</strong> 대용량 USB는 exFAT나 NTFS로 포맷되는 경우가 많으며, 일부 극구형 관공서 ActiveX는 FAT32만 검색합니다.
                    </p>
                    <p className="text-slate-700 text-[11px] bg-white p-2 rounded border border-slate-200">
                      💡 <strong>조치:</strong> 32GB 이하 USB는 FAT32 기본 할당 크기로 포맷하여 사용하시는 것을 권장합니다.
                    </p>
                  </div>

                </div>

                {/* Selective Suspend Advice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">USB 허브 전원 관리 (절전 모드 해제 팁)</h4>
                    <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                      간헐적으로 USB 연결이 끊기거나 대용량 인증서 복사 도중 멈추는 현상은 윈도우의 'USB 선택적 절전 모드' 때문일 수 있습니다.
                      장치 관리자 &rarr; 범용 직렬 버스 컨트롤러 &rarr; USB 루트 허브 속성 &rarr; [전원 관리]에서 '전원을 절약하기 위해 컴퓨터가 이 장치를 끌 수 있음' 체크를 해제하세요.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WMI Win32 Provider Ready</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
          >
            진단 창 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
