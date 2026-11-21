using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
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
            "Temp", "tmp", "PerfLogs", "$SysReset", "Recovery", "Package Cache",
            "CatRoot", "Windows Kits", "WindowsPhone", "OEM", "ESD"
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
        /// 실제 공공 업무 환경에서 거의 사용되지 않는 AppData\LocalLow\GPKI 경로의 탐색 제외 여부 (기본값: true - 탐색 제외)
        /// (공무원 행정전자서명 GPKI 공식 표준은 C:\GPKI\Certificate\class2)
        /// </summary>
        public static bool ExcludeLocalLowGpkiScan { get; set; } = true;

        /// <summary>
        /// 드라이브가 인증서 스캔 대상(로컬 고정 디스크 또는 이동식 USB/메모리 카드)인지 DriveType 및 Win32 API로 고속 판별합니다.
        /// (네트워크 SMB 드라이브, CD-ROM, RAM 디스크, 미연결 슬롯 차단)
        /// </summary>
        public static bool IsScannableDriveType(DriveInfo? drive)
        {
            if (drive == null) return false;
            try
            {
                var dt = drive.DriveType;
                if (dt != DriveType.Fixed && dt != DriveType.Removable) return false;

                var root = drive.RootDirectory.FullName;
                uint win32Type = HardwareGuard.NativeStorageInterop.GetDriveType(root);
                return win32Type == HardwareGuard.NativeStorageInterop.DRIVE_FIXED ||
                       win32Type == HardwareGuard.NativeStorageInterop.DRIVE_REMOVABLE;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// 느리거나 응답 없는 외부/카드리더 드라이브의 IsReady 확인이 앱 전체를 멈추지 않도록 제한 시간 내에만 검사합니다.
        /// </summary>
        private static bool IsDriveReadyBounded(DriveInfo drive, int timeoutMs = 1200)
        {
            try
            {
                string sysDrive = Path.GetPathRoot(Environment.SystemDirectory) ?? @"C:\";
                if (string.Equals(drive.RootDirectory.FullName, sysDrive, StringComparison.OrdinalIgnoreCase))
                {
                    return drive.IsReady;
                }

                var probeTask = Task.Run(() =>
                {
                    try { return drive.IsReady; }
                    catch { return false; }
                });

                return probeTask.Wait(timeoutMs) && probeTask.Result;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// [0단계 Local Fast-Pass] 네트워크나 외부 드라이브 열거 없이 0.01초 만에 스캔할 로컬 PC 핵심 표준 경로만 반환합니다.
        /// (AppData\LocalLow NPKI/EPKI, C:\GPKI, C:\EPKI, C:\NPKI)
        /// </summary>
        public static List<string> GetLocalProfileFastRoots()
        {
            var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var localLow = Path.Combine(userProfile, "AppData", "LocalLow");

            // 1. AppData\LocalLow (금융결제원, 행안부, 교육부 최우선 표준)
            foreach (var name in FastDirNames)
            {
                if (name.Equals("GPKI", StringComparison.OrdinalIgnoreCase) && ExcludeLocalLowGpkiScan)
                {
                    continue;
                }

                var dir = Path.Combine(localLow, name);
                try
                {
                    if (Directory.Exists(dir)) roots.Add(dir);
                }
                catch { }
            }

            // 2. 시스템 드라이브(C:\ 등) 루트 직하 GPKI / EPKI / NPKI
            var systemDriveRoot = Path.GetPathRoot(Environment.SystemDirectory) ?? @"C:\";
            foreach (var name in FastDirNames)
            {
                var dir = Path.Combine(systemDriveRoot, name);
                try
                {
                    if (Directory.Exists(dir)) roots.Add(dir);
                }
                catch { }
            }

            return new List<string>(roots);
        }

        /// <summary>
        /// 연결된 로컬 보조 및 이동식 USB 드라이브(네트워크/CD-ROM 제외)의 최상위 \NPKI, \GPKI, \EPKI 경로를 제한 시간 보호와 함께 수집합니다.
        /// </summary>
        public static List<string> GetDriveFastRoots(int perDriveTimeoutMs = 1200)
        {
            var roots = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);

            try
            {
                var scannableDrives = DriveInfo.GetDrives().Where(IsScannableDriveType).ToList();
                var probeTasks = scannableDrives.Select(drive => Task.Run(() =>
                {
                    try
                    {
                        var singleTask = Task.Run(() =>
                        {
                            try
                            {
                                var driveRoot = drive.RootDirectory.FullName;
                                var details = HardwareGuard.NativeStorageInterop.QueryDriveDetails(driveRoot.TrimEnd('\\'));
                                if (details != null && details.IsOpticalOrCdRom) return;

                                if (!drive.IsReady) return;
                                foreach (var name in FastDirNames)
                                {
                                    var dir = Path.Combine(driveRoot, name);
                                    if (Directory.Exists(dir)) roots.TryAdd(dir, 0);
                                }
                            }
                            catch { }
                        });

                        singleTask.Wait(perDriveTimeoutMs);
                    }
                    catch { }
                })).ToArray();

                Task.WaitAll(probeTasks, Math.Max(perDriveTimeoutMs + 300, 1500));
            }
            catch { }

            return new List<string>(roots.Keys);
        }

        /// <summary>
        /// [1단계 Fast-Pass] 0.05~0.1초 만에 즉시 스캔할 핵심 표준 인증서 경로만 반환합니다.
        /// (LocalLow NPKI/EPKI, C:\GPKI, C:\EPKI 및 각 준비된 드라이브 최상위 \NPKI)
        /// </summary>
        public static List<string> GetFastStandardRoots()
        {
            var roots = new HashSet<string>(GetLocalProfileFastRoots(), StringComparer.OrdinalIgnoreCase);
            foreach (var dir in GetDriveFastRoots())
            {
                roots.Add(dir);
            }
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

            // 4. 모든 연결 드라이브(C: 및 USB, 외장/보조 디스크; 네트워크/CD-ROM 제외)의 비표준 백업/중첩 폴더 탐색
            try
            {
                foreach (var drive in DriveInfo.GetDrives())
                {
                    try
                    {
                        if (!IsScannableDriveType(drive)) continue;
                        if (!IsDriveReadyBounded(drive, 1200)) continue;

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
                    catch { }
                }
            }
            catch { }

            // 1단계에 이미 포함된 경로는 제외하여 중복 탐색 차단
            roots.ExceptWith(fastRoots);
            return roots.Where(r =>
            {
                try { return Directory.Exists(r); }
                catch { return false; }
            }).ToList();
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
        /// 지정된 경로가 윈도우 OS/한국 금융/행정 표준 인증서 저장 위치인지 검사합니다.
        /// (참고: AppData\LocalLow\GPKI는 실무에서 쓰이지 않는 비권장 경로로 표준에서 제외됩니다)
        /// </summary>
        public static bool IsStandardPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return false;
            try
            {
                var normPath = Path.GetFullPath(path).Replace('/', '\\').TrimEnd('\\');
                var upper = normPath.ToUpperInvariant();

                // 1. 중첩 폴더(복사 오류) 또는 백업/임시 폴더는 명백한 비표준
                if (Regex.IsMatch(upper, @"\\(?:GPKI\\GPKI|NPKI\\NPKI|EPKI\\EPKI|GPKI\\BACKUP|NPKI\\BACKUP|EPKI\\BACKUP|BACKUP\\NPKI|인증서|백업|TEMP)(?:$|\\)"))
                {
                    return false;
                }

                // 2. AppData\LocalLow\GPKI는 공무원 행정전자서명(GPKI) 정부 공식 표준(C:\GPKI\Certificate\class2)이 아니며
                // 실무 행정망(온-나라, 새올 등)에서 미인식되는 예외 경로이므로 표준에서 제외
                if (Regex.IsMatch(upper, @"\\APPDATA\\LOCALLOW\\GPKI(?:$|\\)"))
                {
                    return false;
                }

                // 3. AppData\LocalLow (금융결제원 NPKI, 교육부 EPKI 표준) - 경로 경계 포함
                if (Regex.IsMatch(upper, @"\\APPDATA\\LOCALLOW\\(?:NPKI|EPKI)(?:$|\\)"))
                {
                    return true;
                }

                // 4. GPKI / EPKI 공식 표준 ([드라이브]:\GPKI\Certificate 또는 [드라이브]:\EPKI\Certificate)
                if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"^[A-Z]:\\(GPKI|EPKI)\\CERTIFICATE($|\\)"))
                {
                    return true;
                }

                // 5. NPKI 이동식 USB 표준 ([USB]:\NPKI) 또는 비-시스템 드라이브(D:, E: 등) 루트 \NPKI 표준 (시스템 드라이브 C:\NPKI는 비표준)
                var sysDrive = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\');
                bool isNonSystemDrive = normPath.Length >= 2 && normPath[1] == ':' &&
                                        !normPath.Substring(0, 2).Equals(sysDrive, StringComparison.OrdinalIgnoreCase);
                if ((IsRemovableDrive(normPath) || isNonSystemDrive) &&
                    System.Text.RegularExpressions.Regex.IsMatch(upper, @"^[A-Z]:\\NPKI($|\\)"))
                {
                    return true;
                }
            }
            catch { }
            return false;
        }

        /// <summary>
        /// 경로가 실무 환경에서 거의 사용되지 않는 예외 경로(AppData\LocalLow\GPKI)인지 검사합니다.
        /// </summary>
        public static bool IsRareLocalLowGpkiPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return false;
            var upper = path.Replace('/', '\\').ToUpperInvariant();
            return Regex.IsMatch(upper, @"\\APPDATA\\LOCALLOW\\GPKI(?:$|\\)");
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

            // 1. OS 드라이브 타입 판별 (Network, CDRom, Ram, NoRootDirectory 우선 배제)
            try
            {
                var drive = new DriveInfo(cleanDriveLetter + "\\");
                var dt = drive.DriveType;
                if (dt != DriveType.Fixed && dt != DriveType.Removable) return false;

                uint win32Type = HardwareGuard.NativeStorageInterop.GetDriveType(cleanDriveLetter + "\\");
                if (win32Type != HardwareGuard.NativeStorageInterop.DRIVE_FIXED &&
                    win32Type != HardwareGuard.NativeStorageInterop.DRIVE_REMOVABLE)
                {
                    return false;
                }

                var details = HardwareGuard.NativeStorageInterop.QueryDriveDetails(cleanDriveLetter);
                if (details != null && details.IsOpticalOrCdRom) return false;
                if (details != null && details.IsUsb) return true;

                if (dt == DriveType.Removable) return true;

                if (drive.IsReady)
                {
                    string fmt = (drive.DriveFormat ?? "").ToUpperInvariant();
                    if (fmt == "CDFS" || fmt == "UDF" || fmt == "ISO9660") return false;
                }
            }
            catch { }

            // 2. HardwareGuard의 캐시된 WMI USB 인터페이스 감지 결과 수집
            var usbLetters = HardwareGuard.UsbStorageGuard.GetUsbInterfaceDriveLetters();
            if (usbLetters.Contains(cleanDriveLetter)) return true;

            // 3. 그 외 드라이브는 로컬 디스크로 판정
            return false;
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

                            // 매칭되는 개인키 검색 (다중 인증서 혼재 class1 폴더 스템 매칭 우선 지원)
                            string key = FindMatchingPrivateKey(der);

                            string category = "NPKI";
                            if (Regex.IsMatch(der, @"(?:^|[\\/])(?:GPKI|MPKI)(?:$|[\\/])", RegexOptions.IgnoreCase) ||
                                Regex.IsMatch(dir, @"(?:^|[\\/])(?:GPKI|MPKI)(?:$|[\\/])", RegexOptions.IgnoreCase))
                                category = "GPKI";
                            else if (Regex.IsMatch(der, @"(?:^|[\\/])EPKI(?:$|[\\/])", RegexOptions.IgnoreCase) ||
                                     Regex.IsMatch(dir, @"(?:^|[\\/])EPKI(?:$|[\\/])", RegexOptions.IgnoreCase))
                                category = "EPKI";

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
        public static IEnumerable<string> SafeEnumerateCertFiles(string rootPath, CancellationToken ct = default, int maxDepth = 5, int maxDirectories = 3000)
        {
            var results = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(rootPath)) return results;

            var visitedDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var queue = new Queue<(string Path, int Depth)>();

            try
            {
                var fullRoot = Path.GetFullPath(rootPath);
                visitedDirs.Add(fullRoot);
                queue.Enqueue((fullRoot, 0));
            }
            catch
            {
                visitedDirs.Add(rootPath);
                queue.Enqueue((rootPath, 0));
            }

            while (queue.Count > 0)
            {
                if (ct.IsCancellationRequested) break;

                var (current, depth) = queue.Dequeue();

                // GPKI / EPKI class1 디렉터리도 스캔 대상에 포함하되, 후속 파서 단계에서 개인키(.key) 쌍이 확인된 기관 인증서만 선별 노출합니다.
                try
                {
                    var derFiles = Directory.GetFiles(current, "*.der");
                    var cerFiles = Directory.GetFiles(current, "*.cer");
                    var candidateFiles = derFiles.Concat(cerFiles).ToList();

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

                            // 1. 루트 CA, CRL(폐기목록), 시스템 CA 공개키 파일 제외
                            if (fn.StartsWith("root") || IsCaSystemFileName(fn) || fn.StartsWith("crl") ||
                                fn.EndsWith(".crl") || fn.Contains("cacert") || fn.Contains("rootcert"))
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
                                // 매칭되는 동일 스템/접두사 서명 파일 검색 (타 기관 _sig 파일에 의한 오탐 차단)
                                bool isGenericEnvName = fn.StartsWith("kmcert") || fn.StartsWith("envcert") ||
                                                        fn.Equals("km.der") || fn.Equals("km.cer") ||
                                                        fn.Equals("env.der") || fn.Equals("env.cer");

                                string sigVariant1 = fn.Replace("_env.", "_sig.").Replace("_km.", "_sig.")
                                                       .Replace("_env_", "_sig_").Replace("_km_", "_sig_")
                                                       .Replace("env_", "sign_").Replace("km_", "sign_")
                                                       .Replace("envcert", "signcert").Replace("kmcert", "signcert");
                                string sigVariant2 = fn.Replace("_env.", "_sign.").Replace("_km.", "_sign.")
                                                       .Replace("_env_", "_sign_").Replace("_km_", "_sign_")
                                                       .Replace("env_", "sig_").Replace("km_", "sig_")
                                                       .Replace("envcert", "sigcert").Replace("kmcert", "sigcert");

                                bool hasMatchingSign = candidateFiles.Any(other =>
                                {
                                    var ofn = Path.GetFileName(other).ToLowerInvariant();
                                    if (ofn == fn) return false;
                                    if (ofn == sigVariant1 || ofn == sigVariant2) return true;
                                    if (isGenericEnvName &&
                                        (ofn.Equals("signcert.der") || ofn.Equals("signcert.cer") ||
                                         ofn.Equals("sigcert.der") || ofn.Equals("sigcert.cer") ||
                                         ofn.Equals("user.der") || ofn.Contains("_sig.") || ofn.Contains("_sign.")))
                                    {
                                        return true;
                                    }
                                    return false;
                                });

                                if (hasMatchingSign)
                                {
                                    continue; // 대응되는 서명 파일이 존재하므로 동반 암호화 파일은 중복 등록 방지를 위해 건너뜀
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

                // 지정된 탐색 깊이 및 디렉터리 안전 상한 초과 시 하위 폴더 순회 건너뜀
                if (depth < maxDepth && visitedDirs.Count < maxDirectories)
                {
                    try
                    {
                        var subDirs = Directory.GetDirectories(current);
                        foreach (var sub in subDirs)
                        {
                            if (ct.IsCancellationRequested || visitedDirs.Count >= maxDirectories) break;

                            var name = Path.GetFileName(sub);
                            if (IsExcluded(name)) continue;

                            try
                            {
                                // 심볼릭 링크/정션 포인트 무한 순환 루프 차단
                                if ((File.GetAttributes(sub) & FileAttributes.ReparsePoint) != 0)
                                {
                                    continue;
                                }

                                string fullSub = Path.GetFullPath(sub);
                                if (visitedDirs.Add(fullSub))
                                {
                                    queue.Enqueue((fullSub, depth + 1));
                                }
                            }
                            catch { }
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
        public static IEnumerable<string> SafeEnumerateFiles(string rootPath, string pattern, CancellationToken ct = default, int maxDepth = 6, int maxDirectories = 3000)
        {
            if (pattern.Equals("signCert.der", StringComparison.OrdinalIgnoreCase))
            {
                return SafeEnumerateCertFiles(rootPath, ct, maxDepth: maxDepth, maxDirectories: maxDirectories);
            }

            var results = new List<string>();
            if (string.IsNullOrWhiteSpace(rootPath)) return results;

            var visitedDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var queue = new Queue<(string Path, int Depth)>();

            try
            {
                var fullRoot = Path.GetFullPath(rootPath);
                visitedDirs.Add(fullRoot);
                queue.Enqueue((fullRoot, 0));
            }
            catch
            {
                visitedDirs.Add(rootPath);
                queue.Enqueue((rootPath, 0));
            }

            while (queue.Count > 0)
            {
                if (ct.IsCancellationRequested) break;

                var (current, depth) = queue.Dequeue();

                try
                {
                    var files = Directory.GetFiles(current, pattern);
                    results.AddRange(files);
                }
                catch
                {
                    // 접근 권한 거부 등 무시
                }

                if (depth < maxDepth && visitedDirs.Count < maxDirectories)
                {
                    try
                    {
                        var subDirs = Directory.GetDirectories(current);
                        foreach (var sub in subDirs)
                        {
                            if (ct.IsCancellationRequested || visitedDirs.Count >= maxDirectories) break;

                            var name = Path.GetFileName(sub);
                            if (IsExcluded(name)) continue;

                            try
                            {
                                if ((File.GetAttributes(sub) & FileAttributes.ReparsePoint) != 0)
                                {
                                    continue;
                                }

                                string fullSub = Path.GetFullPath(sub);
                                if (visitedDirs.Add(fullSub))
                                {
                                    queue.Enqueue((fullSub, depth + 1));
                                }
                            }
                            catch { }
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
        /// 주어진 인증서 DER/CER 파일과 쌍을 이루는 개인키(.key/.pri) 경로를 스템 매칭 우선으로 탐색합니다.
        /// 단일 폴더에 다수의 class1 기관/서버 인증서가 혼재한 경우에도 교차 오매칭을 방지합니다.
        /// </summary>
        public static string FindMatchingPrivateKey(string derFilePath)
        {
            if (string.IsNullOrWhiteSpace(derFilePath)) return string.Empty;
            var dir = Path.GetDirectoryName(derFilePath) ?? string.Empty;
            if (string.IsNullOrEmpty(dir) || !Directory.Exists(dir)) return string.Empty;

            var fileName = Path.GetFileName(derFilePath);
            var stem = Path.GetFileNameWithoutExtension(fileName);
            var lowerFileName = fileName.ToLowerInvariant();
            bool isKmCert = lowerFileName.StartsWith("km") || lowerFileName.Contains("_km.") || lowerFileName.Contains("_env.") || lowerFileName.StartsWith("env");

            try
            {
                var allKeyFiles = Directory.GetFiles(dir, "*.key")
                    .Concat(Directory.GetFiles(dir, "*.pri"))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (allKeyFiles.Count == 0) return string.Empty;

                // 1. 동일 스템 직접 매칭 (예: 865기관_sig.cer -> 865기관_sig.key, SVR134_sig.der -> SVR134_sig.key)
                var directMatch = allKeyFiles.FirstOrDefault(k =>
                    string.Equals(Path.GetFileNameWithoutExtension(k), stem, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrEmpty(directMatch)) return directMatch;

                // 2. 변형 스템 매칭 (_sig -> _pri, Cert -> Pri, cert -> key)
                var stemCandidates = new List<string>();
                if (stem.EndsWith("_sig", StringComparison.OrdinalIgnoreCase))
                {
                    var prefix = stem.Substring(0, stem.Length - 4);
                    stemCandidates.Add(prefix + "_pri");
                    stemCandidates.Add(prefix + "_signPri");
                    stemCandidates.Add(prefix + "_sigPri");
                    stemCandidates.Add(prefix + "_key");
                    stemCandidates.Add(prefix);
                }
                else if (stem.EndsWith("_sign", StringComparison.OrdinalIgnoreCase))
                {
                    var prefix = stem.Substring(0, stem.Length - 5);
                    stemCandidates.Add(prefix + "_pri");
                    stemCandidates.Add(prefix + "_signPri");
                    stemCandidates.Add(prefix + "_key");
                    stemCandidates.Add(prefix);
                }
                else if (stem.EndsWith("_env", StringComparison.OrdinalIgnoreCase))
                {
                    var prefix = stem.Substring(0, stem.Length - 4);
                    stemCandidates.Add(prefix + "_env_pri");
                    stemCandidates.Add(prefix + "_kmPri");
                    stemCandidates.Add(prefix + "_km");
                    stemCandidates.Add(prefix + "_pri");
                    stemCandidates.Add(prefix + "_key");
                    stemCandidates.Add(prefix);
                }
                else if (stem.EndsWith("_km", StringComparison.OrdinalIgnoreCase))
                {
                    var prefix = stem.Substring(0, stem.Length - 3);
                    stemCandidates.Add(prefix + "_km_pri");
                    stemCandidates.Add(prefix + "_kmPri");
                    stemCandidates.Add(prefix + "_pri");
                    stemCandidates.Add(prefix + "_key");
                    stemCandidates.Add(prefix);
                }
                else if (stem.EndsWith("cert", StringComparison.OrdinalIgnoreCase))
                {
                    var prefix = stem.Substring(0, stem.Length - 4);
                    stemCandidates.Add(prefix + "Pri");
                    stemCandidates.Add(prefix + "pri");
                    stemCandidates.Add(prefix + "Key");
                    stemCandidates.Add(prefix + "_pri");
                    stemCandidates.Add(prefix);
                }

                foreach (var cand in stemCandidates)
                {
                    var m = allKeyFiles.FirstOrDefault(k =>
                        string.Equals(Path.GetFileNameWithoutExtension(k), cand, StringComparison.OrdinalIgnoreCase));
                    if (!string.IsNullOrEmpty(m)) return m;
                }

                // 3. 표준 단일 인증서 폴더의 대표 개인키 패턴 검사 (km 인증서는 kmPri 우선, 그 외는 비-km 개인키 우선)
                string[] stdPatterns = isKmCert
                    ? new[] { "kmPri.key", "kmpri.key", "envPri.key", "envpri.key", "kmPri.pri" }
                    : new[] { "signPri.key", "SignPri.key", "signpri.key", "sigPri.key", "SigPri.key", "sigpri.key", "user.key", "UserPri.key", "signPri.pri", "priv.key", "envPri.key" };

                foreach (var kp in stdPatterns)
                {
                    var match = allKeyFiles.FirstOrDefault(k =>
                        string.Equals(Path.GetFileName(k), kp, StringComparison.OrdinalIgnoreCase));
                    if (!string.IsNullOrEmpty(match)) return match;
                }

                // 4. 비표준 다중 파일 혼재 폴더 안전 폴백:
                // 동일 폴더 내 다른 비-km 인증서가 1개 이하인 경우에만 임의 .key를 폴백 매칭하여 타 인증서의 키 오매칭 차단
                var nonKmKeys = allKeyFiles
                    .Where(k =>
                    {
                        var kn = Path.GetFileName(k).ToLowerInvariant();
                        return !kn.StartsWith("km") && !kn.StartsWith("env") && !kn.Contains("_km.") && !kn.Contains("_env.");
                    })
                    .ToList();

                if (!isKmCert && nonKmKeys.Count > 0)
                {
                    var siblingSignCerts = Directory.GetFiles(dir, "*.der")
                        .Concat(Directory.GetFiles(dir, "*.cer"))
                        .Where(f =>
                        {
                            var n = Path.GetFileName(f).ToLowerInvariant();
                            return !n.StartsWith("km") && !n.StartsWith("env") &&
                                   !n.Contains("_km.") && !n.Contains("_env.") &&
                                   !n.Contains("kmcert") && !n.Contains("envcert") &&
                                   !n.StartsWith("root") && !IsCaSystemFileName(n) && !n.StartsWith("crl");
                        })
                        .ToList();

                    if (siblingSignCerts.Count <= 1)
                    {
                        return nonKmKeys[0];
                    }
                }
            }
            catch
            {
                // 파일 시스템 조회 오류 무시
            }

            return string.Empty;
        }

        private static bool IsCaSystemFileName(string lowerFileName)
        {
            return Regex.IsMatch(lowerFileName, @"^ca(?:\d|[._-]|cert|$)", RegexOptions.IgnoreCase);
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
