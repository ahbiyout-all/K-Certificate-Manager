import React, { useState, useMemo } from 'react';
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
  validPcCerts?: any[];
}

export const StartupWorkflowModal: React.FC<StartupWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSelectWorkflow,
  dontShowAgain = false,
  onToggleDontShowAgain,
  validPcCerts = [],
}) => {
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
                    컴퓨터(AppData)에 보관된 유효한 공인인증서만 자동으로 필터링하여 USB 메모리로 안전하게 복사/백업합니다.
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

          {/* Detected Valid PC Certificates Table with Horizontal & Vertical Grid Lines & Resizable Headers */}
          {validPcCerts && validPcCerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">
                    💻 내 컴퓨터(C:) 기본 보관함의 유효 인증서 ({validPcCerts.length}개 감지)
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
