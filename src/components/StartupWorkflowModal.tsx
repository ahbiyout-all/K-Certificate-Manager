import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  HardDrive, 
  Usb, 
  Monitor, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  Layers, 
  CheckCircle2, 
  RotateCcw,
  Compass,
  Zap,
  Info,
  Laptop
} from 'lucide-react';
import { BRANDING_ASSETS } from '../data/brandingAssets';
import { getInlineDriveBadge } from '../utils/driveBadgeUtils';

export type WorkflowType = 'pc_to_usb' | 'usb_to_pc' | 'dashboard';

interface StartupWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkflow: (type: WorkflowType) => void;
  dontShowAgain?: boolean;
  onToggleDontShowAgain?: (val: boolean) => void;
  validPcCerts?: any[];
  recentMode?: WorkflowType | null;
}

export const StartupWorkflowModal: React.FC<StartupWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSelectWorkflow,
  dontShowAgain = false,
  onToggleDontShowAgain,
  validPcCerts = [],
  recentMode = null,
}) => {
  // Track recently selected or active preview mode (PC-USB vs USB-PC)
  const [activeTabMode, setActiveTabMode] = useState<WorkflowType>(() => {
    try {
      const saved = localStorage.getItem('kcert_recent_workflow_mode');
      if (saved === 'pc_to_usb' || saved === 'usb_to_pc') return saved as WorkflowType;
    } catch {}
    return recentMode === 'usb_to_pc' ? 'usb_to_pc' : 'pc_to_usb';
  });

  // Synchronize when recentMode prop updates
  useEffect(() => {
    if (recentMode === 'pc_to_usb' || recentMode === 'usb_to_pc') {
      setActiveTabMode(recentMode);
    }
  }, [recentMode]);

  const handleSelect = (type: WorkflowType) => {
    try {
      if (type === 'pc_to_usb' || type === 'usb_to_pc') {
        localStorage.setItem('kcert_recent_workflow_mode', type);
        setActiveTabMode(type);
      }
    } catch {}
    onSelectWorkflow(type);
  };

  // Column resizing state for valid PC certificates preview table
  const DEFAULT_STARTUP_COL_WIDTHS = useMemo(() => ({
    index: 52,
    category: 120,
    name: 260,
    issuer: 170,
    notAfter: 120,
    status: 90,
  }), []);

  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_STARTUP_COL_WIDTHS);
  const [resizingCol, setResizingCol] = useState<string | null>(null);

  const handleStartResize = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 100;
    setResizingCol(colKey);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minW = colKey === 'index' ? 35 : (colKey === 'name' ? 200 : 55);
      const newWidth = Math.max(minW, startWidth + deltaX);
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      setResizingCol(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResetColWidths = () => {
    setColWidths(DEFAULT_STARTUP_COL_WIDTHS);
  };

  const totalTableWidth = useMemo(() => {
    return Object.values(colWidths).reduce((sum: number, w: number) => sum + w, 0);
  }, [colWidths]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[924px] overflow-hidden relative animate-scaleIn">
        {/* Top Decorative Gradient Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[11px] font-bold tracking-wide uppercase">
                  시작 가이드 모션
                </span>
                <span className="text-slate-400 text-xs">| K-인증서 매니저</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                작업 선택 및 단계별 가이드 모션 시작
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-sm sm:text-base font-bold text-slate-800">
              수행하고자 하는 인증서 작업 모드를 선택하세요.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              선택하신 작업 모드에 맞춰 **출발지·도착지 표준 경로 검증과 화면 내 가이드 포커스링**이 단계별로 자동 안내됩니다.
            </p>
          </div>

          {/* Workflow Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: PC -> USB */}
            <button
              type="button"
              onClick={() => handleSelect('pc_to_usb')}
              className={`group relative p-5 bg-gradient-to-b ${
                activeTabMode === 'pc_to_usb'
                  ? 'from-blue-100/70 via-blue-50/50 to-white ring-2 ring-blue-500 border-blue-500 shadow-md'
                  : 'from-blue-50/40 to-white hover:from-blue-100/60 hover:to-blue-50/40 border-blue-200/90 hover:border-blue-500'
              } rounded-2xl border-2 text-left transition-all duration-200 shadow-2xs hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  {activeTabMode === 'pc_to_usb' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold shadow-2xs animate-pulse">
                      ★ 최근 선택 모드
                    </span>
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[11px] mb-1.5">
                    <span>1단계 ➔ 3단계 가이드</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                    <span>PC ➔ USB 복사하기</span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </h3>

                  {/* Route Summary Pill */}
                  <div className="mt-2 p-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[11px] leading-tight space-y-1">
                    <div className="text-blue-900 font-bold flex items-center gap-1">
                      <span className="text-blue-600">출발:</span>
                      <span className="font-mono text-[10.5px]">내 컴퓨터 C: (AppData / C:\GPKI)</span>
                    </div>
                    <div className="text-emerald-900 font-bold flex items-center gap-1">
                      <span className="text-emerald-600">도착:</span>
                      <span className="font-mono text-[10.5px]">이동식 USB ({'{드라이브}:\\'}NPKI·GPKI)</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    컴퓨터의 금융(AppData) 및 행정·공무원(정부 표준 C:\GPKI) 보관함에서 유효한 인증서를 자동 감지하여 USB 메모리에 안전하게 복사/백업합니다.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-blue-100/80 flex items-center justify-between text-xs font-bold text-blue-600">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>가이드 모션 실행</span>
                </span>
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors shadow-2xs">
                  시작 ➔
                </span>
              </div>
            </button>

            {/* Card 2: USB -> PC */}
            <button
              type="button"
              onClick={() => handleSelect('usb_to_pc')}
              className={`group relative p-5 bg-gradient-to-b ${
                activeTabMode === 'usb_to_pc'
                  ? 'from-emerald-100/70 via-emerald-50/50 to-white ring-2 ring-emerald-500 border-emerald-500 shadow-md'
                  : 'from-emerald-50/40 to-white hover:from-emerald-100/60 hover:to-emerald-50/40 border-emerald-200/90 hover:border-emerald-500'
              } rounded-2xl border-2 text-left transition-all duration-200 shadow-2xs hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Usb className="w-6 h-6 text-white" />
                  </div>
                  {activeTabMode === 'usb_to_pc' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-2xs animate-pulse">
                      ★ 최근 선택 모드
                    </span>
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px] mb-1.5">
                    <span>1단계 ➔ 3단계 가이드</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                    <span>USB ➔ PC 가져오기</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </h3>

                  {/* Route Summary Pill */}
                  <div className="mt-2 p-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] leading-tight space-y-1">
                    <div className="text-emerald-900 font-bold flex items-center gap-1">
                      <span className="text-emerald-600">출발:</span>
                      <span className="font-mono text-[10.5px]">이동식 USB ({'{드라이브}:\\'}NPKI·GPKI)</span>
                    </div>
                    <div className="text-blue-900 font-bold flex items-center gap-1">
                      <span className="text-blue-600">도착:</span>
                      <span className="font-mono text-[10.5px]">정부 표준 C:\GPKI 및 금융 AppData</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    USB 메모리의 인증서를 내 컴퓨터의 올바른 정규 표준 보관함(행정공무원: C:\GPKI, 금융: AppData)으로 안전하게 가져옵니다.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-emerald-100/80 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>가이드 모션 실행</span>
                </span>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg group-hover:bg-emerald-700 transition-colors shadow-2xs">
                  시작 ➔
                </span>
              </div>
            </button>

            {/* Card 3: Dashboard Direct Entry */}
            <button
              type="button"
              onClick={() => handleSelect('dashboard')}
              className="group relative p-5 bg-gradient-to-b from-slate-50 to-white hover:from-slate-100/80 hover:to-slate-50 text-slate-800 rounded-2xl border-2 border-slate-200/90 hover:border-slate-400 text-left transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6 text-slate-200" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-extrabold text-[11px] mb-1.5">
                    <span>전체 대시보드</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-slate-700 transition-colors flex items-center gap-1.5">
                    <span>메인 화면 직접 진입</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h3>

                  <div className="mt-2 p-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium leading-tight">
                    <span>모든 드라이브 인증서 목록, 상세 정보, 만료일 점검 및 안전 격리 휴지통 직접 관리</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    가이드 없이 전체 인증서 목록 조회, 정리 및 고급 설정 대시보드로 바로 이동합니다.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="text-[11px] text-slate-400">자율 직접 관리</span>
                <span className="px-2.5 py-1 bg-slate-800 text-white rounded-lg group-hover:bg-slate-900 transition-colors shadow-2xs">
                  진입하기
                </span>
              </div>
            </button>
          </div>

          {/* Dedicated Route Flow Guide Inspector based on Recently Selected Mode */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-700/80 shadow-md space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>⚡ 최근 선택 복사 모드 경로 가이드</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTabMode === 'pc_to_usb'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {activeTabMode === 'pc_to_usb' ? 'PC ➔ USB 백업 모드' : 'USB ➔ PC 가져오기 모드'}
                  </span>
                </h4>
              </div>

              {/* Mode switch toggle buttons */}
              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('pc_to_usb');
                    try { localStorage.setItem('kcert_recent_workflow_mode', 'pc_to_usb'); } catch {}
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTabMode === 'pc_to_usb'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💻 PC ➔ USB 경로
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('usb_to_pc');
                    try { localStorage.setItem('kcert_recent_workflow_mode', 'usb_to_pc'); } catch {}
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTabMode === 'usb_to_pc'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💾 USB ➔ PC 경로
                </button>
              </div>
            </div>

            {/* Route Visual Cards with Direct & Friendly Situational Messages */}
            {activeTabMode === 'pc_to_usb' ? (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-blue-900/40 border border-blue-400/40 text-xs text-blue-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-300 shrink-0" />
                  <span className="font-bold">지금 연결된 USB 메모리로 내 컴퓨터의 유효한 인증서를 안전하게 옮깁니다.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-11 gap-2.5 items-center text-xs">
                  {/* Source (5 cols) */}
                  <div className="md:col-span-5 p-3 rounded-xl bg-slate-800/90 border border-blue-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-blue-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" />
                        <span>출발지: 내 컴퓨터 (PC 로컬 보관함)</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-200 font-mono">로컬 C:\</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5 pl-1 border-l-2 border-blue-500/50">
                      <p>• <strong>금융·공동 (NPKI)</strong>: C:\Users\{'{사용자}'}\AppData\LocalLow\NPKI</p>
                      <p>• <strong className="text-blue-300">행정공무원 (GPKI)</strong>: C:\GPKI\Certificate\class2 (정부 공식 위치)</p>
                      <p>• <strong>교육전자서명 (EPKI)</strong>: C:\Users\{'{사용자}'}\AppData\LocalLow\EPKI</p>
                    </div>
                  </div>

                  {/* Arrow & Engine (1 col) */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 font-black text-sm">
                      ➔
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">SHA-256</span>
                  </div>

                  {/* Destination (5 cols) */}
                  <div className="md:col-span-5 p-3 rounded-xl bg-slate-800/90 border border-emerald-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Usb className="w-3.5 h-3.5 text-emerald-400" />
                        <span>도착지: 지금 연결된 이동식 USB 메모리</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 rounded text-emerald-200 font-mono">이동식 디스크</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5 pl-1 border-l-2 border-emerald-500/50">
                      <p>• <strong>USB 표준 보관 폴더</strong>: {'{USB드라이브}:\\'}(NPKI | GPKI | EPKI)</p>
                      <p>• <strong>타 PC 즉시 연동</strong>: 타 컴퓨터 연결 시 [이동식 디스크]에서 바로 인식</p>
                      <p>• <strong>무결성 키페어</strong>: signCert.der + signPri.key 100% 동봉 복사</p>
                    </div>
                  </div>
                </div>

                {/* Tip box */}
                <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-[11px] text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>내 컴퓨터 내 만료되지 않은 유효한 인증서만 선별하여, 지금 연결된 USB 메모리로 안전하게 백업합니다.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect('pc_to_usb')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-xs"
                  >
                    지금 연결된 USB로 인증서 옮기기 ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-400/40 text-xs text-emerald-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="font-bold">USB에 있는 인증서를 내 컴퓨터(PC)의 공식 표준 보관함으로 안전하게 불러옵니다.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-11 gap-2.5 items-center text-xs">
                  {/* Source (5 cols) */}
                  <div className="md:col-span-5 p-3 rounded-xl bg-slate-800/90 border border-emerald-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Usb className="w-3.5 h-3.5 text-emerald-400" />
                        <span>출발지: 지금 연결된 이동식 USB 메모리</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 rounded text-emerald-200 font-mono">이동식 디스크</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5 pl-1 border-l-2 border-emerald-500/50">
                      <p>• <strong>USB 원본 위치</strong>: {'{USB드라이브}:\\'}(GPKI | NPKI | EPKI) 보관 폴더</p>
                      <p>• <strong>행정공무원 원본</strong>: {'{USB드라이브}:\\'}GPKI\Certificate\class2</p>
                      <p>• <strong>금융·은행 원본</strong>: {'{USB드라이브}:\\'}NPKI\yessign (등 공인기관)</p>
                    </div>
                  </div>

                  {/* Arrow & Engine (1 col) */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 font-black text-sm">
                      ➔
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">정규 분류</span>
                  </div>

                  {/* Destination (5 cols) */}
                  <div className="md:col-span-5 p-3 rounded-xl bg-slate-800/90 border border-blue-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-blue-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" />
                        <span>도착지: 내 컴퓨터 공식 표준 보관함 (PC)</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-200 font-mono">정부/금융 공식</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5 pl-1 border-l-2 border-blue-500/50">
                      <p>• <strong className="text-emerald-300 font-bold">행정공무원 (GPKI)</strong>: C:\GPKI\Certificate\class2 (정부 공식 표준 안착)</p>
                      <p>• <strong className="text-blue-300">금융·은행용 (NPKI)</strong>: C:\Users\{'{사용자}'}\AppData\LocalLow\NPKI</p>
                      <p>• <strong className="text-purple-300">교육전자서명 (EPKI)</strong>: C:\Users\{'{사용자}'}\AppData\LocalLow\EPKI</p>
                    </div>
                  </div>
                </div>

                {/* Tip box */}
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>행정공무원(GPKI)은 정부 공식 폴더(C:\GPKI)로, 금융인증서는 AppData로 정확히 자동 분류되어 복사 후 바로 사용하실 수 있습니다.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect('usb_to_pc')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-xs"
                  >
                    USB 인증서를 내 컴퓨터로 불러오기 ➔
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Detected Valid PC Certificates Table with Horizontal & Vertical Grid Lines & Resizable Headers */}
          {validPcCerts && validPcCerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                    <span>내 컴퓨터</span>
                    <span className={getInlineDriveBadge('C:').fullBadgeClass}>C:</span>
                    <span>기본 보관함의 유효 인증서 ({validPcCerts.length}개 감지)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    격자 가로세로 구분줄 · 유효 항목만 표시
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetColWidths}
                    className="text-slate-500 hover:text-blue-600 font-medium cursor-pointer text-[11px] hover:underline"
                    title="모든 열 너비를 초기 기본 크기로 복원합니다"
                  >
                    너비 초기화 ↺
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => onSelectWorkflow('pc_to_usb')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>이 인증서들로 USB 복사 시작</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Table with Always Visible Horizontal Scrollbar and Column Resizers */}
              <div className="overflow-x-scroll overflow-y-auto max-h-44 rounded-xl border border-slate-300 dark:border-slate-700 bg-white shadow-2xs pb-1 scrollbar-thin">
                <table
                  className={`table-fixed text-left text-xs border-collapse ${resizingCol ? 'select-none' : ''}`}
                  style={{ width: `${totalTableWidth}px`, minWidth: '100%' }}
                >
                  <thead className="bg-slate-100/95 text-slate-700 font-bold sticky top-0 z-10 border-b-2 border-slate-300 shadow-2xs">
                    <tr className="divide-x divide-slate-200">
                      {/* 1. 번호 */}
                      <th
                        style={{ width: `${colWidths.index}px`, minWidth: `${colWidths.index}px`, maxWidth: `${colWidths.index}px` }}
                        className="w-[52px] min-w-[52px] py-2.5 px-2 text-center relative select-none group bg-slate-100"
                      >
                        <span className="truncate block">번호</span>
                        <div
                          onMouseDown={(e) => handleStartResize('index', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/50 z-20 flex items-center justify-center select-none"
                          title="드래그하여 번호 열 너비 조절"
                        >
                          <div className="w-0.5 h-3 bg-slate-300 group-hover:bg-blue-500" />
                        </div>
                      </th>

                      {/* 2. 구분 */}
                      <th
                        style={{ width: `${colWidths.category}px`, minWidth: `${colWidths.category}px`, maxWidth: `${colWidths.category}px` }}
                        className="w-[120px] min-w-[90px] py-2.5 px-3 relative select-none group bg-slate-100"
                      >
                        <span className="truncate block">구분</span>
                        <div
                          onMouseDown={(e) => handleStartResize('category', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/50 z-20 flex items-center justify-center select-none"
                          title="드래그하여 구분 열 너비 조절"
                        >
                          <div className="w-0.5 h-3 bg-slate-300 group-hover:bg-blue-500" />
                        </div>
                      </th>

                      {/* 3. 인증서 명칭 (CN) - min-w-[200px] */}
                      <th
                        style={{ width: `${colWidths.name}px`, minWidth: `${Math.max(colWidths.name, 200)}px`, maxWidth: `${Math.max(colWidths.name, 200)}px` }}
                        className="w-[260px] min-w-[200px] py-2.5 px-3 relative select-none group bg-slate-100"
                      >
                        <span className="truncate block" title="인증서 명칭 (최소 너비 200px 유지)">인증서 명칭 (CN)</span>
                        <div
                          onMouseDown={(e) => handleStartResize('name', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/50 z-20 flex items-center justify-center select-none"
                          title="드래그하여 인증서 명칭 열 너비 조절 (최소 200px)"
                        >
                          <div className="w-0.5 h-3 bg-slate-300 group-hover:bg-blue-500" />
                        </div>
                      </th>

                      {/* 4. 발급기관 */}
                      <th
                        style={{ width: `${colWidths.issuer}px`, minWidth: `${colWidths.issuer}px`, maxWidth: `${colWidths.issuer}px` }}
                        className="w-[170px] min-w-[120px] py-2.5 px-3 relative select-none group bg-slate-100"
                      >
                        <span className="truncate block">발급기관</span>
                        <div
                          onMouseDown={(e) => handleStartResize('issuer', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/50 z-20 flex items-center justify-center select-none"
                          title="드래그하여 발급기관 열 너비 조절"
                        >
                          <div className="w-0.5 h-3 bg-slate-300 group-hover:bg-blue-500" />
                        </div>
                      </th>

                      {/* 5. 만료일 */}
                      <th
                        style={{ width: `${colWidths.notAfter}px`, minWidth: `${colWidths.notAfter}px`, maxWidth: `${colWidths.notAfter}px` }}
                        className="w-[120px] min-w-[90px] py-2.5 px-3 text-center relative select-none group bg-slate-100"
                      >
                        <span className="truncate block">만료일</span>
                        <div
                          onMouseDown={(e) => handleStartResize('notAfter', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/50 z-20 flex items-center justify-center select-none"
                          title="드래그하여 만료일 열 너비 조절"
                        >
                          <div className="w-0.5 h-3 bg-slate-300 group-hover:bg-blue-500" />
                        </div>
                      </th>

                      {/* 6. 상태 */}
                      <th
                        style={{ width: `${colWidths.status}px`, minWidth: `${colWidths.status}px`, maxWidth: `${colWidths.status}px` }}
                        className="w-[90px] min-w-[70px] py-2.5 px-3 text-center relative select-none group bg-slate-100"
                      >
                        <span className="truncate block">상태</span>
                        <div
                          onMouseDown={(e) => handleStartResize('status', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/50 z-20 flex items-center justify-center select-none"
                          title="드래그하여 상태 열 너비 조절"
                        >
                          <div className="w-0.5 h-3 bg-slate-300 group-hover:bg-blue-500" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {validPcCerts.map((cert, index) => (
                      <tr key={cert.id || index} className="divide-x divide-slate-200 hover:bg-blue-50/40 transition-colors">
                        <td
                          style={{ width: `${colWidths.index}px` }}
                          className="w-[52px] py-2 px-2 text-center font-mono font-bold text-slate-500 text-[11px] bg-slate-50/50"
                        >
                          {index + 1}
                        </td>
                        <td style={{ width: `${colWidths.category}px` }} className="w-[120px] py-2 px-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200 inline-block truncate max-w-full">
                            {cert.category === 'GPKI_GOV' ? 'GPKI(행정)' : cert.category === 'EPKI_EDU' ? 'EPKI(교육)' : 'NPKI(공동)'}
                          </span>
                        </td>
                        <td style={{ width: `${colWidths.name}px` }} className="w-[260px] min-w-[200px] py-2 px-3 font-bold text-slate-900">
                          <div className="flex flex-col min-w-0">
                            <span className="truncate block" title={cert.name || cert.commonName}>{cert.name || cert.commonName}</span>
                            {(cert.sourceLocation || cert.directoryPath) && (
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-full block font-normal" title={cert.sourceLocation || cert.directoryPath}>
                                {cert.sourceLocation || cert.directoryPath}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ width: `${colWidths.issuer}px` }} className="w-[170px] py-2 px-3 text-slate-600 text-[11px]">
                          <span className="truncate block" title={cert.issuer || cert.issuerName}>{cert.issuer || cert.issuerName}</span>
                        </td>
                        <td style={{ width: `${colWidths.notAfter}px` }} className="w-[120px] py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                          <span className="truncate block">{cert.expiryDate || (cert.notAfter ? new Date(cert.notAfter).toISOString().slice(0, 10) : '-')}</span>
                        </td>
                        <td style={{ width: `${colWidths.status}px` }} className="w-[90px] py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            정상
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Features & Settings Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>모든 복사 작업은 **SHA-256 바이트 무결성 대조**가 자동 수행됩니다.</span>
            </div>

            <div className="flex items-center gap-3">
              {onToggleDontShowAgain && (
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => onToggleDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>시작 시 이 안내창 다시 보지 않기</span>
                </label>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-2xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
