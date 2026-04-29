import { ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Card, Icon, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockConversations, mockVets } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

const FADE_START = 30;
const FADE_END = 90;

export default function ChatListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const barBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [FADE_START, FADE_END], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [FADE_START + 30, FADE_END], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [FADE_START + 30, FADE_END],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.root}>
      <AppBackground />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56 + 16, paddingBottom: spacing['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero title — scrolls away */}
        <View style={styles.heroTitleWrap}>
          <Text variant="h1">ประวัติแชท</Text>
          <Text variant="body" color={semantic.textSecondary}>
            บทสนทนากับสัตวแพทย์ของคุณ
          </Text>
        </View>

        {mockConversations.length === 0 ? (
          <Card variant="elevated" padding="2xl">
            <View style={styles.empty}>
              <Icon name="MessageCircle" size={48} color={semantic.textMuted} strokeWidth={1.5} />
              <Text variant="bodyStrong">ยังไม่มีประวัติแชท</Text>
              <Text variant="caption" color={semantic.textSecondary} align="center">
                เริ่มแชทกับสัตวแพทย์ออนไลน์ได้จากหน้าสัตวแพทย์
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.list}>
            {mockConversations.map((c) => {
              const vet = mockVets.find((v) => v.id === c.vetId);
              if (!vet) return null;
              return (
                <Card
                  key={c.id}
                  variant="elevated"
                  padding="md"
                  onPress={() => navigation.navigate('Chat', { conversationId: c.id })}
                >
                  <View style={styles.row}>
                    <View style={styles.avatarWrap}>
                      <Image source={{ uri: vet.avatar }} style={styles.avatar} />
                      {vet.status === 'online' && <View style={styles.onlineDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1} style={styles.vetName}>
                        {vet.name}
                      </Text>
                      <View style={styles.chipRow}>
                        <ChipItem icon="Stethoscope" label={vet.specialty} />
                        <ChipItem icon="Briefcase" label={`${vet.experienceYears} ปี`} />
                        <ChipItem icon="Building2" label={vet.clinic} />
                      </View>
                    </View>
                  </View>
                  {c.unread > 0 ? (
                    <View style={[styles.statusBox, styles.unreadBox]}>
                      <Icon
                        name="MessageCircle"
                        size={14}
                        color={semantic.primary}
                        strokeWidth={2}
                      />
                      <Text style={[styles.statusText, styles.unreadText]} numberOfLines={1}>
                        คุณมี {c.unread} ข้อความใหม่
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBox, styles.readBox]}>
                      <Icon
                        name="MessageCircle"
                        size={14}
                        color={semantic.textSecondary}
                        strokeWidth={2}
                      />
                      <Text style={[styles.statusText, styles.readText]} numberOfLines={1}>
                        {c.lastMessage}
                      </Text>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* Sticky AppBar — fades in on scroll */}
      <View
        pointerEvents="box-none"
        style={[styles.appbar, { paddingTop: insets.top, height: insets.top + 56 }]}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, barBgStyle]}>
          <BlurView
            intensity={80}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.barTint]} />
          <View style={styles.barHairline} />
        </Animated.View>

        <View style={styles.appbarContent}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            hitSlop={8}
          >
            <Icon name="ChevronLeft" size={28} color={semantic.textPrimary} strokeWidth={2.2} />
          </Pressable>
          <Animated.View pointerEvents="none" style={[styles.appbarTitleWrap, titleStyle]}>
            <Text variant="bodyStrong" style={styles.appbarTitle} numberOfLines={1}>
              ประวัติแชท
            </Text>
          </Animated.View>
          <View style={styles.appbarPlaceholder} />
        </View>
      </View>
    </View>
  );
}

function ChipItem({
  icon,
  label,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
}) {
  return (
    <View style={styles.chipItem}>
      <Icon name={icon} size={11} color={semantic.textMuted} strokeWidth={2} />
      <Text
        variant="caption"
        color={semantic.textSecondary}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.chipText}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  heroTitleWrap: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.primaryMuted,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#4FB36C',
    borderWidth: 2,
    borderColor: semantic.surface,
  },
  vetName: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    overflow: 'hidden',
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  chipText: {
    fontSize: 10,
    flexShrink: 1,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  unreadBox: {
    backgroundColor: '#F5E4E7',
  },
  readBox: {
    backgroundColor: semantic.surfaceMuted,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'GoogleSans_500Medium',
    flex: 1,
  },
  unreadText: {
    color: semantic.primary,
  },
  readText: {
    color: semantic.textSecondary,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  appbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  appbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    height: 56,
  },
  appbarTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appbarTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    maxWidth: '60%',
    textAlign: 'center',
  },
  appbarPlaceholder: {
    width: 44,
    height: 44,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  barTint: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  barHairline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
