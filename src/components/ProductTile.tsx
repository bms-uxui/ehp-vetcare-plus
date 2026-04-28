import { useState } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { Product, categoryMeta, fmtBaht } from '../data/products';
import { radii, semantic, spacing } from '../theme';
import Card from './Card';
import Text from './Text';

type Props = {
  product: Product;
  onPress: () => void;
  style?: ViewStyle;
};

export default function ProductTile({ product, onPress, style }: Props) {
  const cat = categoryMeta[product.category];
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!product.imageUrl && !imgFailed;

  return (
    <Card variant="elevated" padding={0} onPress={onPress} style={StyleSheet.flatten([styles.tile, style])}>
      <View style={[styles.image, { backgroundColor: cat.bg }]}>
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
      <View style={styles.body}>
        <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
          {product.brand}
        </Text>
        <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 13, lineHeight: 18 }}>
          {product.name}
        </Text>
        <View style={styles.footer}>
          <View>
            {product.originalPriceBaht && (
              <Text variant="caption" color={semantic.textMuted} style={styles.strike}>
                {fmtBaht(product.originalPriceBaht)}
              </Text>
            )}
            <Text variant="bodyStrong" color={semantic.primary}>
              {fmtBaht(product.priceBaht)}
            </Text>
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
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    overflow: 'hidden',
  },
  image: {
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
    borderRadius: radii.pill,
    backgroundColor: semantic.primary,
  },
  body: {
    padding: spacing.md,
    gap: 4,
  },
  footer: {
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
