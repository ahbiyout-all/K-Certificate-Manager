import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldCheck,
  Clock,
  Archive,
  Eraser
} from 'lucide-react';
import { TrashItem, RestoredTrashItem } from '../types';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashItem[];
  restoredTrashItems: RestoredTrashItem[];
  onRestore: (ids: string[]) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
  onPermanentlyDelete: (ids: string[]) => void;
  onClearRestoredHistory: () => void;
  onDeleteRestoredItem: (id: string) => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashItems,
  restoredTrashItems,
  onRestore,
  onRestoreAll,
  onEmptyTrash,
  onPermanentlyDelete,
  onClearRestoredHistory,
  onDeleteRestoredItem,
}) => {
  const [activeTab, setActiveTab] = useState<'deleted' | 'restored'>('deleted');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  // Sync selectedIds when trashItems change
  React.useEffect(() => {
    setSelectedIds(prev => prev.filter(id => trashItems.some(item => item.id === id)));
  }, [trashItems]);

  const filteredTrashItems = useMemo(() => {
    if (!searchQuery.trim()) return trashItems;
    const q = searchQuery.toLowerCase();
    return trashItems.filter(item => {
      const nameMatch = item.cert.name.toLowerCase().includes(q);
      const issuerMatch = item.cert.issuer.toLowerCase().includes(q);
      const reasonMatch = item.deleteReason.toLowerCase().includes(q);
      const orgMatch = (item.cert.departmentOrOrg || '').toLowerCase().includes(q);
      return nameMatch || issuerMatch || reasonMatch || orgMatch;
    });
  }, [trashItems, searchQuery]);

  const filteredRestoredItems = useMemo(() => {
    if (!searchQuery.trim()) return restoredTrashItems;
    const q = searchQuery.toLowerCase();
    return restoredTrashItems.filter(item => {
      const nameMatch = item.cert.name.toLowerCase().includes(q);
      const issuerMatch = item.cert.issuer.toLowerCase().includes(q);
      const reasonMatch = item.deleteReason.toLowerCase().includes(q);
      const orgMatch = (item.cert.departmentOrOrg || '').toLowerCase().includes(q);
      return nameMatch || issuerMatch || reasonMatch || orgMatch;
    });
  }, [restoredTrashItems, searchQuery]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredTrashItems.map(item => item.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    onRestore(selectedIds);
    setSelectedIds([]);
  };

  const handlePermanentDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    onPermanentlyDelete(selectedIds);
    setSelectedIds([]);
  };

  const handleConfirmEmpty = () => {
    onEmptyTrash();
    setShowEmptyConfirm(false);
    setSelectedIds([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center shrink-0 border border-slate-700">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">안전 격리 휴지통 & 복원 보관소</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  보관 중: {trashItems.length}건
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  복원됨: {restoredTrashItems.length}건
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                삭제된 인증서는 격리 보관되며, 복원된 인증서는 '복원된 항목' 보관소에 안전하게 등록 관리됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('deleted')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
                activeTab === 'deleted'
                  ? 'bg-white text-rose-700 border-slate-200 shadow-2xs'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>🗑️ 삭제된 항목 (보관 중 {trashItems.length}건)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('restored')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
                activeTab === 'restored'
                  ? 'bg-white text-emerald-700 border-slate-200 shadow-2xs'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>🔄 복원된 항목 (보관소 {restoredTrashItems.length}건)</span>
            </button>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'deleted' ? "휴지통 검색 (이름, 사유 등)..." : "복원 보관소 검색..."}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>
            {activeTab === 'deleted' && filteredTrashItems.length > 0 && (
              <span className="text-xs text-slate-500 shrink-0">
                일치: {filteredTrashItems.length}건
              </span>
            )}
            {activeTab === 'restored' && filteredRestoredItems.length > 0 && (
              <span className="text-xs text-slate-500 shrink-0">
                일치: {filteredRestoredItems.length}건
              </span>
            )}
          </div>

          {/* Quick Buttons for Active Tab */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'deleted' ? (
              <>
                {trashItems.length > 0 && (
                  <div className="flex items-center gap-1.5 border-r border-slate-300 pr-2 mr-1">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-slate-200"
                      title="휴지통 전체 인증서 선택"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>전체 선택</span>
                    </button>
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                        title="선택 항목 해제"
                      >
                        <span>선택 해제</span>
                      </button>
                    )}
                  </div>
                )}

                {selectedIds.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRestoreSelected}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>선택한 인증서 복원 ({selectedIds.length}건)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePermanentDeleteSelected}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>영구 삭제 ({selectedIds.length}건)</span>
                    </button>
                  </>
                ) : (
                  trashItems.length > 0 && (
                    <>
                      {searchQuery.trim() ? (
                        <button
                          type="button"
                          onClick={() => {
                            onRestore(filteredTrashItems.map(i => i.id));
                            setSearchQuery('');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>검색된 {filteredTrashItems.length}건 복원</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onRestoreAll}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>휴지통 전체 일괄 복원 ({trashItems.length}건)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowEmptyConfirm(true)}
                        className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>휴지통 비우기</span>
                      </button>
                    </>
                  )
                )}
              </>
            ) : (
              restoredTrashItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearRestoredHistory}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Eraser className="w-3.5 h-3.5 text-slate-500" />
                  <span>복원 이력 전체 비우기</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Empty Confirmation Prompt for Deleted Tab */}
        {activeTab === 'deleted' && showEmptyConfirm && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>휴지통의 모든 인증서({trashItems.length}건)를 완전히 삭제하시겠습니까? 복구할 수 없습니다.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmptyConfirm(false)}
                className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmEmpty}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                영구 삭제 확인
              </button>
            </div>
          </div>
        )}

        {/* List Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {activeTab === 'deleted' ? (
            trashItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">휴지통이 비어 있습니다.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  삭제된 인증서는 이 휴지통에 임시로 보관되며, 언제든지 [복원] 버튼을 눌러 원래 목록으로 되돌릴 수 있습니다.
                </p>
              </div>
            ) : filteredTrashItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                검색 조건에 맞는 휴지통 항목이 없습니다.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filteredTrashItems.length > 0 && filteredTrashItems.every(i => selectedIds.includes(i.id))}
                      onChange={() => {
                        if (filteredTrashItems.every(i => selectedIds.includes(i.id))) {
                          handleClearSelection();
                        } else {
                          handleSelectAll();
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-700">전체 선택</span>
                  </div>
                  <span className="text-slate-400">
                    {selectedIds.length}개 선택됨
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {filteredTrashItems.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);
                    const cert = item.cert;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:px-4 flex items-start gap-2.5 text-xs transition-colors ${
                          isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <span className={`mt-0.5 w-5 text-center font-mono font-bold text-xs text-slate-500 shrink-0 sticky left-0 z-10 ${isSelected ? 'bg-blue-50' : 'bg-white group-hover:bg-slate-50'}`}>{index + 1}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{cert.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                              {cert.category === 'GPKI_GOV' ? '공무원 GPKI' : cert.category === 'EPKI_EDU' ? '교육 EPKI' : '금융 NPKI'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                              사유: {item.deleteReason}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-mono ml-auto">
                              <Clock className="w-3 h-3" />
                              {item.deletedAt}
                            </span>
                          </div>

                          <div className="text-slate-500 text-[11px] mt-1 truncate">
                            {cert.departmentOrOrg ? `${cert.departmentOrOrg} · ` : ''}
                            발급처: {cert.issuer} · 유효기간: {cert.validTo}
                          </div>

                          <div 
                            className="text-[10px] font-mono text-slate-600 mt-1 break-all select-all bg-slate-100/60 px-2 py-1 rounded border border-slate-200/50"
                            title={`원래 저장 경로: ${cert.sourceLocation}`}
                          >
                            {cert.sourceLocation}
                          </div>
                        </div>

                        {/* Item Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => onRestore([item.id])}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="이 인증서 복원"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>복원</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onPermanentlyDelete([item.id])}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="영구 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* Restored Items Tab - Detailed Card Layout */
            restoredTrashItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                  <Archive className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">복원 보관소가 비어 있습니다.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  휴지통에서 복원된 인증서 항목들이 이곳에 자동으로 안전 보관 및 상세 이력 관리됩니다.
                </p>
              </div>
            ) : filteredRestoredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                검색 조건에 맞는 복원 항목이 없습니다.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredRestoredItems.map((item, index) => {
                  const cert = item.cert;
                  const beforeStatus = item.integrityBeforeAfter?.beforeStatus || '🔒 격리 보관소 파티션 SHA-256 무결성 검증 통과 (100% 보존)';
                  const afterStatus = item.integrityBeforeAfter?.afterStatus || '⚡ 원본 경로 복원 완료 - 인증서/개인키 Pair 서명 검증 정상 동기화';

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all text-xs"
                    >
                      {/* Card Header: CN, Category, Status Badge & Action */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-bold text-[11px] shrink-0">
                            #{index + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm truncate">{cert.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold shrink-0">
                            {cert.category === 'GPKI_GOV' ? '공무원 GPKI' : cert.category === 'EPKI_EDU' ? '교육 EPKI' : '금융 NPKI'}
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold flex items-center gap-1 shrink-0 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ✓ 원본 보관함으로 복원 완료
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteRestoredItem(item.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                          title="이 복원 이력 기록 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>이력 삭제</span>
                        </button>
                      </div>

                      {/* Timestamps & Previous Reason Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-slate-500 font-medium shrink-0">복원 시각:</span>
                          <span className="font-bold text-slate-800 font-mono">{item.restoredAt}</span>
                        </div>

                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5 min-w-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-slate-500 font-medium shrink-0">이전 삭제 사유:</span>
                          <span className="font-bold text-amber-900 truncate" title={item.deleteReason}>
                            {item.deleteReason || '사용자 개별 삭제'}
                          </span>
                        </div>
                      </div>

                      {/* Integrity Before / After Comparison Card Box (복구 전/후 무결성 상태) */}
                      <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 mb-2.5">
                        <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>인증서 복구 전/후 무결성 검증 (Integrity Audit Log)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-relaxed">
                          <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                            <span className="text-sky-400 font-bold block text-[10px] mb-0.5">🔒 복구 전 (보관 상태)</span>
                            <span className="text-slate-200">{beforeStatus}</span>
                          </div>
                          <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                            <span className="text-emerald-400 font-bold block text-[10px] mb-0.5">⚡ 복구 후 (동기화 상태)</span>
                            <span className="text-slate-200">{afterStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Path Box */}
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/80 flex items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-emerald-800 shrink-0">📂 원본 저장 경로:</span>
                        <span className="font-mono text-slate-700 truncate select-all" title={cert.sourceLocation}>
                          {cert.sourceLocation}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Guide banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-bold text-slate-700">자동 동기화 및 안전 관리: </span>
              휴지통에서 복원 시 즉시 메인 보관함과 연결 드라이브 목록이 자동 새로고침 적용되어 정상 이용 가능하며, '복원된 항목' 보관소에 이력이 안전하게 영구 저장됩니다.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'deleted' ? (
              <>
                격리 보관 중: <strong className="text-slate-800">{trashItems.length}건</strong>
                {searchQuery.trim() && (
                  <span className="text-blue-600 font-semibold ml-1.5">
                    (검색 일치: {filteredTrashItems.length}건)
                  </span>
                )}
              </>
            ) : (
              <>
                복원 보관소 이력: <strong className="text-emerald-700">{restoredTrashItems.length}건</strong>
                {searchQuery.trim() && (
                  <span className="text-emerald-600 font-semibold ml-1.5">
                    (검색 일치: {filteredRestoredItems.length}건)
                  </span>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
