import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockProducts, categoryMeta, ProductCategory, fmtBaht, Product } from '../data/products';
import { mockPets } from '../data/pets';
import { useCart } from '../data/cart';

type Props = NativeStackScreenProps<RootStackParamList, 'PetShop'>;

export default function PetShopScreen({ navigation }: Props) {
  const { count } = useCart();
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(null);

  const featured = useMemo(() => mockProducts.filter((p) => p.originalPriceBaht), []);
  const recommended = useMemo(() => {
    const species = Array.from(new Set(mockPets.map((p) => p.species)));
    return mockProducts.filter((p) =>
      p.recommendedFor.some((kind) => species.includes(kind as any)),
    );
  }, []);

  const filtered = activeCategory
    ? mockProducts.filter((p) => p.category === activeCategory)
    : mockProducts;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="h1">ร้านค้า</Text>
          <Text variant="body" color={semantic.textSecondary}>
            อาหารและอุปกรณ์จากคลินิก EHP VetCare
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartBtn} hitSlop={8}>
          <Icon name="ShoppingCart" size={22} color={semantic.primary} />
          {count > 0 && (
            <View style={styles.cartBadge}>
              <Text variant="caption" color={semantic.onPrimary} weight="600" style={{ fontSize: 11 }}>
                {count}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Categories */}
      <View style={styles.catRow}>
        <CategoryChip
          icon="LayoutGrid"
          label="ทั้งหมด"
          active={activeCategory === null}
          onPress={() => setActiveCategory(null)}
        />
        {(Object.keys(categoryMeta) as ProductCategory[]).map((c) => {
          const m = categoryMeta[c];
          return (
            <CategoryChip
              key={c}
              icon={m.icon}
              label={m.label}
              active={activeCategory === c}
              onPress={() => setActiveCategory(c)}
            />
          );
        })}
      </View>

      {/* Featured */}
      {!activeCategory && featured.length > 0 && (
        <>
          <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
            🔥 โปรโมชั่น
          </Text>
          <View style={styles.featuredGrid}>
            {featured.map((p) => (
              <ProductTile
                key={p.id}
                product={p}
                onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
              />
            ))}
          </View>
        </>
      )}

      {/* Recommended for your pets */}
      {!activeCategory && (
        <>
          <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
            ✨ แนะนำสำหรับสัตว์ของคุณ
          </Text>
          <View style={styles.petChipRow}>
            {mockPets.map((p) => (
              <View key={p.id} style={styles.petChip}>
                <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                <Text variant="caption" color={semantic.textSecondary}>{p.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.grid}>
            {recommended.slice(0, 4).map((p) => (
              <ProductTile
                key={p.id}
                product={p}
                onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
              />
            ))}
          </View>
        </>
      )}

      {/* All / filtered */}
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        {activeCategory ? categoryMeta[activeCategory].label : 'สินค้าทั้งหมด'} ({filtered.length})
      </Text>
      <View style={styles.grid}>
        {filtered.map((p) => (
          <ProductTile
            key={p.id}
            product={p}
            onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
          />
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

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
      <Icon name={icon as any} size={14} color={active ? semantic.onPrimary : semantic.textSecondary} />
      <Text
        variant="bodyStrong"
        style={{ fontSize: 12 }}
        color={active ? semantic.onPrimary : semantic.textSecondary}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ProductTile({ product, onPress }: { product: Product; onPress: () => void }) {
  const cat = categoryMeta[product.category];
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!product.imageUrl && !imgFailed;
  return (
    <Card variant="elevated" padding={0} onPress={onPress} style={styles.tile}>
      <View style={[styles.tileImage, { backgroundColor: cat.bg }]}>
        {showImage ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={{ fontSize: 56 }}>{product.emoji}</Text>
        )}
        {product.originalPriceBaht && (
          <View style={styles.saleBadge}>
            <Text variant="caption" color={semantic.onPrimary} weight="600" style={{ fontSize: 10 }}>
              SALE
            </Text>
          </View>
        )}
      </View>
      <View style={styles.tileBody}>
        <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
          {product.brand}
        </Text>
        <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 13, lineHeight: 18 }}>
          {product.name}
        </Text>
        <View style={styles.tileFooter}>
          <View>
            {product.originalPriceBaht && (
              <Text variant="caption" color={semantic.textMuted} style={styles.strike}>
                {fmtBaht(product.originalPriceBaht)}
              </Text>
            )}
            <Text variant="bodyStrong" color={semantic.primary}>{fmtBaht(product.priceBaht)}</Text>
          </View>
          <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
            ⭐ {product.rating}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: semantic.surface,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  chipActive: {
    backgroundColor: semantic.primary,
    borderColor: semantic.primary,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  petChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: semantic.primaryMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    overflow: 'hidden',
  },
  tileImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  tileBody: {
    padding: spacing.md,
    gap: 4,
  },
  tileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  strike: {
    textDecorationLine: 'line-through',
    fontSize: 11,
  },
});
