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
        private string _statusMessage = "준비 완료 (로컬 보안 격리)";
        private List<TrashItem> _lastDeletedBatch = new();
        private bool _canUndo;

        private bool _isSimpleMode = true;
        private bool _isDriveAdvancedMode;
        private bool _showAllDrivesInStatus;
        private string _currentTheme = "dark";
        private string _currentSortMember = "NotAfter";
        private bool _isSortAscending = true;

        private bool _isToastVisible;
        private string _toastMessage = string.Empty;
        private bool _toastHasIntegrityBadge;
        private string _toastFilePath = string.Empty;
        private string _toastFileSize = string.Empty;
        private System.Threading.CancellationTokenSource? _toastCts;

        private bool _isGuidedWorkflowActive;
        private string _guidedWorkflowType = "pc_to_usb";
        private int _guidedWorkflowStep = 1;
        private string _guidedWorkflowTitle = "🚀 PC ➔ USB 백업 가이드 모션";
        private string _guidedWorkflowStepTitle = "1단계: 복사할 인증서 선택";
        private string _guidedWorkflowStepDescription = "목록에서 USB로 복사할 인증서를 선택(체크)해 주세요.";

        public MainViewModel()
        {
            // 앱 시작 시 초기 테마(다크) 리소스 완전 강제 적용 (시작 시 브러시 누락 방지)
            ApplyTheme(_currentTheme);

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
            CheckUpdatesCommand = new RelayCommand(async () => await CheckForAppUpdatesAsync());
            ShowStartupWorkflowCommand = new RelayCommand(ShowStartupWorkflowDialog);
            CloseToastCommand = new RelayCommand(() => IsToastVisible = false);

            StartGuidedWorkflowCommand = new RelayCommand<string>(StartGuidedWorkflow);
            NextGuidedStepCommand = new RelayCommand(NextGuidedStep);
            PrevGuidedStepCommand = new RelayCommand(PrevGuidedStep);
            EndGuidedWorkflowCommand = new RelayCommand(EndGuidedWorkflow);
            GuidedExecuteCopyCommand = new RelayCommand(ExecuteGuidedCopy);

            ToggleCertificateDetailSidebarCommand = new RelayCommand(() => IsCertificateDetailSidebarVisible = !IsCertificateDetailSidebarVisible);
            CloseCertificateDetailSidebarCommand = new RelayCommand(() => IsCertificateDetailSidebarVisible = false);
            CopySelectedCertDetailsCommand = new RelayCommand(CopySelectedCertDetails);
            OpenSelectedCertDirectoryCommand = new RelayCommand(OpenSelectedCertDirectory);

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
            Task.Run(async () =>
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

                // 앱 시작 시 백그라운드 자동 업데이트 확인 및 작업 선택 창 연동
                try
                {
                    await Task.Delay(1200);
                    await CheckForAppUpdatesAsync(isSilentWhenUpToDate: true);

                    // 업데이트 확인 후 작업 선택 창 다이얼로그 안내
                    Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                    {
                        ShowStartupWorkflowDialog();
                    }));
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Startup Auto Update Check] {ex.Message}");
                }
            });
        }

        #region Properties

        public bool IsSimpleMode
        {
            get => _isSimpleMode;
            set
            {
                if (SetProperty(ref _isSimpleMode, value))
                {
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

        private bool _isCertificateDetailSidebarVisible = true;
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
            _toastCts?.Cancel();
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
                    Application.Current?.Dispatcher?.Invoke(() => IsToastVisible = false);
                }
            }, TaskScheduler.Default);
        }

        public void ShowStartupWorkflowDialog()
        {
            Application.Current?.Dispatcher?.Invoke(() =>
            {
                try
                {
                    var dialog = new Views.StartupWorkflowDialog
                    {
                        Owner = Application.Current?.MainWindow
                    };
                    if (dialog.ShowDialog() == true)
                    {
                        if (dialog.SelectedResult == Views.StartupWorkflowResult.PcToUsb)
                        {
                            StartGuidedWorkflow("pc_to_usb");
                        }
                        else if (dialog.SelectedResult == Views.StartupWorkflowResult.UsbToPc)
                        {
                            StartGuidedWorkflow("usb_to_pc");
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
            GuidedWorkflowType = type ?? "pc_to_usb";
            IsGuidedWorkflowActive = true;
            GuidedWorkflowStep = 1;

            if (GuidedWorkflowType == "pc_to_usb")
            {
                GuidedWorkflowTitle = "🚀 시작가이드: PC ➔ USB 백업";
                GuidedWorkflowStepTitle = "1단계: 복사할 PC 인증서 선택";
                GuidedWorkflowStepDescription = "목록에서 USB로 복사할 인증서를 클릭하거나 체크박스를 선택하세요. [다음: USB 복사 진행 ➔]을 클릭하시면 복사 창이 열립니다.";

                // PC 로컬 인증서 우선 자동 선택
                var pcCert = FilteredCertificates.FirstOrDefault(c => !c.IsRemovableMedia) ?? FilteredCertificates.FirstOrDefault();
                if (pcCert != null)
                {
                    foreach (var c in FilteredCertificates)
                    {
                        c.IsSelected = (c == pcCert);
                    }
                    SelectedCertificate = pcCert;
                    OnPropertyChanged(nameof(SelectedCertificatesCount));
                    (BackupSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
            else
            {
                GuidedWorkflowTitle = "🚀 시작가이드: USB ➔ PC 가져오기";
                GuidedWorkflowStepTitle = "1단계: 가져올 USB 드라이브 및 인증서 선택";
                GuidedWorkflowStepDescription = "USB 이동식 메모리의 인증서를 확인하고 가져오기를 진행합니다.";

                // Open UsbTransferDialog directly
                Application.Current?.Dispatcher?.Invoke(() =>
                {
                    var dlg = new Views.UsbTransferDialog
                    {
                        Owner = Application.Current?.MainWindow
                    };
                    dlg.ShowDialog();
                });
                IsGuidedWorkflowActive = false;
            }
        }

        public void NextGuidedStep()
        {
            if (!IsGuidedWorkflowActive) return;

            if (GuidedWorkflowStep == 1)
            {
                var selected = FilteredCertificates.Where(x => x.IsSelected).ToList();
                if (!selected.Any())
                {
                    if (SelectedCertificate != null)
                    {
                        SelectedCertificate.IsSelected = true;
                        selected.Add(SelectedCertificate);
                    }
                    else if (FilteredCertificates.Any())
                    {
                        var pick = FilteredCertificates.FirstOrDefault(c => !c.IsRemovableMedia) ?? FilteredCertificates[0];
                        pick.IsSelected = true;
                        SelectedCertificate = pick;
                        selected.Add(pick);
                    }
                    else
                    {
                        UserFriendlyMessageHelper.ShowWarning(
                            "복사할 인증서가 목록에 없습니다. 먼저 PC에 저장된 인증서를 확인해 주세요.",
                            "인증서 선택 필요");
                        return;
                    }
                }

                GuidedWorkflowStep = 2;
                GuidedWorkflowStepTitle = "2단계: 대상 USB 지정 및 복사 실행";
                GuidedWorkflowStepDescription = $"선택된 인증서({selected.Count}건)를 저장할 대상 USB 드라이브를 지정합니다. 복사 창에서 대상 드라이브를 선택 후 [복사 시작]을 누르세요.";

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
            var selected = FilteredCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any())
            {
                if (SelectedCertificate != null)
                {
                    SelectedCertificate.IsSelected = true;
                    selected.Add(SelectedCertificate);
                }
                else if (FilteredCertificates.Any())
                {
                    var pick = FilteredCertificates.FirstOrDefault(c => !c.IsRemovableMedia) ?? FilteredCertificates[0];
                    pick.IsSelected = true;
                    SelectedCertificate = pick;
                    selected.Add(pick);
                }
            }

            if (!selected.Any())
            {
                UserFriendlyMessageHelper.ShowWarning(
                    "복사할 인증서가 선택되지 않았습니다. 목록에서 복사할 인증서를 먼저 선택해 주세요.",
                    "선택 오류 안내");
                return;
            }

            RequestOpenTargetDrivePicker?.Invoke(selected);
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
                sb.AppendLine($"전자서명 알고리즘: {cert.SignatureAlgorithm}");
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
            if (cert == null || string.IsNullOrWhiteSpace(cert.DirectoryPath)) return;

            try
            {
                if (Directory.Exists(cert.DirectoryPath))
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "explorer.exe",
                        Arguments = $"\"{cert.DirectoryPath}\"",
                        UseShellExecute = true
                    });
                }
                else
                {
                    UserFriendlyMessageHelper.ShowWarning(
                        $"인증서 폴더가 존재하지 않거나 현재 연결 해제된 드라이브입니다:\n\n{cert.DirectoryPath}",
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
                    GuidedWorkflowStepTitle = "2단계: 백업 대상 USB 지정 및 복사 실행";
                    GuidedWorkflowStepDescription = "하단 또는 상단 드라이브 바에서 대상 USB를 지정 후 [백업/복사] 버튼을 누르세요.";
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
                System.Windows.Media.Color bgDark, bgCard, bgCardHover, textPrimary, textSecondary, borderColor, accentText, mutedText;

                if (themeName == "dark" || themeName == "pastel-black")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F1219");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1A1F2C");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#262E3F");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBD5E1");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#2D3546");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#60A5FA");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#94A3B8");
                }
                else if (themeName == "gray" || themeName == "pastel-gray")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#E2E8F0");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1F5F9");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E293B");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#94A3B8");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1D4ED8");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#475569");
                }
                else if (themeName == "beige" || themeName == "pastel-beige")
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F5F2EB");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#EEE9DE");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1C1917");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#292524");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#D6CEBF");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E40AF");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#44403C");
                }
                else // white (pastel-white)
                {
                    bgDark = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F8FAFC");
                    bgCard = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FFFFFF");
                    bgCardHover = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F1F5F9");
                    textPrimary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#0F172A");
                    textSecondary = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E293B");
                    borderColor = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#CBD5E1");
                    accentText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1D4ED8");
                    mutedText = (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#475569");
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
                res["AccentTextBrush"] = new System.Windows.Media.SolidColorBrush(accentText);
                res["MutedTextBrush"] = new System.Windows.Media.SolidColorBrush(mutedText);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[ApplyTheme Error] {ex.Message}");
            }
        }

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
        public ICommand CheckUpdatesCommand { get; }

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

                // 1. 순수 이동식 USB 드라이브 (CD-ROM 배제)
                var drives = all.Where(d => d.IsRemovable && !d.IsCdRom).ToList();
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
                    // USB 드라이브 우선 선택, 없으면 보조 디스크(D:) 또는 첫 번째 사용 가능 디스크 선택
                    SelectedTargetDrive = RemovableDrives.FirstOrDefault(d => d.IsReady)
                                       ?? AvailableTargetDrives.FirstOrDefault(d => !string.Equals(d.Name, "C:\\", StringComparison.OrdinalIgnoreCase))
                                       ?? AvailableTargetDrives.FirstOrDefault();
                }
                else
                {
                    var current = AvailableTargetDrives.FirstOrDefault(d => d.Name == SelectedTargetDrive.Name);
                    if (current != null)
                    {
                        SelectedTargetDrive = current;
                    }
                    else
                    {
                        SelectedTargetDrive = AvailableTargetDrives.FirstOrDefault();
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
            if (drive.IsCdRom)
            {
                MessageBox.Show(
                    "선택하신 드라이브는 CD/DVD-ROM(읽기 전용 매체)이므로 백업이나 복사를 진행할 수 없습니다.\n\n" +
                    "로컬 디스크(C:, D: 등) 또는 USB 메모리를 대상 드라이브로 선택해 주세요.",
                    "CD-ROM 기록 불가", MessageBoxButton.OK, MessageBoxImage.Warning);
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
            var selected = _allCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any() && SelectedCertificate != null)
            {
                selected.Add(SelectedCertificate);
            }

            if (!selected.Any())
            {
                MessageBox.Show("복사 또는 백업할 인증서를 1개 이상 선택(체크)해 주세요.", "선택된 인증서 없음", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            RefreshDrives();

            Views.TargetDrivePickerDialog? dialog = null;
            Application.Current?.Dispatcher?.Invoke(() =>
            {
                dialog = new Views.TargetDrivePickerDialog(selected, AvailableTargetDrives)
                {
                    Owner = Application.Current.MainWindow
                };
            });

            if (dialog != null)
            {
                bool? res = null;
                Application.Current?.Dispatcher?.Invoke(() => { res = dialog.ShowDialog(); });
                if (res == true && dialog.SelectedDrive != null)
                {
                    SelectedTargetDrive = dialog.SelectedDrive;
                    await ExecuteBackupWithConflictOptionAsync(selected, dialog.SelectedDrive, dialog.ConflictOption);
                }
            }
        }

        public async Task ExecuteBackupWithConflictOptionAsync(List<CertificateItem> selected, DriveItem targetDrive, string conflictOption)
        {
            if (targetDrive == null || !selected.Any()) return;

            IsBusy = true;
            StatusMessage = $"선택한 {selected.Count}개 인증서를 {targetDrive.Name}로 복사 중...";

            int success = 0;
            var targetDriveName = targetDrive.Name;
            bool isTargetUsb = targetDrive.IsRemovable;
            string targetRoot = targetDriveName.TrimEnd('\\').ToUpperInvariant() + "\\";

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
                        string safeRel = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                        string expectedDstDir = Path.GetFullPath(Path.Combine(targetRoot, safeRel)).TrimEnd('\\');
                        string currentSrcDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd('\\');
                        if (string.Equals(currentSrcDir, expectedDstDir, StringComparison.OrdinalIgnoreCase))
                        {
                            var sameResult = new BackupHistoryItem
                            {
                                CertCommonName = cert.CommonName,
                                SourcePath = cert.DirectoryPath,
                                TargetDrive = targetDriveName,
                                DestinationPath = cert.DirectoryPath,
                                IsSuccess = true,
                                Message = $"이미 대상 드라이브({targetDriveName})의 동일한 폴더에 보관 중인 원본입니다 (자가 복사 생략)."
                            };
                            Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, sameResult)));
                            success++;
                            continue;
                        }

                        var result = _backupService.BackupCertificateToDrive(cert, targetDriveName);
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, result)));
                        if (result.IsSuccess)
                        {
                            success++;
                            ActivityLogService.Instance.Log(
                                LogCategory.BACKUP,
                                LogLevel.SUCCESS,
                                $"인증서 {opName} 완료 (옵션: {conflictOption})",
                                $"소유자: {cert.CommonName}, SHA-256: {result.Sha256Hash}",
                                cert.DirectoryPath,
                                result.DestinationPath);
                        }
                        else
                        {
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
                        var failResult = new BackupHistoryItem
                        {
                            CertCommonName = cert.CommonName,
                            SourcePath = cert.DirectoryPath,
                            TargetDrive = targetDriveName,
                            IsSuccess = false,
                            Message = $"복사 중 예외 발생: {ex.Message}"
                        };
                        Application.Current?.Dispatcher?.BeginInvoke(new Action(() => _backupHistory.Insert(0, failResult)));
                    }
                }
            });

            IsBusy = false;
            StatusMessage = $"완료: {selected.Count}개 중 {success}개 성공 ({targetDriveName}) - 자동 새로고침 진행 중...";
            
            // 복사작업 성공 후 새로고침 자동으로 진행
            await RefreshCertificatesAsync();

            StatusMessage = $"복사/백업 및 자동 새로고침 완료: {selected.Count}개 중 {success}개 성공 ({targetDriveName})";

            string targetTypeName = isTargetUsb ? "이동식 USB" : "로컬 디스크";
            if (success > 0)
            {
                try 
                { 
                    System.Media.SystemSounds.Asterisk.Play(); 
                } 
                catch { }

                // 1.8초간 복사된 행에 반짝이는 강조 효과(Highlight Animation) 적용
                foreach (var cert in selected)
                {
                    cert.IsRecentlyCopied = true;
                }
                Task.Delay(1800).ContinueWith(_ =>
                {
                    Application.Current?.Dispatcher?.Invoke(() =>
                    {
                        foreach (var cert in selected)
                        {
                            cert.IsRecentlyCopied = false;
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
                    GuidedWorkflowStepTitle = "3단계: 복사 완료 및 무결성 검증 완료";
                    GuidedWorkflowStepDescription = $"선택한 인증서가 대상 드라이브({targetDriveName})로 안전하게 복사되었습니다. 우측 사이드바에서 복사된 인증서의 상세 경로와 SHA-256 무결성을 확인하실 수 있습니다.";
                }
            }

            if (success == selected.Count)
            {
                UserFriendlyMessageHelper.ShowInfo(
                    $"선택하신 인증서 {success}개가 대상 {targetTypeName}({targetDriveName})로 안전하게 복사/백업되었습니다.\n\n인증서 목록과 드라이브 상태가 최신 상태로 새로고침되었습니다.",
                    "인증서 복사 / 백업 완료");
            }
            else
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"인증서 {selected.Count}개 중 {success}개 성공, {selected.Count - success}개 실패하였습니다.\n\n인증서 목록이 자동으로 새로고침되었습니다.",
                    "인증서 복사 결과 안내",
                    "• 대상 디스크/USB의 남은 용량이 충분한지 확인해 주세요.\n• USB의 경우 '쓰기 금지(Lock)' 스위치가 꺼져 있는지 확인해 주세요.\n• 권한 문제가 지속될 경우 관리자 권한으로 실행해 보세요.");
            }
        }

        private async Task BackupAllAsync()
        {
            var list = _filteredCertificates.ToList();
            if (!list.Any())
            {
                list = _allCertificates.ToList();
            }

            if (!list.Any())
            {
                MessageBox.Show("복사할 인증서가 목록에 없습니다.", "알림", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            RefreshDrives();

            Views.TargetDrivePickerDialog? dialog = null;
            Application.Current?.Dispatcher?.Invoke(() =>
            {
                dialog = new Views.TargetDrivePickerDialog(list, AvailableTargetDrives)
                {
                    Owner = Application.Current?.MainWindow
                };
            });

            if (dialog != null)
            {
                bool? res = null;
                Application.Current?.Dispatcher?.Invoke(() => { res = dialog.ShowDialog(); });
                if (res == true && dialog.SelectedDrive != null)
                {
                    SelectedTargetDrive = dialog.SelectedDrive;
                    await ExecuteBackupWithConflictOptionAsync(list, dialog.SelectedDrive, dialog.ConflictOption);
                }
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

        public async Task CheckForAppUpdatesAsync(bool isSilentWhenUpToDate = false)
        {
            if (!isSilentWhenUpToDate)
            {
                StatusMessage = "GitHub 공식 저장소 최신 릴리스 및 버전 확인 중...";
            }

            try
            {
                var info = await UpdateCheckerService.CheckForUpdatesAsync();
                if (info.HasUpdate)
                {
                    StatusMessage = $"새 버전(v{info.LatestVersion}) 감지됨";

                    Application.Current?.Dispatcher?.Invoke(() =>
                    {
                        try
                        {
                            var dialog = new KCertManager.Wpf.Views.UpdateNotificationDialog(
                                info.CurrentVersion,
                                info.LatestVersion,
                                info.ReleaseName,
                                info.ReleaseNotes,
                                info.DownloadUrl ?? "https://github.com/ahbiyout-all/K-Certificate-Manager/releases",
                                info.ReleaseUrl)
                            {
                                Owner = Application.Current?.MainWindow
                            };
                            dialog.ShowDialog();
                        }
                        catch
                        {
                            // Fallback if dialog creation fails
                            var res = MessageBox.Show(
                                $"🚀 새로운 K-인증서 매니저 버전(v{info.LatestVersion})이 감지되었습니다!\n\n" +
                                $"• 현재 설치 버전: v{info.CurrentVersion}\n" +
                                $"• GitHub 최신 버전: v{info.LatestVersion}\n\n" +
                                $"🔗 공식 GitHub 저장소 경로:\n  https://github.com/ahbiyout-all/K-Certificate-Manager\n\n" +
                                "지금 GitHub 릴리스 페이지로 이동하여 새 버전을 다운로드하시겠습니까?",
                                "K-인증서 매니저 - 최신 버전 업데이트 알림",
                                MessageBoxButton.YesNo,
                                MessageBoxImage.Information);

                            if (res == MessageBoxResult.Yes)
                            {
                                try
                                {
                                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                                    {
                                        FileName = !string.IsNullOrWhiteSpace(info.DownloadUrl) ? info.DownloadUrl : info.ReleaseUrl,
                                        UseShellExecute = true
                                    });
                                }
                                catch { }
                            }
                        }
                    });
                }
                else
                {
                    if (!isSilentWhenUpToDate)
                    {
                        StatusMessage = $"현재 버전(v{info.CurrentVersion})이 최신 버전입니다.";
                        Application.Current?.Dispatcher?.Invoke(() =>
                        {
                            MessageBox.Show(
                                $"현재 설치된 K-인증서 매니저(v{info.CurrentVersion})가 가장 최신 버전입니다.\n\n" +
                                "모든 최신 규격과 보안 패치가 완벽하게 적용되어 있습니다.",
                                "최신 버전 확인 완료",
                                MessageBoxButton.OK,
                                MessageBoxImage.Information);
                        });
                    }
                    else
                    {
                        StatusMessage = "준비 완료 (최신 버전 확인됨)";
                    }
                }
            }
            catch (Exception ex)
            {
                if (!isSilentWhenUpToDate)
                {
                    StatusMessage = "업데이트 확인 실패";
                    Application.Current?.Dispatcher?.Invoke(() =>
                    {
                        MessageBox.Show($"업데이트 확인 중 오류가 발생했습니다:\n{ex.Message}", "업데이트 확인", MessageBoxButton.OK, MessageBoxImage.Warning);
                    });
                }
            }
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
