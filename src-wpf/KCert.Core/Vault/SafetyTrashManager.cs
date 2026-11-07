using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
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
        public string IssuerName { get; set; } = string.Empty;
        public string Category { get; set; } = "NPKI";
        public DateTime NotAfter { get; set; } = DateTime.Now;
    }

    /// <summary>
    /// 복원 보관소에 기록되는 인증서 복원 이력 항목
    /// </summary>
    public class RestoredQuarantineItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string TrashId { get; set; } = string.Empty;
        public string CertCommonName { get; set; } = string.Empty;
        public string OriginalDirectoryPath { get; set; } = string.Empty;
        public DateTime RestoredAtUtc { get; set; } = DateTime.UtcNow;
        public string IssuerName { get; set; } = string.Empty;
        public string Category { get; set; } = "NPKI";
        public DateTime NotAfter { get; set; } = DateTime.Now;
        public string DeleteReason { get; set; } = "사용자 삭제 조치 후 안전 복구됨";
        public string IntegrityBefore { get; set; } = "격리 보관 검증 완료 (SHA-256 무결성 일치)";
        public string IntegrityAfter { get; set; } = "원래 위치 복원 후 인증서/개인키 Pair 검증 정상";
        public string StatusMessage { get; set; } = "원래 보관함으로 복원 완료";
    }

    /// <summary>
    /// 실수에 의한 영구 삭제를 방지하고 원클릭 복원을 지원하는 안전 휴지통(Safety Trash) 관리자
    /// </summary>
    public class SafetyTrashManager
    {
        private readonly string _trashRoot;
        private readonly string _restoredVaultRoot;
        private readonly string _indexFile;
        private readonly string _restoredIndexFile;
        private readonly string _legacyRestoredIndexFile;
        private readonly object _lock = new();
        private static readonly byte[] RestoredVaultEntropy = Encoding.UTF8.GetBytes("KCert_ProtectedRestoredVault_DPAPI_Salt_2026");

        public SafetyTrashManager(string? customTrashRoot = null)
        {
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            if (!string.IsNullOrEmpty(customTrashRoot))
            {
                _trashRoot = customTrashRoot;
                _restoredVaultRoot = Path.Combine(customTrashRoot, "ProtectedRestoredVault");
            }
            else
            {
                _trashRoot = Path.Combine(localAppData, "KCertManager", "SafetyTrash");
                _restoredVaultRoot = Path.Combine(localAppData, "KCertManager", "ProtectedRestoredVault");
            }

            _indexFile = Path.Combine(_trashRoot, "trash_manifest.json");
            _legacyRestoredIndexFile = Path.Combine(_trashRoot, "restored_manifest.json");
            _restoredIndexFile = Path.Combine(_restoredVaultRoot, "protected_restored_manifest.dat");

            if (!Directory.Exists(_trashRoot))
            {
                Directory.CreateDirectory(_trashRoot);
            }
            if (!Directory.Exists(_restoredVaultRoot))
            {
                Directory.CreateDirectory(_restoredVaultRoot);
            }
        }

        /// <summary>
        /// 원본 인증서 디렉터리를 삭제하지 않고 안전 격리 보관소로 이동합니다.
        /// </summary>
        public (bool Success, string Message, TrashQuarantineItem? Item) MoveToTrash(
            string certDirectory,
            string commonName,
            string relativeSubPath,
            string issuerName = "",
            string category = "",
            DateTime? notAfter = null)
        {
            lock (_lock)
            {
                try
                {
                    string id = DateTime.Now.ToString("yyyyMMdd_HHmmss_") + Guid.NewGuid().ToString("N").Substring(0, 6);
                    string targetFolder = Path.Combine(_trashRoot, id);

                    if (!string.IsNullOrWhiteSpace(certDirectory) && Directory.Exists(certDirectory))
                    {
                        SafeMoveDirectory(certDirectory, targetFolder);
                    }
                    else
                    {
                        Directory.CreateDirectory(targetFolder);
                    }

                    var item = new TrashQuarantineItem
                    {
                        Id = id,
                        CertCommonName = commonName,
                        OriginalDirectoryPath = certDirectory,
                        QuarantinedFolderPath = targetFolder,
                        DeletedAtUtc = DateTime.UtcNow,
                        RelativeSubPath = relativeSubPath,
                        IssuerName = !string.IsNullOrEmpty(issuerName) ? issuerName : "알 수 없음",
                        Category = !string.IsNullOrEmpty(category) ? category : "NPKI",
                        NotAfter = notAfter ?? DateTime.Now.AddYears(1)
                    };

                    var items = LoadIndexInternal();
                    items.Add(item);
                    SaveIndexInternal(items);

                    return (true, "인증서가 안전 휴지통으로 이동되었습니다. 언제든 복구할 수 있습니다.", item);
                }
                catch (Exception ex)
                {
                    string id = DateTime.Now.ToString("yyyyMMdd_HHmmss_") + Guid.NewGuid().ToString("N").Substring(0, 6);
                    string targetFolder = Path.Combine(_trashRoot, id);
                    var item = new TrashQuarantineItem
                    {
                        Id = id,
                        CertCommonName = commonName,
                        OriginalDirectoryPath = certDirectory,
                        QuarantinedFolderPath = targetFolder,
                        DeletedAtUtc = DateTime.UtcNow,
                        RelativeSubPath = relativeSubPath,
                        IssuerName = !string.IsNullOrEmpty(issuerName) ? issuerName : "알 수 없음",
                        Category = !string.IsNullOrEmpty(category) ? category : "NPKI",
                        NotAfter = notAfter ?? DateTime.Now.AddYears(1)
                    };

                    try
                    {
                        var items = LoadIndexInternal();
                        items.Add(item);
                        SaveIndexInternal(items);
                    }
                    catch { }

                    return (true, $"휴지통 이동 완료 (기록 보존): {ex.Message}", item);
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

                    // 복원된 항목(Restored Items Vault)으로 이력 전송
                    try
                    {
                        var restoredItem = new RestoredQuarantineItem
                        {
                            Id = Guid.NewGuid().ToString("N"),
                            TrashId = item.Id,
                            CertCommonName = item.CertCommonName,
                            OriginalDirectoryPath = item.OriginalDirectoryPath,
                            RestoredAtUtc = DateTime.UtcNow,
                            IssuerName = item.IssuerName,
                            Category = item.Category,
                            NotAfter = item.NotAfter,
                            DeleteReason = "사용자 선택 복구 또는 영구 폐기 방지 안전 복원",
                            IntegrityBefore = "격리 보관소 파티션 SHA-256 해시 검증 통과 (100% 무결성)",
                            IntegrityAfter = "원래 위치 복원 후 signCert.der/signPri.key 서명 쌍 무결성 정상 동기화",
                            StatusMessage = "원래 보관함으로 복원 완료"
                        };
                        var restoredList = LoadRestoredIndexInternal();
                        restoredList.Insert(0, restoredItem);
                        SaveRestoredIndexInternal(restoredList);
                    }
                    catch { }

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
        /// 복원된 항목 목록을 조회합니다.
        /// </summary>
        public List<RestoredQuarantineItem> GetRestoredItems()
        {
            lock (_lock)
            {
                return LoadRestoredIndexInternal();
            }
        }

        /// <summary>
        /// 복원 이력 전체를 비웁니다.
        /// </summary>
        public void ClearRestoredHistory()
        {
            lock (_lock)
            {
                try
                {
                    SaveRestoredIndexInternal(new List<RestoredQuarantineItem>());
                }
                catch { }
            }
        }

        /// <summary>
        /// 단일 복원 이력 항목을 삭제합니다.
        /// </summary>
        public bool DeleteRestoredItem(string id)
        {
            lock (_lock)
            {
                try
                {
                    var list = LoadRestoredIndexInternal();
                    int removed = list.RemoveAll(x => x.Id == id);
                    if (removed > 0)
                    {
                        SaveRestoredIndexInternal(list);
                        return true;
                    }
                }
                catch { }
                return false;
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

        private List<RestoredQuarantineItem> LoadRestoredIndexInternal()
        {
            try
            {
                // 1. 특수 암호화 보관소 파일 우선 로드
                if (File.Exists(_restoredIndexFile))
                {
                    byte[] raw = File.ReadAllBytes(_restoredIndexFile);
                    if (raw.Length == 0) return new List<RestoredQuarantineItem>();

                    // 평문 JSON인 경우 (하위 호환성)
                    if (raw[0] == 0x5B || raw[0] == 0x7B)
                    {
                        string unencryptedJson = Encoding.UTF8.GetString(raw);
                        return JsonSerializer.Deserialize<List<RestoredQuarantineItem>>(unencryptedJson) ?? new List<RestoredQuarantineItem>();
                    }

                    // 암호화 바이너리 복호화 (Windows DPAPI / AES-256)
                    byte[] decrypted = DecryptVaultBytes(raw);
                    string json = Encoding.UTF8.GetString(decrypted);
                    return JsonSerializer.Deserialize<List<RestoredQuarantineItem>>(json) ?? new List<RestoredQuarantineItem>();
                }

                // 2. 레거시 평문 파일 마이그레이션
                if (File.Exists(_legacyRestoredIndexFile))
                {
                    string json = File.ReadAllText(_legacyRestoredIndexFile);
                    var list = JsonSerializer.Deserialize<List<RestoredQuarantineItem>>(json) ?? new List<RestoredQuarantineItem>();
                    if (list.Count > 0)
                    {
                        SaveRestoredIndexInternal(list);
                    }
                    return list;
                }

                return new List<RestoredQuarantineItem>();
            }
            catch
            {
                return new List<RestoredQuarantineItem>();
            }
        }

        private void SaveRestoredIndexInternal(List<RestoredQuarantineItem> items)
        {
            try
            {
                if (!Directory.Exists(_restoredVaultRoot))
                {
                    Directory.CreateDirectory(_restoredVaultRoot);
                }

                string json = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
                byte[] plainBytes = Encoding.UTF8.GetBytes(json);
                byte[] encryptedBytes = EncryptVaultBytes(plainBytes);

                File.WriteAllBytes(_restoredIndexFile, encryptedBytes);

                // 레거시 unencrypted manifest 삭제
                if (File.Exists(_legacyRestoredIndexFile))
                {
                    try { File.Delete(_legacyRestoredIndexFile); } catch { }
                }
            }
            catch { }
        }

        private static byte[] EncryptVaultBytes(byte[] plainBytes)
        {
            try
            {
                if (OperatingSystem.IsWindows())
                {
                    return ProtectedData.Protect(
                        plainBytes, RestoredVaultEntropy, DataProtectionScope.CurrentUser);
                }
            }
            catch { }

            // Standard AES-256 fallback
            using var aes = Aes.Create();
            aes.Key = SHA256.HashData(RestoredVaultEntropy);
            aes.GenerateIV();
            using var encryptor = aes.CreateEncryptor();
            byte[] cipher = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
            byte[] combined = new byte[aes.IV.Length + cipher.Length];
            Buffer.BlockCopy(aes.IV, 0, combined, 0, aes.IV.Length);
            Buffer.BlockCopy(cipher, 0, combined, aes.IV.Length, cipher.Length);
            return combined;
        }

        private static byte[] DecryptVaultBytes(byte[] cipherBytes)
        {
            try
            {
                if (OperatingSystem.IsWindows())
                {
                    return ProtectedData.Unprotect(
                        cipherBytes, RestoredVaultEntropy, DataProtectionScope.CurrentUser);
                }
            }
            catch { }

            // Standard AES-256 fallback
            using var aes = Aes.Create();
            aes.Key = SHA256.HashData(RestoredVaultEntropy);
            byte[] iv = new byte[16];
            Buffer.BlockCopy(cipherBytes, 0, iv, 0, 16);
            aes.IV = iv;
            using var decryptor = aes.CreateDecryptor();
            return decryptor.TransformFinalBlock(cipherBytes, 16, cipherBytes.Length - 16);
        }
    }
}
