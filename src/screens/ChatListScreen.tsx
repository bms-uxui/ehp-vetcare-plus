import { ComponentProps, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Card,
  Icon,
  SkeletonBox,
  SkeletonShimmer,
  SubPageHeader,
  Text,
  useSkeletonShimmer,
} from '../components';
import { semantic, spacing } from '../theme';
import { mockConversations, mockVets } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const shimmerStyle = useSkeletonShimmer();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader title="ประวัติแชท" onBack={() => navigation.goBack()} />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: spacing.md, paddingBottom: spacing['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {loading ? (
          <View style={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ChatRowSkeleton key={`skel-${i}`} shimmerStyle={shimmerStyle} />
            ))}
          </View>
        ) : mockConversations.length === 0 ? (
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
    </View>
  );
}

function ChatRowSkeleton({
  shimmerStyle,
}: {
  shimmerStyle: ReturnType<typeof useSkeletonShimmer>;
}) {
  return (
    <View style={styles.skelCard}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: '#E6E6E8' }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="55%" height={14} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonBox width={70} height={10} />
            <SkeletonBox width={50} height={10} />
            <SkeletonBox width={80} height={10} />
          </View>
        </View>
      </View>
      <View style={[styles.statusBox, { backgroundColor: '#EFEFF1' }]}>
        <SkeletonBox width="80%" height={12} />
      </View>
      <SkeletonShimmer shimmerStyle={shimmerStyle} />
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
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
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
  skelCard: {
    backgroundColor: semantic.surface,
    borderRadius: 16,
    padding: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
