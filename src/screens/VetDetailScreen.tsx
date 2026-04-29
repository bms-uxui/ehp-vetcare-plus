import { ComponentProps, useCallback, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassView, isLiquidGlassAvailable } from '../lib/glass-effect';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, IconButton, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { ExperienceEntry, mockConversations, mockReviews, mockVets, TeleVet, VetReview } from '../data/televet';

const LIQUID_GLASS = isLiquidGlassAvailable();

type Props = NativeStackScreenProps<RootStackParamList, 'VetDetail'>;
type Tab = 'reviews' | 'experience';

const HERO_HEIGHT = 450;
const PAGE_SIZE = 10;
const LOAD_MORE_THRESHOLD = 200;

export default function VetDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { vetId } = route.params;
  const vet = useMemo(() => mockVets.find((v) => v.id === vetId), [vetId]);
  const reviews = useMemo(() => mockReviews.filter((r) => r.vetId === vetId), [vetId]);
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return vet?.rating ?? 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews, vet]);
  const [tab, setTab] = useState<Tab>('reviews');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const onScrollLoadMore = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (tab !== 'reviews') return;
      if (visibleCount >= reviews.length) return;
      if (isLoadingMore) return;
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom < LOAD_MORE_THRESHOLD) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, reviews.length));
          setIsLoadingMore(false);
        }, 400);
      }
    },
    [tab, visibleCount, reviews.length, isLoadingMore],
  );

  // AppBar fade-in on scroll — same Apple-style progressive blur as ProductDetailScreen
  const FADE_START = HERO_HEIGHT * 0.3;
  const FADE_END = HERO_HEIGHT * 0.55;
  const barBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [FADE_START, FADE_END], [0, 1], Extrapolation.CLAMP),
  }));
  // iOS parallax stretch — image stays anchored & zooms on pull-down
  const heroStretchStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    if (y < 0) {
      const factor = 1 - y / HERO_HEIGHT;
      return {
        transform: [
          { translateY: y / 2 },
          { scaleY: factor },
          { scaleX: factor },
        ],
      };
    }
    return { transform: [] };
  });
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

  if (!vet) {
    return (
      <View style={styles.errorRoot}>
        <Text variant="h3">ไม่พบข้อมูลสัตวแพทย์</Text>
      </View>
    );
  }

  const onChat = () => {
    const existing = mockConversations.find((c) => c.vetId === vet.id);
    navigation.navigate('Chat', {
      conversationId: existing?.id ?? `new-${vet.id}`,
      vetId: vet.id,
    });
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={onScrollLoadMore}
        onScrollEndDrag={onScrollLoadMore}
        scrollEventThrottle={16}
      >
        {/* Hero — full-width image with parallax stretch + bottom gradient + name + chips */}
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStretchStyle]}>
            <ImageBackground
              source={{ uri: vet.avatar }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Bottom fade for legibility */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />

          <View style={styles.heroSpacer} />

          <View style={styles.heroFooter}>
            <Text variant="h1" style={styles.heroTitle} numberOfLines={2}>
              {vet.name}
            </Text>
            <View style={styles.chipsRow}>
              <HeroChip icon="Stethoscope" label={vet.specialty} />
              <HeroChip icon="Briefcase" label={`${vet.experienceYears} Yrs`} />
              <HeroChip icon="Clock" label="จ.-ส. 09:00 - 18:00 น." />
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Tab bar */}
          <View style={styles.tabBar}>
            <TabPill label="Reviews" active={tab === 'reviews'} onPress={() => setTab('reviews')} />
            <TabPill
              label="ประสบการณ์"
              active={tab === 'experience'}
              onPress={() => setTab('experience')}
            />
          </View>

          {tab === 'reviews' ? (
            <ReviewsSection
              avgRating={avgRating}
              reviews={reviews}
              visibleCount={visibleCount}
              totalCount={vet.reviewCount}
              isLoadingMore={isLoadingMore}
            />
          ) : (
            <ExperienceSection vet={vet} />
          )}
        </View>
      </Animated.ScrollView>

      {/* Sticky AppBar — progressive blur fades in on scroll */}
      <View
        pointerEvents="box-none"
        style={[styles.appbar, { paddingTop: insets.top, height: insets.top + 56 }]}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, barBgStyle]}>
          <BlurView intensity={80} tint="systemChromeMaterialLight" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.barTint]} />
          <View style={styles.barHairline} />
        </Animated.View>

        <View style={styles.appbarContent}>
          <IconButton
            icon="ChevronLeft"
            size="md"
            onPress={() => navigation.goBack()}
            accessibilityLabel="ย้อนกลับ"
          />
          <Animated.View style={[styles.appbarTitleWrap, titleStyle]} pointerEvents="none">
            <Text variant="bodyStrong" style={styles.appbarTitle} numberOfLines={1}>
              {vet.name}
            </Text>
          </Animated.View>
          <View style={styles.appbarRightSpacer} />
        </View>
      </View>

      {/* Sticky bottom action bar — glass blur, rose shadow */}
      <View pointerEvents="box-none" style={styles.actionBarWrap}>
        <View style={styles.actionBarShadow}>
          <View style={styles.actionBar}>
            {LIQUID_GLASS ? (
              <GlassView
                glassEffectStyle="regular"
                colorScheme="light"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <BlurView
                intensity={80}
                tint="systemThinMaterialLight"
                style={StyleSheet.absoluteFill}
              />
            )}
            <View pointerEvents="none" style={styles.actionBarTint} />

            <View style={styles.actionRow}>
              <Pressable
                onPress={() =>
                  navigation.navigate('BookAppointment', { selectedVetId: vetId })
                }
                style={({ pressed }) => [styles.bookingBtn, pressed && styles.btnPressed]}
              >
                <Text variant="bodyStrong" color={semantic.onPrimary} style={{ fontSize: 15 }}>
                  เลือกแพทย์คนนี้
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Sub-components ---------- */

function HeroChip({
  icon,
  label,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
}) {
  return (
    <View style={styles.chip}>
      <Icon name={icon} size={11} color="#1A1A1A" strokeWidth={2.4} />
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabPill, active && styles.tabPillActive]}>
      <Text
        variant="bodyStrong"
        color={active ? semantic.onPrimary : '#1A1A1A'}
        style={{ fontSize: 12 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ReviewsSection({
  avgRating,
  reviews,
  visibleCount,
  totalCount,
  isLoadingMore,
}: {
  avgRating: number;
  reviews: VetReview[];
  visibleCount: number;
  totalCount: number;
  isLoadingMore: boolean;
}) {
  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <>
      <View style={styles.ratingHeader}>
        <View style={styles.ratingRow}>
          <Icon name="Star" size={20} color="#D99A20" fill="#D99A20" />
          <Text variant="h2" style={{ fontSize: 24 }}>
            {avgRating.toFixed(1)}
          </Text>
        </View>
        <Text variant="body" style={{ fontSize: 14 }}>
          Reviews ({totalCount})
        </Text>
      </View>

      <View style={styles.reviewList}>
        {visible.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </View>

      {isLoadingMore && (
        <View style={styles.loadMoreRow}>
          <Text variant="caption" color="#9A9AA0">
            กำลังโหลด...
          </Text>
        </View>
      )}
      {!hasMore && reviews.length > 0 && (
        <View style={styles.loadMoreRow}>
          <Text variant="caption" color="#9A9AA0">
            แสดงครบทั้งหมดแล้ว
          </Text>
        </View>
      )}
    </>
  );
}

function ReviewCard({ review }: { review: VetReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTopRow}>
        {review.userAvatar ? (
          <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
        ) : (
          <View style={[styles.reviewAvatar, styles.reviewAvatarFallback]}>
            <Icon name="UserCircle" size={28} color={semantic.primary} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
            {review.userName}
          </Text>
          <Text variant="caption" color="#6E6E74" style={{ fontSize: 12 }}>
            {review.date}
          </Text>
        </View>
        <View style={styles.reviewRatingChip}>
          <Icon name="Star" size={10} color="#D99A20" fill="#D99A20" />
          <Text variant="caption" style={{ fontSize: 10 }}>
            {review.rating.toFixed(1)}
          </Text>
        </View>
      </View>
      <View style={styles.commentChip}>
        <Text variant="caption" color={semantic.primaryHover} style={{ fontSize: 10 }}>
          {review.comment}
        </Text>
      </View>
    </View>
  );
}

function ExperienceSection({ vet }: { vet: TeleVet }) {
  return (
    <View style={styles.expWrap}>
      {vet.experiences.map((entry, i) => (
        <ExperienceItem key={`${entry.years}-${i}`} entry={entry} />
      ))}
    </View>
  );
}

function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  return (
    <View style={styles.expItem}>
      <View style={styles.expHeader}>
        <Text variant="h2" style={styles.expYears}>
          {entry.years}
        </Text>
        <Text variant="caption" color="#6E6E74" style={{ fontSize: 12 }}>
          ประสบการณ์
        </Text>
      </View>
      <View style={styles.expBulletRow}>
        <Text variant="body" style={styles.expBullet}>
          •
        </Text>
        <Text variant="body" style={styles.expDescription}>
          {entry.description}
        </Text>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 200 },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: '#D0D0D4',
    overflow: 'visible',
    position: 'relative',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  heroSpacer: { flex: 1 },
  heroFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  chipText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Body
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: radii.pill,
    padding: 4,
    marginVertical: spacing.lg,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  tabPillActive: {
    backgroundColor: semantic.primaryHover,
  },

  // Rating header (Reviews tab)
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Review cards — same rose-bordered style as ProductDetail's shipCard
  reviewList: { gap: spacing.md },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#F5E4E7',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  reviewAvatarFallback: {
    backgroundColor: '#F5E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  commentChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: '#FBF3F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5E4E7',
  },
  loadMoreRow: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  // Experience cards — same rose-bordered card style
  expWrap: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  expItem: {
    borderWidth: 1,
    borderColor: '#F5E4E7',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  expHeader: { alignItems: 'flex-start' },
  expYears: {
    fontSize: 24,
    color: semantic.primaryHover,
  },
  expBulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  expBullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  expDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },

  // Sticky AppBar
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
    paddingHorizontal: spacing.lg,
    height: 56,
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
  appbarRightSpacer: {
    width: 44,
    height: 44,
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

  // Sticky bottom action bar — glass blur with rose shadow
  actionBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  actionBarShadow: {
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#5E303C',
    shadowOpacity: 0.28,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  actionBar: {
    borderRadius: 64,
    padding: spacing['2xl'],
    overflow: 'hidden',
  },
  actionBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242,242,243,0.55)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  chatBtn: {
    width: 56,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBtn: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: semantic.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
