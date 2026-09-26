import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Building2, 
  Phone, 
  ExternalLink, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Search, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { RenewalInstitution } from '../data/renewalInstitutions';
import { sanitizeUrl, getSearchFallbackUrl } from '../utils/renewalStore';

interface EditInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: RenewalInstitution | null;
  isNew?: boolean;
  onSave: (institution: RenewalInstitution) => void;
  onReset?: (id: string) => void;
}

export const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  isOpen,
  onClose,
  institution,
  isNew = false,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<RenewalInstitution>({
    id: '',
    name: '',
    shortName: '',
    orgCategory: 'BANK',
    orgCategoryLabel: '금융결제원 (은행/개인/기업)',
    badgeColor: 'text-blue-700 border-blue-200',
    badgeBg: 'bg-blue-50',
    portalName: '',
    portalUrl: '',
    menuGuide: '',
    callCenter: '',
    description: '',
    notice: '',
    secondaryUrl: '',
    secondaryUrlLabel: '',
    aliases: [],
  });

  const [aliasesInput, setAliasesInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (institution) {
      setFormData({ ...institution });
      setAliasesInput((institution.aliases || []).join(', '));
      setErrorMsg(null);
    } else if (isNew) {
      const newId = `CUSTOM_${Date.now().toString(36).toUpperCase()}`;
      setFormData({
        id: newId,
        name: '',
        shortName: '',
        orgCategory: 'OTHER',
        orgCategoryLabel: '사용자 등록 기관',
        badgeColor: 'text-indigo-700 border-indigo-200',
        badgeBg: 'bg-indigo-50',
        portalName: '',
        portalUrl: 'https://',
        menuGuide: '인증센터 > 인증서 갱신',
        callCenter: '',
        description: '사용자가 직접 등록한 발급기관 갱신 포털',
        notice: '만료 30일 전부터 갱신 가능합니다.',
        secondaryUrl: '',
        secondaryUrlLabel: '',
        aliases: [],
        isCustom: true,
      });
      setAliasesInput('');
      setErrorMsg(null);
    }
  }, [institution, isNew, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: RenewalInstitution['orgCategory']) => {
    let label = '기타/자체 발급기관';
    let badgeColor = 'text-slate-700 border-slate-200';
    let badgeBg = 'bg-slate-50';

    if (cat === 'GOV') {
      label = '정부·행정기관 (공무원)';
      badgeColor = 'text-indigo-700 border-indigo-200';
      badgeBg = 'bg-indigo-50';
    } else if (cat === 'EDU') {
      label = '교육청·학교 (교원/교육공무원)';
      badgeColor = 'text-teal-700 border-teal-200';
      badgeBg = 'bg-teal-50';
    } else if (cat === 'BANK') {
      label = '금융결제원 (은행/개인/기업)';
      badgeColor = 'text-blue-700 border-blue-200';
      badgeBg = 'bg-blue-50';
    } else if (cat === 'CORP') {
      label = '공인인증기관 (법인/사업자/범용)';
      badgeColor = 'text-purple-700 border-purple-200';
      badgeBg = 'bg-purple-50';
    } else if (cat === 'STOCK') {
      label = '공인인증기관 (증권거래/선물옵션)';
      badgeColor = 'text-orange-700 border-orange-200';
      badgeBg = 'bg-orange-50';
    }

    setFormData(prev => ({
      ...prev,
      orgCategory: cat,
      orgCategoryLabel: label,
      badgeColor,
      badgeBg,
    }));
  };

  const handleTestUrl = (urlToTest: string) => {
    const clean = sanitizeUrl(urlToTest);
    if (!clean) {
      alert('테스트할 웹사이트 URL을 입력해주세요.');
      return;
    }
    window.open(clean, '_blank', 'noopener,noreferrer');
  };

  const handleSearchOnWeb = (engine: 'naver' | 'google') => {
    const targetUrl = getSearchFallbackUrl(formData, engine);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = formData.name.trim();
    const cleanUrl = sanitizeUrl(formData.portalUrl);

    if (!cleanName) {
      setErrorMsg('발급기관 사이트 이름을 입력해주세요.');
      return;
    }

    if (!cleanUrl || cleanUrl === 'https://' || cleanUrl === 'http://') {
      setErrorMsg('유효한 포털 웹사이트 URL(https://...)을 입력해주세요.');
      return;
    }

    const aliases = aliasesInput
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const finalItem: RenewalInstitution = {
      ...formData,
      name: cleanName,
      shortName: formData.shortName.trim() || cleanName,
      portalName: formData.portalName.trim() || `${cleanName} 갱신 포털`,
      portalUrl: cleanUrl,
      secondaryUrl: formData.secondaryUrl ? sanitizeUrl(formData.secondaryUrl) : undefined,
      aliases,
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-institution-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-institution-title" className="font-bold text-base sm:text-lg">
                {isNew ? '새 발급기관 및 갱신 사이트 등록' : '발급기관 사이트명 & 갱신 URL 변경'}
              </h3>
              <p className="text-xs text-slate-300">
                기관명 변경, 홈페이지 개편, 주소(URL) 이전 시 정보를 즉시 수정·관리할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm bg-slate-50/50">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Institution Category */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              기관 분류
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'BANK', label: '은행·금융 (NPKI)' },
                { id: 'GOV', label: '정부·공공 (GPKI)' },
                { id: 'EDU', label: '교육청·학교 (EPKI)' },
                { id: 'CORP', label: '법인·사업자 (KICA 등)' },
                { id: 'STOCK', label: '증권·투자 (SignKorea)' },
                { id: 'OTHER', label: '기타/자체 인증' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id as any)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                    formData.orgCategory === cat.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.label}</span>
                  {formData.orgCategory === cat.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                기관/사이트 전체 이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 하나은행 인터넷뱅킹 인증센터"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                약칭 (짧은 이름)
              </label>
              <input
                type="text"
                value={formData.shortName}
                onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                placeholder="예: 하나은행"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Official Portal URL with Test & Web Search Assist */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>공식 갱신 포털 URL (웹사이트 주소)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSearchOnWeb('naver')}
                  className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded font-semibold flex items-center gap-1 cursor-pointer"
                  title="네이버에서 이 기관의 최신 인증센터 주소 검색"
                >
                  <Search className="w-3 h-3" />
                  <span>네이버 검색</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchOnWeb('google')}
                  className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold flex items-center gap-1 cursor-pointer"
                  title="구글에서 최신 갱신 주소 검색"
                >
                  <Search className="w-3 h-3" />
                  <span>구글 검색</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.portalUrl}
                onChange={e => setFormData({ ...formData, portalUrl: e.target.value })}
                placeholder="https://www.kebhana.com 또는 https://..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleTestUrl(formData.portalUrl)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                title="입력한 주소로 새 창 열기 테스트"
              >
                <span>접속 테스트</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              * 포털 도메인이 변경된 경우 새 주소를 입력하고 [접속 테스트]로 유효성을 확인하세요.
            </p>
          </div>

          {/* Secondary URL (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                연계 2차 URL (선택)
              </label>
              <input
                type="text"
                value={formData.secondaryUrl || ''}
                onChange={e => setFormData({ ...formData, secondaryUrl: e.target.value })}
                placeholder="https://www.yessign.or.kr"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                연계 URL 버튼 라벨
              </label>
              <input
                type="text"
                value={formData.secondaryUrlLabel || ''}
                onChange={e => setFormData({ ...formData, secondaryUrlLabel: e.target.value })}
                placeholder="예: 금융결제원 전자인증센터"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Menu Guidance & Call Center */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                홈페이지 내 메뉴 경로 안내
              </label>
              <input
                type="text"
                value={formData.menuGuide}
                onChange={e => setFormData({ ...formData, menuGuide: e.target.value })}
                placeholder="예: 인증센터 > 공동인증서 > 갱신"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                고객센터 전화번호
              </label>
              <input
                type="text"
                value={formData.callCenter}
                onChange={e => setFormData({ ...formData, callCenter: e.target.value })}
                placeholder="예: 1588-1111 / 1599-1111"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Aliases & Keywords for Auto-Matching */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>인증서 자동 매핑 키워드 (쉼표 구분)</span>
              </label>
              <span className="text-[11px] text-slate-400">인증서 발급자/DN 매칭용</span>
            </div>
            <input
              type="text"
              value={aliasesInput}
              onChange={e => setAliasesInput(e.target.value)}
              placeholder="예: 하나은행, 하나, keb, hanabank, hana"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * 인증서의 발급자, 부서명, DN에 해당 단어가 포함되면 이 기관으로 자동 분류됩니다.
            </p>
          </div>

          {/* Description & Notice */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              기관 설명 및 갱신 유의사항
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="기관 및 대상 인증서 업무 설명"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            <input
              type="text"
              value={formData.notice || ''}
              onChange={e => setFormData({ ...formData, notice: e.target.value })}
              placeholder="특이사항 (예: 만료 후 재발급 필요, 수수료 등)"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              {!isNew && onReset && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('이 기관의 정보를 초기 기본값으로 되돌리시겠습니까?')) {
                      onReset(formData.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>기본값 복원</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>변경사항 저장</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
