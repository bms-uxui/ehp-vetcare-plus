import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LucideIcons from 'lucide-react-native';
import IconButton from './IconButton';
import Text from './Text';
import { spacing } from '../theme';

type IconName = keyof typeof LucideIcons;

type ActionButton = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel?: string;
};

type Props = {
  /** Reanimated shared value tracking ScrollView's contentOffset.y */
  scrollY: SharedValue<number>;
  /** Bar background fully transparent below this scroll value */
  fadeStartAt?: number;
  /** Bar background fully opaque (glass) at or beyond this scroll value */
  fadeEndAt?: number;
  /** Title that fades in alongside the bar background */
  title?: string;
  /** Left-side button (typically Back) */
  leading?: ActionButton;
  /** Right-side button (Cart, Search, etc.) — accepts a node for custom badge wrappers */
  trailing?: ActionButton | React.ReactNode;
  /** Custom badge / overlay rendered inside the trailing slot */
  trailingBadge?: React.ReactNode;
};

/**
 * Apple iOS-style sticky AppBar with floating Liquid Glass icon buttons
 * and a glass surface that fades in once the user scrolls past `fadeStartAt`.
 *
 * Usage: render at the root level of a screen above the ScrollView; pass
 * the same shared value used by `useAnimatedScrollHandler`.
 */
export default function StickyAppBar({
  scrollY,
  fadeStartAt = 0,
  fadeEndAt = 40,
  title,
  leading,
  trailing,
  trailingBadge,
}: Props) {
  const insets = useSafeAreaInsets();

  const barBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [fadeStartAt, fadeEndAt],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [fadeStartAt + 30, fadeEndAt],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [fadeStartAt + 30, fadeEndAt],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const renderTrailing = () => {
    if (!trailing) return <View style={styles.placeholder} />;
    // ActionButton object → render IconButton + optional badge wrapper
    if (typeof trailing === 'object' && 'icon' in trailing) {
      return (
        <View collapsable={false}>
          <IconButton
            icon={trailing.icon}
            size="md"
            onPress={trailing.onPress}
            accessibilityLabel={trailing.accessibilityLabel}
          />
          {trailingBadge}
        </View>
      );
    }
    // Pre-rendered ReactNode (caller controls everything, e.g. animated badge)
    return <>{trailing}</>;
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.appbar,
        { paddingTop: insets.top, height: insets.top + 56 },
      ]}
    >
      {/* Apple-style nav bar — single glass blur with subtle white tint */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, barBgStyle]}
      >
        <BlurView
          intensity={80}
          tint="systemChromeMaterialLight"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.barTint]} />
        <View style={styles.barHairline} />
      </Animated.View>

      {/* Foreground — leading + animated title + trailing */}
      <View style={styles.content}>
        {leading ? (
          <IconButton
            icon={leading.icon}
            size="md"
            onPress={leading.onPress}
            accessibilityLabel={leading.accessibilityLabel}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        {title ? (
          <Animated.View
            style={[styles.titleWrap, titleStyle]}
            pointerEvents="none"
          >
            <Text variant="bodyStrong" style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </Animated.View>
        ) : null}

        {renderTrailing()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  placeholder: {
    width: 44, // matches IconButton md size, keeps spacing balanced
    height: 44,
  },
  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: '#1A1A1A',
    maxWidth: '60%',
    textAlign: 'center',
  },
  barTint: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  barHairline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
