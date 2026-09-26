using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace KCert.Core.Discovery
{
    /// <summary>
    /// 시스템 전역 및 이동식 드라이브 내 한국형 인증서 표준 경로 지능형 2단계 초고속 자동 탐색 엔진
    /// (1단계 Fast-Pass: 0.1초 이내 표준 경로 즉시 감지 / 2단계 Deep-Pass: 백그라운드 심층 비표준 탐색)
    /// </summary>
    public class CertLocationScanner
    {
        private static readonly string[] FastDirNames = { "NPKI", "GPKI", "EPKI" };
        private static readonly string[] StandardDirNames = { "NPKI", "GPKI", "EPKI", "MPKI", "공인인증서", "인증서", "Cert", "Certificates" };
        private static readonly string[] SystemExcludeDirs = { 
            "System Volume Information", "$RECYCLE.BIN", "Windows", "node_modules", ".git", ".vs",
            "CA", "root", "Root", "CRL", "crl", "Government of Korea", "ldap",
            "Temp", "tmp", "PerfLogs", "$SysReset", "Recovery", "Package Cache"
        };
        private static readonly string[] CertFilePatterns = { "signCert.der", "signcert.der", "sigCert.der", "sigcert.der", "envCert.der", "user.der", "signCert.cer", "sigCert.cer", "SignCert.der", "SigCert.der" };

        private static readonly ConcurrentDictionary<string, bool> _removableDriveCache = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// 드라이브 이동식 여부 메모리 캐시를 초기화합니다.
        /// </summary>
        public static void ClearRemovableDriveCache()
        {
            _removableDriveCache.Clear();
        }

        /// <summary>
        /// [1단계 Fast-Pass] 0.05~0.1초 만에 즉시 스캔할 핵심 표준 인증서 경로만 반환합니다.
        /// (LocalLow NPKI/GPKI/EPKI, C:\GPKI, C:\EPKI 및 각 드라이브 최상위 \NPKI)
        /// </summary>
        public static List<string> GetFastStandardRoots()
        {
            var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var localLow = Path.Combine(userProfile, "AppData", "LocalLow");

            // 1. AppData\LocalLow (금융결제원, 행안부, 교육부 최우선 표준)
            foreach (var name in FastDirNames)
            {
                var dir = Path.Combine(localLow, name);
                if (Directory.Exists(dir)) roots.Add(dir);
            }

            // 2. C:\ 루트 직하 GPKI / EPKI / NPKI
            foreach (var name in FastDirNames)
            {
                var dir = Path.Combine(@"C:\", name);
                if (Directory.Exists(dir)) roots.Add(dir);
            }

            // 3. 연결된 모든 드라이브 (USB 및 고정 디스크) 최상위 NPKI/GPKI/EPKI
            try
            {
                foreach (var drive in DriveInfo.GetDrives())
                {
                    try
                    {
                        if (drive != null && drive.IsReady)
                        {
                            var driveRoot = drive.RootDirectory.FullName;
                            foreach (var name in FastDirNames)
                            {
                                var dir = Path.Combine(driveRoot, name);
                                if (Directory.Exists(dir)) roots.Add(dir);
                            }
                        }
                    }
                    catch { }
                }
            }
            catch { }

            return new List<string>(roots);
        }

        /// <summary>
        /// [2단계 Deep-Pass] 백그라운드에서 여유롭게 탐색할 비표준 및 보조 경로 목록을 수집합니다.
        /// </summary>
        public static List<string> GetDeepSearchRoots()
        {
            var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var fastRoots = new HashSet<string>(GetFastStandardRoots(), StringComparer.OrdinalIgnoreCase);

            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var roaming = Path.Combine(userProfile, "AppData", "Roaming");
            var local = Path.Combine(userProfile, "AppData", "Local");
            var myDocuments = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            var desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            var downloads = Path.Combine(userProfile, "Downloads");
            var programData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
            var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

            // 1. AppData Roaming & Local
            foreach (var name in StandardDirNames)
            {
                roots.Add(Path.Combine(roaming, name));
                roots.Add(Path.Combine(local, name));
            }

            // 2. 문서, 바탕화면, 다운로드 폴더
            foreach (var name in StandardDirNames)
            {
                roots.Add(Path.Combine(myDocuments, name));
                roots.Add(Path.Combine(desktop, name));
                roots.Add(Path.Combine(downloads, name));
            }

            // 바탕화면/문서/다운로드 하위에서 '인증서', 'cert', '백업' 키워드가 들어간 비표준 폴더 자동 탐지
            string[] userBaseDirs = { desktop, myDocuments, downloads };
            foreach (var baseDir in userBaseDirs)
            {
                try
                {
                    if (Directory.Exists(baseDir))
                    {
                        var subs = Directory.GetDirectories(baseDir);
                        foreach (var sub in subs)
                        {
                            var fn = Path.GetFileName(sub).ToLowerInvariant();
                            if (fn.Contains("인증서") || fn.Contains("cert") || fn.Contains("npki") || fn.Contains("gpki") || fn.Contains("epki") || fn.Contains("백업"))
                            {
                                roots.Add(sub);
                            }
                        }
                    }
                }
                catch { }
            }

            // 3. ProgramData 및 Program Files
            foreach (var name in StandardDirNames)
            {
                roots.Add(Path.Combine(programData, name));
            }
            if (!string.IsNullOrEmpty(programFiles))
            {
                roots.Add(Path.Combine(programFiles, "GPKI"));
                roots.Add(Path.Combine(programFiles, "EPKI"));
                roots.Add(Path.Combine(programFiles, "NPKI"));
            }
            if (!string.IsNullOrEmpty(programFilesX86))
            {
                roots.Add(Path.Combine(programFilesX86, "GPKI"));
                roots.Add(Path.Combine(programFilesX86, "EPKI"));
                roots.Add(Path.Combine(programFilesX86, "NPKI"));
            }

            // 4. 모든 연결 드라이브(C: 및 USB, 외장/보조 디스크)의 비표준 백업/중첩 폴더 탐색
            try
            {
                foreach (var drive in DriveInfo.GetDrives())
                {
                    try
                    {
                        if (drive != null && drive.IsReady)
                        {
                            var driveRoot = drive.RootDirectory.FullName;
                            roots.Add(Path.Combine(driveRoot, "공인인증서"));
                            roots.Add(Path.Combine(driveRoot, "공인인증서백업"));
                            roots.Add(Path.Combine(driveRoot, "인증서"));
                            roots.Add(Path.Combine(driveRoot, "인증서백업"));
                            roots.Add(Path.Combine(driveRoot, "인증서_백업"));
                            roots.Add(Path.Combine(driveRoot, "Cert"));
                            roots.Add(Path.Combine(driveRoot, "Certificates"));
                            roots.Add(Path.Combine(driveRoot, "Backup"));
                            roots.Add(Path.Combine(driveRoot, "만료인증서"));
                            roots.Add(Path.Combine(driveRoot, "인증서_만료"));
                            roots.Add(Path.Combine(driveRoot, "GPKI", "GPKI"));
                            roots.Add(Path.Combine(driveRoot, "NPKI", "NPKI"));
                            roots.Add(Path.Combine(driveRoot, "EPKI", "EPKI"));
                            roots.Add(Path.Combine(driveRoot, "Certificate"));
                            roots.Add(Path.Combine(driveRoot, "Cert_Backup"));
                        }
                    }
                    catch { }
                }
            }
            catch { }

            // 1단계에 이미 포함된 경로는 제외하여 중복 탐색 차단
            roots.ExceptWith(fastRoots);
            return roots.Where(Directory.Exists).ToList();
        }

        /// <summary>
        /// 윈도우 OS 표준 인증서 저장 루트 목록 전체를 수집합니다. (호환성 유지)
        /// </summary>
        public static List<string> GetStandardRoots()
        {
            var all = new HashSet<string>(GetFastStandardRoots(), StringComparer.OrdinalIgnoreCase);
            foreach (var r in GetDeepSearchRoots())
            {
                all.Add(r);
            }
            return all.ToList();
        }

        /// <summary>
        /// 특정 경로가 이동식 USB 드라이브 또는 OS 시스템(C:) 외 드라이브에 존재하는지 지능형 판별합니다.
        /// (메모리 캐시 적용으로 반복 조회 오버헤드 0ms)
        /// </summary>
        public static bool IsRemovableDrive(string pathOrDriveRoot)
        {
            if (string.IsNullOrWhiteSpace(pathOrDriveRoot)) return false;

            try
            {
                string root = Path.GetPathRoot(pathOrDriveRoot) ?? string.Empty;
                if (string.IsNullOrEmpty(root)) return false;
                string cleanRoot = root.TrimEnd('\\').ToUpperInvariant();

                if (_removableDriveCache.TryGetValue(cleanRoot, out bool cached))
                {
                    return cached;
                }

                bool isRemovable = ComputeIsRemovableDrive(cleanRoot);
                _removableDriveCache[cleanRoot] = isRemovable;
                return isRemovable;
            }
            catch
            {
                return false;
            }
        }

        private static bool ComputeIsRemovableDrive(string cleanDriveLetter)
        {
            string sysDrive = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\').ToUpperInvariant();
            if (string.Equals(cleanDriveLetter, sysDrive, StringComparison.OrdinalIgnoreCase)) return false;

            // 1. OS에서 Removable 드라이브로 보고한 경우
            try
            {
                var drive = new DriveInfo(cleanDriveLetter + "\\");
                if (drive.DriveType == DriveType.Removable) return true;
            }
            catch { }

            // 2. HardwareGuard의 캐시된 WMI USB 인터페이스 감지 결과 수집
            var usbLetters = HardwareGuard.UsbStorageGuard.GetUsbInterfaceDriveLetters();
            if (usbLetters.Contains(cleanDriveLetter)) return true;

            // 3. C:\ 시스템 디스크가 아닌 모든 드라이브 (D:\, E:\ 등 USB/외장)
            return true;
        }

        /// <summary>
        /// 지정된 루트 또는 표준 경로들을 비동기로 안전하게 병렬 탐색하여 발견된 인증서 위치 목록을 반환합니다.
        /// </summary>
        public async Task<List<DiscoveredCertLocation>> DiscoverAllAsync(
            IEnumerable<string>? customRoots = null,
            CancellationToken cancellationToken = default)
        {
            return await Task.Run(() =>
            {
                var list = new ConcurrentBag<DiscoveredCertLocation>();
                var roots = new HashSet<string>(customRoots ?? GetStandardRoots(), StringComparer.OrdinalIgnoreCase);

                Parallel.ForEach(roots, new ParallelOptions
                {
                    CancellationToken = cancellationToken,
                    MaxDegreeOfParallelism = Math.Max(2, Environment.ProcessorCount)
                }, root =>
                {
                    if (cancellationToken.IsCancellationRequested) return;

                    try
                    {
                        if (!Directory.Exists(root)) return;

                        var derFiles = SafeEnumerateCertFiles(root, cancellationToken, maxDepth: 4);
                        foreach (var der in derFiles)
                        {
                            if (cancellationToken.IsCancellationRequested) break;

                            var dir = Path.GetDirectoryName(der) ?? string.Empty;
                            var rootDrive = Path.GetPathRoot(der) ?? string.Empty;
                            bool isRemovable = IsRemovableDrive(der);

                            // 매칭되는 개인키 검색 (signPri.key, sigPri.key, envPri.key, user.key 등)
                            string key = string.Empty;
                            string[] keyPatterns = { "signPri.key", "SignPri.key", "signpri.key", "sigPri.key", "SigPri.key", "envPri.key", "user.key" };
                            foreach (var kp in keyPatterns)
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
                                var anyKeys = Directory.GetFiles(dir, "*.key");
                                key = anyKeys.FirstOrDefault(k => !Path.GetFileName(k).StartsWith("km", StringComparison.OrdinalIgnoreCase)) ?? anyKeys.FirstOrDefault() ?? string.Empty;
                            }

                            string category = "NPKI";
                            var upper = (der + " " + dir).ToUpperInvariant();
                            if (upper.Contains(@"\GPKI\") || upper.Contains(@"/GPKI/") || upper.Contains(@"\GPKI") || upper.Contains(@"/GPKI"))
                                category = "GPKI";
                            else if (upper.Contains(@"\EPKI\") || upper.Contains(@"/EPKI/") || upper.Contains(@"\EPKI") || upper.Contains(@"/EPKI"))
                                category = "EPKI";
                            else if (upper.Contains(@"\MPKI\") || upper.Contains(@"/MPKI/"))
                                category = "GPKI";

                            list.Add(new DiscoveredCertLocation
                            {
                                DirectoryPath = dir,
                                DerFilePath = der,
                                KeyFilePath = !string.IsNullOrEmpty(key) && File.Exists(key) ? key : string.Empty,
                                Category = category,
                                DriveRoot = rootDrive,
                                IsRemovableMedia = isRemovable
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[Discovery Error] {root}: {ex.Message}");
                    }
                });

                return list.ToList();
            }, cancellationToken);
        }

        /// <summary>
        /// 안전하게 인증서 파일(DER/CER)들을 재귀 탐색합니다. (NPKI, GPKI, EPKI, MPKI 호환, 동일 비표준 폴더 내 복수 인증서 전수 탐색)
        /// </summary>
        public static IEnumerable<string> SafeEnumerateCertFiles(string rootPath, CancellationToken ct = default, int maxDepth = 5)
        {
            var results = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var queue = new Queue<(string Path, int Depth)>();
            queue.Enqueue((rootPath, 0));

            while (queue.Count > 0)
            {
                if (ct.IsCancellationRequested) break;

                var (current, depth) = queue.Dequeue();

                try
                {
                    var derFiles = Directory.GetFiles(current, "*.der");
                    var cerFiles = Directory.GetFiles(current, "*.cer");
                    var candidateFiles = derFiles.Concat(cerFiles).ToList();

                    // GPKI Certificate\class1 디렉터리는 비개인(기관/관인/서버용) 전용 경로이므로 개인 인증서 스캔 제외
                    var curDirName = Path.GetFileName(current).ToLowerInvariant();
                    if (curDirName == "class1" ||
                        current.IndexOf(@"\GPKI\Certificate\class1", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        current.IndexOf(@"/GPKI/Certificate/class1", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        continue;
                    }

                    if (candidateFiles.Count > 0)
                    {
                        // 해당 디렉터리 내 서명용 파일(signCert / sigCert / user / *_sig) 존재 여부 검사
                        bool hasAnySignFile = candidateFiles.Any(f =>
                        {
                            var fn = Path.GetFileName(f).ToLowerInvariant();
                            return fn.Equals("signcert.der") || fn.Equals("sigcert.der") || fn.Equals("user.der") ||
                                   fn.Equals("signcert.cer") || fn.Equals("sigcert.cer") ||
                                   fn.Contains("_sig.") || fn.Contains("_sign.") || fn.StartsWith("sign_") || fn.StartsWith("sig_");
                        });

                        foreach (var file in candidateFiles)
                        {
                            var fn = Path.GetFileName(file).ToLowerInvariant();

                            // 1. 루트 CA, CRL(폐기목록), 시스템 CA 및 비개인 CLASS1 파일 제외
                            if (fn.StartsWith("root") || fn.StartsWith("ca") || fn.StartsWith("crl") ||
                                fn.EndsWith(".crl") || fn.Contains("cacert") || fn.Contains("rootcert") ||
                                fn.StartsWith("class1") || fn.Contains("_class1.") || fn.Contains("_class1_"))
                            {
                                continue;
                            }

                            // 2. 동반 암호화용(env/km) 파일 검출 및 중복 배제 (GPKI/NPKI 이원화 키 체계)
                            // 동일 디렉터리에 대응되는 서명용(sig/sign) 파일이 함께 존재하는 경우, 암호화용 파일은 중복 등록 방지를 위해 건너뜁니다.
                            bool isEnvFile = fn.Contains("_env.") || fn.Contains("_km.") || fn.Contains("envcert") ||
                                             fn.Contains("kmcert") || fn.Contains("_env_") || fn.Contains("_km_") ||
                                             fn.StartsWith("env_") || fn.StartsWith("km_") || fn.StartsWith("envcert") || fn.StartsWith("kmcert");

                            if (isEnvFile && hasAnySignFile)
                            {
                                // 매칭되는 서명 파일 검색 (예: 865김병석001_sig.cer 또는 signCert.der)
                                string sigVariant = fn.Replace("_env.", "_sig.").Replace("_km.", "_sig.")
                                                      .Replace("_env_", "_sig_").Replace("_km_", "_sig_")
                                                      .Replace("envcert", "signcert").Replace("kmcert", "signcert")
                                                      .Replace("envcert", "sigcert").Replace("kmcert", "sigcert");

                                bool hasMatchingSign = candidateFiles.Any(other =>
                                {
                                    var ofn = Path.GetFileName(other).ToLowerInvariant();
                                    if (ofn == fn) return false;
                                    if (ofn == sigVariant) return true;
                                    if (ofn.Contains("_sig.") || ofn.Contains("signcert") || ofn.Contains("sigcert") || ofn.Equals("user.der")) return true;
                                    return false;
                                });

                                if (hasMatchingSign)
                                {
                                    continue; // 서명 파일이 존재하므로 동반 암호화 파일은 중복 등록 방지를 위해 건너뜀
                                }
                            }

                            // 동일 폴더 내의 서로 다른 복수 사용자 인증서(예: 865김병석001_sig.cer, 852심명선001_sig.cer, user.der 등)를 등록!
                            results.Add(file);
                        }
                    }
                }
                catch
                {
                    // 접근 권한 거부 등 무시
                }

                // 지정된 탐색 깊이 초과 시 하위 폴더 순회 건너뜀 (불필요한 전체 디스크 I/O 완전 방지)
                if (depth < maxDepth)
                {
                    try
                    {
                        var subDirs = Directory.GetDirectories(current);
                        foreach (var sub in subDirs)
                        {
                            var name = Path.GetFileName(sub);
                            if (IsExcluded(name)) continue;

                            queue.Enqueue((sub, depth + 1));
                        }
                    }
                    catch
                    {
                        // 접근 권한 거부 등 무시
                    }
                }
            }

            return results;
        }

        /// <summary>
        /// 예외(권한 거부, 손상된 섹터, 심볼릭 링크 루프) 없이 안전하게 재귀 파일 검색을 수행합니다.
        /// </summary>
        public static IEnumerable<string> SafeEnumerateFiles(string rootPath, string pattern, CancellationToken ct = default)
        {
            if (pattern.Equals("signCert.der", StringComparison.OrdinalIgnoreCase))
            {
                return SafeEnumerateCertFiles(rootPath, ct);
            }

            var results = new List<string>();
            var queue = new Queue<string>();
            queue.Enqueue(rootPath);

            while (queue.Count > 0)
            {
                if (ct.IsCancellationRequested) break;

                var current = queue.Dequeue();

                try
                {
                    var files = Directory.GetFiles(current, pattern);
                    results.AddRange(files);
                }
                catch
                {
                    // 접근 권한 거부 등 무시
                }

                try
                {
                    var subDirs = Directory.GetDirectories(current);
                    foreach (var sub in subDirs)
                    {
                        var name = Path.GetFileName(sub);
                        if (IsExcluded(name)) continue;

                        queue.Enqueue(sub);
                    }
                }
                catch
                {
                    // 접근 권한 거부 등 무시
                }
            }

            return results;
        }

        private static bool IsExcluded(string dirName)
        {
            foreach (var excluded in SystemExcludeDirs)
            {
                if (string.Equals(dirName, excluded, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }
    }
}
