import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  PanResponder,
  Pressable,
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
import { Dimensions } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from '../lib/glass-effect';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Button,
  Icon,
  IconButton,
  StickyAppBar,
  Text,
} from '../components';
import { semantic, spacing } from '../theme';
import { fmtBaht } from '../data/products';
import { useCart, cartStore, CartItem } from '../data/cart';

const LIQUID_GLASS = isLiquidGlassAvailable();

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items } = useCart();

  // Track items the user has unchecked. Newly added items default to selected.
  const [deselected, setDeselected] = useState<Set<string>>(() => new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useSharedValue(0); // 0 closed, 1 open

  const openSearch = () => {
    setSearchOpen(true);
    searchAnim.value = withSpring(1, { damping: 22, stiffness: 200, mass: 0.8 });
    // Auto-focus on next tick so input is mounted
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

  // Morph animation: pill grows from 44px (icon button) to full row width
  const FIELD_MIN_W = 44;
  const CANCEL_W = 60;
  const CANCEL_GAP = 12;
  const TOOLBAR_PAD = 16;
  const FIELD_MAX_W = SCREEN_W - TOOLBAR_PAD * 2 - CANCEL_W - CANCEL_GAP;

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

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeItem = (id: string) => {
    cartStore.setQty(id, 0);
  };
  const isSelected = (id: string) => !deselected.has(id);
  const toggleSelected = (id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter items by search query for display only (totals still based on full cart)
  const visibleItems = searchQuery.trim()
    ? items.filter((i) => {
        const q = searchQuery.toLowerCase();
        return (
          i.product.name.toLowerCase().includes(q) ||
          i.product.brand.toLowerCase().includes(q)
        );
      })
    : items;

  // Derived totals based on selection
  const selectedItems = items.filter((i) => isSelected(i.product.id));
  const selectedCount = selectedItems.length;
  const selectedSubtotal = selectedItems.reduce((sum, i) => {
    const unit =
      i.subscribe && i.product.subscriptionDiscountPct
        ? i.product.priceBaht *
          (1 - i.product.subscriptionDiscountPct / 100)
        : i.product.priceBaht;
    return sum + unit * i.qty;
  }, 0);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const onCheckout = () => {
    if (selectedCount === 0) {
      Alert.alert('ยังไม่เลือกสินค้า', 'กรุณาเลือกอย่างน้อย 1 รายการ');
      return;
    }
    navigation.navigate('Checkout', {
      selectedIds: selectedItems.map((i) => i.product.id),
    });
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyRoot}>
        <AppBackground />
        <StickyAppBar
          scrollY={scrollY}
          leading={{
            icon: 'ChevronLeft',
            onPress: () => navigation.goBack(),
            accessibilityLabel: 'ย้อนกลับ',
          }}
        />
        <View style={[styles.empty, { paddingTop: insets.top + 80 }]}>
          <Icon
            name="ShoppingCart"
            size={72}
            color={semantic.textMuted}
            strokeWidth={1.5}
          />
          <Text variant="h2">ตะกร้าว่าง</Text>
          <Text variant="body" color={semantic.textSecondary} align="center">
            เลือกสินค้าที่คุณต้องการแล้วเพิ่มในตะกร้า
          </Text>
          <Button
            label="กลับไปช้อปปิ้ง"
            onPress={() => navigation.goBack()}
            uppercase={false}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppBackground />

      {/* Morph search overlay — Search icon pill expands into a search field, Cancel slides in from right */}
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
              {/* Liquid Glass material — same as IconButton */}
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
                  placeholder="ค้นหาสินค้าในตะกร้า"
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

      {/* Sticky AppBar — same pattern as ProductDetail */}
      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={60}
        fadeEndAt={120}
        title="ตะกร้าสินค้า"
        leading={
          searchOpen
            ? undefined
            : {
                icon: 'ChevronLeft',
                onPress: () => navigation.goBack(),
                accessibilityLabel: 'ย้อนกลับ',
              }
        }
        trailing={
          searchOpen
            ? undefined
            : {
                icon: 'Search',
                onPress: openSearch,
                accessibilityLabel: 'ค้นหาในตะกร้า',
              }
        }
      />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 56,
            paddingBottom: 220,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero header — title + count */}
        <View style={styles.hero}>
          <Text weight="700" style={styles.heroTitle}>
            ตะกร้าสินค้า
          </Text>
          <Text weight="500" style={styles.heroSubtitle}>
            {items.length} รายการ · เลือก {selectedCount}
          </Text>
        </View>

        {/* Cart items list */}
        <View style={styles.list}>
          {visibleItems.length === 0 && searchQuery.trim() ? (
            <View style={styles.searchEmpty}>
              <Icon
                name="SearchX"
                size={32}
                color={semantic.textMuted}
                strokeWidth={1.6}
              />
              <Text variant="body" color={semantic.textSecondary}>
                ไม่พบ "{searchQuery}" ในตะกร้า
              </Text>
            </View>
          ) : null}
          {visibleItems.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              selected={isSelected(item.product.id)}
              isFavorite={favoriteIds.has(item.product.id)}
              onToggleSelected={() => toggleSelected(item.product.id)}
              onToggleFavorite={() => toggleFavorite(item.product.id)}
              onDelete={() => removeItem(item.product.id)}
              onInc={() =>
                cartStore.setQty(item.product.id, item.qty + 1)
              }
              onDec={() =>
                cartStore.setQty(item.product.id, item.qty - 1)
              }
              onPress={() =>
                navigation.navigate('ProductDetail', {
                  productId: item.product.id,
                })
              }
            />
          ))}
        </View>
      </Animated.ScrollView>

      {/* Sticky bottom bar — count + total + checkout */}
      <View
        pointerEvents="box-none"
        style={[styles.actionBarWrap, { paddingBottom: spacing.sm }]}
      >
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

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                เลือก {selectedCount} รายการ
              </Text>
              <Text weight="700" style={styles.summaryTotal}>
                {fmtBaht(selectedSubtotal)}
              </Text>
            </View>
            <Button
              label="ชำระเงิน"
              variant="primary"
              uppercase={false}
              onPress={onCheckout}
              style={styles.checkoutBtn}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- CartItemRow ---------- */

const ACTIONS_W = 200; // 56 each × 3 buttons (cancel, favorite, delete) + spacing

function CartItemRow({
  item,
  selected,
  isFavorite,
  onToggleSelected,
  onToggleFavorite,
  onDelete,
  onInc,
  onDec,
  onPress,
}: {
  item: CartItem;
  selected: boolean;
  isFavorite: boolean;
  onToggleSelected: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onInc: () => void;
  onDec: () => void;
  onPress: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const unitPrice =
    item.subscribe && item.product.subscriptionDiscountPct
      ? item.product.priceBaht *
        (1 - item.product.subscriptionDiscountPct / 100)
      : item.product.priceBaht;
  const linePrice = unitPrice * item.qty;

  // Swipe-to-reveal state
  const translateX = useSharedValue(0);
  const isOpenRef = useRef(false);

  const closeSwipe = () => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    isOpenRef.current = false;
  };
  const openSwipe = () => {
    translateX.value = withSpring(-ACTIONS_W, { damping: 18, stiffness: 220 });
    isOpenRef.current = true;
  };

  const panResponder = useRef(
    PanResponder.create({
      // Only claim on a clear horizontal drag — tall threshold so taps on inner buttons go through
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
      onPanResponderMove: (_, g) => {
        const start = isOpenRef.current ? -ACTIONS_W : 0;
        const next = start + g.dx;
        translateX.value = Math.max(-ACTIONS_W * 1.3, Math.min(0, next));
      },
      onPanResponderRelease: (_, g) => {
        const start = isOpenRef.current ? -ACTIONS_W : 0;
        const final = start + g.dx;
        if (final < -ACTIONS_W * 0.3 || g.vx < -0.3) openSwipe();
        else closeSwipe();
      },
      onPanResponderTerminate: (_, g) => {
        const start = isOpenRef.current ? -ACTIONS_W : 0;
        const final = start + g.dx;
        if (final < -ACTIONS_W * 0.3) openSwipe();
        else closeSwipe();
      },
    }),
  ).current;

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Action button reveal animations — staggered scale + fade based on swipe progress.
  // Order revealed: Delete (rightmost, first) → Favorite → Cancel (leftmost, last)
  const delBtnStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, -translateX.value / ACTIONS_W);
    return {
      opacity: interpolate(progress, [0, 0.4, 1], [0, 0.4, 1], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(progress, [0, 0.5, 1], [0.3, 0.75, 1], Extrapolation.CLAMP) },
        { translateX: interpolate(progress, [0, 1], [70, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const favBtnStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, -translateX.value / ACTIONS_W);
    return {
      opacity: interpolate(progress, [0.15, 0.55, 1], [0, 0.4, 1], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(progress, [0.15, 0.65, 1], [0.3, 0.75, 1], Extrapolation.CLAMP) },
        { translateX: interpolate(progress, [0, 1], [50, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const cancelBtnStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, -translateX.value / ACTIONS_W);
    return {
      opacity: interpolate(progress, [0.3, 0.7, 1], [0, 0.4, 1], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(progress, [0.3, 0.8, 1], [0.3, 0.75, 1], Extrapolation.CLAMP) },
        { translateX: interpolate(progress, [0, 1], [30, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const handleCardPress = () => {
    if (isOpenRef.current) {
      closeSwipe();
      return;
    }
    onPress();
  };
  const handleFavorite = () => {
    onToggleFavorite();
    closeSwipe();
  };
  const handleDelete = () => {
    onDelete();
    // No need to close — the row will unmount
  };

  return (
    <View style={styles.swipeContainer} {...panResponder.panHandlers}>
      {/* Circular action buttons revealed from the right with staggered scale-fade */}
      <View style={styles.swipeActions} pointerEvents="box-none">
        <Animated.View style={[styles.actionSlot, cancelBtnStyle]}>
          <Pressable
            onPress={closeSwipe}
            style={({ pressed }) => [
              styles.actionCircle,
              styles.actionCircleCancel,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
            ]}
            accessibilityLabel="ยกเลิก"
          >
            <Icon name="X" size={22} color="#1A1A1A" strokeWidth={2.4} />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.actionSlot, favBtnStyle]}>
          <Pressable
            onPress={handleFavorite}
            style={({ pressed }) => [
              styles.actionCircle,
              styles.actionCircleFav,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
            ]}
            accessibilityLabel={isFavorite ? 'เลิกถูกใจ' : 'เพิ่มถูกใจ'}
          >
            <Icon
              name="Heart"
              size={22}
              color="#FFFFFF"
              strokeWidth={2.4}
              fill={isFavorite ? '#FFFFFF' : 'none'}
            />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.actionSlot, delBtnStyle]}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.actionCircle,
              styles.actionCircleDel,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
            ]}
            accessibilityLabel="ลบสินค้า"
          >
            <Icon name="Trash2" size={22} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </Animated.View>
      </View>

      {/* Swipeable card content */}
      <Animated.View style={swipeStyle}>
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [
        styles.itemCard,
        pressed && { opacity: 0.94 },
      ]}
    >
      {/* Image square — 80px white card on left */}
      <View style={styles.itemImageWrap}>
        <View style={styles.itemImage}>
          {item.product.imageUrl && !imgFailed ? (
            <Image
              source={{ uri: item.product.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <Text style={{ fontSize: 36 }}>{item.product.emoji}</Text>
          )}
        </View>
      </View>

      {/* Content right */}
      <View style={styles.itemContent}>
        {/* Top row: name + checkbox to select for checkout */}
        <View style={styles.itemTopRow}>
          <Text
            weight="500"
            style={styles.itemName}
            numberOfLines={1}
          >
            {item.product.name}
          </Text>
          <Pressable
            onPress={onToggleSelected}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel="เลือกสินค้า"
          >
            <View
              style={[
                styles.itemCheckbox,
                selected && styles.itemCheckboxSelected,
              ]}
            >
              {selected && (
                <Icon
                  name="Check"
                  size={13}
                  color="#FFFFFF"
                  strokeWidth={3}
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* Bottom row: price + qty controls */}
        <View style={styles.itemBottomRow}>
          <View style={styles.priceWrap}>
            <Text weight="600" style={styles.itemPrice}>
              {fmtBaht(linePrice)}
            </Text>
            {item.subscribe && (
              <View style={styles.subInline}>
                <Icon
                  name="RefreshCw"
                  size={10}
                  color={semantic.primary}
                  strokeWidth={2.4}
                />
              </View>
            )}
          </View>
          <View style={styles.qtyControls}>
            <IconButton
              icon="Minus"
              size="sm"
              onPress={onDec}
              accessibilityLabel="ลดจำนวน"
            />
            <Text weight="500" style={styles.qtyText}>
              {item.qty}
            </Text>
            <IconButton
              icon="Plus"
              size="sm"
              onPress={onInc}
              accessibilityLabel="เพิ่มจำนวน"
            />
          </View>
        </View>
      </View>
    </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  emptyRoot: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // Hero
  hero: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },

  // List
  list: {
    gap: spacing.sm,
  },

  // Apple-style expanding search overlay
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11, // above StickyAppBar (10)
  },
  // Morph search field — animates width / height / borderRadius
  searchMorphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
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
    // Drop shadow matching IconButton
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

  // Swipe-to-reveal — outer container clips overflow, action buttons sit underneath
  swipeContainer: {
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  swipeActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTIONS_W,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  actionSlot: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  actionCircleCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D4',
  },
  actionCircleFav: {
    backgroundColor: '#E8A87C', // honey/warning from theme — friendlier than red for "favorite"
  },
  actionCircleDel: {
    backgroundColor: '#C25450',
  },

  // Item card — white pill 96px tall, image left + content right
  itemCard: {
    flexDirection: 'row',
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E8',
    overflow: 'hidden',
  },
  itemImageWrap: {
    padding: 8,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemContent: {
    flex: 1,
    paddingRight: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  itemCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D0D0D4',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCheckboxSelected: {
    backgroundColor: semantic.primary,
    borderColor: semantic.primary,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subInline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F5E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyText: {
    minWidth: 16,
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Sticky bottom action bar (matches ProductDetail style)
  actionBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  actionBarShadow: {
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#5E303C',
    shadowOpacity: 0.28,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  actionBar: {
    borderRadius: 42,
    padding: spacing['2xl'],
    gap: spacing['2xl'],
    overflow: 'hidden',
  },
  actionBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242,242,243,0.55)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  summaryTotal: {
    fontSize: 24,
    lineHeight: 32,
    color: '#4FB36C',
    letterSpacing: -0.3,
  },
  checkoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
  },
});
