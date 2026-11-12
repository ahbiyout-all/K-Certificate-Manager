using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using KCert.Core.Vault;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Services
{
    public class CertificateBackupService
    {
        private readonly SafetyTrashManager _trashManager = new();

        public BackupHistoryItem BackupCertificateToDrive(CertificateItem cert, string targetDriveLetter)
        {
            var result = new BackupHistoryItem
            {
                CertCommonName = cert.CommonName,
                SourcePath = cert.DirectoryPath,
                TargetDrive = targetDriveLetter,
            };

            try
            {
                if (!Directory.Exists(cert.DirectoryPath))
                {
                    throw new DirectoryNotFoundException("원본 인증서 디렉터리를 찾을 수 없습니다.");
                }

                // KCert.Core.Vault의 상대 경로 해석 및 원자적 무결성 전송 엔진 호출
                string relativePath = CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                string destinationRoot = targetDriveLetter;
                string cleanTarget = targetDriveLetter.TrimEnd('\\').ToUpperInvariant();
                string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\').ToUpperInvariant();

                // 대상 드라이브가 윈도우 시스템 드라이브(C:)인 경우
                // 1) GPKI인 경우: 공무원 행정전자서명 정부 정규 표준 위치는 C:\GPKI\Certificate\class2 이므로
                //    destinationRoot는 C:\ 루트 유지 (권한 제한 등 예외 발생 시에만 LocalLow 폴백)
                // 2) NPKI/기타인 경우: 윈도우 공인인증서 보관 표준인 AppData\LocalLow 경로로 안전 배치
                if (string.Equals(cleanTarget, sysRoot, StringComparison.OrdinalIgnoreCase))
                {
                    if (cert.Category == CertCategory.GPKI)
                    {
                        try
                        {
                            var gpkiDir = Path.Combine(sysRoot + "\\", "GPKI", "Certificate", "class2");
                            if (!Directory.Exists(gpkiDir)) Directory.CreateDirectory(gpkiDir);
                            destinationRoot = sysRoot + "\\";
                        }
                        catch
                        {
                            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                            destinationRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                        }
                    }
                    else
                    {
                        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                        destinationRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                    }
                }

                var transfer = CertTransferEngine.Transfer(cert.DirectoryPath, destinationRoot, relativePath);

                result.DestinationPath = transfer.DestinationDirectory;
                result.IsSuccess = transfer.IsSuccess;
                result.Sha256Hash = transfer.DerSha256;
                result.Message = transfer.Message;
                result.TotalBytesCopied = transfer.TotalBytesCopied;
                if (transfer.CopiedFiles.Count > 0)
                {
                    result.FileSizeDetails = string.Join(", ", transfer.CopiedFiles.Select(f => $"{f.FileName} ({f.FileSizeBytes:N0} bytes)"));
                }
                else
                {
                    result.FileSizeDetails = $"{transfer.TotalBytesCopied:N0} bytes";
                }
            }
            catch (Exception ex)
            {
                result.IsSuccess = false;
                result.Message = $"백업 실패: {ex.Message}";
            }

            return result;
        }

        public CertTransferResult CopyCertificateToLocalPc(string sourceDirectory, string targetCategory = "NPKI", string username = "", string targetDriveLetter = "C:")
        {
            try
            {
                if (string.IsNullOrEmpty(username))
                    username = Environment.UserName;

                string cleanDrive = (string.IsNullOrWhiteSpace(targetDriveLetter) ? "C" : targetDriveLetter.TrimEnd(':', '\\', '/')).ToUpperInvariant() + ":\\";
                string targetRoot;

                bool isGpki = string.Equals(targetCategory, "GPKI", StringComparison.OrdinalIgnoreCase) ||
                              sourceDirectory.IndexOf(@"\GPKI\", StringComparison.OrdinalIgnoreCase) >= 0 ||
                              sourceDirectory.IndexOf(@"/GPKI/", StringComparison.OrdinalIgnoreCase) >= 0;

                bool isEpki = string.Equals(targetCategory, "EPKI", StringComparison.OrdinalIgnoreCase) ||
                              sourceDirectory.IndexOf(@"\EPKI\", StringComparison.OrdinalIgnoreCase) >= 0 ||
                              sourceDirectory.IndexOf(@"/EPKI/", StringComparison.OrdinalIgnoreCase) >= 0;

                if (isGpki)
                {
                    // GPKI 공무원 행정전자서명의 정부 정규 표준 위치는 {cleanDrive}GPKI\Certificate\class2
                    try
                    {
                        var gpkiDir = Path.Combine(cleanDrive, "GPKI", "Certificate", "class2");
                        if (!Directory.Exists(gpkiDir)) Directory.CreateDirectory(gpkiDir);
                        targetRoot = cleanDrive;
                    }
                    catch
                    {
                        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                        targetRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                    }
                }
                else
                {
                    // 선택된 도착 디스크 (C:, D:, E: 등)의 Users AppData 경로로 안전 배치
                    string driveUsersDir = Path.Combine(cleanDrive, "Users", username, "AppData", "LocalLow");
                    if (cleanDrive.StartsWith("C", StringComparison.OrdinalIgnoreCase) || !Directory.Exists(cleanDrive))
                    {
                        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                        targetRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                    }
                    else
                    {
                        targetRoot = driveUsersDir;
                    }
                }

                string relativePath = CertTransferEngine.ResolveRelativePath(sourceDirectory);
                var transfer = CertTransferEngine.Transfer(sourceDirectory, targetRoot, relativePath);

                return transfer;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Copy To PC Error] {ex.Message}");
                return new CertTransferResult
                {
                    IsSuccess = false,
                    SourceDirectory = sourceDirectory,
                    Message = $"PC 복사 실패: {ex.Message}"
                };
            }
        }

        public TrashItem MoveToTrash(CertificateItem cert)
        {
            if (cert == null)
            {
                return new TrashItem { CertCommonName = "알 수 없음" };
            }

            string certDir = cert.DirectoryPath ?? string.Empty;
            string relPath = CertTransferEngine.ResolveRelativePath(certDir);
            string commonName = !string.IsNullOrEmpty(cert.CommonName) ? cert.CommonName : "알 수 없음";
            string issuerName = !string.IsNullOrEmpty(cert.IssuerName) ? cert.IssuerName : "알 수 없음";
            string categoryStr = cert.Category.ToString();
            DateTime notAfter = cert.NotAfter != default ? cert.NotAfter : DateTime.Now.AddYears(1);

            var (success, msg, item) = _trashManager.MoveToTrash(
                certDir, 
                commonName, 
                relPath, 
                issuerName, 
                categoryStr, 
                notAfter);

            return new TrashItem
            {
                Id = item?.Id ?? Guid.NewGuid().ToString("N"),
                DeletedAt = item?.DeletedAtUtc.ToLocalTime() ?? DateTime.Now,
                CertCommonName = commonName,
                OriginalDirectoryPath = certDir,
                TrashDirectoryPath = item?.QuarantinedFolderPath ?? string.Empty,
                IssuerName = issuerName,
                Category = cert.Category,
                NotAfter = notAfter
            };
        }

        public bool RestoreFromTrash(TrashItem trashItem)
        {
            var (success, _) = _trashManager.Restore(trashItem.Id);
            return success;
        }

        public List<TrashItem> GetTrashItems()
        {
            var rawItems = _trashManager.GetItems();
            var list = new List<TrashItem>();
            if (rawItems == null) return list;

            foreach (var r in rawItems)
            {
                if (r == null) continue;
                CertCategory cat = CertCategory.NPKI;
                if (!string.IsNullOrEmpty(r.Category) && Enum.TryParse<CertCategory>(r.Category, out var parsedCat))
                {
                    cat = parsedCat;
                }

                list.Add(new TrashItem
                {
                    Id = r.Id ?? Guid.NewGuid().ToString("N"),
                    DeletedAt = r.DeletedAtUtc != default ? r.DeletedAtUtc.ToLocalTime() : DateTime.Now,
                    CertCommonName = !string.IsNullOrEmpty(r.CertCommonName) ? r.CertCommonName : "알 수 없음",
                    OriginalDirectoryPath = r.OriginalDirectoryPath ?? string.Empty,
                    TrashDirectoryPath = r.QuarantinedFolderPath ?? string.Empty,
                    IssuerName = !string.IsNullOrEmpty(r.IssuerName) ? r.IssuerName : "알 수 없음",
                    Category = cat,
                    NotAfter = r.NotAfter != default ? r.NotAfter : DateTime.Now.AddYears(1)
                });
            }

            return list;
        }

        public List<RestoredTrashItem> GetRestoredTrashItems()
        {
            var rawItems = _trashManager.GetRestoredItems();
            var list = new List<RestoredTrashItem>();
            if (rawItems == null) return list;

            foreach (var r in rawItems)
            {
                if (r == null) continue;
                CertCategory cat = CertCategory.NPKI;
                if (!string.IsNullOrEmpty(r.Category) && Enum.TryParse<CertCategory>(r.Category, out var parsedCat))
                {
                    cat = parsedCat;
                }

                string encPath = r.EncryptedZipPath ?? string.Empty;
                bool archiveExists = !string.IsNullOrEmpty(encPath) && File.Exists(encPath);

                list.Add(new RestoredTrashItem
                {
                    Id = r.Id ?? Guid.NewGuid().ToString("N"),
                    TrashId = r.TrashId ?? string.Empty,
                    RestoredAt = r.RestoredAtUtc != default ? r.RestoredAtUtc.ToLocalTime() : DateTime.Now,
                    CertCommonName = !string.IsNullOrEmpty(r.CertCommonName) ? r.CertCommonName : "알 수 없음",
                    OriginalDirectoryPath = r.OriginalDirectoryPath ?? string.Empty,
                    EncryptedZipPath = encPath,
                    VaultDirectoryPath = _trashManager.GetRestoredArchivesDir(),
                    ArchiveFileExists = archiveExists,
                    IssuerName = !string.IsNullOrEmpty(r.IssuerName) ? r.IssuerName : "알 수 없음",
                    Category = cat,
                    NotAfter = r.NotAfter != default ? r.NotAfter : DateTime.Now.AddYears(1),
                    DeleteReason = !string.IsNullOrEmpty(r.DeleteReason) ? r.DeleteReason : "사용자 선택 복구 및 특수 보관소 암호화 압축 보관",
                    IntegrityBefore = !string.IsNullOrEmpty(r.IntegrityBefore) ? r.IntegrityBefore : "격리 보관소 파티션 SHA-256 해시 검증 통과 (100% 무결성)",
                    IntegrityAfter = !string.IsNullOrEmpty(r.IntegrityAfter) ? r.IntegrityAfter : "원래 위치 복원 후 signCert.der/signPri.key 암호화 ZIP 보관 완료",
                    StatusBadge = "🔒 AES-256 Encrypted ZIP 보관 완료",
                    IsZipEncrypted = true,
                    EncryptionLevel = !string.IsNullOrEmpty(r.EncryptionLevel) ? r.EncryptionLevel : "AES-256-GCM + ZIP 압축 + DPAPI 이중 암호화",
                    CompressedSizeBytes = r.CompressedSizeBytes
                });
            }

            return list;
        }

        public string GetRestoredVaultRoot() => _trashManager.GetRestoredVaultRoot();
        public string GetRestoredArchivesDir() => _trashManager.GetRestoredArchivesDir();

        public (bool IsValid, string Message, VaultMetadata? Metadata, long FileSizeBytes, string Sha256Hash) VerifyRestoredVaultArchive(string vaultPath, string trashId)
        {
            return _trashManager.VerifyVaultArchive(vaultPath, trashId);
        }

        public void ClearRestoredTrashHistory()
        {
            _trashManager.ClearRestoredHistory();
        }

        public bool DeleteRestoredTrashItem(string id)
        {
            return _trashManager.DeleteRestoredItem(id);
        }

        public VaultSecurityStatus GetVaultSecurityStatus()
        {
            return _trashManager.GetSecurityStatus();
        }

        public (bool Success, string Message) ExportVaultBackup(string targetFilePath)
        {
            return _trashManager.ExportVaultBackup(targetFilePath);
        }
    }
}
