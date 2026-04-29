import type { ViewProps } from 'react-native';

export type GlassViewProps = ViewProps & {
  glassEffectStyle?: 'regular' | 'clear' | string;
  colorScheme?: 'light' | 'dark' | string;
  isInteractive?: boolean;
  tintColor?: string;
};

export const GlassView = (_props: GlassViewProps) => null;

export const isLiquidGlassAvailable = () => false;
