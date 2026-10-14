using System;
using System.Diagnostics;
using System.Windows;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class UpdateNotificationDialog : Window
    {
        public string DownloadUrl { get; set; } = "https://github.com/AhBiYout-all/K-Certificate-Manager/releases";
        public string ReleaseUrl { get; set; } = "https://github.com/AhBiYout-all/K-Certificate-Manager/releases";

        public UpdateNotificationDialog(string currentVersion, string latestVersion, string releaseName, string releaseNotes, string downloadUrl, string releaseUrl)
        {
            InitializeComponent();

            TxtCurrentVersion.Text = $"v{currentVersion}";
            TxtLatestVersion.Text = $"v{latestVersion}";
            TxtReleaseNotes.Text = string.IsNullOrWhiteSpace(releaseNotes) 
                ? "• 새로운 기능 추가 및 시스템 안정성/보안 패치가 적용되었습니다." 
                : releaseNotes;

            if (!string.IsNullOrWhiteSpace(downloadUrl)) DownloadUrl = downloadUrl;
            if (!string.IsNullOrWhiteSpace(releaseUrl)) ReleaseUrl = releaseUrl;
        }

        private void DownloadUpdate_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var targetUrl = !string.IsNullOrWhiteSpace(DownloadUrl) ? DownloadUrl : ReleaseUrl;
                Process.Start(new ProcessStartInfo
                {
                    FileName = targetUrl,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"웹 브라우저를 여는 중 오류가 발생했습니다:\n{ex.Message}", "업데이트 연결 오류", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
            DialogResult = true;
            Close();
        }

        private void OpenGithubRepo_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "https://github.com/AhBiYout-all/K-Certificate-Manager",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"웹 브라우저를 여는 중 오류가 발생했습니다:\n{ex.Message}", "GitHub 연결 오류", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
