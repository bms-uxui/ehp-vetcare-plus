import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { categoryMeta, fmtBaht } from '../data/products';
import { useCart, cartStore } from '../data/cart';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const { items, subtotal, count } = useCart();

  const shippingFee = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shippingFee;

  const onCheckout = () => {
    Alert.alert('สั่งซื้อสำเร็จ', `ยอดรวม ${fmtBaht(total)}\nจัดส่งภายใน 1-2 วัน`, [
      {
        text: 'ตกลง',
        onPress: () => {
          cartStore.clear();
          navigation.goBack();
        },
      },
    ]);
  };

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Icon name="ShoppingCart" size={72} color={semantic.textMuted} strokeWidth={1.5} />
          <Text variant="h2">ตะกร้าว่าง</Text>
          <Text variant="body" color={semantic.textSecondary} align="center">
            เลือกสินค้าที่คุณต้องการแล้วเพิ่มในตะกร้า
          </Text>
          <Button label="กลับไปช้อปปิ้ง" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>ตะกร้าสินค้า</Text>
      <Text variant="body" color={semantic.textSecondary} style={styles.subtitle}>
        {count} รายการ
      </Text>

      <View style={styles.list}>
        {items.map((item) => {
          const cat = categoryMeta[item.product.category];
          const unitPrice =
            item.subscribe && item.product.subscriptionDiscountPct
              ? item.product.priceBaht * (1 - item.product.subscriptionDiscountPct / 100)
              : item.product.priceBaht;
          return (
            <Card key={item.product.id} variant="elevated" padding="md">
              <View style={styles.itemRow}>
                <View style={[styles.itemImage, { backgroundColor: cat.bg }]}>
                  <Text style={{ fontSize: 40 }}>{item.product.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
                    {item.product.brand}
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 14 }}>
                    {item.product.name}
                  </Text>
                  {item.subscribe && (
                    <View style={styles.subTag}>
                      <Icon name="RefreshCw" size={10} color={semantic.primary} />
                      <Text variant="caption" color={semantic.primary} weight="600" style={{ fontSize: 10 }}>
                        สมาชิก -{item.product.subscriptionDiscountPct}%
                      </Text>
                    </View>
                  )}
                  <View style={styles.itemFooter}>
                    <Text variant="bodyStrong" color={semantic.primary}>
                      {fmtBaht(unitPrice * item.qty)}
                    </Text>
                    <QtyStepper
                      qty={item.qty}
                      onInc={() => cartStore.setQty(item.product.id, item.qty + 1)}
                      onDec={() => cartStore.setQty(item.product.id, item.qty - 1)}
                    />
                  </View>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Summary */}
      <Card variant="elevated" padding="lg" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text variant="body" color={semantic.textSecondary}>ยอดสินค้า</Text>
          <Text variant="body">{fmtBaht(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text variant="body" color={semantic.textSecondary}>ค่าจัดส่ง</Text>
          <Text variant="body" color={shippingFee === 0 ? '#4FB36C' : semantic.textPrimary}>
            {shippingFee === 0 ? 'ฟรี' : fmtBaht(shippingFee)}
          </Text>
        </View>
        {shippingFee === 0 && (
          <Text variant="caption" color="#4FB36C" style={{ marginTop: -4 }}>
            ✨ ฟรีค่าจัดส่งเมื่อซื้อครบ ฿1,000
          </Text>
        )}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text variant="bodyStrong">ยอดรวม</Text>
          <Text variant="h2" color={semantic.primary}>{fmtBaht(total)}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button label="ชำระเงิน" onPress={onCheckout} />
        <Button
          label="ช้อปต่อ"
          variant="ghost"
          uppercase={false}
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

function QtyStepper({ qty, onInc, onDec }: { qty: number; onInc: () => void; onDec: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDec} style={styles.stepperBtn} hitSlop={6}>
        <Icon name="Minus" size={14} color={semantic.primary} strokeWidth={2.5} />
      </Pressable>
      <Text variant="bodyStrong" style={styles.qtyText}>{qty}</Text>
      <Pressable onPress={onInc} style={styles.stepperBtn} hitSlop={6}>
        <Icon name="Plus" size={14} color={semantic.primary} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radii.pill,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 20,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  divider: {
    height: 1,
    backgroundColor: semantic.border,
    marginVertical: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
