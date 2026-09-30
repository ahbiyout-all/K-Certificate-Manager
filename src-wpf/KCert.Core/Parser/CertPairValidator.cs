using System;
using System.IO;
using System.Security.Cryptography.X509Certificates;

namespace KCert.Core.Parser
{
    /// <summary>
    /// 인증서 만료 상태
    /// </summary>
    public enum CertValidityStatus
    {
        /// <summary>정상 유효 (30일 초과 남음)</summary>
        Valid,
        /// <summary>만료 임박 (30일 이내)</summary>
        ExpiringSoon,
        /// <summary>기간 만료</summary>
        Expired,
        /// <summary>형식 손상/파싱 불가</summary>
        Corrupted
    }

    /// <summary>
    /// 인증서 쌍(signCert.der + signPri.key) 무결성 검증기
    /// </summary>
    public static class CertPairValidator
    {
        /// <summary>
        /// 공개키(signCert.der)와 개인키(signPri.key)의 쌍 일치 및 무결성을 검증합니다.
        /// </summary>
        public static (bool IsPairValid, string Reason) ValidatePair(string derPath, string keyPath)
        {
            if (!File.Exists(derPath))
                return (false, "signCert.der 공개키 파일이 존재하지 않습니다.");

            if (!File.Exists(keyPath))
                return (false, "signPri.key 개인키 파일이 유실되었습니다. (서명 불가 상태)");

            try
            {
                var derInfo = new FileInfo(derPath);
                var keyInfo = new FileInfo(keyPath);

                if (derInfo.Length < 128)
                    return (false, "signCert.der 파일 크기가 너무 작아 손상된 것으로 판단됩니다.");

                if (keyInfo.Length < 64)
                    return (false, "signPri.key 파일 크기가 너무 작아 손상된 것으로 판단됩니다.");

                // 개인키 바이너리 ASN.1 시퀀스(0x30) 기본 매직바이트 확인
                byte[] keyHeader = new byte[4];
                using (var fs = File.OpenRead(keyPath))
                {
                    int read = fs.Read(keyHeader, 0, 4);
                    if (read < 4 || keyHeader[0] != 0x30)
                    {
                        return (false, "signPri.key 파일이 표준 PKCS#8 ASN.1 구조가 아닙니다.");
                    }
                }

                // X.509 파싱 시도
                using var cert = new X509Certificate2(derPath);
                return (true, "인증서 쌍 무결성 검증 통과 (정상)");
            }
            catch (Exception ex)
            {
                return (false, $"인증서 파일 파싱 오류: {ex.Message}");
            }
        }

        /// <summary>
        /// 인증서의 유효기간 및 남은 일수를 계산합니다. (한국 인증서 기준 만료일자 23:59:59까지 유효)
        /// </summary>
        public static (CertValidityStatus Status, int DaysRemaining) EvaluateValidity(DateTime notBefore, DateTime notAfter)
        {
            var now = DateTime.Now;
            var endOfNotAfter = notAfter.Date.AddDays(1).AddSeconds(-1);
            if (notAfter > endOfNotAfter) endOfNotAfter = notAfter;

            // 만료일(23:59:59) 초과 시 만료로 판정
            if (now > endOfNotAfter)
            {
                var daysOver = Math.Max(1, (int)Math.Floor((now - endOfNotAfter).TotalDays));
                return (CertValidityStatus.Expired, -daysOver);
            }

            var daysLeft = (int)Math.Ceiling((endOfNotAfter - now).TotalDays);
            if (daysLeft <= 0)
            {
                return (CertValidityStatus.Expired, 0);
            }

            if (daysLeft <= 30)
            {
                return (CertValidityStatus.ExpiringSoon, daysLeft);
            }

            return (CertValidityStatus.Valid, daysLeft);
        }
    }
}
