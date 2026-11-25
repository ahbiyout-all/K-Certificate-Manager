using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using KCert.Core.Vault;
using KCertManager.Wpf.Common;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.Views;

namespace KCertManager.Wpf.ViewModels
{
    public class UsbTransferViewModel : ViewModelBase, IDisposable
    {
        private readonly CertificateScannerService _scannerService = new();
        private readonly CertificateBackupService _backupService = new();
        private readonly List<CertificateItem> _trackedCerts = new();
        private bool _disposed;

        private ObservableCollection<DriveItem> _availableDrives = new();
        private DriveItem? _selectedSourceDrive;
        private ObservableCollection<DriveItem> _availableTargetDrives = new();
        private DriveItem? _selectedTargetDrive;
        private ObservableCollection<CertificateItem> _foundUsbCertificates = new();
        private CertificateItem? _selectedCertificate;
        private string _targetUsername = Environment.UserName;
        private string _targetCategory = "NPKI";
        private bool _isBusy;
        private bool _hasUsbDrives;
        private int _scanGeneration;
        private string _statusMessage = "USB 드라이브를 선택하세요.";
        private string _confirmButtonText = "선택한 인증서 내 PC로 가져오기 시작";

        public event Action? TransferCompleted;

        /// <summary>
        /// XAML 파서 및 기본 바인딩용 매개변수 없는 생성자
        /// </summary>
        public UsbTransferViewModel() : this(null)
        {
        }

        public UsbTransferViewModel(string? initialDriveLetter)
        {
            RefreshDrivesCommand = new RelayCommand(() => RefreshDrives());
            ScanDriveCommand = new RelayCommand(async () => await ScanDriveAsync(), () => SelectedSourceDrive != null && SelectedSourceDrive.IsRemovable);
            TransferToPcCommand = new RelayCommand(
                async () => await TransferToPcAsync(),
                () => !IsBusy && FoundUsbCertificates.Any(x => x.IsSelected));
            SelectAllCommand = new RelayCommand(() =>
            {
                foreach (var c in FoundUsbCertificates) c.IsSelected = true;
                UpdateSelectionStatus();
                (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
            });
            ClearSelectionCommand = new RelayCommand(() =>
            {
                foreach (var c in FoundUsbCertificates) c.IsSelected = false;
                SelectedCertificate = null;
                UpdateSelectionStatus();
                (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
            });

            RefreshDrives(initialDriveLetter);
            RefreshTargetDrives();
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

        public ObservableCollection<DriveItem> AvailableTargetDrives
        {
            get => _availableTargetDrives;
            set => SetProperty(ref _availableTargetDrives, value);
        }

        public DriveItem? SelectedTargetDrive
        {
            get => _selectedTargetDrive;
            set
            {
                if (SetProperty(ref _selectedTargetDrive, value))
                {
                    (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public DriveItem? SelectedSourceDrive
        {
            get => _selectedSourceDrive;
            set
            {
                if (SetProperty(ref _selectedSourceDrive, value))
                {
                    (ScanDriveCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    if (value != null && value.IsRemovable)
                    {
                        _ = ScanDriveAsync();
                    }
                }
            }
        }

        public ObservableCollection<CertificateItem> FoundUsbCertificates
        {
            get => _foundUsbCertificates;
            set => SetProperty(ref _foundUsbCertificates, value);
        }

        public CertificateItem? SelectedCertificate
        {
            get => _selectedCertificate;
            set
            {
                if (SetProperty(ref _selectedCertificate, value))
                {
                    UpdateSelectionStatus();
                    (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public string TargetUsername
        {
            get => _targetUsername;
            set => SetProperty(ref _targetUsername, value);
        }

        public string TargetCategory
        {
            get => _targetCategory;
            set => SetProperty(ref _targetCategory, value);
        }

        public bool IsBusy
        {
            get => _isBusy;
            set
            {
                if (SetProperty(ref _isBusy, value))
                {
                    (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
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

        public string SelectedSummaryText
        {
            get
            {
                var checkedItems = FoundUsbCertificates?.Where(x => x.IsSelected).ToList() ?? new List<CertificateItem>();
                if (checkedItems.Count == 0)
                {
                    return "체크된 인증서 없음 (행 클릭 또는 체크박스로 선택)";
                }

                var names = checkedItems
                    .Select(x => string.IsNullOrWhiteSpace(x.CommonName) ? "공동인증서" : x.CommonName)
                    .Take(3)
                    .ToList();
                string nameList = string.Join(", ", names) + (checkedItems.Count > 3 ? $" 외 {checkedItems.Count - 3}건" : string.Empty);
                return $"총 {checkedItems.Count}건 선택됨 · {nameList}";
            }
        }

        public ICommand RefreshDrivesCommand { get; }
        public ICommand ScanDriveCommand { get; }
        public ICommand TransferToPcCommand { get; }
        public ICommand SelectAllCommand { get; }
        public ICommand ClearSelectionCommand { get; }

        public void RefreshDrives(string? preferredDriveLetter = null)
        {
            try
            {
                // 사용자 요청: USB가 컴퓨터에 없을 경우에 로컬 디스크(C: 등)가 보이지 않도록 하기!
                // USB ➔ PC 가져오기 창은 오직 실제 연결된 '이동식 USB 메모리(Removable)'만 필터링합니다.
                var usbDrives = UsbDriveWatcher.GetAvailableDrives()
                    .Where(d => d.IsRemovable && !d.IsCdRom && d.IsReady)
                    .OrderBy(d => d.Name)
                    .ToList();

                AvailableDrives = new ObservableCollection<DriveItem>(usbDrives);
                HasUsbDrives = AvailableDrives.Count > 0;

                if (!HasUsbDrives)
                {
                    SelectedSourceDrive = null;
                    StatusMessage = "연결된 USB가 없습니다. USB를 꽂은 뒤 [🔄 새로고침]을 눌러주세요.";
                    DetachCertEvents();
                    FoundUsbCertificates.Clear();
                    OnPropertyChanged(nameof(SelectedSummaryText));
                    ConfirmButtonText = "선택한 인증서 내 PC로 가져오기 시작";
                    (ScanDriveCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    return;
                }

                if (!string.IsNullOrEmpty(preferredDriveLetter))
                {
                    var match = AvailableDrives.FirstOrDefault(d =>
                        d.Name.StartsWith(preferredDriveLetter, StringComparison.OrdinalIgnoreCase) ||
                        preferredDriveLetter.StartsWith(d.Name, StringComparison.OrdinalIgnoreCase));
                    if (match != null)
                    {
                        SelectedSourceDrive = match;
                        return;
                    }
                }

                SelectedSourceDrive = AvailableDrives.FirstOrDefault();
            }
            catch (Exception ex)
            {
                HasUsbDrives = false;
                StatusMessage = $"USB 드라이브 목록 조회 중 오류: {ex.Message}";
                System.Diagnostics.Debug.WriteLine($"[UsbTransfer RefreshDrives Error] {ex.Message}");
            }
        }

        public void RefreshTargetDrives()
        {
            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\').ToUpperInvariant() + "\\";
            string sysLetter = sysRoot.TrimEnd('\\');
            try
            {
                var localDrives = UsbDriveWatcher.GetAvailableDrives()
                    .Where(d => d.IsReady && (d.IsFixed || d.Name.StartsWith(sysLetter, StringComparison.OrdinalIgnoreCase)))
                    .ToList();

                if (!localDrives.Any(d => d.Name.StartsWith(sysLetter, StringComparison.OrdinalIgnoreCase)))
                {
                    localDrives.Insert(0, new DriveItem { Name = sysRoot, VolumeLabel = $"로컬 디스크 ({sysLetter})", DriveType = DriveType.Fixed, IsReady = true });
                }

                AvailableTargetDrives = new ObservableCollection<DriveItem>(localDrives);
                SelectedTargetDrive = AvailableTargetDrives.FirstOrDefault(d => d.Name.StartsWith(sysLetter, StringComparison.OrdinalIgnoreCase)) ?? AvailableTargetDrives.FirstOrDefault();
            }
            catch
            {
                AvailableTargetDrives = new ObservableCollection<DriveItem>
                {
                    new DriveItem { Name = sysRoot, VolumeLabel = $"로컬 디스크 ({sysLetter})", DriveType = DriveType.Fixed, IsReady = true }
                };
                SelectedTargetDrive = AvailableTargetDrives.FirstOrDefault();
            }
        }

        public async Task ScanDriveAsync()
        {
            if (SelectedSourceDrive == null || !SelectedSourceDrive.IsRemovable)
            {
                StatusMessage = "연결된 USB 이동식 드라이브가 없습니다. USB 메모리를 PC에 연결해 주세요.";
                FoundUsbCertificates.Clear();
                (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                return;
            }

            if (!SelectedSourceDrive.IsReady)
            {
                StatusMessage = $"{SelectedSourceDrive.Name} 드라이브를 읽을 수 없습니다 (장치 준비 안 됨).";
                FoundUsbCertificates.Clear();
                return;
            }

            var sourceDrive = SelectedSourceDrive;
            var driveRoot = sourceDrive.Name;
            int scanGen = System.Threading.Interlocked.Increment(ref _scanGeneration);

            IsBusy = true;
            StatusMessage = $"{driveRoot} 드라이브 내 인증서(NPKI, GPKI, EPKI) 검색 중...";
            DetachCertEvents();
            FoundUsbCertificates.Clear();

            try
            {
                await Task.Run(async () =>
                {
                    try
                    {
                        var paths = new List<string>
                        {
                            driveRoot,
                            Path.Combine(driveRoot, "NPKI"),
                            Path.Combine(driveRoot, "GPKI"),
                            Path.Combine(driveRoot, "EPKI"),
                            Path.Combine(driveRoot, "공인인증서"),
                            Path.Combine(driveRoot, "공인인증서백업"),
                            Path.Combine(driveRoot, "인증서"),
                            Path.Combine(driveRoot, "인증서백업"),
                            Path.Combine(driveRoot, "Cert"),
                            Path.Combine(driveRoot, "Certificates"),
                            Path.Combine(driveRoot, "Backup"),
                            Path.Combine(driveRoot, "만료인증서"),
                            Path.Combine(driveRoot, "인증서_만료")
                        };

                        var certs = _scannerService.ScanCertificates(paths);
                        if (scanGen != _scanGeneration) return;

                        var validCerts = certs.Where(c =>
                        {
                            var cn = (c.CommonName ?? "").ToUpperInvariant();
                            var issuer = (c.IssuerName ?? "").ToUpperInvariant();
                            if (cn.Contains("WINDOWS OEM") || cn.Contains("WINDOWS PHONE") ||
                                issuer.Contains("WINDOWS OEM") || issuer.Contains("WINDOWS PHONE") ||
                                cn.Contains("OEM TEST") || cn.Contains("TEST ONLY"))
                            {
                                return false;
                            }
                            return true;
                        }).ToList();

                        for (int i = 0; i < validCerts.Count; i++)
                        {
                            var c = validCerts[i];
                            c.IndexNumber = i + 1;
                            c.IsRemovableMedia = true;
                            c.IsSelected = false;
                        }

                        Action applyResults = () =>
                        {
                            if (_disposed || scanGen != _scanGeneration) return;
                            DetachCertEvents();
                            foreach (var c in validCerts)
                            {
                                c.PropertyChanged += CertItem_PropertyChanged;
                                _trackedCerts.Add(c);
                            }
                            FoundUsbCertificates = new ObservableCollection<CertificateItem>(validCerts);
                            SelectedCertificate = null;
                            UpdateSelectionStatus();
                            if (FoundUsbCertificates.Count == 0)
                            {
                                StatusMessage = $"{driveRoot}에서 인증서(NPKI·GPKI·EPKI)를 찾지 못했습니다.";
                            }
                            else
                            {
                                StatusMessage = $"{driveRoot}에서 인증서 {FoundUsbCertificates.Count}건을 찾았습니다. 가져올 인증서를 체크하거나 행을 클릭해 선택하세요.";
                            }
                            (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                        };

                        var dispatcher = Application.Current?.Dispatcher;
                        if (dispatcher != null)
                        {
                            await dispatcher.InvokeAsync(applyResults);
                        }
                        else
                        {
                            applyResults();
                        }
                    }
                    catch (Exception ex)
                    {
                        if (scanGen != _scanGeneration) return;
                        var userErr = KCert.Core.Common.UserFriendlyError.Explain(ex, "USB 인증서 탐색");
                        var dispatcher = Application.Current?.Dispatcher;
                        Action setErrStatus = () =>
                        {
                            if (scanGen != _scanGeneration) return;
                            StatusMessage = $"USB 인증서 검색 안내: {userErr.Summary} ({userErr.ActionTip.Replace("\n", " ")})";
                        };
                        if (dispatcher != null)
                        {
                            await dispatcher.InvokeAsync(setErrStatus);
                        }
                        else
                        {
                            setErrStatus();
                        }
                    }
                });
            }
            finally
            {
                if (scanGen == _scanGeneration)
                {
                    IsBusy = false;
                }
            }
        }

        private static string ResolveTargetRootForCategory(
            string category,
            string? sourceDirectory,
            string targetDriveLetter,
            string username,
            string sysRoot,
            string userProfile)
        {
            string cleanDrive = (string.IsNullOrWhiteSpace(targetDriveLetter)
                ? "C"
                : targetDriveLetter.TrimEnd(':', '\\', '/')).ToUpperInvariant() + ":\\";

            bool isSystemDrive = string.Equals(cleanDrive, sysRoot, StringComparison.OrdinalIgnoreCase);

            bool isGpki = string.Equals(category, "GPKI", StringComparison.OrdinalIgnoreCase) ||
                          (!string.IsNullOrWhiteSpace(sourceDirectory) &&
                           Regex.IsMatch(sourceDirectory, @"(?:^|[\\/])GPKI(?:$|[\\/])", RegexOptions.IgnoreCase));

            if (!isSystemDrive)
            {
                if (Directory.Exists(cleanDrive))
                {
                    return cleanDrive;
                }
                return isGpki ? sysRoot : Path.Combine(userProfile, "AppData", "LocalLow");
            }

            if (isGpki)
            {
                return Directory.Exists(cleanDrive) ? cleanDrive : sysRoot;
            }

            string effectiveUser = string.IsNullOrWhiteSpace(username) ? Environment.UserName : username;
            if (!Directory.Exists(cleanDrive) ||
                string.Equals(effectiveUser, Environment.UserName, StringComparison.OrdinalIgnoreCase))
            {
                return Path.Combine(userProfile, "AppData", "LocalLow");
            }

            return Path.Combine(cleanDrive, "Users", effectiveUser, "AppData", "LocalLow");
        }

        private void UpdateSelectionStatus()
        {
            OnPropertyChanged(nameof(SelectedSummaryText));
            int checkedCount = FoundUsbCertificates?.Count(x => x.IsSelected) ?? 0;
            ConfirmButtonText = checkedCount > 0
                ? $"선택한 인증서({checkedCount}건) 내 PC로 가져오기 시작"
                : "선택한 인증서 내 PC로 가져오기 시작";

            if (IsBusy || FoundUsbCertificates == null || FoundUsbCertificates.Count == 0) return;

            if (checkedCount > 0)
            {
                if (checkedCount == 1)
                {
                    var single = FoundUsbCertificates.First(x => x.IsSelected);
                    StatusMessage = $"총 {FoundUsbCertificates.Count}건 중 1건 선택됨 ({single.CommonName}) — [내 PC로 가져오기 시작]을 눌러주세요.";
                }
                else
                {
                    StatusMessage = $"총 {FoundUsbCertificates.Count}건 중 {checkedCount}건 선택됨 — [내 PC로 가져오기 시작]을 눌러주세요.";
                }
            }
            else
            {
                StatusMessage = $"총 {FoundUsbCertificates.Count}건 검색됨 — 가져올 인증서를 체크하거나 행을 클릭해 선택하세요.";
            }
        }

        public async Task TransferToPcAsync()
        {
            var selected = FoundUsbCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any()) return;

            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\') + "\\";
            string sysLetterFallback = sysRoot.TrimEnd('\\');
            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string targetDrive = SelectedTargetDrive?.Name?.TrimEnd('\\') ?? sysLetterFallback;
            string selectedDriveShort = (string.IsNullOrWhiteSpace(targetDrive)
                ? sysLetterFallback.TrimEnd(':')
                : targetDrive.TrimEnd(':', '\\', '/')).ToUpperInvariant() + ":";
            string selectedDriveRoot = selectedDriveShort + "\\";
            string effectiveUsername = string.IsNullOrWhiteSpace(TargetUsername) ? Environment.UserName : TargetUsername;

            // 0. 자가 복사(동일 위치 복사) 사전 전체 검증
            bool isAllSelfCopy = selected.All(cert =>
            {
                if (string.IsNullOrWhiteSpace(cert.DirectoryPath)) return false;
                string cat = cert.Category.ToString();
                string targetRoot = ResolveTargetRootForCategory(cat, cert.DirectoryPath, targetDrive, effectiveUsername, sysRoot, userProfile);
                string relativePath = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                string destDir = Path.Combine(targetRoot, relativePath);
                string fullSourceDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd(Path.DirectorySeparatorChar);
                string fullTargetDir = Path.GetFullPath(destDir).TrimEnd(Path.DirectorySeparatorChar);
                return fullSourceDir.Equals(fullTargetDir, StringComparison.OrdinalIgnoreCase);
            });

            if (isAllSelfCopy)
            {
                try { System.Media.SystemSounds.Hand.Play(); } catch { }
                MessageBox.Show(
                    $"선택한 인증서가 이미 내 컴퓨터({selectedDriveShort})의 같은 폴더에 있습니다.\n\n다른 인증서나 저장 위치를 선택해 주세요.",
                    "같은 위치 복사 불가",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
                return;
            }

            IsBusy = true;
            StatusMessage = $"PC 보관함({selectedDriveShort})으로 {selected.Count}개 인증서 가져오는 중...";

            int success = 0;
            int selfCopySkipped = 0;
            int skippedDuplicates = 0;
            var copiedTargets = new List<CertificateItem>();
            var successfulDestinations = new List<string>();
            var destinationCategories = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var processedDestDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var failedReasons = new List<string>();

            await Task.Run(() =>
            {
                foreach (var cert in selected)
                {
                    try
                    {
                        if (cert == null || string.IsNullOrWhiteSpace(cert.DirectoryPath))
                        {
                            failedReasons.Add("인증서 원본 경로가 비어 있습니다.");
                            continue;
                        }

                        var cat = cert.Category.ToString();

                        string targetRoot = ResolveTargetRootForCategory(cat, cert.DirectoryPath, targetDrive, effectiveUsername, sysRoot, userProfile);
                        string relativePath = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                        string destDir = Path.Combine(targetRoot, relativePath);
                        string fullSourceDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                        string fullTargetDir = Path.GetFullPath(destDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

                        if (fullSourceDir.Equals(fullTargetDir, StringComparison.OrdinalIgnoreCase))
                        {
                            selfCopySkipped++;
                            continue;
                        }

                        if (processedDestDirs.Contains(fullTargetDir))
                        {
                            skippedDuplicates++;
                            continue;
                        }

                        var transferResult = _backupService.CopyCertificateToLocalPc(cert.DirectoryPath, cat, effectiveUsername, targetDrive);
                        if (transferResult.IsSuccess)
                        {
                            success++;
                            copiedTargets.Add(cert);
                            destinationCategories.Add(cat);
                            processedDestDirs.Add(fullTargetDir);
                            if (!string.IsNullOrWhiteSpace(transferResult.DestinationDirectory))
                            {
                                processedDestDirs.Add(Path.GetFullPath(transferResult.DestinationDirectory).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
                            }
                            successfulDestinations.Add(transferResult.DestinationDirectory);
                        }
                        else
                        {
                            string label = !string.IsNullOrWhiteSpace(cert.CommonName) ? cert.CommonName : Path.GetFileName(cert.DirectoryPath);
                            failedReasons.Add($"{label}: {transferResult.Message}");
                        }
                    }
                    catch (Exception ex)
                    {
                        string label = !string.IsNullOrWhiteSpace(cert?.CommonName) ? cert!.CommonName : "인증서";
                        failedReasons.Add($"{label}: {ex.Message}");
                        System.Diagnostics.Debug.WriteLine($"[CopyCert Error] {ex.Message}");
                    }
                }
            });

            int totalSkipped = selfCopySkipped + skippedDuplicates;
            IsBusy = false;
            StatusMessage = $"PC({selectedDriveShort}) 가져오기 완료: {selected.Count}개 중 {success}개 성공" +
                            (totalSkipped > 0 ? $", {totalSkipped}개 동일 위치·중복 건너뜀" : string.Empty) +
                            " (자동 새로고침 반영)";
            if (success > 0)
            {
                SoundService.PlayCompletionSound();
                TransferCompleted?.Invoke();
            }

            if (success + totalSkipped == selected.Count && success > 0)
            {
                var summaryTargets = copiedTargets.Any() ? copiedTargets : selected;
                var completeItems = summaryTargets.Select(c => new OperationCompleteItem
                {
                    Name = !string.IsNullOrWhiteSpace(c.CommonName) ? c.CommonName : "공동인증서",
                    IssuerAndPolicy = $"{c.IssuerName} · 만료일: {c.NotAfter:yyyy-MM-dd}"
                }).ToList();

                string sourcePath = summaryTargets.FirstOrDefault()?.DirectoryPath ?? "이동식 USB";
                string firstDest = successfulDestinations.FirstOrDefault(d => !string.IsNullOrEmpty(d)) ?? string.Empty;

                bool isAnyGpki = destinationCategories.Contains("GPKI") ||
                                 summaryTargets.Any(c => c.Category == CertCategory.GPKI) ||
                                 (!string.IsNullOrEmpty(firstDest) && Regex.IsMatch(firstDest, @"(?:^|[\\/])GPKI(?:$|[\\/])", RegexOptions.IgnoreCase));
                bool isAnyEpki = destinationCategories.Contains("EPKI") ||
                                 summaryTargets.Any(c => c.Category == CertCategory.EPKI) ||
                                 (!string.IsNullOrEmpty(firstDest) && Regex.IsMatch(firstDest, @"(?:^|[\\/])EPKI(?:$|[\\/])", RegexOptions.IgnoreCase));

                string gpkiTargetRoot = ResolveTargetRootForCategory("GPKI", null, targetDrive, effectiveUsername, sysRoot, userProfile);
                string localLowTargetRoot = ResolveTargetRootForCategory("NPKI", null, targetDrive, effectiveUsername, sysRoot, userProfile);

                string gpkiClass = summaryTargets.Any(c => c.Category == CertCategory.GPKI && c.IsClass1Path) &&
                                   !summaryTargets.Any(c => c.Category == CertCategory.GPKI && !c.IsClass1Path)
                    ? "class1" : "class2";
                string epkiClass = summaryTargets.Any(c => c.Category == CertCategory.EPKI && c.IsClass1Path) &&
                                   !summaryTargets.Any(c => c.Category == CertCategory.EPKI && !c.IsClass1Path)
                    ? "class1" : "class2";

                string targetPath;
                if (!string.IsNullOrEmpty(firstDest))
                {
                    targetPath = firstDest;
                }
                else if (isAnyGpki)
                {
                    targetPath = Path.Combine(gpkiTargetRoot, "GPKI", "Certificate", gpkiClass);
                }
                else if (isAnyEpki)
                {
                    targetPath = Path.Combine(localLowTargetRoot, "EPKI", "Certificate", epkiClass);
                }
                else
                {
                    targetPath = Path.Combine(localLowTargetRoot, "NPKI");
                }

                string gpkiDisplayPath = Path.Combine(gpkiTargetRoot, "GPKI", "Certificate", gpkiClass);
                string epkiDisplayPath = epkiClass == "class1"
                    ? Path.Combine(localLowTargetRoot, "EPKI", "Certificate", "class1")
                    : Path.Combine(localLowTargetRoot, "EPKI");
                string npkiDisplayPath = Path.Combine(localLowTargetRoot, "NPKI");

                string destCategoryName = isAnyGpki ? "공무원 인증서 (GPKI)" : (isAnyEpki ? "교육기관 인증서 (EPKI)" : "은행·공동 인증서 (NPKI)");
                string destLocationText = isAnyGpki
                    ? $"표준 폴더({gpkiDisplayPath})"
                    : (isAnyEpki ? $"표준 폴더({epkiDisplayPath})" : $"표준 폴더({npkiDisplayPath})");

                string subtitle = totalSkipped > 0
                    ? $"내 컴퓨터({selectedDriveShort})의 {destCategoryName} {destLocationText}에 인증서 {success}개를 가져왔습니다. (중복·자가복사 {totalSkipped}개 건너뜀)"
                    : $"내 컴퓨터({selectedDriveShort})의 {destCategoryName} {destLocationText}에 인증서 {success}개를 가져왔습니다.";

                string guideTip = isAnyGpki
                    ? $"• 표준 폴더({gpkiDisplayPath})에 저장되었습니다.\n• 정부24·온-나라 등 행정 사이트에서 바로 로그인할 수 있습니다."
                    : (isAnyEpki
                        ? $"• 표준 폴더({epkiDisplayPath})에 저장되었습니다.\n• 나이스(NEIS)·K-에듀파인에서 바로 로그인할 수 있습니다."
                        : $"• 내 컴퓨터({selectedDriveShort}) 표준 폴더({npkiDisplayPath})에 저장되었습니다.\n• 은행·공공 사이트에서 [하드디스크]를 선택해 바로 로그인하세요.");

                UserFriendlyMessageHelper.ShowOperationComplete(
                    "내 컴퓨터로 가져오기 완료!",
                    subtitle,
                    success,
                    sourcePath,
                    targetPath,
                    completeItems,
                    guideTip);
            }
            else if (totalSkipped == selected.Count)
            {
                UserFriendlyMessageHelper.ShowInfo(
                    $"선택한 인증서 {totalSkipped}개는 이미 대상 폴더({selectedDriveShort})와 동일한 위치에 있거나 중복되어 복사를 건너뛰었습니다.",
                    "동일 위치 건너뜀 안내");
            }
            else
            {
                int failedCount = Math.Max(0, selected.Count - success - totalSkipped);
                string reasonDetail = failedReasons.Any()
                    ? "\n\n[상세 오류 원인]\n• " + string.Join("\n• ", failedReasons.Take(5)) +
                      (failedReasons.Count > 5 ? $"\n• 외 {failedReasons.Count - 5}건" : string.Empty)
                    : string.Empty;
                UserFriendlyMessageHelper.ShowWarning(
                    $"인증서 {selected.Count}개 중 {success}개 성공, {failedCount}개 실패했습니다." +
                    (totalSkipped > 0 ? $" (동일 위치·중복 {totalSkipped}개 건너뜀)" : string.Empty),
                    "가져오기 결과 안내",
                    $"• PC 저장 폴더({selectedDriveShort})에 쓰기 권한이 있는지 확인하세요.\n• 필요하면 관리자 권한으로 프로그램을 다시 실행하세요.{reasonDetail}");
            }
        }

        private void CertItem_PropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (_disposed) return;
            if (e.PropertyName == nameof(CertificateItem.IsSelected))
            {
                Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                {
                    if (!_disposed)
                    {
                        UpdateSelectionStatus();
                        (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    }
                }));
            }
        }

        private void DetachCertEvents()
        {
            foreach (var c in _trackedCerts)
            {
                c.PropertyChanged -= CertItem_PropertyChanged;
            }
            _trackedCerts.Clear();
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            System.Threading.Interlocked.Increment(ref _scanGeneration);
            DetachCertEvents();
        }
    }
}
