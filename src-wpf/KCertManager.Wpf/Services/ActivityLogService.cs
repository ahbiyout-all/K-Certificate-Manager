using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Text;
using System.Windows;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Services
{
    public class ActivityLogService
    {
        private static readonly Lazy<ActivityLogService> _instance = new(() => new ActivityLogService());
        public static ActivityLogService Instance => _instance.Value;

        private readonly ObservableCollection<AppLogItem> _logs = new();
        private readonly string _logFilePath;
        private readonly object _lock = new();

        public ObservableCollection<AppLogItem> Logs => _logs;

        public ActivityLogService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var logDir = Path.Combine(appData, "KCertManager", "Logs");
            if (!Directory.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
            }
            _logFilePath = Path.Combine(logDir, "kcert_audit.log");

            // Initial log
            Log(LogCategory.SECURITY, LogLevel.SUCCESS, "보안 세션 초기화", "로컬 샌드박스 보안 격리 환경에서 KCert Manager 구동 시작", "System", "Local", 1);
        }

        public void Log(LogCategory category, LogLevel level, string action, string details, string source = "", string target = "", int count = 1)
        {
            var item = new AppLogItem
            {
                Category = category,
                Level = level,
                Action = action,
                Details = details,
                Source = source,
                Target = target,
                Count = count
            };

            var dispatcher = Application.Current?.Dispatcher;
            if (dispatcher != null)
            {
                dispatcher.BeginInvoke(new Action(() =>
                {
                    _logs.Insert(0, item);
                    if (_logs.Count > 1000)
                    {
                        _logs.RemoveAt(_logs.Count - 1);
                    }
                }));
            }
            else
            {
                _logs.Insert(0, item);
            }

            // Append to disk asynchronously
            try
            {
                lock (_lock)
                {
                    string line = $"[{item.FormattedTime}] [{item.Level}] [{item.CategoryBadgeText}] {item.Action} - {item.Details} (Source: {item.Source} -> Target: {item.Target})";
                    File.AppendAllText(_logFilePath, line + Environment.NewLine, Encoding.UTF8);
                }
            }
            catch { }
        }

        public void Clear()
        {
            _logs.Clear();
            Log(LogCategory.SECURITY, LogLevel.INFO, "로그 기록 비우기", "사용자 요청으로 메모리 작업 로그가 초기화되었습니다.");
        }

        public string ExportLogsToText()
        {
            var sb = new StringBuilder();
            sb.AppendLine("================================================================================");
            sb.AppendLine("                 KCert Manager 작업 및 보안 감사 로그 내역");
            sb.AppendLine($"              생성 시각: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine("================================================================================");
            sb.AppendLine();

            foreach (var log in _logs)
            {
                sb.AppendLine($"[{log.FormattedTime}] [{log.Level,-7}] [{log.CategoryBadgeText,-6}] {log.Action}");
                sb.AppendLine($"  - 세부내용: {log.Details}");
                if (!string.IsNullOrEmpty(log.Source) || !string.IsNullOrEmpty(log.Target))
                {
                    sb.AppendLine($"  - 경로정보: {log.Source}  ==>  {log.Target}");
                }
                sb.AppendLine();
            }

            return sb.ToString();
        }
    }
}
