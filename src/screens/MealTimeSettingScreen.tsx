import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, FeedingTypeCard, Icon, Text, TextField } from '../components';
import { mockPets } from '../data/pets';
import { FeedingSchedule, mockSchedules } from '../data/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'MealTimeSetting'>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const PRESET_TIMES = ['06:00', '07:00', '08:00', '12:00', '15:00', '18:00'];

const DAY_LABELS = ['จ', 'อ', 'พ', 'พฤ.', 'ศ', 'ส', 'อา.'];
// daysOfWeek uses 0=Sun..6=Sat; UI presents Mon..Sun.
const DAY_INDEXES = [1, 2, 3, 4, 5, 6, 0];

function parseTime(hhmm: string): Date {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  const d = new Date();
  d.setSeconds(0, 0);
  if (m) d.setHours(Number(m[1]), Number(m[2]));
  else d.setHours(8, 0);
  return d;
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function makeNewSchedule(petId: string): FeedingSchedule {
  const pet = mockPets.find((p) => p.id === petId);
  return {
    id: `s-${Date.now()}`,
    type: 'food',
    petId,
    petName: pet?.name ?? '',
    petEmoji: pet?.emoji ?? '🐾',
    time: '08:00',
    amount: '',
    note: '',
    enabled: true,
    daysOfWeek: [],
  };
}

export default function MealTimeSettingScreen({ route, navigation }: Props) {
  const { petId, scheduleId } = route.params;
  const insets = useSafeAreaInsets();
  const isNew = !scheduleId;

  const initial = useMemo(() => {
    if (scheduleId) {
      const found = mockSchedules.find((s) => s.id === scheduleId);
      if (found) return { ...found };
    }
    return makeNewSchedule(petId);
  }, [petId, scheduleId]);

  const [draft, setDraft] = useState<FeedingSchedule>(initial);
  const update = <K extends keyof FeedingSchedule>(
    key: K,
    value: FeedingSchedule[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const errs = {
    time: TIME_RE.test(draft.time) ? undefined : 'รูปแบบเวลาไม่ถูกต้อง',
  };
  const hasErrors = !!errs.time;

  const selectPet = (id: string) => {
    const pet = mockPets.find((p) => p.id === id);
    if (!pet) return;
    setDraft((d) => ({
      ...d,
      petId: pet.id,
      petName: pet.name,
      petEmoji: pet.emoji,
    }));
  };

  const toggleDay = (dayIdx: number) => {
    const cur = draft.daysOfWeek;
    // Empty = every day. First tap converts to "all selected then deselect tapped".
    const expanded = cur.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : cur;
    const next = expanded.includes(dayIdx)
      ? expanded.filter((d) => d !== dayIdx)
      : [...expanded, dayIdx].sort();
    // If user re-selects all 7, store as [] (every day) for cleaner persistence.
    update('daysOfWeek', next.length === 7 ? [] : next);
  };

  const isDayActive = (dayIdx: number) =>
    draft.daysOfWeek.length === 0 || draft.daysOfWeek.includes(dayIdx);

  const save = () => {
    if (hasErrors) return;
    if (isNew) {
      mockSchedules.push(draft);
    } else {
      const idx = mockSchedules.findIndex((s) => s.id === draft.id);
      if (idx >= 0) mockSchedules[idx] = draft;
    }
    navigation.popTo('PetDetail', {
      petId: draft.petId,
      flashMessage: 'บันทึกเรียบร้อยแล้ว',
    });
  };

  const remove = () => {
    if (isNew) return;
    const idx = mockSchedules.findIndex((s) => s.id === draft.id);
    if (idx >= 0) mockSchedules.splice(idx, 1);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.appbarBtn}
        >
          <Icon name="ChevronLeft" size={20} color="#1A1A1A" strokeWidth={2.4} />
        </Pressable>
        <Text variant="bodyStrong" style={styles.appbarTitle}>
          {isNew ? 'เพิ่มตาราง' : 'แก้ไขตาราง'}
        </Text>
        <Pressable
          onPress={save}
          disabled={hasErrors}
          hitSlop={8}
          style={({ pressed }) => [
            styles.appbarBtn,
            styles.appbarSaveBtn,
            hasErrors && { opacity: 0.4 },
            pressed && !hasErrors && { opacity: 0.6 },
          ]}
        >
          <Text
            variant="bodyStrong"
            style={styles.appbarSave}
            numberOfLines={1}
          >
            บันทึก
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FeedingTypeCard
          value={draft.type}
          onChange={(v) => update('type', v)}
        />

        {/* Pet selector */}
        <View style={styles.section}>
          <Text variant="bodyStrong" style={styles.sectionLabel}>
            สัตว์เลี้ยง
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petRow}
          >
            {mockPets.map((p) => {
              const active = p.id === draft.petId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectPet(p.id)}
                  style={({ pressed }) => [
                    styles.petItem,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.petAvatarRing,
                      active && styles.petAvatarRingActive,
                    ]}
                  >
                    {p.photo ? (
                      <Image source={p.photo} style={styles.petAvatarImg} />
                    ) : (
                      <View style={styles.petAvatarFallback}>
                        <Text style={{ fontSize: 32 }}>{p.emoji}</Text>
                      </View>
                    )}
                    {active && (
                      <View style={styles.petCheckBadge}>
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
                    variant="bodyStrong"
                    style={[styles.petName, active && styles.petNameActive]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <TextField
          label="ปริมาณ"
          placeholder="เช่น 80 กรัม"
          value={draft.amount}
          onChange={(v) => update('amount', v)}
        />

        {/* Days */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.fieldLabel}>
            วันที่
          </Text>
          <View style={styles.dayRow}>
            {DAY_LABELS.map((label, i) => {
              const dayIdx = DAY_INDEXES[i];
              const active = isDayActive(dayIdx);
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(dayIdx)}
                  style={({ pressed }) => [
                    styles.dayChip,
                    active ? styles.dayChipActive : styles.dayChipInactive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.dayChipText,
                      active
                        ? styles.dayChipTextActive
                        : styles.dayChipTextInactive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Time presets */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.fieldLabel}>
            เวลา
          </Text>
          <View style={styles.timeGrid}>
            {PRESET_TIMES.map((t) => {
              const active = draft.time === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => update('time', t)}
                  style={({ pressed }) => [
                    styles.timeChip,
                    active ? styles.timeChipActive : styles.timeChipInactive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.timeChipText,
                      active && styles.timeChipTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
            <CustomTimeChip
              value={draft.time}
              isPreset={PRESET_TIMES.includes(draft.time)}
              onPick={(v) => update('time', v)}
            />
          </View>
        </View>

        {!isNew && (
          <Pressable
            onPress={remove}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon name="Trash2" size={16} color="#C25450" strokeWidth={2.2} />
            <Text variant="bodyStrong" style={styles.deleteText}>
              ลบตารางนี้
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function CustomTimeChip({
  value,
  isPreset,
  onPick,
}: {
  value: string;
  isPreset: boolean;
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date>(parseTime(value));
  useEffect(() => setPending(parseTime(value)), [value]);
  const onChange = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setPending(picked);
  };
  const confirm = () => {
    onPick(formatTime(pending));
    setOpen(false);
  };
  const showCustomValue = !isPreset && !!value;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.timeChip,
          showCustomValue ? styles.timeChipActive : styles.timeChipInactive,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Icon
          name={showCustomValue ? 'Clock' : 'Plus'}
          size={14}
          color={showCustomValue ? '#FFFFFF' : '#6E6E74'}
          strokeWidth={2.4}
        />
        <Text
          variant="bodyStrong"
          style={[
            styles.timeChipText,
            showCustomValue && styles.timeChipTextActive,
            { marginLeft: 4 },
          ]}
        >
          {showCustomValue ? value : 'กำหนดเอง'}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.timeBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.timeCard} onPress={() => {}}>
            <Text variant="bodyStrong" style={styles.timeCardTitle}>
              เลือกเวลา
            </Text>
            <DateTimePicker
              value={pending}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              is24Hour
              onChange={onChange}
              themeVariant="light"
              style={styles.timeSpinner}
            />
            <Pressable onPress={confirm} style={styles.timeConfirm}>
              <Text variant="bodyStrong" style={styles.timeConfirmText}>
                ตกลง
              </Text>
            </Pressable>
          </Pressable>
          <Pressable
            style={[styles.timeCard, styles.timeCancelCard]}
            onPress={() => setOpen(false)}
          >
            <Text variant="bodyStrong" style={styles.timeCancelText}>
              ยกเลิก
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF3F4' },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  appbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appbarTitle: { fontSize: 16, color: '#1A1A1A', flex: 1, textAlign: 'center' },
  appbarSaveBtn: {
    width: 'auto',
    minWidth: 56,
    paddingHorizontal: 8,
  },
  appbarSave: {
    fontSize: 15,
    color: '#9F5266',
    fontWeight: '700',
  },
  body: { paddingHorizontal: 20, gap: 20 },

  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6E6E74',
    fontWeight: '500',
  },

  petRow: {
    gap: 16,
    paddingVertical: 4,
    paddingRight: 4,
  },
  petItem: {
    alignItems: 'center',
    width: 76,
    gap: 6,
    overflow: 'visible',
  },
  petAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EFE0E3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  petAvatarRingActive: {
    borderColor: '#B86A7C',
  },
  petAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  petAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#F5E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCheckBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B86A7C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FBF3F4',
  },
  petName: {
    fontSize: 13,
    color: '#6E6E74',
    fontWeight: '500',
    textAlign: 'center',
  },
  petNameActive: {
    color: '#9F5266',
    fontWeight: '700',
  },

  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#A4596B',
  },
  dayChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.18)',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  dayChipTextInactive: {
    color: '#9F5266',
  },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  timeChip: {
    width: '32%',
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  timeChipActive: {
    backgroundColor: '#9F5266',
  },
  timeChipInactive: {
    backgroundColor: '#EFE6DD',
  },
  timeChipText: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  deleteText: { fontSize: 14, color: '#C25450', fontWeight: '700' },

  timeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 10,
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingTop: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeCardTitle: { fontSize: 13, color: '#6E6E74', fontWeight: '500' },
  timeSpinner: { width: '100%', height: 200 },
  timeConfirm: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E8',
  },
  timeConfirmText: { fontSize: 17, color: '#1A75FF', fontWeight: '600' },
  timeCancelCard: { paddingVertical: 14 },
  timeCancelText: { fontSize: 17, color: '#1A75FF', fontWeight: '600' },
});
