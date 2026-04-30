import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, ConfirmModal, Icon, PetAvatar, Screen, SubPageHeader, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockAppointments, thDate } from '../data/appointments';
import { mockVets, mockConversations } from '../data/televet';

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

const isDayReached = (dateISO: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appt = new Date(dateISO);
  appt.setHours(0, 0, 0, 0);
  return appt.getTime() <= today.getTime();
};

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetail'>;

export default function AppointmentDetailScreen({ route, navigation }: Props) {
  const { appointmentId } = route.params;
  const appointment = mockAppointments.find((a) => a.id === appointmentId);

  if (!appointment) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบการนัดหมาย</Text>
      </Screen>
    );
  }

  const isUpcoming = appointment.status === 'upcoming';
  const isOnline = appointment.type === 'consultation';
  const canVideoCall = isOnline && isUpcoming && isDayReached(appointment.dateISO);

  // Countdown 15 mins before appointment time
  const apptDateTime = useMemo(() => {
    const [hh, mm] = appointment.time.split(':').map(Number);
    const d = new Date(appointment.dateISO);
    d.setHours(hh, mm, 0, 0);
    return d;
  }, [appointment.dateISO, appointment.time]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!canVideoCall) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [canVideoCall]);

  const remainingMs = apptDateTime.getTime() - now.getTime();
  const showCountdown = remainingMs > 0 && remainingMs <= 15 * 60 * 1000;
  const countdownLabel = showCountdown
    ? `${String(Math.floor(remainingMs / 60000)).padStart(2, '0')}:${String(
        Math.floor((remainingMs % 60000) / 1000),
      ).padStart(2, '0')}`
    : null;

  const onVideoCall = () => {
    const teleVet =
      mockVets.find((v) => v.name.startsWith(appointment.vetName)) ?? mockVets[0];
    if (teleVet) navigation.navigate('VideoCall', { vetId: teleVet.id });
  };
  const onChat = () => {
    const existing = mockConversations[0];
    if (existing) navigation.navigate('Chat', { conversationId: existing.id });
  };

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const onCancel = () => setCancelModalOpen(true);

  const onReschedule = () => {
    const matchedVet = mockVets.find((v) => v.name.startsWith(appointment.vetName));
    navigation.replace('BookAppointment', {
      prefillPetId: appointment.petId,
      prefillMode: appointment.type === 'consultation' ? 'online' : 'clinic',
      prefillDateISO: appointment.dateISO,
      prefillTime: appointment.time,
      selectedVetId: matchedVet?.id,
      prefillNotes: appointment.notes,
    });
  };

  return (
    <View style={styles.root}>
    <SubPageHeader title="รายละเอียดการนัด" onBack={() => navigation.goBack()} />
    <Screen scroll topFade={false} style={{ paddingTop: spacing.md }}>
      <View style={styles.hero}>
        <Text variant="h1" align="center" style={styles.title}>
          {appointment.typeLabel}
        </Text>
        <StatusBadge status={appointment.status} dateISO={appointment.dateISO} />
      </View>

      <Card variant="elevated" padding="lg" style={styles.card}>
        <InfoRow label="วันที่" value={thDate(appointment.dateISO)} />
        <Divider />
        <InfoRow label="เวลา" value={`${appointment.time} น.`} />
        <Divider />
        <InfoRow label="ระยะเวลา" value={`${appointment.durationMin} นาที`} />
      </Card>

      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.petRow}>
          <PetAvatar
            petId={appointment.petId}
            fallbackEmoji={appointment.petEmoji}
            size={56}
            backgroundColor={semantic.primaryMuted}
          />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={semantic.textSecondary}>สัตว์เลี้ยง</Text>
            <Text variant="bodyStrong">{appointment.petName}</Text>
          </View>
        </View>
      </Card>

      {(() => {
        const vet =
          mockVets.find((v) => v.name.startsWith(appointment.vetName)) ?? mockVets[0];
        if (!vet) {
          return (
            <Card variant="elevated" padding="lg" style={styles.card}>
              <InfoRow label="สัตวแพทย์" value={appointment.vetName} />
              <Divider />
              <InfoRow label="คลินิก" value={appointment.clinicName} />
            </Card>
          );
        }
        const isOnlineVet = vet.status === 'online';
        return (
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.vetTopRow}>
              <View style={styles.vetAvatar}>
                <Image source={{ uri: vet.avatar }} style={styles.vetAvatarImg} />
                {isOnlineVet && <View style={styles.statusDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
                  {vet.name}
                </Text>
                <View style={styles.vetChipRow}>
                  <VetChip icon="Stethoscope" label={vet.specialty} />
                  <VetChip icon="Briefcase" label={`${vet.experienceYears} ปี`} />
                </View>
                <View style={styles.vetChipRow}>
                  <VetChip icon="MapPin" label={vet.clinic} />
                </View>
              </View>
            </View>
            <View style={styles.vetDivider} />
            <View style={styles.vetBottomRow}>
              <View style={styles.vetBottomInfoLine}>
                <Icon name="Clock" size={11} color={semantic.textMuted} strokeWidth={2} />
                <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                  {formatVetSchedule(vet.workingDays, vet.timeSlots)}
                </Text>
              </View>
              <View style={styles.vetBottomInfoLine}>
                <Icon name="Star" size={10} color="#D99A20" fill="#D99A20" />
                <Text variant="caption" color={semantic.textMuted}>
                  {vet.rating} ({vet.reviewCount})
                </Text>
              </View>
            </View>
          </Card>
        );
      })()}

      {appointment.notes && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="caption" color={semantic.textSecondary}>หมายเหตุ</Text>
          <Text variant="body" style={{ marginTop: spacing.xs }}>{appointment.notes}</Text>
        </Card>
      )}

      {isUpcoming && !isDayReached(appointment.dateISO) && (
        <View style={styles.actions}>
          <Button label="เลื่อนนัดหมาย" variant="secondary" uppercase={false} onPress={onReschedule} />
          <Button label="ยกเลิกนัดหมาย" variant="destructive" onPress={onCancel} />
        </View>
      )}

      {/* Spacer so floating call bar doesn't cover the last card */}
      {canVideoCall && <View style={{ height: 100 }} />}
    </Screen>

    {canVideoCall && (
      <View pointerEvents="box-none" style={styles.callBarWrap}>
        <View style={styles.callBarShadow}>
          <View style={styles.callRow}>
            <Pressable
              onPress={onChat}
              style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="แชท"
            >
              <Icon name="MessageCircle" size={20} color={semantic.primary} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              onPress={onVideoCall}
              style={({ pressed }) => [styles.videoCallBtn, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel="วิดีโอคอลสัตวแพทย์"
            >
              <Icon name="Video" size={20} color={semantic.onPrimary} strokeWidth={2.2} />
              <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.videoCallText}>
                {countdownLabel ? `เริ่มในอีก ${countdownLabel}` : 'วิดีโอคอลสัตวแพทย์'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    )}

    <ConfirmModal
      visible={cancelModalOpen}
      icon="CalendarX"
      tone="danger"
      title="ยกเลิกนัดหมาย?"
      message="เมื่อยกเลิกแล้วจะไม่สามารถกู้คืนข้อมูลได้"
      cancelLabel="ไม่ใช่"
      confirmLabel="ยกเลิกนัด"
      confirmTone="danger"
      onCancel={() => setCancelModalOpen(false)}
      onConfirm={() => {
        setCancelModalOpen(false);
        navigation.goBack();
      }}
    />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="caption" color={semantic.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function StatusBadge({
  status,
  dateISO,
}: {
  status: 'upcoming' | 'completed' | 'cancelled';
  dateISO: string;
}) {
  const dayReached = status === 'upcoming' && isDayReached(dateISO);
  const map = {
    upcoming: dayReached
      ? {
          label: 'ถึงวันนัดแล้ว กรุณาเตรียมตัวก่อนถึงนัด 15-20 นาที',
          bg: '#FFF6DD',
          fg: '#92400E',
        }
      : { label: 'กำลังจะถึง', bg: semantic.primaryMuted, fg: semantic.primary },
    completed: { label: 'เสร็จสิ้น', bg: '#E7F5E9', fg: '#4FB36C' },
    cancelled: { label: 'ยกเลิกแล้ว', bg: '#FDECEC', fg: '#E14B4B' },
  } as const;
  const s = map[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
      <Text variant="caption" color={s.fg} weight="600" align="center">
        {s.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xs,
  },
  statusBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  card: {
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: semantic.border,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  root: {
    flex: 1,
  },
  callBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  callBarShadow: {
    borderRadius: 42,
    backgroundColor: '#F2F2F3',
    padding: spacing['2xl'],
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  videoCallBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  videoCallText: {
    fontSize: 16,
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
});
