import React from 'react';
import { 
  ShieldCheck, 
  Copy, 
  FolderSearch, 
  History, 
  Sliders, 
  Lock, 
  HardDrive,
  FileKey,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Scale,
  Palette
} from 'lucide-react';
import { APP_VERSION, DEVELOPER_INFO } from '../version';
import { AppTheme } from '../types';
import { THEME_OPTIONS } from '../data/themes';
import { BRANDING_ASSETS } from '../data/brandingAssets';

interface SidebarProps {
  activeTab: 'copy' | 'history' | 'paths' | 'security';
  setActiveTab: (tab: 'copy' | 'history' | 'paths' | 'security') => void;
  totalCerts: number;
  removableDrives: number;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  onOpenSecurityGuide: () => void;
  onOpenBackupModal: () => void;
  onOpenUsbToPc?: () => void;
  onOpenDesktopApp?: () => void;
  onOpenUsbDiagnostic?: () => void;
  onOpenCleanup?: (mode: 'EXPIRED' | 'OTHER_USERS') => void;
  onOpenTrash?: () => void;
  onOpenRenewalGuidance?: () => void;
  onOpenActivityLogs?: () => void;
  onOpenLicense?: () => void;
  onOpenCoreSpec?: () => void;
  onCheckUpdates?: () => void;
  isCheckingUpdates?: boolean;
  hasUpdateBadge?: boolean;
  logCount?: number;
  trashCount?: number;
  expiredCount?: number;
  nonStandardCount?: number;
  selectedCount: number;
  onSelectCategoryFilter?: (filter: string) => void;
  appViewMode?: 'simple' | 'advanced';
  onToggleAppViewMode?: (mode: 'simple' | 'advanced') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  totalCerts,
  removableDrives,
  theme = 'pastel-white',
  onThemeChange,
  onOpenSecurityGuide,
  onOpenBackupModal,
  onOpenUsbToPc,
  onOpenDesktopApp,
  onOpenUsbDiagnostic,
  onOpenCleanup,
  onOpenTrash,
  onOpenRenewalGuidance,
  onOpenActivityLogs,
  onOpenLicense,
  onOpenCoreSpec,
  onCheckUpdates,
  isCheckingUpdates = false,
  hasUpdateBadge = false,
  logCount = 0,
  trashCount = 0,
  expiredCount = 0,
  nonStandardCount = 0,
  selectedCount,
  onSelectCategoryFilter,
  appViewMode = 'simple',
  onToggleAppViewMode,
}) => {
  return (
    <aside className="w-64 bg-[#1e293b] text-white flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand & Logo Header */}
      <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-blue-400/30 bg-slate-800 flex items-center justify-center">
            <img 
              src={BRANDING_ASSETS.appIcon} 
              alt="K-인증서 매니저 아이콘" 
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
            <span className="text-base font-bold tracking-tight text-white block leading-tight">
              K-인증서 매니저
            </span>
            <span className="text-[10px] text-blue-400 font-medium tracking-wide">
              K-Cert Manager v{APP_VERSION}
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle: [간편 모드] vs [상세 모드] */}
      {onToggleAppViewMode && (
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span>화면 표시 모드</span>
            <span className="text-[10px] text-blue-400 font-bold">
              {appViewMode === 'simple' ? '✨ 간편 모드 (기본)' : '⚙️ 상세 모드'}
            </span>
          </div>
          <div className="grid grid-cols-2 p-0.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onToggleAppViewMode('simple')}
              className={`py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                appViewMode === 'simple'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="초보자를 위한 간결한 모드"
            >
              <span>간편</span>
              <span className="text-[9px] px-1 bg-white/20 rounded font-normal">기본</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleAppViewMode('advanced')}
              className={`py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                appViewMode === 'advanced'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="하드웨어 VSN/경로/WMI 상세 표시"
            >
              <span>상세</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('copy')}
          className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
            activeTab === 'copy'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-3 opacity-90 text-base">📂</span>
          <span className="flex-1">인증서 복사/이동</span>
          {selectedCount > 0 && (
            <span className="ml-auto text-[11px] px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-full font-bold">
              {selectedCount}
            </span>
          )}
        </button>

        {onSelectCategoryFilter && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('copy');
              onSelectCategoryFilter('NON_STANDARD');
            }}
            className="w-full flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer text-left group"
            title="일반 인증서 프로그램(은행/정부)이 인식하지 못하는 비표준 위치에 저장된 인증서를 모아봅니다."
          >
            <span className="mr-2 text-sm">⚠️</span>
            <span className="flex-1 truncate">비표준 위치 인증서</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/30 text-amber-200 rounded font-bold">
              {nonStandardCount}건
            </span>
          </button>
        )}

        {onOpenUsbToPc && (
          <button
            type="button"
            onClick={onOpenUsbToPc}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
          >
            <span className="mr-3 opacity-90 text-base">📥</span>
            <span className="flex-1">USB ➔ PC 넣기</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded font-semibold">
              반대경로
            </span>
          </button>
        )}

        {/* 'USB ➔ PC 넣기' 하단: 데스크탑 앱 바로가기 */}
        {onOpenDesktopApp && (
          <button
            type="button"
            onClick={onOpenDesktopApp}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left text-sky-300 hover:bg-slate-800 hover:text-sky-200 group"
          >
            <span className="mr-3 opacity-90 text-base">🖥️</span>
            <span className="flex-1">데스크탑 앱</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded font-semibold">
              WPF Native
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
          }}
          className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="mr-3 opacity-90 text-base">🛡️</span>
          <span>일괄 백업 이력</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paths')}
          className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
            activeTab === 'paths'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="mr-3 opacity-90 text-base">⚙️</span>
          <span>탐색 경로 설정</span>
        </button>

        {onOpenUsbDiagnostic && (
          <button
            type="button"
            onClick={onOpenUsbDiagnostic}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-indigo-300 hover:bg-slate-800 hover:text-indigo-200 transition-colors cursor-pointer text-left group"
          >
            <span className="mr-3 opacity-90 text-base">🔍</span>
            <span className="flex-1">USB 식별자·WMI 진단</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded font-semibold">
              VSN/WMI
            </span>
          </button>
        )}

        {onOpenCleanup && (
          <button
            type="button"
            onClick={() => onOpenCleanup('EXPIRED')}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-300 transition-colors cursor-pointer text-left group"
          >
            <span className="mr-3 opacity-90 text-base">🗑️</span>
            <span className="flex-1">인증서 정리·삭제</span>
            {expiredCount > 0 ? (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-rose-500/30 text-rose-300 rounded-full font-bold">
                만료 {expiredCount}
              </span>
            ) : (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-slate-700/60 text-slate-400 rounded">
                정리
              </span>
            )}
          </button>
        )}

        {onOpenRenewalGuidance && (
          <button
            type="button"
            onClick={onOpenRenewalGuidance}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-bold bg-blue-600/30 text-blue-200 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-all cursor-pointer text-left shadow-2xs group"
          >
            <span className="mr-3 opacity-90 text-base">🌐</span>
            <span className="flex-1">인증서 갱신 안내</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded font-semibold border border-blue-400/30">
              갱신 포털
            </span>
          </button>
        )}

        {onOpenTrash && (
          <button
            type="button"
            onClick={onOpenTrash}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors cursor-pointer text-left group"
          >
            <span className="mr-3 opacity-90 text-base">♻️</span>
            <span className="flex-1">인증서 휴지통</span>
            {trashCount > 0 ? (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
                {trashCount}건
              </span>
            ) : (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-slate-700/60 text-slate-400 rounded">
                비어있음
              </span>
            )}
          </button>
        )}

        {onOpenActivityLogs && (
          <button
            type="button"
            onClick={onOpenActivityLogs}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-blue-300 transition-colors cursor-pointer text-left group"
          >
            <span className="mr-3 opacity-90 text-base">📜</span>
            <span className="flex-1">앱 작업 로그</span>
            {logCount > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-bold">
                {logCount}건
              </span>
            )}
          </button>
        )}

        {onOpenCoreSpec && (
          <button
            type="button"
            onClick={onOpenCoreSpec}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left text-blue-300 hover:bg-slate-800 hover:text-blue-200 group"
          >
            <span className="mr-3 opacity-90 text-base">⚙️</span>
            <span className="flex-1">KCert.Core 기술 명세</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded font-semibold">
              순수 창작
            </span>
          </button>
        )}

        {onCheckUpdates && (
          <button
            type="button"
            onClick={onCheckUpdates}
            disabled={isCheckingUpdates}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors cursor-pointer text-left group"
          >
            <span className="mr-3 opacity-90 text-base">
              {isCheckingUpdates ? '🔄' : '✨'}
            </span>
            <span className="flex-1">
              {isCheckingUpdates ? '업데이트 확인 중...' : '수동 업데이트 확인'}
            </span>
            {hasUpdateBadge ? (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold animate-pulse">
                새 버전!
              </span>
            ) : (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-slate-700/60 text-slate-400 rounded font-mono">
                v{APP_VERSION}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSecurityGuide}
          className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer text-left"
        >
          <span className="mr-3 opacity-90 text-base">📋</span>
          <span>보안 수칙 가이드</span>
        </button>
      </nav>

      {/* Quick Status Block in Sidebar */}
      <div className="px-4 py-3 space-y-2">
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>연결된 USB 디스크</span>
            <span className="font-semibold text-white">{removableDrives}개 드라이브</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>발견된 인증서</span>
            <span className="font-semibold text-blue-400">{totalCerts}건 등록됨</span>
          </div>
          <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>HardwareGuard</span>
            </span>
            <span className="text-emerald-300 font-medium">핫플러그 감시 중</span>
          </div>
        </div>
      </div>

      {/* Security Status Box & Developer Info at Bottom */}
      <div className="p-4 border-t border-slate-700/80 space-y-3">
        <div className="bg-slate-800/90 p-3 rounded-lg border border-slate-700/60">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 tracking-wider">
            보안 상태
          </p>
          <div className="flex items-center text-xs text-green-400 font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 shrink-0 animate-pulse"></span>
            <span>실시간 로컬 메모리 격리</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            외부 서버 전송 차단 · 안전한 로컬 백업
          </p>
        </div>

        {/* Interface Theme Selector Widget */}
        {onThemeChange && (
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>테마 설정 (4종)</span>
              </span>
              <span className="text-[10px] text-blue-300 font-bold bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-700/50">
                {THEME_OPTIONS.find(
                  t =>
                    t.id === theme ||
                    (theme === 'pastel-black' && t.id === 'dark') ||
                    (theme === 'pastel-gray' && t.id === 'gray') ||
                    (theme === 'pastel-white' && t.id === 'white') ||
                    (theme === 'pastel-beige' && t.id === 'beige')
                )?.name || '화이트'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected =
                  theme === opt.id ||
                  (theme === 'pastel-black' && opt.id === 'dark') ||
                  (theme === 'pastel-gray' && opt.id === 'gray') ||
                  (theme === 'pastel-white' && opt.id === 'white') ||
                  (theme === 'pastel-beige' && opt.id === 'beige');

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onThemeChange(opt.id)}
                    className={`p-2 rounded-lg flex items-center gap-2 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-400 bg-blue-950/80 text-white ring-1 ring-blue-400/50 font-bold shadow-xs'
                        : 'border-slate-700/70 bg-slate-900/40 hover:bg-slate-700/50 hover:border-slate-600 text-slate-300'
                    }`}
                    title={`${opt.name}: ${opt.description}`}
                  >
                    <div 
                      className="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                      style={{ backgroundColor: opt.swatchPrimary, borderColor: opt.swatchBorder }}
                    />
                    <span className="text-xs font-semibold leading-none truncate">
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Developer & Release Info */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">개발 및 정보</span>
            <span className="font-mono text-[10px] text-blue-400 font-semibold">v{APP_VERSION}</span>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">개발자</span>
              <span className="text-white font-semibold">{DEVELOPER_INFO.author}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">소속</span>
              <a
                href={DEVELOPER_INFO.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-100 hover:text-blue-300 flex items-center gap-0.5 hover:underline font-medium truncate max-w-[130px]"
                title="CISNet 공식 홈페이지 방문"
              >
                <span>CISNet (씨아이에스넷)</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">공식 블로그</span>
              <a
                href={DEVELOPER_INFO.blog}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300 hover:text-emerald-200 flex items-center gap-0.5 hover:underline font-medium"
                title="AhBi Vibe Blog 방문"
              >
                <span>블로그 방문</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">GitHub 저장소</span>
              <a
                href={DEVELOPER_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 flex items-center gap-0.5 hover:underline font-medium"
                title="GitHub 소스코드 및 Releases 확인"
              >
                <span>GitHub 저장소</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {onOpenLicense && (
              <div className="pt-1.5 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={onOpenLicense}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[11px] font-medium transition-colors cursor-pointer border border-slate-600/50"
                  title="소프트웨어 라이선스 및 오픈소스 고지 확인"
                >
                  <Scale className="w-3 h-3 text-blue-400" />
                  <span>라이선스 및 법적 고지</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
