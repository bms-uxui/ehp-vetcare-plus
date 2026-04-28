import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { mockPets, Pet } from '../data/pets';

type Props = {
  /** Pass a Pet object directly */
  pet?: Pet | null;
  /** Or pass a petId — looked up from mockPets */
  petId?: string;
  /** Fallback emoji when pet not found / has no photo */
  fallbackEmoji?: string;
  /** Avatar diameter in px (default 40) */
  size?: number;
  /** Background color shown behind the photo / emoji (default soft rose tint) */
  backgroundColor?: string;
  style?: ViewStyle;
};

/**
 * Circular pet avatar — renders the pet's real photo when available,
 * falls back to the emoji on the same circular tint. Use everywhere a
 * pet shows up so the user's actual pet identity is consistent.
 */
export default function PetAvatar({
  pet,
  petId,
  fallbackEmoji = '🐾',
  size = 40,
  backgroundColor = '#FBF3F4',
  style,
}: Props) {
  const resolved = pet ?? (petId ? mockPets.find((p) => p.id === petId) : null);
  const photo = resolved?.photo;
  const emoji = resolved?.emoji ?? fallbackEmoji;
  const radius = size / 2;
  const emojiSize = Math.round(size * 0.55);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor,
        },
        style,
      ]}
    >
      {photo ? (
        <Image
          source={photo}
          style={[styles.image, { borderRadius: radius }]}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
