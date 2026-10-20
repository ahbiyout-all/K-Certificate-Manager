import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  Lock,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FolderSync,
  Wrench,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { ErrorCategory, UserErrorInfo } from '../utils/userFriendlyError';

export interface CopyErrorContext {
  title?: string;
  summary?: string;
  category?: ErrorCategory;
  solutions?: string[];
  technicalDetail?: string;
  driveLetter?: string;
  driveName?: string;
  direction?: 'PC_TO_USB' | 'USB_TO_PC';
  failedCount?: number;
  certNames?: string[];
}

interface CopyErrorAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorInfo: CopyErrorContext | null;
  onRetry?: () => void;
  onChangeTargetDrive?: () => void;
}

export const CopyErrorAlertModal: React.FC<CopyErrorAlertModalProps> = ({
  isOpen,
  onClose,
  errorInfo,
  onRetry,
  onChangeTargetDrive,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);

  if (!isOpen || !errorInfo) return null;

  const category = errorInfo.category || 'GENERAL';

  // Category specific banners and titles
  const getCategoryConfig = () => {
    switch (category) {
      case 'WRITE_PROTECTED':
        return {
          badge: '쓰기 금지 (Write-Protected)',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
          headerBg: 'from-rose-600 via-rose-700 to-rose-900',
          icon: <Lock className="w-6 h-6 text-white" />,
          title: 'USB 드라이브 쓰기 금지(Lock) 보호 감지',
          sub: 'USB 메모리가 물리적 스위치 또는 보안 정책에 의해 잠겨 있어 인증서를 저장할 수 없습니다.',
        };
      case 'PERMISSION_DENIED':
        return {
          badge: '접근 권한 거부 (Permission Denied)',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          headerBg: 'from-amber-600 via-amber-700 to-red-800',
          icon: <ShieldAlert className="w-6 h-6 text-white" />,
          title: '드라이브/폴더 파일 쓰기 권한 부족',
          sub: '브라우저 보안 샌드박스 또는 시스템 권한으로 인해 해당 폴더에 파일 생성이 차단되었습니다.',
        };
      case 'DISK_FULL':
        return {
          badge: '저장 공간 부족 (Disk Full)',
          badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
          headerBg: 'from-orange-600 via-amber-700 to-rose-800',
          icon: <HardDrive className="w-6 h-6 text-white" />,
          title: '대상 디스크 저장 공간 부족',
          sub: '대상 드라이브의 남은 용량이 부족하여 인증서 파일(signCert.der / signPri.key)을 기록하지 못했습니다.',
        };
      case 'DISCONNECTED':
        return {
          badge: '장치 통신 단절 (I/O Error)',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          headerBg: 'from-red-600 via-rose-700 to-slate-900',
          icon: <AlertOctagon className="w-6 h-6 text-white" />,
          title: 'USB 메모리 연결 해제 및 I/O 장치 오류',
          sub: '인증서 복사 작업 도중 USB 메모리 통신이 일시적으로 끊겼거나 하드웨어 접촉 불량이 발생했습니다.',
        };
      default:
        return {
          badge: '쓰기 오류 (Write Error)',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          headerBg: 'from-rose-700 via-red-800 to-slate-900',
          icon: <AlertOctagon className="w-6 h-6 text-white" />,
          title: errorInfo.title || '인증서 복사 중 드라이브 쓰기 오류 발생',
          sub: errorInfo.summary || '인증서 파일을 대상 드라이브에 저장하는 도중 오류가 발생하여 복사가 중단되었습니다.',
        };
    }
  };

  const config = getCategoryConfig();

  const handleCopyTechnicalLog = () => {
    const logContent = `[K-인증서 매니저 복사 오류 리포트]
오류 유형: ${config.badge}
제목: ${config.title}
요약: ${errorInfo.summary || config.sub}
대상 드라이브: ${errorInfo.driveLetter || '미지정'} (${errorInfo.driveName || '알 수 없음'})
작업 방향: ${errorInfo.direction === 'USB_TO_PC' ? 'USB -> PC' : 'PC -> USB'}
영향 인증서: ${errorInfo.failedCount ?? 1}건
상세 정보: ${errorInfo.technicalDetail || '없음'}
발생 시간: ${new Date().toLocaleString('ko-KR')}`;

    navigator.clipboard.writeText(logContent).then(() => {
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
    });
  };

  const defaultSolutions = [
    'USB 메모리 측면의 물리 Lock 스위치가 UNLOCK 위치에 있는지 확인하세요.',
    '브라우저 상단 주소창 좌측의 설정/자물쇠 아이콘을 눌러 [파일 시스템 권한]을 "허용"으로 변경하세요.',
    '컴퓨터 본체의 다른 USB 포트(특히 본체 뒷면 포트)에 다시 꽂아보세요.',
    '다른 정상 USB 드라이브 또는 외장 하드를 대상 디스크로 선택하세요.',
  ];

  const solutionsToRender = errorInfo.solutions && errorInfo.solutions.length > 0
    ? errorInfo.solutions
    : defaultSolutions;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border-2 border-rose-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Warning Header */}
        <div className={`px-6 py-5 bg-gradient-to-r ${config.headerBg} text-white flex items-center justify-between shrink-0 shadow-md`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${config.badgeColor} bg-white shadow-2xs`}>
                  {config.badge}
                </span>
                <span className="text-[11px] text-white/80 font-medium">
                  {errorInfo.direction === 'USB_TO_PC' ? 'USB ➔ PC 전송 중' : 'PC ➔ USB 백업 중'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold leading-tight text-white drop-shadow-xs">
                {config.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700">
          
          {/* Target Drive & Context Strip */}
          <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 font-medium">대상 위치: </span>
                <strong className="text-rose-950 font-bold">
                  {errorInfo.driveLetter ? `${errorInfo.driveLetter} (${errorInfo.driveName || '이동식 디스크'})` : '선택된 대상 드라이브'}
                </strong>
              </div>
            </div>

            {errorInfo.failedCount !== undefined && errorInfo.failedCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 bg-rose-200/80 text-rose-900 rounded font-semibold shrink-0">
                인증서 {errorInfo.failedCount}건 복사 차단됨
              </span>
            )}
          </div>

          {/* Primary Error Summary Notice */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-1.5 shadow-xs">
            <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>오류 원인 요약</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              {errorInfo.summary || config.sub}
            </p>
          </div>

          {/* Actionable Step-by-Step Resolution Guide */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>권장 해결 조치 방법 (아래 항목을 확인 후 다시 시도하세요):</span>
              </h4>
            </div>

            <div className="space-y-2">
              {solutionsToRender.map((solution, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 text-xs text-slate-800 flex items-start gap-2.5 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 shadow-2xs">
                    {idx + 1}
                  </span>
                  <div className="flex-1 leading-relaxed font-medium">
                    {solution}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Diagnostics Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full px-4 py-2.5 bg-slate-100/70 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>기술적 오류 로그 및 진단 코드 확인</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-normal">
                  {showTechnicalDetails ? '접기' : '상세보기'}
                </span>
                {showTechnicalDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            {showTechnicalDetails && (
              <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] space-y-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400 font-sans">
                  <span>오류 발생 시각: {new Date().toLocaleTimeString('ko-KR')}</span>
                  <button
                    type="button"
                    onClick={handleCopyTechnicalLog}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedLog ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>오류 내용 복사</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-rose-400 break-all leading-relaxed">
                  {errorInfo.technicalDetail || errorInfo.summary || '상세 시스템 메시지가 없습니다.'}
                </div>

                {errorInfo.certNames && errorInfo.certNames.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-slate-400 text-[10px]">
                    <span className="text-slate-500">실패 대상 인증서 목록: </span>
                    <span className="text-slate-300">{errorInfo.certNames.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 self-start sm:self-auto">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>원인을 해결한 후 아래 [다시 시도]를 누르시면 이어서 복사됩니다.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onChangeTargetDrive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangeTargetDrive();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <FolderSync className="w-3.5 h-3.5 text-blue-600" />
                <span>다른 드라이브 선택</span>
              </button>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-100" />
                <span>다시 시도</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
