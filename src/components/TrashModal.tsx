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
  Eraser,
  Usb
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
  onRestoreToUsb?: (item: RestoredTrashItem) => void;
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
  onRestoreToUsb,
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
        {/* Header - More Compact */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-rose-400 flex items-center justify-center shrink-0 border border-slate-700">
              <Trash2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold">격리 휴지통 & 복원 보관소</h2>
                <div className="flex gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">휴지통 {trashItems.length}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">복원소 {restoredTrashItems.length}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs - Smaller */}
        <div className="px-4 pt-2 bg-slate-100 border-b border-slate-200 flex items-center">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('deleted')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-t border-x ${
                activeTab === 'deleted' ? 'bg-white text-rose-700 border-slate-200' : 'bg-slate-200/70 text-slate-500 border-transparent'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>삭제된 항목</span>
            </button>
            <button
              onClick={() => setActiveTab('restored')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-t border-x ${
                activeTab === 'restored' ? 'bg-white text-emerald-700 border-slate-200' : 'bg-slate-200/70 text-slate-500 border-transparent'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>복원된 항목 (보관소)</span>
            </button>
          </div>
        </div>

        {/* Action Bar - Tighter */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="검색..."
              className="w-full pl-8 pr-3 py-1 text-[11px] bg-white border border-slate-200 rounded-md focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {activeTab === 'deleted' ? (
              <>
                {selectedIds.length > 0 ? (
                  <>
                    <button onClick={handleRestoreSelected} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">선택 복원 ({selectedIds.length})</button>
                    <button onClick={handlePermanentDeleteSelected} className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold">영구 삭제</button>
                  </>
                ) : (
                  trashItems.length > 0 && (
                    <button onClick={() => setShowEmptyConfirm(true)} className="px-2 py-1 bg-white border border-rose-200 text-rose-600 rounded text-[10px] font-bold">휴지통 비우기</button>
                  )
                )}
              </>
            ) : (
              restoredTrashItems.length > 0 && (
                <button onClick={onClearRestoredHistory} className="px-2 py-1 bg-white border border-slate-300 text-slate-600 rounded text-[10px] font-bold">이력 전체 삭제</button>
              )
            )}
          </div>
        </div>

        {/* Content - Tighter */}
        <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[300px]">
          {activeTab === 'deleted' ? (
            trashItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">휴지통이 비어 있습니다.</div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {filteredTrashItems.map((item, idx) => (
                  <div key={item.id} className={`p-2 flex items-start gap-2 text-[11px] ${selectedIds.includes(item.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="mt-1 w-3.5 h-3.5 rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{item.cert.name}</span>
                        <span className="text-[9px] px-1 bg-slate-100 rounded border">{item.cert.category}</span>
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded border">사유: {item.deleteReason}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5 truncate">{item.cert.sourceLocation}</div>
                    </div>
                    <button onClick={() => onRestore([item.id])} className="text-emerald-600 font-bold px-1.5 py-0.5 border border-emerald-200 rounded bg-emerald-50">복원</button>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredRestoredItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">복원 보관소가 비어 있습니다.</div>
            ) : (
              <div className="space-y-2">
                {filteredRestoredItems.map((item) => (
                  <div key={item.id} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-3xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-slate-900 text-xs truncate">{item.cert.name}</span>
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200 font-bold shrink-0">복원완료</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {onRestoreToUsb && (
                          <button onClick={() => onRestoreToUsb(item)} className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center gap-1">
                            <Usb className="w-3 h-3" />
                            <span>USB 제한 복구</span>
                          </button>
                        )}
                        <button onClick={() => onDeleteRestoredItem(item.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-50 pt-1">
                      <Clock className="w-3 h-3" /> <span>{item.restoredAt}</span>
                      <span className="text-slate-300">|</span>
                      <span className="truncate">{item.cert.sourceLocation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Security Banner - Minimal */}
        <div className="px-4 py-2 bg-emerald-900/90 text-[10px] text-emerald-100 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>보관소 이력은 Windows DPAPI 및 AES-256으로 이중 암호화되어 현재 사용자만 접근 가능합니다.</span>
        </div>

        {/* Footer - Minimal */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">보관 {trashItems.length} / 복원 {restoredTrashItems.length}</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-[11px] font-bold cursor-pointer">닫기</button>
        </div>
      </div>
    </div>
  );
};

