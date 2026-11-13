using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Windows;
using KCert.Core.Diagnostics;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public class DuplicateCopyVm : INotifyPropertyChanged
    {
        private bool _isChecked;
        public bool IsChecked
        {
            get => _isChecked;
            set
            {
                if (_isChecked != value)
                {
                    _isChecked = value;
                    PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsChecked)));
                }
            }
        }

        public bool DefaultRecommended { get; set; }
        public CertificateItem Cert { get; set; } = null!;
        public string LocationLabel { get; set; } = string.Empty;
        public string DirectoryPath { get; set; } = string.Empty;
        public string SizeDisplay { get; set; } = string.Empty;

        public event PropertyChangedEventHandler? PropertyChanged;
    }

    public class DuplicateGroupVm
    {
        public string CommonName { get; set; } = string.Empty;
        public string MetaInfo { get; set; } = string.Empty;
        public string CopyCountBadge { get; set; } = string.Empty;
        public string PrimaryLabel { get; set; } = string.Empty;
        public string PrimaryPath { get; set; } = string.Empty;
        public ObservableCollection<DuplicateCopyVm> RedundantCopies { get; set; } = new();
    }

    public class RepairCandidateVm : INotifyPropertyChanged
    {
        private bool _isChecked = true;
        public bool IsChecked
        {
            get => _isChecked;
            set
            {
                if (_isChecked != value)
                {
                    _isChecked = value;
                    PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsChecked)));
                }
            }
        }

        public CertificateItem Cert { get; set; } = null!;
        public string CommonName { get; set; } = string.Empty;
        public string IssueTitle { get; set; } = string.Empty;
        public string IssueDescription { get; set; } = string.Empty;
        public string SourcePath { get; set; } = string.Empty;
        public string DestinationRoot { get; set; } = string.Empty;
        public string CanonicalPreviewPath { get; set; } = string.Empty;

        public event PropertyChangedEventHandler? PropertyChanged;
    }

    public partial class DiagnosticsRepairDialog : Window
    {
        private readonly ObservableCollection<CertificateItem> _allCerts;
        private readonly CertificateBackupService _backupService;
        private readonly Func<Task> _refreshCallback;
        private readonly List<DuplicateGroupVm> _dupGroups = new();
        private readonly List<RepairCandidateVm> _repairCandidates = new();

        public bool HasMadeChanges { get; private set; }

        public DiagnosticsRepairDialog(
            ObservableCollection<CertificateItem> allCerts,
            CertificateBackupService backupService,
            Func<Task> refreshCallback)
        {
            InitializeComponent();
            _allCerts = allCerts;
            _backupService = backupService;
            _refreshCallback = refreshCallback;

            RebuildDiagnostics();
        }

        private void RebuildDiagnostics()
        {
            _dupGroups.Clear();
            _repairCandidates.Clear();

            var certs = _allCerts.Where(c => c != null).ToList();

            // 1. Group duplicates by SHA-256 hash of signCert.der (fallback to Serial+Issuer+CN)
            var grouped = certs.GroupBy(GetFingerprintKey, StringComparer.OrdinalIgnoreCase);

            int totalRedundant = 0;
            foreach (var grp in grouped)
            {
                var list = grp.ToList();
                if (list.Count <= 1) continue;

                var ordered = list
                    .OrderByDescending(ScorePrimaryPriority)
                    .ToList();
                var primary = ordered[0];
                var redundant = ordered.Skip(1).ToList();
                totalRedundant += redundant.Count;

                string primaryDrive = string.IsNullOrWhiteSpace(primary.DriveLetter)
                    ? (primary.IsRemovableMedia ? "USB" : "C:")
                    : primary.DriveLetter;

                var groupVm = new DuplicateGroupVm
                {
                    CommonName = !string.IsNullOrWhiteSpace(primary.CommonName) ? primary.CommonName : "공동인증서",
                    MetaInfo = $"· {primary.AccurateIssuerName} · 만료 {primary.NotAfter:yyyy-MM-dd}",
                    CopyCountBadge = $"총 {list.Count}개 사본",
                    PrimaryLabel = $"🛡️ 표준 원본 · 자동 보존 (삭제 불가) — {primary.StorageLocationType} ({primaryDrive})",
                    PrimaryPath = primary.DirectoryPath
                };

                foreach (var copy in redundant)
                {
                    bool isStd = copy.IsStandardPath;
                    bool isUsb = copy.IsRemovableMedia;
                    bool recommend = !isStd || (!isUsb && !primary.IsRemovableMedia) || (isUsb && primary.IsRemovableMedia && string.Equals(copy.DriveLetter, primary.DriveLetter, StringComparison.OrdinalIgnoreCase));

                    string reason = !isStd
                        ? "비표준 폴더 중복"
                        : isUsb
                            ? (string.Equals(copy.DriveLetter, primary.DriveLetter, StringComparison.OrdinalIgnoreCase) && primary.IsRemovableMedia ? "동일 USB 중복 사본" : "USB 백업 사본 (유지 권장)")
                            : "PC 내 중복 사본";

                    long bytes = Math.Max(copy.DerFileSize + copy.KeyFileSize, 2048);
                    groupVm.RedundantCopies.Add(new DuplicateCopyVm
                    {
                        IsChecked = recommend,
                        DefaultRecommended = recommend,
                        Cert = copy,
                        LocationLabel = $"{copy.StorageLocationIcon} {copy.StorageLocationType} ({copy.DriveLetter}) · {reason}",
                        DirectoryPath = copy.DirectoryPath,
                        SizeDisplay = bytes >= 1024 ? $"{bytes / 1024.0:F1} KB" : $"{bytes} B"
                    });
                }

                _dupGroups.Add(groupVm);
            }

            ListDuplicateGroups.ItemsSource = null;
            ListDuplicateGroups.ItemsSource = _dupGroups;

            // 2. Scan non-standard or broken folder paths via CertIntegrityDoctor
            foreach (var cert in certs)
            {
                if (!cert.IsCustomPath && !cert.IsRareLocalLowGpkiPath) continue;
                if (string.IsNullOrWhiteSpace(cert.DirectoryPath)) continue;

                var diag = CertIntegrityDoctor.Diagnose(cert.DirectoryPath);
                var (destRoot, previewPath) = ComputeCanonicalDestination(cert, diag.CanonicalSubPath);

                if (string.Equals(
                    previewPath.TrimEnd('\\'),
                    cert.DirectoryPath.TrimEnd('\\'),
                    StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string issueTitle = cert.IsRareLocalLowGpkiPath
                    ? "GPKI 비권장 위치 (AppData\\LocalLow\\GPKI)"
                    : (diag.Anomalies & CertAnomalyFlags.NestedFolderError) != 0
                        ? "중첩 폴더 오류 (GPKI\\GPKI / NPKI\\NPKI)"
                        : "비표준 보관 위치 (프로그램 미인식)";

                string issueDesc = diag.DetailedIssues != null && diag.DetailedIssues.Count > 0
                    ? string.Join(" ", diag.DetailedIssues)
                    : cert.LocationNoticeText;

                _repairCandidates.Add(new RepairCandidateVm
                {
                    IsChecked = true,
                    Cert = cert,
                    CommonName = !string.IsNullOrWhiteSpace(cert.CommonName) ? cert.CommonName : "공동인증서",
                    IssueTitle = $"· {issueTitle}",
                    IssueDescription = issueDesc,
                    SourcePath = cert.DirectoryPath,
                    DestinationRoot = destRoot,
                    CanonicalPreviewPath = previewPath
                });
            }

            ListRepairCandidates.ItemsSource = null;
            ListRepairCandidates.ItemsSource = _repairCandidates;

            TxtTabDupCount.Text = $"({totalRedundant})";
            TxtTabRepairCount.Text = $"({_repairCandidates.Count})";
            TxtSummaryStats.Text = $"전체 {certs.Count}건 스캔 · 중복 사본 {totalRedundant}건 · 복구 대상 {_repairCandidates.Count}건";

            bool hasDups = _dupGroups.Count > 0;
            EmptyDuplicatesState.Visibility = hasDups ? Visibility.Collapsed : Visibility.Visible;
            ScrollDuplicates.Visibility = hasDups ? Visibility.Visible : Visibility.Collapsed;

            bool hasRepairs = _repairCandidates.Count > 0;
            EmptyRepairsState.Visibility = hasRepairs ? Visibility.Collapsed : Visibility.Visible;
            ScrollRepairs.Visibility = hasRepairs ? Visibility.Visible : Visibility.Collapsed;
        }

        private static string GetFingerprintKey(CertificateItem cert)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(cert.DerFilePath) && File.Exists(cert.DerFilePath))
                {
                    var fi = new FileInfo(cert.DerFilePath);
                    if (fi.Length > 0 && fi.Length <= 512 * 1024)
                    {
                        using var sha = SHA256.Create();
                        using var stream = File.OpenRead(cert.DerFilePath);
                        var hash = sha.ComputeHash(stream);
                        return "SHA:" + BitConverter.ToString(hash).Replace("-", "");
                    }
                }
            }
            catch { }

            return $"SIG:{cert.SerialNumber}|{cert.IssuerName}|{cert.CommonName}";
        }

        private static int ScorePrimaryPriority(CertificateItem cert)
        {
            int score = 0;
            if (cert.IsStandardPath) score += 100;
            if (!cert.IsRemovableMedia) score += 40;
            if (cert.Status != ExpiryStatus.Expired) score += 20;
            if (cert.HasPrivateKey) score += 10;
            return score;
        }

        private static (string DestinationRoot, string PreviewPath) ComputeCanonicalDestination(CertificateItem cert, string canonicalSubPath)
        {
            string sysRoot = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string localLow = Path.Combine(userProfile, "AppData", "LocalLow");

            string sub = !string.IsNullOrWhiteSpace(canonicalSubPath)
                ? canonicalSubPath
                : Path.Combine(
                    cert.Category == CertCategory.GPKI ? "GPKI\\Certificate\\class2" :
                    cert.Category == CertCategory.EPKI ? "EPKI\\Certificate\\class2" :
                    "NPKI\\yessign\\USER",
                    Path.GetFileName(cert.DirectoryPath));

            string destRoot;
            if (cert.IsRemovableMedia && !string.IsNullOrWhiteSpace(cert.DriveLetter))
            {
                string dl = cert.DriveLetter.TrimEnd('\\', '/').ToUpperInvariant();
                if (!dl.EndsWith(":")) dl += ":";
                destRoot = dl + "\\";
            }
            else if (cert.Category == CertCategory.GPKI)
            {
                destRoot = sysRoot;
            }
            else
            {
                destRoot = localLow;
            }

            return (destRoot, Path.Combine(destRoot, sub));
        }

        private void SwitchTab(bool showDuplicates)
        {
            PanelDuplicates.Visibility = showDuplicates ? Visibility.Visible : Visibility.Collapsed;
            PanelRepairs.Visibility = showDuplicates ? Visibility.Collapsed : Visibility.Visible;

            BtnExecuteDuplicates.Visibility = showDuplicates ? Visibility.Visible : Visibility.Collapsed;
            BtnExecuteRepairs.Visibility = showDuplicates ? Visibility.Collapsed : Visibility.Visible;

            BtnTabDuplicates.Style = (Style)FindResource(showDuplicates ? "PrimaryButton" : "SecondaryButton");
            BtnTabRepairs.Style = (Style)FindResource(showDuplicates ? "SecondaryButton" : "PrimaryButton");

            TxtFooterHint.Text = showDuplicates
                ? "표준 원본은 자동 보존되며, 선택한 중복 사본은 휴지통으로 안전 격리됩니다."
                : "표준 위치로 안전 복사 후 기존 비표준 폴더를 선택적으로 휴지통 정리합니다.";
        }

        private void BtnTabDuplicates_Click(object sender, RoutedEventArgs e) => SwitchTab(true);
        private void BtnTabRepairs_Click(object sender, RoutedEventArgs e) => SwitchTab(false);

        private void BtnSelectRecommendedDups_Click(object sender, RoutedEventArgs e)
        {
            foreach (var grp in _dupGroups)
                foreach (var copy in grp.RedundantCopies)
                    copy.IsChecked = copy.DefaultRecommended;
        }

        private void BtnDeselectAllDups_Click(object sender, RoutedEventArgs e)
        {
            foreach (var grp in _dupGroups)
                foreach (var copy in grp.RedundantCopies)
                    copy.IsChecked = false;
        }

        private async void BtnExecuteDuplicates_Click(object sender, RoutedEventArgs e)
        {
            var targets = _dupGroups
                .SelectMany(g => g.RedundantCopies)
                .Where(c => c.IsChecked)
                .ToList();

            if (!targets.Any())
            {
                MessageBox.Show("휴지통으로 이동할 중복 사본을 1개 이상 선택해 주세요.", "안내", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            int moved = 0;
            foreach (var item in targets)
            {
                try
                {
                    _backupService.MoveToTrash(item.Cert);
                    moved++;
                }
                catch { }
            }

            if (moved > 0)
            {
                HasMadeChanges = true;
                ActivityLogService.Instance.Log(
                    LogCategory.DELETE,
                    LogLevel.INFO,
                    "중복 인증서 사본 휴지통 정리",
                    $"중복 사본 {moved}건 안전 격리 보관 (원본 자동 보존)",
                    "Duplicate Scan",
                    "Trash",
                    moved);

                await _refreshCallback();
                RebuildDiagnostics();
                ShowFeedback($"✅ 중복 사본 {moved}건을 안전하게 휴지통으로 이동했습니다.");
            }
        }

        private async void BtnExecuteRepairs_Click(object sender, RoutedEventArgs e)
        {
            var targets = _repairCandidates.Where(r => r.IsChecked).ToList();
            if (!targets.Any())
            {
                MessageBox.Show("표준 위치로 복구할 인증서를 1개 이상 선택해 주세요.", "안내", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            bool trashOld = ChkTrashSourceAfterRepair.IsChecked == true;
            int repairedCount = 0;
            var failMessages = new List<string>();

            foreach (var item in targets)
            {
                var res = CertIntegrityDoctor.RepairToStandardHierarchy(item.SourcePath, item.DestinationRoot);
                if (res.IsSuccess)
                {
                    repairedCount++;
                    if (trashOld && Directory.Exists(item.SourcePath))
                    {
                        try
                        {
                            _backupService.MoveToTrash(item.Cert);
                        }
                        catch { }
                    }

                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.SUCCESS,
                        "비표준 인증서 폴더 자동 복구",
                        $"{item.CommonName}: {item.SourcePath} ➔ {res.RepairedPath}",
                        item.SourcePath,
                        res.RepairedPath);
                }
                else
                {
                    failMessages.Add($"{item.CommonName}: {res.Message}");
                }
            }

            if (repairedCount > 0)
            {
                HasMadeChanges = true;
                await _refreshCallback();
                RebuildDiagnostics();
                ShowFeedback($"✅ 비표준 인증서 {repairedCount}건을 표준 위치로 복구했습니다.");
            }

            if (failMessages.Any())
            {
                MessageBox.Show(
                    "일부 항목 복구 중 안내:\n\n" + string.Join("\n", failMessages),
                    "복구 결과 안내",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private void ShowFeedback(string message)
        {
            TxtFeedbackMessage.Text = message;
            BannerFeedback.Visibility = Visibility.Visible;
        }

        private void BtnDismissFeedback_Click(object sender, RoutedEventArgs e)
        {
            BannerFeedback.Visibility = Visibility.Collapsed;
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = HasMadeChanges;
            Close();
        }
    }
}
