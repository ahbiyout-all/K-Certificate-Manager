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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenAllPortals = () => {
    const urls = Array.from(new Set(groups.map(g => g.institution.portalUrl)));
    if (urls.length > 3) {
      if (!confirm(`총 ${urls.length}개의 발급기관 홈페이지 탭을 엽니다. 브라우저의 팝업 차단을 해제해야 할 수 있습니다. 계속하시겠습니까?`)) {
        return;
      }
    }
    urls.forEach(url => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  };

  const handleCopyAllGuide = () => {
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

    navigator.clipboard.writeText(text);
    setCopiedAllText(true);
    setTimeout(() => setCopiedAllText(false), 2500);
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

  const handleResetAllToDefault = () => {
    if (confirm('모든 발급기관 사이트 주소 및 이름을 초기 표준값으로 복원하시겠습니까?')) {
      resetAllInstitutionsToDefault();
      refreshInstitutions();
      alert('모든 발급기관 사이트 정보가 초기 기본값으로 복원되었습니다.');
    }
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
                선택된 인증서의 발급기관(행안부 GPKI, 교육부 EPKI, 은행 등) 갱신 센터 바로가기 및 사이트 URL 변경 대비 관리
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
                <button
                  type="button"
                  onClick={handleResetAllToDefault}
                  className="px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="사용자 수정을 모두 초기화하고 공식 기본값으로 되돌림"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>전체 기본값 복원</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-slate-400 leading-relaxed mb-2">
                  정부조직 개편, 은행 사명 변경, 또는 도메인 주소(URL) 변경 시 각 카드 우측의 <strong>[기관 정보 및 URL 수정]</strong> 버튼을 통해 즉시 최신 주소로 변경할 수 있습니다. 변경된 내용은 브라우저에 안전하게 보존됩니다.
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
              onClick={handleOpenAllPortals}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="선택된 모든 발급기관의 홈페이지 탭을 일괄 실행"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>전체 사이트 일괄 열기</span>
            </button>
          </div>
        </div>

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
                        <button
                          type="button"
                          onClick={() => window.open(getSearchFallbackUrl(institution, 'naver'), '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="사이트 접속 불가 또는 도메인 개편 시 네이버 검색으로 최신 갱신 페이지 찾기"
                        >
                          <Search className="w-3.5 h-3.5 text-emerald-600" />
                          <span>검색으로 찾기</span>
                        </button>

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

                        <button
                          type="button"
                          onClick={() => handleOpenLink(institution.portalUrl)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          title={`${institution.portalName}로 새 창 열기`}
                        >
                          <span>홈페이지 바로가기</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
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
                        <button
                          type="button"
                          onClick={() => handleOpenLink(institution.secondaryUrl!)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>{institution.secondaryUrlLabel || institution.secondaryUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {certs.map(cert => {
                        const isExpired = cert.daysRemaining <= 0;
                        const isExpiring = cert.daysRemaining > 0 && cert.daysRemaining <= 30;

                        return (
                          <div
                            key={cert.id}
                            className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start sm:items-center gap-3">
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

          {/* Practical Renewal Instructions FAQ Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4.5 space-y-2.5">
            <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-700" />
              공동/공인인증서 갱신 및 사이트 변경 대비 가이드
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-indigo-900 leading-relaxed">
              <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                <p className="font-bold text-indigo-950 mb-1">1. 사이트명 및 URL 변경 시 대응</p>
                <p>은행명 개편(예: KEB하나 ➔ 하나은행, 대구은행 ➔ iM뱅크)이나 신규 갱신 센터 주소가 열리면 각 카드의 <strong>[정보/URL 수정]</strong>을 눌러 즉시 변경할 수 있습니다.</p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                <p className="font-bold text-indigo-950 mb-1">2. 갱신 가능 기간</p>
                <p>유효기간 만료 <strong>30일 전부터 만료일 당일(24:00)까지</strong>만 온라인 갱신이 가능합니다. 이 기간 이전에는 갱신 메뉴가 활성화되지 않습니다.</p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                <p className="font-bold text-indigo-950 mb-1">3. 사이트 접속 불가 시 [검색으로 찾기]</p>
                <p>도메인이 리다이렉트되지 않거나 차단된 경우 각 기관의 <strong>[검색으로 찾기]</strong> 버튼을 누르면 네이버의 최신 갱신 인증센터 페이지로 자동 연결됩니다.</p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-indigo-100">
                <p className="font-bold text-indigo-950 mb-1">4. 갱신 완료 후 K-인증서 매니저 동기화</p>
                <p>발급기관에서 갱신을 마친 후 메인화면의 <strong>[새로고침(F5)]</strong> 버튼을 누르면 새 유효기간이 반영됩니다. 이후 이동식 디스크(USB)로 백업을 갱신 복사하세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            * 사용자가 수정한 사이트명과 URL은 브라우저에 안전하게 저장되며 언제든 [기본값 복원]이 가능합니다.
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
