using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace KCert.Core.Parser
{
    /// <summary>
    /// PKCS#8 개인키 암호화 알고리즘 분석 결과
    /// </summary>
    public class KeyAnalysisResult
    {
        public bool IsValidAsn1 { get; set; }
        public bool IsEncrypted { get; set; } = true;
        public string AlgorithmName { get; set; } = "알 수 없음";
        public string AlgorithmOid { get; set; } = string.Empty;
        public string KdfName { get; set; } = string.Empty;
        public int IterationCount { get; set; }
        public string SaltHex { get; set; } = string.Empty;
        public string IvHex { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// 대한민국 전자서명 개인키(signPri.key / kmPri.key) PKCS#8 암호화 구조 정밀 분석 엔진
    /// (KISA SEED, ARIA-128/256, 3DES, AES-128/256, PBKDF2/PBES2 파라미터 자체 식별)
    /// </summary>
    public static class KCertKeyAnalyzer
    {
        // -------------------------------------------------------------
        // 표준 및 한국형 대칭키 암호화 알고리즘 OID 매핑 테이블
        // -------------------------------------------------------------
        // KISA SEED-CBC
        public const string OidSeedCbc = "1.2.410.200004.1.4";
        public const string OidSeedCbcAlt = "1.2.410.200004.1.7";

        // KISA ARIA
        public const string OidAria128Cbc = "1.2.410.200004.1.11";
        public const string OidAria192Cbc = "1.2.410.200004.1.12";
        public const string OidAria256Cbc = "1.2.410.200004.1.13";

        // PKCS#5 PBES2 & PBKDF2
        public const string OidPbes2 = "1.2.840.113549.1.5.13";
        public const string OidPbkdf2 = "1.2.840.113549.1.5.12";
        public const string OidHmacSha1 = "1.2.840.113549.2.7";
        public const string OidHmacSha256 = "1.2.840.113549.2.9";

        // 3DES & AES
        public const string OidDesEde3Cbc = "1.2.840.113549.3.7";
        public const string OidAes128Cbc = "2.16.840.1.101.3.4.1.2";
        public const string OidAes192Cbc = "2.16.840.1.101.3.4.1.22";
        public const string OidAes256Cbc = "2.16.840.1.101.3.4.1.42";

        // RSA PKCS#1 Private Key (평문)
        public const string OidRsaEncryption = "1.2.840.113549.1.1.1";

        /// <summary>
        /// 개인키 파일(signPri.key)의 PKCS#8 ASN.1 구조를 정밀 분석하여 암호화 알고리즘 및 솔트 정보를 반환합니다.
        /// </summary>
        public static KeyAnalysisResult AnalyzeKeyFile(string keyFilePath)
        {
            if (string.IsNullOrWhiteSpace(keyFilePath) || !File.Exists(keyFilePath))
            {
                return new KeyAnalysisResult
                {
                    IsValidAsn1 = false,
                    Description = "개인키 파일이 디스크에 존재하지 않습니다."
                };
            }

            try
            {
                var fi = new FileInfo(keyFilePath);
                if (fi.Length <= 0 || fi.Length > 256 * 1024)
                {
                    return new KeyAnalysisResult
                    {
                        IsValidAsn1 = false,
                        FileSizeBytes = fi.Length,
                        Description = "개인키 파일 크기가 비정상적입니다."
                    };
                }

                byte[] keyBytes = File.ReadAllBytes(keyFilePath);
                return AnalyzeKeyBytes(keyBytes);
            }
            catch (Exception ex)
            {
                return new KeyAnalysisResult
                {
                    IsValidAsn1 = false,
                    Description = $"개인키 파싱 예외: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// 개인키 바이트 배열을 파싱하여 알고리즘 및 PBES2 파라미터를 추출합니다.
        /// </summary>
        public static KeyAnalysisResult AnalyzeKeyBytes(byte[] keyBytes)
        {
            var result = new KeyAnalysisResult
            {
                FileSizeBytes = keyBytes.Length
            };

            var root = KCertAsn1Reader.Parse(keyBytes);
            if (root == null || root.Tag != Asn1Tags.Sequence)
            {
                result.IsValidAsn1 = false;
                result.Description = "유효한 ASN.1 SEQUENCE 헤더를 찾을 수 없습니다.";
                return result;
            }

            result.IsValidAsn1 = true;

            // 전체 OID 추출
            var allOids = KCertAsn1Reader.ExtractAllOids(keyBytes);

            // 1. PBES2 구조 검사
            bool isPbes2 = allOids.Contains(OidPbes2);
            if (isPbes2)
            {
                result.KdfName = "PBKDF2";
                result.IsEncrypted = true;

                // 세부 대칭키 암호화 알고리즘 식별
                if (allOids.Contains(OidSeedCbc) || allOids.Contains(OidSeedCbcAlt))
                {
                    result.AlgorithmName = "KISA SEED-CBC (128-bit)";
                    result.AlgorithmOid = OidSeedCbc;
                }
                else if (allOids.Contains(OidAria128Cbc))
                {
                    result.AlgorithmName = "KISA ARIA-128-CBC";
                    result.AlgorithmOid = OidAria128Cbc;
                }
                else if (allOids.Contains(OidAria256Cbc))
                {
                    result.AlgorithmName = "KISA ARIA-256-CBC";
                    result.AlgorithmOid = OidAria256Cbc;
                }
                else if (allOids.Contains(OidAes256Cbc))
                {
                    result.AlgorithmName = "AES-256-CBC";
                    result.AlgorithmOid = OidAes256Cbc;
                }
                else if (allOids.Contains(OidAes128Cbc))
                {
                    result.AlgorithmName = "AES-128-CBC";
                    result.AlgorithmOid = OidAes128Cbc;
                }
                else if (allOids.Contains(OidDesEde3Cbc))
                {
                    result.AlgorithmName = "Triple-DES (3DES-CBC)";
                    result.AlgorithmOid = OidDesEde3Cbc;
                }
                else
                {
                    result.AlgorithmName = "PBES2 표준 암호화";
                }
            }
            else if (allOids.Contains(OidSeedCbc) || allOids.Contains(OidSeedCbcAlt))
            {
                result.AlgorithmName = "KISA SEED-CBC";
                result.AlgorithmOid = OidSeedCbc;
                result.IsEncrypted = true;
            }
            else if (allOids.Contains(OidAria128Cbc) || allOids.Contains(OidAria256Cbc))
            {
                result.AlgorithmName = "KISA ARIA-CBC";
                result.AlgorithmOid = OidAria128Cbc;
                result.IsEncrypted = true;
            }
            else if (allOids.Contains(OidRsaEncryption))
            {
                result.AlgorithmName = "RSA PKCS#1 (비암호화 평문 개인키)";
                result.AlgorithmOid = OidRsaEncryption;
                result.IsEncrypted = false;
            }
            else
            {
                result.AlgorithmName = "PKCS#8 암호화 개인키";
                result.IsEncrypted = true;
            }

            // PBKDF2 Iteration 및 Salt 추출 시도
            try
            {
                ExtractPbkdf2Parameters(root, result);
            }
            catch { }

            result.Description = $"{result.AlgorithmName} | KDF: {(string.IsNullOrEmpty(result.KdfName) ? "표준" : result.KdfName)}{(result.IterationCount > 0 ? $" ({result.IterationCount}회)" : "")}";
            return result;
        }

        private static void ExtractPbkdf2Parameters(Asn1Node node, KeyAnalysisResult result)
        {
            if (node == null) return;

            // 재귀적으로 INTEGER 노드(Iteration Count) 및 OCTET STRING(Salt) 탐색
            foreach (var child in node.Children)
            {
                if (child.Tag == Asn1Tags.Integer && child.ContentBytes.Length > 0 && child.ContentBytes.Length <= 4)
                {
                    int val = 0;
                    foreach (var b in child.ContentBytes)
                    {
                        val = (val << 8) | b;
                    }

                    if (val >= 1000 && val <= 1000000 && result.IterationCount == 0)
                    {
                        result.IterationCount = val;
                    }
                }
                else if (child.Tag == Asn1Tags.OctetString && child.ContentBytes.Length >= 8 && child.ContentBytes.Length <= 32)
                {
                    if (string.IsNullOrEmpty(result.SaltHex))
                    {
                        result.SaltHex = BitConverter.ToString(child.ContentBytes).Replace("-", "").ToLowerInvariant();
                    }
                }

                ExtractPbkdf2Parameters(child, result);
            }
        }
    }
}
