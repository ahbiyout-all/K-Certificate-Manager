/**
 * Audio feedback utility using Web Audio API
 * Generates pleasant, crystal-clear sounds for every phase of certificate copy/backup:
 * - 시작음 (Start Sound): 작업 착수 알림 (C5 -> G5 상승 톤)
 * - 완료음 (Completion Sound): 복사/백업 성공 완료 알림 (Eb5 -> G5 -> C6 하모닉 차임)
 * - 오류음 (Error Sound): 복사 실패/차단 경고 알림 (F4 -> Db4 하강 주의 톤)
 *
 * 100% 로컬 Web Audio 합성 방식 (외부 MP3/WAV 파일 및 네트워크 요청 없음, Zero-Network)
 * 볼륨 슬라이더 (0~100) 및 단계별 사운드 토글(시작/완료/오류) 로컬 저장 지원.
 */

export interface SoundSettings {
  enabled: boolean;        // 사운드 피드백 전체 사용 여부 (기본: true)
  volume: number;         // 마스터 볼륨 백분율 (0 ~ 100, 기본: 40)
  playOnStart: boolean;   // 시작음 사용 여부 (기본: true)
  playOnComplete: boolean;// 완료음 사용 여부 (기본: true)
  playOnError: boolean;   // 오류음 사용 여부 (기본: true)
}

export interface SoundOptions {
  volume?: number; // 0.0 to 1.0 (optional override)
  force?: boolean; // ignore enabled toggle (for preview/testing)
}

export type SoundPhase = 'start' | 'complete' | 'error' | 'ping';

const STORAGE_KEY = 'kcert_sound_settings';
export const SOUND_SETTINGS_CHANGED_EVENT = 'kcert_sound_settings_changed';

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 40,
  playOnStart: true,
  playOnComplete: true,
  playOnError: true,
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch (e) {
    console.debug('[AudioFeedback] Web Audio not available or blocked:', e);
    return null;
  }
}

// Automatically unlock Web Audio API AudioContext on user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  };
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  });
}

/**
 * Retrieve stored sound settings from localStorage
 */
export function getSoundSettings(): SoundSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SOUND_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SOUND_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SOUND_SETTINGS.enabled,
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.volume))) : DEFAULT_SOUND_SETTINGS.volume,
      playOnStart: typeof parsed.playOnStart === 'boolean' ? parsed.playOnStart : true,
      playOnComplete: typeof parsed.playOnComplete === 'boolean' ? parsed.playOnComplete : true,
      playOnError: typeof parsed.playOnError === 'boolean' ? parsed.playOnError : true,
    };
  } catch {
    return { ...DEFAULT_SOUND_SETTINGS };
  }
}

/**
 * Save updated sound settings to localStorage and notify all listeners
 */
export function saveSoundSettings(partial: Partial<SoundSettings>): SoundSettings {
  const current = getSoundSettings();
  const updated: SoundSettings = {
    enabled: typeof partial.enabled === 'boolean' ? partial.enabled : current.enabled,
    volume: typeof partial.volume === 'number' ? Math.max(0, Math.min(100, Math.round(partial.volume))) : current.volume,
    playOnStart: typeof partial.playOnStart === 'boolean' ? partial.playOnStart : current.playOnStart,
    playOnComplete: typeof partial.playOnComplete === 'boolean' ? partial.playOnComplete : current.playOnComplete,
    playOnError: typeof partial.playOnError === 'boolean' ? partial.playOnError : current.playOnError,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SOUND_SETTINGS_CHANGED_EVENT, { detail: updated }));
    }
  } catch (e) {
    console.debug('[AudioFeedback] Failed to save sound settings:', e);
  }
  return updated;
}

/**
 * 1. 시작음 (Start Sound)
 * 작업 시작 시 경쾌한 2음 상승 아르페지오 (C5: 523.25Hz -> G5: 783.99Hz)
 */
export function playStartSound(options?: SoundOptions): void {
  const settings = getSoundSettings();
  if (!options?.force && (!settings.enabled || !settings.playOnStart || settings.volume <= 0)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const executePlay = () => {
    try {
      const baseRatio = settings.volume / 100;
      const volumeMultiplier = options?.volume !== undefined ? options.volume / 0.38 : 1.0;
      const volume = Math.min(Math.max(baseRatio * volumeMultiplier * 0.9, 0), 1);
      if (volume <= 0) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: now + 0.00, duration: 0.10, gain: 0.28, type: 'sine' as OscillatorType },
        { freq: 783.99, time: now + 0.08, duration: 0.20, gain: 0.38, type: 'sine' as OscillatorType },
      ];

      notes.forEach(({ freq, time, duration, gain, type }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.exponentialRampToValueAtTime(gain * volume, time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
      });
    } catch (err) {
      console.debug('[AudioFeedback] Error playing start sound:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(executePlay).catch(executePlay);
  } else {
    executePlay();
  }
}

/**
 * 2. 완료음 (Completion Sound / Success Chime)
 * 복사/백업 성공 시 청명한 3음 하모닉 상승 차임 (Eb5: 622.25Hz -> G5: 783.99Hz -> C6: 1046.50Hz)
 */
export function playCompletionSound(options?: SoundOptions): void {
  const settings = getSoundSettings();
  if (!options?.force && (!settings.enabled || !settings.playOnComplete || settings.volume <= 0)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const executePlay = () => {
    try {
      const baseRatio = settings.volume / 100;
      const volumeMultiplier = options?.volume !== undefined ? options.volume / 0.38 : 1.0;
      const volume = Math.min(Math.max(baseRatio * volumeMultiplier * 0.95, 0), 1);
      if (volume <= 0) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 622.25, time: now + 0.00, duration: 0.18, gain: 0.25 },
        { freq: 783.99, time: now + 0.09, duration: 0.22, gain: 0.35 },
        { freq: 1046.50, time: now + 0.18, duration: 0.45, gain: 0.45 },
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.exponentialRampToValueAtTime(gain * volume, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
      });
    } catch (err) {
      console.debug('[AudioFeedback] Error playing completion chime:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(executePlay).catch(executePlay);
  } else {
    executePlay();
  }
}

/**
 * 완료음의 기존 함수명 별칭 (호환성 보장)
 */
export const playSuccessChime = playCompletionSound;
export const playPositiveCompletionSound = playCompletionSound;

/**
 * 3. 오류음 (Error Sound)
 * 복사 실패, 권한 거부, 쓰기 금지 등 오류 발생 시 주의를 환기하는 정중한 2음 하강 톤 (F4: 349.23Hz -> Db4: 277.18Hz)
 */
export function playErrorSound(options?: SoundOptions): void {
  const settings = getSoundSettings();
  if (!options?.force && (!settings.enabled || !settings.playOnError || settings.volume <= 0)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const executePlay = () => {
    try {
      const baseRatio = settings.volume / 100;
      const volumeMultiplier = options?.volume !== undefined ? options.volume / 0.38 : 1.0;
      const volume = Math.min(Math.max(baseRatio * volumeMultiplier * 0.95, 0), 1);
      if (volume <= 0) return;

      const now = ctx.currentTime;
      // Soft, distinct descending caution interval (Minor Third: F4 -> Db4)
      const notes = [
        { freq: 349.23, time: now + 0.00, duration: 0.15, gain: 0.35, type: 'triangle' as OscillatorType },
        { freq: 277.18, time: now + 0.12, duration: 0.30, gain: 0.40, type: 'triangle' as OscillatorType },
      ];

      notes.forEach(({ freq, time, duration, gain, type }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.exponentialRampToValueAtTime(gain * volume, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
      });
    } catch (err) {
      console.debug('[AudioFeedback] Error playing error sound:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(executePlay).catch(executePlay);
  } else {
    executePlay();
  }
}

/**
 * 4. 알림 핑음 (Short Ping Tone)
 * 단일 고음 핑 (880Hz / A5)
 */
export function playPingSound(options?: SoundOptions): void {
  const settings = getSoundSettings();
  if (!options?.force && (!settings.enabled || settings.volume <= 0)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const executePlay = () => {
    try {
      const baseRatio = settings.volume / 100;
      const volume = Math.min(Math.max(baseRatio * (options?.volume ?? 0.25) / 0.25, 0), 1);
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.3 * volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (err) {
      console.debug('[AudioFeedback] Error playing ping sound:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(executePlay).catch(executePlay);
  } else {
    executePlay();
  }
}

/**
 * Preview / Test sound function for settings modal and header test buttons
 * Supports previewing specific phases: 'start', 'complete', 'error', or 'ping'
 */
export function playTestSound(phase: SoundPhase = 'complete', testVolumePercent?: number): void {
  const vol = typeof testVolumePercent === 'number' 
    ? Math.max(0, Math.min(100, testVolumePercent)) 
    : getSoundSettings().volume;

  // Temporarily force playback with test volume
  const options: SoundOptions = {
    volume: (vol / 100) * 0.38,
    force: true,
  };

  if (phase === 'start') {
    playStartSound(options);
  } else if (phase === 'complete') {
    playCompletionSound(options);
  } else if (phase === 'error') {
    playErrorSound(options);
  } else if (phase === 'ping') {
    playPingSound(options);
  }
}

/**
 * Test chime backward compatibility alias
 */
export function playTestChime(testVolumePercent?: number): void {
  playTestSound('complete', testVolumePercent);
}
