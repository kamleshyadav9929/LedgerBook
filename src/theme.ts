import { Platform } from 'react-native';

export const COLORS = {
  bgSand: '#faf9f5',
  bgWarm: '#efe9de',
  bgDark: '#181715',
  bgDarkHeader: '#1f1e1b',
  textDark: '#141413',
  textMuted: '#6c6a64',
  textLightMuted: '#8e8b82',
  border: '#e6dfd8',
  coral: '#cc785c',
  coralPressed: '#a9583e',
  green: '#5db872',
  red: '#c64545',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const FONTS = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
};
