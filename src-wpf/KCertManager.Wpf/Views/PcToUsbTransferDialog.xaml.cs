using System.Collections.Generic;
using System.ComponentModel;
using System.Windows;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class PcToUsbTransferDialog : Window
    {
        private readonly PcToUsbTransferViewModel _viewModel;

        public PcToUsbTransferDialog() : this(null, null, null)
        {
        }

        public PcToUsbTransferDialog(MainViewModel? mainVm, IEnumerable<CertificateItem>? certs = null, IEnumerable<DriveItem>? drives = null)
        {
            InitializeComponent();
            _viewModel = new PcToUsbTransferViewModel(certs, drives ?? mainVm?.AvailableTargetDrives);
            _viewModel.TransferCompleted += () =>
            {
                DialogResult = true;
                Close();
            };
            _viewModel.PropertyChanged += ViewModel_PropertyChanged;
            Loaded += (s, e) => UpdateDriveCardBorder();
            DataContext = _viewModel;
        }

        private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(PcToUsbTransferViewModel.SelectedTargetDrive))
            {
                UpdateDriveCardBorder();
            }
        }

        private void UpdateDriveCardBorder()
        {
            if (DestDriveCardBorder != null && _viewModel != null)
            {
                bool isUsb = _viewModel.SelectedTargetDrive?.IsRemovable ?? true;
                WpfAnimatedBorderHelper.ApplyAnimatedGradientBorder(DestDriveCardBorder, isSelected: true, isRemovableUsb: isUsb);
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void RbOverwrite_Checked(object sender, RoutedEventArgs e)
        {
            if (_viewModel != null) _viewModel.ConflictOption = "overwrite";
        }

        private void RbRename_Checked(object sender, RoutedEventArgs e)
        {
            if (_viewModel != null) _viewModel.ConflictOption = "rename";
        }

        private void RbSkip_Checked(object sender, RoutedEventArgs e)
        {
            if (_viewModel != null) _viewModel.ConflictOption = "skip";
        }
    }
}
