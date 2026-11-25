using System;
using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using KCertManager.Wpf.Models;
using KCertManager.Wpf.Services;
using KCertManager.Wpf.ViewModels;

namespace KCertManager.Wpf.Views
{
    public partial class UsbTransferDialog : Window
    {
        private readonly UsbTransferViewModel _viewModel;

        public UsbTransferDialog(string? targetDriveLetter = null)
        {
            InitializeComponent();
            _viewModel = new UsbTransferViewModel(targetDriveLetter);
            _viewModel.PropertyChanged += ViewModel_PropertyChanged;
            DataContext = _viewModel;
            Loaded += (s, e) => UpdateDriveCardBorder();
            Closed += (s, e) =>
            {
                _viewModel.PropertyChanged -= ViewModel_PropertyChanged;
                _viewModel.Dispose();
            };
        }

        private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(UsbTransferViewModel.SelectedSourceDrive))
            {
                if (Dispatcher == null || Dispatcher.HasShutdownStarted || Dispatcher.HasShutdownFinished)
                    return;

                if (Dispatcher.CheckAccess())
                {
                    UpdateDriveCardBorder();
                }
                else
                {
                    Dispatcher.BeginInvoke(new Action(UpdateDriveCardBorder));
                }
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

        private CertificateItem? _pressedRowItem;

        private static bool IsInteractiveRowElement(DependencyObject? dep)
        {
            while (dep != null)
            {
                if (dep is CheckBox ||
                    dep is System.Windows.Controls.Primitives.ButtonBase ||
                    dep is System.Windows.Controls.Primitives.ScrollBar ||
                    dep is System.Windows.Controls.Primitives.Thumb ||
                    dep is System.Windows.Controls.Primitives.DataGridColumnHeader ||
                    dep is ContextMenu ||
                    dep is System.Windows.Controls.Primitives.TextBoxBase)
                {
                    return true;
                }

                if (dep is DataGridRow)
                {
                    return false;
                }

                dep = (dep is Visual || dep is System.Windows.Media.Media3D.Visual3D)
                    ? VisualTreeHelper.GetParent(dep)
                    : LogicalTreeHelper.GetParent(dep);
            }
            return false;
        }

        private static DataGridRow? FindParentDataGridRow(DependencyObject? dep)
        {
            while (dep != null)
            {
                if (dep is DataGridRow row)
                {
                    return row;
                }

                dep = (dep is Visual || dep is System.Windows.Media.Media3D.Visual3D)
                    ? VisualTreeHelper.GetParent(dep)
                    : LogicalTreeHelper.GetParent(dep);
            }
            return null;
        }

        private void CertDataGrid_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            _pressedRowItem = null;
            try
            {
                if (e.ClickCount >= 2)
                {
                    return;
                }

                DependencyObject? dep = e.OriginalSource as DependencyObject;
                if (IsInteractiveRowElement(dep))
                {
                    return;
                }

                var row = FindParentDataGridRow(dep);
                if (row?.Item is CertificateItem item)
                {
                    _pressedRowItem = item;
                }
            }
            catch { }
        }

        private void CertDataGrid_PreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            var pressed = _pressedRowItem;
            _pressedRowItem = null;

            if (pressed == null) return;

            try
            {
                DependencyObject? dep = e.OriginalSource as DependencyObject;
                if (IsInteractiveRowElement(dep))
                {
                    return;
                }

                var row = FindParentDataGridRow(dep);
                if (row?.Item is CertificateItem item && ReferenceEquals(item, pressed))
                {
                    item.IsSelected = !item.IsSelected;
                }
            }
            catch { }
        }
    }
}
