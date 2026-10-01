using System;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media.Imaging;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class MainWindow : Window
    {
        private const int WM_DEVICECHANGE = 0x0219;
        private const int DBT_DEVICEARRIVAL = 0x8000;
        private const int DBT_DEVICEREMOVECOMPLETE = 0x8004;
        private const int DBT_DEVNODES_CHANGED = 0x0007;
        private const int DBT_DEVTYP_VOLUME = 0x00000002;

        [StructLayout(LayoutKind.Sequential)]
        private struct DEV_BROADCAST_HDR
        {
            public int dbch_size;
            public int dbch_devicetype;
            public int dbch_reserved;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct DEV_BROADCAST_VOLUME
        {
            public int dbcv_size;
            public int dbcv_devicetype;
            public int dbcv_reserved;
            public int dbcv_unitmask;
            public short dbcv_flags;
        }

        public MainWindow()
        {
            InitializeComponent();
            SafeLoadAssets();
            Loaded += MainWindow_Loaded;
        }

        private void SafeLoadAssets()
        {
            // 1. Load brand logo image for the top-left title bar
            string[] logoResourceNames = {
                "Assets/app-logo.png",
                "Assets/app-logo.jpg",
                "Assets/app-icon.png",
                "Assets/app-icon.jpg",
                "Assets/favicon.jpg"
            };

            foreach (var relPath in logoResourceNames)
            {
                try
                {
                    var uri = new Uri($"pack://application:,,,/{relPath}", UriKind.Absolute);
                    var streamInfo = Application.GetResourceStream(uri);
                    if (streamInfo == null || streamInfo.Stream == null)
                    {
                        uri = new Uri($"pack://application:,,,/KCertManager.Wpf;component/{relPath}", UriKind.Absolute);
                        streamInfo = Application.GetResourceStream(uri);
                    }
                    if (streamInfo != null && streamInfo.Stream != null)
                    {
                        var bmp = new BitmapImage();
                        bmp.BeginInit();
                        bmp.StreamSource = streamInfo.Stream;
                        bmp.CacheOption = BitmapCacheOption.OnLoad;
                        bmp.EndInit();
                        bmp.Freeze();
                        if (AppLogoImage != null)
                        {
                            AppLogoImage.Source = bmp;
                        }
                        break;
                    }
                }
                catch { }

                try
                {
                    var baseDir = AppDomain.CurrentDomain.BaseDirectory;
                    var localPath = Path.Combine(baseDir, relPath.Replace('/', Path.DirectorySeparatorChar));
                    if (File.Exists(localPath))
                    {
                        var bmp = new BitmapImage();
                        bmp.BeginInit();
                        bmp.UriSource = new Uri(localPath, UriKind.Absolute);
                        bmp.CacheOption = BitmapCacheOption.OnLoad;
                        bmp.EndInit();
                        bmp.Freeze();
                        if (AppLogoImage != null)
                        {
                            AppLogoImage.Source = bmp;
                        }
                        break;
                    }
                }
                catch { }
            }

            // 2. Load window application icon (.ico)
            try
            {
                var iconUri = new Uri("pack://application:,,,/Assets/app.ico", UriKind.Absolute);
                var iconStream = Application.GetResourceStream(iconUri);
                if (iconStream == null || iconStream.Stream == null)
                {
                    iconUri = new Uri("pack://application:,,,/KCertManager.Wpf;component/Assets/app.ico", UriKind.Absolute);
                    iconStream = Application.GetResourceStream(iconUri);
                }
                if (iconStream != null && iconStream.Stream != null)
                {
                    Icon = BitmapFrame.Create(iconStream.Stream);
                }
            }
            catch { }
        }

        protected override void OnClosed(EventArgs e)
        {
            base.OnClosed(e);

            try
            {
                (DataContext as IDisposable)?.Dispose();
            }
            catch { }

            try
            {
                Application.Current?.Shutdown(0);
            }
            catch { }
        }

        private MainViewModel? ViewModel => DataContext as MainViewModel;

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                var helper = new WindowInteropHelper(this);
                var source = HwndSource.FromHwnd(helper.Handle);
                source?.AddHook(HwndMessageHook);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[HwndSource Hook Error] {ex.Message}");
            }
        }

        private IntPtr HwndMessageHook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WM_DEVICECHANGE)
            {
                int wp = wParam.ToInt32();
                if (wp == DBT_DEVICEARRIVAL || wp == DBT_DEVICEREMOVECOMPLETE || wp == DBT_DEVNODES_CHANGED)
                {
                    string hintDrive = string.Empty;
                    if (lParam != IntPtr.Zero)
                    {
                        try
                        {
                            var hdr = (DEV_BROADCAST_HDR)Marshal.PtrToStructure(lParam, typeof(DEV_BROADCAST_HDR))!;
                            if (hdr.dbch_devicetype == DBT_DEVTYP_VOLUME)
                            {
                                var vol = (DEV_BROADCAST_VOLUME)Marshal.PtrToStructure(lParam, typeof(DEV_BROADCAST_VOLUME))!;
                                for (int i = 0; i < 26; i++)
                                {
                                    if ((vol.dbcv_unitmask & (1 << i)) != 0)
                                    {
                                        hintDrive = $"{(char)('A' + i)}:\\";
                                        break;
                                    }
                                }
                            }
                        }
                        catch { }
                    }

                    ViewModel?.HandleDeviceChanged(hintDrive);
                }
            }
            return IntPtr.Zero;
        }

        private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            // Ignore clicks originating from interactive controls (Buttons, RadioButtons) inside the header
            if (e.OriginalSource is DependencyObject sourceObj)
            {
                var current = sourceObj;
                while (current != null && current != this)
                {
                    if (current is System.Windows.Controls.Primitives.ButtonBase)
                    {
                        return;
                    }
                    current = System.Windows.Media.VisualTreeHelper.GetParent(current);
                }
            }

            if (e.ClickCount == 2)
            {
                MaximizeRestoreWindow_Click(sender, e);
                return;
            }

            if (e.LeftButton == MouseButtonState.Pressed)
            {
                try
                {
                    DragMove();
                }
                catch { }
            }
        }

        private void MinimizeWindow_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        private void MaximizeRestoreWindow_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
        }

        private void CloseWindow_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void Window_StateChanged(object sender, EventArgs e)
        {
            if (RootWindowBorder != null)
            {
                RootWindowBorder.Padding = WindowState == WindowState.Maximized
                    ? new Thickness(7)
                    : new Thickness(0);
            }

            if (TxtMaxRestoreIcon != null)
            {
                TxtMaxRestoreIcon.Text = WindowState == WindowState.Maximized ? "❐" : "□";
            }
        }

        private void ThemeDark_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel != null) ViewModel.CurrentTheme = "dark";
        }

        private void ThemeGray_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel != null) ViewModel.CurrentTheme = "gray";
        }

        private void ThemeWhite_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel != null) ViewModel.CurrentTheme = "white";
        }

        private void ThemeBeige_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel != null) ViewModel.CurrentTheme = "beige";
        }

        private void ThemeBlack_Click(object sender, RoutedEventArgs e)
        {
            ThemeDark_Click(sender, e);
        }

        private void Filter_Click(object sender, RoutedEventArgs e)
        {
            if (sender is RadioButton rb && rb.Tag is string tag && ViewModel != null)
            {
                ViewModel.SelectedFilter = tag;
            }
        }

        private void SelectAll_Click(object sender, RoutedEventArgs e)
        {
            ViewModel?.SelectAllCommand.Execute(true);
        }

        private void DeselectAll_Click(object sender, RoutedEventArgs e)
        {
            ViewModel?.SelectAllCommand.Execute(false);
        }

        private void OpenUsbTransfer_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var usbDrives = ViewModel?.RemovableDrives != null && ViewModel.RemovableDrives.Count > 0
                    ? ViewModel.RemovableDrives.ToList()
                    : KCertManager.Wpf.Services.UsbDriveWatcher.GetAvailableDrives().Where(d => d.IsRemovable).ToList();
                if (usbDrives.Count == 0)
                {
                    var result = MessageBox.Show(
                        "현재 컴퓨터에 연결된 USB 이동식 드라이브가 없습니다.\n\n" +
                        "• 인증서가 저장된 USB 메모리를 PC에 꽂은 후 다시 'USB ➔ PC 넣기'를 눌러주세요.\n" +
                        "• 방금 USB를 꽂으셨다면 Windows 인식(2~3초) 후 다시 시도해주세요.\n\n" +
                        "USB 가져오기 창을 먼저 열어두시겠습니까?",
                        "USB 드라이브 미감지 안내",
                        MessageBoxButton.YesNo,
                        MessageBoxImage.Information);

                    if (result == MessageBoxResult.No)
                    {
                        return;
                    }
                }

                var dialog = new UsbTransferDialog
                {
                    Owner = this
                };
                if (dialog.DataContext is UsbTransferViewModel vm)
                {
                    vm.TransferCompleted += () =>
                    {
                        _ = Dispatcher.InvokeAsync(async () =>
                        {
                            if (ViewModel != null)
                            {
                                await ViewModel.RefreshCertificatesAsync();
                            }
                        });
                    };
                }
                dialog.ShowDialog();
                _ = ViewModel?.RefreshCertificatesAsync();
            }
            catch (System.Exception ex)
            {
                MessageBox.Show(
                    $"USB 가져오기 창을 실행하는 중 안내:\n\n{ex.Message}\n\nUSB 연결 상태를 확인 후 다시 시도해 주세요.",
                    "안내",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            }
        }

        private void OpenRenewalGuidance_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new RenewalGuidanceDialog(ViewModel?.FilteredCertificates)
            {
                Owner = this
            };
            dialog.ShowDialog();
        }

        private void OpenSearchLocations_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new SearchLocationsDialog(ViewModel?.CustomSearchPaths)
            {
                Owner = this
            };
            if (dialog.ShowDialog() == true)
            {
                var paths = dialog.ActivePaths;
                _ = ViewModel?.RefreshCertificatesAsync(paths);
            }
        }

        private void OpenBackupHistory_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;
            var dialog = new BackupHistoryDialog(ViewModel.BackupHistory)
            {
                Owner = this
            };
            dialog.ShowDialog();
        }

        private void OpenTrash_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new TrashDialog
            {
                Owner = this
            };
            if (dialog.ShowDialog() == true)
            {
                _ = ViewModel?.RefreshCertificatesAsync();
                ViewModel?.RefreshTrash();
            }
        }

        private void OpenActivityLog_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new ActivityLogDialog
            {
                Owner = this
            };
            dialog.ShowDialog();
        }

        private void OpenSecurityGuide_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new SecurityGuideDialog
            {
                Owner = this
            };
            dialog.ShowDialog();
        }

        private void OpenAbout_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new AboutDialog
            {
                Owner = this
            };
            dialog.ShowDialog();
        }

        private void CertDataGrid_Sorting(object sender, DataGridSortingEventArgs e)
        {
            var column = e.Column;
            var sortMemberPath = column.SortMemberPath;
            if (string.IsNullOrEmpty(sortMemberPath)) return;

            e.Handled = true; // Prevent default sorting as we handle it ourselves

            var direction = (column.SortDirection != System.ComponentModel.ListSortDirection.Ascending)
                ? System.ComponentModel.ListSortDirection.Ascending
                : System.ComponentModel.ListSortDirection.Descending;
            column.SortDirection = direction;

            if (ViewModel != null)
            {
                ViewModel.SortFilteredCertificates(sortMemberPath, direction == System.ComponentModel.ListSortDirection.Ascending);
            }
        }

        private void CertDataGrid_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (ViewModel?.SelectedCertificate != null)
            {
                ShowDetailDialog(ViewModel.SelectedCertificate);
            }
        }

        private void CertDataGrid_PreviewMouseRightButtonDown(object sender, MouseButtonEventArgs e)
        {
            try
            {
                if (e.OriginalSource is DependencyObject dep)
                {
                    while (dep != null && !(dep is DataGridRow))
                    {
                        dep = System.Windows.Media.VisualTreeHelper.GetParent(dep);
                    }
                    if (dep is DataGridRow row && row.Item is CertificateItem item)
                    {
                        CertDataGrid.SelectedItem = item;
                    }
                }
            }
            catch { }
        }

        private void BtnRowDetail_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is CertificateItem item)
            {
                ShowDetailDialog(item);
            }
        }

        private void ShowDetailDialog(CertificateItem item)
        {
            var dialog = new CertificateDetailDialog(item)
            {
                Owner = this
            };
            dialog.ShowDialog();
        }

        public void OpenTargetDrivePickerForCertificates(System.Collections.Generic.IList<CertificateItem> targets)
        {
            if (ViewModel == null || targets == null || !targets.Any()) return;

            try
            {
                ViewModel.RefreshDrives();
                var dialog = new TargetDrivePickerDialog(targets, ViewModel.AvailableTargetDrives)
                {
                    Owner = this
                };

                if (dialog.ShowDialog() == true && dialog.SelectedDrive != null)
                {
                    ViewModel.SelectedTargetDrive = dialog.SelectedDrive;
                    _ = ViewModel.ExecuteBackupWithConflictOptionAsync(targets.ToList(), dialog.SelectedDrive, dialog.ConflictOption);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"복사 대상 디스크 선택 창을 여는 중 문제가 발생했습니다.\n\n{ex.Message}",
                    "오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
        }

        private void BtnRowCopy_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is CertificateItem item)
            {
                OpenTargetDrivePickerForCertificates(new System.Collections.Generic.List<CertificateItem> { item });
            }
        }

        private void ContextMenuCopy_Click(object sender, RoutedEventArgs e)
        {
            if (CertDataGrid.SelectedItem is CertificateItem item)
            {
                OpenTargetDrivePickerForCertificates(new System.Collections.Generic.List<CertificateItem> { item });
            }
            else
            {
                BackupSelected_Click(sender, e);
            }
        }

        private void ContextMenuCopyPath_Click(object sender, RoutedEventArgs e)
        {
            if (CertDataGrid.SelectedItem is CertificateItem item && !string.IsNullOrEmpty(item.DirectoryPath))
            {
                try
                {
                    Clipboard.SetText(item.DirectoryPath);
                    MessageBox.Show(
                        $"인증서 경로가 클립보드에 복사되었습니다:\n\n{item.DirectoryPath}",
                        "경로 복사 완료",
                        MessageBoxButton.OK,
                        MessageBoxImage.Information);
                }
                catch { }
            }
        }

        private void ContextMenuDetail_Click(object sender, RoutedEventArgs e)
        {
            if (CertDataGrid.SelectedItem is CertificateItem item)
            {
                ShowDetailDialog(item);
            }
        }

        private void ContextMenuDelete_Click(object sender, RoutedEventArgs e)
        {
            if (CertDataGrid.SelectedItem is CertificateItem item)
            {
                item.IsSelected = true;
                ViewModel?.DeleteSelectedCommand.Execute(null);
            }
        }

        private void BackupSelected_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;

            var selected = ViewModel.FilteredCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any() && ViewModel.SelectedCertificate != null)
            {
                selected.Add(ViewModel.SelectedCertificate);
            }

            if (!selected.Any())
            {
                if (ViewModel.FilteredCertificates.Count > 0)
                {
                    var ask = MessageBox.Show(
                        "체크박스로 선택된 인증서가 없습니다.\n\n" +
                        $"현재 목록에 표시된 전체 인증서({ViewModel.FilteredCertificates.Count}건)를 대상으로 복사 목적지 디스크를 지정하시겠습니까?\n\n" +
                        "• [예(Y)]: 전체 인증서 복사 디스크 선택창 열기\n" +
                        "• [아니오(N)]: 취소 (원하는 인증서만 체크박스 선택 후 다시 클릭)",
                        "인증서 선택 안내",
                        MessageBoxButton.YesNo,
                        MessageBoxImage.Question);

                    if (ask == MessageBoxResult.Yes)
                    {
                        selected = ViewModel.FilteredCertificates.ToList();
                    }
                    else
                    {
                        return;
                    }
                }
                else
                {
                    MessageBox.Show("복사 또는 백업할 인증서가 목록에 없습니다.", "선택된 인증서 없음", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }
            }

            OpenTargetDrivePickerForCertificates(selected);
        }

        private void BackupAll_Click(object sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;

            var all = ViewModel.FilteredCertificates.ToList();
            if (!all.Any())
            {
                all = ViewModel.AllCertificates.ToList();
            }

            if (!all.Any())
            {
                MessageBox.Show("복사할 인증서가 목록에 없습니다.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            OpenTargetDrivePickerForCertificates(all);
        }

        private void Hyperlink_RequestNavigate(object sender, System.Windows.Navigation.RequestNavigateEventArgs e)
        {
            try
            {
                if (e.Uri != null && e.Uri.IsAbsoluteUri &&
                    (e.Uri.Scheme == Uri.UriSchemeHttps || e.Uri.Scheme == Uri.UriSchemeHttp))
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = e.Uri.AbsoluteUri,
                        UseShellExecute = true
                    });
                }
                e.Handled = true;
            }
            catch { }
        }
    }
}
