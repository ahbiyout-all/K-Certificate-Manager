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
    subName: 'Cool Slate Gray',
    description: '차분하고 정돈된 실버 슬레이트 모노 톤 (#E2E8F0 / #FFFFFF)',
    swatchPrimary: '#FFFFFF',
    swatchSecondary: '#E2E8F0',
    swatchBorder: '#94A3B8',
    tag: '차분함'
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
    subName: 'Warm Cream Beige',
    description: '따뜻하고 편안한 크림 베이지 테마 (#F5F2EB / #FFFFFF)',
    swatchPrimary: '#FFFFFF',
    swatchSecondary: '#F5F2EB',
    swatchBorder: '#D6CEBF',
    tag: '포근함'
  }
];
