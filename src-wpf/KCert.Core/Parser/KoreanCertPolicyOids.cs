using System;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;

namespace KCert.Core.Parser
{
    /// <summary>
    /// 대한민국 전자서명 인증서(NPKI·GPKI·EPKI) 고유 정책 OID(Policy Object Identifier) 해석 딕셔너리
    /// </summary>
    public static class KoreanCertPolicyOids
    {
        private static readonly Dictionary<string, CertPolicyInfo> PolicyMap = new(StringComparer.OrdinalIgnoreCase);

        static KoreanCertPolicyOids()
        {
            RegisterPolicies();
        }

        private static void RegisterPolicies()
        {
            // -------------------------------------------------------------
            // 1. 금융결제원 (yessign) - 1.2.410.200005.1.1.*
            // -------------------------------------------------------------
            Add("1.2.410.200005.1.1.1", "금융결제원", "은행/보험/신용카드용 (개인)", CertSystemType.NPKI, CertUserType.Individual, false, true);
            Add("1.2.410.200005.1.1.2", "금융결제원", "은행/보험/신용카드용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, false, true);
            Add("1.2.410.200005.1.1.4", "금융결제원", "공동인증서 범용 (개인)", CertSystemType.NPKI, CertUserType.Individual, true, false);
            Add("1.2.410.200005.1.1.5", "금융결제원", "공동인증서 범용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, true, false);
            Add("1.2.410.200005.1.1.6.1", "금융결제원", "기업인터넷뱅킹용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, false, true);

            // -------------------------------------------------------------
            // 2. 코스콤 SignKorea - 1.2.410.200004.5.2.* / 1.2.410.200004.5.1.*
            // -------------------------------------------------------------
            Add("1.2.410.200004.5.2.1.1", "코스콤 (SignKorea)", "증권/보험용 (개인)", CertSystemType.NPKI, CertUserType.Individual, false, true);
            Add("1.2.410.200004.5.2.1.2", "코스콤 (SignKorea)", "증권/보험용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, false, true);
            Add("1.2.410.200004.5.1.1.5", "코스콤 (SignKorea)", "공동인증서 범용 (개인)", CertSystemType.NPKI, CertUserType.Individual, true, false);
            Add("1.2.410.200004.5.1.1.7", "코스콤 (SignKorea)", "공동인증서 범용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, true, false);

            // -------------------------------------------------------------
            // 3. 한국정보인증 KICA - 1.2.410.200004.5.4.*
            // -------------------------------------------------------------
            Add("1.2.410.200004.5.4.1.1", "한국정보인증 (KICA)", "공동인증서 범용 (개인)", CertSystemType.NPKI, CertUserType.Individual, true, false);
            Add("1.2.410.200004.5.4.1.2", "한국정보인증 (KICA)", "공동인증서 범용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, true, false);
            Add("1.2.410.200004.5.4.1.101", "한국정보인증 (KICA)", "은행/신용카드용 (개인)", CertSystemType.NPKI, CertUserType.Individual, false, true);
            Add("1.2.410.200004.5.4.1.102", "한국정보인증 (KICA)", "은행/신용카드용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, false, true);
            Add("1.2.410.200004.5.4.1.200", "한국정보인증 (KICA)", "전자세금계산서용 (특수목적)", CertSystemType.NPKI, CertUserType.Corporate, false, false);

            // -------------------------------------------------------------
            // 4. 한국전자인증 CrossCert - 1.2.410.200004.5.3.*
            // -------------------------------------------------------------
            Add("1.2.410.200004.5.3.1.1", "한국전자인증 (CrossCert)", "공동인증서 범용 (개인)", CertSystemType.NPKI, CertUserType.Individual, true, false);
            Add("1.2.410.200004.5.3.1.2", "한국전자인증 (CrossCert)", "공동인증서 범용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, true, false);
            Add("1.2.410.200004.5.3.1.9", "한국전자인증 (CrossCert)", "전자의무기록/의료용 (특수목적)", CertSystemType.NPKI, CertUserType.Corporate, false, false);

            // -------------------------------------------------------------
            // 5. 한국무역정보통신 TradeSign - 1.2.410.200012.*
            // -------------------------------------------------------------
            Add("1.2.410.200012.1.1.1", "한국무역정보통신 (TradeSign)", "공동인증서 범용 (개인)", CertSystemType.NPKI, CertUserType.Individual, true, false);
            Add("1.2.410.200012.1.1.3", "한국무역정보통신 (TradeSign)", "공동인증서 범용 (법인)", CertSystemType.NPKI, CertUserType.Corporate, true, false);
            Add("1.2.410.200012.1.1.101", "한국무역정보통신 (TradeSign)", "무역/전자상거래용", CertSystemType.NPKI, CertUserType.Corporate, false, false);

            // -------------------------------------------------------------
            // 6. 행정전자서명 (GPKI - 대한민국 정부 공무원용) - 1.2.410.100001.*
            // -------------------------------------------------------------
            Add("1.2.410.100001.2.2.1", "행정전자서명인증센터 (GPKI)", "국가/지방공무원 결재용 (개인)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.2", "행정전자서명인증센터 (GPKI)", "행정기관용 (기관서명)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.3", "행정전자서명인증센터 (GPKI)", "지방자치단체 공무원용", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.4", "행정전자서명인증센터 (GPKI)", "지방자치단체용 (기관서명)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.5", "행정전자서명인증센터 (GPKI)", "입법기관용 (국회 등)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.6", "행정전자서명인증센터 (GPKI)", "사법기관용 (법원 등)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.7", "행정전자서명인증센터 (GPKI)", "헌법재판소용 (공무원)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.8", "행정전자서명인증센터 (GPKI)", "중앙선거관리위원회용", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.9", "행정전자서명인증센터 (GPKI)", "공공기관용 (개인)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.2.2.10", "행정전자서명인증센터 (GPKI)", "공공기관용 (기관서명)", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.5.1.1", "행정전자서명인증센터 (GPKI)", "행정전자서명 범용 (공무원)", CertSystemType.GPKI, CertUserType.PublicSector, true, false);
            Add("1.2.410.100001.5.2.1", "행정전자서명인증센터 (GPKI)", "온-나라 문서결재/행정용", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100001.5.3.1", "행정전자서명인증센터 (GPKI)", "행정망 보안인증용", CertSystemType.GPKI, CertUserType.PublicSector, false, false);

            // -------------------------------------------------------------
            // 7. 교육기관 전자서명 (EPKI - 교육부/시도교육청) - 1.2.410.200005.2.* / 1.2.410.100005.*
            // -------------------------------------------------------------
            Add("1.2.410.200005.2.1.1", "교육부전자서명인증센터 (EPKI)", "초·중·고 교원 및 교육공무원용 (나이스/에듀파인)", CertSystemType.EPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.200005.2.1.2", "교육부전자서명인증센터 (EPKI)", "교육행정기관용 (기관서명)", CertSystemType.EPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.200005.2.1.3", "교육부전자서명인증센터 (EPKI)", "사립학교 교원용 (교육기관)", CertSystemType.EPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.200005.2.1.4", "교육부전자서명인증센터 (EPKI)", "대학교/교육유관기관용", CertSystemType.EPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.200005.2.1.5", "교육부전자서명인증센터 (EPKI)", "학생/학부모/일반 교육용", CertSystemType.EPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100005.1.1.1", "교육부전자서명인증센터 (EPKI)", "교육행정전자서명용", CertSystemType.EPKI, CertUserType.PublicSector, false, false);

            // -------------------------------------------------------------
            // 8. 국방전자서명 (MPKI - 국방부/군인) - 1.2.410.100003.*
            // -------------------------------------------------------------
            Add("1.2.410.100003.1.1.1", "국방전자서명인증센터 (MPKI)", "국방부/군인/군무원용", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
            Add("1.2.410.100003.1.1.2", "국방전자서명인증센터 (MPKI)", "군부대/군기관용", CertSystemType.GPKI, CertUserType.PublicSector, false, false);
        }

        private static void Add(string oid, string org, string desc, CertSystemType sys, CertUserType user, bool isUniversal, bool isBanking)
        {
            PolicyMap[oid] = new CertPolicyInfo
            {
                PolicyOid = oid,
                IssuerOrg = org,
                UsageDescription = desc,
                SystemType = sys,
                UserType = user,
                IsUniversal = isUniversal,
                IsBankingSpecific = isBanking
            };
        }

        /// <summary>
        /// X.509 인증서의 Certificate Policies 확장 필드(2.5.29.32) 및 메타데이터를 읽어 한국 정책 OID를 자동 매핑합니다.
        /// </summary>
        public static CertPolicyInfo LookupPolicy(X509Certificate2 cert)
        {
            try
            {
                foreach (var extension in cert.Extensions)
                {
                    // 2.5.29.32 = Certificate Policies
                    if (extension.Oid?.Value == "2.5.29.32")
                    {
                        var rawData = extension.Format(false);
                        foreach (var kvp in PolicyMap)
                        {
                            if (rawData.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase))
                            {
                                return kvp.Value;
                            }
                        }

                        // Prefix based lookup if exact OID sub-index varies
                        if (rawData.Contains("1.2.410.100001", StringComparison.OrdinalIgnoreCase))
                        {
                            return new CertPolicyInfo
                            {
                                PolicyOid = "1.2.410.100001",
                                IssuerOrg = "행정전자서명인증센터 (GPKI)",
                                UsageDescription = "행정전자서명 공무원용 (결재/행정)",
                                SystemType = CertSystemType.GPKI,
                                UserType = CertUserType.PublicSector
                            };
                        }

                        if (rawData.Contains("1.2.410.200005.2", StringComparison.OrdinalIgnoreCase) ||
                            rawData.Contains("1.2.410.100005", StringComparison.OrdinalIgnoreCase))
                        {
                            return new CertPolicyInfo
                            {
                                PolicyOid = "1.2.410.200005.2",
                                IssuerOrg = "교육부전자서명인증센터 (EPKI)",
                                UsageDescription = "교육행정전자서명 교원용 (나이스/에듀파인)",
                                SystemType = CertSystemType.EPKI,
                                UserType = CertUserType.PublicSector
                            };
                        }

                        if (rawData.Contains("1.2.410.100003", StringComparison.OrdinalIgnoreCase))
                        {
                            return new CertPolicyInfo
                            {
                                PolicyOid = "1.2.410.100003",
                                IssuerOrg = "국방전자서명인증센터 (MPKI)",
                                UsageDescription = "국방전자서명 군인/군무원용",
                                SystemType = CertSystemType.GPKI,
                                UserType = CertUserType.PublicSector
                            };
                        }
                    }
                }
            }
            catch
            {
                // Format 파싱 실패 시 안전한 폴백 처리
            }

            // OID 확장 필드에서 매핑되지 않은 경우 Issuer/Subject 및 RawData 기반 강력한 추론
            var issuer = cert.Issuer;
            var subject = cert.Subject;
            var combined = $"{issuer} {subject}";

            // GPKI (행정전자서명)
            if (combined.Contains("GPKI", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("정부공인", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("행정전자서명", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("행정안전부", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("Government of Korea", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("대한민국정부", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("MOIS", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("Government Root", StringComparison.OrdinalIgnoreCase))
            {
                return new CertPolicyInfo
                {
                    IssuerOrg = "행정전자서명인증센터 (GPKI)",
                    UsageDescription = "행정전자서명 공무원용",
                    SystemType = CertSystemType.GPKI,
                    UserType = CertUserType.PublicSector
                };
            }

            // EPKI (교육기관 전자서명)
            if (combined.Contains("EPKI", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("교육부", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("교육청", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("교육학술정보원", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("KERIS", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("나이스", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("NEIS", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("에듀파인", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("Korea Education", StringComparison.OrdinalIgnoreCase))
            {
                return new CertPolicyInfo
                {
                    IssuerOrg = "교육부전자서명인증센터 (EPKI)",
                    UsageDescription = "교육행정전자서명 교원용",
                    SystemType = CertSystemType.EPKI,
                    UserType = CertUserType.PublicSector
                };
            }

            // MPKI (국방전자서명)
            if (combined.Contains("MPKI", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("국방부", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("국방전자서명", StringComparison.OrdinalIgnoreCase))
            {
                return new CertPolicyInfo
                {
                    IssuerOrg = "국방전자서명인증센터 (MPKI)",
                    UsageDescription = "국방전자서명 군인용",
                    SystemType = CertSystemType.GPKI,
                    UserType = CertUserType.PublicSector
                };
            }

            // NPKI 5대 공인인증기관
            if (issuer.Contains("yessign", StringComparison.OrdinalIgnoreCase))
                return new CertPolicyInfo { IssuerOrg = "금융결제원 (yessign)", UsageDescription = "은행/보험 공동인증서", SystemType = CertSystemType.NPKI, IsBankingSpecific = true };
            if (issuer.Contains("SignKorea", StringComparison.OrdinalIgnoreCase) || issuer.Contains("KOSCOM", StringComparison.OrdinalIgnoreCase) || issuer.Contains("코스콤", StringComparison.OrdinalIgnoreCase))
                return new CertPolicyInfo { IssuerOrg = "코스콤 (SignKorea)", UsageDescription = "증권/보험 공동인증서", SystemType = CertSystemType.NPKI };
            if (issuer.Contains("KICA", StringComparison.OrdinalIgnoreCase) || issuer.Contains("한국정보인증", StringComparison.OrdinalIgnoreCase))
                return new CertPolicyInfo { IssuerOrg = "한국정보인증 (KICA)", UsageDescription = "공동인증서", SystemType = CertSystemType.NPKI };
            if (issuer.Contains("CrossCert", StringComparison.OrdinalIgnoreCase) || issuer.Contains("한국전자인증", StringComparison.OrdinalIgnoreCase))
                return new CertPolicyInfo { IssuerOrg = "한국전자인증 (CrossCert)", UsageDescription = "범용 공동인증서", SystemType = CertSystemType.NPKI };
            if (issuer.Contains("TradeSign", StringComparison.OrdinalIgnoreCase) || issuer.Contains("한국무역정보통신", StringComparison.OrdinalIgnoreCase))
                return new CertPolicyInfo { IssuerOrg = "한국무역정보통신 (TradeSign)", UsageDescription = "무역/전자상거래용", SystemType = CertSystemType.NPKI };

            return new CertPolicyInfo { IssuerOrg = cert.Issuer, UsageDescription = "일반 공동인증서", SystemType = CertSystemType.NPKI };
        }
    }
}
