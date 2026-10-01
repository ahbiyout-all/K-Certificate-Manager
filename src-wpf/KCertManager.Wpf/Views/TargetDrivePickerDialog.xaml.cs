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
        private List<DriveItem> _drives = new();
        private Border? _selectedCardBorder = null;

        public DriveItem? SelectedDrive { get; private set; }
        public string ConflictOption { get; private set; } = "overwrite";

        public TargetDrivePickerDialog(IList<CertificateItem> certs, IList<DriveItem>? initialDrives = null)
        {
            InitializeComponent();
            _certsToCopy = certs != null ? certs.ToList() : new List<CertificateItem>();

            if (Owner == null && Application.Current?.MainWindow != null && Application.Current.MainWindow != this)
            {
                Owner = Application.Current.MainWindow;
            }
            if (Owner == null)
            {
                WindowStartupLocation = WindowStartupLocation.CenterScreen;
            }

            TxtSelectedCountBadge.Text = $"인증서 {_certsToCopy.Count}건 선택됨";

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

        private void BtnRefreshDrives_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                UsbStorageGuard.InvalidateUsbCache();
                _drives = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
                RenderDriveCards();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"드라이브 새로고침 중 오류: {ex.Message}", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void RenderDriveCards()
        {
            PanelDriveList.Children.Clear();
            _selectedCardBorder = null;
            SelectedDrive = null;
            BtnConfirm.IsEnabled = false;
            TxtConfirmBtnText.Text = "선택한 드라이브로 복사 시작";
            TxtSelectionStatus.Text = "목적지 드라이브를 선택해 주세요.";

            bool hasRemovable = _drives.Any(d => d.IsRemovable && d.IsReady);
            BorderNoUsbWarning.Visibility = hasRemovable ? Visibility.Collapsed : Visibility.Visible;

            if (_drives.Count == 0)
            {
                var emptyBlock = new TextBlock
                {
                    Text = "사용 가능한 물리 드라이브가 감지되지 않았습니다.",
                    Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
                    FontSize = 12,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    Margin = new Thickness(0, 20, 0, 0)
                };
                PanelDriveList.Children.Add(emptyBlock);
                return;
            }

            // Prefer Removable USB drive by default, otherwise first non-self-copy drive
            DriveItem? defaultPick = null;

            foreach (var drive in _drives)
            {
                string targetRoot = (drive.Name ?? "").TrimEnd('\\').ToUpperInvariant() + "\\";

                // Check self copy: are all selected certs already on this target root?
                bool isSelfCopy = _certsToCopy.Count > 0 && _certsToCopy.All(c =>
                {
                    if (string.IsNullOrWhiteSpace(c?.DirectoryPath)) return false;
                    try
                    {
                        string srcRoot = (Path.GetPathRoot(c.DirectoryPath) ?? "").TrimEnd('\\').ToUpperInvariant() + "\\";
                        return string.Equals(srcRoot, targetRoot, StringComparison.OrdinalIgnoreCase);
                    }
                    catch
                    {
                        return false;
                    }
                });

                var cardBackground = (Brush)Application.Current.FindResource("BgDarkBrush") ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
                var cardBorderBrush = (Brush)Application.Current.FindResource("BorderBrush") ?? new SolidColorBrush(Color.FromRgb(51, 65, 85));
                var textPrimary = (Brush)Application.Current.FindResource("TextPrimaryBrush") ?? Brushes.White;
                var textSecondary = (Brush)Application.Current.FindResource("TextSecondaryBrush") ?? new SolidColorBrush(Color.FromRgb(148, 163, 184));

                var cardBorder = new Border
                {
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(14, 12, 14, 12),
                    Margin = new Thickness(0, 0, 0, 8),
                    Background = cardBackground,
                    BorderBrush = cardBorderBrush,
                    BorderThickness = new Thickness(1.5),
                    Cursor = isSelfCopy ? Cursors.No : Cursors.Hand,
                    Tag = drive
                };

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

                var txtName = new TextBlock
                {
                    Text = string.IsNullOrEmpty(drive.VolumeLabel) ? drive.Name : $"{drive.Name} [{drive.VolumeLabel}]",
                    FontSize = 13.5,
                    FontWeight = FontWeights.Bold,
                    Foreground = isSelfCopy ? textSecondary : textPrimary,
                    Margin = new Thickness(0, 0, 8, 0)
                };
                spNameRow.Children.Add(txtName);

                // Kind Badge
                var borderBadge = new Border
                {
                    CornerRadius = new CornerRadius(4),
                    Padding = new Thickness(6, 1.5, 6, 1.5),
                    Margin = new Thickness(0, 0, 6, 0),
                    Background = drive.IsRemovable 
                        ? new SolidColorBrush(Color.FromArgb(50, 16, 185, 129)) 
                        : new SolidColorBrush(Color.FromArgb(40, 59, 130, 246)),
                    BorderBrush = drive.IsRemovable
                        ? new SolidColorBrush(Color.FromRgb(16, 185, 129))
                        : new SolidColorBrush(Color.FromRgb(59, 130, 246)),
                    BorderThickness = new Thickness(1)
                };
                borderBadge.Child = new TextBlock
                {
                    Text = drive.IsRemovable ? "추천 USB 메모리" : "로컬 디스크",
                    FontSize = 10.5,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = drive.IsRemovable
                        ? new SolidColorBrush(Color.FromRgb(52, 211, 153))
                        : new SolidColorBrush(Color.FromRgb(147, 197, 253))
                };
                spNameRow.Children.Add(borderBadge);

                // Self Copy Badge
                if (isSelfCopy)
                {
                    var selfCopyBadge = new Border
                    {
                        CornerRadius = new CornerRadius(4),
                        Padding = new Thickness(6, 1.5, 6, 1.5),
                        Background = new SolidColorBrush(Color.FromArgb(60, 239, 68, 68)),
                        BorderBrush = new SolidColorBrush(Color.FromRgb(239, 68, 68)),
                        BorderThickness = new Thickness(1)
                    };
                    selfCopyBadge.Child = new TextBlock
                    {
                        Text = "🚫 자가 복사 금지",
                        FontSize = 10.5,
                        FontWeight = FontWeights.Bold,
                        Foreground = new SolidColorBrush(Color.FromRgb(252, 165, 165))
                    };
                    spNameRow.Children.Add(selfCopyBadge);
                }

                spInfo.Children.Add(spNameRow);

                // Space Info
                var txtSpace = new TextBlock
                {
                    Text = isSelfCopy 
                        ? $"선택한 인증서가 이미 본 드라이브에 보관되어 있습니다. ({drive.FormattedFreeSpace})"
                        : $"사용 가능 공간: {drive.FormattedFreeSpace} · {drive.FileSystem} 포맷",
                    FontSize = 11,
                    Foreground = isSelfCopy
                        ? new SolidColorBrush(Color.FromRgb(248, 113, 113))
                        : textSecondary
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
                    Background = (Brush)Application.Current.FindResource("BgDarkBrush") ?? new SolidColorBrush(Color.FromRgb(30, 41, 59)),
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
                            $"선택하신 인증서가 이미 {drive.Name} 드라이브에 저장되어 있습니다.\n\n" +
                            "동일한 드라이브로의 자가 복사(Self-Copy)는 원본 손상 방지를 위해 제한됩니다.\n" +
                            "다른 USB 메모리나 다른 로컬 디스크를 목적지로 선택해 주세요.",
                            "자가 복사(Self-Copy) 제한",
                            MessageBoxButton.OK,
                            MessageBoxImage.Warning);
                        return;
                    }

                    SelectCard(cardBorder, drive);
                };

                PanelDriveList.Children.Add(cardBorder);

                // Select preferred default
                if (!isSelfCopy && defaultPick == null)
                {
                    if (drive.IsRemovable && drive.IsReady)
                    {
                        defaultPick = drive;
                        SelectCard(cardBorder, drive);
                    }
                }
            }

            // If no removable was auto-picked, pick the first valid drive
            if (SelectedDrive == null)
            {
                foreach (Border border in PanelDriveList.Children.OfType<Border>())
                {
                    if (border.Tag is DriveItem d)
                    {
                        string targetRoot = (d.Name ?? "").TrimEnd('\\').ToUpperInvariant() + "\\";
                        bool isSelfCopy = _certsToCopy.Count > 0 && _certsToCopy.All(c =>
                        {
                            if (string.IsNullOrWhiteSpace(c?.DirectoryPath)) return false;
                            try
                            {
                                string srcRoot = (Path.GetPathRoot(c.DirectoryPath) ?? "").TrimEnd('\\').ToUpperInvariant() + "\\";
                                return string.Equals(srcRoot, targetRoot, StringComparison.OrdinalIgnoreCase);
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
        }

        private void SelectCard(Border cardBorder, DriveItem drive)
        {
            var cardBackground = (Brush)Application.Current.FindResource("BgDarkBrush") ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
            var cardBorderBrush = (Brush)Application.Current.FindResource("BorderBrush") ?? new SolidColorBrush(Color.FromRgb(51, 65, 85));

            // Reset previous
            if (_selectedCardBorder != null)
            {
                _selectedCardBorder.BorderBrush = cardBorderBrush;
                _selectedCardBorder.Background = cardBackground;

                if (_selectedCardBorder.Child is Grid oldGrid && oldGrid.Children.Count >= 3 && oldGrid.Children[2] is Border oldIndicator)
                {
                    oldIndicator.Background = cardBackground;
                    oldIndicator.BorderBrush = cardBorderBrush;
                    if (oldIndicator.Child is TextBlock oldChk) oldChk.Foreground = Brushes.Transparent;
                }
            }

            _selectedCardBorder = cardBorder;
            SelectedDrive = drive;

            // Apply selected style
            cardBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(59, 130, 246));
            cardBorder.Background = new SolidColorBrush(Color.FromRgb(30, 58, 138));

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
                MessageBox.Show("복사 대상 드라이브를 선택해 주세요.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
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
