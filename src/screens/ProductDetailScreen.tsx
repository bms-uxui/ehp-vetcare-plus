import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, Button, Icon, IconButton, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockProducts, categoryMeta, fmtBaht, getProductImages, Product } from '../data/products';
import { cartStore, useCart } from '../data/cart';

const LIQUID_GLASS = isLiquidGlassAvailable();

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const product = mockProducts.find((p) => p.id === productId);
  const [qty, setQty] = useState(1);
  const [page, setPage] = useState(0);
  const [failedSet, setFailedSet] = useState<Set<number>>(() => new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const cart = useCart();
  const cartIconRef = useRef<View>(null);
  const addBtnRef = useRef<View>(null);

  // Flying ball animation values
  const ballX = useSharedValue(0);
  const ballY = useSharedValue(0);
  const ballScale = useSharedValue(0);
  const ballOpacity = useSharedValue(0);
  // Cart icon bump on receive
  const cartBump = useSharedValue(1);
  const badgePulse = useSharedValue(0);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  if (!product) {
    return (
      <View style={styles.errorRoot}>
        <Text variant="h3">ไม่พบสินค้า</Text>
      </View>
    );
  }

  const cat = categoryMeta[product.category];
  // Up to 6 related products from the same category, excluding the current one
  const relatedProducts = mockProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 6);
  const images = getProductImages(product);
  const allFailed = images.length === 0 || images.every((_, i) => failedSet.has(i));
  const isOnSale = !!product.originalPriceBaht;
  // Green for regular, red for promotional / sale
  const priceColor = isOnSale ? '#C25450' : '#4FB36C';

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const w = e.nativeEvent.layoutMeasurement.width;
    if (w <= 0) return;
    const next = Math.round(x / w);
    if (next !== page) setPage(next);
  };

  const markFailed = (i: number) => {
    setFailedSet((s) => {
      if (s.has(i)) return s;
      const next = new Set(s);
      next.add(i);
      return next;
    });
  };

  // Bar fades in early as user starts scrolling — quick, snappy iOS 26 feel
  const FADE_START = HERO_HEIGHT * 0.3;
  const FADE_END = HERO_HEIGHT * 0.55;

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

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value },
      { translateY: ballY.value },
      { scale: ballScale.value },
    ],
    opacity: ballOpacity.value,
  }));

  const cartBumpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBump.value }],
  }));

  const badgePopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + badgePulse.value * 0.4 }],
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

  const playFlyToCart = () => {
    if (!addBtnRef.current || !cartIconRef.current) return;
    addBtnRef.current.measureInWindow((bx, by, bw, bh) => {
      cartIconRef.current!.measureInWindow((cx, cy, cw, ch) => {
        const startX = bx + bw / 2 - 16; // ball is 32px
        const startY = by + bh / 2 - 16;
        const endX = cx + cw / 2 - 16;
        const endY = cy + ch / 2 - 16;
        const peakY = Math.min(startY, endY) - 60; // arc rises above the higher of the two

        // Reset + position at button
        ballX.value = startX;
        ballY.value = startY;
        ballScale.value = 0;
        ballOpacity.value = 0;

        // Animate
        ballScale.value = withSequence(
          withTiming(1, { duration: 120, easing: Easing.out(Easing.back(2)) }),
          withDelay(450, withTiming(0, { duration: 150 })),
        );
        ballOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(420, withTiming(0, { duration: 200 })),
        );
        // X is linear-ish travel
        ballX.value = withTiming(endX, {
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
        });
        // Y is a parabolic arc — up first, then down to cart
        ballY.value = withSequence(
          withTiming(peakY, {
            duration: 320,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(endY, {
            duration: 380,
            easing: Easing.in(Easing.quad),
          }),
        );
        // Cart bump triggered after ball arrives (~700ms)
        cartBump.value = withDelay(
          640,
          withSequence(
            withTiming(1.25, { duration: 160, easing: Easing.out(Easing.quad) }),
            withSpring(1, { damping: 6, stiffness: 220 }),
          ),
        );
        // Badge pulse
        badgePulse.value = withDelay(
          640,
          withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 220 }),
          ),
        );
      });
    });
  };

  const onAddToCart = () => {
    for (let i = 0; i < qty; i++) cartStore.add(product, false);
    playFlyToCart();
  };

  const onCheckout = () => {
    for (let i = 0; i < qty; i++) cartStore.add(product, false);
    navigation.navigate('Checkout', { selectedIds: [product.id] });
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: cat.bg }]}>
          {/* Swipeable image carousel — wrapped in Animated.View for parallax stretch */}
          {!allFailed ? (
            <Animated.View style={[StyleSheet.absoluteFill, heroStretchStyle]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onCarouselScroll}
                scrollEventThrottle={16}
                style={StyleSheet.absoluteFill}
              >
              {images.map((url, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (!failedSet.has(i)) setLightboxIndex(i);
                  }}
                  style={{ width: SCREEN_W, height: HERO_HEIGHT }}
                >
                  {failedSet.has(i) ? (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.heroEmojiCenter,
                        { backgroundColor: cat.bg },
                      ]}
                    >
                      <Text style={styles.heroEmoji}>{product.emoji}</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: url }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                      onError={() => markFailed(i)}
                    />
                  )}
                </Pressable>
              ))}
              </ScrollView>
            </Animated.View>
          ) : (
            <Animated.View style={[StyleSheet.absoluteFill, styles.heroEmojiCenter, heroStretchStyle]}>
              <Text style={styles.heroEmoji}>{product.emoji}</Text>
            </Animated.View>
          )}

          {/* Bottom fade — only behind footer text for legibility */}
          {!allFailed && (
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroBottomFade}
              pointerEvents="none"
            />
          )}

          {/* Spacer pushes footer to bottom */}
          <View style={styles.heroSpacer} />

          {/* Hero footer — page dots + title + chips */}
          <View style={styles.heroFooter} pointerEvents="box-none">
            {images.length > 1 && (
              <View style={styles.dotsRow} pointerEvents="none">
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === page && styles.dotActive,
                      !allFailed && styles.dotOnImage,
                      !allFailed && i === page && styles.dotActiveOnImage,
                    ]}
                  />
                ))}
              </View>
            )}
            <Text
              variant="h1"
              style={[
                styles.heroTitle,
                !allFailed && styles.heroTitleOnImage,
              ]}
              numberOfLines={2}
            >
              {product.name}
            </Text>
            <View style={styles.chipsRow}>
              <HeroChip icon={cat.icon} label={cat.label} />
              <HeroChip icon="Star" label={product.rating.toFixed(1)} />
              <HeroChip
                icon="MessageSquare"
                label={`${product.reviewCount}`}
              />
            </View>
          </View>
        </View>

        {/* Body cards */}
        <View style={styles.body}>
          <View style={styles.priceCard}>
            <Text weight="600" style={styles.brandLabel}>
              {product.brand}
            </Text>

            <View style={styles.priceRow}>
              <Text weight="700" style={[styles.price, { color: priceColor }]}>
                {fmtBaht(product.priceBaht)}
              </Text>
              {product.originalPriceBaht && (
                <Text weight="400" style={styles.originalPrice}>
                  {fmtBaht(product.originalPriceBaht)}
                </Text>
              )}
              {product.originalPriceBaht && (
                <View style={[styles.savingsPill, isOnSale && styles.savingsPillSale]}>
                  <Text
                    weight="700"
                    style={[styles.savingsText, isOnSale && styles.savingsTextSale]}
                  >
                    -{Math.round(
                      ((product.originalPriceBaht - product.priceBaht) /
                        product.originalPriceBaht) *
                        100,
                    )}%
                  </Text>
                </View>
              )}
            </View>

            {product.subscriptionEligible &&
              product.subscriptionDiscountPct && (
                <View style={styles.subPreview}>
                  <Icon
                    name="RefreshCw"
                    size={13}
                    color={semantic.primary}
                    strokeWidth={2.4}
                  />
                  <Text weight="500" style={styles.subPreviewText}>
                    สมัครสมาชิก ลดเพิ่ม {product.subscriptionDiscountPct}% ={' '}
                    <Text weight="700" style={styles.subPreviewPrice}>
                      {fmtBaht(
                        product.priceBaht *
                          (1 - product.subscriptionDiscountPct / 100),
                      )}
                    </Text>
                  </Text>
                </View>
              )}

            <Text variant="body" style={styles.description}>
              {product.description}
            </Text>
          </View>

          <View style={styles.shipCard}>
            {/* Row 1 — From clinic */}
            <View style={styles.shipRow}>
              <View style={styles.shipIconWrap}>
                <Icon
                  name="Hospital"
                  size={16}
                  color={semantic.primary}
                  strokeWidth={2.2}
                />
              </View>
              <View style={styles.shipRowContent}>
                <Text weight="500" style={styles.shipLabel}>
                  จัดส่งจาก
                </Text>
                <Text weight="600" style={styles.shipValue}>
                  {product.clinic ?? 'EHP VetCare สาขาสุขุมวิท'}
                </Text>
              </View>
            </View>

            <View style={styles.shipDivider} />

            {/* Row 2 — Delivery time + free badge */}
            <View style={styles.shipRow}>
              <View style={styles.shipIconWrap}>
                <Icon
                  name="Truck"
                  size={16}
                  color={semantic.primary}
                  strokeWidth={2.2}
                />
              </View>
              <View style={styles.shipRowContent}>
                <Text weight="500" style={styles.shipLabel}>
                  ระยะเวลาจัดส่ง
                </Text>
                <View style={styles.shipValueRow}>
                  <Text weight="600" style={styles.shipValue}>
                    1–2 วันทำการ
                  </Text>
                  <View style={styles.freePill}>
                    <Icon
                      name="Check"
                      size={11}
                      color="#2E8049"
                      strokeWidth={3}
                    />
                    <Text weight="700" style={styles.freeText}>
                      ฟรีค่าจัดส่ง
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {product.tags && product.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text variant="caption" color={semantic.textSecondary}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Text weight="700" style={styles.relatedTitle}>
                  สินค้าแนะนำ
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('PetShop')}
                  hitSlop={8}
                >
                  <Text weight="600" style={styles.relatedLink}>
                    ดูทั้งหมด ›
                  </Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_W + CARD_GAP}
                decelerationRate="fast"
                contentContainerStyle={styles.relatedScroll}
              >
                {relatedProducts.map((p) => (
                  <RelatedCard
                    key={p.id}
                    product={p}
                    onPress={() =>
                      navigation.push('ProductDetail', { productId: p.id })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Sticky AppBar — Apple iOS pattern: floating buttons + glass bar that fades in on scroll */}
      <View
        pointerEvents="box-none"
        style={[styles.appbar, { paddingTop: insets.top, height: insets.top + 56 }]}
      >
        {/* Apple-style nav bar — progressive blur fading top→bottom.
            Stacked BlurView layers + gradient white tint for iOS 26 look. */}
        <Animated.View style={[StyleSheet.absoluteFill, barBgStyle]} pointerEvents="none">
          <BlurView
            intensity={40}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <BlurView
            intensity={60}
            tint="systemChromeMaterialLight"
            style={styles.blurMid}
          />
          <BlurView
            intensity={100}
            tint="systemChromeMaterialLight"
            style={styles.blurTop}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            locations={[0, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.barHairline} />
        </Animated.View>

        {/* Foreground content — buttons + animated title */}
        <View style={styles.appbarContent}>
          <IconButton
            icon="ChevronLeft"
            size="md"
            onPress={() => navigation.goBack()}
            accessibilityLabel="ย้อนกลับ"
          />
          <Animated.View
            style={[styles.appbarTitleWrap, titleStyle]}
            pointerEvents="none"
          >
            <Text
              variant="bodyStrong"
              style={styles.appbarTitle}
              numberOfLines={1}
            >
              {product.name}
            </Text>
          </Animated.View>
          <View ref={cartIconRef} collapsable={false}>
            <Animated.View style={cartBumpStyle}>
              <IconButton
                icon="ShoppingCart"
                size="md"
                onPress={() => navigation.navigate('Cart')}
                accessibilityLabel="ตะกร้าสินค้า"
              />
            </Animated.View>
            {cart.count > 0 && (
              <Animated.View
                style={[styles.cartBadge, badgePopStyle]}
                pointerEvents="none"
              >
                <Text weight="700" style={styles.cartBadgeText}>
                  {cart.count > 99 ? '99+' : cart.count}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </View>

      {/* Sticky action bar (bottom) — glass blur, content scrolls behind */}
      <View
        pointerEvents="box-none"
        style={[
          styles.actionBarWrap,
          { paddingBottom: spacing.sm },
        ]}
      >
        <View style={styles.actionBarShadow}>
        <View style={styles.actionBar}>
          {/* Glass material backdrop */}
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
          {/* Subtle gray tint to keep the F2F2F3 feeling */}
          <View pointerEvents="none" style={styles.actionBarTint} />

          <View style={styles.qtyRow}>
            <IconButton
              icon="Minus"
              size="sm"
              disabled={qty <= 1}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              accessibilityLabel="ลดจำนวน"
            />
            <Text variant="bodyStrong" style={styles.qtyText}>
              {qty}
            </Text>
            <IconButton
              icon="Plus"
              size="sm"
              onPress={() => setQty((q) => q + 1)}
              accessibilityLabel="เพิ่มจำนวน"
            />
          </View>

          <View style={styles.btnRow}>
            <View ref={addBtnRef} collapsable={false} style={styles.flexBtnWrap}>
              <Button
                label="เพิ่มในตะกร้า"
                variant="secondary"
                uppercase={false}
                onPress={onAddToCart}
                style={styles.flexBtn}
              />
            </View>
            <View style={styles.flexBtnWrap}>
              <Button
                label="ชำระเงิน"
                variant="primary"
                uppercase={false}
                onPress={onCheckout}
                style={styles.flexBtn}
              />
            </View>
          </View>
        </View>
        </View>
      </View>

      {/* Flying ball overlay — animated from add-to-cart button to cart icon */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flyingBall, ballStyle]}
      >
        <Icon name="ShoppingBag" size={16} color="#FFFFFF" strokeWidth={2.4} />
      </Animated.View>

      {/* Fullscreen image lightbox */}
      <Modal
        visible={lightboxIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxIndex(null)}
        statusBarTranslucent
      >
        {lightboxIndex !== null && (
          <Lightbox
            images={images.filter((_, i) => !failedSet.has(i))}
            initialIndex={Math.min(
              lightboxIndex,
              images.filter((_, i) => !failedSet.has(i)).length - 1,
            )}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </Modal>
    </View>
  );
}

/* Related product card — used in horizontal "สินค้าแนะนำ" carousel */
function RelatedCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = categoryMeta[product.category];
  const isOnSale = !!product.originalPriceBaht;
  const priceColor = isOnSale ? '#C25450' : '#4FB36C';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.relatedCard,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
      ]}
    >
      <View style={[styles.relatedImage, { backgroundColor: cat.bg }]}>
        {product.imageUrl && !imgFailed ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={{ fontSize: 48 }}>{product.emoji}</Text>
        )}
        {isOnSale && (
          <View style={styles.relatedSaleBadge}>
            <Text weight="700" style={styles.relatedSaleText}>
              SALE
            </Text>
          </View>
        )}
      </View>
      <View style={styles.relatedBody}>
        <Text weight="600" style={styles.relatedBrand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text weight="600" style={styles.relatedName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text weight="700" style={[styles.relatedPrice, { color: priceColor }]}>
          {fmtBaht(product.priceBaht)}
        </Text>
      </View>
    </Pressable>
  );
}

/* Lightbox: fullscreen image viewer with horizontal paging + close button */
function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const screenH = Dimensions.get('window').height;
  const [page, setPage] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Snap to the initial page after mount.
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: initialIndex * SCREEN_W,
        y: 0,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [initialIndex]);

  return (
    <View style={styles.lightboxRoot}>
      <RNStatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const w = e.nativeEvent.layoutMeasurement.width;
          if (w <= 0) return;
          const next = Math.round(x / w);
          if (next !== page) setPage(next);
        }}
        scrollEventThrottle={16}
        contentOffset={{ x: initialIndex * SCREEN_W, y: 0 }}
      >
        {images.map((url, i) => (
          <Pressable
            key={i}
            onPress={onClose}
            style={{
              width: SCREEN_W,
              height: screenH,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={{ uri: url }}
              style={{ width: SCREEN_W, height: screenH * 0.75 }}
              resizeMode="contain"
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Close button — white icon for dark backdrop */}
      <View
        style={[
          styles.lightboxCloseWrap,
          { top: insets.top + 12, right: spacing.lg },
        ]}
      >
        <IconButton
          icon="X"
          size="md"
          iconColor="#FFFFFF"
          onPress={onClose}
          accessibilityLabel="ปิด"
        />
      </View>

      {/* Counter */}
      {images.length > 1 && (
        <View
          style={[
            styles.lightboxCounterWrap,
            { bottom: insets.bottom + spacing.xl },
          ]}
          pointerEvents="none"
        >
          <View style={styles.lightboxCounterPill}>
            <Text style={styles.lightboxCounterText}>
              {page + 1} / {images.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- Sub-components ---------- */

function HeroChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Icon name={icon as any} size={11} color="#1A1A1A" strokeWidth={2.4} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const HERO_HEIGHT = 450;
const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = 12;
const RELATED_HPAD = 16;
const CARD_W = (SCREEN_W - RELATED_HPAD * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 220,
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
  barTint: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  blurMid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  blurTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  barHairline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    overflow: 'visible',
    position: 'relative',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  heroSpacer: {
    flex: 1,
  },
  heroEmojiCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 140,
  },
  heroFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  heroTitleOnImage: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  dotActive: {
    width: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  dotOnImage: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActiveOnImage: {
    backgroundColor: '#FFFFFF',
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
    paddingTop: spacing.md,
    gap: 10,
  },
  priceCard: {
    padding: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
  },
  brandLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#6E6E74',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  price: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '800',
    color: '#4FB36C',
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9A9AA0',
    textDecorationLine: 'line-through',
  },
  savingsPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#E7F5E9',
  },
  savingsPillSale: {
    backgroundColor: '#FBE8E7',
  },
  savingsText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: '#2E8049',
    letterSpacing: 0.2,
  },
  savingsTextSale: {
    color: '#A63A35',
  },
  subPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.lg,
    backgroundColor: '#FBF3F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5E4E7',
    alignSelf: 'flex-start',
  },
  subPreviewText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  subPreviewPrice: {
    fontWeight: '800',
    color: semantic.primary,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1A1A1A',
    marginTop: 4,
  },
  shipCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F5E4E7',
    gap: spacing.md,
  },
  shipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  shipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FBF3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  shipRowContent: {
    flex: 1,
    gap: 2,
  },
  shipLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#6E6E74',
    letterSpacing: 0.2,
  },
  shipValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  shipValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  shipDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F5E4E7',
    marginLeft: 32 + spacing.md, // align with text content (skip icon column)
  },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#E7F5E9',
  },
  freeText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#2E8049',
    letterSpacing: 0.2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
  },

  // Related products section
  relatedSection: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  relatedTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  relatedLink: {
    fontSize: 13,
    lineHeight: 18,
    color: semantic.primary,
  },
  relatedScroll: {
    paddingHorizontal: RELATED_HPAD,
    gap: CARD_GAP,
  },
  relatedCard: {
    width: CARD_W,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E8',
  },
  relatedImage: {
    width: CARD_W,
    height: CARD_W,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  relatedSaleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#C25450',
  },
  relatedSaleText: {
    fontSize: 9,
    lineHeight: 12,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  relatedBody: {
    padding: 12,
    gap: 4,
  },
  relatedBrand: {
    fontSize: 10,
    lineHeight: 13,
    color: '#9A9AA0',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  relatedName: {
    fontSize: 13,
    lineHeight: 17,
    color: '#1A1A1A',
  },
  relatedPrice: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },

  // Sticky action bar (bottom) — translucent glass; content can scroll behind
  actionBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    // No backgroundColor — transparent so content blurs through the bar
  },
  actionBar: {
    borderRadius: 42,
    padding: spacing['2xl'],
    gap: spacing['2xl'],
    overflow: 'hidden',
  },
  // Outer wrapper shadow — clipping (overflow:hidden on actionBar) won't kill it
  // because the shadow lives on the parent View, drawn before the rounded clip.
  actionBarShadow: {
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.3)', // shadow needs an opaque-ish source on iOS
    shadowColor: '#5E303C',
    shadowOpacity: 0.28,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  actionBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242,242,243,0.55)',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexBtn: {
    height: 48,
    borderRadius: 24,
    width: '100%',
  },
  flexBtnWrap: {
    flex: 1,
    minWidth: 0, // allow flex shrink so long labels wrap inside, not push siblings
  },

  // Cart badge on the cart icon
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

  // Flying ball — appears at button, arcs to cart on Add-to-cart
  flyingBall: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#5E303C',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },

  // Lightbox
  lightboxRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  lightboxCloseWrap: {
    position: 'absolute',
  },
  lightboxCounterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lightboxCounterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  lightboxCounterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
