import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Palette,
  Layout,
  Bell,
  Check,
  HardDrive
} from 'lucide-react';
import {
  getSoundSettings,
  saveSoundSettings,
  playTestChime,
  SoundSettings,
  DEFAULT_SOUND_SETTINGS,
  SOUND_SETTINGS_CHANGED_EVENT,
} from '../utils/audioFeedback';
import { AppTheme } from '../types';
import { THEME_OPTIONS } from '../data/themes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  appViewMode?: 'simple' | 'advanced';
  onToggleAppViewMode?: (mode: 'simple' | 'advanced') => void;
  dontShowStartupAgain?: boolean;
  onToggleDontShowStartupAgain?: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme = 'pastel-white',
  onThemeChange,
  appViewMode = 'simple',
  onToggleAppViewMode,
  dontShowStartupAgain = false,
  onToggleDontShowStartupAgain,
}) => {
  const [soundSettings, setSoundSettingsState] = useState<SoundSettings>(getSoundSettings);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [justSavedNotification, setJustSavedNotification] = useState(false);
  const volumeDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when modal opens or custom event fires
  useEffect(() => {
    if (isOpen) {
      setSoundSettingsState(getSoundSettings());
    }

    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<SoundSettings>;
      if (customEvent.detail) {
        setSoundSettingsState(customEvent.detail);
      }
    };

    window.addEventListener(SOUND_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    return () => {
      window.removeEventListener(SOUND_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = (enabled: boolean) => {
    const updated = saveSoundSettings({ enabled });
    setSoundSettingsState(updated);
    if (enabled && updated.volume > 0) {
      playTestChime(updated.volume);
    }
    triggerSaveBadge();
  };

  const handleVolumeChange = (newVolume: number) => {
    const newEnabled = newVolume > 0;
    const updated = saveSoundSettings({ volume: newVolume, enabled: newEnabled });
    setSoundSettingsState(updated);

    if (volumeDebounceRef.current) {
      clearTimeout(volumeDebounceRef.current);
    }
    volumeDebounceRef.current = setTimeout(() => {
      if (newVolume > 0) {
        playTestChime(newVolume);
      }
    }, 150);
  };

  const handleTestChime = () => {
    setIsPlayingTest(true);
    playTestChime(soundSettings.enabled ? soundSettings.volume : 40);
    setTimeout(() => {
      setIsPlayingTest(false);
    }, 600);
  };

  const handleResetToDefaults = () => {
    const reset = saveSoundSettings(DEFAULT_SOUND_SETTINGS);
    setSoundSettingsState(reset);
    if (onToggleDontShowStartupAgain) {
      onToggleDontShowStartupAgain(false);
    }
    triggerSaveBadge();
    playTestChime(DEFAULT_SOUND_SETTINGS.volume);
  };

  const triggerSaveBadge = () => {
    setJustSavedNotification(true);
    setTimeout(() => setJustSavedNotification(false), 2000);
  };

  const getVolumeIcon = () => {
    if (!soundSettings.enabled || soundSettings.volume === 0) {
      return <VolumeX className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (soundSettings.volume <= 35) {
      return <Volume1 className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    return <Volume2 className="w-5 h-5 text-indigo-600 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">환경 설정 (Settings)</h3>
                {justSavedNotification && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full font-medium animate-fadeIn">
                    <Check className="w-3 h-3" /> 저장됨
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                복사 완료 알림음(SuccessChime), 볼륨 크기, 화면 모드 및 기본 동작 설정
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs sm:text-sm text-slate-700 flex-1">
          
          {/* SECTION 1: 복사 완료 알림음(SuccessChime) 설정 (User Requested Primary Feature) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    인증서 복사 완료 알림음 (SuccessChime)
                  </h4>
                  <p className="text-xs text-slate-500">
                    PC ➔ USB 또는 USB ➔ PC 복사가 성공했을 때 청명한 하모닉 완료음(Eb5-G5-C6)을 들려줍니다.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={soundSettings.enabled}
                  onChange={(e) => handleToggleSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                <span className={`ml-2.5 text-xs font-bold ${soundSettings.enabled ? 'text-blue-600' : 'text-slate-400'}`}>
                  {soundSettings.enabled ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>

            {/* Volume Control Area */}
            <div className={`space-y-3 transition-opacity ${soundSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getVolumeIcon()}
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">알림음 볼륨 크기</span>
                  <span className="text-[11px] text-slate-400">
                    ({soundSettings.enabled ? `${soundSettings.volume}%` : '음소거'})
                  </span>
                </div>
                
                {/* Audio Preview / Test Button */}
                <button
                  type="button"
                  onClick={handleTestChime}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                    isPlayingTest ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-700 scale-95' : ''
                  }`}
                  title="현재 설정된 볼륨으로 SuccessChime 1회 재생"
                >
                  <Play className={`w-3.5 h-3.5 ${isPlayingTest ? 'text-blue-600 animate-spin' : 'text-blue-600'}`} />
                  <span>소리 미리듣기</span>
                </button>
              </div>

              {/* Range Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-400 w-7">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={soundSettings.volume}
                    disabled={!soundSettings.enabled}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                  />
                  <span className="text-[11px] font-semibold text-slate-600 w-10 text-right">
                    {soundSettings.volume}%
                  </span>
                </div>

                {/* Preset Volume Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">빠른 볼륨 프리셋:</div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: '음소거', vol: 0 },
                      { label: '조용히 (25%)', vol: 25 },
                      { label: '보통 (50%)', vol: 50 },
                      { label: '크게 (80%)', vol: 80 },
                      { label: '최대 (100%)', vol: 100 },
                    ].map((preset) => (
                      <button
                        key={preset.vol}
                        type="button"
                        onClick={() => {
                          handleVolumeChange(preset.vol);
                          if (preset.vol > 0) playTestChime(preset.vol);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer border ${
                          soundSettings.volume === preset.vol
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reassuring note */}
            <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                브라우저 내 Web Audio API를 활용하므로 외부 오디오 파일 다운로드나 네트워크 지연 없이 즉각적이고 청명한 음질로 재생됩니다. 설정은 브라우저에 안전하게 자동 저장됩니다.
              </span>
            </div>
          </div>

          {/* SECTION 2: 시작 화면 및 안내 가이드 설정 */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              시작 가이드 및 안내 설정
            </h4>

            {onToggleDontShowStartupAgain && (
              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={!dontShowStartupAgain}
                  onChange={(e) => onToggleDontShowStartupAgain(!e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    앱 실행 시 작업 선택창 (PC ➔ USB / USB ➔ PC) 자동으로 띄우기
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    체크를 해제하면 시작 시 팝업 없이 바로 메인 인증서 관리 대시보드로 진입합니다. (상단 헤더의 [시작 가이드] 버튼을 통해 언제든 다시 열 수 있습니다.)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* SECTION 3: 테마 및 화면 표시 모드 */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              디스플레이 및 테마
            </h4>

            {/* View Mode Toggle */}
            {onToggleAppViewMode && (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Layout className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">기본 화면 표시 모드</div>
                    <div className="text-[11px] text-slate-500">
                      {appViewMode === 'simple' ? '간편 모드 (주요 기능 위주 직관적 구성)' : '전문가 상세 모드 (고급 드라이브 세부정보 & 도구 표시)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onToggleAppViewMode('simple')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      appViewMode === 'simple'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    간편 모드
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleAppViewMode('advanced')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      appViewMode === 'advanced'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    전문가 모드
                  </button>
                </div>
              </div>
            )}

            {/* Themes Grid */}
            {onThemeChange && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  테마 스타일 (4종)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 font-bold shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className="w-4 h-4 rounded-full border shadow-2xs shrink-0"
                            style={{ backgroundColor: opt.swatchPrimary, borderColor: opt.swatchBorder }}
                          />
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className="text-xs font-bold">{opt.name}</span>
                        <span className="text-[10px] text-slate-400 truncate">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-rose-600 text-xs font-medium hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="소리 및 기본 옵션을 최초 설치 상태로 되돌립니다."
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값으로 복원</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
