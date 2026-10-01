using System.Windows;
using System.Windows.Media;

namespace KCertManager.Wpf.Views
{
    public partial class AboutDialog : Window
    {
        private string _currentLang = "both";

        public AboutDialog()
        {
            InitializeComponent();
            UpdateLanguageView("both");
        }

        private void BtnLangBoth_Click(object sender, RoutedEventArgs e)
        {
            UpdateLanguageView("both");
        }

        private void BtnLangKr_Click(object sender, RoutedEventArgs e)
        {
            UpdateLanguageView("kr");
        }

        private void BtnLangEn_Click(object sender, RoutedEventArgs e)
        {
            UpdateLanguageView("en");
        }

        private void UpdateLanguageView(string mode)
        {
            _currentLang = mode;

            if (PanelLicenseKr != null)
                PanelLicenseKr.Visibility = (mode == "kr" || mode == "both") ? Visibility.Visible : Visibility.Collapsed;

            if (PanelLicenseEn != null)
                PanelLicenseEn.Visibility = (mode == "en" || mode == "both") ? Visibility.Visible : Visibility.Collapsed;

            var activeBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#2563EB"));
            var inactiveBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B"));
            var activeFg = Brushes.White;
            var inactiveFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#CBD5E1"));

            if (BtnLangBoth != null)
            {
                BtnLangBoth.Background = mode == "both" ? activeBg : inactiveBg;
                BtnLangBoth.Foreground = mode == "both" ? activeFg : inactiveFg;
            }
            if (BtnLangKr != null)
            {
                BtnLangKr.Background = mode == "kr" ? activeBg : inactiveBg;
                BtnLangKr.Foreground = mode == "kr" ? activeFg : inactiveFg;
            }
            if (BtnLangEn != null)
            {
                BtnLangEn.Background = mode == "en" ? activeBg : inactiveBg;
                BtnLangEn.Foreground = mode == "en" ? activeFg : inactiveFg;
            }
        }

        private void BtnCopyLicense_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string krText =
                    "[한국어 라이선스 정의 - LICENSE_KR.txt]\r\n" +
                    "K-Certificate Manager (K-인증서 매니저) v1.4.5\r\n" +
                    "Copyright (c) 2026 AhBiYout (https://ahbiyoutvibe.blogspot.com/). All rights reserved.\r\n" +
                    "Company: CISNet (http://www.cisnet.co.kr/)\r\n" +
                    "1. 제1조(사용 허가): 개인, 공공기관, 교육기관, 기업 등 모든 사용자에게 영구 무료 사용 및 배포가 허가됩니다.\r\n" +
                    "2. 제2조(보안 보장): 100% 오프라인 로컬 환경에서 구동되며 인증서 및 개인정보를 외부로 전송하지 않습니다.\r\n" +
                    "3. 제3조(저작권 보존): 저작권 표기(AhBiYout)는 수정하거나 삭제할 수 없습니다.\r\n" +
                    "4. 제4조(보증 부인): 본 소프트웨어는 '있는 그대로(AS-IS)' 제공됩니다.";

                string enText =
                    "[English License Definition - LICENSE_EN.txt]\r\n" +
                    "K-Certificate Manager v1.4.5\r\n" +
                    "Copyright (c) 2026 AhBiYout (https://ahbiyoutvibe.blogspot.com/). All rights reserved.\r\n" +
                    "Company: CISNet (http://www.cisnet.co.kr/)\r\n" +
                    "1. Article 1 (Grant of License): Permanently distributed free of charge for individuals, public agencies, schools, and enterprises.\r\n" +
                    "2. Article 2 (Security Guarantee): Operates 100% offline locally with zero external network transmission or telemetry.\r\n" +
                    "3. Article 3 (Copyright Notice): The copyright notice (AhBiYout) may not be altered or removed.\r\n" +
                    "4. Article 4 (Disclaimer of Warranty): Provided 'AS IS' without warranty of any kind.";

                string copyTarget = _currentLang == "kr"
                    ? krText
                    : _currentLang == "en"
                        ? enText
                        : krText + "\r\n\r\n--------------------------------------------------------------------------------\r\n\r\n" + enText;

                Clipboard.SetText(copyTarget);
                if (BtnCopyLicense != null)
                {
                    BtnCopyLicense.Content = "✓ 복사 완료 (Copied)";
                }
            }
            catch { }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void Hyperlink_RequestNavigate(object sender, System.Windows.Navigation.RequestNavigateEventArgs e)
        {
            try
            {
                if (e.Uri != null && e.Uri.IsAbsoluteUri &&
                    (e.Uri.Scheme == System.Uri.UriSchemeHttps || e.Uri.Scheme == System.Uri.UriSchemeHttp))
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = e.Uri.AbsoluteUri,
                        UseShellExecute = true
                    });
                }
                e.Handled = true;
            }
            catch { }
        }
    }
}
