using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace KCert.Core.Vault
{
    /// <summary>
    /// 안전 휴지통 격리 보관 항목
    /// </summary>
    public class TrashQuarantineItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string CertCommonName { get; set; } = string.Empty;
        public string OriginalDirectoryPath { get; set; } = string.Empty;
        public string QuarantinedFolderPath { get; set; } = string.Empty;
        public DateTime DeletedAtUtc { get; set; } = DateTime.UtcNow;
        public string RelativeSubPath { get; set; } = string.Empty;
    }

    /// <summary>
    /// 실수에 의한 영구 삭제를 방지하고 원클릭 복원을 지원하는 안전 휴지통(Safety Trash) 관리자
    /// </summary>
    public class SafetyTrashManager
    {
        private readonly string _trashRoot;
        private readonly string _indexFile;
        private readonly object _lock = new();

        public SafetyTrashManager(string? customTrashRoot = null)
        {
            if (!string.IsNullOrEmpty(customTrashRoot))
            {
                _trashRoot = customTrashRoot;
            }
            else
            {
                var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                _trashRoot = Path.Combine(localAppData, "KCertManager", "SafetyTrash");
            }

            _indexFile = Path.Combine(_trashRoot, "trash_manifest.json");

            if (!Directory.Exists(_trashRoot))
            {
                Directory.CreateDirectory(_trashRoot);
            }
        }

        /// <summary>
        /// 원본 인증서 디렉터리를 삭제하지 않고 안전 격리 보관소로 이동합니다.
        /// </summary>
        public (bool Success, string Message, TrashQuarantineItem? Item) MoveToTrash(
            string certDirectory,
            string commonName,
            string relativeSubPath)
        {
            lock (_lock)
            {
                try
                {
                    if (!Directory.Exists(certDirectory))
                        return (false, "삭제 대상 인증서 폴더가 존재하지 않습니다.", null);

                    string id = DateTime.Now.ToString("yyyyMMdd_HHmmss_") + Guid.NewGuid().ToString("N").Substring(0, 6);
                    string targetFolder = Path.Combine(_trashRoot, id);

                    SafeMoveDirectory(certDirectory, targetFolder);

                    var item = new TrashQuarantineItem
                    {
                        Id = id,
                        CertCommonName = commonName,
                        OriginalDirectoryPath = certDirectory,
                        QuarantinedFolderPath = targetFolder,
                        DeletedAtUtc = DateTime.UtcNow,
                        RelativeSubPath = relativeSubPath
                    };

                    var items = LoadIndexInternal();
                    items.Add(item);
                    SaveIndexInternal(items);

                    return (true, "인증서가 안전 휴지통으로 이동되었습니다. 언제든 복구할 수 있습니다.", item);
                }
                catch (Exception ex)
                {
                    return (false, $"휴지통 이동 실패: {ex.Message}", null);
                }
            }
        }

        /// <summary>
        /// 휴지통에 격리된 인증서를 원래 경로로 복원합니다.
        /// </summary>
        public (bool Success, string Message) Restore(string trashId)
        {
            lock (_lock)
            {
                try
                {
                    var items = LoadIndexInternal();
                    var item = items.Find(x => x.Id == trashId);
                    if (item == null)
                        return (false, "해당 휴지통 항목을 찾을 수 없습니다.");

                    if (!Directory.Exists(item.QuarantinedFolderPath))
                        return (false, "격리 보관된 폴더가 디스크에 존재하지 않습니다.");

                    // 보안 검증 1: 격리 폴더가 실제로 SafetyTrash 루트 내부에 위치하는지 검증
                    string fullTrashRoot = Path.GetFullPath(_trashRoot).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                    string fullQuarantined = Path.GetFullPath(item.QuarantinedFolderPath);
                    if (!fullQuarantined.StartsWith(fullTrashRoot, StringComparison.OrdinalIgnoreCase))
                        return (false, "보안 경고: 격리 보관소 경로가 변조되어 복원을 차단했습니다.");

                    // 보안 검증 2: 복원 대상 경로가 드라이브 루트나 Windows 핵심 시스템 폴더가 아닌지 검증
                    string fullOriginal = Path.GetFullPath(item.OriginalDirectoryPath);
                    if (!IsSafeCertificateDirectoryPath(fullOriginal))
                        return (false, "보안 경고: 안전하지 않은 시스템 경로로는 복원할 수 없습니다.");

                    var targetParent = Path.GetDirectoryName(fullOriginal);
                    if (!string.IsNullOrEmpty(targetParent) && !Directory.Exists(targetParent))
                    {
                        Directory.CreateDirectory(targetParent);
                    }

                    if (Directory.Exists(fullOriginal))
                    {
                        Directory.Delete(fullOriginal, true);
                    }

                    SafeMoveDirectory(fullQuarantined, fullOriginal);

                    items.Remove(item);
                    SaveIndexInternal(items);

                    return (true, "인증서가 원래 위치로 성공적으로 복원되었습니다.");
                }
                catch (Exception ex)
                {
                    return (false, $"복원 실패: {ex.Message}");
                }
            }
        }

        private static bool IsSafeCertificateDirectoryPath(string fullPath)
        {
            if (string.IsNullOrWhiteSpace(fullPath)) return false;

            var root = Path.GetPathRoot(fullPath);
            if (string.Equals(fullPath.TrimEnd('\\', '/'), root?.TrimEnd('\\', '/'), StringComparison.OrdinalIgnoreCase))
                return false;

            string upper = fullPath.ToUpperInvariant();
            if (upper.Contains(@"\WINDOWS\") || upper.EndsWith(@"\WINDOWS") ||
                upper.Contains(@"\SYSTEM32\") || upper.EndsWith(@"\SYSTEM32"))
            {
                return false;
            }

            // 표준 인증서 경로 토큰(NPKI, GPKI, EPKI, MPKI, Cert)이 포함되어야 안전 삭제/복원 허용
            return upper.Contains("NPKI") || upper.Contains("GPKI") || upper.Contains("EPKI") || upper.Contains("MPKI") || upper.Contains("CERT");
        }

        private static void SafeMoveDirectory(string sourceDir, string targetDir)
        {
            try
            {
                // 동일 볼륨(드라이브)인 경우 빠른 Directory.Move 시도
                Directory.Move(sourceDir, targetDir);
            }
            catch
            {
                // 다른 드라이브(볼륨) 간 이동이거나 잠금 등의 이유로 실패 시 복사 후 삭제 fallback
                CopyDirectoryRecursive(sourceDir, targetDir);
                Directory.Delete(sourceDir, true);
            }
        }

        private static void CopyDirectoryRecursive(string sourceDir, string targetDir)
        {
            if (!Directory.Exists(targetDir))
            {
                Directory.CreateDirectory(targetDir);
            }

            foreach (var file in Directory.GetFiles(sourceDir))
            {
                var destFile = Path.Combine(targetDir, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }

            foreach (var subDir in Directory.GetDirectories(sourceDir))
            {
                var destSubDir = Path.Combine(targetDir, Path.GetFileName(subDir));
                CopyDirectoryRecursive(subDir, destSubDir);
            }
        }

        /// <summary>
        /// 휴지통 목록을 조회합니다.
        /// </summary>
        public List<TrashQuarantineItem> GetItems()
        {
            lock (_lock)
            {
                return LoadIndexInternal();
            }
        }

        /// <summary>
        /// 휴지통을 완전히 비웁니다.
        /// </summary>
        public void EmptyTrash()
        {
            lock (_lock)
            {
                try
                {
                    if (Directory.Exists(_trashRoot))
                    {
                        var dirs = Directory.GetDirectories(_trashRoot);
                        foreach (var d in dirs)
                        {
                            try { Directory.Delete(d, true); } catch { }
                        }
                    }
                    SaveIndexInternal(new List<TrashQuarantineItem>());
                }
                catch { }
            }
        }

        private List<TrashQuarantineItem> LoadIndexInternal()
        {
            try
            {
                if (!File.Exists(_indexFile)) return new List<TrashQuarantineItem>();
                string json = File.ReadAllText(_indexFile);
                return JsonSerializer.Deserialize<List<TrashQuarantineItem>>(json) ?? new List<TrashQuarantineItem>();
            }
            catch
            {
                return new List<TrashQuarantineItem>();
            }
        }

        private void SaveIndexInternal(List<TrashQuarantineItem> items)
        {
            try
            {
                string json = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_indexFile, json);
            }
            catch { }
        }
    }
}
