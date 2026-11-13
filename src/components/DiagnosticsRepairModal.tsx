import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FolderSync,
  CopyCheck,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  ArrowRight,
  CheckCircle2,
  HardDrive,
  Laptop,
  Check,
  Sparkles,
} from 'lucide-react';
import { CertificateItem } from '../types';
import {
  analyzeDuplicateCertificates,
  analyzePathRepairs,
  PathRepairCandidate,
} from '../utils/certDiagnostics';

interface DiagnosticsRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: CertificateItem[];
  initialTab?: 'duplicates' | 'repairs';
  onMoveDuplicatesToTrash: (certsToTrash: CertificateItem[]) => void;
  onRepairFolders: (
    candidates: PathRepairCandidate[],
    trashSourceAfterCopy: boolean
  ) => void;
}

export const DiagnosticsRepairModal: React.FC<DiagnosticsRepairModalProps> = ({
  isOpen,
  onClose,
  certificates,
  initialTab = 'duplicates',
  onMoveDuplicatesToTrash,
  onRepairFolders,
}) => {
  const [activeTab, setActiveTab] = useState<'duplicates' | 'repairs'>(initialTab);
  const [selectedDupIds, setSelectedDupIds] = useState<string[]>([]);
  const [selectedRepairIds, setSelectedRepairIds] = useState<string[]>([]);
  const [trashSourceAfterRepair, setTrashSourceAfterRepair] = useState(true);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const dupSummary = useMemo(
    () => analyzeDuplicateCertificates(certificates),
    [certificates]
  );

  const repairCandidates = useMemo(
    () => analyzePathRepairs(certificates),
    [certificates]
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setActionBanner(null);

    const defaultDupIds = dupSummary.groups.flatMap((g) =>
      g.redundantEntries.filter((e) => e.defaultChecked).map((e) => e.cert.id)
    );
    setSelectedDupIds(defaultDupIds);
    setSelectedRepairIds(repairCandidates.map((r) => r.cert.id));
  }, [isOpen, initialTab, dupSummary, repairCandidates]);

  if (!isOpen) return null;

  const toggleDupId = (id: string) => {
    setSelectedDupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleRepairId = (id: string) => {
    setSelectedRepairIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedDupCerts = dupSummary.groups.flatMap((g) =>
    g.redundantEntries
      .filter((e) => selectedDupIds.includes(e.cert.id))
      .map((e) => e.cert)
  );

  const selectedRepairItems = repairCandidates.filter((r) =>
    selectedRepairIds.includes(r.cert.id)
  );

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const selectedReclaimableBytes = selectedDupCerts.reduce((sum, c) => {
    return sum + (c.files?.certSize || 2048) + (c.files?.keySize || 1536);
  }, 0);

  const handleConfirmMoveDuplicates = () => {
    if (selectedDupCerts.length === 0) return;
    onMoveDuplicatesToTrash(selectedDupCerts);
    setActionBanner(
      `중복 사본 ${selectedDupCerts.length}건을 안전하게 휴지통으로 이동했습니다.`
    );
  };

  const handleConfirmRepairFolders = () => {
    if (selectedRepairItems.length === 0) return;
    onRepairFolders(selectedRepairItems, trashSourceAfterRepair);
    setActionBanner(
      `비표준 인증서 ${selectedRepairItems.length}건을 표준 위치로 복구했습니다 (SHA-256 손상 검사 완료).`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[8px] shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--wpf-bg-dark)',
          border: '1px solid var(--wpf-border)',
          color: 'var(--wpf-text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: 'var(--wpf-bg-card)',
            borderBottom: '1px solid var(--wpf-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
              }}
            >
              <Sparkles className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold truncate">
                중복 인증서 정리 · 잘못된 폴더 자동 복구
              </h2>
              <p className="text-xs truncate" style={{ color: 'var(--wpf-text-secondary)' }}>
                같은 인증서의 중복 사본은 휴지통으로 격리하고, 인식되지 않는 폴더는 표준 위치로 복구합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="wpf-btn-secondary wpf-native p-1.5 rounded-[6px] cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Strip & Tabs */}
        <div
          className="px-5 pt-3 pb-0 flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: 'var(--wpf-bg-card)',
            borderBottom: '1px solid var(--wpf-border)',
          }}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('duplicates');
                setActionBanner(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'duplicates'
                  ? 'border-[#3B82F6] text-[#60A5FA]'
                  : 'border-transparent hover:opacity-85'
              }`}
              style={
                activeTab !== 'duplicates'
                  ? { color: 'var(--wpf-text-secondary)' }
                  : undefined
              }
            >
              <CopyCheck className="w-4 h-4" />
              <span>중복 인증서 정리</span>
              <span
                className="tabular-nums font-extrabold text-[11px]"
                style={{
                  color:
                    dupSummary.redundantCount > 0 ? '#F59E0B' : '#10B981',
                }}
              >
                {dupSummary.redundantCount}건
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('repairs');
                setActionBanner(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'repairs'
                  ? 'border-[#3B82F6] text-[#60A5FA]'
                  : 'border-transparent hover:opacity-85'
              }`}
              style={
                activeTab !== 'repairs'
                  ? { color: 'var(--wpf-text-secondary)' }
                  : undefined
              }
            >
              <FolderSync className="w-4 h-4" />
              <span>잘못된 폴더 자동 복구</span>
              <span
                className="tabular-nums font-extrabold text-[11px]"
                style={{
                  color: repairCandidates.length > 0 ? '#F59E0B' : '#10B981',
                }}
              >
                {repairCandidates.length}건
              </span>
            </button>
          </div>

          <div
            className="text-[11px] pb-2 flex items-center gap-3 tabular-nums"
            style={{ color: 'var(--wpf-text-secondary)' }}
          >
            <span>전체 스캔 {dupSummary.totalScanned}건</span>
            <span>·</span>
            <span>고유 인증서 {dupSummary.uniqueCount}건</span>
            <span>·</span>
            <span>정리 예상 {formatBytes(dupSummary.reclaimableBytes)}</span>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionBanner && (
          <div
            className="mx-5 mt-3 px-3.5 py-2 rounded-[6px] text-xs font-semibold flex items-center justify-between gap-2 shrink-0"
            style={{
              backgroundColor: 'var(--wpf-badge-valid-bg)',
              border: '1px solid var(--wpf-badge-valid-border)',
              color: 'var(--wpf-badge-valid-text)',
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionBanner(null)}
              className="opacity-75 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {activeTab === 'duplicates' ? (
            dupSummary.groups.length === 0 ? (
              <div
                className="py-12 px-6 text-center rounded-[8px] space-y-2"
                style={{
                  backgroundColor: 'var(--wpf-bg-card)',
                  border: '1px solid var(--wpf-border)',
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                <div className="text-sm font-bold">중복 저장된 인증서가 없습니다</div>
                <p className="text-xs" style={{ color: 'var(--wpf-text-secondary)' }}>
                  현재 PC와 USB의 모든 인증서가 고유한 원본으로 깔끔하게 관리되고 있습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div
                    className="flex items-center gap-2"
                    style={{ color: 'var(--wpf-text-secondary)' }}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>
                      각 묶음의 <strong>표준 원본 1개는 자동 보존</strong>되며 삭제되지 않습니다. 선택한 사본은 영구 삭제 대신 <strong>휴지통</strong>으로 이동합니다.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDupIds(
                          dupSummary.groups.flatMap((g) =>
                            g.redundantEntries
                              .filter((e) => e.defaultChecked)
                              .map((e) => e.cert.id)
                          )
                        )
                      }
                      className="wpf-btn-secondary wpf-native px-2.5 py-1 text-[11px] cursor-pointer"
                    >
                      권장 항목만 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDupIds([])}
                      className="wpf-btn-secondary wpf-native px-2.5 py-1 text-[11px] cursor-pointer"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>

                {dupSummary.groups.map((group) => (
                  <div
                    key={group.key}
                    className="rounded-[8px] overflow-hidden"
                    style={{
                      backgroundColor: 'var(--wpf-bg-card)',
                      border: '1px solid var(--wpf-border)',
                    }}
                  >
                    {/* Group Header */}
                    <div
                      className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
                      style={{
                        backgroundColor: 'var(--wpf-bg-dark)',
                        borderBottom: '1px solid var(--wpf-border)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold truncate">
                          {group.name}
                        </span>
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--wpf-text-secondary)' }}
                        >
                          · {group.issuer} · 만료 {group.validTo}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--wpf-text-muted)' }}>
                        총 {group.redundantEntries.length + 1}개 사본 (일련번호 {group.serialNumber})
                      </div>
                    </div>

                    {/* Primary Preserved Row */}
                    <div
                      className="px-4 py-2.5 flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.06)',
                        borderBottom: '1px solid var(--wpf-border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#34D399]">
                            <span>표준 원본 · 자동 보존 (삭제 불가)</span>
                            <span style={{ color: 'var(--wpf-text-secondary)' }}>
                              · {group.primaryCert.sourceDrive}
                            </span>
                          </div>
                          <div
                            className="text-[11px] font-mono truncate mt-0.5"
                            style={{ color: 'var(--wpf-text-secondary)' }}
                            title={group.primaryCert.sourceLocation}
                          >
                            {group.primaryCert.sourceLocation}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Redundant Copy Rows */}
                    <div className="divide-y" style={{ borderColor: 'var(--wpf-border)' }}>
                      {group.redundantEntries.map((entry) => {
                        const checked = selectedDupIds.includes(entry.cert.id);
                        const isUsb = entry.locationKind === 'USB';
                        return (
                          <label
                            key={entry.cert.id}
                            className="px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDupId(entry.cert.id)}
                                className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer shrink-0"
                              />
                              {isUsb ? (
                                <HardDrive className="w-4 h-4 text-[#34D399] shrink-0" />
                              ) : (
                                <Laptop className="w-4 h-4 text-[#60A5FA] shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-semibold">
                                    {entry.cert.sourceDrive}
                                  </span>
                                  <span
                                    className="font-semibold"
                                    style={{
                                      color:
                                        entry.locationKind === 'PC_NON_STANDARD'
                                          ? '#F59E0B'
                                          : isUsb
                                          ? '#34D399'
                                          : 'var(--wpf-text-secondary)',
                                    }}
                                  >
                                    · {entry.reasonBadge}
                                  </span>
                                </div>
                                <div
                                  className="text-[11px] font-mono truncate mt-0.5"
                                  style={{ color: 'var(--wpf-text-secondary)' }}
                                  title={entry.cert.sourceLocation}
                                >
                                  {entry.cert.sourceLocation}
                                </div>
                              </div>
                            </div>

                            <span
                              className="text-[11px] tabular-nums shrink-0"
                              style={{ color: 'var(--wpf-text-muted)' }}
                            >
                              {formatBytes(
                                (entry.cert.files?.certSize || 2048) +
                                  (entry.cert.files?.keySize || 1536)
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )
          ) : repairCandidates.length === 0 ? (
            <div
              className="py-12 px-6 text-center rounded-[8px] space-y-2"
              style={{
                backgroundColor: 'var(--wpf-bg-card)',
                border: '1px solid var(--wpf-border)',
              }}
            >
              <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
              <div className="text-sm font-bold">잘못된 폴더 위치가 감지되지 않았습니다</div>
              <p className="text-xs" style={{ color: 'var(--wpf-text-secondary)' }}>
                모든 인증서가 정부(GPKI)·교육(EPKI)·은행(NPKI) 표준 폴더에 올바르게 저장되어 있습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div
                  className="flex items-center gap-2"
                  style={{ color: 'var(--wpf-text-secondary)' }}
                >
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>
                    먼저 표준 위치로 안전하게 복사·손상 검사(SHA-256)를 완료한 뒤 기존 비표준 폴더를 정리합니다.
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold">
                  <input
                    type="checkbox"
                    checked={trashSourceAfterRepair}
                    onChange={(e) => setTrashSourceAfterRepair(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                  />
                  <span>복구 완료 후 기존 잘못된 폴더를 휴지통으로 정리</span>
                </label>
              </div>

              <div className="space-y-3">
                {repairCandidates.map((item) => {
                  const checked = selectedRepairIds.includes(item.cert.id);
                  return (
                    <label
                      key={item.cert.id}
                      className="block rounded-[8px] p-3.5 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--wpf-bg-card)',
                        border: checked
                          ? '1px solid #3B82F6'
                          : '1px solid var(--wpf-border)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRepairId(item.cert.id)}
                          className="w-4 h-4 mt-0.5 rounded accent-[#2563EB] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">
                                {item.cert.name}
                              </span>
                              <span className="text-xs font-semibold text-[#F59E0B]">
                                · {item.issueTitle}
                              </span>
                            </div>
                            <span
                              className="text-[11px]"
                              style={{ color: 'var(--wpf-text-secondary)' }}
                            >
                              {item.cert.issuer}
                            </span>
                          </div>

                          <p
                            className="text-xs"
                            style={{ color: 'var(--wpf-text-secondary)' }}
                          >
                            {item.issueDescription}
                          </p>

                          {/* Before -> After Diff Preview */}
                          <div
                            className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-2 p-2.5 rounded-[6px] text-[11px] font-mono"
                            style={{
                              backgroundColor: 'var(--wpf-bg-dark)',
                              border: '1px solid var(--wpf-border)',
                            }}
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-sans font-bold text-[#F59E0B] mb-0.5">
                                현재 위치 (비표준 · 미인식)
                              </div>
                              <div className="truncate" title={item.sourcePath}>
                                {item.sourcePath}
                              </div>
                            </div>

                            <ArrowRight className="w-4 h-4 text-[#10B981] shrink-0 hidden lg:block" />

                            <div className="min-w-0">
                              <div className="text-[10px] font-sans font-bold text-[#34D399] mb-0.5">
                                복구 위치 (표준 경로)
                              </div>
                              <div
                                className="truncate text-[#6EE7B7]"
                                title={item.canonicalPath}
                              >
                                {item.canonicalPath}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: 'var(--wpf-bg-card)',
            borderTop: '1px solid var(--wpf-border)',
          }}
        >
          <div className="text-xs" style={{ color: 'var(--wpf-text-secondary)' }}>
            {activeTab === 'duplicates' ? (
              <span className="tabular-nums">
                선택된 사본 <strong>{selectedDupCerts.length}건</strong> · 예상 정리 용량{' '}
                <strong>{formatBytes(selectedReclaimableBytes)}</strong>
              </span>
            ) : (
              <span className="tabular-nums">
                복구 대상 <strong>{selectedRepairItems.length}건</strong> 선택됨
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="wpf-btn-secondary wpf-native px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              닫기
            </button>

            {activeTab === 'duplicates' ? (
              <button
                type="button"
                disabled={selectedDupCerts.length === 0}
                onClick={handleConfirmMoveDuplicates}
                className="px-4 py-2 rounded-[6px] bg-[#D97706] hover:bg-[#B45309] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 항목 휴지통으로 이동 ({selectedDupCerts.length})</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={selectedRepairItems.length === 0}
                onClick={handleConfirmRepairFolders}
                className="px-4 py-2 rounded-[6px] bg-[#059669] hover:bg-[#047857] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>표준 위치로 복구 ({selectedRepairItems.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
