// Shim for expo-glass-effect (iOS 26 Liquid Glass).
// We return `false` from isLiquidGlassAvailable so all callers fall through
// to their expo-blur BlurView fallback — required for Expo Go (SDK 54) where
// the native GlassView module is unavailable.
import { ComponentType } from 'react';
import { View, ViewProps } from 'react-native';

export const isLiquidGlassAvailable = () => false;

export type GlassViewProps = ViewProps & {
  glassEffectStyle?: 'regular' | 'clear' | 'identity';
  colorScheme?: 'light' | 'dark' | 'system';
  isInteractive?: boolean;
  tintColor?: string;
};

// GlassView is exported only so existing imports type-check; it should never
// actually render because isLiquidGlassAvailable() is false.
export const GlassView = View as unknown as ComponentType<GlassViewProps>;
