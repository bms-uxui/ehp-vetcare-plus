import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Card,
  Icon,
  Input,
  PetAvatar,
  Text,
} from '../components';
import { semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { useSchedules } from '../data/schedulesContext';
import { notifyNow } from '../lib/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFeedingSchedule'>;

const HEADER_HEIGHT = 56;

type ScheduleType = 'food' | 'water';

const TYPE_IMAGES: Record<ScheduleType, number> = {
  food: require('../../assets/illustrations/cat-meal.png'),
  water: require('../../assets/illustrations/cat-water.png'),
};

const TYPES: {
  key: ScheduleType;
  label: string;
  icon: string;
  color: string;
  bg: string;
  gradient: [string, string];
}[] = [
  {
    key: 'food',
    label: 'อาหาร',
    icon: 'UtensilsCrossed',
    color: '#D99A20',
    bg: '#FFF6D9',
    gradient: ['#FFE9B8', '#FFF6D9'],
  },
  {
    key: 'water',
    label: 'น้ำ',
    icon: 'Droplet',
    color: '#4A8FD1',
    bg: '#E0F0FB',
    gradient: ['#C6E4F8', '#E0F0FB'],
  },
];

const DAYS: { key: number; label: string }[] = [
  { key: 1, label: 'จ' },
  { key: 2, label: 'อ' },
  { key: 3, label: 'พ' },
  { key: 4, label: 'พฤ.' },
  { key: 5, label: 'ศ' },
  { key: 6, label: 'ส' },
  { key: 0, label: 'อา.' },
];

const TIME_OPTIONS = [
  '06:00',
  '07:00',
  '08:00',
  '12:00',
  '15:00',
  '18:00',
  '19:00',
  '21:00',
];

export default function AddFeedingScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { addSchedule } = useSchedules();
  const [type, setType] = useState<ScheduleType>('food');
  const activeTypeMeta = TYPES.find((t) => t.key === type) ?? TYPES[0];
  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(
    () => new Set(mockPets[0] ? [mockPets[0].id] : []),
  );
  const [days, setDays] = useState<Set<number>>(
    () => new Set([0, 1, 2, 3, 4, 5, 6]),
  );
  const [time, setTime] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const togglePet = (id: string) => {
    setSelectedPetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = !!(selectedPetIds.size > 0 && time && amount.trim());

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Two blur layers stacked behind the header — opacity is animated by
  // scrollY so the frosted glass fades in progressively as content scrolls
  // under. Animating opacity on Animated.View is far more reliable than
  // animating BlurView's `intensity` prop (which expo-blur doesn't always
  // wire through `createAnimatedComponent`).
  const headerSoftBlurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));
  const headerHardBlurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [60, 160],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const headerHairlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [60, 160],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const onSubmit = () => {
    if (!canSubmit || !time) return;
    const selectedPets = mockPets.filter((p) => selectedPetIds.has(p.id));
    // daysOfWeek convention: empty array means "every day"; otherwise sorted day numbers.
    const allDays = days.size === 7;
    const daysOfWeek = allDays ? [] : Array.from(days).sort((a, b) => a - b);
    const trimmedNote = note.trim();
    const trimmedAmount = amount.trim();

    selectedPets.forEach((p) => {
      addSchedule({
        type,
        petId: p.id,
        petName: p.name,
        petEmoji: p.emoji,
        time,
        amount: trimmedAmount,
        note: trimmedNote || undefined,
        enabled: true,
        daysOfWeek,
      });
    });

    const typeLabel = type === 'food' ? 'อาหาร' : 'น้ำ';
    notifyNow({
      title: 'บันทึกตารางเรียบร้อย',
      body: `${typeLabel} · ${time} · ${trimmedAmount}`,
    });

    navigation.goBack();
  };

  const toggleDay = (d: number) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + HEADER_HEIGHT,
            paddingBottom: insets.bottom + 96,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Type selector card with cat food bag illustration */}
        <View style={styles.section}>
          <View style={styles.typeCard}>
            <LinearGradient
              pointerEvents="none"
              colors={activeTypeMeta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.typeCardContent}>
              <Text weight="600" style={styles.typeCardHeading}>
                ดูแลน้องให้ครบทุกมื้อ
              </Text>
              <Text style={styles.typeCardDesc}>
                ตั้งเวลาไว้ เราจะช่วยเตือนให้เอง
              </Text>
              <View style={styles.typeChipsRow}>
                {TYPES.map((t) => (
                  <TypeChip
                    key={t.key}
                    chip={t}
                    active={type === t.key}
                    onPress={() => setType(t.key)}
                  />
                ))}
              </View>
            </View>
            <View pointerEvents="none" style={styles.typeCardImageWrap}>
              <Image
                source={TYPE_IMAGES[type]}
                style={styles.typeCardImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* Pet selector */}
        <View style={styles.section}>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            style={styles.sectionLabel}
          >
            สัตว์เลี้ยง
          </Text>
          <View style={styles.petGrid}>
            {mockPets.map((p) => {
              const selected = selectedPetIds.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => togglePet(p.id)}
                  style={({ pressed }) => [
                    styles.petTile,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.petAvatarRing,
                      selected && styles.petAvatarRingSelected,
                    ]}
                  >
                    <PetAvatar
                      pet={p}
                      size={56}
                      backgroundColor="#FFFFFF"
                    />
                    {selected && (
                      <View style={styles.petCheckBadge} pointerEvents="none">
                        <Icon
                          name="Check"
                          size={11}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />
                      </View>
                    )}
                  </View>
                  <Text
                    weight={selected ? '600' : '500'}
                    style={[
                      styles.petName,
                      selected && { color: semantic.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Amount field */}
        <View style={styles.fieldSection}>
          <Input
            label="ปริมาณ"
            value={amount}
            onChangeText={setAmount}
            placeholder={type === 'food' ? 'เช่น 80 กรัม' : 'เช่น 1 ชาม'}
          />
        </View>

        {/* Days picker */}
        <View style={styles.fieldSection}>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            style={styles.sectionLabel}
          >
            วันที่
          </Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => (
              <DayChip
                key={d.key}
                label={d.label}
                active={days.has(d.key)}
                onPress={() => toggleDay(d.key)}
              />
            ))}
          </View>
        </View>

        {/* Time picker */}
        <View style={styles.fieldSection}>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            style={styles.sectionLabel}
          >
            เวลา
          </Text>
          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map((t) => (
              <TimeTile
                key={t}
                time={t}
                selected={time === t}
                onPress={() => setTime(time === t ? null : t)}
              />
            ))}
          </View>
        </View>

        {/* Note field — multiline */}
        <View style={styles.fieldSection}>
          <Input
            label="หมายเหตุ"
            value={note}
            onChangeText={setNote}
            placeholder="เช่น อาหารเม็ด Prescription"
            multiline
          />
        </View>

      </Animated.ScrollView>

      {/* Animated blur header — transparent at top of scroll, frosted blur
          fades in as content scrolls under it. iOS "scroll-under" pattern. */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT },
        ]}
        pointerEvents="box-none"
      >
        {/* Soft light blur — appears first as user starts scrolling */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, headerSoftBlurStyle]}
        >
          <BlurView
            intensity={30}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        {/* Heavier frosted blur — overlays once content scrolls further */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, headerHardBlurStyle]}
        >
          <BlurView
            intensity={80}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.headerHairline, headerHairlineStyle]}
        />

        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerIconBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Icon
              name="ChevronLeft"
              size={20}
              color="#1A1A1A"
              strokeWidth={2.4}
            />
          </Pressable>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={styles.headerTitle}
          >
            เพิ่มตาราง
          </Text>
          <View style={styles.headerIconPlaceholder} />
        </View>
      </View>

      {/* Save button — pinned to bottom with frosted-glass blur so the
          scroll content can be glimpsed scrolling underneath. */}
      <View style={[styles.saveBar, { paddingBottom: insets.bottom + 16 }]}>
        <BlurView
          intensity={80}
          tint="systemChromeMaterialLight"
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            canSubmit && styles.submitBtnActive,
            pressed && canSubmit && { opacity: 0.9 },
          ]}
        >
          <Text
            weight="500"
            style={[
              styles.submitBtnText,
              canSubmit && { color: '#FFFFFF' },
            ]}
          >
            บันทึกตาราง
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Time tile — scale-bump animation on selection ---------- */

function TimeTile({
  time,
  selected,
  onPress,
}: {
  time: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 140 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.timeTile, animatedStyle]}>
      <Card
        variant="elevated"
        selected={selected}
        padding="sm"
        onPress={onPress}
        style={styles.timeTileShadow}
      >
        <View style={styles.timeInner}>
          <Text variant="bodyStrong" style={{ fontSize: 13 }}>
            {time}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

/* ---------- Day circle — scale-bump animation on activation ---------- */

function DayChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 130 }),
        withSpring(1, { damping: 11, stiffness: 220 }),
      );
    }
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <Animated.View
        style={[
          styles.dayCircle,
          active && styles.dayCircleActive,
          animatedStyle,
        ]}
      >
        <Text
          weight="500"
          style={[styles.dayText, active && { color: '#FFFFFF' }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Type chip — scale-bump animation on activation ---------- */

function TypeChip({
  chip,
  active,
  onPress,
}: {
  chip: (typeof TYPES)[number];
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 140 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <Animated.View
        style={[
          styles.typeChip,
          active && {
            backgroundColor: chip.color,
            shadowColor: chip.color,
            shadowOpacity: 0.28,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          },
          animatedStyle,
        ]}
      >
        <Icon
          name={chip.icon as any}
          size={16}
          color={active ? '#FFFFFF' : chip.color}
          strokeWidth={2.4}
        />
        <Text
          weight="500"
          style={[styles.typeChipText, active && { color: '#FFFFFF' }]}
        >
          {chip.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 0,
  },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 48,
    color: '#1A1A1A',
    letterSpacing: 0,
  },
  heroDesc: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Section wrapper (with horizontal padding 16)
  section: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  sectionLabel: {
    marginLeft: spacing.xs,
  },

  // Type selector card with illustration
  typeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingRight: 91,
    minHeight: 120,
    position: 'relative',
  },
  typeCardContent: {
    flex: 1,
    padding: 16,
    gap: 8,
    justifyContent: 'center',
  },
  typeCardHeading: {
    fontSize: 17,
    lineHeight: 22,
    color: '#1A1A1A',
  },
  typeCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#5C4A4F',
    marginBottom: 4,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 1000,
    backgroundColor: '#FFFFFF',
  },
  typeChipText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  typeCardImageWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 110,
    height: 110,
  },
  typeCardImage: {
    width: '100%',
    height: '100%',
  },

  // Pet selector
  petGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  petTile: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  petAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 4,
    backgroundColor: '#F2F2F3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  petAvatarRingSelected: {
    backgroundColor: semantic.primaryMuted,
    borderWidth: 1.5,
    borderColor: semantic.primary,
  },
  petCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  petName: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Bordered input field
  fieldSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },

  // Days picker (7 circles)
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dayCircleActive: {
    backgroundColor: semantic.primary,
    shadowColor: semantic.primary,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  dayText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A1A1A',
  },

  // Time picker (4 cols × 2 rows)
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 6,
  },
  timeTile: {
    flexBasis: '22%',
    flexGrow: 1,
  },
  timeTileShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timeInner: {
    alignItems: 'center',
  },

  // Animated blur header — overlay at the top, blurs in on scroll
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerHairline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  headerIconPlaceholder: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 17,
    color: '#1A1A1A',
  },

  // Save button — pinned bottom bar with frosted-glass blur (safe-area aware)
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  submitBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D0D0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: semantic.primary,
  },
  submitBtnText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
});
