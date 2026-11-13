import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertTriangle, 
  Building2, 
  Phone, 
  Calendar, 
  FileKey, 
  Info, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Edit3,
  PlusCircle,
  RotateCcw,
  Search,
  Download,
  Upload,
  Settings2,
  ChevronDown
} from 'lucide-react';
import { CertificateItem } from '../types';
import { BRANDING_ASSETS } from '../data/brandingAssets';
import { RenewalInstitution, CertRenewalGroup } from '../data/renewalInstitutions';
import { 
  getAllInstitutions, 
  saveInstitution, 
  resetInstitution, 
  resetAllInstitutionsToDefault, 
  exportInstitutionsJSON, 
  importInstitutionsJSON,
  getSearchFallbackUrl,
  groupCertsWithCustomInstitutions
} from '../utils/renewalStore';
import { EditInstitutionModal } from './EditInstitutionModal';

interface RenewalGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCerts: CertificateItem[];
}

export const RenewalGuidanceModal: React.FC<RenewalGuidanceModalProps> = ({
  isOpen,
  onClose,
  selectedCerts,
}) => {
  const [institutions, setInstitutions] = useState<RenewalInstitution[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedAllText, setCopiedAllText] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Modal state for editing institution / adding custom
  const [editingInst, setEditingInst] = useState<RenewalInstitution | null>(null);
  const [isNewInst, setIsNewInst] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Settings & Import/Export Panel Toggle
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showBatchLinksPanel, setShowBatchLinksPanel] = useState(false);
  const [showFaqGuide, setShowFaqGuide] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load and reload institutions
  const refreshInstitutions = () => {
    const list = getAllInstitutions();
    setInstitutions(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshInstitutions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const groups: CertRenewalGroup[] = groupCertsWithCustomInstitutions(selectedCerts, institutions);

  const totalCerts = selectedCerts.length;
  const expiredCount = selectedCerts.filter(c => c.daysRemaining <= 0).length;
  const expiringCount = selectedCerts.filter(c => c.daysRemaining > 0 && c.daysRemaining <= 30).length;
  const validCount = selectedCerts.filter(c => c.daysRemaining > 30).length;

  // Filter groups
  const filteredGroups = groups.filter(g => {
    if (categoryFilter === 'ALL') return true;
    return g.institution.orgCategory === categoryFilter;
  });

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedUrl(id);
        setTimeout(() => setCopiedUrl(null), 2000);
      }
    } catch {
      // ignore clipboard error in restricted iframe
    }
  };

  const uniquePortalInstitutions = Array.from(
    new Map(groups.map(g => [g.institution.portalUrl, g.institution])).values()
  );

  const handleCopyAllGuide = async () => {
    let text = `[K-인증서 매니저 - 인증서 발급기관 일괄 갱신 안내]\n`;
    text += `총 선택 인증서: ${totalCerts}건 (만료임박: ${expiringCount}건 / 만료: ${expiredCount}건 / 정상: ${validCount}건)\n\n`;

    groups.forEach((g, idx) => {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `${idx + 1}. ${g.institution.name}${g.institution.isModified ? ' [사용자 수정됨]' : ''}\n`;
      text += `· 갱신 포털: ${g.institution.portalUrl}\n`;
      text += `· 메뉴 경로: ${g.institution.menuGuide}\n`;
      text += `· 고객센터: ${g.institution.callCenter}\n`;
      text += `· 대상 인증서 (${g.certs.length}건):\n`;
      g.certs.forEach(c => {
        const statusText = c.daysRemaining <= 0 ? '만료됨' : c.daysRemaining <= 30 ? `만료임박(D-${c.daysRemaining})` : `정상(D-${c.daysRemaining})`;
        text += `  - ${c.name} [${c.departmentOrOrg || c.policy}] (만료일: ${c.validTo} / ${statusText})\n`;
      });
      text += `\n`;
    });

    text += `* 갱신 안내 사항:\n`;
    text += `1. 공동인증서 갱신은 만료 30일 전부터 만료일 당일까지 가능합니다.\n`;
    text += `2. 이미 만료된 인증서는 갱신이 불가하며 신규/재발급 신청이 필요합니다.\n`;
    text += `3. 사이트 URL이나 기관명이 변경된 경우 [기관 정보 수정] 버튼으로 언제든 최신 주소로 변경 가능합니다.`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedAllText(true);
        setTimeout(() => setCopiedAllText(false), 2500);
      }
    } catch {
      // ignore clipboard error in restricted iframe
    }
  };

  const handleEditInstitution = (inst: RenewalInstitution) => {
    setEditingInst(inst);
    setIsNewInst(false);
    setIsEditModalOpen(true);
  };

  const handleAddNewInstitution = () => {
    setEditingInst(null);
    setIsNewInst(true);
    setIsEditModalOpen(true);
  };

  const handleSaveInstitution = (updated: RenewalInstitution) => {
    saveInstitution(updated);
    refreshInstitutions();
  };

  const handleResetInstitution = (id: string) => {
    resetInstitution(id);
    refreshInstitutions();
  };

  const handleExecuteResetAllToDefault = () => {
    resetAllInstitutionsToDefault();
    refreshInstitutions();
    setConfirmResetAll(false);
    setStatusMessage('모든 발급기관 사이트 정보가 초기 기본값으로 복원되었습니다.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExportJSON = () => {
    const jsonStr = exportInstitutionsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kcert-institutions-directory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSONSubmit = () => {
    if (!importJsonText.trim()) {
      setImportStatus('JSON 내용을 입력해주세요.');
      return;
    }
    const result = importInstitutionsJSON(importJsonText);
    if (result.success) {
      refreshInstitutions();
      setImportStatus(`성공적으로 ${result.count}개 기관 정보를 가져왔습니다.`);
      setImportJsonText('');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus(`가져오기 실패: ${result.error}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="renewal-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-400/40 bg-slate-800 shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={BRANDING_ASSETS.appIcon} 
                alt="인증서 갱신 안내 아이콘" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== BRANDING_ASSETS.rawAppIcon) {
                    target.src = BRANDING_ASSETS.rawAppIcon;
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="renewal-modal-title" className="text-base sm:text-lg font-bold">
                  인증서 발급기관 일괄 갱신 안내
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 rounded-full text-xs font-semibold">
                  선택 {totalCerts}건
                </span>
                <span className="px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded text-xs">
                  연계 기관 {groups.length}곳
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                선택한 인증서의 발급기관 갱신 사이트 바로가기 및 주소 관리
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isSettingsOpen ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="사이트 주소 변경 관리 & JSON 가져오기/내보내기"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">디렉터리 관리</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings & Import/Export Accordion Panel */}
        {isSettingsOpen && (
          <div className="bg-slate-900 text-slate-200 px-6 py-4 border-b border-slate-700 shrink-0 text-xs space-y-3 animate-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-sm">사이트 주소 변경 대비 및 디렉터리 동기화</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddNewInstitution}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>새 발급기관/자체 인증센터 추가</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="수정된 기관 목록 및 URL 정보를 JSON 파일로 저장"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>설정 내보내기 (JSON)</span>
                </button>
                {confirmResetAll ? (
                  <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-700 px-2.5 py-1 rounded">
                    <span className="text-rose-200 font-semibold">모두 초기화할까요?</span>
                    <button
                      type="button"
                      onClick={handleExecuteResetAllToDefault}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold cursor-pointer"
                    >
                      복원 확인
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetAll(false)}
                      className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-semibold cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmResetAll(true)}
                    className="px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="사용자 수정을 모두 초기화하고 공식 기본값으로 되돌림"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>전체 기본값 복원</span>
                  </button>
                )}
              </div>
            </div>
            {statusMessage && (
              <div className="px-3 py-2 bg-emerald-950/70 border border-emerald-700 text-emerald-200 rounded-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-slate-400 leading-relaxed mb-2">
                  기관명이나 사이트 주소(URL)가 바뀌면 각 카드의 <strong>[정보/URL 수정]</strong>에서 바로 고쳐 저장할 수 있습니다.
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-2">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  기관 디렉터리 JSON 가져오기 (기관별 일괄 배포)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importJsonText}
                    onChange={e => setImportJsonText(e.target.value)}
                    placeholder='{"institutions": [...]} 또는 JSON 텍스트 붙여넣기'
                    className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleImportJSONSubmit}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer shrink-0"
                  >
                    적용
                  </button>
                </div>
                {importStatus && (
                  <p className="text-[11px] font-semibold text-indigo-300">{importStatus}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Status & Fast Action Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="text-slate-600 font-semibold">갱신 현황 요약:</span>
            {expiringCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                만료 임박(30일 이내): {expiringCount}건 (즉시 갱신 권장)
              </span>
            )}
            {expiredCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                만료됨: {expiredCount}건 (갱신 불가 ➔ 재발급 필요)
              </span>
            )}
            {validCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                정상 유효: {validCount}건
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="선택된 모든 기관 갱신 포털 및 대상 인증서 목록을 텍스트로 복사"
            >
              {copiedAllText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">안내문 복사완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>안내문 전체 복사</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowBatchLinksPanel(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="선택된 모든 발급기관 포털 바로가기 링크 목록 펼치기/닫기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{showBatchLinksPanel ? '포털 모음 닫기' : `전체 포털 링크 모음 (${uniquePortalInstitutions.length})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBatchLinksPanel ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Inline Expandable Batch Portal Links Panel (replaces blocked multi-tab window.open) */}
        {showBatchLinksPanel && (
          <div className="bg-indigo-50/80 border-b border-indigo-200 px-6 py-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-950">
                연계 발급기관 포털 바로가기 ({uniquePortalInstitutions.length}곳)
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    uniquePortalInstitutions.map(i => `${i.portalName || i.name}: ${i.portalUrl}`).join('\n'),
                    'batch-urls'
                  )
                }
                className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl === 'batch-urls' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl === 'batch-urls' ? '전체 주소 복사됨' : '모든 포털 URL 복사'}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniquePortalInstitutions.map(inst => (
                <a
                  key={inst.id}
                  href={inst.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>{inst.shortName || inst.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Pills & Add Button */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">분류:</span>
            {[
              { id: 'ALL', label: `전체 (${groups.length}곳)` },
              { id: 'GOV', label: '정부·공공 (GPKI)' },
              { id: 'EDU', label: '교육청 (EPKI)' },
              { id: 'BANK', label: '은행·금융' },
              { id: 'CORP', label: '법인·사업자 (KICA 등)' },
              { id: 'STOCK', label: '증권 (SignKorea)' },
              { id: 'OTHER', label: '기타/사용자등록' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddNewInstitution}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>새 기관 추가</span>
          </button>
        </div>

        {/* Modal Body: Institution Group Cards */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
              <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">선택된 분류에 해당하는 발급기관이 없습니다.</p>
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className="mt-3 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                전체 분류 보기
              </button>
            </div>
          ) : (
            filteredGroups.map(group => {
              const { institution, certs, expiringCount, expiredCount } = group;
              const isUrgent = expiringCount > 0 || expiredCount > 0;

              return (
                <div 
                  key={institution.id}
                  className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                    isUrgent ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200'
                  }`}
                >
                  {/* Institution Header Card */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${institution.badgeBg} border ${institution.badgeColor} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-slate-800">
                              {institution.name}
                            </h3>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${institution.badgeBg} ${institution.badgeColor}`}>
                              {institution.orgCategoryLabel}
                            </span>
                            {institution.isModified && (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold">
                                URL/사이트명 수정됨
                              </span>
                            )}
                            {institution.isCustom && (
                              <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold">
                                사용자 등록 기관
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {institution.description}
                          </p>
                        </div>
                      </div>

                      {/* Action & Edit Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 flex-wrap">
                        {/* Edit Site Name & URL Button */}
                        <button
                          type="button"
                          onClick={() => handleEditInstitution(institution)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="사이트명 변경, 신규 URL 이전 시 기관 정보 직접 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>정보/URL 수정</span>
                        </button>

                        {/* Search Fallback on Domain Fail */}
                        <a
                          href={getSearchFallbackUrl(institution, 'naver')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="사이트 접속 불가 또는 도메인 개편 시 네이버 검색으로 최신 갱신 페이지 찾기"
                        >
                          <Search className="w-3.5 h-3.5 text-emerald-600" />
                          <span>검색으로 찾기</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(institution.portalUrl, institution.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer active:scale-95"
                          title="포털 웹사이트 주소 클립보드 복사"
                        >
                          {copiedUrl === institution.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">복사됨</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>주소 복사</span>
                            </>
                          )}
                        </button>

                        <a
                          href={institution.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          title={`${institution.portalName}로 새 창 열기`}
                        >
                          <span>홈페이지 바로가기</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Step guidance and notices */}
                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 flex items-start gap-2">
                        <Globe className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-700">홈페이지 갱신 메뉴:</span>
                          <p className="text-slate-600 mt-0.5">{institution.menuGuide}</p>
                        </div>
                      </div>
                      <div className="bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 flex items-start gap-2">
                        <Phone className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-700">발급기관 고객센터:</span>
                          <p className="text-slate-600 mt-0.5">{institution.callCenter || '정보 없음'}</p>
                        </div>
                      </div>
                    </div>

                    {institution.notice && (
                      <div className="mt-2 text-xs p-2 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>유의:</strong> {institution.notice}</span>
                      </div>
                    )}
                  </div>

                  {/* Target Certificates Under This Institution */}
                  <div className="p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileKey className="w-3.5 h-3.5 text-indigo-600" />
                        갱신 대상 인증서 ({certs.length}건)
                      </span>
                      {institution.secondaryUrl && (
                        <a
                          href={institution.secondaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>{institution.secondaryUrlLabel || institution.secondaryUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      {certs.map((cert, index) => {
                        const isExpired = cert.daysRemaining <= 0;
                        const isExpiring = cert.daysRemaining > 0 && cert.daysRemaining <= 30;

                        return (
                          <div
                            key={cert.id}
                            className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start sm:items-center gap-2.5">
                              <span className="w-5 text-center font-mono font-bold text-xs text-slate-500 shrink-0">{index + 1}</span>
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-700'
                                  : isExpiring
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isExpired ? '만료' : isExpiring ? '임박' : '유효'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900">{cert.name}</span>
                                  {cert.departmentOrOrg && (
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                      {cert.departmentOrOrg}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400 font-mono hidden md:inline">
                                    {cert.serialNumber}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>용도: {cert.policy}</span>
                                  <span>·</span>
                                  <span>위치: {cert.sourceDrive}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status & Validity Pill */}
                            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-mono text-slate-600 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>만료일: {cert.validTo}</span>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                isExpired
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isExpiring
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {isExpired 
                                  ? `만료됨 (D+${Math.abs(cert.daysRemaining)}일)` 
                                  : isExpiring 
                                  ? `만료 D-${cert.daysRemaining}일 (갱신 필요)` 
                                  : `D-${cert.daysRemaining}일 남음`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Collapsible Renewal FAQ Guide */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFaqGuide(prev => !prev)}
              className="w-full px-4.5 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-indigo-100/50 transition-colors"
            >
              <span className="font-bold text-xs sm:text-sm text-indigo-950 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>자주 묻는 갱신 안내 (갱신 가능 기간 · 사이트 변경 시)</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-indigo-700 transition-transform ${showFaqGuide ? 'rotate-180' : ''}`} />
            </button>
            {showFaqGuide && (
              <div className="px-4.5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-indigo-900 leading-relaxed">
                <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                  <p className="font-bold text-indigo-950 mb-0.5">1. 사이트 주소 변경 시</p>
                  <p>기관명·도메인이 바뀌면 <strong>[정보/URL 수정]</strong>에서 바로 새 주소로 수정하세요.</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                  <p className="font-bold text-indigo-950 mb-0.5">2. 갱신 가능 기간</p>
                  <p>만료 <strong>30일 전 ~ 만료일 당일</strong>까지만 온라인 갱신이 가능합니다.</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                  <p className="font-bold text-indigo-950 mb-0.5">3. 페이지가 열리지 않을 때</p>
                  <p><strong>[검색으로 찾기]</strong>를 누르면 최신 갱신 안내 페이지를 찾아줍니다.</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                  <p className="font-bold text-indigo-950 mb-0.5">4. 갱신 완료 후</p>
                  <p>메인 화면에서 <strong>[새로고침(F5)]</strong> 후 새 인증서를 USB에 다시 복사하세요.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            * 수정한 사이트 주소는 이 기기에 자동 저장됩니다.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      </div>

      {/* Edit Institution / Custom Institution Dialog */}
      <EditInstitutionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        institution={editingInst}
        isNew={isNewInst}
        onSave={handleSaveInstitution}
        onReset={handleResetInstitution}
      />
    </div>
  );
};
