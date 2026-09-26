using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using KCert.Core.Discovery;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using Microsoft.Win32;

namespace KCertManager.Wpf.Views
{
    public partial class SearchLocationsDialog : Window
    {
        private ObservableCollection<SearchPathItem> _paths = new();
        public List<string> ActivePaths => _paths.Where(p => p.IsEnabled).Select(p => p.Path).ToList();

        public SearchLocationsDialog(IEnumerable<string>? currentCustomPaths = null)
        {
            InitializeComponent();
            LoadDefaultPaths(currentCustomPaths);
        }

        private void LoadDefaultPaths(IEnumerable<string>? customPaths)
        {
            _paths.Clear();
            var standard = CertLocationScanner.GetStandardRoots();

            foreach (var sp in standard)
            {
                string name = "표준 보관함";
                if (sp.IndexOf("NPKI", StringComparison.OrdinalIgnoreCase) >= 0) name = "NPKI (금융/공동)";
                else if (sp.IndexOf("GPKI", StringComparison.OrdinalIgnoreCase) >= 0) name = "GPKI (행정공공)";
                else if (sp.IndexOf("EPKI", StringComparison.OrdinalIgnoreCase) >= 0) name = "EPKI (교육기관)";

                _paths.Add(new SearchPathItem
                {
                    IsEnabled = true,
                    Name = name,
                    Path = sp,
                    Description = "기본 공인인증서 보관 경로",
                    IsCustom = false
                });
            }

            if (customPaths != null)
            {
                foreach (var cp in customPaths)
                {
                    if (!_paths.Any(x => x.Path.Equals(cp, StringComparison.OrdinalIgnoreCase)))
                    {
                        _paths.Add(new SearchPathItem
                        {
                            IsEnabled = true,
                            Name = "사용자 지정",
                            Path = cp,
                            Description = "사용자 직접 추가 디렉터리",
                            IsCustom = true
                        });
                    }
                }
            }

            GridPaths.ItemsSource = _paths;
        }

        private void BtnAddFolder_Click(object sender, RoutedEventArgs e)
        {
            var dlg = new OpenFolderDialog
            {
                Title = "인증서 탐색 대상 폴더 추가"
            };

            if (dlg.ShowDialog() == true)
            {
                var folder = dlg.FolderName;
                if (_paths.Any(x => x.Path.Equals(folder, StringComparison.OrdinalIgnoreCase)))
                {
                    MessageBox.Show("이미 목록에 존재하는 폴더입니다.", "안내", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                _paths.Add(new SearchPathItem
                {
                    IsEnabled = true,
                    Name = "사용자 지정",
                    Path = folder,
                    Description = "사용자 직접 추가 디렉터리",
                    IsCustom = true
                });

                ActivityLogService.Instance.Log(
                    LogCategory.SCAN,
                    LogLevel.INFO,
                    "탐색 경로 추가",
                    $"경로: {folder}");
            }
        }

        private void BtnDeleteCustomPath_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is SearchPathItem item && item.IsCustom)
            {
                _paths.Remove(item);
            }
        }

        private void BtnResetDefaults_Click(object sender, RoutedEventArgs e)
        {
            LoadDefaultPaths(null);
        }

        private void BtnApplyAndScan_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }
    }
}
