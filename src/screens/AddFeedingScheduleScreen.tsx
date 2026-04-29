import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { Icon, PetAvatar, StickyAppBar, Text } from '../components';
import { semantic } from '../theme';
import { mockPets } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFeedingSchedule'>;

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

  const onSubmit = () => {
    if (!canSubmit) return;
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
      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={60}
        fadeEndAt={120}
        title="เพิ่มตาราง"
        leading={{
          icon: 'ChevronLeft',
          onPress: () => navigation.goBack(),
          accessibilityLabel: 'ย้อนกลับ',
        }}
      />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56, paddingBottom: 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text variant="h1" style={styles.heroTitle}>
            เพิ่มตาราง
          </Text>
          <Text style={styles.heroDesc}>
            ตั้งเวลาและปริมาณสำหรับการแจ้งเตือน
          </Text>
        </View>

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
              <Text weight="500" style={styles.typeCardTitle}>
                ประเภท
              </Text>
              <View style={styles.typeChipsRow}>
                {TYPES.map((t) => {
                  const active = type === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setType(t.key)}
                      style={({ pressed }) => [
                        styles.typeChip,
                        active && { backgroundColor: t.color },
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Icon
                        name={t.icon as any}
                        size={14}
                        color={active ? '#FFFFFF' : t.color}
                        strokeWidth={2.4}
                      />
                      <Text
                        weight="500"
                        style={[
                          styles.typeChipText,
                          active && { color: '#FFFFFF' },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View pointerEvents="none" style={styles.typeCardImageWrap}>
              <Image
                source={TYPE_IMAGES[type]}
                style={styles.typeCardImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Pet selector */}
        <View style={styles.section}>
          <Text weight="500" style={styles.sectionLabel}>
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
          <Text style={styles.fieldLabel}>ปริมาณ</Text>
          <TextInput
            style={styles.fieldInput}
            value={amount}
            onChangeText={setAmount}
            placeholder={type === 'food' ? 'เช่น 80 กรัม' : 'เช่น 1 ชาม'}
            placeholderTextColor="#9A9AA0"
          />
        </View>

        {/* Days picker */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>วันที่</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => {
              const active = days.has(d.key);
              return (
                <Pressable
                  key={d.key}
                  onPress={() => toggleDay(d.key)}
                  style={({ pressed }) => [
                    styles.dayCircle,
                    active && styles.dayCircleActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    weight="500"
                    style={[
                      styles.dayText,
                      active && { color: '#FFFFFF' },
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Time picker */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>เวลา</Text>
          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map((t) => {
              const active = time === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTime(t)}
                  style={({ pressed }) => [
                    styles.timePill,
                    active && styles.timePillActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    weight="500"
                    style={[
                      styles.timeText,
                      active && { color: '#FFFFFF' },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Note field — multiline */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>หมายเหตุ</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMultiline]}
            value={note}
            onChangeText={setNote}
            placeholder="เช่น อาหารเม็ด Prescription"
            placeholderTextColor="#9A9AA0"
            multiline
          />
        </View>

        {/* Save button */}
        <View style={styles.submitWrap}>
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
      </Animated.ScrollView>
    </View>
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
    fontSize: 14,
    color: '#1A1A1A',
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
    gap: 10,
    justifyContent: 'center',
  },
  typeCardTitle: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  typeChipText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  typeCardImageWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
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
  fieldLabel: {
    fontSize: 10,
    color: '#9A9AA0',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#F2F2F3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  fieldInputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },

  // Days picker (7 circles)
  daysRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  dayCircle: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: semantic.primary,
  },
  dayText: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Time picker (4 cols × 2 rows)
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  timePill: {
    flexBasis: '23%',
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillActive: {
    backgroundColor: semantic.primary,
  },
  timeText: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Save button
  submitWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
