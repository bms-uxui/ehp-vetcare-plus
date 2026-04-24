import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Input, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFeedingSchedule'>;

type Type = 'food' | 'water';

const TYPES: { key: Type; label: string; icon: string }[] = [
  { key: 'food', label: 'อาหาร', icon: 'UtensilsCrossed' },
  { key: 'water', label: 'น้ำ', icon: 'Droplet' },
];

const TIME_OPTIONS = ['06:00', '07:00', '08:00', '12:00', '15:00', '18:00', '19:00', '21:00'];

export default function AddFeedingScheduleScreen({ navigation }: Props) {
  const [type, setType] = useState<Type>('food');
  const [petId, setPetId] = useState<string | null>(mockPets[0]?.id ?? null);
  const [time, setTime] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const canSubmit = !!(petId && time && amount);

  const onSubmit = () => {
    if (!canSubmit) return;
    navigation.goBack();
  };

  return (
    <Screen scroll keyboardAvoiding>
      <Text variant="h1" align="center" style={styles.title}>เพิ่มตาราง</Text>
      <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
        ตั้งเวลาและปริมาณสำหรับการแจ้งเตือน
      </Text>

      <Section label="ประเภท">
        <View style={styles.row}>
          {TYPES.map((t) => (
            <Card
              key={t.key}
              variant="elevated"
              selected={type === t.key}
              padding="md"
              onPress={() => setType(t.key)}
              style={styles.typeTile}
            >
              <View style={styles.typeInner}>
                <Icon name={t.icon as any} size={30} color={semantic.primary} />
                <Text variant="bodyStrong">{t.label}</Text>
              </View>
            </Card>
          ))}
        </View>
      </Section>

      <Section label="สัตว์เลี้ยง">
        <View style={styles.row}>
          {mockPets.map((p) => (
            <Card
              key={p.id}
              variant="elevated"
              selected={petId === p.id}
              padding="md"
              onPress={() => setPetId(p.id)}
              style={styles.petTile}
            >
              <View style={styles.petInner}>
                <View style={styles.petAvatar}>
                  <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
                </View>
                <Text variant="bodyStrong" style={{ fontSize: 13 }}>{p.name}</Text>
              </View>
            </Card>
          ))}
        </View>
      </Section>

      <Section label="เวลา">
        <View style={styles.timeGrid}>
          {TIME_OPTIONS.map((t) => (
            <Card
              key={t}
              variant="elevated"
              selected={time === t}
              padding="sm"
              onPress={() => setTime(t)}
              style={styles.timeTile}
            >
              <View style={styles.timeInner}>
                <Text variant="bodyStrong" style={{ fontSize: 13 }}>{t}</Text>
              </View>
            </Card>
          ))}
        </View>
      </Section>

      <Section label="ปริมาณ">
        <Input
          placeholder={type === 'food' ? 'เช่น 80 กรัม' : 'เช่น 1 ชาม'}
          value={amount}
          onChangeText={setAmount}
        />
      </Section>

      <Section label="หมายเหตุ (ถ้ามี)">
        <Input
          placeholder="เช่น อาหารเม็ด Prescription"
          value={note}
          onChangeText={setNote}
        />
      </Section>

      <View style={styles.submit}>
        <Button label="บันทึกตาราง" onPress={onSubmit} disabled={!canSubmit} />
      </View>
    </Screen>
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeTile: {
    flex: 1,
  },
  typeInner: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  petTile: {
    flexBasis: '31%',
    flexGrow: 1,
  },
  petInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.primaryMuted,
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
  submit: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
