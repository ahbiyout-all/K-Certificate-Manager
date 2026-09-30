import React, { useState } from 'react';
import { Download, Sparkles, ExternalLink, X, ShieldCheck, CheckCircle2, Tag, RefreshCw, AlertCircle, ArrowUpRight, Search } from 'lucide-react';
import { UpdateInfo, checkForAppUpdates } from '../utils/updateChecker';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onRecheck?: () => Promise<void> | void;
  isChecking?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
  onRecheck,
  isChecking = false,
}) => {
  const [internalChecking, setInternalChecking] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<UpdateInfo | null>(updateInfo);
  const [customTestVer, setCustomTestVer] = useState('');
  const [showSimulateSection, setShowSimulateSection] = useState(false);

  // Sync state when props change
  React.useEffect(() => {
    setCurrentInfo(updateInfo);
  }, [updateInfo]);

  if (!isOpen || !currentInfo) return null;

  const isUpToDate = !currentInfo.hasUpdate;
  const loading = isChecking || internalChecking;

  const handleManualCheckNow = async () => {
    setInternalChecking(true);
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
    try {
      const info = await checkForAppUpdates(customTestVer.trim());
      setCurrentInfo(info);
    } finally {
      setInternalChecking(false);
    }
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
                <span>{isUpToDate ? '최신 버전을 사용 중입니다' : '새로운 업데이트가 있습니다!'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                  수동 확인 지원
                </span>
              </h3>
              <p className="text-xs text-white/80">
                {isUpToDate
                  ? `현재 설치된 버전 v${currentInfo.currentVersion}이(가) 가장 최신입니다.`
                  : `K-인증서 매니저 v${currentInfo.latestVersion} 감지됨`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">GitHub 최신 배포판</span>
              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg inline-block shadow-2xs font-mono ${
                currentInfo.hasUpdate
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-500/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                v{currentInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Interactive Manual Update Check Toolbar */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="text-left w-full sm:w-auto">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-600" />
                <span>GitHub 원격 저장소 수동 확인</span>
              </span>
              <p className="text-[11px] text-sky-800 mt-0.5">
                {loading
                  ? 'GitHub Releases 및 Tags API를 실시간 조회하는 중입니다...'
                  : currentInfo.checkedAt
                    ? `마지막 확인: ${currentInfo.checkedAt} (정상 응답)`
                    : '언제든 버튼을 눌러 GitHub 최신 버전을 다시 검사할 수 있습니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualCheckNow}
              disabled={loading}
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
                {currentInfo.detectionSource === 'release_latest' && 'GitHub 공식 릴리스 (/releases/latest)'}
                {currentInfo.detectionSource === 'releases_list' && 'GitHub 릴리스 목록 (/releases)'}
                {currentInfo.detectionSource === 'git_tags' && 'Git 태그 직결 (/tags)'}
                {currentInfo.detectionSource === 'offline' && '오프라인 (캐시/기본값)'}
                {!currentInfo.detectionSource && 'GitHub API'}
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
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs max-h-44 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                {currentInfo.releaseNotes}
              </div>
            </div>
          )}

          {isUpToDate && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                모든 보안 패치와 최신 규격이 완벽하게 적용되어 있습니다.
              </p>
              <p className="text-emerald-700 pl-5.5">
                GitHub 저장소에 새로운 릴리스 또는 태그가 배포되면 상단 메뉴 및 자동 감지기를 통해 즉시 알려드립니다.
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
                  이전 버전(예: <code>1.4.2</code>)을 입력하여 새 버전 알림 및 팝업 동작을 테스트해볼 수 있습니다.
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
                    disabled={!customTestVer.trim() || loading}
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
                    className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-normal flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>안내</strong>: <code>push_to_github.bat</code>로 소스코드와 태그(v1.4.3)를 올린 후, GitHub의 <strong>Releases &gt; Draft a new release</strong>에서 'Publish release'를 완료하시면 정식 릴리스로 즉시 인식됩니다.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/ahbiyout-all/K-Certificate-Manager/tags"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span>GitHub 태그</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">·</span>
            <a
              href={currentInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span>릴리스 목록</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              닫기
            </button>

            {currentInfo.hasUpdate ? (
              <a
                href={currentInfo.downloadUrl || currentInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>새 버전 다운로드 (GitHub)</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
              </a>
            ) : (
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
