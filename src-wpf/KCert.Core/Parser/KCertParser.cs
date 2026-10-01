using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text.RegularExpressions;

namespace KCert.Core.Parser
{
    /// <summary>
    /// 대한민국 공인/공동/행정(GPKI)/교육(EPKI)/국방(MPKI) 인증서 원클릭 고속 파서 엔진
    /// </summary>
    public static class KCertParser
    {
        private static readonly string[] CertCandidates = { "signCert.der", "SignCert.der", "signcert.der", "sigCert.der", "SigCert.der", "sigcert.der", "envCert.der", "user.der", "signCert.cer", "sigCert.cer", "SignCert.cer", "UserCert.der" };
        private static readonly string[] KeyCandidates = { "signPri.key", "SignPri.key", "signpri.key", "sigPri.key", "SigPri.key", "sigpri.key", "envPri.key", "user.key", "signPri.pri", "UserPri.key" };

        /// <summary>
        /// signCert.der 파일 또는 인증서 디렉터리 경로를 입력받아 풍부한 메타데이터를 추출합니다.
        /// </summary>
        /// <param name="path">인증서 DER 파일 경로 또는 인증서 폴더 경로</param>
        public static KCertMetadata? Parse(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return null;

            string derPath = string.Empty;
            string dirPath = string.Empty;

            if (Directory.Exists(path))
            {
                dirPath = path;

                // 1. 표준 파일명 우선 순위 검사
                foreach (var candidate in CertCandidates)
                {
                    var testPath = Path.Combine(dirPath, candidate);
                    if (File.Exists(testPath))
                    {
                        derPath = testPath;
                        break;
                    }
                }

                // 2. 표준 파일명이 없으면 폴더 내 임의의 .der 또는 .cer 검색 (kmCert 제외)
                if (string.IsNullOrEmpty(derPath))
                {
                    try
                    {
                        var derFiles = Directory.GetFiles(dirPath, "*.der");
                        var cerFiles = Directory.GetFiles(dirPath, "*.cer");
                        var all = derFiles.Concat(cerFiles).ToArray();
                        derPath = all.FirstOrDefault(f => {
                            var fn = Path.GetFileName(f).ToLowerInvariant();
                            return !fn.StartsWith("km") && !fn.StartsWith("root") && !fn.StartsWith("ca");
                        }) ?? all.FirstOrDefault() ?? string.Empty;
                    }
                    catch
                    {
                        // 디렉터리 접근 오류 시 무시
                    }
                }
            }
            else if (File.Exists(path))
            {
                derPath = path;
                dirPath = Path.GetDirectoryName(derPath) ?? string.Empty;
            }
            else
            {
                return null;
            }

            if (string.IsNullOrEmpty(derPath) || !File.Exists(derPath)) return null;

            try
            {
                // 보안 검증: 비정상 대용량 파일(512KB 초과)로 인한 메모리 고갈(DoS) 방지
                var derFileInfo = new FileInfo(derPath);
                if (derFileInfo.Length <= 0 || derFileInfo.Length > 512 * 1024)
                {
                    return null;
                }

                var derBytes = File.ReadAllBytes(derPath);
                using var cert = new X509Certificate2(derBytes);

                // 개인키 탐색
                string keyPath = string.Empty;
                foreach (var kCand in KeyCandidates)
                {
                    var testKey = Path.Combine(dirPath, kCand);
                    if (File.Exists(testKey))
                    {
                        keyPath = testKey;
                        break;
                    }
                }

                if (string.IsNullOrEmpty(keyPath))
                {
                    try
                    {
                        var keys = Directory.GetFiles(dirPath, "*.key");
                        keyPath = keys.FirstOrDefault(k => !Path.GetFileName(k).ToLowerInvariant().StartsWith("km")) ?? keys.FirstOrDefault() ?? string.Empty;
                    }
                    catch { }
                }

                bool hasKey = !string.IsNullOrEmpty(keyPath) && File.Exists(keyPath);

                var (status, daysLeft) = CertPairValidator.EvaluateValidity(cert.NotBefore, cert.NotAfter);
                var (isPairValid, pairReason) = hasKey 
                    ? CertPairValidator.ValidatePair(derPath, keyPath) 
                    : (false, "개인키(signPri.key) 누락");

                var policyInfo = KoreanCertPolicyOids.LookupPolicy(cert);

                // 경로 기반 체계 보정 (폴더 또는 파일 경로에 GPKI, EPKI, MPKI가 포함된 경우)
                var upperDir = (dirPath + " " + derPath).ToUpperInvariant();
                if (upperDir.Contains(@"\GPKI\") || upperDir.Contains(@"/GPKI/") || upperDir.Contains(@"\GPKI") || upperDir.Contains(@"/GPKI") || upperDir.Contains("GPKI"))
                {
                    policyInfo = policyInfo with { SystemType = CertSystemType.GPKI, UsageDescription = policyInfo.UsageDescription.Contains("공무원") || policyInfo.UsageDescription.Contains("기관") ? policyInfo.UsageDescription : "행정전자서명 (GPKI)" };
                }
                else if (upperDir.Contains(@"\EPKI\") || upperDir.Contains(@"/EPKI/") || upperDir.Contains(@"\EPKI") || upperDir.Contains(@"/EPKI") || upperDir.Contains("EPKI"))
                {
                    policyInfo = policyInfo with { SystemType = CertSystemType.EPKI, UsageDescription = policyInfo.UsageDescription.Contains("교원") || policyInfo.UsageDescription.Contains("교육") ? policyInfo.UsageDescription : "교육부 전자서명용 (나이스/에듀파인)" };
                }
                else if (upperDir.Contains(@"\MPKI\") || upperDir.Contains(@"/MPKI/") || upperDir.Contains("MPKI"))
                {
                    policyInfo = policyInfo with { SystemType = CertSystemType.GPKI, UsageDescription = "국방전자서명 군인/군기관용" };
                }
                else if (policyInfo.SystemType == CertSystemType.Unknown)
                {
                    policyInfo = policyInfo with { SystemType = CertSystemType.NPKI };
                }

                string rootDrive = Path.GetPathRoot(derPath) ?? string.Empty;
                bool isRemovable = Discovery.CertLocationScanner.IsRemovableDrive(derPath);

                // SHA256 해시 계산
                string sha256 = string.Empty;
                try
                {
                    using var sha = SHA256.Create();
                    sha256 = BitConverter.ToString(sha.ComputeHash(derBytes)).Replace("-", "").ToLowerInvariant();
                }
                catch
                {
                    // 해시 계산 실패 무시
                }

                // 루트 / 중계 CA / 정부 시스템 공용 체인 인증서 검출
                bool isCaExtension = false;
                foreach (var ext in cert.Extensions)
                {
                    if (ext is X509BasicConstraintsExtension bc)
                    {
                        if (bc.CertificateAuthority)
                        {
                            isCaExtension = true;
                            break;
                        }
                    }
                }

                var cn = ParseDnAttribute(cert.Subject, "CN") ?? string.Empty;
                var o = ParseDnAttribute(cert.Subject, "O") ?? string.Empty;
                var ous = ParseAllDnAttributes(cert.Subject, "OU");
                var dirName = Path.GetFileName(dirPath)?.ToLowerInvariant() ?? string.Empty;
                var derFileName = Path.GetFileName(derPath).ToLowerInvariant();

                bool isCaName = cn.StartsWith("GPKIRoot", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("Root CA", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("RootCA", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("CA134", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("CA974", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("CA128", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("KICA CA", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("SignKorea CA", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("CrossCert CA", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("yessignCA", StringComparison.OrdinalIgnoreCase) ||
                                cn.StartsWith("TradeSign CA", StringComparison.OrdinalIgnoreCase);

                bool isInSystemCaFolder = dirName == "ca" || dirName == "root" || dirName == "crl" ||
                                          dirPath.IndexOf(@"\GPKI\CA", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                          dirPath.IndexOf(@"\GPKI\root", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                          dirPath.IndexOf(@"\GPKI\CRL", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                          dirPath.IndexOf(@"\EPKI\CA", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                          dirPath.IndexOf(@"/GPKI/CA", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                          dirPath.IndexOf(@"/EPKI/CA", StringComparison.OrdinalIgnoreCase) >= 0;

                bool isClass1 = upperDir.Contains(@"\CLASS1\") || upperDir.Contains(@"/CLASS1/") ||
                                upperDir.Contains(@"\CLASS1") || upperDir.Contains(@"/CLASS1") ||
                                dirName == "class1";

                bool isSystemCa = false;
                if (isCaExtension || isCaName || isInSystemCaFolder)
                {
                    // 전용 CA 폴더에 있거나, 확장 필드가 CA이면서 개인키가 없는 경우 시스템 CA로 판정
                    if (isInSystemCaFolder || (isCaExtension && !hasKey) || (isCaName && !hasKey && !isClass1))
                    {
                        isSystemCa = true;
                    }
                }

                if ((derFileName.StartsWith("root") || derFileName.StartsWith("gpkica")) && isInSystemCaFolder)
                {
                    isSystemCa = true;
                }

                // 주체 및 기관 정보 정밀 포맷팅
                var (formattedName, formattedOrg, formattedIssuer, caSignatureName, isInstitutional) = FormatSubjectAndOrg(
                    cn, o, ous, cert.Issuer, cert.Subject, policyInfo, dirPath, isSystemCa, isClass1);

                var meta = new KCertMetadata
                {
                    DirectoryPath = dirPath,
                    DerFilePath = derPath,
                    KeyFilePath = hasKey ? keyPath : string.Empty,
                    DriveRoot = rootDrive,
                    IsOnRemovableMedia = isRemovable,
                    SubjectDn = cert.Subject,
                    Issuer = formattedIssuer,
                    CaSignatureName = caSignatureName,
                    SerialNumber = cert.SerialNumber,
                    SignatureAlgorithm = cert.SignatureAlgorithm.FriendlyName ?? "sha256RSA",
                    CommonName = formattedName,
                    Organization = formattedOrg,
                    OrganizationalUnit = string.Join(" / ", ous),
                    Policy = policyInfo,
                    ValidFrom = cert.NotBefore,
                    ValidTo = cert.NotAfter,
                    DaysRemaining = daysLeft,
                    Status = status,
                    IsPairIntegrityValid = isPairValid,
                    IntegrityMessage = pairReason,
                    DerSha256 = sha256,
                    DerFileSize = derBytes.Length,
                    KeyFileSize = hasKey ? new FileInfo(keyPath).Length : 0,
                    IsSystemCa = isSystemCa,
                    IsInstitutional = isInstitutional,
                    CleanDisplayName = formattedName
                };

                return meta;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[KCertParser Error] {derPath}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// GPKI/EPKI CLASS1 및 시스템 CA, 공공기관/관인 인증서의 실명, 서명명칭, 기관명을 정밀 포맷팅합니다.
        /// </summary>
        private static (string formattedName, string formattedOrg, string formattedIssuer, string caSignatureName, bool isInstitutional) FormatSubjectAndOrg(
            string rawCn,
            string rawO,
            List<string> ous,
            string rawIssuerDn,
            string subjectDn,
            CertPolicyInfo policy,
            string dirPath,
            bool isSystemCa,
            bool isClass1)
        {
            string cleanName = rawCn.Trim();
            string cleanOrg = rawO.Trim();
            bool isInstitutional = false;
            string caSignatureName = string.Empty;

            // 1. 발급기관(Issuer) 및 기관 서명 이름(caSignatureName) 정제
            string cleanIssuer = ParseDnAttribute(rawIssuerDn, "CN") ?? ParseDnAttribute(rawIssuerDn, "O") ?? rawIssuerDn;
            if (rawIssuerDn.Contains("GPKI", StringComparison.OrdinalIgnoreCase) || rawIssuerDn.Contains("Government of Korea", StringComparison.OrdinalIgnoreCase))
            {
                if (cleanIssuer.StartsWith("CA134040001", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = "행정전자서명인증센터 (행정기관용 CA134)";
                    caSignatureName = "행정전자서명 행정기관용 인증센터 (CA134040001)";
                }
                else if (cleanIssuer.StartsWith("CA134040002", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = "행정전자서명인증센터 (공공기관용 CA134)";
                    caSignatureName = "행정전자서명 공공기관용 인증센터 (CA134040002)";
                }
                else if (cleanIssuer.StartsWith("CA134040003", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = "행정전자서명인증센터 (특수목적용 CA134)";
                    caSignatureName = "행정전자서명 특수목적용 인증센터 (CA134040003)";
                }
                else if (cleanIssuer.StartsWith("CA134", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = $"행정전자서명인증센터 ({cleanIssuer})";
                    caSignatureName = $"행정전자서명인증센터 ({cleanIssuer})";
                }
                else if (cleanIssuer.StartsWith("GPKIRoot", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = "행정전자서명 최상위인증센터 (GPKIRootCA)";
                    caSignatureName = "행정전자서명 최상위인증센터 (GPKIRootCA)";
                }
                else
                {
                    cleanIssuer = "행정전자서명인증센터 (GPKI)";
                    caSignatureName = "행정전자서명인증센터 (GPKI)";
                }
            }
            else if (rawIssuerDn.Contains("EPKI", StringComparison.OrdinalIgnoreCase) || rawIssuerDn.Contains("Korea Education", StringComparison.OrdinalIgnoreCase))
            {
                if (cleanIssuer.StartsWith("CA974", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = $"교육부전자서명인증센터 ({cleanIssuer})";
                    caSignatureName = $"교육부전자서명인증센터 ({cleanIssuer})";
                }
                else if (cleanIssuer.StartsWith("CA973", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = $"교육부전자서명인증센터 ({cleanIssuer})";
                    caSignatureName = $"한국교육학술정보원 전자서명인증센터 ({cleanIssuer})";
                }
                else if (cleanIssuer.StartsWith("EPKIRoot", StringComparison.OrdinalIgnoreCase))
                {
                    cleanIssuer = "교육부전자서명 최상위인증센터 (EPKIRootCA)";
                    caSignatureName = "교육부전자서명 최상위인증센터 (EPKIRootCA)";
                }
                else
                {
                    cleanIssuer = "교육부전자서명인증센터 (EPKI)";
                    caSignatureName = "교육부전자서명인증센터 (EPKI)";
                }
            }
            else if (rawIssuerDn.Contains("yessign", StringComparison.OrdinalIgnoreCase))
            {
                cleanIssuer = "금융결제원 (yessign)";
                caSignatureName = "금융결제원 전자인증센터 (yessignCA Class 1)";
            }
            else if (rawIssuerDn.Contains("SignKorea", StringComparison.OrdinalIgnoreCase) || rawIssuerDn.Contains("KOSCOM", StringComparison.OrdinalIgnoreCase))
            {
                cleanIssuer = "코스콤 (SignKorea)";
                caSignatureName = "코스콤 공인인증센터 (SignKorea CA)";
            }
            else if (rawIssuerDn.Contains("KICA", StringComparison.OrdinalIgnoreCase) || rawIssuerDn.Contains("한국정보인증", StringComparison.OrdinalIgnoreCase))
            {
                cleanIssuer = "한국정보인증 (KICA)";
                caSignatureName = "한국정보인증 공인인증센터 (KICA CA)";
            }
            else if (rawIssuerDn.Contains("CrossCert", StringComparison.OrdinalIgnoreCase) || rawIssuerDn.Contains("한국전자인증", StringComparison.OrdinalIgnoreCase))
            {
                cleanIssuer = "한국전자인증 (CrossCert)";
                caSignatureName = "한국전자인증 공인인증센터 (CrossCert CA)";
            }
            else if (rawIssuerDn.Contains("TradeSign", StringComparison.OrdinalIgnoreCase) || rawIssuerDn.Contains("한국무역정보통신", StringComparison.OrdinalIgnoreCase))
            {
                cleanIssuer = "한국무역정보통신 (TradeSign)";
                caSignatureName = "한국무역정보통신 무역인증센터 (TradeSign CA)";
            }

            // 2. 시스템 CA 명칭 처리
            if (cleanName.StartsWith("CA134040001", StringComparison.OrdinalIgnoreCase))
            {
                return ("행정전자서명 행정기관용 중계CA (CA134040001)", "행정안전부 (정부GPKI)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("CA134040002", StringComparison.OrdinalIgnoreCase))
            {
                return ("행정전자서명 공공기관용 중계CA (CA134040002)", "행정안전부 (정부GPKI)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("CA134040003", StringComparison.OrdinalIgnoreCase))
            {
                return ("행정전자서명 특수목적용 중계CA (CA134040003)", "행정안전부 (정부GPKI)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("CA134", StringComparison.OrdinalIgnoreCase))
            {
                return ($"행정전자서명 중계CA ({cleanName})", "행정안전부 (정부GPKI)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("CA974", StringComparison.OrdinalIgnoreCase) || cleanName.StartsWith("CA973", StringComparison.OrdinalIgnoreCase))
            {
                return ($"교육부 전자서명 중계CA ({cleanName})", "교육부 (한국교육학술정보원)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("CA128", StringComparison.OrdinalIgnoreCase))
            {
                return ($"사법부/대법원 전자서명 중계CA ({cleanName})", "대법원 (사법부)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("GPKIRoot", StringComparison.OrdinalIgnoreCase))
            {
                return ($"대한민국 정부 행정전자서명 최상위 루트CA ({cleanName})", "행정안전부 (대한민국정부)", cleanIssuer, caSignatureName, false);
            }
            if (cleanName.StartsWith("EPKIRoot", StringComparison.OrdinalIgnoreCase))
            {
                return ($"대한민국 교육부 전자서명 최상위 루트CA ({cleanName})", "교육부 (대한민국)", cleanIssuer, caSignatureName, false);
            }

            // 3. 기관용 공용 인증서 (GPKI / EPKI) 패턴 분석
            // 예: 001행정안전부001, 001대법원(특수목적용)001, 경상북도교육감001, 서울특별시장001, 001한국지능정보사회진흥원001
            var agencyMatch = Regex.Match(cleanName, @"^(?:[0-9]{3})?([가-힣A-Za-z0-9\(\)\s_\-]+?)(?:[0-9]{3,})?$");
            string strippedName = agencyMatch.Success ? agencyMatch.Groups[1].Value.Trim() : cleanName;

            bool hasAgencyKeywords = strippedName.Contains("청") || strippedName.Contains("부") || strippedName.Contains("원") ||
                                     strippedName.Contains("처") || strippedName.Contains("실") || strippedName.Contains("본부") ||
                                     strippedName.Contains("교육감") || strippedName.Contains("시장") || strippedName.Contains("도지사") ||
                                     strippedName.Contains("구청장") || strippedName.Contains("군수") || strippedName.Contains("기관") ||
                                     strippedName.Contains("관인") || strippedName.Contains("특수목적") || strippedName.Contains("서버") ||
                                     strippedName.Contains("센터") || strippedName.Contains("공단") || strippedName.Contains("공사") ||
                                     policy.UsageDescription.Contains("기관");

            if (hasAgencyKeywords)
            {
                isInstitutional = true;
                cleanName = strippedName;
                if (!cleanName.Contains("기관") && !cleanName.Contains("관인") && !cleanName.Contains("용") && !cleanName.Contains("(") &&
                    (cleanName.EndsWith("감") || cleanName.EndsWith("장") || cleanName.EndsWith("사")))
                {
                    cleanName = $"{cleanName} (전자관인)";
                }
                else if (!cleanName.Contains("(") && !cleanName.Contains("용") && !cleanName.Contains("관인"))
                {
                    cleanName = $"{cleanName} (기관용)";
                }
            }
            else
            {
                // 4. 일반 개인(공무원/교원/시민) 이름 정제
                // 예: 홍길동(Hong Gildong)0000001004 -> 홍길동 (Hong Gildong)
                // 예: 홍길동()0000001004 -> 홍길동
                // 예: (주)한국테크-김철수0000009876 -> (주)한국테크 - 김철수
                var personMatch = Regex.Match(cleanName, @"^([가-힣A-Za-z0-9_\-\(\)]+?)(?:\(([^\)]*)\))?(?:[0-9]{4,})?$");
                if (personMatch.Success)
                {
                    var baseName = personMatch.Groups[1].Value.Trim();
                    var engName = personMatch.Groups[2].Success ? personMatch.Groups[2].Value.Trim() : "";

                    // 불필요한 숫자 접미사 제거
                    baseName = Regex.Replace(baseName, @"\d{4,}$", "").Trim();

                    if (!string.IsNullOrEmpty(engName))
                    {
                        cleanName = $"{baseName} ({engName})";
                    }
                    else
                    {
                        cleanName = baseName;
                    }
                }
            }

            // 5. 소속 조직/부서(Organization / OU) 정제
            var validOus = ous.Where(u => !u.Equals("Government of Korea", StringComparison.OrdinalIgnoreCase) &&
                                          !u.Equals("Korea Education", StringComparison.OrdinalIgnoreCase) &&
                                          !u.Equals("GPKI", StringComparison.OrdinalIgnoreCase) &&
                                          !u.Equals("EPKI", StringComparison.OrdinalIgnoreCase) &&
                                          !u.Equals("personal4IB", StringComparison.OrdinalIgnoreCase) &&
                                          !u.Equals("server", StringComparison.OrdinalIgnoreCase) &&
                                          !u.Equals("class1", StringComparison.OrdinalIgnoreCase)).ToList();

            if (validOus.Count > 0)
            {
                cleanOrg = string.Join(" / ", validOus);
            }
            else if (cleanOrg.Equals("Government of Korea", StringComparison.OrdinalIgnoreCase))
            {
                cleanOrg = "대한민국 행정안전부 (정부)";
            }
            else if (cleanOrg.Equals("Korea Education", StringComparison.OrdinalIgnoreCase))
            {
                cleanOrg = "대한민국 교육부";
            }
            else if (string.IsNullOrEmpty(cleanOrg))
            {
                cleanOrg = cleanIssuer;
            }

            if (string.IsNullOrWhiteSpace(cleanName))
            {
                if (!string.IsNullOrWhiteSpace(cleanOrg) && cleanOrg != cleanIssuer)
                {
                    cleanName = $"[명칭 미지정] {cleanOrg}";
                }
                else if (!string.IsNullOrWhiteSpace(dirPath))
                {
                    var folder = Path.GetFileName(dirPath);
                    cleanName = !string.IsNullOrWhiteSpace(folder) ? $"[명칭 미지정] {folder}" : "미식별 인증서 (명칭 없음)";
                }
                else
                {
                    cleanName = "미식별 인증서 (명칭 없음)";
                }
            }

            return (cleanName, cleanOrg, cleanIssuer, caSignatureName, isInstitutional);
        }

        private static string? ParseDnAttribute(string dn, string attribute)
        {
            if (string.IsNullOrEmpty(dn)) return null;
            var match = Regex.Match(dn, $@"(?:^|[,\s]+){Regex.Escape(attribute)}=([^,]*)", RegexOptions.IgnoreCase);
            return match.Success ? match.Groups[1].Value.Trim() : null;
        }

        private static List<string> ParseAllDnAttributes(string dn, string attribute)
        {
            var list = new List<string>();
            if (string.IsNullOrEmpty(dn)) return list;

            var matches = Regex.Matches(dn, $@"(?:^|[,\s]+){Regex.Escape(attribute)}=([^,]*)", RegexOptions.IgnoreCase);
            foreach (Match m in matches)
            {
                if (m.Success && m.Groups.Count > 1)
                {
                    var val = m.Groups[1].Value.Trim();
                    if (!string.IsNullOrEmpty(val) && !list.Contains(val))
                    {
                        list.Add(val);
                    }
                }
            }
            return list;
        }
    }
}

