using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace KCertManager.Wpf.Services
{
    public class AppUpdateInfo
    {
        public bool HasUpdate { get; set; }
        public string CurrentVersion { get; set; } = "1.4.5";
        public string LatestVersion { get; set; } = "1.4.5";
        public string ReleaseName { get; set; } = string.Empty;
        public string ReleaseNotes { get; set; } = string.Empty;
        public string ReleaseUrl { get; set; } = "https://github.com/ahbiyout-all/K-Certificate-Manager/releases";
        public string? DownloadUrl { get; set; }
        public string? PublishedAt { get; set; }
        public string DetectionSource { get; set; } = "release_latest";
    }

    /// <summary>
    /// GitHub Releases & Git Tags API를 조회하여 최신 데스크톱 버전 업데이트를 확인하는 다계층(3-Tier) 서비스
    /// Tier 1: /releases/latest
    /// Tier 2: /releases
    /// Tier 3: /tags (Git 태그 직결)
    /// </summary>
    public static class UpdateCheckerService
    {
        private const string GITHUB_REPO = "ahbiyout-all/K-Certificate-Manager";
        public const string CURRENT_VERSION = "1.4.5";

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

                        if (root.TryGetProperty("tag_name", out var tagElem))
                        {
                            var tagName = CleanVersion(tagElem.GetString() ?? "");
                            if (!string.IsNullOrWhiteSpace(tagName))
                            {
                                result.LatestVersion = tagName;
                                result.HasUpdate = IsVersionNewer(tagName, CURRENT_VERSION);
                                result.DetectionSource = "release_latest";

                                if (root.TryGetProperty("name", out var nameElem))
                                    result.ReleaseName = nameElem.GetString() ?? $"v{tagName}";

                                if (root.TryGetProperty("body", out var bodyElem))
                                    result.ReleaseNotes = bodyElem.GetString() ?? "";

                                if (root.TryGetProperty("html_url", out var urlElem))
                                {
                                    result.ReleaseUrl = urlElem.GetString() ?? result.ReleaseUrl;
                                    result.DownloadUrl = result.ReleaseUrl;
                                }

                                if (root.TryGetProperty("assets", out var assetsElem) && assetsElem.ValueKind == JsonValueKind.Array)
                                {
                                    foreach (var asset in assetsElem.EnumerateArray())
                                    {
                                        if (asset.TryGetProperty("name", out var assetNameElem) &&
                                            asset.TryGetProperty("browser_download_url", out var downloadElem))
                                        {
                                            var name = assetNameElem.GetString() ?? "";
                                            if (name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) ||
                                                name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                                            {
                                                result.DownloadUrl = downloadElem.GetString();
                                                break;
                                            }
                                        }
                                    }
                                }

                                return result;
                            }
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
                            var firstRelease = doc.RootElement[0];
                            if (firstRelease.TryGetProperty("tag_name", out var tagElem))
                            {
                                var tagName = CleanVersion(tagElem.GetString() ?? "");
                                if (!string.IsNullOrWhiteSpace(tagName))
                                {
                                    result.LatestVersion = tagName;
                                    result.HasUpdate = IsVersionNewer(tagName, CURRENT_VERSION);
                                    result.DetectionSource = "releases_list";

                                    if (firstRelease.TryGetProperty("name", out var nameElem))
                                        result.ReleaseName = nameElem.GetString() ?? $"v{tagName}";

                                    if (firstRelease.TryGetProperty("body", out var bodyElem))
                                        result.ReleaseNotes = bodyElem.GetString() ?? "";

                                    if (firstRelease.TryGetProperty("html_url", out var urlElem))
                                    {
                                        result.ReleaseUrl = urlElem.GetString() ?? result.ReleaseUrl;
                                        result.DownloadUrl = result.ReleaseUrl;
                                    }

                                    return result;
                                }
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
                                result.ReleaseNotes = $"GitHub Git 태그(v{highestTag})가 감지되었습니다. 릴리스 페이지에서 최신 패키지를 다운로드하세요.";
                                result.ReleaseUrl = $"https://github.com/{GITHUB_REPO}/releases/tag/v{highestTag}";
                                result.DownloadUrl = $"https://github.com/{GITHUB_REPO}/archive/refs/tags/v{highestTag}.zip";
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
