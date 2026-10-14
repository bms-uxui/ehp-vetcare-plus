import { useMemo, useState } from 'react';
import { Image, Pressable, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, FeGaussianBlur, Filter, RadialGradient, Rect, Stop } from 'react-native-svg';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Screen, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { colors, shadows, spacing } from '../theme';
import { mockPets, Pet, VaccineRecord } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'VaccineCard'>;

/** Days before nextDue at which a vaccine counts as "ใกล้ถึงกำหนด". */
const SOON_DAYS = 30;
const DAY_MS = 86_400_000;
/** A touch taller than ISO ID-1 (1.586) so the content can breathe. */
const CARD_RATIO = 1.42;

type Status = 'done' | 'soon' | 'overdue';

const STATUS: Record<Status, { label: string; fg: string; bg: string; dot: string }> = {
  done: { label: 'ครบแล้ว', fg: '#2F7A4B', bg: '#E4F4EA', dot: '#4FB36C' },
  soon: { label: 'ใกล้ถึงกำหนด', fg: '#9A5B12', bg: '#FCEFD9', dot: '#E8A23C' },
  overdue: { label: 'เลยกำหนด', fg: '#A63B37', bg: '#FBE3E2', dot: '#C25450' },
};

const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const daysUntil = (iso: string) =>
  Math.round((new Date(`${iso}T00:00:00`).getTime() - startOfToday()) / DAY_MS);

const vaccineStatus = (v: VaccineRecord): Status => {
  if (!v.nextDue) return 'done';
  const d = daysUntil(v.nextDue);
  if (d < 0) return 'overdue';
  if (d <= SOON_DAYS) return 'soon';
  return 'done';
};

/** Stable card number derived from the pet id, e.g. PW-2569-004821. */
const cardNumber = (pet: Pet) => {
  let h = 0;
  for (const c of pet.id + pet.name) h = (h * 31 + c.charCodeAt(0)) % 1_000_000;
  const beYear = new Date().getFullYear() + 543;
  return `PW-${beYear}-${String(h).padStart(6, '0')}`;
};

const formatChip = (id: string) => id.replace(/(\d{3})(?=\d)/g, '$1 ');

export default function VaccineCardScreen({ route, navigation }: Props) {
  const { petId } = route.params;
  const pet = mockPets.find((p) => p.id === petId);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - spacing.xl * 2, 460);
  const cardH = cardW / CARD_RATIO;
  /** 1 unit = 1pt on a 350pt-wide card; everything on the card scales with it. */
  const u = cardW / 350;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // ── 3D card: finger tilt + flip ──
  const flip = useSharedValue(0);
  const tiltX = useSharedValue(0); // deg, + = top edge away from viewer
  const tiltY = useSharedValue(0); // deg, + = right edge toward viewer
  const rotX = tiltX;
  const rotY = tiltY;

  const toggleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    flip.value = withTiming(flip.value > 0.5 ? 0 : 1, {
      duration: 760,
      easing: Easing.bezier(0.45, 0, 0.2, 1),
    });
  };

  const SPRING = { damping: 16, stiffness: 150, mass: 0.7 };
  const tiltTo = (x: number, y: number) => {
    'worklet';
    const nx = Math.min(Math.max(x / cardW, 0), 1) - 0.5;
    const ny = Math.min(Math.max(y / cardH, 0), 1) - 0.5;
    tiltY.value = withSpring(nx * 30, SPRING);
    tiltX.value = withSpring(-ny * 22, SPRING);
  };
  const release = () => {
    'worklet';
    tiltX.value = withSpring(0, SPRING);
    tiltY.value = withSpring(0, SPRING);
  };
  // Horizontal drags tilt the card; vertical drags fall through to the ScrollView.
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin((e) => tiltTo(e.x, e.y))
    .onUpdate((e) => tiltTo(e.x, e.y))
    .onFinalize(release);
  const tap = Gesture.Tap()
    .maxDuration(400)
    .onEnd(() => runOnJS(toggleFlip)());
  const cardGesture = Gesture.Race(pan, tap);

  // The whole card body (faces + edge + shadow) turns as one rigid object, and
  // lifts toward the viewer mid-flip like a card being turned over in hand.
  const tiltStyle = useAnimatedStyle(() => {
    const lift = Math.sin(Math.PI * flip.value);
    return {
      transform: [
        { perspective: 1100 },
        { translateY: -lift * 14 },
        { scale: 1 + lift * 0.05 },
        { rotateX: `${rotX.value - lift * 6}deg` },
        { rotateY: `${rotY.value + flip.value * 180}deg` },
      ],
    };
  });
  // Card thickness: the dark core peeks out on the edge facing away.
  const edgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rotY.value * 0.09 }, { translateY: 1 - rotX.value * 0.09 }],
  }));
  // iOS flattens child layers into the rotating parent, so backface culling on the
  // faces can't see the parent's angle — pick the visible face from the angle here.
  const frontShowing = useDerivedValue(
    () => Math.cos(((rotY.value + flip.value * 180) * Math.PI) / 180) >= 0,
  );
  const frontStyle = useAnimatedStyle(() => ({ opacity: frontShowing.value ? 1 : 0 }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: frontShowing.value ? 0 : 1,
    // Pre-mirrored so it reads correctly once the body has turned 180°.
    transform: [{ scaleX: -1 }],
  }));

  // Orientation of whichever face is visible, for lighting. nx/ny ≈ sin of the
  // tilt about the Y/X axes (−0.3…0.3 in practice); lift is 0→1→0 over a flip.
  const surface = useDerivedValue<Surface>(() => {
    const lift = Math.sin(Math.PI * flip.value);
    const ay = ((rotY.value + flip.value * 180) * Math.PI) / 180;
    const cy = Math.cos(ay);
    return {
      nx: cy >= 0 ? Math.sin(ay) : -Math.sin(ay),
      ny: Math.sin(((rotX.value - lift * 6) * Math.PI) / 180),
      lift,
      cosY: Math.abs(cy),
    };
  });
  // Floor shadows. Light sits above-left, so they fall down-right; they narrow as
  // the card turns edge-on and spread/fade as it lifts off the surface.
  const ambientShadowStyle = useAnimatedStyle(() => {
    const { nx, lift, cosY } = surface.value;
    return {
      opacity: 1 - lift * 0.45,
      transform: [
        { translateX: 8 + lift * 10 + nx * 26 },
        { translateY: 14 + lift * 22 },
        { scaleX: Math.max(cosY, 0.06) * (1 + lift * 0.08) },
        { scaleY: 1 + lift * 0.06 },
      ],
    };
  });
  const contactShadowStyle = useAnimatedStyle(() => {
    const { nx, lift, cosY } = surface.value;
    return {
      opacity: 1 - lift * 0.9,
      transform: [
        { translateX: 2 + nx * 10 },
        { translateY: 3 + lift * 8 },
        { scaleX: Math.max(cosY, 0.04) },
      ],
    };
  });

  const [filter, setFilter] = useState<'all' | Status>('all');

  const records = useMemo(
    () =>
      [...(pet?.vaccines ?? [])]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((v) => ({ ...v, status: vaccineStatus(v) })),
    [pet],
  );

  if (!pet) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบข้อมูลสัตว์เลี้ยง</Text>
      </Screen>
    );
  }

  const total = records.length;
  const upToDate = records.filter((r) => r.status !== 'overdue').length;
  const counts = {
    done: records.filter((r) => r.status === 'done').length,
    soon: records.filter((r) => r.status === 'soon').length,
    overdue: records.filter((r) => r.status === 'overdue').length,
  };
  // Next shot to act on: the earliest nextDue (overdue ones first, naturally).
  const next = records
    .filter((r) => r.nextDue)
    .sort((a, b) => a.nextDue!.localeCompare(b.nextDue!))[0];
  const nextDays = next?.nextDue ? daysUntil(next.nextDue) : undefined;
  const nextTone: Status =
    nextDays === undefined ? 'done' : nextDays < 0 ? 'overdue' : nextDays <= SOON_DAYS ? 'soon' : 'done';
  const nextPill =
    nextDays === undefined
      ? null
      : nextDays < 0
        ? `เลย ${-nextDays} วัน`
        : nextDays === 0
          ? 'วันนี้'
          : `อีก ${nextDays} วัน`;

  const cardNo = cardNumber(pet);
  const verifyUrl = `https://pawmely.app/verify/${cardNo}`;

  const onShare = () => {
    const lines = records.map(
      (r) => `• ${r.name} — ฉีด ${thDate(r.date)}${r.nextDue ? ` / ครั้งต่อไป ${thDate(r.nextDue)}` : ''}`,
    );
    Share.share({
      message: `บัตรวัคซีนดิจิทัล Pawmely\n${pet.name} (${pet.speciesLabel} · ${pet.breed})\nเลขบัตร ${cardNo}\n\n${lines.join('\n')}\n\nตรวจสอบ: ${verifyUrl}`,
    }).catch(() => {});
  };

  const radius = 16 * u;

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader
        title="บัตรวัคซีนดิจิทัล"
        onBack={() => navigation.goBack()}
        trailing={{ icon: 'Share2', onPress: onShare, accessibilityLabel: 'แชร์บัตรวัคซีน' }}
        scrollY={scrollY}
      />
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + HEADER_HEIGHT + spacing.xl, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── The card ── */}
        <Animated.View entering={FadeInDown.duration(420)} style={{ width: cardW, height: cardH, alignSelf: 'center' }}>
          <GestureDetector gesture={cardGesture}>
            <Animated.View
              style={{ width: cardW, height: cardH }}
              accessible
              accessibilityRole="button"
              accessibilityHint="แตะเพื่อพลิกบัตร"
            >
              <FloorShadow
                id="ambient"
                width={cardW}
                height={cardH}
                radius={radius}
                inset={0.05}
                blur={16}
                color="rgba(46,18,26,0.42)"
                style={ambientShadowStyle}
              />
              <FloorShadow
                id="contact"
                width={cardW}
                height={cardH}
                radius={radius}
                inset={0.02}
                blur={4}
                color="rgba(36,12,18,0.32)"
                style={contactShadowStyle}
              />
              {/* Own compositing group so iOS doesn't depth-sort the floor shadows
                  through the 3D-rotated card. */}
              <View collapsable={false} style={StyleSheet.absoluteFill}>
                <Animated.View style={[{ width: cardW, height: cardH }, tiltStyle]}>
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.edge, { borderRadius: radius }, edgeStyle]}
                  />
                  <Animated.View style={[styles.face, { borderRadius: radius }, frontStyle]}>
                    <CardFront
                      pet={pet}
                      u={u}
                      rotY={rotY}
                      status={{ upToDate, total, next, nextTone, nextPill }}
                    />
                    <Lighting surface={surface} width={cardW} height={cardH} radius={radius} />
                  </Animated.View>
                  <Animated.View style={[styles.face, { borderRadius: radius }, backStyle]}>
                    <CardBack pet={pet} u={u} cardNo={cardNo} verifyUrl={verifyUrl} />
                    <Lighting surface={surface} width={cardW} height={cardH} radius={radius} mirrored />
                  </Animated.View>
                </Animated.View>
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>

        <View style={styles.flipHint}>
          <Icon name="RefreshCw" size={13} color={colors.rose[400]} strokeWidth={2} />
          <Text variant="caption" style={styles.flipHintText}>
            แตะเพื่อพลิกบัตร · ลากนิ้วเพื่อเอียง
          </Text>
        </View>

        {/* ── History ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(420)}>
          <View style={styles.historyHead}>
            <View style={{ flex: 1 }}>
              <Text variant="h3" style={styles.historyTitle}>
                ประวัติการฉีดวัคซีน
              </Text>
              <Text variant="caption" style={styles.historySub}>
                ทั้งหมด {total} เข็ม · บันทึกโดยคลินิกในเครือข่าย
              </Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['all', 'done', 'soon', 'overdue'] as const).map((k) => {
              const active = filter === k;
              const n = k === 'all' ? total : counts[k];
              return (
                <Pressable
                  key={k}
                  hitSlop={6}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setFilter(k);
                  }}
                  style={styles.tab}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {k === 'all' ? 'ทั้งหมด' : STATUS[k].label}
                    <Text style={[styles.tabCount, active && { color: colors.rose[500] }]}> {n}</Text>
                  </Text>
                  <View style={[styles.tabLine, active && styles.tabLineActive]} />
                </Pressable>
              );
            })}
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Icon name="Syringe" size={26} color={colors.rose[400]} strokeWidth={1.8} />
              </View>
              <Text variant="bodyStrong" style={{ color: colors.neutral[700] }}>
                ยังไม่มีประวัติวัคซีน
              </Text>
              <Text variant="caption" style={{ color: colors.neutral[500], textAlign: 'center' }}>
                เมื่อคลินิกบันทึกการฉีดวัคซีน ข้อมูลจะแสดงบนบัตรนี้โดยอัตโนมัติ
              </Text>
            </View>
          ) : (
            <Animated.View layout={LinearTransition.duration(240)} style={styles.listCard}>
              {records
                .filter((r) => filter === 'all' || r.status === filter)
                .map((r, i) => (
                  <Animated.View
                    key={r.id}
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(160)}
                    layout={LinearTransition.duration(240)}
                    style={i > 0 && styles.listDivider}
                  >
                    <VaccineItem record={r} />
                  </Animated.View>
                ))}
              {filter !== 'all' && !records.some((r) => r.status === filter) && (
                <Animated.View entering={FadeIn.duration(220)} style={styles.filterEmpty}>
                  <Text variant="caption" style={{ color: colors.neutral[500] }}>
                    ไม่มีวัคซีนในสถานะ “{STATUS[filter].label}”
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}

          <View style={styles.verifyFoot}>
            <Icon name="ShieldCheck" size={14} color={colors.accent.mint} strokeWidth={2.2} />
            <Text variant="caption" style={styles.verifyFootText}>
              ข้อมูลทุกรายการบันทึกและยืนยันโดยคลินิกในเครือข่าย Pawmely
            </Text>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

/* ───────────────────────── Card faces ───────────────────────── */

const CARD_GRADIENT = ['#5A2A37', '#7E3E50', '#A35A6E'] as const;

/** Printed security pattern: fine concentric rings. */
function CardPattern({ u }: { u: number }) {
  const rings = [300, 250, 200, 150, 100];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {rings.map((d) => (
        <View
          key={d}
          style={[
            styles.ring,
            { width: d * u, height: d * u, right: (-d / 2 + 40) * u, top: (-d / 2 + 30) * u },
          ]}
        />
      ))}
    </View>
  );
}

type CardStatus = {
  upToDate: number;
  total: number;
  next?: VaccineRecord;
  nextTone: Status;
  nextPill: string | null;
};

function CardFront({
  pet,
  u,
  rotY,
  status,
}: {
  pet: Pet;
  u: number;
  rotY: SharedValue<number>;
  status: CardStatus;
}) {
  const f = (n: number) => n * u;
  const { upToDate, total, next, nextTone, nextPill } = status;
  return (
    <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.faceFill}>
      <CardPattern u={u} />
      <View style={{ flex: 1, paddingHorizontal: f(16), paddingVertical: f(15), justifyContent: 'space-between' }}>
        {/* Header */}
        <View style={styles.rowCenter}>
          <View style={[styles.logoTile, { width: f(22), height: f(22), borderRadius: f(6) }]}>
            <Image source={require('../../assets/Pawmely.png')} style={{ width: f(18), height: f(18) }} />
          </View>
          <View style={{ marginLeft: f(7), flex: 1 }}>
            <Text style={[styles.brand, { fontSize: f(12.5), lineHeight: f(15) }]}>Pawmely</Text>
            <Text style={[styles.kindEn, { fontSize: f(5.5), lineHeight: f(8), letterSpacing: f(1.2) }]}>
              PET VACCINATION CARD
            </Text>
          </View>
          <Text style={[styles.kind, { fontSize: f(10.5), lineHeight: f(14), marginRight: f(8) }]}>
            บัตรประจำตัววัคซีน
          </Text>
          <HoloSeal size={f(26)} rotY={rotY} />
        </View>

        {/* Identity */}
        <View>
          <View style={[styles.rowCenter, { gap: f(14) }]}>
            <View style={[styles.photo, { width: f(58), height: f(70), borderRadius: f(8) }]}>
              {pet.photo ? (
                <Image source={pet.photo} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ fontSize: f(30) }}>{pet.emoji}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.name, { fontSize: f(19), lineHeight: f(24) }]} numberOfLines={1}>
                {pet.name}
              </Text>
              <Text style={[styles.meta, { fontSize: f(8.5), lineHeight: f(12) }]} numberOfLines={1}>
                {pet.speciesLabel} · {pet.breed}
              </Text>
              <View style={[styles.rowTop, { marginTop: f(8), gap: f(18) }]}>
                <CardField u={u} label="เพศ" value={`${pet.gender === 'male' ? 'ผู้' : 'เมีย'}${pet.neutered ? ' · ทำหมัน' : ''}`} />
                <CardField u={u} label="วันเกิด" value={thDate(pet.birthDate)} />
                <CardField u={u} label="สี" value={pet.color?.trim() || '—'} />
              </View>
            </View>
          </View>
          <View style={[styles.rowCenter, { marginTop: f(10), gap: f(8) }]}>
            <Text style={[styles.chipLabel, { fontSize: f(5.5), lineHeight: f(8), letterSpacing: f(1) }]}>
              MICROCHIP NO.
            </Text>
            <Text style={[styles.embossed, { fontSize: f(13), lineHeight: f(17), letterSpacing: f(1.5) }]}>
              {pet.microchipId ? formatChip(pet.microchipId) : '— — —'}
            </Text>
          </View>
        </View>

        {/* Vaccine status strip */}
        <View style={[styles.strip, { borderRadius: f(12), paddingVertical: f(11), paddingHorizontal: f(14), gap: f(16) }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stripLabel, { fontSize: f(7), lineHeight: f(10), marginBottom: f(2) }]}>วัคซีนเป็นปัจจุบัน</Text>
            <Text style={[styles.stripValue, { fontSize: f(10.5), lineHeight: f(15) }]}>
              {upToDate} จาก {total} รายการ
            </Text>
            <View style={[styles.rowCenter, { gap: f(3), marginTop: f(8) }]}>
              {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: f(3.5),
                    borderRadius: f(2),
                    backgroundColor: i < upToDate ? colors.rose[500] : colors.rose[100],
                  }}
                />
              ))}
            </View>
          </View>
          <View style={styles.stripDivider} />
          <View style={{ flex: 1.25, minWidth: 0 }}>
            <Text style={[styles.stripLabel, { fontSize: f(7), lineHeight: f(10), marginBottom: f(2) }]}>เข็มถัดไป</Text>
            {next?.nextDue ? (
              <>
                <Text style={[styles.stripValue, { fontSize: f(10.5), lineHeight: f(15) }]} numberOfLines={1}>
                  {next.name.replace(/^วัคซีน/, '')}
                </Text>
                <View style={[styles.rowCenter, { gap: f(6), marginTop: f(3) }]}>
                  <Text style={[styles.stripDate, { fontSize: f(8), lineHeight: f(11) }]}>{thDate(next.nextDue)}</Text>
                  {nextPill && (
                    <View style={{ backgroundColor: STATUS[nextTone].bg, borderRadius: 999, paddingHorizontal: f(6), paddingVertical: f(1) }}>
                      <Text style={{ color: STATUS[nextTone].fg, fontSize: f(7.5), lineHeight: f(11), fontWeight: '700' }}>
                        {nextPill}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <Text style={[styles.stripValue, { fontSize: f(10.5), lineHeight: f(15) }]}>ไม่มีนัดเข็มถัดไป</Text>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function CardBack({ pet, u, cardNo, verifyUrl }: { pet: Pet; u: number; cardNo: string; verifyUrl: string }) {
  const f = (n: number) => n * u;
  return (
    <LinearGradient colors={CARD_GRADIENT} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.faceFill}>
      <CardPattern u={u} />
      {/* Magnetic stripe */}
      <LinearGradient
        colors={['#1E1215', '#2C1A1F', '#1A0F12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ marginTop: f(16), height: f(34) }}
      />
      <View style={[styles.rowCenter, { flex: 1, paddingHorizontal: f(16), gap: f(14) }]}>
        <View style={[styles.qrTile, { padding: f(6), borderRadius: f(8) }]}>
          <QRCode value={verifyUrl} size={f(76)} color={colors.rose[900]} backgroundColor="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.backTitle, { fontSize: f(12), lineHeight: f(17) }]}>สแกนเพื่อตรวจสอบประวัติวัคซีน</Text>
          <Text style={[styles.backBody, { fontSize: f(8.5), lineHeight: f(12) }]} numberOfLines={2}>
            คลินิกหรือโรงแรมสัตว์เลี้ยงสแกนเพื่อยืนยันวัคซีนของ {pet.name} แบบเรียลไทม์
          </Text>
          <View style={[styles.rowTop, { marginTop: f(6), gap: f(14) }]}>
            <CardField u={u} label="เลขที่บัตร" value={cardNo} />
            <CardField u={u} label="ออกบัตร" value={thDate(new Date().toISOString())} />
          </View>
        </View>
      </View>
      <Text style={[styles.legal, { fontSize: f(6.5), lineHeight: f(9), paddingHorizontal: f(16), paddingBottom: f(10) }]}>
        ออกโดย Pawmely · ข้อมูลบันทึกและยืนยันโดยคลินิกในเครือข่าย · pawmely.app/verify
      </Text>
    </LinearGradient>
  );
}

function CardField({ u, label, value }: { u: number; label: string; value: string }) {
  return (
    <View>
      <Text style={[styles.fieldLabel, { fontSize: 7.5 * u, lineHeight: 10 * u }]}>{label}</Text>
      <Text style={[styles.fieldValue, { fontSize: 10 * u, lineHeight: 14 * u }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** Round holographic security sticker — its rainbow foil slides as the card tilts. */
function HoloSeal({ size, rotY }: { size: number; rotY: SharedValue<number> }) {
  const foilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(rotY.value, [-18, 18], [-size * 1.2, 0], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <View style={[styles.seal, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: size * 2.2 }, foilStyle]}>
        <LinearGradient
          colors={['#F6C9D6', '#FCE7B0', '#C7F2E4', '#C6D2FF', '#EDC6FF', '#F6C9D6', '#FCE7B0']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[styles.sealInner, { borderRadius: size / 2 }]} />
      <Icon name="PawPrint" size={size * 0.48} color="rgba(94,48,60,0.55)" strokeWidth={2} />
    </View>
  );
}

type Surface = { nx: number; ny: number; lift: number; cosY: number };

/** Soft, edge-less shadow on the "floor": a blurred rounded rect drawn in SVG. */
function FloorShadow({
  id,
  width,
  height,
  radius,
  inset,
  blur,
  color,
  style,
}: {
  id: string;
  width: number;
  height: number;
  radius: number;
  /** Fraction of width/height the shadow shape is pulled in from the card edge. */
  inset: number;
  blur: number;
  color: string;
  style: ReturnType<typeof useAnimatedStyle>;
}) {
  const pad = blur * 3;
  const ix = width * inset;
  const iy = height * inset;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: -pad, top: -pad, width: width + pad * 2, height: height + pad * 2 }, style]}
    >
      <Svg width={width + pad * 2} height={height + pad * 2}>
        <Defs>
          <Filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation={blur} />
          </Filter>
        </Defs>
        <Rect
          x={pad + ix}
          y={pad + iy}
          width={width - ix * 2}
          height={height - iy * 2}
          rx={radius}
          fill={color}
          filter={`url(#${id})`}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Light on the card from a fixed lamp above-left of the viewer:
 * – diffuse: the face brightens when turned toward the lamp, darkens when away
 * – specular: a soft glare spot reflected on the laminate, sliding with the tilt
 * – a faint gloss streak + lit/shaded rims for the laminated edge
 */
function Lighting({
  surface,
  width,
  height,
  radius,
  mirrored = false,
}: {
  surface: SharedValue<Surface>;
  width: number;
  height: number;
  radius: number;
  /** Back face is drawn scaleX(-1); flip x so the light stays on the same side. */
  mirrored?: boolean;
}) {
  const sx = mirrored ? -1 : 1;
  const glare = Math.max(width, height) * 1.25;

  // Facing the lamp = right edge raised toward the viewer and top tipped back.
  const facing = (v: Surface) => {
    'worklet';
    return v.nx * 1.6 + v.ny * 1.3;
  };

  const litStyle = useAnimatedStyle(() => ({
    opacity: interpolate(facing(surface.value), [0, 0.45], [0.04, 0.22], Extrapolation.CLAMP),
  }));
  const shadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(facing(surface.value), [-0.45, 0], [0.34, 0.04], Extrapolation.CLAMP),
  }));
  const glareStyle = useAnimatedStyle(() => {
    const { nx, ny } = surface.value;
    // Reflection of an above-left lamp: starts near the top-left, slides opposite the tilt.
    const cx = width * 0.22 + nx * width * 2.4;
    const cy = height * 0.05 + ny * height * 2.6;
    return {
      opacity: interpolate(facing(surface.value), [-0.4, 0, 0.4], [0.12, 0.3, 0.55], Extrapolation.CLAMP),
      transform: [
        { translateX: sx * (cx - width / 2) + width / 2 - glare / 2 },
        { translateY: cy - glare / 2 },
      ],
    };
  });
  const streakStyle = useAnimatedStyle(() => {
    const { nx, ny } = surface.value;
    return {
      opacity: interpolate(Math.abs(nx) + Math.abs(ny), [0, 0.35], [0.08, 0.4], Extrapolation.CLAMP),
      transform: [
        { translateX: sx * interpolate(nx, [-0.3, 0.3], [-width * 0.8, width * 0.8], Extrapolation.CLAMP) },
        { rotate: `${sx * 24}deg` },
      ],
    };
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <Animated.View style={[StyleSheet.absoluteFill, litStyle]}>
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0)']}
          start={{ x: mirrored ? 1 : 0, y: 0 }}
          end={{ x: mirrored ? 0.2 : 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, shadeStyle]}>
        <LinearGradient
          colors={['rgba(20,6,10,0.2)', 'rgba(20,6,10,1)']}
          start={{ x: mirrored ? 1 : 0, y: 0 }}
          end={{ x: mirrored ? 0 : 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: glare, height: glare }, glareStyle]}>
        <Svg width={glare} height={glare}>
          <Defs>
            <RadialGradient id="glare" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.28" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={glare} height={glare} fill="url(#glare)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.gloss, { left: width * 0.5 - 80 }, streakStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Laminated edge: lit top rim, shaded bottom rim. */}
      <View style={[styles.bevel, { borderRadius: radius }]} />
    </View>
  );
}

/* ───────────────────────── History row ───────────────────────── */

function VaccineItem({ record }: { record: VaccineRecord & { status: Status } }) {
  const st = STATUS[record.status];
  const days = record.nextDue ? daysUntil(record.nextDue) : undefined;
  const remaining =
    days === undefined
      ? 'ไม่ต้องฉีดซ้ำ'
      : days < 0
        ? `เลย ${-days} วัน`
        : days === 0
          ? 'วันนี้'
          : `อีก ${days} วัน`;
  const meta = [record.clinic, record.lotNo && `Lot ${record.lotNo}`].filter(Boolean).join(' · ');

  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <Text style={styles.itemName} numberOfLines={1}>
          {record.name}
        </Text>
        <View style={[styles.itemDot, { backgroundColor: st.dot }]} />
        <Text style={[styles.itemStatus, { color: st.fg }]}>{st.label}</Text>
      </View>

      <View style={styles.itemDatesRow}>
        <Text style={styles.itemDates}>
          {thDate(record.date)}
          <Text style={styles.itemArrow}>{'  →  '}</Text>
          {record.nextDue ? thDate(record.nextDue) : '—'}
        </Text>
        <Text style={[styles.itemRemain, record.status !== 'done' && { color: st.fg }]}>{remaining}</Text>
      </View>

      {!!meta && (
        <Text style={styles.itemMeta} numberOfLines={1}>
          {meta}
        </Text>
      )}
    </View>
  );
}

/* ───────────────────────── Styles ───────────────────────── */

const WHITE_60 = 'rgba(255,255,255,0.6)';

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },

  // Card shell
  edge: { ...StyleSheet.absoluteFillObject, backgroundColor: '#2A1519' },
  face: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  faceFill: { flex: 1 },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  gloss: { position: 'absolute', top: -260, bottom: -260, width: 160 },
  bevel: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.32)',
    borderLeftColor: 'rgba(255,255,255,0.16)',
    borderRightColor: 'rgba(0,0,0,0.16)',
    borderBottomColor: 'rgba(0,0,0,0.3)',
  },

  // Card content
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start' },
  rowEnd: { flexDirection: 'row', alignItems: 'flex-end' },
  logoTile: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#FFFFFF', fontWeight: '700' },
  kind: { color: '#FFFFFF', fontWeight: '700' },
  kindEn: { color: WHITE_60, fontWeight: '600' },
  photo: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: colors.rose[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#FFFFFF', fontWeight: '700' },
  meta: { color: 'rgba(255,255,255,0.75)' },
  fieldLabel: { color: WHITE_60 },
  fieldValue: { color: '#FFFFFF', fontWeight: '600' },
  chipLabel: { color: WHITE_60, fontWeight: '600' },
  // Raised digits: light from top-left, dark lip bottom-right.
  embossed: {
    color: '#F6E7EA',
    fontWeight: '700',
    textShadowColor: 'rgba(30,10,16,0.55)',
    textShadowOffset: { width: 0.8, height: 1 },
    textShadowRadius: 0.6,
  },
  seal: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  sealInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderStyle: 'dashed',
  },
  qrTile: { backgroundColor: '#FFFFFF' },
  backTitle: { color: '#FFFFFF', fontWeight: '700' },
  backBody: { color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  legal: { color: 'rgba(255,255,255,0.45)' },

  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing['2xl'],
  },
  flipHintText: { color: colors.rose[400] },

  // Status strip (on card)
  strip: { flexDirection: 'row', backgroundColor: '#FFFFFF' },
  stripDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.neutral[300] },
  stripLabel: { color: colors.neutral[500] },
  stripValue: { color: colors.neutral[800], fontWeight: '700' },
  stripDate: { color: colors.neutral[600] },

  // History
  historyHead: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing['2xl'] },
  historyTitle: { color: colors.neutral[800] },
  historySub: { color: colors.neutral[500] },
  tabs: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  tab: { paddingTop: 4 },
  tabText: { fontSize: 13.5, lineHeight: 20, color: colors.neutral[400], fontWeight: '500' },
  tabTextActive: { color: colors.neutral[800], fontWeight: '700' },
  tabCount: { fontSize: 12, lineHeight: 20, color: colors.neutral[400] },
  tabLine: { height: 2, marginTop: 8, borderRadius: 1, backgroundColor: 'transparent' },
  tabLineActive: { backgroundColor: colors.rose[500] },
  filterEmpty: { alignItems: 'center', paddingVertical: spacing.xl },

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  listDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral[200] },
  item: { paddingVertical: 16 },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  itemName: { flex: 1, color: colors.neutral[800], fontSize: 15, lineHeight: 21, fontWeight: '600', marginRight: 10 },
  itemDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  itemStatus: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  itemDatesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemDates: { flex: 1, color: colors.neutral[500], fontSize: 12.5, lineHeight: 18 },
  itemArrow: { color: colors.neutral[300], fontSize: 12.5, lineHeight: 18 },
  itemRemain: { fontSize: 12, lineHeight: 18, color: colors.neutral[400], fontWeight: '600' },
  itemMeta: { marginTop: 6, color: colors.neutral[400], fontSize: 11.5, lineHeight: 16 },

  emptyCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    ...shadows.md,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.rose[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  verifyFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  verifyFootText: { color: colors.neutral[500], fontSize: 11.5, lineHeight: 16 },
});
