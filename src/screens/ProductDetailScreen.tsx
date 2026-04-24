import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockProducts, categoryMeta, fmtBaht } from '../data/products';
import { cartStore } from '../data/cart';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const product = mockProducts.find((p) => p.id === productId);
  const [subscribe, setSubscribe] = useState(false);

  if (!product) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบสินค้า</Text>
      </Screen>
    );
  }

  const cat = categoryMeta[product.category];
  const discountedPrice =
    subscribe && product.subscriptionDiscountPct
      ? product.priceBaht * (1 - product.subscriptionDiscountPct / 100)
      : product.priceBaht;

  const addToCart = () => {
    cartStore.add(product, subscribe);
    Alert.alert('เพิ่มในตะกร้าแล้ว', product.name, [
      { text: 'ช้อปต่อ', style: 'cancel' },
      { text: 'ดูตะกร้า', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <Screen scroll>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: cat.bg }]}>
        <Text style={{ fontSize: 120 }}>{product.emoji}</Text>
        {product.originalPriceBaht && (
          <View style={styles.saleBadge}>
            <Text variant="caption" color={semantic.onPrimary} weight="600">SALE</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.categoryBadge}>
          <Icon name={cat.icon as any} size={14} color={cat.color} />
          <Text variant="caption" color={cat.color} weight="600">
            {cat.label}
          </Text>
        </View>

        <Text variant="caption" color={semantic.textMuted}>{product.brand}</Text>
        <Text variant="h1" style={styles.name}>{product.name}</Text>

        <View style={styles.ratingRow}>
          <Text variant="bodyStrong">⭐ {product.rating}</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            ({product.reviewCount} รีวิว)
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text variant="display" color={semantic.primary}>
            {fmtBaht(discountedPrice)}
          </Text>
          {product.originalPriceBaht && !subscribe && (
            <Text variant="body" color={semantic.textMuted} style={styles.strike}>
              {fmtBaht(product.originalPriceBaht)}
            </Text>
          )}
          {subscribe && product.subscriptionDiscountPct && (
            <Text variant="body" color={semantic.textMuted} style={styles.strike}>
              {fmtBaht(product.priceBaht)}
            </Text>
          )}
        </View>

        {product.tags && product.tags.length > 0 && (
          <View style={styles.tagRow}>
            {product.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text variant="caption" color={semantic.textSecondary}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        <Card variant="outlined" padding="lg" style={styles.descCard}>
          <Text variant="overline" color={semantic.textSecondary} style={{ marginBottom: spacing.xs }}>
            รายละเอียด
          </Text>
          <Text variant="body">{product.description}</Text>
        </Card>

        {product.subscriptionEligible && (
          <Card
            variant="elevated"
            selected={subscribe}
            padding="lg"
            onPress={() => setSubscribe(!subscribe)}
            style={styles.subCard}
          >
            <View style={styles.subRow}>
              <View style={styles.subIcon}>
                <Icon name="RefreshCw" size={26} color={semantic.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.subTopRow}>
                  <Text variant="bodyStrong">สมัครสมาชิกจัดส่งอัตโนมัติ</Text>
                  {product.subscriptionDiscountPct && (
                    <View style={styles.discountBadge}>
                      <Text variant="caption" color={semantic.onPrimary} weight="600" style={{ fontSize: 11 }}>
                        -{product.subscriptionDiscountPct}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text variant="caption" color={semantic.textSecondary}>
                  จัดส่งทุกเดือน · ยกเลิกได้ตลอด
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  subscribe && { backgroundColor: semantic.primary, borderColor: semantic.primary },
                ]}
              >
                {subscribe && <Icon name="Check" size={16} color={semantic.onPrimary} strokeWidth={3} />}
              </View>
            </View>
          </Card>
        )}

        <Card variant="outlined" padding="lg" style={styles.clinicCard}>
          <Text variant="caption" color={semantic.textSecondary}>จัดส่งจาก</Text>
          <View style={styles.clinicRow}>
            <Icon name="Hospital" size={16} color={semantic.primary} />
            <Text variant="bodyStrong">{product.clinic ?? 'EHP VetCare สาขาสุขุมวิท'}</Text>
          </View>
          <Text variant="caption" color={semantic.textMuted}>จัดส่งภายใน 1-2 วัน</Text>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button label="เพิ่มในตะกร้า" onPress={addToCart} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -spacing.xl,
    marginTop: -spacing.lg,
    marginBottom: spacing.xl,
  },
  saleBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  body: {
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: semantic.primaryMuted,
    marginBottom: spacing.sm,
  },
  name: {
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  descCard: {
    marginTop: spacing.lg,
  },
  subCard: {
    marginTop: spacing.md,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicCard: {
    marginTop: spacing.md,
    gap: 2,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
