using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using KCertManager.Wpf.Models;

namespace KCertManager.Wpf.Views
{
    public class DuplicateConflictEntry
    {
        public CertificateItem SourceCert { get; set; } = new();
        public string TargetDirectoryPath { get; set; } = string.Empty;
        public string TargetDriveLetter { get; set; } = string.Empty;
    }

    public partial class DuplicateConflictDialog : Window
    {
        private readonly List<DuplicateConflictEntry> _conflicts;
        private readonly DriveItem _targetDrive;

        public string SelectedAction { get; private set; } = "overwrite";

        public DuplicateConflictDialog(List<DuplicateConflictEntry> conflicts, DriveItem targetDrive)
        {
            InitializeComponent();
            _conflicts = conflicts ?? new List<DuplicateConflictEntry>();
            _targetDrive = targetDrive;

            if (Owner == null && Application.Current?.MainWindow != null && Application.Current.MainWindow != this)
            {
                Owner = Application.Current.MainWindow;
            }

            TxtConflictCountBadge.Text = $"{_conflicts.Count}건 감지됨";
            TxtHeaderDesc.Text = $"대상 드라이브 [{_targetDrive?.DisplayName ?? "선택된 드라이브"}]에 원본과 동일한 인증서 폴더가 이미 존재합니다.";
            TxtTargetDriveSummary.Text = $"대상 디스크: {_targetDrive?.Name ?? ""} ({_targetDrive?.VolumeLabel ?? "이동식 디스크"})";

            RenderConflictCards();
        }

        private void RenderConflictCards()
        {
            PanelConflictList.Children.Clear();

            var cardBg = (Brush)Application.Current.FindResource("BgDarkBrush") ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
            var borderBr = (Brush)Application.Current.FindResource("BorderBrush") ?? new SolidColorBrush(Color.FromRgb(51, 65, 85));
            var textPri = (Brush)Application.Current.FindResource("TextPrimaryBrush") ?? Brushes.White;
            var textSec = (Brush)Application.Current.FindResource("TextSecondaryBrush") ?? new SolidColorBrush(Color.FromRgb(148, 163, 184));

            foreach (var item in _conflicts)
            {
                var border = new Border
                {
                    Background = cardBg,
                    BorderBrush = borderBr,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(6),
                    Padding = new Thickness(12, 10, 12, 10),
                    Margin = new Thickness(0, 0, 0, 8)
                };

                var sp = new StackPanel();

                // Row 1: CommonName & Badge
                var headerRow = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 4) };
                var icon = new TextBlock
                {
                    Text = "🔑",
                    FontSize = 13,
                    Margin = new Thickness(0, 0, 6, 0),
                    VerticalAlignment = VerticalAlignment.Center
                };
                headerRow.Children.Add(icon);

                var txtCn = new TextBlock
                {
                    Text = item.SourceCert.CommonName,
                    FontWeight = FontWeights.Bold,
                    FontSize = 13,
                    Foreground = textPri,
                    Margin = new Thickness(0, 0, 8, 0),
                    VerticalAlignment = VerticalAlignment.Center
                };
                headerRow.Children.Add(txtCn);

                var issuerBadge = new Border
                {
                    Background = new SolidColorBrush(Color.FromArgb(40, 59, 130, 246)),
                    BorderBrush = new SolidColorBrush(Color.FromRgb(59, 130, 246)),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(4),
                    Padding = new Thickness(6, 1, 6, 1),
                    VerticalAlignment = VerticalAlignment.Center
                };
                issuerBadge.Child = new TextBlock
                {
                    Text = item.SourceCert.IssuerName,
                    FontSize = 10.5,
                    Foreground = new SolidColorBrush(Color.FromRgb(147, 197, 253))
                };
                headerRow.Children.Add(issuerBadge);
                sp.Children.Add(headerRow);

                // Row 2: Target path
                var pathRow = new TextBlock
                {
                    Text = $"중복 위치: {item.TargetDirectoryPath}",
                    FontSize = 11,
                    FontFamily = new FontFamily("Consolas, Segoe UI"),
                    Foreground = new SolidColorBrush(Color.FromRgb(251, 191, 36)),
                    TextTrimming = TextTrimming.CharacterEllipsis,
                    Margin = new Thickness(0, 0, 0, 2)
                };
                sp.Children.Add(pathRow);

                // Row 3: Validity
                var valRow = new TextBlock
                {
                    Text = $"만료 일자: {item.SourceCert.NotAfter:yyyy-MM-dd} ({item.SourceCert.StatusDisplayText})",
                    FontSize = 10.5,
                    Foreground = textSec
                };
                sp.Children.Add(valRow);

                border.Child = sp;
                PanelConflictList.Children.Add(border);
            }
        }

        private void BtnCancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void BtnConfirm_Click(object sender, RoutedEventArgs e)
        {
            if (RbOverwrite.IsChecked == true)
            {
                SelectedAction = "overwrite";
            }
            else if (RbRename.IsChecked == true)
            {
                SelectedAction = "rename";
            }
            else
            {
                SelectedAction = "skip";
            }

            DialogResult = true;
            Close();
        }
    }
}
