using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
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
            Action<CertificateItem>? onCertFound,
            HashSet<string>? existingDerPaths,
            HashSet<string>? existingSignatures,
            CancellationToken ct = default)
        {
            var seenDerPaths = new ConcurrentDictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
            if (existingDerPaths != null)
            {
                foreach (var p in existingDerPaths)
                {
                    if (string.IsNullOrWhiteSpace(p)) continue;
                    try
                    {
                        seenDerPaths.TryAdd(Path.GetFullPath(p), true);
                    }
                    catch
                    {
                        seenDerPaths.TryAdd(p, true);
                    }
                }
            }

            var seenSignatures = new ConcurrentDictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
            if (existingSignatures != null)
            {
                foreach (var s in existingSignatures)
                {
                    if (!string.IsNullOrWhiteSpace(s))
                    {
                        seenSignatures.TryAdd(s, true);
                    }
                }
            }

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

                // 사용자 관리 인증서 목록에는 실제 사용자 이름(개인) 또는 기관이름(법인/공공기관)이 유효한 인증서만 표시합니다.
                // 인증서 발급 대행 회사 정보(INIPASS CA, yessignCA, SignKorea CA, CrossCertCA, signGATE CA, KISA RootCA 등)의 무키 CA/중계/루트 인증서는
                // 사용자가 소유한 인증서가 아니므로 목록에서 완전히 제외합니다.
                bool isDedicatedCaFolder = Regex.IsMatch(
                    meta.DirectoryPath ?? string.Empty,
                    @"[\\/](?:CA|ROOT)$|[\\/](?:GPKI|EPKI)[\\/]CA(?:$|[\\/])",
                    RegexOptions.IgnoreCase);

                bool isCaVendorCompanyCert = meta.IsSystemCa ||
                                            meta.CommonName.StartsWith("INIPASS", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("yessign", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("SignKorea", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("CrossCert", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("signGATE", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("KICA", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("TradeSign", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("CertRSA", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("KISA Root", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("GPKIRoot", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("EPKIRoot", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("CA134", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("CA974", StringComparison.OrdinalIgnoreCase) ||
                                            meta.CommonName.StartsWith("CA128", StringComparison.OrdinalIgnoreCase) ||
                                            meta.SubjectDn.Contains("OU=LicensedCA", StringComparison.OrdinalIgnoreCase) ||
                                            (meta.Issuer.Contains("KISA RootCA", StringComparison.OrdinalIgnoreCase) && !meta.HasPrivateKey);

                if (!meta.HasPrivateKey && (isCaVendorCompanyCert || isDedicatedCaFolder))
                {
                    return null;
                }

                // GPKI/EPKI class1 경로는 개인키(.key)와 쌍을 이루는 실사용 기관/특수목적 인증서만 목록에 표시 (Root/CA/공개키 전용 제외)
                if (meta.IsClass1 && (!meta.HasPrivateKey || meta.IsSystemCa))
                {
                    return null;
                }

                string metaDir = meta.DirectoryPath ?? string.Empty;
                string metaDer = meta.DerFilePath ?? derFilePath;
                var rootDrive = Path.GetPathRoot(metaDer) ?? string.Empty;
                var driveLetter = rootDrive.TrimEnd('\\');

                var item = new CertificateItem
                {
                    DerFilePath = metaDer,
                    KeyFilePath = meta.KeyFilePath ?? string.Empty,
                    DirectoryPath = metaDir,
                    DerFileSize = meta.DerFileSize,
                    KeyFileSize = meta.KeyFileSize,
                    SubjectDn = meta.SubjectDn ?? string.Empty,
                    IssuerName = meta.Issuer ?? string.Empty,
                    CaSignatureName = meta.CaSignatureName ?? string.Empty,
                    SerialNumber = meta.SerialNumber ?? string.Empty,
                    NotBefore = meta.ValidFrom,
                    NotAfter = meta.ValidTo,
                    SignatureAlgorithm = meta.SignatureAlgorithm ?? "sha256RSA",
                    PublicKeyAlgorithm = meta.PublicKeyAlgorithm ?? "RSA",
                    PublicKeyBitLength = meta.PublicKeyBitLength > 0 ? meta.PublicKeyBitLength : 2048,
                    SecurityPosture = meta.SecurityPosture,
                    CommonName = meta.CommonName ?? string.Empty,
                    Organization = meta.Organization ?? string.Empty,
                    OrganizationalUnit = meta.OrganizationalUnit ?? string.Empty,
                    DriveLetter = driveLetter,
                    IsRemovableMedia = meta.IsOnRemovableMedia || CertLocationScanner.IsRemovableDrive(metaDer),
                    PolicyUsage = meta.DisplayUsage ?? "일반 공동인증서",
                    PolicyOid = meta.Policy.PolicyOid ?? string.Empty,
                    IsPairIntegrityValid = meta.IsPairIntegrityValid,
                    IntegrityMessage = meta.IntegrityMessage ?? string.Empty,
                    KeyEncryptionAlgorithm = meta.KeyInfo?.AlgorithmName ?? (meta.HasPrivateKey ? "KISA SEED-CBC" : "개인키 없음"),
                    KdfIterations = meta.KeyInfo?.IterationCount ?? 2048,
                    IsSystemCa = meta.IsSystemCa,
                    IsInstitutional = meta.IsInstitutional,
                    IsClass1 = meta.IsClass1,
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
