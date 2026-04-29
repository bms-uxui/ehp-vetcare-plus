// Force every caller through the BlurView fallback by reporting that Liquid
// Glass is not available, even when the native module is present. iOS 26
// Liquid Glass is not supported on every device the team is targeting and
// some users on older OS versions saw broken rendering, so we disable it
// system-wide. The BlurView fallback paths (shadows + hairline border +
// material tint) already provide enough depth on their own.
//
// `GlassView` is re-exported so existing imports keep type-checking, but
// it should never actually render because `isLiquidGlassAvailable()` is
// false everywhere.
export { GlassView } from 'expo-glass-effect';
export type { GlassViewProps } from 'expo-glass-effect';
export const isLiquidGlassAvailable = () => false;
