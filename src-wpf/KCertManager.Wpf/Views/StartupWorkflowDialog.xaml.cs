using System.Windows;
using System.Windows.Input;

namespace KCertManager.Wpf.Views
{
    public enum StartupWorkflowResult
    {
        MainDashboard,
        PcToUsb,
        UsbToPc
    }

    public partial class StartupWorkflowDialog : Window
    {
        public StartupWorkflowResult SelectedResult { get; private set; } = StartupWorkflowResult.MainDashboard;
        public bool AlwaysShowOnStartup => AlwaysShowCheckBox.IsChecked ?? true;

        public StartupWorkflowDialog()
        {
            InitializeComponent();
        }

        private void CardPcToUsb_Click(object sender, MouseButtonEventArgs e)
        {
            SelectedResult = StartupWorkflowResult.PcToUsb;
            DialogResult = true;
            Close();
        }

        private void CardUsbToPc_Click(object sender, MouseButtonEventArgs e)
        {
            SelectedResult = StartupWorkflowResult.UsbToPc;
            DialogResult = true;
            Close();
        }

        private void CardMainDashboard_Click(object sender, MouseButtonEventArgs e)
        {
            SelectedResult = StartupWorkflowResult.MainDashboard;
            DialogResult = true;
            Close();
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            SelectedResult = StartupWorkflowResult.MainDashboard;
            DialogResult = false;
            Close();
        }
    }
}
