import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#121212',
    background: '#f5f5f5',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e0e0e0',
    textSecondary: '#666666',
    primary: '#E50914',
    border: '#dddddd',
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
