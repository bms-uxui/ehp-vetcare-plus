import { ReactNode, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Button,
  Icon,
  Input,
  PetAvatar,
  SubPageHeader,
  Text,
} from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { radii, semantic, spacing } from '../theme';
import { categoryMeta, ExpenseCategory } from '../data/expenses';
import { useExpenses } from '../data/expensesContext';
import { mockPets } from '../data/pets';
import { notifyNow } from '../lib/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const CATEGORY_ILLUSTRATIONS: Record<ExpenseCategory, number> = {
  food: require('../../assets/illustrations/cat-food.png'),
  treatment: require('../../assets/illustrations/cat-treatment.png'),
  grooming: require('../../assets/illustrations/cat-grooming.png'),
  supplies: require('../../assets/illustrations/cat-supplies.png'),
  other: require('../../assets/illustrations/cat-another.png'),
};

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const fmtThaiDate = (d: Date) =>
  `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;

export default function AddExpenseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { addExpense } = useExpenses();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [date, setDate] = useState<Date>(() => new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const togglePet = (id: string) => {
    setSelectedPetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDate(selected);
    // Android picker auto-closes; iOS picker stays open until Done
    if (Platform.OS === 'android') setDatePickerOpen(false);
  };
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const canSubmit = !!(
    title.trim() &&
    amount.trim() &&
    Number(amount) > 0
  );

  const onSubmit = () => {
    if (!canSubmit) return;
    const dateISO = date.toISOString().slice(0, 10);
    const trimmedNote = note.trim();
    const selectedPets = mockPets.filter((p) => selectedPetIds.has(p.id));
    const totalAmount = Number(amount);

    // Create a single expense entry — multiple pets share the same record
    // and render as a stacked avatar badge. Single pet still sets `petId`
    // for backward compat with existing mock data.
    if (selectedPets.length === 0) {
      addExpense({
        category,
        title: title.trim(),
        amount: totalAmount,
        dateISO,
        note: trimmedNote || undefined,
      });
    } else if (selectedPets.length === 1) {
      const p = selectedPets[0];
      addExpense({
        category,
        title: title.trim(),
        amount: totalAmount,
        dateISO,
        petId: p.id,
        petName: p.name,
        petEmoji: p.emoji,
        note: trimmedNote || undefined,
      });
    } else {
      const first = selectedPets[0];
      addExpense({
        category,
        title: title.trim(),
        amount: totalAmount,
        dateISO,
        petId: first.id,
        petName: first.name,
        petEmoji: first.emoji,
        petIds: selectedPets.map((p) => p.id),
        note: trimmedNote || undefined,
      });
    }

    notifyNow({
      title: 'บันทึกค่าใช้จ่ายเรียบร้อย',
      body: `${title.trim()} · ฿${totalAmount.toLocaleString('th-TH')}`,
    });
    navigation.goBack();
  };

  const categories = Object.keys(categoryMeta) as ExpenseCategory[];

  return (
    <View style={styles.root}>
      <AppBackground />

      <SubPageHeader
        title="บันทึกค่าใช้จ่าย"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + HEADER_HEIGHT,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >

        {/* Category card — Figma 529:1118 — chips inside a soft card with
            pet illustration in the bottom-right corner. Card uses a soft
            diagonal gradient that follows the selected category's tint. */}
        <View style={styles.categoryCardWrap}>
          <View style={styles.categoryCard}>
            <LinearGradient
              colors={[
                categoryMeta[category].bg,
                categoryMeta[category].color + '33',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.categoryCardImageWrap}>
              <Image
                source={CATEGORY_ILLUSTRATIONS[category]}
                style={styles.categoryCardImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.categoryCardContent}>
              <Text weight="500" style={styles.categoryCardTitle}>
                หมวดหมู่
              </Text>
              {/* Force layout: top 2 chips, bottom 3 chips */}
              {[categories.slice(0, 2), categories.slice(2)].map(
                (rowChips, rowIdx) => (
                  <View key={rowIdx} style={styles.chipsRow}>
                    {rowChips.map((c) => {
                      const meta = categoryMeta[c];
                      const selected = category === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setCategory(c)}
                          style={({ pressed }) => [
                            styles.catChip,
                            selected && styles.catChipSelected,
                            selected && {
                              backgroundColor: meta.color,
                              shadowColor: meta.color,
                            },
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <Icon
                            name={meta.icon as any}
                            size={14}
                            color={selected ? '#FFFFFF' : meta.color}
                            strokeWidth={2.4}
                          />
                          <Text
                            weight={selected ? '600' : '500'}
                            style={[
                              styles.catChipText,
                              selected && styles.catChipTextSelected,
                            ]}
                          >
                            {meta.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ),
              )}
            </View>
          </View>
        </View>

        {/* Form fields — title, amount, date */}
        <View style={styles.formSection}>
          <Input
            label="รายการ"
            value={title}
            onChangeText={setTitle}
            placeholder="เช่น Prescription Diet 7kg"
          />
          <Input
            label="จำนวนเงิน (บาท)"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="decimal-pad"
          />
          {/* Date picker — tap to open native iOS calendar */}
          <View style={styles.field}>
            <Text
              variant="caption"
              color={semantic.textSecondary}
              style={styles.dateLabel}
            >
              วันที่
            </Text>
            <Pressable
              onPress={() => setDatePickerOpen(true)}
              style={({ pressed }) => [
                styles.dateField,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text weight="500" style={styles.dateValue}>
                {fmtThaiDate(date)}
              </Text>
              <Icon
                name="Calendar"
                size={18}
                color={semantic.textSecondary}
                strokeWidth={2.2}
              />
            </Pressable>
          </View>
        </View>

        {/* Pet grid — 3 cols, multi-select */}
        <Section title="สัตว์เลี้ยง">
          <View style={styles.tileGrid}>
            {mockPets.map((p) => {
              const selected = selectedPetIds.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => togglePet(p.id)}
                  style={({ pressed }) => [
                    styles.petCard,
                    selected && styles.petCardSelected,
                    pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  {selected && (
                    <LinearGradient
                      pointerEvents="none"
                      colors={['#FFE9EC', '#FBF3F4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  {selected && (
                    <View style={styles.petCheckBadge} pointerEvents="none">
                      <Icon
                        name="Check"
                        size={12}
                        color="#FFFFFF"
                        strokeWidth={3}
                      />
                    </View>
                  )}
                  <View
                    style={[
                      styles.petAvatarRing,
                      selected && styles.petAvatarRingSelected,
                    ]}
                  >
                    <PetAvatar
                      pet={p}
                      size={64}
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                  <View style={styles.petCardTextWrap}>
                    <Text
                      weight={selected ? '700' : '600'}
                      style={[
                        styles.petCardName,
                        selected && { color: semantic.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={[
                        styles.petCardSpecies,
                        selected && { color: semantic.primary, opacity: 0.7 },
                      ]}
                      numberOfLines={1}
                    >
                      {p.speciesLabel}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Note — multiline */}
        <View style={styles.formSection}>
          <Input
            label="หมายเหตุ"
            value={note}
            onChangeText={setNote}
            placeholder="รายละเอียดเพิ่มเติม"
            multiline
          />
        </View>
      </Animated.ScrollView>

      {/* Save button — pinned at bottom, primary gradient with bevel */}
      <View
        style={[
          styles.saveBar,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Button
          label="บันทึก"
          onPress={onSubmit}
          disabled={!canSubmit}
          uppercase={false}
          fullWidth
        />
      </View>

      {/* Date picker modal — bottom sheet with native inline calendar */}
      {datePickerOpen && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setDatePickerOpen(false)}
          statusBarTranslucent
        >
          <Pressable
            style={styles.dateBackdrop}
            onPress={() => setDatePickerOpen(false)}
          >
            <Pressable
              style={[
                styles.dateSheet,
                { paddingBottom: insets.bottom + 16 },
              ]}
              onPress={() => {}}
            >
              <View style={styles.dateSheetHandle} />
              <View style={styles.dateSheetHeader}>
                <Text weight="500" style={styles.dateSheetTitle}>
                  เลือกวันที่
                </Text>
                <Pressable
                  onPress={() => setDatePickerOpen(false)}
                  hitSlop={8}
                >
                  <Text weight="600" style={styles.dateSheetDone}>
                    เสร็จ
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                locale="th-TH"
                themeVariant="light"
                maximumDate={new Date()}
                style={styles.dateSheetPicker}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

/* ---------- Sub-components ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text weight="500" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semantic.background,
  },
  flex: { flex: 1 },
  scroll: {
    paddingBottom: 0,
  },

  hero: {
    paddingHorizontal: 16,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 41,
    color: '#1A1A1A',
    letterSpacing: -0.4,
  },
  heroDescription: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  section: {
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Category chip row — horizontal scroll
  // Category card — gray rounded container with chips + pet illustration
  categoryCardWrap: {
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
  },
  categoryCard: {
    backgroundColor: '#F2F2F3',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    // Drop shadow tinted lightly so the gradient feels lifted
    shadowColor: '#5E303C',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  categoryCardContent: {
    padding: 16,
    gap: 10,
    // No paddingRight — chips can extend full width; the illustration
    // sits at the bottom-right corner and may be visually overlapped at
    // the start of row 2 (matches the Figma reference behaviour).
  },
  categoryCardTitle: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  categoryCardImageWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 150,
    height: 150,
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
    // Soft drop shadow gives chips presence on the colored card
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  catChipSelected: {
    // backgroundColor + shadowColor overridden inline per category
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 0,
  },
  catChipText: {
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: -0.1,
  },
  catChipTextSelected: {
    color: '#FFFFFF',
  },

  // Pet grid — 3 cols of card-style tiles
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    rowGap: 10,
  },
  petCard: {
    width: '31.5%',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E9',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#5E303C',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  petCardSelected: {
    borderColor: semantic.primary,
    borderWidth: 1.5,
    shadowColor: semantic.primary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  petAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5E303C',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  petAvatarRingSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: semantic.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  petCheckBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
    shadowColor: semantic.primary,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  petCardTextWrap: {
    alignItems: 'center',
    gap: 2,
  },
  petCardName: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  petCardSpecies: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9A9AA0',
    textAlign: 'center',
  },

  // Form fields
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    gap: 16,
  },
  field: {
    alignSelf: 'stretch',
  },
  dateLabel: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: semantic.surface,
    borderWidth: 1.5,
    borderColor: semantic.border,
    borderRadius: radii.lg,
  },
  dateValue: {
    fontSize: 16,
    color: '#1A1A1A',
  },

  // Date picker bottom sheet
  dateBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dateSheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#D0D0D4',
    marginTop: 4,
    marginBottom: 12,
  },
  dateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  dateSheetTitle: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  dateSheetDone: {
    fontSize: 16,
    color: semantic.primary,
  },
  dateSheetPicker: {
    minHeight: 380,
    width: '100%',
  },

  // Save button bar — soft hairline + safe area pad
  saveBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: semantic.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0E6E8',
  },
});
