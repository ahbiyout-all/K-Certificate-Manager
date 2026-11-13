using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Windows;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf.Views
{
    public partial class CertificateDetailDialog : Window
    {
        private readonly CertificateItem _cert;

        public CertificateDetailDialog(CertificateItem cert)
        {
            InitializeComponent();
            _cert = cert ?? throw new ArgumentNullException(nameof(cert));
            LoadData();
        }

        private void LoadData()
        {
            TxtCommonName.Text = _cert.CommonName;
            TxtIssuer.Text = $"발급자: {_cert.IssuerName}";
            TxtCategoryBadge.Text = _cert.CategoryBadgeText;
            TxtStatusBadge.Text = _cert.StatusDisplayText;
            if (_cert.Status == ExpiryStatus.Expired)
            {
                TxtStatusBadge.Background = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#881337"));
                TxtStatusBadge.Foreground = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#F87171"));
            }
            else if (_cert.Status == ExpiryStatus.ExpiringSoon)
            {
                TxtStatusBadge.Background = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#78350F"));
                TxtStatusBadge.Foreground = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FBBF24"));
            }
            else
            {
                TxtStatusBadge.Background = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#065F46"));
                TxtStatusBadge.Foreground = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#34D399"));
            }
            
            TxtStorageBadge.Text = _cert.StorageLocationBadge;
            try
            {
                TxtStorageBadge.Background = new System.Windows.Media.SolidColorBrush(
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString(_cert.StorageLocationBgColorHex));
                TxtStorageBadge.Foreground = System.Windows.Media.Brushes.White;
            }
            catch
            {
                TxtStorageBadge.Background = new System.Windows.Media.SolidColorBrush(
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#1E3A8A"));
                TxtStorageBadge.Foreground = System.Windows.Media.Brushes.White;
            }

            TxtSubjectDn.Text = _cert.SubjectDn;
            TxtIssuerDn.Text = _cert.IssuerName;
            TxtSerial.Text = _cert.SerialNumber;
            TxtAlgo.Text = _cert.SignatureAlgorithm;
            TxtPolicy.Text = $"{_cert.PolicyUsage} (OID: {_cert.PolicyOid})";

            TxtNotBefore.Text = _cert.NotBefore.ToString("yyyy-MM-dd HH:mm:ss");
            TxtNotAfter.Text = _cert.NotAfter.ToString("yyyy-MM-dd HH:mm:ss");
            TxtRemainingDays.Text = $"{_cert.RemainingDays}일 남음 ({_cert.StatusDisplayText})";

            TxtDirectory.Text = _cert.DirectoryPath;
            TxtDerInfo.Text = File.Exists(_cert.DerFilePath)
                ? $"{new FileInfo(_cert.DerFilePath).Length:N0} Bytes (정상)"
                : "파일 없음";

            TxtKeyInfo.Text = File.Exists(_cert.KeyFilePath)
                ? $"{new FileInfo(_cert.KeyFilePath).Length:N0} Bytes (암호화 보관)"
                : "개인키 없음";

            TxtKeyAlgo.Text = !string.IsNullOrEmpty(_cert.KeyEncryptionAlgorithm)
                ? $"{_cert.KeyEncryptionAlgorithm} (KDF: PBKDF2 {_cert.KdfIterations}회)"
                : "표준 암호화";

            // Calculate SHA-256 safely with stream & size check
            if (File.Exists(_cert.DerFilePath))
            {
                try
                {
                    var fi = new FileInfo(_cert.DerFilePath);
                    if (fi.Length > 0 && fi.Length <= 5 * 1024 * 1024)
                    {
                        using var sha = SHA256.Create();
                        using var fs = File.OpenRead(_cert.DerFilePath);
                        var hash = sha.ComputeHash(fs);
                        TxtSha256.Text = BitConverter.ToString(hash).Replace("-", ":");
                    }
                    else
                    {
                        TxtSha256.Text = "파일 크기 초과";
                    }
                }
                catch
                {
                    TxtSha256.Text = "계산 불가";
                }
            }
            else
            {
                TxtSha256.Text = "파일 없음";
            }

            TxtIntegrity.Text = _cert.IsPairIntegrityValid ? "인증서·개인키 파일 정상 일치" : _cert.IntegrityMessage;
        }

        private void BtnOpenExplorer_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (_cert == null) return;

                // 1. 다중 단계로 실제 존재하는 대상 인증서 디렉터리 경로 정밀 판별
                string targetFolder = string.Empty;

                if (!string.IsNullOrWhiteSpace(_cert.DirectoryPath))
                {
                    string cleaned = _cert.DirectoryPath.Trim().TrimEnd('\\', '/');
                    if (Directory.Exists(cleaned))
                    {
                        targetFolder = Path.GetFullPath(cleaned);
                    }
                }

                if (string.IsNullOrEmpty(targetFolder) && !string.IsNullOrWhiteSpace(_cert.DerFilePath))
                {
                    string cleanedDer = _cert.DerFilePath.Trim();
                    if (File.Exists(cleanedDer))
                    {
                        targetFolder = Path.GetDirectoryName(Path.GetFullPath(cleanedDer)) ?? string.Empty;
                    }
                }

                if (string.IsNullOrEmpty(targetFolder) && !string.IsNullOrWhiteSpace(_cert.KeyFilePath))
                {
                    string cleanedKey = _cert.KeyFilePath.Trim();
                    if (File.Exists(cleanedKey))
                    {
                        targetFolder = Path.GetDirectoryName(Path.GetFullPath(cleanedKey)) ?? string.Empty;
                    }
                }

                if (!string.IsNullOrEmpty(targetFolder) && Directory.Exists(targetFolder))
                {
                    // 2. 공개키 인증서 파일(signCert.der)이 존재할 경우 파일 포커스(/select) 우선 실행
                    string derFile = !string.IsNullOrWhiteSpace(_cert.DerFilePath) && File.Exists(_cert.DerFilePath)
                        ? Path.GetFullPath(_cert.DerFilePath)
                        : Path.Combine(targetFolder, "signCert.der");

                    try
                    {
                        if (File.Exists(derFile))
                        {
                            // Windows ShellExecuteEx를 통해 탐색기에서 해당 인증서 파일을 직접 하이라이트/포커스
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = "explorer.exe",
                                Arguments = $"/select,\"{derFile}\"",
                                UseShellExecute = true
                            });
                        }
                        else
                        {
                            // 폴더를 ShellExecuteEx로 직접 열어 특수문자(=, 공백, 한글) 및 따옴표 이스케이프 문제 완벽 해결
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = targetFolder,
                                UseShellExecute = true
                            });
                        }
                    }
                    catch
                    {
                        // 1차 실행 예외 시 폴더 직접 열기 폴백
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = targetFolder,
                            UseShellExecute = true
                        });
                    }

                    ActivityLogService.Instance.Log(LogCategory.SECURITY, LogLevel.INFO, "파일 탐색기 실행", $"경로: {targetFolder}", targetFolder);
                }
                else
                {
                    string displayPath = !string.IsNullOrWhiteSpace(_cert.DirectoryPath) ? _cert.DirectoryPath : _cert.DerFilePath;
                    UserFriendlyMessageHelper.ShowWarning(
                        $"해당 인증서 폴더가 디스크에 존재하지 않거나 현재 연결 해제된 드라이브입니다.\n\n경로: {displayPath}",
                        "폴더 미발견 안내",
                        "• USB 메모리가 올바르게 연결되어 있는지 확인해 주세요.\n• 메인 창에서 '새로고침'을 눌러 목록을 갱신해 주세요.",
                        this);
                }
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "파일 탐색기 열기", this);
            }
        }

        private void BtnCopyPath_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string pathToCopy = !string.IsNullOrWhiteSpace(_cert.DirectoryPath) 
                    ? _cert.DirectoryPath 
                    : (!string.IsNullOrWhiteSpace(_cert.DerFilePath) ? (Path.GetDirectoryName(_cert.DerFilePath) ?? string.Empty) : string.Empty);
                Clipboard.SetText(pathToCopy);
                UserFriendlyMessageHelper.ShowInfo("인증서 폴더 경로가 클립보드에 복사되었습니다.", "복사 완료", this);
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "클립보드 경로 복사", this);
            }
        }

        private void BtnCopyCertificate_Click(object sender, RoutedEventArgs e)
        {
            if (_cert == null) return;
            try
            {
                var drives = UsbDriveWatcher.GetAvailableDrives().Where(d => !d.IsCdRom).ToList();
                var dialog = new TargetDrivePickerDialog(new System.Collections.Generic.List<CertificateItem> { _cert }, drives)
                {
                    Owner = this
                };

                if (dialog.ShowDialog() == true && dialog.SelectedDrive != null)
                {
                    var backupService = new CertificateBackupService();
                    var res = backupService.BackupCertificateToDrive(_cert, dialog.SelectedDrive.Name);
                    if (res.IsSuccess)
                    {
                        UserFriendlyMessageHelper.ShowInfo(
                            $"선택하신 인증서가 {dialog.SelectedDrive.DisplayName}로 안전하게 복사되었습니다.\n\n저장 경로: {res.DestinationPath}",
                            "인증서 복사 완료",
                            this);
                    }
                    else
                    {
                        UserFriendlyMessageHelper.ShowWarning(
                            $"인증서 복사 실패: {res.Message}",
                            "복사 실패",
                            "• 대상 드라이브의 남은 용량 및 쓰기 권한을 확인해 주세요.",
                            this);
                    }
                }
            }
            catch (Exception ex)
            {
                UserFriendlyMessageHelper.ShowError(ex, "복사 대상 디스크 선택 창 실행", this);
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
