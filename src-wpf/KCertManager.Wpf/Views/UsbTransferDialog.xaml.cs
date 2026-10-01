using System.Windows;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class UsbTransferDialog : Window
    {
        public UsbTransferDialog(string? targetDriveLetter = null)
        {
            InitializeComponent();
            if (!string.IsNullOrEmpty(targetDriveLetter))
            {
                DataContext = new UsbTransferViewModel(targetDriveLetter);
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }
    }
}
