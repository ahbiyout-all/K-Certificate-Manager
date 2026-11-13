import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Sparkles,
  X,
  ShieldCheck,
  CheckCircle2,
  Tag,
  RefreshCw,
  AlertCircle,
  Search,
  Loader2,
  PackageCheck
} from 'lucide-react';
import {
  UpdateInfo,
  SelfUpdateProgress,
  SelfUpdateResult,
  checkForAppUpdates,
  runInAppSelfUpdate
} from '../utils/updateChecker';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onRecheck?: () => Promise<void> | void;
  onUpdateInstalled?: (newVersion: string, sha256: string) => void;
  isChecking?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
  onRecheck,
  onUpdateInstalled,
  isChecking = false,
}) => {
  const [internalChecking, setInternalChecking] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<UpdateInfo | null>(updateInfo);
  const [customTestVer, setCustomTestVer] = useState('');
  const [showSimulateSection, setShowSimulateSection] = useState(false);

  const [isSelfUpdating, setIsSelfUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<SelfUpdateProgress | null>(null);
  const [selfUpdateResult, setSelfUpdateResult] = useState<SelfUpdateResult | null>(null);
  const [selfUpdateError, setSelfUpdateError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCurrentInfo(updateInfo);
  }, [updateInfo]);

  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsSelfUpdating(false);
      setUpdateProgress(null);
      setSelfUpdateResult(null);
      setSelfUpdateError(null);
    }
  }, [isOpen]);

  if (!isOpen || !currentInfo) return null;

  const isUpToDate = !currentInfo.hasUpdate;
  const loading = isChecking || internalChecking;

  const handleManualCheckNow = async () => {
    setInternalChecking(true);
    setSelfUpdateResult(null);
    setSelfUpdateError(null);
    setUpdateProgress(null);
    try {
      if (onRecheck) {
        await onRecheck();
      } else {
        const info = await checkForAppUpdates();
        setCurrentInfo(info);
      }
    } catch {
      // Handled internally
    } finally {
      setInternalChecking(false);
    }
  };

  const handleSimulateVersionCheck = async () => {
    if (!customTestVer.trim()) return;
    setInternalChecking(true);
    setSelfUpdateResult(null);
    setSelfUpdateError(null);
    setUpdateProgress(null);
    try {
      const info = await checkForAppUpdates(customTestVer.trim());
      setCurrentInfo(info);
    } finally {
      setInternalChecking(false);
    }
  };

  const handleStartSelfUpdate = async () => {
    if (!currentInfo || isSelfUpdating) return;
    setIsSelfUpdating(true);
    setSelfUpdateError(null);
    setSelfUpdateResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const res = await runInAppSelfUpdate(
      currentInfo,
      (p) => setUpdateProgress(p),
      controller.signal
    );

    abortControllerRef.current = null;
    setIsSelfUpdating(false);

    if (res.success) {
      setSelfUpdateResult(res);
      setCurrentInfo(prev =>
        prev
          ? {
              ...prev,
              hasUpdate: false,
              currentVersion: res.installedVersion,
              latestVersion: res.installedVersion,
            }
          : prev
      );
      onUpdateInstalled?.(res.installedVersion, res.sha256);
    } else {
      setSelfUpdateError(res.message);
    }
  };

  const handleCancelOrClose = () => {
    if (isSelfUpdating) {
      abortControllerRef.current?.abort();
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className={`px-6 py-5 text-white flex items-center justify-between ${
          isUpToDate
            ? 'bg-gradient-to-r from-emerald-700 to-teal-800'
            : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              {isUpToDate ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>
                  {selfUpdateResult
                    ? '자동 다운로드 및 설치 완료'
                    : isUpToDate
                      ? '최신 버전을 사용 중입니다'
                      : '새 업데이트가 있습니다'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                  원클릭 자동 설치
                </span>
              </h3>
              <p className="text-xs text-white/80">
                {isUpToDate
                  ? `현재 최신 버전(v${currentInfo.currentVersion})을 사용 중입니다.`
                  : `확인을 누르면 v${currentInfo.latestVersion}을 바로 다운로드해 자동 설치합니다.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelOrClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Version Comparison Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-around text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">내 현재 버전</span>
              <span className="text-sm font-bold text-slate-700 px-2.5 py-1 bg-white border border-slate-200 rounded-lg inline-block shadow-2xs font-mono">
                v{currentInfo.currentVersion}
              </span>
            </div>
            <div className="text-slate-300 text-lg font-bold">➔</div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">최신 배포 버전</span>
              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg inline-block shadow-2xs font-mono ${
                currentInfo.hasUpdate
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-500/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                v{currentInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Automatic Self-Install Package Banner */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-bold flex items-center gap-1.5 text-[11px]">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                자동 다운로드 · 셀프 설치
              </span>
              <span className="text-[10px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800 font-mono">
                {currentInfo.assetName || `kcert-manager-v${currentInfo.latestVersion}-setup.exe`}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              앱 안에서 바로 다운로드하고 파일 손상 검사(SHA-256) 후 자동 설치합니다.
            </p>
          </div>

          {/* Live Self-Update Progress Panel */}
          {(isSelfUpdating || updateProgress) && !selfUpdateResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>
                    {updateProgress?.stage === 'downloading' && '1/3 단계: 업데이트 파일 다운로드 중...'}
                    {updateProgress?.stage === 'verifying' && '2/3 단계: 파일 손상 검사 중 (SHA-256)...'}
                    {updateProgress?.stage === 'installing' && '3/3 단계: 자동 설치 적용 중...'}
                    {(!updateProgress || updateProgress.stage === 'completed') && '업데이트 처리 중...'}
                  </span>
                </span>
                <span className="font-mono text-blue-700">{updateProgress?.percentage ?? 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-200"
                  style={{ width: `${updateProgress?.percentage ?? 5}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-800 font-medium">
                {updateProgress?.message || '준비 중...'}
              </p>
            </div>
          )}

          {/* Self-Update Completed Banner */}
          {selfUpdateResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{selfUpdateResult.message}</span>
              </div>
              <div className="text-[11px] font-mono bg-white/80 px-2.5 py-1.5 rounded border border-emerald-200 text-emerald-800 break-all">
                SHA-256: {selfUpdateResult.sha256}
              </div>
              {selfUpdateResult.downloadedAssetLocally && (
                <p className="text-[11px] text-emerald-800">
                  📦 설치 실행 파일(<strong>{selfUpdateResult.assetName}</strong>)도 다운로드 폴더에 함께 저장되었습니다.
                </p>
              )}
            </div>
          )}

          {/* Inline Error Banner */}
          {selfUpdateError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{selfUpdateError}</span>
            </div>
          )}

          {/* Interactive Manual Update Check Toolbar */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="text-left w-full sm:w-auto">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-600" />
                <span>최신 배포 버전 실시간 검사</span>
              </span>
              <p className="text-[11px] text-sky-800 mt-0.5">
                {loading
                  ? '최신 배포 정보를 실시간 조회하는 중입니다...'
                  : currentInfo.checkedAt
                    ? `마지막 확인: ${currentInfo.checkedAt} (정상 응답)`
                    : '버튼을 눌러 최신 버전 여부를 다시 검사할 수 있습니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualCheckNow}
              disabled={loading || isSelfUpdating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '검사 중...' : '지금 수동 확인'}</span>
            </button>
          </div>

          {/* Source Badge & Checked Timestamp */}
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              감지 출처: <strong className="text-slate-700">
                {currentInfo.detectionSource === 'release_latest' && '공식 릴리스 채널 (/releases/latest)'}
                {currentInfo.detectionSource === 'releases_list' && '릴리스 목록 채널 (/releases)'}
                {currentInfo.detectionSource === 'git_tags' && '버전 태그 채널 (/tags)'}
                {currentInfo.detectionSource === 'offline' && '오프라인 (캐시/기본값)'}
                {!currentInfo.detectionSource && '배포 API'}
              </strong>
            </span>
            {currentInfo.checkedAt && (
              <span className="text-slate-400">확인: {currentInfo.checkedAt}</span>
            )}
          </div>

          {/* Release Highlights / Notes */}
          {currentInfo.hasUpdate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  주요 업데이트 내용 ({currentInfo.releaseName})
                </span>
                {currentInfo.publishedAt && (
                  <span className="text-[11px] text-slate-400">
                    배포일: {currentInfo.publishedAt}
                  </span>
                )}
              </div>
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs max-h-40 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                {currentInfo.releaseNotes}
              </div>
            </div>
          )}

          {isUpToDate && !selfUpdateResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                최신 버전과 보안 패치가 모두 적용되어 있습니다.
              </p>
              <p className="text-emerald-700 pl-5.5">
                새 버전이 나오면 [확인] 버튼 한 번으로 자동 설치됩니다.
              </p>
            </div>
          )}

          {/* Version Testing / Simulation Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowSimulateSection(!showSimulateSection)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>⚙️ 개발자 테스트: 기준 버전 가상 변경 {showSimulateSection ? '▲' : '▼'}</span>
            </button>

            {showSimulateSection && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <p className="text-slate-600 text-[11px]">
                  이전 버전(예: <code>1.4.2</code>)을 입력하여 자동 다운로드 및 셀프 설치 동작을 테스트해볼 수 있습니다.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="예: 1.4.2"
                    value={customTestVer}
                    onChange={(e) => setCustomTestVer(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSimulateVersionCheck}
                    disabled={!customTestVer.trim() || loading || isSelfUpdating}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    가상 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTestVer('');
                      handleManualCheckNow();
                    }}
                    disabled={isSelfUpdating}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[11px] text-slate-500 font-medium">
            브라우저/GitHub 이동 없는 인앱 셀프 업데이트
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCancelOrClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              {isSelfUpdating ? '중단' : selfUpdateResult ? '완료' : '닫기'}
            </button>

            {currentInfo.hasUpdate ? (
              <button
                type="button"
                onClick={handleStartSelfUpdate}
                disabled={isSelfUpdating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isSelfUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>다운로드 및 설치 중...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>확인 (자동 다운로드 · 설치)</span>
                  </>
                )}
              </button>
            ) : !selfUpdateResult && (
              <button
                type="button"
                onClick={handleManualCheckNow}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? '확인 중...' : '다시 확인'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

