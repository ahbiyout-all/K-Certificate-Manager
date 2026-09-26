using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using KCertManager.Wpf.Common;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

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
            ScanDriveCommand = new RelayCommand(async () => await ScanDriveAsync(), () => SelectedSourceDrive != null);
            TransferToPcCommand = new RelayCommand(async () => await TransferToPcAsync(), () => FoundUsbCertificates.Any(x => x.IsSelected));

            RefreshDrives(initialDriveLetter);
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
                    if (value != null)
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
                var drives = UsbDriveWatcher.GetAvailableDrives().Where(d => d.IsRemovable).ToList();
                AvailableDrives = new ObservableCollection<DriveItem>(drives);

                if (AvailableDrives.Count == 0)
                {
                    SelectedSourceDrive = null;
                    StatusMessage = "연결된 USB 드라이브를 찾을 수 없습니다. USB를 PC에 연결한 후 [🔄 드라이브 갱신]을 눌러주세요.";
                    FoundUsbCertificates.Clear();
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

                SelectedSourceDrive = AvailableDrives.FirstOrDefault(d => d.IsReady) ?? AvailableDrives.FirstOrDefault();
            }
            catch (Exception ex)
            {
                StatusMessage = $"드라이브 목록 조회 중 오류: {ex.Message}";
                System.Diagnostics.Debug.WriteLine($"[UsbTransfer RefreshDrives Error] {ex.Message}");
            }
        }

        public async Task ScanDriveAsync()
        {
            if (SelectedSourceDrive == null)
            {
                StatusMessage = "연결된 USB 이동식 드라이브가 없습니다. USB를 PC에 연결해 주세요.";
                FoundUsbCertificates.Clear();
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
                    foreach (var c in certs)
                    {
                        c.IsRemovableMedia = true;
                        c.IsSelected = true;
                    }

                    Application.Current?.Dispatcher?.BeginInvoke(new Action(() =>
                    {
                        FoundUsbCertificates = new ObservableCollection<CertificateItem>(certs);
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

            IsBusy = true;
            StatusMessage = $"PC 보관함으로 {selected.Count}개 인증서 가져오는 중...";

            int success = 0;
            await Task.Run(() =>
            {
                foreach (var cert in selected)
                {
                    try
                    {
                        var cat = cert.Category.ToString();
                        if (_backupService.CopyCertificateToLocalPc(cert.DirectoryPath, cat, TargetUsername))
                        {
                            success++;
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
                TransferCompleted?.Invoke();
            }

            if (success == selected.Count)
            {
                UserFriendlyMessageHelper.ShowInfo(
                    $"선택하신 인증서 {success}개가 내 컴퓨터의 {TargetCategory} 보관함(AppData\\LocalLow)으로 성공적으로 복사되었습니다.\n\n메인 화면의 인증서 목록이 자동으로 새로고침되었습니다.",
                    "인증서 가져오기 완료");
            }
            else
            {
                UserFriendlyMessageHelper.ShowWarning(
                    $"인증서 {selected.Count}개 중 {success}개 성공, {selected.Count - success}개 실패하였습니다.\n\n인증서 목록이 자동으로 새로고침되었습니다.",
                    "인증서 가져오기 결과 안내",
                    "• PC 로컬 저장소(AppData\\LocalLow)의 쓰기 권한을 확인해 주세요.\n• 관리자 권한으로 프로그램을 실행해 보세요.");
            }
        }
    }
}
