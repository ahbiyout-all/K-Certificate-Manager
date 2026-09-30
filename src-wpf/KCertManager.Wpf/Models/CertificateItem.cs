using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;

namespace KCertManager.Wpf.Models
{
    public enum CertCategory
    {
        GPKI,   // 행정전자서명 (정부/지자체)
        EPKI,   // 교육기관전자서명 (교육청/학교)
        NPKI,   // 금융/공동인증서 (은행/범용)
        UNKNOWN
    }

    public enum ExpiryStatus
    {
        Valid,        // 정상 유효
        ExpiringSoon, // 30일 이내 만료 임박
        Expired       // 기간 만료
    }

    public class CertificateItem : INotifyPropertyChanged
    {
        private bool _isSelected;

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CommonName { get; set; } = string.Empty;
        public string SubjectDn { get; set; } = string.Empty;
        public string IssuerName { get; set; } = string.Empty;
        public string CaSignatureName { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public DateTime NotBefore { get; set; }
        public DateTime NotAfter { get; set; }
        public CertCategory Category { get; set; } = CertCategory.NPKI;
        public string DirectoryPath { get; set; } = string.Empty;
        public string DerFilePath { get; set; } = string.Empty;
        public string KeyFilePath { get; set; } = string.Empty;
        public long DerFileSize { get; set; }
        public long KeyFileSize { get; set; }
        public bool HasPrivateKey => !string.IsNullOrEmpty(KeyFilePath) && File.Exists(KeyFilePath);
        public bool IsRemovableMedia { get; set; }
        public string DriveLetter { get; set; } = string.Empty;
        public string Organization { get; set; } = string.Empty;
        public string OrganizationalUnit { get; set; } = string.Empty;
        public string SignatureAlgorithm { get; set; } = "sha256RSA";
        public string PolicyUsage { get; set; } = "일반 공동인증서";
        public string PolicyOid { get; set; } = string.Empty;
        public bool IsPairIntegrityValid { get; set; } = true;
        public string IntegrityMessage { get; set; } = "정상";
        public bool IsSystemCa { get; set; }
        public bool IsInstitutional { get; set; }

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

        public int RemainingDays
        {
            get
            {
                var endOfDay = NotAfter.Date.AddDays(1).AddSeconds(-1);
                if (NotAfter > endOfDay) endOfDay = NotAfter;
                return (int)Math.Ceiling((endOfDay - DateTime.Now).TotalDays);
            }
        }

        public ExpiryStatus Status
        {
            get
            {
                var endOfDay = NotAfter.Date.AddDays(1).AddSeconds(-1);
                if (NotAfter > endOfDay) endOfDay = NotAfter;

                if (DateTime.Now > endOfDay || RemainingDays <= 0)
                    return ExpiryStatus.Expired;
                if (RemainingDays <= 30)
                    return ExpiryStatus.ExpiringSoon;
                return ExpiryStatus.Valid;
            }
        }

        public string StatusDisplayText => Status switch
        {
            ExpiryStatus.Expired => "✕ 만료됨",
            ExpiryStatus.ExpiringSoon => $"⚠️ 만료 임박 ({RemainingDays}일)",
            _ => "✓ 유효함"
        };

        public string StatusColorHex => Status switch
        {
            ExpiryStatus.Expired => "#F43F5E",
            ExpiryStatus.ExpiringSoon => "#F59E0B",
            _ => "#10B981"
        };

        public string CategoryBadgeText
        {
            get
            {
                bool isUnnamed = CommonName.Contains("미지정") || CommonName.Contains("미식별");
                if (IsSystemCa)
                {
                    return Category switch
                    {
                        CertCategory.GPKI => "GPKI (시스템 CA)",
                        CertCategory.EPKI => "EPKI (시스템 CA)",
                        _ => "시스템 CA"
                    };
                }
                if (IsInstitutional)
                {
                    return Category switch
                    {
                        CertCategory.GPKI => "GPKI (기관용/관인)",
                        CertCategory.EPKI => "EPKI (교육기관용)",
                        _ => "기관용 공용"
                    };
                }
                if (isUnnamed)
                {
                    return Category switch
                    {
                        CertCategory.GPKI => "GPKI (명칭 미지정)",
                        CertCategory.EPKI => "EPKI (명칭 미지정)",
                        CertCategory.NPKI => "NPKI (명칭 미지정)",
                        _ => "미분류 / 명칭 미지정"
                    };
                }
                return Category switch
                {
                    CertCategory.GPKI => "GPKI (행정공무원)",
                    CertCategory.EPKI => "EPKI (교육/교원)",
                    CertCategory.NPKI => "NPKI (금융/공동)",
                    _ => "미분류/기타"
                };
            }
        }

        // Compatibility & Alias properties
        public string Name => CommonName;
        public string Issuer => IssuerName;
        public string UserDn => SubjectDn;
        public int DaysRemaining => RemainingDays;

        public string StorageLocationType => IsRemovableMedia ? "USB" : "컴퓨터";
        public string StorageLocationBadge => IsRemovableMedia ? $"💾 USB ({DriveLetter})" : $"💻 컴퓨터 ({DriveLetter})";
        public string StorageMediumName => IsRemovableMedia ? "이동식 USB 메모리" : "내장 로컬 디스크 (PC)";

        public bool IsStandardPath
        {
            get
            {
                if (string.IsNullOrWhiteSpace(DirectoryPath)) return true;
                string p = DirectoryPath.Replace('/', '\\').ToUpperInvariant();

                // 1. 중첩 폴더(복사 오류) 또는 백업/임시 폴더는 명백한 비표준
                // 예: C:\GPKI\GPKI, NPKI\NPKI, EPKI\EPKI, 백업, TEMP 등
                if (p.Contains(@"\GPKI\GPKI") || p.Contains(@"\NPKI\NPKI") || p.Contains(@"\EPKI\EPKI") ||
                    p.Contains(@"\GPKI\BACKUP") || p.Contains(@"\NPKI\BACKUP") || p.Contains(@"\EPKI\BACKUP") ||
                    p.Contains(@"\인증서") || p.Contains(@"\백업") || p.Contains(@"\TEMP"))
                {
                    return false;
                }

                // 2. AppData\LocalLow (금융결제원, 행정안전부, 교육부 최우선 표준)
                if (p.Contains(@"\APPDATA\LOCALLOW\NPKI") ||
                    p.Contains(@"\APPDATA\LOCALLOW\GPKI") ||
                    p.Contains(@"\APPDATA\LOCALLOW\EPKI"))
                {
                    return true;
                }

                // 3. GPKI 표준 (C:\GPKI\Certificate 또는 [USB]:\GPKI\Certificate)
                // 정부 표준 클라이언트는 반드시 \Certificate 직하(class1, class2, server 등)를 읽음
                if (System.Text.RegularExpressions.Regex.IsMatch(p, @"^[A-Z]:\\GPKI\\CERTIFICATE($|\\)"))
                {
                    return true;
                }

                // 4. EPKI 표준 (C:\EPKI\Certificate 또는 [USB]:\EPKI\Certificate)
                if (System.Text.RegularExpressions.Regex.IsMatch(p, @"^[A-Z]:\\EPKI\\CERTIFICATE($|\\)"))
                {
                    return true;
                }

                // 5. NPKI 이동식 USB 표준 ([USB]:\NPKI)
                // 주의: PC 로컬 C: 드라이브의 C:\NPKI는 구형/비표준 위치(현대 뱅킹 프로그램 미인식)임
                if (IsRemovableMedia && System.Text.RegularExpressions.Regex.IsMatch(p, @"^[A-Z]:\\NPKI($|\\)"))
                {
                    return true;
                }

                return false;
            }
        }

        public bool IsCustomPath => !IsStandardPath;

        public string StandardLocationBadgeText => IsStandardPath ? "✅ 정 위치" : "⚠️ 비표준 위치";
        public string LocationNoticeText
        {
            get
            {
                if (IsStandardPath)
                    return "일반 인증서 프로그램(은행/정부)이 정상 인식하는 표준 위치입니다.";

                string p = DirectoryPath.Replace('/', '\\').ToUpperInvariant();
                if (p.Contains(@"\GPKI\GPKI") || p.Contains(@"\NPKI\NPKI") || p.Contains(@"\EPKI\EPKI"))
                    return "폴더 복사 과정에서 중첩 생성된 비표준 위치(GPKI\\GPKI 등)입니다. 정부/은행 서명 프로그램에서 인식되지 않습니다.";

                if (Category == CertCategory.NPKI && !p.Contains(@"\APPDATA\LOCALLOW\NPKI") && !IsRemovableMedia)
                    return "PC 하드디스크의 비표준 위치입니다. 은행/기관에서 인식하려면 [AppData\\LocalLow\\NPKI]로 이동해야 합니다.";

                return "일반 인증서 프로그램(은행/정부)이 인식하지 못하는 비표준 위치입니다. [정 위치 복사]가 필요합니다.";
            }
        }
    }
}
