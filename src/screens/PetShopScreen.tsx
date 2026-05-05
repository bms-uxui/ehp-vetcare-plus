import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductColumns, useIsTablet } from '../lib/responsive';
import { useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabsParamList } from '../navigation/AppTabs';
import { RootStackParamList } from '../../App';
import {
  Icon,
  PetAvatar,
  ProductTile,
  SkeletonBox,
  SkeletonShimmer,
  Text,
  useSkeletonShimmer,
} from '../components';
import { semantic, spacing } from '../theme';
import {
  mockProducts,
  categoryMeta,
  ProductCategory,
  Product,
} from '../data/products';
import { mockPets } from '../data/pets';
import { useCart } from '../data/cart';
import { mockOrders } from '../data/orders';

type Props = BottomTabScreenProps<AppTabsParamList, 'PetShop'>;

const SECTION_PAD = 16;
const CARD_GAP = 10;


// Bar fades in once the large title scrolls under the app bar
const FADE_START = 30;
const FADE_END = 90;

export default function PetShopScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { count } = useCart();
  const { width: screenW } = useWindowDimensions();
  const numColumns = getProductColumns(screenW);
  const cardWidth =
    (screenW - SECTION_PAD * 2 - CARD_GAP * (numColumns - 1)) / numColumns;
  const activeOrderCount = useMemo(
    () =>
      mockOrders.filter(
        (o) => o.status === 'packing' || o.status === 'shipping',
      ).length,
    [],
  );
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(
    null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const shimmerStyle = useSkeletonShimmer();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 350);
  };
  const closeSearch = () => {
    Keyboard.dismiss();
    setSearchOpen(false);
    setSearchQuery('');
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const barBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [FADE_START, FADE_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [FADE_START + 30, FADE_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
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

  const featured = useMemo(
    () => mockProducts.filter((p) => p.originalPriceBaht),
    [],
  );
  const recommended = useMemo(() => {
    const species = Array.from(new Set(mockPets.map((p) => p.species)));
    return mockProducts.filter((p) =>
      p.recommendedFor.some((kind) => species.includes(kind as any)),
    );
  }, []);
  const allProducts = activeCategory
    ? mockProducts.filter((p) => p.category === activeCategory)
    : mockProducts;

  const trimmedQuery = searchQuery.trim();
  const searchResults = trimmedQuery
    ? mockProducts.filter((p) => {
        const q = trimmedQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      })
    : [];

  const goToProduct = (id: string) =>
    rootNav.navigate('ProductDetail', { productId: id });

  const categories: { key: ProductCategory | null; icon: string; label: string }[] = [
    { key: null, icon: 'LayoutGrid', label: 'ทั้งหมด' },
    ...(Object.keys(categoryMeta) as ProductCategory[]).map((c) => ({
      key: c,
      icon: categoryMeta[c].icon,
      label: categoryMeta[c].label,
    })),
  ];

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero — matches PetsList pattern */}
        <View
          style={[
            styles.heroBlock,
            { height: 220 + insets.top, paddingTop: insets.top },
          ]}
        >
          {/* Pink gradient bg */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(251,208,222,0)', '#FBD0DE']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom fade — blends into AppBackground */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,253,249,0)', '#FFFDFB']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBottomFade}
          />

          <Image
            source={require('../../assets/illustrations/girl-shopping.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <View style={[styles.heroText, isTablet && styles.heroTextTablet]}>
            <Text variant="bodyStrong" style={styles.heroTitle}>
              ร้านค้า
            </Text>
            <Text
              variant="caption"
              color={semantic.textSecondary}
              style={styles.heroSubtitle}
              numberOfLines={isTablet ? 1 : 2}
            >
              อาหาร ของเล่น และของจำเป็นสำหรับเพื่อนขนปุย
            </Text>
          </View>
        </View>

        {/* Body sheet — overlaps hero by 24pt with rounded top corners */}
        <View style={styles.sheet}>
        {/* Toolbar — floats between hero and sheet (overlaps top of sheet) */}
        {!searchOpen && (
          <View style={styles.toolbarWrap}>
            <Pressable
              onPress={openSearch}
              style={({ pressed }) => [
                styles.searchPill,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Icon
                name="Search"
                size={18}
                color={semantic.textMuted}
                strokeWidth={2.2}
              />
              <Text style={styles.searchPillText}>ค้นหาสินค้า</Text>
            </Pressable>
            <View>
              <Pressable
                onPress={() => rootNav.navigate('OrderTracking')}
                style={({ pressed }) => [
                  styles.toolbarBtn,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityLabel="ติดตามคำสั่งซื้อ"
              >
                <Icon
                  name="Package"
                  size={20}
                  color="#1A1A1A"
                  strokeWidth={2.2}
                />
              </Pressable>
              {activeOrderCount > 0 && (
                <View style={styles.cartBadge} pointerEvents="none">
                  <Text weight="700" style={styles.cartBadgeText}>
                    {activeOrderCount > 99 ? '99+' : activeOrderCount}
                  </Text>
                </View>
              )}
            </View>
            <View>
              <Pressable
                onPress={() => rootNav.navigate('Cart')}
                style={({ pressed }) => [
                  styles.toolbarBtn,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityLabel="ตะกร้า"
              >
                <Icon
                  name="ShoppingCart"
                  size={20}
                  color="#1A1A1A"
                  strokeWidth={2.2}
                />
              </Pressable>
              {count > 0 && (
                <View style={styles.cartBadge} pointerEvents="none">
                  <Text weight="700" style={styles.cartBadgeText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Category chips — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
            {categories.map((c) => (
              <CategoryChip
                key={c.key ?? 'all'}
                icon={c.icon}
                label={c.label}
                active={activeCategory === c.key}
                onPress={() => setActiveCategory(c.key)}
              />
            ))}
          </ScrollView>

        {loading ? (
          <PetShopSkeleton
            shimmerStyle={shimmerStyle}
            cardWidth={cardWidth}
            numColumns={numColumns}
          />
        ) : trimmedQuery ? (
          // Search results — replaces all sections when query is active
          <Section title={`ผลการค้นหา (${searchResults.length})`}>
            {searchResults.length > 0 ? (
              <Grid
                data={searchResults}
                onPress={goToProduct}
                cardWidth={cardWidth}
              />
            ) : (
              <View style={styles.searchEmpty}>
                <Icon
                  name="SearchX"
                  size={32}
                  color={semantic.textMuted}
                  strokeWidth={1.6}
                />
                <Text variant="body" color={semantic.textSecondary}>
                  ไม่พบ "{trimmedQuery}"
                </Text>
              </View>
            )}
          </Section>
        ) : (
          <>
            {/* Promotion */}
            {!activeCategory && featured.length > 0 && (
              <Section title="โปรโมชั่น">
                <Grid
                  data={featured}
                  onPress={goToProduct}
                  cardWidth={cardWidth}
                />
              </Section>
            )}

            {/* Recommend for your pets — section header is a rose banner
                with pet photos peeking from the right. */}
            {!activeCategory && recommended.length > 0 && (
              <View style={styles.section}>
                <View style={styles.recBanner}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['#FFE9EC', '#FBF3F4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.recBannerText}>
                    <Text weight="600" style={styles.recBannerTitle}>
                      แนะนำสำหรับสัตว์ของคุณ
                    </Text>
                    <Text style={styles.recBannerSub}>
                      คัดมาจากความชอบของน้อง
                    </Text>
                  </View>
                  <View pointerEvents="none" style={styles.recBannerPets}>
                    <BigPetStack />
                  </View>
                </View>
                <Grid
                  data={recommended.slice(0, 4)}
                  onPress={goToProduct}
                  cardWidth={cardWidth}
                />
              </View>
            )}

            {/* All products / filtered */}
            <Section
              title={
                activeCategory
                  ? `${categoryMeta[activeCategory].label} (${allProducts.length})`
                  : `สินค้าทั้งหมด (${allProducts.length})`
              }
            >
              <Grid
                data={allProducts}
                onPress={goToProduct}
                cardWidth={cardWidth}
              />
            </Section>
          </>
        )}

          {/* Bottom space for tab bar */}
          <View style={{ height: 110 }} />
        </View>
      </Animated.ScrollView>

      {/* Top fade — soft white wash matching Screen wrapper used by other tabs */}
      <LinearGradient
        pointerEvents="none"
        colors={['#FFFDFB', 'rgba(255,253,251,0.85)', 'rgba(255,253,251,0)']}
        locations={[0, 0.55, 1]}
        style={[styles.topFade, { height: insets.top + 24 }]}
      />

      {/* Sticky AppBar — same pattern as ProductDetailScreen */}
      <View
        pointerEvents="box-none"
        style={[
          styles.appbar,
          { paddingTop: insets.top, height: insets.top + 56 },
        ]}
      >
        {/* Backing bar — fades in on scroll */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, barBgStyle]}
        >
          <BlurView
            intensity={80}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.barTint]} />
          <View style={styles.barHairline} />
        </Animated.View>

        {/* Foreground — title + actions */}
        <View style={styles.appbarContent}>
          <View style={styles.appbarPlaceholder} />

          <Animated.View
            pointerEvents="none"
            style={[styles.appbarTitleWrap, titleStyle]}
          >
            <Text variant="bodyStrong" style={styles.appbarTitle} numberOfLines={1}>
              ร้านค้า
            </Text>
          </Animated.View>

          <View style={styles.appbarPlaceholder} />
        </View>
      </View>

      {/* Search modal — full screen, opens when search bar tapped */}
      <Modal
        visible={searchOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeSearch}
      >
        <View style={[styles.searchModalRoot, { paddingTop: insets.top }]}>
          <View style={styles.searchModalHeader}>
            <Pressable
              onPress={closeSearch}
              hitSlop={8}
              accessibilityLabel="ย้อนกลับ"
              style={({ pressed }) => [
                styles.searchModalBack,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Icon
                name="ChevronLeft"
                size={22}
                color="#1A1A1A"
                strokeWidth={2.4}
              />
            </Pressable>
            <View style={styles.searchModalField}>
              <Icon
                name="Search"
                size={18}
                color={semantic.textMuted}
                strokeWidth={2.2}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchModalInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="ค้นหาสินค้า"
                placeholderTextColor={semantic.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                  accessibilityLabel="ล้างคำค้น"
                >
                  <View style={styles.searchClear}>
                    <Icon
                      name="X"
                      size={11}
                      color="#FFFFFF"
                      strokeWidth={3}
                    />
                  </View>
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.searchModalScroll}
            showsVerticalScrollIndicator={false}
          >
            {trimmedQuery && searchResults.length === 0 && (
              <View style={styles.searchEmpty}>
                <Icon
                  name="SearchX"
                  size={32}
                  color={semantic.textMuted}
                  strokeWidth={1.6}
                />
                <Text variant="body" color={semantic.textSecondary}>
                  ไม่พบ "{trimmedQuery}"
                </Text>
              </View>
            )}
            {trimmedQuery && searchResults.length > 0 && (
              <Grid
                data={searchResults}
                onPress={(id) => {
                  closeSearch();
                  goToProduct(id);
                }}
                cardWidth={cardWidth}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Sections ---------- */

function PetShopSkeleton({
  shimmerStyle,
  cardWidth,
  numColumns,
}: {
  shimmerStyle: ReturnType<typeof useSkeletonShimmer>;
  cardWidth: number;
  numColumns: number;
}) {
  const tilesPerSection = numColumns * 2;
  return (
    <>
      {[0, 1].map((s) => (
        <View key={`sec-${s}`} style={styles.section}>
          <SkeletonBox width={140} height={16} style={{ marginBottom: spacing.md }} />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: CARD_GAP,
            }}
          >
            {Array.from({ length: tilesPerSection }).map((_, i) => (
              <View
                key={`tile-${s}-${i}`}
                style={[
                  styles.skelTile,
                  { width: cardWidth, height: cardWidth * 1.5 },
                ]}
              >
                <View style={[styles.skelTileImg, { height: cardWidth }]} />
                <View style={{ padding: 10, gap: 8 }}>
                  <SkeletonBox width="80%" height={11} />
                  <SkeletonBox width="60%" height={11} />
                  <SkeletonBox width={60} height={14} />
                </View>
                <SkeletonShimmer shimmerStyle={shimmerStyle} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text weight="600" style={styles.sectionTitle}>
          {title}
        </Text>
        {trailing}
      </View>
      {children}
    </View>
  );
}

function PetStack() {
  return (
    <View style={styles.petStack}>
      {mockPets.slice(0, 4).map((pet, i) => (
        <View
          key={pet.id}
          style={[styles.petAvatar, i > 0 && styles.petAvatarOverlap]}
        >
          {pet.photo ? (
            <Image
              source={pet.photo}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.petAvatarEmoji}>{pet.emoji}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function BigPetStack() {
  return (
    <View style={styles.bigPetStack}>
      {mockPets.slice(0, 3).map((pet, i) => (
        <View
          key={pet.id}
          style={[styles.bigPetAvatarRing, i > 0 && styles.bigPetAvatarOverlap]}
        >
          <PetAvatar pet={pet} size={52} backgroundColor="#FFFFFF" />
        </View>
      ))}
    </View>
  );
}

function Grid({
  data,
  onPress,
  cardWidth,
}: {
  data: Product[];
  onPress: (id: string) => void;
  cardWidth: number;
}) {
  return (
    <View style={styles.grid}>
      {data.map((p) => (
        <ProductTile
          key={p.id}
          product={p}
          onPress={() => onPress(p.id)}
          cardWidth={cardWidth}
        />
      ))}
    </View>
  );
}

/* ---------- Category chip ---------- */

function CategoryChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 140 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <Animated.View
        style={[styles.chip, active && styles.chipActive, animatedStyle]}
      >
        <Icon
          name={icon as any}
          size={16}
          color={active ? '#FFFFFF' : '#3C3C43'}
          strokeWidth={2.2}
        />
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semantic.background,
  },
  scroll: {
    paddingBottom: 0,
  },

  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // Sticky AppBar — same as ProductDetail
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
    paddingHorizontal: SECTION_PAD,
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
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#C25450',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
  },

  // Hero banner — matches PetsList pattern
  heroBlock: {
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
  heroTextTablet: {
    width: 480,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    color: '#1A1A1F',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A4A50',
  },

  // Body sheet — overlaps hero by 24 with rounded top corners
  sheet: {
    backgroundColor: semantic.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  // Glass toolbar — search field + actions, floats over the sheet's top edge
  toolbarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SECTION_PAD,
    marginTop: -24,
    marginBottom: spacing.md,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  searchPillText: {
    fontSize: 15,
    color: '#9A9AA0',
    letterSpacing: -0.2,
  },
  toolbarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  // White content card — wraps chips + sections; rounded top, soft top shadow
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },

  // Category chips
  chipsScroll: {
    paddingHorizontal: SECTION_PAD,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 1000,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  chipActive: {
    backgroundColor: semantic.primary,
  },
  chipText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3C3C43',
    letterSpacing: -0.2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    paddingHorizontal: SECTION_PAD,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  petStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  petAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: semantic.surface,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarOverlap: {
    marginLeft: -8,
  },
  petAvatarEmoji: {
    fontSize: 14,
  },

  // Recommend banner — pink gradient + bigger pet stack peeking from the right
  recBanner: {
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 110,
    marginBottom: 12,
    position: 'relative',
  },
  recBannerText: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 4,
  },
  recBannerTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1A1A',
  },
  recBannerSub: {
    fontSize: 12,
    lineHeight: 16,
    color: '#5C4A4F',
  },
  recBannerPets: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  bigPetStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigPetAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 2,
    shadowColor: '#5E303C',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bigPetAvatarOverlap: {
    marginLeft: -18,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Apple-style morph search overlay (matches CartScreen)
  // Search modal — full-screen sheet
  searchModalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SECTION_PAD,
    paddingVertical: spacing.sm,
  },
  searchModalBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F2F2F3',
  },
  searchModalInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  searchModalScroll: {
    paddingHorizontal: SECTION_PAD,
    paddingBottom: 80,
  },
  searchClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#9A9AA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchEmpty: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  skelTile: {
    backgroundColor: semantic.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  skelTileImg: {
    backgroundColor: '#E6E6E8',
  },
});
