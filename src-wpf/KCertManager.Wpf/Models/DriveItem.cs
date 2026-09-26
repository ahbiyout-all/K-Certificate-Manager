using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace KCertManager.Wpf.Models
{
    public class DriveItem : INotifyPropertyChanged
    {
        private int _certificateCount;

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public string Name { get; set; } = string.Empty; // e.g., "E:\"
        public string VolumeLabel { get; set; } = string.Empty;
        public long TotalSize { get; set; }
        public long FreeSpace { get; set; }
        public bool IsRemovable { get; set; }
        public bool IsReady { get; set; }

        public int CertificateCount
        {
            get => _certificateCount;
            set
            {
                if (_certificateCount != value)
                {
                    _certificateCount = value;
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(IsEmptyUsb));
                    OnPropertyChanged(nameof(StatusBadgeText));
                    OnPropertyChanged(nameof(DisplayName));
                }
            }
        }

        public string DeviceKind { get; set; } = "usb_flash"; // "external_ssd", "fast_usb", "usb_flash", "internal_fixed"
        public string DeviceKindName { get; set; } = "이동식 USB 메모리"; // "외장 SSD", "고속 USB 메모리", "이동식 USB 메모리", "내장 디스크"

        // Hardware details (NVMe / SATA / USB, SSD vs HDD)
        public string BusType { get; set; } = "USB"; // "NVMe", "SATA", "USB", "SCSI", "IDE"
        public string DiskMediaType { get; set; } = "Flash"; // "SSD", "HDD", "Flash"
        public string PhysicalModel { get; set; } = string.Empty; // e.g., "Samsung SSD 980 PRO 1TB", "WDC WD10EZEX"
        public string PhysicalPortDetail { get; set; } = "이동식 USB 메모리"; // "내장 NVMe M.2 SSD", "내장 SATA3 SSD", "내장 SATA HDD", "외장 USB SSD", "이동식 USB 메모리"
        public string FileSystem { get; set; } = "NTFS";
        public string VolumeSerialNumber { get; set; } = string.Empty;

        public bool IsNvme => BusType.Equals("NVMe", StringComparison.OrdinalIgnoreCase);
        public bool IsSata => BusType.Equals("SATA", StringComparison.OrdinalIgnoreCase);
        public bool IsSsd => DiskMediaType.Equals("SSD", StringComparison.OrdinalIgnoreCase);
        public bool IsHdd => DiskMediaType.Equals("HDD", StringComparison.OrdinalIgnoreCase);

        public string BackupButtonText => $"⚡ 이 {DeviceKindName}로 백업";

        public bool IsEmptyUsb => IsRemovable && IsReady && CertificateCount == 0;

        public string StatusBadgeText
        {
            get
            {
                if (!IsReady) return "장치 준비 안 됨";
                if (CertificateCount == 0) return $"인증서 없음 (빈 {DeviceKindName})";
                return $"인증서 {CertificateCount}개 보관 중";
            }
        }

        public string DisplayName
        {
            get
            {
                var labelPart = string.IsNullOrEmpty(VolumeLabel) ? "" : $" [{VolumeLabel}]";
                if (!IsReady) return $"{Name}{labelPart} ({PhysicalPortDetail} - 준비 안 됨)";
                
                var certInfo = CertificateCount > 0 ? $" · 인증서 {CertificateCount}개" : (IsRemovable ? " · 빈 저장소" : "");
                return $"{Name}{labelPart} ({PhysicalPortDetail}{certInfo})";
            }
        }

        public string FormattedFreeSpace
        {
            get
            {
                if (!IsReady) return "(드라이브 준비 안 됨 또는 디스크 점검 필요)";
                if (TotalSize <= 0) return $"{FreeSpace / (1024.0 * 1024 * 1024):F1} GB 사용 가능";
                return $"{FreeSpace / (1024.0 * 1024 * 1024):F1} GB 여유 / {TotalSize / (1024.0 * 1024 * 1024):F1} GB";
            }
        }
    }
}
