import { Platform } from 'react-native';

export const COLORS = {
  bgSand: '#faf9f5', // Creamy sand background
  bgWarm: '#efe9de', // Soft beige/warm cream
  bgDark: '#181715', // Soft deep charcoal/black
  bgDarkHeader: '#1f1e1b',
  textDark: '#1a1d1a', // Rich soft deep charcoal
  textMuted: '#606660', // Medium slate charcoal
  textLightMuted: '#949b94', // Soft slate
  border: '#eae7e1', // Elegant light warm beige border
  coral: '#244d3d', // Primary Forest Green (replaces old coral)
  coralPressed: '#1b3e30', // Deep Forest Green active (replaces old coralPressed)
  accentGold: '#c48d3f', // Gorgeous Honey Gold for Ghee highlights
  accentGoldLight: '#fcf7ef', // Pastel gold
  bgMintLight: '#e2ebe5', // Pastel mint background for initials
  bgRedLight: '#fcebeb', // Pastel red for outstanding dues badge
  bgGreenLight: '#eaf5ec', // Pastel green for settled badge
  green: '#2e7d32', // Settled green
  red: '#b93c3c', // Pending/due red
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

