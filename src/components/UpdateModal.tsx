import React from 'react';
import { Download, Sparkles, ExternalLink, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UpdateInfo } from '../utils/updateChecker';

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !updateInfo) return null;

  const isUpToDate = !updateInfo.hasUpdate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn">
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
              <h3 className="text-base sm:text-lg font-bold">
                {isUpToDate ? '최신 버전을 사용 중입니다' : '새로운 업데이트가 있습니다!'}
              </h3>
              <p className="text-xs text-white/80">
                {isUpToDate
                  ? `현재 버전 v${updateInfo.currentVersion}이(가) 가장 최신입니다.`
                  : `K-인증서 매니저 v${updateInfo.latestVersion} 출시`}
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
        <div className="p-6 space-y-4">
          {/* Version Comparison Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-around text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">내 현재 버전</span>
              <span className="text-sm font-bold text-slate-700 px-2.5 py-1 bg-white border border-slate-200 rounded-lg inline-block shadow-2xs">
                v{updateInfo.currentVersion}
              </span>
            </div>
            <div className="text-slate-300 text-lg font-bold">➔</div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">최신 공식 배포판</span>
              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg inline-block shadow-2xs ${
                updateInfo.hasUpdate
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-500/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                v{updateInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Release Highlights / Notes */}
          {updateInfo.hasUpdate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  주요 업데이트 내용 ({updateInfo.releaseName})
                </span>
                {updateInfo.publishedAt && (
                  <span className="text-[11px] text-slate-400">
                    배포일: {updateInfo.publishedAt}
                  </span>
                )}
              </div>
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                {updateInfo.releaseNotes}
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
                새로운 보안 업데이트나 릴리스가 등록되면 자동으로 안내 팝업이 제공됩니다.
              </p>
            </div>
          )}

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-normal">
            💡 <strong>자동 업데이트 팁</strong>: GitHub Actions를 통해 Windows 데스크톱 포터블 실행 파일 및 웹 에디션 최신 빌드가 자동으로 패키징되어 릴리스에 제공됩니다.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            {isUpToDate ? '확인' : '나중에 하기'}
          </button>

          {updateInfo.hasUpdate ? (
            <a
              href={updateInfo.downloadUrl || updateInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>새 버전 다운로드 (GitHub)</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
            </a>
          ) : (
            <a
              href={updateInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <span>GitHub 릴리스 목록 보기</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
