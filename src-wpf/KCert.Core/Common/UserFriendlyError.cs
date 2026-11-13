using System;
using System.IO;
using System.Security.Cryptography;

namespace KCert.Core.Common
{
    /// <summary>
    /// 사용자 친화적 에러 메시지 데이터 구조
    /// </summary>
    public record UserErrorMessage
    {
        /// <summary>대화상자 제목 (예: "접근 권한 확인", "USB 연결 확인")</summary>
        public string Title { get; init; } = "작업 안내";

        /// <summary>사용자가 이해하기 쉬운 핵심 원인 설명</summary>
        public string Summary { get; init; } = "요청하신 작업을 완료하지 못했습니다.";

        /// <summary>사용자가 취할 수 있는 구체적인 해결 행동 가이드</summary>
        public string ActionTip { get; init; } = "잠시 후 다시 시도해 주세요.";

        /// <summary>개발자/기술 지원용 원본 에러 상세 (필요시 확인)</summary>
        public string TechnicalDetail { get; init; } = string.Empty;

        /// <summary>
        /// 사용자 팝업용으로 정리된 포맷팅된 메시지 반환
        /// </summary>
        public string ToFormattedDialogMessage(string? actionContext = null)
        {
            var header = string.IsNullOrWhiteSpace(actionContext)
                ? Summary
                : $"[{actionContext}]\n{Summary}";

            var result = $"{header}\n\n[해결 방법 안내]\n{ActionTip}";

            if (!string.IsNullOrWhiteSpace(TechnicalDetail))
            {
                result += $"\n\n(참고 기술 정보: {TechnicalDetail})";
            }

            return result;
        }
    }

    /// <summary>
    /// 다양한 시스템 및 파일/보안 예외를 사용자 친화적 메시지로 변환하는 엔진
    /// </summary>
    public static class UserFriendlyError
    {
        public static UserErrorMessage Explain(Exception? ex, string? actionContext = null)
        {
            if (ex == null)
            {
                return new UserErrorMessage
                {
                    Title = "작업 오류",
                    Summary = "알 수 없는 오류가 발생했습니다.",
                    ActionTip = "• 프로그램을 다시 실행하거나 잠시 후 시도해 주세요."
                };
            }

            string rawMsg = ex.Message ?? string.Empty;
            string exType = ex.GetType().Name;

            // 1. 접근 권한 오류 (UnauthorizedAccessException / Access Denied)
            if (ex is UnauthorizedAccessException ||
                rawMsg.IndexOf("Access is denied", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("액세스가 거부", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("권한", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "접근 권한 필요",
                    Summary = "폴더나 파일에 접근할 권한이 부족합니다.",
                    ActionTip = "• 앱을 '관리자 권한으로 실행'해 보세요.\n" +
                                "• 대상 폴더·USB의 '읽기 전용' 속성을 해제해 주세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 2. 외부 저장 장치 / 드라이브 미연결 / 준비 안 됨 (DriveNotFoundException / DeviceNotReady)
            if (ex is DriveNotFoundException ||
                rawMsg.IndexOf("The device is not ready", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("장치가 준비되지 않았습니다", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("드라이브를 찾을 수 없습니다", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "USB 연결 확인",
                    Summary = "USB 드라이브에 접근할 수 없거나 연결이 끊겼습니다.",
                    ActionTip = "• USB를 뺐다 다시 꽂은 뒤 2~3초 후 다시 시도하세요.\n" +
                                "• 탐색기에서 해당 USB가 열리는지 확인해 주세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 3. 파일 또는 폴더 미발견 (FileNotFoundException / DirectoryNotFoundException)
            if (ex is DirectoryNotFoundException || ex is FileNotFoundException ||
                rawMsg.IndexOf("Could not find", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("경로를 찾을 수 없습니다", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "인증서 파일 없음",
                    Summary = "인증서 파일 또는 폴더를 찾을 수 없습니다.",
                    ActionTip = "• 파일이 이동·삭제되었는지 확인해 주세요.\n" +
                                "• 상단 [새로고침]을 눌러 목록을 갱신하세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 4. USB 쓰기 금지 / 디스크 공간 부족 (Write-Protect / Disk Full)
            if (rawMsg.IndexOf("write-protected", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("쓰기 금지", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("There is not enough space on the disk", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("디스크 공간이 부족", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "쓰기 금지 또는 공간 부족",
                    Summary = "USB가 쓰기 금지(잠금) 상태이거나 여유 공간이 부족합니다.",
                    ActionTip = "• USB 측면 잠금(Lock) 스위치를 해제해 주세요.\n" +
                                "• 불필요한 파일을 정리해 빈 공간을 확보하세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 5. 파일 사용 중 (Sharing Violation / File in Use)
            if (rawMsg.IndexOf("used by another process", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("다른 프로세스에서 사용 중", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("sharing violation", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "인증서 사용 중",
                    Summary = "은행·보안 프로그램이나 브라우저가 이 파일을 사용 중입니다.",
                    ActionTip = "• 브라우저와 보안 프로그램을 닫고 다시 시도하세요.\n" +
                                "• 해당 폴더가 열린 탐색기 창도 닫아 주세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 6. 경로 길이 초과 (PathTooLongException)
            if (ex is PathTooLongException ||
                rawMsg.IndexOf("path is too long", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("경로가 너무 깁니다", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "폴더 경로 너무 김",
                    Summary = "폴더 경로가 Windows 최대 길이(260자)를 넘었습니다.",
                    ActionTip = "• 상위 폴더 이름을 짧게 줄이거나 표준 폴더로 옮기세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 7. 암호화 / 인증서 파일 손상 (CryptographicException / ASN.1 Bad Format)
            if (ex is CryptographicException || ex is FormatException ||
                rawMsg.IndexOf("ASN1", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("PKCS", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("손상", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("인증서 파싱", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "인증서 파일 손상",
                    Summary = "인증서 파일(signCert·signPri)이 손상되었거나 형식이 올바르지 않습니다.",
                    ActionTip = "• 다른 백업본이 있다면 교체하거나 발급기관에서 재발급받으세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 8. 클립보드 사용 오류
            if (rawMsg.IndexOf("clipboard", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("클립보드", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "클립보드 복사 실패",
                    Summary = "다른 프로그램이 클립보드를 사용 중이라 복사하지 못했습니다.",
                    ActionTip = "• 1~2초 후 다시 복사 버튼을 눌러주세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 9. 브라우저 / 외부 프로세스 실행 실패
            if (rawMsg.IndexOf("explorer", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("browser", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("프로세스", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "실행 오류",
                    Summary = "탐색기나 웹 브라우저를 열지 못했습니다.",
                    ActionTip = "• Windows 설정에서 기본 브라우저 지정을 확인하세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 10. 기본 일반 예외
            return new UserErrorMessage
            {
                Title = "작업 오류",
                Summary = "예기치 않은 오류로 작업을 완료하지 못했습니다.",
                ActionTip = "• 잠시 후 다시 시도하거나 앱을 재실행해 보세요.",
                TechnicalDetail = $"{exType}: {rawMsg}"
            };
        }
    }
}
