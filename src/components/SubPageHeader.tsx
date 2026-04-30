import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import Icon from './Icon';
import Text from './Text';

type IconName = keyof typeof LucideIcons;

type Action = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel?: string;
};

type Props = {
  title: string;
  onBack?: () => void;
  trailing?: Action;
};

export const HEADER_HEIGHT = 56;

export default function SubPageHeader({ title, onBack, trailing }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(115,115,115,0)']}
        style={styles.bannerGradient}
        pointerEvents="none"
      />

      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Icon name="ChevronLeft" size={20} color="#1A1A1A" strokeWidth={2.4} />
          </Pressable>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}

        <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        {trailing ? (
          <Pressable
            onPress={trailing.onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={trailing.accessibilityLabel ?? trailing.icon}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Icon name={trailing.icon} size={20} color="#1A1A1A" strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    paddingBottom: 4,
    zIndex: 10,
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: 12,
  },
  title: {
    flex: 1,
    marginLeft: 16,
    fontSize: 17,
    color: '#1A1A1A',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconBtnPlaceholder: {
    width: 44,
    height: 44,
  },
});
