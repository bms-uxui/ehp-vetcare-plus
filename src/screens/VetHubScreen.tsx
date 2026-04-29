import { ComponentProps, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarCompact } from '../navigation/tabBarVisibility';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Card, Icon, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockAppointments, Appointment, typeMeta, MOCK_VETS } from '../data/appointments';
import { mockPets } from '../data/pets';
import { mockVets, mockConversations, TeleVet } from '../data/televet';

const isApptDayReached = (dateISO: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDay = new Date(dateISO);
  apptDay.setHours(0, 0, 0, 0);
  return apptDay.getTime() <= today.getTime();
};

const computeAge = (birthISO: string): number => {
  const now = new Date();
  const b = new Date(birthISO);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};

const thWeekdayLong = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { weekday: 'long' });
const thMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const thDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

const PET_BOOKING_IMG = require('../../assets/Pet-booking.png');
const PET_COMING_SOON_IMG = require('../../assets/Pet-coming soon.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Vet'>;

type Tab = 'upcoming' | 'online' | 'history';

const FADE_START = 30;
const FADE_END = 90;

export default function VetHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcoming = mockAppointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const past = mockAppointments
    .filter((a) => a.status !== 'upcoming')
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const onlineVets = mockVets.filter((v) => v.status === 'online');

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
    onBeginDrag: () => {
      tabBarCompact.value = withTiming(1, { duration: 180 });
    },
    onEndDrag: () => {
      tabBarCompact.value = withTiming(0, { duration: 220 });
    },
    onMomentumEnd: () => {
      tabBarCompact.value = withTiming(0, { duration: 220 });
    },
  });
  const barBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [FADE_START, FADE_END], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [FADE_START + 30, FADE_END], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [FADE_START + 30, FADE_END],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const onChatPress = () => navigation.navigate('ChatList');

  return (
    <View style={styles.root}>
      <AppBackground />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56 + 16, paddingBottom: 220 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero title — scrolls away */}
        <View style={styles.heroTitleWrap}>
          <View style={styles.heroTitleRow}>
            <Text variant="h1" style={styles.heroTitleFlex}>สัตวแพทย์</Text>
            <Pressable
              onPress={onChatPress}
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.iconBtnPressed]}
            >
              <Icon name="MessageCircle" size={20} color={semantic.textPrimary} />
            </Pressable>
          </View>
          <Text variant="body" color={semantic.textSecondary}>
            นัดหมาย ปรึกษาออนไลน์ และประวัติการรักษา
          </Text>
        </View>

      {/* Quick action bento — 2 cards per Figma */}
      <View style={styles.bentoRow}>
        <Card
          variant="elevated"
          padding={0}
          onPress={() => navigation.navigate('BookAppointment')}
          style={styles.bentoTile}
        >
          <View style={styles.bentoCardInner}>
            <View style={styles.bentoTextCol}>
              <Text variant="bodyStrong" style={styles.bentoTitle} numberOfLines={1}>
                จองนัดคลินิก
              </Text>
              <Text variant="caption" color={semantic.textSecondary} style={styles.bentoLabel}>
                การบริการ
              </Text>
              <Text variant="bodyStrong" style={styles.bentoBody} color={semantic.primary} numberOfLines={1}>
                ตรวจ
              </Text>
              <Text variant="bodyStrong" style={styles.bentoBody} numberOfLines={1}>
                ฉีดวัคซีน อาบน้ำ
              </Text>
            </View>
            <Image source={PET_BOOKING_IMG} style={styles.bentoMascotBooking} resizeMode="contain" />
          </View>
        </Card>

        <Pressable
          onPress={() => {
            if (upcoming[0]) {
              navigation.navigate('AppointmentDetail', { appointmentId: upcoming[0].id });
            }
          }}
          style={({ pressed }) => [
            styles.bentoTile,
            styles.bentoCard,
            pressed && styles.bentoCardPressed,
          ]}
        >
          <View style={styles.bentoCardInner}>
            <Svg
              width={200}
              height={200}
              viewBox="0 0 200 200"
              style={styles.bentoEllipseGlow}
              pointerEvents="none"
            >
              <Defs>
                <RadialGradient id="glowRG" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#9F1239" stopOpacity="0.35" />
                  <Stop offset="100%" stopColor="#9F1239" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="100" cy="100" r="100" fill="url(#glowRG)" />
            </Svg>
            <View style={styles.bentoTextCol}>
              <Text variant="bodyStrong" style={styles.bentoTitle} numberOfLines={1}>
                นัดที่กำลังจะถึง
              </Text>
              <Text variant="caption" color={semantic.textSecondary} style={styles.bentoLabel}>
                การบริการ
              </Text>
              {upcoming[0] ? (
                <>
                  <Text variant="bodyStrong" style={styles.bentoBody} color={semantic.primary} numberOfLines={1}>
                    {upcoming[0].typeLabel}
                  </Text>
                  <Text variant="bodyStrong" style={styles.bentoBody} numberOfLines={1}>
                    {thDateLong(upcoming[0].dateISO)}
                  </Text>
                </>
              ) : (
                <Text variant="bodyStrong" style={styles.bentoBody} numberOfLines={1} color={semantic.textMuted}>
                  ไม่มีนัด
                </Text>
              )}
            </View>
            <Image
              source={PET_COMING_SOON_IMG}
              style={styles.bentoMascotComingSoon}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TabBtn label="นัดหมาย" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabBtn label="สัตวแพทย์" active={tab === 'online'} onPress={() => setTab('online')} />
        <TabBtn label="ประวัติ" active={tab === 'history'} onPress={() => setTab('history')} />
      </View>

      {tab === 'upcoming' && (
        <UpcomingTab appointments={upcoming} navigation={navigation} />
      )}
      {tab === 'online' && (
        <OnlineTab vets={onlineVets} navigation={navigation} />
      )}
      {tab === 'history' && <HistoryTab appointments={past} navigation={navigation} />}
      </Animated.ScrollView>

      {/* Sticky AppBar — fades in on scroll */}
      <View
        pointerEvents="box-none"
        style={[styles.appbar, { paddingTop: insets.top, height: insets.top + 56 }]}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, barBgStyle]}>
          <BlurView
            intensity={80}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.barTint]} />
          <View style={styles.barHairline} />
        </Animated.View>

        <View style={styles.appbarContent}>
          <View style={styles.appbarPlaceholder} />
          <Animated.View pointerEvents="none" style={[styles.appbarTitleWrap, titleStyle]}>
            <Text variant="bodyStrong" style={styles.appbarTitle} numberOfLines={1}>
              สัตวแพทย์
            </Text>
          </Animated.View>
          <View style={styles.appbarPlaceholder} />
        </View>
      </View>
    </View>
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
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const first = appointments[0];
    const d = first ? new Date(first.dateISO) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const onPrev = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const onNext = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const monthFiltered = appointments.filter((a) => {
    const d = new Date(a.dateISO);
    return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
  });

  // Group appointments by date
  const grouped: Array<[string, Appointment[]]> = [];
  for (const a of monthFiltered) {
    const last = grouped[grouped.length - 1];
    if (last && last[0] === a.dateISO) last[1].push(a);
    else grouped.push([a.dateISO, [a]]);
  }

  return (
    <View style={styles.upcomingWrap}>
      <MonthHeader viewMonth={viewMonth} onPrev={onPrev} onNext={onNext} />
      {grouped.length === 0 ? (
        <Card variant="elevated" padding="2xl">
          <View style={styles.empty}>
            <Icon name="CalendarDays" size={48} color={semantic.textMuted} strokeWidth={1.5} />
            <Text variant="bodyStrong">ยังไม่มีนัดในเดือนนี้</Text>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              กดลูกศรเพื่อดูเดือนถัดไป
            </Text>
          </View>
        </Card>
      ) : (
        grouped.map(([dateISO, items]) => (
          <View key={dateISO} style={styles.dateGroup}>
            <DateSectionHeader dateISO={dateISO} />
            <View style={styles.list}>
              {items.map((a) => (
                <View key={a.id} style={styles.apptItemRow}>
                  <TimeBox time={a.time} />
                  <View style={{ flex: 1 }}>
                    <AppointmentCardNew appointment={a} navigation={navigation} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function MonthHeader({
  viewMonth,
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
}: {
  viewMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}) {
  return (
    <View style={styles.monthHeader}>
      <Text variant="bodyStrong" style={{ fontSize: 17 }}>
        {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      <View style={styles.monthNavRow}>
        <Pressable
          hitSlop={8}
          onPress={disablePrev ? undefined : onPrev}
          disabled={disablePrev}
          style={styles.monthNavBtn}
        >
          <Icon
            name="ChevronLeft"
            size={20}
            color={disablePrev ? semantic.textMuted : semantic.primary}
            strokeWidth={2.5}
          />
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={disableNext ? undefined : onNext}
          disabled={disableNext}
          style={styles.monthNavBtn}
        >
          <Icon
            name="ChevronRight"
            size={20}
            color={disableNext ? semantic.textMuted : semantic.primary}
            strokeWidth={2.5}
          />
        </Pressable>
      </View>
    </View>
  );
}

function DateSectionHeader({ dateISO }: { dateISO: string }) {
  const d = new Date(dateISO);
  const day = d.getDate().toString().padStart(2, '0');
  return (
    <View style={styles.dateHeader}>
      <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 12 }}>
        {thWeekdayLong(dateISO)} ที่
      </Text>
      <View style={styles.dateBigRow}>
        <Text style={styles.dateBig}>{day}</Text>
        <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 13 }}>
          {thMonthYear(dateISO)}
        </Text>
      </View>
    </View>
  );
}

function TimeBox({ time }: { time: string }) {
  return (
    <View style={styles.timeBox}>
      <Icon name="Clock" size={16} color={semantic.textPrimary} strokeWidth={2} />
      <Text variant="bodyStrong" style={styles.timeBoxText}>
        {time}
      </Text>
    </View>
  );
}

function AppointmentCardNew({
  appointment,
  navigation,
  isHistory = false,
}: {
  appointment: Appointment;
  navigation: Props['navigation'];
  isHistory?: boolean;
}) {
  const pet = mockPets.find((p) => p.id === appointment.petId);
  const vet = MOCK_VETS.find((v) => v.name === appointment.vetName);
  const ageYears = pet ? computeAge(pet.birthDate) : null;
  const sexLabel = pet?.gender === 'male' ? 'ชาย' : pet?.gender === 'female' ? 'หญิง' : '';
  const meta = typeMeta[appointment.type];

  const isOnline = appointment.type === 'consultation';
  const canVideoCall = isOnline && isApptDayReached(appointment.dateISO);
  const speciesIcon =
    pet?.species === 'dog' ? 'Dog' : pet?.species === 'cat' ? 'Cat' : 'PawPrint';

  const onCardPress = () =>
    navigation.navigate('AppointmentDetail', { appointmentId: appointment.id });
  const onChat = () => {
    const existing = mockConversations[0];
    if (existing) navigation.navigate('Chat', { conversationId: existing.id });
  };
  const onVideoCall = () => {
    const teleVet =
      mockVets.find((v) => v.name.startsWith(appointment.vetName)) ?? mockVets[0];
    if (teleVet) navigation.navigate('VideoCall', { vetId: teleVet.id });
  };

  return (
    <Card variant="elevated" padding="md" onPress={onCardPress}>
      {/* Top: clinic/online avatar + name + chips */}
      <View style={styles.vetTopRow}>
        <View style={styles.vetAvatar}>
          <Icon
            name={isOnline ? 'Video' : 'Hospital'}
            size={26}
            color={semantic.primary}
            strokeWidth={1.8}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
            {appointment.clinicName}
          </Text>
          <View style={styles.chipRow}>
            <ChipItem icon="UserRound" label={appointment.vetName} />
            {vet?.specialty ? <ChipItem icon="Stethoscope" label={vet.specialty} /> : null}
            <ChipItem icon={meta.icon as any} label={appointment.typeLabel} />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom: pet info (split into 2 lines) + pet avatar */}
      <View style={styles.vetBottomRow}>
        <View style={styles.vetBottomInfo}>
          <View style={styles.chipRow}>
            <ChipItem icon="PawPrint" label={`น้อง${appointment.petName}`} />
          </View>
          <View style={styles.chipRow}>
            {pet?.speciesLabel ? <ChipItem icon={speciesIcon} label={pet.speciesLabel} /> : null}
            {sexLabel ? <ChipItem icon="User" label={sexLabel} /> : null}
            {ageYears !== null ? <ChipItem icon="Cake" label={`${ageYears} ปี`} /> : null}
          </View>
        </View>
        <View style={styles.iconBtnRow}>
          {isOnline ? (
            <>
              <Pressable
                onPress={onChat}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              >
                <Icon name="MessageCircle" size={20} color={semantic.primary} />
              </Pressable>
              {!isHistory && (
                <Pressable
                  onPress={canVideoCall ? onVideoCall : undefined}
                  disabled={!canVideoCall}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    !canVideoCall && styles.iconBtnDisabled,
                    pressed && canVideoCall && styles.iconBtnPressed,
                  ]}
                >
                  <Icon
                    name="Video"
                    size={20}
                    color={canVideoCall ? semantic.primary : semantic.textMuted}
                  />
                </Pressable>
              )}
            </>
          ) : (
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            >
              <Icon name="MapPin" size={20} color={semantic.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
}

function HistoryTab({
  appointments,
  navigation,
}: {
  appointments: Appointment[];
  navigation: Props['navigation'];
}) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const first = appointments[0];
    const d = first ? new Date(first.dateISO) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const onPrev = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const onNext = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const monthFiltered = appointments.filter((a) => {
    const d = new Date(a.dateISO);
    return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
  });

  // Compute the latest history month — disable forward nav past it (no future history)
  const latestMonth = appointments.reduce<Date | null>((max, a) => {
    const d = new Date(a.dateISO);
    const m = new Date(d.getFullYear(), d.getMonth(), 1);
    if (!max || m.getTime() > max.getTime()) return m;
    return max;
  }, null);
  const disableNext = latestMonth ? viewMonth.getTime() >= latestMonth.getTime() : true;

  // Group by date (newest first — already sorted in caller)
  const grouped: Array<[string, Appointment[]]> = [];
  for (const a of monthFiltered) {
    const last = grouped[grouped.length - 1];
    if (last && last[0] === a.dateISO) last[1].push(a);
    else grouped.push([a.dateISO, [a]]);
  }

  return (
    <View style={styles.upcomingWrap}>
      <MonthHeader
        viewMonth={viewMonth}
        onPrev={onPrev}
        onNext={onNext}
        disableNext={disableNext}
      />
      {grouped.length === 0 ? (
        <Card variant="elevated" padding="2xl">
          <View style={styles.empty}>
            <Icon name="ClipboardList" size={48} color={semantic.textMuted} strokeWidth={1.5} />
            <Text variant="bodyStrong">ยังไม่มีประวัติในเดือนนี้</Text>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              กดลูกศรเพื่อดูเดือนอื่น
            </Text>
          </View>
        </Card>
      ) : (
        grouped.map(([dateISO, items]) => (
          <View key={dateISO} style={styles.dateGroup}>
            <DateSectionHeader dateISO={dateISO} />
            <View style={styles.list}>
              {items.map((a) => (
                <View key={a.id} style={styles.apptItemRow}>
                  <TimeBox time={a.time} />
                  <View style={{ flex: 1 }}>
                    <AppointmentCardNew
                      appointment={a}
                      navigation={navigation}
                      isHistory
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
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
      <Text
        variant="caption"
        color={semantic.textSecondary}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.chipItemText, { fontSize: 10 }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  heroTitleWrap: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitleFlex: {
    flex: 1,
  },
  appbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  appbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    height: 56,
  },
  appbarPlaceholder: {
    width: 44,
    height: 44,
  },
  appbarTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appbarTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    maxWidth: '60%',
    textAlign: 'center',
  },
  appbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barTint: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  barHairline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
  },
  bentoCard: {
    backgroundColor: '#FBF3F4',
    borderWidth: 1,
    borderColor: '#EBC9CF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5E303C',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bentoCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  bentoEllipseGlow: {
    position: 'absolute',
    right: -100,
    bottom: -100,
  },
  bentoCardInner: {
    height: 104,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bentoTextCol: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingRight: 92,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bentoTitle: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  bentoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  bentoBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  bentoMascotBooking: {
    position: 'absolute',
    width: 118,
    height: 130,
    right: -21,
    bottom: -35,
  },
  bentoMascotComingSoon: {
    position: 'absolute',
    width: 107,
    height: 118,
    right: -11,
    bottom: -31,
  },
  tabRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: semantic.surface,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.xl,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
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

  /* Upcoming tab — calendar/date/card per Figma */
  upcomingWrap: {
    gap: spacing.lg,
  },
  apptItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  timeBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#F5E4E7',
    overflow: 'hidden',
  },
  timeBoxText: {
    fontSize: 14,
    color: semantic.textPrimary,
  },
  petCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petCardAvatarImg: {
    width: '100%',
    height: '100%',
  },
  petCardAvatarEmoji: {
    fontSize: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  monthNavBtn: {
    padding: 4,
  },
  dateGroup: {
    gap: spacing.md,
  },
  dateHeader: {
    gap: 2,
  },
  dateBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  dateBig: {
    fontSize: 32,
    lineHeight: 32,
    fontFamily: 'GoogleSans_700Bold',
    color: semantic.textPrimary,
    includeFontPadding: false,
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
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    overflow: 'hidden',
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  chipItemText: {
    flexShrink: 1,
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
    gap: 0,
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
  iconBtnDisabled: {
    opacity: 0.4,
    backgroundColor: semantic.surfaceMuted,
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
