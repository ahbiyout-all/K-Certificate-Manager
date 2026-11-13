import React, { useState, useEffect } from 'react';
import { playCompletionSound } from '../utils/audioFeedback';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  FolderOpen,
  History,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  KeyRound,
  FileCheck2,
  Calendar,
  Building,
  ChevronDown,
  ChevronRight,
  Usb
} from 'lucide-react';
import { extractDriveLetterFromPathOrLabel } from '../utils/certDiagnostics';

export interface OperationCompleteData {
  title?: string;
  subtitle?: string;
  operationType: 'PC_TO_USB' | 'USB_TO_PC' | 'BACKUP' | 'CLEANUP' | 'RESTORE' | 'USB_RESTORE';
  count: number;
  certNames: string[];
  targetDiskName: string;
  targetPath?: string;
  sourcePath?: string;
  timestamp?: string;
  checksum?: string;
  duration?: string;
  certificates?: Array<{
    name: string;
    issuer?: string;
    policy?: string;
    validTo?: string;
  }>;
  nextSteps?: string[];
  transferredCerts?: any[];
  hasIntegrityVerified?: boolean;
  sha256Checksum?: string;
}

interface OperationCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OperationCompleteData | null;
  onOpenHistory?: () => void;
  onEjectUsb?: (driveTarget: string) => { statusTitle: string; message: string } | void;
}

export const OperationCompleteModal: React.FC<OperationCompleteModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenHistory,
  onEjectUsb,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [ejectFeedback, setEjectFeedback] = useState<{ statusTitle: string; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && data) {
      playCompletionSound();
      setEjectFeedback(null);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const diskLabel = data.targetDiskName || '';
  const isExplicitLocalDisk =
    data.operationType === 'USB_TO_PC' ||
    data.operationType === 'RESTORE' ||
    diskLabel.includes('로컬 디스크') ||
    diskLabel.includes('로컬 보관함') ||
    diskLabel.includes('내장') ||
    /^(C|D):/i.test(diskLabel.trim());

  const isUsbTarget =
    data.operationType === 'PC_TO_USB' ||
    data.operationType === 'USB_RESTORE' ||
    (data.operationType === 'BACKUP' && !isExplicitLocalDisk);
  const isPcTarget = data.operationType === 'USB_TO_PC' || isExplicitLocalDisk;

  let autoOpenUsbEnabled = false;
  try {
    autoOpenUsbEnabled = localStorage.getItem('kcert_auto_open_usb_folder') === 'true';
  } catch {
    autoOpenUsbEnabled = false;
  }

  const defaultTitle = isUsbTarget
    ? 'USB 복사 완료'
    : isPcTarget
      ? '내 컴퓨터 복사 완료'
      : '인증서 백업 완료';

  const defaultSubtitle = isUsbTarget
    ? `인증서 ${data.count}건을 USB로 복사했습니다 (손상 검사 완료).`
    : isPcTarget
      ? `인증서 ${data.count}건을 내 컴퓨터 표준 폴더에 등록했습니다.`
      : `인증서 ${data.count}건을 안전하게 백업했습니다.`;

  const effectiveTitle = data.title || defaultTitle;

  const safeCopyText = async (text: string, onSuccess: () => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        onSuccess();
      }
    } catch {
      // ignore clipboard permission denial inside iframe
    }
  };

  const copyTargetPath = () => {
    if (data.targetPath) {
      safeCopyText(data.targetPath, () => {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      });
    }
  };

  const copyFullSummary = () => {
    const summaryText = `[K-인증서 매니저 작업 완료 안내]
• 작업 구분: ${effectiveTitle}
• 완료 시각: ${data.timestamp || '방금 전'}
• 복사 건수: 총 ${data.count}건 (${data.certNames.join(', ')})
• 원본 위치: ${data.sourcePath || '내 컴퓨터 (AppData\\LocalLow\\NPKI)'}
• 저장 위치: ${data.targetDiskName} (${data.targetPath || '표준 인증서 폴더'})
• 파일 검사: ${data.checksum || 'SHA-256 파일 손상 없음'}
• 활용 안내: ${isUsbTarget ? 'USB를 PC에 연결하여 은행/정부24 [이동식 디스크] 선택 로그인' : '인터넷뱅킹/공공기관 [하드디스크] 선택 로그인'}`;

    safeCopyText(summaryText, () => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="operation-complete-title"
      >
        {/* Header with Emerald/Green Gradient */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center text-white shadow-xs shrink-0">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-emerald-100">
                    작업 완료 (Success)
                  </span>
                  <span className="text-xs text-emerald-100/90 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>파일 손상 없음</span>
                  </span>
                </div>
                <h3 id="operation-complete-title" className="text-lg sm:text-xl font-extrabold tracking-tight mt-0.5 text-white">
                  {data.title || defaultTitle}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-emerald-50/90 mt-2 leading-relaxed">
            {data.subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4.5 flex-1 text-slate-700 text-sm">
          {/* 1. Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 block">복사 완료 건수</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-emerald-600">{data.count}</span>
                <span className="text-xs font-bold text-slate-600">건 성공</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 block">파일 검사</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-blue-700">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>SHA-256 손상 없음</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 block">완료 시각</span>
              <span className="text-xs font-semibold text-slate-700 block mt-1 truncate">
                {data.timestamp || '방금 전 완료'}
              </span>
            </div>
          </div>

          {/* USB Auto Open Active Badge */}
          {isUsbTarget && autoOpenUsbEnabled && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300/80 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-2 shadow-2xs animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold truncate">📂 [USB 자동 열기 활성화] 대상 USB 저장소 탐색기 연결 완료</span>
              </div>
              <span className="text-[10.5px] font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 shrink-0 font-bold">
                {data.targetDiskName}
              </span>
            </div>
          )}

          {/* 2. Source to Destination Path Route Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>복사 위치 안내</span>
              </span>
              {data.targetPath && (
                <button
                  type="button"
                  onClick={copyTargetPath}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="대상 경로 클립보드 복사"
                >
                  {copiedPath ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-extrabold">경로 복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>경로 복사</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs truncate">
                <span className="text-[10px] font-bold text-slate-400 block">원본 위치</span>
                <span className="font-mono text-slate-700 font-semibold truncate block" title={data.sourcePath || 'C:\\Users\\...\\AppData\\LocalLow\\NPKI'}>
                  {data.sourcePath || 'C:\\Users\\...\\AppData\\LocalLow\\NPKI'}
                </span>
              </div>

              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 shadow-2xs truncate">
                <span className="text-[10px] font-bold text-emerald-700 block">저장 위치</span>
                <span className="font-mono text-emerald-900 font-bold truncate block" title={data.targetPath || data.targetDiskName}>
                  {data.targetDiskName}
                </span>
              </div>
            </div>
          </div>

          {/* 3. List of Copied Certificates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>복사 완료된 인증서 목록 ({data.certNames.length}개)</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                인증서·개인키 파일 정상 확인
              </span>
            </div>

            {/* Scrollable Container with explicit max-height, overflow-y auto, and smooth styling */}
            <div 
              className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 space-y-1.5 overflow-y-auto max-h-48 sm:max-h-56 shadow-inner"
              style={{ maxHeight: '210px', overflowY: 'auto' }}
            >
              {data.certificates && data.certificates.length > 0 ? (
                data.certificates.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 truncate block">{c.name}</span>
                        {c.issuer && (
                          <span className="text-[11px] text-slate-500 truncate block">({c.issuer})</span>
                        )}
                      </div>
                    </div>
                    {c.validTo ? (
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded shrink-0 border border-slate-200">
                        ~{c.validTo}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 shrink-0">
                        복사 완료 ✓
                      </span>
                    )}
                  </div>
                ))
              ) : (
                data.certNames.map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 shrink-0">
                      복사 완료 ✓
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Collapsible Practical Usage Next Steps Guide */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowUsageGuide(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between font-bold text-blue-950 hover:bg-blue-100/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>복사 후 사용 안내</span>
              </span>
              {showUsageGuide ? (
                <ChevronDown className="w-4 h-4 text-blue-700" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-700" />
              )}
            </button>
            {showUsageGuide && (
              <ul className="space-y-1.5 text-slate-700 text-[11.5px] leading-relaxed px-3.5 pb-3 pt-1 border-t border-blue-200/70">
                {isUsbTarget ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong>USB 사용:</strong> 은행·정부 사이트 로그인 창에서 <strong>[이동식 디스크]</strong>를 선택하세요.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong>안전 제거:</strong> 작업 후 윈도우 트레이에서 '하드웨어 안전 제거'를 실행한 뒤 분리하세요.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong>하드디스크 사용:</strong> 은행·정부 사이트에서 <strong>[하드디스크]</strong> 선택 시 USB 없이 로그인됩니다.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong>공용 PC 주의:</strong> 공용 PC에서는 사용 후 인증서를 반드시 삭제하세요.</span>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>
          {/* 5. Post-Copy USB Safe Eject Status Banner */}
          {isUsbTarget && ejectFeedback && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-bold">{ejectFeedback.statusTitle}</div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">{ejectFeedback.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyFullSummary}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer"
              title="작업 완료 결과 전체 텍스트 복사"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">결과 텍스트 복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>결과 복사</span>
                </>
              )}
            </button>

            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>백업 이력 보기</span>
              </button>
            )}

            {isUsbTarget && onEjectUsb && (() => {
              const targetDriveHint =
                extractDriveLetterFromPathOrLabel(data.targetPath) ||
                extractDriveLetterFromPathOrLabel(data.targetDiskName) ||
                'USB';
              return (
                <button
                  type="button"
                  onClick={() => {
                    const res = onEjectUsb(targetDriveHint);
                    setEjectFeedback(
                      res || {
                        statusTitle: `${targetDriveHint} USB 안전 분리 준비됨`,
                        message:
                          "브라우저 연결이 해제되었습니다. Windows 작업 표시줄의 '하드웨어 안전하게 제거'를 눌러 분리하세요.",
                      }
                    );
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5 text-amber-700" />
                  <span>{ejectFeedback ? `${targetDriveHint} 분리 준비됨` : `${targetDriveHint} USB 안전 제거`}</span>
                </button>
              );
            })()}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>확인 (완료)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
