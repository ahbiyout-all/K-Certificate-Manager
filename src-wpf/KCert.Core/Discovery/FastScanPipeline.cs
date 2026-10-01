using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace KCert.Core.Discovery
{
    /// <summary>
    /// 2단계 분리형 초고속 인증서 스캔 최적화 파이프라인 (Fast-Pass & Deep-Pass Engine)
    /// </summary>
    /// <remarks>
    /// 1단계(Fast-Pass): 표준 NPKI/GPKI/EPKI 경로만 0.05~0.1초 만에 즉각 스캔하여 사용자 화면을 즉시 갱신
    /// 2단계(Deep-Pass): 비표준 및 보조 저장소를 백그라운드 스레드에서 점진적으로 스캔하여 UI에 병합
    /// </remarks>
    public class FastScanPipeline
    {
        private static readonly string[] KeyPatterns = { "signPri.key", "SignPri.key", "signpri.key", "sigPri.key", "SigPri.key", "envPri.key", "user.key" };

        public TimeSpan LastFastStageDuration { get; private set; } = TimeSpan.Zero;
        public TimeSpan LastDeepStageDuration { get; private set; } = TimeSpan.Zero;

        /// <summary>
        /// [1단계 Fast-Pass] 표준 경로만 병렬 I/O로 즉시 스캔하여 0.1초 내외로 반환합니다.
        /// </summary>
        public async Task<List<DiscoveredCertLocation>> ScanFastAsync(CancellationToken cancellationToken = default)
        {
            var sw = Stopwatch.StartNew();

            var results = await Task.Run(() =>
            {
                var bag = new ConcurrentBag<DiscoveredCertLocation>();
                var fastRoots = CertLocationScanner.GetFastStandardRoots();

                Parallel.ForEach(fastRoots, new ParallelOptions
                {
                    CancellationToken = cancellationToken,
                    MaxDegreeOfParallelism = Math.Max(2, Environment.ProcessorCount)
                }, root =>
                {
                    if (cancellationToken.IsCancellationRequested) return;

                    try
                    {
                        if (!Directory.Exists(root)) return;

                        // 표준 경로는 깊이 3단계 이내에 모두 위치함 (신속 탐색)
                        var derFiles = CertLocationScanner.SafeEnumerateCertFiles(root, cancellationToken, maxDepth: 3);
                        foreach (var der in derFiles)
                        {
                            if (cancellationToken.IsCancellationRequested) break;
                            var loc = BuildDiscoveredLocation(der);
                            if (loc != null)
                            {
                                bag.Add(loc);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"[FastScan Root Skip] {root}: {ex.Message}");
                    }
                });

                return bag.ToList();
            }, cancellationToken);

            sw.Stop();
            LastFastStageDuration = sw.Elapsed;
            return results;
        }

        /// <summary>
        /// [2단계 Deep-Pass] 비표준 및 외장 디스크 심층 경로를 백그라운드에서 병렬 탐색하며,
        /// 새로운 인증서가 발견될 때마다 실시간으로 콜백을 호출합니다.
        /// </summary>
        public async Task<int> ScanDeepBackgroundAsync(
            Action<DiscoveredCertLocation> onCertDiscovered,
            HashSet<string> alreadyFoundDerPaths,
            CancellationToken cancellationToken = default)
        {
            var sw = Stopwatch.StartNew();
            int newCount = 0;

            await Task.Run(() =>
            {
                var deepRoots = CertLocationScanner.GetDeepSearchRoots();
                var seenDers = new ConcurrentDictionary<string, bool>(alreadyFoundDerPaths.ToDictionary(k => k, v => true, StringComparer.OrdinalIgnoreCase));

                Parallel.ForEach(deepRoots, new ParallelOptions
                {
                    CancellationToken = cancellationToken,
                    MaxDegreeOfParallelism = Math.Max(2, Environment.ProcessorCount)
                }, root =>
                {
                    if (cancellationToken.IsCancellationRequested) return;

                    try
                    {
                        if (!Directory.Exists(root)) return;

                        // 비표준 심층 탐색은 maxDepth=5로 설정하여 NPKI/GPKI 중첩 서브디렉터리까지 완벽 탐색
                        var derFiles = CertLocationScanner.SafeEnumerateCertFiles(root, cancellationToken, maxDepth: 5);
                        foreach (var der in derFiles)
                        {
                            if (cancellationToken.IsCancellationRequested) break;

                            var fullDer = Path.GetFullPath(der);
                            if (seenDers.TryAdd(fullDer, true))
                            {
                                var loc = BuildDiscoveredLocation(fullDer);
                                if (loc != null)
                                {
                                    Interlocked.Increment(ref newCount);
                                    onCertDiscovered?.Invoke(loc);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"[DeepScan Root Skip] {root}: {ex.Message}");
                    }
                });
            }, cancellationToken);

            sw.Stop();
            LastDeepStageDuration = sw.Elapsed;
            return newCount;
        }

        /// <summary>
        /// DER 파일 경로로부터 DiscoveredCertLocation 메타데이터 객체를 고속 생성합니다.
        /// </summary>
        public static DiscoveredCertLocation? BuildDiscoveredLocation(string derFilePath)
        {
            try
            {
                var dir = Path.GetDirectoryName(derFilePath) ?? string.Empty;
                var rootDrive = Path.GetPathRoot(derFilePath) ?? string.Empty;
                bool isRemovable = CertLocationScanner.IsRemovableDrive(derFilePath);

                // 매칭되는 개인키 검색 (signPri.key)
                string key = string.Empty;
                foreach (var kp in KeyPatterns)
                {
                    var testKey = Path.Combine(dir, kp);
                    if (File.Exists(testKey))
                    {
                        key = testKey;
                        break;
                    }
                }
                if (string.IsNullOrEmpty(key))
                {
                    try
                    {
                        var anyKeys = Directory.GetFiles(dir, "*.key");
                        key = anyKeys.FirstOrDefault(k => !Path.GetFileName(k).StartsWith("km", StringComparison.OrdinalIgnoreCase))
                           ?? anyKeys.FirstOrDefault()
                           ?? string.Empty;
                    }
                    catch { }
                }

                string category = "NPKI";
                var upper = (derFilePath + " " + dir).ToUpperInvariant();
                if (upper.Contains(@"\GPKI\") || upper.Contains(@"/GPKI/") || upper.Contains(@"\GPKI") || upper.Contains(@"/GPKI"))
                    category = "GPKI";
                else if (upper.Contains(@"\EPKI\") || upper.Contains(@"/EPKI/") || upper.Contains(@"\EPKI") || upper.Contains(@"/EPKI"))
                    category = "EPKI";
                else if (upper.Contains(@"\MPKI\") || upper.Contains(@"/MPKI/"))
                    category = "GPKI";

                return new DiscoveredCertLocation
                {
                    DirectoryPath = dir,
                    DerFilePath = derFilePath,
                    KeyFilePath = !string.IsNullOrEmpty(key) && File.Exists(key) ? key : string.Empty,
                    Category = category,
                    DriveRoot = rootDrive,
                    IsRemovableMedia = isRemovable
                };
            }
            catch
            {
                return null;
            }
        }
    }
}
