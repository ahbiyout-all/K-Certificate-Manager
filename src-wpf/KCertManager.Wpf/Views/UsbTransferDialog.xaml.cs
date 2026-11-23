using System;
using System.ComponentModel;
using System.Windows;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class UsbTransferDialog : Window
    {
        private readonly UsbTransferViewModel _viewModel;

        public UsbTransferDialog(string? targetDriveLetter = null)
        {
            InitializeComponent();
            _viewModel = new UsbTransferViewModel(targetDriveLetter);
            _viewModel.PropertyChanged += ViewModel_PropertyChanged;
            DataContext = _viewModel;
            Loaded += (s, e) => UpdateDriveCardBorder();
            Closed += (s, e) =>
            {
                _viewModel.PropertyChanged -= ViewModel_PropertyChanged;
                _viewModel.Dispose();
            };
        }

        private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(UsbTransferViewModel.SelectedSourceDrive))
            {
                if (Dispatcher == null || Dispatcher.HasShutdownStarted || Dispatcher.HasShutdownFinished)
                    return;

                if (Dispatcher.CheckAccess())
                {
                    UpdateDriveCardBorder();
                }
                else
                {
                    Dispatcher.BeginInvoke(new Action(UpdateDriveCardBorder));
                }
            }
        }

        private void UpdateDriveCardBorder()
        {
            if (SourceDriveCardBorder != null && DataContext is UsbTransferViewModel vm)
            {
                bool isUsb = vm.SelectedSourceDrive?.IsRemovable ?? true;
                WpfAnimatedBorderHelper.ApplyAnimatedGradientBorder(SourceDriveCardBorder, isSelected: true, isRemovableUsb: isUsb);
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }
    }
}
