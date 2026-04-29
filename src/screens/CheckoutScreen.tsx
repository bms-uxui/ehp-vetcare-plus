import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from '../lib/glass-effect';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Button,
  Icon,
  SubPageHeader,
  Text,
} from '../components';
import { semantic, spacing } from '../theme';
import { fmtBaht } from '../data/products';
import { useCart, cartStore, CartItem } from '../data/cart';

const LIQUID_GLASS = isLiquidGlassAvailable();

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

// Mock data — would come from user profile / API in production
const MOCK_ADDRESS = {
  name: 'คุณโจ',
  phone: '081-234-5678',
  line:
    '123 หมู่บ้าน Park Avenue ถ.สุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  tag: 'บ้าน',
};

/* ---------- Payment methods ---------- */

type PaymentMethod = {
  id: string;
  group: string;
  /** PNG icon imported via require() from /assets/payment */
  iconImage?: number;
  /** Lucide fallback when no iconImage */
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'qr_promptpay',
    group: 'QR PromptPay',
    iconImage: require('../../assets/payment/promptpay.png'),
    title: 'QR PromptPay',
    subtitle: 'สแกนชำระผ่านแอปธนาคารใดก็ได้',
  },
  {
    id: 'kbank',
    group: 'Mobile Banking',
    iconImage: require('../../assets/payment/kplus.png'),
    title: 'K PLUS',
    subtitle: 'ธนาคารกสิกรไทย',
  },
  {
    id: 'scb',
    group: 'Mobile Banking',
    iconImage: require('../../assets/payment/scb.png'),
    title: 'SCB EASY',
    subtitle: 'ธนาคารไทยพาณิชย์',
  },
  {
    id: 'ktb',
    group: 'Mobile Banking',
    iconImage: require('../../assets/payment/ktb.png'),
    title: 'Krungthai NEXT',
    subtitle: 'ธนาคารกรุงไทย',
  },
  {
    id: 'cash',
    group: 'ชำระเงินสด',
    icon: 'Wallet',
    iconBg: '#FFFFFF',
    iconColor: '#1A1A1A',
    title: 'เงินสด',
    subtitle: 'ชำระเมื่อจัดส่ง (COD)',
  },
];

/* ---------- Coupons ---------- */

type Coupon = {
  id: string;
  group: string; // section header in the sheet
  /** PNG icon imported via require() from /assets/coupon */
  iconImage?: number;
  /** Lucide fallback when no iconImage */
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description: string;
  conditionNote: string;
  type: 'free_shipping' | 'percent' | 'fixed';
  percent?: number;
  fixed?: number;
  maxDiscount?: number;
  minSubtotal?: number;
};

const COUPONS: Coupon[] = [
  {
    id: 'free_ship',
    group: 'ส่วนลดค่าจัดส่ง',
    iconImage: require('../../assets/coupon/shipping.png'),
    title: 'จัดส่งฟรี',
    description: 'ส่งฟรีทุกออเดอร์ ไม่มีขั้นต่ำ',
    conditionNote: 'ไม่มีเงื่อนไข',
    type: 'free_shipping',
  },
  {
    id: 'pct_10',
    group: 'ส่วนลดทั่วไป',
    iconImage: require('../../assets/coupon/discount.png'),
    title: 'ส่วนลด 10%',
    description: 'ลดสูงสุด ฿150',
    conditionNote: 'ขั้นต่ำ ฿500',
    type: 'percent',
    percent: 10,
    maxDiscount: 150,
    minSubtotal: 500,
  },
  {
    id: 'fixed_40',
    group: 'ส่วนลดทั่วไป',
    iconImage: require('../../assets/coupon/discount.png'),
    title: 'ส่วนลด ฿40',
    description: 'ใช้ได้ทุกออเดอร์',
    conditionNote: 'ไม่มีเงื่อนไข',
    type: 'fixed',
    fixed: 40,
  },
  {
    id: 'member_20',
    group: 'สิทธิพิเศษสมาชิก',
    iconImage: require('../../assets/coupon/member.png'),
    title: 'สมาชิก ลด 20%',
    description: 'ลดสูงสุด ฿500',
    conditionNote: 'เฉพาะสมาชิก',
    type: 'percent',
    percent: 20,
    maxDiscount: 500,
  },
];

function isCouponEligible(c: Coupon, subtotal: number): boolean {
  if (c.minSubtotal !== undefined && subtotal < c.minSubtotal) return false;
  return true;
}

function calcCouponEffect(
  c: Coupon | null | undefined,
  subtotal: number,
  baseShipping: number,
): { itemDiscount: number; shippingDiscount: number } {
  if (!c || !isCouponEligible(c, subtotal)) {
    return { itemDiscount: 0, shippingDiscount: 0 };
  }
  switch (c.type) {
    case 'free_shipping':
      return { itemDiscount: 0, shippingDiscount: baseShipping };
    case 'percent': {
      const pct = subtotal * ((c.percent ?? 0) / 100);
      const capped = Math.min(pct, c.maxDiscount ?? Number.POSITIVE_INFINITY);
      return { itemDiscount: Math.round(capped), shippingDiscount: 0 };
    }
    case 'fixed':
      return { itemDiscount: c.fixed ?? 0, shippingDiscount: 0 };
  }
}

export default function CheckoutScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items } = useCart();
  const selectedIds = route.params?.selectedIds;

  const checkoutItems = selectedIds
    ? items.filter((i) => selectedIds.includes(i.product.id))
    : items;

  const subtotal = checkoutItems.reduce((sum, i) => {
    const unit =
      i.subscribe && i.product.subscriptionDiscountPct
        ? i.product.priceBaht *
          (1 - i.product.subscriptionDiscountPct / 100)
        : i.product.priceBaht;
    return sum + unit * i.qty;
  }, 0);

  // Coupon state — default "free shipping"
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(
    'free_ship',
  );
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
  const selectedCoupon = COUPONS.find((c) => c.id === selectedCouponId) ?? null;

  // Payment method — default QR PromptPay
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    'qr_promptpay',
  );
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const selectedPayment =
    PAYMENT_METHODS.find((p) => p.id === selectedPaymentId) ??
    PAYMENT_METHODS[0];

  // Auto-deselect if subtotal drops below the coupon's minimum
  if (
    selectedCoupon &&
    !isCouponEligible(selectedCoupon, subtotal) &&
    selectedCouponId
  ) {
    // schedule deselect on next tick to avoid setState during render
    setTimeout(() => setSelectedCouponId(null), 0);
  }

  const baseShippingFee = subtotal > 1000 ? 0 : 50;
  const couponEffect = calcCouponEffect(
    selectedCoupon,
    subtotal,
    baseShippingFee,
  );
  const shippingFee = Math.max(
    0,
    baseShippingFee - couponEffect.shippingDiscount,
  );
  const couponDiscount = couponEffect.itemDiscount;
  const tax = Math.round(Math.max(0, subtotal - couponDiscount) * 0.07);
  const total = subtotal + shippingFee + tax - couponDiscount;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const onConfirm = () => {
    Alert.alert(
      'สั่งซื้อสำเร็จ',
      `ยอดรวม ${fmtBaht(total)}\nจัดส่งภายใน ${
        shippingFee === 0 ? '1–2' : '3–5'
      } วัน`,
      [
        {
          text: 'ตกลง',
          onPress: () => {
            // Remove the checked-out items from cart
            checkoutItems.forEach((i) => cartStore.setQty(i.product.id, 0));
            navigation.popToTop();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <SubPageHeader
        title="ชำระเงิน"
        onBack={() => navigation.goBack()}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingTop: spacing.md, paddingBottom: 220 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Address card */}
        <Pressable
          style={({ pressed }) => [
            styles.addressCard,
            pressed && { opacity: 0.94 },
          ]}
          onPress={() => Alert.alert('เปลี่ยนที่อยู่จัดส่ง', '(ตัวอย่าง)')}
        >
          <View style={styles.addressHeader}>
            <Text weight="500" style={styles.cardLabel}>
              ที่อยู่จัดส่ง
            </Text>
            <Icon
              name="ChevronRight"
              size={16}
              color={semantic.textMuted}
              strokeWidth={2.2}
            />
          </View>
          <Text weight="500" style={styles.addressName}>
            {MOCK_ADDRESS.name} · {MOCK_ADDRESS.phone}
          </Text>
          <Text style={styles.addressLine} numberOfLines={2}>
            {MOCK_ADDRESS.line}
          </Text>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{MOCK_ADDRESS.tag}</Text>
          </View>
        </Pressable>

        {/* Product list */}
        <View style={styles.list}>
          {checkoutItems.map((item) => (
            <CheckoutItemRow key={item.product.id} item={item} />
          ))}
        </View>

        {/* Shipping summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text weight="500" style={styles.cardLabel}>
              การจัดส่ง
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>จัดส่งมาตรฐาน</Text>
              <Text weight="600" style={styles.summaryText}>
                {shippingFee === 0 ? 'ฟรี' : fmtBaht(shippingFee)}
              </Text>
            </View>
            <View style={styles.smallTagPill}>
              <Text style={styles.tagText}>
                {shippingFee === 0 ? '1–2 วัน' : '3–5 วัน'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.summaryCard,
              pressed && { opacity: 0.94 },
            ]}
            onPress={() => setCouponSheetOpen(true)}
          >
            <View style={styles.cardHeaderRow}>
              <Text weight="500" style={styles.cardLabel}>
                คูปองส่วนลด
              </Text>
              <Icon
                name="ChevronRight"
                size={16}
                color={semantic.textMuted}
                strokeWidth={2.2}
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {selectedCoupon ? selectedCoupon.title : 'เลือกคูปอง'}
              </Text>
              <Text
                weight="600"
                style={[
                  styles.summaryText,
                  (couponDiscount > 0 || couponEffect.shippingDiscount > 0) && {
                    color: '#C25450',
                  },
                ]}
              >
                {couponDiscount > 0
                  ? `-${fmtBaht(couponDiscount)}`
                  : couponEffect.shippingDiscount > 0
                  ? `-${fmtBaht(couponEffect.shippingDiscount)}`
                  : '—'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.summaryCard,
              pressed && { opacity: 0.94 },
            ]}
            onPress={() => setPaymentSheetOpen(true)}
          >
            <View style={styles.cardHeaderRow}>
              <Text weight="500" style={styles.cardLabel}>
                ช่องทางชำระเงิน
              </Text>
              <Icon
                name="ChevronRight"
                size={16}
                color={semantic.textMuted}
                strokeWidth={2.2}
              />
            </View>
            <View style={styles.payRow}>
              {selectedPayment.iconImage ? (
                <Image
                  source={selectedPayment.iconImage}
                  style={styles.payRowIconImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.payRowIcon,
                    { backgroundColor: selectedPayment.iconBg },
                  ]}
                >
                  <Icon
                    name={selectedPayment.icon as any}
                    size={16}
                    color={selectedPayment.iconColor}
                    strokeWidth={2.2}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text weight="600" style={styles.payRowTitle}>
                  {selectedPayment.title}
                </Text>
                {selectedPayment.subtitle && (
                  <Text style={styles.payRowSub}>
                    {selectedPayment.subtitle}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>

          {/* Order summary breakdown */}
          <View style={styles.summaryCard}>
            <Text weight="500" style={styles.cardLabel}>
              สรุปยอด
            </Text>
            <BreakdownRow label="รวมค่าสินค้า" value={fmtBaht(subtotal)} />
            <BreakdownRow
              label="ค่าจัดส่ง"
              value={shippingFee === 0 ? 'ฟรี' : fmtBaht(shippingFee)}
            />
            {couponDiscount > 0 && (
              <BreakdownRow
                label="ส่วนลด"
                value={`-${fmtBaht(couponDiscount)}`}
                negative
              />
            )}
            <BreakdownRow label="ภาษี (7%)" value={fmtBaht(tax)} />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Coupon bottom sheet */}
      <CouponSheet
        visible={couponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        coupons={COUPONS}
        subtotal={subtotal}
        selectedId={selectedCouponId}
        onSelect={(id) => {
          setSelectedCouponId(id);
          setCouponSheetOpen(false);
        }}
      />

      {/* Payment method bottom sheet */}
      <PaymentSheet
        visible={paymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
        methods={PAYMENT_METHODS}
        selectedId={selectedPaymentId}
        onSelect={(id) => {
          setSelectedPaymentId(id);
          setPaymentSheetOpen(false);
        }}
      />

      {/* Sticky bottom bar */}
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

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ยอดที่ต้องชำระ</Text>
              <Text weight="700" style={styles.totalValue}>
                {fmtBaht(total)}
              </Text>
            </View>
            <View style={styles.btnRow}>
              <View style={styles.flexBtnWrap}>
                <Button
                  label="ยกเลิก"
                  variant="secondary"
                  uppercase={false}
                  onPress={() => navigation.goBack()}
                  style={styles.flexBtn}
                />
              </View>
              <View style={styles.flexBtnWrap}>
                <Button
                  label="ยืนยันชำระเงิน"
                  variant="primary"
                  uppercase={false}
                  onPress={onConfirm}
                  style={styles.flexBtn}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Sub-components ---------- */

function CheckoutItemRow({ item }: { item: CartItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const unitPrice =
    item.subscribe && item.product.subscriptionDiscountPct
      ? item.product.priceBaht *
        (1 - item.product.subscriptionDiscountPct / 100)
      : item.product.priceBaht;
  const linePrice = unitPrice * item.qty;

  return (
    <View style={styles.itemCard}>
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
      <View style={styles.itemContent}>
        <View style={styles.itemTopRow}>
          <Text weight="500" style={styles.itemName} numberOfLines={1}>
            {item.product.name}
          </Text>
        </View>
        <View style={styles.itemBottomRow}>
          <Text weight="600" style={styles.itemPrice}>
            {fmtBaht(linePrice)}
          </Text>
          <Text style={styles.itemQty}>x{item.qty}</Text>
        </View>
      </View>
    </View>
  );
}

function CouponSheet({
  visible,
  onClose,
  coupons,
  subtotal,
  selectedId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  coupons: Coupon[];
  subtotal: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  // Group coupons by `group` field, preserving order
  const groupedCoupons = coupons.reduce<{ group: string; items: Coupon[] }[]>(
    (acc, c) => {
      const last = acc[acc.length - 1];
      if (last && last.group === c.group) {
        last.items.push(c);
      } else {
        acc.push({ group: c.group, items: [c] });
      }
      return acc;
    },
    [],
  );

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.iosSheetRoot}>
        {/* Header — title centered + close button (Liquid Glass) at right */}
        <View style={styles.payHeader}>
          <Text weight="500" style={styles.payHeaderTitle}>
            เลือกคูปองส่วนลด
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="ปิด"
            style={styles.payHeaderClose}
          >
            <View style={styles.payHeaderCloseBtn}>
              <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
            </View>
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.payScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner — promo / info */}
          <View style={styles.payBannerWrap}>
            <View style={styles.payBanner}>
              <Icon
                name="Ticket"
                size={28}
                color={semantic.primary}
                strokeWidth={2}
              />
              <View style={{ flex: 1 }}>
                <Text weight="600" style={styles.payBannerTitle}>
                  เลือกคูปองได้ 1 ใบต่อออเดอร์
                </Text>
                <Text style={styles.payBannerSub}>
                  ระบบจะคำนวณส่วนลดให้อัตโนมัติเมื่อชำระเงิน
                </Text>
              </View>
            </View>
          </View>

          {/* "ไม่ใช้คูปอง" — its own section */}
          <View style={styles.paySection}>
            <Text weight="500" style={styles.paySectionTitle}>
              ตัวเลือก
            </Text>
            <Pressable
              onPress={() => onSelect(null)}
              style={({ pressed }) => [
                styles.couponCardV2,
                !selectedId && styles.couponCardV2Selected,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.couponIconV2}>
                <Icon name="Slash" size={22} color="#6E6E74" strokeWidth={2.2} />
              </View>
              <View style={styles.couponBodyV2}>
                <Text weight="600" style={styles.couponTitleV2} numberOfLines={1}>
                  ไม่ใช้คูปอง
                </Text>
                <View style={styles.couponMetaRow}>
                  <Text style={styles.couponDescV2} numberOfLines={1}>
                    ไม่หักส่วนลดใด ๆ
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.payRadio,
                  !selectedId && styles.payRadioSelected,
                  styles.couponRadioV2,
                ]}
              >
                {!selectedId && <View style={styles.payRadioInner} />}
              </View>
            </Pressable>
          </View>

          {groupedCoupons.map(({ group, items }) => (
            <View key={group} style={styles.paySection}>
              <Text weight="500" style={styles.paySectionTitle}>
                {group}
              </Text>
              {items.map((c) => {
                const eligible = isCouponEligible(c, subtotal);
                const selected = c.id === selectedId;
                const missing = c.minSubtotal
                  ? Math.max(0, c.minSubtotal - subtotal)
                  : 0;

                return (
                  <Pressable
                    key={c.id}
                    onPress={() => eligible && onSelect(c.id)}
                    disabled={!eligible}
                    style={({ pressed }) => [
                      styles.couponCardV2,
                      selected && styles.couponCardV2Selected,
                      !eligible && styles.couponCardV2Disabled,
                      eligible && pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    {c.iconImage ? (
                      <Image
                        source={c.iconImage}
                        style={styles.couponIconImageV2}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.couponIconV2}>
                        <Icon
                          name={c.icon as any}
                          size={22}
                          color={c.iconColor}
                          strokeWidth={2.2}
                        />
                      </View>
                    )}
                    <View style={styles.couponBodyV2}>
                      <Text
                        weight="600"
                        style={styles.couponTitleV2}
                        numberOfLines={1}
                      >
                        {c.title}
                      </Text>
                      <View style={styles.couponMetaRow}>
                        <View style={styles.couponConditionPillV2}>
                          <Text style={styles.couponConditionTextV2}>
                            {!eligible && missing > 0
                              ? `ซื้อเพิ่ม ${fmtBaht(missing)}`
                              : c.conditionNote}
                          </Text>
                        </View>
                        <Text
                          style={styles.couponDescV2}
                          numberOfLines={1}
                        >
                          {c.description}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.payRadio,
                        selected && styles.payRadioSelected,
                        styles.couponRadioV2,
                      ]}
                    >
                      {selected && <View style={styles.payRadioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function PaymentSheet({
  visible,
  onClose,
  methods,
  selectedId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  // Group methods by `group` field, preserving order from PAYMENT_METHODS
  const groupedMethods = methods.reduce<{ group: string; items: PaymentMethod[] }[]>(
    (acc, m) => {
      const last = acc[acc.length - 1];
      if (last && last.group === m.group) {
        last.items.push(m);
      } else {
        acc.push({ group: m.group, items: [m] });
      }
      return acc;
    },
    [],
  );

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.iosSheetRoot}>
        {/* Header — title centered + close button (Liquid Glass) at right */}
        <View style={styles.payHeader}>
          <Text weight="500" style={styles.payHeaderTitle}>
            ช่องทางชำระเงิน
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="ปิด"
            style={styles.payHeaderClose}
          >
            <View style={styles.payHeaderCloseBtn}>
              <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
            </View>
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.payScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner — promotional area */}
          <View style={styles.payBannerWrap}>
            <View style={styles.payBanner}>
              <Icon
                name="ShieldCheck"
                size={28}
                color={semantic.primary}
                strokeWidth={2}
              />
              <View style={{ flex: 1 }}>
                <Text weight="600" style={styles.payBannerTitle}>
                  ชำระเงินปลอดภัย 100%
                </Text>
                <Text style={styles.payBannerSub}>
                  เข้ารหัส SSL · รับรองโดย Bank of Thailand
                </Text>
              </View>
            </View>
          </View>

          {groupedMethods.map(({ group, items }) => (
            <View key={group} style={styles.paySection}>
              <Text weight="500" style={styles.paySectionTitle}>
                {group}
              </Text>
              {items.map((m) => {
                const selected = m.id === selectedId;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => onSelect(m.id)}
                    style={({ pressed }) => [
                      styles.payMethodCard,
                      selected && styles.payMethodCardSelected,
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    {m.iconImage ? (
                      <Image
                        source={m.iconImage}
                        style={styles.payMethodIconImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.payMethodIcon,
                          { backgroundColor: m.iconBg },
                        ]}
                      >
                        <Icon
                          name={m.icon as any}
                          size={20}
                          color={m.iconColor}
                          strokeWidth={2.2}
                        />
                      </View>
                    )}
                    <View style={styles.payMethodBody}>
                      <Text weight="500" style={styles.payMethodTitle}>
                        {m.title}
                      </Text>
                      {m.subtitle && (
                        <Text style={styles.payMethodDesc}>{m.subtitle}</Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.payRadio,
                        selected && styles.payRadioSelected,
                      ]}
                    >
                      {selected && <View style={styles.payRadioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function BreakdownRow({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text weight="500" style={styles.breakdownLabel}>
        {label}
      </Text>
      <Text
        weight="700"
        style={[styles.breakdownValue, negative && { color: '#C25450' }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 0,
  },

  // Hero
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  cardLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6E74',
  },

  // Address card
  addressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5E4E7',
    gap: 8,
    alignItems: 'flex-start',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  addressName: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  addressLine: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
    marginTop: 2,
  },
  smallTagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
    marginTop: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#6E6E74',
  },

  // Product list — read-only items
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    height: 96,
    borderRadius: 16,
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
    paddingRight: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
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
  itemQty: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },

  // Summary section
  summarySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E8',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  breakdownValue: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1A1A1A',
  },

  // Sticky bottom bar
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 24,
    lineHeight: 32,
    color: '#4FB36C',
    letterSpacing: -0.3,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexBtnWrap: {
    flex: 1,
    minWidth: 0,
  },
  flexBtn: {
    height: 48,
    borderRadius: 16,
    width: '100%',
  },

  // Native iOS pageSheet content root
  iosSheetRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Coupon bottom sheet — iOS 26 Liquid Glass style
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 6,
    overflow: 'hidden',
    // Drop shadow for the floating sheet
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,253,251,0.55)',
  },
  sheetGrabber: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(60,60,67,0.3)', // iOS standard handle color
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1A1A1A',
  },
  sheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 10,
  },

  // Coupon card inside sheet
  couponCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6E6E8',
  },
  couponCardSelected: {
    borderColor: semantic.primary,
    backgroundColor: '#FBF3F4',
  },
  couponCardDisabled: {
    opacity: 0.5,
  },
  couponIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBody: {
    flex: 1,
    gap: 4,
  },
  couponTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  couponDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6E74',
  },
  couponConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  couponConditionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
  },
  couponConditionText: {
    fontSize: 10,
    lineHeight: 14,
    color: '#6E6E74',
  },
  couponMissing: {
    fontSize: 11,
    lineHeight: 14,
    color: '#C25450',
    fontWeight: '500',
  },
  couponRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D0D0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponRadioSelected: {
    borderColor: semantic.primary,
  },
  couponRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: semantic.primary,
  },

  // Payment method — selected method card on Checkout
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  payRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payRowIconImage: {
    width: 36,
    height: 36,
    borderRadius: 14,
  },
  payRowTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  payRowSub: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6E74',
  },

  // Payment sheet — group sections (legacy, kept for compatibility)
  payGroup: {
    gap: 8,
  },
  payGroupLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#6E6E74',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  payGroupCards: {
    gap: 10,
  },

  // Payment sheet — Figma layout
  payHeader: {
    height: 60,
    paddingHorizontal: spacing.lg,
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
    right: spacing.lg,
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
  payScrollContent: {
    paddingBottom: spacing.lg,
  },

  // Banner — promo / info area at top
  payBannerWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  payBanner: {
    height: 96,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FBF3F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5E4E7',
  },
  payBannerTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  payBannerSub: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6E74',
    marginTop: 2,
  },

  // Section
  paySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  paySectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },

  // Payment method card — Figma layout: same gray bg as Coupon, all cards identical
  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  payMethodCardSelected: {
    backgroundColor: '#FBF3F4',
    borderWidth: 1.5,
    borderColor: semantic.primary,
  },
  payMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    marginLeft: 8,
    marginRight: 12,
  },
  payMethodIconImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginVertical: 8,
    marginLeft: 8,
    marginRight: 12,
  },
  payMethodBody: {
    flex: 1,
    paddingVertical: 10,
    gap: 4,
  },
  payMethodTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  payMethodDesc: {
    fontSize: 10,
    lineHeight: 14,
    color: '#1A1A1A',
  },
  payRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D0D0D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  payRadioSelected: {
    borderColor: semantic.primary,
  },
  payRadioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: semantic.primary,
  },

  // Coupon card v2 — Figma layout: gray pill, all cards identical
  couponCardV2: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  couponCardV2Selected: {
    backgroundColor: '#FBF3F4',
    borderWidth: 1.5,
    borderColor: semantic.primary,
  },
  couponCardV2Disabled: {
    opacity: 0.5,
  },
  couponIconV2: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    marginLeft: 8,
    marginRight: 12,
  },
  couponIconImageV2: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginVertical: 8,
    marginLeft: 8,
    marginRight: 12,
  },
  couponBodyV2: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
    gap: 4,
  },
  couponMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponTitleV2: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  couponDescV2: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6E74',
  },
  couponConditionPillV2: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  couponConditionTextV2: {
    fontSize: 10,
    lineHeight: 14,
    color: '#6E6E74',
  },
  couponRadioV2: {
    marginRight: 16,
    marginVertical: 8,
  },
});
