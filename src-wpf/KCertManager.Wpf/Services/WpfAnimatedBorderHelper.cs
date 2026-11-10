using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Effects;

namespace KCertManager.Wpf.Services
{
    /// <summary>
    /// C# WPF 데스크톱 내 모든 드라이브 카드에 시각적 시인성 극대화를 위한
    /// 동적 애니메이션 브러시(Moving LinearGradientBrush) 및 네온 글로우 효과를 부여하는 공통 헬퍼
    /// </summary>
    public static class WpfAnimatedBorderHelper
    {
        public static readonly DependencyProperty IsAnimatedDriveCardProperty =
            DependencyProperty.RegisterAttached(
                "IsAnimatedDriveCard",
                typeof(bool),
                typeof(WpfAnimatedBorderHelper),
                new PropertyMetadata(false, OnIsAnimatedDriveCardChanged));

        public static bool GetIsAnimatedDriveCard(DependencyObject obj)
        {
            return (bool)obj.GetValue(IsAnimatedDriveCardProperty);
        }

        public static void SetIsAnimatedDriveCard(DependencyObject obj, bool value)
        {
            obj.SetValue(IsAnimatedDriveCardProperty, value);
        }

        private static void OnIsAnimatedDriveCardChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is Border border && (bool)e.NewValue)
            {
                ApplyAnimatedGradientBorder(border, isSelected: true, isRemovableUsb: true);
            }
        }

        /// <summary>
        /// 지정된 WPF Border 드라이브 카드에 동적 무한 유동 애니메이션 그라데이션 브러시를 탑재합니다.
        /// </summary>
        /// <param name="border">애니메이션을 적용할 WPF Border 드라이브 카드</param>
        /// <param name="isSelected">카드 선택 여부 (True: 고대비 네온 무지개 유동, False: 은은한 에메랄드/블루 유동)</param>
        /// <param name="isRemovableUsb">이동식 USB 메모리 여부</param>
        public static void ApplyAnimatedGradientBorder(Border border, bool isSelected, bool isRemovableUsb = true)
        {
            if (border == null) return;

            // 기존 애니메이션 정리
            border.BeginAnimation(Border.BorderBrushProperty, null);

            var gradientStops = new GradientStopCollection();
            TimeSpan durationSpan = TimeSpan.FromSeconds(isSelected ? 2.2 : 3.5);

            if (isSelected)
            {
                // 선택된 카드는 선명하고 영롱한 무지개 네온 그라데이션 (Blue -> Emerald -> Amber -> Indigo)
                gradientStops.Add(new GradientStop(Color.FromRgb(37, 99, 235), 0.0));   // Bright Blue
                gradientStops.Add(new GradientStop(Color.FromRgb(16, 185, 129), 0.33)); // Emerald Green
                gradientStops.Add(new GradientStop(Color.FromRgb(245, 158, 11), 0.66)); // Warm Amber
                gradientStops.Add(new GradientStop(Color.FromRgb(99, 102, 241), 1.0));   // Indigo
            }
            else if (isRemovableUsb)
            {
                // USB 카드 (미선택): 에메랄드/청록 유동 그라데이션
                gradientStops.Add(new GradientStop(Color.FromRgb(5, 150, 105), 0.0));   // Emerald Dark
                gradientStops.Add(new GradientStop(Color.FromRgb(52, 211, 153), 0.5));  // Mint Light
                gradientStops.Add(new GradientStop(Color.FromRgb(14, 165, 233), 1.0));  // Sky Blue
            }
            else
            {
                // 일반 로컬 디스크 (미선택): 푸른빛 유동 그라데이션
                gradientStops.Add(new GradientStop(Color.FromRgb(30, 58, 138), 0.0));   // Deep Blue
                gradientStops.Add(new GradientStop(Color.FromRgb(59, 130, 246), 0.5));  // Royal Blue
                gradientStops.Add(new GradientStop(Color.FromRgb(99, 102, 241), 1.0));  // Indigo Light
            }

            var animBrush = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 1),
                GradientStops = gradientStops
            };

            var startAnim = new PointAnimation
            {
                From = new Point(0, 0),
                To = new Point(1, 1),
                Duration = new Duration(durationSpan),
                AutoReverse = true,
                RepeatBehavior = RepeatBehavior.Forever
            };

            var endAnim = new PointAnimation
            {
                From = new Point(1, 1),
                To = new Point(0, 0),
                Duration = new Duration(durationSpan),
                AutoReverse = true,
                RepeatBehavior = RepeatBehavior.Forever
            };

            animBrush.BeginAnimation(LinearGradientBrush.StartPointProperty, startAnim);
            animBrush.BeginAnimation(LinearGradientBrush.EndPointProperty, endAnim);

            border.BorderBrush = animBrush;
            border.BorderThickness = new Thickness(isSelected ? 2.8 : 1.8);

            if (isSelected)
            {
                border.Background = new SolidColorBrush(Color.FromRgb(20, 35, 65));
                border.Effect = new DropShadowEffect
                {
                    Color = isRemovableUsb ? Color.FromRgb(16, 185, 129) : Color.FromRgb(37, 99, 235),
                    BlurRadius = 14,
                    ShadowDepth = 0,
                    Opacity = 0.65
                };
            }
            else
            {
                var bgDark = (Application.Current?.FindResource("BgDarkBrush") as Brush) ?? new SolidColorBrush(Color.FromRgb(15, 23, 42));
                border.Background = bgDark;
                border.Effect = null;
            }
        }
    }
}
