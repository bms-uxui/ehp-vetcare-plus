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
import { AppBackground, Card, Icon, StepProgress, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { mockVets } from '../data/televet';
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
  const { petId, mode, dateISO, time, vetId, notes } = route.params;

  const pet = mockPets.find((p) => p.id === petId);
  const vet = mockVets.find((v) => v.id === vetId);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const [toast, setToast] = useState<string | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);

  const onConfirm = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    bookingSubmitted.current = true;
    setToast('บันทึกการจองนัดของคุณแล้ว');
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
        <View style={styles.stepWrap}>
          <StepProgress
            currentStep={1}
            steps={[
              { icon: 'CalendarPlus' },
              { icon: 'ClipboardCheck' },
            ]}
          />
        </View>
        <Text variant="caption" color={semantic.textSecondary} style={styles.intro}>
          กรุณาตรวจสอบรายละเอียดการนัดหมายให้ถูกต้องก่อนยืนยัน
        </Text>

        {/* Mode card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.row}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor:
                    mode === 'online'
                      ? 'rgba(27,90,119,0.12)'
                      : 'rgba(159,82,102,0.12)',
                },
              ]}
            >
              <Icon
                name={mode === 'online' ? 'Video' : 'Hospital'}
                size={20}
                color={mode === 'online' ? '#1B5A77' : '#9F5266'}
                strokeWidth={2.2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary}>
                ประเภทการนัด
              </Text>
              <Text variant="bodyStrong" style={styles.value}>
                {mode === 'online' ? 'ปรึกษาออนไลน์' : 'ที่คลินิก'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Pet card */}
        {pet && (
          <Card variant="elevated" padding="md" style={styles.card}>
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
        )}

        {/* Date & Time card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: semantic.primaryMuted }]}>
              <Icon name="CalendarDays" size={20} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary}>
                วันและเวลา
              </Text>
              <Text variant="bodyStrong" style={styles.value}>
                {formatDate(dateISO)}
              </Text>
              <Text variant="caption" color={semantic.textSecondary}>
                เวลา {time} น.
              </Text>
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
                  สัตวแพทย์
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
  stepWrap: {
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.md,
  },
  intro: {
    fontSize: 13,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  toastText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
