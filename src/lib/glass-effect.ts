// Re-export expo-glass-effect (iOS 26 Liquid Glass) through this shim so all
// callers go via one path. SDK 55 ships the real native module —
// `isLiquidGlassAvailable()` returns true on iOS 26+ and false everywhere
// else, so existing `LIQUID_GLASS ? GlassView : BlurView` fallbacks keep
// working unchanged.
export { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
export type { GlassViewProps } from 'expo-glass-effect';
