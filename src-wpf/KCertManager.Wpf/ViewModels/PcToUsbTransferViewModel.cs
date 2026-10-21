using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using KCert.Core.Vault;
using KCertManager.Wpf.Common;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.ViewModels
{
    public class PcToUsbTransferViewModel : ViewModelBase
    {
        private readonly CertificateScannerService _scannerService = new();
        private readonly CertificateBackupService _backupService = new();

        private ObservableCollection<DriveItem> _availableDrives = new();
        private DriveItem? _selectedTargetDrive;
        private ObservableCollection<CertificateItem> _foundPcCertificates = new();
        private string _conflictOption = "overwrite";
        private bool _isBusy;
        private bool _hasUsbDrives;
        private string _statusMessage = "복사할 대상 USB 드라이브를 선택하세요.";

        public event Action? TransferCompleted;

        public PcToUsbTransferViewModel() : this(null, null)
        {
        }

        public PcToUsbTransferViewModel(IEnumerable<CertificateItem>? initialCertificates, string? initialDriveLetter = null)
        {
            RefreshDrivesCommand = new RelayCommand(() => RefreshDrives());
            TransferToUsbCommand = new RelayCommand(async () => await TransferToUsbAsync(), () => HasUsbDrives && SelectedTargetDrive != null && FoundPcCertificates.Any(x => x.IsSelected) && !IsBusy);
            SelectAllCommand = new RelayCommand(() =>
            {
                foreach (var c in FoundPcCertificates) c.IsSelected = true;
                (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
            });
            ClearSelectionCommand = new RelayCommand(() =>
            {
                foreach (var c in FoundPcCertificates) c.IsSelected = false;
                (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
            });

            RefreshDrives(initialDriveLetter);
            LoadCertificates(initialCertificates);
        }

        public bool HasUsbDrives
        {
            get => _hasUsbDrives;
            set => SetProperty(ref _hasUsbDrives, value);
        }

        public ObservableCollection<DriveItem> AvailableDrives
        {
            get => _availableDrives;
            set => SetProperty(ref _availableDrives, value);
        }

        public DriveItem? SelectedTargetDrive
        {
            get => _selectedTargetDrive;
            set
            {
                if (SetProperty(ref _selectedTargetDrive, value))
                {
                    UpdateStatusMessage();
                    (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public ObservableCollection<CertificateItem> FoundPcCertificates
        {
            get => _foundPcCertificates;
            set => SetProperty(ref _foundPcCertificates, value);
        }

        public string ConflictOption
        {
            get => _conflictOption;
            set => SetProperty(ref _conflictOption, value);
        }

        public bool IsBusy
        {
            get => _isBusy;
            set
            {
                if (SetProperty(ref _isBusy, value))
                {
                    (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        public ICommand RefreshDrivesCommand { get; }
        public ICommand TransferToUsbCommand { get; }
        public ICommand SelectAllCommand { get; }
        public ICommand ClearSelectionCommand { get; }

        public void RefreshDrives(string? preferredDriveLetter = null)
        {
            try
            {
                var usbDrives = UsbDriveWatcher.GetAvailableDrives()
                    .Where(d => d.IsRemovable && !d.IsCdRom && d.IsReady)
                    .OrderBy(d => d.Name)
                    .ToList();

                AvailableDrives = new ObservableCollection<DriveItem>(usbDrives);
                HasUsbDrives = AvailableDrives.Count > 0;

                if (!HasUsbDrives)
                {
                    SelectedTargetDrive = null;
                    StatusMessage = "연결된 USB 이동식 메모리가 없습니다. 본체에 USB를 꽂은 후 [🔄 드라이브 갱신]을 눌러주세요.";
                    (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    return;
                }

                if (!string.IsNullOrEmpty(preferredDriveLetter))
                {
                    var match = AvailableDrives.FirstOrDefault(d =>
                        d.Name.StartsWith(preferredDriveLetter, StringComparison.OrdinalIgnoreCase) ||
                        preferredDriveLetter.StartsWith(d.Name, StringComparison.OrdinalIgnoreCase));
                    if (match != null)
                    {
                        SelectedTargetDrive = match;
                        return;
                    }
                }

                SelectedTargetDrive = AvailableDrives.FirstOrDefault();
            }
            catch (Exception ex)
            {
                HasUsbDrives = false;
                StatusMessage = $"USB 드라이브 검색 오류: {ex.Message}";
            }
        }

        private void LoadCertificates(IEnumerable<CertificateItem>? initialCertificates)
        {
            var list = new List<CertificateItem>();

            if (initialCertificates != null && initialCertificates.Any())
            {
                list.AddRange(initialCertificates);
            }
            else
            {
                // Scan local PC default certificate paths
                try
                {
                    var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                    var pcPaths = new List<string>
                    {
                        Path.Combine(userProfile, "AppData", "LocalLow", "NPKI"),
                        Path.Combine(userProfile, "AppData", "LocalLow", "GPKI"),
                        Path.Combine(userProfile, "AppData", "LocalLow", "EPKI"),
                        @"C:\NPKI",
                        @"C:\GPKI",
                        @"C:\Program Files\NPKI"
                    };

                    var scanned = _scannerService.ScanCertificates(pcPaths);
                    list.AddRange(scanned.Where(c => !c.IsRemovableMedia));
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Scan PC Certs Error] {ex.Message}");
                }
            }

            foreach (var c in list)
            {
                c.IsSelected = true;
                c.PropertyChanged += (s, e) =>
                {
                    if (e.PropertyName == nameof(CertificateItem.IsSelected))
                    {
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                        {
                            UpdateStatusMessage();
                            (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
                        }));
                    }
                };
            }

            FoundPcCertificates = new ObservableCollection<CertificateItem>(list);
            UpdateStatusMessage();
            (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }

        private void UpdateStatusMessage()
        {
            int selectedCount = FoundPcCertificates.Count(x => x.IsSelected);
            if (!HasUsbDrives || SelectedTargetDrive == null)
            {
                StatusMessage = "연결된 USB 이동식 메모리가 없습니다. USB를 연결해 주세요.";
            }
            else if (selectedCount == 0)
            {
                StatusMessage = "복사할 PC 인증서를 1개 이상 선택해 주세요.";
            }
            else
            {
                StatusMessage = $"선택한 {selectedCount}건의 인증서를 대상 드라이브 {SelectedTargetDrive.Name} 로 복사할 준비가 되었습니다.";
            }
        }

        public async Task TransferToUsbAsync()
        {
            var selected = FoundPcCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any() || SelectedTargetDrive == null) return;

            IsBusy = true;
            string targetDriveName = SelectedTargetDrive.Name;
            StatusMessage = $"{targetDriveName} 드라이브로 {selected.Count}건의 인증서 복사 진행 중...";

            int success = 0;
            int failed = 0;
            var errorList = new List<string>();

            await Task.Run(() =>
            {
                foreach (var cert in selected)
                {
                    try
                    {
                        if (string.IsNullOrWhiteSpace(cert.DirectoryPath) || !Directory.Exists(cert.DirectoryPath))
                        {
                            failed++;
                            errorList.Add($"{cert.CommonName}: 원본 폴더 없음");
                            continue;
                        }

                        string relativePath = CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                        string destinationRoot = targetDriveName;

                        string destDir = Path.Combine(destinationRoot, relativePath);
                        if (Directory.Exists(destDir))
                        {
                            if (ConflictOption == "skip")
                            {
                                continue;
                            }
                            else if (ConflictOption == "rename")
                            {
                                string backupName = $"{destDir}_backup_{DateTime.Now:yyyyMMdd_HHmmss}";
                                try { Directory.Move(destDir, backupName); } catch { }
                            }
                        }

                        var transferResult = CertTransferEngine.Transfer(cert.DirectoryPath, destinationRoot, relativePath);
                        if (transferResult.IsSuccess)
                        {
                            success++;
                            cert.IsRecentlyCopied = true;
                        }
                        else
                        {
                            failed++;
                            errorList.Add($"{cert.CommonName}: {transferResult.Message}");
                        }
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        errorList.Add($"{cert.CommonName}: {ex.Message}");
                    }
                }
            });

            IsBusy = false;

            if (success > 0)
            {
                string msg = $"선택하신 인증서 {success}개가 {targetDriveName} USB 메모리로 안전하게 복사/백업되었습니다.";
                if (failed > 0)
                {
                    msg += $"\n(실패: {failed}건 - {string.Join(", ", errorList)})";
                }
                MessageBox.Show(msg, "PC ➔ USB 복사 완료", MessageBoxButton.OK, MessageBoxImage.Information);
                TransferCompleted?.Invoke();
            }
            else
            {
                string errMsg = $"인증서 복사에 실패하였습니다.\n\n원인:\n{string.Join("\n", errorList)}";
                MessageBox.Show(errMsg, "복사 오류 안내", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
    }
}
