import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, CalendarSheet, Card, ConfirmModal, Icon, Input, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { colors, semantic, shadows, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { typeMeta, AppointmentType, MOCK_VETS } from '../data/appointments';
import { mockVets, mockGroomers } from '../data/televet';
import { clinicOptionsForPets, unbookableClinicsForPets } from '../data/clinics';
import { getBoardingOptions } from '../data/boarding';
import { bookingSubmitted } from '../data/bookingState';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointment'>;

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const TH_WEEKDAY_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/** วันแรกนับจากวันนี้ที่ตรงกับเวรของแพทย์ — ใช้ preselect ให้ผู้ใช้ไม่ต้องไล่หาเอง */
function nextOnDutyDate(workingDays: number[]): Date | null {
  if (!workingDays.length) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    if (workingDays.includes(d.getDay())) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return null;
}

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
  // One booking can cover several pets — they get separate appointment cards.
  const [petIds, setPetIds] = useState<string[]>(
    prefill?.prefillPetId ? [prefill.prefillPetId] : [],
  );
  // Booking type — drives staff list (vets vs groomers) and derives mode.
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(
    prefill?.prefillMode === 'online' ? 'consultation' : null,
  );
  const mode: 'online' | 'clinic' | null =
    appointmentType === null
      ? null
      : appointmentType === 'consultation'
        ? 'online'
        : 'clinic';
  const isGrooming = appointmentType === 'grooming';
  const isBoarding = appointmentType === 'boarding';
  const isCheckup = appointmentType === 'checkup';
  const selectedPets = useMemo(
    () => mockPets.filter((p) => petIds.includes(p.id)),
    [petIds],
  );

  // ตรวจรักษาทั่วไป: ต้องเลือกคลินิกเสมอ แล้ววัน/เวลา/แพทย์ มาจากคลินิกนั้น.
  // ประวัติการรักษาแค่ดันคลินิกที่เคยไปขึ้นบน ไม่ได้ตัดคลินิกอื่นทิ้ง.
  const clinicOptions = useMemo(
    () => (isCheckup && selectedPets.length ? clinicOptionsForPets(selectedPets) : []),
    [isCheckup, selectedPets],
  );
  const unbookableClinics = useMemo(
    () => (isCheckup && selectedPets.length ? unbookableClinicsForPets(selectedPets) : []),
    [isCheckup, selectedPets],
  );
  const isClinicFlow = isCheckup && clinicOptions.length > 0;
  const [clinicId, setClinicId] = useState<string | null>(null);
  const clinic = useMemo(
    () => clinicOptions.find((o) => o.clinic.id === clinicId)?.clinic ?? null,
    [clinicOptions, clinicId],
  );
  // Changing the pet set reshuffles which clinics make sense — start over.
  useEffect(() => {
    setClinicId(null);
  }, [petIds, isCheckup]);

  // Boarding: EHP partners (live slots) + the most popular places near the user.
  const boardingOptions = useMemo(() => getBoardingOptions(), []);
  const staffPool = isBoarding
    ? [...boardingOptions.partners, ...boardingOptions.popularNearby]
    : isGrooming
      ? mockGroomers
      : isClinicFlow
        ? (clinic?.doctors ?? [])
        : mockVets;
  // Section label + helper copy adapt to the staff pool's "kind"
  const staffKind = isBoarding ? 'คลินิก' : isGrooming ? 'ช่าง' : 'แพทย์';
  const staffSectionLabel = isBoarding
    ? 'คลินิกที่รับฝากเลี้ยง'
    : isGrooming
      ? 'ช่างที่ต้องการ'
      : 'สัตวแพทย์ที่ต้องการพบ';
  const [date, setDate] = useState<Date | null>(
    prefill?.prefillDateISO ? new Date(prefill.prefillDateISO) : null,
  );
  // Boarding is a stay, not an appointment — it needs a check-out date too.
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [time, setTime] = useState<string | null>(prefill?.prefillTime ?? null);
  const [vetId, setVetId] = useState<string | null>(incomingVetId ?? null);
  const [notes, setNotes] = useState(prefill?.prefillNotes ?? '');

  const [noVetModalOpen, setNoVetModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const pendingLeaveActionRef = useRef<unknown>(null);

  const isDirty =
    petIds.length > 0 ||
    appointmentType !== null ||
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

  const selectedVet = useMemo(
    () => staffPool.find((v) => v.id === vetId) ?? null,
    [vetId, staffPool],
  );

  // EHP flow picks the vet first, so the vet's roster fixes which days are
  // selectable at all. Everywhere else the date comes first and filters vets.
  const dateLocked = isClinicFlow && !selectedVet;
  const enabledWeekdays = isClinicFlow ? selectedVet?.workingDays : undefined;

  // Staff (vets or groomers) available on selected date — filtered by workingDays
  const availableVets = useMemo(() => {
    if (!date) return staffPool;
    const dow = date.getDay();
    return staffPool.filter((v) => v.workingDays.includes(dow));
  }, [date, staffPool]);

  // Time slots available — the chosen vet's own slots in the EHP flow,
  // otherwise the union of every vet working that day.
  const availableSlots = useMemo(() => {
    if (isClinicFlow) return selectedVet ? [...selectedVet.timeSlots].sort() : [];
    const set = new Set<string>();
    availableVets.forEach((v) => v.timeSlots.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [availableVets, isClinicFlow, selectedVet]);

  // Vets that match selected date AND time
  const matchingVets = useMemo(() => {
    const base = !time || isBoarding
      ? availableVets
      : availableVets.filter((v) => v.timeSlots.includes(time));
    // Boarding keeps getBoardingOptions()' order: EHP partners (nearest first),
    // then the most popular nearby places. Re-sorting by distance would bury
    // the bookable partners under a closer non-partner.
    return base;
  }, [availableVets, time, isBoarding]);

  // Clear stale selections when date/time — or the scoped clinic — changes.
  // Skipped in the EHP flow: there the vet is chosen first and the effects
  // below keep date/time inside that vet's roster, so nothing goes stale.
  useEffect(() => {
    if (isClinicFlow) return;
    if (time && !availableSlots.includes(time)) setTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, clinic?.id]);
  useEffect(() => {
    if (isClinicFlow) return;
    if (vetId && !matchingVets.some((v) => v.id === vetId)) setVetId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time, clinic?.id]);

  // EHP flow: picking a vet snaps the date to their next on-duty day…
  // Deselecting one drops the date/time it produced.
  useEffect(() => {
    if (!isClinicFlow) return;
    if (!selectedVet) {
      setDate(null);
      setTime(null);
      return;
    }
    if (date && selectedVet.workingDays.includes(date.getDay())) return;
    setDate(nextOnDutyDate(selectedVet.workingDays));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClinicFlow, selectedVet?.id]);

  // …and the time to their first slot on it.
  useEffect(() => {
    if (!isClinicFlow || !selectedVet || !date) return;
    if (time && selectedVet.timeSlots.includes(time)) return;
    setTime([...selectedVet.timeSlots].sort()[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClinicFlow, selectedVet?.id, date]);

  const nights =
    date && endDate
      ? Math.max(
          1,
          Math.round((endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)),
        )
      : 0;

  const fmtLong = (d: Date) =>
    `${TH_WEEKDAY_SHORT[d.getDay()]} ${d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  const fmtShort = (d: Date) =>
    d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

  const dateLabel = isBoarding
    ? date && endDate
      ? `${fmtShort(date)} – ${fmtShort(endDate)} · ${nights} คืน`
      : 'แตะเพื่อเลือกช่วงวันที่'
    : date
      ? fmtLong(date)
      : dateLocked
        ? 'ยังเลือกไม่ได้'
        : 'แตะเพื่อเลือกวัน';

  // Boarding doesn't have a time slot — guests stay all day, drop-off any time —
  // but it does need both ends of the stay.
  // The clinic flow also demands an explicit vet: the whole schedule hangs off them.
  const canSubmit = useMemo(
    () =>
      petIds.length > 0 &&
      !!(appointmentType && date) &&
      (isBoarding ? !!endDate : !!time) &&
      (!isClinicFlow || (!!clinic && !!vetId)),
    [petIds, appointmentType, date, endDate, time, isBoarding, isClinicFlow, clinic, vetId],
  );

  // Reset selected staff when switching between vets / groomers / clinics pools
  useEffect(() => {
    if (vetId && !staffPool.some((v) => v.id === vetId)) {
      setVetId(null);
      // Date/time were derived from that vet's roster — they mean nothing now.
      if (isClinicFlow) {
        setDate(null);
        setTime(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGrooming, isBoarding, clinic?.id]);

  // Leaving boarding drops the check-out date; entering it drops the time slot.
  useEffect(() => {
    if (!isBoarding) setEndDate(null);
    else setTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBoarding]);

  const onSubmit = () => {
    if (!canSubmit || !petIds.length || !appointmentType || !mode || !date) return;
    if (isBoarding ? !endDate : !time) return;
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
      petIds,
      clinicName: clinic?.name,
      mode,
      type: appointmentType,
      dateISO: date.toISOString(),
      endDateISO: isBoarding && endDate ? endDate.toISOString() : undefined,
      // Boarding stays all day — placeholder slot for the route param shape.
      time: isBoarding ? '—' : time!,
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

  // ทุกคลินิกในเครือ เรียงตามจำนวนสัตว์ที่เลือกซึ่งเคยมา — ประวัติเป็นตัวจัดลำดับ
  // และป้ายบอกสถานะ ไม่ใช่ตัวกรอง (ดูเหตุผลใน data/clinics.ts)
  const clinicSection = isClinicFlow ? (
    <Section label="คลินิก">
      <View style={styles.clinicList}>
        {clinicOptions.map(({ clinic: c, visitedBy, lastVisit }, i) => {
          const isSelected = c.id === clinicId;
          // The list is "clinics with history" then "clinics near you" — the
          // seam is the first entry no selected pet has ever visited.
          const startsNearbyGroup =
            visitedBy.length === 0 &&
            (i === 0 || clinicOptions[i - 1].visitedBy.length > 0);
          return (
            <View key={c.id}>
            {startsNearbyGroup && (
              <View style={styles.groupHeader}>
                <Icon name="MapPin" size={13} color={semantic.textMuted} strokeWidth={2.2} />
                <Text variant="caption" weight="600" color={semantic.textSecondary}>
                  คลินิกใกล้ฉัน
                </Text>
              </View>
            )}
            <Card
              variant="elevated"
              selected={isSelected}
              padding="md"
              onPress={() => setClinicId(c.id)}
              style={styles.cardTightShadow}
              accessibilityRole="button"
              accessibilityLabel={`เลือก ${c.name}`}
            >
              {visitedBy.length > 0 && (
                <View style={styles.ehpBadgeRow}>
                  <View style={styles.ehpBadge}>
                    <Icon name="ShieldCheck" size={13} color={semantic.primary} strokeWidth={2.4} />
                    <Text variant="caption" weight="700" style={{ color: semantic.primary, fontSize: 11 }}>
                      {lastVisit
                        ? `เคยรักษา · ล่าสุด ${new Date(lastVisit).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`
                        : 'เคยรักษา'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Same anatomy as the boarding card: avatar · title · chips,
                  divider, meta pills, then schedule + rating. */}
              <View style={styles.vetTopRow}>
                <View style={[styles.vetAvatar, styles.clinicAvatar]}>
                  <Icon name="Hospital" size={26} color={semantic.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 14 }}>
                    {c.name}
                  </Text>
                  <View style={styles.vetChipRow}>
                    <VetChip icon="Stethoscope" label={`แพทย์ ${c.doctors.length} ท่าน`} />
                    {c.phone ? <VetChip icon="Phone" label={c.phone} /> : null}
                  </View>
                  {c.address ? (
                    <View style={styles.vetChipRow}>
                      <VetChip icon="MapPin" label={c.branch ?? c.address} />
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.vetDivider} />

              {c.distanceKm !== undefined && (
                <View style={styles.boardingMetaRow}>
                  <View style={styles.boardingMetaPill}>
                    <Icon name="Navigation" size={11} color={semantic.primary} strokeWidth={2.2} />
                    <Text variant="caption" weight="600" style={styles.boardingMetaText}>
                      {c.distanceKm < 10 ? c.distanceKm.toFixed(1) : Math.round(c.distanceKm)} กม.
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.vetBottomRow}>
                <View style={styles.vetBottomInfoLine}>
                  <Icon name="Clock" size={11} color={semantic.textMuted} strokeWidth={2} />
                  <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                    {c.openHours ?? '—'}
                  </Text>
                </View>
                <View style={styles.vetBottomInfoLine}>
                  <Icon name="Star" size={10} color="#D99A20" fill="#D99A20" />
                  <Text variant="caption" color={semantic.textMuted}>
                    {c.rating.toFixed(2)} ({c.reviewCount})
                  </Text>
                </View>
              </View>

            </Card>
            </View>
          );
        })}

        {/* Clinics in the pets' history that the app cannot book. Shown, not
            hidden — the owner sees these names in the health record already. */}
        {unbookableClinics.map((u) => (
          <Card key={u.name} variant="outlined" padding="md" style={styles.clinicDisabled}>
            <Text variant="bodyStrong" style={{ fontSize: 14 }} color={semantic.textMuted} numberOfLines={2}>
              {u.name}
            </Text>
            <Text variant="caption" color={semantic.textMuted} style={{ marginTop: 2 }}>
              {`${u.pets.map((p) => p.name).join(', ')} · ยังไม่รองรับการจองผ่านแอป`}
            </Text>
          </Card>
        ))}
      </View>
    </Section>
  ) : null;

  const dateSection = (
    <Section label={isBoarding ? 'ช่วงวันที่ฝากเลี้ยง' : 'วันที่'}>
      <Pressable
        onPress={dateLocked ? undefined : () => setDatePickerOpen(true)}
        disabled={dateLocked}
        style={({ pressed }) => [
          styles.dateBtn,
          dateLocked && styles.dateBtnLocked,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Icon
          name={dateLocked ? 'Lock' : 'CalendarDays'}
          size={18}
          color={dateLocked ? semantic.textMuted : semantic.textPrimary}
          strokeWidth={2}
        />
        <Text
          variant="bodyStrong"
          style={[styles.dateBtnText, !date && { color: semantic.textMuted }]}
          numberOfLines={1}
        >
          {dateLabel}
        </Text>
      </Pressable>
      {isClinicFlow && selectedVet && (
        <Text variant="caption" color={semantic.textSecondary} style={styles.helperText}>
          {`${selectedVet.name} เข้าเวร ${formatVetSchedule(selectedVet.workingDays, selectedVet.timeSlots)}`}
        </Text>
      )}
    </Section>
  );

  // Time — hidden for boarding (guests stay all day)
  const timeSection = isBoarding ? null : (
    <Section label="เวลา">
      {!date ? null : availableSlots.length === 0 ? (
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
            onPress={date ? () => setTime(time === t ? null : t) : undefined}
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
  );

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
          {/* Pet */}
          <Section label="สัตว์เลี้ยง">
            <View style={styles.petsRow}>
              {mockPets.map((p) => {
                const selected = petIds.includes(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() =>
                      setPetIds((prev) =>
                        prev.includes(p.id)
                          ? prev.filter((id) => id !== p.id)
                          : [...prev, p.id],
                      )
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
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

          {/* Type — 4 options: checkup / grooming / boarding / online consult */}
          <Section label="ประเภทการนัด">
            <View style={styles.chipGrid}>
              {(['checkup', 'grooming', 'boarding', 'consultation'] as const).map((t) => {
                const meta = typeMeta[t];
                const selected = appointmentType === t;
                const tintBg = `${meta.color}26`; // ~15% opacity
                return (
                  <Pressable
                    key={t}
                    onPress={() => setAppointmentType(t)}
                    style={({ pressed }) => [
                      styles.modeTile,
                      selected && {
                        borderColor: meta.color,
                        backgroundColor: `${meta.color}14`,
                      },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <View style={styles.typeInner}>
                      <View
                        style={[styles.typeIconWrap, { backgroundColor: tintBg }]}
                      >
                        <Icon name={meta.icon as any} size={22} color={meta.color} strokeWidth={2.2} />
                      </View>
                      <Text variant="bodyStrong" style={{ fontSize: 13 }} numberOfLines={1}>
                        {meta.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {clinicSection}

          {/* Non-EHP: pick a date, then see who is free. EHP flips it — the vet
              comes first and their roster fixes the date/time below. */}
          {!isClinicFlow && dateSection}
          {!isClinicFlow && timeSection}

          {/* Staff — vets / groomers / boarding clinics depending on appointment type.
              In the EHP flow the doctors belong to a clinic, so there is nothing
              to head until one is picked. */}
          {isClinicFlow && !clinic ? null : (
          <Section label={staffSectionLabel}>
            {isClinicFlow || !date ? null : matchingVets.length === 0 ? (
              <Text variant="caption" color={semantic.textSecondary} style={styles.helperText}>
                {`ไม่มี${staffKind}ว่างในช่วงเวลานี้ ลองเปลี่ยนวันหรือเวลา`}
              </Text>
            ) : null}
            <View style={styles.vetList}>
              {matchingVets.map((v, i) => {
                const isSelected = vetId === v.id;
                const isOnline = v.status === 'online';
                // Boarding list is two groups in one column; label the seam.
                const startsNearbyGroup =
                  isBoarding &&
                  !v.ehpPartner &&
                  (i === 0 || !!matchingVets[i - 1].ehpPartner);
                return (
                  <View key={v.id}>
                  {startsNearbyGroup && (
                    <View style={styles.groupHeader}>
                      <Icon name="MapPin" size={13} color={semantic.textMuted} strokeWidth={2.2} />
                      <Text variant="caption" weight="600" color={semantic.textSecondary}>
                        {`สถานที่ฝากเลี้ยงใกล้คุณ · ยอดนิยม`}
                      </Text>
                    </View>
                  )}
                  <Card
                    variant="elevated"
                    selected={isSelected}
                    padding="md"
                    onPress={() => setVetId(isSelected ? null : v.id)}
                    style={styles.cardTightShadow}
                  >
                    {isBoarding && (
                      <View style={styles.ehpBadgeRow}>
                        <View style={[styles.ehpBadge, !v.ehpPartner && styles.popularBadge]}>
                          <Icon
                            name={v.ehpPartner ? 'ShieldCheck' : 'Flame'}
                            size={13}
                            color={v.ehpPartner ? semantic.primary : '#D9822B'}
                            strokeWidth={2.4}
                          />
                          <Text
                            variant="caption"
                            weight="700"
                            style={{
                              color: v.ehpPartner ? semantic.primary : '#B5661C',
                              fontSize: 11,
                            }}
                          >
                            {v.ehpPartner ? 'ในเครือ EHP Vetcare' : 'ยอดนิยม'}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!isGrooming && !isBoarding && (
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
                    )}
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
                          <VetChip
                            icon={
                              isBoarding ? 'Home' : isGrooming ? 'Scissors' : 'Stethoscope'
                            }
                            label={v.specialty}
                          />
                          <VetChip icon="Briefcase" label={`${v.experienceYears} ปี`} />
                        </View>
                        <View style={styles.vetChipRow}>
                          <VetChip icon="MapPin" label={v.clinic} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.vetDivider} />
                    {isBoarding && (v.priceFromBaht || v.distanceKm !== undefined) && (
                      <View style={styles.boardingMetaRow}>
                        {v.distanceKm !== undefined && (
                          <View style={styles.boardingMetaPill}>
                            <Icon name="Navigation" size={11} color={semantic.primary} strokeWidth={2.2} />
                            <Text variant="caption" weight="600" style={styles.boardingMetaText}>
                              {v.distanceKm < 10 ? v.distanceKm.toFixed(1) : Math.round(v.distanceKm)} กม.
                            </Text>
                          </View>
                        )}
                        {v.priceFromBaht !== undefined && v.priceToBaht !== undefined && (
                          <View style={styles.boardingMetaPill}>
                            <Icon name="Tag" size={11} color="#4FB36C" strokeWidth={2.2} />
                            <Text variant="caption" weight="600" style={styles.boardingPriceText}>
                              ฿{v.priceFromBaht}–{v.priceToBaht}/คืน
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
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
                  </View>
                );
              })}
            </View>
          </Section>
          )}

          {isClinicFlow && !!clinic && dateSection}
          {isClinicFlow && !!clinic && timeSection}

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
        enabledWeekdays={enabledWeekdays}
        mode={isBoarding ? 'range' : 'single'}
        endValue={endDate}
        onRangeChange={(start, end) => {
          setDate(start);
          setEndDate(end);
        }}
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
    ...shadows.sm,
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
  clinicList: {
    gap: spacing.sm,
  },
  clinicDisabled: {
    opacity: 0.55,
  },
  // A clinic has no portrait — an icon keeps the boarding card's silhouette
  // without inventing a photo or borrowing a doctor's face.
  clinicAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.22)',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  popularBadge: {
    backgroundColor: 'rgba(217,130,43,0.12)',
  },
  helperText: {
    fontSize: 12,
    marginLeft: spacing.xs,
    marginTop: -spacing.xs,
    marginBottom: 0,
  },
  cardTightShadow: {
    ...shadows.sm,
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
  dateBtnLocked: {
    backgroundColor: semantic.surfaceMuted,
    opacity: 0.6,
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
  ehpBadgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  ehpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${semantic.primary}14`,
  },
  boardingMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  boardingMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(184,106,124,0.08)',
  },
  boardingMetaText: {
    fontSize: 11,
    color: semantic.primary,
  },
  boardingPriceText: {
    fontSize: 11,
    color: '#3F8A53',
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
    ...shadows.md,
  },
  submitBtnDisabled: {
    backgroundColor: semantic.borderStrong,
    // shadowOpacity no longer cancels a boxShadow — clear the shadow itself
    boxShadow: 'none',
  },
  submitBtnText: {
    fontSize: 16,
  },
});
