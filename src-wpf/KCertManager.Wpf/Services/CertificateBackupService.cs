using System;
using System.Collections.Generic;
using System.IO;
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
                var transfer = CertTransferEngine.Transfer(cert.DirectoryPath, targetDriveLetter, relativePath);

                result.DestinationPath = transfer.DestinationDirectory;
                result.IsSuccess = transfer.IsSuccess;
                result.Sha256Hash = transfer.DerSha256;
                result.Message = transfer.Message;
            }
            catch (Exception ex)
            {
                result.IsSuccess = false;
                result.Message = $"백업 실패: {ex.Message}";
            }

            return result;
        }

        public bool CopyCertificateToLocalPc(string sourceDirectory, string targetCategory = "NPKI", string username = "")
        {
            try
            {
                if (string.IsNullOrEmpty(username))
                    username = Environment.UserName;

                var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                var targetRoot = Path.Combine(userProfile, "AppData", "LocalLow");

                string relativePath = CertTransferEngine.ResolveRelativePath(sourceDirectory);
                var transfer = CertTransferEngine.Transfer(sourceDirectory, targetRoot, relativePath);

                return transfer.IsSuccess;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Copy To PC Error] {ex.Message}");
                return false;
            }
        }

        public TrashItem MoveToTrash(CertificateItem cert)
        {
            string relPath = CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
            var (success, msg, item) = _trashManager.MoveToTrash(cert.DirectoryPath, cert.CommonName, relPath);

            return new TrashItem
            {
                Id = item?.Id ?? Guid.NewGuid().ToString("N"),
                DeletedAt = item?.DeletedAtUtc.ToLocalTime() ?? DateTime.Now,
                CertCommonName = cert.CommonName,
                OriginalDirectoryPath = cert.DirectoryPath,
                TrashDirectoryPath = item?.QuarantinedFolderPath ?? string.Empty,
                IssuerName = cert.IssuerName,
                Category = cert.Category,
                NotAfter = cert.NotAfter
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

            foreach (var r in rawItems)
            {
                list.Add(new TrashItem
                {
                    Id = r.Id,
                    DeletedAt = r.DeletedAtUtc.ToLocalTime(),
                    CertCommonName = r.CertCommonName,
                    OriginalDirectoryPath = r.OriginalDirectoryPath,
                    TrashDirectoryPath = r.QuarantinedFolderPath,
                    IssuerName = "알 수 없음",
                    Category = CertCategory.NPKI,
                    NotAfter = DateTime.Now.AddYears(1)
                });
            }

            return list;
        }
    }
}
