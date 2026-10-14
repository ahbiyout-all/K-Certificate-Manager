using System;
using System.IO;

namespace KCert.Core.HardwareGuard
{
    /// <summary>
    /// USB 이동식 드라이브 상세 하드웨어 및 파일시스템 정보
    /// </summary>
    public class UsbDriveInfoItem
    {
        /// <summary>드라이브 문자 (예: "E:\")</summary>
        public string DriveLetter { get; set; } = string.Empty;

        /// <summary>볼륨 라벨 명칭 (예: "USB DISK")</summary>
        public string VolumeLabel { get; set; } = string.Empty;

        /// <summary>파일 시스템 포맷 (FAT32, NTFS, exFAT 등)</summary>
        public string FileSystem { get; set; } = "FAT32";

        /// <summary>전체 용량 (바이트)</summary>
        public long TotalSizeBytes { get; set; }

        /// <summary>사용 가능한 여유 용량 (바이트)</summary>
        public long AvailableFreeSpaceBytes { get; set; }

        /// <summary>쓰기 가능(Writeable) 여부 (읽기 전용 락 감지)</summary>
        public bool IsWritable { get; set; } = true;

        /// <summary>드라이브 내 NPKI/GPKI/EPKI 공인인증서 폴더 존재 여부</summary>
        public bool HasCertFolder { get; set; }

        /// <summary>UI 표시용 라벨</summary>
        public string DisplayName => string.IsNullOrWhiteSpace(VolumeLabel) 
            ? $"이동식 디스크 ({DriveLetter})" 
            : $"{VolumeLabel} ({DriveLetter})";

        /// <summary>용량 요약 텍스트</summary>
        public string FreeSpaceSummary
        {
            get
            {
                double freeGb = AvailableFreeSpaceBytes / (1024.0 * 1024 * 1024);
                double totalGb = TotalSizeBytes / (1024.0 * 1024 * 1024);
                return $"{freeGb:0.1} GB 사용 가능 / 총 {totalGb:0.1} GB";
            }
        }
    }
}
