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
using KCertManager.Wpf.Common;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using Microsoft.Win32;

namespace KCertManager.Wpf.ViewModels
{
    public class MainViewModel : ViewModelBase, IDisposable
    {
        private readonly CertificateScannerService _scannerService = new();
        private readonly CertificateBackupService _backupService = new();
        private readonly UsbDriveWatcher _driveWatcher = new();

        private ObservableCollection<CertificateItem> _allCertificates = new();
        private ObservableCollection<CertificateItem> _filteredCertificates = new();
        private ObservableCollection<DriveItem> _removableDrives = new();
        private ObservableCollection<DriveItem> _allDrives = new();
        private ObservableCollection<BackupHistoryItem> _backupHistory = new();
        private ObservableCollection<TrashItem> _trashItems = new();
        private List<string> _customSearchPaths = new();

        private CertificateItem? _selectedCertificate;
        private DriveItem? _selectedTargetDrive;
        private string _selectedFilter = "ALL";
        private string _searchKeyword = string.Empty;
        private bool _isBusy;
        private string _statusMessage = "준비 완료 (로컬 보안 격리)";
        private List<TrashItem> _lastDeletedBatch = new();
        private bool _canUndo;

        private bool _isDriveAdvancedMode;
        private bool _showAllDrivesInStatus;
        private string _currentTheme = "dark";

        public MainViewModel()
        {
            // Commands
            RefreshCommand = new RelayCommand(async () =>
            {
                UsbStorageGuard.InvalidateUsbCache();
                CertLocationScanner.ClearRemovableDriveCache();
                RefreshDrives();
                await RefreshCertificatesAsync();
            });
            BackupSelectedCommand = new RelayCommand(async () => await BackupSelectedAsync(), () => SelectedCertificatesCount > 0 || SelectedCertificate != null);
            BackupAllCommand = new RelayCommand(async () => await BackupAllAsync(), () => FilteredCertificates.Any() || _allCertificates.Any());
            DeleteSelectedCommand = new RelayCommand(DeleteSelected, () => SelectedCertificatesCount > 0 || SelectedCertificate != null);
            CleanExpiredCommand = new RelayCommand(CleanExpired, () => ExpiredCount > 0);
            UndoDeleteCommand = new RelayCommand(UndoDelete, () => CanUndo);
            SelectAllCommand = new RelayCommand<bool?>(SelectAll);
            QuickBackupToDriveCommand = new RelayCommand<DriveItem>(async (drive) => await QuickBackupToDriveAsync(drive));

            // Drive Watcher with debounced and safe event handling
            Action onDrivesChangedAction = () =>
            {
                try
                {
                    UsbStorageGuard.InvalidateUsbCache();
                    CertLocationScanner.ClearRemovableDriveCache();
                    RefreshDrives();
                    _ = RefreshCertificatesAsync();
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Drive Change Update Warning] {ex.Message}");
                }
            };

            _driveWatcher.DrivesChanged += (s, e) =>
            {
                Application.Current?.Dispatcher?.BeginInvoke(onDrivesChangedAction);
            };

            _driveWatcher.DriveArrived += (s, driveName) =>
            {
                Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                {
                    onDrivesChangedAction();
                    _ = RefreshCertificatesAsync();
                }));
            };

            _driveWatcher.DriveRemoved += (s, driveName) =>
            {
                Application.Current?.Dispatcher?.BeginInvoke(onDrivesChangedAction);
            };

            // Asynchronous deferred initialization to ensure lightning-fast window rendering (< 50ms)
            Task.Run(() =>
            {
                try
                {
                    // WMI 캐시 사전 예열 (백그라운드 비동기)
                    _ = KCert.Core.HardwareGuard.UsbStorageGuard.PrefetchUsbInterfaceDriveLettersAsync();
                    _driveWatcher.Start();
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[DriveWatcher Start Error] {ex.Message}");
                }

                Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                {
                    RefreshDrives();
                    RefreshTrash();
                    _ = RefreshCertificatesAsync();
                }));
            });
        }

        #region Properties

        public bool IsDriveAdvancedMode
        {
            get => _isDriveAdvancedMode;
            set
            {
                if (SetProperty(ref _isDriveAdvancedMode, value))
                {
                    OnPropertyChanged(nameof(IsDriveBasicMode));
                }
            }
        }

        public bool IsDriveBasicMode
        {
            get => !_isDriveAdvancedMode;
            set
            {
                if (value)
                {
                    IsDriveAdvancedMode = false;
                }
            }
        }

        public bool ShowAllDrivesInStatus
        {
            get => _showAllDrivesInStatus;
            set
            {
                if (SetProperty(ref _showAllDrivesInStatus, value))
                {
                    OnPropertyChanged(nameof(ShowOnlyUsbDrivesInStatus));
                    OnPropertyChanged(nameof(DisplayedStatusDrives));
                    OnPropertyChanged(nameof(ConnectedUsbCount));
                }
            }
        }

        public bool ShowOnlyUsbDrivesInStatus
        {
            get => !_showAllDrivesInStatus;
            set
            {
                if (value)
                {
                    ShowAllDrivesInStatus = false;
                }
            }
        }

        public ObservableCollection<DriveItem> AllDrives
        {
            get => _allDrives;
            set
            {
                if (SetProperty(ref _allDrives, value))
                {
                    OnPropertyChanged(nameof(DisplayedStatusDrives));
                }
            }
        }

        public ObservableCollection<DriveItem> DisplayedStatusDrives =>
            ShowAllDrivesInStatus ? (AllDrives ?? new ObservableCollection<DriveItem>()) : (RemovableDrives ?? new ObservableCollection<DriveItem>());

        public string CurrentTheme
        {
            get => _currentTheme;
            set
            {
                if (SetProperty(ref _currentTheme, value))
                {
                    ApplyTheme(value);
                    OnPropertyChanged(nameof(IsThemeDark));
                    OnPropertyChanged(nameof(IsThemeGray));
                    OnPropertyChanged(nameof(IsThemeWhite));
                    OnPropertyChanged(nameof(IsThemeBeige));
                    OnPropertyChanged(nameof(IsPastelWhite));
                    OnPropertyChanged(nameof(IsPastelGray));
                    OnPropertyChanged(nameof(IsPastelBlack));
                }
            }
        }

        public bool IsThemeDark
        {
            get => CurrentTheme == "dark" || CurrentTheme == "pastel-black";
            set { if (value) CurrentTheme = "dark"; }
        }

        public bool IsThemeGray
        {
            get => CurrentTheme == "gray" || CurrentTheme == "pastel-gray";
            set { if (value) CurrentTheme = "gray"; }
        }

        public bool IsThemeWhite
        {
            get => CurrentTheme == "white" || CurrentTheme == "pastel-white";
            set { if (value) CurrentTheme = "white"; }
        }

        public bool IsThemeBeige
        {
            get => CurrentTheme == "beige" || CurrentTheme == "pastel-beige";
            set { if (value) CurrentTheme = "beige"; }
        }

        public bool IsPastelWhite
        {
            get => IsThemeWhite;
            set => IsThemeWhite = value;
        }

        public bool IsPastelGray
        {
            get => IsThemeGray;
            set => IsThemeGray = value;
        }

        public bool IsPastelBlack
        {
            get => IsThemeDark;
            set => IsThemeDark = value;
        }

        public static void ApplyTheme(string themeName)
        {
            try
            {
                var app = Application.Current;
                if (app == null) return;

                var res = app.Resources;
                System.Windows.Media.Color bgDark, bgCard, bgCardHover, textPrimary, textSecondary, borderColor;

                if (themeName == "dark" || themeName == "pastel-black")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F1219");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1A1F2C");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#262E3F");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBD5E1");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2D3546");
                }
                else if (themeName == "gray" || themeName == "pastel-gray")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E2E8F0");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1F5F9");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#334155");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#94A3B8");
                }
                else if (themeName == "beige" || themeName == "pastel-beige")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F5F2EB");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#EEE9DE");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#292524");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#44403C");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D6CEBF");
                }
                else // white (pastel-white)
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1F5F9");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#334155");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBD5E1");
                }

                res["BgDark"] = bgDark;
                res["BgCard"] = bgCard;
                res["BgCardHover"] = bgCardHover;
                res["TextPrimary"] = textPrimary;
                res["TextSecondary"] = textSecondary;
                res["BorderColor"] = borderColor;

                res["BgDarkBrush"] = new System.Windows.Media.SolidColorBrush(bgDark);
                res["BgCardBrush"] = new System.Windows.Media.SolidColorBrush(bgCard);
                res["BgCardHoverBrush"] = new System.Windows.Media.SolidColorBrush(bgCardHover);
                res["TextPrimaryBrush"] = new System.Windows.Media.SolidColorBrush(textPrimary);
                res["TextSecondaryBrush"] = new System.Windows.Media.SolidColorBrush(textSecondary);
                res["BorderBrush"] = new System.Windows.Media.SolidColorBrush(borderColor);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[ApplyTheme Error] {ex.Message}");
            }
        }

        public ObservableCollection<CertificateItem> FilteredCertificates
        {
            get => _filteredCertificates;
            set => SetProperty(ref _filteredCertificates, value);
        }

        public ObservableCollection<DriveItem> RemovableDrives
        {
            get => _removableDrives;
            set
            {
                if (SetProperty(ref _removableDrives, value))
                {
                    OnPropertyChanged(nameof(HasUsbDrives));
                    OnPropertyChanged(nameof(ConnectedUsbCount));
                    OnPropertyChanged(nameof(DisplayedStatusDrives));
                }
            }
        }

        public ObservableCollection<BackupHistoryItem> BackupHistory
        {
            get => _backupHistory;
            set => SetProperty(ref _backupHistory, value);
        }

        public ObservableCollection<TrashItem> TrashItems
        {
            get => _trashItems;
            set
            {
                if (SetProperty(ref _trashItems, value))
                {
                    OnPropertyChanged(nameof(TrashCount));
                }
            }
        }

        public List<string> CustomSearchPaths
        {
            get => _customSearchPaths;
            set => _customSearchPaths = value;
        }

        public CertificateItem? SelectedCertificate
        {
            get => _selectedCertificate;
            set
            {
                if (SetProperty(ref _selectedCertificate, value))
                {
                    (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public DriveItem? SelectedTargetDrive
        {
            get => _selectedTargetDrive;
            set
            {
                if (SetProperty(ref _selectedTargetDrive, value))
                {
                    (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    (BackupAllCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public string SelectedFilter
        {
            get => _selectedFilter;
            set
            {
                if (SetProperty(ref _selectedFilter, value))
                {
                    ApplyFilter();
                }
            }
        }

        public string SearchKeyword
        {
            get => _searchKeyword;
            set
            {
                if (SetProperty(ref _searchKeyword, value))
                {
                    ApplyFilter();
                }
            }
        }

        public bool IsBusy
        {
            get => _isBusy;
            set => SetProperty(ref _isBusy, value);
        }

        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        public bool CanUndo
        {
            get => _canUndo;
            set
            {
                if (SetProperty(ref _canUndo, value))
                {
                    (UndoDeleteCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public bool HasUsbDrives => _removableDrives.Count > 0;
        public int ConnectedUsbCount => _removableDrives.Count;
        public int TotalCount => _allCertificates.Count;
        public int GpkiCount => _allCertificates.Count(x => x.Category == CertCategory.GPKI);
        public int EpkiCount => _allCertificates.Count(x => x.Category == CertCategory.EPKI);
        public int NpkiCount => _allCertificates.Count(x => x.Category == CertCategory.NPKI);
        public int ExpiredCount => _allCertificates.Count(x => x.Status == ExpiryStatus.Expired);
        public int ComputerCount => _allCertificates.Count(x => !x.IsRemovableMedia);
        public int UsbCount => _allCertificates.Count(x => x.IsRemovableMedia);
        public int CustomPathCount => _allCertificates.Count(x => x.IsCustomPath);
        public int SelectedCertificatesCount => _allCertificates.Count(x => x.IsSelected);
        public int TrashCount => _trashItems.Count;
        public int LogCount => ActivityLogService.Instance.Logs.Count;

        #endregion

        #region Commands

        public ICommand RefreshCommand { get; }
        public ICommand BackupSelectedCommand { get; }
        public ICommand BackupAllCommand { get; }
        public ICommand DeleteSelectedCommand { get; }
        public ICommand CleanExpiredCommand { get; }
        public ICommand UndoDeleteCommand { get; }
        public ICommand SelectAllCommand { get; }
        public ICommand QuickBackupToDriveCommand { get; }

        #endregion

        #region Methods

        public async Task RefreshCertificatesAsync(IEnumerable<string>? customPaths = null)
        {
            try
            {
                IsBusy = true;
                StatusMessage = "인증서 보관함 고속 스캔 중 (1단계 Fast-Pass)...";

                if (customPaths != null)
                {
                    _customSearchPaths = customPaths.ToList();
                }

                // 사용자 지정 경로가 전달된 경우 해당 경로로 집중 탐색
                if (_customSearchPaths.Count > 0)
                {
                    await Task.Run(() =>
                    {
                        var list = _scannerService.ScanCertificates(_customSearchPaths);
                        AttachCertEvents(list);
                        DispatchUpdateCertificates(list);
                    });
                    IsBusy = false;
                    StatusMessage = $"스캔 완료: 총 {TotalCount}개 인증서 발견됨.";
                    return;
                }

                // =========================================================================
                // [1단계 Fast-Pass]: 표준 경로만 0.05~0.1초 만에 즉시 스캔하여 화면 갱신
                // =========================================================================
                var fastList = await _scannerService.ScanFastPassAsync();
                AttachCertEvents(fastList);
                DispatchUpdateCertificates(fastList);

                IsBusy = false; // 사용자 UI 즉각 사용 가능하게 전환!
                StatusMessage = $"표준 인증서 {fastList.Count}개 즉시 감지됨 (비표준 심층 백그라운드 탐색 진행 중...)";

                // =========================================================================
                // [2단계 Deep-Pass]: 비표준 및 외장 디스크 심층 탐색을 백그라운드 비동기로 실행
                // =========================================================================
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var seenDers = new HashSet<string>(fastList.Select(x => Path.GetFullPath(x.DerFilePath)), StringComparer.OrdinalIgnoreCase);
                        var seenSigs = new HashSet<string>(fastList.Select(x => $"{x.DriveLetter}|{x.SerialNumber}|{x.IssuerName}|{x.SubjectDn}"), StringComparer.OrdinalIgnoreCase);

                        int newDiscovered = await _scannerService.ScanDeepPassBackgroundAsync(newItem =>
                        {
                            AttachCertEvent(newItem);
                            var dispatcher = Application.Current?.Dispatcher;
                            if (dispatcher != null)
                            {
                                dispatcher.BeginInvoke(new Action(() =>
                                {
                                    _allCertificates.Add(newItem);
                                    UpdateDriveCertificateCounts();
                                    ApplyFilter();
                                    UpdateCounts();
                                }));
                            }
                            else
                            {
                                _allCertificates.Add(newItem);
                                UpdateDriveCertificateCounts();
                                ApplyFilter();
                                UpdateCounts();
                            }
                        }, seenDers, seenSigs);

                        var dispatcherFinal = Application.Current?.Dispatcher;
                        Action updateStatusAction = () =>
                        {
                            StatusMessage = $"전체 스캔 완료: 총 {TotalCount}개 인증서 (PC: {ComputerCount}개, USB: {UsbCount}개" +
                                            (newDiscovered > 0 ? $", 비표준 {newDiscovered}개 추가 감지" : "") + ").";
                        };

                        if (dispatcherFinal != null)
                        {
                            await dispatcherFinal.InvokeAsync(updateStatusAction);
                        }
                        else
                        {
                            updateStatusAction();
                        }

                        ActivityLogService.Instance.Log(
                            LogCategory.SCAN,
                            LogLevel.SUCCESS,
                            "인증서 2단계 전체 스캔 완료",
                            $"총 {_allCertificates.Count}개 인증서 (Fast-Pass: {fastList.Count}개, Deep-Pass 추가: {newDiscovered}개)",
                            "Local System",
                            "Memory",
                            _allCertificates.Count);
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[Deep Scan Error] {ex.Message}");
                    }
                });
            }
            catch (Exception ex)
            {
                IsBusy = false;
                StatusMessage = $"스캔 중 알림: {ex.Message}";
                System.Diagnostics.Debug.WriteLine($"[RefreshCertificatesAsync Error] {ex.Message}");
            }
        }

        private void AttachCertEvents(IEnumerable<CertificateItem> items)
        {
            foreach (var item in items)
            {
                AttachCertEvent(item);
            }
        }

        private void AttachCertEvent(CertificateItem item)
        {
            item.PropertyChanged += (s, e) =>
            {
                if (e.PropertyName == nameof(CertificateItem.IsSelected))
                {
                    OnPropertyChanged(nameof(SelectedCertificatesCount));
                    (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            };
        }

        private void DispatchUpdateCertificates(List<CertificateItem> list)
        {
            var dispatcher = Application.Current?.Dispatcher;
            Action updateAction = () =>
            {
                _allCertificates = new ObservableCollection<CertificateItem>(list);
                UpdateDriveCertificateCounts();
                ApplyFilter();
                UpdateCounts();
            };

            if (dispatcher != null)
            {
                dispatcher.Invoke(updateAction);
            }
            else
            {
                updateAction();
            }
        }

        public void RefreshDrives()
        {
            try
            {
                UsbStorageGuard.InvalidateUsbCache();
                CertLocationScanner.ClearRemovableDriveCache();

                var all = UsbDriveWatcher.GetAvailableDrives();
                AllDrives = new ObservableCollection<DriveItem>(all);

                var drives = all.Where(d => d.IsRemovable).ToList();
                RemovableDrives = new ObservableCollection<DriveItem>(drives);
                UpdateDriveCertificateCounts();

                if (RemovableDrives.Count == 0)
                {
                    SelectedTargetDrive = null;
                }
                else if (SelectedTargetDrive == null || !RemovableDrives.Any(d => d.Name == SelectedTargetDrive.Name))
                {
                    SelectedTargetDrive = RemovableDrives.FirstOrDefault(d => d.IsReady) ?? RemovableDrives.FirstOrDefault();
                }
                else
                {
                    var current = RemovableDrives.FirstOrDefault(d => d.Name == SelectedTargetDrive.Name);
                    if (current != null)
                    {
                        SelectedTargetDrive = current;
                    }
                    else
                    {
                        SelectedTargetDrive = RemovableDrives.FirstOrDefault(d => d.IsReady) ?? RemovableDrives.FirstOrDefault();
                    }
                }
                OnPropertyChanged(nameof(DisplayedStatusDrives));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[RefreshDrives Error] {ex.Message}");
            }
            finally
            {
                (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                (BackupAllCommand as RelayCommand)?.RaiseCanExecuteChanged();
            }
        }

        /// <summary>
        /// 윈도우 하드웨어 메시지(WM_DEVICECHANGE) 수신 시 드라이브 및 인증서를 즉시 동기화합니다.
        /// </summary>
        public void HandleDeviceChanged(string? hintDrive = null)
        {
            _driveWatcher.TriggerDeviceChange(hintDrive);
        }

        private void UpdateDriveCertificateCounts()
        {
            if (_allCertificates == null) return;

            var drivesToUpdate = new List<DriveItem>();
            if (_allDrives != null)
            {
                foreach (var d in _allDrives)
                {
                    if (!drivesToUpdate.Contains(d)) drivesToUpdate.Add(d);
                }
            }
            if (_removableDrives != null)
            {
                foreach (var d in _removableDrives)
                {
                    if (!drivesToUpdate.Contains(d)) drivesToUpdate.Add(d);
                }
            }

            foreach (var drive in drivesToUpdate)
            {
                var driveLetter = drive.Name.TrimEnd('\\').ToUpperInvariant();
                var driveSlash = driveLetter + "\\";
                var count = _allCertificates.Count(c => 
                    (!string.IsNullOrEmpty(c.DriveLetter) && c.DriveLetter.TrimEnd('\\').Equals(driveLetter, StringComparison.OrdinalIgnoreCase)) || 
                    (!string.IsNullOrEmpty(c.DirectoryPath) && (c.DirectoryPath.StartsWith(driveSlash, StringComparison.OrdinalIgnoreCase) || c.DirectoryPath.StartsWith(drive.Name, StringComparison.OrdinalIgnoreCase))) ||
                    (drive.IsRemovable && c.IsRemovableMedia && !string.IsNullOrEmpty(c.DirectoryPath) && c.DirectoryPath.Contains(driveLetter, StringComparison.OrdinalIgnoreCase)));
                drive.CertificateCount = count;
            }

            OnPropertyChanged(nameof(DisplayedStatusDrives));
            OnPropertyChanged(nameof(ConnectedUsbCount));
        }

        public void RefreshTrash()
        {
            TrashItems = new ObservableCollection<TrashItem>(_backupService.GetTrashItems());
            OnPropertyChanged(nameof(TrashCount));
        }

        private void ApplyFilter()
        {
            var query = _allCertificates.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(SearchKeyword))
            {
                var kw = SearchKeyword.Trim();
                query = query.Where(x =>
                    x.CommonName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.IssuerName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.Organization.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.DirectoryPath.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    x.StorageLocationType.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    (kw.Equals("usb", StringComparison.OrdinalIgnoreCase) && x.IsRemovableMedia) ||
                    (kw.Equals("컴퓨터", StringComparison.OrdinalIgnoreCase) && !x.IsRemovableMedia) ||
                    (kw.Equals("pc", StringComparison.OrdinalIgnoreCase) && !x.IsRemovableMedia));
            }

            query = SelectedFilter switch
            {
                "GPKI" => query.Where(x => x.Category == CertCategory.GPKI),
                "EPKI" => query.Where(x => x.Category == CertCategory.EPKI),
                "NPKI" => query.Where(x => x.Category == CertCategory.NPKI),
                "EXPIRED" => query.Where(x => x.Status == ExpiryStatus.Expired),
                "PC" or "LOCAL" => query.Where(x => !x.IsRemovableMedia),
                "USB" or "REMOVABLE" => query.Where(x => x.IsRemovableMedia),
                "CUSTOM_PATH" or "NON_STANDARD" => query.Where(x => x.IsCustomPath),
                _ => query
            };

            FilteredCertificates = new ObservableCollection<CertificateItem>(query);
            UpdateCounts();
            (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (BackupAllCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }

        public void UpdateCounts()
        {
            OnPropertyChanged(nameof(TotalCount));
            OnPropertyChanged(nameof(GpkiCount));
            OnPropertyChanged(nameof(EpkiCount));
            OnPropertyChanged(nameof(NpkiCount));
            OnPropertyChanged(nameof(ExpiredCount));
            OnPropertyChanged(nameof(ComputerCount));
            OnPropertyChanged(nameof(UsbCount));
            OnPropertyChanged(nameof(CustomPathCount));
            OnPropertyChanged(nameof(SelectedCertificatesCount));
            OnPropertyChanged(nameof(TrashCount));
            OnPropertyChanged(nameof(LogCount));
            OnPropertyChanged(nameof(HasUsbDrives));
            OnPropertyChanged(nameof(ConnectedUsbCount));
        }

        private async Task QuickBackupToDriveAsync(DriveItem? drive)
        {
            if (drive == null) return;
            if (!drive.IsRemovable)
            {
                MessageBox.Show(
                    "USB 이동식 디스크만 원클릭 백업 대상으로 지정할 수 있습니다.",
                    "USB 드라이브 확인", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            SelectedTargetDrive = drive;

            if (SelectedCertificatesCount > 0 || SelectedCertificate != null)
            {
                await BackupSelectedAsync();
            }
            else
            {
                await BackupAllAsync();
            }
        }

        private async Task BackupSelectedAsync()
        {
            // USB 장치 재탐색 (혹시 방금 꽂혔는지 확인)
            if (SelectedTargetDrive == null || !SelectedTargetDrive.IsRemovable || !RemovableDrives.Any())
            {
                RefreshDrives();
            }

            // USB 미연결 시 명확한 안내 후 백업 중단
            if (SelectedTargetDrive == null || !SelectedTargetDrive.IsRemovable || !RemovableDrives.Any())
            {
                MessageBox.Show(
                    "현재 컴퓨터에 연결된 USB 이동식 드라이브가 없습니다.\n\n" +
                    "• 선택한 인증서를 백업할 USB 메모리를 컴퓨터(PC)에 연결해 주세요.\n" +
                    "• USB를 연결하신 후 2~3초 뒤 드라이브가 감지되면 다시 '선택 인증서 USB 백업'을 눌러주세요.\n\n" +
                    "※ USB가 연결되지 않은 상태에서는 백업이 진행되지 않습니다.",
                    "USB 드라이브 미연결 안내", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (!SelectedTargetDrive.IsReady)
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"선택한 USB 드라이브({SelectedTargetDrive.Name})에 접근할 수 없습니다.\n\n장치가 준비되지 않았거나 연결이 불안정합니다.",
                    "USB 드라이브 상태 확인",
                    "• USB 메모리가 컴퓨터 단자에 올바르게 연결되어 있는지 확인해 주세요.\n• 내 PC(파일 탐색기)에서 해당 드라이브가 정상 접근 가능한지 확인해 주세요.");
                return;
            }

            var selected = _allCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any() && SelectedCertificate != null)
            {
                selected.Add(SelectedCertificate);
            }

            if (!selected.Any())
            {
                MessageBox.Show("백업할 인증서를 1개 이상 선택(체크)해주세요.", "선택된 인증서 없음", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            IsBusy = true;
            StatusMessage = $"선택한 {selected.Count}개 인증서 백업 중...";

            int success = 0;
            var targetDriveName = SelectedTargetDrive.Name;

            await Task.Run(() =>
            {
                foreach (var cert in selected)
                {
                    try
                    {
                        var result = _backupService.BackupCertificateToDrive(cert, targetDriveName);
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, result)));
                        if (result.IsSuccess)
                        {
                            success++;
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.SUCCESS,
                                "인증서 USB 백업 완료",
                                $"소유자: {cert.CommonName}, SHA-256: {result.Sha256Hash}",
                                cert.DirectoryPath,
                                result.DestinationPath);
                        }
                        else
                        {
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.ERROR,
                                "인증서 USB 백업 실패",
                                result.Message,
                                cert.DirectoryPath,
                                targetDriveName);
                        }
                    }
                    catch (Exception ex)
                    {
                        var failResult = new BackupHistoryItem
                        {
                            CertCommonName = cert.CommonName,
                            SourcePath = cert.DirectoryPath,
                            TargetDrive = targetDriveName,
                            IsSuccess = false,
                            Message = $"백업 중 예외 발생: {ex.Message}"
                        };
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, failResult)));
                    }
                }
            });

            IsBusy = false;
            StatusMessage = $"백업 완료: {selected.Count}개 중 {success}개 성공 ({targetDriveName}) - 자동 새로고침 진행 중...";
            
            // 복사작업 성공 후 새로고침 자동으로 진행
            await RefreshCertificatesAsync();

            StatusMessage = $"백업 및 자동 새로고침 완료: {selected.Count}개 중 {success}개 성공 ({targetDriveName})";

            if (success == selected.Count)
            {
                UserFriendlyMessageHelper.ShowInfo(
                    $"선택하신 인증서 {success}개가 대상 드라이브({targetDriveName})로 안전하게 백업되었습니다.\n\n인증서 목록과 드라이브 상태가 최신 상태로 새로고침되었습니다.",
                    "인증서 USB 백업 완료");
            }
            else
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"인증서 {selected.Count}개 중 {success}개 성공, {selected.Count - success}개 실패하였습니다.\n\n인증서 목록이 자동으로 새로고침되었습니다.",
                    "인증서 백업 결과 안내",
                    "• USB 메모리의 '쓰기 금지(Lock)' 스위치가 켜져 있는지 확인해 주세요.\n• USB의 남은 저장 공간이 충분한지 확인해 주세요.\n• 권한 문제가 지속될 경우 관리자 권한으로 실행해 보세요.");
            }
        }

        private async Task BackupAllAsync()
        {
            // USB 장치 재탐색 (혹시 방금 꽂혔는지 확인)
            if (SelectedTargetDrive == null || !SelectedTargetDrive.IsRemovable || !RemovableDrives.Any())
            {
                RefreshDrives();
            }

            // USB 미연결 시 명확한 안내 후 중단 (절대 C: 등 로컬 PC 드라이브로 백업 금지)
            if (SelectedTargetDrive == null || !SelectedTargetDrive.IsRemovable || !RemovableDrives.Any())
            {
                MessageBox.Show(
                    "현재 컴퓨터에 연결된 USB 이동식 드라이브가 없습니다.\n\n" +
                    "• '전체 일괄 USB 백업'을 진행하려면 인증서를 저장할 USB 메모리를 컴퓨터(PC)에 연결해 주세요.\n" +
                    "• USB를 꽂으신 후 2~3초 뒤 드라이브가 감지되면 다시 '전체 일괄 USB 백업'을 눌러주세요.\n\n" +
                    "※ USB가 연결되지 않은 상태에서는 로컬 PC에 중복 저장되는 것을 방지하기 위해 백업이 진행되지 않습니다.",
                    "USB 이동식 드라이브 미연결 안내", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (!SelectedTargetDrive.IsReady)
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"선택한 USB 드라이브({SelectedTargetDrive.Name})에 접근할 수 없습니다.\n\n장치가 준비되지 않았거나 연결이 불안정합니다.",
                    "USB 드라이브 상태 확인",
                    "• USB 메모리가 컴퓨터 단자에 올바르게 연결되어 있는지 확인해 주세요.\n• 내 PC(파일 탐색기)에서 해당 드라이브가 정상 접근 가능한지 확인해 주세요.");
                return;
            }

            var list = _filteredCertificates.ToList();
            if (!list.Any())
            {
                list = _allCertificates.ToList();
            }

            if (!list.Any())
            {
                MessageBox.Show("백업할 인증서가 목록에 없습니다.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var targetDriveName = SelectedTargetDrive.Name;
            var confirm = MessageBox.Show(
                $"현재 표시된 {list.Count}개의 인증서를 USB 드라이브({targetDriveName})로 일괄 백업하시겠습니까?",
                "USB 일괄 백업 확인", MessageBoxButton.YesNo, MessageBoxImage.Question);

            if (confirm != MessageBoxResult.Yes) return;

            IsBusy = true;
            StatusMessage = $"전체 {list.Count}개 인증서 일괄 백업 중...";

            int success = 0;
            await Task.Run(() =>
            {
                foreach (var cert in list)
                {
                    try
                    {
                        var result = _backupService.BackupCertificateToDrive(cert, targetDriveName);
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, result)));
                        if (result.IsSuccess)
                        {
                            success++;
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.SUCCESS,
                                "인증서 일괄 백업 성공",
                                $"소유자: {cert.CommonName}",
                                cert.DirectoryPath,
                                result.DestinationPath);
                        }
                    }
                    catch (Exception ex)
                    {
                        var failResult = new BackupHistoryItem
                        {
                            CertCommonName = cert.CommonName,
                            SourcePath = cert.DirectoryPath,
                            TargetDrive = targetDriveName,
                            IsSuccess = false,
                            Message = $"일괄 백업 예외: {ex.Message}"
                        };
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, failResult)));
                    }
                }
            });

            IsBusy = false;
            StatusMessage = $"일괄 백업 완료: 총 {list.Count}개 중 {success}개 성공 - 자동 새로고침 진행 중...";
            
            // 복사작업 성공 후 새로고침 자동으로 진행
            await RefreshCertificatesAsync();

            StatusMessage = $"일괄 백업 및 자동 새로고침 완료: 총 {list.Count}개 중 {success}개 성공 ({targetDriveName})";

            if (success == list.Count)
            {
                UserFriendlyMessageHelper.ShowInfo(
                    $"전체 인증서 {success}개가 대상 드라이브({targetDriveName})로 안전하게 일괄 백업되었습니다.\n\n인증서 목록과 드라이브 상태가 최신 상태로 새로고침되었습니다.",
                    "일괄 백업 완료");
            }
            else
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"전체 {list.Count}개 중 {success}개 성공, {list.Count - success}개 실패하였습니다.\n\n인증서 목록이 자동으로 새로고침되었습니다.",
                    "일괄 백업 결과 안내",
                    "• USB 메모리가 쓰기 금지 상태인지 확인해 주세요.\n• USB의 저장 공간 및 연결 상태를 확인해 주세요.");
            }
        }

        /// <summary>
        /// Fix for partial deletion bug: Deletes ALL checked items if any are selected,
        /// or the highlighted SelectedCertificate if no checkboxes are active.
        /// </summary>
        private void DeleteSelected()
        {
            var toDelete = _allCertificates.Where(x => x.IsSelected).ToList();
            if (!toDelete.Any() && SelectedCertificate != null)
            {
                toDelete.Add(SelectedCertificate);
            }

            if (!toDelete.Any())
            {
                MessageBox.Show("삭제할 인증서를 선택해주세요.", "선택된 인증서 없음", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var promptMsg = toDelete.Count == 1
                ? $"인증서 [{toDelete[0].CommonName}]를 삭제(안전 격리 휴지통 이동)하시겠습니까?\n삭제 후 즉시 되돌릴 수 있습니다."
                : $"선택한 {toDelete.Count}개의 인증서를 모두 삭제(안전 격리 휴지통 이동)하시겠습니까?\n삭제 후 즉시 되돌릴 수 있습니다.";

            var confirm = MessageBox.Show(promptMsg, "인증서 삭제 확인", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            if (confirm != MessageBoxResult.Yes) return;

            try
            {
                _lastDeletedBatch.Clear();
                int deletedCount = 0;

                foreach (var cert in toDelete)
                {
                    var trashItem = _backupService.MoveToTrash(cert);
                    _lastDeletedBatch.Add(trashItem);
                    _allCertificates.Remove(cert);
                    deletedCount++;
                }

                ApplyFilter();
                UpdateCounts();
                RefreshTrash();
                UpdateDriveCertificateCounts();

                CanUndo = _lastDeletedBatch.Count > 0;
                StatusMessage = $"선택한 인증서 {deletedCount}개 휴지통으로 이동됨 (실행 취소 가능).";

                ActivityLogService.Instance.Log(
                    LogCategory.DELETE,
                    LogLevel.WARN,
                    "인증서 일괄 휴지통 격리",
                    $"총 {deletedCount}개 인증서 안전 격리 보관",
                    "Certificates",
                    "Trash",
                    deletedCount);
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "선택한 인증서 삭제 및 휴지통 격리");
            }
        }

        private void CleanExpired()
        {
            try
            {
                var expired = _allCertificates.Where(x => x.Status == ExpiryStatus.Expired).ToList();
                if (!expired.Any())
                {
                    MessageBox.Show("현재 시스템에 만료된 인증서가 없습니다.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                var dialog = new Views.ExpiredCleanupDialog(expired);
                if (Application.Current?.MainWindow != null && Application.Current.MainWindow.IsVisible)
                {
                    dialog.Owner = Application.Current.MainWindow;
                }

                if (dialog.ShowDialog() != true) return;

                var targets = dialog.SelectedCertificates;
                if (targets == null || !targets.Any()) return;

                _lastDeletedBatch.Clear();
                int count = 0;
                foreach (var cert in targets.ToList())
                {
                    var item = _backupService.MoveToTrash(cert);
                    _lastDeletedBatch.Add(item);
                    _allCertificates.Remove(cert);
                    count++;
                }

                ApplyFilter();
                UpdateCounts();
                RefreshTrash();
                UpdateDriveCertificateCounts();
                CanUndo = _lastDeletedBatch.Count > 0;
                StatusMessage = $"[{dialog.SelectedMediumName}] 만료 인증서 {count}개 정리 완료 (휴지통 격리 보관).";

                ActivityLogService.Instance.Log(
                    LogCategory.DELETE,
                    LogLevel.INFO,
                    "만료 인증서 안전 정리",
                    $"[{dialog.SelectedMediumName}] {count}개 만료 인증서 휴지통 격리",
                    "Certificates",
                    "Trash",
                    count);
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "만료된 인증서 안전 정리");
            }
        }

        private void UndoDelete()
        {
            if (!_lastDeletedBatch.Any()) return;

            int restoredCount = 0;
            foreach (var trashItem in _lastDeletedBatch)
            {
                if (_backupService.RestoreFromTrash(trashItem))
                {
                    restoredCount++;
                }
            }

            StatusMessage = $"삭제된 인증서 {restoredCount}개 복원 완료.";
            ActivityLogService.Instance.Log(
                LogCategory.RESTORE,
                LogLevel.SUCCESS,
                "삭제 실행 취소(되돌리기)",
                $"총 {restoredCount}개 인증서 원래 위치로 안전 복원 완료",
                "Trash",
                "Certificates",
                restoredCount);

            CanUndo = false;
            _lastDeletedBatch.Clear();
            _ = RefreshCertificatesAsync();
            RefreshTrash();
        }

        private void SelectAll(bool? select)
        {
            bool val = select ?? true;
            foreach (var c in _filteredCertificates)
            {
                c.IsSelected = val;
            }
            OnPropertyChanged(nameof(SelectedCertificatesCount));
            (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }

        public void Dispose()
        {
            try
            {
                _driveWatcher.Dispose();
            }
            catch { }
        }

        #endregion
    }
}
