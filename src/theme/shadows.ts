import { ViewStyle } from 'react-native';

/**
 * Shadow tokens tuned to the ER Registry "glass 3D" reference:
 *   - Tight near drop (crisp edge)
 *   - Wide mid floating shadow
 *   - Deep ambient rose-tinted shadow (soft warm glow on the ground)
 *
 * React Native only supports ONE native shadow per View. These presets pick
 * the wide mid layer as the dominant one, since it's the most visible.
 * Additional depth comes from Card's white top-edge highlight + subtle top sheen.
 */
export const shadows = {
  none: {},
  // Tight near drop — for subtle elevation (chips, inputs)
  sm: {
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Default card — floating, soft, warm
  md: {
    shadowColor: '#5E303C',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  // Raised panels — deeper ambient
  lg: {
    shadowColor: '#5E303C',
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  // Pop — for tiles / hover-like raised cards
  pop: {
    shadowColor: '#5E303C',
    shadowOpacity: 0.20,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  // 3D lift — primary buttons (matches HOSxP oncology recipe: 0 6px 20px rgba 0.35)
  lift: {
    shadowColor: '#D07A93',
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 9,
  },
  glass: {},
} satisfies Record<string, ViewStyle>;

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
