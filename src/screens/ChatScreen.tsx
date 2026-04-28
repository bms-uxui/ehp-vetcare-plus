import { useMemo, useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Icon, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockConversations, mockMessages, mockVets, statusMeta, thTime, Message } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Mock older messages prepended to the conversation when the user pulls to
// refresh. Reads as a previous chat thread now in history.
const HISTORY_TEMPLATES = [
  'สวัสดีค่ะ มีอะไรให้คุณหมอช่วยไหมคะ',
  'น้องแมวอ้วก 2 ครั้งตั้งแต่เช้าค่ะ ทำยังไงดี',
  'ลองสังเกตอาการก่อน ถ้ายังอ้วกหรือซึม ขับถ่ายผิดปกติ ให้พามาคลินิกนะครับ',
  'ตอนนี้ทานอาหารน้อยลงด้วยค่ะ',
  'ลองเปลี่ยนเป็นอาหารเปียกชั่วคราว และให้น้ำเยอะ ๆ ครับ',
  'ขอบคุณค่ะ จะลองดูก่อนนะคะ',
];

export default function ChatScreen({ route, navigation }: Props) {
  const { conversationId, vetId } = route.params;

  const conversation = mockConversations.find((c) => c.id === conversationId);
  const resolvedVetId = conversation?.vetId ?? vetId;
  const vet = mockVets.find((v) => v.id === resolvedVetId);

  const initialMessages = useMemo(
    () => mockMessages.filter((m) => m.conversationId === conversationId),
    [conversationId],
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  if (!vet) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text variant="h3">ไม่พบการสนทนา</Text>
      </SafeAreaView>
    );
  }

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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (historyExhausted) {
      // Brief spin so the gesture acknowledges, then stop with status text
      await new Promise((r) => setTimeout(r, 500));
      setRefreshing(false);
      return;
    }

    // Simulate network latency loading history
    await new Promise((r) => setTimeout(r, 800));

    setMessages((prev) => {
      const earliestMs =
        prev.length > 0 ? new Date(prev[0].sentAtISO).getTime() : Date.now();
      const oldMessages: Message[] = HISTORY_TEMPLATES.map((text, i) => ({
        id: `history-${i}`,
        conversationId,
        fromVet: i % 2 === 0,
        text,
        sentAtISO: new Date(
          earliestMs - (HISTORY_TEMPLATES.length - i) * 60_000,
        ).toISOString(),
      }));
      return [...oldMessages, ...prev];
    });
    setHistoryExhausted(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Icon name="ChevronLeft" size={24} color={semantic.primary} />
        </Pressable>
        <View style={styles.headerVet}>
          <View style={styles.vetAvatar}>
            <Icon name="UserCircle" size={28} color={semantic.primary} strokeWidth={1.5} />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusMeta[vet.status].color },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>{vet.name}</Text>
            <Text variant="caption" color={statusMeta[vet.status].color}>
              ● {statusMeta[vet.status].label}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {}}
          style={[styles.callBtn, vet.status !== 'online' && { opacity: 0.3 }]}
          disabled={vet.status !== 'online'}
        >
          <Icon name="Video" size={20} color={semantic.primary} />
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
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={semantic.primary}
              colors={[semantic.primary]}
              title={
                historyExhausted
                  ? 'แสดงครบทั้งหมดแล้ว'
                  : 'ดึงเพื่อโหลดประวัติ'
              }
              titleColor={semantic.primary}
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
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <Pressable style={styles.composerIconBtn} hitSlop={8}>
            <Icon name="Paperclip" size={22} color={semantic.textSecondary} />
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

function MessageBubble({ msg }: { msg: Message }) {
  const fromMe = !msg.fromVet;
  return (
    <View style={[styles.msgRow, fromMe ? styles.msgMine : styles.msgTheirs]}>
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
    paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.lg,
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
