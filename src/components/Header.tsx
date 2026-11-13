import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Volume1,
  VolumeX,
  Play,
  Settings,
  Rocket,
  RefreshCw,
  Trash2,
  FolderSearch,
  History,
  FileText,
  ShieldCheck,
  Sparkles,
  Info,
  Palette
} from 'lucide-react';
import { AppTheme } from '../types';
import { THEME_OPTIONS } from '../data/themes';
import { BRANDING_ASSETS } from '../data/brandingAssets';
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
  onOpenPaths?: () => void;
  onOpenHistory?: () => void;
  activeNavTab?: 'copy' | 'history' | 'paths' | 'security';
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
  isScanning,
  theme = 'dark',
  onThemeChange,
  onRefresh,
  onOpenSecurityGuide,
  onOpenTrash,
  onOpenActivityLogs,
  onOpenLicense,
  onCheckUpdates,
  onOpenPaths,
  onOpenHistory,
  activeNavTab = 'copy',
  isCheckingUpdates = false,
  hasUpdateBadge = false,
  trashCount = 0,
  lastScanTime,
  onToggleMobileMenu,
  appViewMode = 'simple',
  onToggleAppViewMode,
  onOpenStartupWorkflow,
  onOpenSettings,
}) => {
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

  const normalizedTheme =
    theme === 'pastel-black' ? 'dark' :
    theme === 'pastel-gray' ? 'gray' :
    theme === 'pastel-white' || theme === 'classic' ? 'white' :
    theme === 'pastel-beige' ? 'beige' :
    theme;

  return (
    <header
      id="app-header"
      className="wpf-native h-16 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none"
      style={{
        backgroundColor: 'var(--wpf-bg-card)',
        borderBottom: '1px solid var(--wpf-border)',
        color: 'var(--wpf-text-primary)',
      }}
    >
      {/* Left: Brand Logo & Title (Matches WPF Grid.Column="0") */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="wpf-native lg:hidden p-1.5 rounded-[6px] cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--wpf-bg-dark)',
              border: '1px solid var(--wpf-border)',
              color: 'var(--wpf-text-primary)',
            }}
            aria-label="카테고리 메뉴 열기"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="w-9 h-9 rounded-[8px] overflow-hidden shrink-0 flex items-center justify-center">
          <img
            src={BRANDING_ASSETS.appIcon}
            alt="K-인증서 매니저 로고"
            className="w-8.5 h-8.5 object-contain rounded-[6px]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== BRANDING_ASSETS.rawAppIcon) {
                target.src = BRANDING_ASSETS.rawAppIcon;
              }
            }}
          />
        </div>

        <h1
          className="text-[15px] font-bold tracking-tight whitespace-nowrap"
          style={{ color: 'var(--wpf-text-primary)' }}
        >
          K-인증서 매니저
        </h1>
      </div>

      {/* Right Scrollable Header Action Bar (Matches WPF Grid.Column="1" HeaderScrollViewer) */}
      <div
        ref={headerScrollRef}
        onWheel={handleHeaderWheel}
        className="flex-1 flex items-center justify-end overflow-x-auto min-w-0 ml-3 py-1 scrollbar-none"
        title="마우스 휠을 굴려 상단 메뉴 도구를 좌우로 스크롤할 수 있습니다"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme Switcher Dropdown Box */}
          {onThemeChange && (
            <div
              className="wpf-native flex items-center gap-1.5 px-2 py-1 rounded-[6px] shrink-0"
              style={{
                backgroundColor: 'var(--wpf-bg-dark)',
                border: '1px solid var(--wpf-border)',
              }}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--wpf-accent-text)' }} />
              <select
                value={normalizedTheme}
                onChange={(e) => onThemeChange(e.target.value as AppTheme)}
                className="wpf-native bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                style={{ color: 'var(--wpf-text-primary)' }}
                title="원하는 화면 테마 스타일을 선택하세요."
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Switch: [간편 모드] vs [상세 모드] (Matches WPF ModeToggleRadio) */}
          {onToggleAppViewMode && (
            <div
              className="wpf-native flex items-center p-0.5 rounded-[6px] shrink-0"
              style={{
                backgroundColor: 'var(--wpf-bg-dark)',
                border: '1px solid var(--wpf-border)',
              }}
            >
              <button
                type="button"
                onClick={() => onToggleAppViewMode('simple')}
                className={`wpf-native px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  appViewMode === 'simple'
                    ? 'bg-[#2563EB] text-white'
                    : 'hover:bg-[var(--wpf-bg-hover)]'
                }`}
                style={appViewMode !== 'simple' ? { color: 'var(--wpf-text-secondary)' } : undefined}
                title="초보자용 간편 모드: 핵심 복사 기능과 목록에 집중합니다."
              >
                간편 모드
              </button>
              <button
                type="button"
                onClick={() => onToggleAppViewMode('advanced')}
                className={`wpf-native px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  appViewMode === 'advanced'
                    ? 'bg-[#2563EB] text-white'
                    : 'hover:bg-[var(--wpf-bg-hover)]'
                }`}
                style={appViewMode !== 'advanced' ? { color: 'var(--wpf-text-secondary)' } : undefined}
                title="전문가용 상세 모드: 드라이브 상세 정보 및 부가 도구를 모두 표시합니다."
              >
                상세 모드
              </button>
            </div>
          )}

          {/* Sound Volume Bar (Matches WPF ShowHeaderSoundBar) */}
          {soundSettings.showHeaderSoundBar && (
            <div
              className="wpf-native flex items-center gap-1.5 px-2 py-1 rounded-[6px] shrink-0"
              style={{
                backgroundColor: 'var(--wpf-bg-dark)',
                border: '1px solid var(--wpf-border)',
              }}
              title="복사 성공 알림음 볼륨 조절 및 음소거 토글"
            >
              <button
                type="button"
                onClick={handleToggleSound}
                className="wpf-btn-secondary wpf-native px-1.5 py-0.5 cursor-pointer"
                title="성공 알림음 켜기/끄기"
              >
                {soundSettings.enabled && soundSettings.volume > 0 ? (
                  <Volume1 className="w-3.5 h-3.5" style={{ color: 'var(--wpf-accent-text)' }} />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-[#F43F5E]" />
                )}
              </button>
              <span className="text-[11px] hidden xl:inline whitespace-nowrap" style={{ color: 'var(--wpf-text-secondary)' }}>
                알림음:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={soundSettings.enabled ? soundSettings.volume : 0}
                onChange={handleVolumeChange}
                className="wpf-native w-14 h-1 rounded cursor-pointer accent-[#2563EB]"
              />
              <span
                className="text-[11px] font-bold w-8 text-right tabular-nums hidden xl:inline"
                style={{ color: 'var(--wpf-accent-text)' }}
              >
                {soundSettings.enabled ? soundSettings.volume : 0}%
              </span>
              <button
                type="button"
                onClick={handlePreviewChime}
                className="wpf-btn-secondary wpf-native px-1.5 py-0.5 cursor-pointer"
                title="성공 알림음 미리듣기"
              >
                <Play className={`w-3 h-3 ${isPlayingPreview ? 'text-[#2563EB]' : ''}`} />
              </button>
            </div>
          )}

          {/* Settings */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="환경 설정 창 열기 (알림음, 테마, UI 모드, 시작 가이드)"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: 'var(--wpf-text-secondary)' }} />
              <span className="font-semibold">환경 설정</span>
            </button>
          )}

          {/* Startup Guide (Primary Blue Button) */}
          {onOpenStartupWorkflow && (
            <button
              type="button"
              onClick={onOpenStartupWorkflow}
              className="wpf-btn-primary wpf-native px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="시작 작업 선택 창 및 순서별 가이드 모션을 실행합니다."
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>시작 가이드</span>
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isScanning}
            className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            title={lastScanTime ? `인증서 보관함 및 드라이브 새로고침 (마지막 스캔: ${lastScanTime})` : '새로고침'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} style={{ color: 'var(--wpf-accent-text)' }} />
            <span>{isScanning ? '스캔 중...' : '새로고침'}</span>
          </button>

          {/* Trash */}
          {onOpenTrash && (
            <button
              type="button"
              onClick={onOpenTrash}
              className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="안전 격리 휴지통 및 복원된 항목 암호화 보호 보관소"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span className="font-semibold tabular-nums" style={{ color: '#F43F5E' }}>
                휴지통 ({trashCount})
              </span>
            </button>
          )}

          {/* Advanced Mode Only Quick Tools (Matches WPF MainWindow.xaml lines 153-195) */}
          {appViewMode === 'advanced' && (
            <>
              {onOpenPaths && (
                <button
                  type="button"
                  onClick={onOpenPaths}
                  className={`wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 rounded-[6px] cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    activeNavTab === 'paths' ? 'wpf-btn-primary' : 'wpf-btn-secondary'
                  }`}
                >
                  <FolderSearch className="w-3.5 h-3.5" />
                  <span>탐색 경로</span>
                </button>
              )}

              {onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className={`wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 rounded-[6px] cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    activeNavTab === 'history' ? 'wpf-btn-primary' : 'wpf-btn-secondary'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>백업 이력</span>
                </button>
              )}

              {onOpenActivityLogs && (
                <button
                  type="button"
                  onClick={onOpenActivityLogs}
                  className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>작업 로그</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenSecurityGuide}
                className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>보안 수칙</span>
              </button>

              {onCheckUpdates && (
                <button
                  type="button"
                  onClick={onCheckUpdates}
                  disabled={isCheckingUpdates}
                  className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 relative disabled:opacity-50"
                  title="GitHub 최신 릴리스 및 버전 수동 확인"
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--wpf-badge-expiring-text)' }} />
                  <span>{isCheckingUpdates ? '확인 중...' : '업데이트 확인'}</span>
                  {hasUpdateBadge && <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />}
                </button>
              )}

              {onOpenLicense && (
                <button
                  type="button"
                  onClick={onOpenLicense}
                  className="wpf-btn-secondary wpf-native px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>정보</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
