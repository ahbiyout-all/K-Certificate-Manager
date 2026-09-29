using System.Windows;

namespace KCertManager.Wpf.Views
{
    public partial class SecurityGuideDialog : Window
    {
        public SecurityGuideDialog()
        {
            InitializeComponent();
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
