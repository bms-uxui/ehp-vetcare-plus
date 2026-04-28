import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Icon, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockConversations, mockVets } from '../data/televet';
import { useCall } from '../data/callContext';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

type Phase = 'connecting' | 'in-call' | 'rating';

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function VideoCallScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { vetId } = route.params;
  const vet = mockVets.find((v) => v.id === vetId);
  const callCtx = useCall();

  // If call already active for this vet (re-mount after minimize), skip "connecting"
  const alreadyActive = callCtx.state.active && callCtx.state.vetId === vetId;
  const [phase, setPhase] = useState<Phase>(alreadyActive ? 'in-call' : 'connecting');
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [cameraFront, setCameraFront] = useState(true);
  const [swapView, setSwapView] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Connecting → in-call after 2s (mockup); start call in context
  useEffect(() => {
    if (phase !== 'connecting') return;
    const t = setTimeout(() => {
      callCtx.startCall(vetId);
      setPhase('in-call');
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Tick a "now" reference every second to drive duration display
  useEffect(() => {
    if (phase !== 'in-call') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const duration = callCtx.state.startedAt
    ? Math.floor((now - callCtx.state.startedAt) / 1000)
    : 0;

  if (!vet) return null;

  const [showStars, setShowStars] = useState(false);

  // Draggable PiP — pan with tap-to-swap fallback
  const pipPan = useRef(new RNAnimated.ValueXY()).current;
  const PIP_W = 96;
  const PIP_H = 132;
  const MARGIN = spacing.lg;
  const initialTop = insets.top + spacing.sm;
  const minDx = -(SCREEN_WIDTH - PIP_W - MARGIN * 2);
  const maxDx = 0;
  const minDy = 0;
  const maxDy = SCREEN_HEIGHT - initialTop - PIP_H - 120; // leave room for bottom bar

  const pipPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          pipPan.extractOffset();
        },
        onPanResponderMove: RNAnimated.event([null, { dx: pipPan.x, dy: pipPan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          pipPan.flattenOffset();
          // Treat as tap if barely moved → swap view
          if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
            setSwapView((s) => !s);
            return;
          }
          // Snap to nearest corner — never let the PiP rest in the middle
          const x = (pipPan.x as any)._value as number;
          const y = (pipPan.y as any)._value as number;
          const midpointX = (minDx + maxDx) / 2;
          const midpointY = (minDy + maxDy) / 2;
          const targetX = x < midpointX ? minDx : maxDx;
          const targetY = y < midpointY ? minDy : maxDy;
          RNAnimated.spring(pipPan, {
            toValue: { x: targetX, y: targetY },
            useNativeDriver: false,
            friction: 7,
            tension: 60,
          }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minDx, maxDx, minDy, maxDy],
  );

  const onEndCall = () => setPhase('rating');
  const onSubmit = () => {
    setShowStars(true);
    callCtx.endCall();
    setTimeout(() => navigation.goBack(), 1800);
  };
  const onSkip = () => {
    callCtx.endCall();
    navigation.goBack();
  };
  const onMinimize = () => {
    callCtx.minimize();
    const conv = mockConversations.find((c) => c.vetId === vetId);
    if (conv) {
      navigation.replace('Chat', { conversationId: conv.id });
    } else {
      navigation.goBack();
    }
  };

  if (phase === 'rating') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.ratingRoot}
      >
        <ScrollView
          contentContainerStyle={[
            styles.ratingScroll,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.ratingHeader}>
            <Pressable onPress={onSkip} hitSlop={8} style={styles.ratingClose}>
              <Icon name="X" size={24} color={semantic.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.ratingTopWrap}>
            <Image source={{ uri: vet.avatar }} style={styles.ratingAvatar} />
            <Text variant="h2" align="center">{vet.name}</Text>
            <Text variant="body" color={semantic.textSecondary} align="center">
              ระยะเวลาคุย {formatTime(duration)}
            </Text>
          </View>

          <Text variant="bodyStrong" align="center" style={styles.ratingPrompt}>
            ให้คะแนนการให้คำปรึกษา
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} style={styles.starBtn}>
                <Icon
                  name="Star"
                  size={40}
                  color={n <= rating ? '#F4B842' : semantic.textMuted}
                  fill={n <= rating ? '#F4B842' : 'none'}
                  strokeWidth={1.5}
                />
              </Pressable>
            ))}
          </View>

          <Text variant="caption" color={semantic.textSecondary} align="center" style={{ marginBottom: spacing.lg }}>
            {rating === 0
              ? 'แตะดาวเพื่อให้คะแนน'
              : rating === 5
                ? 'ยอดเยี่ยม'
                : rating === 4
                  ? 'ดีมาก'
                  : rating === 3
                    ? 'พอใช้'
                    : rating === 2
                      ? 'ควรปรับปรุง'
                      : 'ไม่พอใจ'}
          </Text>

          <View style={styles.feedbackWrap}>
            <Text variant="caption" color={semantic.textSecondary} style={styles.feedbackLabel}>
              ข้อความถึงคุณหมอ
            </Text>
            <TextInput
              placeholder="แบ่งปันประสบการณ์ของคุณ..."
              placeholderTextColor={semantic.textMuted}
              multiline
              value={feedback}
              onChangeText={setFeedback}
              style={styles.feedbackInput}
              textAlignVertical="top"
            />
          </View>

          <Button label="ส่งคะแนน" onPress={onSubmit} disabled={rating === 0 || showStars} />
          <Pressable onPress={onSkip} style={styles.skipBtn} disabled={showStars}>
            <Text variant="caption" color={semantic.textSecondary}>ข้ามไปก่อน</Text>
          </Pressable>
        </ScrollView>
        {showStars && <FallingStars count={rating * 4} />}
      </KeyboardAvoidingView>
    );
  }

  // In-call / connecting UI
  // When swapView=false → vet fullscreen + self PiP; when true → self fullscreen + vet PiP
  const renderVetFull = () => (
    <>
      <Image
        source={{ uri: vet.avatar }}
        style={StyleSheet.absoluteFill}
        blurRadius={20}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,8,12,0.55)' }]} />
    </>
  );

  const renderSelfFull = () => (
    <LinearGradient
      colors={['#2F1F26', '#160C12']}
      style={StyleSheet.absoluteFill}
    >
      <View style={styles.selfFullCenter}>
        <View style={styles.selfFullAvatar}>
          <Icon name="User" size={56} color="rgba(255,255,255,0.55)" strokeWidth={1.4} />
        </View>
        <Text style={styles.selfFullLabel}>คุณ ({cameraFront ? 'กล้องหน้า' : 'กล้องหลัง'})</Text>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.callRoot}>
      {swapView ? renderSelfFull() : renderVetFull()}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.65)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top: vet name + call duration (only when vet is full) */}
      {!swapView && (
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Image source={{ uri: vet.avatar }} style={styles.bigAvatar} />
          <Text variant="h2" style={styles.callName} numberOfLines={1}>{vet.name}</Text>
          <Text style={styles.callStatus}>
            {phase === 'connecting' ? 'กำลังเชื่อมต่อ...' : formatTime(duration)}
          </Text>
          <Text variant="caption" style={styles.callSubtitle}>
            {vet.specialty}
          </Text>
        </View>
      )}

      {/* When self is full, show duration as small overlay */}
      {swapView && (
        <View style={[styles.miniDurationBar, { top: insets.top + spacing.sm }]}>
          <Text style={styles.miniDuration}>{formatTime(duration)}</Text>
        </View>
      )}

      {/* Minimize button (top-left) */}
      <Pressable
        onPress={onMinimize}
        hitSlop={8}
        style={({ pressed }) => [
          styles.minimizeBtn,
          { top: insets.top + spacing.sm },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Icon name="ChevronDown" size={26} color="#fff" strokeWidth={2.2} />
      </Pressable>

      {/* PiP — drag to move, tap to swap */}
      <RNAnimated.View
        {...pipPanResponder.panHandlers}
        style={[
          styles.selfPip,
          { top: initialTop, transform: pipPan.getTranslateTransform() },
        ]}
      >
        {swapView ? (
          <Image source={{ uri: vet.avatar }} style={StyleSheet.absoluteFill} />
        ) : (
          <>
            <LinearGradient
              colors={['#3B2730', '#1F141A']}
              style={StyleSheet.absoluteFill}
            />
            <Icon name="User" size={28} color="rgba(255,255,255,0.5)" strokeWidth={1.6} />
          </>
        )}
        {!swapView && videoOff && (
          <View style={styles.pipBadge}>
            <Icon name="VideoOff" size={12} color="#fff" />
          </View>
        )}
      </RNAnimated.View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <CtrlBtn
          icon={muted ? 'MicOff' : 'Mic'}
          onPress={() => setMuted((m) => !m)}
          active={muted}
        />
        <CtrlBtn
          icon={videoOff ? 'VideoOff' : 'Video'}
          onPress={() => setVideoOff((v) => !v)}
          active={videoOff}
        />
        <CtrlBtn
          icon="SwitchCamera"
          onPress={() => setCameraFront((c) => !c)}
        />
        <Pressable
          onPress={onEndCall}
          style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.85 }]}
        >
          <Icon name="PhoneOff" size={28} color="#fff" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function CtrlBtn({
  icon,
  onPress,
  active,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctrlBtn,
        active && styles.ctrlBtnActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon name={icon} size={24} color={active ? '#1A1A1F' : '#fff'} strokeWidth={2} />
    </Pressable>
  );
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

function FallingStars({ count }: { count: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        leftPct: Math.random() * 95,
        delay: Math.random() * 700,
        size: 22 + Math.random() * 22,
        duration: 1100 + Math.random() * 600,
        rotateOffset: Math.random() * 540,
        drift: (Math.random() - 0.5) * 60,
      })),
    [count],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <FallingStar key={s.id} {...s} />
      ))}
    </View>
  );
}

function FallingStar({
  leftPct,
  delay,
  size,
  duration,
  rotateOffset,
  drift,
}: {
  leftPct: number;
  delay: number;
  size: number;
  duration: number;
  rotateOffset: number;
  drift: number;
}) {
  const translateY = useSharedValue(-60);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withDelay(delay, withTiming(1, { duration: 120 })),
      withDelay(duration - 320, withTiming(0, { duration: 200 })),
    );
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 80, { duration }),
    );
    translateX.value = withDelay(delay, withTiming(drift, { duration }));
    rotate.value = withDelay(
      delay,
      withTiming(rotateOffset + 540, { duration }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fallingStar,
        { left: (leftPct / 100) * SCREEN_WIDTH, width: size, height: size },
        style,
      ]}
    >
      <Icon
        name="Star"
        size={size}
        color="#F4B842"
        fill="#F4B842"
        strokeWidth={1.2}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /* Call mockup */
  callRoot: {
    flex: 1,
    backgroundColor: '#1A0A12',
  },
  topBar: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  bigAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: spacing.lg,
  },
  callName: {
    color: '#fff',
    textAlign: 'center',
  },
  callStatus: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    fontFamily: 'GoogleSans_500Medium',
    letterSpacing: 0.5,
  },
  callSubtitle: {
    color: 'rgba(255,255,255,0.6)',
  },
  selfPip: {
    position: 'absolute',
    right: spacing.lg,
    width: 96,
    height: 132,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfFullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  selfFullAvatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfFullLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontFamily: 'GoogleSans_500Medium',
  },
  miniDurationBar: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
  },
  miniDuration: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'GoogleSans_500Medium',
  },
  minimizeBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: '#fff',
  },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E03A3A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E03A3A',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  /* Rating */
  ratingRoot: {
    flex: 1,
    backgroundColor: semantic.background,
  },
  ratingScroll: {
    paddingHorizontal: spacing.xl,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  ratingClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTopWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  ratingAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: semantic.primaryMuted,
    marginBottom: spacing.sm,
  },
  ratingPrompt: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starBtn: {
    padding: 4,
  },
  feedbackWrap: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  feedbackLabel: {
    marginLeft: 4,
  },
  feedbackInput: {
    minHeight: 110,
    backgroundColor: semantic.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: semantic.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: 'GoogleSans_400Regular',
    fontSize: 15,
    color: semantic.textPrimary,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  fallingStar: {
    position: 'absolute',
    top: 0,
  },
});
