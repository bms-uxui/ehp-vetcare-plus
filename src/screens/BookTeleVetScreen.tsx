import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Button, Card, Icon, Input, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { semantic, spacing } from '../theme';
import { mockVets, statusMeta } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'BookTeleVet'>;

type Mode = 'chat' | 'video';

const MODES: { key: Mode; label: string; icon: string }[] = [
  { key: 'chat', label: 'แชท', icon: 'MessageCircle' },
  { key: 'video', label: 'วิดีโอคอล', icon: 'Video' },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '19:00'];

export default function BookTeleVetScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('chat');
  const [vetId, setVetId] = useState<string | null>(mockVets[0]?.id ?? null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const canSubmit = !!(vetId && date && time && reason.trim());

  const onSubmit = () => {
    if (!canSubmit) return;
    navigation.goBack();
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader
        title="จองนัดปรึกษา"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + HEADER_HEIGHT + spacing.md },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <Section label="รูปแบบการปรึกษา">
            <View style={styles.row}>
              {MODES.map((m) => (
                <Card
                  key={m.key}
                  variant="elevated"
                  selected={mode === m.key}
                  padding="md"
                  onPress={() => setMode(m.key)}
                  style={styles.modeTile}
                >
                  <View style={styles.modeInner}>
                    <Icon name={m.icon as any} size={30} color={semantic.primary} />
                    <Text variant="bodyStrong">{m.label}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </Section>

          <Section label="เลือกสัตวแพทย์">
            <View style={styles.vetList}>
              {mockVets.map((v) => (
                <Card
                  key={v.id}
                  variant="elevated"
                  selected={vetId === v.id}
                  padding="lg"
                  onPress={() => setVetId(v.id)}
                >
                  <View style={styles.vetRow}>
                    <View style={styles.vetAvatar}>
                      <Icon name="UserCircle" size={32} color={semantic.primary} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{v.name}</Text>
                      <Text variant="caption" color={semantic.textSecondary}>
                        {v.specialty} · ฿{v.ratePerMin}/นาที
                      </Text>
                      <Text variant="caption" color={statusMeta[v.status].color} weight="600">
                        ● {statusMeta[v.status].label}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </Section>

          <Section label="วันที่">
            <Input
              placeholder="ปปปป-ดด-วว (เช่น 2026-05-15)"
              value={date}
              onChangeText={setDate}
            />
          </Section>

          <Section label="เวลา">
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((t) => (
                <Card
                  key={t}
                  variant="elevated"
                  selected={time === t}
                  padding="sm"
                  onPress={() => setTime(t)}
                  style={styles.timeTile}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                      {t}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </Section>

          <Section label="เหตุผลที่ปรึกษา">
            <Input
              placeholder="เช่น สอบถามเรื่องอาหาร หรือ ตรวจอาการเบื้องต้น"
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </Section>

          <View style={styles.submit}>
            <Button label="ยืนยันการจอง" onPress={onSubmit} disabled={!canSubmit} />
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" color={semantic.textSecondary} style={styles.sectionLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: { marginTop: spacing.sm, marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionLabel: { marginLeft: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  modeTile: { flex: 1 },
  modeInner: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  vetList: { gap: spacing.sm },
  vetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeTile: { flexBasis: '22%', flexGrow: 1 },
  submit: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
