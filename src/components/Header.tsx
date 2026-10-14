import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, HardDrive, RefreshCw, FileKey, Menu, Trash2, Tag, ArrowDownLeft, FileText, Scale, Cpu, Usb, Activity, Palette, Check, Monitor, Globe, Sparkles } from 'lucide-react';
import { AppTheme } from '../types';
import { THEME_OPTIONS } from '../data/themes';
import { BRANDING_ASSETS } from '../data/brandingAssets';
import { APP_VERSION } from '../version';

interface HeaderProps {
  totalCount: number;
  validCount: number;
  removableCount: number;
  isScanning: boolean;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  onRefresh: () => void;
  onOpenSecurityGuide: () => void;
  onOpenUsbToPc?: () => void;
  onOpenDesktopApp?: () => void;
  onOpenUsbDiagnostic?: () => void;
  onOpenTrash?: () => void;
  onOpenActivityLogs?: () => void;
  onOpenLicense?: () => void;
  onOpenCoreSpec?: () => void;
  onOpenRenewalGuidance?: () => void;
  onCheckUpdates?: () => void;
  isCheckingUpdates?: boolean;
  hasUpdateBadge?: boolean;
  logCount?: number;
  trashCount?: number;
  lastScanTime?: string;
  onToggleMobileMenu?: () => void;
  appViewMode?: 'simple' | 'advanced';
  onToggleAppViewMode?: (mode: 'simple' | 'advanced') => void;
  onOpenStartupWorkflow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  validCount,
  removableCount,
  isScanning,
  theme = 'pastel-white',
  onThemeChange,
  onRefresh,
  onOpenSecurityGuide,
  onOpenUsbToPc,
  onOpenDesktopApp,
  onOpenUsbDiagnostic,
  onOpenTrash,
  onOpenActivityLogs,
  onOpenLicense,
  onOpenCoreSpec,
  onOpenRenewalGuidance,
  onCheckUpdates,
  isCheckingUpdates = false,
  hasUpdateBadge = false,
  logCount = 0,
  trashCount = 0,
  lastScanTime = '오늘 14:02',
  onToggleMobileMenu,
  appViewMode = 'simple',
  onToggleAppViewMode,
  onOpenStartupWorkflow,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  const currentThemeOption = THEME_OPTIONS.find(t => t.id === theme) || THEME_OPTIONS[0];

  return (
    <header id="app-header" className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors">
      {/* Left: Title & Tag */}
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shadow-2xs border border-slate-200/90 bg-slate-50 flex items-center justify-center shrink-0">
            <img 
              src={BRANDING_ASSETS.appIcon} 
              alt="K-인증서 매니저 로고" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to raw path if relative path fails
                const target = e.currentTarget;
                if (target.src !== BRANDING_ASSETS.rawAppIcon) {
                  target.src = BRANDING_ASSETS.rawAppIcon;
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              인증서 일괄 관리 및 복사
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Last scan & Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <span className="text-xs sm:text-sm text-slate-500 hidden xl:inline">
          마지막 스캔: <span className="font-medium text-slate-700">{lastScanTime}</span>
        </span>

        {/* Theme Dropdown Select (다크 / 회색 / 화이트 / 베이지) */}
        {onThemeChange && (
          <div className="flex items-center bg-slate-100/90 px-2 py-1 rounded-lg border border-slate-200/90 gap-1.5 shadow-2xs hover:bg-slate-100 transition-colors">
            <Palette className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">테마:</span>
            <select
              value={
                theme === 'pastel-black' ? 'dark' :
                theme === 'pastel-gray' ? 'gray' :
                theme === 'pastel-white' ? 'white' :
                theme === 'pastel-beige' ? 'beige' :
                theme
              }
              onChange={(e) => onThemeChange(e.target.value as AppTheme)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              aria-label="화면 테마 스타일 선택"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-white text-slate-900 font-medium">
                  {opt.name} 테마
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mode Toggle: [간편 모드] vs [상세 모드] */}
        {onToggleAppViewMode && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => onToggleAppViewMode('simple')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                appViewMode === 'simple'
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="초보자용 간편 모드: 핵심 복사 기능과 목록에 집중합니다."
            >
              간편 모드
            </button>
            <button
              type="button"
              onClick={() => onToggleAppViewMode('advanced')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                appViewMode === 'advanced'
                  ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="전문가용 상세 모드: 드라이브 상세 정보 및 고급 설정을 모두 표시합니다."
            >
              상세 모드
            </button>
          </div>
        )}

        {/* Startup Workflow Guide Button */}
        {onOpenStartupWorkflow && (
          <button
            type="button"
            onClick={onOpenStartupWorkflow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer border border-blue-500/30"
            title="작업 선택 및 단계별 가이드 모션 시작하기"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
            <span className="hidden sm:inline">시작 가이드</span>
            <span className="sm:hidden">가이드</span>
          </button>
        )}
        {appViewMode === 'advanced' && (
          <>
            {onOpenUsbDiagnostic && (
              <button
                type="button"
                onClick={onOpenUsbDiagnostic}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
                title="USB 장치 식별자(Volume Serial Number) 및 Windows WMI 호출 진단"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">USB 진단 &amp; WMI</span>
                <span className="sm:hidden">진단</span>
              </button>
            )}

            {onOpenDesktopApp && (
              <button
                type="button"
                onClick={onOpenDesktopApp}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
                title="Windows C# WPF 네이티브 데스크톱 애플리케이션 (.NET 8)"
              >
                <Monitor className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden xl:inline">데스크탑 앱</span>
                <span className="xl:hidden">데스크탑</span>
              </button>
            )}

            {onOpenCoreSpec && (
              <button
                type="button"
                onClick={onOpenCoreSpec}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
                title="순수 창작 KCert.Core.dll 기술 명세 및 4대 엔진 아키텍처"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden xl:inline">코어 DLL 명세</span>
                <span className="xl:hidden">명세서</span>
              </button>
            )}

            {onCheckUpdates && (
              <button
                type="button"
                onClick={onCheckUpdates}
                disabled={isCheckingUpdates}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-md text-xs font-bold transition-all cursor-pointer relative shadow-2xs ${
                  hasUpdateBadge
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="GitHub 최신 릴리스 및 버전 수동 확인"
              >
                {isCheckingUpdates ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <Sparkles className={`w-3.5 h-3.5 ${hasUpdateBadge ? 'text-amber-600 animate-bounce' : 'text-blue-600'}`} />
                )}
                <span className="hidden sm:inline">
                  {isCheckingUpdates ? '업데이트 확인 중...' : '수동 업데이트 확인'}
                </span>
                <span className="sm:hidden">
                  {isCheckingUpdates ? '확인 중' : '업데이트'}
                </span>
                {hasUpdateBadge && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5" />
                )}
              </button>
            )}

            {onOpenRenewalGuidance && (
              <button
                type="button"
                onClick={onOpenRenewalGuidance}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="인증서 발급기관 갱신 포털 및 갱신 센터 안내"
              >
                <Globe className="w-3.5 h-3.5 text-blue-100" />
                <span className="hidden sm:inline">인증서 갱신 안내</span>
                <span className="sm:hidden">갱신</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSecurityGuide}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>보안 수칙</span>
            </button>

            {onOpenTrash && (
              <button
                type="button"
                onClick={onOpenTrash}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer relative"
                title="인증서 임시 보관 휴지통 열기"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">휴지통</span>
                {trashCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold leading-tight">
                    {trashCount}
                  </span>
                )}
              </button>
            )}

            {onOpenActivityLogs && (
              <button
                type="button"
                onClick={onOpenActivityLogs}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer relative"
                title="앱 작업 및 감사 로그 열람"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">작업 로그</span>
                {logCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-bold leading-tight">
                    {logCount}
                  </span>
                )}
              </button>
            )}

            {onOpenLicense && (
              <button
                type="button"
                onClick={onOpenLicense}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                title="라이선스 및 법적 고지"
              >
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>라이선스</span>
              </button>
            )}
          </>
        )}

        <button
          type="button"
          id="btn-header-refresh"
          onClick={onRefresh}
          disabled={isScanning}
          className="px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95"
          title="인증서 보관함 및 드라이브 새로고침 (단축키: F5 / 전체 재스캔 및 유효기간 갱신)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
          <span>{isScanning ? '새로고침 중...' : '새로고침'}</span>
        </button>
      </div>
    </header>
  );
};
