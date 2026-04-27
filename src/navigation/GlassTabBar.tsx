import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, semantic, shadows, spacing } from '../theme';
import Icon from '../components/Icon';
import Text from '../components/Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const INACTIVE_WIDTH = 46;
const BAR_PADDING = 5;
const SPRING = { damping: 18, stiffness: 180, mass: 0.9 };
const FAB_SIZE = 68;
const FAB_GUTTER = 8;
const FAB_INDEX = 2;

const inLeftHalf = (i: number) => i === 0 || i === 1;
const inRightHalf = (i: number) => i === 3 || i === 4;

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  // Width per tab — drives layout. Three target states (compact, INACTIVE, expanded).
  const w0 = useSharedValue(INACTIVE_WIDTH);
  const w1 = useSharedValue(INACTIVE_WIDTH);
  const w3 = useSharedValue(INACTIVE_WIDTH);
  const w4 = useSharedValue(INACTIVE_WIDTH);
  // Progress per tab (0..1) — drives content fade (icon ↔ label, pill opacity).
  const p0 = useSharedValue(state.index === 0 ? 1 : 0);
  const p1 = useSharedValue(state.index === 1 ? 1 : 0);
  const p3 = useSharedValue(state.index === 3 ? 1 : 0);
  const p4 = useSharedValue(state.index === 4 ? 1 : 0);
  const fabProgress = useSharedValue(state.index === FAB_INDEX ? 1 : 0);

  const wFor = (i: number) => {
    if (i === 0) return w0;
    if (i === 1) return w1;
    if (i === 3) return w3;
    if (i === 4) return w4;
    return null;
  };
  const pFor = (i: number) => {
    if (i === 0) return p0;
    if (i === 1) return p1;
    if (i === 3) return p3;
    if (i === 4) return p4;
    return null;
  };

  const halfWidth =
    barWidth > 0
      ? (barWidth - BAR_PADDING * 2 - FAB_SIZE - FAB_GUTTER * 2) / 2
      : 0;
  const compactWidth = halfWidth / 2;
  const expandedWidth = halfWidth - INACTIVE_WIDTH;

  // Target width for tab i given current state.
  // - Tab i is active → expandedWidth
  // - Tab i is sibling of active (same half) → INACTIVE_WIDTH (sum stays = halfWidth)
  // - No active in tab i's half (or FAB active) → compactWidth (halfWidth/2)
  const computeTargetWidth = (i: number) => {
    if (state.index === FAB_INDEX) return compactWidth;
    if (i === state.index) return expandedWidth;
    const sameHalf =
      (inLeftHalf(i) && inLeftHalf(state.index)) ||
      (inRightHalf(i) && inRightHalf(state.index));
    if (sameHalf) return INACTIVE_WIDTH;
    return compactWidth;
  };

  useEffect(() => {
    if (!barWidth) return;
    [0, 1, 3, 4].forEach((i) => {
      const w = wFor(i);
      const p = pFor(i);
      if (w) w.value = withSpring(computeTargetWidth(i), SPRING);
      if (p) p.value = withSpring(i === state.index ? 1 : 0, SPRING);
    });
    fabProgress.value = withSpring(state.index === FAB_INDEX ? 1 : 0, SPRING);
  }, [state.index, barWidth]);

  const useWidthStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({ width: sv.value }));
  const useFadeIn = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({ opacity: sv.value }));
  const useFadeOut = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({ opacity: 1 - sv.value }));

  const tabW0 = useWidthStyle(w0);
  const tabW1 = useWidthStyle(w1);
  const tabW3 = useWidthStyle(w3);
  const tabW4 = useWidthStyle(w4);
  const tabWidthStyles: Record<number, any> = { 0: tabW0, 1: tabW1, 3: tabW3, 4: tabW4 };

  const pill0 = useFadeIn(p0);
  const pill1 = useFadeIn(p1);
  const pill3 = useFadeIn(p3);
  const pill4 = useFadeIn(p4);
  const pillStyles: Record<number, any> = { 0: pill0, 1: pill1, 3: pill3, 4: pill4 };

  const label0 = useFadeIn(p0);
  const label1 = useFadeIn(p1);
  const label3 = useFadeIn(p3);
  const label4 = useFadeIn(p4);
  const labelStyles: Record<number, any> = { 0: label0, 1: label1, 3: label3, 4: label4 };

  const icon0 = useFadeOut(p0);
  const icon1 = useFadeOut(p1);
  const icon3 = useFadeOut(p3);
  const icon4 = useFadeOut(p4);
  const iconStyles: Record<number, any> = { 0: icon0, 1: icon1, 3: icon3, 4: icon4 };

  const fabFillStyle = useAnimatedStyle(() => ({ opacity: fabProgress.value }));

  const onBarLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== barWidth) setBarWidth(w);
  };

  const fabRoute = state.routes[FAB_INDEX];
  const fabFocused = state.index === FAB_INDEX;
  const fabPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: fabRoute.key,
      canPreventDefault: true,
    });
    if (!fabFocused && !event.defaultPrevented) {
      navigation.navigate(fabRoute.name);
    }
  };

  const renderTab = (index: number) => {
    const route = state.routes[index];
    if (!route) return null;
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label = (options.tabBarLabel as string) ?? options.title ?? route.name;
    const icon = (options as any).tabIcon as string;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <AnimatedPressable
        key={route.key}
        onPress={onPress}
        style={[styles.tab, tabWidthStyles[index]]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.activePill, shadows.lift, pillStyles[index]]}
        >
          <LinearGradient
            colors={['#EFA5B8', '#DA8AA1', '#C87390']}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.insetTop} />
          <View pointerEvents="none" style={styles.insetBottom} />
        </Animated.View>

        <View style={styles.tabContent}>
          <Animated.View style={[styles.contentLayer, iconStyles[index]]}>
            <Icon
              name={icon as any}
              size={24}
              color={semantic.textMuted}
              strokeWidth={2}
            />
          </Animated.View>
          <Animated.View style={[styles.contentLayer, labelStyles[index]]}>
            <Text
              variant="bodyStrong"
              color={semantic.onPrimary}
              style={styles.tabLabel}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Animated.View>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
    >
      <View style={[styles.bar, shadows.lg]} onLayout={onBarLayout}>
        <View style={styles.half}>
          {renderTab(0)}
          {renderTab(1)}
        </View>
        <View style={{ width: FAB_SIZE + FAB_GUTTER * 2 }} />
        <View style={styles.half}>
          {renderTab(3)}
          {renderTab(4)}
        </View>
      </View>

      <View pointerEvents="none" style={styles.fabCutout}>
        <LinearGradient
          colors={['#FFFDFB', '#FBF3F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Pressable onPress={fabPress} style={[styles.fabWrap, shadows.lift]}>
        <View style={styles.fabRing}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: semantic.surface }]} />
          <Animated.View style={[StyleSheet.absoluteFill, fabFillStyle]}>
            <LinearGradient
              colors={['#EFA5B8', '#DA8AA1', '#C87390']}
              locations={[0, 0.4, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Icon
            name="Stethoscope"
            size={28}
            color={fabFocused ? semantic.onPrimary : semantic.primary}
            strokeWidth={2.2}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    padding: BAR_PADDING,
    overflow: 'visible',
    alignSelf: 'stretch',
  },
  half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  contentLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: 0,
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
  fabCutout: {
    position: 'absolute',
    top: -FAB_SIZE / 3 - 6,
    alignSelf: 'center',
    width: FAB_SIZE + 12,
    height: FAB_SIZE + 12,
    borderRadius: (FAB_SIZE + 12) / 2,
    overflow: 'hidden',
  },
  fabWrap: {
    position: 'absolute',
    top: -FAB_SIZE / 3,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignSelf: 'center',
  },
  fabRing: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 3,
    borderColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
