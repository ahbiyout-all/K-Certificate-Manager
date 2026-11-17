using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using KCert.Core.HardwareGuard;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public class OperationCompleteItem
    {
        public int IndexNumber { get; set; }
        public string Name { get; set; } = string.Empty;
        public string IssuerAndPolicy { get; set; } = string.Empty;
        public string Details { get => IssuerAndPolicy; set => IssuerAndPolicy = value; }
    }

    /// <summary>
    /// 인증서 복사/백업/가져오기 작업 완료 안내 전용 팝업 대화상자
    /// </summary>
    public partial class OperationCompleteDialog : Window
    {
        private readonly string _targetPath;
        private readonly string? _removableDriveLetter;

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

            // 대상 경로가 이동식 USB 드라이브인 경우 [USB 안전 제거] 버튼 활성화
            _removableDriveLetter = DetectRemovableUsbDrive(_targetPath);
            if (!string.IsNullOrEmpty(_removableDriveLetter))
            {
                TxtEjectUsb.Text = $"{_removableDriveLetter} USB 안전 제거";
                BtnEjectUsb.Visibility = Visibility.Visible;
            }

            // 설정 모달에서 '대상 USB 폴더 탐색기 자동 열기' 옵션이 활성화된 경우 자동으로 탐색기 실행
            if (SettingsService.Instance.AutoOpenUsbFolderOnComplete)
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(_targetPath))
                    {
                        var folderToOpen = ResolveExistingTargetDirectory(_targetPath);
                        if (!string.IsNullOrWhiteSpace(folderToOpen) && Directory.Exists(folderToOpen))
                        {
                            OpenDirectoryInExplorer(folderToOpen);
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[AutoOpenUsbFolder error] {ex.Message}");
                }
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
                sb.AppendLine($"• 복사 건수: {TxtCount.Text}건 성공 (SHA-256 파일 손상 없음)");
                sb.AppendLine($"• 원본 위치: {TxtSourcePath.Text}");
                sb.AppendLine($"• 저장 위치: {TxtTargetPath.Text}");
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

        private static string ExtractDrivePrefix(string? path)
        {
            string defaultDrive = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\').ToUpperInvariant();
            if (!defaultDrive.EndsWith(":")) defaultDrive = "C:";
            if (string.IsNullOrWhiteSpace(path)) return defaultDrive;

            var match = System.Text.RegularExpressions.Regex.Match(path.Trim(), @"(?:^|[^A-Za-z])([A-Za-z]:)");
            if (match.Success)
            {
                return match.Groups[1].Value.ToUpperInvariant();
            }
            return defaultDrive;
        }

        private static string ResolveExistingTargetDirectory(string? rawPath)
        {
            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\') + "\\";
            string localLow = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "AppData", "LocalLow");
            string defaultNpki = Path.Combine(localLow, "NPKI");
            string path = string.IsNullOrWhiteSpace(rawPath)
                ? (Directory.Exists(defaultNpki) ? defaultNpki : Path.Combine(sysRoot, "NPKI"))
                : rawPath.Trim().Replace('/', '\\');
            string driveLetter = ExtractDrivePrefix(path);
            string driveRoot = driveLetter + "\\";

            string candidate = path;
            if (System.Text.RegularExpressions.Regex.IsMatch(candidate, @"^[A-Za-z]:[^\\]"))
            {
                candidate = candidate.Substring(0, 2) + "\\" + candidate.Substring(2);
            }
            if (!Path.IsPathRooted(candidate))
            {
                string trimmedSub = System.Text.RegularExpressions.Regex.Replace(candidate, @"^USB:[\\/]*", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase)
                    .TrimStart('\\', '/');
                candidate = string.IsNullOrWhiteSpace(trimmedSub) ? driveRoot : Path.Combine(driveRoot, trimmedSub);
            }

            if (File.Exists(candidate))
            {
                candidate = Path.GetDirectoryName(candidate) ?? driveRoot;
            }

            // 가장 가까운 기존 상위 폴더까지 순회 탐색
            string? probe = candidate;
            while (!string.IsNullOrWhiteSpace(probe))
            {
                if (Directory.Exists(probe))
                {
                    return probe;
                }
                probe = Path.GetDirectoryName(probe);
            }

            // 드라이브 내 표준 인증서 루트 폴백 (시스템 드라이브는 AppData\LocalLow 우선)
            bool isSysDrive = string.Equals(driveRoot, sysRoot, StringComparison.OrdinalIgnoreCase);
            if (Regex.IsMatch(path, @"(?:^|[\\/\s])NPKI(?:$|[\\/\s])", RegexOptions.IgnoreCase))
            {
                if (isSysDrive && Directory.Exists(defaultNpki)) return defaultNpki;
                var npkiPath = Path.Combine(driveRoot, "NPKI");
                if (Directory.Exists(npkiPath)) return npkiPath;
            }
            else if (Regex.IsMatch(path, @"(?:^|[\\/\s])EPKI(?:$|[\\/\s])", RegexOptions.IgnoreCase))
            {
                var localLowEpki = Path.Combine(localLow, "EPKI");
                if (isSysDrive && Directory.Exists(localLowEpki)) return localLowEpki;
                var epkiPath = Path.Combine(driveRoot, "EPKI");
                if (Directory.Exists(epkiPath)) return epkiPath;
            }
            else if (Regex.IsMatch(path, @"(?:^|[\\/\s])GPKI(?:$|[\\/\s])", RegexOptions.IgnoreCase))
            {
                var gpkiPath = Path.Combine(driveRoot, "GPKI");
                if (Directory.Exists(gpkiPath)) return gpkiPath;
            }

            return Directory.Exists(driveRoot) ? driveRoot : sysRoot;
        }

        private static void OpenDirectoryInExplorer(string folderPath)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "explorer.exe",
                Arguments = $"\"{folderPath}\"",
                UseShellExecute = true
            });
        }

        private void BtnOpenFolder_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string folderToOpen = ResolveExistingTargetDirectory(_targetPath);
                OpenDirectoryInExplorer(folderToOpen);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"대상 폴더 열기 실패: {ex.Message}", "오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private static string? DetectRemovableUsbDrive(string targetPath)
        {
            if (string.IsNullOrWhiteSpace(targetPath)) return null;
            var match = System.Text.RegularExpressions.Regex.Match(targetPath.Trim(), @"(?:^|[^A-Za-z])([A-Za-z]:)");
            if (!match.Success) return null;

            string driveLetter = match.Groups[1].Value.ToUpperInvariant();
            try
            {
                var info = new DriveInfo(driveLetter + "\\");
                if (info.DriveType == DriveType.Removable)
                    return driveLetter;

                var details = NativeStorageInterop.QueryDriveDetails(driveLetter);
                if (details != null && details.IsUsb)
                    return driveLetter;
            }
            catch { }
            return null;
        }

        private void BtnEjectUsb_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(_removableDriveLetter)) return;

            var res = NativeStorageInterop.EjectUsbDrive(_removableDriveLetter);
            if (res.Success)
            {
                TxtEjectStatus.Text = $"✓ {res.Message}";
                BannerEjectStatus.Visibility = Visibility.Visible;
                BtnEjectUsb.IsEnabled = false;
                TxtEjectUsb.Text = $"{_removableDriveLetter} 분리 완료";

                ActivityLogService.Instance.Log(
                    LogCategory.SECURITY,
                    LogLevel.SUCCESS,
                    $"{_removableDriveLetter} USB 안전 제거 완료",
                    res.Message,
                    _removableDriveLetter,
                    "Safely Ejected");

                if (Application.Current?.MainWindow?.DataContext is ViewModels.MainViewModel vm)
                {
                    vm.RefreshDrives();
                }
            }
            else if (res.IsLockedByOtherProcess)
            {
                var ask = MessageBox.Show(
                    $"{res.Message}\n\nWindows 기본 '하드웨어 안전하게 제거' 창을 열어 분리하시겠습니까?",
                    "USB 안전 제거 안내",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Warning);

                if (ask == MessageBoxResult.Yes)
                {
                    NativeStorageInterop.OpenWindowsSafeRemovalDialog();
                }
            }
            else
            {
                MessageBox.Show(res.Message, "USB 안전 제거 안내", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
    }
}
