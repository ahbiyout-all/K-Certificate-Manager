using System;
using System.Threading;
using System.Windows;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public partial class UpdateNotificationDialog : Window
    {
        private readonly AppUpdateInfo _updateInfo;
        private CancellationTokenSource? _cts;
        private bool _isUpdating;

        public string DownloadUrl { get; set; } = "https://github.com/AhBiYout-all/K-Certificate-Manager/releases";
        public string ReleaseUrl { get; set; } = "https://github.com/AhBiYout-all/K-Certificate-Manager/releases";

        public UpdateNotificationDialog(AppUpdateInfo updateInfo)
            : this(
                updateInfo.CurrentVersion,
                updateInfo.LatestVersion,
                updateInfo.ReleaseName,
                updateInfo.ReleaseNotes,
                updateInfo.DownloadUrl ?? updateInfo.ReleaseUrl,
                updateInfo.ReleaseUrl,
                updateInfo.AssetName,
                updateInfo.AssetSizeBytes)
        {
        }

        public UpdateNotificationDialog(
            string currentVersion,
            string latestVersion,
            string releaseName,
            string releaseNotes,
            string downloadUrl,
            string releaseUrl,
            string? assetName = null,
            long? assetSizeBytes = null)
        {
            InitializeComponent();

            if (!string.IsNullOrWhiteSpace(downloadUrl)) DownloadUrl = downloadUrl;
            if (!string.IsNullOrWhiteSpace(releaseUrl)) ReleaseUrl = releaseUrl;

            _updateInfo = new AppUpdateInfo
            {
                HasUpdate = true,
                CurrentVersion = currentVersion,
                LatestVersion = latestVersion,
                ReleaseName = releaseName,
                ReleaseNotes = releaseNotes,
                DownloadUrl = DownloadUrl,
                ReleaseUrl = ReleaseUrl,
                AssetName = assetName,
                AssetSizeBytes = assetSizeBytes
            };

            TxtCurrentVersion.Text = $"v{currentVersion}";
            TxtLatestVersion.Text = $"v{latestVersion}";
            TxtReleaseNotes.Text = string.IsNullOrWhiteSpace(releaseNotes)
                ? "• 새로운 기능 추가 및 시스템 안정성/보안 패치가 적용되었습니다."
                : releaseNotes;

            var pkgName = !string.IsNullOrWhiteSpace(assetName)
                ? assetName
                : $"kcert-manager-v{latestVersion}-setup.exe";
            var sizeSuffix = assetSizeBytes.HasValue && assetSizeBytes.Value > 0
                ? $" ({assetSizeBytes.Value / (1024.0 * 1024.0):F1} MB)"
                : "";
            TxtPackageSummary.Text = $"대상 패키지: {pkgName}{sizeSuffix} · 확인 시 앱에서 바로 다운로드해 자동 설치합니다.";
        }

        private async void DownloadUpdate_Click(object sender, RoutedEventArgs e)
        {
            if (_isUpdating) return;
            _isUpdating = true;

            _cts = new CancellationTokenSource();
            PnlError.Visibility = Visibility.Collapsed;
            PnlProgress.Visibility = Visibility.Visible;
            BtnConfirmUpdate.IsEnabled = false;
            BtnHeaderClose.IsEnabled = false;
            TxtConfirmLabel.Text = "자동 다운로드 · 설치 중...";
            TxtCancelLabel.Text = "취소";

            var progress = new Progress<UpdateInstallProgress>(p =>
            {
                UpdateProgressBar.Value = p.Percentage;
                TxtProgressPercent.Text = $"{p.Percentage}%";
                TxtProgressStage.Text = p.Stage switch
                {
                    "downloading" => "⬇️ 업데이트 파일 다운로드 중...",
                    "verifying" => "🛡️ 파일 손상 검사 중 (SHA-256)...",
                    "installing" => "⚙️ 자동 설치 및 재시작 준비 중...",
                    "completed" => "✅ 자동 설치가 시작되었습니다",
                    _ => "업데이트 진행 중..."
                };
                TxtProgressDetail.Text = p.Message;
            });

            var result = await UpdateCheckerService.DownloadAndInstallAsync(_updateInfo, progress, _cts.Token);

            if (result.Success && result.ShouldShutdownForInstall)
            {
                DialogResult = true;
                Close();
                Application.Current?.Shutdown();
                return;
            }

            _isUpdating = false;
            _cts?.Dispose();
            _cts = null;

            BtnConfirmUpdate.IsEnabled = true;
            BtnHeaderClose.IsEnabled = true;
            TxtConfirmLabel.Text = "다시 시도 (자동 다운로드 · 설치)";
            TxtCancelLabel.Text = "나중에 하기";
            PnlError.Visibility = Visibility.Visible;
            TxtErrorDetail.Text = result.Message;
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            if (_isUpdating)
            {
                _cts?.Cancel();
                return;
            }
            DialogResult = false;
            Close();
        }
    }
}
