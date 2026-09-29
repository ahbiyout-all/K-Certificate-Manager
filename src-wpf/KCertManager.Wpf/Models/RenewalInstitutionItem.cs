using System;

namespace KCertManager.Wpf.Models
{
    public class RenewalInstitutionItem
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string Category { get; set; } = "OTHER"; // GOV, EDU, BANK, CORP, STOCK, OTHER
        public string CategoryLabel { get; set; } = string.Empty;
        public string PortalName { get; set; } = string.Empty;
        public string PortalUrl { get; set; } = string.Empty;
        public string MenuGuide { get; set; } = string.Empty;
        public string CallCenter { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Notice { get; set; } = string.Empty;

        // Dynamic cert matching counters
        public int ActiveCertCount { get; set; }
        public int ExpiringCertCount { get; set; }
        public int ExpiredCertCount { get; set; }

        public int TotalMatchedCertCount => ActiveCertCount + ExpiringCertCount + ExpiredCertCount;

        public string CertSummaryText
        {
            get
            {
                if (TotalMatchedCertCount == 0) return "보유 인증서 없음";
                if (ExpiredCertCount > 0 && ExpiringCertCount > 0)
                    return $"⚠️ 보유 인증서: 총 {TotalMatchedCertCount}건 (만료 {ExpiredCertCount}건, 갱신임박 {ExpiringCertCount}건)";
                if (ExpiredCertCount > 0)
                    return $"🚨 보유 인증서: 총 {TotalMatchedCertCount}건 (만료됨 {ExpiredCertCount}건)";
                if (ExpiringCertCount > 0)
                    return $"⚡ 보유 인증서: 총 {TotalMatchedCertCount}건 (30일 내 갱신임박 {ExpiringCertCount}건)";
                return $"✅ 보유 인증서: 총 {TotalMatchedCertCount}건 (정상 유효)";
            }
        }

        public string CertSummaryColor
        {
            get
            {
                if (ExpiredCertCount > 0) return "#EF4444";
                if (ExpiringCertCount > 0) return "#F59E0B";
                if (ActiveCertCount > 0) return "#10B981";
                return "#94A3B8";
            }
        }
    }
}
