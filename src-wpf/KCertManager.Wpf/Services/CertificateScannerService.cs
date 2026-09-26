using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using KCert.Core.Discovery;
using KCert.Core.Parser;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Services
{
    /// <summary>
    /// 2단계 분리형 초고속 인증서 스캐너 서비스 (Fast-Pass: 0.1초 즉시 로딩, Deep-Pass: 백그라운드 실시간 갱신)
    /// </summary>
    public class CertificateScannerService
    {
        private readonly FastScanPipeline _pipeline = new();

        public List<string> GetDefaultSearchPaths()
        {
            return CertLocationScanner.GetStandardRoots();
        }

        /// <summary>
        /// [1단계 Fast-Pass] 표준 경로(LocalLow NPKI/GPKI/EPKI, C:\, 각 드라이브 루트)만 병렬로 고속 탐색하여
        /// 0.05~0.1초 내외로 즉시 인증서 목록을 생성합니다.
        /// </summary>
        public async Task<List<CertificateItem>> ScanFastPassAsync(CancellationToken ct = default)
        {
            var discovered = await _pipeline.ScanFastAsync(ct);
            var results = new ConcurrentBag<CertificateItem>();
            var seenDerPaths = new ConcurrentDictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
            var seenSignatures = new ConcurrentDictionary<string, bool>(StringComparer.OrdinalIgnoreCase);

            Parallel.ForEach(discovered, new ParallelOptions
            {
                CancellationToken = ct,
                MaxDegreeOfParallelism = Math.Max(2, Environment.ProcessorCount)
            }, loc =>
            {
                if (ct.IsCancellationRequested) return;

                var canonicalDer = Path.GetFullPath(loc.DerFilePath);
                if (!seenDerPaths.TryAdd(canonicalDer, true)) return;

                var item = ParseCertificateFile(canonicalDer);
                if (item != null)
                {
                    var dir = Path.GetDirectoryName(canonicalDer) ?? string.Empty;
                    // 동일 디렉터리 내 동일 시리얼/발급대상 중복만 차단하고, 서로 다른 인증서는 모두 등록
                    var sig = $"{dir}|{item.SerialNumber}|{item.SubjectDn}";
                    if (seenSignatures.TryAdd(sig, true))
                    {
                        results.Add(item);
                    }
                }
            });

            return results.ToList();
        }

        /// <summary>
        /// [2단계 Deep-Pass] 비표준 및 외장 디스크 심층 폴더를 백그라운드에서 병렬 탐색하며,
        /// 새로운 인증서가 식별될 때마다 실시간 콜백을 호출합니다. (UI 지연 0%)
        /// </summary>
        public async Task<int> ScanDeepPassBackgroundAsync(
            Action<CertificateItem> onCertFound,
            HashSet<string> existingDerPaths,
            HashSet<string> existingSignatures,
            CancellationToken ct = default)
        {
            var seenDerPaths = new ConcurrentDictionary<string, bool>(
                existingDerPaths.ToDictionary(k => k, v => true, StringComparer.OrdinalIgnoreCase));

            var seenSignatures = new ConcurrentDictionary<string, bool>(
                existingSignatures.ToDictionary(k => k, v => true, StringComparer.OrdinalIgnoreCase));

            return await _pipeline.ScanDeepBackgroundAsync(loc =>
            {
                if (ct.IsCancellationRequested) return;

                var canonicalDer = Path.GetFullPath(loc.DerFilePath);
                if (!seenDerPaths.TryAdd(canonicalDer, true)) return;

                var item = ParseCertificateFile(canonicalDer);
                if (item != null)
                {
                    var dir = Path.GetDirectoryName(canonicalDer) ?? string.Empty;
                    var sig = $"{dir}|{item.SerialNumber}|{item.SubjectDn}";
                    if (seenSignatures.TryAdd(sig, true))
                    {
                        onCertFound?.Invoke(item);
                    }
                }
            }, existingDerPaths, ct);
        }

        public List<CertificateItem> ScanCertificates(IEnumerable<string>? customPaths = null)
        {
            var results = new List<CertificateItem>();
            var searchPaths = new HashSet<string>(customPaths ?? GetDefaultSearchPaths(), StringComparer.OrdinalIgnoreCase);

            var globalSeenDerFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var globalSeenSignatures = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // 병렬 드라이브/루트 탐색 적용
            var derFilesBag = new ConcurrentBag<string>();
            Parallel.ForEach(searchPaths, new ParallelOptions { MaxDegreeOfParallelism = Math.Max(2, Environment.ProcessorCount) }, rootPath =>
            {
                try
                {
                    if (Directory.Exists(rootPath))
                    {
                        var files = CertLocationScanner.SafeEnumerateCertFiles(rootPath, maxDepth: 5);
                        foreach (var f in files) derFilesBag.Add(f);
                    }
                }
                catch { }
            });

            foreach (var derPath in derFilesBag)
            {
                var canonicalDer = Path.GetFullPath(derPath);
                if (globalSeenDerFiles.Contains(canonicalDer)) continue;

                var item = ParseCertificateFile(canonicalDer);
                if (item != null)
                {
                    var dir = Path.GetDirectoryName(canonicalDer) ?? string.Empty;
                    var signature = $"{dir}|{item.SerialNumber}|{item.IssuerName}|{item.SubjectDn}";
                    if (globalSeenSignatures.Contains(signature)) continue;

                    globalSeenDerFiles.Add(canonicalDer);
                    globalSeenSignatures.Add(signature);

                    results.Add(item);
                }
            }

            return results;
        }

        public CertificateItem? ParseCertificateFile(string derFilePath)
        {
            try
            {
                // KCert.Core.Parser의 고속 OID 무결성 파서 엔진 호출
                var meta = KCertParser.Parse(derFilePath);
                if (meta == null) return null;

                // \GPKI\CA\ 또는 \EPKI\CA\ 등 시스템 CA 전용 폴더에 있는 단순 체인 검증용 무키 인증서만 제외하고,
                // class1 폴더 또는 사용자/기관 관리 폴더에 위치한 시스템 CA 및 기관용 공용 인증서는 모두 정상 등록
                var dirUpper = meta.DirectoryPath.ToUpperInvariant();
                bool isDedicatedCaFolder = dirUpper.EndsWith(@"\CA") || dirUpper.EndsWith(@"/CA") ||
                                           dirUpper.Contains(@"\GPKI\CA\") || dirUpper.Contains(@"/GPKI/CA/") ||
                                           dirUpper.Contains(@"\EPKI\CA\") || dirUpper.Contains(@"/EPKI/CA/") ||
                                           dirUpper.EndsWith(@"\ROOT") || dirUpper.EndsWith(@"/ROOT");

                if (meta.IsSystemCa && isDedicatedCaFolder && !meta.HasPrivateKey)
                {
                    return null;
                }

                var rootDrive = Path.GetPathRoot(meta.DerFilePath) ?? string.Empty;
                var driveLetter = rootDrive.TrimEnd('\\');

                var item = new CertificateItem
                {
                    DerFilePath = meta.DerFilePath,
                    KeyFilePath = meta.KeyFilePath,
                    DirectoryPath = meta.DirectoryPath,
                    DerFileSize = meta.DerFileSize,
                    KeyFileSize = meta.KeyFileSize,
                    SubjectDn = meta.SubjectDn,
                    IssuerName = meta.Issuer,
                    CaSignatureName = meta.CaSignatureName,
                    SerialNumber = meta.SerialNumber,
                    NotBefore = meta.ValidFrom,
                    NotAfter = meta.ValidTo,
                    SignatureAlgorithm = meta.SignatureAlgorithm,
                    CommonName = meta.CommonName,
                    Organization = meta.Organization,
                    OrganizationalUnit = meta.OrganizationalUnit,
                    DriveLetter = driveLetter,
                    IsRemovableMedia = meta.IsOnRemovableMedia || CertLocationScanner.IsRemovableDrive(meta.DerFilePath),
                    PolicyUsage = meta.DisplayUsage,
                    PolicyOid = meta.Policy.PolicyOid,
                    IsPairIntegrityValid = meta.IsPairIntegrityValid,
                    IntegrityMessage = meta.IntegrityMessage,
                    IsSystemCa = meta.IsSystemCa,
                    IsInstitutional = meta.IsInstitutional,
                    Category = meta.SystemType switch
                    {
                        CertSystemType.GPKI => CertCategory.GPKI,
                        CertSystemType.EPKI => CertCategory.EPKI,
                        _ => CertCategory.NPKI
                    }
                };

                return item;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Parse Error] {derFilePath}: {ex.Message}");
                return null;
            }
        }
    }
}
