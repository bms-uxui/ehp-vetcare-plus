import { ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Text } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPet'>;

type PathOption = {
  key: 'scan' | 'manual';
  title: string;
  subtitle: string;
  route: keyof RootStackParamList;
  recommended?: boolean;
  image?: ImageSourcePropType;
  imageOffsetX?: number;
  imageOffsetY?: number;
  imageResizeMode?: 'cover' | 'contain';
  imageBg?: string;
  strokeColor?: string;
  shadowColor?: string;
};

const OPTIONS: PathOption[] = [
  {
    key: 'scan',
    title: 'สแกนบัตรประจำตัวสัตว์เลี้ยง',
    subtitle: 'ถ่ายรูปบัตรเพื่อดึงข้อมูลอัตโนมัติ',
    route: 'AddPetScan',
    recommended: true,
    image: require('../../assets/scan-pet-id-card-hero.png'),
    strokeColor: '#9F5266',
    shadowColor: '#7E3D4F',
  },
  {
    key: 'manual',
    title: 'กรอกข้อมูลเอง',
    subtitle: 'กรอกข้อมูลเอง',
    route: 'AddPetManual',
    image: require('../../assets/manual-input-hero.png'),
    imageOffsetX: 0,
    imageOffsetY: 4,
    imageResizeMode: 'contain',
    imageBg: '#FDF6EF',
  },
];

export default function AddPetScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityLabel="ย้อนกลับ"
        >
          <Icon name="ChevronLeft" size={20} color="#1A1A1F" strokeWidth={2.4} />
        </Pressable>
        <Text variant="bodyStrong" style={styles.title}>
          เพิ่มสัตว์เลี้ยง
        </Text>
      </View>

      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => navigation.navigate(opt.route as any)}
            style={({ pressed }) => [
              styles.cardShadow,
              opt.shadowColor
                ? {
                    shadowColor: opt.shadowColor,
                    shadowOpacity: 0.28,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 12 },
                    elevation: 10,
                  }
                : null,
              pressed && { opacity: 0.92 },
            ]}
          >
            <LinearGradient
              colors={[
                '#FFFFFF',
                opt.strokeColor ?? '#FFD2B8',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.cardStroke,
                opt.strokeColor ? { padding: 2.5 } : null,
              ]}
            >
              <View style={styles.card}>
                <View
                  style={[
                    styles.cardImage,
                    opt.imageBg ? { backgroundColor: opt.imageBg } : null,
                  ]}
                >
                  {opt.image && (
                    <Image
                      source={opt.image}
                      style={[
                        styles.cardImageInner,
                        (opt.imageOffsetX != null || opt.imageOffsetY != null)
                          ? {
                              transform: [
                                { translateX: opt.imageOffsetX ?? 0 },
                                { translateY: opt.imageOffsetY ?? 0 },
                                { scale: 1.05 },
                              ],
                            }
                          : null,
                      ]}
                      contentFit={opt.imageResizeMode ?? 'cover'}
                      transition={0}
                      cachePolicy="memory-disk"
                    />
                  )}
                  {opt.recommended && (
                    <View style={styles.recommendBadge}>
                      <Text variant="bodyStrong" style={styles.recommendText}>
                        แนะนำ
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardText}>
                  <Text variant="bodyStrong" style={styles.cardTitle}>
                    {opt.title}
                  </Text>
                  <Text variant="body" style={styles.cardSubtitle}>
                    {opt.subtitle}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  cardShadow: {
    borderRadius: 24,
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardStroke: {
    borderRadius: 24,
    padding: 1.5,
  },
  card: {
    height: 230,
    borderRadius: 22.5,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardImage: {
    height: 158,
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardImageInner: {
    flex: 1,
    width: undefined,
    height: undefined,
    transform: [{ scale: 1.05 }],
  },
  recommendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: '#9F5266',
  },
  recommendText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardText: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6E6E74',
  },
});
