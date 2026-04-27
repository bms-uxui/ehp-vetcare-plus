import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, semantic, shadows, spacing } from '../theme';
import Icon from '../components/Icon';
import Text from '../components/Text';

const LIQUID_GLASS = isLiquidGlassAvailable();
const BAR_PADDING = 6;
const PILL_SPRING = { damping: 20, stiffness: 240, mass: 0.8 };
const ICON_SPRING = { damping: 14, stiffness: 260, mass: 0.7 };

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const numTabs = state.routes.length;
  const tabWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / numTabs : 0;

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const initialised = useRef(false);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const targetX = BAR_PADDING + state.index * tabWidth;

    if (!initialised.current) {
      // First layout — snap into place without animation
      pillX.value = targetX;
      pillW.value = tabWidth;
      initialised.current = true;
    } else {
      pillX.value = withSpring(targetX, PILL_SPRING);
      pillW.value = withSpring(tabWidth, PILL_SPRING);
    }
  }, [state.index, tabWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

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
        {LIQUID_GLASS ? (
          <GlassView
            glassEffectStyle="regular"
            colorScheme="light"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <>
            <BlurView
              intensity={100}
              tint="systemChromeMaterialLight"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
              locations={[0, 0.55]}
              style={styles.barSheen}
            />
            <View pointerEvents="none" style={styles.barHighlight} />
            <View pointerEvents="none" style={styles.barShade} />
          </>
        )}

        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.activePill, pillStyle, shadows.lift]}
          >
            <LinearGradient
              colors={['#B86A7C', '#9F5266', '#7F4151']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.insetTop} />
            <View pointerEvents="none" style={styles.insetBottom} />
          </Animated.View>
        )}

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
            <TabButton
              key={route.key}
              focused={focused}
              icon={icon}
              label={label}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

type TabButtonProps = {
  focused: boolean;
  icon: string;
  label: string;
  onPress: () => void;
};

function TabButton({ focused, icon, label, onPress }: TabButtonProps) {
  // One unified scale value: focus bumps it to 1.08, press dips it 6% lower momentarily.
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, ICON_SPRING);
  }, [focused]);

  const onPressIn = () => {
    scale.value = withTiming(focused ? 1.02 : 0.94, { duration: 90 });
  };
  const onPressOut = () => {
    scale.value = withSpring(focused ? 1.08 : 1, ICON_SPRING);
  };

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tint = focused ? semantic.onPrimary : semantic.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.tab}
    >
      <Animated.View style={[styles.tabContent, contentStyle]}>
        <Icon
          name={icon as any}
          size={24}
          color={tint}
          strokeWidth={focused ? 2.4 : 2}
        />
        <Text color={tint} style={styles.tabLabel} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
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
    alignItems: 'stretch',
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: BAR_PADDING,
    overflow: 'hidden',
  },
  barSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '55%',
  },
  barHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  barShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(94,48,60,0.08)',
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  activePill: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: 0,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.1,
    fontWeight: '600',
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
