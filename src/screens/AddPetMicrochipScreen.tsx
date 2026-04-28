import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPetMicrochip'>;

const REQUIRED_DIGITS = 15;

const formatChip = (digits: string) => {
  const d = digits.slice(0, REQUIRED_DIGITS);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6);
  return [a, b, c].filter(Boolean).join('-');
};

type SyncResult = {
  name: string;
  speciesLabel: string;
  breed: string;
  birthDate: string;
  microchipId: string;
};

async function syncWithEHP(chipID: string): Promise<SyncResult | null> {
  // TODO: replace with real EHP API call
  await new Promise((r) => setTimeout(r, 1500));
  if (chipID.length !== REQUIRED_DIGITS) return null;
  return {
    name: 'มอคค่า',
    speciesLabel: 'แมว',
    breed: 'บริติช ชอร์ตแฮร์',
    birthDate: '2023-09-12',
    microchipId: chipID,
  };
}

export default function AddPetMicrochipScreen({ navigation }: Props) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatted = useMemo(() => formatChip(digits), [digits]);
  const ready = digits.length === REQUIRED_DIGITS;

  const onChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '').slice(0, REQUIRED_DIGITS);
    setDigits(onlyDigits);
    setError(null);
    setResult(null);
  };

  const onSync = async () => {
    setBusy(true);
    setError(null);
    // TODO: Haptics.impactAsync(Light) on press
    const data = await syncWithEHP(digits);
    setBusy(false);
    if (!data) {
      setError('ไม่พบข้อมูลในระบบ EHP กรุณาตรวจสอบหมายเลขอีกครั้ง');
      return;
    }
    setResult(data);
  };

  const onConfirm = () => {
    if (!result) return;
    navigation.replace('AddPetManual', { prefill: result } as any);
  };

  return (
    <Screen scroll keyboardAvoiding>
      <Text variant="h1" style={styles.title}>
        หมายเลขไมโครชิป
      </Text>
      <Text variant="body" color={semantic.textSecondary} style={styles.subtitle}>
        ป้อนหมายเลข ISO 15 หลัก เพื่อเชื่อมข้อมูลจากโรงพยาบาลในระบบ EHP
      </Text>

      <Card variant="elevated" padding="lg">
        <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
          หมายเลขไมโครชิป
        </Text>
        <TextInput
          value={formatted}
          onChangeText={onChange}
          placeholder="900-XXX-XXXXXXXXX"
          placeholderTextColor={semantic.textMuted}
          keyboardType="number-pad"
          maxLength={REQUIRED_DIGITS + 2}
          style={styles.input}
        />
        <View style={styles.metaRow}>
          <View style={styles.counterRow}>
            <Icon
              name={ready ? 'CheckCircle2' : 'Hash'}
              size={14}
              color={ready ? '#3FA66B' : semantic.textMuted}
              strokeWidth={2.2}
            />
            <Text
              variant="caption"
              color={ready ? '#3FA66B' : semantic.textSecondary}
              style={{ fontSize: 12 }}
            >
              {digits.length} / {REQUIRED_DIGITS} หลัก
            </Text>
          </View>
          {error && (
            <Text variant="caption" color={'#C25450'} style={{ fontSize: 12 }}>
              {error}
            </Text>
          )}
        </View>
      </Card>

      {result && (
        <Card variant="elevated" padding="lg" style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <Icon name="ShieldCheck" size={20} color={semantic.onPrimary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 11 }}>
                พบข้อมูลในระบบ EHP
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                {result.name}
              </Text>
            </View>
          </View>
          <View style={styles.resultRow}>
            <Text variant="caption" color={semantic.textSecondary}>ประเภท</Text>
            <Text variant="caption">{result.speciesLabel}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text variant="caption" color={semantic.textSecondary}>สายพันธุ์</Text>
            <Text variant="caption">{result.breed}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text variant="caption" color={semantic.textSecondary}>วันเกิด</Text>
            <Text variant="caption">{result.birthDate}</Text>
          </View>
        </Card>
      )}

      <View style={styles.actions}>
        {!result ? (
          <Button
            label={busy ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อกับโรงพยาบาล'}
            onPress={onSync}
            disabled={!ready || busy}
            loading={busy}
            leftIcon={busy ? <ActivityIndicator color={semantic.onPrimary} /> : undefined}
          />
        ) : (
          <Button label="ยืนยันและเพิ่มสัตว์เลี้ยง" onPress={onConfirm} />
        )}
        <Button label="กรอกข้อมูลเองแทน" variant="ghost" onPress={() => navigation.replace('AddPetManual')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl },
  label: { marginBottom: spacing.xs },
  input: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2,
    color: semantic.textPrimary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: semantic.border,
  },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultCard: { marginTop: spacing.lg },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
