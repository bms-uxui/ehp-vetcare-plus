import { useEffect, useRef } from 'react';
import {
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, CoachMarks, Icon, Text } from '../components';
import { useGuide } from '../lib/useGuide';
import { ADDPET_GUIDE_STEPS, ADDPET_GUIDE_VERSION } from '../data/guides';
import { endGuideTour, guideTour } from '../data/guideState';
import { shadows, tintedShadow } from '../theme';

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

  // Quick start guide — สองวิธีเพิ่มสัตว์เลี้ยง หน้านี้สั้นไม่ต้องเลื่อน
  // จึงไม่ผูก scrollRef (focus() จะวัดตำแหน่งเฉย ๆ)
  const guideScrollRef = useRef<ScrollView>(null);
  const guide = useGuide({
    id: 'addpet',
    version: ADDPET_GUIDE_VERSION,
    steps: ADDPET_GUIDE_STEPS,
    scrollRef: guideScrollRef,
  });
  const { register } = guide;

  // รับไม้ต่อของทัวร์ — หน้านี้ mount ใหม่ทุกครั้ง เช็คตอน mount พอ
  useEffect(() => {
    if (guideTour.queue[0] !== 'addpet') return;
    const t = setTimeout(guide.start, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const inTour = guide.open && guideTour.queue[0] === 'addpet';
  // ทัวร์จบแค่หน้าเลือกวิธี ไม่พาเข้าฟอร์มกรอก → ส่งไม้ต่อให้หน้านัดหมาย
  const advanceTour = () => {
    guide.finish();
    if (guideTour.queue[0] === 'addpet') {
      guideTour.queue.shift();
      // รอ Modal ของ guide dismiss จบก่อนค่อย pop กลับไปสลับแท็บ
      setTimeout(() => navigation.navigate('Main', { screen: 'Vet' } as never), 400);
    }
  };
  const abortTour = () => {
    endGuideTour();
    guide.finish();
  };

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
            {...register(`ap-${opt.key}`)}
            onPress={() => navigation.navigate(opt.route as any)}
            style={({ pressed }) => [
              styles.cardShadow,
              opt.shadowColor ? tintedShadow(opt.shadowColor, 'pop') : null,
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

      <CoachMarks
        visible={guide.open}
        steps={ADDPET_GUIDE_STEPS}
        rects={guide.rects}
        step={guide.step}
        onStepChange={guide.setStep}
        onFinish={inTour ? advanceTour : guide.finish}
        onSkip={inTour ? abortTour : guide.finish}
        nextPage={inTour ? { label: 'นัดหมาย', onPress: advanceTour } : undefined}
      />
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
    ...shadows.sm,
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
    ...shadows.pop,
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
