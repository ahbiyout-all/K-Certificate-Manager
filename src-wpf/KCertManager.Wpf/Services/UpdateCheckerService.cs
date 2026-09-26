using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;

namespace KCertManager.Wpf.Services
{
    public class AppUpdateInfo
    {
        public bool HasUpdate { get; set; }
        public string CurrentVersion { get; set; } = "1.4.2";
        public string LatestVersion { get; set; } = "1.4.2";
        public string ReleaseName { get; set; } = string.Empty;
        public string ReleaseNotes { get; set; } = string.Empty;
        public string ReleaseUrl { get; set; } = "https://github.com/ahbiyout-all/K-Certificate-Manager/releases";
        public string? DownloadUrl { get; set; }
        public string? PublishedAt { get; set; }
    }

    /// <summary>
    /// GitHub Releases API를 조회하여 최신 데스크톱 버전 업데이트를 확인하는 서비스
    /// </summary>
    public static class UpdateCheckerService
    {
        private const string GITHUB_REPO = "ahbiyout-all/K-Certificate-Manager";
        private const string API_URL = $"https://api.github.com/repos/{GITHUB_REPO}/releases/latest";
        public const string CURRENT_VERSION = "1.4.2";

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
                client.Timeout = TimeSpan.FromSeconds(6);
                client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("KCertManager-Desktop", CURRENT_VERSION));
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));

                var response = await client.GetAsync(API_URL);
                if (!response.IsSuccessStatusCode)
                {
                    return result;
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("tag_name", out var tagElem))
                {
                    return result;
                }

                var tagName = (tagElem.GetString() ?? "").TrimStart('v', 'V').Trim();
                if (string.IsNullOrWhiteSpace(tagName))
                {
                    return result;
                }

                result.LatestVersion = tagName;
                result.HasUpdate = IsVersionNewer(tagName, CURRENT_VERSION);

                if (root.TryGetProperty("name", out var nameElem))
                {
                    result.ReleaseName = nameElem.GetString() ?? $"v{tagName}";
                }

                if (root.TryGetProperty("body", out var bodyElem))
                {
                    result.ReleaseNotes = bodyElem.GetString() ?? "";
                }

                if (root.TryGetProperty("html_url", out var urlElem))
                {
                    result.ReleaseUrl = urlElem.GetString() ?? result.ReleaseUrl;
                    result.DownloadUrl = result.ReleaseUrl;
                }

                // Check for attached zip asset
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
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[UpdateCheckerService] Update check failed: {ex.Message}");
            }

            return result;
        }

        public static bool IsVersionNewer(string latest, string current)
        {
            try
            {
                if (Version.TryParse(latest, out var latestVer) && Version.TryParse(current, out var currentVer))
                {
                    return latestVer > currentVer;
                }
            }
            catch
            {
                // Fallback string compare
            }
            return string.Compare(latest, current, StringComparison.OrdinalIgnoreCase) > 0;
        }
    }
}
