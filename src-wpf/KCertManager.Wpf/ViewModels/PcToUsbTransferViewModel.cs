using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
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
    public class PcToUsbTransferViewModel : ViewModelBase, IDisposable
    {
        private PropertyChangedEventHandler? _certPropertyChangedHandler;
        private readonly CertificateScannerService _scannerService = new();
        private readonly CertificateBackupService _backupService = new();

        private ObservableCollection<DriveItem> _availableDrives = new();
        private DriveItem? _selectedTargetDrive;
        private ObservableCollection<CertificateItem> _foundPcCertificates = new();
        private CertificateItem? _selectedCertificate;
        private List<CertificateItem> _allPcCertificates = new();
        private bool _isSmartDeduplicated = true;
        private string _conflictOption = "overwrite";
        private bool _isBusy;
        private bool _hasDrives = true;
        private bool _hasRemovableUsb;
        private string _statusMessage = "복사할 대상 드라이브를 선택하세요.";
        private string _confirmButtonText = "선택한 인증서 복사 시작";

        public event Action? TransferCompleted;

        public bool IsSmartDeduplicated
        {
            get => _isSmartDeduplicated;
            set
            {
                if (SetProperty(ref _isSmartDeduplicated, value))
                {
                    ApplyDeduplicationFilter();
                }
            }
        }

        public PcToUsbTransferViewModel() : this(null, null, null)
        {
        }

        public PcToUsbTransferViewModel(IEnumerable<CertificateItem>? initialCertificates, IEnumerable<DriveItem>? initialDrives = null, string? initialDriveLetter = null)
        {
            RefreshDrivesCommand = new RelayCommand(() => RefreshDrives(null, initialDrives));
            TransferToUsbCommand = new RelayCommand(
                async () => await TransferToUsbAsync(),
                () => SelectedTargetDrive != null &&
                      !IsBusy &&
                      FoundPcCertificates.Any(x => x.IsSelected));
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

        public CertificateItem? SelectedCertificate
        {
            get => _selectedCertificate;
            set
            {
                if (SetProperty(ref _selectedCertificate, value))
                {
                    UpdateStatusMessage();
                    (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
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

        public string SelectedSummaryText
        {
            get
            {
                var checkedItems = FoundPcCertificates?.Where(x => x.IsSelected).ToList() ?? new List<CertificateItem>();
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
        public ICommand TransferToUsbCommand { get; }
        public ICommand SelectAllCommand { get; }
        public ICommand ClearSelectionCommand { get; }

        public void RefreshDrives(string? preferredDriveLetter = null, IEnumerable<DriveItem>? fallbackDrives = null)
        {
            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\').ToUpperInvariant() + "\\";
            string sysLetter = sysRoot.TrimEnd('\\');
            try
            {
                UsbStorageGuard.InvalidateUsbCache();

                var drives = new List<DriveItem>();

                // 1. UsbDriveWatcher로부터 사용 가능한 모든 드라이브 수집
                var scanned = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
                if (scanned.Any())
                {
                    var countByName = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    if (AvailableDrives != null)
                    {
                        foreach (var d in AvailableDrives.Where(x => x != null && !string.IsNullOrWhiteSpace(x.Name)))
                        {
                            var key = d.Name.Trim().TrimEnd('\\', '/');
                            countByName[key] = countByName.TryGetValue(key, out int cur) ? Math.Max(cur, d.CertificateCount) : d.CertificateCount;
                        }
                    }
                    if (fallbackDrives != null)
                    {
                        foreach (var d in fallbackDrives.Where(x => x != null && !string.IsNullOrWhiteSpace(x.Name)))
                        {
                            var key = d.Name.Trim().TrimEnd('\\', '/');
                            countByName[key] = countByName.TryGetValue(key, out int cur) ? Math.Max(cur, d.CertificateCount) : d.CertificateCount;
                        }
                    }

                    foreach (var sd in scanned)
                    {
                        var key = (sd.Name ?? string.Empty).Trim().TrimEnd('\\', '/');
                        if (sd.CertificateCount == 0 && countByName.TryGetValue(key, out int prevCount))
                        {
                            sd.CertificateCount = prevCount;
                        }
                    }
                    drives.AddRange(scanned);
                }
                else if (fallbackDrives != null && fallbackDrives.Any())
                {
                    drives.AddRange(fallbackDrives.Where(d => !d.IsCdRom));
                }

                // 2. 기본 시스템 드라이브가 누락된 경우 기본 시스템 드라이브 보장 추가
                if (!drives.Any(d => d.Name.StartsWith(sysLetter, StringComparison.OrdinalIgnoreCase)))
                {
                    drives.Insert(0, new DriveItem
                    {
                        Name = sysRoot,
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

                // 3. USB 드라이브 우선, 그 다음 시스템 드라이브 등 로컬 드라이브 순으로 정렬
                var sortedDrives = drives
                    .Where(d => d.IsReady)
                    .OrderByDescending(d => d.IsRemovable)
                    .ThenBy(d => d.Name)
                    .ToList();

                AvailableDrives = new ObservableCollection<DriveItem>(sortedDrives);
                HasDrives = AvailableDrives.Count > 0;
                HasRemovableUsb = AvailableDrives.Any(d => d.IsRemovable && d.IsReady);

                // 4. 우선 드라이브 지정 또는 USB 우선 선택, 없으면 시스템 드라이브 기본 선택
                if (!string.IsNullOrEmpty(preferredDriveLetter))
                {
                    var match = AvailableDrives.FirstOrDefault(d =>
                        d.Name.StartsWith(preferredDriveLetter, StringComparison.OrdinalIgnoreCase) ||
                        preferredDriveLetter.StartsWith(d.Name, StringComparison.OrdinalIgnoreCase));
                    if (match != null)
                    {
                        SelectedTargetDrive = match;
                        UpdateStatusMessage();
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
                    // USB가 없을 경우 기본 시스템 드라이브 또는 첫 번째 사용 가능 디스크 자동 선택
                    var sysDrive = AvailableDrives.FirstOrDefault(d => d.Name.StartsWith(sysLetter, StringComparison.OrdinalIgnoreCase));
                    SelectedTargetDrive = sysDrive ?? AvailableDrives.FirstOrDefault();
                }

                UpdateStatusMessage();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[RefreshDrives Error] {ex.Message}");
                // 예외 발생 시에도 시스템 드라이브 기본 보장
                if (AvailableDrives.Count == 0)
                {
                    var fallbackSys = new DriveItem
                    {
                        Name = sysRoot,
                        VolumeLabel = "로컬 디스크",
                        IsRemovable = false,
                        IsReady = true,
                        DeviceKind = "internal_fixed",
                        DeviceKindName = "내장 디스크"
                    };
                    AvailableDrives = new ObservableCollection<DriveItem> { fallbackSys };
                    SelectedTargetDrive = fallbackSys;
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
                list.AddRange(initialCertificates
                    .Where(c => c != null && c.Status != ExpiryStatus.Expired)
                    .Select(c => c.CreateIsolatedCopy()));
            }
            else
            {
                // Scan local PC default certificate paths
                try
                {
                    var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                    var sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\');
                    var progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                    var pcPaths = new List<string>
                    {
                        Path.Combine(userProfile, "AppData", "LocalLow", "NPKI"),
                        Path.Combine(userProfile, "AppData", "LocalLow", "GPKI"),
                        Path.Combine(userProfile, "AppData", "LocalLow", "EPKI"),
                        $@"{sysRoot}\NPKI",
                        $@"{sysRoot}\GPKI",
                        $@"{sysRoot}\EPKI"
                    };
                    if (!string.IsNullOrWhiteSpace(progFiles))
                    {
                        pcPaths.Add(Path.Combine(progFiles, "NPKI"));
                    }

                    var scanned = _scannerService.ScanCertificates(pcPaths);
                    list.AddRange(scanned.Where(c => !c.IsRemovableMedia && c.Status != ExpiryStatus.Expired));
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Scan PC Certs Error] {ex.Message}");
                }
            }

            DetachCertificateHandlers();
            _certPropertyChangedHandler = (s, e) =>
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

            foreach (var c in list)
            {
                c.PropertyChanged += _certPropertyChangedHandler;
            }

            _allPcCertificates = list;
            ApplyDeduplicationFilter();
        }

        private void DetachCertificateHandlers()
        {
            if (_certPropertyChangedHandler == null || _allPcCertificates == null) return;
            foreach (var c in _allPcCertificates)
            {
                c.PropertyChanged -= _certPropertyChangedHandler;
            }
        }

        public void Dispose()
        {
            DetachCertificateHandlers();
            _certPropertyChangedHandler = null;
        }

        private void ApplyDeduplicationFilter()
        {
            if (_allPcCertificates == null || _allPcCertificates.Count == 0)
            {
                FoundPcCertificates = new ObservableCollection<CertificateItem>();
                OnPropertyChanged(nameof(HasCertificates));
                UpdateStatusMessage();
                return;
            }

            var resultList = new List<CertificateItem>();

            if (_isSmartDeduplicated)
            {
                // 동일 인증서 그룹핑: 시리얼번호 + 소유자DN (또는 CommonName + IssuerName + NotAfter)
                var groups = _allPcCertificates.GroupBy(c =>
                {
                    var s = (c.SerialNumber ?? string.Empty).Trim().ToUpperInvariant();
                    var dn = (c.SubjectDn ?? string.Empty).Trim().ToUpperInvariant();
                    var cn = (c.CommonName ?? string.Empty).Trim().ToUpperInvariant();
                    var issuer = (c.IssuerName ?? string.Empty).Trim().ToUpperInvariant();
                    var exp = c.NotAfter.ToString("yyyyMMdd");
                    return !string.IsNullOrEmpty(s) && !string.IsNullOrEmpty(dn)
                        ? $"{s}|{dn}|{exp}"
                        : $"{cn}|{issuer}|{exp}";
                });

                foreach (var grp in groups)
                {
                    var count = grp.Count();
                    // 최적의 정규 표준 위치 우선 선정 로직
                    // 1순위: IsStandardPath && (C:\GPKI 또는 C:\EPKI)
                    // 2순위: IsStandardPath && AppData\LocalLow
                    // 3순위: 기타 IsStandardPath
                    // 4순위: 첫 번째 항목
                    var sysDriveUpper = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\').ToUpperInvariant();
                    var primary = grp.OrderByDescending(c =>
                    {
                        int score = 0;
                        var dir = (c.DirectoryPath ?? string.Empty).Replace('/', '\\').ToUpperInvariant();
                        if (c.IsStandardPath) score += 100;
                        if (dir.StartsWith(sysDriveUpper + @"\GPKI\") || dir.Equals(sysDriveUpper + @"\GPKI") ||
                            dir.StartsWith(sysDriveUpper + @"\EPKI\") || dir.Equals(sysDriveUpper + @"\EPKI")) score += 50;
                        else if (dir.Contains(@"\APPDATA\LOCALLOW\") || dir.EndsWith(@"\APPDATA\LOCALLOW")) score += 30;
                        return score;
                    }).First();

                    primary.DuplicateLocationsCount = count;
                    if (count > 1)
                    {
                        var otherDirs = grp.Where(x => x != primary).Select(x => x.DirectoryPath).Take(3);
                        primary.DuplicateLocationsDetails = $"동일 인증서 {count}개소 감지됨. 정규 표준 위치({primary.DirectoryPath}) 우선 선택됨. (기타 저장 위치: {string.Join(", ", otherDirs)})";
                    }
                    else
                    {
                        primary.DuplicateLocationsDetails = string.Empty;
                    }

                    resultList.Add(primary);
                }
            }
            else
            {
                foreach (var c in _allPcCertificates)
                {
                    c.DuplicateLocationsCount = 1;
                    c.DuplicateLocationsDetails = string.Empty;
                    resultList.Add(c);
                }
            }

            for (int i = 0; i < resultList.Count; i++)
            {
                var c = resultList[i];
                c.IndexNumber = i + 1;
                c.IsSelected = false;
            }

            FoundPcCertificates = new ObservableCollection<CertificateItem>(resultList);
            if (_selectedCertificate != null && !FoundPcCertificates.Contains(_selectedCertificate))
            {
                SelectedCertificate = null;
            }
            OnPropertyChanged(nameof(HasCertificates));
            UpdateStatusMessage();
            (TransferToUsbCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }

        private void UpdateStatusMessage()
        {
            OnPropertyChanged(nameof(SelectedSummaryText));
            var selected = FoundPcCertificates?.Where(x => x.IsSelected).ToList() ?? new List<CertificateItem>();
            int selectedCount = selected.Count;

            if (SelectedTargetDrive == null)
            {
                StatusMessage = "목적지 디스크를 선택해 주세요.";
                ConfirmButtonText = "선택한 인증서 복사 시작";
                return;
            }

            string targetDriveShort = SelectedTargetDrive.Name.TrimEnd('\\');
            if (SelectedTargetDrive.IsRemovable)
            {
                ConfirmButtonText = selectedCount > 0
                    ? $"선택한 인증서({selectedCount}건) USB({targetDriveShort})로 복사 시작"
                    : $"선택한 인증서 USB({targetDriveShort})로 복사 시작";
            }
            else
            {
                ConfirmButtonText = selectedCount > 0
                    ? $"선택한 인증서({selectedCount}건) 디스크({targetDriveShort})로 복사 시작"
                    : $"선택한 인증서 디스크({targetDriveShort})로 복사 시작";
            }

            if (selectedCount == 0)
            {
                StatusMessage = "복사할 인증서를 체크하거나 목록 행을 클릭해 선택하세요.";
            }
            else
            {
                var previewPlan = _backupService.BuildUnifiedTransferPlan(
                    selected,
                    SelectedTargetDrive,
                    ConflictOption,
                    checkPhysicalDiskForDuplicates: true);
                string targetType = SelectedTargetDrive.IsRemovable ? "USB 메모리" : "로컬 디스크";
                if (selectedCount == 1)
                {
                    var single = selected[0];
                    StatusMessage = $"1건 선택됨 ({single.CommonName}) · {targetType}({SelectedTargetDrive.Name}) · 계획: {previewPlan.Summary.PreviewSummaryText}";
                }
                else
                {
                    StatusMessage = $"{selectedCount}건 선택됨 · {targetType}({SelectedTargetDrive.Name}) · 계획: {previewPlan.Summary.PreviewSummaryText}";
                }
            }
        }

        public async Task TransferToUsbAsync()
        {
            var selected = FoundPcCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any() || SelectedTargetDrive == null) return;

            string targetDriveName = SelectedTargetDrive.Name;
            string targetDriveRoot = targetDriveName.TrimEnd('\\', '/') + "\\";
            bool isTargetUsb = SelectedTargetDrive.IsRemovable;

            var plan = _backupService.BuildUnifiedTransferPlan(
                selected,
                SelectedTargetDrive,
                ConflictOption,
                checkPhysicalDiskForDuplicates: true);

            // 0. 자가 복사(동일 위치 복사) 사전 전체 검증
            if (plan.Summary.IsAllSelfCopy)
            {
                try { System.Media.SystemSounds.Hand.Play(); } catch { }
                MessageBox.Show(
                    $"선택한 인증서가 이미 {targetDriveName}에 있습니다.\n\n다른 드라이브(USB 메모리 등)를 선택해 주세요.",
                    "같은 위치 복사 불가",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
                return;
            }

            IsBusy = true;
            StatusMessage = $"{targetDriveName} 드라이브로 사전 계획 실행 중 ({plan.Summary.PreviewSummaryText})...";

            try
            {
                TransferBatchExecutionResult? batchResult = null;
                await Task.Run(() =>
                {
                    batchResult = _backupService.ExecuteUnifiedTransferPlan(plan);
                });

                int success = batchResult?.SuccessCount ?? 0;
                int skipped = batchResult?.SkippedCount ?? 0;
                int failed = batchResult?.FailedCount ?? 0;
                var errorList = batchResult?.FailedMessages ?? new List<string>();
                var successfulDestinations = batchResult?.SuccessfulDestinations ?? new List<string>();
                var copiedTargets = new List<CertificateItem>();

                if (batchResult != null)
                {
                    static string GetCertLookupKey(CertificateItem c) =>
                        !string.IsNullOrWhiteSpace(c.DerFilePath) ? c.DerFilePath : (c.DirectoryPath ?? string.Empty);

                    var selectedByKey = selected
                        .Where(c => c != null && !string.IsNullOrWhiteSpace(GetCertLookupKey(c)))
                        .GroupBy(c => GetCertLookupKey(c), StringComparer.OrdinalIgnoreCase)
                        .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

                    foreach (var itemRes in batchResult.ItemResults.Where(r => r.IsSuccess && !r.WasSkipped))
                    {
                        selectedByKey.TryGetValue(itemRes.PlanItem.Source.Id, out var cert);
                        if (cert == null && !string.IsNullOrWhiteSpace(itemRes.PlanItem.Source.DerFilePath))
                        {
                            selectedByKey.TryGetValue(itemRes.PlanItem.Source.DerFilePath, out cert);
                        }
                        if (cert == null && !string.IsNullOrWhiteSpace(itemRes.PlanItem.Source.DirectoryPath))
                        {
                            cert = selected.FirstOrDefault(c =>
                                string.Equals(c.DirectoryPath, itemRes.PlanItem.Source.DirectoryPath, StringComparison.OrdinalIgnoreCase) &&
                                string.Equals(c.CommonName, itemRes.PlanItem.Source.CommonName, StringComparison.OrdinalIgnoreCase));
                        }
                        if (cert != null)
                        {
                            cert.IsRecentlyCopied = true;
                            copiedTargets.Add(cert);
                        }
                    }
                }

                StatusMessage = $"복사 완료 ({targetDriveName}): {selected.Count}건 중 {success}건 성공" +
                                (skipped > 0 ? $", {skipped}건 건너뜀" : string.Empty) +
                                (failed > 0 ? $", {failed}건 실패" : string.Empty);

                if (success > 0)
                {
                    TransferCompleted?.Invoke();
                }

                if (failed == 0 && success > 0)
                {
                    SoundService.PlayCompletionSound();
                    string targetDesc = isTargetUsb ? "USB 메모리" : "로컬 디스크";
                    var completeItems = copiedTargets.Select(c => new OperationCompleteItem
                    {
                        Name = !string.IsNullOrWhiteSpace(c.CommonName) ? c.CommonName : "공동인증서",
                        IssuerAndPolicy = $"{c.IssuerName} · 만료일: {c.NotAfter:yyyy-MM-dd}"
                    }).ToList();

                    string sourcePath = copiedTargets.FirstOrDefault()?.DirectoryPath ?? selected.FirstOrDefault()?.DirectoryPath ?? "내 컴퓨터 (NPKI/GPKI)";
                    string firstDest = successfulDestinations.FirstOrDefault(d => !string.IsNullOrEmpty(d)) ?? string.Empty;
                    var pathCandidates = copiedTargets.Any() ? copiedTargets : selected;
                    string gpkiClass = pathCandidates.Any(c => c.Category == CertCategory.GPKI && c.IsClass1Path) &&
                                       !pathCandidates.Any(c => c.Category == CertCategory.GPKI && !c.IsClass1Path)
                        ? "class1" : "class2";
                    string epkiClass = pathCandidates.Any(c => c.Category == CertCategory.EPKI && c.IsClass1Path) &&
                                       !pathCandidates.Any(c => c.Category == CertCategory.EPKI && !c.IsClass1Path)
                        ? "class1" : "class2";

                    string targetPath = !string.IsNullOrEmpty(firstDest)
                        ? firstDest
                        : (pathCandidates.Any(c => c.Category == CertCategory.GPKI)
                            ? Path.Combine(targetDriveRoot, "GPKI", "Certificate", gpkiClass)
                            : (pathCandidates.Any(c => c.Category == CertCategory.EPKI)
                                ? Path.Combine(targetDriveRoot, "EPKI", "Certificate", epkiClass)
                                : Path.Combine(targetDriveRoot, "NPKI")));

                    string subtitle = skipped > 0
                        ? $"{targetDriveName} ({targetDesc})에 인증서 {success}개를 안전하게 복사했습니다. (중복·자가복사 {skipped}개 건너뜀)"
                        : $"{targetDriveName} ({targetDesc})에 인증서 {success}개를 안전하게 복사했습니다.";

                    UserFriendlyMessageHelper.ShowOperationComplete(
                        "인증서 복사 완료!",
                        subtitle,
                        success,
                        sourcePath,
                        targetPath,
                        completeItems,
                        "• 다른 PC에서 USB를 꽂은 뒤 [이동식 디스크]를 선택해 로그인하세요.\n• 분리 전 작업 표시줄의 '하드웨어 안전하게 제거'를 눌러 주세요.");
                }
                else if (failed == 0 && skipped > 0)
                {
                    UserFriendlyMessageHelper.ShowInfo(
                        $"선택한 인증서 {skipped}개는 대상 드라이브({targetDriveName})에 이미 존재하여 중복 복사를 건너뛰었습니다.",
                        "중복 인증서 건너뜀 안내");
                }
                else
                {
                    SoundService.PlayErrorSound();
                    string detailText = errorList.Any() ? string.Join("\n", errorList) : "알 수 없는 쓰기 또는 경로 오류가 발생했습니다.";
                    string errMsg = $"{targetDriveName}: {selected.Count}개 중 {success}개 성공, {failed}개 실패" +
                                    (skipped > 0 ? $", {skipped}개 건너뜀" : string.Empty) +
                                    $"\n\n원인:\n{detailText}";
                    MessageBox.Show(errMsg, "복사 오류 안내", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
            catch (Exception ex)
            {
                SoundService.PlayErrorSound();
                StatusMessage = $"인증서 복사 중 오류: {ex.Message}";
                UserFriendlyMessageHelper.ShowError(ex, "인증서 복사 처리");
            }
            finally
            {
                IsBusy = false;
            }
        }
    }
}
