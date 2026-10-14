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
    name: '다크',
    subName: 'Charcoal Dark',
    description: '눈의 피로를 최대로 줄여주는 깊이감 있고 선명한 프리미엄 다크 테마',
    swatchPrimary: '#1a1e27',
    swatchSecondary: '#0f1219',
    swatchBorder: '#3b4559',
    tag: '눈피로 감소'
  },
  {
    id: 'gray',
    name: '회색',
    subName: 'Cool Slate Gray',
    description: '차분하고 정돈된 시원한 실버 슬레이트 모노 테마',
    swatchPrimary: '#cbd5e1',
    swatchSecondary: '#e2e8f0',
    swatchBorder: '#94a3b8',
    tag: '차분함'
  },
  {
    id: 'white',
    name: '화이트',
    subName: 'Clean Milk White',
    description: '가독성과 시인성이 뛰어난 깔끔하고 선명한 순백색 테마',
    swatchPrimary: '#ffffff',
    swatchSecondary: '#f8fafc',
    swatchBorder: '#cbd5e1',
    tag: '선명함'
  },
  {
    id: 'beige',
    name: '베이지',
    subName: 'Warm Cream Beige',
    description: '따뜻하고 포근한 분위기를 제공하는 프리미엄 크림 베이지 테마',
    swatchPrimary: '#f5f2eb',
    swatchSecondary: '#eee9de',
    swatchBorder: '#d6cebf',
    tag: '포근함'
  }
];
