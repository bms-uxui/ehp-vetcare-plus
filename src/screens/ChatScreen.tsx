import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Icon, PetAvatar, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import {
  AI_CATEGORIES,
  AiCategory,
  mockConversations,
  mockMessages,
  mockVets,
  statusMeta,
  thTime,
  Message,
} from '../data/televet';
import { mockPets } from '../data/pets';
import { useAppointments } from '../data/appointmentsContext';
import { useCall } from '../data/callContext';
import {
  appointmentStartDate,
  formatRemaining,
  isVideoCallActive,
  isVideoCallPreview,
} from '../lib/appointmentTime';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Stub vet replies cycled randomly when user sends a message (demo only).
const VET_REPLIES: string[] = [
  'รับทราบค่ะ ขออนุญาตดูประวัติก่อนนะคะ',
  'ขอบคุณข้อมูลค่ะ จะแจ้งกลับเร็วๆ นี้นะคะ',
  'อาการแบบนี้ลองสังเกตอีก 1-2 วันก่อนได้ค่ะ',
  'แนะนำพาน้องมาตรวจที่คลินิกจะดีกว่านะคะ',
  'รบกวนส่งรูปเพิ่มเติมได้มั้ยคะ?',
];

// Fake older messages prepended on pull-to-refresh.
const HISTORY_TEMPLATES: { fromVet: boolean; text: string }[] = [
  { fromVet: false, text: 'สวัสดีค่ะคุณหมอ ขอสอบถามเพิ่มเติมหน่อยค่ะ' },
  { fromVet: true, text: 'สวัสดีค่ะ ยินดีให้คำปรึกษานะคะ' },
  { fromVet: false, text: 'น้องกินอาหารน้อยลงเล็กน้อยค่ะ' },
  { fromVet: true, text: 'มีอาการอื่นๆ ร่วมด้วยมั้ยคะ?' },
  { fromVet: false, text: 'ไม่มีค่ะ ยังเล่นปกติ' },
  { fromVet: true, text: 'ลองสังเกตอีก 1-2 วันนะคะ ถ้าไม่ดีขึ้นพามาตรวจ' },
];

export default function ChatScreen({ route, navigation }: Props) {
  const { conversationId, vetId, aiMode, petId, initialPrompt, initialReply, appointmentId } = route.params;

  const conversation = mockConversations.find((c) => c.id === conversationId);
  const resolvedVetId = conversation?.vetId ?? vetId;
  const vet = mockVets.find((v) => v.id === resolvedVetId);
  const isAi = !!aiMode || resolvedVetId === 'tv-ai';
  const pet = petId ? mockPets.find((p) => p.id === petId) : undefined;
  const petName = pet?.name ?? 'น้อง';
  const fillTemplate = (s: string) => s.replace(/\{pet\}/g, petName);

  // Active video call (minimized) for THIS vet → transform header
  const callCtx = useCall();
  const isCallMinimizedForVet =
    callCtx.state.active &&
    callCtx.state.minimized &&
    callCtx.state.vetId === resolvedVetId;
  const [callNow, setCallNow] = useState(Date.now());
  useEffect(() => {
    if (!isCallMinimizedForVet) return;
    const id = setInterval(() => setCallNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isCallMinimizedForVet]);
  const callDuration = callCtx.state.startedAt
    ? Math.floor((callNow - callCtx.state.startedAt) / 1000)
    : 0;
  const formatCallTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Blinking dot animation for active-call state
  const blinkOpacity = useSharedValue(1);
  useEffect(() => {
    if (isCallMinimizedForVet) {
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(blinkOpacity);
      blinkOpacity.value = 1;
    }
  }, [isCallMinimizedForVet, blinkOpacity]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blinkOpacity.value }));

  const onMaximizeCall = () => {
    if (!isCallMinimizedForVet) return;
    callCtx.maximize();
    if (callCtx.state.vetId) {
      navigation.navigate('VideoCall', { vetId: callCtx.state.vetId });
    }
  };

  // Video call gating:
  //   - active (start ≤ now < end) → enabled
  //   - preview (≤15 min before start) → disabled, shows countdown
  //   - otherwise → hidden / disabled, no countdown
  // The 15-min mark is purely a heads-up; the actual call only opens at the
  // appointment time. A reminder push notification fires at -15 min as well.
  const { appointments: allAppointments } = useAppointments();
  const appointment = appointmentId
    ? allAppointments.find((a) => a.id === appointmentId)
    : undefined;
  const apptDateTime = useMemo(
    () => (appointment ? appointmentStartDate(appointment) : null),
    [appointment],
  );
  const [vcNow, setVcNow] = useState(() => Date.now());
  useEffect(() => {
    if (!apptDateTime) return;
    const id = setInterval(() => setVcNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [apptDateTime]);
  const canStartVideoCall = !!appointment && isVideoCallActive(appointment, vcNow);
  const inCallPreview = !!appointment && isVideoCallPreview(appointment, vcNow);
  const callCountdown =
    inCallPreview && apptDateTime
      ? formatRemaining(apptDateTime.getTime() - vcNow)
      : null;
  const onStartVideoCall = () => {
    if (!canStartVideoCall || !resolvedVetId) return;
    navigation.navigate('VideoCall', { vetId: resolvedVetId });
  };

  const initialMessages = useMemo(
    () => mockMessages.filter((m) => m.conversationId === conversationId),
    [conversationId],
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [vetTyping, setVetTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  // Auto-send an initial prompt + AI reply when navigated here with one
  // (e.g. from HelpScreen FAQ topic → ask AI to teach app usage).
  useEffect(() => {
    if (!initialPrompt) return;
    const userText = fillTemplate(initialPrompt);
    const replyText = initialReply ? fillTemplate(initialReply) : '';
    setMessages((prev) => [
      ...prev,
      {
        id: `local-init-${Date.now()}`,
        conversationId,
        fromVet: false,
        text: userText,
        sentAtISO: new Date().toISOString(),
      },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setVetTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    typingTimeoutRef.current = setTimeout(() => {
      setVetTyping(false);
      if (!replyText) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-init-${Date.now()}`,
          conversationId,
          fromVet: true,
          text: replyText,
          sentAtISO: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 1400 + Math.random() * 800);
    // Only on mount — intentional empty deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    if (refreshing || !hasMoreHistory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);

    setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 0) {
          setHasMoreHistory(false);
          return prev;
        }
        const earliest = new Date(prev[0].sentAtISO).getTime();
        const olderHistory: Message[] = HISTORY_TEMPLATES.map((tpl, i) => ({
          id: `hist-${earliest}-${i}`,
          conversationId,
          fromVet: tpl.fromVet,
          text: tpl.text,
          sentAtISO: new Date(earliest - (HISTORY_TEMPLATES.length - i) * 60_000).toISOString(),
        }));
        // Stop after one round so we don't load infinitely.
        setHasMoreHistory(false);
        return [...olderHistory, ...prev];
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshing(false);
    }, 900);
  }, [refreshing, hasMoreHistory, conversationId]);

  if (!vet) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text variant="h3">ไม่พบการสนทนา</Text>
      </SafeAreaView>
    );
  }

  const sendImage = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((prev) => [
      ...prev,
      {
        id: `img-${Date.now()}`,
        conversationId,
        fromVet: false,
        image: uri,
        sentAtISO: new Date().toISOString(),
      },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    // Trigger vet typing reply same as text send.
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setVetTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setVetTyping(false);
      const reply = VET_REPLIES[Math.floor(Math.random() * VET_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: `vet-${prev.length}`,
          conversationId,
          fromVet: true,
          text: reply,
          sentAtISO: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 2200 + Math.random() * 1200);
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('ไม่ได้รับสิทธิ์ใช้กล้อง', 'กรุณาเปิดสิทธิ์ใช้กล้องในการตั้งค่า');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) sendImage(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('ไม่ได้รับสิทธิ์เข้าถึงรูปภาพ', 'กรุณาเปิดสิทธิ์ในการตั้งค่า');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) sendImage(result.assets[0].uri);
  };

  const sendAiCategory = (cat: AiCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userText = fillTemplate(cat.prompt);
    const replyText = fillTemplate(cat.reply);
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        conversationId,
        fromVet: false,
        text: userText,
        sentAtISO: now,
      },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setVetTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    typingTimeoutRef.current = setTimeout(() => {
      setVetTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${prev.length}`,
          conversationId,
          fromVet: true,
          text: replyText,
          sentAtISO: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 1400 + Math.random() * 800);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        conversationId,
        fromVet: false,
        text,
        sentAtISO: now,
      },
    ]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    // Show vet typing indicator, then auto-reply after a short delay.
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setVetTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    typingTimeoutRef.current = setTimeout(() => {
      setVetTyping(false);
      const reply = VET_REPLIES[Math.floor(Math.random() * VET_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: `vet-${prev.length}`,
          conversationId,
          fromVet: true,
          text: reply,
          sentAtISO: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 2200 + Math.random() * 1200);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, isCallMinimizedForVet && styles.headerCallActive]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Icon name="ChevronLeft" size={24} color={semantic.primary} />
        </Pressable>
        <View style={styles.headerVet}>
          <View style={styles.vetAvatar}>
            {isAi ? (
              <Image
                source={require('../../assets/dr-meaw.png')}
                style={styles.vetAvatarImg}
                resizeMode="contain"
              />
            ) : vet.avatar ? (
              <Image source={{ uri: vet.avatar }} style={styles.vetAvatarImg} />
            ) : (
              <Icon name="UserCircle" size={28} color={semantic.primary} strokeWidth={1.5} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>{vet.name}</Text>
            {isAi ? (
              <Text variant="caption" color={semantic.textSecondary}>
                {pet ? `กำลังช่วยดูแลน้อง${pet.name}` : 'ผู้ช่วย AI พร้อมตอบคำถาม'}
              </Text>
            ) : isCallMinimizedForVet ? (
              <Animated.View style={[styles.statusRow, blinkStyle]}>
                <Text style={styles.statusDotInline}>●</Text>
                <Text variant="caption" color={semantic.primary}>แตะเพื่อเปิดหน้าจอวิดีโอคอล</Text>
              </Animated.View>
            ) : (
              <Text variant="caption" color={statusMeta[vet.status].color}>
                ● {statusMeta[vet.status].label}
              </Text>
            )}
          </View>
        </View>
        {!isAi && (
          <Pressable
            onPress={
              isCallMinimizedForVet
                ? onMaximizeCall
                : canStartVideoCall
                  ? onStartVideoCall
                  : undefined
            }
            disabled={!isCallMinimizedForVet && !canStartVideoCall}
            hitSlop={6}
            accessibilityLabel={
              isCallMinimizedForVet
                ? 'เปิดหน้าจอวิดีโอคอล'
                : canStartVideoCall
                  ? 'เริ่มวิดีโอคอลสัตวแพทย์'
                  : callCountdown
                    ? `เริ่มได้ในอีก ${callCountdown}`
                    : 'วิดีโอคอลใช้ได้เมื่อถึงเวลานัด'
            }
            style={[
              styles.callBtn,
              isCallMinimizedForVet && styles.callBtnActive,
              canStartVideoCall && !isCallMinimizedForVet && styles.callBtnReady,
              !isCallMinimizedForVet && !canStartVideoCall && { opacity: 0.35 },
            ]}
          >
            <Icon name="Video" size={20} color={semantic.primary} />
            {isCallMinimizedForVet && (
              <Text style={styles.callBtnTime}>{formatCallTime(callDuration)}</Text>
            )}
            {!isCallMinimizedForVet && callCountdown && (
              <Text style={styles.callBtnTime}>{callCountdown}</Text>
            )}
          </Pressable>
        )}
        {isAi && pet && (
          <View style={styles.petAvatarSlot}>
            <PetAvatar pet={pet} size={36} />
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.messagesBgWrap}>
          <LinearGradient
            pointerEvents="none"
            colors={['#FFE9F1', '#FFFFFF', '#E8F4FB']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        <ScrollView
          ref={scrollRef}
          style={[styles.flex, styles.messagesScroll]}
          contentContainerStyle={styles.messages}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={semantic.primary}
              colors={[semantic.primary]}
              title={hasMoreHistory ? 'ดึงเพื่อโหลดประวัติ' : 'แสดงครบทั้งหมดแล้ว'}
              titleColor={semantic.textSecondary}
            />
          }
        >
          {messages.length === 0 ? (
            isAi ? (
              <View style={styles.aiEmpty}>
                <Animated.View
                  entering={FadeInLeft.delay(180).duration(420)}
                  style={styles.aiEmptyTextWrap}
                >
                  <Text variant="bodyStrong" style={styles.aiEmptyTitle}>
                    มีอะไรให้หมอเหมียวช่วย
                  </Text>
                  <Text variant="caption" color={semantic.textSecondary}>
                    เลือกหัวข้อด้านล่างได้เลยค่ะ
                  </Text>
                </Animated.View>
                <Animated.Image
                  entering={SlideInRight.duration(560)}
                  source={require('../../assets/dr-meaw-greeting.png')}
                  style={styles.aiEmptyMascot}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="MessageCircle" size={48} color={semantic.textMuted} strokeWidth={1.5} />
                <Text variant="bodyStrong">เริ่มการสนทนา</Text>
                <Text variant="caption" color={semantic.textSecondary} align="center">
                  ถามคำถามหรือส่งรูปสัตว์เลี้ยงของคุณได้เลย
                </Text>
              </View>
            )
          ) : (
            messages.map((m) => <MessageBubble key={m.id} msg={m} />)
          )}
          {vetTyping && <TypingIndicator />}
        </ScrollView>
        </View>

        {isAi && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryRow}
          >
            {AI_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => sendAiCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Icon
                  name={cat.icon as never}
                  size={14}
                  color={semantic.primary}
                  strokeWidth={2.2}
                />
                <Text variant="bodyStrong" style={styles.categoryChipText}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <Pressable style={styles.composerIconBtn} hitSlop={8} onPress={pickFromCamera}>
            <Icon name="Camera" size={22} color={semantic.textSecondary} />
          </Pressable>
          <Pressable style={styles.composerIconBtn} hitSlop={8} onPress={pickFromLibrary}>
            <Icon name="ImagePlus" size={22} color={semantic.textSecondary} />
          </Pressable>
          <View style={styles.inputField}>
            <TextInput
              style={styles.input}
              placeholder="พิมพ์ข้อความ..."
              placeholderTextColor={semantic.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>
          <Pressable
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={send}
            disabled={!input.trim()}
          >
            <Icon name="Send" size={18} color={semantic.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(v);
  }, [v, delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * v.value }],
    opacity: 0.4 + 0.6 * v.value,
  }));

  return <Animated.View style={[styles.typingDot, animStyle]} />;
}

function TypingIndicator() {
  return (
    <View style={[styles.msgRow, styles.msgTheirs]}>
      <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
        <TypingDot delay={0} />
        <TypingDot delay={150} />
        <TypingDot delay={300} />
      </View>
    </View>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const fromMe = !msg.fromVet;
  const isImage = !!msg.image;
  return (
    <View style={[styles.msgRow, fromMe ? styles.msgMine : styles.msgTheirs]}>
      {isImage ? (
        <Image source={{ uri: msg.image }} style={styles.imageBubble} resizeMode="cover" />
      ) : (
        <View
          style={[
            styles.bubble,
            fromMe ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text variant="body" color={fromMe ? semantic.textPrimary : semantic.onPrimary}>
            {msg.text}
          </Text>
        </View>
      )}
      <Text variant="caption" color={semantic.textMuted} style={styles.msgTime}>
        {thTime(msg.sentAtISO)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: semantic.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: semantic.border,
  },
  headerCallActive: {
    backgroundColor: '#FBF3F4',
    borderBottomColor: '#F5E4E7',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDotInline: {
    color: semantic.primary,
    fontSize: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerVet: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  vetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vetAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: semantic.surface,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnReady: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 6,
    backgroundColor: '#F5E4E7',
  },
  callBtnActive: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 6,
    backgroundColor: '#F5E4E7',
  },
  callBtnTime: {
    color: semantic.primary,
    fontSize: 13,
    fontFamily: 'GoogleSans_500Medium',
  },
  messagesBgWrap: {
    flex: 1,
  },
  messagesScroll: {
    backgroundColor: 'transparent',
  },
  messages: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing['5xl'],
  },
  aiEmpty: {
    paddingTop: spacing['3xl'],
    paddingLeft: spacing.xs,
    paddingRight: 140,
    minHeight: 280,
    justifyContent: 'center',
    // cancel ScrollView padding on the right so the mascot can hit the edge
    marginRight: -spacing.lg,
  },
  aiEmptyTextWrap: {
    gap: spacing.sm,
  },
  aiEmptyMascot: {
    position: 'absolute',
    right: -spacing.xl,
    bottom: 0,
    width: 280,
    height: 280,
  },
  aiEmptyTitle: {
    fontSize: 18,
    color: semantic.textPrimary,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: semantic.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(159,82,102,0.18)',
  },
  categoryChipText: {
    fontSize: 13,
    color: semantic.primary,
    fontWeight: '700',
  },
  msgRow: {
    maxWidth: '78%',
    gap: 2,
  },
  msgMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  bubbleMine: {
    backgroundColor: '#FFFFFF',
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: semantic.primary,
    borderBottomLeftRadius: 6,
  },
  imageBubble: {
    width: 220,
    height: 220,
    borderRadius: radii.xl,
    backgroundColor: semantic.surfaceMuted,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 36,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: semantic.textMuted,
  },
  msgTime: {
    fontSize: 10,
    marginHorizontal: spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing['4xl'],
    borderTopWidth: 1,
    borderTopColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  composerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 4,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: semantic.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
