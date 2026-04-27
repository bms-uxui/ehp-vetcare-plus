import { ComponentProps, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockAppointments, Appointment, typeMeta, thWeekday, thDateShort } from '../data/appointments';
import { mockVets, mockConversations, TeleVet } from '../data/televet';

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
        <View style={styles.headerText}>
          <Text variant="h1">สัตวแพทย์</Text>
          <Text variant="body" color={semantic.textSecondary}>
            นัดหมาย ปรึกษาออนไลน์ และประวัติการรักษา
          </Text>
        </View>
        <Pressable
          onPress={() => {
            const first = mockConversations[0];
            if (first) navigation.navigate('Chat', { conversationId: first.id });
          }}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.iconBtnPressed]}
        >
          <Icon name="MessageCircle" size={20} color={semantic.textPrimary} />
        </Pressable>
      </View>

      {/* Quick action bento */}
      <View style={styles.bentoRow}>
        <Card
          variant="elevated"
          padding="lg"
          onPress={() => navigation.navigate('BookAppointment')}
          style={styles.bentoTile}
        >
          <View style={styles.bentoTileRow}>
            <View style={styles.bentoIcon}>
              <Icon name="CalendarPlus" size={22} color={semantic.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>จองนัดคลินิก</Text>
              <Text variant="caption" color={semantic.textSecondary}>
                ตรวจ · วัคซีน · อาบน้ำ
              </Text>
            </View>
          </View>
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
      <Text
        variant="overline"
        color={semantic.textSecondary}
        style={styles.sectionLabel}
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
          {vets.map((v) => {
            const onChat = () => {
              const existing = mockConversations.find((c) => c.vetId === v.id);
              navigation.navigate('Chat', {
                conversationId: existing?.id ?? `new-${v.id}`,
                vetId: v.id,
              });
            };
            return (
              <Card
                key={v.id}
                variant="elevated"
                padding="md"
                onPress={() => navigation.navigate('VetDetail', { vetId: v.id })}
              >
                {/* Top: avatar + name + chips */}
                <View style={styles.vetTopRow}>
                  <View style={styles.vetAvatar}>
                    <Image source={{ uri: v.avatar }} style={styles.vetAvatarImg} />
                    <View style={[styles.statusDot, { backgroundColor: '#4FB36C' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
                      {v.name}
                    </Text>
                    <View style={styles.chipRow}>
                      <ChipItem icon="Stethoscope" label={v.specialty} />
                      <ChipItem icon="Briefcase" label={`${v.experienceYears} ปี`} />
                      <ChipItem icon="MapPin" label={v.clinic} />
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Bottom: info left + 2 icon buttons right */}
                <View style={styles.vetBottomRow}>
                  <View style={styles.vetBottomInfo}>
                    <View style={styles.bottomInfoLine}>
                      <Icon name="Clock" size={11} color={semantic.textMuted} strokeWidth={2} />
                      <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                        จ.-ส. 09:00 - 18:00 น.
                      </Text>
                    </View>
                    <View style={styles.bottomInfoLine}>
                      <Icon name="Star" size={10} color="#D99A20" fill="#D99A20" />
                      <Text variant="caption" color={semantic.textMuted}>
                        {v.rating} ({v.reviewCount} Review)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.iconBtnRow}>
                    <Pressable onPress={onChat} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
                      <Icon name="MessageCircle" size={20} color={semantic.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => navigation.navigate('BookTeleVet')}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                    >
                      <Icon name="CalendarPlus" size={20} color={semantic.primary} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </>
  );
}

function ChipItem({
  icon,
  label,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
}) {
  return (
    <View style={styles.chipItem}>
      <Icon name={icon} size={11} color={semantic.textMuted} strokeWidth={2} />
      <Text variant="caption" color={semantic.textSecondary} numberOfLines={1} style={{ fontSize: 10 }}>
        {label}
      </Text>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
  bentoTileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bentoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.xl,
    gap: 2,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
    borderColor: semantic.surface,
  },
  vetTopRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: semantic.border,
    marginVertical: spacing.sm,
  },
  vetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vetBottomInfo: {
    flex: 1,
    gap: 4,
  },
  bottomInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
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
