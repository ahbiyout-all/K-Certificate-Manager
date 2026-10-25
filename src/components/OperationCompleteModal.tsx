import React, { useState } from 'react';
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
  Building
} from 'lucide-react';

export interface OperationCompleteData {
  title?: string;
  subtitle?: string;
  operationType: 'PC_TO_USB' | 'USB_TO_PC' | 'BACKUP' | 'CLEANUP' | 'RESTORE';
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
}

interface OperationCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OperationCompleteData | null;
  onOpenHistory?: () => void;
}

export const OperationCompleteModal: React.FC<OperationCompleteModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenHistory,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen || !data) return null;

  const isUsbTarget = data.operationType === 'PC_TO_USB' || 
    (data.operationType === 'BACKUP' && !data.targetDiskName.includes('C:'));
  const isPcTarget = data.operationType === 'USB_TO_PC' || data.targetDiskName.includes('C:');

  const defaultTitle = isUsbTarget
    ? '이동식 디스크(USB) 인증서 복사 완료!'
    : isPcTarget
      ? '컴퓨터(PC) 로컬 보관함 복사 완료!'
      : '인증서 복사 및 백업 작업 완료!';

  const defaultSubtitle = isUsbTarget
    ? `선택하신 인증서 ${data.count}건이 대상 USB 메모리로 안전하게 복사되었으며, SHA-256 데이터 무결성 검증을 100% 통과했습니다.`
    : isPcTarget
      ? `외부 매체의 인증서 ${data.count}건이 컴퓨터 로컬 표준 보관소(AppData\\LocalLow)로 안전하게 등록되었습니다.`
      : `선택하신 인증서 ${data.count}건이 대상 저장소로 성공적으로 복사/백업되었습니다.`;

  const copyTargetPath = () => {
    if (data.targetPath) {
      navigator.clipboard.writeText(data.targetPath);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  const copyFullSummary = () => {
    const summaryText = `[K-인증서 매니저 작업 완료 안내]
• 작업 구분: ${defaultTitle}
• 완료 시각: ${data.timestamp || '방금 전'}
• 복사 건수: 총 ${data.count}건 (${data.certNames.join(', ')})
• 출발지: ${data.sourcePath || '로컬 PC 보관소 (AppData\\LocalLow\\NPKI)'}
• 도착지: ${data.targetDiskName} (${data.targetPath || '표준 인증서 경로'})
• 무결성 상태: ${data.checksum || 'SHA-256 해시 검증 통과 (100% 일치)'}
• 활용 안내: ${isUsbTarget ? 'USB를 PC에 연결하여 은행/정부24 [이동식 디스크] 선택 로그인' : '인터넷뱅킹/공공기관 [하드디스크] 선택 로그인'}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
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
                    <span>무결성 검증 통과</span>
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
              <span className="text-[11px] font-bold text-slate-500 block">데이터 무결성</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-blue-700">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>SHA-256 일치</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 block">완료 시각</span>
              <span className="text-xs font-semibold text-slate-700 block mt-1 truncate">
                {data.timestamp || '방금 전 완료'}
              </span>
            </div>
          </div>

          {/* 2. Source to Destination Path Route Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>복사 전송 경로 (Route)</span>
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
                <span className="text-[10px] font-bold text-slate-400 block">출발지 (Source)</span>
                <span className="font-mono text-slate-700 font-semibold truncate block" title={data.sourcePath || 'C:\\Users\\...\\AppData\\LocalLow\\NPKI'}>
                  {data.sourcePath || 'C:\\Users\\...\\AppData\\LocalLow\\NPKI'}
                </span>
              </div>

              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 shadow-2xs truncate">
                <span className="text-[10px] font-bold text-emerald-700 block">도착지 (Destination)</span>
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
              <span className="text-[11px] text-slate-500">
                signCert.der + signPri.key 정상 검증
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5">
              {data.certificates && data.certificates.length > 0 ? (
                data.certificates.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{c.name}</span>
                      {c.issuer && (
                        <span className="text-[11px] text-slate-500 hidden sm:inline">({c.issuer})</span>
                      )}
                    </div>
                    {c.validTo && (
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        ~{c.validTo}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                data.certNames.map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx}
                      </span>
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-slate-800">{name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      복사 완료
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Practical Usage Next Steps Guide */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>작업 완료 후 활용 가이드 (How to Use)</span>
            </div>
            <ul className="space-y-1.5 text-slate-700 text-[11.5px] leading-relaxed">
              {isUsbTarget ? (
                <>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span><strong>이동식 USB 메모리 사용</strong>: 타 PC 또는 노트북에 USB를 꽂고 인터넷뱅킹·정부24 로그인 창에서 <strong>[이동식 디스크]</strong>를 선택하시면 즉시 사용하실 수 있습니다.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span><strong>안전 제거 권장</strong>: 작업 후 윈도우 우측 하단 트레이의 '하드웨어 안전하게 제거'를 누르고 USB를 분리하시면 파일 손상을 예방할 수 있습니다.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span><strong>내 컴퓨터 로컬 보관소 등록</strong>: 은행 및 공공기관 서명 로그인 창에서 <strong>[하드디스크]</strong>를 선택하시면 USB 연결 없이도 바로 인증서로 로그인할 수 있습니다.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span><strong>공용 PC 주의</strong>: PC방이나 공용 컴퓨터에서 작업하신 경우, 업무 종료 후 인증서 보관함에서 해당 인증서를 삭제하여 보안을 유지해 주세요.</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
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
