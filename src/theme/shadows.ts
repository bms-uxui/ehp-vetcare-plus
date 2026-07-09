import { ViewStyle } from 'react-native';

/**
 * Shadow tokens — every preset is TWO layers, the way a real shadow works:
 *
 *   contact  short offset, small blur, higher opacity  → where the object
 *            touches the surface. Reads as a crisp edge.
 *   ambient  long offset, large blur, low opacity      → how high it floats.
 *            Reads as a soft warm glow on the ground.
 *
 * The governing rule: the larger and farther a shadow spreads, the FAINTER it
 * gets — never darker. Light disperses with distance.
 *
 * RN ≥ 0.76 on the New Architecture supports multi-layer `boxShadow`, so both
 * layers render natively on iOS and Android. (The old single-`shadowColor`
 * limitation this file used to work around is gone.)
 *
 * Tint is rose (#5E303C) rather than black — a neutral shadow reads muddy
 * against the app's warm cream background.
 */
export const shadows = {
  none: {},
  // Chips, inputs, small tiles — barely lifted
  sm: {
    boxShadow:
      '0px 1px 2px rgba(94,48,60,0.10), 0px 2px 6px rgba(94,48,60,0.05)',
  },
  // Default card — floating, soft, warm
  md: {
    boxShadow:
      '0px 2px 4px rgba(94,48,60,0.10), 0px 8px 20px rgba(94,48,60,0.06)',
  },
  // Raised panels — floats highest, so the ambient layer is widest and faintest
  lg: {
    boxShadow:
      '0px 3px 6px rgba(94,48,60,0.10), 0px 14px 32px rgba(94,48,60,0.055)',
  },
  // Pop — tiles / hover-like raised cards
  pop: {
    boxShadow:
      '0px 2px 5px rgba(94,48,60,0.11), 0px 10px 24px rgba(94,48,60,0.06)',
  },
  // 3D lift — primary buttons. Tinted to the button's own rose so the shadow
  // reads as coloured light, not grime.
  lift: {
    boxShadow:
      '0px 2px 4px rgba(159,82,102,0.24), 0px 8px 20px rgba(159,82,102,0.14)',
  },
  // Upward — bottom sheets, tab bars. Same two-layer rule, light source below.
  up: {
    boxShadow:
      '0px -1px 3px rgba(94,48,60,0.08), 0px -8px 24px rgba(94,48,60,0.05)',
  },
  glass: {},
} satisfies Record<string, ViewStyle>;

/** `#RRGGBB` → `rgba(r,g,b,a)`. Passes through anything already rgb/rgba. */
function withAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex;
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Two-layer shadow tinted to an arbitrary colour — for surfaces whose shadow
 * must pick up their own hue (category tiles, coloured buttons). Follows the
 * same contact + ambient split as the static tokens above.
 */
export function tintedShadow(
  color: string,
  level: 'sm' | 'md' | 'pop' = 'md',
): ViewStyle {
  const spec = {
    sm: { near: [1, 2, 0.16], far: [3, 8, 0.09] },
    md: { near: [2, 4, 0.24], far: [8, 20, 0.14] },
    pop: { near: [2, 5, 0.28], far: [10, 24, 0.16] },
  }[level];
  const [ny, nb, no] = spec.near;
  const [fy, fb, fo] = spec.far;
  return {
    boxShadow:
      `0px ${ny}px ${nb}px ${withAlpha(color, no)}, ` +
      `0px ${fy}px ${fb}px ${withAlpha(color, fo)}`,
  };
}

export const gradients = {
  // App background — very subtle warm gradient so glass cards have something to sit on
  appBg: ['#FFFDFB', '#FBF3F4'] as const,
  appBgSoft: ['#FFFFFF', '#FFFDFB'] as const,
  // Glass surface fill — 145deg white translucent (visible when app bg is tinted)
  glassCard: ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.86)'] as const,
  // Strong glass — more opaque for subcards
  glassCardOpaque: ['rgba(255,255,255,1)', 'rgba(255,253,251,0.92)'] as const,
  // Top sheen — white fade for upper half of cards (simulates light from above)
  topSheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'] as const,
  // Primary rose gradient — lighter top, darker bottom = raised button
  primary: ['#CC8796', '#B86A7C', '#9F5266'] as const,
  primaryBtn: ['#CC8796', '#B86A7C', '#9F5266'] as const,
  primaryBtnPressed: ['#B86A7C', '#9F5266'] as const,
  // Soft rose illustration background
  roseSoft: ['#FBF3F4', '#F5E4E7'] as const,
  // Orb gradient (raised balls)
  orbRose: ['#DDA8B2', '#B86A7C'] as const,
  glassSheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'] as const,
  tileRose: ['#FBF3F4', '#F5E4E7'] as const,
} as const;
