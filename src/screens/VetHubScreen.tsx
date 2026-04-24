import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockAppointments, Appointment, typeMeta, thWeekday, thDateShort } from '../data/appointments';
import { mockVets, mockConversations, statusMeta, thRelative, TeleVet } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'Vet'>;

type Tab = 'upcoming' | 'online' | 'history';

export default function VetHubScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcoming = mockAppointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const past = mockAppointments
    .filter((a) => a.status !== 'upcoming')
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const onlineVets = mockVets.filter((v) => v.status === 'online');

  return (
    <Screen scroll tabBarSpace>
      <View style={styles.header}>
        <Text variant="h1">สัตวแพทย์</Text>
        <Text variant="body" color={semantic.textSecondary}>
          นัดหมาย ปรึกษาออนไลน์ และประวัติการรักษา
        </Text>
      </View>

      {/* Quick action bento — 2 tiles side by side */}
      <View style={styles.bentoRow}>
        <Card
          variant="elevated"
          padding="lg"
          onPress={() => navigation.navigate('BookAppointment')}
          style={styles.bentoTile}
        >
          <View style={styles.bentoIcon}>
            <Icon name="CalendarPlus" size={22} color={semantic.primary} />
          </View>
          <Text variant="bodyStrong" style={{ fontSize: 14 }}>จองนัดคลินิก</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            ตรวจ · วัคซีน · อาบน้ำ
          </Text>
        </Card>
        <Card
          variant="elevated"
          padding="lg"
          onPress={() => navigation.navigate('BookTeleVet')}
          style={styles.bentoTile}
        >
          <View style={[styles.bentoIcon, { backgroundColor: '#E0F0FB' }]}>
            <Icon name="Video" size={22} color="#4A8FD1" />
          </View>
          <Text variant="bodyStrong" style={{ fontSize: 14 }}>ปรึกษาออนไลน์</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            แชทหรือวิดีโอคอล
          </Text>
        </Card>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TabBtn label="กำลังจะถึง" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabBtn label="ออนไลน์" active={tab === 'online'} onPress={() => setTab('online')} />
        <TabBtn label="ประวัติ" active={tab === 'history'} onPress={() => setTab('history')} />
      </View>

      {tab === 'upcoming' && (
        <UpcomingTab appointments={upcoming} navigation={navigation} />
      )}
      {tab === 'online' && (
        <OnlineTab vets={onlineVets} navigation={navigation} />
      )}
      {tab === 'history' && <HistoryTab appointments={past} navigation={navigation} />}
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

function UpcomingTab({
  appointments,
  navigation,
}: {
  appointments: Appointment[];
  navigation: Props['navigation'];
}) {
  if (appointments.length === 0) {
    return (
      <Card variant="elevated" padding="2xl">
        <View style={styles.empty}>
          <Icon name="CalendarDays" size={48} color={semantic.textMuted} strokeWidth={1.5} />
          <Text variant="bodyStrong">ยังไม่มีนัดหมาย</Text>
          <Text variant="caption" color={semantic.textSecondary} align="center">
            กด "จองนัดคลินิก" หรือ "ปรึกษาออนไลน์" เพื่อเริ่มต้น
          </Text>
        </View>
      </Card>
    );
  }
  return (
    <View style={styles.list}>
      {appointments.map((a) => (
        <AppointmentRow
          key={a.id}
          appointment={a}
          onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: a.id })}
        />
      ))}
    </View>
  );
}

function HistoryTab({
  appointments,
  navigation,
}: {
  appointments: Appointment[];
  navigation: Props['navigation'];
}) {
  if (appointments.length === 0) {
    return (
      <Card variant="elevated" padding="2xl">
        <View style={styles.empty}>
          <Icon name="ClipboardList" size={48} color={semantic.textMuted} strokeWidth={1.5} />
          <Text variant="bodyStrong">ยังไม่มีประวัติ</Text>
        </View>
      </Card>
    );
  }
  return (
    <View style={styles.list}>
      {appointments.map((a) => (
        <AppointmentRow
          key={a.id}
          appointment={a}
          onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: a.id })}
        />
      ))}
    </View>
  );
}

function OnlineTab({ vets, navigation }: { vets: TeleVet[]; navigation: Props['navigation'] }) {
  return (
    <>
      {/* Recent conversations */}
      {mockConversations.length > 0 && (
        <>
          <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
            การสนทนาล่าสุด
          </Text>
          <View style={styles.list}>
            {mockConversations.map((c) => {
              const vet = mockVets.find((v) => v.id === c.vetId);
              if (!vet) return null;
              return (
                <Card
                  key={c.id}
                  variant="elevated"
                  padding="md"
                  onPress={() => navigation.navigate('Chat', { conversationId: c.id })}
                >
                  <View style={styles.convoRow}>
                    <View style={styles.vetAvatar}>
                      <Icon name="UserCircle" size={28} color={semantic.primary} strokeWidth={1.5} />
                      <View style={[styles.statusDot, { backgroundColor: statusMeta[vet.status].color }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.convoTopRow}>
                        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                          {vet.name}
                        </Text>
                        <Text variant="caption" color={semantic.textMuted}>
                          {thRelative(c.lastSentAtISO)}
                        </Text>
                      </View>
                      <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                        {c.lastMessage}
                      </Text>
                    </View>
                    {c.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text variant="caption" color={semantic.onPrimary} weight="600" style={{ fontSize: 11 }}>
                          {c.unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      {/* Online vets */}
      <Text
        variant="overline"
        color={semantic.textSecondary}
        style={[styles.sectionLabel, { marginTop: spacing.lg }]}
      >
        สัตวแพทย์ออนไลน์ ({vets.length})
      </Text>

      {vets.length === 0 ? (
        <Card variant="elevated" padding="2xl">
          <View style={styles.empty}>
            <Icon name="CircleOff" size={40} color={semantic.textMuted} strokeWidth={1.5} />
            <Text variant="bodyStrong">ขณะนี้ไม่มีสัตวแพทย์ออนไลน์</Text>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              คุณสามารถจองนัดปรึกษาล่วงหน้าได้
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {vets.map((v) => (
            <Card key={v.id} variant="elevated" padding="lg">
              <View style={styles.vetRow}>
                <View style={styles.vetAvatar}>
                  <Icon name="UserCircle" size={36} color={semantic.primary} strokeWidth={1.5} />
                  <View style={[styles.statusDot, { backgroundColor: '#4FB36C' }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{v.name}</Text>
                  <Text variant="caption" color={semantic.textSecondary}>
                    {v.specialty}
                  </Text>
                  <View style={styles.starRow}>
                    <Icon name="Star" size={12} color="#D99A20" fill="#D99A20" />
                    <Text variant="caption" color={semantic.textMuted}>
                      {v.rating} · ฿{v.ratePerMin}/นาที
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionRow}>
                <Button
                  label="แชท"
                  size="sm"
                  fullWidth={false}
                  uppercase={false}
                  onPress={() => {
                    const existing = mockConversations.find((c) => c.vetId === v.id);
                    navigation.navigate('Chat', {
                      conversationId: existing?.id ?? `new-${v.id}`,
                      vetId: v.id,
                    });
                  }}
                  leftIcon={<Icon name="MessageCircle" size={14} color={semantic.onPrimary} />}
                  style={{ flex: 1 }}
                />
                <Button
                  label="วิดีโอ"
                  size="sm"
                  variant="secondary"
                  uppercase={false}
                  fullWidth={false}
                  onPress={() => {}}
                  leftIcon={<Icon name="Video" size={14} color={semantic.primary} />}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </>
  );
}

function AppointmentRow({
  appointment,
  onPress,
}: {
  appointment: Appointment;
  onPress: () => void;
}) {
  const meta = typeMeta[appointment.type];
  return (
    <Card variant="elevated" padding="lg" onPress={onPress}>
      <View style={styles.apptRow}>
        <View style={styles.apptDate}>
          <Text variant="overline" color={semantic.primary}>{thWeekday(appointment.dateISO)}</Text>
          <Text variant="h3">{thDateShort(appointment.dateISO)}</Text>
          <Text variant="caption" color={semantic.textSecondary}>{appointment.time}</Text>
        </View>
        <View style={styles.vDivider} />
        <View style={{ flex: 1 }}>
          <View style={styles.typeBadge}>
            <Icon name={meta.icon as any} size={12} color={meta.color} />
            <Text variant="caption" color={meta.color}>{meta.label}</Text>
          </View>
          <Text variant="bodyStrong" numberOfLines={1}>{appointment.typeLabel}</Text>
          <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
            {appointment.petEmoji} {appointment.petName} · {appointment.vetName}
          </Text>
        </View>
        <Icon name="ChevronRight" size={18} color={semantic.textMuted} />
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
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bentoTile: {
    flex: 1,
    gap: spacing.xs,
  },
  bentoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  apptDate: {
    alignItems: 'center',
    minWidth: 64,
    gap: 2,
  },
  vDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: semantic.border,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vetRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: semantic.surface,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  convoTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: semantic.primary,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
