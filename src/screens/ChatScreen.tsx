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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Icon, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockConversations, mockMessages, mockVets, statusMeta, thTime, Message } from '../data/televet';
import { useCall } from '../data/callContext';

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
  const { conversationId, vetId } = route.params;

  const conversation = mockConversations.find((c) => c.id === conversationId);
  const resolvedVetId = conversation?.vetId ?? vetId;
  const vet = mockVets.find((v) => v.id === resolvedVetId);

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
            {vet.avatar ? (
              <Image source={{ uri: vet.avatar }} style={styles.vetAvatarImg} />
            ) : (
              <Icon name="UserCircle" size={28} color={semantic.primary} strokeWidth={1.5} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>{vet.name}</Text>
            {isCallMinimizedForVet ? (
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
        <Pressable
          onPress={isCallMinimizedForVet ? onMaximizeCall : () => {}}
          style={[
            styles.callBtn,
            isCallMinimizedForVet && styles.callBtnActive,
            !isCallMinimizedForVet && vet.status !== 'online' && { opacity: 0.3 },
          ]}
          disabled={!isCallMinimizedForVet && vet.status !== 'online'}
        >
          <Icon name="Video" size={20} color={semantic.primary} />
          {isCallMinimizedForVet && (
            <Text style={styles.callBtnTime}>{formatCallTime(callDuration)}</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
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
            <View style={styles.emptyState}>
              <Icon name="MessageCircle" size={48} color={semantic.textMuted} strokeWidth={1.5} />
              <Text variant="bodyStrong">เริ่มการสนทนา</Text>
              <Text variant="caption" color={semantic.textSecondary} align="center">
                ถามคำถามหรือส่งรูปสัตว์เลี้ยงของคุณได้เลย
              </Text>
            </View>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} msg={m} />)
          )}
          {vetTyping && <TypingIndicator />}
        </ScrollView>

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
          <Text variant="body" color={fromMe ? semantic.onPrimary : semantic.textPrimary}>
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
    backgroundColor: semantic.primary,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: semantic.surfaceMuted,
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
