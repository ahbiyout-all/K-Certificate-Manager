using System;

namespace KCert.Core.Parser
{
    /// <summary>
    /// 인증서 발급 체계 분류
    /// </summary>
    public enum CertSystemType
    {
        /// <summary>금융·은행·증권·전자상거래 공동인증서</summary>
        NPKI,
        /// <summary>대한민국 정부·행정전자서명 공무원 인증서</summary>
        GPKI,
        /// <summary>교육부·시도교육청 전자서명인증서</summary>
        EPKI,
        /// <summary>기타/알 수 없음</summary>
        Unknown
    }

    /// <summary>
    /// 인증서 소유자 분류
    /// </summary>
    public enum CertUserType
    {
        /// <summary>개인용</summary>
        Individual,
        /// <summary>법인/사업자용</summary>
        Corporate,
        /// <summary>공공/행정기관용</summary>
        PublicSector,
        /// <summary>기타</summary>
        Other
    }

    /// <summary>
    /// 한국 공인인증서 고유 정책 OID 해석 결과 메타데이터
    /// </summary>
    public record CertPolicyInfo
    {
        /// <summary>식별된 정책 OID (예: 1.2.410.200005.1.1.1)</summary>
        public string PolicyOid { get; init; } = string.Empty;

        /// <summary>발급기관 한글명 (예: 금융결제원, 코스콤, 한국정보인증 등)</summary>
        public string IssuerOrg { get; init; } = "미확인";

        /// <summary>인증서 용도 한글 설명 (예: 은행/보험용(개인), 범용, 공무원 결재용 등)</summary>
        public string UsageDescription { get; init; } = "일반 전자서명용";

        /// <summary>인증서 분류 체계 (NPKI, GPKI, EPKI)</summary>
        public CertSystemType SystemType { get; init; } = CertSystemType.Unknown;

        /// <summary>소유자 유형 (개인, 법인, 공공)</summary>
        public CertUserType UserType { get; init; } = CertUserType.Individual;

        /// <summary>범용 인증서 여부</summary>
        public bool IsUniversal { get; init; }

        /// <summary>금융거래(은행/보험/신용카드) 전용 여부</summary>
        public bool IsBankingSpecific { get; init; }
    }
}
