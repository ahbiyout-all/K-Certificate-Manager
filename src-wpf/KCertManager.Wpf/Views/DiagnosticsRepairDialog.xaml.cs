using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using KCert.Core.Diagnostics;
using KCert.Core.Parser;
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

    public class CryptoAuditVm
    {
        public string CommonName { get; set; } = string.Empty;
        public string PublicKeySpecText { get; set; } = string.Empty;
        public string MetaSummary { get; set; } = string.Empty;
        public string Recommendation { get; set; } = string.Empty;
        public string PostureLabel { get; set; } = string.Empty;
        public string PostureColorHex { get; set; } = "#F59E0B";
        public CryptoSecurityPosture Posture { get; set; }
    }

    public partial class DiagnosticsRepairDialog : Window
    {
        private readonly ObservableCollection<CertificateItem> _allCerts;
        private readonly CertificateBackupService _backupService;
        private readonly Func<Task> _refreshCallback;
        private readonly List<DuplicateGroupVm> _dupGroups = new();
        private readonly List<RepairCandidateVm> _repairCandidates = new();
        private readonly List<CryptoAuditVm> _cryptoAuditItems = new();
        private string _cryptoFilterMode = "ALL";
        private int _cryptoCount3072;
        private int _cryptoCount2048;
        private int _cryptoCountWeak;

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
            _cryptoAuditItems.Clear();

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

                var diag = CertIntegrityDoctor.Diagnose(cert.DirectoryPath, cert.DerFilePath);
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

            // 3. Crypto Strength Audit (2027.02 RSA 3072-bit readiness)
            _cryptoCount3072 = 0;
            _cryptoCount2048 = 0;
            _cryptoCountWeak = 0;

            foreach (var cert in certs.OrderBy(c => c.SecurityPosture == CryptoSecurityPosture.LegacyWeak ? 0 : c.SecurityPosture == CryptoSecurityPosture.Standard2048Transition ? 1 : 2).ThenBy(c => c.RemainingDays))
            {
                if (cert.SecurityPosture == CryptoSecurityPosture.Recommended3072) _cryptoCount3072++;
                else if (cert.SecurityPosture == CryptoSecurityPosture.LegacyWeak) _cryptoCountWeak++;
                else _cryptoCount2048++;

                _cryptoAuditItems.Add(new CryptoAuditVm
                {
                    CommonName = !string.IsNullOrWhiteSpace(cert.CommonName) ? cert.CommonName : "공동인증서",
                    PublicKeySpecText = cert.PublicKeySpecText,
                    MetaSummary = $"{cert.AccurateIssuerName} · {cert.StorageLocationType} ({cert.DriveLetter}) · 만료일 {cert.NotAfter:yyyy-MM-dd}",
                    Recommendation = cert.CryptoPostureDetailText,
                    PostureLabel = cert.CryptoPostureLabel,
                    PostureColorHex = cert.CryptoPostureColorHex,
                    Posture = cert.SecurityPosture
                });
            }

            TxtCryptoCount3072.Text = $"{_cryptoCount3072}건";
            TxtCryptoCount2048.Text = $"{_cryptoCount2048}건";
            TxtCryptoCountWeak.Text = $"{_cryptoCountWeak}건";

            TxtTabDupCount.Text = $"({totalRedundant})";
            TxtTabRepairCount.Text = $"({_repairCandidates.Count})";
            TxtTabCryptoCount.Text = _cryptoCountWeak > 0
                ? $"({_cryptoCountWeak} 취약)"
                : $"({_cryptoCount3072}/{certs.Count})";
            TxtSummaryStats.Text = $"전체 {certs.Count}건 · 중복 {totalRedundant}건 · 복구 {_repairCandidates.Count}건 · 3072-bit+ {_cryptoCount3072}건";

            bool hasDups = _dupGroups.Count > 0;
            EmptyDuplicatesState.Visibility = hasDups ? Visibility.Collapsed : Visibility.Visible;
            ScrollDuplicates.Visibility = hasDups ? Visibility.Visible : Visibility.Collapsed;

            bool hasRepairs = _repairCandidates.Count > 0;
            EmptyRepairsState.Visibility = hasRepairs ? Visibility.Collapsed : Visibility.Visible;
            ScrollRepairs.Visibility = hasRepairs ? Visibility.Visible : Visibility.Collapsed;

            ApplyCryptoFilter();
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

            string serial = (cert.SerialNumber ?? string.Empty).Trim();
            string expirySuffix = string.IsNullOrWhiteSpace(serial) ? $"|{cert.NotAfter:yyyyMMdd}" : string.Empty;
            return $"SIG:{serial}|{cert.IssuerName}|{cert.CommonName}{expirySuffix}";
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
            string sysDriveTrimmed = sysRoot.TrimEnd('\\', '/').ToUpperInvariant();
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string localLow = Path.Combine(userProfile, "AppData", "LocalLow");

            bool isClass1 = cert.IsClass1Path ||
                            (!string.IsNullOrWhiteSpace(cert.DirectoryPath) &&
                             Regex.IsMatch(cert.DirectoryPath, @"(?:^|[\\/])class1(?:$|[\\/])", RegexOptions.IgnoreCase));
            string classTier = isClass1 ? "class1" : "class2";

            string sub = !string.IsNullOrWhiteSpace(canonicalSubPath)
                ? canonicalSubPath
                : Path.Combine(
                    cert.Category == CertCategory.GPKI ? $"GPKI\\Certificate\\{classTier}" :
                    cert.Category == CertCategory.EPKI ? $"EPKI\\Certificate\\{classTier}" :
                    "NPKI\\yessign\\USER",
                    Path.GetFileName(cert.DirectoryPath));

            string certDrive = (cert.DriveLetter ?? Path.GetPathRoot(cert.DirectoryPath) ?? string.Empty)
                .TrimEnd('\\', '/')
                .ToUpperInvariant();
            if (!string.IsNullOrWhiteSpace(certDrive) && !certDrive.EndsWith(":")) certDrive += ":";
            bool isNonSystemDrive = !string.IsNullOrWhiteSpace(certDrive) &&
                                    !string.Equals(certDrive, sysDriveTrimmed, StringComparison.OrdinalIgnoreCase);

            string destRoot;
            if ((cert.IsRemovableMedia || isNonSystemDrive) && !string.IsNullOrWhiteSpace(certDrive))
            {
                destRoot = certDrive + "\\";
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

        private void SwitchTab(int tabIndex)
        {
            PanelDuplicates.Visibility = tabIndex == 0 ? Visibility.Visible : Visibility.Collapsed;
            PanelRepairs.Visibility = tabIndex == 1 ? Visibility.Visible : Visibility.Collapsed;
            PanelCrypto.Visibility = tabIndex == 2 ? Visibility.Visible : Visibility.Collapsed;

            BtnExecuteDuplicates.Visibility = tabIndex == 0 ? Visibility.Visible : Visibility.Collapsed;
            BtnExecuteRepairs.Visibility = tabIndex == 1 ? Visibility.Visible : Visibility.Collapsed;

            var primary = TryFindResource("PrimaryButton") as Style;
            var secondary = TryFindResource("SecondaryButton") as Style;
            if (primary != null && secondary != null)
            {
                BtnTabDuplicates.Style = tabIndex == 0 ? primary : secondary;
                BtnTabRepairs.Style = tabIndex == 1 ? primary : secondary;
                BtnTabCrypto.Style = tabIndex == 2 ? primary : secondary;
            }

            TxtFooterHint.Text = tabIndex switch
            {
                0 => "표준 원본은 자동 보존되며, 선택한 중복 사본은 휴지통으로 안전 격리됩니다.",
                1 => "표준 위치로 안전 복사 후 기존 비표준 폴더를 선택적으로 휴지통 정리합니다.",
                _ => $"2027.02 보안강도 상향 점검: 3072-bit+ {_cryptoCount3072}건 · 2048-bit {_cryptoCount2048}건 · 취약 {_cryptoCountWeak}건"
            };
        }

        private void ApplyCryptoFilter()
        {
            var filtered = _cryptoAuditItems.Where(item => _cryptoFilterMode switch
            {
                "WEAK" => item.Posture == CryptoSecurityPosture.LegacyWeak,
                "2048" => item.Posture == CryptoSecurityPosture.Standard2048Transition,
                "3072" => item.Posture == CryptoSecurityPosture.Recommended3072,
                _ => true
            }).ToList();

            ListCryptoAudit.ItemsSource = null;
            ListCryptoAudit.ItemsSource = filtered;

            bool hasItems = filtered.Count > 0;
            EmptyCryptoState.Visibility = hasItems ? Visibility.Collapsed : Visibility.Visible;
            ScrollCrypto.Visibility = hasItems ? Visibility.Visible : Visibility.Collapsed;

            var primary = TryFindResource("PrimaryButton") as Style;
            var secondary = TryFindResource("SecondaryButton") as Style;
            if (primary != null && secondary != null)
            {
                BtnCryptoFilterAll.Style = _cryptoFilterMode == "ALL" ? primary : secondary;
                BtnCryptoFilterWeak.Style = _cryptoFilterMode == "WEAK" ? primary : secondary;
                BtnCryptoFilter2048.Style = _cryptoFilterMode == "2048" ? primary : secondary;
                BtnCryptoFilter3072.Style = _cryptoFilterMode == "3072" ? primary : secondary;
            }
        }

        private void BtnCryptoFilter_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is string tag)
            {
                _cryptoFilterMode = tag;
                ApplyCryptoFilter();
            }
        }

        private void BtnCopyCryptoReport_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var lines = new List<string>
                {
                    "[K-인증서 매니저 - 2027.02 보안강도(RSA 3072-bit) 점검 결과]",
                    $"전체 {_cryptoAuditItems.Count}건 · 3072-bit+ {_cryptoCount3072}건 · 2048-bit {_cryptoCount2048}건 · 취약 {_cryptoCountWeak}건",
                    string.Empty
                };
                for (int i = 0; i < _cryptoAuditItems.Count; i++)
                {
                    var item = _cryptoAuditItems[i];
                    lines.Add($"{i + 1}. {item.CommonName} | {item.PublicKeySpecText} | {item.PostureLabel} | {item.MetaSummary}");
                }
                Clipboard.SetText(string.Join(Environment.NewLine, lines));
                ShowFeedback("✅ RSA 3072-bit 보안강도 점검 리포트를 클립보드에 복사했습니다.");
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, $"클립보드 복사 중 오류: {ex.Message}", "복사 안내", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void BtnTabDuplicates_Click(object sender, RoutedEventArgs e) => SwitchTab(0);
        private void BtnTabRepairs_Click(object sender, RoutedEventArgs e) => SwitchTab(1);
        private void BtnTabCrypto_Click(object sender, RoutedEventArgs e) => SwitchTab(2);

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
            try
            {
                var targets = _dupGroups
                    .SelectMany(g => g.RedundantCopies)
                    .Where(c => c.IsChecked)
                    .ToList();

                if (!targets.Any())
                {
                    MessageBox.Show(this, "휴지통으로 이동할 중복 사본을 1개 이상 선택해 주세요.", "안내", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                int moved = 0;
                int failed = 0;
                var failMessages = new List<string>();
                foreach (var item in targets)
                {
                    try
                    {
                        _backupService.MoveToTrash(item.Cert);
                        moved++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        failMessages.Add($"{item.Cert.CommonName}: {ex.Message}");
                    }
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
                    ShowFeedback(failed > 0
                        ? $"✅ 중복 사본 {moved}건을 휴지통으로 이동했습니다. (실패 {failed}건)"
                        : $"✅ 중복 사본 {moved}건을 안전하게 휴지통으로 이동했습니다.");
                }
                else if (failed > 0)
                {
                    MessageBox.Show(
                        this,
                        $"중복 사본 휴지통 이동 중 오류가 발생했습니다 ({failed}건):\n" + string.Join("\n", failMessages.Take(5)),
                        "오류",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    this,
                    $"중복 인증서 정리 중 오류가 발생했습니다:\n{ex.Message}",
                    "중복 정리 오류 안내",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private async void BtnExecuteRepairs_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var targets = _repairCandidates.Where(r => r.IsChecked).ToList();
                if (!targets.Any())
                {
                    MessageBox.Show(this, "표준 위치로 복구할 인증서를 1개 이상 선택해 주세요.", "안내", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                bool trashOld = ChkTrashSourceAfterRepair.IsChecked == true;
                int repairedCount = 0;
                var failMessages = new List<string>();
                var succeededRepairs = new List<(RepairCandidateVm Item, string RepairedPath)>();

                // Pass 1: Copy all selected non-standard certificates to standard paths before trashing any source folder
                foreach (var item in targets)
                {
                    var res = CertIntegrityDoctor.RepairToStandardHierarchy(item.SourcePath, item.DestinationRoot, item.Cert?.DerFilePath);
                    if (res.IsSuccess)
                    {
                        repairedCount++;
                        succeededRepairs.Add((item, res.RepairedPath));

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

                // Pass 2: Deduplicate source directories and move to trash only after all repairs finish
                if (trashOld && succeededRepairs.Any())
                {
                    var trashedPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    var repairedCertSet = new HashSet<CertificateItem>(succeededRepairs.Select(s => s.Item.Cert));
                    foreach (var (item, repairedPath) in succeededRepairs)
                    {
                        if (string.IsNullOrWhiteSpace(item.SourcePath)) continue;

                        try
                        {
                            string normSrc = Path.GetFullPath(item.SourcePath).TrimEnd('\\');
                            string normDst = string.IsNullOrWhiteSpace(repairedPath)
                                ? string.Empty
                                : Path.GetFullPath(repairedPath).TrimEnd('\\');

                            if (string.Equals(normSrc, normDst, StringComparison.OrdinalIgnoreCase)) continue;
                            if (!trashedPaths.Add(normSrc)) continue;

                            bool hasUnrepairedSibling = _allCerts.Any(c =>
                                c != null &&
                                !repairedCertSet.Contains(c) &&
                                !string.IsNullOrWhiteSpace(c.DirectoryPath) &&
                                string.Equals(Path.GetFullPath(c.DirectoryPath).TrimEnd('\\'), normSrc, StringComparison.OrdinalIgnoreCase));

                            if (hasUnrepairedSibling)
                            {
                                failMessages.Add($"{item.CommonName}: 동일 폴더({item.SourcePath}) 내 미복구 인증서가 함께 있어 원본 폴더는 보존했습니다.");
                                continue;
                            }

                            if (Directory.Exists(item.SourcePath))
                            {
                                _backupService.MoveToTrash(item.Cert);
                                ActivityLogService.Instance.Log(
                                    LogCategory.DELETE,
                                    LogLevel.INFO,
                                    "정위치 복구 후 원본 비표준 폴더 휴지통 이동",
                                    $"{item.CommonName}: {item.SourcePath} (복구 위치: {repairedPath})",
                                    item.SourcePath,
                                    "SafetyTrash");
                            }
                        }
                        catch (Exception ex)
                        {
                            failMessages.Add($"{item.CommonName} 원본 휴지통 이동 실패: {ex.Message}");
                        }
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
                        this,
                        "일부 항목 복구 중 안내:\n\n" + string.Join("\n", failMessages),
                        "복구 결과 안내",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    this,
                    $"폴더 정위치 복구 처리 중 오류가 발생했습니다:\n{ex.Message}",
                    "복구 오류 안내",
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
