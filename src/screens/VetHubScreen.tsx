import { ComponentProps, useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarCompact } from '../navigation/tabBarVisibility';
import { useResponsiveScale } from '../lib/responsive';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card, Icon, SkeletonBox, SkeletonShimmer, Text, useSkeletonShimmer } from '../components';
import { colors, radii, semantic, spacing } from '../theme';
import { Appointment, typeMeta, MOCK_VETS } from '../data/appointments';
import { useAppointments } from '../data/appointmentsContext';
import { mockPets } from '../data/pets';
import { mockVets, mockConversations, TeleVet } from '../data/televet';

import { isVideoCallActive } from '../lib/appointmentTime';

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
const PET_DRIVE_IMG = require('../../assets/Pet-drive.png');
const PET_VIDEOCALL_IMG = require('../../assets/Pet-videocall.png');
const VET_HERO_IMG = require('../../assets/Hero-VetPage.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Vet'>;

type Tab = 'upcoming' | 'online';

const FADE_START = 30;
const FADE_END = 90;
const HERO_HEIGHT = 220;

export default function VetHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('upcoming');

  const { appointments } = useAppointments();
  const upcoming = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const past = appointments
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

  const scale = useResponsiveScale();
  const shimmerStyle = useSkeletonShimmer();

  // Tick once a minute so video call buttons auto-enable when the
  // 15-min window opens / closes, without per-card intervals.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* HERO — bg gradient + illustration right + text left (PetsList pattern) */}
        <View style={[styles.hero, { height: HERO_HEIGHT + insets.top, paddingTop: insets.top }]}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(225,236,245,0)', '#E1ECF5']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,253,251,0)', '#FFFDFB']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBottomFade}
          />
          <Image source={VET_HERO_IMG} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.heroText}>
            <Text
              variant="bodyStrong"
              style={[
                styles.heroTitle,
                {
                  fontSize: Math.max(22, Math.min(32, windowWidth * 0.07)),
                  lineHeight: Math.max(34, Math.min(46, windowWidth * 0.1)),
                },
              ]}
            >
              สัตวแพทย์
            </Text>
            <Text
              variant="caption"
              color={semantic.textSecondary}
              style={[
                styles.heroSubtitle,
                {
                  fontSize: Math.max(13, Math.min(17, windowWidth * 0.04)),
                  lineHeight: Math.max(24, Math.min(30, windowWidth * 0.07)),
                },
              ]}
            >
              นัดหมาย ปรึกษาออนไลน์{'\n'}และประวัติการรักษา
            </Text>
          </View>
        </View>

        {/* SHEET — rounded-top white surface for the rest of content */}
        <View
          style={[
            styles.sheet,
            { minHeight: windowHeight - HERO_HEIGHT - insets.top + 24 },
          ]}
        >
          {/* CTA row — big pill + chat icon */}
          <View style={styles.addWrap}>
            <Pressable
              onPress={() => navigation.navigate('BookAppointment')}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="จองนัดหมาย"
            >
              <Icon name="CalendarPlus" size={18} color={semantic.onPrimary} strokeWidth={2.4} />
              <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.addBtnText}>
                จองนัดหมาย
              </Text>
            </Pressable>
            <Pressable
              onPress={onChatPress}
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.iconBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="ประวัติแชท"
            >
              <Icon name="MessageCircle" size={20} color={semantic.textPrimary} />
            </Pressable>
          </View>

      {/* Quick action bento — 2 cards per Figma */}
      <View style={styles.bentoRow}>
        {false && (
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
        )}

        <Pressable
          onPress={() => {
            if (upcoming[0]) {
              navigation.navigate('AppointmentDetail', { appointmentId: upcoming[0].id });
            } else {
              // No upcoming → bento becomes "book first appointment" CTA.
              navigation.navigate('BookAppointment');
            }
          }}
          accessibilityLabel={upcoming[0] ? 'นัดที่กำลังจะถึง' : 'จองนัดแรก'}
          style={({ pressed }) => [
            styles.bentoTile,
            styles.bentoCard,
            pressed && styles.bentoCardPressed,
          ]}
        >
          <LinearGradient
            colors={['#FFE9A0', '#F5C26B', '#E0A23C']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.bentoCardInner, { height: 104 * scale }]}>
            <Svg
              width={220}
              height={220}
              viewBox="0 0 200 200"
              style={styles.bentoEllipseGlow}
              pointerEvents="none"
            >
              <Defs>
                <RadialGradient id="glowRG" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                  <Stop offset="60%" stopColor="#FFE7A0" stopOpacity="0.25" />
                  <Stop offset="100%" stopColor="#FFE7A0" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="100" cy="100" r="100" fill="url(#glowRG)" />
            </Svg>
            <View style={[styles.bentoTextCol, { paddingRight: 92 * scale }]}>
              <Text
                variant="caption"
                color="rgba(76,29,5,0.7)"
                style={[styles.bentoEyebrow, { fontSize: 13 * scale }]}
                numberOfLines={1}
              >
                นัดที่กำลังจะถึง
              </Text>
              {upcoming[0] ? (
                <>
                  <Text
                    variant="bodyStrong"
                    style={[styles.bentoHero, { fontSize: 20 * scale, lineHeight: 28 * scale }]}
                    color="#5C2D05"
                    numberOfLines={1}
                  >
                    {upcoming[0].typeLabel}
                  </Text>
                  <Text
                    variant="bodyStrong"
                    color="#7C2D12"
                    style={[styles.bentoSubtext, { fontSize: 14 * scale, lineHeight: 18 * scale }]}
                    numberOfLines={1}
                  >
                    {thDateLong(upcoming[0].dateISO)} · {upcoming[0].time}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    variant="bodyStrong"
                    style={[styles.bentoHero, { fontSize: 20 * scale, lineHeight: 28 * scale }]}
                    numberOfLines={1}
                    color="#5C2D05"
                  >
                    จองนัดแรก
                  </Text>
                  <Text
                    variant="bodyStrong"
                    color="#7C2D12"
                    style={[styles.bentoSubtext, { fontSize: 14 * scale, lineHeight: 18 * scale }]}
                    numberOfLines={1}
                  >
                    แตะเพื่อจองนัดหมาย
                  </Text>
                </>
              )}
            </View>
            <Image
              source={PET_COMING_SOON_IMG}
              style={[
                styles.bentoMascotComingSoon,
                { width: 107 * scale, height: 118 * scale },
              ]}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </View>

      {loading ? (
        <UpcomingTabSkeleton shimmerStyle={shimmerStyle} />
      ) : (
        <UpcomingTab
          appointments={[...upcoming, ...past]}
          navigation={navigation}
          scale={scale}
          nowMs={nowMs}
        />
      )}
        </View>
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

function UpcomingTabSkeleton({
  shimmerStyle,
}: {
  shimmerStyle: ReturnType<typeof useSkeletonShimmer>;
}) {
  return (
    <View style={styles.upcomingWrap}>
      <View style={styles.monthHeader}>
        <SkeletonBox width={140} height={18} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SkeletonBox width={32} height={32} radius={16} />
          <SkeletonBox width={32} height={32} radius={16} />
        </View>
      </View>
      {Array.from({ length: 2 }).map((_, gi) => (
        <View key={`grp-${gi}`} style={styles.dateGroup}>
          <View style={styles.dateHeader}>
            <SkeletonBox width={80} height={12} />
            <View style={[styles.dateBigRow, { marginTop: 6, gap: 8 }]}>
              <SkeletonBox width={42} height={32} radius={8} />
              <SkeletonBox width={120} height={12} />
            </View>
          </View>
          <View style={styles.list}>
            {Array.from({ length: 2 }).map((_, ci) => (
              <View key={`row-${gi}-${ci}`} style={styles.apptItemRow}>
                <View style={styles.skelTimeBox}>
                  <SkeletonBox width={36} height={12} />
                  <SkeletonBox width={30} height={10} />
                </View>
                <View style={[styles.skelApptCard, { flex: 1 }]}>
                  <View style={styles.skelApptTop}>
                    <SkeletonBox width="55%" height={14} light />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <SkeletonBox width={70} height={10} light />
                      <SkeletonBox width={50} height={10} light />
                    </View>
                  </View>
                  <View style={styles.skelApptBottom}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <SkeletonBox width="40%" height={10} />
                      <SkeletonBox width="70%" height={10} />
                    </View>
                    <SkeletonBox width={36} height={36} radius={18} />
                  </View>
                  <SkeletonShimmer shimmerStyle={shimmerStyle} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
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
  scale,
  nowMs,
}: {
  appointments: Appointment[];
  navigation: Props['navigation'];
  scale: number;
  nowMs: number;
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
              {items.map((a) => {
                const isHistory = a.status !== 'upcoming';
                const theme = isHistory
                  ? getMutedTheme()
                  : getApptTheme(a.type === 'consultation');
                return (
                  <View key={a.id} style={styles.apptItemRow}>
                    <TimeBox time={a.time} theme={theme} scale={scale} />
                    <View style={{ flex: 1 }}>
                      <AppointmentCardNew
                        appointment={a}
                        navigation={navigation}
                        theme={theme}
                        isHistory={isHistory}
                        scale={scale}
                        nowMs={nowMs}
                      />
                    </View>
                  </View>
                );
              })}
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

type ApptTheme = {
  darkBg: string;
  darkText: string;
  lightBg: string;
  lightBorder: string;
  tintBg: string;
  glowAccent: string;
  timeGlow: string;
};

const getApptTheme = (isOnline: boolean): ApptTheme =>
  isOnline
    ? {
        darkBg: colors.ocean[900],
        darkText: colors.ocean[700],
        lightBg: colors.ocean[100],
        lightBorder: colors.ocean[200],
        tintBg: '#FFFFFF',
        glowAccent: colors.ocean[700],
        timeGlow: colors.ocean[50],
      }
    : {
        darkBg: colors.rose[900],
        darkText: colors.rose[700],
        lightBg: colors.rose[100],
        lightBorder: colors.rose[200],
        tintBg: '#FFFFFF',
        glowAccent: colors.rose[700],
        timeGlow: colors.rose[50],
      };

const getMutedTheme = (): ApptTheme => ({
  darkBg: colors.neutral[600],
  darkText: colors.neutral[600],
  lightBg: colors.neutral[100],
  lightBorder: colors.neutral[200],
  tintBg: '#FFFFFF',
  glowAccent: colors.neutral[500],
  timeGlow: colors.neutral[100],
});

function TimeBox({
  time,
  theme,
  scale = 1,
}: {
  time: string;
  theme: ApptTheme;
  scale?: number;
}) {
  const glowId = `timeGlow-${theme.timeGlow.replace('#', '')}`;
  const size = 56 * scale;
  return (
    <View
      style={[
        styles.timeBox,
        { backgroundColor: theme.tintBg, width: size, height: size, borderRadius: 24 * scale },
      ]}
    >
      <Svg
        width={147}
        height={147}
        style={styles.timeBoxGlow}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.timeGlow} stopOpacity="0.7" />
            <Stop offset="55%" stopColor={theme.timeGlow} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={theme.timeGlow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="73.5" cy="73.5" r="73.5" fill={`url(#${glowId})`} />
      </Svg>
      <Icon name="Clock" size={16 * scale} color={semantic.textPrimary} strokeWidth={2} />
      <Text variant="bodyStrong" style={[styles.timeBoxText, { fontSize: 14 * scale }]}>
        {time}
      </Text>
    </View>
  );
}

function AppointmentCardNew({
  appointment,
  navigation,
  theme,
  isHistory = false,
  scale = 1,
  nowMs = Date.now(),
}: {
  appointment: Appointment;
  navigation: Props['navigation'];
  theme: ApptTheme;
  isHistory?: boolean;
  scale?: number;
  nowMs?: number;
}) {
  const pet = mockPets.find((p) => p.id === appointment.petId);
  const vet = MOCK_VETS.find((v) => v.name === appointment.vetName);
  const ageYears = pet ? computeAge(pet.birthDate) : null;
  const sexLabel = pet?.gender === 'male' ? 'ชาย' : pet?.gender === 'female' ? 'หญิง' : '';
  const meta = typeMeta[appointment.type];

  const isOnline = appointment.type === 'consultation';
  const canVideoCall = isOnline && !isHistory && isVideoCallActive(appointment, nowMs);
  const speciesIcon =
    pet?.species === 'dog' ? 'Dog' : pet?.species === 'cat' ? 'Cat' : 'PawPrint';

  const onCardPress = () =>
    navigation.navigate('AppointmentDetail', { appointmentId: appointment.id });
  const teleVet = mockVets.find((v) => v.name.startsWith(appointment.vetName));
  const onChat = () => {
    if (!teleVet) return;
    const existing = mockConversations.find((c) => c.vetId === teleVet.id);
    navigation.navigate('Chat', {
      conversationId: existing?.id ?? `new-${teleVet.id}`,
      vetId: teleVet.id,
      appointmentId: appointment.id,
    });
  };
  const onVideoCall = () => {
    const target = teleVet ?? mockVets[0];
    if (target) navigation.navigate('VideoCall', { vetId: target.id });
  };
  const onOpenClinicMap = () => {
    const q = encodeURIComponent(appointment.clinicName);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(
      () => {},
    );
  };

  const petImage = isOnline ? PET_VIDEOCALL_IMG : PET_DRIVE_IMG;

  return (
    <Pressable
      onPress={onCardPress}
      style={({ pressed }) => [styles.apptCardOuter, pressed && styles.apptCardPressed]}
    >
      <View style={styles.apptCard}>
      {/* Top: dark colored portion — clinic avatar + name + chips */}
      <View style={styles.apptCardTopShadow}>
      <View style={[styles.apptCardTop, { backgroundColor: theme.darkBg }]}>
        <Image
          source={petImage}
          style={[
            isOnline ? styles.apptPetImageOnline : styles.apptPetImage,
            isOnline
              ? { width: 86 * scale, height: 95 * scale }
              : { width: 74 * scale, height: 82 * scale },
          ]}
          resizeMode="contain"
        />
        <Svg
          width={147}
          height={147}
          style={styles.apptCardTopGlow}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient
              id={`cardGlow-${theme.glowAccent.replace('#', '')}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0%" stopColor={theme.glowAccent} stopOpacity="0.95" />
              <Stop offset="55%" stopColor={theme.glowAccent} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={theme.glowAccent} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx="73.5"
            cy="73.5"
            r="73.5"
            fill={`url(#cardGlow-${theme.glowAccent.replace('#', '')})`}
          />
        </Svg>
        <View style={[styles.vetTopRow, styles.vetTopRowWithImage, { paddingRight: 64 * scale }]}>
          <View style={{ flex: 1 }}>
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={[styles.apptCardTitleInverse, { fontSize: 14 * scale }]}
            >
              {appointment.clinicName}
            </Text>
            <View style={styles.chipRow}>
              <ChipItem icon="UserRound" label={appointment.vetName} inverse scale={scale} />
              <ChipItem icon={meta.icon as any} label={appointment.typeLabel} inverse scale={scale} />
            </View>
          </View>
        </View>
      </View>
      </View>

      {/* Bottom: white portion — pet info chips + actions */}
      <View style={styles.apptCardBottom}>
        <View style={styles.vetBottomRow}>
          <View style={styles.vetBottomInfo}>
            <View style={styles.petInfoRow}>
              <PetInfoItem
                icon="PawPrint"
                label="ชื่อ"
                value={`น้อง${appointment.petName}`}
                scale={scale}
              />
              {pet?.speciesLabel ? (
                <>
                  <View style={styles.petInfoDivider} />
                  <PetInfoItem icon={speciesIcon} label="ชนิด" value={pet.speciesLabel} scale={scale} />
                </>
              ) : null}
              {sexLabel ? (
                <>
                  <View style={styles.petInfoDivider} />
                  <PetInfoItem
                    icon={pet?.gender === 'male' ? 'Mars' : 'Venus'}
                    label="เพศ"
                    value={sexLabel}
                    scale={scale}
                  />
                </>
              ) : null}
              {ageYears !== null ? (
                <>
                  <View style={styles.petInfoDivider} />
                  <PetInfoItem icon="Cake" label="อายุ" value={`${ageYears} ปี`} scale={scale} />
                </>
              ) : null}
            </View>
          </View>
          <View style={styles.iconBtnRow}>
            {isOnline ? (
              <>
                <Pressable
                  onPress={onChat}
                  hitSlop={8}
                  accessibilityLabel={`แชทกับ ${appointment.vetName}`}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { backgroundColor: theme.lightBg, width: 32 * scale, height: 32 * scale },
                    pressed && styles.iconBtnPressed,
                  ]}
                >
                  <Icon name="MessageCircle" size={16 * scale} color={theme.darkBg} strokeWidth={2.5} />
                </Pressable>
                {!isHistory && (
                  <Pressable
                    onPress={canVideoCall ? onVideoCall : undefined}
                    disabled={!canVideoCall}
                    hitSlop={8}
                    accessibilityLabel="วิดีโอคอลสัตวแพทย์"
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.lightBg, width: 32 * scale, height: 32 * scale },
                      !canVideoCall && styles.iconBtnDisabled,
                      pressed && canVideoCall && styles.iconBtnPressed,
                    ]}
                  >
                    <Icon
                      name="Video"
                      size={18 * scale}
                      color={canVideoCall ? theme.darkBg : semantic.textMuted}
                    />
                  </Pressable>
                )}
              </>
            ) : (
              <Pressable
                onPress={onOpenClinicMap}
                hitSlop={8}
                accessibilityLabel={`เปิดแผนที่ ${appointment.clinicName}`}
                style={({ pressed }) => [
                  styles.iconBtn,
                  { backgroundColor: theme.lightBg, width: 32 * scale, height: 32 * scale },
                  pressed && styles.iconBtnPressed,
                ]}
              >
                <Icon name="MapPin" size={18 * scale} color={theme.darkBg} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
      </View>
    </Pressable>
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
              {items.map((a) => {
                const theme = getApptTheme(a.type === 'consultation');
                return (
                  <View key={a.id} style={styles.apptItemRow}>
                    <TimeBox time={a.time} theme={theme} />
                    <View style={{ flex: 1 }}>
                      <AppointmentCardNew
                        appointment={a}
                        navigation={navigation}
                        theme={theme}
                        isHistory
                      />
                    </View>
                  </View>
                );
              })}
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
                      <Icon name="MessageCircle" size={16} color={semantic.primary} strokeWidth={2.5} />
                    </Pressable>
                    <Pressable
                      onPress={() => navigation.navigate('BookTeleVet')}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                    >
                      <Icon name="CalendarPlus" size={18} color={semantic.primary} />
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

function PetInfoItem({
  icon,
  label,
  value,
  scale = 1,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
  scale?: number;
}) {
  return (
    <View style={styles.petInfoItem}>
      <View style={styles.petInfoLabelRow}>
        <Icon name={icon} size={11 * scale} color={semantic.textMuted} strokeWidth={2} />
        <Text style={[styles.petInfoLabel, { fontSize: 10 * scale }]}>{label}</Text>
      </View>
      <Text style={[styles.petInfoValue, { fontSize: 10 * scale }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ChipItem({
  icon,
  label,
  inverse = false,
  scale = 1,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  inverse?: boolean;
  scale?: number;
}) {
  const iconColor = inverse ? 'rgba(255,255,255,0.85)' : semantic.textMuted;
  const textColor = inverse ? 'rgba(255,255,255,0.95)' : semantic.textSecondary;
  return (
    <View style={styles.chipItem}>
      <Icon name={icon} size={11 * scale} color={iconColor} strokeWidth={2} />
      <Text
        variant="caption"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.chipItemText, { fontSize: 10 * scale, color: textColor }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
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
  hero: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 37,
  },
  heroImage: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 60,
    width: 140,
    height: 140,
  },
  heroText: {
    paddingHorizontal: spacing.xl,
    width: 220,
    gap: spacing.sm,
  },
  heroTitle: {
    color: '#1A1A1F',
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#4A4A50',
  },
  sheet: {
    backgroundColor: semantic.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: spacing.xl,
    paddingBottom: 220,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 6,
  },
  addWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -24,
    marginBottom: spacing.lg,
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: semantic.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  addBtnText: {
    fontSize: 15,
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    backgroundColor: '#F5C26B',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#92400E',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
  bentoEyebrow: {
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bentoHero: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 4,
    includeFontPadding: false,
    paddingVertical: 2,
  },
  bentoSubtext: {
    fontSize: 14,
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
    right: -3,
    bottom: -15,
  },
  tabRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#F2F2F3',
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
  skelTimeBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#EFEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  skelApptCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  skelApptTop: {
    backgroundColor: '#D7D7DB',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  skelApptBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  apptItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  apptCardOuter: {
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  apptCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  apptCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.997 }],
  },
  apptPetImage: {
    position: 'absolute',
    right: 0,
    bottom: -20,
    width: 74,
    height: 82,
    zIndex: 5,
  },
  apptPetImageOnline: {
    position: 'absolute',
    right: -10,
    bottom: -30,
    width: 86,
    height: 95,
    zIndex: 5,
  },
  vetTopRowWithImage: {
    paddingRight: 64,
  },
  apptCardTopShadow: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  apptCardTop: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  apptCardTopGlow: {
    position: 'absolute',
    top: -42,
    right: -80,
  },
  apptCardBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  apptAvatarLight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptCardTitleInverse: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  petInfoRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: 4,
    overflow: 'hidden',
  },
  petInfoItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
  },
  petInfoDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  petInfoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  petInfoLabel: {
    fontSize: 10,
    color: semantic.textMuted,
    fontFamily: 'GoogleSans_400Regular',
  },
  petInfoValue: {
    fontSize: 10,
    color: semantic.textPrimary,
    fontFamily: 'GoogleSans_400Regular',
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
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  timeBoxGlow: {
    position: 'absolute',
    top: -0.5,
    right: -100.5,
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
    gap: spacing.sm,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnGhost: {
    backgroundColor: 'transparent',
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
