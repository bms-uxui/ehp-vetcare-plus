import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Icon, ProductTile, Screen, Text } from '../components';
import { getProductColumns } from '../lib/responsive';
import VetCareLogo from '../../assets/vet-care-plus.svg';
import VaccinationIllus from '../../assets/vaccination-appointment.svg';
import { radii, semantic, shadows, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { mockAppointments, typeMeta, thWeekday, thDateShort } from '../data/appointments';
import { mockProducts, categoryMeta, fmtBaht } from '../data/products';
import {
  mockExpenses,
  monthKey,
  DEFAULT_MONTHLY_BUDGET,
  fmtBaht as fmtExpBaht,
} from '../data/expenses';
import { mockSchedules, mockReminders } from '../data/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const RIPPLE = { color: 'rgba(184,106,124,0.18)', borderless: false } as const;
const RIPPLE_LIGHT = { color: 'rgba(255,255,255,0.25)', borderless: false } as const;

const thFullDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const thTimeOfDayLabel = (time: string) => {
  const hh = parseInt(time.slice(0, 2), 10);
  if (hh < 11) return 'มื้อเช้า';
  if (hh < 16) return 'มื้อกลางวัน';
  return 'มื้อเย็น';
};

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const productCols = getProductColumns(windowWidth);
  const PRODUCT_GAP = 8;
  const PRODUCT_PAD = 20; // spacing.xl
  const productCardWidth =
    (windowWidth - PRODUCT_PAD * 2 - PRODUCT_GAP * (productCols - 1)) /
    productCols;
  const bannerPageWidth = windowWidth - spacing.xl * 2;
  const nextAppt = mockAppointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];

  const vaccineReminder = mockReminders.find((r) => r.type === 'vaccine');

  // Expense
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = mockExpenses.filter((e) => monthKey(e.dateISO) === thisMonth);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = DEFAULT_MONTHLY_BUDGET - monthTotal;

  // Next feeding
  const nextFeeding = mockSchedules.find((s) => s.enabled);

  // Products (6 for grid)
  const recommendedProducts = mockProducts.slice(0, 6);

  // ── Banner carousel ──
  type BannerItem = {
    date: string;
    pet?: string;
    actionTop: string;
    actionBottom: string;
    clinic: string;
    cta: string;
    onPress: () => void;
    /** Background illustration. Drop a PNG/SVG in assets/ and require() it here. */
    illustration?: ImageSourcePropType;
    /** Right-side SVG illustration component (alternative to raster `illustration`). */
    IllustrationSvg?: React.FC<{ width?: number; height?: number }>;
    /** Fallback tint while no illustration is provided. */
    accent: string;
  };

  const bannerItems: BannerItem[] = [
    {
      date: vaccineReminder
        ? thFullDate(vaccineReminder.dueISO)
        : thFullDate(new Date().toISOString()),
      pet: vaccineReminder?.petName ?? 'ข้าวปั้น',
      actionTop: 'เข้ารับบริการ',
      actionBottom: 'ฉีดวัคซีนพิษสุนัขบ้า',
      clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic',
      cta: 'ดูรายละเอียด',
      accent: '#F5E4E7',
      IllustrationSvg: VaccinationIllus,
      onPress: () =>
        nextAppt &&
        navigation.navigate('AppointmentDetail', { appointmentId: nextAppt.id }),
    },
    nextAppt && {
      date: thFullDate(nextAppt.dateISO),
      pet: nextAppt.petName,
      actionTop: 'เข้ารับบริการ',
      actionBottom: nextAppt.typeLabel,
      clinic: nextAppt.clinicName,
      cta: 'ดูรายละเอียด',
      accent: '#FFF4EA',
      // illustration: require('../../assets/banner-checkup.png'),
      onPress: () =>
        navigation.navigate('AppointmentDetail', { appointmentId: nextAppt.id }),
    },
    {
      date: 'พร้อมให้บริการตอนนี้',
      actionTop: 'ปรึกษาสัตวแพทย์',
      actionBottom: 'ออนไลน์ทุกที่ ทุกเวลา',
      clinic: 'มีสัตวแพทย์ออนไลน์ พร้อมตอบคำถามคุณ',
      cta: 'เริ่มสนทนา',
      accent: '#E0F0FB',
      // illustration: require('../../assets/banner-televet.png'),
      onPress: () => navigation.navigate('Vet' as never),
    },
    {
      date: 'โปรโมชั่น',
      actionTop: 'ลด 15% สำหรับ',
      actionBottom: 'อาหารสมาชิก',
      clinic: 'ใช้สิทธิ์ได้ภายใน 30 เม.ย. 69',
      cta: 'เข้าสู่ร้านค้า',
      accent: '#E7F5E9',
      // illustration: require('../../assets/banner-promo.png'),
      onPress: () => navigation.navigate('PetShop' as never),
    },
  ].filter(Boolean) as BannerItem[];

  const [bannerIndex, setBannerIndex] = useState(0);

  // Per-banner opacity shared values for crossfade
  const o0 = useSharedValue(1);
  const o1 = useSharedValue(0);
  const o2 = useSharedValue(0);
  const o3 = useSharedValue(0);
  const opacityValues = [o0, o1, o2, o3];

  const s0 = useAnimatedStyle(() => ({ opacity: o0.value }));
  const s1 = useAnimatedStyle(() => ({ opacity: o1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: o2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: o3.value }));
  const opacityStyles = [s0, s1, s2, s3];

  // Dot indicator — width + color interpolate from the same opacity value, so
  // they animate in sync with the banner crossfade for a smooth transition.
  const DOT_INACTIVE_W = 6;
  const DOT_ACTIVE_W = 18;
  const DOT_INACTIVE_COLOR = '#D0D0D4';
  const DOT_ACTIVE_COLOR = semantic.primary;
  const dot0 = useAnimatedStyle(() => ({
    width: DOT_INACTIVE_W + o0.value * (DOT_ACTIVE_W - DOT_INACTIVE_W),
    backgroundColor: interpolateColor(o0.value, [0, 1], [DOT_INACTIVE_COLOR, DOT_ACTIVE_COLOR]),
  }));
  const dot1 = useAnimatedStyle(() => ({
    width: DOT_INACTIVE_W + o1.value * (DOT_ACTIVE_W - DOT_INACTIVE_W),
    backgroundColor: interpolateColor(o1.value, [0, 1], [DOT_INACTIVE_COLOR, DOT_ACTIVE_COLOR]),
  }));
  const dot2 = useAnimatedStyle(() => ({
    width: DOT_INACTIVE_W + o2.value * (DOT_ACTIVE_W - DOT_INACTIVE_W),
    backgroundColor: interpolateColor(o2.value, [0, 1], [DOT_INACTIVE_COLOR, DOT_ACTIVE_COLOR]),
  }));
  const dot3 = useAnimatedStyle(() => ({
    width: DOT_INACTIVE_W + o3.value * (DOT_ACTIVE_W - DOT_INACTIVE_W),
    backgroundColor: interpolateColor(o3.value, [0, 1], [DOT_INACTIVE_COLOR, DOT_ACTIVE_COLOR]),
  }));
  const dotStyles = [dot0, dot1, dot2, dot3];

  // Swipe sync: invisible horizontal ScrollView captures pan + paging.
  const swipeRef = useRef<ScrollView>(null);
  const isUserDragging = useRef(false);

  // Crossfade + keep swipe ScrollView aligned to current page.
  useEffect(() => {
    opacityValues.forEach((sv, i) => {
      sv.value = withTiming(i === bannerIndex ? 1 : 0, { duration: 220 });
    });
    if (!isUserDragging.current) {
      swipeRef.current?.scrollTo({ x: bannerIndex * bannerPageWidth, animated: false });
    }
  }, [bannerIndex, bannerPageWidth]);

  // Auto-advance every 5s (paused while user is touching)
  useEffect(() => {
    const id = setInterval(() => {
      if (isUserDragging.current) return;
      setBannerIndex((idx) => (idx + 1) % bannerItems.length);
    }, 8000);
    return () => clearInterval(id);
  }, [bannerItems.length]);

  const onSwipeEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / bannerPageWidth);
    if (idx !== bannerIndex) setBannerIndex(idx);
    isUserDragging.current = false;
  };

  const currentBanner = bannerItems[bannerIndex];

  return (
    <Screen scroll tabBarSpace padded={false} topFade={false}>
      {/* ── BANNER SECTION (full bleed, contains header + reminder + dots) ── */}
      <View style={[styles.bannerSection, { paddingTop: insets.top }]}>
        {/* Layer 1: per-page illustration backgrounds (crossfade) */}
        <View style={styles.bannerBgStack} pointerEvents="none">
          {bannerItems.map((item, i) => (
            <Animated.View
              key={`bg-${i}`}
              style={[StyleSheet.absoluteFillObject, opacityStyles[i]]}
            >
              {item.illustration ? (
                <Image
                  source={item.illustration}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: item.accent }]} />
              )}
            </Animated.View>
          ))}
        </View>

        {/* Layer 2: cream top fade — keeps logo + status bar text readable on any illustration */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,253,251,0.85)', 'rgba(255,253,251,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bannerLogoFade, { height: insets.top + 70 }]}
        />

        {/* Layer 3: bottom fade — content readability + smooth blend into page bg */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,253,251,0)', 'rgba(255,253,251,0.7)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bannerBottomFade}
        />

        <View style={styles.bannerHeaderRow}>
          <VetCareLogo width={148} height={27} />
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            android_ripple={RIPPLE}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={8}
          >
            <Icon name="Mail" size={22} color={semantic.textPrimary} />
          </Pressable>
        </View>

        {/* ── Banner text content — stacked, crossfade ── */}
        <View style={styles.bannerStack}>
          {bannerItems.map((item, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[styles.bannerPage, opacityStyles[i]]}
            >
              {item.IllustrationSvg ? (
                <View style={styles.bannerIllus} pointerEvents="none">
                  <item.IllustrationSvg width={200} height={178} />
                </View>
              ) : null}
              <View style={styles.dateChip}>
                <View style={styles.dateDot} />
                <Text variant="caption" color={semantic.textPrimary} weight="500">
                  {item.date}
                </Text>
              </View>

              <Text variant="bodyStrong" style={styles.bannerHeadline}>
                {item.pet ? (
                  <>
                    อย่าลืมพา{' '}
                    <Text variant="bodyStrong" weight="700">
                      {item.pet}
                    </Text>{' '}
                    {item.actionTop}
                  </>
                ) : (
                  item.actionTop
                )}
                {'\n'}
                {item.actionBottom}
              </Text>
              <Text
                variant="caption"
                color={semantic.textSecondary}
                style={styles.bannerClinic}
              >
                {item.clinic}
              </Text>
            </Animated.View>
          ))}

          {/* Invisible swipe layer — captures horizontal swipes for paging */}
          <ScrollView
            ref={swipeRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => {
              isUserDragging.current = true;
            }}
            onScroll={(e) => {
              if (!isUserDragging.current) return;
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / bannerPageWidth);
              if (idx !== bannerIndex && idx >= 0 && idx < bannerItems.length) {
                setBannerIndex(idx);
              }
            }}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onSwipeEnd}
            style={styles.swipeOverlay}
          >
            {bannerItems.map((_, i) => (
              <View key={`swipe-${i}`} style={{ width: bannerPageWidth }} />
            ))}
          </ScrollView>
        </View>

        {/* ── Action row (button + dots) — outside the carousel, updates per index ── */}
        <View style={styles.bannerActionRow}>
          <Pressable
            onPress={currentBanner.onPress}
            android_ripple={RIPPLE_LIGHT}
            style={({ pressed }) => [
              styles.detailBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text variant="bodyStrong" color={semantic.onPrimary} style={{ fontSize: 13 }}>
              {currentBanner.cta}
            </Text>
          </Pressable>

          <View style={styles.dotsRow} pointerEvents="none">
            {bannerItems.map((_, i) => (
              <Animated.View key={i} style={[styles.dot, dotStyles[i]]} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* ── PETS ROW (overlaps banner bottom) — glass card ── */}
        <Card variant="elevated" padding="lg" style={styles.petsCard}>
          <View style={styles.petsRow}>
            {mockPets.slice(0, 3).map((pet) => (
              <Pressable
                key={pet.id}
                onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
                android_ripple={RIPPLE}
                style={({ pressed }) => [
                  styles.petItem,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.petAvatar}>
                  {pet.photo ? (
                    <Image source={pet.photo} style={styles.petAvatarImage} />
                  ) : (
                    <Text style={{ fontSize: 28 }}>{pet.emoji}</Text>
                  )}
                </View>
                <Text variant="caption" color={semantic.textPrimary} weight="500" align="center">
                  {pet.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => navigation.navigate('AddPet')}
              android_ripple={RIPPLE}
              style={({ pressed }) => [
                styles.petItem,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.petAvatarAdd}>
                <Icon name="Plus" size={22} color={semantic.textMuted} strokeWidth={2.4} />
              </View>
              <Text variant="caption" color={semantic.textMuted} weight="500" align="center">
                เพิ่ม
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* ── BENTO 2-COL: COST + FEEDING ── */}
        <View style={styles.bentoRow}>
          <Pressable
            onPress={() => navigation.navigate('Expenses')}
            android_ripple={RIPPLE}
            style={({ pressed }) => [
              styles.bentoTile,
              pressed && { opacity: 0.9 },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FFC5A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.strokeGradient, { flex: 1 }]}
            >
            <View style={styles.colorCard}>
              <View pointerEvents="none" style={styles.budgetIllus}>
                <Image
                  source={require('../../assets/pet-budget.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ fontSize: 13 }} numberOfLines={1}>
                  ค่าใช้จ่ายเดือนนี้
                </Text>
                <View style={{ marginTop: spacing.sm, flex: 1, paddingRight: 60 }}>
                  <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
                    คงเหลือ
                  </Text>
                  <Text
                    variant="h2"
                    color={remaining < 0 ? '#C25450' : '#B8552B'}
                    style={{ fontSize: 20, lineHeight: 30 }}
                    numberOfLines={1}
                  >
                    {fmtExpBaht(remaining)}
                  </Text>
                  <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 11 }}>
                    จาก {fmtExpBaht(DEFAULT_MONTHLY_BUDGET)}
                  </Text>
                </View>
              </View>
            </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            android_ripple={RIPPLE}
            style={({ pressed }) => [
              styles.bentoTile,
              pressed && { opacity: 0.9 },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#B5DEBC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.strokeGradient, { flex: 1 }]}
            >
            <View style={styles.colorCard}>
              <View pointerEvents="none" style={styles.mealIllus}>
                <Image
                  source={require('../../assets/pet-meal-time.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ fontSize: 13 }} numberOfLines={1}>
                  เวลาให้อาหาร
                </Text>
                <View style={{ marginTop: spacing.sm, flex: 1, paddingRight: 60 }}>
                  <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
                    {nextFeeding ? thTimeOfDayLabel(nextFeeding.time) : 'มื้อถัดไป'}
                  </Text>
                  <Text
                    variant="h3"
                    color="#2E7D5B"
                    style={{ fontSize: 20, lineHeight: 30 }}
                    numberOfLines={1}
                  >
                    {nextFeeding?.petName ?? '—'}
                  </Text>
                  <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 11 }}>
                    ตอน {nextFeeding?.time ?? '--:--'} น.
                  </Text>
                </View>
              </View>
            </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── VET SERVICE WIDE CARD ── */}
        <Pressable
          onPress={() => navigation.navigate('Vet' as never)}
          android_ripple={RIPPLE}
          style={({ pressed }) => [styles.cardShadow, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#B7CCFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.strokeGradient}
          >
          <View style={styles.colorCardLg}>
            <View pointerEvents="none" style={styles.vetIllus}>
              <Image
                source={require('../../assets/vet-service.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
            <View style={{ paddingRight: 110 }}>
              <Text variant="bodyStrong" style={{ fontSize: 13 }} numberOfLines={1}>
                บริการสัตวแพทย์
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <Text
                  variant="h3"
                  color="#2E54B8"
                  style={{ fontSize: 20, lineHeight: 30 }}
                >
                  ดูแลสัตว์ที่คุณรัก
                </Text>
                <Text
                  variant="h3"
                  color="#2E54B8"
                  style={{ fontSize: 20, lineHeight: 30 }}
                >
                  กับแพทย์ผู้เชี่ยวชาญ
                </Text>
              </View>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Icon name="CalendarCheck" size={16} color="#2E54B8" strokeWidth={2.2} />
                  <Text variant="caption" color={semantic.textPrimary}>
                    จองนัดคลินิก
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Icon name="MessageCircle" size={16} color="#2E54B8" strokeWidth={2.2} />
                  <Text variant="caption" color={semantic.textPrimary}>
                    ปรึกษาออนไลน์
                  </Text>
                </View>
              </View>
            </View>
          </View>
          </LinearGradient>
        </Pressable>

        {/* ── PRODUCTS ── */}
        <Text variant="caption" color={semantic.textPrimary} weight="500" style={styles.sectionLabel}>
          สินค้าแนะนำ
        </Text>
        <View style={styles.productGrid}>
          {recommendedProducts.map((p) => (
            <ProductTile
              key={p.id}
              product={p}
              cardWidth={productCardWidth}
              onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
            />
          ))}
        </View>

        {/* ── EMPTY STATE FOOTER ── */}
        <View style={styles.emptyFooter}>
          <View style={styles.emptyAvatar}>
            <Icon name="ShoppingBag" size={28} color={semantic.primary} strokeWidth={2} />
          </View>
          <Text variant="bodyStrong" align="center" style={{ fontSize: 14 }}>
            ยังไม่เจอสินค้าที่ถูกใจ ?
          </Text>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            align="center"
            style={{ fontSize: 13 }}
          >
            ลองค้นหาเพิ่มเติมและเลือกดูได้ในหน้าร้านค้า
          </Text>
          <Pressable
            onPress={() => navigation.navigate('PetShop' as never)}
            android_ripple={RIPPLE_LIGHT}
            style={({ pressed }) => [
              styles.emptyBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text variant="bodyStrong" color={semantic.onPrimary} style={{ fontSize: 13 }}>
              เข้าสู่ร้านค้า
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 76, // 16px gap below dots + 60px of overlap into pet card
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginTop: -60, // pull content up so banner bottom hits pet card middle (~120/2)
  },
  bannerBgStack: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bannerBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  bannerStack: {
    position: 'relative',
    marginTop: spacing.xl,
    minHeight: 140,
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  bannerPage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  dateChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: semantic.surface,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semantic.primary,
  },
  bannerHeadline: {
    fontSize: 16,
    lineHeight: 24,
    paddingRight: 140,
  },
  bannerClinic: {
    paddingRight: 140,
  },
  bannerIllus: {
    position: 'absolute',
    right: -40,
    bottom: -96,
    width: 200,
    height: 178,
  },
  bannerLogoFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bannerActionRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 32,
    marginTop: spacing.sm,
  },
  detailBtn: {
    height: 32,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.primary,
    overflow: 'hidden',
  },
  dotsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  petsCard: {
    marginTop: spacing.xs,
  },
  petsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 64,
  },
  petAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petAvatarImage: {
    width: '100%',
    height: '100%',
  },
  petAvatarAdd: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: semantic.borderStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoTile: {
    flex: 1,
    minHeight: 130,
    borderRadius: 24,
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardShadow: {
    borderRadius: 24,
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bentoTileOverflow: {
    overflow: 'hidden',
    borderRadius: radii.xl,
  },
  tileArrow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetIllus: {
    position: 'absolute',
    right: -22,
    bottom: -24,
    width: 100,
    height: 115,
  },
  mealIllus: {
    position: 'absolute',
    right: -22,
    bottom: -24,
    width: 100,
    height: 115,
  },
  vetIllus: {
    position: 'absolute',
    right: -18,
    bottom: -36,
    width: 170,
    height: 188,
  },
  glassCard: {
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  strokeGradient: {
    borderRadius: 24,
    padding: 2,
  },
  colorCard: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: spacing.md,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  colorCardLg: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  bulletList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semantic.primary,
  },
  cardArrowAbsolute: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginLeft: spacing.xs,
    fontSize: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productTile: {
    flexBasis: '47.5%',
    flexGrow: 1,
  },
  productImage: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  productInfo: {
    padding: spacing.sm,
    gap: 2,
  },
  emptyFooter: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['2xl'],
    marginTop: spacing.md,
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyBtn: {
    height: 32,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
});
