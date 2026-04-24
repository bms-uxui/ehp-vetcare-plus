import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
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

const INACTIVE_WIDTH = 56;
const BAR_PADDING = 6; // each side
const TAB_GAP = 4;
const SPRING = { damping: 16, stiffness: 220, mass: 0.9 };

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  // Up to 6 tabs supported; app currently has 4 (Home, Pets, Vet, Profile)
  const w0 = useSharedValue(INACTIVE_WIDTH);
  const w1 = useSharedValue(INACTIVE_WIDTH);
  const w2 = useSharedValue(INACTIVE_WIDTH);
  const w3 = useSharedValue(INACTIVE_WIDTH);
  const w4 = useSharedValue(INACTIVE_WIDTH);
  const w5 = useSharedValue(INACTIVE_WIDTH);
  const widths = [w0, w1, w2, w3, w4, w5];

  const numTabs = state.routes.length;

  useEffect(() => {
    if (!barWidth || !numTabs) return;
    const totalGaps = (numTabs - 1) * TAB_GAP;
    const available = barWidth - BAR_PADDING * 2 - totalGaps;
    const activeWidth = available - (numTabs - 1) * INACTIVE_WIDTH;

    for (let i = 0; i < numTabs; i++) {
      widths[i].value = withSpring(
        i === state.index ? activeWidth : INACTIVE_WIDTH,
        SPRING,
      );
    }
  }, [state.index, barWidth, numTabs]);

  const s0 = useAnimatedStyle(() => ({ width: w0.value }));
  const s1 = useAnimatedStyle(() => ({ width: w1.value }));
  const s2 = useAnimatedStyle(() => ({ width: w2.value }));
  const s3 = useAnimatedStyle(() => ({ width: w3.value }));
  const s4 = useAnimatedStyle(() => ({ width: w4.value }));
  const s5 = useAnimatedStyle(() => ({ width: w5.value }));
  const tabStyles = [s0, s1, s2, s3, s4, s5];

  const onBarLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== barWidth) setBarWidth(w);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
    >
      <View style={[styles.bar, shadows.lg]} onLayout={onBarLayout}>
        {state.routes.map((route, index) => {
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
              style={[styles.tab, tabStyles[index]]}
            >
              {focused && (
                <Animated.View
                  entering={FadeIn.duration(180).delay(60)}
                  exiting={FadeOut.duration(120)}
                  style={[styles.activePill, shadows.lift]}
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
              )}

              <View style={styles.tabContent}>
                <Icon
                  name={icon as any}
                  size={focused ? 22 : 24}
                  color={focused ? semantic.onPrimary : semantic.textMuted}
                  strokeWidth={focused ? 2.5 : 2}
                />
                {focused && (
                  <Animated.View
                    entering={FadeIn.duration(180).delay(140)}
                    exiting={FadeOut.duration(100)}
                  >
                    <Text
                      variant="bodyStrong"
                      color={semantic.onPrimary}
                      style={styles.tabLabel}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
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
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    padding: BAR_PADDING,
    gap: TAB_GAP,
    overflow: 'visible',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
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
