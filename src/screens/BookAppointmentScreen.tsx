import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Button, Card, Icon, Input, StickyAppBar, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { typeMeta, AppointmentType, MOCK_VETS } from '../data/appointments';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointment'>;

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

export default function BookAppointmentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [petId, setPetId] = useState<string | null>(mockPets[0]?.id ?? null);
  const [type, setType] = useState<AppointmentType | null>('checkup');
  const [date, setDate] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [vetId, setVetId] = useState<string | null>(MOCK_VETS[0]?.id ?? null);
  const [notes, setNotes] = useState('');

  const canSubmit = useMemo(
    () => !!(petId && type && date && time && vetId),
    [petId, type, date, time, vetId],
  );

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 56 + spacing.md },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <Text variant="h1" style={styles.title}>
            จองนัดหมาย
          </Text>
          <Text variant="body" color={semantic.textSecondary} style={styles.subtitle}>
            เลือกข้อมูลเพื่อจองคิวคลินิก
          </Text>

          {/* Pet */}
          <Section label="สัตว์เลี้ยง">
            <View style={styles.chipGrid}>
              {mockPets.map((p) => (
                <Card
                  key={p.id}
                  variant="elevated"
                  selected={petId === p.id}
                  padding="md"
                  onPress={() => setPetId(p.id)}
                  style={styles.petTile}
                >
                  <View style={styles.petTileInner}>
                    <View style={styles.petAvatar}>
                      <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
                    </View>
                    <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                      {p.name}
                    </Text>
                    <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 11 }}>
                      {p.speciesLabel}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </Section>

          {/* Type */}
          <Section label="ประเภทการนัด">
            <View style={styles.chipGrid}>
              {(Object.keys(typeMeta) as AppointmentType[]).map((t) => {
                const m = typeMeta[t];
                return (
                  <Card
                    key={t}
                    variant="elevated"
                    selected={type === t}
                    padding="md"
                    onPress={() => setType(t)}
                    style={styles.typeTile}
                  >
                    <View style={styles.typeInner}>
                      <View style={[styles.typeIconWrap, { backgroundColor: `${m.color}22` }]}>
                        <Icon name={m.icon as any} size={22} color={m.color} strokeWidth={2.2} />
                      </View>
                      <Text
                        variant="bodyStrong"
                        style={{ fontSize: 13 }}
                        numberOfLines={1}
                      >
                        {m.label}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </Section>

          {/* Date */}
          <Section label="วันที่">
            <Input
              placeholder="ปปปป-ดด-วว (เช่น 2026-05-15)"
              value={date}
              onChangeText={setDate}
            />
          </Section>

          {/* Time */}
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
                  <View style={styles.timeInner}>
                    <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                      {t}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </Section>

          {/* Vet */}
          <Section label="สัตวแพทย์">
            <View style={styles.vetList}>
              {MOCK_VETS.map((v) => (
                <Card
                  key={v.id}
                  variant="elevated"
                  selected={vetId === v.id}
                  padding="lg"
                  onPress={() => setVetId(v.id)}
                >
                  <Text variant="bodyStrong">{v.name}</Text>
                  <Text variant="caption" color={semantic.textSecondary}>
                    {v.specialty} · {v.clinic}
                  </Text>
                </Card>
              ))}
            </View>
          </Section>

          {/* Notes */}
          <Section label="หมายเหตุ (ถ้ามี)">
            <Input
              placeholder="เช่น อาการเบื้องต้น"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </Section>

          <View style={styles.submit}>
            <Button label="ยืนยันการจอง" onPress={onSubmit} disabled={!canSubmit} />
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={20}
        fadeEndAt={80}
        title="จองนัดหมาย"
        leading={{
          icon: 'ChevronLeft',
          onPress: () => navigation.goBack(),
          accessibilityLabel: 'ย้อนกลับ',
        }}
      />
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
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    marginLeft: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  petTile: {
    flexBasis: '31%',
    flexGrow: 1,
  },
  petTileInner: {
    alignItems: 'center',
    gap: 2,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  typeTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  typeInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeTile: {
    flexBasis: '22%',
    flexGrow: 1,
  },
  timeInner: {
    alignItems: 'center',
  },
  vetList: {
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
