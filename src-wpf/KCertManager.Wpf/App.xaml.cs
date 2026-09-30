using System;
using System.IO;
using System.Windows;
using System.Windows.Threading;
using KCertManager.Wpf.Services;

namespace KCertManager.Wpf
{
    public partial class App : Application
    {
        public App()
        {
            // Register global handlers immediately in constructor before any XAML or ViewModel is instantiated
            DispatcherUnhandledException += OnDispatcherUnhandledException;
            AppDomain.CurrentDomain.UnhandledException += OnAppDomainUnhandledException;
            System.Threading.Tasks.TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            ShutdownMode = ShutdownMode.OnMainWindowClose;

            try
            {
                LogStartup("Application starting up...");
                var mainWindow = new Views.MainWindow();
                MainWindow = mainWindow;
                mainWindow.Show();
            }
            catch (Exception ex)
            {
                LogExceptionToFile("FatalStartup", ex);
                MessageBox.Show(
                    $"프로그램 시작 중 오류가 발생했습니다.\n\n" +
                    $"상세 내용: {ex.Message}\n\n" +
                    "프로그램을 종료합니다.",
                    "K-인증서 매니저 시작 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);

                try
                {
                    Environment.Exit(1);
                }
                catch { }
            }
        }

        private static void LogStartup(string msg)
        {
            try
            {
                var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                var logDir = Path.Combine(localAppData, "KCertManager", "Logs");
                if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);
                var logPath = Path.Combine(logDir, "app.log");
                File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {msg}\n");
            }
            catch { }
        }

        private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            LogExceptionToFile("Dispatcher", e.Exception);

            // If MainWindow is not initialized, closed, or not visible: this is a fatal startup/exit error
            if (MainWindow == null || !MainWindow.IsVisible || Current == null || Current.Windows.Count == 0)
            {
                e.Handled = true;
                MessageBox.Show(
                    $"프로그램 초기화/종료 중 오류가 감지되었습니다.\n\n" +
                    $"오류 내용: {e.Exception.Message}\n\n" +
                    "프로그램을 안전하게 종료합니다.",
                    "K-인증서 매니저 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);

                try
                {
                    Environment.Exit(1);
                }
                catch { }
                return;
            }

            // Differentiate runtime IO errors vs other errors
            var isIoError = e.Exception is IOException || 
                            e.Exception is UnauthorizedAccessException ||
                            e.Exception.GetType().Name.Contains("Management", StringComparison.OrdinalIgnoreCase);

            if (isIoError)
            {
                e.Handled = true;
                UserFriendlyMessageHelper.ShowError(
                    e.Exception,
                    "USB 외부 저장 장치 또는 파일 접근 중 오류가 발생했습니다.",
                    MainWindow);
                return;
            }

            // General non-fatal exception recovery
            e.Handled = true;
            UserFriendlyMessageHelper.ShowError(
                e.Exception,
                "요청하신 작업 처리 중 문제가 발생했습니다.",
                MainWindow);
        }

        private void OnUnobservedTaskException(object? sender, System.Threading.Tasks.UnobservedTaskExceptionEventArgs e)
        {
            LogExceptionToFile("UnobservedTask", e.Exception);
            // Mark exception observed to prevent CLR process termination
            e.SetObserved();
        }

        private void OnAppDomainUnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            if (e.ExceptionObject is Exception ex)
            {
                LogExceptionToFile("AppDomain", ex);
            }

            if (e.IsTerminating)
            {
                try
                {
                    Environment.Exit(1);
                }
                catch { }
            }
        }

        private static void LogExceptionToFile(string category, Exception ex)
        {
            try
            {
                var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                var logDir = Path.Combine(localAppData, "KCertManager", "Logs");
                if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);

                var logPath = Path.Combine(logDir, "error.log");
                var message = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{category}] {ex}\n----------------------------------------\n";
                File.AppendAllText(logPath, message);
            }
            catch
            {
                // Silently ignore logging errors
            }
        }
    }
}
