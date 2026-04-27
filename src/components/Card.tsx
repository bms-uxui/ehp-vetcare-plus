import { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, radii, semantic, shadows, spacing } from '../theme';

type Variant = 'elevated' | 'outlined' | 'filled' | 'selected' | 'glass';

type Props = {
  children: ReactNode;
  variant?: Variant;
  selected?: boolean;
  onPress?: () => void;
  padding?: keyof typeof spacing | 0;
  style?: ViewStyle;
};

const CARD_RADIUS = radii.xl;

export default function Card({
  children,
  variant = 'elevated',
  selected = false,
  onPress,
  padding = 'xl',
  style,
}: Props) {
  const paddingValue = padding === 0 ? 0 : spacing[padding];
  const resolvedVariant: Variant = selected ? 'selected' : variant;

  const showGlass =
    resolvedVariant === 'elevated' ||
    resolvedVariant === 'glass' ||
    resolvedVariant === 'selected';

  // Wrapper handles the deep ambient shadow (the "floor glow").
  // Inner clipper handles border/clipping + the tight near-shadow.
  const wrapperStyle = [
    styles.wrapper,
    showGlass && styles.wrapperShadow,
    style,
  ];

  const innerStyle = [
    styles.inner,
    innerVariants[resolvedVariant],
  ];

  const inner = (
    <View style={innerStyle}>
      {showGlass && (
        <>
          {/* Glass tint behind the blur — mostly white with a hint of warmth */}
          <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
          {/* Actual blur — reveals rose/cream app-bg blobs through the card */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 55 : 80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          {/* Gradient overlay — subtle 145deg white diagonal (simulates a lit face) */}
          <LinearGradient
            colors={
              resolvedVariant === 'selected'
                ? ['rgba(251,243,244,0.92)', 'rgba(245,228,231,0.75)']
                : ['rgba(255,255,255,0.78)', 'rgba(255,253,251,0.55)']
            }
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Top sheen — brighter upper 40% (like light raking across glass) */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topSheen}
          />
          {/* 1px bright top edge — the glass lip */}
          <View pointerEvents="none" style={styles.topEdge} />
        </>
      )}
      <View style={{ padding: paddingValue, flex: 1 }}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [wrapperStyle, pressed && styles.pressed]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={wrapperStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: CARD_RADIUS,
  },
  wrapperShadow: {
    ...shadows.md,
  },
  inner: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: semantic.surface,
  },
  pressed: {
    transform: [{ translateY: 1 }, { scale: 0.995 }],
    opacity: 0.98,
  },
  glassTint: {
    backgroundColor: 'rgba(255,251,247,0.7)',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
});

const innerVariants: Record<Variant, ViewStyle> = {
  elevated: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  outlined: {
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  filled: {
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  selected: {
    borderWidth: 2,
    borderColor: semantic.primary,
  },
  glass: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
};
