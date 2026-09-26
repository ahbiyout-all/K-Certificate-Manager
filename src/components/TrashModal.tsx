import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Building2, 
  User, 
  FileKey,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { TrashItem } from '../types';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashItem[];
  onRestore: (ids: string[]) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
  onPermanentlyDelete: (ids: string[]) => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashItems,
  onRestore,
  onRestoreAll,
  onEmptyTrash,
  onPermanentlyDelete,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  // Sync selectedIds when trashItems change
  React.useEffect(() => {
    setSelectedIds(prev => prev.filter(id => trashItems.some(item => item.id === id)));
  }, [trashItems]);

  const filteredItems = useMemo(() => {
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

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredItems.map(item => item.id));
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center shrink-0 border border-slate-700">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">인증서 임시 보관 휴지통</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  {trashItems.length}건 보관 중
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                실수로 삭제한 인증서를 원본 경로로 즉시 복구하거나 안전하게 영구 폐기할 수 있습니다.
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

        {/* Action & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="휴지통 검색 (이름, 사유 등)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>
            {filteredItems.length > 0 && (
              <span className="text-xs text-slate-500 shrink-0">
                총 {filteredItems.length}건
              </span>
            )}
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleRestoreSelected}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>선택 복원 ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handlePermanentDeleteSelected}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>영구 삭제</span>
                </button>
              </>
            )}

            {trashItems.length > 0 && selectedIds.length === 0 && (
              <>
                <button
                  type="button"
                  onClick={onRestoreAll}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>전체 복원 ({trashItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmptyConfirm(true)}
                  className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>휴지통 비우기</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Empty Confirmation Prompt */}
        {showEmptyConfirm && (
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
          {trashItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">휴지통이 비어 있습니다.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                삭제된 인증서는 이 휴지통에 임시로 보관되며, 언제든지 [복원] 버튼을 눌러 원래 목록으로 되돌릴 수 있습니다.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              검색 조건에 맞는 휴지통 항목이 없습니다.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && filteredItems.every(i => selectedIds.includes(i.id))}
                    onChange={() => {
                      if (filteredItems.every(i => selectedIds.includes(i.id))) {
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
                {filteredItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const cert = item.cert;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:px-4 flex items-start gap-3 text-xs transition-colors ${
                        isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                      }`}
                    >
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

                        <div className="text-[10px] font-mono text-slate-400 mt-1 truncate bg-slate-100/60 px-2 py-0.5 rounded border border-slate-200/50">
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
          )}

          {/* Guide banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-bold text-slate-700">안전한 복구 보장: </span>
              복원 버튼을 누르면 해당 인증서가 즉시 원래 목록과 저장 위치로 복구되며, 전자서명 및 금융업무를 다시 정상적으로 이용하실 수 있습니다.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            보관 중인 항목: <strong>{trashItems.length}건</strong>
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
