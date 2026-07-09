import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Card, Icon, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { semantic, shadows, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { mockVets, mockGroomers, mockBoardingClinics } from '../data/televet';
import { typeMeta } from '../data/appointments';
import { useAppointments } from '../data/appointmentsContext';
import { bookingSubmitted } from '../data/bookingState';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointmentSummary'>;

const TH_WEEKDAY_FULL = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์',
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${TH_WEEKDAY_FULL[d.getDay()]} ${d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
};

export default function BookAppointmentSummaryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { petIds, clinicName, mode, type, dateISO, endDateISO, time, vetId, notes } =
    route.params;

  const isGrooming = type === 'grooming';
  const isBoarding = type === 'boarding';
  const pets = mockPets.filter((p) => petIds.includes(p.id));
  const staffPool = isBoarding
    ? mockBoardingClinics
    : isGrooming
      ? mockGroomers
      : mockVets;
  const vet = staffPool.find((v) => v.id === vetId);
  const staffLabel = isBoarding ? 'คลินิก' : isGrooming ? 'ช่าง' : 'สัตวแพทย์';
  const stayNights =
    endDateISO
      ? Math.max(
          1,
          Math.round(
            (new Date(endDateISO).getTime() - new Date(dateISO).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  const meta = typeMeta[type];

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const { addAppointments } = useAppointments();
  const [toast, setToast] = useState<string | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);

  const onConfirm = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    bookingSubmitted.current = true;
    // One appointment card per pet — a shared trip still means separate records.
    addAppointments(
      pets.map((p) => ({
        petId: p.id,
        petName: p.name,
        petEmoji: p.emoji,
        type,
        typeLabel: meta.label,
        dateISO,
        time: isBoarding ? '—' : time,
        durationMin: 30,
        vetName: vet?.name ?? '',
        clinicName: clinicName ?? vet?.clinic ?? '',
        status: 'upcoming' as const,
        notes: notes?.trim() || undefined,
      })),
    );
    setToast(
      pets.length > 1
        ? `บันทึกแล้ว · ออกใบนัดแยก ${pets.length} ใบ`
        : 'บันทึกการจองนัดของคุณแล้ว',
    );
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => {
      // Pop back to the tabs container (Vet/Home/etc.) — using popToTop here
      // would unwind all the way to the Login screen, since Login is the root
      // initial route in the stack.
      navigation.popTo('Main');
    }, 1500);
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader
        title="ตรวจสอบข้อมูลการจอง"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + HEADER_HEIGHT,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Text variant="caption" color={semantic.textSecondary} style={styles.intro}>
          กรุณาตรวจสอบรายละเอียดการนัดหมายให้ถูกต้องก่อนยืนยัน
        </Text>

        {/* Type card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: `${meta.color}1F` }]}>
              <Icon
                name={meta.icon as any}
                size={20}
                color={meta.color}
                strokeWidth={2.2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary}>
                ประเภทการนัด
              </Text>
              <Text variant="bodyStrong" style={styles.value}>
                {meta.label}
              </Text>
            </View>
          </View>
        </Card>

        {/* Pet cards — one row per pet, since each gets its own appointment */}
        {pets.map((pet) => (
          <Card key={pet.id} variant="elevated" padding="md" style={styles.card}>
            <View style={styles.row}>
              <View style={styles.petAvatar}>
                {pet.photo ? (
                  <Image source={pet.photo} style={styles.petAvatarImg} />
                ) : (
                  <Text style={{ fontSize: 28 }}>{pet.emoji}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={semantic.textSecondary}>
                  สัตว์เลี้ยง
                </Text>
                <Text variant="bodyStrong" style={styles.value}>
                  {pet.name}
                </Text>
                <Text variant="caption" color={semantic.textSecondary}>
                  {pet.speciesLabel}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {pets.length > 1 && (
          <Text variant="caption" color={semantic.textSecondary} style={styles.intro}>
            {`จะออกใบนัดแยก ${pets.length} ใบ ตัวละหนึ่งใบ ในวันและเวลาเดียวกัน`}
          </Text>
        )}

        {/* Date & Time card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: semantic.primaryMuted }]}>
              <Icon name="CalendarDays" size={20} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary}>
                {isBoarding ? 'ช่วงวันที่ฝากเลี้ยง' : 'วันและเวลา'}
              </Text>
              <Text variant="bodyStrong" style={styles.value}>
                {formatDate(dateISO)}
              </Text>
              {isBoarding && endDateISO ? (
                <>
                  <Text variant="bodyStrong" style={styles.value}>
                    ถึง {formatDate(endDateISO)}
                  </Text>
                  <Text variant="caption" color={semantic.textSecondary}>
                    รวม {stayNights} คืน
                  </Text>
                </>
              ) : null}
              {!isBoarding && (
                <Text variant="caption" color={semantic.textSecondary}>
                  เวลา {time} น.
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Vet card */}
        {vet && (
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.row}>
              <View style={styles.vetAvatarWrap}>
                <Image source={{ uri: vet.avatar }} style={styles.vetAvatar} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={semantic.textSecondary}>
                  {staffLabel}
                </Text>
                <Text variant="bodyStrong" style={styles.value} numberOfLines={1}>
                  {vet.name}
                </Text>
                <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                  {vet.specialty} · {vet.clinic}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Notes */}
        {notes && notes.trim() ? (
          <Card variant="elevated" padding="md" style={styles.card}>
            <Text variant="caption" color={semantic.textSecondary}>
              หมายเหตุ
            </Text>
            <Text variant="body" style={{ marginTop: 4 }}>
              {notes}
            </Text>
          </Card>
        ) : null}
      </Animated.ScrollView>

      {/* Floating confirm bar */}
      <View
        pointerEvents="box-none"
        style={[styles.barWrap, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <View style={styles.barInner}>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="ยืนยันการจอง"
          >
            <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.confirmText}>
              ยืนยันการจอง
            </Text>
          </Pressable>
        </View>
      </View>

      {toast && (
        <Animated.View
          pointerEvents="none"
          entering={SlideInDown.duration(280)}
          exiting={SlideOutDown.duration(280)}
          style={[styles.toast, { bottom: insets.bottom + 24 }]}
        >
          <Icon name="Check" size={16} color="#FFFFFF" strokeWidth={3} />
          <Text variant="bodyStrong" style={styles.toastText}>
            {toast}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  intro: {
    fontSize: 13,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 15,
    marginTop: 2,
  },
  petAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petAvatarImg: {
    width: '100%',
    height: '100%',
  },
  vetAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  vetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  barInner: {
    width: '100%',
  },
  confirmBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  confirmText: {
    fontSize: 16,
  },
  toast: {
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
    zIndex: 9999,
    ...shadows.pop,
  },
  toastText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
