import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  semiBold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  mono: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,
  '5xl': 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};
