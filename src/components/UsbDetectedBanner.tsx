import React from 'react';
import { HardDrive, ArrowDownLeft, Sparkles, X, ChevronRight, FileKey } from 'lucide-react';
import { DiskDrive } from '../types';
import { UsbDetectedCert } from '../utils/usbToPcService';

interface UsbDetectedBannerProps {
  detectedCerts: UsbDetectedCert[];
  availableDrives: DiskDrive[];
  onOpenUsbToPcModal: () => void;
  onDismiss?: () => void;
}

export const UsbDetectedBanner: React.FC<UsbDetectedBannerProps> = ({
  detectedCerts,
  availableDrives,
  onOpenUsbToPcModal,
  onDismiss,
}) => {
  if (detectedCerts.length === 0) return null;

  const usbLetters = Array.from(new Set(detectedCerts.map(c => c.usbDriveLetter))).join(', ');

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-emerald-500/40 relative overflow-hidden animate-fadeIn">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-white">
                인증서가 들어 있는 USB 감지됨 ({usbLetters})
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full text-[11px] font-bold">
                {detectedCerts.length}건 보관 중
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              연결된 이동식 디스크에서 인증서가 확인되었습니다. PC 로컬 보관함(AppData\LocalLow)에 등록하려면 
              <strong className="text-emerald-300 font-bold ml-1">'컴퓨터로 인증서 복사'</strong>를 진행하세요.
            </p>

            {/* Quick Chips of cert names */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {detectedCerts.slice(0, 3).map(c => (
                <span 
                  key={c.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-[10px] font-medium transition-colors"
                >
                  <FileKey className="w-3 h-3 text-emerald-300" />
                  <span>{c.name}</span>
                  <span className="text-slate-300">({c.category === 'GPKI_GOV' ? '공무원' : '은행'})</span>
                </span>
              ))}
              {detectedCerts.length > 3 && (
                <span className="text-[10px] text-slate-300 font-medium">
                  외 {detectedCerts.length - 3}건
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            onClick={onOpenUsbToPcModal}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>'컴퓨터로 인증서 복사' 작업 열기</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
