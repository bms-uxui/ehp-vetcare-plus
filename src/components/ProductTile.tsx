import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Product, fmtBaht } from '../data/products';
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
  const isOnSale = !!product.originalPriceBaht;
  const priceColor = isOnSale ? '#C25450' : '#4FB36C';
  const showImage = !!product.imageUrl && !imgFailed;

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
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
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
      <View style={styles.body}>
        <Text weight="600" style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text weight="600" style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text weight="700" style={[styles.price, { color: priceColor }]}>
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
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
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
});
