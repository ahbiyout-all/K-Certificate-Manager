using System;
using System.Windows;
using KCert.Core.Common;

namespace KCertManager.Wpf.Services
{
    /// <summary>
    /// WPF 대화상자에서 사용자 친화적 에러 및 안내 메시지를 표시하는 헬퍼 클래스
    /// </summary>
    public static class UserFriendlyMessageHelper
    {
        /// <summary>
        /// 예외 객체를 친절한 한국어 안내 메시지로 변환하여 에러 대화상자를 띄웁니다.
        /// </summary>
        public static void ShowError(Exception ex, string actionContext = "", Window? owner = null)
        {
            var userError = UserFriendlyError.Explain(ex, actionContext);
            var fullMsg = userError.ToFormattedDialogMessage(actionContext);

            if (owner != null && owner.IsVisible)
            {
                MessageBox.Show(owner, fullMsg, userError.Title, MessageBoxButton.OK, MessageBoxImage.Error);
            }
            else if (Application.Current?.MainWindow != null && Application.Current.MainWindow.IsVisible)
            {
                MessageBox.Show(Application.Current.MainWindow, fullMsg, userError.Title, MessageBoxButton.OK, MessageBoxImage.Error);
            }
            else
            {
                MessageBox.Show(fullMsg, userError.Title, MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /// <summary>
        /// 일반 에러 텍스트를 친절한 형식으로 띄웁니다.
        /// </summary>
        public static void ShowErrorText(string message, string title = "작업 오류 안내", string? tip = null, Window? owner = null)
        {
            var content = message;
            if (!string.IsNullOrWhiteSpace(tip))
            {
                content += $"\n\n[해결 방법 안내]\n{tip}";
            }

            if (owner != null && owner.IsVisible)
            {
                MessageBox.Show(owner, content, title, MessageBoxButton.OK, MessageBoxImage.Error);
            }
            else if (Application.Current?.MainWindow != null && Application.Current.MainWindow.IsVisible)
            {
                MessageBox.Show(Application.Current.MainWindow, content, title, MessageBoxButton.OK, MessageBoxImage.Error);
            }
            else
            {
                MessageBox.Show(content, title, MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /// <summary>
        /// 주의 및 경고 대화상자
        /// </summary>
        public static void ShowWarning(string message, string title = "주의 안내", string? tip = null, Window? owner = null)
        {
            var content = message;
            if (!string.IsNullOrWhiteSpace(tip))
            {
                content += $"\n\n[도움말 안내]\n{tip}";
            }

            if (owner != null && owner.IsVisible)
            {
                MessageBox.Show(owner, content, title, MessageBoxButton.OK, MessageBoxImage.Warning);
            }
            else if (Application.Current?.MainWindow != null && Application.Current.MainWindow.IsVisible)
            {
                MessageBox.Show(Application.Current.MainWindow, content, title, MessageBoxButton.OK, MessageBoxImage.Warning);
            }
            else
            {
                MessageBox.Show(content, title, MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        /// <summary>
        /// 성공/완료 대화상자
        /// </summary>
        public static void ShowInfo(string message, string title = "완료 안내", Window? owner = null)
        {
            if (owner != null && owner.IsVisible)
            {
                MessageBox.Show(owner, message, title, MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else if (Application.Current?.MainWindow != null && Application.Current.MainWindow.IsVisible)
            {
                MessageBox.Show(Application.Current.MainWindow, message, title, MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else
            {
                MessageBox.Show(message, title, MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
    }
}
