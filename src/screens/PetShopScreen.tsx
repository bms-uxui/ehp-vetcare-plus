import { ReactNode, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from '../lib/glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabsParamList } from '../navigation/AppTabs';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, IconButton, Text } from '../components';
import { semantic, spacing } from '../theme';
import {
  mockProducts,
  categoryMeta,
  ProductCategory,
  fmtBaht,
  Product,
} from '../data/products';
import { mockPets } from '../data/pets';
import { useCart } from '../data/cart';
import { mockOrders } from '../data/orders';

type Props = BottomTabScreenProps<AppTabsParamList, 'PetShop'>;

const SCREEN_W = Dimensions.get('window').width;
const SECTION_PAD = 16;
const CARD_GAP = 10;
const CARD_W = (SCREEN_W - SECTION_PAD * 2 - CARD_GAP) / 2;

// Bar fades in once the large title scrolls under the app bar
const FADE_START = 30;
const FADE_END = 90;

// Morph search field — same constants as CartScreen for consistency
const LIQUID_GLASS = isLiquidGlassAvailable();
const FIELD_MIN_W = 44;
const CANCEL_W = 60;
const CANCEL_GAP = 12;
const TOOLBAR_PAD = 16;
const FIELD_MAX_W = SCREEN_W - TOOLBAR_PAD * 2 - CANCEL_W - CANCEL_GAP;

export default function PetShopScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { count } = useCart();
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
  const searchAnim = useSharedValue(0);

  const openSearch = () => {
    setSearchOpen(true);
    searchAnim.value = withSpring(1, {
      damping: 22,
      stiffness: 200,
      mass: 0.8,
    });
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };
  const closeSearch = () => {
    Keyboard.dismiss();
    searchAnim.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setSearchOpen)(false);
        runOnJS(setSearchQuery)('');
      }
    });
  };

  const fieldStyle = useAnimatedStyle(() => ({
    width: interpolate(
      searchAnim.value,
      [0, 1],
      [FIELD_MIN_W, FIELD_MAX_W],
    ),
  }));
  const fieldContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      searchAnim.value,
      [0.4, 0.9],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const cancelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      searchAnim.value,
      [0.55, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          searchAnim.value,
          [0.55, 1],
          [24, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
    width: interpolate(searchAnim.value, [0, 0.55, 1], [0, 0, CANCEL_W]),
  }));

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
      <AppBackground />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56 + spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Large title (Apple App Store style) — scrolls away on scroll */}
        <View style={styles.heroTitleWrap}>
          <Text variant="h1" style={styles.heroTitle}>
            ร้านค้า
          </Text>
        </View>

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

        {trimmedQuery ? (
          // Search results — replaces all sections when query is active
          <Section title={`ผลการค้นหา (${searchResults.length})`}>
            {searchResults.length > 0 ? (
              <Grid data={searchResults} onPress={goToProduct} />
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
                <Grid data={featured} onPress={goToProduct} />
              </Section>
            )}

            {/* Recommend for your pets */}
            {!activeCategory && recommended.length > 0 && (
              <Section
                title="แนะนำสำหรับสัตว์ของคุณ"
                trailing={<PetStack />}
              >
                <Grid data={recommended.slice(0, 4)} onPress={goToProduct} />
              </Section>
            )}

            {/* All products / filtered */}
            <Section
              title={
                activeCategory
                  ? `${categoryMeta[activeCategory].label} (${allProducts.length})`
                  : `สินค้าทั้งหมด (${allProducts.length})`
              }
            >
              <Grid data={allProducts} onPress={goToProduct} />
            </Section>
          </>
        )}

        {/* Bottom space for tab bar */}
        <View style={{ height: 110 }} />
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

          <View style={styles.appbarActions}>
            {!searchOpen && (
              <>
                <IconButton
                  icon="Search"
                  size="md"
                  onPress={openSearch}
                  accessibilityLabel="ค้นหา"
                />
                <View>
                  <IconButton
                    icon="Package"
                    size="md"
                    onPress={() => rootNav.navigate('OrderTracking')}
                    accessibilityLabel="ติดตามคำสั่งซื้อ"
                  />
                  {activeOrderCount > 0 && (
                    <View style={styles.cartBadge} pointerEvents="none">
                      <Text weight="700" style={styles.cartBadgeText}>
                        {activeOrderCount > 99 ? '99+' : activeOrderCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <IconButton
                    icon="ShoppingCart"
                    size="md"
                    onPress={() => rootNav.navigate('Cart')}
                    accessibilityLabel="ตะกร้า"
                  />
                  {count > 0 && (
                    <View style={styles.cartBadge} pointerEvents="none">
                      <Text weight="700" style={styles.cartBadgeText}>
                        {count > 99 ? '99+' : count}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Apple-style morph search overlay — sits above appbar (zIndex 11) */}
      {searchOpen && (
        <View
          pointerEvents="box-none"
          style={[
            styles.searchOverlay,
            { paddingTop: insets.top, height: insets.top + 56 },
          ]}
        >
          <View style={styles.searchMorphRow}>
            <Animated.View style={[styles.searchMorphField, fieldStyle]}>
              {LIQUID_GLASS ? (
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme="light"
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <>
                  <BlurView
                    intensity={70}
                    tint="systemThinMaterialLight"
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.searchMorphTint]}
                  />
                </>
              )}
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, styles.searchMorphHairline]}
              />
              <Icon
                name="Search"
                size={18}
                color="#1A1A1A"
                strokeWidth={2.2}
              />
              <Animated.View
                style={[styles.searchMorphInner, fieldContentStyle]}
              >
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
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
              </Animated.View>
            </Animated.View>
            <Animated.View style={cancelStyle}>
              <Pressable onPress={closeSearch} hitSlop={8}>
                <Text weight="500" style={styles.searchCancel}>
                  ยกเลิก
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- Sections ---------- */

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
        <Icon
          name="ChevronRight"
          size={14}
          color={semantic.textSecondary}
          strokeWidth={2.6}
        />
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

function Grid({
  data,
  onPress,
}: {
  data: Product[];
  onPress: (id: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {data.map((p) => (
        <ProductCard key={p.id} product={p} onPress={() => onPress(p.id)} />
      ))}
    </View>
  );
}

/* ---------- Product card ---------- */

function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const isOnSale = !!product.originalPriceBaht;
  const priceColor = isOnSale ? '#C25450' : '#4FB36C';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.cardImage}>
        {product.imageUrl && !imgFailed ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={styles.cardEmoji}>{product.emoji}</Text>
        )}
        {isOnSale && (
          <View style={styles.saleBadge}>
            <Text weight="700" style={styles.saleBadgeText}>
              SALE
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text weight="600" style={styles.cardBrand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text weight="600" style={styles.cardName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text weight="700" style={[styles.cardPrice, { color: priceColor }]}>
          {fmtBaht(product.priceBaht)}
        </Text>
      </View>
    </Pressable>
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon
        name={icon as any}
        size={12}
        color={active ? '#FFFFFF' : '#3C3C43'}
        strokeWidth={2.4}
      />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
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

  // Hero title (large title in content area)
  heroTitleWrap: {
    paddingHorizontal: SECTION_PAD,
    paddingBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 41,
    color: '#1A1A1A',
    letterSpacing: -0.4,
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 1000,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  chipActive: {
    backgroundColor: semantic.primary,
  },
  chipText: {
    fontSize: 13,
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

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Card — white container holds image + body, single drop shadow
  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardImage: {
    width: CARD_W,
    height: CARD_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 56,
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#C25450',
  },
  saleBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  cardBody: {
    padding: 12,
    gap: 2,
  },
  cardBrand: {
    fontSize: 10,
    lineHeight: 13,
    color: '#9A9AA0',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardName: {
    fontSize: 13,
    lineHeight: 17,
    color: '#1A1A1A',
  },
  cardPrice: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },

  // Apple-style morph search overlay (matches CartScreen)
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11, // above sticky AppBar (10)
  },
  searchMorphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: SECTION_PAD,
    height: 56,
  },
  searchMorphField: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  searchMorphTint: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  searchMorphHairline: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  searchMorphInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  searchClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#9A9AA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCancel: {
    fontSize: 15,
    color: semantic.primary,
  },
  searchEmpty: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
});
