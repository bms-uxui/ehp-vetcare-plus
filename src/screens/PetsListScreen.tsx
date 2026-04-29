import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, StickyAppBar, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockPets, petAgeString, Pet } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'PetsList'>;

const HERO_HEIGHT = 220;
const TAB_BAR_SPACE = 110;
const RIPPLE = { color: 'rgba(184,106,124,0.18)', borderless: false } as const;

const AnimatedLG = Animated.createAnimatedComponent(LinearGradient);
const BTN_WIDTH_GUESS = 320;

export default function PetsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  // ── Shimmer (sweeps left → right, repeats with delay) ──
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withDelay(
        1600,
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [shimmer]);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-BTN_WIDTH_GUESS, BTN_WIDTH_GUESS]) },
      { skewX: '-20deg' },
    ],
    opacity: interpolate(shimmer.value, [0, 0.1, 0.5, 0.9, 1], [0, 1, 1, 1, 0]),
  }));

  // ── Sticky AppBar scroll tracking ──
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const stickyFadeStart = HERO_HEIGHT - 40;
  const stickyFadeEnd = HERO_HEIGHT + 10;

  return (
    <View style={styles.root}>
      <AppBackground />
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
      {/* ── HERO ── */}
      <View
        style={[
          styles.hero,
          {
            height: HERO_HEIGHT + insets.top,
            paddingTop: insets.top,
          },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,242,220,0)', '#FFF2DC']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,253,249,0)', '#FFFDFB']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroBottomFade}
        />

        <Image
          source={require('../../assets/pet-profile-hero.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.heroText}>
          <Text
            variant="bodyStrong"
            style={[
              styles.heroTitle,
              {
                fontSize: Math.max(22, Math.min(32, windowWidth * 0.07)),
                lineHeight: Math.max(34, Math.min(46, windowWidth * 0.1)),
              },
            ]}
          >
            ข้อมูลสัตว์เลี้ยง
          </Text>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            style={[
              styles.heroSubtitle,
              {
                fontSize: Math.max(13, Math.min(17, windowWidth * 0.04)),
                lineHeight: Math.max(24, Math.min(30, windowWidth * 0.07)),
              },
            ]}
          >
            ตรวจสอบข้อมูลหรือเพิ่มข้อมูล{'\n'}สมาชิกสัตว์เลี้ยงของคุณ
          </Text>
        </View>
      </View>

      {/* ── BODY SHEET ── */}
      <View
        style={[
          styles.sheet,
          { minHeight: windowHeight - HERO_HEIGHT - insets.top + 24 + TAB_BAR_SPACE },
        ]}
      >
        <View style={styles.addWrap}>
          <Pressable
            onPress={() => navigation.navigate('AddPet')}
            android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
          >
            <AnimatedLG
              pointerEvents="none"
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.shimmer, shimmerStyle]}
            />
            <Icon name="Plus" size={18} color={semantic.onPrimary} strokeWidth={2.4} />
            <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.addBtnText}>
              เพิ่มสัตว์เลี้ยง
            </Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {mockPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
            />
          ))}
        </View>
      </View>
      </Animated.ScrollView>

      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={stickyFadeStart}
        fadeEndAt={stickyFadeEnd}
        title="ข้อมูลสัตว์เลี้ยง"
      />
    </View>
  );
}

function formatMicrochip(id: string): string {
  const digits = id.replace(/\D/g, '');
  return digits.match(/.{1,3}/g)?.join('-') ?? id;
}

function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  return (
    <View style={styles.cardShadow}>
      <Pressable
        onPress={onPress}
        android_ripple={RIPPLE}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      >
        {/* Dark paw-print background fills the whole card */}
        <Image
          source={require('../../assets/pet-card-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="repeat"
        />

        {/* White top strip — name */}
        <View style={styles.cardTop}>
          <Text variant="bodyStrong" style={styles.petName} numberOfLines={1}>
            {pet.name}
          </Text>
        </View>

        {/* Bottom dark area — stats */}
        <View style={styles.cardBottom}>
          <View style={styles.statsGrid}>
            <Stat label="สายพันธุ์" value={pet.breed} />
            <Stat label="น้ำหนัก" value={`${pet.weightKg} กก.`} />
          </View>
          <Stat label="อายุ" value={petAgeString(pet.birthDate)} />
        </View>

        {/* Avatar — overlaps both stripes, absolute */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {pet.photo ? (
              <Image source={pet.photo} style={styles.avatarImage} />
            ) : (
              <Text style={{ fontSize: 44 }}>{pet.emoji}</Text>
            )}
          </View>
          <View style={styles.genderBadge}>
            <Icon
              name={pet.gender === 'male' ? 'Mars' : 'Venus'}
              size={16}
              color={pet.gender === 'male' ? '#4A8FD6' : '#D6478D'}
              strokeWidth={2.4}
            />
          </View>
        </View>

        {/* Microchip pill — sits below the avatar */}
        <View style={styles.chipPillWrap}>
          <View style={styles.chipPill}>
            <Text
              variant="caption"
              weight="500"
              color={semantic.textPrimary}
              style={styles.chipText}
              numberOfLines={1}
            >
              {pet.microchipId
                ? formatMicrochip(pet.microchipId)
                : 'ไม่พบเลขไมโครชิป'}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 37,
  },
  heroImage: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 60,
    width: 140,
    height: 140,
  },
  heroText: {
    paddingHorizontal: spacing.xl,
    width: 220,
    gap: spacing.sm,
  },
  heroTitle: {
    color: '#1A1A1F',
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#4A4A50',
  },
  sheet: {
    backgroundColor: semantic.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    marginBottom: -TAB_BAR_SPACE,
    paddingBottom: TAB_BAR_SPACE,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  addWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: -24,
    marginBottom: spacing.lg,
  },
  addBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: semantic.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
  },
  addBtnText: {
    fontSize: 15,
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  cardShadow: {
    borderRadius: radii.xl,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  card: {
    position: 'relative',
    backgroundColor: '#1F4151',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  cardTop: {
    backgroundColor: '#FFFFFF',
    paddingLeft: 134,
    paddingRight: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardBottom: {
    paddingLeft: 134,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 18,
    gap: spacing.sm,
  },
  chipPillWrap: {
    position: 'absolute',
    left: 14,
    width: 110,
    top: 138,
    alignItems: 'center',
  },
  petName: {
    fontSize: 20,
    lineHeight: 28,
    flexShrink: 1,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  chipPill: {
    backgroundColor: '#152F3B',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  statValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatarWrap: {
    position: 'absolute',
    left: 14,
    top: 18,
    width: 110,
    height: 110,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  genderBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  genderText: {
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginTop: -1,
  },
});
