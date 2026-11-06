using System;
using System.IO;
using System.Media;

namespace KCertManager.Wpf.Services
{
    /// <summary>
    /// Windows 시스템 사운드 설정(소리 구성표 해제 등)과 무관하게
    /// 100% 정상 발음되는 메모리 내장형 16-bit PCM WAV 사운드 재생 서비스
    /// </summary>
    public static class SoundService
    {
        private static byte[]? _cachedChimeWav;
        private static int _cachedChimeVolume = -1;

        private static byte[]? _cachedErrorWav;
        private static int _cachedErrorVolume = -1;

        /// <summary>
        /// 복사 시작음 제거 요구사항에 따라 시작음은 재생하지 않습니다. (No-op)
        /// </summary>
        public static void PlayStartSound()
        {
            // 사용자의 요청으로 복사 시작음은 영구 제거되었습니다.
        }

        /// <summary>
        /// 복사/백업 성공 완료 알림음 (청명한 3음 하모닉 상승 차임)
        /// </summary>
        public static void PlayCompletionSound()
        {
            try
            {
                var settings = SettingsService.Instance.Settings;
                if (!settings.IsSoundEnabled || settings.SoundVolume <= 0) return;

                int volume = Math.Max(1, Math.Min(100, settings.SoundVolume));
                byte[] wavBytes = GetOrCreateChimeWav(volume);

                // SoundPlayer를 통해 Windows 기본 오디오 장치로 직접 비동기 재생
                using var ms = new MemoryStream(wavBytes);
                using var player = new SoundPlayer(ms);
                player.Play();
            }
            catch
            {
                try { SystemSounds.Asterisk.Play(); } catch { }
            }
        }

        /// <summary>
        /// 복사 실패/차단 주의 알림음 (2음 하강 톤)
        /// </summary>
        public static void PlayErrorSound()
        {
            try
            {
                var settings = SettingsService.Instance.Settings;
                if (!settings.IsSoundEnabled || settings.SoundVolume <= 0) return;

                int volume = Math.Max(1, Math.Min(100, settings.SoundVolume));
                byte[] wavBytes = GetOrCreateErrorWav(volume);

                using var ms = new MemoryStream(wavBytes);
                using var player = new SoundPlayer(ms);
                player.Play();
            }
            catch
            {
                try { SystemSounds.Hand.Play(); } catch { }
            }
        }

        private static byte[] GetOrCreateChimeWav(int volume)
        {
            if (_cachedChimeWav != null && _cachedChimeVolume == volume)
                return _cachedChimeWav;

            int sampleRate = 44100;
            double totalSeconds = 0.55;
            int totalSamples = (int)(sampleRate * totalSeconds);
            short[] samples = new short[totalSamples];

            double volFactor = (volume / 100.0) * 0.85;

            // 3-note harmonic rising chime: Eb5 (622.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
            var notes = new[]
            {
                (freq: 622.25, start: 0.00, dur: 0.18, gain: 0.65),
                (freq: 783.99, start: 0.09, dur: 0.22, gain: 0.85),
                (freq: 1046.50, start: 0.18, dur: 0.36, gain: 1.00)
            };

            foreach (var note in notes)
            {
                int startIdx = (int)(note.start * sampleRate);
                int count = (int)(note.dur * sampleRate);
                for (int i = 0; i < count && (startIdx + i) < totalSamples; i++)
                {
                    double t = (double)i / sampleRate;
                    double attack = Math.Min(1.0, (double)i / (sampleRate * 0.015));
                    double decay = Math.Max(0.0, 1.0 - (double)i / count);
                    double envelope = attack * decay * decay;
                    double wave = Math.Sin(2.0 * Math.PI * note.freq * t) + 0.25 * Math.Sin(4.0 * Math.PI * note.freq * t);
                    short val = (short)(wave * envelope * note.gain * volFactor * 32767);

                    int idx = startIdx + i;
                    int mixed = samples[idx] + val;
                    samples[idx] = (short)Math.Max(short.MinValue, Math.Min(short.MaxValue, mixed));
                }
            }

            _cachedChimeWav = BuildPcmWav(samples, sampleRate);
            _cachedChimeVolume = volume;
            return _cachedChimeWav;
        }

        private static byte[] GetOrCreateErrorWav(int volume)
        {
            if (_cachedErrorWav != null && _cachedErrorVolume == volume)
                return _cachedErrorWav;

            int sampleRate = 44100;
            double totalSeconds = 0.40;
            int totalSamples = (int)(sampleRate * totalSeconds);
            short[] samples = new short[totalSamples];

            double volFactor = (volume / 100.0) * 0.75;

            // 2-note descending caution tone: F4 (349.23Hz) -> Db4 (277.18Hz)
            var notes = new[]
            {
                (freq: 349.23, start: 0.00, dur: 0.18, gain: 0.8),
                (freq: 277.18, start: 0.12, dur: 0.26, gain: 1.0)
            };

            foreach (var note in notes)
            {
                int startIdx = (int)(note.start * sampleRate);
                int count = (int)(note.dur * sampleRate);
                for (int i = 0; i < count && (startIdx + i) < totalSamples; i++)
                {
                    double t = (double)i / sampleRate;
                    double attack = Math.Min(1.0, (double)i / (sampleRate * 0.01));
                    double decay = Math.Max(0.0, 1.0 - (double)i / count);
                    double envelope = attack * decay;
                    double wave = Math.Sin(2.0 * Math.PI * note.freq * t);
                    short val = (short)(wave * envelope * note.gain * volFactor * 32767);

                    int idx = startIdx + i;
                    int mixed = samples[idx] + val;
                    samples[idx] = (short)Math.Max(short.MinValue, Math.Min(short.MaxValue, mixed));
                }
            }

            _cachedErrorWav = BuildPcmWav(samples, sampleRate);
            _cachedErrorVolume = volume;
            return _cachedErrorWav;
        }

        private static byte[] BuildPcmWav(short[] samples, int sampleRate)
        {
            using var ms = new MemoryStream();
            using var bw = new BinaryWriter(ms);

            int subChunk2Size = samples.Length * 2;
            int chunkSize = 36 + subChunk2Size;

            // RIFF header
            bw.Write(new char[] { 'R', 'I', 'F', 'F' });
            bw.Write(chunkSize);
            bw.Write(new char[] { 'W', 'A', 'V', 'E' });

            // fmt chunk
            bw.Write(new char[] { 'f', 'm', 't', ' ' });
            bw.Write(16); // SubChunk1Size (16 for PCM)
            bw.Write((short)1); // AudioFormat (1 = PCM)
            bw.Write((short)1); // NumChannels (1 = Mono)
            bw.Write(sampleRate);
            bw.Write(sampleRate * 2); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
            bw.Write((short)2); // BlockAlign (NumChannels * BitsPerSample/8)
            bw.Write((short)16); // BitsPerSample

            // data chunk
            bw.Write(new char[] { 'd', 'a', 't', 'a' });
            bw.Write(subChunk2Size);
            foreach (var s in samples)
            {
                bw.Write(s);
            }

            return ms.ToArray();
        }
    }
}
