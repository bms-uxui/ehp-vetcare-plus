import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Product, fmtBaht, productImageSource } from '../data/products';
import { useIsTablet } from '../lib/responsive';
import { shadows } from '../theme';
import Text from './Text';

type Props = {
  product: Product;
  onPress: () => void;
  /** When provided (e.g. responsive grid), card and square image use this width.
   *  Otherwise the card stretches to its flex parent and image keeps a 1:1 ratio. */
  cardWidth?: number;
  style?: ViewStyle;
};

export default function ProductTile({ product, onPress, cardWidth, style }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const isTablet = useIsTablet();
  const isOnSale = !!product.originalPriceBaht;
  const priceColor = isOnSale ? '#C25450' : '#4FB36C';
  const imageSource = productImageSource(product);
  const showImage = !!imageSource && !imgFailed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        cardWidth ? { width: cardWidth } : styles.cardFlex,
        style,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        style={[
          styles.image,
          cardWidth ? { width: cardWidth, height: cardWidth } : styles.imageFlex,
        ]}
      >
        {showImage ? (
          <Image
            source={imageSource!}
            // รูป require() มีขนาดจริงในตัว ต้องบังคับ 100% ไม่งั้น Fabric ใช้ขนาดจริงแล้วทะลุการ์ด
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={styles.emoji}>{product.emoji}</Text>
        )}
        {isOnSale && (
          <View style={styles.saleBadge}>
            <Text weight="700" style={styles.saleBadgeText}>
              SALE
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.body, isTablet && styles.bodyTablet]}>
        <Text
          weight="600"
          style={[styles.brand, isTablet && styles.brandTablet]}
          numberOfLines={1}
        >
          {product.brand}
        </Text>
        <Text
          weight="600"
          style={[styles.name, isTablet && styles.nameTablet]}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text
          weight="700"
          style={[styles.price, isTablet && styles.priceTablet, { color: priceColor }]}
        >
          {fmtBaht(product.priceBaht)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE7E9',
    ...shadows.md,
  },
  cardFlex: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  image: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFlex: {
    width: '100%',
    aspectRatio: 1,
  },
  emoji: {
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
  body: {
    padding: 12,
    gap: 2,
  },
  brand: {
    fontSize: 10,
    lineHeight: 13,
    color: '#9A9AA0',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 13,
    lineHeight: 17,
    color: '#1A1A1A',
  },
  price: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },

  // ── Tablet overrides ── (sizes feel small on the larger 4-col cards)
  bodyTablet: {
    padding: 16,
    gap: 4,
  },
  brandTablet: {
    fontSize: 12,
    lineHeight: 16,
  },
  nameTablet: {
    fontSize: 16,
    lineHeight: 22,
  },
  priceTablet: {
    fontSize: 18,
    lineHeight: 24,
  },
});
