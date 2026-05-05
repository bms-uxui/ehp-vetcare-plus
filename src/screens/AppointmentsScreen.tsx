import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { Appointment, typeMeta, thWeekday, thDateShort } from '../data/appointments';
import { useAppointments } from '../data/appointmentsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Vet'>;

type Tab = 'upcoming' | 'past';

export default function AppointmentsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('upcoming');
  const { appointments } = useAppointments();

  const items = appointments
    .filter((a) => (tab === 'upcoming' ? a.status === 'upcoming' : a.status !== 'upcoming'))
    .sort((a, b) => (tab === 'upcoming' ? a.dateISO.localeCompare(b.dateISO) : b.dateISO.localeCompare(a.dateISO)));

  return (
    <Screen scroll tabBarSpace>
      <View style={styles.header}>
        <Text variant="h1">นัดหมาย</Text>
        <Text variant="body" color={semantic.textSecondary}>
          การนัดหมายของสัตว์เลี้ยงคุณ
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TabBtn label="นัดถัดไป" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabBtn label="ประวัติ" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      {items.length === 0 ? (
        <Card variant="elevated" padding="2xl" style={styles.emptyCard}>
          <View style={styles.empty}>
            <Icon name="CalendarDays" size={48} color={semantic.textMuted} strokeWidth={1.5} />
            <Text variant="bodyStrong">ยังไม่มีนัดหมาย</Text>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              {tab === 'upcoming' ? 'กด "จองนัดหมายใหม่" เพื่อเริ่มต้น' : 'ยังไม่มีประวัตินัดหมาย'}
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: a.id })}
            />
          ))}
        </View>
      )}

      {tab === 'upcoming' && (
        <View style={styles.addWrap}>
          <Button label="+ จองนัดหมายใหม่" onPress={() => navigation.navigate('BookAppointment')} />
        </View>
      )}
    </Screen>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text
        variant="bodyStrong"
        color={active ? semantic.onPrimary : semantic.textSecondary}
        style={{ fontSize: 14 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AppointmentCard({ appointment, onPress }: { appointment: Appointment; onPress: () => void }) {
  const meta = typeMeta[appointment.type];
  return (
    <Card variant="elevated" padding="lg" onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.dateCol}>
          <Text variant="overline" color={semantic.primary}>{thWeekday(appointment.dateISO)}</Text>
          <Text variant="h2">{thDateShort(appointment.dateISO)}</Text>
          <Text variant="caption" color={semantic.textSecondary}>{appointment.time}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.info}>
          <View style={styles.typeBadge}>
            <Icon name={meta.icon as any} size={13} color={meta.color} />
            <Text variant="caption" color={meta.color}>{meta.label}</Text>
          </View>
          <Text variant="bodyStrong">{appointment.typeLabel}</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            {appointment.petEmoji} {appointment.petName} · {appointment.vetName}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  tabBtnActive: {
    backgroundColor: semantic.primary,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  dateCol: {
    alignItems: 'center',
    minWidth: 72,
    gap: 2,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: semantic.border,
  },
  info: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  emptyCard: {
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  addWrap: {
    marginTop: spacing.xl,
  },
});
