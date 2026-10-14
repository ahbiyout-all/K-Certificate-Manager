import React from 'react';
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
  Zap
} from 'lucide-react';
import { BRANDING_ASSETS } from '../data/brandingAssets';

export type WorkflowType = 'pc_to_usb' | 'usb_to_pc' | 'dashboard';

interface StartupWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkflow: (type: WorkflowType) => void;
  dontShowAgain?: boolean;
  onToggleDontShowAgain?: (val: boolean) => void;
}

export const StartupWorkflowModal: React.FC<StartupWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSelectWorkflow,
  dontShowAgain = false,
  onToggleDontShowAgain,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-3xl overflow-hidden relative animate-scaleIn">
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
              선택하신 작업의 순서에 맞춰 **화면 내 가이드 모션과 포커스링**이 단계별로 자동 안내됩니다.
            </p>
          </div>

          {/* Workflow Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: PC -> USB */}
            <button
              type="button"
              onClick={() => onSelectWorkflow('pc_to_usb')}
              className="group relative p-5 bg-gradient-to-b from-blue-50/50 to-white hover:from-blue-100/60 hover:to-blue-50/40 rounded-2xl border-2 border-blue-200/90 hover:border-blue-500 text-left transition-all duration-200 shadow-2xs hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none" />
              
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Monitor className="w-6 h-6 text-white" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[11px] mb-1.5">
                    <span>1단계 ➔ 3단계 가이드</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                    <span>PC ➔ USB 복사하기</span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">
                    컴퓨터(AppData)에 보관된 공인인증서를 USB 메모리로 안전하게 복사/백업합니다.
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
              onClick={() => onSelectWorkflow('usb_to_pc')}
              className="group relative p-5 bg-gradient-to-b from-emerald-50/50 to-white hover:from-emerald-100/60 hover:to-emerald-50/40 rounded-2xl border-2 border-emerald-200/90 hover:border-emerald-500 text-left transition-all duration-200 shadow-2xs hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none" />

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Usb className="w-6 h-6 text-white" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px] mb-1.5">
                    <span>1단계 ➔ 3단계 가이드</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                    <span>USB ➔ PC 가져오기</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">
                    USB 메모리의 인증서를 내 컴퓨터로 안전하게 복사하여 기본 보관함에 등록합니다.
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
              onClick={() => onSelectWorkflow('dashboard')}
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
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">
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

          {/* Bottom Features & Settings Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>모든 복사 작업은 **SHA-256 바이트 무결성 대조**가 자동 수행됩니다.</span>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};
