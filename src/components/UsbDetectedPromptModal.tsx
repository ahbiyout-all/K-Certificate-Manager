import React from 'react';
import { 
  HardDrive, 
  ArrowDownLeft, 
  X, 
  ShieldCheck, 
  FileKey, 
  CheckCircle2, 
  Sparkles,
  Info,
  Laptop
} from 'lucide-react';
import { DiskDrive } from '../types';
import { UsbDetectedCert } from '../utils/usbToPcService';

interface UsbDetectedPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  drive: DiskDrive | null;
  detectedCerts: UsbDetectedCert[];
  onOpenUsbToPcModal: () => void;
}

export const UsbDetectedPromptModal: React.FC<UsbDetectedPromptModalProps> = ({
  isOpen,
  onClose,
  drive,
  detectedCerts,
  onOpenUsbToPcModal,
}) => {
  if (!isOpen || !drive || detectedCerts.length === 0) return null;

  const handleStartCopy = () => {
    onClose();
    onOpenUsbToPcModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  인증서 포함 USB 드라이브 감지
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full font-bold">
                  자동 인식
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {drive.letter} ({drive.name})에 보관된 인증서가 발견되었습니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Main Action Callout Banner */}
          <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <ArrowDownLeft className="w-4 h-4 text-blue-600" />
              <span>'컴퓨터로 인증서 복사' 작업 안내</span>
            </div>
            <p className="text-xs text-blue-950 leading-relaxed">
              연결된 USB 내에 <strong className="text-blue-700 font-bold">{detectedCerts.length}건</strong>의 공인/행정 인증서가 존재합니다. 
              <strong> '컴퓨터로 인증서 복사'</strong>를 진행하면 PC 로컬(AppData\LocalLow)에 등록되어 USB 없이도 인터넷뱅킹 및 정부24를 바로 이용할 수 있습니다.
            </p>
          </div>

          {/* List of Detected Certificates in USB */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                <span>USB 내 감지된 인증서 ({detectedCerts.length}건)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                위치: {drive.letter}\
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {detectedCerts.map(cert => (
                <div 
                  key={cert.id}
                  className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileKey className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">{cert.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                          {cert.category === 'GPKI_GOV' ? '공무원(GPKI)' : cert.category === 'EPKI_EDU' ? '교육(EPKI)' : '은행(NPKI)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        발급: {cert.issuer} (만료: {cert.validTo})
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold shrink-0">
                    유효
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Guidance Info Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-slate-600" />
              <span>작업 후 이용 안내:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-0.5">
              <li>인터넷뱅킹 / 홈택스 로그인 시 <strong>[하드디스크]</strong>를 선택하면 즉시 인식됩니다.</li>
              <li>정부24 / K-에듀파인 / 온-나라에서 <strong>[공무원/교육 인증서]</strong>로 즉시 서명 가능합니다.</li>
              <li>USB의 원본 인증서 파일은 삭제되지 않고 안전하게 유지됩니다.</li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              나중에 하기
            </button>

            <button
              type="button"
              onClick={handleStartCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>'컴퓨터로 인증서 복사' 작업 열기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
