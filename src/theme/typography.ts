import { TextStyle } from 'react-native';

// Maps RN fontWeight → Prompt variant family name.
// Do NOT set both fontFamily and fontWeight on Android — it picks default regular.
// Instead, always pass the specific family via fontFamily.
export const fontFamily = {
  light: 'GoogleSans_400Regular', // Google Sans has no 300 weight; map to regular
  regular: 'GoogleSans_400Regular',
  medium: 'GoogleSans_500Medium',
  semibold: 'GoogleSans_600SemiBold',
  bold: 'GoogleSans_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 34,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: 22,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
