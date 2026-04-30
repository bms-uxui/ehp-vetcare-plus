import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import Icon from './Icon';
import Text from './Text';

export type FeedingType = 'food' | 'water';

type Option = {
  key: FeedingType;
  label: string;
  icon: keyof typeof LucideIcons;
  color: string;
  gradient: [string, string];
  image: number;
};

const OPTIONS: Option[] = [
  {
    key: 'food',
    label: 'อาหาร',
    icon: 'UtensilsCrossed',
    color: '#D99A20',
    gradient: ['#FFE9B8', '#FFF6D9'],
    image: require('../../assets/illustrations/cat-meal.png'),
  },
  {
    key: 'water',
    label: 'น้ำ',
    icon: 'Droplet',
    color: '#4A8FD1',
    gradient: ['#C6E4F8', '#E0F0FB'],
    image: require('../../assets/illustrations/cat-water.png'),
  },
];

type Props = {
  value: FeedingType;
  onChange: (next: FeedingType) => void;
  label?: string;
};

export default function FeedingTypeCard({
  value,
  onChange,
  label = 'ประเภท',
}: Props) {
  const active = OPTIONS.find((o) => o.key === value) ?? OPTIONS[0];
  return (
    <View style={styles.card}>
      <LinearGradient
        pointerEvents="none"
        colors={active.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text weight="500" style={styles.title}>
          {label}
        </Text>
        <View style={styles.chipsRow}>
          {OPTIONS.map((opt) => {
            const isActive = value === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => onChange(opt.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && { backgroundColor: opt.color },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Icon
                  name={opt.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : opt.color}
                  strokeWidth={2.4}
                />
                <Text
                  weight="500"
                  style={[styles.chipText, isActive && { color: '#FFFFFF' }]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View pointerEvents="none" style={styles.imageWrap}>
        <Image source={active.image} style={styles.image} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingRight: 91,
    minHeight: 120,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  imageWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
