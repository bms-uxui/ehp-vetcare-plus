import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Shared shimmer hook — returns an animated style that translates a gradient
 * from left to right repeatedly. Use it on a `<SkeletonShimmer />` overlay.
 */
export function useSkeletonShimmer() {
  const { width } = useWindowDimensions();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [v]);
  return useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(v.value, [0, 1], [-width, width]) },
    ],
  }));
}

type BoxProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
  /** Slightly translucent — for boxes sitting on a colored card. */
  light?: boolean;
};

export function SkeletonBox({
  width,
  height = 12,
  radius,
  style,
  light = false,
}: BoxProps) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? height / 2,
          backgroundColor: light ? 'rgba(255,255,255,0.55)' : '#D7D7DB',
        },
        style,
      ]}
    />
  );
}

/**
 * Place inside a container that has `overflow: 'hidden'`. The shimmerStyle
 * comes from `useSkeletonShimmer()` and should be passed in (single hook
 * instance per screen so all skeletons sweep together).
 */
export function SkeletonShimmer({
  shimmerStyle,
}: {
  shimmerStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, shimmerStyle]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    left: 0,
  },
  gradient: { flex: 1 },
});
