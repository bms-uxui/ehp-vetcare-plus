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
  const { height: windowHeight } = useWindowDimensions();

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
      <View style={[styles.hero, { height: HERO_HEIGHT + insets.top, paddingTop: insets.top }]}>
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
          <Text variant="bodyStrong" style={styles.heroTitle}>
            ข้อมูลสัตว์เลี้ยง
          </Text>
          <Text variant="caption" color={semantic.textSecondary} style={styles.heroSubtitle}>
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

function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  return (
    <View style={styles.cardShadow}>
    <Pressable
      onPress={onPress}
      android_ripple={RIPPLE}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      {/* Glass gradient — same recipe as HomeScreen cards */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,253,251,0)', 'rgba(244,201,210,0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0.25, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top stripe — name + microchip pill */}
      <View style={styles.cardTop}>
        <Text variant="bodyStrong" style={styles.petName} numberOfLines={1}>
          {pet.name}
        </Text>
        <View style={styles.chipPill}>
          <Text
            variant="caption"
            color={semantic.textPrimary}
            style={styles.chipText}
            numberOfLines={1}
          >
            {pet.microchipId ?? 'ไม่พบเลขไมโครชิป'}
          </Text>
        </View>
      </View>

      {/* Bottom stripe — stats */}
      <View style={styles.cardBottom}>
        <View style={styles.statsCol}>
          <View style={styles.statsGrid}>
            <Stat label="สายพันธุ์" value={pet.breed} />
            <Stat label="น้ำหนัก" value={`${pet.weightKg} กก.`} />
          </View>
          <Stat label="อายุ" value={petAgeString(pet.birthDate)} />
        </View>
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
        <View
          style={[
            styles.genderBadge,
            { backgroundColor: pet.gender === 'male' ? '#4A8FD6' : '#D6478D' },
          ]}
        >
          <Icon
            name={pet.gender === 'male' ? 'Mars' : 'Venus'}
            size={16}
            color="#FFFFFF"
            strokeWidth={2.4}
          />
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
    paddingHorizontal: spacing.xl,
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
    top: 70,
    width: 140,
    height: 140,
  },
  heroText: {
    position: 'absolute',
    left: spacing.xl,
    top: 110,
    width: 188,
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 28,
    color: '#1A1A1F',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 24,
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
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  cardTop: {
    backgroundColor: 'rgba(184,106,124,0.22)',
    paddingLeft: 120, // leaves room for the overlapping avatar
    paddingRight: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardBottom: {
    paddingLeft: 120,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  petName: {
    fontSize: 16,
    flexShrink: 1,
    color: '#000000',
  },
  chipPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: 170,
  },
  chipText: {
    fontSize: 12,
  },
  statsCol: {
    gap: spacing.sm,
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
    fontSize: 10,
    color: '#000000',
  },
  statValue: {
    fontSize: 14,
    color: '#000000',
  },
  avatarWrap: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 100,
    height: 100,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  genderBadge: {
    position: 'absolute',
    left: 34,
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
