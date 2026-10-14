using System;
using System.Collections.Generic;
using KCert.Core.Parser;

namespace KCert.Core.Diagnostics
{
    /// <summary>
    /// 인증서 만료 위험 등급
    /// </summary>
    public enum ExpirationUrgencyLevel
    {
        Normal,         // 30일 초과 (안전)
        Notice,         // 15~30일 (알림 권장)
        Warning,        // 8~14일 (경고)
        Critical,       // 1~7일 (즉시 갱신 필수)
        Expired         // 만료됨 (재발급 필요)
    }

    /// <summary>
    /// 인증서 만료 알람 분석 결과
    /// </summary>
    public class ExpirationAlarmInfo
    {
        public ExpirationUrgencyLevel Urgency { get; set; }
        public int DaysRemaining { get; set; }
        public string AlarmTitle { get; set; } = string.Empty;
        public string AlarmMessage { get; set; } = string.Empty;
        public string RenewalPortalUrl { get; set; } = string.Empty;
        public string RenewalPortalName { get; set; } = string.Empty;
        public bool RequiresAction => Urgency != ExpirationUrgencyLevel.Normal;
    }

    /// <summary>
    /// 대한민국 전자서명 인증서 만료 위험 분석 및 기관별 공식 갱신 포털 자동 매칭 순수 창작 엔진
    /// </summary>
    public static class CertExpirationAlarmEngine
    {
        // -------------------------------------------------------------
        // 대한민국 주요 인증기관 공식 갱신/발급 웹 포털 매핑 테이블
        // -------------------------------------------------------------
        private static readonly Dictionary<string, (string Name, string Url)> RenewalPortals = new(StringComparer.OrdinalIgnoreCase)
        {
            ["금융결제원"] = ("금융결제원 전자인증센터 (yessign)", "https://www.yessign.or.kr/"),
            ["yessign"] = ("금융결제원 전자인증센터 (yessign)", "https://www.yessign.or.kr/"),
            ["코스콤"] = ("코스콤 SignKorea 전자인증센터", "https://www.signkorea.com/"),
            ["SignKorea"] = ("코스콤 SignKorea 전자인증센터", "https://www.signkorea.com/"),
            ["한국정보인증"] = ("한국정보인증 (KICA)", "https://www.signgate.com/"),
            ["KICA"] = ("한국정보인증 (KICA)", "https://www.signgate.com/"),
            ["한국전자인증"] = ("한국전자인증 (CrossCert)", "https://www.crosscert.com/"),
            ["CrossCert"] = ("한국전자인증 (CrossCert)", "https://www.crosscert.com/"),
            ["한국무역정보통신"] = ("한국무역정보통신 (TradeSign)", "https://www.tradesign.net/"),
            ["TradeSign"] = ("한국무역정보통신 (TradeSign)", "https://www.tradesign.net/"),
            ["GPKI"] = ("정부 행정전자서명인증센터", "https://www.gpki.go.kr/"),
            ["행정전자서명"] = ("정부 행정전자서명인증센터", "https://www.gpki.go.kr/"),
            ["EPKI"] = ("교육부 전자서명인증센터", "https://www.epki.go.kr/"),
            ["교육부"] = ("교육부 전자서명인증센터", "https://www.epki.go.kr/")
        };

        /// <summary>
        /// 인증서 메타데이터로부터 만료 위험 등급과 권장 갱신 사이트를 계산합니다.
        /// </summary>
        public static ExpirationAlarmInfo EvaluateAlarm(KCertMetadata meta)
        {
            if (meta == null)
            {
                return new ExpirationAlarmInfo
                {
                    Urgency = ExpirationUrgencyLevel.Normal,
                    DaysRemaining = 0,
                    AlarmTitle = "정보 없음",
                    AlarmMessage = "인증서 메타데이터가 존재하지 않습니다."
                };
            }

            int days = meta.DaysRemaining;
            ExpirationUrgencyLevel urgency;
            string title;
            string msg;

            if (days < 0 || meta.Status == CertValidityStatus.Expired)
            {
                urgency = ExpirationUrgencyLevel.Expired;
                title = "🚨 인증서 유효기간 만료됨";
                msg = $"인증서가 {Math.Abs(days)}일 전에 만료되었습니다. 즉시 재발급을 신청해야 전자서명이 가능합니다.";
            }
            else if (days <= 7)
            {
                urgency = ExpirationUrgencyLevel.Critical;
                title = $"⚡ 만료 임박! D-{days}";
                msg = $"만료일까지 {days}일 남았습니다. 전자서명 중단 방지를 위해 지금 갱신하세요.";
            }
            else if (days <= 14)
            {
                urgency = ExpirationUrgencyLevel.Warning;
                title = $"⚠️ 만료 2주 이내 (D-{days})";
                msg = $"만료일까지 {days}일 남았습니다. 여유 있을 때 갱신을 권장합니다.";
            }
            else if (days <= 30)
            {
                urgency = ExpirationUrgencyLevel.Notice;
                title = $"📅 만료 1개월 이내 (D-{days})";
                msg = $"만료 30일 이내로 갱신 가능 기간에 진입했습니다.";
            }
            else
            {
                urgency = ExpirationUrgencyLevel.Normal;
                title = "✅ 정상 유효";
                msg = $"유효기간이 {days}일 남아 있어 안전합니다.";
            }

            // 발급기관 기반 갱신 포털 매칭
            string portalName = "발급 금융기관/인증센터";
            string portalUrl = "https://www.yessign.or.kr/";

            string issuerStr = $"{meta.Issuer} {meta.CaSignatureName} {meta.Policy?.IssuerOrg}";
            foreach (var kvp in RenewalPortals)
            {
                if (issuerStr.IndexOf(kvp.Key, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    portalName = kvp.Value.Name;
                    portalUrl = kvp.Value.Url;
                    break;
                }
            }

            return new ExpirationAlarmInfo
            {
                Urgency = urgency,
                DaysRemaining = days,
                AlarmTitle = title,
                AlarmMessage = msg,
                RenewalPortalName = portalName,
                RenewalPortalUrl = portalUrl
            };
        }
    }
}
