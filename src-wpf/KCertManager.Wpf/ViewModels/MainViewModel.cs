using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using KCert.Core.Discovery;
using KCert.Core.HardwareGuard;
using KCertManager.Wpf.Common;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.Views;
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
        private ObservableCollection<DriveItem> _availableTargetDrives = new();
        private ObservableCollection<DriveItem> _allDrives = new();
        private ObservableCollection<BackupHistoryItem> _backupHistory = new();
        private ObservableCollection<TrashItem> _trashItems = new();
        private List<string> _customSearchPaths = new();

        private CertificateItem? _selectedCertificate;
        private DriveItem? _selectedTargetDrive;
        private string _selectedFilter = "ALL";
        private string _searchKeyword = string.Empty;
        private bool _isBusy;
        private string _statusMessage = "준비 완료 (오프라인 보안)";
        private List<TrashItem> _lastDeletedBatch = new();
        private bool _canUndo;
        private int _scanGeneration;

        private bool _isSimpleMode = true;
        private bool _isDriveAdvancedMode;
        private bool _showAllDrivesInStatus;
        private string _currentTheme = "dark";
        private string _currentSortMember = "NotAfter";
        private bool _isSortAscending = true;
        private bool _isExpiryBannerDismissed;

        private bool _isSoundEnabled = true;
        private bool _isToastVisible;
        private string _toastMessage = string.Empty;
        private bool _toastHasIntegrityBadge;
        private string _toastFilePath = string.Empty;
        private string _toastFileSize = string.Empty;
        private CancellationTokenSource? _toastCts;
        private CancellationTokenSource? _scanCts;

        private bool _isGuidedWorkflowActive;
        private string _guidedWorkflowType = "pc_to_usb";
        private int _guidedWorkflowStep = 1;
        private string _guidedWorkflowTitle = "🚀 PC ➔ USB 백업 가이드 모션";
        private string _guidedWorkflowStepTitle = "1단계: 복사할 인증서 선택";
        private string _guidedWorkflowStepDescription = "목록에서 USB로 복사할 인증서를 선택(체크)해 주세요.";

        public MainViewModel()
        {
            // SettingsService로부터 저장된 사용자 환경설정(테마, 사운드, 시작가이드, 모드) 복원
            var settings = SettingsService.Instance.Settings;
            _currentTheme = settings.Theme ?? "dark";
            _isSoundEnabled = settings.IsSoundEnabled;
            _soundVolume = settings.SoundVolume;
            _showHeaderSoundBar = settings.ShowHeaderSoundBar;
            _isSimpleMode = settings.IsSimpleMode;
            _dontShowStartupWorkflowAgain = settings.DontShowStartupWorkflowAgain;
            _excludeLocalLowGpkiScan = settings.ExcludeLocalLowGpkiScan;
            _autoOpenUsbFolderOnComplete = settings.AutoOpenUsbFolderOnComplete;

            // 앱 시작 시 초기 테마 리소스 완전 강제 적용 (시작 시 브러시 누락 방지)
            ApplyTheme(_currentTheme);

            // Commands
            RefreshCommand = new RelayCommand(async () =>
            {
                UsbStorageGuard.InvalidateUsbCache();
                CertLocationScanner.ClearRemovableDriveCache();
                _ = RefreshDrivesAsync();
                await RefreshCertificatesAsync();
            });
            BackupSelectedCommand = new RelayCommand(async () => await BackupSelectedAsync(), () => SelectedCertificatesCount > 0 || SelectedCertificate != null);
            BackupAllCommand = new RelayCommand(async () => await BackupAllAsync(), () => FilteredCertificates.Any());
            DeleteSelectedCommand = new RelayCommand(DeleteSelected, () => SelectedCertificatesCount > 0 || SelectedCertificate != null);
            CleanExpiredCommand = new RelayCommand(CleanExpired, () => ExpiredCount > 0);
            UndoDeleteCommand = new RelayCommand(UndoDelete, () => CanUndo);
            SelectAllCommand = new RelayCommand<bool?>(SelectAll);
            QuickBackupToDriveCommand = new RelayCommand<DriveItem>(async (drive) => await QuickBackupToDriveAsync(drive));
            EjectDriveCommand = new RelayCommand<DriveItem>(ExecuteEjectDrive);
            DismissExpiryBannerCommand = new RelayCommand(() =>
            {
                _isExpiryBannerDismissed = true;
                OnPropertyChanged(nameof(HasExpiryAlert));
            });
            CheckUpdatesCommand = new RelayCommand(async () => await CheckForAppUpdatesAsync());
            ShowStartupWorkflowCommand = new RelayCommand(ShowStartupWorkflowDialog);
            CloseToastCommand = new RelayCommand(() => IsToastVisible = false);
            ToggleSoundCommand = new RelayCommand(() => ToggleSound());
            TestSoundCommand = new RelayCommand(() => PlayTestSound());

            StartGuidedWorkflowCommand = new RelayCommand<string>(async t => await StartGuidedWorkflowAsync(t));
            NextGuidedStepCommand = new RelayCommand(NextGuidedStep);
            PrevGuidedStepCommand = new RelayCommand(PrevGuidedStep);
            EndGuidedWorkflowCommand = new RelayCommand(EndGuidedWorkflow);
            GuidedExecuteCopyCommand = new RelayCommand(ExecuteGuidedCopy);

            ToggleCertificateDetailSidebarCommand = new RelayCommand(() => IsCertificateDetailSidebarVisible = !IsCertificateDetailSidebarVisible);
            CloseCertificateDetailSidebarCommand = new RelayCommand(() => IsCertificateDetailSidebarVisible = false);
            CopySelectedCertDetailsCommand = new RelayCommand(CopySelectedCertDetails);
            OpenSelectedCertDirectoryCommand = new RelayCommand(OpenSelectedCertDirectory);

            // Drive Watcher with debounced and non-blocking async event handling
            Action onDrivesChangedAction = () =>
            {
                try
                {
                    UsbStorageGuard.InvalidateUsbCache();
                    CertLocationScanner.ClearRemovableDriveCache();
                    _ = RefreshDrivesAsync();
                    _ = RefreshCertificatesAsync();
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Drive Change Update Warning] {ex.Message}");
                }
            };

            // UsbStorageGuard already fires DrivesChanged alongside DriveArrived/DriveRemoved for the same debounced batch;
            // subscribe only to DrivesChanged to prevent duplicate scan cancellation storms.
            _driveWatcher.DrivesChanged += (s, e) =>
            {
                onDrivesChangedAction();
            };

            // Start local certificate discovery, drive discovery, trash refresh, and hardware watcher concurrently without blocking UI thread
            _ = RefreshCertificatesAsync();
            _ = RefreshDrivesAsync();
            _ = RefreshTrashAsync();

            _ = Task.Run(async () =>
            {
                try
                {
                    // WMI/DeviceIoControl USB 캐시 사전 예열 및 드라이브 감시기 백그라운드 시작
                    _ = UsbStorageGuard.PrefetchUsbInterfaceDriveLettersAsync();
                    _driveWatcher.Start();
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[DriveWatcher Start Error] {ex.Message}");
                }

                // 앱 시작 시 백그라운드 자동 업데이트 확인 및 사용자 알림 팝업 창 연동
                try
                {
                    await Task.Delay(1200);
                    bool hasUpdate = await CheckForAppUpdatesAsync(isSilentWhenUpToDate: true);

                    // 새 버전 업데이트 팝업이 표시되지 않은 일반 최신 상태인 경우에만 시작 작업 선택 창 다이얼로그 안내
                    if (!hasUpdate && !DontShowStartupWorkflowAgain)
                    {
                        DispatchSafe(() =>
                        {
                            ShowStartupWorkflowDialog();
                        });
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Startup Auto Update Check] {ex.Message}");
                }
            });
        }

        private static void DispatchSafe(Action action)
        {
            var dispatcher = Application.Current?.Dispatcher;
            if (dispatcher == null || dispatcher.HasShutdownStarted || dispatcher.HasShutdownFinished)
            {
                return;
            }
            if (dispatcher.CheckAccess())
            {
                action();
            }
            else
            {
                dispatcher.BeginInvoke(action);
            }
        }

        private static Task DispatchSafeAsync(Action action)
        {
            var dispatcher = Application.Current?.Dispatcher;
            if (dispatcher == null || dispatcher.HasShutdownStarted || dispatcher.HasShutdownFinished)
            {
                return Task.CompletedTask;
            }
            if (dispatcher.CheckAccess())
            {
                action();
                return Task.CompletedTask;
            }
            return dispatcher.InvokeAsync(action).Task;
        }

        private static string? SafeGetFullPath(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return null;
            try
            {
                return Path.GetFullPath(path);
            }
            catch
            {
                return path.Trim();
            }
        }

        #region Properties

        public bool IsSimpleMode
        {
            get => _isSimpleMode;
            set
            {
                if (SetProperty(ref _isSimpleMode, value))
                {
                    SettingsService.Instance.IsSimpleMode = value;
                    OnPropertyChanged(nameof(IsAdvancedUIMode));
                }
            }
        }

        public bool IsAdvancedUIMode
        {
            get => !_isSimpleMode;
            set
            {
                if (value)
                {
                    IsSimpleMode = false;
                }
                else
                {
                    IsSimpleMode = true;
                }
            }
        }

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

        private int _soundVolume = 40;
        public int SoundVolume
        {
            get => _soundVolume;
            set
            {
                if (SetProperty(ref _soundVolume, value))
                {
                    SettingsService.Instance.SoundVolume = value;
                    if (value > 0 && !_isSoundEnabled)
                    {
                        _isSoundEnabled = true;
                        SettingsService.Instance.IsSoundEnabled = true;
                        OnPropertyChanged(nameof(IsSoundEnabled));
                    }
                    OnPropertyChanged(nameof(SoundVolumeText));
                    OnPropertyChanged(nameof(SoundIcon));
                }
            }
        }

        public string SoundVolumeText => IsSoundEnabled && SoundVolume > 0 ? $"{SoundVolume}%" : "OFF";
        public string SoundIcon => IsSoundEnabled && SoundVolume > 0 ? (SoundVolume > 50 ? "🔊" : "🔉") : "🔇";

        public bool IsSoundEnabled
        {
            get => _isSoundEnabled;
            set
            {
                if (SetProperty(ref _isSoundEnabled, value))
                {
                    SettingsService.Instance.IsSoundEnabled = value;
                    OnPropertyChanged(nameof(SoundVolumeText));
                    OnPropertyChanged(nameof(SoundIcon));
                }
            }
        }

        private bool _showHeaderSoundBar = false;
        public bool ShowHeaderSoundBar
        {
            get => _showHeaderSoundBar;
            set
            {
                if (SetProperty(ref _showHeaderSoundBar, value))
                {
                    SettingsService.Instance.ShowHeaderSoundBar = value;
                }
            }
        }

        private bool _dontShowStartupWorkflowAgain = false;
        public bool DontShowStartupWorkflowAgain
        {
            get => _dontShowStartupWorkflowAgain;
            set
            {
                if (SetProperty(ref _dontShowStartupWorkflowAgain, value))
                {
                    SettingsService.Instance.DontShowStartupWorkflowAgain = value;
                }
            }
        }

        private bool _excludeLocalLowGpkiScan = true;
        public bool ExcludeLocalLowGpkiScan
        {
            get => _excludeLocalLowGpkiScan;
            set
            {
                if (SetProperty(ref _excludeLocalLowGpkiScan, value))
                {
                    SettingsService.Instance.ExcludeLocalLowGpkiScan = value;
                    KCert.Core.Discovery.CertLocationScanner.ExcludeLocalLowGpkiScan = value;
                    _ = RefreshCertificatesAsync();
                }
            }
        }

        private bool _autoOpenUsbFolderOnComplete = false;
        public bool AutoOpenUsbFolderOnComplete
        {
            get => _autoOpenUsbFolderOnComplete;
            set
            {
                if (SetProperty(ref _autoOpenUsbFolderOnComplete, value))
                {
                    SettingsService.Instance.AutoOpenUsbFolderOnComplete = value;
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

        public ICommand ShowStartupWorkflowCommand { get; }
        public ICommand CloseToastCommand { get; }
        public ICommand ToggleSoundCommand { get; }
        public ICommand TestSoundCommand { get; }
        public ICommand StartGuidedWorkflowCommand { get; }
        public ICommand NextGuidedStepCommand { get; }
        public ICommand PrevGuidedStepCommand { get; }
        public ICommand EndGuidedWorkflowCommand { get; }
        public ICommand GuidedExecuteCopyCommand { get; }

        public ICommand ToggleCertificateDetailSidebarCommand { get; }
        public ICommand CloseCertificateDetailSidebarCommand { get; }
        public ICommand CopySelectedCertDetailsCommand { get; }
        public ICommand OpenSelectedCertDirectoryCommand { get; }

        public event Action<IList<CertificateItem>>? RequestOpenTargetDrivePicker;

        private bool _isCertificateDetailSidebarVisible = false;
        public bool IsCertificateDetailSidebarVisible
        {
            get => _isCertificateDetailSidebarVisible;
            set => SetProperty(ref _isCertificateDetailSidebarVisible, value);
        }

        public bool IsToastVisible
        {
            get => _isToastVisible;
            set => SetProperty(ref _isToastVisible, value);
        }

        public string ToastMessage
        {
            get => _toastMessage;
            set => SetProperty(ref _toastMessage, value);
        }

        public bool ToastHasIntegrityBadge
        {
            get => _toastHasIntegrityBadge;
            set => SetProperty(ref _toastHasIntegrityBadge, value);
        }

        public bool IsGuidedWorkflowActive
        {
            get => _isGuidedWorkflowActive;
            set => SetProperty(ref _isGuidedWorkflowActive, value);
        }

        public string GuidedWorkflowType
        {
            get => _guidedWorkflowType;
            set => SetProperty(ref _guidedWorkflowType, value);
        }

        public int GuidedWorkflowStep
        {
            get => _guidedWorkflowStep;
            set => SetProperty(ref _guidedWorkflowStep, value);
        }

        public string GuidedWorkflowTitle
        {
            get => _guidedWorkflowTitle;
            set => SetProperty(ref _guidedWorkflowTitle, value);
        }

        public string GuidedWorkflowStepTitle
        {
            get => _guidedWorkflowStepTitle;
            set => SetProperty(ref _guidedWorkflowStepTitle, value);
        }

        public string GuidedWorkflowStepDescription
        {
            get => _guidedWorkflowStepDescription;
            set => SetProperty(ref _guidedWorkflowStepDescription, value);
        }

        public string ToastFilePath
        {
            get => _toastFilePath;
            set => SetProperty(ref _toastFilePath, value);
        }

        public string ToastFileSize
        {
            get => _toastFileSize;
            set => SetProperty(ref _toastFileSize, value);
        }

        public void ShowToast(string message, bool hasIntegrityBadge = false, string filePath = "", string fileSize = "")
        {
            var prevCts = _toastCts;
            prevCts?.Cancel();
            prevCts?.Dispose();
            _toastCts = new System.Threading.CancellationTokenSource();
            var token = _toastCts.Token;

            ToastMessage = message;
            ToastHasIntegrityBadge = hasIntegrityBadge;
            ToastFilePath = filePath;
            ToastFileSize = fileSize;
            IsToastVisible = true;

            Task.Delay(7000, token).ContinueWith(t =>
            {
                if (!t.IsCanceled)
                {
                    DispatchSafe(() => IsToastVisible = false);
                }
            }, TaskScheduler.Default);
        }

        public void ShowStartupWorkflowDialog()
        {
            DispatchSafe(() =>
            {
                try
                {
                    var dialog = new Views.StartupWorkflowDialog
                    {
                        Owner = Application.Current?.MainWindow
                    };
                    bool? showResult = dialog.ShowDialog();
                    if (!dialog.AlwaysShowOnStartup)
                    {
                        DontShowStartupWorkflowAgain = true;
                    }

                    if (showResult == true)
                    {
                        if (dialog.SelectedResult == Views.StartupWorkflowResult.PcToUsb)
                        {
                            _ = StartGuidedWorkflowAsync("pc_to_usb");
                        }
                        else if (dialog.SelectedResult == Views.StartupWorkflowResult.UsbToPc)
                        {
                            _ = StartGuidedWorkflowAsync("usb_to_pc");
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[StartupWorkflowDialog Error] {ex.Message}");
                }
            });
        }

        public void StartGuidedWorkflow(string? type)
        {
            _ = StartGuidedWorkflowAsync(type);
        }

        public async Task StartGuidedWorkflowAsync(string? type)
        {
            try
            {
                GuidedWorkflowType = type ?? "pc_to_usb";
                IsGuidedWorkflowActive = true;
                GuidedWorkflowStep = 1;

                if (GuidedWorkflowType == "pc_to_usb")
                {
                    GuidedWorkflowTitle = "🚀 시작가이드: PC ➔ USB 백업";
                    GuidedWorkflowStepTitle = "1단계: 복사할 PC 유효 인증서 선택 및 대상 USB 지정";
                    GuidedWorkflowStepDescription = "컴퓨터에 보관된 유효한 공인인증서만 필터링하여 USB 메모리로 안전하게 복사/백업합니다.";

                    await DispatchSafeAsync(() =>
                    {
                        SelectedFilter = "ALL";
                        SearchKeyword = string.Empty;
                        ApplyFilter();
                    });

                    var sysDrivePrefix = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\').ToUpperInvariant();
                    bool IsLocalPcCert(CertificateItem c) =>
                        !c.IsRemovableMedia ||
                        string.Equals(c.DriveLetter?.TrimEnd('\\'), sysDrivePrefix, StringComparison.OrdinalIgnoreCase) ||
                        (!string.IsNullOrEmpty(c.DirectoryPath) && c.DirectoryPath.StartsWith(sysDrivePrefix, StringComparison.OrdinalIgnoreCase));

                    var pcCerts = _allCertificates
                        .Where(c => IsLocalPcCert(c) && c.Status != ExpiryStatus.Expired)
                        .ToList();

                    // _allCertificates가 아직 비어 있거나 스캔 대기 중인 경우 백그라운드 스레드에서 표준 PC 경로 즉시 고속 스캔
                    if (!pcCerts.Any())
                    {
                        try
                        {
                            var fastList = await Task.Run(() => _scannerService.ScanCertificates(CertLocationScanner.GetLocalProfileFastRoots()));
                            pcCerts = fastList
                                .Where(c => IsLocalPcCert(c) && c.Status != ExpiryStatus.Expired)
                                .ToList();

                            await DispatchSafeAsync(() =>
                            {
                                foreach (var item in fastList)
                                {
                                    if (!_allCertificates.Any(x => x.DerFilePath.Equals(item.DerFilePath, StringComparison.OrdinalIgnoreCase)))
                                    {
                                        AttachCertEvent(item);
                                        _allCertificates.Add(item);
                                    }
                                }
                                ApplyFilter();
                            });
                        }
                        catch { }
                    }

                    await RefreshDrivesAsync();

                    await DispatchSafeAsync(() =>
                    {
                        var targets = pcCerts.Any() ? pcCerts : FilteredCertificates.Where(c => c.Status != ExpiryStatus.Expired).ToList();
                        var dlg = new Views.PcToUsbTransferDialog(this, targets, AvailableTargetDrives)
                        {
                            Owner = Application.Current?.MainWindow
                        };
                        dlg.ShowDialog();

                        // PcToUsbTransferDialog 내부에서 전체 선택(IsSelected=true) 및 IndexNumber 변경이
                        // 메인 보관함 목록에 남아 후속 '선택 복사' 시 전체가 복사되는 현상 방지
                        foreach (var c in _allCertificates)
                        {
                            c.IsSelected = false;
                        }
                        RestoreFilteredIndices();
                        OnPropertyChanged(nameof(SelectedCertificatesCount));
                        (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                        (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();

                        _ = RefreshDrivesAsync();
                        _ = RefreshCertificatesAsync();
                    });
                    IsGuidedWorkflowActive = false;
                }
                else
                {
                    GuidedWorkflowTitle = "🚀 시작가이드: USB ➔ PC 가져오기";
                    GuidedWorkflowStepTitle = "1단계: 가져올 USB 드라이브 및 인증서 선택";
                    GuidedWorkflowStepDescription = "USB 이동식 메모리의 인증서를 확인하고 가져오기를 진행합니다.";

                    await DispatchSafeAsync(() =>
                    {
                        var dlg = new Views.UsbTransferDialog
                        {
                            Owner = Application.Current?.MainWindow
                        };
                        dlg.ShowDialog();
                        _ = RefreshDrivesAsync();
                        _ = RefreshCertificatesAsync();
                    });
                    IsGuidedWorkflowActive = false;
                }
            }
            catch (Exception ex)
            {
                IsGuidedWorkflowActive = false;
                System.Diagnostics.Debug.WriteLine($"[StartGuidedWorkflowAsync Error] {ex.Message}");
            }
        }

        public void NextGuidedStep()
        {
            if (!IsGuidedWorkflowActive) return;

            if (GuidedWorkflowStep == 1)
            {
                var selected = FilteredCertificates.Where(x => x != null && x.IsSelected).ToList();
                if (!selected.Any())
                {
                    if (SelectedCertificate != null && FilteredCertificates.Contains(SelectedCertificate))
                    {
                        selected.Add(SelectedCertificate);
                    }
                    else
                    {
                        UserFriendlyMessageHelper.ShowWarning(
                            FilteredCertificates.Any()
                                ? "복사할 인증서의 체크박스를 선택하거나 목록에서 행을 클릭해 주세요."
                                : "현재 표시된 목록에 복사할 인증서가 없습니다.",
                            "인증서 선택 필요");
                        return;
                    }
                }

                GuidedWorkflowStep = 2;
                GuidedWorkflowStepTitle = "2단계: 저장할 USB 선택";
                GuidedWorkflowStepDescription = $"선택한 인증서 {selected.Count}건을 저장할 USB 드라이브를 고른 뒤 [복사 시작]을 누르세요.";

                // Step 2로 진입 시 즉시 복사 창 실행!
                ExecuteGuidedCopy();
            }
            else if (GuidedWorkflowStep == 2)
            {
                ExecuteGuidedCopy();
            }
            else
            {
                EndGuidedWorkflow();
            }
        }

        public void ExecuteGuidedCopy()
        {
            var selected = FilteredCertificates.Where(x => x != null && x.IsSelected).ToList();
            if (!selected.Any() && SelectedCertificate != null && FilteredCertificates.Contains(SelectedCertificate))
            {
                selected.Add(SelectedCertificate);
            }

            if (!selected.Any())
            {
                UserFriendlyMessageHelper.ShowWarning(
                    "복사할 인증서가 선택되지 않았습니다. 목록에서 복사할 인증서의 체크박스를 먼저 선택해 주세요.",
                    "선택 오류 안내");
                return;
            }

            RequestOpenTargetDrivePicker?.Invoke(selected);
        }

        public void ToggleSound()
        {
            IsSoundEnabled = !IsSoundEnabled;
            if (IsSoundEnabled && SoundVolume == 0)
            {
                SoundVolume = 40;
            }
            if (IsSoundEnabled)
            {
                PlayTestSound();
            }
        }

        public void PlayTestSound()
        {
            PlayTestSound("complete");
        }

        public void PlayTestSound(string phase)
        {
            try
            {
                switch (phase?.ToLowerInvariant())
                {
                    case "error":
                        SoundService.PlayErrorSound();
                        break;
                    case "start":
                        // 시작음 영구 제거됨
                        break;
                    case "complete":
                    default:
                        SoundService.PlayCompletionSound();
                        break;
                }
            }
            catch { }
        }

        public void PlayStartSound()
        {
            // 사용자의 요청으로 복사 시작음은 영구 제거되었습니다.
        }

        public void PlayCompletionSound()
        {
            SoundService.PlayCompletionSound();
        }

        public void PlayErrorSound()
        {
            SoundService.PlayErrorSound();
        }

        public void CopySelectedCertDetails()
        {
            var cert = SelectedCertificate;
            if (cert == null) return;

            try
            {
                var sb = new System.Text.StringBuilder();
                sb.AppendLine("=== K-인증서 매니저 인증서 상세 정보 ===");
                sb.AppendLine($"인증서 명칭 (CN): {cert.CommonName}");
                sb.AppendLine($"구분 / 체계: {cert.CategoryBadgeText}");
                sb.AppendLine($"저장 위치: {cert.StorageLocationBadge} ({cert.StorageMediumName})");
                sb.AppendLine($"발급기관: {cert.IssuerName}");
                sb.AppendLine($"유효기간: {cert.NotBefore:yyyy-MM-dd HH:mm:ss} ~ {cert.NotAfter:yyyy-MM-dd HH:mm:ss}");
                sb.AppendLine($"상태: {cert.StatusDisplayText}");
                sb.AppendLine($"일련번호: {cert.SerialNumber}");
                sb.AppendLine($"공개키/서명 규격: {cert.PublicKeySpecText}");
                sb.AppendLine($"2027.02 보안강도: {cert.CryptoPostureLabel}");
                sb.AppendLine($"정책 OID: {cert.PolicyOid} ({cert.PolicyUsage})");
                sb.AppendLine($"소유자 DN: {cert.SubjectDn}");
                sb.AppendLine($"발급자 DN: {cert.IssuerName}");
                sb.AppendLine($"개인키 보유: {(cert.HasPrivateKey ? "보유 (정상)" : "개인키 없음")}");
                sb.AppendLine($"저장 디렉터리 경로: {cert.DirectoryPath}");
                if (!string.IsNullOrEmpty(cert.DerFilePath))
                {
                    sb.AppendLine($"인증서 파일 (DER): {cert.DerFilePath} ({cert.DerFileSize} bytes)");
                }
                if (!string.IsNullOrEmpty(cert.KeyFilePath))
                {
                    sb.AppendLine($"개인키 파일 (KEY): {cert.KeyFilePath} ({cert.KeyFileSize} bytes)");
                }

                Clipboard.SetText(sb.ToString());
                ShowToast("📋 인증서 상세 전체 정보가 클립보드에 복사되었습니다.");
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowWarning($"클립보드 복사 중 알림: {ex.Message}", "복사 안내");
            }
        }

        public void OpenSelectedCertDirectory()
        {
            var cert = SelectedCertificate;
            if (cert == null) return;

            try
            {
                // 다중 단계로 실제 존재하는 대상 인증서 디렉터리 경로 정밀 판별
                string targetFolder = string.Empty;

                if (!string.IsNullOrWhiteSpace(cert.DirectoryPath))
                {
                    string cleaned = cert.DirectoryPath.Trim().TrimEnd('\\', '/');
                    if (Directory.Exists(cleaned))
                    {
                        targetFolder = Path.GetFullPath(cleaned);
                    }
                }

                if (string.IsNullOrEmpty(targetFolder) && !string.IsNullOrWhiteSpace(cert.DerFilePath))
                {
                    string cleanedDer = cert.DerFilePath.Trim();
                    if (File.Exists(cleanedDer))
                    {
                        targetFolder = Path.GetDirectoryName(Path.GetFullPath(cleanedDer)) ?? string.Empty;
                    }
                }

                if (string.IsNullOrEmpty(targetFolder) && !string.IsNullOrWhiteSpace(cert.KeyFilePath))
                {
                    string cleanedKey = cert.KeyFilePath.Trim();
                    if (File.Exists(cleanedKey))
                    {
                        targetFolder = Path.GetDirectoryName(Path.GetFullPath(cleanedKey)) ?? string.Empty;
                    }
                }

                if (!string.IsNullOrEmpty(targetFolder) && Directory.Exists(targetFolder))
                {
                    string derFile = !string.IsNullOrWhiteSpace(cert.DerFilePath) && File.Exists(cert.DerFilePath)
                        ? Path.GetFullPath(cert.DerFilePath)
                        : Path.Combine(targetFolder, "signCert.der");

                    try
                    {
                        if (File.Exists(derFile))
                        {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "explorer.exe",
                                Arguments = $"/select,\"{derFile}\"",
                                UseShellExecute = true
                            });
                        }
                        else
                        {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = targetFolder,
                                UseShellExecute = true
                            });
                        }
                    }
                    catch
                    {
                        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = targetFolder,
                            UseShellExecute = true
                        });
                    }

                    ActivityLogService.Instance.Log(LogCategory.SECURITY, LogLevel.INFO, "파일 탐색기 실행", $"경로: {targetFolder}", targetFolder);
                }
                else
                {
                    string displayPath = !string.IsNullOrWhiteSpace(cert.DirectoryPath) ? cert.DirectoryPath : cert.DerFilePath;
                    UserFriendlyMessageHelper.ShowWarning(
                        $"인증서 폴더가 존재하지 않거나 현재 연결 해제된 드라이브입니다:\n\n{displayPath}",
                        "폴더 열기 불가");
                }
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowWarning($"탐색기 실행 중 알림: {ex.Message}", "폴더 열기 안내");
            }
        }

        public void PrevGuidedStep()
        {
            if (GuidedWorkflowStep > 1)
            {
                GuidedWorkflowStep--;
                if (GuidedWorkflowStep == 1)
                {
                    GuidedWorkflowStepTitle = "1단계: 복사할 인증서 선택";
                    GuidedWorkflowStepDescription = "목록에서 USB로 복사할 인증서를 선택(체크)해 주세요.";
                }
                else if (GuidedWorkflowStep == 2)
                {
                    GuidedWorkflowStepTitle = "2단계: 저장할 USB 선택";
                    GuidedWorkflowStepDescription = "선택한 인증서를 저장할 USB 드라이브를 고른 뒤 [복사 시작]을 누르세요.";
                }
            }
        }

        public void EndGuidedWorkflow()
        {
            IsGuidedWorkflowActive = false;
        }

        public string CurrentTheme
        {
            get => _currentTheme;
            set
            {
                if (SetProperty(ref _currentTheme, value))
                {
                    SettingsService.Instance.Theme = value;
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

        public string AppVersion => $"v{KCertManager.Wpf.Services.UpdateCheckerService.CURRENT_VERSION}";
        public string RuntimeInfo => $".NET {Environment.Version.Major}.{Environment.Version.Minor} ({System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture})";
        public string CompileInfo => $"v{KCertManager.Wpf.Services.UpdateCheckerService.CURRENT_VERSION} (.NET {Environment.Version.Major}.{Environment.Version.Minor})";

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

        public static bool IsDarkThemeActive { get; private set; } = true;

        public static void ApplyTheme(string themeName)
        {
            try
            {
                var app = Application.Current;
                if (app == null) return;

                var normalizedTheme = (themeName ?? "dark").Trim().ToLowerInvariant();
                IsDarkThemeActive = normalizedTheme == "dark" || normalizedTheme == "pastel-black";
                var res = app.Resources;
                System.Windows.Media.Color bgDark, bgCard, bgCardHover, textPrimary, textSecondary, borderColor, accentText, mutedText;
                System.Windows.Media.Color accentBlue, accentBlueHover, accentGreen, accentAmber, accentRose;
                System.Windows.Media.Color selectedRowBg, selectedRowText, inactiveSelectedRowBg, inactiveSelectedRowText;
                System.Windows.Media.Color copiedRowBg, copiedRowText;
                System.Windows.Media.Color scrollBarTrack, scrollBarThumb, scrollBarThumbHover;
                System.Windows.Media.Color toolTipBg, toolTipText, toolTipBorder;

                if (normalizedTheme == "dark" || normalizedTheme == "pastel-black")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F1219");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1A1F2C");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#262E3F");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBD5E1");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2D3546");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#60A5FA");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#94A3B8");

                    accentBlue = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2563EB");
                    accentBlueHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1D4ED8");
                    accentGreen = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#10B981");
                    accentAmber = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FBBF24");
                    accentRose = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F43F5E");

                    selectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E3A8A");
                    selectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    inactiveSelectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#172554");
                    inactiveSelectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E2E8F0");
                    copiedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#065F46");
                    copiedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E6FFFA");

                    scrollBarTrack = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#161B26");
                    scrollBarThumb = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#475569");
                    scrollBarThumbHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#64748B");

                    toolTipBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E293B");
                    toolTipText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    toolTipBorder = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#3B82F6");
                }
                else if (normalizedTheme == "gray" || normalizedTheme == "pastel-gray")
                {
                    // Misty Mineral Slate: zero pure-white glare with deep ink slate text (~11.2:1)
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CCD4DF");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#DFE5EC");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D3DCE6");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#19222D");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2C3847");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#9CA9B9");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1A4673");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#495667");

                    accentBlue = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#245687");
                    accentBlueHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1B446D");
                    accentGreen = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#16654B");
                    accentAmber = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#8A530B");
                    accentRose = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#B92B47");

                    selectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBDCEE");
                    selectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#122030");
                    inactiveSelectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D4DFEC");
                    inactiveSelectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#19222D");
                    copiedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CCE2D8");
                    copiedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#133829");

                    scrollBarTrack = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CCD4DF");
                    scrollBarThumb = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#8A97A8");
                    scrollBarThumbHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#586678");

                    toolTipBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E293B");
                    toolTipText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#EEF2F6");
                    toolTipBorder = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#495667");
                }
                else if (normalizedTheme == "beige" || normalizedTheme == "pastel-beige")
                {
                    // Warm Oat Paper: low blue-light glare-free matte paper with espresso charcoal text (~11.6:1)
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E6DFD1");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1ECE1");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#DDD5C5");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#24201B");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#3E3830");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#C4BAA7");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E4971");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#595146");

                    accentBlue = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2C5A85");
                    accentBlueHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#21476B");
                    accentGreen = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E6B4F");
                    accentAmber = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#8A520A");
                    accentRose = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#B4324B");

                    selectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D6E2ED");
                    selectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#182430");
                    inactiveSelectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#DCE4EC");
                    inactiveSelectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#24201B");
                    copiedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D5E6DA");
                    copiedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#193A27");

                    scrollBarTrack = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E6DFD1");
                    scrollBarThumb = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#A99F8D");
                    scrollBarThumbHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#746B5C");

                    toolTipBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2C2620");
                    toolTipText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F5F1E8");
                    toolTipBorder = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#B88228");
                }
                else // white (pastel-white, classic)
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1F5F9");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E293B");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBD5E1");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1D4ED8");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#475569");

                    accentBlue = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2563EB");
                    accentBlueHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1D4ED8");
                    accentGreen = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#059669");
                    accentAmber = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#B45309");
                    accentRose = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E11D48");

                    selectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#DBEAFE");
                    selectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    inactiveSelectedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E2E8F0");
                    inactiveSelectedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    copiedRowBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D1FAE5");
                    copiedRowText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#065F46");

                    scrollBarTrack = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1F5F9");
                    scrollBarThumb = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#94A3B8");
                    scrollBarThumbHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#475569");

                    toolTipBg = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    toolTipText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    toolTipBorder = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2563EB");
                }

                res["BgDark"] = bgDark;
                res["BgCard"] = bgCard;
                res["BgCardHover"] = bgCardHover;
                res["TextPrimary"] = textPrimary;
                res["TextSecondary"] = textSecondary;
                res["BorderColor"] = borderColor;
                res["AccentBlue"] = accentBlue;
                res["AccentBlueHover"] = accentBlueHover;
                res["AccentGreen"] = accentGreen;
                res["AccentAmber"] = accentAmber;
                res["AccentRose"] = accentRose;
                res["SelectedRowBg"] = selectedRowBg;
                res["SelectedRowText"] = selectedRowText;
                res["InactiveSelectedRowBg"] = inactiveSelectedRowBg;
                res["InactiveSelectedRowText"] = inactiveSelectedRowText;
                res["CopiedRowBg"] = copiedRowBg;
                res["CopiedRowText"] = copiedRowText;
                res["ScrollBarTrack"] = scrollBarTrack;
                res["ScrollBarThumb"] = scrollBarThumb;
                res["ScrollBarThumbHover"] = scrollBarThumbHover;
                res["ToolTipBg"] = toolTipBg;
                res["ToolTipText"] = toolTipText;
                res["ToolTipBorder"] = toolTipBorder;

                res["BgDarkBrush"] = new System.Windows.Media.SolidColorBrush(bgDark);
                res["BgCardBrush"] = new System.Windows.Media.SolidColorBrush(bgCard);
                res["BgCardHoverBrush"] = new System.Windows.Media.SolidColorBrush(bgCardHover);
                res["TextPrimaryBrush"] = new System.Windows.Media.SolidColorBrush(textPrimary);
                res["TextSecondaryBrush"] = new System.Windows.Media.SolidColorBrush(textSecondary);
                res["BorderBrush"] = new System.Windows.Media.SolidColorBrush(borderColor);
                res["AccentTextBrush"] = new System.Windows.Media.SolidColorBrush(accentText);
                res["MutedTextBrush"] = new System.Windows.Media.SolidColorBrush(mutedText);
                res["AccentBlueBrush"] = new System.Windows.Media.SolidColorBrush(accentBlue);
                res["AccentBlueHoverBrush"] = new System.Windows.Media.SolidColorBrush(accentBlueHover);
                res["AccentGreenBrush"] = new System.Windows.Media.SolidColorBrush(accentGreen);
                res["AccentAmberBrush"] = new System.Windows.Media.SolidColorBrush(accentAmber);
                res["AccentRoseBrush"] = new System.Windows.Media.SolidColorBrush(accentRose);
                res["SelectedRowBgBrush"] = new System.Windows.Media.SolidColorBrush(selectedRowBg);
                res["SelectedRowTextBrush"] = new System.Windows.Media.SolidColorBrush(selectedRowText);
                res["InactiveSelectedRowBgBrush"] = new System.Windows.Media.SolidColorBrush(inactiveSelectedRowBg);
                res["InactiveSelectedRowTextBrush"] = new System.Windows.Media.SolidColorBrush(inactiveSelectedRowText);
                res["CopiedRowBgBrush"] = new System.Windows.Media.SolidColorBrush(copiedRowBg);
                res["CopiedRowTextBrush"] = new System.Windows.Media.SolidColorBrush(copiedRowText);
                res["ScrollBarTrackBrush"] = new System.Windows.Media.SolidColorBrush(scrollBarTrack);
                res["ScrollBarThumbBrush"] = new System.Windows.Media.SolidColorBrush(scrollBarThumb);
                res["ScrollBarThumbHoverBrush"] = new System.Windows.Media.SolidColorBrush(scrollBarThumbHover);
                res["ToolTipBgBrush"] = new System.Windows.Media.SolidColorBrush(toolTipBg);
                res["ToolTipTextBrush"] = new System.Windows.Media.SolidColorBrush(toolTipText);
                res["ToolTipBorderBrush"] = new System.Windows.Media.SolidColorBrush(toolTipBorder);

                res[SystemColors.HighlightBrushKey] = new System.Windows.Media.SolidColorBrush(selectedRowBg);
                res[SystemColors.HighlightTextBrushKey] = new System.Windows.Media.SolidColorBrush(selectedRowText);
                res[SystemColors.InactiveSelectionHighlightBrushKey] = new System.Windows.Media.SolidColorBrush(inactiveSelectedRowBg);
                res[SystemColors.InactiveSelectionHighlightTextBrushKey] = new System.Windows.Media.SolidColorBrush(inactiveSelectedRowText);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[ApplyTheme Error] {ex.Message}");
            }
        }

        public CertificateBackupService BackupService => _backupService;

        public ObservableCollection<CertificateItem> AllCertificates => _allCertificates;

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

        public IEnumerable<DriveItem> DisplayedStatusDrives
        {
            get
            {
                if (ShowAllDrivesInStatus)
                {
                    return AllDrives ?? new ObservableCollection<DriveItem>();
                }
                return RemovableDrives ?? new ObservableCollection<DriveItem>();
            }
        }

        public ObservableCollection<DriveItem> AvailableTargetDrives
        {
            get => _availableTargetDrives;
            set => SetProperty(ref _availableTargetDrives, value);
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
                    (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
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

        public bool HasUsbDrives => _removableDrives?.Count > 0;
        public int ConnectedUsbCount => _removableDrives?.Count ?? 0;
        public int TotalCount => _allCertificates?.Count ?? 0;
        public int GpkiCount => _allCertificates?.Count(x => x != null && x.Category == CertCategory.GPKI) ?? 0;
        public int EpkiCount => _allCertificates?.Count(x => x != null && x.Category == CertCategory.EPKI) ?? 0;
        public int NpkiCount => _allCertificates?.Count(x => x != null && x.Category == CertCategory.NPKI) ?? 0;
        public int Class1Count => _allCertificates?.Count(x => x != null && x.IsClass1Path) ?? 0;
        public int ExpiredCount => _allCertificates?.Count(x => x != null && x.Status == ExpiryStatus.Expired) ?? 0;
        public int ComputerCount => _allCertificates?.Count(x => x != null && !x.IsRemovableMedia) ?? 0;
        public int UsbCount => _allCertificates?.Count(x => x != null && x.IsRemovableMedia) ?? 0;
        public int CustomPathCount => _allCertificates?.Count(x => x != null && x.IsCustomPath) ?? 0;
        public int SelectedCertificatesCount => _filteredCertificates?.Count(x => x != null && x.IsSelected) ?? 0;
        public int TrashCount => _trashItems?.Count ?? 0;
        public int LogCount => ActivityLogService.Instance?.Logs?.Count ?? 0;

        public bool HasExpiryAlert
        {
            get
            {
                if (_isExpiryBannerDismissed || _allCertificates == null) return false;
                return _allCertificates.Any(x => x != null && (x.Status == ExpiryStatus.Expired || x.Status == ExpiryStatus.ExpiringSoon));
            }
        }

        public bool IsExpiryCritical =>
            _allCertificates != null &&
            _allCertificates.Any(x => x != null && (x.Status == ExpiryStatus.Expired || x.RemainingDays <= 7));

        public string ExpiryBannerMessage
        {
            get
            {
                if (_allCertificates == null) return string.Empty;
                var critical = _allCertificates.Where(x => x != null && x.Status == ExpiryStatus.ExpiringSoon && x.RemainingDays <= 7).ToList();
                var warning = _allCertificates.Where(x => x != null && x.Status == ExpiryStatus.ExpiringSoon && x.RemainingDays > 7).ToList();
                var expired = _allCertificates.Where(x => x != null && x.Status == ExpiryStatus.Expired).ToList();

                var parts = new List<string>();
                if (critical.Count > 0) parts.Add($"7일 이내 긴급 {critical.Count}건");
                if (warning.Count > 0) parts.Add($"30일 이내 임박 {warning.Count}건");
                if (expired.Count > 0) parts.Add($"만료 {expired.Count}건");

                if (parts.Count == 0) return string.Empty;

                var earliest = critical.Concat(warning).Concat(expired)
                    .OrderBy(x => x.RemainingDays)
                    .FirstOrDefault();

                string summary = "만료 · 갱신 알림: " + string.Join(" · ", parts);
                if (earliest != null)
                {
                    summary += $" — 가장 빠른 만료: {earliest.CommonName} ({earliest.NotAfter:yyyy-MM-dd})";
                }
                return summary;
            }
        }

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
        public ICommand EjectDriveCommand { get; }
        public ICommand DismissExpiryBannerCommand { get; }
        public ICommand CheckUpdatesCommand { get; }

        #endregion

        #region Methods

        public Task RefreshCertificatesAsync(IEnumerable<string>? customPaths = null)
            => RefreshCertificatesInternalAsync(customPaths, waitForDeepPass: false);

        public Task RefreshAllCertificatesCompleteAsync()
            => RefreshCertificatesInternalAsync(null, waitForDeepPass: true);

        private async Task RefreshCertificatesInternalAsync(IEnumerable<string>? customPaths, bool waitForDeepPass)
        {
            int scanGen = Interlocked.Increment(ref _scanGeneration);
            var newCts = new CancellationTokenSource();
            var prevCts = Interlocked.Exchange(ref _scanCts, newCts);
            try
            {
                prevCts?.Cancel();
                prevCts?.Dispose();
            }
            catch { }

            var ct = newCts.Token;

            try
            {
                await DispatchSafeAsync(() =>
                {
                    if (scanGen != _scanGeneration) return;
                    IsBusy = true;
                    StatusMessage = "인증서 찾는 중...";
                });

                if (customPaths != null)
                {
                    var normalizedCustom = customPaths
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .Select(p => SafeGetFullPath(p)?.TrimEnd('\\', '/') ?? p.Trim())
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    var normalizedDefaults = CertLocationScanner.GetStandardRoots()
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .Select(p => SafeGetFullPath(p)?.TrimEnd('\\', '/') ?? p.Trim())
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    bool matchesDefaultsExactly =
                        normalizedCustom.Count == normalizedDefaults.Count &&
                        normalizedCustom.All(p => normalizedDefaults.Contains(p));

                    _customSearchPaths = matchesDefaultsExactly ? new List<string>() : normalizedCustom;
                }

                // 사용자 지정 경로(또는 필터링된 표준 경로)가 실제로 기본값과 다른 경우 해당 경로로 집중 탐색
                if (_customSearchPaths.Count > 0)
                {
                    var list = await Task.Run(() => _scannerService.ScanCertificates(_customSearchPaths, ct), ct);
                    if (scanGen != _scanGeneration || ct.IsCancellationRequested) return;

                    AttachCertEvents(list);
                    await DispatchUpdateCertificatesAsync(list, scanGen);

                    await DispatchSafeAsync(() =>
                    {
                        if (scanGen == _scanGeneration)
                        {
                            IsBusy = false;
                            StatusMessage = $"총 {TotalCount}개 인증서를 찾았습니다.";
                        }
                    });
                    return;
                }

                // =========================================================================
                // [0단계 Local Fast-Pass]: 네트워크/외부 드라이브 대기 없이 PC 로컬 표준 경로(LocalLow, C:\) 0.05초 즉시 표시
                // =========================================================================
                var localList = await _scannerService.ScanLocalFastPassAsync(ct);
                if (scanGen != _scanGeneration || ct.IsCancellationRequested) return;

                AttachCertEvents(localList);
                await DispatchUpdateCertificatesAsync(localList, scanGen);

                await DispatchSafeAsync(() =>
                {
                    if (scanGen != _scanGeneration) return;
                    IsBusy = false; // 사용자 UI 즉각 사용 가능하게 전환!
                    StatusMessage = localList.Count > 0
                        ? $"PC 인증서 {localList.Count}개 표시됨 (외장/추가 드라이브 확인 중...)"
                        : "표준 경로 및 외장 드라이브 인증서 확인 중...";
                });

                // =========================================================================
                // [1단계 Drive Fast-Pass]: 준비된 로컬 보조 및 이동식 USB 드라이브 루트 표준 경로 병렬 탐색
                // =========================================================================
                var fastDriveList = await _scannerService.ScanFastPassAsync(ct);
                if (scanGen != _scanGeneration || ct.IsCancellationRequested) return;

                var mergedFastMap = new Dictionary<string, CertificateItem>(StringComparer.OrdinalIgnoreCase);
                foreach (var item in localList)
                {
                    var key = SafeGetFullPath(item.DerFilePath);
                    if (!string.IsNullOrEmpty(key))
                    {
                        mergedFastMap[key] = item;
                    }
                }
                foreach (var item in fastDriveList)
                {
                    var key = SafeGetFullPath(item.DerFilePath);
                    if (!string.IsNullOrEmpty(key) && !mergedFastMap.ContainsKey(key))
                    {
                        AttachCertEvent(item);
                        mergedFastMap[key] = item;
                    }
                }

                var mergedFastList = mergedFastMap.Values.ToList();
                await DispatchUpdateCertificatesAsync(mergedFastList, scanGen);

                await DispatchSafeAsync(() =>
                {
                    if (scanGen != _scanGeneration) return;
                    StatusMessage = $"표준 인증서 {mergedFastList.Count}개 표시됨 (추가 폴더 확인 중...)";
                });

                // =========================================================================
                // [2단계 Deep-Pass]: 비표준 및 외장 디스크 심층 탐색 (일괄 배치 UI 반영)
                // =========================================================================
                var deepTask = Task.Run(async () =>
                {
                    try
                    {
                        var seenDers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                        var seenSigs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                        foreach (var x in mergedFastList)
                        {
                            var fullDer = SafeGetFullPath(x.DerFilePath);
                            if (string.IsNullOrEmpty(fullDer)) continue;
                            seenDers.Add(fullDer);
                            var dir = Path.GetDirectoryName(fullDer) ?? string.Empty;
                            seenSigs.Add($"{dir}|{x.SerialNumber}|{x.SubjectDn}");
                        }

                        var batchLock = new object();
                        var pendingBatch = new List<CertificateItem>();
                        var lastFlushUtc = DateTime.UtcNow;

                        void FlushPendingBatch()
                        {
                            List<CertificateItem> toAdd;
                            lock (batchLock)
                            {
                                if (pendingBatch.Count == 0) return;
                                toAdd = new List<CertificateItem>(pendingBatch);
                                pendingBatch.Clear();
                                lastFlushUtc = DateTime.UtcNow;
                            }

                            DispatchSafe(() =>
                            {
                                if (scanGen != _scanGeneration || ct.IsCancellationRequested) return;
                                bool addedAny = false;
                                foreach (var item in toAdd)
                                {
                                    var newDer = SafeGetFullPath(item.DerFilePath);
                                    if (newDer != null && _allCertificates.Any(x =>
                                        !string.IsNullOrWhiteSpace(x.DerFilePath) &&
                                        string.Equals(SafeGetFullPath(x.DerFilePath), newDer, StringComparison.OrdinalIgnoreCase)))
                                    {
                                        continue;
                                    }
                                    _allCertificates.Add(item);
                                    addedAny = true;
                                }

                                if (addedAny)
                                {
                                    UpdateDriveCertificateCounts();
                                    ApplyFilter();
                                    UpdateCounts();
                                }
                            });
                        }

                        int newDiscovered = await _scannerService.ScanDeepPassBackgroundAsync(newItem =>
                        {
                            if (scanGen != _scanGeneration || ct.IsCancellationRequested) return;
                            AttachCertEvent(newItem);

                            bool shouldFlush;
                            lock (batchLock)
                            {
                                pendingBatch.Add(newItem);
                                shouldFlush = pendingBatch.Count >= 12 || (DateTime.UtcNow - lastFlushUtc).TotalMilliseconds >= 180;
                            }

                            if (shouldFlush)
                            {
                                FlushPendingBatch();
                            }
                        }, seenDers, seenSigs, ct);

                        if (scanGen != _scanGeneration || ct.IsCancellationRequested) return;

                        FlushPendingBatch();

                        int finalTotal = 0;
                        await DispatchSafeAsync(() =>
                        {
                            if (scanGen != _scanGeneration) return;
                            finalTotal = TotalCount;
                            StatusMessage = $"전체 스캔 완료: 총 {TotalCount}개 인증서 (PC: {ComputerCount}개, USB: {UsbCount}개" +
                                            (newDiscovered > 0 ? $", 비표준 {newDiscovered}개 추가 감지" : "") + ").";
                        });

                        if (scanGen == _scanGeneration && !ct.IsCancellationRequested)
                        {
                            ActivityLogService.Instance.Log(
                                LogCategory.SCAN,
                                LogLevel.SUCCESS,
                                "인증서 2단계 전체 스캔 완료",
                                $"총 {finalTotal}개 인증서 (Fast-Pass: {mergedFastList.Count}개, Deep-Pass 추가: {newDiscovered}개)",
                                "Local System",
                                "Memory",
                                finalTotal);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[Deep Scan Error] {ex.Message}");
                    }
                }, ct);

                if (waitForDeepPass)
                {
                    await deepTask;
                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                await DispatchSafeAsync(() =>
                {
                    if (scanGen == _scanGeneration)
                    {
                        IsBusy = false;
                        StatusMessage = $"스캔 중 알림: {ex.Message}";
                    }
                });
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
                    DispatchSafe(() =>
                    {
                        OnPropertyChanged(nameof(SelectedCertificatesCount));
                        (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                        (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    });
                }
            };
        }

        private Task DispatchUpdateCertificatesAsync(List<CertificateItem> list, int scanGen)
        {
            return DispatchSafeAsync(() =>
            {
                if (scanGen != _scanGeneration) return;
                _allCertificates.Clear();
                foreach (var item in list)
                {
                    _allCertificates.Add(item);
                }
                UpdateDriveCertificateCounts();
                ApplyFilter();
                UpdateCounts();
            });
        }

        public void RefreshDrives()
        {
            _ = RefreshDrivesAsync();
        }

        public async Task RefreshDrivesAsync()
        {
            try
            {
                var all = await Task.Run(() =>
                {
                    UsbStorageGuard.InvalidateUsbCache();
                    CertLocationScanner.ClearRemovableDriveCache();
                    return UsbDriveWatcher.GetAvailableDrives();
                });

                await DispatchSafeAsync(() =>
                {
                    try
                    {
                        AllDrives = new ObservableCollection<DriveItem>(all);

                        // 1. 순수 이동식 USB 드라이브 (CD-ROM 및 빈 카드 리더 슬롯 배제)
                        var drives = all.Where(d => d.IsRemovable && !d.IsCdRom && d.IsReady).ToList();
                        RemovableDrives = new ObservableCollection<DriveItem>(drives);

                        // 2. 백업 및 복사 가능한 전체 대상 드라이브 (로컬 디스크 C:, D: 및 USB E:, F: 등 - CD-ROM 완전 배제)
                        var targetDrives = all.Where(d => !d.IsCdRom && d.IsReady).ToList();
                        AvailableTargetDrives = new ObservableCollection<DriveItem>(targetDrives);

                        UpdateDriveCertificateCounts();

                        if (AvailableTargetDrives.Count == 0)
                        {
                            SelectedTargetDrive = null;
                        }
                        else if (SelectedTargetDrive == null || !AvailableTargetDrives.Any(d => d.Name == SelectedTargetDrive.Name))
                        {
                            // USB 드라이브 우선 선택, 없으면 시스템 드라이브 외 보조 디스크(D: 등) 또는 첫 번째 사용 가능 디스크 선택
                            string sysDriveRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\").TrimEnd('\\') + "\\";
                            SelectedTargetDrive = RemovableDrives.FirstOrDefault(d => d.IsReady)
                                               ?? AvailableTargetDrives.FirstOrDefault(d => !string.Equals(d.Name.TrimEnd('\\') + "\\", sysDriveRoot, StringComparison.OrdinalIgnoreCase))
                                               ?? AvailableTargetDrives.FirstOrDefault();
                        }
                        else
                        {
                            var current = AvailableTargetDrives.FirstOrDefault(d => d.Name == SelectedTargetDrive.Name);
                            SelectedTargetDrive = current ?? AvailableTargetDrives.FirstOrDefault();
                        }
                        OnPropertyChanged(nameof(DisplayedStatusDrives));
                    }
                    finally
                    {
                        (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                        (BackupAllCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    }
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[RefreshDrivesAsync Error] {ex.Message}");
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
                var driveLetter = drive.Name.TrimEnd('\\', '/').ToUpperInvariant();
                var driveSlash = driveLetter + "\\";
                var driveFwdSlash = driveLetter + "/";
                var count = _allCertificates.Count(c =>
                    (!string.IsNullOrEmpty(c.DriveLetter) && c.DriveLetter.TrimEnd('\\', '/').Equals(driveLetter, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(c.DirectoryPath) && (
                        c.DirectoryPath.StartsWith(driveSlash, StringComparison.OrdinalIgnoreCase) ||
                        c.DirectoryPath.StartsWith(driveFwdSlash, StringComparison.OrdinalIgnoreCase) ||
                        c.DirectoryPath.Equals(driveLetter, StringComparison.OrdinalIgnoreCase) ||
                        c.DirectoryPath.StartsWith(drive.Name, StringComparison.OrdinalIgnoreCase))));
                drive.CertificateCount = count;
            }

            OnPropertyChanged(nameof(DisplayedStatusDrives));
            OnPropertyChanged(nameof(ConnectedUsbCount));
        }

        public void RefreshTrash()
        {
            _ = RefreshTrashAsync();
        }

        public async Task RefreshTrashAsync()
        {
            try
            {
                var raw = await Task.Run(() => _backupService.GetTrashItems());
                await DispatchSafeAsync(() =>
                {
                    if (raw != null)
                    {
                        for (int i = 0; i < raw.Count; i++)
                        {
                            if (raw[i] != null)
                            {
                                raw[i].IndexNumber = i + 1;
                            }
                        }
                        TrashItems = new ObservableCollection<TrashItem>(raw.Where(x => x != null));
                    }
                    else
                    {
                        TrashItems = new ObservableCollection<TrashItem>();
                    }
                    OnPropertyChanged(nameof(TrashCount));
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[RefreshTrashAsync Error] {ex.Message}");
            }
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
                    (kw.Equals("class1", StringComparison.OrdinalIgnoreCase) && x.IsClass1Path) ||
                    ((kw.Contains("기관", StringComparison.OrdinalIgnoreCase) || kw.Contains("관인", StringComparison.OrdinalIgnoreCase) || kw.Contains("특수", StringComparison.OrdinalIgnoreCase)) && (x.IsClass1Path || x.IsInstitutional)) ||
                    ((kw.Contains("공무원", StringComparison.OrdinalIgnoreCase) || kw.Contains("행정", StringComparison.OrdinalIgnoreCase)) && (x.IsClass1Path || x.IsInstitutional) && x.Category == CertCategory.GPKI) ||
                    ((kw.Contains("교육", StringComparison.OrdinalIgnoreCase) || kw.Contains("학교", StringComparison.OrdinalIgnoreCase)) && (x.IsClass1Path || x.IsInstitutional) && x.Category == CertCategory.EPKI) ||
                    (kw.Equals("usb", StringComparison.OrdinalIgnoreCase) && x.IsRemovableMedia) ||
                    (kw.Equals("컴퓨터", StringComparison.OrdinalIgnoreCase) && !x.IsRemovableMedia) ||
                    (kw.Equals("pc", StringComparison.OrdinalIgnoreCase) && !x.IsRemovableMedia));
            }

            query = SelectedFilter switch
            {
                "GPKI" => query.Where(x => x.Category == CertCategory.GPKI),
                "EPKI" => query.Where(x => x.Category == CertCategory.EPKI),
                "NPKI" => query.Where(x => x.Category == CertCategory.NPKI),
                "CLASS1" => query.Where(x => x.IsClass1Path),
                "EXPIRED" => query.Where(x => x.Status == ExpiryStatus.Expired),
                "PC" or "LOCAL" => query.Where(x => !x.IsRemovableMedia),
                "USB" or "REMOVABLE" => query.Where(x => x.IsRemovableMedia),
                "CUSTOM_PATH" or "NON_STANDARD" => query.Where(x => x.IsCustomPath),
                _ => query
            };

            if (!string.IsNullOrEmpty(_currentSortMember))
            {
                query = _currentSortMember switch
                {
                    "CategoryBadgeText" => _isSortAscending ? query.OrderBy(x => x.CategoryBadgeText) : query.OrderByDescending(x => x.CategoryBadgeText),
                    "StorageLocationBadge" => _isSortAscending ? query.OrderBy(x => x.StorageLocationBadge) : query.OrderByDescending(x => x.StorageLocationBadge),
                    "CommonName" => _isSortAscending ? query.OrderBy(x => x.CommonName) : query.OrderByDescending(x => x.CommonName),
                    "IssuerName" => _isSortAscending ? query.OrderBy(x => x.IssuerName) : query.OrderByDescending(x => x.IssuerName),
                    "NotAfter" => _isSortAscending ? query.OrderBy(x => x.NotAfter) : query.OrderByDescending(x => x.NotAfter),
                    "StatusDisplayText" => _isSortAscending ? query.OrderBy(x => x.StatusDisplayText) : query.OrderByDescending(x => x.StatusDisplayText),
                    _ => query
                };
            }

            FilteredCertificates = new ObservableCollection<CertificateItem>(query);
            for (int i = 0; i < FilteredCertificates.Count; i++)
            {
                FilteredCertificates[i].IndexNumber = i + 1;
            }
            UpdateCounts();
            (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (BackupAllCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }

        public void SortFilteredCertificates(string memberPath, bool ascending)
        {
            _currentSortMember = memberPath;
            _isSortAscending = ascending;
            ApplyFilter();
        }

        public void UpdateCounts()
        {
            OnPropertyChanged(nameof(TotalCount));
            OnPropertyChanged(nameof(GpkiCount));
            OnPropertyChanged(nameof(EpkiCount));
            OnPropertyChanged(nameof(NpkiCount));
            OnPropertyChanged(nameof(Class1Count));
            OnPropertyChanged(nameof(ExpiredCount));
            OnPropertyChanged(nameof(ComputerCount));
            OnPropertyChanged(nameof(UsbCount));
            OnPropertyChanged(nameof(CustomPathCount));
            OnPropertyChanged(nameof(SelectedCertificatesCount));
            OnPropertyChanged(nameof(TrashCount));
            OnPropertyChanged(nameof(LogCount));
            OnPropertyChanged(nameof(HasUsbDrives));
            OnPropertyChanged(nameof(ConnectedUsbCount));
            OnPropertyChanged(nameof(HasExpiryAlert));
            OnPropertyChanged(nameof(IsExpiryCritical));
            OnPropertyChanged(nameof(ExpiryBannerMessage));
        }

        private void ExecuteEjectDrive(DriveItem? drive)
        {
            if (drive == null || !drive.IsRemovable) return;

            var res = NativeStorageInterop.EjectUsbDrive(drive.Name);
            if (res.Success)
            {
                StatusMessage = res.Message;
                ShowToast($"🔌 {res.Message}");
                ActivityLogService.Instance.Log(
                    LogCategory.SECURITY,
                    LogLevel.SUCCESS,
                    $"{res.DriveLetter} USB 안전 제거 완료",
                    res.Message,
                    res.DriveLetter,
                    "Safely Ejected");
                RefreshDrives();
                _ = RefreshCertificatesAsync();
            }
            else if (res.IsLockedByOtherProcess)
            {
                var ask = MessageBox.Show(
                    $"{res.Message}\n\nWindows 기본 '하드웨어 안전하게 제거' 창을 열어 분리하시겠습니까?",
                    "USB 안전 제거 안내",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Warning);

                if (ask == MessageBoxResult.Yes)
                {
                    NativeStorageInterop.OpenWindowsSafeRemovalDialog();
                }
            }
            else
            {
                MessageBox.Show(res.Message, "USB 안전 제거 안내", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private async Task QuickBackupToDriveAsync(DriveItem? drive)
        {
            if (drive == null) return;
            if (drive.IsCdRom)
            {
                MessageBox.Show(
                    "선택하신 드라이브는 CD/DVD-ROM(읽기 전용 매체)이므로 백업이나 복사를 진행할 수 없습니다.\n\n" +
                    "로컬 디스크(C:, D: 등) 또는 USB 메모리를 대상 드라이브로 선택해 주세요.",
                    "CD-ROM 기록 불가", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            SelectedTargetDrive = drive;

            var selected = FilteredCertificates.Where(x => x != null && x.IsSelected).ToList();
            if (!selected.Any() && SelectedCertificate != null && FilteredCertificates.Contains(SelectedCertificate))
            {
                selected = new List<CertificateItem> { SelectedCertificate };
            }

            if (!selected.Any())
            {
                MessageBox.Show(
                    "복사 또는 백업할 인증서의 체크박스를 1개 이상 선택하거나 목록에서 항목을 선택해 주세요.",
                    "선택된 인증서 없음",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
                return;
            }

            await RefreshDrivesAsync();

            Views.TargetDrivePickerDialog? dialog = null;
            bool? res = null;
            await DispatchSafeAsync(() =>
            {
                dialog = new Views.TargetDrivePickerDialog(selected, AvailableTargetDrives)
                {
                    Owner = Application.Current?.MainWindow
                };
                res = dialog.ShowDialog();
            });

            if (dialog != null && res == true && dialog.SelectedDrive != null)
            {
                SelectedTargetDrive = dialog.SelectedDrive;
                await ExecuteBackupWithConflictOptionAsync(selected, dialog.SelectedDrive, dialog.ConflictOption);
            }
        }

        private async Task BackupSelectedAsync()
        {
            var selected = FilteredCertificates.Where(x => x != null && x.IsSelected).ToList();

            if (!selected.Any())
            {
                if (SelectedCertificate != null && FilteredCertificates.Contains(SelectedCertificate))
                {
                    selected = new List<CertificateItem> { SelectedCertificate };
                }
                else
                {
                    MessageBox.Show("복사 또는 백업할 인증서의 체크박스를 1개 이상 선택하거나 목록에서 항목을 선택해 주세요.", "선택된 인증서 없음", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }
            }

            await RefreshDrivesAsync();

            Views.TargetDrivePickerDialog? dialog = null;
            bool? res = null;
            await DispatchSafeAsync(() =>
            {
                dialog = new Views.TargetDrivePickerDialog(selected, AvailableTargetDrives)
                {
                    Owner = Application.Current?.MainWindow
                };
                res = dialog.ShowDialog();
            });

            if (dialog != null && res == true && dialog.SelectedDrive != null)
            {
                SelectedTargetDrive = dialog.SelectedDrive;
                await ExecuteBackupWithConflictOptionAsync(selected, dialog.SelectedDrive, dialog.ConflictOption);
            }
        }

        private static string ResolveBackupDestinationRoot(string targetDriveName, CertificateItem cert)
        {
            string cleanTarget = (targetDriveName ?? string.Empty).TrimEnd('\\').ToUpperInvariant();
            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\').ToUpperInvariant();

            if (string.Equals(cleanTarget, sysRoot, StringComparison.OrdinalIgnoreCase))
            {
                if (cert.Category == CertCategory.GPKI)
                {
                    return sysRoot + "\\";
                }

                var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                return Path.Combine(userProfile, "AppData", "LocalLow");
            }

            return string.IsNullOrWhiteSpace(cleanTarget) ? (targetDriveName ?? string.Empty) : cleanTarget + "\\";
        }

        public async Task ExecuteBackupWithConflictOptionAsync(List<CertificateItem> selected, DriveItem targetDrive, string conflictOption)
        {
            if (targetDrive == null || selected == null || !selected.Any()) return;

            try
            {
                var targetDriveName = targetDrive.Name ?? string.Empty;
                bool isTargetUsb = targetDrive.IsRemovable;
                string cleanTarget = targetDriveName.TrimEnd('\\').ToUpperInvariant();

                // 0. 전체 자가 복사(동일 폴더 복사) 사전 차단
                bool isAllSelfCopy = selected.All(cert =>
                {
                    if (cert == null || string.IsNullOrWhiteSpace(cert.DirectoryPath)) return false;
                    try
                    {
                        string destRoot = ResolveBackupDestinationRoot(targetDriveName, cert);
                        string safeRel = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                        string expectedDstDir = Path.GetFullPath(Path.Combine(destRoot, safeRel)).TrimEnd('\\');
                        string currentSrcDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd('\\');
                        return string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase);
                    }
                    catch
                    {
                        return false;
                    }
                });

                if (isAllSelfCopy)
                {
                    PlayErrorSound();
                    if (IsGuidedWorkflowActive)
                    {
                        GuidedWorkflowStepTitle = "⚠️ 같은 위치 복사 불가";
                        GuidedWorkflowStepDescription = $"선택한 인증서가 이미 {targetDriveName}의 같은 폴더에 있습니다. 다른 드라이브를 선택하세요.";
                    }
                    UserFriendlyMessageHelper.ShowWarning(
                        $"선택한 인증서가 이미 대상 드라이브({targetDriveName})의 같은 폴더에 있습니다.\n\n다른 드라이브(USB 메모리 등)를 선택해 주세요.",
                        "같은 위치 복사 불가",
                        "• 원본과 같은 드라이브·폴더로는 자가 복사를 할 수 없습니다.\n• 다른 드라이브(예: USB 메모리)를 선택해 다시 시도하세요.");
                    return;
                }

                // 1. 복사 대상 드라이브에 원본과 동일한 인증서가 이미 존재하는지 '중복 방지 체크' 사전 검사
                var duplicateConflicts = new List<Views.DuplicateConflictEntry>();
                var conflictCertPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var cert in selected)
                {
                    if (cert == null || string.IsNullOrWhiteSpace(cert.DirectoryPath)) continue;

                    string destRoot = ResolveBackupDestinationRoot(targetDriveName, cert);
                    string safeRel = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                    string expectedDstDir = Path.GetFullPath(Path.Combine(destRoot, safeRel)).TrimEnd('\\');
                    string currentSrcDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd('\\');

                    // 동일 폴더 자가 복사(Self-Copy)는 별도 처리되므로 중복 체크 제외
                    if (string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase))
                        continue;

                    // 대상 폴더가 이미 물리적으로 존재하고 내부에 인증서 파일(.der, .cer, .key)이 들어있는 경우
                    bool hasCertFiles = false;
                    try
                    {
                        if (Directory.Exists(expectedDstDir))
                        {
                            hasCertFiles = Directory.GetFiles(expectedDstDir)
                                .Any(f => f.EndsWith(".der", StringComparison.OrdinalIgnoreCase) ||
                                          f.EndsWith(".cer", StringComparison.OrdinalIgnoreCase) ||
                                          f.EndsWith(".key", StringComparison.OrdinalIgnoreCase));
                        }
                    }
                    catch
                    {
                        hasCertFiles = false;
                    }

                    // 또는 현재 로드된 인증서 목록 중 대상 드라이브에 동일한 인증서(경로/일련번호+발급자/구분+CN+발급자)가 이미 보관 중인 경우
                    bool matchInLoadedCerts = _allCertificates.Any(c =>
                        !string.Equals(c.DirectoryPath, cert.DirectoryPath, StringComparison.OrdinalIgnoreCase) &&
                        (c.DriveLetter?.TrimEnd('\\').ToUpperInvariant() == cleanTarget ||
                         c.DirectoryPath?.ToUpperInvariant().StartsWith(cleanTarget + "\\") == true) &&
                        (string.Equals(c.DirectoryPath?.TrimEnd('\\'), expectedDstDir, StringComparison.OrdinalIgnoreCase) ||
                         (!string.IsNullOrWhiteSpace(cert.SerialNumber) &&
                          string.Equals(c.SerialNumber, cert.SerialNumber, StringComparison.OrdinalIgnoreCase) &&
                          string.Equals(c.IssuerName, cert.IssuerName, StringComparison.OrdinalIgnoreCase)) ||
                         (c.Category == cert.Category &&
                          string.Equals(c.CommonName, cert.CommonName, StringComparison.OrdinalIgnoreCase) &&
                          string.Equals(c.IssuerName, cert.IssuerName, StringComparison.OrdinalIgnoreCase))));

                    if (hasCertFiles || matchInLoadedCerts)
                {
                    duplicateConflicts.Add(new Views.DuplicateConflictEntry
                    {
                        SourceCert = cert,
                        TargetDirectoryPath = expectedDstDir,
                        TargetDriveLetter = targetDriveName
                    });
                    conflictCertPaths.Add(cert.DirectoryPath);
                }
            }

            string actualConflictOption = conflictOption;

            // 2. 이미 복사된 대상 드라이브에서 원본과 동일한 인증서가 감지될 경우, 덮어쓰기 여부를 묻는 '중복 방지 체크' 모달 호출
            if (duplicateConflicts.Any())
            {
                Views.DuplicateConflictDialog? dupDialog = null;
                bool? dupRes = null;
                await DispatchSafeAsync(() =>
                {
                    dupDialog = new Views.DuplicateConflictDialog(duplicateConflicts, targetDrive)
                    {
                        Owner = Application.Current?.MainWindow
                    };
                    dupRes = dupDialog.ShowDialog();
                });

                if (dupRes != true || dupDialog == null)
                {
                    StatusMessage = $"[복사 취소] 대상 드라이브({targetDriveName})의 '중복 방지 체크'에서 사용자가 작업을 취소했습니다.";
                    return;
                }

                actualConflictOption = dupDialog.SelectedAction; // "overwrite" | "rename" | "skip"

                if (IsGuidedWorkflowActive)
                {
                    GuidedWorkflowStepTitle = $"🛡️ 같은 인증서 확인 ({duplicateConflicts.Count}건)";
                    GuidedWorkflowStepDescription = $"{targetDriveName}에 이미 있는 {duplicateConflicts.Count}건의 처리 방법을 선택해 복사를 진행합니다.";
                }
            }

            IsBusy = true;
            StatusMessage = $"{targetDrive.Name}로 인증서 {selected.Count}개 복사 중...";
            // 복사 시작음 영구 제거됨 (PlayStartSound 호출 제거)

            int success = 0;
            int skippedCount = 0;
            int failedCount = 0;
            var copiedTargets = new List<CertificateItem>();
            var highlightDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            await Task.Run(() =>
            {
                foreach (var cert in selected)
                {
                    try
                    {
                        bool isSourceUsb = cert.IsRemovableMedia;
                        string opName = (isSourceUsb, isTargetUsb) switch
                        {
                            (false, true)  => "디스크 ➔ USB 백업",
                            (true, false) => "USB ➔ 디스크 복원",
                            (true, true)   => "USB ➔ USB 복사",
                            (false, false) => "디스크 ➔ 디스크 복사"
                        };

                        // 동일 경로 복사 방지 (대상 폴더와 원본 폴더가 완전히 동일할 때만 자가 복사 생략)
                        string destRoot = ResolveBackupDestinationRoot(targetDriveName, cert);
                        string safeRel = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                        string expectedDstDir = Path.GetFullPath(Path.Combine(destRoot, safeRel)).TrimEnd('\\');
                        string currentSrcDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd('\\');
                        if (string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase))
                        {
                            if (IsGuidedWorkflowActive)
                            {
                                GuidedWorkflowStepTitle = "⚠️ 같은 위치 복사 불가";
                                GuidedWorkflowStepDescription = $"'{cert.CommonName}'은(는) 이미 {targetDriveName}에 있어 건너뛰었습니다. 다른 드라이브를 선택하세요.";
                                PlayErrorSound();
                            }
                            var sameResult = new BackupHistoryItem
                            {
                                CertCommonName = cert.CommonName,
                                SourcePath = cert.DirectoryPath,
                                TargetDrive = targetDriveName,
                                DestinationPath = cert.DirectoryPath,
                                IsSuccess = true,
                                Message = $"이미 대상 드라이브({targetDriveName})의 동일한 폴더에 보관 중인 원본입니다 (자가 복사 생략)."
                            };
                            DispatchSafe(() =>
                            {
                                _backupHistory.Insert(0, sameResult);
                                UpdateBackupHistoryIndices();
                            });
                            skippedCount++;
                            continue;
                        }

                        bool isConflictCert = conflictCertPaths.Contains(cert.DirectoryPath);

                        // [중복 처리 1: 건너뛰기(skip)]
                        if (isConflictCert && actualConflictOption == "skip")
                        {
                            skippedCount++;
                            var skipResult = new BackupHistoryItem
                            {
                                CertCommonName = cert.CommonName,
                                SourcePath = cert.DirectoryPath,
                                TargetDrive = targetDriveName,
                                DestinationPath = expectedDstDir,
                                IsSuccess = true,
                                Message = $"[중복 방지 건너뜀] 대상 드라이브에 이미 동일한 인증서가 존재하여 복사를 건너뛰었습니다."
                            };
                            DispatchSafe(() =>
                            {
                                _backupHistory.Insert(0, skipResult);
                                UpdateBackupHistoryIndices();
                            });
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.INFO,
                                $"인증서 복사 건너뜀 (중복 보존)",
                                $"소유자: {cert.CommonName}, 대상: {expectedDstDir}",
                                cert.DirectoryPath,
                                expectedDstDir);
                            continue;
                        }

                        // [중복 처리 2: 이름 변경 보존(rename)]
                        if (isConflictCert && actualConflictOption == "rename" && Directory.Exists(expectedDstDir))
                        {
                            try
                            {
                                string baseBackupDir = $"{expectedDstDir}_backup_{DateTime.Now:yyyyMMdd_HHmmss}";
                                string backupDir = baseBackupDir;
                                int backupSuffix = 1;
                                while (Directory.Exists(backupDir))
                                {
                                    backupDir = $"{baseBackupDir}_{backupSuffix++}";
                                }
                                Directory.Move(expectedDstDir, backupDir);
                                ActivityLogService.Instance.Log(
                                    LogCategory.BACKUP,
                                    LogLevel.INFO,
                                    $"기존 인증서 백업 폴더 보존",
                                    $"기존 폴더를 안전하게 '{Path.GetFileName(backupDir)}'로 보존 후 최신 인증서를 복사합니다.",
                                    expectedDstDir,
                                    backupDir);
                            }
                            catch (Exception ex)
                            {
                                System.Diagnostics.Debug.WriteLine($"[Rename Backup Error] {ex.Message}");
                                failedCount++;
                                var renameFailResult = new BackupHistoryItem
                                {
                                    CertCommonName = cert.CommonName,
                                    SourcePath = cert.DirectoryPath,
                                    TargetDrive = targetDriveName,
                                    DestinationPath = expectedDstDir,
                                    IsSuccess = false,
                                    Message = $"기존 폴더 백업 이름 변경 실패로 덮어쓰기를 중단했습니다: {ex.Message}"
                                };
                                DispatchSafe(() =>
                                {
                                    _backupHistory.Insert(0, renameFailResult);
                                    UpdateBackupHistoryIndices();
                                });
                                continue;
                            }
                        }

                        // [중복 처리 3: 덮어쓰기(overwrite)]
                        var result = _backupService.BackupCertificateToDrive(cert, targetDriveName);
                        DispatchSafe(() =>
                        {
                            _backupHistory.Insert(0, result);
                            UpdateBackupHistoryIndices();
                        });
                        if (result.IsSuccess)
                        {
                            success++;
                            copiedTargets.Add(cert);
                            highlightDirs.Add(currentSrcDir);
                            if (!string.IsNullOrWhiteSpace(result.DestinationPath))
                            {
                                highlightDirs.Add(Path.GetFullPath(result.DestinationPath).TrimEnd('\\'));
                            }
                            string detailNote = isConflictCert && actualConflictOption == "overwrite" 
                                ? " (기존 동일 인증서 덮어쓰기 갱신 완료)"
                                : "";
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.SUCCESS,
                                $"인증서 {opName} 완료{detailNote}",
                                $"소유자: {cert.CommonName}, SHA-256: {result.Sha256Hash}",
                                cert.DirectoryPath,
                                result.DestinationPath);
                        }
                        else
                        {
                            failedCount++;
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.ERROR,
                                $"인증서 {opName} 실패",
                                result.Message,
                                cert.DirectoryPath,
                                targetDriveName);
                        }
                    }
                    catch (Exception ex)
                    {
                        failedCount++;
                        var failResult = new BackupHistoryItem
                        {
                            CertCommonName = cert.CommonName,
                            SourcePath = cert.DirectoryPath,
                            TargetDrive = targetDriveName,
                            IsSuccess = false,
                            Message = $"복사 중 예외 발생: {ex.Message}"
                        };
                        DispatchSafe(() =>
                        {
                            _backupHistory.Insert(0, failResult);
                            UpdateBackupHistoryIndices();
                        });
                    }
                }
            });

            IsBusy = false;
            StatusMessage = $"완료: {selected.Count}개 중 {success}개 성공 ({targetDriveName}) - 자동 새로고침 진행 중...";
            
            // 복사작업 성공 후 새로고침 자동으로 진행
            await RefreshCertificatesAsync();

            StatusMessage = $"복사/백업 및 자동 새로고침 완료: {selected.Count}개 중 {success}개 성공" +
                (skippedCount > 0 ? $", {skippedCount}개 건너뜀" : string.Empty) +
                (failedCount > 0 ? $", {failedCount}개 실패" : string.Empty) +
                $" ({targetDriveName})";

            string targetTypeName = isTargetUsb ? "이동식 USB" : "로컬 디스크";
            if (success > 0)
            {
                PlayCompletionSound();

                // 새로고침된 라이브 목록(_allCertificates)에서 복사된 원본/사본 행 찾아 1.8초간 강조 효과 적용
                var liveHighlighted = _allCertificates
                    .Where(c => !string.IsNullOrWhiteSpace(c.DirectoryPath) &&
                                highlightDirs.Contains(Path.GetFullPath(c.DirectoryPath).TrimEnd('\\')))
                    .ToList();

                foreach (var liveCert in liveHighlighted)
                {
                    liveCert.IsRecentlyCopied = true;
                }
                _ = Task.Delay(1800).ContinueWith(_ =>
                {
                    DispatchSafe(() =>
                    {
                        foreach (var liveCert in liveHighlighted)
                        {
                            liveCert.IsRecentlyCopied = false;
                        }
                    });
                }, TaskScheduler.Default);
                
                // 마지막 성공 결과에서 대상 경로와 파일 사이즈 정보 추출
                var lastSuccessItem = _backupHistory.FirstOrDefault(h => h.IsSuccess && !string.IsNullOrEmpty(h.DestinationPath));
                string toastPath = lastSuccessItem?.DestinationPath ?? $"{targetDriveName}\\";
                string toastSize = lastSuccessItem?.FileSizeDetails ?? "";

                // 복사 성공 시 SHA-256 무결성 검증 완료 배지 및 정확한 경로/사이즈 토스트 알림 표시
                ShowToast($"⚡ {targetDriveName}로 인증서 {success}건 복사 완료", hasIntegrityBadge: true, filePath: toastPath, fileSize: toastSize);

                if (IsGuidedWorkflowActive && GuidedWorkflowStep == 2)
                {
                    GuidedWorkflowStep = 3;
                    GuidedWorkflowStepTitle = "3단계: 복사 및 손상 검사 완료";
                    GuidedWorkflowStepDescription = $"{targetDriveName}에 복사를 마쳤습니다. 오른쪽 상세 패널에서 저장 위치와 검사 결과를 확인하세요.";
                }
            }

            if (failedCount == 0 && success > 0)
            {
                var completeItems = copiedTargets.Select(c => new OperationCompleteItem
                {
                    Name = !string.IsNullOrWhiteSpace(c.CommonName) ? c.CommonName : "공동인증서",
                    IssuerAndPolicy = $"{c.IssuerName} · 만료일: {c.NotAfter:yyyy-MM-dd}"
                }).ToList();

                string sourcePath = copiedTargets.FirstOrDefault()?.DirectoryPath ?? selected.FirstOrDefault()?.DirectoryPath ?? "내 컴퓨터 (NPKI/GPKI)";
                var lastSuccessItem = _backupHistory.FirstOrDefault(h => h.IsSuccess && !string.IsNullOrEmpty(h.DestinationPath));
                string targetPath = lastSuccessItem?.DestinationPath ?? $"{targetDriveName}\\";

                string subtitle = skippedCount > 0
                    ? $"{targetTypeName}({targetDriveName})에 인증서 {success}개를 안전하게 복사했습니다. (중복 {skippedCount}개 건너뜀)"
                    : $"{targetTypeName}({targetDriveName})에 인증서 {success}개를 안전하게 복사했습니다.";

                UserFriendlyMessageHelper.ShowOperationComplete(
                    "인증서 복사 완료!",
                    subtitle,
                    success,
                    sourcePath,
                    targetPath,
                    completeItems,
                    isTargetUsb
                        ? "• 다른 PC에서 USB를 꽂은 뒤 [이동식 디스크]를 선택해 로그인하세요.\n• 분리 전 작업 표시줄의 '하드웨어 안전하게 제거'를 눌러 주세요."
                        : "• 복사된 표준 폴더를 백업용으로 보관하세요.\n• 필요할 때 언제든 다시 복원할 수 있습니다.");
            }
            else if (failedCount == 0 && skippedCount > 0)
            {
                UserFriendlyMessageHelper.ShowInfo(
                    $"선택한 인증서 {skippedCount}개는 대상 드라이브({targetDriveName})에 이미 존재하여 중복 복사를 건너뛰었습니다.",
                    "중복 인증서 건너뜀 안내");
            }
            else
            {
                if (success == 0)
                {
                    PlayErrorSound();
                }
                var failedItems = _backupHistory.Take(selected.Count).Where(h => !h.IsSuccess).ToList();
                var firstFailMsg = failedItems.FirstOrDefault()?.Message ?? string.Empty;

                if (IsGuidedWorkflowActive)
                {
                    GuidedWorkflowStepTitle = "❌ 복사 오류 발생";
                    GuidedWorkflowStepDescription = $"복사 실패: {(string.IsNullOrEmpty(firstFailMsg) ? "쓰기 권한 또는 공간 부족" : firstFailMsg)} · USB 잠금 해제와 여유 공간을 확인하세요.";
                }

                string errorCategoryTitle = "인증서 복사 실패";
                string detailedTip = "• USB·디스크의 남은 용량과 쓰기 금지(잠금) 여부를 확인하세요.\n• 필요하면 앱을 관리자 권한으로 실행해 보세요.";

                if (firstFailMsg.IndexOf("write-protected", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    firstFailMsg.IndexOf("쓰기 금지", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    firstFailMsg.IndexOf("read-only", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    errorCategoryTitle = "USB 쓰기 금지 (Read-Only) 감지";
                    detailedTip = "1. USB 측면 잠금(Lock) 스위치를 해제하세요.\n" +
                                  "2. 드라이브 속성에서 [읽기 전용] 체크를 해제하세요.\n" +
                                  "3. 사내 보안 프로그램의 USB 쓰기 제한 여부를 확인하세요.";
                }
                else if (firstFailMsg.IndexOf("space", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         firstFailMsg.IndexOf("공간이 부족", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         firstFailMsg.IndexOf("disk full", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    errorCategoryTitle = "저장 공간 부족";
                    detailedTip = "1. 대상 드라이브의 불필요한 파일을 비워 공간을 확보하세요.\n" +
                                  "2. 여유 공간이 충분한 다른 USB를 선택하세요.";
                }
                else if (firstFailMsg.IndexOf("access", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         firstFailMsg.IndexOf("권한", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         firstFailMsg.IndexOf("denied", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    errorCategoryTitle = "쓰기 권한 부족";
                    detailedTip = "1. 프로그램을 [관리자 권한으로 실행]해 보세요.\n" +
                                  "2. 백신·보안 프로그램이 폴더 쓰기를 막고 있는지 확인하세요.";
                }

                UserFriendlyMessageHelper.ShowWarning(
                    $"{targetDriveName}: {selected.Count}개 중 {success}개 성공, {failedCount}개 실패" +
                    (skippedCount > 0 ? $", {skippedCount}개 건너뜀" : string.Empty) +
                    $"\n원인: {(string.IsNullOrEmpty(firstFailMsg) ? "쓰기 권한 또는 입출력 오류" : firstFailMsg)}",
                    errorCategoryTitle,
                    detailedTip);
                }
            }
            catch (Exception ex)
            {
                PlayErrorSound();
                StatusMessage = $"인증서 복사 중 오류: {ex.Message}";
                UserFriendlyMessageHelper.ShowError(ex, "인증서 복사 처리");
            }
            finally
            {
                IsBusy = false;
            }
        }

        private async Task BackupAllAsync()
        {
            var list = _filteredCertificates.Where(x => x != null).ToList();

            if (!list.Any())
            {
                MessageBox.Show("현재 표시된 목록에 복사할 인증서가 없습니다.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            await RefreshDrivesAsync();

            Views.TargetDrivePickerDialog? dialog = null;
            bool? res = null;
            await DispatchSafeAsync(() =>
            {
                dialog = new Views.TargetDrivePickerDialog(list, AvailableTargetDrives)
                {
                    Owner = Application.Current?.MainWindow
                };
                res = dialog.ShowDialog();
            });

            if (dialog != null && res == true && dialog.SelectedDrive != null)
            {
                SelectedTargetDrive = dialog.SelectedDrive;
                await ExecuteBackupWithConflictOptionAsync(list, dialog.SelectedDrive, dialog.ConflictOption);
            }
        }

        /// <summary>
        /// Fix for partial deletion bug: Deletes ALL checked items if any are selected,
        /// or the highlighted SelectedCertificate if no checkboxes are active.
        /// </summary>
        private void DeleteSelected()
        {
            var toDelete = FilteredCertificates.Where(x => x != null && x.IsSelected).ToList();
            if (!toDelete.Any() && SelectedCertificate != null && FilteredCertificates.Contains(SelectedCertificate))
            {
                toDelete.Add(SelectedCertificate);
            }

            if (!toDelete.Any())
            {
                MessageBox.Show("삭제할 인증서를 선택해주세요.", "선택된 인증서 없음", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var promptMsg = toDelete.Count == 1
                ? $"[{toDelete[0].CommonName}] 인증서를 휴지통으로 옮기시겠습니까?\n(휴지통에서 언제든 복원 가능)"
                : $"선택한 인증서 {toDelete.Count}개를 휴지통으로 옮기시겠습니까?\n(휴지통에서 언제든 복원 가능)";

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

                if (dialog.ShowDialog() != true)
                {
                    RestoreFilteredIndices();
                    return;
                }

                var targets = dialog.SelectedCertificates;
                if (targets == null || !targets.Any())
                {
                    RestoreFilteredIndices();
                    return;
                }

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
                RestoreFilteredIndices();
                UserFriendlyMessageHelper.ShowError(ex, "만료된 인증서 안전 정리");
            }
        }

        private void RestoreFilteredIndices()
        {
            for (int i = 0; i < _filteredCertificates.Count; i++)
            {
                _filteredCertificates[i].IndexNumber = i + 1;
            }
        }

        private void UndoDelete()
        {
            if (!_lastDeletedBatch.Any()) return;

            try
            {
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
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "삭제 실행 취소(되돌리기)");
            }
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

        public async Task<bool> CheckForAppUpdatesAsync(bool isSilentWhenUpToDate = false)
        {
            if (!isSilentWhenUpToDate)
            {
                StatusMessage = "최신 버전 확인 중...";
            }

            try
            {
                var info = await UpdateCheckerService.CheckForUpdatesAsync();
                if (info.HasUpdate)
                {
                    StatusMessage = $"새 버전(v{info.LatestVersion}) 감지됨";

                    bool runFallbackSelfUpdate = false;
                    await DispatchSafeAsync(() =>
                    {
                        try
                        {
                            var dialog = new KCertManager.Wpf.Views.UpdateNotificationDialog(info)
                            {
                                Owner = Application.Current?.MainWindow
                            };
                            dialog.ShowDialog();
                        }
                        catch
                        {
                            // Fallback if dialog creation fails: execute silent self-update directly without opening GitHub
                            var res = MessageBox.Show(
                                $"새 버전(v{info.LatestVersion})이 있습니다. (현재: v{info.CurrentVersion})\n\n확인 시 앱에서 바로 다운받아 자동 설치합니다.",
                                "새 버전 업데이트",
                                MessageBoxButton.YesNo,
                                MessageBoxImage.Information);

                            runFallbackSelfUpdate = res == MessageBoxResult.Yes;
                        }
                    });

                    if (runFallbackSelfUpdate)
                    {
                        StatusMessage = $"새 버전(v{info.LatestVersion}) 다운로드 및 설치 중...";
                        var selfRes = await UpdateCheckerService.DownloadAndInstallAsync(info);
                        if (selfRes.Success && selfRes.ShouldShutdownForInstall)
                        {
                            await DispatchSafeAsync(() => Application.Current?.Shutdown());
                        }
                        else if (!selfRes.Success)
                        {
                            await DispatchSafeAsync(() =>
                                MessageBox.Show(selfRes.Message, "자동 업데이트 오류", MessageBoxButton.OK, MessageBoxImage.Warning));
                        }
                    }
                    return true;
                }
                else
                {
                    if (!isSilentWhenUpToDate)
                    {
                        StatusMessage = $"현재 버전(v{info.CurrentVersion})이 최신 버전입니다.";
                        await DispatchSafeAsync(() =>
                        {
                            MessageBox.Show(
                                $"현재 최신 버전(v{info.CurrentVersion})을 사용 중입니다.",
                                "업데이트 확인",
                                MessageBoxButton.OK,
                                MessageBoxImage.Information);
                        });
                    }
                    else
                    {
                        StatusMessage = "준비 완료 (최신 버전 확인됨)";
                    }
                    return false;
                }
            }
            catch (Exception ex)
            {
                if (!isSilentWhenUpToDate)
                {
                    StatusMessage = "업데이트 확인 실패";
                    await DispatchSafeAsync(() =>
                    {
                        MessageBox.Show($"업데이트 확인 중 오류가 발생했습니다:\n{ex.Message}", "업데이트 확인", MessageBoxButton.OK, MessageBoxImage.Warning);
                    });
                }
                return false;
            }
        }

        public void Dispose()
        {
            try
            {
                _scanCts?.Cancel();
                _scanCts?.Dispose();
                _scanCts = null;
                _toastCts?.Cancel();
                _toastCts?.Dispose();
                _toastCts = null;
                _driveWatcher.Dispose();
            }
            catch { }
        }

        private void UpdateBackupHistoryIndices()
        {
            if (_backupHistory == null) return;
            for (int i = 0; i < _backupHistory.Count; i++)
            {
                _backupHistory[i].IndexNumber = i + 1;
            }
        }

        #endregion
    }
}
