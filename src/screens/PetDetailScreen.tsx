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
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Screen, StickyAppBar, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { mockSchedules } from '../data/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'PetDetail'>;

const TAB_KEYS = ['general', 'feeding', 'vaccines', 'health'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_LABELS: Record<TabKey, string> = {
  general: 'ข้อมูลทั่วไป',
  feeding: 'เวลาให้อาหาร',
  vaccines: 'ประวัติวัคซีน',
  health: 'ประวัติสุขภาพ',
};

const RIPPLE = { color: 'rgba(184,106,124,0.18)', borderless: false } as const;

const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

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
  const { petId } = route.params;
  const pet = mockPets.find((p) => p.id === petId);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [tab, setTab] = useState<TabKey>('general');
  const tabIndex = TAB_KEYS.indexOf(tab);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
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

  if (!pet) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบข้อมูลสัตว์เลี้ยง</Text>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── HERO BANNER (pet photo as full-bleed background) ── */}
        <Animated.View
          entering={FadeIn.duration(280)}
          style={[styles.hero, { paddingTop: insets.top + 64 }]}
        >
          {pet.photo ? (
            <Image source={pet.photo} style={styles.heroPhoto} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
              <Text style={{ fontSize: 96 }}>{pet.emoji}</Text>
            </View>
          )}

          {/* Top dark gradient — small, just behind the status bar */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroTopFade}
          />
          {/* Bottom white fade — blends into the rest of the page */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', '#FFFFFF']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBottomFade}
          />

          <Animated.View
            entering={FadeIn.delay(120).duration(280)}
            style={styles.heroText}
          >
            <Text variant="bodyStrong" style={styles.petName}>
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

        {/* ── CONTENT (horizontal pager — swipe left/right to switch tab) ── */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => {
            pagerDragging.current = true;
          }}
          onMomentumScrollEnd={onPagerEnd}
        >
          <View style={{ width: windowWidth }}>
          <View style={styles.content}>
            <View style={styles.infoCard}>
              <InfoRow label="วันเกิด" value={thDate(pet.birthDate)} />
              <InfoRow label="สายพันธุ์" value={pet.breed} />
              <InfoRow label="น้ำหนัก" value={`${pet.weightKg} กก.`} />
              <InfoRow label="สี" value={pet.color} />
              <InfoRow label="เพศ" value={pet.gender === 'male' ? 'ผู้' : 'เมีย'} />
              {pet.microchipId && <InfoRow label="ไมโครชิป" value={pet.microchipId} />}
            </View>

            {/* Neutering card */}
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

            {/* Conditions card */}
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
          </View>

          <View style={{ width: windowWidth }}>
          <View style={styles.content}>
            {mockSchedules.filter((s) => s.petId === pet.id).length === 0 ? (
              <View style={styles.infoCard}>
                <View style={styles.conditionWrap}>
                  <Text variant="bodyStrong" style={styles.conditionTitle}>
                    ยังไม่มีตารางให้อาหาร
                  </Text>
                  <Text variant="caption" style={styles.subtleLabel}>
                    เพิ่มตารางใหม่เพื่อรับการแจ้งเตือนรายวัน
                  </Text>
                </View>
              </View>
            ) : (
              mockSchedules
                .filter((s) => s.petId === pet.id)
                .map((s) => (
                  <View key={s.id} style={styles.infoCard}>
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
                  </View>
                ))
            )}
          </View>
          </View>

          <View style={{ width: windowWidth }}>
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
                      const upcoming = v.nextDue && v.nextDue >= new Date().toISOString().slice(0, 10);
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
          </View>

          <View style={{ width: windowWidth }}>
          <View style={styles.content}>
            {/* Recent checkup (mock) */}
            <View style={styles.neuterCard}>
              <View style={styles.neuterBody}>
                <Text variant="caption" style={styles.subtleLabel}>
                  ตรวจสุขภาพล่าสุด
                </Text>
                <Text variant="bodyStrong" style={styles.neuterTitle}>
                  ปกติ · สุขภาพแข็งแรง
                </Text>
                <Text variant="caption" style={styles.subtleLabel}>
                  เมื่อ {thDate('2025-09-12')}
                </Text>
              </View>
              <View style={styles.neuterFooter}>
                <Text variant="caption" style={styles.clinicText} numberOfLines={2}>
                  ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic
                </Text>
              </View>
            </View>

            {/* Weight trend chart */}
            <WeightTrendCard currentKg={pet.weightKg} />

            {/* Conditions */}
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
          </View>
          </View>
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
          onPress: () => {},
          accessibilityLabel: 'แก้ไขข้อมูล',
        }}
      />

    </View>
  );
}

function WeightTrendCard({ currentKg }: { currentKg: number }) {
  const points = [
    { label: '9 ด.', sub: '9 เดือนก่อน', kg: +(currentKg - 1.1).toFixed(1) },
    { label: '6 ด.', sub: '6 เดือนก่อน', kg: +(currentKg - 0.7).toFixed(1) },
    { label: '3 ด.', sub: '3 เดือนก่อน', kg: +(currentKg - 0.3).toFixed(1) },
    { label: 'ปัจจุบัน', sub: 'ปัจจุบัน', kg: currentKg },
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
    backgroundColor: '#FFFFFF',
  },
  hero: {
    height: 280,
    overflow: 'hidden',
    backgroundColor: semantic.primaryMuted,
  },
  heroPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 520, // taller than hero so portrait photos show top (face) portion
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
    fontSize: 16,
    color: '#1A1A1F',
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
  conditionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1F',
  },
  subtleLabel: {
    fontSize: 14,
    color: '#6E6E74',
  },
});
