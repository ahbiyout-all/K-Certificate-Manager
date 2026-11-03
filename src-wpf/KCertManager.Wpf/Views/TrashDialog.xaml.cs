using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using KCert.Core.Vault;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public partial class TrashDialog : Window
    {
        private readonly SafetyTrashManager _trashManager = new();
        private readonly CertificateBackupService _backupService = new();
        private ObservableCollection<TrashItem> _items = new();
        private ObservableCollection<RestoredTrashItem> _restoredItems = new();

        public bool AnyItemRestored { get; private set; }

        public TrashDialog()
        {
            InitializeComponent();
            LoadTrashItems();
            LoadRestoredItems();
        }

        private void LoadTrashItems()
        {
            _items.Clear();
            var raw = _trashManager.GetItems();
            foreach (var r in raw)
            {
                CertCategory cat = CertCategory.NPKI;
                if (!string.IsNullOrEmpty(r.Category) && Enum.TryParse<CertCategory>(r.Category, out var parsedCat))
                {
                    cat = parsedCat;
                }

                _items.Add(new TrashItem
                {
                    Id = r.Id,
                    DeletedAt = r.DeletedAtUtc.ToLocalTime(),
                    CertCommonName = r.CertCommonName,
                    OriginalDirectoryPath = r.OriginalDirectoryPath,
                    TrashDirectoryPath = r.QuarantinedFolderPath,
                    IssuerName = !string.IsNullOrEmpty(r.IssuerName) ? r.IssuerName : "알 수 없음",
                    Category = cat,
                    NotAfter = r.NotAfter != default ? r.NotAfter : DateTime.Now.AddYears(1),
                    IsSelected = false
                });
            }

            for (int i = 0; i < _items.Count; i++)
            {
                _items[i].IndexNumber = i + 1;
            }

            GridTrash.ItemsSource = _items;
            BtnTabDeleted.Content = $"🗑️ 삭제된 항목 (격리 보관 중 {_items.Count}건)";
            UpdateFooterCount();
            UpdateSelectedState();
        }

        private void LoadRestoredItems()
        {
            _restoredItems.Clear();
            var rawRestored = _backupService.GetRestoredTrashItems();
            for (int i = 0; i < rawRestored.Count; i++)
            {
                rawRestored[i].IndexNumber = i + 1;
                _restoredItems.Add(rawRestored[i]);
            }

            ListRestoredCards.ItemsSource = _restoredItems;
            BtnTabRestored.Content = $"🔄 복원된 항목 (보관소 {_restoredItems.Count}건)";
            UpdateFooterCount();
        }

        private void UpdateFooterCount()
        {
            TxtTrashCount.Text = $"격리 보관된 인증서: {_items.Count}개 | 복원 보관소: {_restoredItems.Count}개";
        }

        private void BtnTabDeleted_Click(object sender, RoutedEventArgs e)
        {
            BtnTabDeleted.Style = (Style)FindResource("PrimaryButton");
            BtnTabRestored.Style = (Style)FindResource("SecondaryButton");

            PanelDeletedToolbar.Visibility = Visibility.Visible;
            PanelDeletedContent.Visibility = Visibility.Visible;

            PanelRestoredToolbar.Visibility = Visibility.Collapsed;
            PanelRestoredContent.Visibility = Visibility.Collapsed;
        }

        private void BtnTabRestored_Click(object sender, RoutedEventArgs e)
        {
            BtnTabDeleted.Style = (Style)FindResource("SecondaryButton");
            BtnTabRestored.Style = (Style)FindResource("PrimaryButton");

            PanelDeletedToolbar.Visibility = Visibility.Collapsed;
            PanelDeletedContent.Visibility = Visibility.Collapsed;

            PanelRestoredToolbar.Visibility = Visibility.Visible;
            PanelRestoredContent.Visibility = Visibility.Visible;
        }

        private void BtnClearRestored_Click(object sender, RoutedEventArgs e)
        {
            if (_restoredItems.Count == 0)
            {
                UserFriendlyMessageHelper.ShowInfo("복원 보관소가 이미 비어 있습니다.", "안내", this);
                return;
            }

            var confirm = MessageBox.Show(
                this,
                "복원된 인증서 항목의 모든 이력 기록을 삭제하시겠습니까?",
                "복원 이력 전체 비우기 확인",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (confirm == MessageBoxResult.Yes)
            {
                _backupService.ClearRestoredTrashHistory();
                LoadRestoredItems();
                UserFriendlyMessageHelper.ShowInfo("복원 이력 보관소를 완전히 비웠습니다.", "비우기 완료", this);
            }
        }

        private void BtnDeleteRestoredItem_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is RestoredTrashItem item)
            {
                if (_backupService.DeleteRestoredTrashItem(item.Id))
                {
                    LoadRestoredItems();
                }
            }
        }

        private void UpdateSelectedState()
        {
            int selectedCount = _items.Count(x => x.IsSelected);
            if (TxtSelectedCount != null)
            {
                TxtSelectedCount.Text = $"{selectedCount}개 선택됨";
            }
            if (BtnRestoreSelected != null)
            {
                BtnRestoreSelected.IsEnabled = selectedCount > 0;
                BtnRestoreSelected.Content = selectedCount > 0 
                    ? $"↩️ 선택 항목 복원 ({selectedCount}건)" 
                    : "↩️ 선택 항목 복원";
            }
        }

        private void BtnSelectAll_Click(object sender, RoutedEventArgs e)
        {
            foreach (var item in _items)
            {
                item.IsSelected = true;
            }
            UpdateSelectedState();
        }

        private void BtnDeselectAll_Click(object sender, RoutedEventArgs e)
        {
            foreach (var item in _items)
            {
                item.IsSelected = false;
            }
            UpdateSelectedState();
        }

        private void ChkItem_Click(object sender, RoutedEventArgs e)
        {
            UpdateSelectedState();
        }

        private void BtnRestoreSelected_Click(object sender, RoutedEventArgs e)
        {
            var selected = _items.Where(x => x.IsSelected).ToList();
            if (!selected.Any()) return;

            int restoredCount = 0;
            foreach (var item in selected)
            {
                var (success, msg) = _trashManager.Restore(item.Id);
                if (success)
                {
                    restoredCount++;
                    AnyItemRestored = true;
                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.SUCCESS,
                        "휴지통에서 선택 복원 완료",
                        $"인증서: {item.CertCommonName}",
                        item.TrashDirectoryPath,
                        item.OriginalDirectoryPath);
                }
                else
                {
                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.ERROR,
                        "휴지통 선택 복원 실패",
                        msg,
                        item.TrashDirectoryPath,
                        item.OriginalDirectoryPath);
                }
            }

            if (restoredCount > 0)
            {
                UserFriendlyMessageHelper.ShowInfo($"선택한 {restoredCount}개의 인증서가 원래 경로로 성공적으로 복원되었습니다.", "선택 복원 완료", this);
                LoadTrashItems();
                LoadRestoredItems();
            }
            else
            {
                UserFriendlyMessageHelper.ShowErrorText(
                    "선택한 인증서를 복원하지 못했습니다.",
                    "복원 오류 안내",
                    "• 대상 드라이브(USB)가 연결되어 있는지 확인해 주세요.\n• 관리자 권한으로 프로그램을 실행해 보세요.",
                    this);
            }
        }

        private void BtnRestoreAll_Click(object sender, RoutedEventArgs e)
        {
            if (_items.Count == 0)
            {
                UserFriendlyMessageHelper.ShowInfo("휴지통에 복원할 인증서가 없습니다.", "안내", this);
                return;
            }

            var confirm = MessageBox.Show(
                this,
                $"휴지통에 보관된 {_items.Count}개의 모든 인증서를 원래 위치로 일괄 복원하시겠습니까?",
                "전체 일괄 복원 확인",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (confirm != MessageBoxResult.Yes) return;

            int restoredCount = 0;
            foreach (var item in _items.ToList())
            {
                var (success, msg) = _trashManager.Restore(item.Id);
                if (success)
                {
                    restoredCount++;
                    AnyItemRestored = true;
                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.SUCCESS,
                        "휴지통 전체 복원 완료",
                        $"인증서: {item.CertCommonName}",
                        item.TrashDirectoryPath,
                        item.OriginalDirectoryPath);
                }
            }

            if (restoredCount > 0)
            {
                UserFriendlyMessageHelper.ShowInfo($"휴지통의 모든 인증서({restoredCount}건)가 원래 경로로 성공적으로 복원되었습니다.", "전체 복원 완료", this);
                LoadTrashItems();
                LoadRestoredItems();
            }
        }

        private void BtnRestoreItem_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is TrashItem item)
            {
                var (success, msg) = _trashManager.Restore(item.Id);
                if (success)
                {
                    AnyItemRestored = true;
                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.SUCCESS,
                        "휴지통에서 복원 완료",
                        $"인증서: {item.CertCommonName}",
                        item.TrashDirectoryPath,
                        item.OriginalDirectoryPath);

                    UserFriendlyMessageHelper.ShowInfo($"인증서 [{item.CertCommonName}]가 원래 경로로 성공적으로 복원되었습니다.", "복원 완료", this);
                    LoadTrashItems();
                    LoadRestoredItems();
                }
                else
                {
                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.ERROR,
                        "휴지통 복원 실패",
                        msg,
                        item.TrashDirectoryPath,
                        item.OriginalDirectoryPath);

                    UserFriendlyMessageHelper.ShowErrorText(
                        $"인증서를 원래 경로로 복원하지 못했습니다: {msg}",
                        "복원 오류 안내",
                        "• 대상 드라이브(USB)가 연결되어 있는지 확인해 주세요.\n• 관리자 권한으로 프로그램을 실행해 보세요.",
                        this);
                }
            }
        }

        private void BtnEmptyTrash_Click(object sender, RoutedEventArgs e)
        {
            if (_items.Count == 0)
            {
                UserFriendlyMessageHelper.ShowInfo("휴지통이 이미 비어 있습니다.", "안내", this);
                return;
            }

            var confirm = MessageBox.Show(
                this,
                $"휴지통에 있는 {_items.Count}개의 격리 인증서를 영구적으로 삭제하시겠습니까?\n\n※ 영구 삭제 후에는 되돌릴 수 없습니다.",
                "휴지통 영구 비우기 확인",
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);

            if (confirm == MessageBoxResult.Yes)
            {
                int count = _items.Count;
                var evidenceSummary = string.Join("; ", _items.Select(x => $"인증서: {x.CertCommonName}, 원본경로: {x.OriginalDirectoryPath}"));
                _trashManager.EmptyTrash();
                ActivityLogService.Instance.Log(
                    LogCategory.DELETE,
                    LogLevel.WARN,
                    "휴지통 영구 비우기 (보안 삭제 증적)",
                    $"총 {count}개 인증서 영구 폐기 증적: {evidenceSummary}",
                    "Trash",
                    "Permanent Purge",
                    count);

                LoadTrashItems();
                UserFriendlyMessageHelper.ShowInfo("휴지통의 모든 항목을 완전히 비우고 보안 삭제 증적을 기록했습니다.", "휴지통 비우기 완료", this);
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = AnyItemRestored;
            Close();
        }
    }
}
