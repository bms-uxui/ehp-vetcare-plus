import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Button,
  Card,
  Icon,
  Screen,
  SkeletonBox,
  SkeletonShimmer,
  Text,
  useSkeletonShimmer,
} from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockVets, mockConversations, statusMeta, thRelative, TeleVet } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'TeleVet'>;

export default function TeleVetScreen({ navigation }: Props) {
  const shimmerStyle = useSkeletonShimmer();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text variant="h1">ปรึกษาสัตวแพทย์</Text>
          <Text variant="body" color={semantic.textSecondary}>
            แชทหรือวิดีโอคอลกับสัตวแพทย์ EHP VetCare
          </Text>
        </View>
        <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
          การสนทนาล่าสุด
        </Text>
        <View style={styles.list}>
          {Array.from({ length: 2 }).map((_, i) => (
            <ConvoSkeleton key={`cv-${i}`} shimmerStyle={shimmerStyle} />
          ))}
        </View>
        <Text variant="overline" color={semantic.textSecondary} style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
          สัตวแพทย์ที่พร้อมให้บริการ
        </Text>
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <VetCardSkeleton key={`vt-${i}`} shimmerStyle={shimmerStyle} />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">ปรึกษาสัตวแพทย์</Text>
        <Text variant="body" color={semantic.textSecondary}>
          แชทหรือวิดีโอคอลกับสัตวแพทย์ EHP VetCare
        </Text>
      </View>

      {mockConversations.length > 0 && (
        <>
          <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
            การสนทนาล่าสุด
          </Text>
          <View style={styles.list}>
            {mockConversations.map((c) => {
              const vet = mockVets.find((v) => v.id === c.vetId);
              if (!vet) return null;
              return (
                <Card
                  key={c.id}
                  variant="elevated"
                  padding="lg"
                  onPress={() => navigation.navigate('Chat', { conversationId: c.id })}
                >
                  <View style={styles.convoRow}>
                    <View style={styles.vetAvatar}>
                      <Icon name="UserCircle" size={32} color={semantic.primary} strokeWidth={1.5} />
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusMeta[vet.status].color },
                        ]}
                      />
                    </View>
                    <View style={styles.convoBody}>
                      <View style={styles.convoTopRow}>
                        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                          {vet.name}
                        </Text>
                        <Text variant="caption" color={semantic.textMuted}>
                          {thRelative(c.lastSentAtISO)}
                        </Text>
                      </View>
                      <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                        {c.lastMessage}
                      </Text>
                    </View>
                    {c.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text variant="caption" color={semantic.onPrimary} weight="600">
                          {c.unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      <Text variant="overline" color={semantic.textSecondary} style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
        สัตวแพทย์ที่พร้อมให้บริการ
      </Text>
      <View style={styles.list}>
        {mockVets.map((v) => (
          <VetCard
            key={v.id}
            vet={v}
            onChat={() => {
              const existing = mockConversations.find((c) => c.vetId === v.id);
              navigation.navigate('Chat', {
                conversationId: existing?.id ?? `new-${v.id}`,
                vetId: v.id,
              });
            }}
            onVideoCall={() => navigation.navigate('VideoCall', { vetId: v.id })}
          />
        ))}
      </View>

      <View style={styles.bookWrap}>
        <Button
          label="จองนัดปรึกษาล่วงหน้า"
          variant="secondary"
          uppercase={false}
          onPress={() => navigation.navigate('BookTeleVet')}
        />
      </View>
    </Screen>
  );
}

function ConvoSkeleton({
  shimmerStyle,
}: {
  shimmerStyle: ReturnType<typeof useSkeletonShimmer>;
}) {
  return (
    <View style={styles.skelCard}>
      <View style={styles.convoRow}>
        <View style={[styles.vetAvatar, { backgroundColor: '#E6E6E8' }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="55%" height={14} />
          <SkeletonBox width="80%" height={11} />
        </View>
      </View>
      <SkeletonShimmer shimmerStyle={shimmerStyle} />
    </View>
  );
}

function VetCardSkeleton({
  shimmerStyle,
}: {
  shimmerStyle: ReturnType<typeof useSkeletonShimmer>;
}) {
  return (
    <View style={styles.skelCard}>
      <View style={styles.vetRow}>
        <View style={[styles.vetAvatar, { backgroundColor: '#E6E6E8' }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="40%" height={11} />
          <SkeletonBox width="55%" height={11} />
          <SkeletonBox width={70} height={11} />
        </View>
      </View>
      <View style={styles.actionRow}>
        <SkeletonBox style={{ flex: 1 } as any} height={36} radius={18} />
        <SkeletonBox style={{ flex: 1 } as any} height={36} radius={18} />
      </View>
      <SkeletonShimmer shimmerStyle={shimmerStyle} />
    </View>
  );
}

function VetCard({
  vet,
  onChat,
  onVideoCall,
}: {
  vet: TeleVet;
  onChat: () => void;
  onVideoCall: () => void;
}) {
  const s = statusMeta[vet.status];
  const isOnline = vet.status === 'online';
  return (
    <Card variant="elevated" padding="lg">
      <View style={styles.vetRow}>
        <View style={styles.vetAvatar}>
          <Icon name="UserCircle" size={36} color={semantic.primary} strokeWidth={1.5} />
          <View style={[styles.statusDot, { backgroundColor: s.color }]} />
        </View>
        <View style={styles.vetBody}>
          <Text variant="bodyStrong">{vet.name}</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            {vet.specialty}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="Star" size={12} color="#D99A20" fill="#D99A20" />
            <Text variant="caption" color={semantic.textMuted}>
              {vet.rating} ({vet.reviewCount}) · ฿{vet.ratePerMin}/นาที
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text variant="caption" color={s.color} weight="600">
              ● {s.label}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actionRow}>
        <Button
          label={isOnline ? 'แชท' : 'ส่งข้อความ'}
          size="sm"
          onPress={onChat}
          fullWidth={false}
          uppercase={false}
          style={{ flex: 1 }}
        />
        <Button
          label="วิดีโอคอล"
          size="sm"
          variant={isOnline ? 'secondary' : 'ghost'}
          disabled={!isOnline}
          onPress={onVideoCall}
          fullWidth={false}
          uppercase={false}
          leftIcon={<Icon name="Video" size={14} color={isOnline ? semantic.primary : semantic.textMuted} />}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  convoBody: {
    flex: 1,
    gap: 2,
  },
  convoTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  vetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: semantic.surface,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: semantic.primary,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vetBody: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bookWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  skelCard: {
    backgroundColor: semantic.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
