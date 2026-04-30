import { useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  SlideOutDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Screen, StickyAppBar, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockPets, Pet, VisitRecord } from '../data/pets';
import { FeedingSchedule, mockSchedules } from '../data/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'PetDetail'>;

const TAB_KEYS = ['general', 'health', 'vaccines', 'feeding'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_LABELS: Record<TabKey, string> = {
  general: 'ข้อมูลทั่วไป',
  health: 'ประวัติสุขภาพ',
  vaccines: 'ประวัติวัคซีน',
  feeding: 'เวลาให้อาหาร',
};

const RIPPLE = { color: 'rgba(184,106,124,0.18)', borderless: false } as const;

const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
const thDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

/** Full age string e.g. "3 ปี 2 เดือน 1 วัน". */
const petAgeFull = (birthDate: string): string => {
  const now = new Date();
  const b = new Date(birthDate);
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} ปี ${months} เดือน ${days} วัน`;
};

export default function PetDetailScreen({ route, navigation }: Props) {
  const { petId, flashMessage } = route.params;
  const [toast, setToast] = useState<string | null>(null);
  const lastFlashRef = useRef<string | undefined>(undefined);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!flashMessage || lastFlashRef.current === flashMessage) return;
    lastFlashRef.current = flashMessage;
    setToast(flashMessage);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      lastFlashRef.current = undefined;
    }, 5000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [flashMessage, navigation]);
  const initialPet = mockPets.find((p) => p.id === petId);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [tab, setTab] = useState<TabKey>('general');
  const tabIndex = TAB_KEYS.indexOf(tab);
  const [livePet, setLivePet] = useState<Pet | undefined>(initialPet);
  const [schedules, setSchedules] = useState<FeedingSchedule[]>(() =>
    mockSchedules.filter((s) => s.petId === petId),
  );
  const pet = livePet;
  const startEdit = () => {
    navigation.navigate('PetEdit', { petId });
  };
  const openMealEdit = (scheduleId?: string) => {
    navigation.navigate('MealTimeSetting', { petId, scheduleId });
  };
  useFocusEffect(
    useCallback(() => {
      setSchedules(mockSchedules.filter((s) => s.petId === petId));
      const refreshed = mockPets.find((p) => p.id === petId);
      if (refreshed) setLivePet({ ...refreshed });
    }, [petId]),
  );

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // bgHero scrolls up with content (translateY=-y) and stretches on pull-down
  // (anchored at top via transformOrigin so the image keeps filling the gap).
  const HERO_HEIGHT = 280;
  const heroStretchStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    if (y < 0) {
      const factor = 1 - y / HERO_HEIGHT;
      return { transform: [{ scaleX: factor }, { scaleY: factor }] };
    }
    return { transform: [{ translateY: -y }] };
  });

  // ── Horizontal pager sync ──
  const pagerRef = useRef<ScrollView>(null);
  const pagerDragging = useRef(false);
  useEffect(() => {
    if (pagerDragging.current) return;
    pagerRef.current?.scrollTo({ x: tabIndex * windowWidth, animated: true });
  }, [tabIndex, windowWidth]);
  const onPagerEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    pagerDragging.current = false;
    const idx = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
    const key = TAB_KEYS[idx];
    if (key && key !== tab) setTab(key);
  };

  // Per-tab measured height — pager container resizes to active page.
  const [pageHeights, setPageHeights] = useState<Partial<Record<TabKey, number>>>({});
  const onPageLayout = (key: TabKey) => (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    setPageHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
  };
  const activeHeight = pageHeights[tab];

  if (!pet) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบข้อมูลสัตว์เลี้ยง</Text>
      </Screen>
    );
  }

  const tabContent: Record<TabKey, React.ReactNode> = {
    general: (
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <InfoRow label="วันเกิด" value={thDate(pet.birthDate)} />
          <InfoRow label="สายพันธุ์" value={pet.breed} />
          <InfoRow label="น้ำหนัก" value={`${pet.weightKg} กก.`} />
          <InfoRow label="สี" value={pet.color} />
          <InfoRow label="เพศ" value={pet.gender === 'male' ? 'ผู้' : 'เมีย'} />
          {pet.microchipId && <InfoRow label="ไมโครชิป" value={pet.microchipId} />}
        </View>

        <View style={styles.neuterCard}>
          <View style={styles.neuterBody}>
            <Text variant="caption" style={styles.subtleLabel}>
              ประวัติการทำหมัน
            </Text>
            <Text variant="bodyStrong" style={styles.neuterTitle}>
              {pet.neutered ? 'ทำหมันแล้ว' : 'ยังไม่ได้ทำหมัน'}
            </Text>
            {pet.neutered && pet.neuteredDate && (
              <Text variant="caption" style={styles.subtleLabel}>
                เมื่อ {thDate(pet.neuteredDate)}
              </Text>
            )}
          </View>
          {pet.neutered && (
            <View style={styles.neuterFooter}>
              <Text variant="caption" style={styles.clinicText} numberOfLines={2}>
                ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.conditionWrap}>
            <Text variant="caption" style={styles.subtleLabel}>
              โรคประจำตัว
            </Text>
            <Text variant="bodyStrong" style={styles.conditionTitle}>
              {pet.conditions.length === 0
                ? 'ไม่มีโรคประจำตัว'
                : pet.conditions.map((c) => c.name).join(', ')}
            </Text>
          </View>
        </View>
      </View>
    ),

    health: (
      <View style={styles.content}>
        <WeightTrendCard pet={pet} />

        <View style={styles.infoCard}>
          <View style={styles.conditionWrap}>
            <Text variant="caption" style={styles.subtleLabel}>
              โรคประจำตัว / ภูมิแพ้
            </Text>
            {pet.conditions.length === 0 ? (
              <Text variant="bodyStrong" style={styles.conditionTitle}>
                ไม่มีโรคประจำตัว
              </Text>
            ) : (
              pet.conditions.map((c) => (
                <View key={c.id} style={{ gap: 2 }}>
                  <Text variant="bodyStrong" style={styles.conditionTitle}>
                    {c.name}
                  </Text>
                  <Text variant="caption" style={styles.subtleLabel}>
                    ตั้งแต่ {thDate(c.since)}
                    {c.notes ? ` · ${c.notes}` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Text variant="caption" style={[styles.subtleLabel, styles.sectionLabel]}>
          ประวัติการเข้ารับบริการ
        </Text>
        {!pet.visits || pet.visits.length === 0 ? (
          <View style={styles.infoCard}>
            <View style={styles.conditionWrap}>
              <Text variant="bodyStrong" style={styles.conditionTitle}>
                ยังไม่มีประวัติการรักษา
              </Text>
            </View>
          </View>
        ) : (
          [...pet.visits]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((v) => <VisitCard key={v.id} visit={v} />)
        )}
      </View>
    ),

    vaccines: (
      <View style={styles.content}>
        {pet.vaccines.length === 0 ? (
          <View style={styles.infoCard}>
            <View style={styles.conditionWrap}>
              <Text variant="bodyStrong" style={styles.conditionTitle}>
                ยังไม่มีประวัติวัคซีน
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.timelineWrap}>
              {[...pet.vaccines]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((v, i, arr) => {
                  const isFirst = i === 0;
                  const isLast = i === arr.length - 1;
                  const upcoming =
                    v.nextDue && v.nextDue >= new Date().toISOString().slice(0, 10);
                  return (
                    <View key={v.id} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineLineTop,
                            {
                              backgroundColor: isFirst
                                ? 'transparent'
                                : upcoming
                                  ? '#DDA8B2'
                                  : '#F5E4E7',
                            },
                          ]}
                        />
                        {upcoming && <View style={styles.timelineHalo} />}
                        <View
                          style={[
                            styles.timelineDot,
                            upcoming
                              ? { backgroundColor: '#9F5266' }
                              : { backgroundColor: '#EBC9CF' },
                          ]}
                        />
                        <View
                          style={[
                            styles.timelineLineBottom,
                            {
                              backgroundColor: isLast
                                ? 'transparent'
                                : upcoming
                                  ? '#DDA8B2'
                                  : '#F5E4E7',
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text
                          variant="caption"
                          style={[
                            styles.timelineDate,
                            upcoming && { color: '#9F5266', fontWeight: '700' },
                          ]}
                        >
                          {thDate(v.date)}
                        </Text>
                        <Text
                          variant="bodyStrong"
                          style={[
                            styles.timelineTitle,
                            upcoming && { color: '#9F5266' },
                          ]}
                        >
                          {v.name}
                        </Text>
                        {v.clinic && (
                          <Text
                            variant="caption"
                            style={styles.timelineClinic}
                            numberOfLines={2}
                          >
                            {v.clinic}
                          </Text>
                        )}
                        {v.nextDue && (
                          <View style={styles.timelineNextPill}>
                            <Text
                              variant="caption"
                              style={[
                                styles.timelineNext,
                                upcoming
                                  ? { color: '#9F5266', fontWeight: '700' }
                                  : { color: '#6E6E74' },
                              ]}
                            >
                              ครั้งถัดไป {thDate(v.nextDue)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}
      </View>
    ),

    feeding: (
      <View style={styles.content}>
        <Pressable
          onPress={() => openMealEdit()}
          style={({ pressed }) => [
            styles.feedAddCard,
            pressed && { opacity: 0.9 },
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,253,251,0)', 'rgba(244,201,210,0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.25, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.feedAddIllusSlot}>
            <Image
              source={require('../../assets/pet-meal-time.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <View style={styles.feedAddCardBody}>
            <Text variant="bodyStrong" style={styles.feedAddCardTitle}>
              ตั้งเวลาให้อาหารน้อง
            </Text>
            <Text variant="caption" style={styles.feedAddCardHint}>
              ไม่พลาดทุกมื้อสำคัญ ตั้งเตือนรายวันได้เลย
            </Text>
            <View style={styles.feedAddCardCta}>
              <Icon name="Plus" size={14} color="#FFFFFF" strokeWidth={2.6} />
              <Text variant="bodyStrong" style={styles.feedAddCardCtaText}>
                เพิ่ม
              </Text>
            </View>
          </View>
        </Pressable>

        {schedules.length === 0 ? (
          <View style={styles.infoCard}>
            <View style={styles.conditionWrap}>
              <Text variant="bodyStrong" style={styles.conditionTitle}>
                ยังไม่มีตารางให้อาหาร
              </Text>
              <Text variant="caption" style={styles.subtleLabel}>
                แตะการ์ดด้านบนเพื่อเพิ่มตารางใหม่
              </Text>
            </View>
          </View>
        ) : (
          schedules.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => openMealEdit(s.id)}
              android_ripple={RIPPLE}
              style={({ pressed }) => [
                styles.infoCard,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.feedRow}>
                <View style={styles.feedTimeWrap}>
                  <Text variant="bodyStrong" style={styles.feedTime}>
                    {s.time} น.
                  </Text>
                  <Text variant="caption" style={styles.subtleLabel}>
                    {s.type === 'food' ? 'อาหาร' : 'น้ำดื่ม'}
                    {s.enabled ? '' : ' · ปิด'}
                  </Text>
                </View>
                <View style={styles.feedDetail}>
                  <Text variant="bodyStrong" style={styles.feedAmount}>
                    {s.amount}
                  </Text>
                  {s.note && (
                    <Text variant="caption" style={styles.subtleLabel}>
                      {s.note}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    ),
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      {/* Fixed hero photo — sits behind the scroll. On overscroll the scroll
          content rubber-bands down, exposing this layer instead of white. */}
      {pet.photo && (
        <Animated.View
          pointerEvents="none"
          style={[styles.bgHeroWrap, heroStretchStyle]}
        >
          <Image source={pet.photo} style={styles.bgHeroImg} resizeMode="cover" />
        </Animated.View>
      )}

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── HERO BANNER (pet photo as full-bleed background) ── */}
        <Animated.View
          entering={FadeIn.duration(280)}
          style={[styles.hero, { paddingTop: insets.top + 64 }]}
        >
          {!pet.photo && (
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.heroFallback, heroStretchStyle]}
            >
              <Text style={{ fontSize: 96 }}>{pet.emoji}</Text>
            </Animated.View>
          )}

          {/* Bottom fade — blends into the AppBackground gradient at top */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,253,251,0)', '#FFFDFB']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBottomFade}
          />

          <Animated.View
            entering={FadeIn.delay(120).duration(280)}
            style={styles.heroText}
          >
            <Text
              variant="bodyStrong"
              style={[
                styles.petName,
                {
                  fontSize: Math.max(22, Math.min(32, windowWidth * 0.07)),
                  lineHeight: Math.max(34, Math.min(46, windowWidth * 0.1)),
                },
              ]}
            >
              น้อง{pet.name}
            </Text>
            <Text variant="caption" color={semantic.textSecondary} style={styles.petAge}>
              {petAgeFull(pet.birthDate)}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* ── TABS (horizontal scroll, overflow visible to the right) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TAB_KEYS.map((key) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                android_ripple={RIPPLE}
                style={({ pressed }) => [
                  styles.tab,
                  active ? styles.tabActive : styles.tabInactive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  variant="bodyStrong"
                  color={active ? semantic.onPrimary : '#9F5266'}
                  style={styles.tabText}
                  numberOfLines={1}
                >
                  {TAB_LABELS[key]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── CONTENT (horizontal pager — swipe to switch tab; height matches active tab) ── */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => {
            pagerDragging.current = true;
          }}
          onMomentumScrollEnd={onPagerEnd}
          style={activeHeight ? { height: activeHeight } : undefined}
        >
          {TAB_KEYS.map((key) => (
            <View key={key} style={{ width: windowWidth }}>
              <View onLayout={onPageLayout(key)}>{tabContent[key]}</View>
            </View>
          ))}
        </ScrollView>
      </Animated.ScrollView>

      {/* ── STICKY APP BAR (back + edit + title fades in) ── */}
      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={200}
        fadeEndAt={260}
        title={`น้อง${pet.name}`}
        leading={{
          icon: 'ChevronLeft',
          onPress: () => navigation.goBack(),
          accessibilityLabel: 'ย้อนกลับ',
        }}
        trailing={{
          icon: 'Pencil',
          onPress: startEdit,
          accessibilityLabel: 'แก้ไขข้อมูล',
        }}
      />

      <AiFab
        bottom={insets.bottom + spacing.xl}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: 'c-ai',
            vetId: 'tv-ai',
            aiMode: true,
            petId,
          })
        }
      />

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

// Animation timeline (absolute ms within one cycle).
// Long rest before each shake so the mascot doesn't loop too often.
const REST_BEFORE = 2000;
const SHAKE_MS = 600;
const POP_MS = 350;
const VISIBLE_MS = 1500;
const RETRACT_MS = 350;
const REST_AFTER = 1200;
const SHAKE_AT = REST_BEFORE;
const POP_AT = SHAKE_AT + SHAKE_MS;
const VIS_AT = POP_AT + POP_MS;
const RETRACT_AT = VIS_AT + VISIBLE_MS;
const END_AT = RETRACT_AT + RETRACT_MS;
const CYCLE_MS = END_AT + REST_AFTER;

function AiFab({ bottom, onPress }: { bottom: number; onPress: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [t]);

  const pawStyle = useAnimatedStyle(() => {
    'worklet';
    const ms = t.value * CYCLE_MS;
    let rot = 0;
    if (ms >= SHAKE_AT && ms < POP_AT) {
      const local = (ms - SHAKE_AT) / SHAKE_MS;
      rot = Math.sin(local * Math.PI * 6) * 14;
    }
    let opacity = 1;
    if (ms >= POP_AT && ms < VIS_AT) opacity = 1 - (ms - POP_AT) / POP_MS;
    else if (ms >= VIS_AT && ms < RETRACT_AT) opacity = 0;
    else if (ms >= RETRACT_AT && ms < END_AT) opacity = (ms - RETRACT_AT) / RETRACT_MS;
    return { opacity, transform: [{ rotate: `${rot}deg` }] };
  });

  const mascotStyle = useAnimatedStyle(() => {
    'worklet';
    const ms = t.value * CYCLE_MS;
    let scale = 0;
    let translateY = 8;
    if (ms >= POP_AT && ms < VIS_AT) {
      const local = (ms - POP_AT) / POP_MS;
      scale = local;
      translateY = 8 - 8 * local;
    } else if (ms >= VIS_AT && ms < RETRACT_AT) {
      scale = 1;
      const local = (ms - VIS_AT) / VISIBLE_MS;
      translateY = -2 - Math.sin(local * Math.PI * 3) * 2.5;
    } else if (ms >= RETRACT_AT && ms < END_AT) {
      const local = (ms - RETRACT_AT) / RETRACT_MS;
      scale = 1 - local;
      translateY = 8 * local;
    }
    return {
      opacity: scale,
      transform: [{ translateY }, { scale }],
    };
  });

  // Continuous slow breath for the aura behind the button.
  const auraStyle = useAnimatedStyle(() => {
    'worklet';
    const v = (Math.sin(t.value * Math.PI * 2) + 1) / 2; // 0..1
    return {
      opacity: 0.55 + v * 0.35,
      transform: [{ scale: 0.95 + v * 0.15 }],
    };
  });

  return (
    <View pointerEvents="box-none" style={[styles.fabWrap, { bottom }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.meowFabAura, styles.meowFabAuraCyan, auraStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.meowFabAura, styles.meowFabAuraPink, auraStyle]}
      />
      <View style={styles.meowFabBorder}>
        <LinearGradient
          pointerEvents="none"
          colors={['#7CD9F0', '#A78BFF', '#E08FE3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
        />
        <Pressable
          onPress={onPress}
          android_ripple={{ color: 'rgba(167,139,255,0.18)', borderless: false }}
          accessibilityLabel="คุยกับหมอเหมียว"
          style={({ pressed }) => [
            styles.meowFab,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text variant="bodyStrong" style={styles.meowFabLabel}>
            คุยกับหมอเหมียว
          </Text>
          <Animated.View style={[styles.meowFabPaw, pawStyle]}>
            <Icon name="PawPrint" size={18} color="#A78BFF" strokeWidth={2.4} />
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[styles.meowFabMascot, mascotStyle]}
          >
            <MascotSparkles t={t} />
            <Image
              source={require('../../assets/dr-meaw.png')}
              style={styles.meowFabMascotImg}
              resizeMode="contain"
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

function MascotSparkles({ t }: { t: ReturnType<typeof useSharedValue<number>> }) {
  // Three sparkles around the mascot with phase offsets, only visible while
  // the mascot is out (p ∈ [0.35, 0.75]).
  const positions: { top: number; left?: number; right?: number; phase: number; size: number }[] = [
    { top: -8, left: -10, phase: 0, size: 12 },
    { top: 10, right: -12, phase: 0.33, size: 10 },
    { top: -2, right: 8, phase: 0.66, size: 8 },
  ];
  return (
    <>
      {positions.map((pos, i) => (
        <Sparkle key={i} t={t} phase={pos.phase} top={pos.top} left={pos.left} right={pos.right} size={pos.size} />
      ))}
    </>
  );
}

function Sparkle({
  t,
  phase,
  top,
  left,
  right,
  size,
}: {
  t: ReturnType<typeof useSharedValue<number>>;
  phase: number;
  top: number;
  left?: number;
  right?: number;
  size: number;
}) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const ms = t.value * CYCLE_MS;
    if (ms < VIS_AT || ms >= RETRACT_AT) {
      return { opacity: 0, transform: [{ scale: 0 }] };
    }
    const local = (ms - VIS_AT) / VISIBLE_MS;
    // shift by phase, wrap to [0,1]
    const shifted = (local + phase) % 1;
    // Two pulses across the visible window
    const v = Math.sin(shifted * Math.PI * 2);
    const opacity = Math.max(0, v);
    const scale = 0.6 + opacity * 0.6;
    return { opacity, transform: [{ scale }] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.meowSparkle,
        { top, left, right },
        style,
      ]}
    >
      <Icon name="Sparkles" size={size} color="#C77BFF" strokeWidth={2.2} fill="#C77BFF" />
    </Animated.View>
  );
}

function VisitCard({ visit }: { visit: VisitRecord }) {
  const v = visit;
  return (
    <View style={styles.visitCard}>
      <View style={styles.visitHeader}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" style={styles.visitDate}>
            {thDate(v.date)}
          </Text>
          <Text variant="caption" style={styles.subtleLabel} numberOfLines={2}>
            {v.clinic}
          </Text>
        </View>
      </View>

      {/* Vet */}
      <View style={styles.visitRow}>
        <Text variant="caption" style={styles.visitLabel}>
          สัตวแพทย์
        </Text>
        <Text variant="bodyStrong" style={styles.visitValue}>
          {v.vetName}
        </Text>
      </View>

      {/* Vitals strip */}
      <View style={styles.vitalsRow}>
        <Vital label="น้ำหนัก" value={`${v.vitals.weightKg} กก.`} />
        {v.vitals.heightCm !== undefined && (
          <Vital label="ส่วนสูง" value={`${v.vitals.heightCm} ซม.`} />
        )}
        <Vital label="อุณหภูมิ" value={`${v.vitals.temperatureC.toFixed(1)} °C`} />
      </View>

      {/* Symptoms */}
      <View style={styles.visitBlock}>
        <Text variant="caption" style={styles.visitLabel}>
          อาการเบื้องต้น
        </Text>
        <Text variant="bodyStrong" style={styles.visitParagraph}>
          {v.symptoms}
        </Text>
      </View>

      {/* Diagnosis */}
      <View style={styles.visitBlock}>
        <Text variant="caption" style={styles.visitLabel}>
          การวินิจฉัย
        </Text>
        <Text variant="bodyStrong" style={styles.visitParagraph}>
          {v.diagnosis}
        </Text>
      </View>

      {/* Lab / X-ray */}
      {v.labResults && v.labResults.length > 0 && (
        <View style={styles.visitBlock}>
          <Text variant="caption" style={styles.visitLabel}>
            ผลตรวจ
          </Text>
          {v.labResults.map((l, i) => (
            <View key={i} style={styles.labRow}>
              <View style={styles.labTypePill}>
                <Text variant="caption" style={styles.labTypeText}>
                  {l.type === 'xray'
                    ? 'X-ray'
                    : l.type === 'ultrasound'
                      ? 'Ultrasound'
                      : l.type === 'lab'
                        ? 'Lab'
                        : 'Other'}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" style={styles.visitValue}>
                  {l.name}
                </Text>
                <Text variant="caption" style={styles.subtleLabel}>
                  {l.result}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Medications */}
      {v.medications && v.medications.length > 0 && (
        <View style={styles.visitBlock}>
          <Text variant="caption" style={styles.visitLabel}>
            รายการยา
          </Text>
          {v.medications.map((m, i) => (
            <View key={i} style={styles.medRow}>
              <Text variant="bodyStrong" style={styles.medName}>
                {m.name}
              </Text>
              <View style={styles.medMeta}>
                <Text variant="caption" style={styles.subtleLabel}>
                  จำนวน {m.qty}
                </Text>
                <Text variant="caption" style={styles.subtleLabel}>
                  {m.instructions}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.vitalCol}>
      <Text variant="caption" style={styles.vitalLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.vitalValue}>
        {value}
      </Text>
    </View>
  );
}

function WeightTrendCard({ pet }: { pet: Pet }) {
  // Prefer real visit vitals; fall back to synthetic points if no visits.
  const visits = pet.visits ?? [];
  const points =
    visits.length >= 2
      ? [...visits]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-4)
          .map((v) => ({
            label: thDateShort(v.date),
            sub: thDate(v.date),
            kg: v.vitals.weightKg,
          }))
      : [
          { label: '9 ด.', sub: '9 เดือนก่อน', kg: +(pet.weightKg - 1.1).toFixed(1) },
          { label: '6 ด.', sub: '6 เดือนก่อน', kg: +(pet.weightKg - 0.7).toFixed(1) },
          { label: '3 ด.', sub: '3 เดือนก่อน', kg: +(pet.weightKg - 0.3).toFixed(1) },
          { label: 'ปัจจุบัน', sub: 'ปัจจุบัน', kg: pet.weightKg },
        ];
  const [selected, setSelected] = useState(points.length - 1);
  const max = Math.max(...points.map((p) => p.kg));
  const min = Math.min(...points.map((p) => p.kg));
  const chartHeight = 110;
  const heightFor = (kg: number) => {
    const range = max - min || 1;
    return chartHeight * (0.3 + 0.7 * ((kg - min) / range));
  };
  const sel = points[selected];
  const prev = selected > 0 ? points[selected - 1] : null;
  const delta = prev ? +(sel.kg - prev.kg).toFixed(1) : 0;
  const deltaLabel = !prev
    ? '—'
    : delta === 0
      ? 'คงที่'
      : `${delta > 0 ? '+' : ''}${delta} กก.`;
  const deltaColor = !prev || delta === 0 ? '#4A4A50' : delta > 0 ? '#4FB36C' : '#C25450';

  return (
    <View style={styles.infoCard}>
      <View style={styles.chartHeader}>
        <Text variant="caption" style={styles.subtleLabel}>
          แนวโน้มน้ำหนัก
        </Text>
        <Text variant="caption" style={styles.subtleLabel}>
          ช่วง {min} – {max} กก.
        </Text>
      </View>

      {/* Selected detail readout */}
      <View style={styles.chartReadout}>
        <Text variant="bodyStrong" style={styles.chartReadoutKg}>
          {sel.kg} กก.
        </Text>
        <View style={styles.chartReadoutMeta}>
          <Text variant="caption" style={styles.subtleLabel}>
            {sel.sub}
          </Text>
          <Text variant="bodyStrong" style={[styles.chartDelta, { color: deltaColor }]}>
            {deltaLabel}
          </Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {points.map((p, i) => {
          const isSelected = i === selected;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              android_ripple={RIPPLE}
              style={({ pressed }) => [styles.chartCol, pressed && { opacity: 0.85 }]}
            >
              <Text
                variant="caption"
                style={[styles.chartValue, isSelected && { color: '#9F5266' }]}
              >
                {p.kg}
              </Text>
              <View style={[styles.chartBarTrack, { height: chartHeight }]}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: heightFor(p.kg),
                      backgroundColor: isSelected ? '#9F5266' : '#D6D6D6',
                    },
                  ]}
                />
              </View>
              <Text
                variant="caption"
                style={[styles.chartLabel, isSelected && { color: '#9F5266', fontWeight: '700' }]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodyStrong" style={styles.infoLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF3F4',
  },
  scroll: {
    backgroundColor: 'transparent',
  },
  hero: {
    height: 280,
    overflow: 'hidden',
    // photo is rendered as a fixed bgHeroWrap behind the scroll
    backgroundColor: 'transparent',
  },
  bgHeroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
    transformOrigin: 'top',
  },
  bgHeroImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 520, // taller than the visible hero so portrait crops favor the top (face)
  },
  heroFallback: {
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  heroText: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.md,
    gap: spacing.xs,
  },
  petName: {
    color: '#1A1A1F',
    fontWeight: '700',
  },
  petAge: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabActive: {
    backgroundColor: '#9F5266',
  },
  tabInactive: {
    backgroundColor: '#F5E4E7',
  },
  tabText: {
    fontSize: 12,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6E6E74',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1F',
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: spacing.md,
  },
  neuterCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  neuterBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
  },
  neuterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1F',
  },
  neuterFooter: {
    backgroundColor: '#F5E4E7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184,106,124,0.18)',
  },
  clinicText: {
    fontSize: 12,
    color: '#9F5266',
    fontWeight: '500',
  },
  conditionWrap: {
    paddingVertical: spacing.sm,
    gap: 4,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  feedTimeWrap: {
    gap: 2,
  },
  feedTime: {
    fontSize: 18,
    color: '#000000',
  },
  feedDetail: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 1,
  },
  feedAmount: {
    fontSize: 14,
    color: '#000000',
  },
  timelineWrap: {
    paddingVertical: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 64,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
  },
  timelineLineTop: {
    width: 2,
    height: 14,
    backgroundColor: '#D6D6D6',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineHalo: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(159,82,102,0.15)',
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: '#D6D6D6',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
  },
  timelineTitle: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  timelineClinic: {
    fontSize: 12,
    color: '#6E6E74',
    marginTop: 2,
  },
  timelineNext: {
    fontSize: 12,
  },
  timelineNextPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F5E4E7',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chartReadout: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  chartReadoutKg: {
    fontSize: 22,
    color: '#1A1A1F',
  },
  chartReadoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartDelta: {
    fontSize: 13,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartValue: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '700',
  },
  chartBarTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1F',
    marginTop: spacing.md,
    marginBottom: 4,
    paddingLeft: 4,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184,106,124,0.18)',
  },
  visitDate: {
    fontSize: 16,
    color: '#1A1A1F',
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  visitLabel: {
    fontSize: 12,
    color: '#6E6E74',
    fontWeight: '500',
  },
  visitValue: {
    fontSize: 14,
    color: '#1A1A1F',
    flexShrink: 1,
    textAlign: 'right',
  },
  vitalsRow: {
    flexDirection: 'row',
    backgroundColor: '#F5E4E7',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  vitalCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  vitalLabel: {
    fontSize: 11,
    color: '#9F5266',
  },
  vitalValue: {
    fontSize: 14,
    color: '#1A1A1F',
  },
  visitBlock: {
    gap: spacing.xs,
  },
  visitParagraph: {
    fontSize: 14,
    color: '#1A1A1F',
    fontWeight: '500',
    lineHeight: 20,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  labTypePill: {
    backgroundColor: '#F5E4E7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 64,
    alignItems: 'center',
  },
  labTypeText: {
    fontSize: 11,
    color: '#9F5266',
    fontWeight: '700',
  },
  medRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 2,
  },
  medName: {
    fontSize: 14,
    color: '#1A1A1F',
  },
  medMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1F',
  },
  subtleLabel: {
    fontSize: 14,
    color: '#6E6E74',
  },
  fieldWrap: {
    gap: 4,
    paddingTop: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6E6E74',
    fontWeight: '500',
  },
  fieldUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
  },
  fieldError: {
    fontSize: 11,
    color: '#C25450',
    marginTop: 4,
  },
  timeInlineWrap: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: -8,
  },
  timeAndroidText: {
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
  },
  timeValueText: {
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  timeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 10,
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingTop: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeCardTitle: {
    fontSize: 13,
    color: '#6E6E74',
    fontWeight: '500',
  },
  timeSpinner: {
    width: '100%',
    height: 200,
  },
  timeConfirm: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E8',
  },
  timeConfirmText: {
    fontSize: 17,
    color: '#1A75FF',
    fontWeight: '600',
  },
  timeCancelCard: {
    paddingVertical: 14,
  },
  timeCancelText: {
    fontSize: 17,
    color: '#1A75FF',
    fontWeight: '600',
  },
  fieldInput: {
    height: 40,
    paddingHorizontal: 0,
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  fieldInputMultiline: {
    height: undefined,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 6,
    textAlignVertical: 'top',
  },
  editToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  editToggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5E4E7',
  },
  editToggleChipActive: {
    backgroundColor: '#9F5266',
  },
  editToggleChipText: {
    fontSize: 13,
    color: '#9F5266',
    fontWeight: '700',
  },
  editToggleChipTextActive: {
    color: '#FFFFFF',
  },
  editMultilineInput: {
    fontSize: 14,
    color: '#1A1A1F',
    fontWeight: '700',
    paddingVertical: 6,
    minHeight: 40,
  },
  iosSheetRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  editTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  editTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E4E7',
  },
  editTabBtnActive: {
    backgroundColor: '#9F5266',
  },
  editTabText: {
    fontSize: 13,
    color: '#9F5266',
    fontWeight: '700',
  },
  editTabTextActive: {
    color: '#FFFFFF',
  },
  scheduleCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    overflow: 'hidden',
  },
  scheduleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scheduleSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scheduleBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E8',
    paddingTop: 10,
  },
  typeTileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeTile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  typeTileActive: {
    backgroundColor: '#9F5266',
    borderColor: '#9F5266',
  },
  typeTileText: {
    fontSize: 13,
    color: '#9F5266',
    fontWeight: '700',
  },
  typeTileTextActive: {
    color: '#FFFFFF',
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#9F5266',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(159,82,102,0.04)',
  },
  feedAddText: {
    fontSize: 14,
    color: '#9F5266',
    fontWeight: '700',
  },
  feedAddCard: {
    minHeight: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  feedAddIllusSlot: {
    position: 'absolute',
    right: -16,
    top: 4,
    bottom: 4,
    width: 110,
  },
  feedAddCardBody: {
    padding: 14,
    paddingRight: 110,
    gap: 4,
  },
  feedAddCardTitle: {
    fontSize: 14,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  feedAddCardHint: {
    fontSize: 11,
    color: '#6E6E74',
    lineHeight: 15,
  },
  feedAddCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#9F5266',
  },
  feedAddCardCtaText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  feedDeleteText: {
    fontSize: 14,
    color: '#C25450',
    fontWeight: '700',
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#D0D0D4',
    marginTop: 8,
  },
  payHeader: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  payHeaderTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  payHeaderClose: {
    position: 'absolute',
    right: 16,
    top: 8,
  },
  payHeaderCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  editSheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#9F5266',
  },
  sheetBtnSecondaryText: {
    fontSize: 16,
    color: '#9F5266',
  },
  sheetBtnPrimary: {
    backgroundColor: '#9F5266',
  },
  sheetBtnPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.xl,
    alignItems: 'flex-end',
  },
  meowFabAura: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 110,
    borderRadius: 999,
    shadowOpacity: 1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  meowFabAuraCyan: {
    left: 8,
    backgroundColor: '#7CD9F0',
    shadowColor: '#7CD9F0',
  },
  meowFabAuraPink: {
    right: 8,
    backgroundColor: '#E08FE3',
    shadowColor: '#E08FE3',
  },
  meowFabBorder: {
    padding: 2,
    borderRadius: 999,
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  meowFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  meowFabPaw: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meowFabLabel: {
    fontSize: 14,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  meowFabMascot: {
    position: 'absolute',
    right: 6,
    top: -50,
    width: 56,
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  meowFabMascotImg: {
    width: '100%',
    height: '100%',
  },
  meowSparkle: {
    position: 'absolute',
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
