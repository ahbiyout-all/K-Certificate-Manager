using System;
using System.IO;
using KCertManager.Wpf.Common;

namespace KCertManager.Wpf.Models
{
    public class SearchPathItem : ViewModelBase
    {
        private bool _isEnabled = true;
        private string _path = string.Empty;
        private string _name = string.Empty;
        private string _description = string.Empty;
        private bool _isCustom;

        public bool IsEnabled
        {
            get => _isEnabled;
            set => SetProperty(ref _isEnabled, value);
        }

        public string Path
        {
            get => _path;
            set => SetProperty(ref _path, value);
        }

        public string Name
        {
            get => _name;
            set => SetProperty(ref _name, value);
        }

        public string Description
        {
            get => _description;
            set => SetProperty(ref _description, value);
        }

        public bool IsCustom
        {
            get => _isCustom;
            set => SetProperty(ref _isCustom, value);
        }

        public bool Exists => Directory.Exists(Path);

        public string StatusText => Exists ? "경로 감지됨" : "디렉터리 없음";
    }
}
