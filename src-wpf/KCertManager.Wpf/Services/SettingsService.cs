using System;
using System.IO;
using System.Text.Json;

namespace KCertManager.Wpf.Services
{
    public class AppSettingsData
    {
        public bool IsSoundEnabled { get; set; } = true;
        public int SoundVolume { get; set; } = 40;
        public bool DontShowStartupWorkflowAgain { get; set; } = false;
        public string Theme { get; set; } = "dark";
        public bool IsSimpleMode { get; set; } = true;
    }

    public class SettingsService
    {
        private static readonly Lazy<SettingsService> _instance = new(() => new SettingsService());
        public static SettingsService Instance => _instance.Value;

        private readonly string _settingsFilePath;
        private readonly object _lock = new();
        private AppSettingsData _currentSettings;

        public AppSettingsData Settings => _currentSettings;

        public SettingsService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var appDir = Path.Combine(appData, "KCertManager");
            if (!Directory.Exists(appDir))
            {
                Directory.CreateDirectory(appDir);
            }
            _settingsFilePath = Path.Combine(appDir, "kcert_settings.json");
            _currentSettings = LoadSettings();
        }

        public AppSettingsData LoadSettings()
        {
            lock (_lock)
            {
                try
                {
                    if (File.Exists(_settingsFilePath))
                    {
                        var json = File.ReadAllText(_settingsFilePath);
                        var data = JsonSerializer.Deserialize<AppSettingsData>(json);
                        if (data != null)
                        {
                            return data;
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[SettingsService.LoadSettings Error] {ex.Message}");
                }
                return new AppSettingsData();
            }
        }

        public void SaveSettings(Action<AppSettingsData>? updateAction = null)
        {
            lock (_lock)
            {
                try
                {
                    updateAction?.Invoke(_currentSettings);
                    var json = JsonSerializer.Serialize(_currentSettings, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(_settingsFilePath, json);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[SettingsService.SaveSettings Error] {ex.Message}");
                }
            }
        }

        public bool DontShowStartupWorkflowAgain
        {
            get => _currentSettings.DontShowStartupWorkflowAgain;
            set
            {
                if (_currentSettings.DontShowStartupWorkflowAgain != value)
                {
                    _currentSettings.DontShowStartupWorkflowAgain = value;
                    SaveSettings();
                }
            }
        }

        public bool IsSoundEnabled
        {
            get => _currentSettings.IsSoundEnabled;
            set
            {
                if (_currentSettings.IsSoundEnabled != value)
                {
                    _currentSettings.IsSoundEnabled = value;
                    SaveSettings();
                }
            }
        }

        public int SoundVolume
        {
            get => _currentSettings.SoundVolume;
            set
            {
                if (_currentSettings.SoundVolume != value)
                {
                    _currentSettings.SoundVolume = value;
                    SaveSettings();
                }
            }
        }

        public string Theme
        {
            get => _currentSettings.Theme;
            set
            {
                if (_currentSettings.Theme != value)
                {
                    _currentSettings.Theme = value;
                    SaveSettings();
                }
            }
        }

        public bool IsSimpleMode
        {
            get => _currentSettings.IsSimpleMode;
            set
            {
                if (_currentSettings.IsSimpleMode != value)
                {
                    _currentSettings.IsSimpleMode = value;
                    SaveSettings();
                }
            }
        }
    }
}
