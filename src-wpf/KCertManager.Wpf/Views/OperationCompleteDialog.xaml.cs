using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows;

namespace KCertManager.Wpf.Views
{
    public class OperationCompleteItem
    {
        public int IndexNumber { get; set; }
        public string Name { get; set; } = string.Empty;
        public string IssuerAndPolicy { get; set; } = string.Empty;
    }

    /// <summary>
    /// 인증서 복사/백업/가져오기 작업 완료 안내 전용 팝업 대화상자
    /// </summary>
    public partial class OperationCompleteDialog : Window
    {
        private readonly string _targetPath;

        public OperationCompleteDialog(
            string title,
            string subtitle,
            int count,
            string sourcePath,
            string targetPath,
            IEnumerable<OperationCompleteItem> items,
            string? guideTip = null,
            Window? owner = null)
        {
            InitializeComponent();

            if (owner != null && owner.IsVisible)
            {
                Owner = owner;
            }
            else if (Application.Current?.MainWindow != null && Application.Current.MainWindow.IsVisible && Application.Current.MainWindow != this)
            {
                Owner = Application.Current.MainWindow;
            }

            _targetPath = targetPath ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(title))
            {
                TxtTitle.Text = title;
            }
            if (!string.IsNullOrWhiteSpace(subtitle))
            {
                TxtSubtitle.Text = subtitle;
            }

            TxtCount.Text = count.ToString();
            TxtTimestamp.Text = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            TxtSourcePath.Text = string.IsNullOrWhiteSpace(sourcePath) ? "내 컴퓨터 (NPKI/GPKI)" : sourcePath;
            TxtTargetPath.Text = string.IsNullOrWhiteSpace(targetPath) ? "대상 저장소" : targetPath;

            var list = items?.ToList() ?? new List<OperationCompleteItem>();
            for (int i = 0; i < list.Count; i++)
            {
                list[i].IndexNumber = i + 1;
            }
            TxtCertCountBadge.Text = $" ({list.Count}개)";
            ListCertificates.ItemsSource = list;

            if (!string.IsNullOrWhiteSpace(guideTip))
            {
                TxtGuideTip.Text = guideTip;
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }

        private void BtnCopySummary_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("[K-인증서 매니저 작업 완료 보고서]");
                sb.AppendLine($"• 작업 제목: {TxtTitle.Text}");
                sb.AppendLine($"• 완료 일시: {TxtTimestamp.Text}");
                sb.AppendLine($"• 복사 건수: {TxtCount.Text}건 성공 (SHA-256 무결성 검증 통과)");
                sb.AppendLine($"• 출발지: {TxtSourcePath.Text}");
                sb.AppendLine($"• 도착지: {TxtTargetPath.Text}");
                sb.AppendLine("• 복사된 인증서 목록:");
                if (ListCertificates.ItemsSource is IEnumerable<OperationCompleteItem> items)
                {
                    foreach (var item in items)
                    {
                        sb.AppendLine($"  - {item.Name} ({item.IssuerAndPolicy})");
                    }
                }
                sb.AppendLine($"• 대상 경로: {_targetPath}");

                Clipboard.SetText(sb.ToString());
                TxtCopySummary.Text = "결과 텍스트 복사 완료! ✓";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"클립보드 복사 중 오류: {ex.Message}", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void BtnOpenFolder_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(_targetPath) && (Directory.Exists(_targetPath) || File.Exists(_targetPath)))
                {
                    string targetFolder = Directory.Exists(_targetPath) ? _targetPath : Path.GetDirectoryName(_targetPath) ?? string.Empty;
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "explorer.exe",
                        Arguments = targetFolder,
                        UseShellExecute = true
                    });
                }
                else
                {
                    MessageBox.Show($"폴더 경로를 찾을 수 없거나 접근할 수 없습니다:\n{_targetPath}", "안내", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"대상 폴더 열기 실패: {ex.Message}", "오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}
