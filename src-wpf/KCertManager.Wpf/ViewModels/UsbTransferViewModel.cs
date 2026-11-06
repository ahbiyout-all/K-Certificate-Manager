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
using KCertManager.Wpf.Views;

namespace KCertManager.Wpf.ViewModels
{
    public class UsbTransferViewModel : ViewModelBase
    {
        private readonly CertificateScannerService _scannerService = new();
        private readonly CertificateBackupService _backupService = new();

        private ObservableCollection<DriveItem> _availableDrives = new();
        private DriveItem? _selectedSourceDrive;
        private ObservableCollection<CertificateItem> _foundUsbCertificates = new();
        private string _targetUsername = Environment.UserName;
        private string _targetCategory = "NPKI";
        private bool _isBusy;
        private bool _hasUsbDrives;
        private string _statusMessage = "USB 드라이브를 선택하세요.";

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
            TransferToPcCommand = new RelayCommand(async () => await TransferToPcAsync(), () => FoundUsbCertificates.Any(x => x.IsSelected));

            RefreshDrives(initialDriveLetter);
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
            set => SetProperty(ref _isBusy, value);
        }

        public string StatusMessage
        {
            get => _statusMessage;
            set => SetProperty(ref _statusMessage, value);
        }

        public ICommand RefreshDrivesCommand { get; }
        public ICommand ScanDriveCommand { get; }
        public ICommand TransferToPcCommand { get; }

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
                    StatusMessage = "연결된 USB 이동식 드라이브가 없습니다. USB 메모리를 PC에 연결한 후 [🔄 드라이브 갱신]을 눌러주세요.";
                    FoundUsbCertificates.Clear();
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

            IsBusy = true;
            StatusMessage = $"{SelectedSourceDrive.Name} 드라이브 내 인증서(NPKI, GPKI, EPKI) 검색 중...";
            FoundUsbCertificates.Clear();

            await Task.Run(() =>
            {
                try
                {
                    var driveRoot = SelectedSourceDrive.Name;
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
                        c.IsSelected = true;
                        c.PropertyChanged += (s, e) =>
                        {
                            if (e.PropertyName == nameof(CertificateItem.IsSelected))
                            {
                                Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                                {
                                    (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                                }));
                            }
                        };
                    }

                    Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                    {
                        FoundUsbCertificates = new ObservableCollection<CertificateItem>(validCerts);
                        if (FoundUsbCertificates.Count == 0)
                        {
                            StatusMessage = $"{driveRoot} 드라이브에 복사 가능한 인증서(NPKI, GPKI, EPKI)가 없습니다.";
                        }
                        else
                        {
                            StatusMessage = $"{driveRoot} 드라이브에서 총 {FoundUsbCertificates.Count}건의 인증서가 감지되었습니다. '내 PC로 가져오기 시작'을 클릭하세요.";
                        }
                        (TransferToPcCommand as RelayCommand)?.RaiseCanExecuteChanged();
                    }));
                }
                catch (Exception ex)
                {
                    var userErr = KCert.Core.Common.UserFriendlyError.Explain(ex, "USB 인증서 탐색");
                    Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                    {
                        StatusMessage = $"USB 인증서 검색 안내: {userErr.Summary} ({userErr.ActionTip.Replace("\n", " ")})";
                    }));
                }
            });

            IsBusy = false;
        }

        public async Task TransferToPcAsync()
        {
            var selected = FoundUsbCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any()) return;

            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\') + "\\";
            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

            // 0. 자가 복사(동일 위치 복사) 사전 전체 검증
            bool isAllSelfCopy = selected.All(cert =>
            {
                if (string.IsNullOrWhiteSpace(cert.DirectoryPath)) return false;
                string cat = cert.Category.ToString();
                string targetRoot = string.Equals(cat, "GPKI", StringComparison.OrdinalIgnoreCase)
                    ? sysRoot
                    : Path.Combine(userProfile, "AppData", "LocalLow");
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
                    "[자가 복사 금지 / 복사 경로 오류]\n\n선택한 모든 인증서가 이미 컴퓨터 로컬 저장소(AppData\\LocalLow 또는 C:\\GPKI)의 동일한 위치에 보관 중인 원본입니다.\n\n동일한 위치로는 자가 복사를 수행할 수 없으니, 다른 인증서나 목적지 USB 드라이브를 선택해 주세요.",
                    "복사 경로 오류 - 자가 복사 차단 안내",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
                return;
            }

            IsBusy = true;
            StatusMessage = $"PC 보관함으로 {selected.Count}개 인증서 가져오는 중...";

            int success = 0;
            var successfulDestinations = new List<string>();
            var destinationCategories = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            await Task.Run(() =>
            {
                foreach (var cert in selected)
                {
                    try
                    {
                        var cat = cert.Category.ToString();
                        destinationCategories.Add(cat);

                        string targetRoot = string.Equals(cat, "GPKI", StringComparison.OrdinalIgnoreCase)
                            ? sysRoot
                            : Path.Combine(userProfile, "AppData", "LocalLow");
                        string relativePath = KCert.Core.Vault.CertTransferEngine.ResolveRelativePath(cert.DirectoryPath);
                        string destDir = Path.Combine(targetRoot, relativePath);
                        string fullSourceDir = Path.GetFullPath(cert.DirectoryPath).TrimEnd(Path.DirectorySeparatorChar);
                        string fullTargetDir = Path.GetFullPath(destDir).TrimEnd(Path.DirectorySeparatorChar);

                        if (fullSourceDir.Equals(fullTargetDir, StringComparison.OrdinalIgnoreCase))
                        {
                            success++;
                            successfulDestinations.Add(fullTargetDir);
                            continue;
                        }

                        var transferResult = _backupService.CopyCertificateToLocalPc(cert.DirectoryPath, cat, TargetUsername);
                        if (transferResult.IsSuccess)
                        {
                            success++;
                            successfulDestinations.Add(transferResult.DestinationDirectory);
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[CopyCert Error] {ex.Message}");
                    }
                }
            });

            IsBusy = false;
            StatusMessage = $"PC 가져오기 완료: {selected.Count}개 중 {success}개 성공 (자동 새로고침 반영)";
            if (success > 0)
            {
                SoundService.PlayCompletionSound();
                TransferCompleted?.Invoke();
            }

            if (success == selected.Count)
            {
                var completeItems = selected.Select(c => new OperationCompleteItem
                {
                    Name = !string.IsNullOrWhiteSpace(c.CommonName) ? c.CommonName : "공동인증서",
                    IssuerAndPolicy = $"{c.IssuerName} · 만료일: {c.NotAfter:yyyy-MM-dd}"
                }).ToList();

                string sourcePath = selected.FirstOrDefault()?.DirectoryPath ?? "이동식 USB";
                string firstDest = successfulDestinations.FirstOrDefault(d => !string.IsNullOrEmpty(d)) ?? string.Empty;

                bool isAnyGpki = destinationCategories.Contains("GPKI") ||
                                 selected.Any(c => c.Category == CertCategory.GPKI) ||
                                 (!string.IsNullOrEmpty(firstDest) && firstDest.IndexOf(@"\GPKI\", StringComparison.OrdinalIgnoreCase) >= 0);
                bool isAnyEpki = destinationCategories.Contains("EPKI") ||
                                 selected.Any(c => c.Category == CertCategory.EPKI) ||
                                 (!string.IsNullOrEmpty(firstDest) && firstDest.IndexOf(@"\EPKI\", StringComparison.OrdinalIgnoreCase) >= 0);

                string targetPath;
                if (!string.IsNullOrEmpty(firstDest))
                {
                    targetPath = firstDest;
                }
                else if (isAnyGpki)
                {
                    targetPath = Path.Combine(sysRoot, "GPKI", "Certificate", "class2");
                }
                else if (isAnyEpki)
                {
                    targetPath = Path.Combine(userProfile, "AppData", "LocalLow", "EPKI");
                }
                else
                {
                    targetPath = Path.Combine(userProfile, "AppData", "LocalLow", "NPKI");
                }

                string destCategoryName = isAnyGpki ? "GPKI (행정전자서명)" : (isAnyEpki ? "EPKI (교육전자서명)" : "NPKI (금융/공동인증서)");
                string destLocationText = isAnyGpki
                    ? @"정부 표준 공식 보관함(C:\GPKI\Certificate\class2)"
                    : (isAnyEpki ? @"교육부 표준 보관함(AppData\LocalLow\EPKI)" : @"금융 표준 보관함(AppData\LocalLow\NPKI)");

                string subtitle = $"선택하신 인증서 {success}개가 내 컴퓨터의 {destCategoryName} {destLocationText}으로 성공적으로 복사되었습니다.";

                string guideTip = isAnyGpki
                    ? "• 공무원/행정 전자서명(GPKI) 정부 공식 표준 폴더(C:\\GPKI\\Certificate\\class2)에 정상 안착되었습니다.\n• 행정안전부 온-나라, 정부24, 시도/새올 행정시스템에서 즉시 로그인하실 수 있습니다.\n• 메인 화면의 인증서 목록이 자동으로 새로고침되었습니다."
                    : (isAnyEpki
                        ? "• 교육부/나이스 전자서명(EPKI) 표준 폴더(AppData\\LocalLow\\EPKI)에 정상 안착되었습니다.\n• 나이스(NEIS), K-에듀파인 등 교육 포털에서 즉시 로그인하실 수 있습니다.\n• 메인 화면의 인증서 목록이 자동으로 새로고침되었습니다."
                        : "• 이제 내 컴퓨터의 웹 브라우저나 금융 프로그램에서 [하드디스크]를 선택하시면 바로 로그인하실 수 있습니다.\n• 메인 화면의 인증서 목록이 자동으로 새로고침되었습니다.");

                UserFriendlyMessageHelper.ShowOperationComplete(
                    "인증서 PC 가져오기 완료!",
                    subtitle,
                    success,
                    sourcePath,
                    targetPath,
                    completeItems,
                    guideTip);
            }
            else
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"인증서 {selected.Count}개 중 {success}개 성공, {selected.Count - success}개 실패하였습니다.\n\n인증서 목록이 자동으로 새로고침되었습니다.",
                    "인증서 가져오기 결과 안내",
                    "• PC 로컬 저장소(AppData\\LocalLow 또는 C:\\GPKI)의 쓰기 권한을 확인해 주세요.\n• 관리자 권한으로 프로그램을 실행해 보세요.");
            }
        }
    }
}
