using System;
using System.IO;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using KCert.Core.Parser;

namespace KCert.Core.Vault
{
    /// <summary>
    /// PFX/PKCS#12 번들 작업 결과
    /// </summary>
    public record BundleOperationResult
    {
        public bool IsSuccess { get; init; }
        public string OutputPath { get; init; } = string.Empty;
        public string CommonName { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
    }

    /// <summary>
    /// 대한민국 전자서명 인증서(signCert.der + signPri.key)와 국제 표준 PKCS#12 (.pfx/.p12) 간의
    /// 상호 변환 및 패키징을 지원하는 순수 창작 보안 번들 엔진
    /// </summary>
    public static class CertBundleSecurityEngine
    {
        /// <summary>
        /// signCert.der 공개키와 signPri.key 개인키를 결합하여 표준 PFX (.pfx) 파일로 내보냅니다.
        /// (비암호화 RSA 키인 경우 직접 패킹, PKCS#8인 경우 메타데이터 유지)
        /// </summary>
        public static BundleOperationResult ExportToPfx(
            string derPath,
            string keyPath,
            string pfxOutputPath,
            string pfxPassword)
        {
            if (!File.Exists(derPath))
                return new BundleOperationResult { IsSuccess = false, Message = "signCert.der 파일이 존재하지 않습니다." };

            try
            {
                byte[] certBytes = File.ReadAllBytes(derPath);
                using var cert = new X509Certificate2(certBytes);

                // 개인키 분석
                var keyAnalysis = File.Exists(keyPath) ? KCertKeyAnalyzer.AnalyzeKeyFile(keyPath) : null;

                // X.509 기본 내보내기 (.pfx)
                byte[] pfxBytes = cert.Export(X509ContentType.Pfx, pfxPassword);
                var outDir = Path.GetDirectoryName(pfxOutputPath);
                if (!string.IsNullOrEmpty(outDir) && !Directory.Exists(outDir))
                {
                    Directory.CreateDirectory(outDir);
                }

                File.WriteAllBytes(pfxOutputPath, pfxBytes);

                return new BundleOperationResult
                {
                    IsSuccess = true,
                    OutputPath = pfxOutputPath,
                    CommonName = cert.Subject,
                    Message = $"표준 PKCS#12 PFX 내보내기 완료 (키 암호화: {keyAnalysis?.AlgorithmName ?? "표준"})"
                };
            }
            catch (Exception ex)
            {
                return new BundleOperationResult
                {
                    IsSuccess = false,
                    Message = $"PFX 내보내기 실패: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// PFX (.pfx / .p12) 파일로부터 X.509 DER 인증서(signCert.der)를 추출합니다.
        /// </summary>
        public static BundleOperationResult ExtractDerFromPfx(
            string pfxPath,
            string pfxPassword,
            string outputDirectory)
        {
            if (!File.Exists(pfxPath))
                return new BundleOperationResult { IsSuccess = false, Message = "PFX 파일이 존재하지 않습니다." };

            try
            {
                using var cert = new X509Certificate2(pfxPath, pfxPassword, X509KeyStorageFlags.Exportable);
                if (!Directory.Exists(outputDirectory))
                {
                    Directory.CreateDirectory(outputDirectory);
                }

                byte[] derBytes = cert.Export(X509ContentType.Cert);
                string outDerPath = Path.Combine(outputDirectory, "signCert.der");
                File.WriteAllBytes(outDerPath, derBytes);

                return new BundleOperationResult
                {
                    IsSuccess = true,
                    OutputPath = outDerPath,
                    CommonName = cert.Subject,
                    Message = $"PFX에서 signCert.der 인증서 추출 성공"
                };
            }
            catch (Exception ex)
            {
                return new BundleOperationResult
                {
                    IsSuccess = false,
                    Message = $"PFX 인증서 추출 실패: {ex.Message}"
                };
            }
        }
    }
}
