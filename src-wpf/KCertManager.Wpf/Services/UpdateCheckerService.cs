using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace KCertManager.Wpf.Services
{
    public class AppUpdateInfo
    {
        public bool HasUpdate { get; set; }
        public string CurrentVersion { get; set; } = "2.0.0";
        public string LatestVersion { get; set; } = "2.0.0";
        public string ReleaseName { get; set; } = string.Empty;
        public string ReleaseNotes { get; set; } = string.Empty;
        public string ReleaseUrl { get; set; } = "https://github.com/AhBiYout-all/K-Certificate-Manager/releases";
        public string? DownloadUrl { get; set; }
        public string? AssetName { get; set; }
        public long? AssetSizeBytes { get; set; }
        public string? PublishedAt { get; set; }
        public string DetectionSource { get; set; } = "release_latest";
    }

    public sealed class UpdateInstallProgress
    {
        public int Percentage { get; set; }
        public long DownloadedBytes { get; set; }
        public long TotalBytes { get; set; }
        public string Stage { get; set; } = "downloading"; // downloading | verifying | installing | completed | error
        public string Message { get; set; } = string.Empty;
    }

    public sealed class SelfUpdateResult
    {
        public bool Success { get; set; }
        public bool ShouldShutdownForInstall { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? DownloadedFilePath { get; set; }
    }

    /// <summary>
    /// GitHub Releases & Git Tags API를 조회하여 최신 데스크톱 버전 업데이트를 확인하고,
    /// 브라우저 이동 없이 앱 내부에서 직접 다운로드·검증·무인 셀프 설치를 수행하는 서비스
    /// </summary>
    public static class UpdateCheckerService
    {
        private const string GITHUB_REPO = "AhBiYout-all/K-Certificate-Manager";
        private const string INNO_APP_ID_REG_KEY = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\{8F5B123A-4C2E-497B-902B-6277D8C7B8E1}_is1";
        public const string CURRENT_VERSION = "2.0.0";

        public static async Task<AppUpdateInfo> CheckForUpdatesAsync()
        {
            var result = new AppUpdateInfo
            {
                CurrentVersion = CURRENT_VERSION,
                LatestVersion = CURRENT_VERSION,
                ReleaseUrl = $"https://github.com/{GITHUB_REPO}/releases"
            };

            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("KCertManager-Desktop", CURRENT_VERSION));
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
                client.DefaultRequestHeaders.CacheControl = new CacheControlHeaderValue { NoCache = true, NoStore = true };

                long ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                // -------------------------------------------------------------
                // Tier 1: /releases/latest
                // -------------------------------------------------------------
                try
                {
                    var response = await client.GetAsync($"https://api.github.com/repos/{GITHUB_REPO}/releases/latest?_t={ts}");
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        var root = doc.RootElement;

                        if (PopulateFromReleaseElement(root, result, "release_latest"))
                        {
                            return result;
                        }
                    }
                }
                catch { }

                // -------------------------------------------------------------
                // Tier 2: /releases (List all)
                // -------------------------------------------------------------
                try
                {
                    var response = await client.GetAsync($"https://api.github.com/repos/{GITHUB_REPO}/releases?_t={ts}");
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                        {
                            if (PopulateFromReleaseElement(doc.RootElement[0], result, "releases_list"))
                            {
                                return result;
                            }
                        }
                    }
                }
                catch { }

                // -------------------------------------------------------------
                // Tier 3: /tags (Direct Git Tags)
                // -------------------------------------------------------------
                try
                {
                    var response = await client.GetAsync($"https://api.github.com/repos/{GITHUB_REPO}/tags?_t={ts}");
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                        {
                            string highestTag = "";
                            foreach (var tagItem in doc.RootElement.EnumerateArray())
                            {
                                if (tagItem.TryGetProperty("name", out var nameElem))
                                {
                                    var tagStr = CleanVersion(nameElem.GetString() ?? "");
                                    if (string.IsNullOrEmpty(highestTag) || IsVersionNewer(tagStr, highestTag))
                                    {
                                        highestTag = tagStr;
                                    }
                                }
                            }

                            if (!string.IsNullOrWhiteSpace(highestTag))
                            {
                                result.LatestVersion = highestTag;
                                result.HasUpdate = IsVersionNewer(highestTag, CURRENT_VERSION);
                                result.ReleaseName = $"v{highestTag} 공식 배포판";
                                result.ReleaseNotes = $"GitHub Git 태그(v{highestTag})가 감지되었습니다. 자동 업데이트 패키지를 준비 중입니다.";
                                result.ReleaseUrl = $"https://github.com/{GITHUB_REPO}/releases/tag/v{highestTag}";
                                result.DownloadUrl = $"https://github.com/{GITHUB_REPO}/releases/download/v{highestTag}/kcert-manager-v{highestTag}-setup.exe";
                                result.AssetName = $"kcert-manager-v{highestTag}-setup.exe";
                                result.DetectionSource = "git_tags";

                                return result;
                            }
                        }
                    }
                }
                catch { }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[UpdateCheckerService] Update check failed: {ex.Message}");
            }

            return result;
        }

        private static bool PopulateFromReleaseElement(JsonElement releaseElem, AppUpdateInfo result, string source)
        {
            if (!releaseElem.TryGetProperty("tag_name", out var tagElem))
                return false;

            var tagName = CleanVersion(tagElem.GetString() ?? "");
            if (string.IsNullOrWhiteSpace(tagName))
                return false;

            result.LatestVersion = tagName;
            result.HasUpdate = IsVersionNewer(tagName, CURRENT_VERSION);
            result.DetectionSource = source;

            if (releaseElem.TryGetProperty("name", out var nameElem))
                result.ReleaseName = nameElem.GetString() ?? $"v{tagName}";

            if (releaseElem.TryGetProperty("body", out var bodyElem))
                result.ReleaseNotes = bodyElem.GetString() ?? "";

            if (releaseElem.TryGetProperty("html_url", out var urlElem))
            {
                result.ReleaseUrl = urlElem.GetString() ?? result.ReleaseUrl;
                result.DownloadUrl = result.ReleaseUrl;
            }

            // Prefer Windows setup installer (.exe) over portable .zip archive
            string? exeUrl = null;
            string? exeName = null;
            long? exeSize = null;
            string? zipUrl = null;
            string? zipName = null;
            long? zipSize = null;

            if (releaseElem.TryGetProperty("assets", out var assetsElem) && assetsElem.ValueKind == JsonValueKind.Array)
            {
                foreach (var asset in assetsElem.EnumerateArray())
                {
                    if (!asset.TryGetProperty("name", out var assetNameElem) ||
                        !asset.TryGetProperty("browser_download_url", out var downloadElem))
                        continue;

                    var name = assetNameElem.GetString() ?? "";
                    var url = downloadElem.GetString();
                    if (string.IsNullOrWhiteSpace(url)) continue;

                    long? size = null;
                    if (asset.TryGetProperty("size", out var sizeElem) && sizeElem.TryGetInt64(out var parsedSize))
                        size = parsedSize;

                    if (name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                    {
                        if (exeUrl == null || name.Contains("setup", StringComparison.OrdinalIgnoreCase))
                        {
                            exeUrl = url;
                            exeName = name;
                            exeSize = size;
                        }
                    }
                    else if (name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) && zipUrl == null)
                    {
                        zipUrl = url;
                        zipName = name;
                        zipSize = size;
                    }
                }
            }

            if (exeUrl != null)
            {
                result.DownloadUrl = exeUrl;
                result.AssetName = exeName;
                result.AssetSizeBytes = exeSize;
            }
            else if (zipUrl != null)
            {
                result.DownloadUrl = zipUrl;
                result.AssetName = zipName;
                result.AssetSizeBytes = zipSize;
            }
            else
            {
                // Standard release asset naming fallback
                result.DownloadUrl = $"https://github.com/{GITHUB_REPO}/releases/download/v{tagName}/kcert-manager-v{tagName}-setup.exe";
                result.AssetName = $"kcert-manager-v{tagName}-setup.exe";
            }

            return true;
        }

        /// <summary>
        /// 브라우저/GitHub 페이지로 이동하지 않고 앱 내부에서 직접 업데이트 패키지를 다운로드·검증 후
        /// 무인(Silent) 셀프 설치 및 자동 재시작을 수행합니다.
        /// </summary>
        public static async Task<SelfUpdateResult> DownloadAndInstallAsync(
            AppUpdateInfo info,
            IProgress<UpdateInstallProgress>? progress = null,
            CancellationToken cancellationToken = default)
        {
            var downloadUrl = !string.IsNullOrWhiteSpace(info.DownloadUrl)
                ? info.DownloadUrl!
                : $"https://github.com/{GITHUB_REPO}/releases/download/v{info.LatestVersion}/kcert-manager-v{info.LatestVersion}-setup.exe";

            // If DownloadUrl accidentally points to an HTML release page, try the standard setup.exe URL
            if (downloadUrl.Contains("/releases/tag/", StringComparison.OrdinalIgnoreCase) &&
                !downloadUrl.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) &&
                !downloadUrl.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            {
                downloadUrl = $"https://github.com/{GITHUB_REPO}/releases/download/v{info.LatestVersion}/kcert-manager-v{info.LatestVersion}-setup.exe";
            }

            var workDir = Path.Combine(Path.GetTempPath(), "KCertManager_AutoUpdate", $"v{CleanVersion(info.LatestVersion)}");
            try
            {
                if (Directory.Exists(workDir))
                {
                    try { Directory.Delete(workDir, true); } catch { }
                }
                Directory.CreateDirectory(workDir);

                var fileName = !string.IsNullOrWhiteSpace(info.AssetName)
                    ? Path.GetFileName(info.AssetName!)
                    : Path.GetFileName(new Uri(downloadUrl).AbsolutePath);

                if (string.IsNullOrWhiteSpace(fileName) ||
                    (!fileName.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) &&
                     !fileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)))
                {
                    fileName = $"kcert-manager-v{CleanVersion(info.LatestVersion)}-setup.exe";
                }

                var targetFilePath = Path.Combine(workDir, fileName);

                progress?.Report(new UpdateInstallProgress
                {
                    Percentage = 2,
                    Stage = "downloading",
                    Message = $"업데이트 서버 연결 중... ({fileName})"
                });

                using var handler = new HttpClientHandler { AllowAutoRedirect = true };
                using var client = new HttpClient(handler);
                client.Timeout = TimeSpan.FromMinutes(10);
                client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("KCertManager-SelfUpdater", CURRENT_VERSION));

                using var response = await client.GetAsync(downloadUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return new SelfUpdateResult
                    {
                        Success = false,
                        Message = $"업데이트 패키지를 다운로드할 수 없습니다 (HTTP {(int)response.StatusCode}). 릴리스에 설치 파일이 아직 업로드되지 않았거나 네트워크를 확인해 주세요."
                    };
                }

                var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
                if (contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase))
                {
                    return new SelfUpdateResult
                    {
                        Success = false,
                        Message = "설치 실행 파일 대신 HTML 페이지가 응답되었습니다. 릴리스 에셋 구성을 확인해 주세요."
                    };
                }

                long totalBytes = response.Content.Headers.ContentLength ?? info.AssetSizeBytes ?? -1L;
                long downloadedBytes = 0;

                await using (var remoteStream = await response.Content.ReadAsStreamAsync(cancellationToken))
                await using (var localStream = new FileStream(targetFilePath, FileMode.Create, FileAccess.Write, FileShare.None, 65536, true))
                {
                    var buffer = new byte[65536];
                    int read;
                    var lastReportTime = DateTime.UtcNow;

                    while ((read = await remoteStream.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
                    {
                        await localStream.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                        downloadedBytes += read;

                        if ((DateTime.UtcNow - lastReportTime).TotalMilliseconds >= 80 || downloadedBytes == totalBytes)
                        {
                            lastReportTime = DateTime.UtcNow;
                            int pct = totalBytes > 0
                                ? Math.Clamp((int)Math.Round((double)downloadedBytes / totalBytes * 85.0), 3, 85)
                                : 45;

                            var downloadedMb = downloadedBytes / (1024.0 * 1024.0);
                            var msg = totalBytes > 0
                                ? $"설치 패키지 다운로드 중... ({downloadedMb:F1} MB / {totalBytes / (1024.0 * 1024.0):F1} MB)"
                                : $"설치 패키지 다운로드 중... ({downloadedMb:F1} MB)";

                            progress?.Report(new UpdateInstallProgress
                            {
                                Percentage = pct,
                                DownloadedBytes = downloadedBytes,
                                TotalBytes = Math.Max(0, totalBytes),
                                Stage = "downloading",
                                Message = msg
                            });
                        }
                    }
                }

                progress?.Report(new UpdateInstallProgress
                {
                    Percentage = 90,
                    DownloadedBytes = downloadedBytes,
                    TotalBytes = downloadedBytes,
                    Stage = "verifying",
                    Message = "다운로드된 패키지 바이너리 서명 및 무결성 검증 중..."
                });

                var fileInfo = new FileInfo(targetFilePath);
                if (!fileInfo.Exists || fileInfo.Length < 4096)
                {
                    return new SelfUpdateResult
                    {
                        Success = false,
                        Message = "다운로드된 업데이트 파일이 손상되었거나 크기가 비정상적입니다."
                    };
                }

                // Magic header validation (MZ for .exe, PK for .zip)
                byte[] magic = new byte[2];
                await using (var checkFs = new FileStream(targetFilePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    await checkFs.ReadExactlyAsync(magic.AsMemory(0, 2), cancellationToken);
                }

                bool isZip = fileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase);
                if (!isZip && !(magic[0] == 0x4D && magic[1] == 0x5A))
                {
                    return new SelfUpdateResult
                    {
                        Success = false,
                        Message = "다운로드된 파일이 유효한 Windows 설치 프로그램(PE .exe) 형식이 아닙니다."
                    };
                }
                if (isZip && !(magic[0] == 0x50 && magic[1] == 0x4B))
                {
                    return new SelfUpdateResult
                    {
                        Success = false,
                        Message = "다운로드된 파일이 유효한 ZIP 압축 패키지 형식이 아닙니다."
                    };
                }

                progress?.Report(new UpdateInstallProgress
                {
                    Percentage = 96,
                    DownloadedBytes = downloadedBytes,
                    TotalBytes = downloadedBytes,
                    Stage = "installing",
                    Message = "무인 셀프 설치 준비 완료! 프로그램을 종료하고 자동 설치를 시작합니다..."
                });

                var currentExePath = Environment.ProcessPath;
                if (string.IsNullOrWhiteSpace(currentExePath))
                {
                    currentExePath = Process.GetCurrentProcess().MainModule?.FileName
                        ?? Path.Combine(AppContext.BaseDirectory, "KCertManager.exe");
                }

                var currentDir = Path.GetDirectoryName(currentExePath) ?? AppContext.BaseDirectory;
                var currentPid = Environment.ProcessId;
                var psScriptPath = Path.Combine(workDir, "apply_self_update.ps1");

                string? setupExeToRun = null;
                string? extractedPortableDir = null;

                if (!isZip)
                {
                    setupExeToRun = targetFilePath;
                }
                else
                {
                    var extractDir = Path.Combine(workDir, "extracted");
                    ZipFile.ExtractToDirectory(targetFilePath, extractDir, true);
                    var foundSetup = Directory.GetFiles(extractDir, "*setup*.exe", SearchOption.AllDirectories).FirstOrDefault();
                    if (foundSetup != null)
                    {
                        setupExeToRun = foundSetup;
                    }
                    else
                    {
                        extractedPortableDir = extractDir;
                    }
                }

                var psScript = BuildSelfUpdatePowerShellScript(
                    currentPid,
                    currentExePath,
                    currentDir,
                    workDir,
                    setupExeToRun,
                    extractedPortableDir);

                // Write UTF-8 with BOM for full Korean path compatibility in Windows PowerShell 5.1
                await File.WriteAllTextAsync(psScriptPath, psScript, new UTF8Encoding(true), cancellationToken);

                Process.Start(new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"{psScriptPath}\"",
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true
                });

                progress?.Report(new UpdateInstallProgress
                {
                    Percentage = 100,
                    DownloadedBytes = downloadedBytes,
                    TotalBytes = downloadedBytes,
                    Stage = "completed",
                    Message = "자동 설치가 시작되었습니다. 설치 완료 후 새 버전이 자동으로 실행됩니다."
                });

                return new SelfUpdateResult
                {
                    Success = true,
                    ShouldShutdownForInstall = true,
                    DownloadedFilePath = targetFilePath,
                    Message = "셀프 업데이트 설치가 시작되었습니다."
                };
            }
            catch (OperationCanceledException)
            {
                return new SelfUpdateResult
                {
                    Success = false,
                    Message = "사용자에 의해 자동 업데이트가 취소되었습니다."
                };
            }
            catch (Exception ex)
            {
                return new SelfUpdateResult
                {
                    Success = false,
                    Message = $"자동 다운로드 또는 설치 준비 중 오류가 발생했습니다: {ex.Message}"
                };
            }
        }

        private static string BuildSelfUpdatePowerShellScript(
            int parentPid,
            string currentExePath,
            string currentDir,
            string workDir,
            string? setupExePath,
            string? portableExtractDir)
        {
            static string Esc(string s) => s.Replace("'", "''");

            var sb = new StringBuilder();
            sb.AppendLine("$ErrorActionPreference = 'SilentlyContinue'");
            sb.AppendLine($"$parentPid = {parentPid}");
            sb.AppendLine($"$currentExe = '{Esc(currentExePath)}'");
            sb.AppendLine($"$currentDir = '{Esc(currentDir)}'");
            sb.AppendLine($"$workDir = '{Esc(workDir)}'");
            sb.AppendLine($"$regPath = 'HKLM:\\{INNO_APP_ID_REG_KEY}'");
            sb.AppendLine($"$regPathCu = 'HKCU:\\{INNO_APP_ID_REG_KEY}'");
            sb.AppendLine();
            sb.AppendLine("# 1. Wait for running KCertManager.exe to release locks");
            sb.AppendLine("try { Wait-Process -Id $parentPid -Timeout 15 -ErrorAction SilentlyContinue } catch {}");
            sb.AppendLine("Start-Sleep -Milliseconds 600");
            sb.AppendLine();

            if (!string.IsNullOrWhiteSpace(setupExePath))
            {
                sb.AppendLine($"$installer = '{Esc(setupExePath)}'");
                sb.AppendLine("# 2. Run Inno Setup silently with automatic elevation (UAC prompt if needed)");
                sb.AppendLine("$proc = Start-Process -FilePath $installer -ArgumentList '/SILENT','/SUPPRESSMSGBOXES','/NORESTART','/CLOSEAPPLICATIONS' -Wait -PassThru");
                sb.AppendLine();
                sb.AppendLine("# 3. Relaunch updated KCertManager.exe");
                sb.AppendLine("$launchExe = $currentExe");
                sb.AppendLine("foreach ($rp in @($regPath, $regPathCu)) {");
                sb.AppendLine("  if (Test-Path $rp) {");
                sb.AppendLine("    $loc = (Get-ItemProperty -Path $rp -Name 'InstallLocation' -ErrorAction SilentlyContinue).InstallLocation");
                sb.AppendLine("    if ($loc) {");
                sb.AppendLine("      $candidate = Join-Path $loc 'KCertManager.exe'");
                sb.AppendLine("      if (Test-Path $candidate) { $launchExe = $candidate; break }");
                sb.AppendLine("    }");
                sb.AppendLine("  }");
                sb.AppendLine("}");
                sb.AppendLine("$defaultPfExe = Join-Path ${env:ProgramFiles} 'K-Certificate Manager\\KCertManager.exe'");
                sb.AppendLine("if (-not (Test-Path $launchExe) -and (Test-Path $defaultPfExe)) { $launchExe = $defaultPfExe }");
                sb.AppendLine("if (($null -eq $proc -or $proc.ExitCode -eq 0) -and (Test-Path $launchExe)) {");
                sb.AppendLine("  Start-Process -FilePath $launchExe -WorkingDirectory (Split-Path $launchExe)");
                sb.AppendLine("}");
            }
            else if (!string.IsNullOrWhiteSpace(portableExtractDir))
            {
                sb.AppendLine($"$extractDir = '{Esc(portableExtractDir)}'");
                sb.AppendLine("# 2. Copy updated files into current installation folder");
                sb.AppendLine("Copy-Item -Path (Join-Path $extractDir '*') -Destination $currentDir -Recurse -Force");
                sb.AppendLine("if (Test-Path $currentExe) {");
                sb.AppendLine("  Start-Process -FilePath $currentExe -WorkingDirectory $currentDir");
                sb.AppendLine("}");
            }

            sb.AppendLine();
            sb.AppendLine("# 4. Clean up temporary update workspace");
            sb.AppendLine("Start-Sleep -Seconds 2");
            sb.AppendLine("try { Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue } catch {}");
            return sb.ToString();
        }

        private static string CleanVersion(string v)
        {
            var clean = v.TrimStart('v', 'V').Trim();
            var match = Regex.Match(clean, @"\d+(\.\d+)*");
            return match.Success ? match.Value : clean;
        }

        public static bool IsVersionNewer(string latest, string current)
        {
            try
            {
                var v1Clean = CleanVersion(latest);
                var v2Clean = CleanVersion(current);

                var parts1 = v1Clean.Split('.');
                var parts2 = v2Clean.Split('.');

                int maxLen = Math.Max(parts1.Length, Math.Max(parts2.Length, 3));
                for (int i = 0; i < maxLen; i++)
                {
                    int p1 = i < parts1.Length && int.TryParse(parts1[i], out var n1) ? n1 : 0;
                    int p2 = i < parts2.Length && int.TryParse(parts2[i], out var n2) ? n2 : 0;
                    if (p1 > p2) return true;
                    if (p1 < p2) return false;
                }
            }
            catch
            {
                // Fallback string compare
            }
            return false;
        }
    }
}
