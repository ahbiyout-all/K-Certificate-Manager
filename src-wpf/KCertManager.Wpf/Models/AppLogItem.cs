using System;

namespace KCertManager.Wpf.Models
{
    public enum LogCategory
    {
        ALL,
        SCAN,
        BACKUP,
        IMPORT,
        DELETE,
        RESTORE,
        VAULT,
        SECURITY
    }

    public enum LogLevel
    {
        INFO,
        SUCCESS,
        WARN,
        ERROR
    }

    public class AppLogItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public LogCategory Category { get; set; } = LogCategory.SCAN;
        public LogLevel Level { get; set; } = LogLevel.INFO;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
        public int Count { get; set; } = 1;

        public string FormattedTime => Timestamp.ToString("yyyy-MM-dd HH:mm:ss");

        public string LevelBadgeColor => Level switch
        {
            LogLevel.SUCCESS => "#34D399", // Emerald
            LogLevel.WARN => "#FBBF24",    // Amber
            LogLevel.ERROR => "#F87171",   // Rose
            _ => "#93C5FD"                 // Blue
        };

        public string CategoryBadgeText => Category switch
        {
            LogCategory.SCAN => "스캔",
            LogCategory.BACKUP => "백업",
            LogCategory.IMPORT => "가져오기",
            LogCategory.DELETE => "삭제/휴지통",
            LogCategory.RESTORE => "복원",
            LogCategory.VAULT => "보안금고",
            LogCategory.SECURITY => "보안/무결성",
            _ => "일반"
        };
    }
}
