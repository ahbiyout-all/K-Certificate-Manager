using System;
using System.Text.RegularExpressions;

namespace KCert.Core.Common
{
    /// <summary>
    /// 대한민국 전자서명 공인인증서 주체명(Subject DN) 및 개인정보 안전 마스킹/정제 순수 창작 엔진
    /// </summary>
    public static class CertSanitizer
    {
        private static readonly Regex ResidentNumberRegex = new(@"\b(\d{6})[-_\s]?([1-4]\d{6})\b", RegexOptions.Compiled);
        private static readonly Regex BusinessNumberRegex = new(@"\b(\d{3})[-_\s]?(\d{2})[-_\s]?(\d{5})\b", RegexOptions.Compiled);
        private static readonly Regex VidPatternRegex = new(@"\b(\d{10,})\b", RegexOptions.Compiled);

        /// <summary>
        /// 주민등록번호, 사업자등록번호 또는 일련의 개인 식별 코드를 안전하게 마스킹합니다.
        /// 예: "홍길동()0004011234567" -> "홍길동()000401-*******"
        /// </summary>
        public static string MaskPersonalIdentifier(string rawInput)
        {
            if (string.IsNullOrWhiteSpace(rawInput)) return string.Empty;

            string result = rawInput;

            // 주민등록번호 패턴 마스킹 (생년월일 6자리 유지 + 뒤 7자리 중 성별 제외 또는 전체 별표)
            result = ResidentNumberRegex.Replace(result, m =>
            {
                string birth = m.Groups[1].Value;
                string rest = m.Groups[2].Value;
                char gender = rest.Length > 0 ? rest[0] : '*';
                return $"{birth}-{gender}******";
            });

            return result;
        }

        /// <summary>
        /// Subject DN 또는 CN에서 순수 성명/법인명과 식별정보를 분리하여 보기 좋은 서명명칭을 생성합니다.
        /// </summary>
        public static (string CleanName, string MaskedIdentity) ParseCleanSubject(string rawCn)
        {
            if (string.IsNullOrWhiteSpace(rawCn)) return (string.Empty, string.Empty);

            string trimmed = rawCn.Trim();

            // 한국 인증서의 흔한 포맷: "홍길동(Hong Gil Dong)0004011234567" 또는 "주식회사한국(Korea Corp)0012345678"
            int parenClose = trimmed.LastIndexOf(')');
            if (parenClose > 0 && parenClose < trimmed.Length - 1)
            {
                string namePart = trimmed.Substring(0, parenClose + 1).Trim();
                string idPart = trimmed.Substring(parenClose + 1).Trim();
                string maskedId = MaskPersonalIdentifier(idPart);
                return (namePart, maskedId);
            }

            // 숫자 식별자가 붙어있는 경우
            var match = VidPatternRegex.Match(trimmed);
            if (match.Success && match.Index > 0)
            {
                string namePart = trimmed.Substring(0, match.Index).Trim();
                string idPart = match.Value;
                return (namePart, MaskPersonalIdentifier(idPart));
            }

            return (trimmed, string.Empty);
        }

        /// <summary>
        /// 파일 경로 내 특수문자 및 불법 문자를 윈도우 파일시스템 호환 문자로 치환합니다.
        /// </summary>
        public static string SanitizeFileSystemName(string name, char replacement = '_')
        {
            if (string.IsNullOrWhiteSpace(name)) return "cert";

            char[] invalidChars = System.IO.Path.GetInvalidFileNameChars();
            char[] buffer = name.ToCharArray();
            for (int i = 0; i < buffer.Length; i++)
            {
                if (Array.IndexOf(invalidChars, buffer[i]) >= 0)
                {
                    buffer[i] = replacement;
                }
            }

            string sanitized = new string(buffer).Trim();
            return string.IsNullOrEmpty(sanitized) ? "cert" : sanitized;
        }
    }
}
