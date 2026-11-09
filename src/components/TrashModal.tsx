import React, { useState, useMemo, useEffect } from 'react';
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
  Usb,
  Download,
  Filter,
  FileKey,
  Shield,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import { TrashItem, RestoredTrashItem } from '../types';
import { 
  getVaultSecurityDiagnostics, 
  exportVaultBackupFile, 
  VaultSecurityDiagnostics 
} from '../utils/protectedVaultStorage';

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
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'NPKI' | 'GPKI' | 'EPKI'>('ALL');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [selectedProofItem, setSelectedProofItem] = useState<RestoredTrashItem | null>(null);
  const [showSelfTestModal, setShowSelfTestModal] = useState(false);
  const [diagnostics, setDiagnostics] = useState<VaultSecurityDiagnostics | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);

  // Sync selectedIds when trashItems change
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => trashItems.some(item => item.id === id)));
  }, [trashItems]);

  // Load diagnostics when restored tab is opened
  useEffect(() => {
    if (activeTab === 'restored') {
      getVaultSecurityDiagnostics(restoredTrashItems).then(setDiagnostics);
    }
  }, [activeTab, restoredTrashItems]);

  const handleRunSelfTest = async () => {
    setIsLoadingDiagnostics(true);
    const diag = await getVaultSecurityDiagnostics(restoredTrashItems);
    setDiagnostics(diag);
    setIsLoadingDiagnostics(false);
    setShowSelfTestModal(true);
  };

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
    let result = restoredTrashItems;

    // Filter by Category
    if (categoryFilter !== 'ALL') {
      result = result.filter(item => {
        const cat = (item.cert.category || 'NPKI').toUpperCase();
        return cat.startsWith(categoryFilter);
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const nameMatch = item.cert.name.toLowerCase().includes(q);
        const issuerMatch = item.cert.issuer.toLowerCase().includes(q);
        const reasonMatch = item.deleteReason.toLowerCase().includes(q);
        const locMatch = (item.cert.sourceLocation || '').toLowerCase().includes(q);
        return nameMatch || issuerMatch || reasonMatch || locMatch;
      });
    }

    return result;
  }, [restoredTrashItems, categoryFilter, searchQuery]);

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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center shrink-0 border border-slate-700 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">안전 격리 휴지통 & 암호화 보호 보관소</h2>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                    격리 {trashItems.length}건
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>보관소 {restoredTrashItems.length}건</span>
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                복원된 항목의 매니페스트는 Windows DPAPI 및 AES-256 이중 암호화로 격리 보호됩니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('deleted')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-t border-x ${
                activeTab === 'deleted' ? 'bg-white text-rose-700 border-slate-200 shadow-2xs' : 'bg-slate-200/70 text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>🗑️ 삭제된 항목 (격리 보관 중 {trashItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('restored')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-t border-x ${
                activeTab === 'restored' ? 'bg-white text-emerald-700 border-slate-200 shadow-2xs' : 'bg-slate-200/70 text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>🔄 복원된 항목 (보관소 {restoredTrashItems.length})</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'deleted' ? '소유자명, 발급자, 사유 검색...' : '보관소 인증서명, 경로, 사유 검색...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {activeTab === 'restored' && (
                <div className="flex items-center gap-1">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value as any)}
                    className="px-2 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="ALL">전체 구분</option>
                    <option value="NPKI">NPKI (금융/공동)</option>
                    <option value="GPKI">GPKI (행정공무원)</option>
                    <option value="EPKI">EPKI (교육기관)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {activeTab === 'deleted' ? (
                <>
                  <button onClick={handleSelectAll} className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer">
                    전체 선택
                  </button>
                  {selectedIds.length > 0 && (
                    <button onClick={handleClearSelection} className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer">
                      선택 해제
                    </button>
                  )}
                  {selectedIds.length > 0 ? (
                    <>
                      <button onClick={handleRestoreSelected} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>선택 복원 ({selectedIds.length})</span>
                      </button>
                      <button onClick={handlePermanentDeleteSelected} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>영구 삭제</span>
                      </button>
                    </>
                  ) : (
                    trashItems.length > 0 && (
                      <button onClick={() => setShowEmptyConfirm(true)} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer">
                        🔥 휴지통 비우기
                      </button>
                    )
                  )}
                </>
              ) : (
                <>
                  <button 
                    onClick={handleRunSelfTest} 
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="암호화 무결성 및 DPAPI/AES-256 자가 진단 실행"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>보관소 자가진단</span>
                  </button>

                  <button 
                    onClick={() => exportVaultBackupFile(restoredTrashItems)} 
                    disabled={restoredTrashItems.length === 0}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="암호화 보관소 백업 파일(.dat) 다운로드"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>백업 내보내기</span>
                  </button>

                  {restoredTrashItems.length > 0 && (
                    <button onClick={onClearRestoredHistory} className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">
                      🧹 이력 전체 비우기
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Real-time Vault Security & Integrity Inspector Banner (Active on Restored Tab) */}
          {activeTab === 'restored' && (
            <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 truncate">
                  <span className="font-bold text-emerald-300">보안 수준: Windows DPAPI (CurrentUser) + AES-256 GCM 이중 보호</span>
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    protected_restored_manifest.dat ({diagnostics?.byteSize ?? 0} B)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-slate-400">
                  SHA-256: {diagnostics?.sha256Checksum ? `${diagnostics.sha256Checksum.slice(0, 16)}...` : '진단 중...'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ 100% 암호화 정상
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5 min-h-[340px]">
          {activeTab === 'deleted' ? (
            trashItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>격리 휴지통이 비어 있습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                {filteredTrashItems.map((item, idx) => (
                  <div key={item.id} className={`p-3 flex items-start gap-3 text-xs transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(item.id)} 
                      onChange={() => toggleSelect(item.id)} 
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                    <div className="w-6 text-slate-400 font-mono font-bold text-center mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.cert.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200">
                          {item.cert.category}
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          사유: {item.deleteReason}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono mt-1 truncate">
                        {item.cert.sourceLocation}
                      </div>
                    </div>
                    <button 
                      onClick={() => onRestore([item.id])} 
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-colors shrink-0"
                    >
                      ↩️ 복원
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredRestoredItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>복원 보관소가 비어 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRestoredItems.map((item, idx) => (
                  <div key={item.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm truncate">{item.cert.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200 shrink-0">
                          {item.cert.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-md shrink-0">
                          ✓ 원본 보관함으로 복원 완료
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onRestoreToUsb && (
                          <button 
                            onClick={() => onRestoreToUsb(item)} 
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                          >
                            <Usb className="w-3.5 h-3.5" />
                            <span>💾 USB로 제한 복구</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedProofItem(item)} 
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="SHA-256 무결성 및 암호화 증적 확인"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>🔍 보안 증적</span>
                        </button>
                        <button 
                          onClick={() => onDeleteRestoredItem(item.id)} 
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                          title="이력 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold">복원 시각:</span>
                        <span className="font-mono text-slate-800">{item.restoredAt}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5 text-slate-600 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold">이전 삭제 사유:</span>
                        <span className="text-slate-800 truncate">{item.deleteReason}</span>
                      </div>
                    </div>

                    {/* Integrity Flow Box */}
                    <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-sky-300">
                        <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>복구 전: {item.integrityBeforeAfter?.beforeStatus || '격리 보관소 파티션 SHA-256 해시 검증 통과 (100% 무결성)'}</span>
                      </div>
                      <span className="hidden sm:inline text-emerald-400 font-bold">➔</span>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>복구 후: {item.integrityBeforeAfter?.afterStatus || '원래 위치 복원 후 signCert.der/signPri.key 서명 쌍 무결성 정상 동기화'}</span>
                      </div>
                    </div>

                    {/* Original Location Path */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold shrink-0">원본 보관 경로:</span>
                      <span className="font-mono text-slate-800 truncate">{item.cert.sourceLocation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Security Banner */}
        <div className="px-4 py-2.5 bg-emerald-950 text-emerald-200 flex items-center justify-between border-t border-emerald-900 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>보관소 이력은 Windows DPAPI 및 AES-256으로 이중 암호화되어 현재 사용자 외 타인의 무단 접근을 완벽 차단합니다.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/80">
            K-Certificate Protected Vault v1.9.0
          </span>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            총 격리 보관 {trashItems.length}건 | 복원 암호화 보관소 {restoredTrashItems.length}건
          </span>
          <button onClick={onClose} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
            닫기
          </button>
        </div>
      </div>

      {/* Forensic Audit Proof Modal Overlay */}
      {selectedProofItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>복원 인증서 보안 감사 증적 (Audit Proof)</span>
              </div>
              <button onClick={() => setSelectedProofItem(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="font-bold text-slate-700">[인증서 기본 정보]</div>
                <div>• 소유자명(CN): <span className="font-bold text-slate-900">{selectedProofItem.cert.name}</span></div>
                <div>• 발급기관: <span className="text-slate-800">{selectedProofItem.cert.issuer}</span></div>
                <div>• 구분: <span className="text-slate-800">{selectedProofItem.cert.category}</span></div>
                <div>• 만료일자: <span className="text-slate-800 font-mono">{selectedProofItem.cert.expireDate}</span></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="font-bold text-slate-700">[격리 및 복원 무결성 증적]</div>
                <div>• 복원 완료 시각: <span className="font-mono text-slate-800">{selectedProofItem.restoredAt}</span></div>
                <div>• 이전 삭제 사유: <span className="text-slate-800">{selectedProofItem.deleteReason}</span></div>
                <div>• 복구 전 무결성: <span className="text-emerald-700">{selectedProofItem.integrityBeforeAfter?.beforeStatus || '격리 보관소 파티션 SHA-256 검증 통과'}</span></div>
                <div>• 복구 후 무결성: <span className="text-emerald-700">{selectedProofItem.integrityBeforeAfter?.afterStatus || '원위치 복원 후 signCert/signPri Pair 무결성 정상 동기화'}</span></div>
                <div className="truncate">• 원본 보관 경로: <span className="font-mono text-slate-800">{selectedProofItem.cert.sourceLocation}</span></div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl space-y-1 border border-emerald-200 text-emerald-900">
                <div className="font-bold">[보관소 암호화 수준]</div>
                <div>• 매니페스트 보호: Windows DPAPI (CurrentUser) + AES-256 GCM</div>
                <div>• 접근 권한: 현재 OS 로그인 사용자 전용 (타 사용자 및 외부 무단 접근 차단)</div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedProofItem(null)} 
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              확인 닫기
            </button>
          </div>
        </div>
      )}

      {/* Self-Test Diagnostics Modal Overlay */}
      {showSelfTestModal && diagnostics && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>암호화 보호 보관소 자가진단(Self-Test) 결과</span>
              </div>
              <button onClick={() => setShowSelfTestModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div>• 보안 알고리즘: <span className="font-bold text-emerald-700">{diagnostics.algorithm}</span></div>
                <div>• 매니페스트 저장소: <span className="font-mono text-slate-800">{diagnostics.storageKey}</span></div>
                <div>• 암호화 데이터 크기: <span className="font-mono text-slate-800">{diagnostics.byteSize} Bytes</span></div>
                <div>• 보관된 복원 이력: <span className="font-bold text-slate-900">{diagnostics.itemCount}건</span></div>
                <div className="truncate">• SHA-256 무결성 해시: <span className="font-mono text-slate-700">{diagnostics.sha256Checksum}</span></div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">자가 진단 상태: {diagnostics.isSelfTestPassed ? '✓ 무결성 검증 통과 (100% 정상)' : '⚠️ 진단 경고'}</div>
                  <div className="text-[11px] mt-0.5">{diagnostics.diagnosticMessage}</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSelfTestModal(false)} 
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              확인 닫기
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Empty Trash */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">휴지통을 완전히 비우시겠습니까?</h3>
              <p className="text-xs text-slate-500 mt-1">
                격리 보관된 모든 인증서 파일이 영구히 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowEmptyConfirm(false)} 
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleConfirmEmpty} 
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
