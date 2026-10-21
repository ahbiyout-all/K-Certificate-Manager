using System.Collections.Generic;
using System.Windows;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class PcToUsbTransferDialog : Window
    {
        private readonly PcToUsbTransferViewModel _viewModel;

        public PcToUsbTransferDialog() : this(null, null)
        {
        }

        public PcToUsbTransferDialog(MainViewModel? mainVm, IEnumerable<CertificateItem>? certs = null)
        {
            InitializeComponent();
            _viewModel = new PcToUsbTransferViewModel(certs);
            _viewModel.TransferCompleted += () =>
            {
                DialogResult = true;
                Close();
            };
            DataContext = _viewModel;
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
