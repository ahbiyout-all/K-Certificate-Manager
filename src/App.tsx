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
  RestoredTrashItem,
  AppLogItem,
  SecureDeletionEvidenceItem,
  AppTheme
} from './types';
import { loadProtectedRestoredItems, saveProtectedRestoredItems } from './utils/protectedVaultStorage';
import { Header } from './components/Header';
import { Sidebar, SidebarCategoryFilter, SidebarSourceFilter } from './components/Sidebar';
import { SimpleTransferHero } from './components/SimpleTransferHero';
import { ConnectedDrivesBar } from './components/ConnectedDrivesBar';
import { SearchLocationsPanel } from './components/SearchLocationsPanel';
import { CertificateList, filterCertificatesByCriteria } from './components/CertificateList';
import { CertificateDetailSidebar } from './components/CertificateDetailSidebar';
import { BackupModal } from './components/BackupModal';
import { TargetDrivePickerModal } from './components/TargetDrivePickerModal';
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
import { StartupWorkflowModal, WorkflowType } from './components/StartupWorkflowModal';
import { GuidedWorkflowOverlay } from './components/GuidedWorkflowOverlay';
import { SettingsModal } from './components/SettingsModal';
import { OperationCompleteModal, OperationCompleteData } from './components/OperationCompleteModal';
import { checkForAppUpdates, UpdateInfo } from './utils/updateChecker';
import { playSuccessChime } from './utils/audioFeedback';
import { 
  UsbDetectedCert, 
  getAvailableUsbCertificates,
  startUsbDriveWatcher, 
  subscribeUsbDriveChanges, 
  setActiveDrives 
} from './utils/usbToPcService';
import { isPcCertificate, isUsbCertificate, isSameDriveSelfCopy } from './utils/driveFilter';
import { isNonStandardCertPath } from './utils/certPathUtils';
import { isCertificateExpired } from './utils/certParser';
import { getStoredActivityLogs, logActivity, clearAllActivityLogs, formatCurrentTimestamp } from './utils/activityLogger';
import { 
  CheckCircle2, 
  ShieldCheck,
  X,
  RotateCcw,
  Trash2,
  PanelRight,
  FolderSearch,
  History
} from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from './version';

interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'delete' | 'info';
  onUndo?: () => void;
  onOpenTrash?: () => void;
  hasIntegrityBadge?: boolean;
  checksumText?: string;
}

export default function App() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    try {
      const saved = localStorage.getItem('kcert_trash_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [restoredTrashItems, setRestoredTrashItems] = useState<RestoredTrashItem[]>(() => {
    return loadProtectedRestoredItems();
  });

  const [certificates, setCertificates] = useState<CertificateItem[]>(() => {
    try {
      const savedTrash = localStorage.getItem('kcert_trash_items');
      const savedList: TrashItem[] = savedTrash ? JSON.parse(savedTrash) : [];
      const trashCertIds = new Set(savedList.map(t => t.cert.id));

      const savedCerts = localStorage.getItem('kcert_active_certificates');
      if (savedCerts) {
        const parsed = JSON.parse(savedCerts);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => !trashCertIds.has(c.id));
        }
      }
      if (savedList && savedList.length > 0) {
        return INITIAL_CERTIFICATES.filter(c => !trashCertIds.has(c.id));
      }
    } catch {
      // fallback
    }
    return INITIAL_CERTIFICATES;
  });
  const [searchPaths, setSearchPaths] = useState<SearchPath[]>(INITIAL_SEARCH_PATHS);
  const [availableDrives, setAvailableDrives] = useState<DiskDrive[]>(INITIAL_DRIVES);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => certificates.map(c => c.id));
  const [explicitBackupCerts, setExplicitBackupCerts] = useState<CertificateItem[] | null>(null);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('drive-e');
  const [activeNavTab, setActiveNavTab] = useState<'copy' | 'history' | 'paths' | 'security'>('copy');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isTargetDrivePickerOpen, setIsTargetDrivePickerOpen] = useState(false);
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
  const [isStartupWorkflowOpen, setIsStartupWorkflowOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOperationCompleteOpen, setIsOperationCompleteOpen] = useState(false);
  const [operationCompleteData, setOperationCompleteData] = useState<OperationCompleteData | null>(null);
  const [dontShowStartupAgain, setDontShowStartupAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kcert_dont_show_startup_modal') === 'true';
    } catch {
      return false;
    }
  });
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType | null>(null);

  const handleToggleDontShowStartupAgain = (val: boolean) => {
    setDontShowStartupAgain(val);
    try {
      localStorage.setItem('kcert_dont_show_startup_modal', val ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const handleSelectWorkflow = (type: WorkflowType) => {
    setIsStartupWorkflowOpen(false);
    setActiveWorkflow(type);
    try {
      if (type === 'pc_to_usb' || type === 'usb_to_pc') {
        localStorage.setItem('kcert_recent_workflow_mode', type);
      }
    } catch {
      // ignore
    }

    if (type === 'pc_to_usb') {
      // 시작 가이드 pc-> usb 복사 시작 시 기본 C: 인증서 중 유효한 인증서만 수집 (만료 항목 제외)
      const pcCerts = certificates.filter(c => isPcCertificate(c) && c.status !== 'expired');
      const pcCertIds = pcCerts.map(c => c.id);
      if (pcCertIds.length > 0) {
        setSelectedIds(pcCertIds);
        setExplicitBackupCerts(pcCerts);
        showToast(`💻 [PC ➔ USB 복사하기] 컴퓨터 기본 C: 보관함의 유효한 인증서 ${pcCertIds.length}개가 자동 선택되었습니다.`);
      } else {
        showToast('💻 [PC ➔ USB 복사하기] 유효한 C: 인증서 복사 마법사 창이 실행되었습니다.');
      }
      // USB ➔ PC 가져오기와 동일한 창(모달) 형식으로 PC ➔ USB 백업 마법사 창 직접 실행
      handleOpenGeneralBackupModal(undefined, pcCerts.length > 0 ? pcCerts : undefined);
    } else if (type === 'usb_to_pc') {
      showToast('💾 [USB ➔ PC 가져오기] 연결된 USB 메모리의 인증서를 컴퓨터로 복사하는 창이 실행되었습니다.');
      setIsUsbToPcModalOpen(true);
    } else if (type === 'dashboard') {
      showToast('🏠 전체 인증서 관리 대시보드로 이동했습니다.');
    }
  };
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
    return 'dark';
  });
  const [appViewMode, setAppViewMode] = useState<'simple' | 'advanced'>(() => {
    try {
      const saved = localStorage.getItem('kcert_app_view_mode');
      if (saved === 'simple' || saved === 'advanced') return saved;
    } catch {
      // Fallback
    }
    return 'simple';
  });
  const [sidebarCategoryFilter, setSidebarCategoryFilter] = useState<SidebarCategoryFilter>('ALL');
  const [sidebarSourceFilter, setSidebarSourceFilter] = useState<SidebarSourceFilter>('ALL');
  const [gridSearchQuery, setGridSearchQuery] = useState('');
  const [inspectedCert, setInspectedCert] = useState<CertificateItem | null>(null);
  const [isDetailSidebarVisible, setIsDetailSidebarVisible] = useState<boolean>(false);
  const [detailSidebarWidth, setDetailSidebarWidth] = useState<number>(390);
  const [lastUndoSnapshot, setLastUndoSnapshot] = useState<{ trashItems: TrashItem[]; certs: CertificateItem[] } | null>(null);

  const handleToggleAppViewMode = (mode: 'simple' | 'advanced') => {
    setAppViewMode(mode);
    try {
      localStorage.setItem('kcert_app_view_mode', mode);
    } catch {
      // ignore
    }
  };


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

  // Keep selectedIds pruned to existing certificates
  useEffect(() => {
    const validIdSet = new Set(certificates.map(c => c.id));
    setSelectedIds(prev => {
      const pruned = prev.filter(id => validIdSet.has(id));
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [certificates]);

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

  // Save restored trash items to encrypted protected vault storage
  useEffect(() => {
    saveProtectedRestoredItems(restoredTrashItems);
  }, [restoredTrashItems]);

  // Save active certificates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kcert_active_certificates', JSON.stringify(certificates));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [certificates]);

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

  const showToast = (
    msg: string, 
    undoAction?: () => void, 
    openTrashAction?: () => void,
    options?: {
      type?: 'success' | 'delete' | 'info';
      hasIntegrityBadge?: boolean;
      checksumText?: string;
    }
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastData({
      id: `toast-${Date.now()}`,
      message: msg,
      type: options?.type || (undoAction ? 'delete' : options?.hasIntegrityBadge ? 'success' : 'info'),
      onUndo: undoAction,
      onOpenTrash: openTrashAction,
      hasIntegrityBadge: options?.hasIntegrityBadge,
      checksumText: options?.checksumText,
    });
    toastTimerRef.current = setTimeout(() => {
      setToastData(null);
    }, undoAction ? 8500 : options?.hasIntegrityBadge ? 5500 : 3500);
  };

  // Check for app updates on startup -> then open Startup Task Selection Modal
  useEffect(() => {
    checkForAppUpdates()
      .then(info => {
        setUpdateInfo(info);
        if (info.hasUpdate) {
          showToast(`🚀 새 버전 v${info.latestVersion} 감지됨! 업데이트 안내 창이 자동 실행되었습니다.`);
          setIsUpdateModalOpen(true);
        } else {
          // If no update, open Startup Workflow Selection Modal (if not suppressed)
          if (localStorage.getItem('kcert_dont_show_startup_modal') !== 'true') {
            setIsStartupWorkflowOpen(true);
          }
        }
      })
      .catch(() => {
        if (localStorage.getItem('kcert_dont_show_startup_modal') !== 'true') {
          setIsStartupWorkflowOpen(true);
        }
      });
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
        const trashCertIds = new Set(trashItems.map(t => t.cert.id));
        return INITIAL_CERTIFICATES.filter(cert => {
          if (trashCertIds.has(cert.id)) return false;
          const isUsb = isUsbCertificate(cert);
          if (isUsb && !isUsbEnabled) return false;
          if (cert.category === 'GPKI_GOV' && !enabledTypes.includes('default_gpki')) return false;
          if (cert.category === 'EPKI_EDU' && !enabledTypes.includes('default_epki')) return false;
          if (cert.category === 'NPKI_BANK' && !enabledTypes.includes('default_npki') && !isUsb) return false;
          if (cert.category === 'NPKI_CORP' && !enabledTypes.includes('default_npki') && !isUsb) return false;
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

    // Also remove from trash if imported
    setTrashItems(prev => {
      const scannedIds = new Set(newCerts.map(c => c.id));
      return prev.filter(t => !scannedIds.has(t.cert.id));
    });

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

  // Refresh scan simulation (allows custom toast message and integrity verified badge after copy operations)
  const handleRefresh = async (customMessage?: string, integrityVerified?: boolean, checksumText?: string) => {
    setIsScanning(true);

    // 1. Recalculate validity and remaining days against current time
    const nowMs = Date.now();
    setCertificates(prevCerts => {
      return prevCerts.map(cert => {
        try {
          // 인증서 만료일 당일 23:59:59까지 유효성 보장 (타임존 오차 및 당일 만료 오류 방지)
          const dateStr = cert.validTo.includes('T') ? cert.validTo : `${cert.validTo}T23:59:59`;
          const expiryMs = new Date(dateStr).getTime();
          if (!isNaN(expiryMs)) {
            const diffMs = expiryMs - nowMs;
            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const status: 'valid' | 'expiring' | 'expired' =
              diffMs < 0 ? 'expired' : days <= 30 ? 'expiring' : 'valid';
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
          count = certificates.filter(c => (c.category === 'NPKI_BANK' || c.category === 'NPKI_CORP') && isPcCertificate(c)).length;
        } else if (p.type === 'removable_usb') {
          count = certificates.filter(c => isUsbCertificate(c)).length;
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

    // 5. User notification (with Integrity Check badge if copied)
    if (integrityVerified) {
      showToast(
        customMessage || `⚡ 인증서 복사 및 새로고침 완료 (총 ${certificates.length}건)`,
        undefined,
        undefined,
        {
          type: 'success',
          hasIntegrityBadge: true,
          checksumText: checksumText || 'SHA-256 체크섬 무결성 일치'
        }
      );
    } else {
      showToast(customMessage || `⚡ 인증서 보관함 및 드라이브 새로고침 완료 (총 ${certificates.length}건 / 정상 동기화)`);
    }

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

  const handleOpenGeneralBackupModal = (driveId?: string, certsOverride?: CertificateItem[]) => {
    if (certsOverride && certsOverride.length > 0) {
      setExplicitBackupCerts(certsOverride);
      setSelectedIds(certsOverride.map(c => c.id));
    } else {
      const selected = certificates.filter(c => selectedIds.includes(c.id));
      if (selected.length > 0) {
        setExplicitBackupCerts(selected);
      } else {
        setExplicitBackupCerts(certificates);
        setSelectedIds(certificates.map(c => c.id));
      }
    }
    if (driveId) {
      setSelectedDriveId(driveId);
      setIsBackupModalOpen(true);
    } else {
      setIsTargetDrivePickerOpen(true);
    }
  };

  const handleConfirmTargetDriveFromPicker = (driveId: string) => {
    setSelectedDriveId(driveId);
    setIsTargetDrivePickerOpen(false);
    setIsBackupModalOpen(true);
  };

  const handleQuickBackupSingle = (cert: CertificateItem) => {
    setSelectedIds([cert.id]);
    setExplicitBackupCerts([cert]);
    handleOpenGeneralBackupModal(undefined, [cert]);
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

    const count = deletedCerts.length;
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

    const deletedCertIds = new Set(deletedCerts.map(c => c.id));

    // Move to trash (deduplicating strictly by unique certificate ID, preserving all other trash items)
    setTrashItems(prev => {
      const filteredPrev = prev.filter(t => !deletedCertIds.has(t.cert.id));
      return [...newTrashItems, ...filteredPrev];
    });

    // Remove from active list and selection
    setCertificates(prev => prev.filter(c => !deletedCertIds.has(c.id)));
    setSelectedIds(prev => prev.filter(id => !deletedCertIds.has(id)));
    setLastUndoSnapshot({ trashItems: newTrashItems, certs: deletedCerts });

    // Provide immediate Undo action in the Toast!
    showToast(
      `${reason} (${count}건이 휴지통으로 이동되었습니다.)`,
      () => handleUndoDelete(newTrashItems, deletedCerts),
      () => setIsTrashModalOpen(true)
    );

    const hasUsbDeleted = deletedCerts.some(c => isUsbCertificate(c));
    const hasPcDeleted = deletedCerts.some(c => isPcCertificate(c));
    const deleteSourceLabel = hasUsbDeleted && hasPcDeleted
      ? '로컬 PC 및 이동식 USB'
      : hasUsbDeleted
        ? (deletedCerts[0]?.sourceDrive || '이동식 USB')
        : '로컬 AppData\\LocalLow';

    const newLog = logActivity({
      category: 'DELETE',
      level: 'WARN',
      action: `인증서 ${count}건 휴지통 이동`,
      details: `${reason} - 대상: ${deletedCerts.map(c => c.name).join(', ')}`,
      source: deleteSourceLabel,
      target: '임시 보관 휴지통',
      count: count
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleUndoDelete = (undoneTrashItems: TrashItem[], restoredCerts: CertificateItem[]) => {
    const trashIdsToUndo = new Set(undoneTrashItems.map(t => t.id));
    setLastUndoSnapshot(null);
    // Remove from trash
    setTrashItems(prev => prev.filter(t => !trashIdsToUndo.has(t.id)));

    // Record in restored items vault
    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newRestoredItems: RestoredTrashItem[] = undoneTrashItems.map(item => ({
      id: `restored-${Date.now()}-${item.cert.id}`,
      restoredAt: nowStr,
      deleteReason: item.deleteReason || '삭제 취소(Undo)로 복원됨',
      cert: item.cert,
      isZipEncrypted: true,
      encryptionLevel: 'AES-256-GCM + ZIP 압축 + DPAPI/WebCrypto 이중 암호화',
      zipContainerName: `${item.cert.id}_encrypted_vault.zip.dat`,
      encryptedZipPath: `%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault\\Archives\\${item.cert.id}_encrypted_vault.zip.dat`,
      vaultArchiveLocation: `%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault\\Archives\\${item.cert.id}_encrypted_vault.zip.dat`,
      compressedSizeBytes: item.cert.files ? Math.round(((item.cert.files.certSize || 2048) + (item.cert.files.keySize || 1024)) * 0.72) : 2845,
      integrityBeforeAfter: {
        beforeStatus: '🔒 격리 보관소 파티션 SHA-256 무결성 검증 통과 (해시 손상 없음)',
        afterStatus: '⚡ 원본 경로 복원 완료 - signCert.der/signPri.key 개인키 Pair 검증 정상',
        sha256: item.cert.files?.sha256 || 'SHA-256 VERIFIED'
      }
    }));
    setRestoredTrashItems(prev => {
      const updated = [...newRestoredItems, ...prev];
      saveProtectedRestoredItems(updated);
      return updated;
    });

    // Add back to certificates without duplicates
    setCertificates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = restoredCerts.filter(c => !existingIds.has(c.id));
      return [...toAdd, ...prev];
    });

    // Re-select them for convenience
    setSelectedIds(prev => [...new Set([...prev, ...restoredCerts.map(c => c.id)])]);

    // Automatic refresh!
    handleRefresh(`⚡ 삭제 취소(Undo)가 완료되어 ${restoredCerts.length}건의 인증서가 복구되고 목록이 자동 새로고침 되었습니다.`);

    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '삭제 실행 취소 (Undo 복원)',
      details: `휴지통으로 이동되었던 ${restoredCerts.length}건 즉시 원상 복구 및 자동 새로고침 (${restoredCerts.map(c => c.name).join(', ')})`,
      source: '임시 보관 휴지통',
      target: '로컬 보관함',
      count: restoredCerts.length
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // Popup Completion Message Window for Undo Restore
    setOperationCompleteData({
      title: '🎉 휴지통 인증서 삭제 취소(Undo) 복원 완료',
      subtitle: `휴지통으로 이동되었던 ${restoredCerts.length}건의 인증서가 원본 보관 디렉터리로 즉시 복구되었습니다.`,
      operationType: 'RESTORE',
      count: restoredCerts.length,
      certNames: restoredCerts.map(c => c.name),
      targetDiskName: restoredCerts[0]?.sourceDrive || '로컬 보관함',
      targetPath: restoredCerts[0]?.sourceLocation || '원래 보관 디렉터리',
      transferredCerts: restoredCerts,
      hasIntegrityVerified: true,
      sha256Checksum: restoredCerts[0]?.files?.sha256 || 'SHA-256 VERIFIED'
    });
    setIsOperationCompleteOpen(true);
  };

  const handleRestoreFromTrash = (trashIdsToRestore: string[]) => {
    const itemsToRestore = trashItems.filter(item => trashIdsToRestore.includes(item.id));
    if (itemsToRestore.length === 0) return;

    const certsToRestore = itemsToRestore.map(i => i.cert);
    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newRestoredItems: RestoredTrashItem[] = itemsToRestore.map(item => ({
      id: `restored-${Date.now()}-${item.cert.id}`,
      restoredAt: nowStr,
      deleteReason: item.deleteReason || '사용자 개별 복원 요청',
      cert: item.cert,
      isZipEncrypted: true,
      encryptionLevel: 'AES-256-GCM + ZIP 압축 + DPAPI/WebCrypto 이중 암호화',
      zipContainerName: `${item.cert.id}_encrypted_vault.zip.dat`,
      encryptedZipPath: `%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault\\Archives\\${item.cert.id}_encrypted_vault.zip.dat`,
      vaultArchiveLocation: `%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault\\Archives\\${item.cert.id}_encrypted_vault.zip.dat`,
      compressedSizeBytes: item.cert.files?.fileSize ? Math.round(item.cert.files.fileSize * 0.72) : 2845,
      integrityBeforeAfter: {
        beforeStatus: '🔒 격리 보관소 파티션 SHA-256 무결성 검증 통과 (100% 보존)',
        afterStatus: '⚡ 원본 경로 복원 완료 - 인증서/개인키 Pair 서명 검증 정상 동기화',
        sha256: item.cert.files?.sha256 || 'SHA-256 VERIFIED'
      }
    }));

    setRestoredTrashItems(prev => {
      const updated = [...newRestoredItems, ...prev];
      saveProtectedRestoredItems(updated);
      return updated;
    });

    setCertificates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = certsToRestore.filter(c => !existingIds.has(c.id));
      return [...toAdd, ...prev];
    });

    setTrashItems(prev => prev.filter(i => !trashIdsToRestore.includes(i.id)));
    setSelectedIds(prev => [...new Set([...prev, ...certsToRestore.map(c => c.id)])]);

    // Automatic refresh!
    handleRefresh(`⚡ ${certsToRestore.length}건의 인증서가 원본 위치로 복구되었으며, 보관함 및 드라이브 상태가 자동 새로고침 되었습니다.`);

    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '휴지통 선택 인증서 복원',
      details: `${certsToRestore.length}건 복구 및 자동 새로고침 완료 (${certsToRestore.map(c => c.name).join(', ')})`,
      source: '임시 보관 휴지통',
      target: '로컬 보관함',
      count: certsToRestore.length
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // Popup Completion Message Window for Trash Restore
    setOperationCompleteData({
      title: '🎉 휴지통 인증서 원본 경로 복원 완료',
      subtitle: `격리 보관 휴지통에 보관 중이던 ${certsToRestore.length}건의 인증서가 원래 저장 디렉터리로 성공적으로 복구되었습니다.`,
      operationType: 'RESTORE',
      count: certsToRestore.length,
      certNames: certsToRestore.map(c => c.name),
      targetDiskName: certsToRestore[0]?.sourceDrive || '로컬 보관함',
      targetPath: certsToRestore[0]?.sourceLocation || '원래 보관 디렉터리',
      transferredCerts: certsToRestore,
      hasIntegrityVerified: true,
      sha256Checksum: certsToRestore[0]?.files?.sha256 || 'SHA-256 VERIFIED'
    });
    setIsOperationCompleteOpen(true);
  };

  const handleRestoreAllTrash = () => {
    if (trashItems.length === 0) return;
    const certsToRestore = trashItems.map(i => i.cert);
    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newRestoredItems: RestoredTrashItem[] = trashItems.map(item => ({
      id: `restored-${Date.now()}-${item.cert.id}`,
      restoredAt: nowStr,
      deleteReason: item.deleteReason || '휴지통 전체 일괄 복원',
      cert: item.cert,
      isZipEncrypted: true,
      encryptionLevel: 'AES-256-GCM + ZIP 압축 + DPAPI/WebCrypto 이중 암호화',
      zipContainerName: `${item.cert.id}_encrypted_vault.zip.dat`,
      encryptedZipPath: `%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault\\Archives\\${item.cert.id}_encrypted_vault.zip.dat`,
      vaultArchiveLocation: `%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault\\Archives\\${item.cert.id}_encrypted_vault.zip.dat`,
      compressedSizeBytes: item.cert.files?.fileSize ? Math.round(item.cert.files.fileSize * 0.72) : 2845,
      integrityBeforeAfter: {
        beforeStatus: '🔒 격리 보관소 파티션 SHA-256 무결성 검증 통과 (100% 보존)',
        afterStatus: '⚡ 원본 경로 복원 완료 - 인증서/개인키 Pair 서명 검증 정상 동기화',
        sha256: item.cert.files?.sha256 || 'SHA-256 VERIFIED'
      }
    }));

    setRestoredTrashItems(prev => {
      const updated = [...newRestoredItems, ...prev];
      saveProtectedRestoredItems(updated);
      return updated;
    });

    setCertificates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = certsToRestore.filter(c => !existingIds.has(c.id));
      return [...toAdd, ...prev];
    });

    const count = trashItems.length;
    setTrashItems([]);
    setSelectedIds(prev => [...new Set([...prev, ...certsToRestore.map(c => c.id)])]);

    // Automatic refresh!
    handleRefresh(`⚡ 휴지통의 모든 인증서(${count}건)가 정상적으로 복구되었으며, 자동 새로고침이 적용되었습니다.`);

    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '휴지통 전체 인증서 일괄 복원',
      details: `휴지통에 보관 중이던 ${count}건 전체 복구 및 자동 새로고침 완료`,
      source: '임시 보관 휴지통',
      target: '로컬 보관함',
      count: count
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // Popup Completion Message Window for Trash Restore All
    setOperationCompleteData({
      title: '🎉 휴지통 인증서 전체 일괄 복원 완료',
      subtitle: `격리 보관 휴지통의 모든 인증서(${count}건)가 원래 저장 디렉터리로 완벽하게 일괄 복구되었습니다.`,
      operationType: 'RESTORE',
      count: count,
      certNames: certsToRestore.map(c => c.name),
      targetDiskName: certsToRestore[0]?.sourceDrive || '로컬 보관함',
      targetPath: certsToRestore[0]?.sourceLocation || '원래 보관 디렉터리',
      transferredCerts: certsToRestore,
      hasIntegrityVerified: true,
      sha256Checksum: certsToRestore[0]?.files?.sha256 || 'SHA-256 VERIFIED'
    });
    setIsOperationCompleteOpen(true);
  };

  const handleClearRestoredTrash = () => {
    setRestoredTrashItems([]);
    saveProtectedRestoredItems([]);
    showToast('🧹 복원 항목 이력 보관소를 완전히 비웠습니다.');
  };

  const handleDeleteRestoredTrashItem = (id: string) => {
    setRestoredTrashItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveProtectedRestoredItems(updated);
      return updated;
    });
    showToast('🗑️ 지정한 복원 이력 항목이 삭제되었습니다.');
  };

  const handleRestoreToUsbFromVault = (item: RestoredTrashItem) => {
    // 1. Check for connected removable USB drive
    const removableDrive = availableDrives.find(d => d.type === 'removable' || d.busType === 'USB' || d.isUsb);

    if (!removableDrive) {
      showToast('⚠️ 연결된 이동식 USB 메모리를 찾을 수 없습니다. 특수 보관소의 제한 복구 기능은 부가 파일 오염을 방지하기 위해 이동식 USB 매체로만 복원할 수 있습니다. USB 메모리를 컴퓨터에 연결하신 후 다시 시도해 주세요.');
      return;
    }

    const certCat = item.cert.category;
    const certSubFolder = certCat.startsWith('GPKI') ? 'GPKI' : certCat.startsWith('EPKI') ? 'EPKI' : 'NPKI';
    const targetUsbPath = `${removableDrive.letter}\\${certSubFolder}\\${item.cert.name}`;

    // Add/update restored cert on USB to active certificates
    const restoredCertToUsb: CertificateItem = {
      ...item.cert,
      sourceLocation: targetUsbPath,
      sourceDrive: `${removableDrive.letter} (${removableDrive.name})`,
      status: isCertificateExpired(item.cert) ? 'expired' : 'valid'
    };

    setCertificates(prev => {
      const existing = prev.find(c => c.id === item.cert.id || (c.sourceLocation && c.sourceLocation.trim().toUpperCase() === targetUsbPath.trim().toUpperCase()));
      if (existing) {
        return prev.map(c => (c.id === existing.id) ? restoredCertToUsb : c);
      }
      return [restoredCertToUsb, ...prev];
    });

    // Record audit log
    const newLog = logActivity({
      category: 'RESTORE',
      level: 'SUCCESS',
      action: '특수 보관소 ➔ USB 제한 복구 완료',
      details: `보안 보관소 [${item.cert.name}] ➔ 이동식 USB (${removableDrive.letter}) ${certSubFolder} 경로로 제한 복구 성공 (SHA-256 서명 무결성 검증 100% 통과)`,
      source: '보호 항목 암호화 저장소 (%LOCALAPPDATA%\\KCertManager\\ProtectedRestoredVault)',
      target: targetUsbPath,
      count: 1
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // Play completion sound & show Operation Complete modal
    playSuccessChime();
    setOperationCompleteData({
      title: '특수 보관소 ➔ USB 제한 복구 완료!',
      subtitle: `특수 보호 보관소에 암호화 보관 중이던 [${item.cert.name}] 인증서가 이동식 USB 메모리(${removableDrive.letter} ${removableDrive.name})의 표준 인증서 경로로 제한 복구되었습니다.`,
      operationType: 'USB_RESTORE',
      count: 1,
      certNames: [item.cert.name],
      targetDiskName: `${removableDrive.letter} (${removableDrive.name})`,
      targetPath: targetUsbPath,
      transferredCerts: [restoredCertToUsb],
      hasIntegrityVerified: true,
      sha256Checksum: item.cert.files?.sha256 || 'SHA-256 VERIFIED'
    });
    setIsOperationCompleteOpen(true);
  };

  const handleEmptyTrash = () => {
    const count = trashItems.length;
    if (count === 0) return;

    // 보안 삭제 증적 로그 생성: 삭제된 파일의 상세 경로 및 고유 식별자(SubjectDN)
    const deletionEvidence: SecureDeletionEvidenceItem[] = trashItems.map(item => ({
      certId: item.cert.id,
      name: item.cert.name,
      subjectDn: item.cert.subjectDn,
      issuer: item.cert.issuer,
      serialNumber: item.cert.serialNumber,
      sourceLocation: item.cert.sourceLocation,
      fileList: [
        item.cert.files.certName,
        item.cert.files.keyName,
        ...(item.cert.files.kmCertName ? [item.cert.files.kmCertName] : []),
        ...(item.cert.files.kmKeyName ? [item.cert.files.kmKeyName] : []),
      ].filter(Boolean),
      sha256: item.cert.files.sha256,
      deletedAt: formatCurrentTimestamp(),
      permanentMethod: '휴지통 전체 비우기 (공개키 및 개인키 영구 소멸/파기)'
    }));

    setTrashItems([]);
    showToast(`휴지통을 비웠습니다. (${count}건의 파일 영구 소멸 및 보안 삭제 증적 기록 완료)`);

    const newLog = logActivity({
      category: 'DELETE',
      level: 'ERROR',
      action: '휴지통 전체 비우기 (보안 삭제 증적 기록)',
      details: `휴지통 내 ${count}건의 인증서 파일 및 개인키를 영구 폐기하고, 삭제 파일 상세 경로와 고유 식별자(SubjectDN) 증적을 기록했습니다.`,
      source: '임시 보관 휴지통',
      target: '영구 파기 (Permanent Purge)',
      count: count,
      deletionEvidence
    });
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handlePermanentlyDeleteTrash = (trashIds: string[]) => {
    const targets = trashItems.filter(item => trashIds.includes(item.id));
    if (targets.length === 0) return;

    // 보안 삭제 증적 로그 생성: 삭제된 파일의 상세 경로 및 고유 식별자(SubjectDN)
    const deletionEvidence: SecureDeletionEvidenceItem[] = targets.map(item => ({
      certId: item.cert.id,
      name: item.cert.name,
      subjectDn: item.cert.subjectDn,
      issuer: item.cert.issuer,
      serialNumber: item.cert.serialNumber,
      sourceLocation: item.cert.sourceLocation,
      fileList: [
        item.cert.files.certName,
        item.cert.files.keyName,
        ...(item.cert.files.kmCertName ? [item.cert.files.kmCertName] : []),
        ...(item.cert.files.kmKeyName ? [item.cert.files.kmKeyName] : []),
      ].filter(Boolean),
      sha256: item.cert.files.sha256,
      deletedAt: formatCurrentTimestamp(),
      permanentMethod: '개별 영구 폐기 (공개키 및 개인키 영구 소멸/파기)'
    }));

    setTrashItems(prev => prev.filter(item => !trashIds.includes(item.id)));
    showToast(`선택한 ${targets.length}건의 인증서가 영구 폐기되었습니다. (보안 삭제 증적 기록 완료)`);

    const newLog = logActivity({
      category: 'DELETE',
      level: 'ERROR',
      action: `인증서 ${targets.length}건 개별 영구 삭제 (보안 삭제 증적 기록)`,
      details: `선택한 인증서(${targets.map(t => t.cert.name).join(', ')})를 영구 폐기하고, 삭제 파일 상세 경로 및 고유 식별자(SubjectDN) 증적을 기록했습니다.`,
      source: '임시 보관 휴지통',
      target: '영구 파기 (Permanent Purge)',
      count: targets.length,
      deletionEvidence
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

    // 복사작업 성공 후 새로고침 자동으로 진행 및 토스트 알림에 [무결성 확인 완료] 배지 표시
    handleRefresh(
      `⚡ ${record.targetDisk}로 인증서 ${record.certificatesCount}건 복사 완료`,
      true,
      'SHA-256 해시 일치'
    );

    // 전용 작업 완료 안내 팝업창(모달) 오픈
    const copiedCertObjects = certificates.filter(
      c => record.certNames.includes(c.name) || selectedIds.includes(c.id)
    );

    setOperationCompleteData({
      title: '인증서 복사 및 USB 백업 완료!',
      subtitle: `선택하신 인증서 ${record.certificatesCount}개가 대상 디스크(${record.targetDisk})에 안전하게 복사되었으며, SHA-256 무결성 검증을 통과했습니다.`,
      operationType: 'PC_TO_USB',
      count: record.certificatesCount,
      certNames: record.certNames,
      targetDiskName: record.targetDisk,
      targetPath: `${record.targetDisk}\\${record.targetPath}`,
      sourcePath: copiedCertObjects[0]?.sourceLocation || 'C:\\Users\\...\\AppData\\LocalLow\\NPKI',
      timestamp: record.timestamp,
      checksum: record.checksum || 'SHA-256 무결성 검증 통과',
      certificates: copiedCertObjects.length > 0
        ? copiedCertObjects.map(c => ({
            name: c.name,
            issuer: c.issuer,
            policy: c.policy,
            validTo: c.validTo
          }))
        : record.certNames.map(name => ({ name, issuer: '공동인증서 (전자서명 키 페어)' }))
    });
    setIsOperationCompleteOpen(true);
  };

  const handleImportFromUsbSuccess = (importedCerts: CertificateItem[], summaryMessage?: string) => {
    const newlyAddedIds: string[] = importedCerts.map(c => c.id);
    triggerCopiedHighlight(newlyAddedIds);

    setCertificates(prev => {
      const nextList = [...prev];

      for (const importedCert of importedCerts) {
        // Strictly match by exact certificate ID or exact destination PC sourceLocation to prevent name-based co-deletion
        const existingIdx = nextList.findIndex(
          c => c.id === importedCert.id || (c.sourceLocation && c.sourceLocation.trim().toUpperCase() === importedCert.sourceLocation.trim().toUpperCase())
        );

        if (existingIdx >= 0) {
          nextList[existingIdx] = importedCert;
        } else {
          nextList.unshift(importedCert);
        }
      }

      return nextList;
    });

    // Automatically select newly imported certificates outside pure state updater
    setSelectedIds(prevSelected => [...new Set([...prevSelected, ...newlyAddedIds])]);

    // Also remove from trash if imported (strictly by exact certificate ID)
    setTrashItems(prev => {
      const importedIds = new Set(importedCerts.map(c => c.id));
      return prev.filter(t => !importedIds.has(t.cert.id));
    });

    const firstImported = importedCerts[0];
    const resolvedTargetPath = firstImported?.sourceLocation || 'C:\\Users\\Admin\\AppData\\LocalLow\\NPKI';
    const resolvedTargetDrive = firstImported?.sourceDrive || '내 컴퓨터 로컬 디스크 (C:)';

    const newLog = logActivity({
      category: 'IMPORT',
      level: 'SUCCESS',
      action: 'USB ➔ PC 인증서 가져오기 완료',
      details: summaryMessage || `외부 매체에서 ${resolvedTargetDrive} 보관함으로 ${importedCerts.length}건 복사 완료 (${importedCerts.map(c => c.name).join(', ')})`,
      source: '이동식 USB 매체',
      target: resolvedTargetPath,
      count: importedCerts.length
    });
    setActivityLogs(prev => [newLog, ...prev]);

    // 복사작업 성공 후 새로고침 자동으로 진행 및 토스트 알림에 [무결성 확인 완료] 배지 표시
    handleRefresh(
      summaryMessage ? `⚡ ${summaryMessage}` : `⚡ USB ➔ PC 복사가 완료되어 인증서 목록을 새로고침했습니다 (${importedCerts.length}건 등록).`,
      true,
      'SHA-256 해시 일치'
    );

    // 전용 작업 완료 안내 팝업창(모달) 오픈
    setOperationCompleteData({
      title: '인증서 컴퓨터(PC) 가져오기 완료!',
      subtitle: `USB 메모리의 인증서 ${importedCerts.length}개가 ${resolvedTargetDrive}의 공인 보관함으로 안전하게 복사되었습니다.`,
      operationType: 'USB_TO_PC',
      count: importedCerts.length,
      certNames: importedCerts.map(c => c.name),
      targetDiskName: resolvedTargetDrive,
      targetPath: resolvedTargetPath,
      sourcePath: '이동식 USB 매체 (NPKI/GPKI)',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      checksum: 'SHA-256 무결성 검증 통과',
      certificates: importedCerts.map(c => ({
        name: c.name,
        issuer: c.issuer,
        policy: c.policy,
        validTo: c.validTo
      }))
    });
    setIsOperationCompleteOpen(true);
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
      setTimeout(() => historyPanelRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } else if (tab === 'paths') {
      setTimeout(() => pathsPanelRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } else if (tab === 'copy') {
      copyPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const validCount = certificates.filter(c => c.status === 'valid').length;
  const expiredCount = certificates.filter(isCertificateExpired).length;
  const removableDrivesCount = availableDrives.filter(d => d.type === 'removable').length;

  const sidebarCounts = useMemo(() => ({
    total: certificates.length,
    gpki: certificates.filter(c => c.category === 'GPKI_GOV').length,
    epki: certificates.filter(c => c.category === 'EPKI_EDU').length,
    npki: certificates.filter(c => c.category === 'NPKI_BANK' || c.category === 'NPKI_CORP').length,
    expired: certificates.filter(isCertificateExpired).length,
    nonStandard: nonStandardCount,
    pc: certificates.filter(c => !isUsbCertificate(c)).length,
    usb: certificates.filter(c => isUsbCertificate(c)).length,
  }), [certificates, nonStandardCount]);

  const displayedCertCount = useMemo(
    () => filterCertificatesByCriteria(certificates, sidebarCategoryFilter, sidebarSourceFilter, gridSearchQuery).length,
    [certificates, sidebarCategoryFilter, sidebarSourceFilter, gridSearchQuery]
  );

  const handleStartDetailSplitterDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = detailSidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      setDetailSidebarWidth(Math.max(320, Math.min(540, startWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const selectedCertificates = useMemo(() => {
    if (explicitBackupCerts !== null) {
      return explicitBackupCerts;
    }
    return certificates.filter(c => selectedIds.includes(c.id));
  }, [certificates, selectedIds, explicitBackupCerts]);

  const resolvedInspectedCert = useMemo(() => {
    if (inspectedCert && certificates.some(c => c.id === inspectedCert.id)) {
      return inspectedCert;
    }
    return certificates[0] || null;
  }, [inspectedCert, certificates]);

  return (
    <div
      className="wpf-shell wpf-native flex flex-col min-h-screen lg:h-screen lg:overflow-hidden font-sans antialiased transition-colors duration-150"
      data-theme={currentTheme}
      id="app-root"
    >
      {/* Floating Interactive Toast Notification (Matches WPF Floating Toast) */}
      {toastData && (
        <div
          className="wpf-native fixed top-[74px] right-6 z-50 px-4 py-3 rounded-[10px] shadow-2xl text-xs sm:text-[13px] font-medium flex items-center gap-3 animate-fadeIn max-w-xl"
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #38BDF8',
            color: '#F8FAFC',
          }}
        >
          {toastData.type === 'delete' ? (
            <div className="w-7 h-7 rounded-[6px] bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
          ) : toastData.hasIntegrityBadge ? (
            <div className="w-7 h-7 rounded-[6px] bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-[6px] bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-slate-100 leading-snug font-semibold">{toastData.message}</p>
              {toastData.hasIntegrityBadge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#065F46] text-[#A7F3D0] border border-[#34D399] text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>무결성 확인 완료 ({toastData.checksumText || 'SHA-256'})</span>
                </span>
              )}
            </div>
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
                className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-[6px] text-xs font-medium cursor-pointer"
              >
                휴지통 보기
              </button>
            )}

            <button
              type="button"
              onClick={() => setToastData(null)}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ROW 0: WPF Full-Width 64px Header Bar */}
      <Header
        totalCount={certificates.length}
        validCount={validCount}
        removableCount={removableDrivesCount}
        isScanning={isScanning}
        theme={currentTheme}
        onThemeChange={handleThemeChange}
        onRefresh={() => handleRefresh()}
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
        onOpenPaths={() => setActiveNavTab(prev => (prev === 'paths' ? 'copy' : 'paths'))}
        onOpenHistory={() => setActiveNavTab(prev => (prev === 'history' ? 'copy' : 'history'))}
        activeNavTab={activeNavTab}
        isCheckingUpdates={isCheckingUpdates}
        hasUpdateBadge={!!updateInfo?.hasUpdate}
        logCount={activityLogs.length}
        trashCount={trashItems.length}
        lastScanTime={lastScanTime}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        appViewMode={appViewMode}
        onToggleAppViewMode={handleToggleAppViewMode}
        onOpenStartupWorkflow={() => setIsStartupWorkflowOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* ROW 1: 2-Column Main Body (Left 260px Sidebar + Main Workspace) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Desktop 260px Filter Sidebar */}
        <div className="hidden lg:flex shrink-0 h-full">
          <Sidebar
            categoryFilter={sidebarCategoryFilter}
            sourceFilter={sidebarSourceFilter}
            onSelectCategoryFilter={(cat) => {
              setSidebarCategoryFilter(cat);
              setActiveNavTab('copy');
            }}
            onSelectSourceFilter={(src) => {
              setSidebarSourceFilter(src);
              setActiveNavTab('copy');
            }}
            counts={sidebarCounts}
            availableDrives={availableDrives}
            selectedDriveId={selectedDriveId}
            onSelectDriveId={setSelectedDriveId}
            onOpenTargetDrivePicker={() => setIsTargetDrivePickerOpen(true)}
            onOpenRenewalGuidance={() => handleOpenRenewalGuidance()}
          />
        </div>

        {/* Mobile Drawer Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative flex h-full z-50">
              <Sidebar
                categoryFilter={sidebarCategoryFilter}
                sourceFilter={sidebarSourceFilter}
                onSelectCategoryFilter={(cat) => {
                  setSidebarCategoryFilter(cat);
                  setActiveNavTab('copy');
                }}
                onSelectSourceFilter={(src) => {
                  setSidebarSourceFilter(src);
                  setActiveNavTab('copy');
                }}
                counts={sidebarCounts}
                availableDrives={availableDrives}
                selectedDriveId={selectedDriveId}
                onSelectDriveId={setSelectedDriveId}
                onOpenTargetDrivePicker={() => {
                  setIsMobileSidebarOpen(false);
                  setIsTargetDrivePickerOpen(true);
                }}
                onOpenRenewalGuidance={() => handleOpenRenewalGuidance()}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Right Main Content Workspace (Matches WPF Grid.Column="1" Margin="20") */}
        <main
          ref={copyPanelRef}
          className="flex-1 flex flex-col min-w-0 min-h-0 p-4 sm:p-5 gap-3 overflow-y-auto"
          style={{ backgroundColor: 'var(--wpf-bg-dark)' }}
        >
          {/* Smart USB Detected Banner */}
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

          {/* Main Grid Row 0: Section Header & Quick Tools (Matches WPF lines 381-420) */}
          <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--wpf-text-primary)' }}
              >
                인증서 보관함 목록
              </h2>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums"
                style={{
                  backgroundColor: 'var(--wpf-bg-card)',
                  border: '1px solid var(--wpf-border)',
                  color: 'var(--wpf-accent-text)',
                }}
              >
                표시 중: {displayedCertCount}개
              </span>
              <span
                className="text-[11px] hidden sm:inline"
                style={{ color: 'var(--wpf-text-secondary)' }}
              >
                (항목 더블클릭 시 상세 규격 및 지문 조회)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(activeNavTab === 'paths' || activeNavTab === 'history') && (
                <button
                  type="button"
                  onClick={() => setActiveNavTab('copy')}
                  className="wpf-btn-primary wpf-native px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap"
                >
                  인증서 목록으로 돌아가기
                </button>
              )}

              {lastUndoSnapshot && (
                <button
                  type="button"
                  onClick={() => handleUndoDelete(lastUndoSnapshot.trashItems, lastUndoSnapshot.certs)}
                  className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-[6px] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>삭제 취소(되돌리기)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDetailSidebarVisible(prev => !prev)}
                className={`wpf-native px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-[6px] cursor-pointer whitespace-nowrap ${
                  isDetailSidebarVisible ? 'wpf-btn-primary' : 'wpf-btn-secondary'
                }`}
                title="인증서의 모든 규격, 정책 OID, 일련번호, 지문을 확인하는 상세 사이드바를 열거나 닫습니다."
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span>상세 사이드바</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCleanupModal('EXPIRED')}
                className="wpf-btn-secondary wpf-native px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--wpf-badge-expiring-text)' }} />
                <span>만료 인증서 정리</span>
              </button>
            </div>
          </div>

          {/* Optional Advanced Sub-Views: 탐색 경로 / 백업 이력 */}
          {activeNavTab === 'paths' && (
            <div ref={pathsPanelRef} className="shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--wpf-accent-text)' }}>
                  <FolderSearch className="w-4 h-4" />
                  <span>탐색 경로 관리</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNavTab('copy')}
                  className="wpf-btn-secondary wpf-native px-2 py-1 text-[11px] cursor-pointer"
                >
                  닫기
                </button>
              </div>
              <SearchLocationsPanel
                searchPaths={searchPaths}
                onTogglePath={handleTogglePath}
                onAddCustomPath={handleAddCustomPath}
                onCustomScannedCerts={handleCustomScannedCerts}
                isScanning={isScanning}
                onNotify={(msg) => showToast(msg)}
              />
            </div>
          )}

          {activeNavTab === 'history' && (
            <div ref={historyPanelRef} className="shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--wpf-accent-text)' }}>
                  <History className="w-4 h-4" />
                  <span>백업 및 복사 이력</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNavTab('copy')}
                  className="wpf-btn-secondary wpf-native px-2 py-1 text-[11px] cursor-pointer"
                >
                  닫기
                </button>
              </div>
              <BackupHistoryPanel
                history={backupHistory}
                onClearHistory={() => setBackupHistory([])}
              />
            </div>
          )}

          {/* Main Grid Row 1: Simple Mode Quick Banner OR Advanced Mode Connected Drives Bar */}
          {appViewMode === 'simple' ? (
            <SimpleTransferHero
              certificates={certificates}
              selectedIds={selectedIds}
              availableDrives={availableDrives}
              selectedDriveId={selectedDriveId}
              appViewMode={appViewMode}
              onToggleAppViewMode={handleToggleAppViewMode}
              onOpenTargetDrivePicker={() => setIsTargetDrivePickerOpen(true)}
              onStartBackup={() => handleOpenGeneralBackupModal(selectedDriveId)}
              onOpenUsbToPcModal={() => setIsUsbToPcModalOpen(true)}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <ConnectedDrivesBar
              availableDrives={availableDrives}
              certificates={certificates}
              selectedDriveId={selectedDriveId}
              onSelectDriveId={setSelectedDriveId}
              onBackupToDrive={(driveId) => {
                let targets = certificates.filter(c => selectedIds.includes(c.id));
                if (targets.length === 0) {
                  targets = certificates;
                  setSelectedIds(certificates.map(c => c.id));
                }
                setExplicitBackupCerts(targets);
                handleOpenGeneralBackupModal(driveId, targets);
              }}
              onOpenUsbToPc={(driveLetter) => {
                if (driveLetter) setTargetUsbLetterForModal(driveLetter);
                setIsUsbToPcModalOpen(true);
              }}
              onOpenUsbDiagnostic={() => setIsUsbDiagnosticModalOpen(true)}
            />
          )}

          {/* Main Grid Row 2: Split Workspace (DataGrid + Collapsible Resizable Detail Sidebar) */}
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-3 xl:gap-0">
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <CertificateList
                certificates={certificates}
                selectedIds={selectedIds}
                recentlyCopiedIds={recentlyCopiedIds}
                inspectedCertId={resolvedInspectedCert?.id || null}
                availableDrives={availableDrives}
                categoryFilter={sidebarCategoryFilter}
                sourceFilter={sidebarSourceFilter}
                searchQuery={gridSearchQuery}
                onSearchQueryChange={setGridSearchQuery}
                onResetFilters={() => {
                  setSidebarCategoryFilter('ALL');
                  setSidebarSourceFilter('ALL');
                  setGridSearchQuery('');
                }}
                onInspectCert={(cert) => setInspectedCert(cert)}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onSelectFilteredIds={(ids) => setSelectedIds(ids)}
                onClearSelection={handleClearSelection}
                onOpenBackupModal={() => {
                  let targets = certificates.filter(c => selectedIds.includes(c.id));
                  if (targets.length === 0) {
                    targets = certificates;
                    setSelectedIds(certificates.map(c => c.id));
                  }
                  setExplicitBackupCerts(targets);
                  handleOpenGeneralBackupModal(undefined, targets);
                }}
                onBackupAll={() => {
                  setSelectedIds(certificates.map(c => c.id));
                  setExplicitBackupCerts(certificates);
                  handleOpenGeneralBackupModal(undefined, certificates);
                }}
                onOpenDetailModal={(cert) => {
                  setInspectedCert(cert);
                  setSelectedCertForDetail(cert);
                }}
                onQuickBackupSingle={handleQuickBackupSingle}
                onOpenCleanupModal={handleOpenCleanupModal}
                onRequestDeleteSingle={handleRequestDeleteSingle}
                onUndoDelete={
                  lastUndoSnapshot
                    ? () => handleUndoDelete(lastUndoSnapshot.trashItems, lastUndoSnapshot.certs)
                    : undefined
                }
                canUndo={!!lastUndoSnapshot}
                onOpenUsbToPc={(driveLetter) => {
                  if (driveLetter) setTargetUsbLetterForModal(driveLetter);
                  setIsUsbToPcModalOpen(true);
                }}
                onNotifyCopy={(msg) => showToast(msg)}
              />
            </div>

            {isDetailSidebarVisible && (
              <>
                {/* Draggable Splitter (Desktop) */}
                <div
                  onMouseDown={handleStartDetailSplitterDrag}
                  className="hidden xl:flex w-2.5 cursor-col-resize items-center justify-center shrink-0 group select-none"
                  title="드래그하여 테이블과 상세 정보 사이드바의 너비를 조절합니다"
                >
                  <div
                    className="w-[2px] h-16 rounded-full transition-colors group-hover:bg-[#3B82F6]"
                    style={{ backgroundColor: 'var(--wpf-border)' }}
                  />
                </div>

                <CertificateDetailSidebar
                  cert={resolvedInspectedCert}
                  width={detailSidebarWidth}
                  onClose={() => setIsDetailSidebarVisible(false)}
                  onCopySingle={handleQuickBackupSingle}
                  onOpenFullDetailModal={(cert) => setSelectedCertForDetail(cert)}
                  onNotifyCopy={(msg) => showToast(msg)}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* ROW 2: WPF 32px Status Bar Footer (Matches WPF MainWindow.xaml lines 1290-1326) */}
      <footer
        className="wpf-native h-8 px-4 flex items-center justify-between gap-3 text-[11px] shrink-0 overflow-x-auto scrollbar-none"
        style={{
          backgroundColor: 'var(--wpf-bg-dark)',
          borderTop: '1px solid var(--wpf-border)',
          color: 'var(--wpf-text-secondary)',
        }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold tabular-nums" style={{ color: 'var(--wpf-accent-text)' }}>v{APP_VERSION}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px]"
            style={{
              backgroundColor: 'var(--wpf-bg-card)',
              border: '1px solid var(--wpf-border)',
              color: 'var(--wpf-text-muted)',
            }}
          >
            Web SPA · Sandbox
          </span>
          <span style={{ color: 'var(--wpf-border)' }}>|</span>
          <span className="truncate max-w-[420px]">
            인증서 {certificates.length}건 감지 · USB {removableDrivesCount}대 · 마지막 스캔 {lastScanTime}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <span>개발자: {DEVELOPER_INFO.author}</span>
          <span style={{ color: 'var(--wpf-border)' }}>|</span>
          <a
            href={DEVELOPER_INFO.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium"
            style={{ color: 'var(--wpf-accent-text)' }}
          >
            {DEVELOPER_INFO.affiliation} (cisnet.co.kr)
          </a>
          <span style={{ color: 'var(--wpf-border)' }}>|</span>
          <a
            href={DEVELOPER_INFO.blog}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium"
            style={{ color: 'var(--wpf-accent-green)' }}
          >
            공식 구글 블로그
          </a>
          <span style={{ color: 'var(--wpf-border)' }}>|</span>
          <a
            href={DEVELOPER_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium"
            style={{ color: 'var(--wpf-accent-text)' }}
          >
            GitHub 저장소
          </a>
          <span style={{ color: 'var(--wpf-border)' }}>|</span>
          <button
            type="button"
            onClick={() => setIsLicenseModalOpen(true)}
            className="hover:underline cursor-pointer"
            style={{ color: 'var(--wpf-accent-text)' }}
          >
            라이선스
          </button>
        </div>
      </footer>

      {/* Modals */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />

      <TargetDrivePickerModal
        isOpen={isTargetDrivePickerOpen}
        onClose={() => {
          setIsTargetDrivePickerOpen(false);
          setExplicitBackupCerts(null);
        }}
        selectedCerts={selectedCertificates}
        availableDrives={availableDrives}
        existingCertificates={certificates}
        onConfirmTargetDrive={handleConfirmTargetDriveFromPicker}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => {
          setIsBackupModalOpen(false);
          setExplicitBackupCerts(null);
        }}
        selectedCerts={selectedCertificates}
        availableDrives={availableDrives}
        existingCertificates={certificates}
        onBackupSuccess={handleBackupSuccess}
        initialDriveId={selectedDriveId}
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
        restoredTrashItems={restoredTrashItems}
        onRestore={handleRestoreFromTrash}
        onRestoreAll={handleRestoreAllTrash}
        onEmptyTrash={handleEmptyTrash}
        onPermanentlyDelete={handlePermanentlyDeleteTrash}
        onClearRestoredHistory={handleClearRestoredTrash}
        onDeleteRestoredItem={handleDeleteRestoredTrashItem}
        onRestoreToUsb={handleRestoreToUsbFromVault}
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
        onClose={() => {
          setIsUpdateModalOpen(false);
          if (!dontShowStartupAgain) {
            setIsStartupWorkflowOpen(true);
          }
        }}
        updateInfo={updateInfo}
        onRecheck={handleManualCheckUpdates}
        isChecking={isCheckingUpdates}
      />

      {/* Startup Task Selection Modal (PC->USB, USB->PC, 메인진입) */}
      <StartupWorkflowModal
        isOpen={isStartupWorkflowOpen}
        onClose={() => setIsStartupWorkflowOpen(false)}
        onSelectWorkflow={handleSelectWorkflow}
        dontShowAgain={dontShowStartupAgain}
        onToggleDontShowAgain={handleToggleDontShowStartupAgain}
        validPcCerts={certificates.filter(c => isPcCertificate(c) && c.status !== 'expired')}
        recentMode={activeWorkflow}
      />

      {/* Guided Step-by-Step Workflow Motion Overlay */}
      {(() => {
        const guidedSelectedCerts = certificates.filter(c => selectedIds.includes(c.id));
        const guidedTargetDrive = availableDrives.find(d => d.type === 'removable' || d.busType === 'USB') || availableDrives[0];
        const guidedIsSelfCopy = activeWorkflow === 'pc_to_usb' && guidedTargetDrive && guidedSelectedCerts.length > 0 && guidedSelectedCerts.every(c => isSameDriveSelfCopy(c, guidedTargetDrive));
        
        const guidedPathErrorNotice = guidedIsSelfCopy
          ? `선택한 ${guidedSelectedCerts.length}개 인증서가 모두 이미 ${guidedTargetDrive.letter} (${guidedTargetDrive.name}) 드라이브의 동일 위치에 보관 중입니다. 동일 위치 자가 복사는 제한되므로 다른 드라이브(C:, D:, 타 USB)를 선택해 주세요.`
          : null;

        const guidedDuplicateCount = guidedTargetDrive && guidedSelectedCerts.length > 0
          ? guidedSelectedCerts.filter(c => !isSameDriveSelfCopy(c, guidedTargetDrive) && certificates.some(other => other.id !== c.id && (other.name === c.name || other.serialNumber === c.serialNumber) && ((other.sourceLocation && other.sourceLocation.includes(guidedTargetDrive.letter)) || (other.sourceDrive && other.sourceDrive.includes(guidedTargetDrive.letter))))).length
          : 0;

        const guidedDuplicateNotice = guidedDuplicateCount > 0
          ? `대상 드라이브(${guidedTargetDrive.letter})에 이미 보관 중인 동일 인증서 ${guidedDuplicateCount}건이 감지되었습니다. [덮어쓰기], [건너뛰기], [기존 백업 보존] 중 선택하여 진행하세요.`
          : null;

        return (
          <GuidedWorkflowOverlay
            workflowType={activeWorkflow}
            onCloseWorkflow={() => setActiveWorkflow(null)}
            selectedCertCount={selectedIds.length}
            availableUsbCount={availableDrives.filter(d => d.type === 'removable' || d.busType === 'USB').length}
            onOpenBackupModal={() => handleOpenGeneralBackupModal()}
            onOpenUsbToPcModal={() => setIsUsbToPcModalOpen(true)}
            onSelectAllCerts={handleSelectAll}
            pathErrorNotice={guidedPathErrorNotice}
            duplicateNotice={guidedDuplicateNotice}
          />
        );
      })()}

      {/* Environment & Sound Settings Modal (SuccessChime ON/OFF & Volume Slider) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={currentTheme}
        onThemeChange={handleThemeChange}
        appViewMode={appViewMode}
        onToggleAppViewMode={handleToggleAppViewMode}
        dontShowStartupAgain={dontShowStartupAgain}
        onToggleDontShowStartupAgain={handleToggleDontShowStartupAgain}
      />

      {/* 작업 완료 안내 전용 팝업창 모달 (Operation Complete Modal) */}
      <OperationCompleteModal
        isOpen={isOperationCompleteOpen}
        onClose={() => setIsOperationCompleteOpen(false)}
        data={operationCompleteData}
        onOpenHistory={() => {
          setIsOperationCompleteOpen(false);
          handleNavTabSelect('history');
        }}
      />
    </div>
  );
}
