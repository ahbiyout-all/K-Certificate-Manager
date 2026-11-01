using System;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace KCert.Crypto.Engine
{
    /// <summary>
    /// 전자서명 테스트 및 수학적 유효성 검증 결과
    /// </summary>
    public class SignatureVerificationResult
    {
        public bool IsValid { get; set; }
        public string SignatureAlgorithm { get; set; } = "RSA-SHA256";
        public string SignatureHex { get; set; } = string.Empty;
        public string DataHashHex { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// 대한민국 전자서명법 및 금융권 표준(PKCS#1 v1.5 with SHA-256) 디지털 서명 생성 및 공개키 대조 검증 엔진
    /// </summary>
    public static class KCertSignatureEngine
    {
        /// <summary>
        /// 복호화된 RSA 개인키로 전자서명을 생성하고, signCert.der 공개키로 서명 무결성을 즉각 상호 검증합니다.
        /// </summary>
        public static SignatureVerificationResult TestSignature(RSA rsaPrivateKey, X509Certificate2 publicCert, string? testMessage = null)
        {
            var result = new SignatureVerificationResult();

            if (rsaPrivateKey == null)
            {
                result.IsValid = false;
                result.Message = "RSA 개인키 인스턴스가 존재하지 않습니다.";
                return result;
            }

            if (publicCert == null)
            {
                result.IsValid = false;
                result.Message = "공개키 인증서가 제공되지 않았습니다.";
                return result;
            }

            try
            {
                byte[] dataToSign = Encoding.UTF8.GetBytes(testMessage ?? $"KCertManager Digital Signature Probe {DateTime.UtcNow:O}");

                // 1. 개인키를 통한 PKCS#1 v1.5 전자서명 생성
                byte[] signature = rsaPrivateKey.SignData(dataToSign, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
                result.SignatureHex = BitConverter.ToString(signature).Replace("-", "").ToLowerInvariant();

                using var sha = SHA256.Create();
                result.DataHashHex = BitConverter.ToString(sha.ComputeHash(dataToSign)).Replace("-", "").ToLowerInvariant();

                // 2. 인증서의 공개키를 통한 서명 검증
                var rsaPublic = publicCert.GetRSAPublicKey();
                if (rsaPublic == null)
                {
                    result.IsValid = false;
                    result.Message = "공개키 인증서에서 RSA 공개키를 추출할 수 없습니다.";
                    return result;
                }

                bool isVerified = rsaPublic.VerifyData(dataToSign, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
                result.IsValid = isVerified;

                if (isVerified)
                {
                    result.Message = $"전자서명 유효성 검증 성공: signCert.der 공개키와 복호화된 개인키가 수학적으로 100% 일치합니다. (서명 크기: {signature.Length * 8}비트)";
                }
                else
                {
                    result.Message = "전자서명 검증 실패: 공개키와 개인키 쌍이 수학적으로 일치하지 않습니다.";
                }

                return result;
            }
            catch (Exception ex)
            {
                result.IsValid = false;
                result.Message = $"전자서명 테스트 예외: {ex.Message}";
                return result;
            }
        }
    }
}
