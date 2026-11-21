import { AppTheme } from '../types';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  subName: string;
  description: string;
  swatchPrimary: string;
  swatchSecondary: string;
  swatchBorder: string;
  tag: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: '다크 테마',
    subName: 'WPF Obsidian Dark',
    description: 'WPF 데스크톱 앱과 동일한 #0F1219 / #1A1F2C 고대비 다크 테마',
    swatchPrimary: '#1A1F2C',
    swatchSecondary: '#0F1219',
    swatchBorder: '#2D3546',
    tag: 'WPF 기본'
  },
  {
    id: 'gray',
    name: '회색 테마',
    subName: 'Misty Mineral Slate',
    description: '순백 눈부심을 제거한 저자극 매트 미네랄 슬레이트 (#CCD4DF / #DFE5EC)',
    swatchPrimary: '#DFE5EC',
    swatchSecondary: '#CCD4DF',
    swatchBorder: '#9CA9B9',
    tag: '눈 편안'
  },
  {
    id: 'white',
    name: '화이트 테마',
    subName: 'Clean Studio White',
    description: '가독성과 시인성이 뛰어난 깔끔한 순백색 테마 (#F8FAFC / #FFFFFF)',
    swatchPrimary: '#FFFFFF',
    swatchSecondary: '#F8FAFC',
    swatchBorder: '#CBD5E1',
    tag: '선명함'
  },
  {
    id: 'beige',
    name: '베이지 테마',
    subName: 'Warm Oat Paper',
    description: '블루라이트 자극을 낮춘 따뜻한 미표백 오트 페이퍼 톤 (#E6DFD1 / #F1ECE1)',
    swatchPrimary: '#F1ECE1',
    swatchSecondary: '#E6DFD1',
    swatchBorder: '#C4BAA7',
    tag: '저자극'
  }
];
