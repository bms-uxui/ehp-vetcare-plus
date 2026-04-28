import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, PetAvatar, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockAppointments, typeMeta, thDate } from '../data/appointments';

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

  const meta = typeMeta[appointment.type];
  const isUpcoming = appointment.status === 'upcoming';

  const onCancel = () => {
    Alert.alert('ยกเลิกนัดหมาย', 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกนัดหมายนี้?', [
      { text: 'ไม่ใช่', style: 'cancel' },
      {
        text: 'ยกเลิก',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const onReschedule = () => {
    navigation.replace('BookAppointment');
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: meta.color + '22' }]}>
          <Icon name={meta.icon as any} size={38} color={meta.color} strokeWidth={1.8} />
        </View>
        <Text variant="caption" color={meta.color} style={{ marginTop: spacing.md }}>
          {meta.label}
        </Text>
        <Text variant="h1" align="center" style={styles.title}>
          {appointment.typeLabel}
        </Text>
        <StatusBadge status={appointment.status} />
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

      <Card variant="elevated" padding="lg" style={styles.card}>
        <InfoRow label="สัตวแพทย์" value={appointment.vetName} />
        <Divider />
        <InfoRow label="คลินิก" value={appointment.clinicName} />
      </Card>

      {appointment.notes && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="caption" color={semantic.textSecondary}>หมายเหตุ</Text>
          <Text variant="body" style={{ marginTop: spacing.xs }}>{appointment.notes}</Text>
        </Card>
      )}

      {isUpcoming && (
        <View style={styles.actions}>
          <Button label="เลื่อนนัดหมาย" variant="secondary" uppercase={false} onPress={onReschedule} />
          <Button label="ยกเลิกนัดหมาย" variant="destructive" onPress={onCancel} />
        </View>
      )}
    </Screen>
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

function StatusBadge({ status }: { status: 'upcoming' | 'completed' | 'cancelled' }) {
  const map = {
    upcoming: { label: 'กำลังจะถึง', bg: semantic.primaryMuted, fg: semantic.primary },
    completed: { label: 'เสร็จสิ้น', bg: '#E7F5E9', fg: '#4FB36C' },
    cancelled: { label: 'ยกเลิกแล้ว', bg: '#FDECEC', fg: '#E14B4B' },
  } as const;
  const s = map[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
      <Text variant="caption" color={s.fg} weight="600">
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
});
