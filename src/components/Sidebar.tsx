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
  onOpenStartupWorkflow?: () => void;
  onOpenSettings?: () => void;
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
  onOpenStartupWorkflow,
  onOpenSettings,
}) => {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full border-r border-slate-800 shadow-xl z-20 shrink-0 overflow-hidden">
      {/* Brand Header - Compact */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/30 shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-white tracking-tight leading-none mb-1 truncate">K-인증서 매니저</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Security Shield</span>
          </div>
        </div>
      </div>

      {/* Navigation Items - Optimized for Single Screen */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {onOpenStartupWorkflow && (
          <button
            type="button"
            onClick={onOpenStartupWorkflow}
            className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer text-left border border-blue-400/30 mb-2"
          >
            <span className="mr-2 text-base">🚀</span>
            <span className="flex-1">시작 가이드</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-white/20 rounded">GO</span>
          </button>
        )}

        {/* Primary Action: Copy/Move */}
        <button
          type="button"
          onClick={() => setActiveTab('copy')}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-left ${
            activeTab === 'copy'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2.5 opacity-90 text-base">📂</span>
          <span className="flex-1">인증서 복사/이동</span>
          {selectedCount > 0 && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded-full font-bold">
              {selectedCount}
            </span>
          )}
        </button>

        {/* Group: Essential Tools */}
        <div className="pt-2 pb-1 px-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">핵심 도구</p>
          <div className="space-y-0.5">
            {onOpenUsbToPc && (
              <button
                type="button"
                onClick={onOpenUsbToPc}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors cursor-pointer text-left"
              >
                <span className="mr-2.5 opacity-90 text-sm">📥</span>
                <span className="flex-1">USB ➔ PC 가져오기</span>
              </button>
            )}
            
            {onOpenRenewalGuidance && (
              <button
                type="button"
                onClick={onOpenRenewalGuidance}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-blue-300 hover:bg-slate-800 hover:text-blue-200 transition-colors cursor-pointer text-left"
              >
                <span className="mr-2.5 opacity-90 text-sm">🌐</span>
                <span className="flex-1">인증서 갱신 안내</span>
              </button>
            )}
          </div>
        </div>

        {/* Group: Management & Logs */}
        <div className="pt-1 pb-1 px-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">관리 및 기록</p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                activeTab === 'history' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="mr-2.5 opacity-90 text-sm">🛡️</span>
              <span className="flex-1">백업 이력</span>
            </button>

            {onOpenTrash && (
              <button
                type="button"
                onClick={onOpenTrash}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors cursor-pointer text-left"
              >
                <span className="mr-2.5 opacity-90 text-sm">♻️</span>
                <span className="flex-1">휴지통</span>
                {trashCount > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">{trashCount}</span>}
              </button>
            )}

            {onOpenActivityLogs && (
              <button
                type="button"
                onClick={onOpenActivityLogs}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-blue-300 transition-colors cursor-pointer text-left"
              >
                <span className="mr-2.5 opacity-90 text-sm">📜</span>
                <span className="flex-1">작업 로그</span>
                {logCount > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-bold">{logCount}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Group: Advanced & Technical (Show more in Advanced Mode) */}
        <div className="pt-1 pb-1 px-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">고급 및 기술</p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('paths')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                activeTab === 'paths' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="mr-2.5 opacity-90 text-sm">⚙️</span>
              <span className="flex-1">탐색 경로 설정</span>
            </button>

            {appViewMode === 'advanced' && (
              <>
                {onOpenUsbDiagnostic && (
                  <button
                    type="button"
                    onClick={onOpenUsbDiagnostic}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-indigo-300 hover:bg-slate-800 hover:text-indigo-200 transition-colors cursor-pointer text-left"
                  >
                    <span className="mr-2.5 opacity-90 text-sm">🔍</span>
                    <span className="flex-1">USB VSN/WMI 진단</span>
                  </button>
                )}
                {onOpenDesktopApp && (
                  <button
                    type="button"
                    onClick={onOpenDesktopApp}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-sky-300 hover:bg-slate-800 hover:text-sky-200 transition-colors cursor-pointer text-left"
                  >
                    <span className="mr-2.5 opacity-90 text-sm">🖥️</span>
                    <span className="flex-1">데스크탑 앱 (WPF)</span>
                  </button>
                )}
                {onOpenCoreSpec && (
                  <button
                    type="button"
                    onClick={onOpenCoreSpec}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-blue-300 hover:bg-slate-800 hover:text-blue-200 transition-colors cursor-pointer text-left"
                  >
                    <span className="mr-2.5 opacity-90 text-sm">🛠️</span>
                    <span className="flex-1">코어 DLL 명세</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Group: Information */}
        <div className="pt-1 pb-1 px-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">정보</p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={onOpenSecurityGuide}
              className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer text-left"
            >
              <span className="mr-2.5 opacity-90 text-sm">🛡️</span>
              <span className="flex-1">보안 수칙</span>
            </button>
            {onOpenLicense && (
              <button
                type="button"
                onClick={onOpenLicense}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer text-left"
              >
                <span className="mr-2.5 opacity-90 text-sm">⚖️</span>
                <span className="flex-1">라이선스</span>
              </button>
            )}
            {onCheckUpdates && (
              <button
                type="button"
                onClick={onCheckUpdates}
                disabled={isCheckingUpdates}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors cursor-pointer text-left"
              >
                <span className="mr-2.5 opacity-90 text-sm">{isCheckingUpdates ? '🔄' : '✨'}</span>
                <span className="flex-1">{isCheckingUpdates ? '확인 중...' : '업데이트 확인'}</span>
                {hasUpdateBadge && <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              </button>
            )}
          </div>
        </div>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800/40 hover:bg-slate-800 hover:text-white transition-all cursor-pointer text-left border border-slate-700/50 mt-2"
          >
            <span className="mr-2.5 opacity-90 text-sm">⚙️</span>
            <span className="flex-1">환경 설정 (소리/테마)</span>
          </button>
        )}
      </nav>

      {/* Quick Status Block - Compact */}
      <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-900/40">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
            <span className="text-slate-500 block mb-0.5">USB 디스크</span>
            <span className="font-bold text-white">{removableDrives}개</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
            <span className="text-slate-500 block mb-0.5">발견 인증서</span>
            <span className="font-bold text-blue-400">{totalCerts}건</span>
          </div>
        </div>
      </div>

      {/* Developer & Release Info - Very Compact */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-300">{DEVELOPER_INFO.author}</span>
            <span className="text-[9px] text-slate-500">{DEVELOPER_INFO.affiliation}</span>
          </div>
          <a
            href={DEVELOPER_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-colors"
            title="GitHub"
          >
            <Globe className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-600">
          <span>© 2026 K-Cert Mgr</span>
          <span className="font-mono">v{APP_VERSION}</span>
        </div>
      </div>
    </aside>
  );
};
