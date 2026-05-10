import { useWindowDimensions } from 'react-native';

/** Width above which we treat the device as a tablet — content gets centered
 *  inside a constrained max-width column instead of stretching full-bleed. */
export const TABLET_BREAKPOINT = 700;

/** Reading-friendly max content width for tablet/desktop layouts.
 *  Sized so that on iPad Pro 11" portrait (834pt) content fills nearly the full
 *  width with only ~20pt side margins, while on iPad 12.9" / landscape it
 *  centers with comfortable margins. */
export const TABLET_MAX_WIDTH = 880;

/**
 * Returns the horizontal padding needed to center a `maxWidth` column inside
 * the current screen, falling back to `basePadding` on phone-width devices.
 *
 * Usage:
 *   const padX = useTabletHorizontalPadding();
 *   <ScrollView contentContainerStyle={{ paddingHorizontal: padX }}>
 */
export function useTabletHorizontalPadding(
  basePadding = 16,
  maxWidth = TABLET_MAX_WIDTH,
): number {
  const { width } = useWindowDimensions();
  if (width <= TABLET_BREAKPOINT) return basePadding;
  return Math.max(basePadding, (width - maxWidth) / 2);
}

/** True when the screen is wider than the tablet breakpoint. */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width > TABLET_BREAKPOINT;
}

/**
 * Responsive product-grid column count.
 *  - phone (< 700pt) → 2 cols
 *  - iPad portrait (700–1180pt) → 4 cols
 *  - iPad landscape (≥ 1180pt) → 6 cols
 */
export function getProductColumns(width: number): number {
  if (width >= 1180) return 6;
  if (width >= 700) return 4;
  return 2;
}

/**
 * Uniform scale factor relative to a 390pt baseline (iPhone 14), clamped so
 * layouts stay proportional without overshooting on tiny phones or tablets.
 *  - iPhone SE (320pt)  → ~0.86
 *  - iPhone 14 (390pt)  → 1.00
 *  - iPhone 14 Pro Max  → ~1.10
 *  - iPad (≥ 700pt)     → 1.20 (capped)
 *
 * Use to scale font sizes, icon sizes, and fixed-pt box dimensions.
 */
export function useResponsiveScale(min = 0.86, max = 1.2, baseline = 390): number {
  const { width } = useWindowDimensions();
  return Math.max(min, Math.min(max, width / baseline));
}

/**
 * Typography scale factor — phone stays at 1.0, tablet bumps to a fixed
 * multiplier so font sizes don't grow proportionally with screen width
 * (which would make headings absurdly large on iPad Pro 13").
 *
 *  - phone (< 700pt) → 1.00
 *  - iPad (≥ 700pt)  → 1.15
 */
export function useFontScale(tabletMultiplier = 1.15): number {
  const { width } = useWindowDimensions();
  return width > TABLET_BREAKPOINT ? tabletMultiplier : 1;
}
