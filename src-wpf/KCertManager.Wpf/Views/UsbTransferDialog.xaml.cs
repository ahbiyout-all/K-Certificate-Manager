using System.ComponentModel;
using System.Windows;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class UsbTransferDialog : Window
    {
        public UsbTransferDialog(string? targetDriveLetter = null)
        {
            InitializeComponent();
            var vm = new UsbTransferViewModel(targetDriveLetter);
            vm.PropertyChanged += ViewModel_PropertyChanged;
            DataContext = vm;
            Loaded += (s, e) => UpdateDriveCardBorder();
        }

        private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(UsbTransferViewModel.SelectedSourceDrive))
            {
                UpdateDriveCardBorder();
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
