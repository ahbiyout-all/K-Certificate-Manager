using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Views
{
    public partial class ExpiredCleanupDialog : Window
    {
        private static readonly SolidColorBrush ActiveBorderBrush = new(Color.FromRgb(0x25, 0x63, 0xEB));
        private static readonly SolidColorBrush ActiveBgBrush = new(Color.FromRgb(0x1E, 0x3A, 0x8A));
        private static readonly SolidColorBrush InactiveBorderBrush = new(Color.FromRgb(0x33, 0x41, 0x55));
        private static readonly SolidColorBrush InactiveBgBrush = new(Color.FromRgb(0x0F, 0x17, 0x2A));

        private static readonly SolidColorBrush DesktopAlertBorder = new(Color.FromRgb(0x25, 0x63, 0xEB));
        private static readonly SolidColorBrush DesktopAlertText = new(Color.FromRgb(0x93, 0xC5, 0xFD));

        private static readonly SolidColorBrush UsbAlertBorder = new(Color.FromRgb(0x10, 0xB9, 0x81));
        private static readonly SolidColorBrush UsbAlertText = new(Color.FromRgb(0x34, 0xD3, 0x99));

        private static readonly SolidColorBrush AllAlertBorder = new(Color.FromRgb(0xF5, 0x9E, 0x0B));
        private static readonly SolidColorBrush AllAlertText = new(Color.FromRgb(0xFC, 0xD3, 0x4D));

        private readonly List<CertificateItem> _allExpired;
        private readonly List<CertificateItem> _desktopExpired;
        private readonly List<CertificateItem> _usbExpired;

        private bool _isInitialized;
        private bool _isUpdatingMedium;

        public enum MediumTarget
        {
            Desktop,
            Usb,
            All
        }

        public MediumTarget CurrentTarget { get; private set; } = MediumTarget.Desktop;
        public List<CertificateItem> SelectedCertificates { get; private set; } = new();
        public string SelectedMediumName { get; private set; } = "내 컴퓨터(PC)";

        public ExpiredCleanupDialog(List<CertificateItem> expiredCertificates)
        {
            InitializeComponent();
            _isInitialized = true;

            _allExpired = expiredCertificates ?? new List<CertificateItem>();
            _desktopExpired = _allExpired.Where(c => !c.IsRemovableMedia).ToList();
            _usbExpired = _allExpired.Where(c => c.IsRemovableMedia).ToList();

            // Set Counts
            if (TxtDesktopCount != null) TxtDesktopCount.Text = $"{_desktopExpired.Count}건 대상";
            if (TxtUsbCount != null) TxtUsbCount.Text = $"{_usbExpired.Count}건 대상";
            if (TxtAllCount != null) TxtAllCount.Text = $"{_allExpired.Count}건 대상";

            // Default to All so that all expired certificates across all media (PC + USB) are cleaned consistently with the ExpiredCount banner
            SetMedium(MediumTarget.All);
        }

        private void SetMedium(MediumTarget target)
        {
            if (!_isInitialized || _isUpdatingMedium) return;
            _isUpdatingMedium = true;

            try
            {
                CurrentTarget = target;

                var isDark = IsCurrentThemeDark();
                Brush ResolveBrush(string key, Brush fallback) =>
                    (Application.Current?.TryFindResource(key) as Brush) ?? fallback;

                var activeBorder = ResolveBrush("AccentBlueBrush", ActiveBorderBrush);
                var activeBg = ResolveBrush("SelectedRowBgBrush", ActiveBgBrush);
                var activePrimaryFg = ResolveBrush("SelectedRowTextBrush", Brushes.White);
                var activeSubFg = isDark
                    ? ResolveBrush("InactiveSelectedRowTextBrush", new SolidColorBrush(Color.FromRgb(0xE2, 0xE8, 0xF0)))
                    : ResolveBrush("TextSecondaryBrush", new SolidColorBrush(Color.FromRgb(0x33, 0x41, 0x55)));

                var inactiveBorder = ResolveBrush("BorderBrush", InactiveBorderBrush);
                var inactiveBg = ResolveBrush("BgDarkBrush", InactiveBgBrush);
                var inactivePrimaryFg = ResolveBrush("TextPrimaryBrush", Brushes.White);
                var inactiveSubFg = ResolveBrush("TextSecondaryBrush", new SolidColorBrush(Color.FromRgb(0xCB, 0xD5, 0xE1)));

                void ApplyCardStyle(Border? border, RadioButton? radio, TextBlock? subText, bool isActive)
                {
                    if (border != null)
                    {
                        border.BorderBrush = isActive ? activeBorder : inactiveBorder;
                        border.Background = isActive ? activeBg : inactiveBg;
                        border.BorderThickness = isActive ? new Thickness(2) : new Thickness(1);
                    }
                    if (radio != null)
                    {
                        radio.Foreground = isActive ? activePrimaryFg : inactivePrimaryFg;
                    }
                    if (subText != null)
                    {
                        subText.Foreground = isActive ? activeSubFg : inactiveSubFg;
                    }
                }

                ApplyCardStyle(BorderDesktop, RadioDesktop, TxtDesktopSub, target == MediumTarget.Desktop);
                ApplyCardStyle(BorderUsb, RadioUsb, TxtUsbSub, target == MediumTarget.Usb);
                ApplyCardStyle(BorderAll, RadioAll, TxtAllSub, target == MediumTarget.All);

                if (TxtDesktopCount != null)
                {
                    TxtDesktopCount.Foreground = (isDark && target == MediumTarget.Desktop)
                        ? DesktopAlertText
                        : ResolveBrush("AccentTextBrush", DesktopAlertText);
                }
                if (TxtUsbCount != null)
                {
                    TxtUsbCount.Foreground = (isDark && target == MediumTarget.Usb)
                        ? UsbAlertText
                        : ResolveBrush("AccentGreenBrush", UsbAlertText);
                }
                if (TxtAllCount != null)
                {
                    TxtAllCount.Foreground = (isDark && target == MediumTarget.All)
                        ? new SolidColorBrush(Color.FromRgb(0xFD, 0xA4, 0xAF))
                        : ResolveBrush("AccentRoseBrush", new SolidColorBrush(Color.FromRgb(0xF8, 0x71, 0x71)));
                }

                if (RadioDesktop != null) RadioDesktop.IsChecked = target == MediumTarget.Desktop;
                if (RadioUsb != null) RadioUsb.IsChecked = target == MediumTarget.Usb;
                if (RadioAll != null) RadioAll.IsChecked = target == MediumTarget.All;

                // Target List & Notices
                List<CertificateItem> currentList;
                if (target == MediumTarget.Desktop)
                {
                    currentList = _desktopExpired;
                    SelectedMediumName = "내 컴퓨터(PC)";
                    if (TxtSafetyNotice != null) TxtSafetyNotice.Text = "🛡️ 내 컴퓨터(PC)의 만료 인증서만 정리합니다. USB 인증서는 유지됩니다.";
                    if (BorderAlert != null) BorderAlert.BorderBrush = ResolveBrush("AccentBlueBrush", DesktopAlertBorder);
                    if (TxtSafetyNotice != null) TxtSafetyNotice.Foreground = ResolveBrush("AccentTextBrush", DesktopAlertText);
                }
                else if (target == MediumTarget.Usb)
                {
                    currentList = _usbExpired;
                    SelectedMediumName = "USB 메모리";
                    if (TxtSafetyNotice != null) TxtSafetyNotice.Text = "🛡️ USB 메모리의 만료 인증서만 정리합니다. PC 인증서는 유지됩니다.";
                    if (BorderAlert != null) BorderAlert.BorderBrush = ResolveBrush("AccentGreenBrush", UsbAlertBorder);
                    if (TxtSafetyNotice != null) TxtSafetyNotice.Foreground = ResolveBrush("AccentGreenBrush", UsbAlertText);
                }
                else
                {
                    currentList = _allExpired;
                    SelectedMediumName = "PC · USB 모두";
                    if (TxtSafetyNotice != null) TxtSafetyNotice.Text = "⚠️ PC와 USB의 만료 인증서를 모두 정리합니다. 한쪽만 정리하려면 위 카드를 선택하세요.";
                    if (BorderAlert != null) BorderAlert.BorderBrush = ResolveBrush("AccentAmberBrush", AllAlertBorder);
                    if (TxtSafetyNotice != null) TxtSafetyNotice.Foreground = ResolveBrush("AccentAmberBrush", AllAlertText);
                }

                for (int i = 0; i < currentList.Count; i++)
                {
                    currentList[i].IndexNumber = i + 1;
                }

                if (GridCerts != null) GridCerts.ItemsSource = currentList;
                if (TxtTargetSummary != null) TxtTargetSummary.Text = $"정리 대상: [{SelectedMediumName}] 총 {currentList.Count}건";
                if (BtnExecute != null) BtnExecute.Content = $"[{SelectedMediumName}] 만료 인증서 {currentList.Count}건 정리";

                UpdateExecuteState();
            }
            finally
            {
                _isUpdatingMedium = false;
            }
        }

        private void UpdateExecuteState()
        {
            if (!_isInitialized || BtnExecute == null) return;
            var list = GridCerts?.ItemsSource as List<CertificateItem>;
            int count = list?.Count ?? 0;
            BtnExecute.IsEnabled = count > 0 && ChkConfirm?.IsChecked == true;
        }

        private void SelectDesktop_Click(object sender, MouseButtonEventArgs e) => SetMedium(MediumTarget.Desktop);
        private void SelectUsb_Click(object sender, MouseButtonEventArgs e) => SetMedium(MediumTarget.Usb);
        private void SelectAll_Click(object sender, MouseButtonEventArgs e) => SetMedium(MediumTarget.All);

        private void RadioMedium_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized || _isUpdatingMedium) return;
            if (sender == RadioDesktop) SetMedium(MediumTarget.Desktop);
            else if (sender == RadioUsb) SetMedium(MediumTarget.Usb);
            else if (sender == RadioAll) SetMedium(MediumTarget.All);
        }

        private void ChkConfirm_Click(object sender, RoutedEventArgs e)
        {
            UpdateExecuteState();
        }

        private void BtnExecute_Click(object sender, RoutedEventArgs e)
        {
            var list = GridCerts?.ItemsSource as List<CertificateItem>;
            SelectedCertificates = list ?? new List<CertificateItem>();
            DialogResult = true;
            Close();
        }

        private bool IsCurrentThemeDark()
        {
            try
            {
                if (Application.Current?.Resources["TextPrimary"] is Color textPrimaryColor)
                {
                    return textPrimaryColor.R > 128;
                }
            }
            catch { }
            return true; // Default to dark
        }

        private void BtnCancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
