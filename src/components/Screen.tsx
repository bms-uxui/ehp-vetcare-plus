import { ReactNode, useRef } from 'react';
import {
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { withTiming } from 'react-native-reanimated';
import { semantic, spacing } from '../theme';
import AppBackground from './AppBackground';
import { tabBarCompact } from '../navigation/tabBarVisibility';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  padded?: boolean;
  /**
   * Fade the top edge to mask scrolled content under the status bar.
   * Default: true. Disable on screens with a custom top section that already
   * extends to the screen top (e.g. HomeScreen banner).
   */
  topFade?: boolean;
  style?: ViewStyle;
  backgroundColor?: string;
  tabBarSpace?: boolean;
  // Legacy props — accepted but ignored.
  edges?: string[];
  gradient?: 'app' | 'soft' | 'none';
};

const TAB_BAR_SPACE = 110;

export default function Screen({
  children,
  scroll = false,
  keyboardAvoiding = false,
  padded = true,
  topFade = true,
  style,
  backgroundColor = semantic.background,
  tabBarSpace = false,
}: Props) {
  const insets = useSafeAreaInsets();

  const contentStyle = [
    padded && { paddingTop: insets.top + spacing.lg },
    padded && styles.padded,
    padded && !tabBarSpace && { paddingBottom: spacing.lg },
    tabBarSpace && { paddingBottom: TAB_BAR_SPACE },
    style,
  ];

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastY = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (Math.abs(y - lastY.current) > 1) {
      tabBarCompact.value = withTiming(1, { duration: 180 });
    }
    lastY.current = y;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      tabBarCompact.value = withTiming(0, { duration: 220 });
    }, 220);
  };

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onScrollEndDrag={() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
          tabBarCompact.value = withTiming(0, { duration: 220 });
        }, 180);
      }}
      onMomentumScrollEnd={() => {
        tabBarCompact.value = withTiming(0, { duration: 220 });
      }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View style={[styles.flex, { backgroundColor }]}>
      <AppBackground />
      {wrapped}
      {scroll && topFade && (
        <LinearGradient
          pointerEvents="none"
          colors={['#FFFDFB', 'rgba(255,253,251,0.85)', 'rgba(255,253,251,0)']}
          locations={[0, 0.55, 1]}
          style={[styles.fadeTop, { height: insets.top + 24 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: spacing.xl,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
