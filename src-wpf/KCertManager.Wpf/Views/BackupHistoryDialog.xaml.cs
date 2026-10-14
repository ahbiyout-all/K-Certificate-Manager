using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public partial class BackupHistoryDialog : Window
    {
        private readonly IList<BackupHistoryItem> _history;

        public BackupHistoryDialog(IList<BackupHistoryItem> history)
        {
            InitializeComponent();
            _history = history ?? new List<BackupHistoryItem>();
            LoadHistory();
        }

        private void LoadHistory()
        {
            GridHistory.ItemsSource = null;
            GridHistory.ItemsSource = _history;
            TxtHistoryCount.Text = $"총 {_history.Count}건의 백업 기록";
        }

        private void BtnOpenFolder_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is BackupHistoryItem item)
            {
                try
                {
                    var dir = Directory.Exists(item.DestinationPath)
                        ? item.DestinationPath
                        : Path.GetDirectoryName(item.DestinationPath);

                    if (!string.IsNullOrEmpty(dir) && Directory.Exists(dir))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "explorer.exe",
                            Arguments = $"\"{dir}\"",
                            UseShellExecute = true
                        });
                    }
                    else
                    {
                        UserFriendlyMessageHelper.ShowWarning(
                            "해당 백업 폴더를 찾을 수 없습니다.\n\nUSB 이동식 드라이브가 분리되었거나 폴더가 변경되었을 수 있습니다.",
                            "백업 위치 미발견 안내",
                            "• USB 메모리가 컴퓨터에 올바르게 꽂혀 있는지 확인해 주세요.",
                            this);
                    }
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowError(ex, "백업 대상 폴더 열기", this);
                }
            }
        }

        private void BtnClearHistory_Click(object sender, RoutedEventArgs e)
        {
            _history.Clear();
            LoadHistory();
            ActivityLogService.Instance.Log(LogCategory.BACKUP, LogLevel.INFO, "백업 이력 초기화", "사용자 요청으로 백업 기록을 초기화했습니다.");
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
