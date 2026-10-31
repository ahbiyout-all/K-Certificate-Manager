using System;
using System.Windows;
using System.Windows.Controls;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class SettingsDialog : Window
    {
        private readonly MainViewModel? _vm;
        private bool _isInitializing = true;

        public SettingsDialog(MainViewModel? vm)
        {
            InitializeComponent();
            _vm = vm;
            DataContext = _vm;

            if (_vm != null)
            {
                ChkSoundEnabled.IsChecked = _vm.IsSoundEnabled;
                SliderSoundVolume.Value = _vm.SoundVolume;
                TxtSoundVolume.Text = $"{_vm.SoundVolume}%";

                switch (_vm.CurrentTheme?.ToLowerInvariant())
                {
                    case "gray":
                        RbThemeGray.IsChecked = true;
                        break;
                    case "white":
                        RbThemeWhite.IsChecked = true;
                        break;
                    case "beige":
                        RbThemeBeige.IsChecked = true;
                        break;
                    case "dark":
                    default:
                        RbThemeDark.IsChecked = true;
                        break;
                }

                if (_vm.IsSimpleMode)
                {
                    RbModeSimple.IsChecked = true;
                }
                else
                {
                    RbModeAdvanced.IsChecked = true;
                }
            }

            _isInitializing = false;
        }

        private void ChkSoundEnabled_Changed(object sender, RoutedEventArgs e)
        {
            if (_isInitializing || _vm == null) return;
            _vm.IsSoundEnabled = ChkSoundEnabled.IsChecked == true;
            if (_vm.IsSoundEnabled && _vm.SoundVolume == 0)
            {
                _vm.SoundVolume = 40;
                SliderSoundVolume.Value = 40;
            }
        }

        private void SliderSoundVolume_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (TxtSoundVolume != null)
            {
                int val = (int)Math.Round(e.NewValue);
                TxtSoundVolume.Text = $"{val}%";
                if (!_isInitializing && _vm != null)
                {
                    _vm.SoundVolume = val;
                }
            }
        }

        private void BtnTestSound_Click(object sender, RoutedEventArgs e)
        {
            _vm?.PlayTestSound();
        }

        private void RbTheme_Checked(object sender, RoutedEventArgs e)
        {
            if (_isInitializing || _vm == null) return;

            if (RbThemeDark.IsChecked == true) _vm.CurrentTheme = "dark";
            else if (RbThemeGray.IsChecked == true) _vm.CurrentTheme = "gray";
            else if (RbThemeWhite.IsChecked == true) _vm.CurrentTheme = "white";
            else if (RbThemeBeige.IsChecked == true) _vm.CurrentTheme = "beige";
        }

        private void RbMode_Checked(object sender, RoutedEventArgs e)
        {
            if (_isInitializing || _vm == null) return;

            if (RbModeSimple.IsChecked == true)
            {
                _vm.IsSimpleMode = true;
            }
            else if (RbModeAdvanced.IsChecked == true)
            {
                _vm.IsAdvancedUIMode = true;
            }
        }

        private void BtnResetDefaults_Click(object sender, RoutedEventArgs e)
        {
            if (_vm == null) return;

            _isInitializing = true;
            _vm.IsSoundEnabled = true;
            _vm.SoundVolume = 40;
            _vm.CurrentTheme = "dark";
            _vm.IsSimpleMode = true;
            _vm.DontShowStartupWorkflowAgain = false;

            ChkSoundEnabled.IsChecked = true;
            SliderSoundVolume.Value = 40;
            TxtSoundVolume.Text = "40%";
            RbThemeDark.IsChecked = true;
            RbModeSimple.IsChecked = true;
            ChkDontShowStartupWorkflowAgain.IsChecked = false;
            _isInitializing = false;

            _vm.ShowToast("⚙️ 환경 설정이 기본값으로 초기화되었습니다.");
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }
    }
}
