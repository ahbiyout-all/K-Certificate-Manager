using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using Microsoft.Win32;

namespace KCertManager.Wpf.Views
{
    public partial class ActivityLogDialog : Window
    {
        private string _selectedFilter = "ALL";
        private string _searchKeyword = string.Empty;

        public ActivityLogDialog()
        {
            InitializeComponent();
            ApplyFilter();
        }

        private void ApplyFilter()
        {
            var logs = ActivityLogService.Instance.Logs.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(_searchKeyword))
            {
                var kw = _searchKeyword.Trim();
                logs = logs.Where(x =>
                    x.Action.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.Details.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.Source.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.Target.Contains(kw, StringComparison.OrdinalIgnoreCase));
            }

            logs = _selectedFilter switch
            {
                "BACKUP" => logs.Where(x => x.Category == LogCategory.BACKUP),
                "VAULT" => logs.Where(x => x.Category == LogCategory.VAULT),
                "DELETE_RESTORE" => logs.Where(x => x.Category == LogCategory.DELETE || x.Category == LogCategory.RESTORE),
                "SCAN" => logs.Where(x => x.Category == LogCategory.SCAN),
                _ => logs
            };

            var list = logs.ToList();
            GridLogs.ItemsSource = list;
            TxtLogCount.Text = $"총 {list.Count}건의 감사 로그 표시 중 (전체 {ActivityLogService.Instance.Logs.Count}건)";
        }

        private void Filter_Click(object sender, RoutedEventArgs e)
        {
            if (sender is RadioButton rb && rb.Tag is string tag)
            {
                _selectedFilter = tag;
                ApplyFilter();
            }
        }

        private void TxtSearchLog_TextChanged(object sender, TextChangedEventArgs e)
        {
            _searchKeyword = TxtSearchLog.Text;
            ApplyFilter();
        }

        private void BtnExportLogs_Click(object sender, RoutedEventArgs e)
        {
            var sfd = new SaveFileDialog
            {
                Filter = "텍스트 로그 파일 (*.txt)|*.txt|모든 파일 (*.*)|*.*",
                FileName = $"KCert_AuditLog_{DateTime.Now:yyyyMMdd_HHmmss}.txt",
                Title = "감사 로그 파일 저장"
            };

            if (sfd.ShowDialog() == true)
            {
                try
                {
                    var text = ActivityLogService.Instance.ExportLogsToText();
                    File.WriteAllText(sfd.FileName, text, System.Text.Encoding.UTF8);
                    UserFriendlyMessageHelper.ShowInfo($"감사 로그 파일이 성공적으로 저장되었습니다.\n\n저장 위치: {sfd.FileName}", "로그 내보내기 완료", this);
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowError(ex, "감사 로그 파일 저장", this);
                }
            }
        }

        private void BtnClearLogs_Click(object sender, RoutedEventArgs e)
        {
            var confirm = MessageBox.Show("메모리 상의 작업 로그를 초기화하시겠습니까?\n(디스크의 영구 감사 파일은 보존됩니다)", "로그 비우기", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (confirm == MessageBoxResult.Yes)
            {
                ActivityLogService.Instance.Clear();
                ApplyFilter();
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
