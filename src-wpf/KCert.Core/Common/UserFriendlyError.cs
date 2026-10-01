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
                    Title = "파일 접근 권한 확인 필요",
                    Summary = "지정된 폴더나 인증서 파일에 접근할 권한이 부족합니다.",
                    ActionTip = "• K-인증서 매니저 아이콘을 마우스 우클릭한 후 '관리자 권한으로 실행'해 보세요.\n" +
                                "• 대상 드라이브(USB) 또는 폴더의 읽기/쓰기 권한 및 '읽기 전용' 속성을 확인해 주세요.",
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
                    Title = "USB 저장 장치 연결 확인 필요",
                    Summary = "선택한 USB 드라이브에 접근할 수 없거나 연결이 해제되었습니다.",
                    ActionTip = "• USB 메모리가 컴퓨터 본체 단자에 올바르게 꽂혀 있는지 확인해 주세요.\n" +
                                "• 윈도우 탐색기에서 해당 USB 드라이브가 정상적으로 열리는지 확인해 보세요.\n" +
                                "• USB를 뺐다가 다시 연결한 후 2~3초 뒤에 다시 시도해 주세요.",
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
                    Title = "인증서 파일 위치 확인 필요",
                    Summary = "해당 인증서 파일 또는 저장 대상 폴더를 찾을 수 없습니다.",
                    ActionTip = "• 인증서가 다른 폴더로 이동되었거나 이미 삭제되었는지 확인해 보세요.\n" +
                                "• 상단 메뉴의 '새로고침'을 눌러 최신 인증서 목록으로 갱신해 주세요.",
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
                    Title = "저장 공간 부족 또는 쓰기 금지 상태",
                    Summary = "USB 드라이브가 쓰기 금지(Lock) 상태이거나 남은 저장 공간이 부족합니다.",
                    ActionTip = "• USB 메모리 측면에 'Lock(잠금)' 스위치가 있다면 잠금을 해제해 주세요.\n" +
                                "• USB의 불필요한 파일을 정리하여 여유 용량을 확보한 후 다시 시도해 주세요.",
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
                    Title = "인증서 파일 사용 중 안내",
                    Summary = "다른 프로그램(인터넷 뱅킹, 공공기관 사이트, 보안 프로그램 등)에서 이 인증서 파일을 사용하고 있습니다.",
                    ActionTip = "• 실행 중인 웹 브라우저(Edge, Chrome 등) 및 금융/보안 프로그램을 닫아주세요.\n" +
                                "• 열려 있는 윈도우 탐색기 창을 닫은 후 다시 시도해 주세요.",
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
                    Title = "폴더 경로 길이 초과 안내",
                    Summary = "인증서가 저장된 폴더 경로가 Windows 허용 길이(260자)를 초과했습니다.",
                    ActionTip = "• 인증서가 담긴 상위 폴더 경로를 짧은 이름으로 변경하거나 표준 NPKI 폴더 위치로 이동해 주세요.",
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
                    Title = "인증서 파일 형식 오류",
                    Summary = "인증서 파일(signCert.der 또는 signPri.key)의 구조가 손상되었거나 유효하지 않습니다.",
                    ActionTip = "• 원본 인증서 파일이 정상적으로 복사되었는지 확인해 주세요.\n" +
                                "• 발급기관(금융결제원, 코스콤, 한국전자인증 등) 포털에서 인증서를 재발급받으시길 권장합니다.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 8. 클립보드 사용 오류
            if (rawMsg.IndexOf("clipboard", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawMsg.IndexOf("클립보드", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new UserErrorMessage
                {
                    Title = "클립보드 복사 일시적 지연",
                    Summary = "다른 프로그램에서 클립보드를 일시적으로 잠그고 있어 복사하지 못했습니다.",
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
                    Title = "프로그램 실행 오류",
                    Summary = "윈도우 탐색기 또는 웹 브라우저를 실행하지 못했습니다.",
                    ActionTip = "• 윈도우 설정에서 '기본 웹 브라우저(Edge/Chrome 등)'가 정상 지정되어 있는지 확인해 주세요.",
                    TechnicalDetail = $"{exType}: {rawMsg}"
                };
            }

            // 10. 기본 일반 예외
            return new UserErrorMessage
            {
                Title = "작업 처리 중 오류 발생",
                Summary = "예기치 않은 시스템 문제가 발생하여 요청을 완료하지 못했습니다.",
                ActionTip = "• 잠시 후 다시 시도해 보시거나, 프로그램 재실행 또는 컴퓨터 재부팅 후 확인해 주세요.\n" +
                            "• 문제가 지속될 경우 백업 이력 및 활동 로그를 확인해 주세요.",
                TechnicalDetail = $"{exType}: {rawMsg}"
            };
        }
    }
}
