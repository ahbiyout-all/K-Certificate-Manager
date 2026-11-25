using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using KCert.Core.HardwareGuard;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public partial class TargetDrivePickerDialog : Window
    {
        private readonly List<CertificateItem> _certsToCopy;
        private readonly string? _preferredDriveName;
        private List<DriveItem> _drives = new();
        private Border? _selectedCardBorder = null;

        public DriveItem? SelectedDrive { get; private set; }
        public string ConflictOption { get; private set; } = "overwrite";

        public TargetDrivePickerDialog(IList<CertificateItem> certs, IList<DriveItem>? initialDrives = null, string? preferredDriveName = null)
        {
            InitializeComponent();
            _certsToCopy = certs != null ? certs.ToList() : new List<CertificateItem>();
            _preferredDriveName = preferredDriveName;

            if (Owner == null && Application.Current?.MainWindow != null && Application.Current.MainWindow != this)
            {
                Owner = Application.Current.MainWindow;
            }
            if (Owner == null)
            {
                WindowStartupLocation = WindowStartupLocation.CenterScreen;
            }

            TxtSelectedCountBadge.Text = $"인증서 {_certsToCopy.Count}건 선택됨";
            RenderCertPreviewList();

            try
            {
                if (initialDrives != null && initialDrives.Any())
                {
                    _drives = initialDrives.Where(d => !d.IsCdRom).ToList();
                }
                else
                {
                    _drives = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
                }
            }
            catch
            {
                _drives = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
            }

            RenderDriveCards();
        }

        private void RenderCertPreviewList()
        {
            PanelCertPreviewList.Children.Clear();
            TxtPreviewHeader.Text = $"📋 복사 대상 인증서 미리보기 (총 {_certsToCopy.Count}건)";

            var rowBg = (Application.Current?.TryFindResource("BgDarkBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
            var borderBr = (Application.Current?.TryFindResource("BorderBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(51, 65, 85));
            var textPrimary = (Application.Current?.TryFindResource("TextPrimaryBrush") as Brush) ?? Brushes.White;
            var textSecondary = (Application.Current?.TryFindResource("TextSecondaryBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(148, 163, 184));
            var accentBr = (Application.Current?.TryFindResource("AccentTextBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(147, 197, 253));

            if (_certsToCopy.Count == 0)
            {
                PanelCertPreviewList.Children.Add(new TextBlock
                {
                    Text = "선택된 인증서가 없습니다.",
                    FontSize = 11.5,
                    Foreground = textSecondary,
                    Margin = new Thickness(4, 2, 0, 2)
                });
                return;
            }

            for (int i = 0; i < _certsToCopy.Count; i++)
            {
                var cert = _certsToCopy[i];
                var rowBorder = new Border
                {
                    Background = rowBg,
                    BorderBrush = borderBr,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(5),
                    Padding = new Thickness(8, 5, 8, 5),
                    Margin = new Thickness(0, 0, 0, 4)
                };

                var rowGrid = new Grid();
                rowGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                rowGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                rowGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                rowGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                var idxText = new TextBlock
                {
                    Text = $"{i + 1}.",
                    FontSize = 11,
                    FontWeight = FontWeights.Bold,
                    Foreground = textSecondary,
                    VerticalAlignment = VerticalAlignment.Center,
                    Margin = new Thickness(0, 0, 6, 0)
                };
                Grid.SetColumn(idxText, 0);
                rowGrid.Children.Add(idxText);

                var catBadge = new Border
                {
                    Background = new SolidColorBrush(Color.FromRgb(30, 58, 138)),
                    BorderBrush = new SolidColorBrush(Color.FromRgb(59, 130, 246)),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(3),
                    Padding = new Thickness(5, 1, 5, 1),
                    Margin = new Thickness(0, 0, 8, 0),
                    VerticalAlignment = VerticalAlignment.Center
                };
                catBadge.Child = new TextBlock
                {
                    Text = cert.Category.ToString(),
                    FontSize = 10,
                    FontWeight = FontWeights.Bold,
                    Foreground = accentBr
                };
                Grid.SetColumn(catBadge, 1);
                rowGrid.Children.Add(catBadge);

                string cn = string.IsNullOrWhiteSpace(cert.CommonName) ? "공동인증서" : cert.CommonName;
                string driveHint = string.IsNullOrWhiteSpace(cert.DriveLetter) ? "" : $" [{cert.DriveLetter}]";
                var nameText = new TextBlock
                {
                    Text = $"{cn}{driveHint}",
                    FontSize = 11.5,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = textPrimary,
                    TextTrimming = TextTrimming.CharacterEllipsis,
                    VerticalAlignment = VerticalAlignment.Center,
                    Margin = new Thickness(0, 0, 10, 0),
                    ToolTip = cert.DirectoryPath
                };
                Grid.SetColumn(nameText, 2);
                rowGrid.Children.Add(nameText);

                var expiryText = new TextBlock
                {
                    Text = $"만료 {cert.NotAfter:yyyy-MM-dd}",
                    FontSize = 10.5,
                    Foreground = textSecondary,
                    VerticalAlignment = VerticalAlignment.Center
                };
                Grid.SetColumn(expiryText, 3);
                rowGrid.Children.Add(expiryText);

                rowBorder.Child = rowGrid;
                PanelCertPreviewList.Children.Add(rowBorder);
            }
        }

        private void BtnRefreshDrives_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var prevCounts = _drives
                    .Where(d => d != null && !string.IsNullOrWhiteSpace(d.Name))
                    .GroupBy(d => d.Name.Trim().TrimEnd('\\', '/'), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Max(x => x.CertificateCount), StringComparer.OrdinalIgnoreCase);

                UsbStorageGuard.InvalidateUsbCache();
                var refreshed = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
                foreach (var d in refreshed)
                {
                    var key = (d.Name ?? string.Empty).Trim().TrimEnd('\\', '/');
                    if (d.CertificateCount == 0 && prevCounts.TryGetValue(key, out int prevCount))
                    {
                        d.CertificateCount = prevCount;
                    }
                }

                _drives = refreshed;
                RenderDriveCards();
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, $"드라이브 새로고침 중 오류: {ex.Message}", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void RenderDriveCards()
        {
            PanelDriveList.Children.Clear();
            _selectedCardBorder = null;
            SelectedDrive = null;
            BtnConfirm.IsEnabled = false;
            TxtConfirmBtnText.Text = "선택한 드라이브로 복사 시작";
            TxtSelectionStatus.Text = "저장할 드라이브를 선택해 주세요.";

            bool hasRemovable = _drives.Any(d => d.IsRemovable && d.IsReady);
            BorderNoUsbWarning.Visibility = hasRemovable ? Visibility.Collapsed : Visibility.Visible;

            if (_drives.Count == 0)
            {
                var mutedBr = (Application.Current?.TryFindResource("MutedTextBrush") as Brush)
                    ?? new SolidColorBrush(Color.FromRgb(148, 163, 184));
                var emptyBlock = new TextBlock
                {
                    Text = "사용 가능한 물리 드라이브가 감지되지 않았습니다.",
                    Foreground = mutedBr,
                    FontSize = 12,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    Margin = new Thickness(0, 20, 0, 0)
                };
                PanelDriveList.Children.Add(emptyBlock);
                return;
            }

            // Prefer caller-specified drive if valid (non-self-copy), otherwise Removable USB drive, otherwise first valid drive
            DriveItem? defaultPick = null;
            Border? defaultPickBorder = null;
            string? cleanPreferred = string.IsNullOrWhiteSpace(_preferredDriveName)
                ? null
                : _preferredDriveName.Trim().TrimEnd('\\', '/');

            foreach (var drive in _drives)
            {
                // Check self copy: are all selected certs already in the EXACT target destination directory?
                bool isSelfCopy = _certsToCopy.Count > 0 && _certsToCopy.All(c =>
                {
                    if (string.IsNullOrWhiteSpace(c?.DirectoryPath)) return false;
                    try
                    {
                        string targetRoot = ResolveEffectiveDestinationRoot(drive, c);
                        string safeRel = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(c.DirectoryPath);
                        string expectedDstDir = Path.GetFullPath(Path.Combine(targetRoot, safeRel)).TrimEnd('\\');
                        string currentSrcDir = Path.GetFullPath(c.DirectoryPath).TrimEnd('\\');
                        return string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase);
                    }
                    catch
                    {
                        return false;
                    }
                });

                var cardBackground = (Application.Current?.TryFindResource("BgDarkBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
                var cardBorderBrush = (Application.Current?.TryFindResource("BorderBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(51, 65, 85));
                var textPrimary = (Application.Current?.TryFindResource("TextPrimaryBrush") as Brush) ?? Brushes.White;
                var textSecondary = (Application.Current?.TryFindResource("TextSecondaryBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(148, 163, 184));

                var cardBorder = new Border
                {
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(14, 12, 14, 12),
                    Margin = new Thickness(0, 0, 0, 8),
                    Cursor = isSelfCopy ? Cursors.No : Cursors.Hand,
                    Tag = drive
                };

                // 모든 미선택 드라이브 카드에 은은한 동적 무한 유동 테두리 애니메이션 기본 적용
                WpfAnimatedBorderHelper.ApplyAnimatedGradientBorder(cardBorder, isSelected: false, isRemovableUsb: drive.IsRemovable);

                var grid = new Grid();
                grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                // Icon
                var iconText = new TextBlock
                {
                    Text = drive.IsRemovable ? "⚡" : "💻",
                    FontSize = 20,
                    VerticalAlignment = VerticalAlignment.Center,
                    Margin = new Thickness(0, 0, 12, 0),
                    Foreground = textPrimary
                };
                Grid.SetColumn(iconText, 0);
                grid.Children.Add(iconText);

                // Drive Info
                var spInfo = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
                var spNameRow = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 2) };

                // Bold Drive Letter Badge
                try
                {
                    string driveBgHex = drive.DriveBgColorHex;
                    string driveBorderHex = drive.DriveBorderColorHex;
                    var bgColor = ColorConverter.ConvertFromString(driveBgHex) is Color parsedBg ? parsedBg : Color.FromRgb(30, 58, 138);
                    var borderColor = ColorConverter.ConvertFromString(driveBorderHex) is Color parsedBorder ? parsedBorder : Color.FromRgb(59, 130, 246);
                    var letterBadge = new Border
                    {
                        CornerRadius = new CornerRadius(4),
                        Padding = new Thickness(6, 1.5, 6, 1.5),
                        Margin = new Thickness(0, 0, 6, 0),
                        Background = new SolidColorBrush(bgColor),
                        BorderBrush = new SolidColorBrush(borderColor),
                        BorderThickness = new Thickness(1)
                    };
                    letterBadge.Child = new TextBlock
                    {
                        Text = $"{drive.DriveLetterChar}:",
                        FontSize = 11,
                        FontWeight = FontWeights.ExtraBold,
                        FontFamily = new FontFamily("Consolas, Segoe UI, sans-serif"),
                        Foreground = Brushes.White
                    };
                    spNameRow.Children.Add(letterBadge);
                }
                catch { }

                var txtName = new TextBlock
                {
                    Text = string.IsNullOrEmpty(drive.VolumeLabel) ? drive.Name : $"{drive.Name} [{drive.VolumeLabel}]",
                    FontSize = 13.5,
                    FontWeight = FontWeights.ExtraBold,
                    Foreground = isSelfCopy ? textSecondary : textPrimary,
                    Margin = new Thickness(0, 0, 8, 0)
                };
                spNameRow.Children.Add(txtName);

                var cardSurface = (Application.Current?.TryFindResource("BgCardBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(30, 41, 59));
                var accentGreenBr = (Application.Current?.TryFindResource("AccentGreenBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(52, 211, 153));
                var accentTextBr = (Application.Current?.TryFindResource("AccentTextBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(147, 197, 253));
                var accentRoseBr = (Application.Current?.TryFindResource("AccentRoseBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(248, 113, 113));

                // Kind Badge
                var borderBadge = new Border
                {
                    CornerRadius = new CornerRadius(4),
                    Padding = new Thickness(6, 1.5, 6, 1.5),
                    Margin = new Thickness(0, 0, 6, 0),
                    Background = cardSurface,
                    BorderBrush = drive.IsRemovable ? accentGreenBr : accentTextBr,
                    BorderThickness = new Thickness(1)
                };
                borderBadge.Child = new TextBlock
                {
                    Text = drive.IsRemovable ? "추천 USB 메모리" : "로컬 디스크",
                    FontSize = 10.5,
                    FontWeight = FontWeights.ExtraBold,
                    Foreground = drive.IsRemovable ? accentGreenBr : accentTextBr
                };
                spNameRow.Children.Add(borderBadge);

                // Self Copy Badge
                if (isSelfCopy)
                {
                    var selfCopyBadge = new Border
                    {
                        CornerRadius = new CornerRadius(4),
                        Padding = new Thickness(6, 1.5, 6, 1.5),
                        Background = new SolidColorBrush(Color.FromRgb(136, 19, 55)),
                        BorderBrush = new SolidColorBrush(Color.FromRgb(225, 29, 72)),
                        BorderThickness = new Thickness(1)
                    };
                    selfCopyBadge.Child = new TextBlock
                    {
                        Text = "🚫 자가 복사 금지",
                        FontSize = 10.5,
                        FontWeight = FontWeights.Bold,
                        Foreground = Brushes.White
                    };
                    spNameRow.Children.Add(selfCopyBadge);
                }

                spInfo.Children.Add(spNameRow);

                // Space Info & Stored Cert Count
                string certCountLabel = drive.CertificateCount > 0 ? $" · 보관 {drive.CertificateCount}건" : " · 빈 저장소";
                var txtSpace = new TextBlock
                {
                    Text = isSelfCopy
                        ? $"선택한 인증서가 이미 본 드라이브에 보관되어 있습니다. ({drive.FormattedFreeSpace}{certCountLabel})"
                        : $"사용 가능 공간: {drive.FormattedFreeSpace} · {drive.FileSystem} 포맷{certCountLabel}",
                    FontSize = 11,
                    Foreground = isSelfCopy ? accentRoseBr : textSecondary
                };
                spInfo.Children.Add(txtSpace);

                Grid.SetColumn(spInfo, 1);
                grid.Children.Add(spInfo);

                // Right checkmark or select button
                var selectIndicator = new Border
                {
                    CornerRadius = new CornerRadius(12),
                    Width = 24,
                    Height = 24,
                    Background = (Application.Current?.TryFindResource("BgDarkBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(30, 41, 59)),
                    BorderBrush = cardBorderBrush,
                    BorderThickness = new Thickness(1.5),
                    VerticalAlignment = VerticalAlignment.Center
                };
                var checkText = new TextBlock
                {
                    Text = "✓",
                    FontSize = 12,
                    FontWeight = FontWeights.Bold,
                    Foreground = Brushes.Transparent,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center
                };
                selectIndicator.Child = checkText;
                Grid.SetColumn(selectIndicator, 2);
                grid.Children.Add(selectIndicator);

                cardBorder.Child = grid;

                // Mouse click handler
                cardBorder.MouseDown += (s, e) =>
                {
                    if (isSelfCopy)
                    {
                        MessageBox.Show(
                            this,
                            $"선택한 인증서가 이미 {drive.Name}에 저장되어 있습니다.\n\n" +
                            "같은 드라이브로의 복사는 원본 보호를 위해 제한됩니다.\n" +
                            "다른 USB 메모리나 다른 드라이브를 선택해 주세요.",
                            "같은 위치 복사 제한",
                            MessageBoxButton.OK,
                            MessageBoxImage.Warning);
                        return;
                    }

                    SelectCard(cardBorder, drive);
                };

                PanelDriveList.Children.Add(cardBorder);

                // Track preferred or default pick
                if (!isSelfCopy)
                {
                    string cleanDriveName = (drive.Name ?? string.Empty).Trim().TrimEnd('\\', '/');
                    bool matchesPreferred = !string.IsNullOrEmpty(cleanPreferred) &&
                                            string.Equals(cleanDriveName, cleanPreferred, StringComparison.OrdinalIgnoreCase);

                    if (matchesPreferred)
                    {
                        defaultPick = drive;
                        defaultPickBorder = cardBorder;
                    }
                    else if (defaultPick == null && drive.IsRemovable && drive.IsReady)
                    {
                        defaultPick = drive;
                        defaultPickBorder = cardBorder;
                    }
                }
            }

            if (defaultPick != null && defaultPickBorder != null)
            {
                SelectCard(defaultPickBorder, defaultPick);
            }

            // If no removable or preferred drive was auto-picked, pick the first valid drive
            if (SelectedDrive == null)
            {
                foreach (Border border in PanelDriveList.Children.OfType<Border>())
                {
                    if (border.Tag is DriveItem d)
                    {
                        bool isSelfCopy = _certsToCopy.Count > 0 && _certsToCopy.All(c =>
                        {
                            if (string.IsNullOrWhiteSpace(c?.DirectoryPath)) return false;
                            try
                            {
                                string targetRoot = ResolveEffectiveDestinationRoot(d, c);
                                string safeRel = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(c.DirectoryPath);
                                string expectedDstDir = Path.GetFullPath(Path.Combine(targetRoot, safeRel)).TrimEnd('\\');
                                string currentSrcDir = Path.GetFullPath(c.DirectoryPath).TrimEnd('\\');
                                return string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase);
                            }
                            catch
                            {
                                return false;
                            }
                        });

                        if (!isSelfCopy)
                        {
                            SelectCard(border, d);
                            break;
                        }
                    }
                }
            }

            if (SelectedDrive == null)
            {
                TxtSelectionStatus.Text = "복사 가능한 다른 드라이브가 없습니다. USB 메모리를 연결해 주세요.";
                TxtConfirmBtnText.Text = "USB 메모리를 연결해 주세요";
            }
        }

        private static string ResolveEffectiveDestinationRoot(DriveItem drive, CertificateItem cert)
        {
            string cleanTarget = (drive.Name ?? "").TrimEnd('\\').ToUpperInvariant();
            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\').ToUpperInvariant();

            if (string.Equals(cleanTarget, sysRoot, StringComparison.OrdinalIgnoreCase))
            {
                if (cert.Category == CertCategory.GPKI)
                {
                    return sysRoot + "\\";
                }

                var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                return Path.Combine(userProfile, "AppData", "LocalLow");
            }

            return cleanTarget + "\\";
        }

        private void SelectCard(Border cardBorder, DriveItem drive)
        {
            var cardBackground = (Application.Current?.TryFindResource("BgDarkBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
            var cardBorderBrush = (Application.Current?.TryFindResource("BorderBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(51, 65, 85));

            // Reset previous selected card to unselected animated gradient state
            if (_selectedCardBorder != null)
            {
                bool prevIsUsb = (_selectedCardBorder.Tag is DriveItem prevDrive) && prevDrive.IsRemovable;
                WpfAnimatedBorderHelper.ApplyAnimatedGradientBorder(_selectedCardBorder, isSelected: false, isRemovableUsb: prevIsUsb);

                if (_selectedCardBorder.Child is Grid oldGrid && oldGrid.Children.Count >= 3 && oldGrid.Children[2] is Border oldIndicator)
                {
                    oldIndicator.Background = cardBackground;
                    oldIndicator.BorderBrush = cardBorderBrush;
                    if (oldIndicator.Child is TextBlock oldChk) oldChk.Foreground = Brushes.Transparent;
                }
            }

            _selectedCardBorder = cardBorder;
            SelectedDrive = drive;

            // Apply vibrant high-contrast animated moving gradient border & neon glow
            WpfAnimatedBorderHelper.ApplyAnimatedGradientBorder(cardBorder, isSelected: true, isRemovableUsb: drive.IsRemovable);

            if (cardBorder.Child is Grid newGrid && newGrid.Children.Count >= 3 && newGrid.Children[2] is Border newIndicator)
            {
                newIndicator.Background = new SolidColorBrush(Color.FromRgb(37, 99, 235));
                newIndicator.BorderBrush = new SolidColorBrush(Color.FromRgb(96, 165, 250));
                if (newIndicator.Child is TextBlock newChk) newChk.Foreground = Brushes.White;
            }

            BtnConfirm.IsEnabled = true;
            TxtConfirmBtnText.Text = $"[{drive.Name.TrimEnd('\\')}]로 복사 시작";
            TxtSelectionStatus.Text = $"선택된 목적지: {drive.DisplayName}";
        }

        private void BtnCancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void BtnConfirm_Click(object sender, RoutedEventArgs e)
        {
            if (SelectedDrive == null)
            {
                MessageBox.Show(this, "복사 대상 드라이브를 선택해 주세요.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            ConflictOption = RbOverwrite.IsChecked == true 
                ? "overwrite" 
                : RbRename.IsChecked == true 
                    ? "rename" 
                    : "skip";

            DialogResult = true;
            Close();
        }
    }
}
