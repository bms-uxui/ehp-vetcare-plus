import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { semantic, spacing } from '../theme';
import { fmtBaht, categoryMeta } from '../data/products';
import {
  fmtOrderDate,
  fmtOrderDateTime,
  getOrderProducts,
  mockOrders,
  Order,
  orderProgressSteps,
  orderStatusMeta,
  orderTotal,
} from '../data/orders';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;

type FilterKey = 'all' | 'placed' | 'packing' | 'shipping' | 'delivered' | 'cancelled';

const FILTERS: {
  key: FilterKey;
  label: string;
  icon: string;
  activeBg: string;
  activeGradient: [string, string];
}[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    icon: 'List',
    activeBg: semantic.primary,
    activeGradient: ['#C77E91', '#9F5266'],
  },
  {
    key: 'placed',
    label: 'รับคำสั่งซื้อ',
    icon: 'Receipt',
    activeBg: '#6E8FAE',
    activeGradient: ['#86A3BD', '#587B9C'],
  },
  {
    key: 'packing',
    label: 'เตรียมสินค้า',
    icon: 'Package',
    activeBg: '#C97A3F',
    activeGradient: ['#D89358', '#B5662F'],
  },
  {
    key: 'shipping',
    label: 'กำลังจัดส่ง',
    icon: 'Truck',
    activeBg: '#3B7BB5',
    activeGradient: ['#5092C8', '#2D6A9E'],
  },
  {
    key: 'delivered',
    label: 'จัดส่งสำเร็จ',
    icon: 'PackageCheck',
    activeBg: '#2E8049',
    activeGradient: ['#42985E', '#236A39'],
  },
  {
    key: 'cancelled',
    label: 'ยกเลิก',
    icon: 'XCircle',
    activeBg: '#A63A35',
    activeGradient: ['#BC504C', '#902B27'],
  },
];

export default function OrderTrackingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    let list =
      filter === 'all'
        ? mockOrders
        : mockOrders.filter((o) => o.status === filter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        if (o.id.toLowerCase().includes(q)) return true;
        return getOrderProducts(o).some(({ product }) =>
          product.name.toLowerCase().includes(q),
        );
      });
    }
    return list;
  }, [filter, searchQuery]);

  return (
    <View style={styles.root}>
      <AppBackground />

      <SubPageHeader
        title="ติดตามคำสั่งซื้อ"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
        trailing={{
          icon: searchOpen ? 'X' : 'Search',
          onPress: () => {
            if (searchOpen) {
              setSearchQuery('');
            }
            setSearchOpen((v) => !v);
          },
          accessibilityLabel: searchOpen ? 'ปิดการค้นหา' : 'ค้นหาคำสั่งซื้อ',
        }}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + HEADER_HEIGHT, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {searchOpen ? (
          <View style={styles.searchField}>
            <Icon
              name="Search"
              size={16}
              color={semantic.textMuted}
              strokeWidth={2.2}
            />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ค้นหาเลขออเดอร์หรือชื่อสินค้า"
              placeholderTextColor={semantic.textMuted}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={6}
                accessibilityLabel="ล้างคำค้น"
              >
                <Icon
                  name="X"
                  size={14}
                  color={semantic.textMuted}
                  strokeWidth={2.4}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Filter chips — morph compact icon → expanded pill on activation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              filter={f}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
        {filteredOrders.length === 0 ? (
          <View style={styles.empty}>
            <Icon
              name="Package"
              size={56}
              color={semantic.textMuted}
              strokeWidth={1.5}
            />
            <Text variant="bodyStrong">
              {mockOrders.length === 0
                ? 'ยังไม่มีคำสั่งซื้อ'
                : 'ไม่มีรายการในหมวดนี้'}
            </Text>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              {mockOrders.length === 0
                ? 'คำสั่งซื้อของคุณจะแสดงที่นี่'
                : 'ลองเลือกตัวกรองอื่นดู'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

/* ---------- Order card ---------- */

/* ---------- Filter chip — morph + scale-bump animation ---------- */

function FilterChip({
  filter: f,
  active,
  onPress,
}: {
  filter: (typeof FILTERS)[number];
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
        layout={LinearTransition.springify()
          .mass(0.55)
          .damping(22)
          .stiffness(180)}
        style={[
          styles.chip,
          active
            ? [
                styles.chipActive,
                { backgroundColor: f.activeBg, shadowColor: f.activeBg },
              ]
            : styles.chipCompact,
          animatedStyle,
        ]}
      >
        {active ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(100)}
            style={styles.chipGradient}
          >
            <LinearGradient
              pointerEvents="none"
              colors={f.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.chipGradient}
            />
          </Animated.View>
        ) : null}
        <Icon
          name={f.icon as any}
          size={16}
          color={active ? '#FFFFFF' : '#3C3C43'}
          strokeWidth={2.2}
        />
        {active ? (
          <Animated.Text
            entering={FadeIn.duration(240).delay(80)}
            exiting={FadeOut.duration(120)}
            style={[styles.chipText, styles.chipTextActive]}
          >
            {f.label}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const meta = orderStatusMeta[order.status];
  const products = getOrderProducts(order);
  const total = orderTotal(order);
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
  const isCancelled = order.status === 'cancelled';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [
          styles.cardHeader,
          pressed && { opacity: 0.92 },
        ]}
      >
        <View style={styles.cardHeaderTop}>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Icon
              name={meta.icon as any}
              size={12}
              color={meta.color}
              strokeWidth={2.4}
            />
            <Text weight="600" style={[styles.statusText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
          <Icon
            name={expanded ? 'ChevronUp' : 'ChevronDown'}
            size={18}
            color={semantic.textSecondary}
            strokeWidth={2.4}
          />
        </View>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text weight="600" style={styles.orderId}>
              {order.id}
            </Text>
            <Text style={styles.orderDate}>
              สั่งเมื่อ {fmtOrderDate(order.placedAtISO)} · {itemCount} ชิ้น
            </Text>
          </View>
          <Text weight="700" style={styles.orderTotal}>
            {fmtBaht(total)}
          </Text>
        </View>

        {/* Item thumbnails preview */}
        <View style={styles.thumbsRow}>
          {products.slice(0, 4).map(({ product }, i) => (
            <ThumbAvatar key={`${order.id}-${product.id}-${i}`} product={product} />
          ))}
          {products.length > 4 && (
            <View style={[styles.thumb, styles.thumbMore]}>
              <Text weight="600" style={styles.thumbMoreText}>
                +{products.length - 4}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Expandable detail */}
      {expanded && (
        <View style={styles.cardDetail}>
          {/* Timeline */}
          {!isCancelled && (
            <View style={styles.timeline}>
              {orderProgressSteps.map((step, idx) => {
                const stepMeta = orderStatusMeta[step];
                const currentIdx = orderProgressSteps.indexOf(order.status);
                const reached = idx <= currentIdx;
                const isLast = idx === orderProgressSteps.length - 1;
                return (
                  <View key={step} style={styles.timelineRow}>
                    <View style={styles.timelineColumn}>
                      <View
                        style={[
                          styles.timelineDot,
                          reached && {
                            backgroundColor: stepMeta.color,
                            borderColor: stepMeta.color,
                          },
                        ]}
                      >
                        {reached && (
                          <Icon
                            name="Check"
                            size={10}
                            color="#FFFFFF"
                            strokeWidth={3}
                          />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.timelineLine,
                            idx < currentIdx && {
                              backgroundColor: stepMeta.color,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        weight="600"
                        style={[
                          styles.timelineLabel,
                          !reached && { color: semantic.textMuted },
                        ]}
                      >
                        {stepMeta.label}
                      </Text>
                      {idx === currentIdx && order.estimatedDeliveryISO && (
                        <Text style={styles.timelineSubtext}>
                          คาดส่งถึง {fmtOrderDateTime(order.estimatedDeliveryISO)}
                        </Text>
                      )}
                      {idx === currentIdx && order.deliveredAtISO && step === 'delivered' && (
                        <Text style={styles.timelineSubtext}>
                          ส่งแล้วเมื่อ {fmtOrderDateTime(order.deliveredAtISO)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Tracking info */}
          {order.trackingNumber && (
            <View style={styles.infoBlock}>
              <Text weight="500" style={styles.infoLabel}>
                หมายเลขพัสดุ
              </Text>
              <Text weight="600" style={styles.infoValue}>
                {order.trackingNumber}
                {order.carrier ? ` · ${order.carrier}` : ''}
              </Text>
            </View>
          )}

          {/* Item list */}
          <View style={styles.itemsBlock}>
            <Text weight="500" style={styles.infoLabel}>
              รายการสินค้า
            </Text>
            {products.map(({ product, qty, unitPriceBaht }, i) => (
              <View key={`${order.id}-detail-${product.id}-${i}`} style={styles.itemRow}>
                <ThumbAvatar product={product} small />
                <View style={{ flex: 1 }}>
                  <Text weight="600" style={styles.itemName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {fmtBaht(unitPriceBaht)} × {qty}
                  </Text>
                </View>
                <Text weight="600" style={styles.itemTotal}>
                  {fmtBaht(unitPriceBaht * qty)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function ThumbAvatar({
  product,
  small = false,
}: {
  product: ReturnType<typeof getOrderProducts>[number]['product'];
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const cat = categoryMeta[product.category];
  const size = small ? styles.thumbSmall : styles.thumb;
  return (
    <View style={[size, { backgroundColor: cat.bg }]}>
      {product.imageUrl && !failed ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={small ? styles.thumbEmojiSmall : styles.thumbEmoji}>
          {product.emoji}
        </Text>
      )}
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semantic.background,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
  },

  // Search field — appears above chips when search is open
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 1000,
    backgroundColor: 'rgba(118,118,128,0.12)',
    marginTop: 8,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },

  // Filter chips — morph compact circle ↔ expanded pill, matching Notifications
  chipsScroll: {
    paddingTop: 6,
    paddingBottom: 16,
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
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipCompact: {
    width: 40,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  chipGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 1000,
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
  hero: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 40,
    color: '#1A1A1A',
    letterSpacing: 0,
  },
  heroSubtitle: {
    fontSize: 14,
    color: semantic.textSecondary,
  },

  empty: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },

  list: {
    gap: 12,
  },

  // Order card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardHeader: {
    padding: 16,
    gap: 12,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderId: {
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 18,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 22,
  },
  thumbEmojiSmall: {
    fontSize: 18,
  },
  thumbMore: {
    backgroundColor: '#F2F2F3',
  },
  thumbMoreText: {
    fontSize: 12,
    color: semantic.textSecondary,
  },

  // Expanded detail
  cardDetail: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0E6E8',
    marginTop: 4,
  },

  // Timeline
  timeline: {
    paddingTop: 8,
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
  },
  timelineColumn: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D0D0D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E6E6E8',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 1,
    paddingBottom: 14,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  timelineSubtext: {
    fontSize: 12,
    color: semantic.textSecondary,
  },

  // Info block
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: semantic.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Items list
  itemsBlock: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  itemName: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  itemMeta: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    color: '#1A1A1A',
  },
});
