import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  FolderTree, 
  FileKey,
  KeyRound,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [showFolderStructure, setShowFolderStructure] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                인증서 보안 수칙
              </h3>
              <p className="text-xs text-slate-400">
                공무원(GPKI)·은행(NPKI) 인증서 안전 보관 안내
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

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700">
          {/* Privacy Guarantee Box */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3 text-emerald-900">
            <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-0.5 text-emerald-950">
                외부 서버 전송 없음 (100% 내 기기 처리)
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                인증서(<code className="font-mono font-bold">signCert.der</code>)와 개인키(<code className="font-mono font-bold">signPri.key</code>)는 외부로 전송되지 않으며, 검사·복사는 모두 내 브라우저 안에서만 실행됩니다.
              </p>
            </div>
          </div>

          {/* Section 1: GPKI Government Certificate Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FileKey className="w-4 h-4 text-blue-600" />
              1. 공무원·교육 인증서 (GPKI · EPKI)
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>보안 USB 보관 권장:</strong> 공용 PC 하드디스크에 남기지 말고 이동식 USB에 담아 사용하세요.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>퇴근·이석 시 USB 분리:</strong> 사용 후 USB를 분리해 잠금장치 있는 곳에 보관하세요.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>분실·유출 시 즉시 폐기:</strong> <a href="https://www.gpki.go.kr" target="_blank" rel="noreferrer" className="text-blue-600 underline">행정전자서명인증센터(1544-6720)</a>에 폐기를 신청하세요.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Banking NPKI Certificate Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              2. 은행·공동 인증서 (NPKI)
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed">
              <p>
                PC 기본 폴더(<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">AppData\LocalLow\NPKI</code>)보다 USB에 보관하면 악성코드 유출 위험을 줄일 수 있습니다.
              </p>
            </div>
          </div>

          {/* Section 3: Collapsible USB Folder Structure Standard */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setShowFolderStructure(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between font-bold text-slate-900 text-xs sm:text-sm hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-600" />
                <span>3. USB 표준 폴더 구조 보기</span>
              </span>
              {showFolderStructure ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {showFolderStructure && (
              <div className="p-3.5 bg-slate-900 text-slate-200 font-mono text-xs space-y-1.5 overflow-x-auto border-t border-slate-200">
                <div className="text-slate-400 font-sans text-[11px] mb-1">
                  ※ USB 최상위 폴더에 아래 구조가 있어야 은행·정부 사이트에서 인식됩니다.
                </div>
                <div>E:\ (USB 최상위)</div>
                <div> ├── <span className="text-amber-300 font-bold">NPKI\</span> (은행·공동 인증서)</div>
                <div> │    └── yessign\USER\cn=홍길동...\</div>
                <div> │         ├── signCert.der (인증서)</div>
                <div> │         └── signPri.key  (개인키)</div>
                <div> └── <span className="text-blue-300 font-bold">GPKI\</span> (공무원 인증서)</div>
                <div>      └── Certificate\class2\cn=이영희...\</div>
                <div>           ├── SignCert.der / SignPri.key (서명용)</div>
                <div>           └── kmCert.der   / kmPri.key   (암호화용)</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
