import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, HardDrive, RefreshCw, FileKey, Menu, Trash2, Tag, ArrowDownLeft, FileText, Scale, Cpu, Usb, Activity, Palette, Check, Monitor, Globe, Sparkles, Sliders, Settings, Volume2, VolumeX, Volume1, Play } from 'lucide-react';
import { AppTheme } from '../types';
import { THEME_OPTIONS } from '../data/themes';
import { BRANDING_ASSETS } from '../data/brandingAssets';
import { APP_VERSION } from '../version';
import {
  getSoundSettings,
  saveSoundSettings,
  playTestChime,
  SoundSettings,
  SOUND_SETTINGS_CHANGED_EVENT,
} from '../utils/audioFeedback';

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
  onOpenSettings?: () => void;
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
  onOpenSettings,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(getSoundSettings);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const volumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  const handleHeaderWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (headerScrollRef.current && e.deltaY !== 0) {
      headerScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<SoundSettings>;
      if (customEvent.detail) {
        setSoundSettings(customEvent.detail);
      }
    };
    window.addEventListener(SOUND_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    return () => {
      window.removeEventListener(SOUND_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    };
  }, []);

  const handleToggleSound = () => {
    const newEnabled = !soundSettings.enabled;
    const newVol = newEnabled && soundSettings.volume === 0 ? 40 : soundSettings.volume;
    const updated = saveSoundSettings({ enabled: newEnabled, volume: newVol });
    setSoundSettings(updated);
    if (newEnabled) {
      playTestChime(updated.volume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newEnabled = val > 0;
    const updated = saveSoundSettings({ volume: val, enabled: newEnabled });
    setSoundSettings(updated);

    if (volumeDebounceRef.current) {
      clearTimeout(volumeDebounceRef.current);
    }
    volumeDebounceRef.current = setTimeout(() => {
      if (val > 0) {
        playTestChime(val);
      }
    }, 150);
  };

  const handlePreviewChime = () => {
    setIsPlayingPreview(true);
    playTestChime(soundSettings.enabled ? soundSettings.volume : 40);
    setTimeout(() => setIsPlayingPreview(false), 500);
  };

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
    <header id="app-header" className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors">
      {/* Left: Title & Tag */}
      <div className="flex items-center space-x-2">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            aria-label="메뉴 열기"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shadow-2xs border border-slate-200/90 bg-slate-50 flex items-center justify-center shrink-0">
            <img 
              src={BRANDING_ASSETS.appIcon} 
              alt="K-인증서 매니저 로고" 
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
          <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight leading-tight hidden xs:block">
            인증서 일괄 관리
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div
        ref={headerScrollRef}
        onWheel={handleHeaderWheel}
        className="flex-1 flex items-center justify-end overflow-x-auto min-w-0 ml-2 sm:ml-4 py-1 select-none scrollbar-none"
      >
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <span className="text-[10px] text-slate-500 hidden xl:inline shrink-0">
            스캔: <span className="font-bold text-slate-700">{lastScanTime}</span>
          </span>

          {/* Theme Select */}
          {onThemeChange && (
            <div className="flex items-center bg-slate-100/90 px-2 py-1 rounded-lg border border-slate-200/90 gap-1 shadow-2xs">
              <Palette className="w-3 h-3 text-blue-600 shrink-0" />
              <select
                value={
                  theme === 'pastel-black' ? 'dark' :
                  theme === 'pastel-gray' ? 'gray' :
                  theme === 'pastel-white' ? 'white' :
                  theme === 'pastel-beige' ? 'beige' :
                  theme
                }
                onChange={(e) => onThemeChange(e.target.value as AppTheme)}
                className="bg-transparent text-[10px] font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-white text-slate-900 font-medium">
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Toggle */}
          {onToggleAppViewMode && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => onToggleAppViewMode('simple')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  appViewMode === 'simple' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                간편
              </button>
              <button
                type="button"
                onClick={() => onToggleAppViewMode('advanced')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  appViewMode === 'advanced' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                상세
              </button>
            </div>
          )}

          {/* Compact Sound Widget */}
          {soundSettings.showHeaderSoundBar && (
            <div className="flex items-center bg-slate-100/95 px-1.5 py-1 rounded-lg border border-slate-200/90 gap-1.5 shadow-2xs">
              <button onClick={handleToggleSound} className="cursor-pointer">
                {soundSettings.enabled && soundSettings.volume > 0 ? (
                  <Volume1 className="w-3 h-3 text-blue-600" />
                ) : (
                  <VolumeX className="w-3 h-3 text-rose-500" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={soundSettings.enabled ? soundSettings.volume : 0}
                onChange={handleVolumeChange}
                className="w-12 sm:w-16 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
              />
              <button onClick={handlePreviewChime} className="cursor-pointer disabled:opacity-50">
                <Play className={`w-2.5 h-2.5 ${isPlayingPreview ? 'text-blue-600' : 'text-slate-400'}`} />
              </button>
            </div>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200/90 rounded-lg shadow-2xs cursor-pointer"
              title="설정"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenStartupWorkflow && (
            <button
              onClick={onOpenStartupWorkflow}
              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer border border-blue-500"
            >
              가이드
            </button>
          )}

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200/90 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
              title="안전 격리 휴지통 및 복원된 항목 암호화 보호 보관소(DPAPI / AES-256)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>휴지통{trashCount > 0 ? ` (${trashCount})` : ''}</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isScanning}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? '...' : '새로고침'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
