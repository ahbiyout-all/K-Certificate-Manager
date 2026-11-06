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
  HardDrive,
  FolderSearch
} from 'lucide-react';
import {
  getSoundSettings,
  saveSoundSettings,
  playTestSound,
  playTestChime,
  SoundSettings,
  SoundPhase,
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

  const [testingPhase, setTestingPhase] = useState<SoundPhase | null>(null);

  const handleTestChime = () => {
    handleTestPhase('complete');
  };

  const handleTestPhase = (phase: SoundPhase) => {
    setTestingPhase(phase);
    setIsPlayingTest(true);
    playTestSound(phase, soundSettings.enabled ? soundSettings.volume : 40);
    setTimeout(() => {
      setTestingPhase(null);
      setIsPlayingTest(false);
    }, 600);
  };

  const handleTogglePhase = (phase: 'playOnStart' | 'playOnComplete' | 'playOnError', checked: boolean) => {
    const updated = saveSoundSettings({ [phase]: checked });
    setSoundSettingsState(updated);
    triggerSaveBadge();
  };

  const handleToggleShowHeaderSoundBar = (checked: boolean) => {
    const updated = saveSoundSettings({ showHeaderSoundBar: checked });
    setSoundSettingsState(updated);
    triggerSaveBadge();
  };

  const [excludeLocalLowGpki, setExcludeLocalLowGpki] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kcert_exclude_locallow_gpki');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const handleToggleExcludeLocalLowGpki = (checked: boolean) => {
    setExcludeLocalLowGpki(checked);
    try {
      localStorage.setItem('kcert_exclude_locallow_gpki', String(checked));
    } catch {}
    triggerSaveBadge();
  };

  const handleResetToDefaults = () => {
    const reset = saveSoundSettings(DEFAULT_SOUND_SETTINGS);
    setSoundSettingsState(reset);
    setExcludeLocalLowGpki(true);
    try {
      localStorage.setItem('kcert_exclude_locallow_gpki', 'true');
    } catch {}
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
          
          {/* SECTION 1: 단계별 사운드 피드백 (시작음 / 완료음 / 오류음) 설정 */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    인증서 복사 및 USB 백업 사운드 피드백
                  </h4>
                  <p className="text-xs text-slate-500">
                    작업 단계별(시작음, 완료음, 오류음) 음향 효과로 진행 상황을 명확히 전달합니다.
                  </p>
                </div>
              </div>

              {/* Master Toggle Switch */}
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

            {/* Master Volume Control Area */}
            <div className={`space-y-3 transition-opacity ${soundSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getVolumeIcon()}
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">마스터 볼륨 크기</span>
                  <span className="text-[11px] text-slate-400">
                    ({soundSettings.enabled ? `${soundSettings.volume}%` : '음소거'})
                  </span>
                </div>
                
                {/* General Preview Button */}
                <button
                  type="button"
                  onClick={() => handleTestPhase('complete')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                    testingPhase === 'complete' ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-700 scale-95' : ''
                  }`}
                  title="현재 설정된 볼륨으로 완료음(SuccessChime) 1회 재생"
                >
                  <Play className={`w-3.5 h-3.5 ${testingPhase === 'complete' ? 'text-blue-600 animate-spin' : 'text-blue-600'}`} />
                  <span>대표음 미리듣기</span>
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
                          if (preset.vol > 0) playTestSound('complete', preset.vol);
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

                {/* Header Sound Volume Slider Bar Visibility Toggle */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={!!soundSettings.showHeaderSoundBar}
                      onChange={(e) => handleToggleShowHeaderSoundBar(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span>헤더 상단 사운드 가로 소리조절바 표시</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">기본: 비활성</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        상단 헤더 메뉴에 실시간 볼륨 조절 슬라이더 바를 표시합니다. (체크 해제 시 상단 헤더 소리조절바가 숨겨집니다)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3-Stage Phased Sound Effect Controls */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    단계별 음향 효과 개별 제어 및 미리듣기
                  </span>
                  <span className="text-[11px] text-slate-400">각 단계별 클릭 시 실시간 시연</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phase 1: Completion Sound (완료음) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    soundSettings.playOnComplete ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                        <span className="text-base">🎉</span>
                        <span>완료음 (Completion Chime)</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={soundSettings.playOnComplete}
                          onChange={(e) => handleTogglePhase('playOnComplete', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2.5">
                      복사·백업 성공 시 청명한 3음 하모닉 상승 차임 (Eb5➔G5➔C6)
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTestPhase('complete')}
                      className={`w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        testingPhase === 'complete' ? 'ring-2 ring-emerald-500 bg-emerald-100' : ''
                      }`}
                    >
                      <Play className={`w-3.5 h-3.5 ${testingPhase === 'complete' ? 'animate-spin' : ''}`} />
                      <span>완료음 실시간 미리듣기 🔊</span>
                    </button>
                  </div>

                  {/* Phase 2: Error Sound (오류음) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    soundSettings.playOnError ? 'bg-white border-amber-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                        <span className="text-base">⚠️</span>
                        <span>오류음 (Error Caution)</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={soundSettings.playOnError}
                          onChange={(e) => handleTogglePhase('playOnError', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2.5">
                      쓰기 실패·권한 거부 등 오류 시 주의 2음 하강 톤 (F4➔Db4)
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTestPhase('error')}
                      className={`w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        testingPhase === 'error' ? 'ring-2 ring-amber-500 bg-amber-100' : ''
                      }`}
                    >
                      <Play className={`w-3.5 h-3.5 ${testingPhase === 'error' ? 'animate-spin' : ''}`} />
                      <span>오류음 실시간 미리듣기 ⚠️</span>
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">✓ 복사 시작음:</span>
                  <span>불필요한 소음 방지를 위해 복사 시작음은 기본 제거되었습니다.</span>
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

          {/* SECTION 3: 인증서 탐색 및 GPKI 경로 최적화 */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FolderSearch className="w-4 h-4 text-blue-600" />
              인증서 탐색 및 GPKI(행정전자서명) 경로 최적화
            </h4>

            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={excludeLocalLowGpki}
                onChange={(e) => handleToggleExcludeLocalLowGpki(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>AppData\LocalLow\GPKI 경로 탐색 제외</span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">권장</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  공무원 행정전자서명(GPKI)의 정부 공식 표준 경로는 <strong className="text-slate-700">C:\GPKI\Certificate\class2</strong>입니다. 온-나라, 새올 등 행정망에서 사용되지 않는 비권장 폴더(<code className="font-mono text-slate-600 bg-slate-100 px-1 rounded">AppData\LocalLow\GPKI</code>)를 탐색 대상에서 배제합니다. (체크 해제 시 탐색을 수행하되 &apos;⚠️ 실무 미사용 경로&apos; 안내 경고가 표시됩니다)
                </p>
              </div>
            </label>
          </div>

          {/* SECTION 4: 테마 및 화면 표시 모드 */}
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
