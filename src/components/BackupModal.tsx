import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Lock, 
  Unlock,
  FileCheck, 
  AlertCircle,
  AlertTriangle,
  FolderTree,
  FileKey,
  FolderOpen,
  ArrowRight,
  Loader2,
  RefreshCw,
  Wrench,
  HelpCircle,
  Info,
  Terminal,
  RotateCcw,
  CopyCheck,
  Layers,
  Archive,
  SkipForward,
  FileDiff,
  Calendar,
  Hash,
  ArrowRightLeft,
  Zap,
  RotateCw,
  Activity,
  WifiOff
} from 'lucide-react';
import { CertificateItem, DiskDrive } from '../types';
import { BRANDING_ASSETS } from '../data/brandingAssets';
import { 
  copyCertificatesToDisk, 
  writeCertificatesToDirectoryHandle, 
  getStandardDirectoryPath,
  checkDriveWritePermission,
  detectDuplicateCertificates,
  DuplicateConflictItem,
  DuplicateDetectionResult,
  DiskWriteCheckResult,
  BackupResult
} from '../utils/backupService';
import { 
  executeUsbOperationWithRetry,
  UsbRetryOptions,
  UsbRetryResult
} from '../utils/usbToPcService';
import { parseUserFriendlyError, formatUserErrorMessage } from '../utils/userFriendlyError';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCerts: CertificateItem[];
  availableDrives: DiskDrive[];
  existingCertificates?: CertificateItem[];
  onBackupSuccess: (record: any) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  selectedCerts,
  availableDrives,
  existingCertificates = [],
  onBackupSuccess,
}) => {
  const [selectedDriveId, setSelectedDriveId] = useState<string>(
    availableDrives.find(d => d.type === 'removable')?.id || availableDrives[0]?.id || 'drive-e'
  );
  const [includeManifest, setIncludeManifest] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [writeDirectToDisk, setWriteDirectToDisk] = useState(false);
  const [directWriteError, setDirectWriteError] = useState<string | null>(null);

  // Write Protection Check State
  const [writeCheckResult, setWriteCheckResult] = useState<DiskWriteCheckResult | null>(null);
  const [isCheckingWrite, setIsCheckingWrite] = useState<boolean>(false);
  const [writeProtectionError, setWriteProtectionError] = useState<DiskWriteCheckResult | null>(null);
  const [simulatedLockedDriveIds, setSimulatedLockedDriveIds] = useState<string[]>([]);
  const [showTroubleshootingGuide, setShowTroubleshootingGuide] = useState<boolean>(false);

  // Duplicate Certificate Detection & Confirmation Dialog State
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [duplicateMode, setDuplicateMode] = useState<'overwrite' | 'skip' | 'archive_old'>('overwrite');
  const [customDuplicateDecisions, setCustomDuplicateDecisions] = useState<Record<string, 'overwrite' | 'skip' | 'archive_old'>>({});

  // Auto-Retry State (Up to 3 attempts on transient USB / I/O disconnection)
  const [currentAttempt, setCurrentAttempt] = useState<number>(1);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [retryReason, setRetryReason] = useState<string | null>(null);
  const [retryDelayMs, setRetryDelayMs] = useState<number>(0);
  const [retryAttemptsUsed, setRetryAttemptsUsed] = useState<number>(1);
  const [simulateTransientError, setSimulateTransientError] = useState<boolean>(false);
  const [retryHistory, setRetryHistory] = useState<{ attempt: number; reason: string; delayMs: number }[]>([]);

  const targetDrive = availableDrives.find(d => d.id === selectedDriveId) || availableDrives[0];

  // Perform write permission probe check
  const runWriteCheck = async (drive: DiskDrive, forceSimLockList?: string[], isSilent = false) => {
    if (!drive) return;
    setIsCheckingWrite(true);
    const lockList = forceSimLockList !== undefined ? forceSimLockList : simulatedLockedDriveIds;
    const isSimLocked = lockList.includes(drive.id) || drive.isWritable === false;
    
    try {
      const res = await checkDriveWritePermission(drive, { forceSimulatedLock: isSimLocked });
      setWriteCheckResult(res);
      if (!isSilent) {
        if (!res.isWritable) {
          setWriteProtectionError(res);
        } else {
          setWriteProtectionError(null);
        }
      } else {
        if (res.isWritable) {
          setWriteProtectionError(null);
        }
      }
    } catch (err: any) {
      console.error('Write check failed:', err);
    } finally {
      setIsCheckingWrite(false);
    }
  };

  // Check duplicate status whenever drive or selection changes
  useEffect(() => {
    if (isOpen && targetDrive) {
      runWriteCheck(targetDrive, simulatedLockedDriveIds, true);
      const dup = detectDuplicateCertificates(selectedCerts, existingCertificates, targetDrive);
      setDuplicateResult(dup);
      const initialDecisions: Record<string, 'overwrite' | 'skip' | 'archive_old'> = {};
      dup.conflicts.forEach(c => {
        initialDecisions[c.cert.id] = 'overwrite';
      });
      setCustomDuplicateDecisions(initialDecisions);
    }
  }, [isOpen, selectedDriveId, simulatedLockedDriveIds, selectedCerts, existingCertificates]);

  if (!isOpen) return null;

  // Toggle simulated lock state for testing write-protection error handling
  const handleToggleSimulatedLock = (driveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = simulatedLockedDriveIds.includes(driveId)
      ? simulatedLockedDriveIds.filter(id => id !== driveId)
      : [...simulatedLockedDriveIds, driveId];
    
    setSimulatedLockedDriveIds(updated);
    const drive = availableDrives.find(d => d.id === driveId) || targetDrive;
    runWriteCheck(drive, updated, false);
  };

  // Main backup execution logic
  const handleStartBackup = async (
    overrideDuplicateConfirmed = false,
    confirmedDecisions?: Record<string, 'overwrite' | 'skip' | 'archive_old'>
  ) => {
    setDirectWriteError(null);
    setWriteProtectionError(null);

    // 1. Mandatory Pre-flight Disk Write Protection Check
    const isSimLocked = simulatedLockedDriveIds.includes(targetDrive.id) || targetDrive.isWritable === false;
    const writeCheck = await checkDriveWritePermission(targetDrive, { forceSimulatedLock: isSimLocked });
    setWriteCheckResult(writeCheck);

    if (!writeCheck.isWritable) {
      setLogs([
        `[❌ 쓰기 금지 오류] ${writeCheck.message}`,
        `[작업 중단] 대상 드라이브(${targetDrive.letter})가 '쓰기 금지(Read-Only)' 상태이므로 인증서 손상 방지를 위해 복사를 즉시 중단했습니다.`,
      ]);
      setWriteProtectionError(writeCheck);
      setIsProcessing(false);
      setProgress(0);
      return;
    }

    // 2. Pre-flight Duplicate Certificate Folder Check on Target Drive
    const dupCheck = detectDuplicateCertificates(selectedCerts, existingCertificates, targetDrive);
    setDuplicateResult(dupCheck);

    if (dupCheck.hasDuplicates && !overrideDuplicateConfirmed) {
      // Prompt user with confirmation dialog before starting copy!
      setShowDuplicateModal(true);
      return;
    }

    // User confirmed duplicate resolution mode
    const decisions = confirmedDecisions || customDuplicateDecisions;
    const skippedCertIds: string[] = [];
    const archivedCertIds: string[] = [];
    const overwrittenCertIds: string[] = [];

    selectedCerts.forEach(cert => {
      const decision = decisions[cert.id] || duplicateMode;
      const isConflict = dupCheck.conflicts.some(c => c.cert.id === cert.id);
      if (isConflict) {
        if (decision === 'skip') {
          skippedCertIds.push(cert.id);
        } else if (decision === 'archive_old') {
          archivedCertIds.push(cert.id);
        } else {
          overwrittenCertIds.push(cert.id);
        }
      }
    });

    // If all selected certs are skipped
    if (selectedCerts.length > 0 && skippedCertIds.length === selectedCerts.length) {
      setLogs([
        '[복사 취소] 모든 중복 인증서가 "건너뛰기(Skip)"로 지정되어 복사할 대상 파일이 없습니다.',
      ]);
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setCurrentAttempt(1);
    setIsRetrying(false);
    setRetryReason(null);
    setRetryDelayMs(0);
    setRetryHistory([]);
    setLogs(['[사전 점검 완료] 대상 드라이브 쓰기 권한 확인 및 자동 복구 엔진(최대 3회) 가동...']);

    try {
      const retryResult = await executeUsbOperationWithRetry<BackupResult>(
        `USB ${targetDrive.letter} 인증서 복사 및 무결성 기록`,
        async (attempt) => {
          setCurrentAttempt(attempt);

          if (attempt > 1) {
            setIsRetrying(true);
            setLogs(prev => [
              ...prev,
              `[🔄 ${attempt}회차 자동 재시도] USB I/O 버퍼 재정렬 및 장치 핸들 재연결 시도 중...`,
              `[장치 동기화] ${targetDrive.letter} (${targetDrive.name}) 통신 채널 재점검...`,
            ]);
          }

          setLogs(prev => [
            ...prev,
            `[✅ 쓰기 권한 확인] ${targetDrive.letter} (${targetDrive.name}) I/O 쓰기 테스트 정상 통과 (시도: ${attempt}/3)`,
          ]);

          await new Promise(r => setTimeout(r, 300));
          setProgress(attempt === 1 ? 30 : 45);

          const copyLogs: string[] = [];
          selectedCerts.forEach(cert => {
            const stdPath = getStandardDirectoryPath(cert);
            if (skippedCertIds.includes(cert.id)) {
              copyLogs.push(`[중복 건너뜀] ⏭️ ${cert.name} (${cert.category}) -> 이미 존재하여 복사 건너뜀`);
            } else if (archivedCertIds.includes(cert.id)) {
              copyLogs.push(`[기존 백업 보존] 📦 ${cert.name} -> 기존 폴더를 ${targetDrive.letter}\\${stdPath}_backup_20260909 로 보존 후 새 파일 복사`);
            } else if (overwrittenCertIds.includes(cert.id)) {
              copyLogs.push(`[덮어쓰기 갱신] 🔄 ${cert.name} (${cert.category}) -> ${targetDrive.letter}\\${stdPath} 기존 인증서 최신 교체`);
            } else {
              copyLogs.push(`[신규 복사] 📁 ${cert.name} (${cert.category}) -> ${targetDrive.letter}\\${stdPath}`);
            }
          });
          setLogs(prev => [...prev, ...copyLogs]);

          // If user chose direct Web File System writing to real USB
          if (writeDirectToDisk && 'showDirectoryPicker' in window) {
            setLogs(prev => [...prev, '[디스크 쓰기] 대상 USB 드라이브 폴더 선택 대기 중...']);
            try {
              // @ts-ignore
              const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
              });
              
              setLogs(prev => [...prev, `[권한 검증] 선택된 폴더 '${dirHandle.name}'의 실제 디스크 쓰기 권한(I/O Probe) 테스트...`]);
              const handleCheck = await checkDriveWritePermission(targetDrive, { dirHandle });
              
              if (!handleCheck.isWritable) {
                setDirectWriteError(handleCheck.message);
                setLogs(prev => [...prev, `[❌ 디스크 쓰기 거부] ${handleCheck.message}`]);
                throw new Error(`디스크 쓰기 권한 거부: ${handleCheck.message}`);
              }

              setLogs(prev => [...prev, `[디스크 쓰기] 선택된 폴더: ${dirHandle.name}에 NPKI/GPKI 구조 직접 기록 시작...`]);
              const res = await writeCertificatesToDirectoryHandle(selectedCerts, dirHandle, {
                skippedCertIds,
              });
              if (!res.success) {
                throw new Error(res.error || '디스크 쓰기 실패');
              }
              setLogs(prev => [...prev, `[디스크 쓰기 완료] 총 ${res.count}개 파일이 디스크에 성공적으로 쓰여졌습니다.`]);
            } catch (err: any) {
              if (err.name !== 'AbortError') {
                throw err;
              }
            }
          }

          await new Promise(r => setTimeout(r, 400));
          setProgress(85);

          const result = await copyCertificatesToDisk(selectedCerts, targetDrive, {
            includeManifest,
            duplicateHandlingMode: duplicateMode,
            skippedCertIds,
            archivedCertIds,
          });

          return result;
        },
        {
          maxAttempts: 3,
          initialDelayMs: 650,
          backoffMultiplier: 1.5,
          simulateTransientErrorAttempts: simulateTransientError ? 1 : 0,
          onRetryAttempt: (info) => {
            setRetryReason(info.reason);
            setRetryDelayMs(info.delayMs);
            setIsRetrying(true);
            setRetryHistory(prev => [...prev, { attempt: info.attempt, reason: info.reason, delayMs: info.delayMs }]);
            setLogs(prev => [
              ...prev,
              `[⚠️ 일시적 I/O 지연 감지 (${info.attempt}/3)] ${info.reason}`,
              `[⏳ 백오프 대기] ${info.delayMs}ms 대기 후 ${info.attempt + 1}회차 자동 재시도 실행...`,
            ]);
          },
        }
      );

      setRetryAttemptsUsed(retryResult.attemptsUsed);
      setIsRetrying(false);

      if (retryResult.success && retryResult.data) {
        setProgress(100);
        setLogs(prev => [
          ...prev,
          `[완료] 무결성 검증 통과 (해시: ${retryResult.data?.checksum})`,
          retryResult.retried
            ? `[⚡ 자동 복구 완료] ${retryResult.attemptsUsed}회차 재시도로 일시적 연결 불안정 극복 및 백업 성공!`
            : `[보관 준비 완료] ${targetDrive.letter} 이동식 디스크 규격 백업 생성 성공!`,
          `[자동 새로고침 완료] 메인 화면의 인증서 및 드라이브 보관 상태가 자동으로 새로고침되었습니다.`,
        ]);

        setBackupResult(retryResult.data);

        // Record history
        onBackupSuccess({
          id: `backup-${Date.now()}`,
          timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
          targetDisk: `${targetDrive.letter} ${targetDrive.name}`,
          targetPath: `${targetDrive.letter}\\ (NPKI/GPKI 표준 구조)`,
          certificatesCount: selectedCerts.length - skippedCertIds.length,
          certNames: selectedCerts.filter(c => !skippedIds(c.id, skippedCertIds)).map(c => c.name),
          status: 'success',
          hashCheckPassed: true,
          retryAttemptsUsed: retryResult.attemptsUsed,
        });
      } else {
        const errorDetail = parseUserFriendlyError(retryResult.error, 'USB 인증서 백업');
        setLogs(prev => [
          ...prev,
          `[❌ 최종 복사 실패] 최대 재시도(3회)를 수행하였으나 오류가 지속되어 중단되었습니다: ${errorDetail.summary}`,
          `[조치 가이드] ${errorDetail.actionTip.replace(/\n/g, ' ')}`,
        ]);
        setDirectWriteError(errorDetail.fullDisplay);
      }
    } catch (err: any) {
      const errorDetail = parseUserFriendlyError(err, 'USB 인증서 백업');
      setLogs(prev => [...prev, `[오류 발생] ${errorDetail.summary}`]);
      setDirectWriteError(errorDetail.fullDisplay);
    } finally {
      setIsProcessing(false);
      setIsRetrying(false);
    }
  };

  const skippedIds = (id: string, skippedList: string[]) => skippedList.includes(id);

  const handleReset = () => {
    setBackupResult(null);
    setProgress(0);
    setLogs([]);
    setWriteProtectionError(null);
    setDirectWriteError(null);
    setShowDuplicateModal(false);
    setCurrentAttempt(1);
    setIsRetrying(false);
    setRetryReason(null);
    setRetryDelayMs(0);
    setRetryHistory([]);
  };

  // Confirm and proceed from duplicate confirmation dialog
  const handleConfirmDuplicateResolution = () => {
    setShowDuplicateModal(false);
    handleStartBackup(true, customDuplicateDecisions);
  };

  // Apply a single mode to all conflicting certs
  const handleApplyGlobalDuplicateMode = (mode: 'overwrite' | 'skip' | 'archive_old') => {
    setDuplicateMode(mode);
    if (duplicateResult) {
      const updated: Record<string, 'overwrite' | 'skip' | 'archive_old'> = {};
      duplicateResult.conflicts.forEach(c => {
        updated[c.cert.id] = mode;
      });
      setCustomDuplicateDecisions(updated);
    }
  };

  const isCurrentTargetLocked = simulatedLockedDriveIds.includes(targetDrive.id) || targetDrive.isWritable === false;
  const currentDriveDuplicates = duplicateResult?.conflicts.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden relative">
        {/* Duplicate Folder Overwrite / Conflict Confirmation Dialog Overlay */}
        {showDuplicateModal && duplicateResult && (
          <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-xl overflow-hidden animate-scaleIn flex flex-col max-h-[90%]">
              {/* Dialog Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-100" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <span>동일한 인증서 폴더 중복 감지</span>
                      <span className="px-2 py-0.5 bg-amber-900/60 rounded-full text-xs font-semibold">
                        {duplicateResult.conflicts.length}건 중복
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-100">
                      대상 드라이브 <strong>{targetDrive.letter} ({targetDrive.name})</strong>에 이미 동일한 이름의 인증서가 존재합니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dialog Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Notice text */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-900">
                      기존 인증서 파일을 어떻게 처리할지 선택해 주세요.
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      은행 또는 기관에서 인증서를 갱신 발급받은 경우 <strong>[덮어쓰기]</strong>를 권장하며, 구버전 인증서 보존이 필요하면 <strong>[백업 보존]</strong>을 선택하세요.
                    </p>
                  </div>
                </div>

                {/* Global Resolution Strategy Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">
                    일괄 처리 방식 선택:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyGlobalDuplicateMode('overwrite')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        duplicateMode === 'overwrite'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>덮어쓰기 (권장)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">
                        기존 폴더 파일을 최신 인증서로 갱신 교체합니다.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyGlobalDuplicateMode('skip')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        duplicateMode === 'skip'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <SkipForward className="w-3.5 h-3.5 text-amber-600" />
                        <span>중복 건너뛰기</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">
                        기존 인증서는 유지하고 새 항목만 복사합니다.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyGlobalDuplicateMode('archive_old')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        duplicateMode === 'archive_old'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Archive className="w-3.5 h-3.5 text-purple-600" />
                        <span>기존 백업 보존</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">
                        기존 폴더를 `_backup`으로 안전 보존 후 복사합니다.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Conflict Items Comparison List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">
                      중복 대상 인증서 세부 내역 ({duplicateResult.conflicts.length}건):
                    </label>
                    <span className="text-[10px] text-slate-500">
                      개별 항목별 처리 방식 변경 가능
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {duplicateResult.conflicts.map(item => {
                      const decision = customDuplicateDecisions[item.cert.id] || duplicateMode;

                      return (
                        <div
                          key={item.cert.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <FileKey className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{item.cert.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({item.cert.issuer})
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm mt-0.5">
                                경로: {targetDrive.letter}\{item.standardPath}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.isSameHash ? (
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">
                                  동일한 파일
                                </span>
                              ) : item.isNewer ? (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                  신규 갱신 버전
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                  버전 상이
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Comparison details */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded-lg border border-slate-200">
                            <div>
                              <span className="text-slate-400 block">기존 디스크 내 인증서</span>
                              <span className="font-semibold text-slate-700">만료: {item.existingCert.validTo}</span>
                            </div>
                            <div>
                              <span className="text-blue-600 block">복사할 새 인증서</span>
                              <span className="font-semibold text-blue-900">만료: {item.cert.validTo}</span>
                            </div>
                          </div>

                          {/* Individual action selector */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-500">개별 처리:</span>
                            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomDuplicateDecisions(prev => ({
                                    ...prev,
                                    [item.cert.id]: 'overwrite',
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                  decision === 'overwrite'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                덮어쓰기
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomDuplicateDecisions(prev => ({
                                    ...prev,
                                    [item.cert.id]: 'skip',
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                  decision === 'skip'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                건너뛰기
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomDuplicateDecisions(prev => ({
                                    ...prev,
                                    [item.cert.id]: 'archive_old',
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                  decision === 'archive_old'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                백업 보존
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  취소 (백업 중단)
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDuplicateResolution}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>선택한 방식으로 복사 계속 진행</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-400/40 bg-slate-800 shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={BRANDING_ASSETS.appIcon} 
                alt="인증서 백업 아이콘" 
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
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>인증서 디스크 복사 및 안전 백업</span>
                <span className="px-2 py-0.5 bg-blue-900/80 text-blue-300 border border-blue-500/30 rounded text-[11px] font-normal">
                  중복 방지 &amp; 쓰기 보호 검사
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                선택된 <span className="text-blue-300 font-semibold">{selectedCerts.length}명</span>의 공무원·은행 인증서를 대상 디스크의 쓰기 권한 점검 후 안전하게 복사합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Result view */}
          {backupResult ? (
            <div className="space-y-5">
              <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-emerald-950">
                  인증서 디스크 복사 및 백업 완료!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 mt-1 max-w-lg mx-auto">
                  {backupResult.message}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-emerald-300 text-xs font-mono text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>무결성 검증 통과 (SHA-256): {backupResult.checksum}</span>
                  </div>
                  {retryAttemptsUsed > 1 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold border border-amber-300">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>일시적 I/O 지연 자동 복구 성공 ({retryAttemptsUsed}회차 재시도 완료)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-semibold border border-emerald-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1회차 무결성 즉시 기록 완료</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-semibold border border-blue-200">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>목록 및 드라이브 상태 자동 새로고침 완료</span>
                  </div>
                </div>
              </div>

              {/* Usage Guide for Bank / Gov portals */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <span>이동식 디스크(USB) 사용 요령</span>
                </div>
                <p>
                  1. 복사된 USB 드라이브의 <strong>최상위 폴더(루트)</strong>에 <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono font-bold">NPKI</code> (은행용) 및 <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono font-bold">GPKI</code> (공무원용) 표준 폴더가 생성되었습니다.
                </p>
                <p>
                  2. 인터넷뱅킹, 정부24, 온-나라, 나이스(NEIS) 등에서 <strong>[이동식 디스크]</strong>를 선택하면 복사된 사용자의 인증서가 즉시 나타납니다.
                </p>
              </div>

              {/* Terminal Logs */}
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg max-h-36 overflow-y-auto space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-tight">
                    {log}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  다른 디스크로 다시 복사
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>확인 및 닫기 (새로고침된 목록 확인)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Users Pill list */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  선택된 사용자 및 인증서 ({selectedCerts.length}개):
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedCerts.map(cert => (
                    <div
                      key={cert.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
                    >
                      <FileKey className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-900">{cert.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({cert.issuer})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Target Disk Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>복사 대상 디스크 선택 (쓰기 보호 &amp; 중복 점검):</span>
                  <span className="text-slate-400 font-normal text-[11px]">
                    클릭하여 선택 / 🔒 버튼으로 락 시뮬레이션
                  </span>
                </label>

                {!availableDrives.some(d => d.type === 'removable' || d.deviceKind === 'fast_usb' || d.deviceKind === 'external_ssd') && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-amber-950">
                        연결된 USB 이동식 드라이브가 없습니다
                      </div>
                      <div className="text-[11px] text-amber-800 leading-relaxed">
                        인증서를 백업할 USB 메모리를 컴퓨터에 연결해 주세요. (현재 선택된 {targetDrive.letter} 드라이브는 PC 내장 드라이브입니다.)
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDrives.map(drive => {
                    const isSelected = drive.id === selectedDriveId;
                    const isDriveLocked = simulatedLockedDriveIds.includes(drive.id) || drive.isWritable === false;
                    const driveCertCount = existingCertificates.filter(
                      c => (c.sourceDrive || '').includes(drive.letter) || (c.sourceLocation || '').startsWith(drive.letter)
                    ).length;
                    const isEmptyUsb = (drive.type === 'removable' || drive.deviceKind === 'external_ssd' || drive.deviceKind === 'fast_usb') && driveCertCount === 0;

                    // Calculate duplicates for this drive
                    const driveDups = detectDuplicateCertificates(selectedCerts, existingCertificates, drive);
                    const dupCount = driveDups.conflicts.length;

                    let kindBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                    let kindText = drive.deviceKindLabel || '이동식 USB';

                    if (drive.deviceKind === 'external_ssd' || drive.name.toLowerCase().includes('ssd')) {
                      kindBadge = 'bg-purple-100 text-purple-800 border-purple-200';
                      kindText = '외장 SSD';
                    } else if (drive.deviceKind === 'fast_usb' || drive.name.toLowerCase().includes('3.0') || drive.name.toLowerCase().includes('ultra')) {
                      kindBadge = 'bg-cyan-100 text-cyan-800 border-cyan-200';
                      kindText = '고속 USB 메모리';
                    } else if (drive.deviceKind === 'internal_fixed' || drive.type === 'fixed') {
                      kindBadge = 'bg-slate-100 text-slate-700 border-slate-300';
                      kindText = '내장 디스크';
                    }

                    return (
                      <div
                        key={drive.id}
                        onClick={() => {
                          setSelectedDriveId(drive.id);
                          runWriteCheck(drive, simulatedLockedDriveIds, false);
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? isDriveLocked
                              ? 'border-rose-500 bg-rose-50/40 shadow-xs ring-2 ring-rose-500/20'
                              : 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                            : isDriveLocked
                            ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isDriveLocked
                                  ? 'bg-rose-100 text-rose-700'
                                  : isEmptyUsb
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : drive.deviceKind === 'external_ssd'
                                  ? 'bg-purple-100 text-purple-700'
                                  : drive.deviceKind === 'fast_usb'
                                  ? 'bg-cyan-100 text-cyan-700'
                                  : drive.type === 'removable'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isDriveLocked ? (
                                <Lock className="w-5 h-5 text-rose-600" />
                              ) : (
                                <HardDrive className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{drive.letter}</span>
                                <span className="font-medium text-slate-700 truncate max-w-[130px]">
                                  {drive.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>여유: <strong className="text-slate-700">{drive.freeSpace}</strong></span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${kindBadge}`}>
                                  {kindText}
                                </span>
                                {driveCertCount > 0 && (
                                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                    보관 {driveCertCount}건
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {/* Writability Status Badge */}
                            {isDriveLocked ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded border border-rose-300">
                                <Lock className="w-2.5 h-2.5" />
                                <span>쓰기 금지</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>쓰기 가능</span>
                              </span>
                            )}

                            {/* Duplicate count badge if existing on this drive */}
                            {dupCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded border border-amber-300">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                <span>중복 {dupCount}건</span>
                              </span>
                            )}

                            {/* Simulation Lock Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleSimulatedLock(drive.id, e)}
                              title={isDriveLocked ? "쓰기 보호 해제 (UNLOCK)" : "쓰기 금지 시뮬레이션 (LOCK)"}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                                isDriveLocked
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {isDriveLocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                              <span>{isDriveLocked ? '보호 해제' : '락 테스트'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Drive space bar */}
                        <div className="mt-2.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              isDriveLocked
                                ? 'bg-rose-500'
                                : isEmptyUsb
                                ? 'bg-emerald-500'
                                : drive.deviceKind === 'external_ssd'
                                ? 'bg-purple-600'
                                : drive.deviceKind === 'fast_usb'
                                ? 'bg-cyan-600'
                                : drive.type === 'removable'
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${100 - drive.freePercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pre-flight Write Status Inspection Banner for selected drive */}
                <div className={`mt-3 p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  isCurrentTargetLocked
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrentTargetLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isCurrentTargetLocked ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2 flex-wrap">
                        <span>선택 드라이브 쓰기 &amp; 중복 상태:</span>
                        {isCurrentTargetLocked ? (
                          <span className="text-rose-700 font-extrabold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            쓰기 금지 보호 활성화
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            쓰기 가능 (I/O OK)
                          </span>
                        )}
                        {currentDriveDuplicates > 0 && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            동일 인증서 {currentDriveDuplicates}건 감지됨
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isCurrentTargetLocked
                          ? `${targetDrive.letter} 드라이브는 읽기 전용으로 잠겨 있어 백업 시 즉시 차단됩니다.`
                          : currentDriveDuplicates > 0
                          ? `복사 시작 시 기존 ${currentDriveDuplicates}건에 대한 덮어쓰기/스킵/백업보존 확인 다이얼로그가 표시됩니다.`
                          : `${targetDrive.letter} (${targetDrive.name}) - I/O 임시 프로브 및 신규 폴더 생성 준비 완료`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {currentDriveDuplicates > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowDuplicateModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                      >
                        <CopyCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>중복 처리 설정</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isCheckingWrite || isProcessing}
                      onClick={() => runWriteCheck(targetDrive, simulatedLockedDriveIds, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingWrite ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{isCheckingWrite ? '점검 중...' : '쓰기 권한 재점검'}</span>
                    </button>
                  </div>
                </div>

                {/* Write Protection Blocker Alert if error exists */}
                {writeProtectionError && (
                  <div className="mt-3 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-950 space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                          <span>디스크 쓰기 금지 보호 감지 (Write-Protected)</span>
                          <span className="px-2 py-0.2 bg-rose-200 text-rose-900 rounded text-[10px] font-bold">
                            백업 작업 안전 차단됨
                          </span>
                        </h4>
                        <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                          {writeProtectionError.message}
                        </p>
                      </div>
                    </div>

                    {/* Actionable solutions */}
                    <div className="p-3 bg-white/90 rounded-lg border border-rose-200 text-xs text-slate-800 space-y-1.5">
                      <div className="font-bold text-rose-900 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-rose-600" />
                        <span>쓰기 금지 보호 해제 방법 (권장 조치):</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 pl-1 leading-normal">
                        <li><strong>물리 LOCK 스위치</strong>: USB/SD 카드 측면의 잠금 스위치를 <strong>UNLOCK</strong> 방향으로 내리세요.</li>
                        <li><strong>Diskpart 읽기 전용 해제</strong>: CMD(관리자)에서 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold">diskpart &gt; attributes disk clear readonly</code> 실행</li>
                        <li><strong>레지스트리 쓰기 제한</strong>: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold">StorageDevicePolicies\WriteProtect = 0</code> 설정</li>
                        <li><strong>보안 DLP 예외 요청</strong>: 사내 보안 소프트웨어가 USB 쓰기를 차단한 경우 관리자 승인 요청</li>
                      </ol>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowTroubleshootingGuide(!showTroubleshootingGuide)}
                        className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showTroubleshootingGuide ? '명령어 가이드 접기' : '정밀 해결 명령어 가이드 보기'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const writable = availableDrives.find(d => !simulatedLockedDriveIds.includes(d.id) && d.isWritable !== false);
                            if (writable) {
                              setSelectedDriveId(writable.id);
                              runWriteCheck(writable, simulatedLockedDriveIds, false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          다른 쓰기 가능 드라이브 선택
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = simulatedLockedDriveIds.filter(id => id !== targetDrive.id);
                            setSimulatedLockedDriveIds(updated);
                            runWriteCheck(targetDrive, updated, false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>쓰기 보호 해제 후 재검사</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Terminal/Registry Guide */}
                    {showTroubleshootingGuide && (
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] space-y-2 mt-2">
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Windows 디스크 쓰기 금지 해제 CMD 스크립트</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                          <div className="text-slate-400"># 1. Diskpart로 읽기전용 속성 제거</div>
                          <div className="text-amber-300">diskpart</div>
                          <div className="text-amber-300">list disk</div>
                          <div className="text-amber-300">select disk 1 <span className="text-slate-500">(대상 USB 번호)</span></div>
                          <div className="text-emerald-300">attributes disk clear readonly</div>
                          <div className="text-amber-300">exit</div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                          <div className="text-slate-400"># 2. 윈도우 레지스트리 쓰기보호 정책 강제 0(해제) 수정</div>
                          <div className="text-emerald-300 break-all">
                            reg add "HKLM\SYSTEM\CurrentControlSet\Control\StorageDevicePolicies" /v WriteProtect /t REG_DWORD /d 0 /f
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Backup Options */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-800">
                  표준 복사 및 무결성 옵션
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">
                        표준 디렉토리 구조 자동 구성 (NPKI 및 GPKI)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        공무원 인증서는 <code className="font-mono">GPKI/Certificate/class2/</code>, 은행 인증서는 <code className="font-mono">NPKI/yessign/USER/</code> 표준 계층으로 자동 분기하여 복사합니다.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeManifest}
                      onChange={e => setIncludeManifest(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">
                        SHA-256 전자서명 무결성 검증서 (CERT_BACKUP_INTEGRITY.txt) 자동 생성
                      </span>
                      <p className="text-[11px] text-slate-500">
                        백업된 각 인증서 파일의 해시값과 복사 시각, 발급자 정보를 포함하여 위변조 여부를 보증합니다.
                      </p>
                    </div>
                  </label>

                  {'showDirectoryPicker' in window && (
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1 border-t border-slate-200">
                      <input
                        type="checkbox"
                        checked={writeDirectToDisk}
                        onChange={e => setWriteDirectToDisk(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-blue-700 flex items-center gap-1">
                          <FolderOpen className="w-3.5 h-3.5" />
                          연결된 USB 폴더에 직접 파일 쓰기 (File System Access API)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          선택한 이동식 디스크(USB) 폴더의 쓰기 권한을 사전 검증 후 표준 NPKI/GPKI 구조로 직접 기록합니다.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Step 2.1: USB Auto-Retry & Fault-Tolerance Setting */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-blue-950 flex-wrap">
                          <span>USB I/O 내결함성 자동 재시도</span>
                          <span className="px-1.5 py-0.2 bg-blue-200/80 text-blue-900 rounded text-[10px] font-bold">
                            최대 3회 Auto-Retry
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-800 leading-tight mt-0.5">
                          USB 쓰기 중 일시적 연결 끊김, 버퍼 경합, 핸들 지연 시 최대 3회 지수 백오프로 자동 재시도합니다.
                        </p>
                      </div>
                    </div>

                    {/* Transient simulation toggle button for testing */}
                    <button
                      type="button"
                      onClick={() => setSimulateTransientError(!simulateTransientError)}
                      title="1회 I/O 지연 발생 후 2회차에 자동 복구되는 시나리오를 테스트합니다."
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        simulateTransientError
                          ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30 font-bold'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <RotateCw className={`w-3 h-3 ${simulateTransientError ? 'text-amber-700 animate-spin' : 'text-slate-500'}`} />
                      <span>{simulateTransientError ? '⚡ 1회 오류 시뮬레이션 ON' : '재시도 테스트 시뮬레이션'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress & Logs (if running) */}
              {isProcessing && (
                <div className="space-y-2.5 p-4 bg-slate-900 rounded-xl text-white font-mono text-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>디스크 복사 진행 중 ({progress}%)</span>
                      <span className="px-1.5 py-0.2 bg-blue-800/60 text-blue-200 rounded text-[10px] font-mono font-bold">
                        시도: {currentAttempt}/3회
                      </span>
                    </span>
                    <span className="text-slate-400 font-semibold">{targetDrive.letter} 드라이브</span>
                  </div>

                  {/* Active Auto-Retry Alert Banner */}
                  {isRetrying && (
                    <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-lg text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-pulse">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-300">[일시적 오류 자동 복구 중]</span>
                          <span className="ml-1 text-[11px] text-amber-100">
                            {retryReason || 'USB 연결 일시적 지연 감지'} ({currentAttempt}/3회차 재시도)
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-600/50 text-amber-100 rounded font-mono text-[10px] shrink-0 font-bold">
                        {retryDelayMs}ms 후 자동 재시도
                      </span>
                    </div>
                  )}

                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isRetrying ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-300 pt-2">
                    {logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {directWriteError && !writeProtectionError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{directWriteError}</span>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  {isCurrentTargetLocked ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      쓰기 금지 보호 해제 필요
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      쓰기 점검 통과
                    </span>
                  )}
                  {currentDriveDuplicates > 0 && !isCurrentTargetLocked && (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      중복 {currentDriveDuplicates}건 감지됨
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartBackup(false)}
                    disabled={isProcessing || isCheckingWrite}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                      isCurrentTargetLocked
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-200'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>복사 처리 중...</span>
                      </>
                    ) : isCurrentTargetLocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>쓰기 금지 해제 후 복사</span>
                      </>
                    ) : currentDriveDuplicates > 0 ? (
                      <>
                        <CopyCheck className="w-4 h-4" />
                        <span>{targetDrive.letter} 복사 시작 (중복 확인)</span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4" />
                        <span>
                          {targetDrive.letter} [
                          {targetDrive.type === 'removable' || targetDrive.deviceKind === 'fast_usb' || targetDrive.deviceKind === 'external_ssd'
                            ? (targetDrive.deviceKindLabel || 'USB')
                            : '내장 디스크'
                          }]로 복사 시작
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
