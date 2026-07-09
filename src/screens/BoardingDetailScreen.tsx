import { useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Card, Icon, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { useTabletHorizontalPadding } from '../lib/responsive';
import { colors, semantic, shadows, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { mockBoardings, boardingNights, BoardingActivity } from '../data/boarding';
import { mockBoardingClinics, mockVets } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'BoardingDetail'>;

const TH_WEEKDAY_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const fmtFullDate = (iso: string) => {
  const d = new Date(iso);
  return `${TH_WEEKDAY_FULL[d.getDay()]} ${d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
};

const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export default function BoardingDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const padX = useTabletHorizontalPadding(spacing.xl);
  const { boardingId } = route.params;

  const boarding = useMemo(
    () => mockBoardings.find((b) => b.id === boardingId),
    [boardingId],
  );
  const pet = boarding ? mockPets.find((p) => p.id === boarding.petId) : null;
  const clinic = boarding
    ? mockBoardingClinics.find((c) => c.id === boarding.clinicId)
    : null;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Photo viewer state
  const [viewerActivity, setViewerActivity] = useState<BoardingActivity | null>(null);

  const onVideoCall = () => {
    // Reuse the existing VideoCall screen with the first vet as fallback caretaker
    const target = mockVets[0];
    if (target) navigation.navigate('VideoCall', { vetId: target.id });
  };

  const onCallPhone = () => {
    if (boarding?.caretakerPhone) {
      Linking.openURL(`tel:${boarding.caretakerPhone.replace(/\s+/g, '')}`).catch(
        () => {},
      );
    }
  };

  if (!boarding || !pet) {
    return (
      <View style={styles.root}>
        <AppBackground />
        <SubPageHeader title="ฝากเลี้ยง" onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Icon name="Home" size={48} color={semantic.textMuted} strokeWidth={1.6} />
          <Text variant="body" color={semantic.textSecondary}>
            ไม่พบข้อมูลการฝากเลี้ยง
          </Text>
        </View>
      </View>
    );
  }

  const nights = boardingNights(boarding);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startD = new Date(boarding.startDateISO);
  const endD = new Date(boarding.endDateISO);
  const dayNum = Math.max(
    1,
    Math.round((today.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader
        title="กำลังฝากเลี้ยง"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: padX,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* HERO — pet portrait + progress + day count */}
        <View style={styles.heroCard}>
          <LinearGradient
            pointerEvents="none"
            colors={['#FDF6EF', '#FBF3F4', '#F5E4E7']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative paw blob in the corner */}
          <View pointerEvents="none" style={styles.heroBlob}>
            <Icon name="PawPrint" size={120} color={colors.rose[200]} strokeWidth={1.5} />
          </View>
          <View style={styles.heroInner}>
            <View style={styles.heroAvatar}>
              {pet.photo ? (
                <Image source={pet.photo} style={styles.heroAvatarImg} />
              ) : (
                <Text style={{ fontSize: 56 }}>{pet.emoji}</Text>
              )}
            </View>
            <Text variant="bodyStrong" style={styles.heroName}>
              {pet.name}
            </Text>
            <View style={styles.heroDayBadge}>
              <Icon name="Home" size={12} color={semantic.onPrimary} strokeWidth={2.4} />
              <Text variant="caption" weight="600" style={styles.heroDayBadgeText}>
                วันที่ {dayNum} จาก {nights} คืน
              </Text>
            </View>
            {/* Progress bar — visualizes stay duration */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (dayNum / nights) * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text variant="caption" weight="600" color={colors.rose[700]}>
                {fmtShortDate(boarding.startDateISO)}
              </Text>
              <Text variant="caption" weight="600" color={colors.rose[700]}>
                {fmtShortDate(boarding.endDateISO)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stay summary — date + clinic combined */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: semantic.primaryMuted }]}>
              <Icon name="CalendarDays" size={18} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary}>
                ช่วงเวลาฝากเลี้ยง
              </Text>
              <Text variant="bodyStrong" style={styles.summaryTitle}>
                {fmtShortDate(boarding.startDateISO)} – {fmtShortDate(boarding.endDateISO)}
              </Text>
              <Text variant="caption" color={semantic.textSecondary} style={{ marginTop: 2 }}>
                เช็คอิน {fmtFullDate(boarding.startDateISO)}
              </Text>
              <Text variant="caption" color={semantic.textSecondary}>
                เช็คเอาต์ {fmtFullDate(boarding.endDateISO)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: semantic.primaryMuted }]}>
              <Icon name="MapPin" size={18} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary}>
                สถานที่
              </Text>
              <Text variant="bodyStrong" style={styles.summaryTitle}>
                {boarding.clinicName}
              </Text>
              {clinic && (
                <Text variant="caption" color={semantic.textSecondary} style={{ marginTop: 2 }}>
                  {clinic.clinic}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Caretaker contact card */}
        {boarding.caretakerName && (
          <View style={styles.caretakerCard}>
            <View style={styles.caretakerHeader}>
              <View style={styles.caretakerAvatar}>
                <Icon name="UserCircle" size={28} color={semantic.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={semantic.textSecondary}>
                  ติดต่อผู้ดูแล
                </Text>
                <Text variant="bodyStrong" style={styles.caretakerName}>
                  {boarding.caretakerName}
                </Text>
                {boarding.caretakerPhone && (
                  <Text variant="caption" color={semantic.textSecondary}>
                    {boarding.caretakerPhone}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.contactRow}>
              <Pressable
                onPress={onVideoCall}
                style={({ pressed }) => [
                  styles.callBtn,
                  styles.callBtnPrimary,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="วิดีโอคอลผู้ดูแล"
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={['#EFA5B8', '#DA8AA1', '#C87390']}
                  locations={[0, 0.4, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Icon name="Video" size={18} color={semantic.onPrimary} strokeWidth={2.2} />
                <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.callBtnText}>
                  วิดีโอคอล
                </Text>
              </Pressable>
              {boarding.caretakerPhone && (
                <Pressable
                  onPress={onCallPhone}
                  style={({ pressed }) => [
                    styles.callBtn,
                    styles.callBtnSecondary,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="โทรหาผู้ดูแล"
                >
                  <Icon name="Phone" size={18} color={semantic.primary} strokeWidth={2.2} />
                  <Text variant="bodyStrong" color={semantic.primary} style={styles.callBtnText}>
                    โทร
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Activity schedule */}
        <View style={styles.scheduleHeader}>
          <Text variant="bodyStrong" style={styles.scheduleTitle}>
            ตารางกิจกรรมวันนี้
          </Text>
          <Text variant="caption" color={semantic.textSecondary}>
            {boarding.todaySchedule.filter((a) => a.status === 'done').length} /{' '}
            {boarding.todaySchedule.length} เสร็จแล้ว
          </Text>
        </View>
        <View style={styles.scheduleList}>
          {boarding.todaySchedule.map((a, i) => {
            const isLast = i === boarding.todaySchedule.length - 1;
            const isNextUp =
              a.status === 'upcoming' &&
              boarding.todaySchedule.findIndex((x) => x.status === 'upcoming') === i;
            return (
              <ActivityRow
                key={a.id}
                activity={a}
                hideConnector={isLast}
                isNextUp={isNextUp}
                onOpenPhoto={() => setViewerActivity(a)}
              />
            );
          })}
        </View>
      </Animated.ScrollView>

      {/* Photo viewer modal */}
      <Modal
        visible={!!viewerActivity}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerActivity(null)}
        statusBarTranslucent
      >
        <View style={styles.viewerRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setViewerActivity(null)}
          />
          {viewerActivity?.photoUrl && (
            <Image
              source={{ uri: viewerActivity.photoUrl }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
          <View style={[styles.viewerHeader, { paddingTop: insets.top + 8 }]}>
            <View style={styles.viewerTitleWrap}>
              <Text variant="bodyStrong" color="#FFFFFF" style={styles.viewerTitle} numberOfLines={1}>
                {viewerActivity?.label}
              </Text>
              <Text variant="caption" style={styles.viewerSubtitle}>
                {viewerActivity?.time} น.
                {viewerActivity?.note ? ` · ${viewerActivity.note}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => setViewerActivity(null)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.viewerCloseBtn,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="ปิด"
            >
              <Icon name="X" size={22} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActivityRow({
  activity,
  hideConnector,
  isNextUp,
  onOpenPhoto,
}: {
  activity: BoardingActivity;
  hideConnector?: boolean;
  isNextUp?: boolean;
  onOpenPhoto?: () => void;
}) {
  const isDone = activity.status === 'done';
  const isSkipped = activity.status === 'skipped';
  const dotColor = isDone
    ? '#4FB36C'
    : isSkipped
      ? semantic.borderStrong
      : semantic.primary;
  const iconBg = isDone
    ? 'rgba(79,179,108,0.12)'
    : isSkipped
      ? 'rgba(154,154,160,0.10)'
      : isNextUp
        ? semantic.primary
        : 'rgba(184,106,124,0.12)';
  const iconColor = isDone
    ? '#4FB36C'
    : isSkipped
      ? semantic.textMuted
      : isNextUp
        ? semantic.onPrimary
        : semantic.primary;

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityTimeCol}>
        <Text
          variant="caption"
          weight={isNextUp ? '700' : '600'}
          color={isNextUp ? semantic.primary : semantic.textPrimary}
          style={styles.activityTime}
        >
          {activity.time}
        </Text>
        {isNextUp && (
          <Text variant="caption" weight="700" color={semantic.primary} style={styles.activityNextUp}>
            ถัดไป
          </Text>
        )}
      </View>
      <View style={styles.activityRail}>
        <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
        {isNextUp && <View style={[styles.activityDotRing]} />}
        {!hideConnector && (
          <View
            style={[
              styles.activityConnector,
              isDone && { backgroundColor: 'rgba(79,179,108,0.35)' },
            ]}
          />
        )}
      </View>
      <View
        style={[
          styles.activityContent,
          isNextUp && styles.activityContentNextUp,
        ]}
      >
        <View style={[styles.activityIconBox, { backgroundColor: iconBg }]}>
          <Icon name={activity.icon as any} size={16} color={iconColor} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            variant="bodyStrong"
            style={[styles.activityLabel, isSkipped && styles.activityLabelSkipped]}
            numberOfLines={1}
          >
            {activity.label}
          </Text>
          {activity.note && (
            <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
              {activity.note}
            </Text>
          )}
        </View>
        {activity.photoUrl && (
          <Pressable
            onPress={onOpenPhoto}
            hitSlop={6}
            style={({ pressed }) => [
              styles.activityPhotoWrap,
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`ดูรูป ${activity.label}`}
          >
            <Image source={{ uri: activity.photoUrl }} style={styles.activityPhoto} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: {},
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },

  // Hero
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.18)',
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  heroBlob: {
    position: 'absolute',
    top: -24,
    right: -24,
    opacity: 0.45,
    transform: [{ rotate: '-18deg' }],
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  heroAvatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
  },
  heroName: {
    fontSize: 24,
    color: colors.rose[800],
    marginTop: 4,
  },
  heroDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: semantic.primary,
    ...shadows.md,
  },
  heroDayBadgeText: {
    fontSize: 12,
    color: semantic.onPrimary,
    letterSpacing: 0.2,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(184,106,124,0.18)',
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  progressLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  // Stay summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    ...shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 15,
    color: colors.rose[800],
    marginTop: 2,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(184,106,124,0.20)',
    marginVertical: spacing.md,
    marginLeft: 44 + spacing.md, // align with text start
  },

  // Caretaker card
  caretakerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    ...shadows.md,
  },
  caretakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  caretakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caretakerName: {
    fontSize: 15,
    color: colors.rose[800],
    marginTop: 2,
  },

  // Contact buttons
  contactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  callBtn: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  callBtnPrimary: {
    backgroundColor: semantic.primary,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  callBtnSecondary: {
    flex: 0.7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: semantic.primary,
  },
  callBtnText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Schedule
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  scheduleTitle: {
    fontSize: 16,
    color: colors.rose[800],
  },
  scheduleList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    ...shadows.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  activityTimeCol: {
    width: 48,
    paddingTop: 14,
    alignItems: 'flex-start',
  },
  activityTime: {
    fontSize: 13,
  },
  activityNextUp: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  activityRail: {
    width: 16,
    alignItems: 'center',
    paddingTop: 18,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  activityDotRing: {
    position: 'absolute',
    top: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(184,106,124,0.35)',
    zIndex: 1,
  },
  activityConnector: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(184,106,124,0.18)',
    marginTop: -2,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.xs,
    borderRadius: 14,
  },
  activityContentNextUp: {
    backgroundColor: 'rgba(184,106,124,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.18)',
  },
  activityIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    fontSize: 14,
    color: semantic.textPrimary,
  },
  activityLabelSkipped: {
    color: semantic.textMuted,
    textDecorationLine: 'line-through',
  },
  activityCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4FB36C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityPhotoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: semantic.primaryMuted,
    ...shadows.md,
  },
  activityPhoto: {
    width: '100%',
    height: '100%',
  },

  // Photo viewer modal
  viewerRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '85%',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  viewerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  viewerTitle: {
    fontSize: 16,
  },
  viewerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  viewerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
