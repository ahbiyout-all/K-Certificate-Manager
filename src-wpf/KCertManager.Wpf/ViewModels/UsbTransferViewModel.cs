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
        private ObservableCollection<DriveItem> _availableTargetDrives = new();
        private DriveItem? _selectedTargetDrive;
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
                    StatusMessage = "연결된 USB가 없습니다. USB를 꽂은 뒤 [🔄 새로고침]을 눌러주세요.";
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

        public void RefreshTargetDrives()
        {
            try
            {
                var localDrives = UsbDriveWatcher.GetAvailableDrives()
                    .Where(d => d.IsFixed || d.Name.StartsWith("C", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                if (!localDrives.Any(d => d.Name.StartsWith("C", StringComparison.OrdinalIgnoreCase)))
                {
                    localDrives.Insert(0, new DriveItem { Name = "C:\\", VolumeLabel = "로컬 디스크 (C:)", DriveType = DriveType.Fixed, IsReady = true });
                }

                AvailableTargetDrives = new ObservableCollection<DriveItem>(localDrives);
                SelectedTargetDrive = AvailableTargetDrives.FirstOrDefault(d => d.Name.StartsWith("C", StringComparison.OrdinalIgnoreCase)) ?? AvailableTargetDrives.FirstOrDefault();
            }
            catch
            {
                AvailableTargetDrives = new ObservableCollection<DriveItem>
                {
                    new DriveItem { Name = "C:\\", VolumeLabel = "로컬 디스크 (C:)", DriveType = DriveType.Fixed, IsReady = true }
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
                            StatusMessage = $"{driveRoot}에서 인증서(NPKI·GPKI·EPKI)를 찾지 못했습니다.";
                        }
                        else
                        {
                            StatusMessage = $"{driveRoot}에서 인증서 {FoundUsbCertificates.Count}건을 찾았습니다. [가져오기 시작]을 눌러주세요.";
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

            bool isGpki = string.Equals(category, "GPKI", StringComparison.OrdinalIgnoreCase) ||
                          (!string.IsNullOrWhiteSpace(sourceDirectory) &&
                           (sourceDirectory.IndexOf(@"\GPKI\", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            sourceDirectory.IndexOf(@"/GPKI/", StringComparison.OrdinalIgnoreCase) >= 0));

            if (isGpki)
            {
                return Directory.Exists(cleanDrive) ? cleanDrive : sysRoot;
            }

            if (cleanDrive.StartsWith("C", StringComparison.OrdinalIgnoreCase) || !Directory.Exists(cleanDrive))
            {
                return Path.Combine(userProfile, "AppData", "LocalLow");
            }

            string effectiveUser = string.IsNullOrWhiteSpace(username) ? Environment.UserName : username;
            return Path.Combine(cleanDrive, "Users", effectiveUser, "AppData", "LocalLow");
        }

        public async Task TransferToPcAsync()
        {
            var selected = FoundUsbCertificates.Where(x => x.IsSelected).ToList();
            if (!selected.Any()) return;

            string sysRoot = (Path.GetPathRoot(Environment.SystemDirectory) ?? "C:").TrimEnd('\\') + "\\";
            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string targetDrive = SelectedTargetDrive?.Name?.TrimEnd('\\') ?? "C:";
            string selectedDriveShort = (string.IsNullOrWhiteSpace(targetDrive)
                ? "C"
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

                        string targetRoot = ResolveTargetRootForCategory(cat, cert.DirectoryPath, targetDrive, effectiveUsername, sysRoot, userProfile);
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

                        var transferResult = _backupService.CopyCertificateToLocalPc(cert.DirectoryPath, cat, effectiveUsername, targetDrive);
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
            StatusMessage = $"PC({selectedDriveShort}) 가져오기 완료: {selected.Count}개 중 {success}개 성공 (자동 새로고침 반영)";
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

                string gpkiTargetRoot = ResolveTargetRootForCategory("GPKI", null, targetDrive, effectiveUsername, sysRoot, userProfile);
                string localLowTargetRoot = ResolveTargetRootForCategory("NPKI", null, targetDrive, effectiveUsername, sysRoot, userProfile);

                string targetPath;
                if (!string.IsNullOrEmpty(firstDest))
                {
                    targetPath = firstDest;
                }
                else if (isAnyGpki)
                {
                    targetPath = Path.Combine(gpkiTargetRoot, "GPKI", "Certificate", "class2");
                }
                else if (isAnyEpki)
                {
                    targetPath = Path.Combine(localLowTargetRoot, "EPKI");
                }
                else
                {
                    targetPath = Path.Combine(localLowTargetRoot, "NPKI");
                }

                string gpkiDisplayPath = Path.Combine(gpkiTargetRoot, "GPKI", "Certificate", "class2");
                string epkiDisplayPath = Path.Combine(localLowTargetRoot, "EPKI");
                string npkiDisplayPath = Path.Combine(localLowTargetRoot, "NPKI");

                string destCategoryName = isAnyGpki ? "공무원 인증서 (GPKI)" : (isAnyEpki ? "교육기관 인증서 (EPKI)" : "은행·공동 인증서 (NPKI)");
                string destLocationText = isAnyGpki
                    ? $"표준 폴더({gpkiDisplayPath})"
                    : (isAnyEpki ? $"표준 폴더({epkiDisplayPath})" : $"표준 폴더({npkiDisplayPath})");

                string subtitle = $"내 컴퓨터({selectedDriveShort})의 {destCategoryName} {destLocationText}에 인증서 {success}개를 가져왔습니다.";

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
            else
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"인증서 {selected.Count}개 중 {success}개 성공, {selected.Count - success}개 실패했습니다.",
                    "가져오기 결과 안내",
                    $"• PC 저장 폴더({selectedDriveShort})에 쓰기 권한이 있는지 확인하세요.\n• 필요하면 관리자 권한으로 프로그램을 다시 실행하세요.");
            }
        }
    }
}
