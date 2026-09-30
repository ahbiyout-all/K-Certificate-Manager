using System;

namespace KCert.Core.Discovery
{
    /// <summary>
    /// 디스크에서 발견된 인증서 위치 정보
    /// </summary>
    public record DiscoveredCertLocation
    {
        /// <summary>인증서 폴더 경로</summary>
        public string DirectoryPath { get; init; } = string.Empty;

        /// <summary>signCert.der 공개키 경로</summary>
        public string DerFilePath { get; init; } = string.Empty;

        /// <summary>signPri.key 개인키 경로 (없으면 빈 문자열)</summary>
        public string KeyFilePath { get; init; } = string.Empty;

        /// <summary>인증서 체계 (NPKI, GPKI, EPKI)</summary>
        public string Category { get; init; } = "NPKI";

        /// <summary>발견된 드라이브 루트 (예: C:\, E:\)</summary>
        public string DriveRoot { get; init; } = string.Empty;

        /// <summary>USB 이동식 미디어 여부</summary>
        public bool IsRemovableMedia { get; init; }
    }
}
