using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace KCertManager.Wpf.Models
{
    public class BackupHistoryItem
    {
        public int IndexNumber { get; set; }
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string CertCommonName { get; set; } = string.Empty;
        public string SourcePath { get; set; } = string.Empty;
        public string DestinationPath { get; set; } = string.Empty;
        public string TargetDrive { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }
        public string Sha256Hash { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public long TotalBytesCopied { get; set; }
        public string FileSizeDetails { get; set; } = string.Empty;

        public string FormattedTotalSize => TotalBytesCopied > 1024 
            ? $"{(TotalBytesCopied / 1024.0):F1} KB" 
            : $"{TotalBytesCopied} B";
    }

    public class TrashItem : INotifyPropertyChanged
    {
        private bool _isSelected;
        private int _indexNumber;

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public int IndexNumber
        {
            get => _indexNumber;
            set
            {
                if (_indexNumber != value)
                {
                    _indexNumber = value;
                    OnPropertyChanged();
                }
            }
        }

        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime DeletedAt { get; set; } = DateTime.Now;
        public string CertCommonName { get; set; } = string.Empty;
        public string OriginalDirectoryPath { get; set; } = string.Empty;
        public string TrashDirectoryPath { get; set; } = string.Empty;
        public string IssuerName { get; set; } = string.Empty;
        public CertCategory Category { get; set; }
        public DateTime NotAfter { get; set; }

        public bool IsSelected
        {
            get => _isSelected;
            set
            {
                if (_isSelected != value)
                {
                    _isSelected = value;
                    OnPropertyChanged();
                }
            }
        }
    }

    public class RestoredTrashItem : INotifyPropertyChanged
    {
        private int _indexNumber;

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public int IndexNumber
        {
            get => _indexNumber;
            set
            {
                if (_indexNumber != value)
                {
                    _indexNumber = value;
                    OnPropertyChanged();
                }
            }
        }

        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime RestoredAt { get; set; } = DateTime.Now;
        public string CertCommonName { get; set; } = string.Empty;
        public string OriginalDirectoryPath { get; set; } = string.Empty;
        public string IssuerName { get; set; } = string.Empty;
        public CertCategory Category { get; set; } = CertCategory.NPKI;
        public DateTime NotAfter { get; set; } = DateTime.Now;
        public string DeleteReason { get; set; } = "사용자 삭제 조치 후 안전 복구됨";
        public string IntegrityBefore { get; set; } = "격리 보관 검증 완료 (SHA-256 무결성 일치)";
        public string IntegrityAfter { get; set; } = "원래 위치 복원 후 인증서/개인키 Pair 검증 정상";
        public string StatusBadge { get; set; } = "✓ 원본 보관함으로 복원 완료";
    }
}
