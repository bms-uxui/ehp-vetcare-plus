import { ReactNode, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
  PetAvatar,
  SubPageHeader,
  Text,
} from '../components';
import { semantic, spacing } from '../theme';
import { categoryMeta, ExpenseCategory } from '../data/expenses';
import { mockPets } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const fmtThaiDate = (d: Date) =>
  `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;

export default function AddExpenseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
    navigation.goBack();
  };

  const categories = Object.keys(categoryMeta) as ExpenseCategory[];

  return (
    <View style={styles.root}>
      <AppBackground />

      <SubPageHeader
        title="บันทึกค่าใช้จ่าย"
        onBack={() => navigation.goBack()}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >

        {/* Category — wrap chips into 2 rows (no horizontal scroll) */}
        <View style={styles.chipsSection}>
          <Text weight="500" style={[styles.sectionTitle, styles.chipsTitle]}>
            หมวดหมู่
          </Text>
          <View style={styles.chipsWrap}>
            {categories.map((c) => {
              const meta = categoryMeta[c];
              const selected = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={({ pressed }) => [
                    styles.catChip,
                    selected && styles.catChipSelected,
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
        </View>

        {/* Form fields — title, amount, date */}
        <View style={styles.formSection}>
          <Field
            label="รายการ"
            value={title}
            onChangeText={setTitle}
            placeholder="เช่น Prescription Diet 7kg"
          />
          <Field
            label="จำนวนเงิน (บาท)"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="decimal-pad"
          />
          {/* Date picker — tap to open native iOS calendar */}
          <View style={styles.field}>
            <Text weight="400" style={styles.fieldLabel}>
              วันที่
            </Text>
            <Pressable
              onPress={() => setDatePickerOpen(true)}
              style={({ pressed }) => [
                styles.fieldInput,
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
                    styles.tile,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.petRing,
                      selected && styles.petRingSelected,
                    ]}
                  >
                    <PetAvatar
                      pet={p}
                      size={60}
                      backgroundColor={semantic.primaryMuted}
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
                      styles.tileLabel,
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
        </Section>

        {/* Note — multiline */}
        <View style={styles.formSection}>
          <Field
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text weight="400" style={styles.fieldLabel}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9AA0"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
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
  chipsSection: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 10,
  },
  chipsTitle: {
    paddingHorizontal: 16,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 6,
    rowGap: 10,
    columnGap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
  },
  catChipSelected: {
    backgroundColor: semantic.primary,
    shadowColor: semantic.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  catChipText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  catChipTextSelected: {
    color: '#FFFFFF',
  },

  // Tile grid (categories + pets) — 3 cols, 64px circle items
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    rowGap: 16,
  },
  tile: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    shadowColor: '#5E303C',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  // Pet avatar — 60px photo inside a 68px ring (gives a 4px halo of breathing
  // room). Unselected ring is a soft hairline; selected fills with primary.
  petRing: {
    width: 68,
    height: 68,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBE3E5',
    position: 'relative',
  },
  petRingSelected: {
    borderWidth: 2,
    borderColor: semantic.primary,
    backgroundColor: semantic.primaryMuted,
    shadowColor: semantic.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
  tileLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Form fields
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#6E6E74',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  fieldInput: {
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F2F2F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
