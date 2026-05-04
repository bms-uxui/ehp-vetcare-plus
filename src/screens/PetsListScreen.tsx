import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
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
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { radii, semantic, spacing } from '../theme';
import { mockPets, petAgeString, Pet } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'PetsList'>;

const HERO_HEIGHT = 220;
const TAB_BAR_SPACE = 110;
const RIPPLE = { color: 'rgba(184,106,124,0.18)', borderless: false } as const;
const RIPPLE_LIGHT = { color: 'rgba(255,255,255,0.25)', borderless: false } as const;
const HERO_IMAGE = require('../../assets/pet-profile-hero.png');
const PATTERN_IMAGE = require('../../assets/pet-card-bg.png');

const AnimatedLG = Animated.createAnimatedComponent(LinearGradient);
const BTN_WIDTH_GUESS = 320;

export default function PetsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

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
  const stickyFadeStart = HERO_HEIGHT - 40;
  const stickyFadeEnd = HERO_HEIGHT + 10;

  const onAddPet = useCallback(
    () => navigation.navigate('AddPet'),
    [navigation],
  );
  const onOpenPet = useCallback(
    (petId: string) => navigation.navigate('PetDetail', { petId }),
    [navigation],
  );

  // Mock skeleton loading state — flips off after ~700ms so the real cards render.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // ── Edit-mode (reorder) state ──
  const [editMode, setEditMode] = useState(false);
  const [petOrder, setPetOrder] = useState<string[]>(() =>
    mockPets.map((p) => p.id),
  );
  // Keep order in sync if pets are added / removed elsewhere in the app.
  useEffect(() => {
    setPetOrder((prev) => {
      const ids = mockPets.map((p) => p.id);
      const merged = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !merged.includes(id));
      return [...merged, ...added];
    });
  }, []);
  const orderedPets = useMemo(
    () =>
      petOrder
        .map((id) => mockPets.find((p) => p.id === id))
        .filter((p): p is Pet => Boolean(p)),
    [petOrder],
  );
  // Stable accent per pet — keyed by pet.id so the color follows the pet
  // (and doesn't shift around as the card is dragged through other slots).
  const accentByPetId = useMemo(() => {
    const m = new Map<string, CardAccent>();
    mockPets.forEach((p, i) => {
      m.set(p.id, CARD_PALETTE[i % CARD_PALETTE.length]);
    });
    return m;
  }, []);
  const finishEdit = useCallback(() => {
    // Persist new order onto the mockPets array so other screens see it.
    const byId = new Map(mockPets.map((p) => [p.id, p]));
    const reordered = petOrder
      .map((id) => byId.get(id))
      .filter((p): p is Pet => Boolean(p));
    mockPets.splice(0, mockPets.length, ...reordered);
    setEditMode(false);
  }, [petOrder]);

  // Skeleton shimmer sweep (separate from the add-button shimmer).
  const skeleton = useSharedValue(0);
  useEffect(() => {
    skeleton.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [skeleton]);
  const skeletonShimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          skeleton.value,
          [0, 1],
          [-windowWidth, windowWidth],
        ),
      },
    ],
  }));

  const onDragEnd = useCallback(
    ({ data }: { data: Pet[] }) => setPetOrder(data.map((p) => p.id)),
    [],
  );

  // Card minHeight (174) + contentContainer gap (12) = stable row height
  const ITEM_HEIGHT = 174 + spacing.md;
  const getItemLayout = useCallback(
    (_data: ArrayLike<Pet> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [ITEM_HEIGHT],
  );

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Pet>) => (
      <ScaleDecorator activeScale={1.08}>
        <PetCard
          pet={item}
          accent={accentByPetId.get(item.id) ?? CARD_PALETTE[0]}
          onOpen={onOpenPet}
          editMode={editMode}
          onDrag={drag}
          isDragging={isActive}
        />
      </ScaleDecorator>
    ),
    [accentByPetId, editMode, onOpenPet],
  );

  const renderHeader = useCallback(() => (
    <>
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
          source={HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.heroText}>
          <Text variant="bodyStrong" style={styles.heroTitle}>
            สัตว์เลี้ยง
          </Text>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            style={styles.heroSubtitle}
          >
            รวมข้อมูลสัตว์เลี้ยงของคุณไว้ในที่เดียว
          </Text>
        </View>
      </View>

      {/* ── ADD / EDIT TOGGLE — sits at the seam between hero and list ── */}
      <View style={styles.addWrap}>
          {editMode ? (
            <Pressable
              onPress={finishEdit}
              android_ripple={RIPPLE_LIGHT}
              style={({ pressed }) => [
                styles.addBtn,
                styles.addRowFloat,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Icon name="Check" size={18} color={semantic.onPrimary} strokeWidth={2.4} />
              <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.addBtnText}>
                เสร็จสิ้น
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.addRow, styles.addRowFloat]}>
              <Pressable
                onPress={onAddPet}
                android_ripple={RIPPLE_LIGHT}
                style={({ pressed }) => [
                  styles.addBtn,
                  styles.addBtnFlex,
                  pressed && { opacity: 0.9 },
                ]}
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
              <Pressable
                onPress={() => setEditMode(true)}
                android_ripple={RIPPLE}
                accessibilityLabel="จัดเรียงสัตว์เลี้ยง"
                style={({ pressed }) => [
                  styles.editToggle,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Icon name="ArrowUpDown" size={18} color={semantic.primary} strokeWidth={2.4} />
              </Pressable>
            </View>
          )}
      </View>
    </>
  ), [
    insets.top,
    windowWidth,
    editMode,
    finishEdit,
    onAddPet,
    shimmerStyle,
  ]);

  return (
    <View style={styles.root}>
      <AppBackground />
      {loading ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <View style={styles.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <PetCardSkeleton
                key={`skeleton-${i}`}
                shimmerStyle={skeletonShimmerStyle}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <DraggableFlatList
          data={orderedPets}
          keyExtractor={(p) => p.id}
          activationDistance={editMode ? 8 : 9999}
          autoscrollSpeed={140}
          autoscrollThreshold={100}
          onDragEnd={onDragEnd}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollOffsetChange={(offset) => {
            scrollY.value = offset;
          }}
          scrollEventThrottle={16}
          renderItem={renderDraggableItem}
        />
        </View>
      )}

      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={stickyFadeStart}
        fadeEndAt={stickyFadeEnd}
        title="ข้อมูลสัตว์เลี้ยง"
      />
    </View>
  );
}

type CardAccent = { bg: string; chip: string };
const CARD_PALETTE: CardAccent[] = [
  { bg: '#3F8FAE', chip: '#2D6F8A' }, // sky blue
  { bg: '#D88636', chip: '#A8651E' }, // warm amber
  { bg: '#4FA45C', chip: '#347E3F' }, // fresh mint
  { bg: '#A85B96', chip: '#82427A' }, // pink-purple
  { bg: '#CA5640', chip: '#9E3D2C' }, // coral
  { bg: '#8E5DBA', chip: '#6E4196' }, // lavender
];

function formatMicrochip(id: string): string {
  const digits = id.replace(/\D/g, '');
  return digits.match(/.{1,3}/g)?.join('-') ?? id;
}

function PetCardSkeleton({
  shimmerStyle,
}: {
  shimmerStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <View style={styles.cardShadow}>
      <View style={[styles.card, styles.cardSized, { backgroundColor: '#E6E6E8' }]}>
        <View style={[styles.cardTop, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.skelLineLong} />
        </View>
        <View style={[styles.cardBottom, { backgroundColor: '#D7D7DB' }]}>
          <View style={styles.statsGrid}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.skelLineShort} />
              <View style={styles.skelLineMid} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.skelLineShort} />
              <View style={styles.skelLineMid} />
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <View style={styles.skelLineShort} />
            <View style={styles.skelLineMid} />
          </View>
        </View>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: '#EFEFF1' }]} />
          <View style={[styles.genderBadge, { backgroundColor: '#EFEFF1' }]} />
        </View>
        <View style={styles.chipPillWrap}>
          <View style={[styles.chipPill, { backgroundColor: '#C9C9CD' }]} />
        </View>

        {/* Animated shimmer sweep — works on both iOS and Android via Reanimated */}
        <Animated.View
          pointerEvents="none"
          style={[styles.skelShimmerWrap, shimmerStyle]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.55)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.skelShimmer}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function PetCardImpl({
  pet,
  accent,
  onOpen,
  editMode = false,
  onDrag,
  isDragging = false,
}: {
  pet: Pet;
  accent: CardAccent;
  onOpen: (id: string) => void;
  editMode?: boolean;
  onDrag?: () => void;
  isDragging?: boolean;
}) {
  const handlePress = useCallback(() => onOpen(pet.id), [onOpen, pet.id]);
  return (
    <View style={styles.cardShadow}>
      <Pressable
        onPress={editMode ? undefined : handlePress}
        android_ripple={editMode ? undefined : RIPPLE}
        style={({ pressed }) => [
          styles.card,
          styles.cardSized,
          { backgroundColor: accent.bg },
          pressed && !editMode && { opacity: 0.92 },
        ]}
      >
        {/* White top strip — name */}
        <View style={styles.cardTop}>
          <Text variant="bodyStrong" style={styles.petName} numberOfLines={1}>
            {pet.name}
          </Text>
        </View>

        {/* Bottom area — stats with paw-print pattern bg */}
        <View style={styles.cardBottom}>
          <View style={styles.patternGrid} pointerEvents="none">
            <Image
              key={accent.bg}
              source={PATTERN_IMAGE}
              style={styles.patternTile}
              resizeMode="cover"
              fadeDuration={0}
            />
          </View>
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
          <View style={[styles.chipPill, { backgroundColor: accent.chip }]}>
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

        {editMode && (
          <Pressable
            onLongPress={onDrag}
            delayLongPress={120}
            hitSlop={8}
            style={({ pressed }) => [
              styles.dragHandle,
              (pressed || isDragging) && { opacity: 0.7 },
            ]}
            accessibilityLabel="ลากเพื่อจัดเรียง"
          >
            <Icon name="GripVertical" size={22} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

const PetCard = memo(PetCardImpl);

const Stat = memo(function Stat({ label, value }: { label: string; value: string }) {
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
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semantic.background,
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
    fontSize: 28,
    lineHeight: 42,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 16,
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
  // Wraps the add/edit row inside the ListHeaderComponent. Visually it looks
  // like the top portion of a single rounded "sheet" — the FlatList's own
  // backgroundColor (`listScroll`) carries the same fill down behind every
  // card so the sheet appears continuous.
  sheetHeader: {
    backgroundColor: semantic.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  listWrap: {
    flex: 1,
    backgroundColor: semantic.background,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: TAB_BAR_SPACE,
    backgroundColor: semantic.background,
  },
  cardRowPad: {
    paddingHorizontal: spacing.xl,
  },
  // White sheet edge that the button row sits on top of. marginTop pulls
  // the rounded top into the hero; the button row inside is offset further
  // up via its own negative margin so it straddles the seam.
  addWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: spacing.lg,
    marginTop: -24,
    backgroundColor: semantic.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  addRowFloat: {
    marginTop: -32,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
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
  addBtnFlex: {
    flex: 1,
  },
  editToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: semantic.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: spacing.md,
  },
  cardShadow: {
    marginHorizontal: spacing.xl,
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
  cardSized: {
    minHeight: 174,
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
    flex: 1,
    paddingLeft: 134,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 18,
    gap: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  patternGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    opacity: 0.5,
  },
  patternTile: {
    flex: 1,
    height: '100%',
  },
  skelLineLong: {
    height: 16,
    width: '60%',
    borderRadius: 8,
    backgroundColor: '#D7D7DB',
  },
  skelLineMid: {
    height: 14,
    width: '70%',
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  skelLineShort: {
    height: 10,
    width: '40%',
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  skelShimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    left: 0,
  },
  skelShimmer: {
    flex: 1,
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
