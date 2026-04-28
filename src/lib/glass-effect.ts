// SDK 54 stub for expo-glass-effect (only ships in SDK 55+).
// `isLiquidGlassAvailable()` always returns false here, so all
// `LIQUID_GLASS ? GlassView : BlurView` call sites fall through to
// BlurView and `GlassView` is never actually rendered.
import { View } from 'react-native';
import type { ComponentType, ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';

export type GlassViewProps = {
  glassEffectStyle?: 'regular' | 'clear';
  colorScheme?: 'light' | 'dark';
  isInteractive?: boolean;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export const GlassView = View as unknown as ComponentType<GlassViewProps>;
export const isLiquidGlassAvailable = () => false;
