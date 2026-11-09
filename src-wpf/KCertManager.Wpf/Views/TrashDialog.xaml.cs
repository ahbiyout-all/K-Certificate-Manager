using System;
using System.Collections.Generic;
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
        private bool _isInitializing = true;
        private readonly SafetyTrashManager _trashManager = new();
        private readonly CertificateBackupService _backupService = new();
        private ObservableCollection<TrashItem> _items = new();
        private ObservableCollection<RestoredTrashItem> _restoredItems = new();
        private List<RestoredTrashItem> _rawRestoredList = new();

        public bool AnyItemRestored { get; private set; }

        public TrashDialog()
        {
            try
            {
                InitializeComponent();
                LoadTrashItems();
                LoadRestoredItems();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[TrashDialog Init Error] {ex.Message}");
            }
            finally
            {
                _isInitializing = false;
            }
        }

        private void LoadTrashItems()
        {
            _items.Clear();
            var raw = _trashManager.GetItems();
            if (raw != null)
            {
                foreach (var r in raw)
                {
                    if (r == null) continue;
                    CertCategory cat = CertCategory.NPKI;
                    if (!string.IsNullOrEmpty(r.Category) && Enum.TryParse<CertCategory>(r.Category, out var parsedCat))
                    {
                        cat = parsedCat;
                    }

                    _items.Add(new TrashItem
                    {
                        Id = r.Id ?? Guid.NewGuid().ToString("N"),
                        DeletedAt = r.DeletedAtUtc != default ? r.DeletedAtUtc.ToLocalTime() : DateTime.Now,
                        CertCommonName = !string.IsNullOrEmpty(r.CertCommonName) ? r.CertCommonName : "알 수 없음",
                        OriginalDirectoryPath = r.OriginalDirectoryPath ?? string.Empty,
                        TrashDirectoryPath = r.QuarantinedFolderPath ?? string.Empty,
                        IssuerName = !string.IsNullOrEmpty(r.IssuerName) ? r.IssuerName : "알 수 없음",
                        Category = cat,
                        NotAfter = r.NotAfter != default ? r.NotAfter : DateTime.Now.AddYears(1),
                        IsSelected = false
                    });
                }
            }

            for (int i = 0; i < _items.Count; i++)
            {
                if (_items[i] != null)
                {
                    _items[i].IndexNumber = i + 1;
                }
            }

            if (GridTrash != null) GridTrash.ItemsSource = _items;
            if (BtnTabDeleted != null) BtnTabDeleted.Content = $"🗑️ 삭제된 항목 (격리 보관 중 {_items.Count}건)";
            UpdateFooterCount();
            UpdateSelectedState();
        }

        private void LoadRestoredItems()
        {
            _rawRestoredList = _backupService.GetRestoredTrashItems() ?? new List<RestoredTrashItem>();
            ApplyRestoredFilter();
            UpdateVaultDiagnosticsText();
        }

        private void ApplyRestoredFilter()
        {
            _restoredItems.Clear();
            if (_rawRestoredList == null) _rawRestoredList = new List<RestoredTrashItem>();

            string search = TxtSearchRestored?.Text?.Trim().ToLowerInvariant() ?? string.Empty;
            int catIdx = CmbRestoredCategory?.SelectedIndex ?? 0;

            var filtered = _rawRestoredList.Where(x => x != null).AsEnumerable();

            if (!string.IsNullOrEmpty(search))
            {
                filtered = filtered.Where(x => 
                    (x.CertCommonName ?? "").ToLowerInvariant().Contains(search) ||
                    (x.IssuerName ?? "").ToLowerInvariant().Contains(search) ||
                    (x.OriginalDirectoryPath ?? "").ToLowerInvariant().Contains(search) ||
                    (x.DeleteReason ?? "").ToLowerInvariant().Contains(search));
            }

            if (catIdx == 1) // NPKI
            {
                filtered = filtered.Where(x => x.Category.ToString().StartsWith("NPKI", StringComparison.OrdinalIgnoreCase));
            }
            else if (catIdx == 2) // GPKI
            {
                filtered = filtered.Where(x => x.Category.ToString().StartsWith("GPKI", StringComparison.OrdinalIgnoreCase));
            }
            else if (catIdx == 3) // EPKI
            {
                filtered = filtered.Where(x => x.Category.ToString().StartsWith("EPKI", StringComparison.OrdinalIgnoreCase));
            }

            var list = filtered.ToList();
            for (int i = 0; i < list.Count; i++)
            {
                if (list[i] != null)
                {
                    list[i].IndexNumber = i + 1;
                    _restoredItems.Add(list[i]);
                }
            }

            if (ListRestoredCards != null) ListRestoredCards.ItemsSource = _restoredItems;
            if (BtnTabRestored != null) BtnTabRestored.Content = $"🔄 복원된 항목 (보관소 {_rawRestoredList.Count}건)";
            UpdateFooterCount();
        }

        private void UpdateVaultDiagnosticsText()
        {
            try
            {
                if (TxtVaultDiagnostics != null)
                {
                    var status = _backupService.GetVaultSecurityStatus();
                    if (status != null)
                    {
                        string checksum = status.Sha256Checksum ?? string.Empty;
                        string hashSample = checksum.Length >= 16 
                            ? checksum.Substring(0, 16) + "..." 
                            : checksum;
                        TxtVaultDiagnostics.Text = $"매니페스트: protected_restored_manifest.dat ({status.FileSizeBytes} 바이트) | SHA-256: {hashSample} | {status.DiagnosticMessage}";
                    }
                }
            }
            catch { }
        }

        private void TxtSearchRestored_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (_isInitializing) return;
            ApplyRestoredFilter();
        }

        private void CmbRestoredCategory_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (_isInitializing) return;
            ApplyRestoredFilter();
        }

        private void BtnVaultSelfTest_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var status = _backupService.GetVaultSecurityStatus();
                string details = 
                    $"• 보안 알고리즘: {status.EncryptionAlgorithm}\n" +
                    $"• 매니페스트 경로: {status.ManifestFilePath}\n" +
                    $"• 암호화 데이터 크기: {status.FileSizeBytes:N0} 바이트\n" +
                    $"• 마지막 수정 시각: {status.LastModifiedUtc.ToLocalTime():yyyy-MM-dd HH:mm:ss}\n" +
                    $"• SHA-256 무결성 해시: {status.Sha256Checksum}\n" +
                    $"• 보관된 복원 이력: {status.TotalItemsCount}건\n" +
                    $"• 자가 진단(Self-Test) 상태: {(status.IsSelfTestPassed ? "✓ 무결성 검증 통과 (100% 정상)" : "⚠️ 진단 경고")}\n\n" +
                    $"안내: 복원된 항목의 매니페스트는 Windows DPAPI 및 AES-256으로 이중 암호화되어 있어 현재 사용자 외의 타인이나 악성 프로세스로부터 완벽히 보호됩니다.";

                UserFriendlyMessageHelper.ShowInfo(details, "암호화 보호 보관소(Encrypted Vault) 자가진단 리포트", this);
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "보관소 자가진단 오류");
            }
        }

        private void BtnExportVaultBackup_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (_rawRestoredList.Count == 0)
                {
                    UserFriendlyMessageHelper.ShowInfo("내보낼 복원 보관소 이력이 없습니다.", "안내", this);
                    return;
                }

                var sfd = new Microsoft.Win32.SaveFileDialog
                {
                    FileName = $"protected_vault_backup_{DateTime.Now:yyyyMMdd_HHmmss}.dat",
                    Filter = "암호화 보관소 백업 파일 (*.dat)|*.dat|모든 파일 (*.*)|*.*",
                    Title = "암호화 보호 보관소(.dat) 백업 파일 내보내기"
                };

                if (sfd.ShowDialog(this) == true)
                {
                    var (success, msg) = _backupService.ExportVaultBackup(sfd.FileName);
                    if (success)
                    {
                        UserFriendlyMessageHelper.ShowInfo(msg, "보관소 백업 내보내기 완료", this);
                    }
                    else
                    {
                        UserFriendlyMessageHelper.ShowErrorText(msg, "내보내기 실패", "• 파일 쓰기 권한이 있는 폴더를 선택해 주세요.", this);
                    }
                }
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "백업 내보내기 오류");
            }
        }

        private void BtnOpenVaultFolder_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string archivesDir = _backupService.GetRestoredArchivesDir();
                if (!System.IO.Directory.Exists(archivesDir))
                {
                    var di = System.IO.Directory.CreateDirectory(archivesDir);
                    try { di.Attributes |= System.IO.FileAttributes.Hidden; } catch { }
                }

                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "explorer.exe",
                    Arguments = $"\"{archivesDir}\"",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowErrorText($"보관소 폴더를 여는 중 오류가 발생했습니다: {ex.Message}", "폴더 열기 실패", "• 파일 탐색기 권한을 확인해 주세요.", this);
            }
        }

        private void BtnOpenItemVaultFolder_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is RestoredTrashItem item)
            {
                try
                {
                    string targetPath = item.EncryptedZipPath;
                    if (System.IO.File.Exists(targetPath))
                    {
                        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = "explorer.exe",
                            Arguments = $"/select,\"{targetPath}\"",
                            UseShellExecute = true
                        });
                    }
                    else
                    {
                        string archivesDir = _backupService.GetRestoredArchivesDir();
                        if (System.IO.Directory.Exists(archivesDir))
                        {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "explorer.exe",
                                Arguments = $"\"{archivesDir}\"",
                                UseShellExecute = true
                            });
                        }
                        else
                        {
                            UserFriendlyMessageHelper.ShowInfo("보관소 금고 파일이 아직 디스크에 생성되지 않았습니다.", "안내", this);
                        }
                    }
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowErrorText($"금고 폴더를 여는 중 오류가 발생했습니다: {ex.Message}", "폴더 열기 실패", "• 파일 탐색기 권한을 확인해 주세요.", this);
                }
            }
        }

        private void BtnVerifyArchive_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is RestoredTrashItem item)
            {
                try
                {
                    string zipPath = item.EncryptedZipPath;
                    string trashId = !string.IsNullOrEmpty(item.TrashId) ? item.TrashId : item.Id;

                    if (string.IsNullOrEmpty(zipPath) || !System.IO.File.Exists(zipPath))
                    {
                        UserFriendlyMessageHelper.ShowErrorText(
                            $"암호화 금고 파일이 디스크에 존재하지 않습니다.\n({zipPath})",
                            "금고 파일 미발견",
                            "• '보관소 자가진단'을 실행하여 금고 파일을 자동 동기화해 주세요.",
                            this);
                        return;
                    }

                    var (isValid, message, metadata, fileSize, sha256) = _backupService.VerifyRestoredVaultArchive(zipPath, trashId);
                    if (isValid)
                    {
                        string details = 
                            $"[🔒 AES-256-GCM 암호화 금고 검증 통과]\n" +
                            $"• 인증서 소유자명: {item.CertCommonName}\n" +
                            $"• 암호화 금고 파일: {System.IO.Path.GetFileName(zipPath)}\n" +
                            $"• 저장 디렉터리: {System.IO.Path.GetDirectoryName(zipPath)}\n" +
                            $"• 금고 데이터 크기: {fileSize:N0} 바이트 ({item.FormattedCompressedSize})\n" +
                            $"• SHA-256 무결성 해시: {sha256}\n" +
                            $"• 보안 알고리즘: AES-256-GCM + PBKDF2 (100,000회 스트레칭)\n" +
                            $"• 검증 결과: {message}\n\n" +
                            $"안내: 이 금고 파일은 일반 사용자가 임의로 개봉할 수 없도록 이중 암호화되어 안전하게 보관됩니다.";

                        UserFriendlyMessageHelper.ShowInfo(details, "✓ 특수 암호화 금고 무결성 검증 완료", this);
                    }
                    else
                    {
                        UserFriendlyMessageHelper.ShowErrorText(
                            $"금고 검증 경고: {message}",
                            "금고 검증 실패",
                            "• 금고 파일이 변조되었거나 패스워드 파생 키가 일치하지 않습니다.",
                            this);
                    }
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowError(ex, "금고 검증 중 오류");
                }
            }
        }

        private void BtnShowProof_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is RestoredTrashItem item)
            {
                string proofDetails = 
                    $"[인증서 기본 정보]\n" +
                    $"• 소유자명: {item.CertCommonName}\n" +
                    $"• 발급기관: {item.IssuerName}\n" +
                    $"• 구분: {item.Category}\n" +
                    $"• 만료일: {item.NotAfter:yyyy-MM-dd}\n\n" +
                    $"[격리 및 복원 무결성 증적]\n" +
                    $"• 복원 완료 시각: {item.RestoredAt:yyyy-MM-dd HH:mm:ss}\n" +
                    $"• 이전 삭제 사유: {item.DeleteReason}\n" +
                    $"• 복구 전 무결성: {item.IntegrityBefore}\n" +
                    $"• 복구 후 무결성: {item.IntegrityAfter}\n\n" +
                    $"[보관소 암호화 수준 및 파일 경로]\n" +
                    $"• 암호화 금고 파일: {item.EncryptedZipPath}\n" +
                    $"• 압축 데이터 크기: {item.FormattedCompressedSize}\n" +
                    $"• 시스템 복원 반영 위치: {item.OriginalDirectoryPath}\n" +
                    $"• 매니페스트 보호: Windows DPAPI (CurrentUser) + AES-256 GCM\n" +
                    $"• 무결성 상태: {item.StatusBadge}";

                UserFriendlyMessageHelper.ShowInfo(proofDetails, "🔒 복원 인증서 보안 감사 증적 (Audit Proof)", this);
            }
        }

        private void UpdateFooterCount()
        {
            if (TxtTrashCount != null)
            {
                TxtTrashCount.Text = $"격리 보관된 인증서: {_items.Count}개 | 복원 보관소: {_rawRestoredList.Count}개";
            }
        }

        private void BtnTabDeleted_Click(object sender, RoutedEventArgs e)
        {
            if (_isInitializing) return;
            if (BtnTabDeleted != null) BtnTabDeleted.Style = (Style)FindResource("PrimaryButton");
            if (BtnTabRestored != null) BtnTabRestored.Style = (Style)FindResource("SecondaryButton");

            if (PanelDeletedToolbar != null) PanelDeletedToolbar.Visibility = Visibility.Visible;
            if (PanelDeletedContent != null) PanelDeletedContent.Visibility = Visibility.Visible;

            if (PanelRestoredToolbar != null) PanelRestoredToolbar.Visibility = Visibility.Collapsed;
            if (PanelRestoredContent != null) PanelRestoredContent.Visibility = Visibility.Collapsed;
        }

        private void BtnTabRestored_Click(object sender, RoutedEventArgs e)
        {
            if (_isInitializing) return;
            if (BtnTabDeleted != null) BtnTabDeleted.Style = (Style)FindResource("SecondaryButton");
            if (BtnTabRestored != null) BtnTabRestored.Style = (Style)FindResource("PrimaryButton");

            if (PanelDeletedToolbar != null) PanelDeletedToolbar.Visibility = Visibility.Collapsed;
            if (PanelDeletedContent != null) PanelDeletedContent.Visibility = Visibility.Collapsed;

            if (PanelRestoredToolbar != null) PanelRestoredToolbar.Visibility = Visibility.Visible;
            if (PanelRestoredContent != null) PanelRestoredContent.Visibility = Visibility.Visible;
            UpdateVaultDiagnosticsText();
        }

        private void BtnClearRestored_Click(object sender, RoutedEventArgs e)
        {
            if (_rawRestoredList.Count == 0)
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

        private void BtnRestoreRestoredToUsb_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is RestoredTrashItem item)
            {
                var targetDrives = UsbDriveWatcher.GetAvailableDrives().Where(d => d.IsRemovable || string.Equals(d.BusType, "USB", StringComparison.OrdinalIgnoreCase)).ToList();
                if (!targetDrives.Any())
                {
                    UserFriendlyMessageHelper.ShowErrorText(
                        "연결된 이동식 USB 메모리를 찾을 수 없습니다.",
                        "제한된 USB 복구 안내",
                        "• 특수 보관소의 제한 복구 기능은 파일 오염 및 임의 생성을 방지하기 위해 이동식 USB 매체로만 복원이 허용됩니다.\n• USB 메모리를 컴퓨터에 연결하신 후 다시 시도해 주세요.",
                        this);
                    return;
                }

                var usbDrive = targetDrives.First();
                string subFolder = item.Category.ToString().StartsWith("GPKI") ? "GPKI" : item.Category.ToString().StartsWith("EPKI") ? "EPKI" : "NPKI";
                string destDir = System.IO.Path.Combine(usbDrive.Name, subFolder, item.CertCommonName);

                if (!System.IO.Directory.Exists(item.OriginalDirectoryPath))
                {
                    UserFriendlyMessageHelper.ShowErrorText(
                        $"복원 대상 인증서 폴더를 찾을 수 없습니다.\n({item.OriginalDirectoryPath})",
                        "복구 오류",
                        "• 원래 복원되었던 로컬 경로에 인증서 폴더가 존재하는지 확인해 주세요.",
                        this);
                    return;
                }

                try
                {
                    string safeRel = CertTransferEngine.ResolveRelativePath(item.OriginalDirectoryPath);
                    var transferResult = CertTransferEngine.Transfer(item.OriginalDirectoryPath, usbDrive.Name, safeRel);
                    if (!transferResult.IsSuccess)
                    {
                        UserFriendlyMessageHelper.ShowErrorText(
                            transferResult.Message,
                            "USB 복구 실패",
                            "• USB 드라이브의 쓰기 금지 여부 또는 저장 공간을 확인해 주세요.",
                            this);
                        return;
                    }
                    destDir = transferResult.DestinationDirectory;

                    AnyItemRestored = true;
                    ActivityLogService.Instance.Log(
                        LogCategory.RESTORE,
                        LogLevel.SUCCESS,
                        "특수 보관소 ➔ USB 제한 복구 완료",
                        $"인증서 [{item.CertCommonName}] ➔ USB ({usbDrive.Name}) {subFolder} 제한 복원 완료",
                        item.OriginalDirectoryPath,
                        destDir,
                        1);

                    SoundService.PlayCompletionSound();
                    UserFriendlyMessageHelper.ShowOperationComplete(
                        "특수 보관소 ➔ USB 제한 복구 완료!",
                        1,
                        usbDrive.Name,
                        destDir,
                        item.OriginalDirectoryPath,
                        new[] { item.CertCommonName },
                        this);

                    LoadRestoredItems();
                }
                catch (Exception ex)
                {
                    UserFriendlyMessageHelper.ShowErrorText(
                        $"USB 제한 복구 실패: {ex.Message}",
                        "복구 오류",
                        "• USB 쓰기 금지 해제 여부를 확인해 주세요.\n• 관리자 권한으로 실행해 보세요.",
                        this);
                }
            }
        }

        private void UpdateSelectedState()
        {
            int selectedCount = _items?.Count(x => x != null && x.IsSelected) ?? 0;
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
                if (item != null) item.IsSelected = true;
            }
            UpdateSelectedState();
        }

        private void BtnDeselectAll_Click(object sender, RoutedEventArgs e)
        {
            foreach (var item in _items)
            {
                if (item != null) item.IsSelected = false;
            }
            UpdateSelectedState();
        }

        private void ChkItem_Click(object sender, RoutedEventArgs e)
        {
            UpdateSelectedState();
        }

        private void BtnRestoreSelected_Click(object sender, RoutedEventArgs e)
        {
            var selected = _items.Where(x => x != null && x.IsSelected).ToList();
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
                if (item == null) continue;
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
                var evidenceSummary = string.Join("; ", _items.Where(x => x != null).Select(x => $"인증서: {x.CertCommonName}, 원본경로: {x.OriginalDirectoryPath}"));
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
