import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Input, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';
import { categoryMeta, ExpenseCategory } from '../data/expenses';
import { mockPets } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

export default function AddExpenseScreen({ navigation }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [petId, setPetId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const canSubmit = !!(title.trim() && amount.trim() && Number(amount) > 0 && date);

  const onSubmit = () => {
    if (!canSubmit) return;
    navigation.goBack();
  };

  return (
    <Screen scroll keyboardAvoiding>
      <Text variant="h1" align="center" style={styles.title}>บันทึกค่าใช้จ่าย</Text>
      <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
        บันทึกค่าใช้จ่ายเพื่อติดตามงบประมาณ
      </Text>

      <Section label="หมวดหมู่">
        <View style={styles.grid}>
          {(Object.keys(categoryMeta) as ExpenseCategory[]).map((c) => {
            const m = categoryMeta[c];
            return (
              <Card
                key={c}
                variant="elevated"
                selected={category === c}
                padding="md"
                onPress={() => setCategory(c)}
                style={styles.catTile}
              >
                <View style={styles.catInner}>
                  <Icon name={m.icon as any} size={26} color={m.color} />
                  <Text variant="bodyStrong" style={{ fontSize: 12 }}>{m.label}</Text>
                </View>
              </Card>
            );
          })}
        </View>
      </Section>

      <Section label="รายการ">
        <Input placeholder="เช่น Prescription Diet 7kg" value={title} onChangeText={setTitle} />
      </Section>

      <Section label="จำนวนเงิน (บาท)">
        <Input
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </Section>

      <Section label="วันที่">
        <Input placeholder="ปปปป-ดด-วว (เช่น 2026-04-24)" value={date} onChangeText={setDate} />
      </Section>

      <Section label="สัตว์เลี้ยง (ถ้ามี)">
        <View style={styles.grid}>
          <Card
            variant="elevated"
            selected={petId === null}
            padding="md"
            onPress={() => setPetId(null)}
            style={styles.petTile}
          >
            <View style={styles.petInner}>
              <Text style={{ fontSize: 24 }}>—</Text>
              <Text variant="bodyStrong" style={{ fontSize: 12 }}>ไม่ระบุ</Text>
            </View>
          </Card>
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
                  <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                </View>
                <Text variant="bodyStrong" style={{ fontSize: 12 }}>{p.name}</Text>
              </View>
            </Card>
          ))}
        </View>
      </Section>

      <Section label="หมายเหตุ (ถ้ามี)">
        <Input placeholder="รายละเอียดเพิ่มเติม" value={note} onChangeText={setNote} multiline />
      </Section>

      <View style={styles.submit}>
        <Button label="บันทึก" onPress={onSubmit} disabled={!canSubmit} />
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
  title: { marginTop: spacing.sm, marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionLabel: { marginLeft: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catTile: { flexBasis: '30%', flexGrow: 1 },
  catInner: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  petTile: { flexBasis: '22%', flexGrow: 1 },
  petInner: { alignItems: 'center', gap: spacing.xs },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
