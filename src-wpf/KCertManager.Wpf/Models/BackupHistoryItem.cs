using System;

namespace KCertManager.Wpf.Models
{
    public class BackupHistoryItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string CertCommonName { get; set; } = string.Empty;
        public string SourcePath { get; set; } = string.Empty;
        public string DestinationPath { get; set; } = string.Empty;
        public string TargetDrive { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }
        public string Sha256Hash { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class TrashItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime DeletedAt { get; set; } = DateTime.Now;
        public string CertCommonName { get; set; } = string.Empty;
        public string OriginalDirectoryPath { get; set; } = string.Empty;
        public string TrashDirectoryPath { get; set; } = string.Empty;
        public string IssuerName { get; set; } = string.Empty;
        public CertCategory Category { get; set; }
        public DateTime NotAfter { get; set; }
    }
}
