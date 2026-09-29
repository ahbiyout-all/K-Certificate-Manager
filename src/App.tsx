/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  INITIAL_CERTIFICATES, 
  INITIAL_SEARCH_PATHS, 
  INITIAL_DRIVES 
} from './data/defaultCertificates';
import { 
  CertificateItem, 
  SearchPath, 
  DiskDrive, 
  BackupHistoryItem,
  TrashItem,
  AppLogItem,
  AppTheme
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuickTransferConfigCard } from './components/QuickTransferConfigCard';
import { ConnectedDrivesBar } from './components/ConnectedDrivesBar';
import { SearchLocationsPanel } from './components/SearchLocationsPanel';
import { CertificateList } from './components/CertificateList';
import { BackupModal } from './components/BackupModal';
import { CertificateDetailModal } from './components/CertificateDetailModal';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { BackupHistoryPanel } from './components/BackupHistoryPanel';
import { CertificateCleanupModal, CleanupModalMode } from './components/CertificateCleanupModal';
import { TrashModal } from './components/TrashModal';
import { UsbToPcModal } from './components/UsbToPcModal';
import { UsbDetectedPromptModal } from './components/UsbDetectedPromptModal';
import { UsbDetectedBanner } from './components/UsbDetectedBanner';
import { AppActivityLogModal } from './components/AppActivityLogModal';
import { LicenseModal } from './components/LicenseModal';
import { CoreSpecModal } from './components/CoreSpecModal';
import { UsbDiagnosticModal } from './components/UsbDiagnosticModal';
import { DesktopAppModal } from './components/DesktopAppModal';
import { RenewalGuidanceModal } from './components/RenewalGuidanceModal';
import { UpdateModal } from './components/UpdateModal';
import { checkForAppUpdates, UpdateInfo } from './utils/updateChecker';
import { playSuccessChime } from './utils/audioFeedback';
import { 
  UsbDetectedCert, 
  getAvailableUsbCertificates,
  startUsbDriveWatcher, 
  subscribeUsbDriveChanges, 
  simulateUsbMount, 
  simulateUsbUnmount,
  setActiveDrives 
} from './utils/usbToPcService';
import { isNonStandardCertPath } from './utils/certPathUtils';
import { getStoredActivityLogs, logActivity, clearAllActivityLogs } from './utils/activityLogger';
import { 
  CheckCircle2, 
  X,
  Lock,
  RotateCcw,
  Trash2,
  ExternalLink,
  FileText
} from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from './version';

interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'delete' | 'info';
  onUndo?: () => void;
  onOpenTrash?: () => void;
}

export default function App() {
  const [certificates, setCertificates] = useState<CertificateItem[]>(INITIAL_CERTIFICATES);
  const [searchPaths, setSearchPaths] = useState<SearchPath[]>(INITIAL_SEARCH_PATHS);
  const [availableDrives, setAvailableDrives] = useState<DiskDrive[]>(INITIAL_DRIVES);
  const [selectedIds, setSelectedIds] = useState<string[]>(['cert-1', 'cert-2']);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('drive-e');
  const [activeNavTab, setActiveNavTab] = useState<'copy' | 'history' | 'paths' | 'security'>('copy');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupMode, setCleanupMode] = useState<CleanupModalMode>('EXPIRED');
  const [targetSingleCertForDelete, setTargetSingleCertForDelete] = useState<CertificateItem | null>(null);

  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isUsbToPcModalOpen, setIsUsbToPcModalOpen] = useState(false);
  const [isUsbPromptOpen, setIsUsbPromptOpen] = useState(false);
  const [promptUsbDrive, setPromptUsbDrive] = useState<DiskDrive | null>(null);
  const [promptUsbCerts, setPromptUsbCerts] = useState<UsbDetectedCert[]>([]);
  const [targetUsbLetterForModal, setTargetUsbLetterForModal] = useState<string | undefined>(undefined);
  const [isDismissedUsbBanner, setIsDismissedUsbBanner] = useState(false);
  const [isUsbDiagnosticModalOpen, setIsUsbDiagnosticModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isCoreSpecModalOpen, setIsCoreSpecModalOpen] = useState(false);
  const [isDesktopAppModalOpen, setIsDesktopAppModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [certsForRenewalModal, setCertsForRenewalModal] = useState<CertificateItem[]>([]);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<AppLogItem[]>(() => getStoredActivityLogs());
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('kcert_app_theme');
      if (saved) {
        if (saved === 'dark' || saved === 'pastel-black') return 'dark';
        if (saved === 'gray' || saved === 'pastel-gray') return 'gray';
        if (saved === 'beige' || saved === 'pastel-beige') return 'beige';
        if (saved === 'white' || saved === 'pastel-white' || saved === 'classic') return 'white';
      }
    } catch {
      // Fallback
    }
    return 'beige';
  });
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    try {
      const saved = localStorage.getItem('kcert_trash_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCertForDetail, setSelectedCertForDetail] = useState<CertificateItem | null>(null);
  const [lastScanTime, setLastScanTime] = useState('오늘 14:02');
  const [recentlyCopiedIds, setRecentlyCopiedIds] = useState<string[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const pathsPanelRef = useRef<HTMLDivElement>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const copyPanelRef = useRef<HTMLDivElement>(null);

  const triggerCopiedHighlight = (certIds: string[]) => {
    if (!certIds || certIds.length === 0) return;
    setRecentlyCopiedIds(certIds);
    playSuccessChime();
    setTimeout(() => {
      setRecentlyCopiedIds([]);
    }, 2800);
  };

  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('kcert_backup_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<any>(null);

  // Calculate all certificates available on currently connected USB drives
  const allConnectedUsbCerts = useMemo(() => {
    return getAvailableUsbCertificates(availableDrives);
  }, [availableDrives]);

  const nonStandardCount = useMemo(() => {
    return certificates.filter(c => c.isCustomPath || isNonStandardCertPath(c.sourceLocation)).length;
  }, [certificates]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem('kcert_app_theme', newTheme);
    } catch (e) {
      console.warn('Theme localStorage error:', e);
    }
  };

  // Save backup history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kcert_backup_history', JSON.stringify(backupHistory));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [backupHistory]);

  // Save trash items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kcert_trash_items', JSON.stringify(trashItems));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [trashItems]);

  // Synchronize available drives with USB Watcher Service
  useEffect(() => {
    setActiveDrives(availableDrives);
  }, [availableDrives]);

  // Start Real-time USB Drive Watcher and subscribe to Mount/Unmount events
  useEffect(() => {
    const unsubscribe = subscribeUsbDriveChanges((event) => {
      setAvailableDrives(event.allDrives);

      if (event.type === 'mount') {
        const detectedCerts = event.detectedCerts && event.detectedCerts.length > 0
          ? event.detectedCerts
          : getAvailableUsbCertificates(event.allDrives, event.drive.letter);

        // USB 감지 시 자동 실행 마법사 제거 (사용자 요구사항 반영)
        // 화면을 가리는 강제 모달 팝업 없이, 백그라운드에서 드라이브 목록과 인증서를 조용히 자동 동기화합니다.
        setPromptUsbDrive(event.drive);
        setPromptUsbCerts(detectedCerts);
        setTargetUsbLetterForModal(event.drive.letter);
        setIsDismissedUsbBanner(false);

        // 복사 마법사(UsbToPcModal) 자동 실행 제거
        setIsUsbToPcModalOpen(false);
        setIsUsbPromptOpen(false);

        const certCountText = detectedCerts.length > 0 
          ? `인증서 ${detectedCerts.length}건 발견` 
          : '이동식 USB 연결';
        showToast(`💾 [USB 연결] ${event.drive.letter} (${event.drive.name}) 인식 완료 (${certCountText})`);
        
        // Auto-refresh scan for certificates on newly mounted drive
        handleRefresh(`⚡ ${event.drive.letter} 드라이브 감지 및 인증서 자동 스캔을 완료했습니다.`);

        const newLog = logActivity({
          category: 'SCAN',
          level: 'SUCCESS',
          action: '이동식 USB 디바이스 실시간 마운트 감지',
          details: `${event.drive.letter} (${event.drive.name}) 자동 인식 (인증서 ${detectedCerts?.length || 0}건 발견)`,
          source: event.drive.letter,
          count: detectedCerts?.length || 1
        });
        setActivityLogs(prev => [newLog, ...prev]);
      } else if (event.type === 'unmount') {
        showToast(`⚠️ [USB 분리] 이동식 드라이브(${event.drive.letter})가 제거되었습니다.`);

        const newLog = logActivity({
          category: 'SCAN',
          level: 'WARN',
          action: '이동식 USB 디바이스 분리 감지',
          details: `${event.drive.letter} (${event.drive.name}) 디바이스 해제됨`,
          source: event.drive.letter,
          count: 0
        });
        setActivityLogs(prev => [newLog, ...prev]);
      }
    });

    const stopWatcher = startUsbDriveWatcher({
      intervalMs: 8000,
      onDrivesChanged: (drives) => {
        setAvailableDrives(drives);
      }
    });

    return () => {
      unsubscribe();
      stopWatcher();
    };
  }, []);

  const showToast = (msg: string, undoAction?: () => void, openTrashAction?: () => void) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastData({
      id: `toast-${Date.now()}`,
      message: msg,
      type: undoAction ? 'delete' : 'info',
      onUndo: undoAction,
      onOpenTrash: openTrashAction,
    });
    toastTimerRef.current = setTimeout(() => {
      setToastData(null);
    }, undoAction ? 8500 : 3500);
  };

  // Check for app updates on startup
  useEffect(() => {
    checkForAppUpdates()
      .then(info => {
        setUpdateInfo(info);
        if (info.hasUpdate) {
          showToast(`✨ 새 버전 v${info.latestVersion}이 출시되었습니다! 상단에서 확인하세요.`);
        }
      })
      .catch(() => {});
  }, []);

  const handleManualCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    showToast('🔍 GitHub 최신 릴리스 및 버전 수동 확인 중...');
    try {
      const info = await checkForAppUpdates();
      setUpdateInfo(info);
      playSuccessChime();
      if (info.hasUpdate) {
        showToast(`🚀 새 버전 v${info.latestVersion} 감지됨! 업데이트 모달에서 확인하세요.`);
      } else {
        showToast(`✅ 현재 설치된 v${info.currentVersion} 버전이 최신 버전입니다.`);
      }
      setIsUpdateModalOpen(true);
    } catch {
      showToast('⚠️ 업데이트 확인 중 일시적인 오류가 발생했습니다.');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  // Toggle search path
  const handleTogglePath = (id: string) => {
    setSearchPaths(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p));
      
      const enabledTypes = updated.filter(p => p.enabled).map(p => p.type);
      const isUsbEnabled = updated.some(p => p.type === 'removable_usb' && p.enabled);
      
      setCertificates(() => {
        return INITIAL_CERTIFICATES.filter(cert => {
          if (cert.sourceLocation.startsWith('E:') && !isUsbEnabled) return false;
          if (cert.category === 'GPKI_GOV' && !enabledTypes.includes('default_gpki')) return false;
          if (cert.category === 'EPKI_EDU' && !enabledTypes.includes('default_epki')) return false;
          if (cert.category === 'NPKI_BANK' && !enabledTypes.includes('default_npki') && !cert.sourceLocation.startsWith('E:')) return false;
          if (cert.category === 'NPKI_CORP' && !enabledTypes.includes('default_npki')) return false;
          return true;
        });
      });

      return updated;
    });
  };

  // Add custom path
  const handleAddCustomPath = (pathStr: string) => {
    const newPath: SearchPath = {
      id: `custom-path-${Date.now()}`,
      name: `사용자 정의 경로 (${pathStr})`,
      path: pathStr,
      type: 'custom',
      exists: true,
      enabled: true,
      description: '사용자가 직접 등록한 인증서 탐색 위치',
      countFound: 1,
    };

    setSearchPaths(prev => [...prev, newPath]);
    showToast(`경로 [${pathStr}]가 성공적으로 등록되었습니다.`);
  };

  // Add custom scanned certificates from File System API or Folder upload
  const handleCustomScannedCerts = (newCerts: CertificateItem[]) => {
    setCertificates(prev => {
      const existingIds = new Set(prev.filter(Boolean).map(c => c.id));
      const filteredNew = newCerts.filter(c => c && c.id && !existingIds.has(c.id));
      return [...filteredNew, ...prev];
    });

    setSelectedIds(prev => [...new Set([...prev, ...newCerts.filter(Boolean).map(c => c.id)])]);
    showToast(`${newCerts.length}개의 인증서를 로드하여 목록에 추가했습니다.`);
  };

  // Global F5 shortcut for in-app refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [certificates.length]);

  // Refresh scan simulation (allows custom toast message after copy operations)
  const handleRefresh = async (customMessage?: string) => {
    setIsScanning(true);

    // 1. Recalculate validity and remaining days against current time
    const nowMs = Date.now();
    setCertificates(prevCerts => {
      return prevCerts.map(cert => {
        try {
          const expiryMs = new Date(cert.validTo).getTime();
          if (!isNaN(expiryMs)) {
            const days = Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24));
            const status: 'valid' | 'expiring' | 'expired' =
              days <= 0 ? 'expired' : days <= 30 ? 'expiring' : 'valid';
            return {
              ...cert,
              daysRemaining: days,
              status,
            };
          }
        } catch {
          // ignore
        }
        return cert;
      });
    });

    // 2. Refresh search paths countFound to match active certificates
    setSearchPaths(prevPaths => {
      return prevPaths.map(p => {
        let count = p.countFound;
        if (p.type === 'default_gpki') {
          count = certificates.filter(c => c.category === 'GPKI_GOV').length;
        } else if (p.type === 'default_epki') {
          count = certificates.filter(c => c.category === 'EPKI_EDU').length;
        } else if (p.type === 'default_npki') {
          count = certificates.filter(c => (c.category === 'NPKI_BANK' || c.category === 'NPKI_CORP') && !c.sourceLocation.startsWith('E:')).length;
        } else if (p.type === 'removable_usb') {
          count = certificates.filter(c => c.sourceLocation.startsWith('E:') || c.sourceDrive?.includes('이동식')).length;
        }
        return { ...p, countFound: count, exists: true };
      });
    });

    // 3. Briefly simulate disk I/O scan
    await new Promise(r => setTimeout(r, 650));
    setIsScanning(false);

    // 4. Update scan time with seconds so user sees instantaneous feedback
    const now = new Date();
    const formatted = `오늘 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setLastScanTime(formatted);

    // 5. User notification
    showToast(customMessage || `⚡ 인증서 보관함 및 드라이브 새로고침 완료 (총 ${certificates.length}건 / 정상 동기화)`);

    // 6. Activity log
    const newLog = logActivity({
      category: 'SCAN',
      level: 'SUCCESS',
      action: '인증서 보관함 및 드라이브 새로고침',
      details: `기본 보관함(NPKI/GPKI/EPKI) 및 연결 장치 재스캔 완료 (총 ${certificates.length}개 감지, 유효기간 재계산)`,
      source: 'C:\\Users\\Admin\\AppData\\LocalLow',
      count: certificates.length
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(certificates.filter(Boolean).map(c => c.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleSelectCategory = (cat: 'ALL' | 'GOV' | 'BANK' | 'CORP') => {
    if (cat === 'ALL') {
      handleSelectAll();
    } else if (cat === 'GOV') {
      setSelectedIds(
        certificates.filter(c => c && (c.category === 'GPKI_GOV' || c.category === 'EPKI_EDU')).map(c => c.id)
      );
    } else if (cat === 'BANK') {
      setSelectedIds(
        certificates.filter(c => c && c.category === 'NPKI_BANK').map(c => c.id)
      );
    } else if (cat === 'CORP') {
      setSelectedIds(
        certificates.filter(c => c && c.category === 'NPKI_CORP').map(c => c.id)
      );
    }
  };

  const handleQuickBackupSingle = (cert: CertificateItem) => {
    setSelectedIds([cert.id]);
    setIsBackupModalOpen(true);
  };

  const handleOpenCleanupModal = (mode: CleanupModalMode) => {
    setCleanupMode(mode);
    setTargetSingleCertForDelete(null);
    setIsCleanupModalOpen(true);
  };

  const handleRequestDeleteSingle = (cert: CertificateItem) => {
    setTargetSingleCertForDelete(cert);
    setCleanupMode('SINGLE');
    setIsCleanupModalOpen(true);
  };

  const handleOpenRenewalGuidance = (targets?: CertificateItem[]) => {
    let listToGuide: CertificateItem[] = [];
    if (targets && targets.length > 0) {
      listToGuide = targets;
    } else {
      const selected = certificates.filter(c => selectedIds.includes(c.id));
      if (selected.length > 0) {
        listToGuide = selected;
      } else {
        const expiringOrExpired = certificates.filter(c => c.daysRemaining <= 30);
        if (expiringOrExpired.length > 0) {
          listToGuide = expiringOrExpired;
          showToast(`만료 임박 및 만료된 ${expiringOrExpired.length}개 인증서의 발급기관 갱신 안내를 표시합니다.`);
        } else {
          listToGuide = certificates;
          showToast(`전체 ${certificates.length}개 인증서의 발급기관 갱신 포털 안내를 표시합니다.`);
        }
      }
    }

    setCertsForRenewalModal(listToGuide);
    setIsRenewalModalOpen(true);

    logActivity({
      category: 'RENEWAL',
      level: 'INFO',
      action: '인증서 발급기관 일괄 갱신 안내 열람',
      details: `발급기관(행안부/교육부/은행 등) 갱신 포털 링크 모달 조회 (대상 인증서 ${listToGuide.length}건)`,
      count: listToGuide.length
    });
  };

  const handleDeleteCertificates = (idsToDelete: string[], reason: string) => {
    const deletedCerts = certificates.filter(c => idsToDelete.includes(c.id));
    if (deletedCerts.length === 0) return;

    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newTrashItems: TrashItem[] = deletedCerts.map(cert => ({
      id: `trash-${Date.now()}-${cert.id}`,
      deletedAt: nowStr,
      deleteReason: reason,
      cert,
    }));

    // Move to trash
    setTrashItems(prev => [...newTrashItems, ...prev]);

    // Remove from active list and selection
    setCertificates(prev => prev.filter(c => !idsToDelete.includes(c.id)));
    setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));

    // Provide immediate Undo action in the Toast!
    const trashIds = newTrashItems.map(t => t.id);
    showToast(
      `${reason} (${idsToDelete.length}건이 휴지통으로 이동되었습니다.)`,
      () => handleUndoDelete(trashIds, deletedCerts),
      () => setIsTrashModalOpen(true)
    );

    const newLog = logActivity({
      category: 'DELETE',
      level: 'WARN',
      action: `인증서 ${idsToDelete.length}건 휴지통 이동`,
      details: `${reason} - 대상: ${deletedCerts.map(c => c.name).join(', ')}`,
      source: '로컬 AppData\\LocalLow',
      target: '임시 보관 휴지통',
      count: idsToDelete.length
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleUndoDelete = (trashIdsToUndo: string[], restoredCerts: CertificateItem[]) => {
    // Remove from trash
    setTrashItems(prev => prev.filter(t => !trashIdsToUndo.includes(t.id)));

    // Add back to certificates without duplicates
    setCertificates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = restoredCerts.filter(c => !existingIds.has(c.id));
      return [...toAdd, ...prev];
    });

    // Re-select them for convenience
    setSelectedIds(prev => [...new Set([...prev, ...restoredCerts.map(c => c.id)])]);

    showToast(`삭제 작업이 취소되었습니다. (${restoredCerts.length}건의 인증서 복구 완료)`);

    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '삭제 실행 취소 (Undo 복원)',
      details: `휴지통으로 이동되었던 ${restoredCerts.length}건 즉시 원상 복구 (${restoredCerts.map(c => c.name).join(', ')})`,
      source: '임시 보관 휴지통',
      target: '로컬 보관함',
      count: restoredCerts.length
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleRestoreFromTrash = (trashIdsToRestore: string[]) => {
    const itemsToRestore = trashItems.filter(item => trashIdsToRestore.includes(item.id));
    if (itemsToRestore.length === 0) return;

    const certsToRestore = itemsToRestore.map(i => i.cert);

    setCertificates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = certsToRestore.filter(c => !existingIds.has(c.id));
      return [...toAdd, ...prev];
    });

    setTrashItems(prev => prev.filter(i => !trashIdsToRestore.includes(i.id)));
    setSelectedIds(prev => [...new Set([...prev, ...certsToRestore.map(c => c.id)])]);

    showToast(`${certsToRestore.length}건의 인증서가 원본 위치로 복구되었습니다.`);

    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '휴지통 선택 인증서 복원',
      details: `${certsToRestore.length}건 복구 완료 (${certsToRestore.map(c => c.name).join(', ')})`,
      source: '임시 보관 휴지통',
      target: '로컬 보관함',
      count: certsToRestore.length
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleRestoreAllTrash = () => {
    if (trashItems.length === 0) return;
    const certsToRestore = trashItems.map(i => i.cert);

    setCertificates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = certsToRestore.filter(c => !existingIds.has(c.id));
      return [...toAdd, ...prev];
    });

    const count = trashItems.length;
    setTrashItems([]);
    setSelectedIds(prev => [...new Set([...prev, ...certsToRestore.map(c => c.id)])]);

    showToast(`휴지통의 모든 인증서(${count}건)가 정상적으로 복구되었습니다.`);

    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '휴지통 전체 인증서 일괄 복원',
      details: `휴지통에 보관 중이던 ${count}건 전체 복구 완료`,
      source: '임시 보관 휴지통',
      target: '로컬 보관함',
      count: count
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleEmptyTrash = () => {
    const count = trashItems.length;
    setTrashItems([]);
    showToast(`휴지통을 비웠습니다. (${count}건의 파일이 완전히 폐기되었습니다.)`);

    const newLog = logActivity({
      category: 'DELETE',
      level: 'ERROR',
      action: '휴지통 전체 비우기 (영구 폐기)',
      details: `휴지통 내 ${count}건의 인증서 파일 영구 삭제`,
      count: count
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handlePermanentlyDeleteTrash = (trashIds: string[]) => {
    setTrashItems(prev => prev.filter(item => !trashIds.includes(item.id)));
    showToast(`선택한 ${trashIds.length}건의 인증서가 영구 폐기되었습니다.`);

    const newLog = logActivity({
      category: 'DELETE',
      level: 'ERROR',
      action: '선택 인증서 영구 폐기',
      details: `휴지통 내 ${trashIds.length}건 영구 삭제`,
      count: trashIds.length
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleDeleteCustomCert = (id: string) => {
    handleDeleteCertificates([id], '사용자 정의 인증서 삭제');
  };

  const handleBackupSuccess = (record: BackupHistoryItem) => {
    setBackupHistory(prev => [record, ...prev]);

    // Find copied certificates to highlight with row flash animation and sound
    const copiedIds = certificates
      .filter(c => record.certNames.includes(c.name) || selectedIds.includes(c.id))
      .map(c => c.id);
    triggerCopiedHighlight(copiedIds.length > 0 ? copiedIds : selectedIds);

    // 대상 드라이브 보관 상태 즉시 업데이트
    setAvailableDrives(prevDrives => prevDrives.map(drive => {
      if (record.targetDisk.includes(drive.letter)) {
        return {
          ...drive,
          isEmpty: false,
          isRecommended: false,
          description: `인증서 ${record.certificatesCount}건 안전 복사 보관 중 (${record.certNames.slice(0, 2).join(', ')}${record.certNames.length > 2 ? ' 외' : ''})`
        };
      }
      return drive;
    }));

    const newLog = logActivity({
      category: 'BACKUP',
      level: 'SUCCESS',
      action: '이동식 디스크(USB) 백업 완료',
      details: `${record.targetDisk}로 ${record.certificatesCount}건 복사 완료 (${record.certNames.join(', ')}) / 무결성 검증 통과`,
      source: 'C:\\Users\\Admin\\AppData\\LocalLow',
      target: `${record.targetDisk}\\${record.targetPath}`,
      count: record.certificatesCount
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // 복사작업 성공 후 새로고침 자동으로 진행
    handleRefresh(`⚡ ${record.targetDisk}로 인증서 복사가 완료되어 목록 및 드라이브 상태를 자동으로 새로고침했습니다.`);
  };

  const handleImportFromUsbSuccess = (importedCerts: CertificateItem[], summaryMessage?: string) => {
    const newlyAddedIds: string[] = importedCerts.map(c => c.id);
    triggerCopiedHighlight(newlyAddedIds);

    setCertificates(prev => {
      const nextList = [...prev];
      const newlyAddedIds: string[] = [];

      for (const importedCert of importedCerts) {
        const existingIdx = nextList.findIndex(c => c.id === importedCert.id || c.subjectDn === importedCert.subjectDn || c.name === importedCert.name);

        if (existingIdx >= 0) {
          nextList[existingIdx] = importedCert;
          newlyAddedIds.push(importedCert.id);
        } else {
          nextList.unshift(importedCert);
          newlyAddedIds.push(importedCert.id);
        }
      }

      // Automatically select newly imported certificates
      setSelectedIds(prevSelected => [...new Set([...prevSelected, ...newlyAddedIds])]);
      return nextList;
    });

    const newLog = logActivity({
      category: 'IMPORT',
      level: 'SUCCESS',
      action: 'USB ➔ PC 인증서 가져오기 완료',
      details: summaryMessage || `외부 매체에서 로컬 PC AppData\\LocalLow 보관함으로 ${importedCerts.length}건 복사 완료 (${importedCerts.map(c => c.name).join(', ')})`,
      source: importedCerts[0]?.sourceLocation || '이동식 USB 매체',
      target: 'C:\\Users\\Admin\\AppData\\LocalLow',
      count: importedCerts.length
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // 복사작업 성공 후 새로고침 자동으로 진행
    handleRefresh(summaryMessage ? `⚡ ${summaryMessage}` : `⚡ USB ➔ PC 복사가 완료되어 인증서 목록을 자동으로 새로고침했습니다 (${importedCerts.length}건 등록).`);
  };

  const handleClearActivityLogs = () => {
    clearAllActivityLogs();
    setActivityLogs([]);
    showToast('모든 앱 작업 로그가 초기화되었습니다.');
  };

  const handleNavTabSelect = (tab: 'copy' | 'history' | 'paths' | 'security') => {
    setActiveNavTab(tab);
    setIsMobileSidebarOpen(false);

    if (tab === 'security') {
      setIsSecurityModalOpen(true);
    } else if (tab === 'history') {
      historyPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'paths') {
      pathsPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'copy') {
      copyPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const validCount = certificates.filter(c => c.status === 'valid').length;
  const expiredCount = certificates.filter(c => c.status === 'expired').length;
  const removableDrivesCount = availableDrives.filter(d => d.type === 'removable').length;

  const selectedCertificates = useMemo(() => {
    return certificates.filter(c => selectedIds.includes(c.id));
  }, [certificates, selectedIds]);

  return (
    <div 
      className="flex min-h-screen font-sans antialiased transition-colors duration-150"
      data-theme={currentTheme}
      id="app-root"
    >
      {/* Interactive Toast notification with Undo & Trash shortcuts */}
      {toastData && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-3 border border-slate-700 animate-fadeIn backdrop-blur-xs max-w-lg">
          {toastData.type === 'delete' ? (
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1 min-w-0 pr-1">
            <p className="text-slate-100 text-xs sm:text-[13px] leading-snug">{toastData.message}</p>
            {toastData.onUndo && (
              <p className="text-[11px] text-slate-400 mt-0.5">휴지통에 임시 보관 중입니다. 필요 시 복구하세요.</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {toastData.onUndo && (
              <button
                type="button"
                onClick={() => {
                  toastData.onUndo?.();
                  setToastData(null);
                }}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                title="마지막 삭제 작업 취소"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>실행 취소</span>
              </button>
            )}

            {toastData.onOpenTrash && (
              <button
                type="button"
                onClick={() => {
                  toastData.onOpenTrash?.();
                  setToastData(null);
                }}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                휴지통 보기
              </button>
            )}

            <button
              type="button"
              onClick={() => setToastData(null)}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer ml-0.5"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          activeTab={activeNavTab}
          setActiveTab={handleNavTabSelect}
          totalCerts={certificates.length}
          removableDrives={removableDrivesCount}
          theme={currentTheme}
          onThemeChange={handleThemeChange}
          onOpenSecurityGuide={() => setIsSecurityModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenUsbToPc={() => setIsUsbToPcModalOpen(true)}
          onOpenDesktopApp={() => setIsDesktopAppModalOpen(true)}
          onOpenUsbDiagnostic={() => setIsUsbDiagnosticModalOpen(true)}
          onOpenCleanup={handleOpenCleanupModal}
          onOpenTrash={() => setIsTrashModalOpen(true)}
          onOpenRenewalGuidance={handleOpenRenewalGuidance}
          onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
          onOpenLicense={() => setIsLicenseModalOpen(true)}
          onOpenCoreSpec={() => setIsCoreSpecModalOpen(true)}
          onCheckUpdates={handleManualCheckUpdates}
          isCheckingUpdates={isCheckingUpdates}
          hasUpdateBadge={!!updateInfo?.hasUpdate}
          logCount={activityLogs.length}
          trashCount={trashItems.length}
          expiredCount={expiredCount}
          nonStandardCount={nonStandardCount}
          selectedCount={selectedIds.length}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => setIsMobileSidebarOpen(false)} 
          />
          <div className="relative flex-1 flex flow-col max-w-xs w-full bg-[#1e293b] z-50">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              activeTab={activeNavTab}
              setActiveTab={handleNavTabSelect}
              totalCerts={certificates.length}
              removableDrives={removableDrivesCount}
              theme={currentTheme}
              onThemeChange={handleThemeChange}
              onOpenSecurityGuide={() => {
                setIsMobileSidebarOpen(false);
                setIsSecurityModalOpen(true);
              }}
              onOpenBackupModal={() => {
                setIsMobileSidebarOpen(false);
                setIsBackupModalOpen(true);
              }}
              onOpenUsbToPc={() => {
                setIsMobileSidebarOpen(false);
                setIsUsbToPcModalOpen(true);
              }}
              onOpenDesktopApp={() => {
                setIsMobileSidebarOpen(false);
                setIsDesktopAppModalOpen(true);
              }}
              onOpenUsbDiagnostic={() => {
                setIsMobileSidebarOpen(false);
                setIsUsbDiagnosticModalOpen(true);
              }}
              onOpenCleanup={(mode) => {
                setIsMobileSidebarOpen(false);
                handleOpenCleanupModal(mode);
              }}
              onOpenTrash={() => {
                setIsMobileSidebarOpen(false);
                setIsTrashModalOpen(true);
              }}
              onOpenRenewalGuidance={() => {
                setIsMobileSidebarOpen(false);
                handleOpenRenewalGuidance();
              }}
              onOpenActivityLogs={() => {
                setIsMobileSidebarOpen(false);
                setIsActivityLogModalOpen(true);
              }}
              onOpenLicense={() => {
                setIsMobileSidebarOpen(false);
                setIsLicenseModalOpen(true);
              }}
              onOpenCoreSpec={() => {
                setIsMobileSidebarOpen(false);
                setIsCoreSpecModalOpen(true);
              }}
              onCheckUpdates={() => {
                setIsMobileSidebarOpen(false);
                handleManualCheckUpdates();
              }}
              isCheckingUpdates={isCheckingUpdates}
              hasUpdateBadge={!!updateInfo?.hasUpdate}
              logCount={activityLogs.length}
              trashCount={trashItems.length}
              expiredCount={expiredCount}
              nonStandardCount={nonStandardCount}
              selectedCount={selectedIds.length}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          totalCount={certificates.length}
          validCount={validCount}
          removableCount={removableDrivesCount}
          isScanning={isScanning}
          theme={currentTheme}
          onThemeChange={handleThemeChange}
          onRefresh={handleRefresh}
          onOpenSecurityGuide={() => setIsSecurityModalOpen(true)}
          onOpenUsbToPc={() => setIsUsbToPcModalOpen(true)}
          onOpenDesktopApp={() => setIsDesktopAppModalOpen(true)}
          onOpenUsbDiagnostic={() => setIsUsbDiagnosticModalOpen(true)}
          onOpenTrash={() => setIsTrashModalOpen(true)}
          onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
          onOpenLicense={() => setIsLicenseModalOpen(true)}
          onOpenCoreSpec={() => setIsCoreSpecModalOpen(true)}
          onOpenRenewalGuidance={() => handleOpenRenewalGuidance()}
          onCheckUpdates={handleManualCheckUpdates}
          isCheckingUpdates={isCheckingUpdates}
          hasUpdateBadge={!!updateInfo?.hasUpdate}
          logCount={activityLogs.length}
          trashCount={trashItems.length}
          lastScanTime={lastScanTime}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 max-w-7xl w-full mx-auto" ref={copyPanelRef}>
          {/* Smart USB Detected Banner when USB certificates are present */}
          {!isDismissedUsbBanner && allConnectedUsbCerts.length > 0 && (
            <UsbDetectedBanner
              detectedCerts={allConnectedUsbCerts}
              availableDrives={availableDrives}
              onOpenUsbToPcModal={() => {
                setTargetUsbLetterForModal(allConnectedUsbCerts[0]?.usbDriveLetter);
                setIsUsbToPcModalOpen(true);
              }}
              onDismiss={() => setIsDismissedUsbBanner(true)}
            />
          )}

          {/* Quick Transfer Config Grid (1. Source, 2. Target) */}
          <QuickTransferConfigCard
            searchPaths={searchPaths}
            availableDrives={availableDrives}
            selectedDriveId={selectedDriveId}
            onSelectDriveId={setSelectedDriveId}
            onTogglePathsPanel={() => {
              pathsPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenCustomDirectory={() => {
              pathsPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenUsbToPcModal={(driveLetter) => {
              if (driveLetter) {
                setTargetUsbLetterForModal(driveLetter);
              }
              setIsUsbToPcModalOpen(true);
            }}
            onSimulateUsbMount={() => {
              const newDrive = simulateUsbMount();
              setTargetUsbLetterForModal(newDrive.letter);
            }}
          />

          {/* Connected Drives Status Bar (NVMe / SATA / USB distinction with Basic/Advanced mode toggle) */}
          <ConnectedDrivesBar
            availableDrives={availableDrives}
            selectedDriveId={selectedDriveId}
            onSelectDriveId={setSelectedDriveId}
            onOpenUsbToPc={(driveLetter) => {
              if (driveLetter) setTargetUsbLetterForModal(driveLetter);
              setIsUsbToPcModalOpen(true);
            }}
          />

          {/* Certificate Table & List */}
          <CertificateList
            certificates={certificates}
            selectedIds={selectedIds}
            recentlyCopiedIds={recentlyCopiedIds}
            availableDrives={availableDrives}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onSelectFilteredIds={(ids) => setSelectedIds(ids)}
            onClearSelection={handleClearSelection}
            onSelectCategory={handleSelectCategory}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onSelectTargetDriveAndBackup={(driveId) => {
              setSelectedDriveId(driveId);
              if (selectedIds.length === 0) {
                handleSelectAll();
              }
              setIsBackupModalOpen(true);
            }}
            onOpenDetailModal={(cert) => setSelectedCertForDetail(cert)}
            onQuickBackupSingle={handleQuickBackupSingle}
            onOpenCleanupModal={handleOpenCleanupModal}
            onRequestDeleteSingle={handleRequestDeleteSingle}
            onDeleteCustomCert={handleDeleteCustomCert}
            onOpenTrash={() => setIsTrashModalOpen(true)}
            trashCount={trashItems.length}
            onOpenUsbToPc={(driveLetter) => {
              if (driveLetter) {
                setTargetUsbLetterForModal(driveLetter);
              }
              setIsUsbToPcModalOpen(true);
            }}
            onOpenDesktopApp={() => setIsDesktopAppModalOpen(true)}
            onOpenUsbDiagnostic={() => setIsUsbDiagnosticModalOpen(true)}
            onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
            logCount={activityLogs.length}
            onRefresh={handleRefresh}
            isScanning={isScanning}
            onOpenRenewalGuidance={handleOpenRenewalGuidance}
          />

          {/* Search Locations Detailed Panel (Default standard paths & user direct picker) */}
          <div ref={pathsPanelRef}>
            <SearchLocationsPanel
              searchPaths={searchPaths}
              onTogglePath={handleTogglePath}
              onAddCustomPath={handleAddCustomPath}
              onCustomScannedCerts={handleCustomScannedCerts}
              isScanning={isScanning}
            />
          </div>

          {/* Backup History Panel */}
          <div ref={historyPanelRef}>
            <BackupHistoryPanel
              history={backupHistory}
              onClearHistory={() => setBackupHistory([])}
            />
          </div>
        </main>

        {/* Professional Footer with Developer, Company, Blog & Version info */}
        <footer className="bg-white border-t border-slate-200 py-5 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {/* Top row of Footer: App Branding & Developer/Company/Blog Info */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              {/* Left: App Title & Purpose */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-slate-800 text-sm tracking-tight">
                  K-Cert Manager
                </span>
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono rounded text-[11px] font-bold">
                  v{APP_VERSION}
                </span>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <span className="text-slate-600 font-medium text-xs">
                  대한민국 공무원(GPKI·EPKI) 및 금융·개인(NPKI) 공인인증서 원클릭 USB 이동·관리 솔루션
                </span>
              </div>

              {/* Right: License button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLicenseModalOpen(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>라이선스 및 법적 고지</span>
                </button>
              </div>
            </div>

            {/* Bottom row of Footer: Explicit Developer, Company, Blog & Copyright */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
              {/* Requested Developer Info Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-700 font-medium">
                {/* Developer */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 font-normal text-[11px]">Developer:</span>
                  <strong className="text-slate-900 font-bold">{DEVELOPER_INFO.author}</strong>
                </div>

                {/* Homepage */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 font-normal text-[11px]">홈페이지:</span>
                  <a
                    href={DEVELOPER_INFO.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold"
                    title="공식 홈페이지 열기"
                  >
                    <span>홈페이지</span>
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </a>
                </div>

                {/* Blog */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 font-normal text-[11px]">블로그:</span>
                  <a
                    href={DEVELOPER_INFO.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 hover:underline font-bold"
                    title="AhBi Vibe Log 블로그 열기"
                  >
                    <span className="truncate max-w-[200px] sm:max-w-none">{DEVELOPER_INFO.blog}</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Copyright & Security note */}
              <div className="text-[11px] text-slate-400 sm:text-right">
                <span>© 2026 {DEVELOPER_INFO.author}. All rights reserved.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        selectedCerts={selectedCertificates}
        availableDrives={availableDrives}
        existingCertificates={certificates}
        onBackupSuccess={handleBackupSuccess}
      />

      <CertificateDetailModal
        cert={selectedCertForDetail}
        onClose={() => setSelectedCertForDetail(null)}
        onCopySingle={handleQuickBackupSingle}
        onOpenRenewalGuidance={(cert) => handleOpenRenewalGuidance([cert])}
      />

      <SecurityGuideModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Certificate Cleanup Modal (Expired, Other Users, Selected, Single) */}
      <CertificateCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => {
          setIsCleanupModalOpen(false);
          setTargetSingleCertForDelete(null);
        }}
        certificates={certificates}
        mode={cleanupMode}
        singleCert={targetSingleCertForDelete}
        selectedIds={selectedIds}
        onDeleteCertificates={handleDeleteCertificates}
      />

      {/* Certificate Trash Modal (Recycle Bin / Restore) */}
      <TrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        trashItems={trashItems}
        onRestore={handleRestoreFromTrash}
        onRestoreAll={handleRestoreAllTrash}
        onEmptyTrash={handleEmptyTrash}
        onPermanentlyDelete={handlePermanentlyDeleteTrash}
      />

      {/* USB to PC Reverse Transfer Modal */}
      <UsbToPcModal
        isOpen={isUsbToPcModalOpen}
        onClose={() => {
          setIsUsbToPcModalOpen(false);
          setTargetUsbLetterForModal(undefined);
        }}
        availableDrives={availableDrives}
        existingCertificates={certificates}
        onImportSuccess={handleImportFromUsbSuccess}
        initialDriveLetter={targetUsbLetterForModal}
      />

      {/* USB Detected Prompt Modal ('컴퓨터로 인증서 복사' 전용 안내 모달) */}
      <UsbDetectedPromptModal
        isOpen={isUsbPromptOpen}
        onClose={() => setIsUsbPromptOpen(false)}
        drive={promptUsbDrive}
        detectedCerts={promptUsbCerts}
        onOpenUsbToPcModal={() => {
          setIsUsbToPcModalOpen(true);
        }}
      />

      {/* App Activity and Audit Log Modal */}
      <AppActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        logs={activityLogs}
        onClearLogs={handleClearActivityLogs}
      />

      {/* KCert.Core.dll Pure Creative Core Specification Modal */}
      <CoreSpecModal
        isOpen={isCoreSpecModalOpen}
        onClose={() => setIsCoreSpecModalOpen(false)}
      />

      {/* USB Volume Serial Number & WMI Diagnostic Modal */}
      <UsbDiagnosticModal
        isOpen={isUsbDiagnosticModalOpen}
        onClose={() => setIsUsbDiagnosticModalOpen(false)}
        drives={availableDrives}
        onDrivesUpdated={(newDrives) => setAvailableDrives(newDrives)}
      />

      {/* C# .NET 8 WPF Desktop App Native Information Modal */}
      <DesktopAppModal
        isOpen={isDesktopAppModalOpen}
        onClose={() => setIsDesktopAppModalOpen(false)}
      />

      {/* Batch Certificate Renewal Guidance & Authority Portal Link Modal */}
      <RenewalGuidanceModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        selectedCerts={certsForRenewalModal}
      />

      {/* GitHub Releases Auto Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        onRecheck={handleManualCheckUpdates}
        isChecking={isCheckingUpdates}
      />
    </div>
  );
}
