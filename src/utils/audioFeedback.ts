/**
 * Audio feedback utility using Web Audio API
 * Generates pleasant, crystal-clear success chimes and notification tones
 * without requiring external MP3/WAV files.
 * Supports user toggle (ON/OFF) and custom volume slider with localStorage persistence.
 */

export interface SoundSettings {
  enabled: boolean; // 복사 완료 알림음 사용 여부 (기본: true)
  volume: number;  // 볼륨 백분율 (0 ~ 100, 기본: 40)
}

export interface SoundOptions {
  volume?: number; // 0.0 to 1.0 (optional override)
}

const STORAGE_KEY = 'kcert_sound_settings';
export const SOUND_SETTINGS_CHANGED_EVENT = 'kcert_sound_settings_changed';

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 40,
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
  if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.volume))) : 40,
    };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
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
 * Plays a cheerful, crystal-clear success chime (Eb5 -> G5 -> C6 harmonic progression)
 * Specially tuned for subtle, reassuring work completion feedback.
 * Respects user's enabled toggle and volume slider settings.
 */
export function playSuccessChime(options?: SoundOptions): void {
  const settings = getSoundSettings();
  if (!settings.enabled || settings.volume <= 0) return;

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
      console.debug('[AudioFeedback] Error playing success chime:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(executePlay).catch(executePlay);
  } else {
    executePlay();
  }
}

/**
 * Preview / Test chime function for Settings modal slider test
 * Plays even if enabled is false or tests with a specified volume
 */
export function playTestChime(testVolumePercent?: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const executePlay = () => {
    try {
      const vol = typeof testVolumePercent === 'number' 
        ? Math.max(0, Math.min(100, testVolumePercent)) 
        : getSoundSettings().volume;

      const baseRatio = vol / 100;
      const volume = Math.min(Math.max(baseRatio * 0.95, 0), 1);
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
      console.debug('[AudioFeedback] Error playing test chime:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(executePlay).catch(executePlay);
  } else {
    executePlay();
  }
}

/**
 * Alias for positive completion audio
 */
export const playPositiveCompletionSound = playSuccessChime;

/**
 * Plays a short, crisp notification tone (Single high ping: 880Hz)
 */
export function playPingSound(options?: SoundOptions): void {
  const settings = getSoundSettings();
  if (!settings.enabled || settings.volume <= 0) return;

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
      osc.frequency.setValueAtTime(880, now); // A5

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

