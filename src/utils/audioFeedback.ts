/**
 * Audio feedback utility using Web Audio API
 * Generates pleasant, crystal-clear success chimes and notification tones
 * without requiring external MP3/WAV files.
 */

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
      audioCtx.resume();
    }
    
    return audioCtx;
  } catch (e) {
    console.debug('[AudioFeedback] Web Audio not available or blocked:', e);
    return null;
  }
}

export interface SoundOptions {
  volume?: number; // 0.0 to 1.0 (default: 0.3)
}

/**
 * Plays a cheerful, crystal-clear success chime (Eb5 -> G5 -> C6 harmonic progression)
 * Specially tuned for subtle, reassuring work completion feedback.
 */
export function playSuccessChime(options?: SoundOptions): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const volume = Math.min(Math.max(options?.volume ?? 0.38, 0), 1);
    const now = ctx.currentTime;

    // 3 harmonic notes for an uplifting "complete" feel
    // Eb5 (622.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [
      { freq: 622.25, time: now + 0.00, duration: 0.18, gain: 0.25 },
      { freq: 783.99, time: now + 0.09, duration: 0.22, gain: 0.35 },
      { freq: 1046.50, time: now + 0.18, duration: 0.45, gain: 0.45 },
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Sine wave with soft attack and exponential decay for a clean chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Envelope: Instant attack, gentle decay
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
}

/**
 * Alias for positive completion audio
 */
export const playPositiveCompletionSound = playSuccessChime;


/**
 * Plays a short, crisp notification tone (Single high ping: 880Hz)
 */
export function playPingSound(options?: SoundOptions): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const volume = Math.min(Math.max(options?.volume ?? 0.25, 0), 1);
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
}
