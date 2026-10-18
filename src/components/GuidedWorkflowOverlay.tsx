import React, { useEffect, useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Monitor, 
  Usb, 
  Play, 
  RotateCcw,
  Compass,
  Check,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { WorkflowType } from './StartupWorkflowModal';
import { playSuccessChime } from '../utils/audioFeedback';

interface GuidedWorkflowOverlayProps {
  workflowType: WorkflowType | null;
  onCloseWorkflow: () => void;
  selectedCertCount: number;
  availableUsbCount: number;
  onOpenBackupModal: () => void;
  onOpenUsbToPcModal: () => void;
  onSelectAllCerts: () => void;
}

export const GuidedWorkflowOverlay: React.FC<GuidedWorkflowOverlayProps> = ({
  workflowType,
  onCloseWorkflow,
  selectedCertCount,
  availableUsbCount,
  onOpenBackupModal,
  onOpenUsbToPcModal,
  onSelectAllCerts,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Reset steps when workflow changes
  useEffect(() => {
    if (workflowType) {
      setCurrentStep(1);
      setIsCompleted(false);

      if (workflowType === 'usb_to_pc') {
        // Automatically open USB to PC modal on step 2
        setTimeout(() => {
          onOpenUsbToPcModal();
        }, 500);
      }
    }
  }, [workflowType]);

  if (!workflowType || workflowType === 'dashboard') return null;

  const isPcToUsb = workflowType === 'pc_to_usb';

  const handleNextStep = () => {
    if (currentStep < 3) {
      const next = currentStep + 1;
      setCurrentStep(next);

      if (isPcToUsb && next === 2) {
        onOpenBackupModal();
      } else if (!isPcToUsb && next === 2) {
        onOpenUsbToPcModal();
      } else if (next === 3) {
        setIsCompleted(true);
        playSuccessChime();
      }
    } else {
      onCloseWorkflow();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <>
      {/* Spotlight CSS animation styles injected */}
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(37, 99, 235, 0); }
          100% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes pulseEmeraldRing {
          0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .guided-spotlight-active {
          animation: pulseRing 2s infinite ease-in-out;
          border-radius: 1rem;
          z-index: 30;
        }
        .guided-spotlight-emerald {
          animation: pulseEmeraldRing 2s infinite ease-in-out;
          border-radius: 1rem;
          z-index: 30;
        }
      `}</style>

      {/* Floating Guided Workflow Controller Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-slideUp">
        <div className={`p-4 rounded-2xl shadow-2xl border text-white backdrop-blur-md transition-all ${
          isPcToUsb 
            ? 'bg-slate-900/95 border-blue-500/50 shadow-blue-900/30' 
            : 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-900/30'
        }`}>
          {/* Top Bar: Title & Step Indicators */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isPcToUsb ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                  isPcToUsb ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {isPcToUsb ? 'PC ➔ USB 가이드 모션' : 'USB ➔ PC 가이드 모션'}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  [{currentStep}/3 단계]
                </span>
              </div>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center transition-all ${
                    step === currentStep
                      ? `w-7 h-7 rounded-lg font-bold text-xs ${isPcToUsb ? 'bg-blue-600 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm'}`
                      : step < currentStep
                      ? 'w-6 h-6 rounded-md bg-slate-800 text-emerald-400 font-bold text-xs'
                      : 'w-6 h-6 rounded-md bg-slate-800 text-slate-500 text-xs'
                  }`}
                >
                  {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
              ))}

              <button
                type="button"
                onClick={onCloseWorkflow}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
                title="가이드 모션 종료"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Middle Body: Step Guidance Text */}
          <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isPcToUsb ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isPcToUsb ? <Monitor className="w-5 h-5" /> : <Usb className="w-5 h-5" />}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {isPcToUsb ? (
                    currentStep === 1 ? '1단계: 컴퓨터 저장 인증서 선택' :
                    currentStep === 2 ? '2단계: 백업 대상 USB 지정' :
                    '3단계: SHA-256 무결성 안전 복사 완료'
                  ) : (
                    currentStep === 1 ? '1단계: 연결된 USB 매체 감지' :
                    currentStep === 2 ? '2단계: USB 내 인증서 선택' :
                    '3단계: PC(AppData) 보관함 복사 완료'
                  )}
                </h4>

                <p className="text-xs text-slate-300 font-normal leading-relaxed mt-0.5">
                  {isPcToUsb ? (
                    currentStep === 1 ? `목록에서 복사할 인증서를 클릭하세요 (현재 ${selectedCertCount}개 선택됨).` :
                    currentStep === 2 ? `인증서를 저장할 이동식 USB 드라이브를 지정하세요 (연결된 USB ${availableUsbCount}개).` :
                    '체크섬 비교를 거쳐 복사본의 무결성이 확인되었습니다.'
                  ) : (
                    currentStep === 1 ? `PC에 연결된 USB 메모리를 자동으로 인식하고 있습니다 (${availableUsbCount}개 감지됨).` :
                    currentStep === 2 ? 'USB 내부의 인증서를 선택하여 PC로 가져오기를 실행하세요.' :
                    '로컬 PC의 AppData\\LocalLow\\NPKI 보관함으로 안전하게 등록되었습니다.'
                  )}
                </p>
              </div>
            </div>

            {/* Quick Helper Action Buttons inside Controller */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={onCloseWorkflow}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700 cursor-pointer"
                title="가이드 모션 종료"
              >
                닫기
              </button>

              {currentStep === 1 && isPcToUsb && (
                <button
                  type="button"
                  onClick={onSelectAllCerts}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700 cursor-pointer"
                >
                  전체 선택
                </button>
              )}

              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="이전 단계"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                  isPcToUsb
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                <span>{currentStep === 3 ? '가이드 완료' : '다음 단계'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
