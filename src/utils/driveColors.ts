export interface DriveColorInfo {
  letter: string;         // e.g. "C:"
  name: string;           // descriptive color name
  bgHex: string;          // background hex (rich saturated tone)
  borderHex: string;      // border hex
  textHex: string;        // high-contrast text hex (crisp white)
  subTextHex: string;     // soft readable accent
  tagBgHex: string;       // badge tag pill background
  tagBorderHex: string;   // badge tag pill border
}

const DRIVE_COLOR_MAP: Record<string, Omit<DriveColorInfo, 'letter'>> = {
  C: {
    name: '로열 네이비 블루',
    bgHex: '#1E3A8A',
    borderHex: '#3B82F6',
    textHex: '#FFFFFF',
    subTextHex: '#BFDBFE',
    tagBgHex: '#172554',
    tagBorderHex: '#60A5FA',
  },
  D: {
    name: '딥 틸 시안',
    bgHex: '#0F766E',
    borderHex: '#14B8A6',
    textHex: '#FFFFFF',
    subTextHex: '#99F6E4',
    tagBgHex: '#042F2E',
    tagBorderHex: '#2DD4BF',
  },
  E: {
    name: '에메랄드 그린',
    bgHex: '#065F46',
    borderHex: '#10B981',
    textHex: '#FFFFFF',
    subTextHex: '#A7F3D0',
    tagBgHex: '#022C22',
    tagBorderHex: '#34D399',
  },
  F: {
    name: '앰버 골드',
    bgHex: '#B45309',
    borderHex: '#F59E0B',
    textHex: '#FFFFFF',
    subTextHex: '#FDE68A',
    tagBgHex: '#451A03',
    tagBorderHex: '#FBBF24',
  },
  G: {
    name: '로열 바이올렛 퍼플',
    bgHex: '#6D28D9',
    borderHex: '#8B5CF6',
    textHex: '#FFFFFF',
    subTextHex: '#DDD6FE',
    tagBgHex: '#2E1065',
    tagBorderHex: '#A78BFA',
  },
  H: {
    name: '크림슨 로즈',
    bgHex: '#9F1239',
    borderHex: '#F43F5E',
    textHex: '#FFFFFF',
    subTextHex: '#FECDD3',
    tagBgHex: '#4C0519',
    tagBorderHex: '#FB7185',
  },
  I: {
    name: '비비드 푹샤 마젠타',
    bgHex: '#86198F',
    borderHex: '#D946EF',
    textHex: '#FFFFFF',
    subTextHex: '#F5D0FE',
    tagBgHex: '#4A044E',
    tagBorderHex: '#E879F9',
  },
  J: {
    name: '올리브 라임 그린',
    bgHex: '#3F6212',
    borderHex: '#84CC16',
    textHex: '#FFFFFF',
    subTextHex: '#D9F99D',
    tagBgHex: '#1A2E05',
    tagBorderHex: '#A3E635',
  },
  K: {
    name: '스카이 오션 시안',
    bgHex: '#0369A1',
    borderHex: '#0EA5E9',
    textHex: '#FFFFFF',
    subTextHex: '#BAE6FD',
    tagBgHex: '#082F49',
    tagBorderHex: '#38BDF8',
  },
  L: {
    name: '번트 오렌지 코퍼',
    bgHex: '#C2410C',
    borderHex: '#F97316',
    textHex: '#FFFFFF',
    subTextHex: '#FED7AA',
    tagBgHex: '#431407',
    tagBorderHex: '#FB923C',
  },
  M: {
    name: '슬레이트 스틸 블루',
    bgHex: '#334155',
    borderHex: '#64748B',
    textHex: '#FFFFFF',
    subTextHex: '#E2E8F0',
    tagBgHex: '#0F172A',
    tagBorderHex: '#94A3B8',
  },
  N: {
    name: '딥 핑크 루비',
    bgHex: '#9D174D',
    borderHex: '#EC4899',
    textHex: '#FFFFFF',
    subTextHex: '#FBCFE8',
    tagBgHex: '#500724',
    tagBorderHex: '#F472B6',
  },
  O: {
    name: '인디고 블루',
    bgHex: '#3730A3',
    borderHex: '#6366F1',
    textHex: '#FFFFFF',
    subTextHex: '#C7D2FE',
    tagBgHex: '#1E1B4B',
    tagBorderHex: '#818CF8',
  },
  P: {
    name: '포레스트 딥 그린',
    bgHex: '#14532D',
    borderHex: '#22C55E',
    textHex: '#FFFFFF',
    subTextHex: '#BBF7D0',
    tagBgHex: '#052E16',
    tagBorderHex: '#4ADE80',
  },
  Q: {
    name: '딥 시안 아쿠아',
    bgHex: '#164E63',
    borderHex: '#06B6D4',
    textHex: '#FFFFFF',
    subTextHex: '#A5F3FC',
    tagBgHex: '#083344',
    tagBorderHex: '#22D3EE',
  },
  R: {
    name: '루비 레드',
    bgHex: '#991B1B',
    borderHex: '#EF4444',
    textHex: '#FFFFFF',
    subTextHex: '#FECACA',
    tagBgHex: '#450A0A',
    tagBorderHex: '#F87171',
  },
  S: {
    name: '골든 브라운',
    bgHex: '#854D0E',
    borderHex: '#EAB308',
    textHex: '#FFFFFF',
    subTextHex: '#FEF08A',
    tagBgHex: '#422006',
    tagBorderHex: '#FACC15',
  },
  T: {
    name: '다크 바이올렛',
    bgHex: '#5B21B6',
    borderHex: '#7C3AED',
    textHex: '#FFFFFF',
    subTextHex: '#DDD6FE',
    tagBgHex: '#2E1065',
    tagBorderHex: '#A78BFA',
  },
  U: {
    name: '다크 에메랄드',
    bgHex: '#064E3B',
    borderHex: '#059669',
    textHex: '#FFFFFF',
    subTextHex: '#A7F3D0',
    tagBgHex: '#022C22',
    tagBorderHex: '#34D399',
  },
  V: {
    name: '플럼 와인',
    bgHex: '#701A75',
    borderHex: '#A855F7',
    textHex: '#FFFFFF',
    subTextHex: '#F5D0FE',
    tagBgHex: '#3B0764',
    tagBorderHex: '#C084FC',
  },
  W: {
    name: '미드나이트 틸',
    bgHex: '#115E59',
    borderHex: '#0D9488',
    textHex: '#FFFFFF',
    subTextHex: '#99F6E4',
    tagBgHex: '#042F2E',
    tagBorderHex: '#2DD4BF',
  },
  X: {
    name: '다크 차콜 슬레이트',
    bgHex: '#1E293B',
    borderHex: '#475569',
    textHex: '#FFFFFF',
    subTextHex: '#CBD5E1',
    tagBgHex: '#020617',
    tagBorderHex: '#64748B',
  },
  Y: {
    name: '워밍 앰버',
    bgHex: '#92400E',
    borderHex: '#D97706',
    textHex: '#FFFFFF',
    subTextHex: '#FDE68A',
    tagBgHex: '#451A03',
    tagBorderHex: '#FBBF24',
  },
  Z: {
    name: '미드나이트 딥 블루',
    bgHex: '#1E3A8A',
    borderHex: '#2563EB',
    textHex: '#FFFFFF',
    subTextHex: '#BFDBFE',
    tagBgHex: '#0F172A',
    tagBorderHex: '#60A5FA',
  },
};

/**
 * Extract drive letter character (e.g. 'C', 'D', 'E', 'F') from string
 */
export function extractDriveLetterChar(input: string | undefined | null): string {
  if (!input) return 'C';
  const match = input.match(/([a-zA-Z]):?/);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return 'C';
}

/**
 * Returns distinct, high-contrast, visually pleasant color styles for a given drive letter.
 */
export function getDriveColorInfo(input: string | undefined | null): DriveColorInfo {
  const char = extractDriveLetterChar(input);
  const colorSpec = DRIVE_COLOR_MAP[char] || DRIVE_COLOR_MAP['C'];
  return {
    letter: `${char}:`,
    ...colorSpec,
  };
}
