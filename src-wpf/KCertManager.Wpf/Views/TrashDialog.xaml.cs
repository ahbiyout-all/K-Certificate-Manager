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
        private ObservableCollection<TrashItem> _items = new();

        public bool AnyItemRestored { get; private set; }

        public TrashDialog()
        {
            InitializeComponent();
            LoadTrashItems();
        }

        private void LoadTrashItems()
        {
            _items.Clear();
            var raw = _trashManager.GetItems();
            foreach (var r in raw)
            {
                _items.Add(new TrashItem
                {
                    Id = r.Id,
                    DeletedAt = r.DeletedAtUtc.ToLocalTime(),
                    CertCommonName = r.CertCommonName,
                    OriginalDirectoryPath = r.OriginalDirectoryPath,
                    TrashDirectoryPath = r.QuarantinedFolderPath,
                    Category = CertCategory.NPKI,
                    IsSelected = false
                });
            }

            GridTrash.ItemsSource = _items;
            TxtTrashCount.Text = $"격리 보관된 인증서: {_items.Count}개";
            UpdateSelectedState();
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
                _trashManager.EmptyTrash();
                ActivityLogService.Instance.Log(
                    LogCategory.DELETE,
                    LogLevel.WARN,
                    "휴지통 영구 비우기",
                    $"{_items.Count}개 인증서 영구 삭제");

                LoadTrashItems();
                UserFriendlyMessageHelper.ShowInfo("휴지통의 모든 항목을 완전히 비웠습니다.", "휴지통 비우기 완료", this);
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = AnyItemRestored;
            Close();
        }
    }
}
