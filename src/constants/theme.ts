import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#27272A',
    background: '#F4F4F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E4E4E7',
    textSecondary: '#71717A',
    primary: '#E50914',
    border: '#E4E4E7',
  },
  dark: {
    text: '#ffffff',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#333333',
    textSecondary: '#999999',
    primary: '#E50914',
    border: '#333333',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
