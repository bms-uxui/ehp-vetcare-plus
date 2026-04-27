import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as LucideIcons from 'lucide-react-native';

const LIQUID_GLASS = isLiquidGlassAvailable();

type Size = 'sm' | 'md' | 'lg';
type Variant = 'glass' | 'tinted';

type Props = {
  icon: keyof typeof LucideIcons;
  onPress?: () => void;
  size?: Size;
  variant?: Variant;
  tintColor?: string; // only used when variant="tinted"
  iconColor?: string;
  iconStrokeWidth?: number;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const SIZES: Record<Size, { box: number; icon: number; stroke: number }> = {
  sm: { box: 32, icon: 14, stroke: 2.4 },
  md: { box: 44, icon: 20, stroke: 2.2 },
  lg: { box: 56, icon: 24, stroke: 2.2 },
};

/**
 * Apple iOS 26 Liquid Glass icon button.
 * - Uses native UIGlassEffect (regular) on iOS 26
 * - Falls back to systemThinMaterial BlurView elsewhere
 * - Drop shadow + hairline highlight border per Apple HIG
 */
export default function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'glass',
  tintColor,
  iconColor = '#1A1A1A',
  iconStrokeWidth,
  disabled = false,
  style,
  accessibilityLabel,
}: Props) {
  const s = SIZES[size];
  const Comp = (LucideIcons as any)[icon];
  const radius = s.box / 2;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      style={({ pressed }) => [
        styles.shadow,
        { width: s.box, height: s.box, borderRadius: radius },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.clip, { borderRadius: radius }]}>
        {LIQUID_GLASS ? (
          <GlassView
            glassEffectStyle="regular"
            colorScheme="light"
            isInteractive
            tintColor={variant === 'tinted' ? tintColor : undefined}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <>
            <BlurView
              intensity={70}
              tint="systemThinMaterialLight"
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[
                styles.tint,
                variant === 'tinted' && tintColor
                  ? { backgroundColor: tintColor, opacity: 0.35 }
                  : null,
              ]}
            />
          </>
        )}
        <View
          pointerEvents="none"
          style={[styles.hairline, { borderRadius: radius }]}
        />
        {Comp && (
          <Comp
            size={s.icon}
            color={iconColor}
            strokeWidth={iconStrokeWidth ?? s.stroke}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Outer Pressable: holds drop shadow per Figma spec — 0px 8px 40px rgba(0,0,0,0.12)
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    backgroundColor: 'transparent',
  },
  // Inner View: clips the glass material to the rounded shape
  clip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  hairline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.4,
  },
});
