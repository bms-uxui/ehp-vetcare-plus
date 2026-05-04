import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, CalendarSheet, Card, ConfirmModal, Icon, Input, StepProgress, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { colors, semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { typeMeta, AppointmentType, MOCK_VETS } from '../data/appointments';
import { mockVets } from '../data/televet';
import { bookingSubmitted } from '../data/bookingState';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointment'>;

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const TH_WEEKDAY_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function formatVetSchedule(workingDays: number[], timeSlots: string[]): string {
  if (!workingDays.length || !timeSlots.length) return '';
  const sorted = [...workingDays].sort((a, b) => a - b);
  let dayLabel = '';
  if (sorted.length === 7) {
    dayLabel = 'ทุกวัน';
  } else {
    const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
    if (contiguous && sorted.length >= 3) {
      dayLabel = `${TH_WEEKDAY_SHORT[sorted[0]]}-${TH_WEEKDAY_SHORT[sorted[sorted.length - 1]]}`;
    } else {
      dayLabel = sorted.map((d) => TH_WEEKDAY_SHORT[d]).join(' ');
    }
  }
  const sortedSlots = [...timeSlots].sort();
  return `${dayLabel} ${sortedSlots[0]} - ${sortedSlots[sortedSlots.length - 1]} น.`;
}

export default function BookAppointmentScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const incomingVetId = route.params?.selectedVetId;
  const prefill = route.params;
  const [petId, setPetId] = useState<string | null>(prefill?.prefillPetId ?? null);
  const [mode, setMode] = useState<'online' | 'clinic' | null>(
    prefill?.prefillMode ?? null,
  );
  const [date, setDate] = useState<Date | null>(
    prefill?.prefillDateISO ? new Date(prefill.prefillDateISO) : null,
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [time, setTime] = useState<string | null>(prefill?.prefillTime ?? null);
  const [vetId, setVetId] = useState<string | null>(incomingVetId ?? null);
  const [notes, setNotes] = useState(prefill?.prefillNotes ?? '');

  const [noVetModalOpen, setNoVetModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const pendingLeaveActionRef = useRef<unknown>(null);

  const isDirty =
    petId !== null ||
    mode !== null ||
    date !== null ||
    time !== null ||
    vetId !== null ||
    notes.trim() !== '';

  // If user picks a vet on VetDetail and returns, sync the selection
  useEffect(() => {
    if (incomingVetId && incomingVetId !== vetId) {
      setVetId(incomingVetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingVetId]);

  // Vets available on selected date (filtered by workingDays)
  const availableVets = useMemo(() => {
    if (!date) return mockVets;
    const dow = date.getDay();
    return mockVets.filter((v) => v.workingDays.includes(dow));
  }, [date]);

  // Time slots available — union of selected-date vets' slots
  const availableSlots = useMemo(() => {
    const set = new Set<string>();
    availableVets.forEach((v) => v.timeSlots.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [availableVets]);

  // Vets that match selected date AND time
  const matchingVets = useMemo(() => {
    if (!time) return availableVets;
    return availableVets.filter((v) => v.timeSlots.includes(time));
  }, [availableVets, time]);

  // Clear stale selections when date/time changes
  useEffect(() => {
    if (time && !availableSlots.includes(time)) setTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  useEffect(() => {
    if (vetId && !matchingVets.some((v) => v.id === vetId)) setVetId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  const dateLabel = date
    ? `${TH_WEEKDAY_SHORT[date.getDay()]} ${date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`
    : 'แตะเพื่อเลือกวัน';

  const canSubmit = useMemo(
    () => !!(petId && mode && date && time),
    [petId, mode, date, time],
  );

  const selectedVet = useMemo(
    () => mockVets.find((v) => v.id === vetId) ?? null,
    [vetId],
  );

  const onSubmit = () => {
    if (!canSubmit || !petId || !mode || !date || !time) return;
    let chosenVetId = vetId;
    if (!chosenVetId) {
      if (matchingVets.length === 0) {
        setNoVetModalOpen(true);
        return;
      }
      const random = matchingVets[Math.floor(Math.random() * matchingVets.length)];
      chosenVetId = random.id;
    }
    navigation.navigate('BookAppointmentSummary', {
      petId,
      mode,
      dateISO: date.toISOString(),
      time,
      vetId: chosenVetId,
      notes: notes.trim() || undefined,
    });
  };

  // Confirm before leaving if user has made any selection (intercepts back btn / gesture).
  // Skip when the user has just confirmed the booking on the Summary screen
  // (bookingSubmitted flag set there).
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (bookingSubmitted.current) {
        bookingSubmitted.current = false;
        return;
      }
      if (!isDirty) return;
      e.preventDefault();
      pendingLeaveActionRef.current = e.data.action;
      setLeaveModalOpen(true);
    });
    return unsub;
  }, [navigation, isDirty]);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader
        title="จองนัดหมาย"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + HEADER_HEIGHT },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.stepWrap}>
            <StepProgress
              currentStep={0}
              steps={[
                { icon: 'CalendarPlus' },
                { icon: 'ClipboardCheck' },
                { icon: 'CircleCheck' },
              ]}
            />
          </View>
          {/* Pet */}
          <Section label="สัตว์เลี้ยง">
            <View style={styles.petsRow}>
              {mockPets.map((p) => {
                const selected = petId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPetId(p.id)}
                    style={({ pressed }) => [styles.petItem, pressed && { opacity: 0.85 }]}
                  >
                    <View style={styles.petAvatarWrap}>
                      <View style={[styles.petAvatar, selected && styles.petAvatarSelected]}>
                        {p.photo ? (
                          <Image source={p.photo} style={styles.petAvatarImage} />
                        ) : (
                          <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
                        )}
                      </View>
                      {selected && (
                        <View style={styles.petCheckBadge}>
                          <Icon name="Check" size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text
                      variant="caption"
                      color={semantic.textPrimary}
                      weight="500"
                      align="center"
                    >
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Mode — Online vs Clinic */}
          <Section label="ประเภทการนัด">
            <View style={styles.chipGrid}>
              <Pressable
                onPress={() => setMode('clinic')}
                style={({ pressed }) => [
                  styles.modeTile,
                  mode === 'clinic' && styles.modeTileClinicSelected,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.typeInner}>
                  <View
                    style={[
                      styles.typeIconWrap,
                      { backgroundColor: 'rgba(159,82,102,0.15)' },
                    ]}
                  >
                    <Icon name="Hospital" size={22} color="#9F5266" strokeWidth={2.2} />
                  </View>
                  <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                    ที่คลินิก
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setMode('online')}
                style={({ pressed }) => [
                  styles.modeTile,
                  mode === 'online' && styles.modeTileOnlineSelected,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.typeInner}>
                  <View
                    style={[
                      styles.typeIconWrap,
                      { backgroundColor: 'rgba(27,90,119,0.15)' },
                    ]}
                  >
                    <Icon name="Video" size={22} color="#1B5A77" strokeWidth={2.2} />
                  </View>
                  <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                    ปรึกษาออนไลน์
                  </Text>
                </View>
              </Pressable>
            </View>
          </Section>

          {/* Date */}
          <Section label="วันที่">
            <Pressable
              onPress={() => setDatePickerOpen(true)}
              style={({ pressed }) => [
                styles.dateBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Icon name="CalendarDays" size={18} color={semantic.textPrimary} strokeWidth={2} />
              <Text
                variant="bodyStrong"
                style={[styles.dateBtnText, !date && { color: semantic.textMuted }]}
                numberOfLines={1}
              >
                {dateLabel}
              </Text>
            </Pressable>
          </Section>

          {/* Time */}
          <Section label="เวลา">
            {!date ? (
              <Text variant="caption" color={semantic.textSecondary} style={styles.helperText}>
                เลือกวันก่อนเพื่อดูเวลาที่ว่าง
              </Text>
            ) : availableSlots.length === 0 ? (
              <Text variant="caption" color={semantic.textSecondary} style={styles.helperText}>
                ไม่มีเวลาว่างในวันที่เลือก
              </Text>
            ) : null}
            <View style={[styles.timeGrid, !date && styles.timeGridLocked]}>
              {(date ? availableSlots : TIME_SLOTS).map((t) => (
                <Card
                  key={t}
                  variant="elevated"
                  selected={!!date && time === t}
                  padding="sm"
                  onPress={
                    date ? () => setTime(time === t ? null : t) : undefined
                  }
                  style={StyleSheet.flatten([styles.timeTile, styles.cardTightShadow])}
                >
                  <View style={styles.timeInner}>
                    <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                      {t}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </Section>

          {/* Vet */}
          <Section label="สัตวแพทย์ที่ต้องการพบ">
            {!date ? (
              <Text variant="caption" color={semantic.textSecondary} style={styles.helperText}>
                ถ้าไม่มีแพทย์ประจำ ระบบจะจัดแพทย์ที่ว่างให้
              </Text>
            ) : matchingVets.length === 0 ? (
              <Text variant="caption" color={semantic.textSecondary} style={styles.helperText}>
                ไม่มีแพทย์ว่างในช่วงเวลานี้ ลองเปลี่ยนวันหรือเวลา
              </Text>
            ) : null}
            <View style={styles.vetList}>
              {matchingVets.map((v) => {
                const isSelected = vetId === v.id;
                const isOnline = v.status === 'online';
                return (
                  <Card
                    key={v.id}
                    variant="elevated"
                    selected={isSelected}
                    padding="md"
                    onPress={() => setVetId(isSelected ? null : v.id)}
                    style={styles.cardTightShadow}
                  >
                    <Pressable
                      onPress={() => navigation.navigate('VetDetail', { vetId: v.id })}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="ดูข้อมูลและรีวิว"
                      style={({ pressed }) => [
                        styles.vetInfoBtn,
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <Icon
                        name="Info"
                        size={18}
                        color={semantic.textMuted}
                        strokeWidth={2}
                      />
                    </Pressable>
                    <View style={styles.vetTopRow}>
                      <View style={styles.vetAvatar}>
                        <Image source={{ uri: v.avatar }} style={styles.vetAvatarImg} />
                        {isOnline && <View style={styles.statusDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
                          {v.name}
                        </Text>
                        <View style={styles.vetChipRow}>
                          <VetChip icon="Stethoscope" label={v.specialty} />
                          <VetChip icon="Briefcase" label={`${v.experienceYears} ปี`} />
                        </View>
                        <View style={styles.vetChipRow}>
                          <VetChip icon="MapPin" label={v.clinic} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.vetDivider} />
                    <View style={styles.vetBottomRow}>
                      <View style={styles.vetBottomInfoLine}>
                        <Icon name="Clock" size={11} color={semantic.textMuted} strokeWidth={2} />
                        <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                          {formatVetSchedule(v.workingDays, v.timeSlots)}
                        </Text>
                      </View>
                      <View style={styles.vetBottomInfoLine}>
                        <Icon name="Star" size={10} color="#D99A20" fill="#D99A20" />
                        <Text variant="caption" color={semantic.textMuted}>
                          {v.rating} ({v.reviewCount})
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </Section>

          {/* Notes */}
          <Section label="หมายเหตุ (ถ้ามี)">
            <Input
              placeholder="เช่น อาการเบื้องต้น"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </Section>

          <View style={styles.submit}>
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                !canSubmit && styles.submitBtnDisabled,
                pressed && canSubmit && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="ยืนยันการจอง"
            >
              <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.submitBtnText}>
                ยืนยันการจอง
              </Text>
            </Pressable>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <CalendarSheet
        visible={datePickerOpen}
        value={date}
        onChange={setDate}
        onClose={() => setDatePickerOpen(false)}
        minDate={new Date()}
      />

      <ConfirmModal
        visible={leaveModalOpen}
        icon="LogOut"
        tone="warning"
        title="ออกจากการจองนัด?"
        message="ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก"
        cancelLabel="ทำต่อ"
        confirmLabel="ออก"
        confirmTone="danger"
        onCancel={() => {
          pendingLeaveActionRef.current = null;
          setLeaveModalOpen(false);
        }}
        onConfirm={() => {
          const action = pendingLeaveActionRef.current;
          pendingLeaveActionRef.current = null;
          setLeaveModalOpen(false);
          if (action) navigation.dispatch(action as never);
        }}
      />

      <ConfirmModal
        visible={noVetModalOpen}
        singleAction
        icon="CalendarOff"
        tone="info"
        title="ไม่มีแพทย์ว่าง"
        message="ไม่มีแพทย์ที่ว่างในวันและเวลาที่เลือก ลองเปลี่ยนวันหรือเวลาดูครับ"
        confirmLabel="ตกลง"
        onConfirm={() => setNoVetModalOpen(false)}
        onCancel={() => setNoVetModalOpen(false)}
      />
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" color={semantic.textSecondary} style={styles.sectionLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function VetChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.vetChipItem}>
      <Icon name={icon as any} size={11} color={semantic.textMuted} strokeWidth={2} />
      <Text
        variant="caption"
        color={semantic.textSecondary}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.vetChipText}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  stepWrap: {
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    marginLeft: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  petsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  petItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 64,
  },
  petAvatarWrap: {
    position: 'relative',
  },
  petAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petAvatarSelected: {
    borderWidth: 2.5,
    borderColor: semantic.primary,
  },
  petAvatarImage: {
    width: '100%',
    height: '100%',
  },
  petCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  typeTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  modeTile: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeTileClinicSelected: {
    borderColor: colors.rose[500],
    backgroundColor: colors.rose[50],
  },
  modeTileOnlineSelected: {
    borderColor: colors.ocean[600],
    backgroundColor: colors.ocean[50],
  },
  typeInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeGridLocked: {
    opacity: 0.45,
  },
  timeTile: {
    width: 80,
  },
  timeInner: {
    alignItems: 'center',
  },
  vetList: {
    gap: spacing.sm,
  },
  helperText: {
    fontSize: 12,
    marginLeft: spacing.xs,
    marginTop: -spacing.xs,
    marginBottom: 0,
  },
  cardTightShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  dateBtnText: {
    flex: 1,
    fontSize: 14,
    color: semantic.textPrimary,
  },
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
  vetTopRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  vetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#4FB36C',
  },
  vetChipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    overflow: 'hidden',
  },
  vetChipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  vetChipText: {
    fontSize: 10,
    flexShrink: 1,
  },
  vetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: spacing.sm,
  },
  vetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  vetBottomInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vetInfoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  submit: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  submitBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: semantic.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 16,
  },
});
