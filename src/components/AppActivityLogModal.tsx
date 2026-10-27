import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  Database,
  SlidersHorizontal,
  ExternalLink,
  Shield,
  ShieldAlert,
  Key,
  Folder,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AppLogItem, AppLogCategory, AppLogLevel } from '../types';
import { exportActivityLogsAsFile } from '../utils/activityLogger';

interface AppActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AppLogItem[];
  onClearLogs: () => void;
}

export const AppActivityLogModal: React.FC<AppActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const toggleEvidence = (logId: string) => {
    setExpandedEvidenceIds(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const handleCopyText = (keyId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const evidenceCount = useMemo(() => {
    return logs.filter(l => l.deletionEvidence && l.deletionEvidence.length > 0).length;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedCategory === 'EVIDENCE') {
        if (!log.deletionEvidence || log.deletionEvidence.length === 0) return false;
      } else if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      if (selectedLevel !== 'ALL' && log.level !== selectedLevel) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesDetails = log.details.toLowerCase().includes(query);
        const matchesSource = log.source?.toLowerCase().includes(query) || false;
        const matchesTarget = log.target?.toLowerCase().includes(query) || false;
        const matchesEvidence = log.deletionEvidence?.some(ev => 
          ev.name.toLowerCase().includes(query) ||
          ev.subjectDn.toLowerCase().includes(query) ||
          ev.sourceLocation.toLowerCase().includes(query) ||
          ev.serialNumber.toLowerCase().includes(query)
        ) || false;
        return matchesAction || matchesDetails || matchesSource || matchesTarget || matchesEvidence;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedLevel, searchQuery]);

  if (!isOpen) return null;

  const getCategoryBadge = (category: AppLogCategory, hasEvidence?: boolean) => {
    if (hasEvidence) {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-300 rounded flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
          <span>보안 삭제 증적</span>
        </span>
      );
    }
    switch (category) {
      case 'BACKUP':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded">PC➔USB 백업</span>;
      case 'IMPORT':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded">USB➔PC 넣기</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-800 rounded">삭제/휴지통</span>;
      case 'RESTORE':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded">복구/Undo</span>;
      case 'SCAN':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-800 rounded">디스크 탐색</span>;
      case 'SYSTEM':
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded">시스템/환경</span>;
    }
  };

  const getLevelIcon = (level: AppLogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const handleExport = () => {
    exportActivityLogsAsFile(logs);
  };

  const categories = [
    { key: 'ALL', label: '전체' },
    { key: 'EVIDENCE', label: `🛡️ 보안 삭제 증적${evidenceCount > 0 ? ` (${evidenceCount})` : ''}` },
    { key: 'BACKUP', label: 'PC➔USB 백업' },
    { key: 'IMPORT', label: 'USB➔PC 넣기' },
    { key: 'DELETE', label: '인증서 삭제' },
    { key: 'RESTORE', label: '휴지통 복원' },
    { key: 'SCAN', label: '디스크 탐색' },
    { key: 'SYSTEM', label: '시스템' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">앱 작업 및 감사 로그 (Activity Log)</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  총 {logs.length}건 기록
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                인증서 스캔, USB 복사, 역방향 가져오기, 삭제, 복구 작업의 실시간 로그를 열람하고 파일로 저장합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="로그를 .log 텍스트 파일로 저장합니다"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>로그 다운로드 (.log)</span>
            </button>

            <button
              type="button"
              onClick={onClearLogs}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="기록된 모든 로그를 비웁니다"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>로그 비우기</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="액션, 인증서명, 경로 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logs Feed Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">해당 조건의 작업 로그가 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">필터 조건을 재설정하거나 새로운 작업을 실행해 보세요.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const hasEvidence = Boolean(log.deletionEvidence && log.deletionEvidence.length > 0);
              const isExpanded = Boolean(expandedEvidenceIds[log.id]);

              return (
                <div
                  key={log.id}
                  className={`bg-white p-3.5 rounded-xl border shadow-xs transition-all text-xs ${
                    hasEvidence ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {getLevelIcon(log.level)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{log.action}</span>
                          {getCategoryBadge(log.category, hasEvidence)}
                          {log.count !== undefined && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-600 rounded">
                              {log.count}건
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">{log.details}</p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {log.timestamp}
                    </span>
                  </div>

                  {/* Source and Target Path Badges if exist */}
                  {(log.source || log.target) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                      {log.source && (
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-xs">
                          출처: {log.source}
                        </span>
                      )}
                      {log.source && log.target && (
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      {log.target && (
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-xs text-slate-700 font-medium">
                          대상: {log.target}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Secure Deletion Audit Evidence Bar & Expandable Panel */}
                  {hasEvidence && log.deletionEvidence && (
                    <div className="mt-3 pt-2.5 border-t border-rose-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleEvidence(log.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>
                            {isExpanded ? '보안 삭제 증적 접기' : `보안 삭제 증적 로그 상세 보기 (${log.deletionEvidence.length}건)`}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[11px] text-slate-400 font-medium">
                          인증서 고유 식별자(SubjectDN) 및 상세 경로 영구 소멸 증적 보존
                        </span>
                      </div>

                      {/* Expanded Evidence Audit Box */}
                      {isExpanded && (
                        <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-rose-400" />
                              <span className="font-bold text-xs text-white">보안 삭제 감사 증적 (Secure Deletion Audit Record)</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                              영구 소멸 증적 {log.deletionEvidence.length}건
                            </span>
                          </div>

                          <div className="space-y-3">
                            {log.deletionEvidence.map((ev, idx) => {
                              const dnKey = `dn-${log.id}-${idx}`;
                              const pathKey = `path-${log.id}-${idx}`;

                              return (
                                <div key={ev.certId || idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2.5">
                                  <div className="flex items-center justify-between flex-wrap gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                                        {idx + 1}
                                      </span>
                                      <strong className="text-white text-xs">{ev.name}</strong>
                                      <span className="text-[11px] text-slate-400">({ev.issuer})</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">{ev.deletedAt}</span>
                                  </div>

                                  {/* SubjectDN with quick copy */}
                                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                                        <Key className="w-3 h-3 text-rose-400" />
                                        <span>인증서 고유 식별자 (SubjectDN)</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(dnKey, ev.subjectDn)}
                                        className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                        title="SubjectDN 클립보드 복사"
                                      >
                                        {copiedKeyId === dnKey ? (
                                          <>
                                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">복사됨</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-2.5 h-2.5" />
                                            <span>복사</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-200 break-all select-all leading-relaxed bg-slate-950 p-1.5 rounded border border-slate-800/60">
                                      {ev.subjectDn}
                                    </div>
                                  </div>

                                  {/* Detailed File Path with quick copy */}
                                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                        <Folder className="w-3 h-3 text-amber-400" />
                                        <span>삭제된 파일 상세 경로 (Purged Storage Path)</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(pathKey, ev.sourceLocation)}
                                        className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                        title="경로 클립보드 복사"
                                      >
                                        {copiedKeyId === pathKey ? (
                                          <>
                                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">복사됨</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-2.5 h-2.5" />
                                            <span>복사</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="text-[11px] font-mono text-amber-200/90 break-all select-all bg-slate-950 p-1.5 rounded border border-slate-800/60">
                                      {ev.sourceLocation}
                                    </div>
                                  </div>

                                  {/* Purged Files & Metadata */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                                    <div className="text-slate-400">
                                      <span className="text-slate-500">소멸 파일: </span>
                                      <span className="font-mono text-slate-200 font-semibold">{ev.fileList.join(', ')}</span>
                                    </div>
                                    <div className="text-slate-400">
                                      <span className="text-slate-500">일련번호: </span>
                                      <span className="font-mono text-slate-300">{ev.serialNumber}</span>
                                    </div>
                                    {ev.sha256 && (
                                      <div className="text-slate-400 sm:col-span-2 truncate">
                                        <span className="text-slate-500">SHA-256 지문: </span>
                                        <span className="font-mono text-slate-400">{ev.sha256}</span>
                                      </div>
                                    )}
                                    <div className="text-slate-400 sm:col-span-2">
                                      <span className="text-slate-500">처리 방식: </span>
                                      <span className="text-rose-300 font-medium">{ev.permanentMethod}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>로컬 스토리지에 안전하게 보관되며 최대 250건까지 유지됩니다.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer self-end"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
