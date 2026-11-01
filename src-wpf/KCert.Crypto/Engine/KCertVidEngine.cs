using System;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;

namespace KCert.Crypto.Engine
{
    /// <summary>
    /// 대한민국 전자서명 본인확인 식별정보(VID: Virtual Identification) 검증 결과
    /// </summary>
    public class VidVerificationResult
    {
        public bool HasVid { get; set; }
        public bool IsMatched { get; set; }
        public string VidHex { get; set; } = string.Empty;
        public string HashAlgorithm { get; set; } = "SHA-256";
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// 대한민국 공인인증서 고유 가상식별번호(VID) 추출 및 영지식 본인확인 무결성 검증 엔진
    /// (OID: 1.2.410.200004.10.1.1 - KISA 표준 VID 규격)
    /// </summary>
    public static class KCertVidEngine
    {
        // KISA 표준 VID OID
        public const string OidVid = "1.2.410.200004.10.1.1";

        /// <summary>
        /// X.509 인증서의 Subject Alternative Name(SAN) 또는 전용 확장 필드로부터 VID 바이트를 추출합니다.
        /// </summary>
        public static (bool Found, string VidHex, string Algorithm) ExtractVid(X509Certificate2 cert)
        {
            if (cert == null) return (false, string.Empty, string.Empty);

            try
            {
                // 1. 전체 확장 필드 순회
                foreach (var ext in cert.Extensions)
                {
                    // OID 직접 일치 또는 SAN(2.5.29.17) 내부 검색
                    if (ext.Oid?.Value == OidVid)
                    {
                        string hex = BitConverter.ToString(ext.RawData).Replace("-", "").ToLowerInvariant();
                        return (true, hex, "SHA-256");
                    }

                    if (ext.Oid?.Value == "2.5.29.17") // Subject Alternative Name
                    {
                        var raw = ext.RawData;
                        string hexStr = BitConverter.ToString(raw).Replace("-", "");

                        // VID OID 바이너리 패턴 (0x2A, 0x83, 0x1A, 0x8C, 0x18, 0x0A, 0x01, 0x01)
                        const string vidOidHex = "2A831A8C180A0101";
                        int idx = hexStr.IndexOf(vidOidHex, StringComparison.OrdinalIgnoreCase);
                        if (idx >= 0)
                        {
                            // OID 이후의 해시 바이트 슬라이싱
                            string remainingHex = hexStr.Substring(idx + vidOidHex.Length);
                            string extractedHex = remainingHex.Length >= 40 ? remainingHex.Substring(0, Math.Min(64, remainingHex.Length)) : remainingHex;
                            return (true, extractedHex.ToLowerInvariant(), extractedHex.Length >= 64 ? "SHA-256" : "SHA-1");
                        }
                    }
                }

                return (false, string.Empty, string.Empty);
            }
            catch
            {
                return (false, string.Empty, string.Empty);
            }
        }

        /// <summary>
        /// 사용자가 입력한 주민등록번호/사업자번호 및 난수(Random Number)를 바탕으로 VID 일치 여부를 영지식으로 검증합니다.
        /// 공식: VID = Hash(ID + RandomNumber)
        /// </summary>
        public static VidVerificationResult VerifyVid(
            X509Certificate2 cert,
            string idNumber,
            byte[]? randomBytes = null)
        {
            var result = new VidVerificationResult();

            if (cert == null)
            {
                result.Message = "인증서가 제공되지 않았습니다.";
                return result;
            }

            var (found, vidHex, alg) = ExtractVid(cert);
            if (!found || string.IsNullOrEmpty(vidHex))
            {
                result.HasVid = false;
                result.Message = "인증서 내에 KISA 표준 VID(가상식별번호) 식별 정보가 없습니다. (범용/특수목적용 인증서의 경우 미탑재 가능)";
                return result;
            }

            result.HasVid = true;
            result.VidHex = vidHex;
            result.HashAlgorithm = alg;

            // 주민/사업자등록번호 정제 (숫자만 추출)
            string cleanId = Regex.Replace(idNumber ?? "", @"\D", "");
            if (cleanId.Length != 10 && cleanId.Length != 13)
            {
                result.IsMatched = false;
                result.Message = "식별번호는 주민등록번호 13자리 또는 사업자등록번호 10자리여야 합니다.";
                return result;
            }

            // 난수가 없으면 난수 없이 직접 해시 검증 시도
            byte[] idBytes = Encoding.UTF8.GetBytes(cleanId);
            byte[] inputBytes;

            if (randomBytes != null && randomBytes.Length > 0)
            {
                inputBytes = new byte[idBytes.Length + randomBytes.Length];
                Buffer.BlockCopy(idBytes, 0, inputBytes, 0, idBytes.Length);
                Buffer.BlockCopy(randomBytes, 0, inputBytes, idBytes.Length, randomBytes.Length);
            }
            else
            {
                inputBytes = idBytes;
            }

            // SHA-256 해시 대조
            using var sha256 = SHA256.Create();
            string computedSha256 = BitConverter.ToString(sha256.ComputeHash(inputBytes)).Replace("-", "").ToLowerInvariant();

            // SHA-1 해시 대조
            using var sha1 = SHA1.Create();
            string computedSha1 = BitConverter.ToString(sha1.ComputeHash(inputBytes)).Replace("-", "").ToLowerInvariant();

            if (vidHex.Contains(computedSha256) || computedSha256.Contains(vidHex) ||
                vidHex.Contains(computedSha1) || computedSha1.Contains(vidHex))
            {
                result.IsMatched = true;
                result.Message = "본인확인(VID) 무결성 검증 성공: 입력하신 식별번호의 소유자 인증서가 일치합니다.";
            }
            else
            {
                result.IsMatched = false;
                result.Message = "본인확인(VID) 검증 불일치: 인증서에 등록된 실명 식별정보와 일치하지 않습니다.";
            }

            return result;
        }
    }
}
