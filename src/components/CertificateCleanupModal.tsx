import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  UserCheck, 
  Users, 
  CalendarX, 
  ShieldAlert, 
  FileKey, 
  Folder, 
  Check, 
  Clock,
  Info,
  Laptop,
  HardDrive
} from 'lucide-react';
import { CertificateItem } from '../types';

export type CleanupModalMode = 'EXPIRED' | 'OTHER_USERS' | 'SELECTED' | 'SINGLE';
export type StorageMediumFilter = 'ALL' | 'LOCAL' | 'REMOVABLE';

interface CertificateCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: CertificateItem[];
  mode: CleanupModalMode;
  singleCert: CertificateItem | null;
  selectedIds: string[];
  onDeleteCertificates: (ids: string[], reason: string) => void;
}

export const CertificateCleanupModal: React.FC<CertificateCleanupModalProps> = ({
  isOpen,
  onClose,
  certificates,
  mode: initialMode,
  singleCert,
  selectedIds,
  onDeleteCertificates,
}) => {
  const [activeTab, setActiveTab] = useState<CleanupModalMode>(initialMode);
  const [storageFilter, setStorageFilter] = useState<StorageMediumFilter>('ALL');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Helper to determine if a cert is on removable USB
  const isUsbCert = (cert: CertificateItem): boolean => {
    const loc = (cert.sourceLocation || '').toUpperCase();
    const drv = (cert.sourceDrive || '').toUpperCase();
    return drv.includes('이동식') || drv.includes('USB') || loc.startsWith('E:') || loc.startsWith('F:') || loc.startsWith('G:') || loc.startsWith('H:');
  };

  const getDriveBadge = (cert: CertificateItem) => {
    const isUsb = isUsbCert(cert);
    let driveLetter = 'C:';
    if (cert.sourceLocation && cert.sourceLocation.length >= 2 && cert.sourceLocation[1] === ':') {
      driveLetter = cert.sourceLocation.substring(0, 2);
    } else if (cert.sourceDrive && cert.sourceDrive.length >= 2 && cert.sourceDrive[1] === ':') {
      driveLetter = cert.sourceDrive.substring(0, 2);
    }

    if (isUsb) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
          <HardDrive className="w-3 h-3 text-emerald-600" />
          <span>USB 이동식 ({driveLetter})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
        <Laptop className="w-3 h-3 text-blue-600" />
        <span>컴퓨터 로컬 ({driveLetter})</span>
      </span>
    );
  };

  // For OTHER_USERS mode: primary user selection
  const distinctUsers = useMemo(() => {
    const map = new Map<string, CertificateItem[]>();
    certificates.forEach(c => {
      const list = map.get(c.name) || [];
      list.push(c);
      map.set(c.name, list);
    });
    return Array.from(map.entries()).map(([name, certs]) => ({
      name,
      count: certs.length,
      certs,
    }));
  }, [certificates]);

  // Default "my user name" to first user or '홍길동' if present
  const [myUserName, setMyUserName] = useState<string>(() => {
    const hong = distinctUsers.find(u => u.name === '홍길동');
    return hong ? hong.name : (distinctUsers[0]?.name || '');
  });

  // Base raw candidates per tab
  const rawCandidates = useMemo(() => {
    switch (activeTab) {
      case 'EXPIRED':
        return certificates.filter(c => c.status === 'expired');
      case 'OTHER_USERS':
        return certificates.filter(c => c.name !== myUserName);
      case 'SELECTED':
        return certificates.filter(c => selectedIds.includes(c.id));
      case 'SINGLE':
        return singleCert ? [singleCert] : [];
      default:
        return [];
    }
  }, [activeTab, certificates, myUserName, selectedIds, singleCert]);

  // Counts by storage medium for the current active tab
  const storageCounts = useMemo(() => {
    const all = rawCandidates.length;
    const local = rawCandidates.filter(c => !isUsbCert(c)).length;
    const usb = rawCandidates.filter(c => isUsbCert(c)).length;
    return { all, local, usb };
  }, [rawCandidates]);

  // Filtered target certs by storage medium
  const currentTargetCerts = useMemo(() => {
    return rawCandidates.filter(cert => {
      const isUsb = isUsbCert(cert);
      if (storageFilter === 'LOCAL' && isUsb) return false;
      if (storageFilter === 'REMOVABLE' && !isUsb) return false;
      return true;
    });
  }, [rawCandidates, storageFilter]);

  // Synchronize modal state reliably upon open
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setIsConfirmed(false);
      setIsDeleting(false);

      let initialCands: CertificateItem[] = [];
      if (initialMode === 'EXPIRED') {
        const expiredAll = certificates.filter(c => c.status === 'expired');
        const localExpired = expiredAll.filter(c => !isUsbCert(c));
        const usbExpired = expiredAll.filter(c => isUsbCert(c));

        // User safety default: prioritize LOCAL first to prevent accidental USB wiping
        if (localExpired.length > 0) {
          setStorageFilter('LOCAL');
          initialCands = localExpired;
        } else if (usbExpired.length > 0) {
          setStorageFilter('REMOVABLE');
          initialCands = usbExpired;
        } else {
          setStorageFilter('ALL');
          initialCands = expiredAll;
        }
      } else if (initialMode === 'OTHER_USERS') {
        setStorageFilter('ALL');
        initialCands = certificates.filter(c => c.name !== myUserName);
      } else if (initialMode === 'SELECTED') {
        setStorageFilter('ALL');
        initialCands = certificates.filter(c => selectedIds.includes(c.id));
      } else if (initialMode === 'SINGLE' && singleCert) {
        setStorageFilter('ALL');
        initialCands = [singleCert];
      }
      setCheckedIds(initialCands.map(c => c.id));
    }
  }, [isOpen, initialMode]);

  const handleTabChange = (tab: CleanupModalMode) => {
    setActiveTab(tab);
    setStorageFilter('ALL');
    setIsConfirmed(false);
    let cands: CertificateItem[] = [];
    if (tab === 'EXPIRED') {
      cands = certificates.filter(c => c.status === 'expired');
    } else if (tab === 'OTHER_USERS') {
      cands = certificates.filter(c => c.name !== myUserName);
    } else if (tab === 'SELECTED') {
      cands = certificates.filter(c => selectedIds.includes(c.id));
    }
    setCheckedIds(cands.map(c => c.id));
  };

  const handleStorageFilterChange = (sf: StorageMediumFilter) => {
    setStorageFilter(sf);
    const filtered = rawCandidates.filter(cert => {
      const isUsb = isUsbCert(cert);
      if (sf === 'LOCAL' && isUsb) return false;
      if (sf === 'REMOVABLE' && !isUsb) return false;
      return true;
    });
    setCheckedIds(filtered.map(c => c.id));
  };

  // When myUserName changes in OTHER_USERS mode
  const handleMyUserChange = (newName: string) => {
    setMyUserName(newName);
    if (activeTab === 'OTHER_USERS') {
      const others = certificates.filter(c => c.name !== newName);
      setCheckedIds(others.map(c => c.id));
    }
  };

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrent = () => {
    setCheckedIds(currentTargetCerts.map(c => c.id));
  };

  const handleClearAllCurrent = () => {
    setCheckedIds([]);
  };

  const handleExecuteDelete = async () => {
    if (checkedIds.length === 0) return;

    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 500));
    setIsDeleting(false);

    let storageLabel = '전체 매체';
    if (storageFilter === 'LOCAL') storageLabel = '컴퓨터 로컬';
    else if (storageFilter === 'REMOVABLE') storageLabel = 'USB 이동식';

    let reason = `선택한 인증서 ${checkedIds.length}건 일괄 삭제 [${storageLabel}]`;
    if (activeTab === 'EXPIRED') reason = `만료된 인증서 ${checkedIds.length}건 정리 [${storageLabel}]`;
    else if (activeTab === 'OTHER_USERS') reason = `타인 인증서 ${checkedIds.length}건 정리 [${storageLabel}] (보존: ${myUserName})`;
    else if (activeTab === 'SINGLE' && singleCert) reason = `인증서 단독 삭제 (${singleCert.name})`;

    onDeleteCertificates(checkedIds, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>인증서 안전 영구 삭제 및 정리</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                  로컬 파일 영구 제거
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                불필요한 만료 인증서 및 공용 PC에 남아있는 타인의 인증서를 안전하게 정리합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Expired vs Other Users vs Selected) */}
        {activeTab !== 'SINGLE' && (
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('EXPIRED')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'EXPIRED'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarX className="w-4 h-4" />
              <span>만료된 인증서 정리 ({certificates.filter(c => c.status === 'expired').length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('OTHER_USERS')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'OTHER_USERS'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>다른 사용자 인증서 정리 ({certificates.filter(c => c.name !== myUserName).length})</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange('SELECTED')}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'SELECTED'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>선택된 항목 정리 ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Storage Medium Filter Control (User request: USB / 컴퓨터 구분 정리 옵션) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>정리 대상 저장 매체 선택:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                컴퓨터 또는 USB 드라이브를 구분하여 개별/일괄 정리할 수 있습니다.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleStorageFilterChange('ALL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  storageFilter === 'ALL'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🌐 전체 매체</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  storageFilter === 'ALL' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {storageCounts.all}건
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStorageFilterChange('LOCAL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  storageFilter === 'LOCAL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>💻 컴퓨터만 (PC)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  storageFilter === 'LOCAL' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {storageCounts.local}건
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStorageFilterChange('REMOVABLE')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  storageFilter === 'REMOVABLE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>💾 USB 이동식만</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  storageFilter === 'REMOVABLE' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {storageCounts.usb}건
                </span>
              </button>
            </div>

            {/* Safety protection feedback banner */}
            {storageFilter === 'LOCAL' && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>실수 방지 보호 활성화:</strong> [컴퓨터(PC) 로컬]의 인증서만 대상입니다. <strong>연결된 USB 드라이브의 인증서는 절대 삭제되지 않고 안전하게 보존</strong>됩니다.
                </span>
              </div>
            )}
            {storageFilter === 'REMOVABLE' && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>실수 방지 보호 활성화:</strong> [USB 이동식]의 인증서만 대상입니다. <strong>컴퓨터(PC) 로컬의 모든 인증서는 절대 삭제되지 않고 안전하게 보존</strong>됩니다.
                </span>
              </div>
            )}
            {storageFilter === 'ALL' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>전체 매체 선택됨:</strong> 컴퓨터(PC) 및 USB의 인증서가 모두 포함됩니다. 실수 방지를 원하시면 위의 [컴퓨터만] 또는 [USB만]을 선택해 주세요.
                </span>
              </div>
            )}
          </div>

          {/* Tab Description & Context */}
          {activeTab === 'EXPIRED' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">유효기간이 만료된 구형 인증서 정리</span>
                <p className="text-amber-800 mt-0.5">
                  만료된 인증서는 전자금융거래 및 공문서 서명이 불가능합니다. 상단에서 <strong>[컴퓨터만]</strong> 또는 <strong>[USB 이동식만]</strong>을 선택하여 원하는 매체의 만료 인증서만 안전하게 분리 정리할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'OTHER_USERS' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 flex items-start gap-3">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">내 인증서 보존 및 타인 인증서 정리</span>
                  <p className="text-blue-800 mt-0.5">
                    공용 PC 또는 USB에 남아있는 <strong>다른 사용자의 인증서만 선별하여 정리</strong>합니다.
                  </p>
                </div>
              </div>

              {/* Selector for "My User Name" */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>보존할 [내 인증서 / 본인 이름] 선택</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    * 이 사용자의 인증서는 절대 삭제되지 않습니다
                  </span>
                </label>
                <select
                  value={myUserName}
                  onChange={e => handleMyUserChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {distinctUsers.map(user => (
                    <option key={user.name} value={user.name}>
                      👤 {user.name} (보유 인증서: {user.count}건 - {user.certs.map(c => c.category === 'GPKI_GOV' ? '공무원' : '은행').join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'SINGLE' && singleCert && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">선택한 인증서 1건 영구 삭제</span>
                <p className="text-rose-800 mt-0.5">
                  아래 인증서 파일 및 개인키 파일이 디스크에서 완전히 삭제됩니다. 삭제 전 백업 여부를 반드시 확인하세요.
                </p>
              </div>
            </div>
          )}

          {/* List of Target Certificates to be deleted */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                삭제 대상 인증서 목록 ({currentTargetCerts.length}개 중 {checkedIds.length}개 선택됨)
              </span>

              {currentTargetCerts.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllCurrent}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    전체 선택
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllCurrent}
                    className="text-slate-500 hover:underline font-semibold cursor-pointer"
                  >
                    선택 해제
                  </button>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {currentTargetCerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    {activeTab === 'EXPIRED' 
                      ? (storageFilter === 'LOCAL' 
                          ? '컴퓨터에 만료된 인증서가 없습니다.' 
                          : storageFilter === 'REMOVABLE' 
                          ? 'USB에 만료된 인증서가 없습니다.' 
                          : '만료된 인증서가 없습니다. 시스템이 안전합니다!') 
                      : '정리 대상 인증서가 없습니다.'}
                  </p>
                </div>
              ) : (
                currentTargetCerts.map(cert => {
                  const isChecked = checkedIds.includes(cert.id);
                  return (
                    <div
                      key={cert.id}
                      onClick={() => toggleCheck(cert.id)}
                      className={`p-3 sm:px-4 flex items-start gap-3 text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-rose-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by row click
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{cert.name}</span>
                          {getDriveBadge(cert)}
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {cert.category === 'GPKI_GOV' ? '공무원 GPKI' : cert.category === 'EPKI_EDU' ? '교육 EPKI' : '금융 NPKI'}
                          </span>
                          {cert.status === 'expired' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">
                              만료됨 ({cert.validTo})
                            </span>
                          )}
                          {cert.name !== myUserName && activeTab === 'OTHER_USERS' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              타인 인증서
                            </span>
                          )}
                        </div>

                        {cert.departmentOrOrg && (
                          <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                            {cert.departmentOrOrg} · {cert.issuer}
                          </div>
                        )}

                        <div className="text-[10px] font-mono text-slate-400 mt-1 truncate bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200/50">
                          {cert.sourceLocation}
                        </div>

                        <div className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1 font-mono">
                          <span>삭제될 파일:</span>
                          <span>{cert.files.certName}, {cert.files.keyName} {cert.files.kmCertName ? `(+ ${cert.files.kmCertName})` : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Deletion Warning Box */}
          {checkedIds.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>삭제 및 임시 보관 안내</span>
              </div>
              <p className="leading-relaxed">
                인증서 공개키(`signCert.der`) 및 비밀키(`signPri.key`)가 활성 목록에서 삭제 처리됩니다. 실수로 삭제한 경우라도 <strong className="text-slate-800">[인증서 휴지통]</strong> 및 알림의 <strong className="text-slate-800">[실행 취소(Undo)]</strong> 버튼을 통해 언제든지 원래 위치로 안전하게 복원할 수 있습니다.
              </p>

              <label className="flex items-center gap-2 pt-1.5 border-t border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={e => setIsConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">
                  위 내용을 확인하였으며, [
                  {storageFilter === 'LOCAL' ? '컴퓨터(PC) 로컬' : storageFilter === 'REMOVABLE' ? 'USB 이동식' : '전체 매체'}
                  ]에서 선택한 {checkedIds.length}건의 인증서를 안전 휴지통으로 이동(정리)하는 것에 동의합니다.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            선택된 삭제 대상: <strong className="text-rose-600">{checkedIds.length}건</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleExecuteDelete}
              disabled={checkedIds.length === 0 || !isConfirmed || isDeleting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>안전 삭제 처리 중...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {activeTab === 'EXPIRED' 
                      ? `[${storageFilter === 'LOCAL' ? '컴퓨터만' : storageFilter === 'REMOVABLE' ? 'USB만' : '전체'}] 만료 인증서 ${checkedIds.length}건 정리` 
                      : activeTab === 'OTHER_USERS'
                      ? `타인 인증서 ${checkedIds.length}건 삭제`
                      : `선택한 인증서 ${checkedIds.length}건 영구 삭제`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
