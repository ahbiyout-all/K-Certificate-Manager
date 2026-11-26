using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using KCert.Core.Vault;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Services
{
    public class CertificateBackupService
    {
        private readonly SafetyTrashManager _trashManager = new();

        public TransferPlan BuildUnifiedTransferPlan(
            IEnumerable<CertificateItem> sources,
            DriveItem targetDrive,
            string conflictOption = "overwrite",
            IEnumerable<CertificateItem>? existingCertSnapshots = null,
            string? targetUsername = null,
            bool checkPhysicalDiskForDuplicates = true)
        {
            if (targetDrive == null) throw new ArgumentNullException(nameof(targetDrive));
            return BuildUnifiedTransferPlan(
                sources,
                targetDrive.Name,
                targetDrive.IsRemovable,
                conflictOption,
                existingCertSnapshots,
                targetUsername,
                checkPhysicalDiskForDuplicates);
        }

        public TransferPlan BuildUnifiedTransferPlan(
            IEnumerable<CertificateItem> sources,
            string targetDriveLetter,
            bool isTargetRemovable,
            string conflictOption = "overwrite",
            IEnumerable<CertificateItem>? existingCertSnapshots = null,
            string? targetUsername = null,
            bool checkPhysicalDiskForDuplicates = true)
        {
            var sourceSpecs = (sources ?? Enumerable.Empty<CertificateItem>())
                .Where(c => c != null)
                .Select(c => new TransferSourceSpec
                {
                    Id = !string.IsNullOrWhiteSpace(c.DerFilePath)
                        ? c.DerFilePath
                        : (c.DirectoryPath ?? string.Empty),
                    CommonName = c.CommonName ?? string.Empty,
                    Category = c.Category.ToString(),
                    IssuerName = c.IssuerName ?? string.Empty,
                    SerialNumber = c.SerialNumber ?? string.Empty,
                    DirectoryPath = c.DirectoryPath ?? string.Empty,
                    DerFilePath = c.DerFilePath ?? string.Empty,
                    KeyFilePath = c.KeyFilePath ?? string.Empty,
                    DriveLetter = c.DriveLetter ?? string.Empty,
                    IsRemovableSource = c.IsRemovableMedia,
                    NotAfter = c.NotAfter
                })
                .ToList();

            var snapshots = (existingCertSnapshots ?? Enumerable.Empty<CertificateItem>())
                .Where(c => c != null)
                .Select(c => new ExistingTargetCertSnapshot
                {
                    DirectoryPath = c.DirectoryPath ?? string.Empty,
                    DerFilePath = c.DerFilePath ?? string.Empty,
                    DriveLetter = c.DriveLetter ?? string.Empty,
                    Category = c.Category.ToString(),
                    CommonName = c.CommonName ?? string.Empty,
                    IssuerName = c.IssuerName ?? string.Empty,
                    SerialNumber = c.SerialNumber ?? string.Empty
                })
                .ToList();

            var endpoint = new TransferTargetEndpoint
            {
                TargetDriveRoot = targetDriveLetter ?? string.Empty,
                TargetDriveLabel = targetDriveLetter ?? string.Empty,
                IsTargetRemovable = isTargetRemovable,
                TargetUsername = string.IsNullOrWhiteSpace(targetUsername) ? Environment.UserName : targetUsername
            };

            var strategy = UnifiedTransferPlanner.ParseConflictStrategy(conflictOption);
            return UnifiedTransferPlanner.BuildPlan(
                sourceSpecs,
                endpoint,
                strategy,
                snapshots,
                checkPhysicalDiskForDuplicates);
        }

        public TransferBatchExecutionResult ExecuteUnifiedTransferPlan(TransferPlan plan)
        {
            return UnifiedTransferExecutor.ExecutePlan(plan);
        }

        public BackupHistoryItem BackupCertificateToDrive(CertificateItem cert, string targetDriveLetter)
        {
            var result = new BackupHistoryItem
            {
                CertCommonName = cert?.CommonName ?? string.Empty,
                SourcePath = cert?.DirectoryPath ?? string.Empty,
                TargetDrive = targetDriveLetter ?? string.Empty,
            };

            try
            {
                if (cert == null || string.IsNullOrWhiteSpace(cert.DirectoryPath) || !Directory.Exists(cert.DirectoryPath))
                {
                    throw new DirectoryNotFoundException("원본 인증서 디렉터리를 찾을 수 없습니다.");
                }
                if (string.IsNullOrWhiteSpace(targetDriveLetter))
                {
                    throw new ArgumentException("대상 드라이브가 지정되지 않았습니다.", nameof(targetDriveLetter));
                }

                var plan = BuildUnifiedTransferPlan(
                    new[] { cert },
                    targetDriveLetter,
                    isTargetRemovable: false,
                    conflictOption: "overwrite",
                    checkPhysicalDiskForDuplicates: false);

                var batchResult = ExecuteUnifiedTransferPlan(plan);
                var itemResult = batchResult.ItemResults.FirstOrDefault();

                if (itemResult == null)
                {
                    result.IsSuccess = false;
                    result.Message = "통합 전송 엔진 실행 결과를 생성하지 못했습니다.";
                    return result;
                }

                result.DestinationPath = itemResult.DestinationDirectory;
                result.IsSuccess = itemResult.IsSuccess && !itemResult.WasSkipped;
                result.Sha256Hash = itemResult.DerSha256;
                result.Message = itemResult.Message;
                result.TotalBytesCopied = itemResult.TotalBytesCopied;
                result.FileSizeDetails = itemResult.FileSizeDetails;
            }
            catch (Exception ex)
            {
                result.IsSuccess = false;
                result.Message = $"백업 실패: {ex.Message}";
            }

            return result;
        }

        public CertTransferResult CopyCertificateToLocalPc(
            string sourceDirectory,
            string targetCategory = "NPKI",
            string username = "",
            string targetDriveLetter = "C:",
            string? specificDerFilePath = null,
            string? specificKeyFilePath = null)
        {
            if (string.IsNullOrWhiteSpace(sourceDirectory))
            {
                return new CertTransferResult
                {
                    IsSuccess = false,
                    SourceDirectory = string.Empty,
                    Message = "PC 복사 실패: 원본 인증서 디렉터리 경로가 비어 있습니다."
                };
            }

            try
            {
                var spec = new TransferSourceSpec
                {
                    Id = !string.IsNullOrWhiteSpace(specificDerFilePath) ? specificDerFilePath : sourceDirectory,
                    CommonName = Path.GetFileName(sourceDirectory.TrimEnd('\\', '/')),
                    Category = targetCategory ?? "NPKI",
                    DirectoryPath = sourceDirectory,
                    DerFilePath = specificDerFilePath ?? string.Empty,
                    KeyFilePath = specificKeyFilePath ?? string.Empty,
                    IsRemovableSource = true
                };

                var endpoint = new TransferTargetEndpoint
                {
                    TargetDriveRoot = string.IsNullOrWhiteSpace(targetDriveLetter) ? "C:\\" : targetDriveLetter,
                    TargetDriveLabel = string.IsNullOrWhiteSpace(targetDriveLetter) ? "C:" : targetDriveLetter,
                    IsTargetRemovable = false,
                    TargetUsername = string.IsNullOrWhiteSpace(username) ? Environment.UserName : username
                };

                var plan = UnifiedTransferPlanner.BuildPlan(
                    new[] { spec },
                    endpoint,
                    TransferConflictStrategy.Overwrite,
                    checkPhysicalDiskForDuplicates: false);

                var batchResult = UnifiedTransferExecutor.ExecutePlan(plan);
                var itemResult = batchResult.ItemResults.FirstOrDefault();

                if (itemResult == null)
                {
                    return new CertTransferResult
                    {
                        IsSuccess = false,
                        SourceDirectory = sourceDirectory,
                        Message = "PC 복사 실패: 전송 계획 항목이 비어 있습니다."
                    };
                }

                return new CertTransferResult
                {
                    IsSuccess = itemResult.IsSuccess && !itemResult.WasSkipped,
                    SourceDirectory = sourceDirectory,
                    DestinationDirectory = itemResult.DestinationDirectory,
                    DerSha256 = itemResult.DerSha256,
                    TotalBytesCopied = itemResult.TotalBytesCopied,
                    Message = itemResult.Message
                };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Copy To PC Error] {ex.Message}");
                return new CertTransferResult
                {
                    IsSuccess = false,
                    SourceDirectory = sourceDirectory ?? string.Empty,
                    Message = $"PC 복사 실패: {ex.Message}"
                };
            }
        }

        public TrashItem MoveToTrash(CertificateItem cert)
        {
            if (cert == null)
            {
                throw new ArgumentNullException(nameof(cert));
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

            if (!success || item == null)
            {
                throw new IOException(string.IsNullOrWhiteSpace(msg)
                    ? "인증서를 안전 휴지통으로 이동하지 못했습니다."
                    : msg);
            }

            return new TrashItem
            {
                Id = item.Id,
                DeletedAt = item.DeletedAtUtc.ToLocalTime(),
                CertCommonName = commonName,
                OriginalDirectoryPath = certDir,
                TrashDirectoryPath = item.QuarantinedFolderPath ?? string.Empty,
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
                    DeleteReason = !string.IsNullOrEmpty(r.DeleteReason) ? r.DeleteReason : "사용자 선택 복원 (암호화 보관)",
                    IntegrityBefore = !string.IsNullOrEmpty(r.IntegrityBefore) ? r.IntegrityBefore : "암호화 보관함 파일 손상 검사 통과 (SHA-256)",
                    IntegrityAfter = !string.IsNullOrEmpty(r.IntegrityAfter) ? r.IntegrityAfter : "원래 위치 복원 및 암호화 사본 저장 완료",
                    StatusBadge = "🔒 암호화 압축 보관 완료",
                    IsZipEncrypted = true,
                    EncryptionLevel = !string.IsNullOrEmpty(r.EncryptionLevel) ? r.EncryptionLevel : "Windows 사용자 암호화(DPAPI) + AES-256",
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
