import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import {
  mockReminders,
  mockSchedules,
  reminderMeta,
  relativeTime,
  Reminder,
  FeedingSchedule,
} from '../data/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type Tab = 'inbox' | 'schedules' | 'settings';

export default function NotificationsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('inbox');
  const [schedules, setSchedules] = useState(mockSchedules);

  const [preAppointment, setPreAppointment] = useState({
    week: true,
    day: true,
    hour: true,
  });
  const [preVaccine, setPreVaccine] = useState(true);

  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">แจ้งเตือน</Text>
        <Text variant="body" color={semantic.textSecondary}>
          จัดการการแจ้งเตือนและตารางให้อาหาร
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TabBtn label="แจ้งเตือน" active={tab === 'inbox'} onPress={() => setTab('inbox')} />
        <TabBtn label="ตารางให้อาหาร" active={tab === 'schedules'} onPress={() => setTab('schedules')} />
        <TabBtn label="ตั้งค่า" active={tab === 'settings'} onPress={() => setTab('settings')} />
      </View>

      {tab === 'inbox' && <InboxTab reminders={mockReminders} />}
      {tab === 'schedules' && (
        <SchedulesTab
          schedules={schedules}
          onToggle={toggleSchedule}
          onAdd={() => navigation.navigate('AddFeedingSchedule')}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab
          preAppointment={preAppointment}
          setPreAppointment={setPreAppointment}
          preVaccine={preVaccine}
          setPreVaccine={setPreVaccine}
        />
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
        style={{ fontSize: 13 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InboxTab({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return (
      <Card variant="elevated" padding="2xl">
        <View style={styles.empty}>
          <Icon name="Bell" size={48} color={semantic.textMuted} strokeWidth={1.5} />
          <Text variant="bodyStrong">ไม่มีแจ้งเตือน</Text>
          <Text variant="caption" color={semantic.textSecondary} align="center">
            การแจ้งเตือนใหม่จะปรากฎที่นี่
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {reminders.map((r) => {
        const meta = reminderMeta[r.type];
        return (
          <Card key={r.id} variant="elevated" padding="lg">
            <View style={styles.reminderRow}>
              <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                <Icon name={meta.icon as any} size={20} color={meta.fg} />
              </View>
              <View style={styles.reminderBody}>
                <View style={styles.reminderTopRow}>
                  <Text variant="overline" color={meta.fg}>{meta.label}</Text>
                  <Text variant="caption" color={semantic.textMuted}>
                    {relativeTime(r.dueISO)}
                  </Text>
                </View>
                <Text variant="bodyStrong">{r.title}</Text>
                <Text variant="caption" color={semantic.textSecondary}>{r.description}</Text>
                {r.petName && (
                  <Text variant="caption" color={semantic.textMuted}>
                    {r.petEmoji} {r.petName}
                    {r.leadTimeLabel ? ` · ${r.leadTimeLabel}` : ''}
                  </Text>
                )}
                {r.type === 'feeding' && !r.read && (
                  <View style={styles.inlineAction}>
                    <Button label="ให้แล้ว" size="sm" uppercase={false} fullWidth={false} onPress={() => {}} />
                  </View>
                )}
              </View>
              {!r.read && <View style={styles.unreadDot} />}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function SchedulesTab({
  schedules,
  onToggle,
  onAdd,
}: {
  schedules: FeedingSchedule[];
  onToggle: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <View style={styles.list}>
        {schedules.map((s) => {
          const isFood = s.type === 'food';
          return (
            <Card key={s.id} variant="elevated" padding="lg">
              <View style={styles.scheduleRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isFood ? '#FFF6D9' : '#E0F0FB' },
                  ]}
                >
                  <Icon
                    name={isFood ? 'UtensilsCrossed' : 'Droplet'}
                    size={20}
                    color={isFood ? '#D99A20' : '#4A8FD1'}
                  />
                </View>
                <View style={styles.scheduleBody}>
                  <View style={styles.scheduleTopRow}>
                    <Text variant="h3">{s.time}</Text>
                    <Text variant="caption" color={semantic.textMuted}>ทุกวัน</Text>
                  </View>
                  <Text variant="body">{s.amount}</Text>
                  {s.note && (
                    <Text variant="caption" color={semantic.textSecondary}>{s.note}</Text>
                  )}
                  <Text variant="caption" color={semantic.textMuted}>
                    {s.petEmoji} {s.petName}
                  </Text>
                </View>
                <Switch
                  value={s.enabled}
                  onValueChange={() => onToggle(s.id)}
                  trackColor={{ false: semantic.border, true: semantic.primary }}
                />
              </View>
            </Card>
          );
        })}
      </View>
      <View style={styles.addWrap}>
        <Button label="+ เพิ่มตารางให้อาหาร" variant="secondary" uppercase={false} onPress={onAdd} />
      </View>
    </>
  );
}

function SettingsTab({
  preAppointment,
  setPreAppointment,
  preVaccine,
  setPreVaccine,
}: {
  preAppointment: { week: boolean; day: boolean; hour: boolean };
  setPreAppointment: (v: { week: boolean; day: boolean; hour: boolean }) => void;
  preVaccine: boolean;
  setPreVaccine: (v: boolean) => void;
}) {
  return (
    <View style={styles.list}>
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        เตือนก่อนนัดหมาย
      </Text>
      <Card variant="elevated" padding={0}>
        <SettingRow
          icon="Calendar"
          label="ล่วงหน้า 1 สัปดาห์"
          value={preAppointment.week}
          onChange={(v) => setPreAppointment({ ...preAppointment, week: v })}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="Calendar"
          label="ล่วงหน้า 1 วัน"
          value={preAppointment.day}
          onChange={(v) => setPreAppointment({ ...preAppointment, day: v })}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="Clock"
          label="ล่วงหน้า 1 ชั่วโมง"
          value={preAppointment.hour}
          onChange={(v) => setPreAppointment({ ...preAppointment, hour: v })}
        />
      </Card>

      <Text variant="overline" color={semantic.textSecondary} style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
        แจ้งเตือนวัคซีน
      </Text>
      <Card variant="elevated" padding={0}>
        <SettingRow
          icon="Syringe"
          label="แจ้งเตือนเมื่อ EHP VetCare บันทึก"
          value={preVaccine}
          onChange={setPreVaccine}
        />
      </Card>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon name={icon as any} size={16} color={semantic.textSecondary} />
      </View>
      <Text variant="body" style={{ flex: 1 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: semantic.border, true: semantic.primary }}
      />
    </View>
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
    gap: 2,
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
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  reminderBody: {
    flex: 1,
    gap: 2,
  },
  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semantic.primary,
    marginTop: 8,
  },
  inlineAction: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleBody: {
    flex: 1,
    gap: 2,
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  addWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginLeft: spacing.xl + 32 + spacing.md,
    backgroundColor: semantic.border,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
