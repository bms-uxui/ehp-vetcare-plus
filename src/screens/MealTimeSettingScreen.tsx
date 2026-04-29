import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Text } from '../components';
import { semantic } from '../theme';
import { mockPets } from '../data/pets';
import { FeedingSchedule, mockSchedules } from '../data/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'MealTimeSetting'>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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
    time: TIME_RE.test(draft.time) ? undefined : 'รูปแบบเวลาไม่ถูกต้อง (HH:MM)',
  };
  const hasErrors = !!errs.time;

  const save = () => {
    if (hasErrors) return;
    if (isNew) {
      mockSchedules.push(draft);
    } else {
      const idx = mockSchedules.findIndex((s) => s.id === draft.id);
      if (idx >= 0) mockSchedules[idx] = draft;
    }
    navigation.popTo('PetDetail', {
      petId,
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
          {isNew ? 'เพิ่มตารางให้อาหาร' : 'ตั้งเวลาให้อาหาร'}
        </Text>
        <Pressable
          onPress={save}
          disabled={hasErrors}
          hitSlop={8}
          style={({ pressed }) => [
            styles.appbarBtn,
            hasErrors && { opacity: 0.4 },
            pressed && !hasErrors && { opacity: 0.6 },
          ]}
        >
          <Text variant="bodyStrong" style={styles.appbarSave}>
            บันทึก
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldWrap}>
          <Text variant="caption" style={styles.fieldLabel}>
            ประเภท
          </Text>
          <View style={styles.typeTileRow}>
            {(
              [
                { key: 'food', label: 'อาหาร', icon: 'UtensilsCrossed' },
                { key: 'water', label: 'น้ำดื่ม', icon: 'Droplet' },
              ] as const
            ).map((opt) => {
              const active = draft.type === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => update('type', opt.key)}
                  style={[styles.typeTile, active && styles.typeTileActive]}
                >
                  <Icon
                    name={opt.icon}
                    size={22}
                    color={active ? '#FFFFFF' : '#9F5266'}
                    strokeWidth={2.2}
                  />
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.typeTileText,
                      active && styles.typeTileTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <TimeField
              label="เวลา"
              value={draft.time}
              onChange={(v) => update('time', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <EditField
              label="ปริมาณ (กรัม)"
              placeholder="เช่น 80"
              keyboardType="decimal-pad"
              value={draft.amount}
              onChange={(v) => update('amount', v)}
            />
          </View>
        </View>

        <EditField
          label="หมายเหตุ"
          placeholder="ไม่มี"
          value={draft.note ?? ''}
          onChange={(v) => update('note', v)}
        />

        <Pressable
          onPress={() => update('enabled', !draft.enabled)}
          style={({ pressed }) => [
            styles.statusCard,
            pressed && { opacity: 0.92 },
          ]}
        >
          <View style={styles.statusTextWrap}>
            <Text variant="bodyStrong" style={styles.statusTitle}>
              เปิดแจ้งเตือน
            </Text>
            <Text variant="caption" style={styles.statusSubtitle}>
              {draft.enabled
                ? 'แจ้งเตือนตามเวลาที่ตั้งไว้'
                : 'ปิดการแจ้งเตือนสำหรับมื้อนี้'}
            </Text>
          </View>
          <Switch
            value={draft.enabled}
            onValueChange={(v) => update('enabled', v)}
            trackColor={{ false: '#E6E6E8', true: '#9F5266' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E6E6E8"
            style={styles.statusSwitch}
          />
        </Pressable>

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
      </ScrollView>
    </View>
  );
}

function EditField({
  label,
  value,
  onChange,
  keyboardType,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  placeholder?: string;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const showError = !!error && !focused;
  const accent = showError ? '#C25450' : semantic.primary;
  return (
    <View style={styles.fieldWrap}>
      <Text
        variant="caption"
        style={[
          styles.fieldLabel,
          (focused || showError) && { color: accent },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.fieldUnderline,
          (focused || showError) && {
            borderBottomColor: accent,
            borderBottomWidth: 1.5,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? 'default'}
          placeholder={placeholder}
          placeholderTextColor="#9A9AA0"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
        />
      </View>
      {showError && (
        <Text variant="caption" style={styles.fieldError}>
          {error}
        </Text>
      )}
    </View>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date>(parseTime(value));
  useEffect(() => setPending(parseTime(value)), [value]);
  const onPickerChange = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setPending(picked);
  };
  const confirm = () => {
    onChange(formatTime(pending));
    setOpen(false);
  };
  return (
    <View style={styles.fieldWrap}>
      <Text variant="caption" style={styles.fieldLabel}>
        {label}
      </Text>
      <Pressable onPress={() => setOpen(true)} style={styles.fieldUnderline}>
        <View style={styles.timeRow}>
          <Icon name="Clock" size={16} color="#6E6E74" strokeWidth={2.2} />
          <Text variant="bodyStrong" style={styles.timeValueText}>
            {value}
          </Text>
        </View>
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
              {label}
            </Text>
            <DateTimePicker
              value={pending}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              is24Hour
              onChange={onPickerChange}
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
    </View>
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
  appbarSave: {
    fontSize: 15,
    color: '#9F5266',
    fontWeight: '700',
  },
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  fieldWrap: { gap: 4, paddingTop: 6 },
  fieldRow: { flexDirection: 'row', gap: 16 },
  fieldCol: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#6E6E74', fontWeight: '500' },
  fieldUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
  },
  fieldInput: {
    height: 40,
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  fieldError: { fontSize: 11, color: '#C25450', marginTop: 4 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
  },
  timeValueText: { fontSize: 17, color: '#1A1A1F', fontWeight: '500' },
  typeTileRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeTile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  typeTileActive: { backgroundColor: '#9F5266', borderColor: '#9F5266' },
  typeTileText: { fontSize: 13, color: '#9F5266', fontWeight: '700' },
  typeTileTextActive: { color: '#FFFFFF' },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statusTextWrap: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#6E6E74',
  },
  statusSwitch: {
    alignSelf: 'center',
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5E4E7',
  },
  toggleChipActive: { backgroundColor: '#9F5266' },
  toggleChipText: { fontSize: 13, color: '#9F5266', fontWeight: '700' },
  toggleChipTextActive: { color: '#FFFFFF' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteText: { fontSize: 14, color: '#C25450', fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FBF3F4',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0E6E8',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#9F5266',
  },
  btnSecondaryText: { fontSize: 16, color: '#9F5266' },
  btnPrimary: { backgroundColor: '#9F5266' },
  btnPrimaryText: { fontSize: 16, color: '#FFFFFF' },
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
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  snackbarText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
