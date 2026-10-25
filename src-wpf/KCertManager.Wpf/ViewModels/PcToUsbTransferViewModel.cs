using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using KCert.Core.Discovery;
using KCert.Core.HardwareGuard;
using KCert.Core.Vault;
using KCertManager.Wpf.Common;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.Views;

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
        private bool _hasDrives = true;
        private bool _hasRemovableUsb;
        private string _statusMessage = "복사할 대상 드라이브를 선택하세요.";
        private string _confirmButtonText = "선택한 인증서 복사 시작";

        public event Action? TransferCompleted;

        public PcToUsbTransferViewModel() : this(null, null, null)
        {
        }

        public PcToUsbTransferViewModel(IEnumerable<CertificateItem>? initialCertificates, IEnumerable<DriveItem>? initialDrives = null, string? initialDriveLetter = null)
        {
            RefreshDrivesCommand = new RelayCommand(() => RefreshDrives(null, initialDrives));
            TransferToUsbCommand = new RelayCommand(async () => await TransferToUsbAsync(), () => SelectedTargetDrive != null && FoundPcCertificates.Any(x => x.IsSelected) && !IsBusy);
            SelectAllCommand = new RelayCommand(() =>
            {
                foreach (var c in FoundPcCertificates) c.IsSelected = true;
                UpdateStatusMessage();
                (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
            });
            ClearSelectionCommand = new RelayCommand(() =>
            {
                foreach (var c in FoundPcCertificates) c.IsSelected = false;
                UpdateStatusMessage();
                (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
            });

            RefreshDrives(initialDriveLetter, initialDrives);
            LoadCertificates(initialCertificates);
        }

        public bool HasDrives
        {
            get => _hasDrives;
            set => SetProperty(ref _hasDrives, value);
        }

        public bool HasRemovableUsb
        {
            get => _hasRemovableUsb;
            set => SetProperty(ref _hasRemovableUsb, value);
        }

        public bool HasCertificates => FoundPcCertificates != null && FoundPcCertificates.Count > 0;

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
            set
            {
                if (SetProperty(ref _foundPcCertificates, value))
                {
                    OnPropertyChanged(nameof(HasCertificates));
                }
            }
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

        public string ConfirmButtonText
        {
            get => _confirmButtonText;
            set => SetProperty(ref _confirmButtonText, value);
        }

        public ICommand RefreshDrivesCommand { get; }
        public ICommand TransferToUsbCommand { get; }
        public ICommand SelectAllCommand { get; }
        public ICommand ClearSelectionCommand { get; }

        public void RefreshDrives(string? preferredDriveLetter = null, IEnumerable<DriveItem>? fallbackDrives = null)
        {
            try
            {
                UsbStorageGuard.InvalidateUsbCache();

                var drives = new List<DriveItem>();

                // 1. UsbDriveWatcher로부터 사용 가능한 모든 드라이브 수집
                var scanned = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
                if (scanned.Any())
                {
                    drives.AddRange(scanned);
                }
                else if (fallbackDrives != null && fallbackDrives.Any())
                {
                    drives.AddRange(fallbackDrives.Where(d => !d.IsCdRom));
                }

                // 2. 기본 C: 드라이브가 누락된 경우 기본 시스템 드라이브 보장 추가
                if (!drives.Any(d => d.Name.StartsWith("C", StringComparison.OrdinalIgnoreCase)))
                {
                    drives.Insert(0, new DriveItem
                    {
                        Name = @"C:\",
                        VolumeLabel = "로컬 디스크",
                        TotalSize = 256L * 1024 * 1024 * 1024,
                        FreeSpace = 120L * 1024 * 1024 * 1024,
                        IsRemovable = false,
                        IsReady = true,
                        DeviceKind = "internal_fixed",
                        DeviceKindName = "내장 디스크",
                        BusType = "NVMe",
                        DiskMediaType = "SSD"
                    });
                }

                // 3. USB 드라이브 우선, 그 다음 C:, D: 등 로컬 드라이브 순으로 정렬
                var sortedDrives = drives
                    .Where(d => d.IsReady)
                    .OrderByDescending(d => d.IsRemovable)
                    .ThenBy(d => d.Name)
                    .ToList();

                AvailableDrives = new ObservableCollection<DriveItem>(sortedDrives);
                HasDrives = AvailableDrives.Count > 0;
                HasRemovableUsb = AvailableDrives.Any(d => d.IsRemovable && d.IsReady);

                // 4. 우선 드라이브 지정 또는 USB 우선 선택, 없으면 C: 기본 선택
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

                var usbMatch = AvailableDrives.FirstOrDefault(d => d.IsRemovable && d.IsReady);
                if (usbMatch != null)
                {
                    SelectedTargetDrive = usbMatch;
                }
                else
                {
                    // USB가 없을 경우 기본 C: 드라이브 또는 첫 번째 사용 가능 디스크 자동 선택
                    var cDrive = AvailableDrives.FirstOrDefault(d => d.Name.StartsWith("C", StringComparison.OrdinalIgnoreCase));
                    SelectedTargetDrive = cDrive ?? AvailableDrives.FirstOrDefault();
                }

                UpdateStatusMessage();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[RefreshDrives Error] {ex.Message}");
                // 예외 발생 시에도 C: 드라이브 기본 보장
                if (AvailableDrives.Count == 0)
                {
                    var fallbackC = new DriveItem
                    {
                        Name = @"C:\",
                        VolumeLabel = "로컬 디스크",
                        IsRemovable = false,
                        IsReady = true,
                        DeviceKind = "internal_fixed",
                        DeviceKindName = "내장 디스크"
                    };
                    AvailableDrives = new ObservableCollection<DriveItem> { fallbackC };
                    SelectedTargetDrive = fallbackC;
                    HasDrives = true;
                    HasRemovableUsb = false;
                }
                UpdateStatusMessage();
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

            for (int i = 0; i < list.Count; i++)
            {
                var c = list[i];
                c.IndexNumber = i + 1;
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
            OnPropertyChanged(nameof(HasCertificates));
            UpdateStatusMessage();
            (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }

        private void UpdateStatusMessage()
        {
            int selectedCount = FoundPcCertificates?.Count(x => x.IsSelected) ?? 0;

            if (SelectedTargetDrive == null)
            {
                StatusMessage = "목적지 디스크를 선택해 주세요.";
                ConfirmButtonText = "선택한 인증서 복사 시작";
                return;
            }

            if (SelectedTargetDrive.IsRemovable)
            {
                ConfirmButtonText = $"선택한 인증서 USB({SelectedTargetDrive.Name.TrimEnd('\\')})로 복사 시작";
            }
            else
            {
                ConfirmButtonText = $"선택한 인증서 디스크({SelectedTargetDrive.Name.TrimEnd('\\')})로 복사 시작";
            }

            if (selectedCount == 0)
            {
                StatusMessage = "복사할 PC 인증서를 1개 이상 체크(선택)해 주세요.";
            }
            else
            {
                string targetType = SelectedTargetDrive.IsRemovable ? "USB 메모리" : "로컬 디스크";
                StatusMessage = $"선택한 {selectedCount}건의 인증서를 목적지 {targetType}({SelectedTargetDrive.Name})로 복사할 준비가 되었습니다.";
            }
        }

        public async Task TransferToUsbAsync()
        {
            var selected = FoundPcCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any() || SelectedTargetDrive == null) return;

            IsBusy = true;
            string targetDriveName = SelectedTargetDrive.Name;
            bool isTargetUsb = SelectedTargetDrive.IsRemovable;
            StatusMessage = $"{targetDriveName} 드라이브로 {selected.Count}건의 인증서 복사 진행 중...";

            int success = 0;
            int failed = 0;
            var errorList = new List<string>();

            await Task.Run(() =>
            {
                string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\').ToUpperInvariant();
                string cleanTarget = targetDriveName.TrimEnd('\\').ToUpperInvariant();

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

                        // 대상이 C: 시스템 드라이브인 경우 표준 AppData\LocalLow로 안전 매핑
                        if (string.Equals(cleanTarget, sysRoot, StringComparison.OrdinalIgnoreCase))
                        {
                            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                            destinationRoot = Path.Combine(userProfile, "AppData", "LocalLow");
                        }

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
                string targetDesc = isTargetUsb ? "USB 메모리" : "로컬 디스크";
                var completeItems = selected.Select(c => new OperationCompleteItem
                {
                    Name = !string.IsNullOrWhiteSpace(c.CommonName) ? c.CommonName : "공동인증서",
                    IssuerAndPolicy = $"{c.IssuerName} · 만료일: {c.ValidTo:yyyy-MM-dd}"
                }).ToList();

                string sourcePath = selected.FirstOrDefault()?.DirectoryPath ?? "내 컴퓨터 (NPKI/GPKI)";
                string targetPath = targetDriveName.EndsWith("\\") ? $"{targetDriveName}NPKI" : $"{targetDriveName}\\NPKI";

                UserFriendlyMessageHelper.ShowOperationComplete(
                    "인증서 USB 복사 / 백업 완료!",
                    $"선택하신 인증서 {success}개가 {targetDriveName} ({targetDesc})로 안전하게 복사/백업되었습니다.",
                    success,
                    sourcePath,
                    targetPath,
                    completeItems,
                    "• USB 메모리를 타 PC에 연결하여 은행 및 공공기관 로그인 시 [이동식 디스크]를 선택하시면 즉시 사용하실 수 있습니다.\n• 분리 전 윈도우 우측 하단의 '하드웨어 안전하게 제거'를 누르시면 파일 손상을 예방할 수 있습니다.");

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
