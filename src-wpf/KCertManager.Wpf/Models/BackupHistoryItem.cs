using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

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

    public class TrashItem : INotifyPropertyChanged
    {
        private bool _isSelected;

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
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
}
