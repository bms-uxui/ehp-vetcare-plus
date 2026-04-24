import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { gradients, radii, semantic, shadows, spacing } from '../theme';
import Text from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  uppercase?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
};

const BTN_RADIUS = radii.lg;

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  uppercase,
  leftIcon,
  rightIcon,
  style,
}: Props) {
  const s = sizeStyles[size];
  const isInactive = disabled || loading;
  const shouldUppercase = uppercase ?? (variant === 'primary' || variant === 'destructive');

  const textColor =
    variant === 'primary' || variant === 'destructive'
      ? semantic.onPrimary
      : semantic.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        { height: s.height, borderRadius: BTN_RADIUS },
        fullWidth && styles.fullWidth,
        variant === 'primary' && shadows.lift,
        variant === 'primary' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
        variant === 'destructive' && shadows.md,
        variant === 'destructive' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
        variant === 'secondary' && shadows.sm,
        variant === 'ghost' && styles.ghostReset,
        variant === 'secondary' && { backgroundColor: semantic.surface, borderWidth: 1.5, borderColor: semantic.primary },
        pressed && !isInactive && styles.pressed,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {variant === 'primary' && (
        <>
          {/* 145° diagonal gradient — bright rose */}
          <LinearGradient
            colors={['#EFA5B8', '#DA8AA1', '#C87390']}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Inset top highlight — 1.5px bright line inside */}
          <View pointerEvents="none" style={styles.insetTop} />
          {/* Inset bottom shadow — 1.5px dark line inside */}
          <View pointerEvents="none" style={styles.insetBottom} />
        </>
      )}
      {variant === 'destructive' && (
        <>
          <LinearGradient
            colors={['#E17A7A', '#C25450', '#A6403D']}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.insetTop} />
          <View pointerEvents="none" style={styles.insetBottom} />
        </>
      )}

      <View style={[styles.content, { paddingHorizontal: s.paddingX }]}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {leftIcon}
            <Text
              variant="bodyStrong"
              color={textColor}
              style={{
                fontSize: s.fontSize,
                letterSpacing: shouldUppercase ? 1.2 : 0.2,
                textTransform: shouldUppercase ? 'uppercase' : 'none',
              }}
            >
              {label}
            </Text>
            {rightIcon}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  inactive: { opacity: 0.5 },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ghostReset: {
    borderWidth: 0,
  },
  insetTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  insetBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
});

const sizeStyles: Record<Size, { height: number; paddingX: number; fontSize: number }> = {
  sm: { height: 42, paddingX: spacing.lg, fontSize: 13 },
  md: { height: 54, paddingX: spacing.xl, fontSize: 15 },
  lg: { height: 60, paddingX: spacing['2xl'], fontSize: 16 },
};
