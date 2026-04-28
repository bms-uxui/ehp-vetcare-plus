import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Input, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPetManual'>;

type Species = 'dog' | 'cat' | 'rabbit' | 'other';

const SPECIES: { key: Species; label: string; emoji: string }[] = [
  { key: 'dog', label: 'สุนัข', emoji: '🐶' },
  { key: 'cat', label: 'แมว', emoji: '🐱' },
  { key: 'rabbit', label: 'กระต่าย', emoji: '🐰' },
  { key: 'other', label: 'อื่นๆ', emoji: '🐾' },
];

const GENDERS: { key: 'male' | 'female'; label: string; symbol: string }[] = [
  { key: 'male', label: 'ชาย', symbol: '♂' },
  { key: 'female', label: 'หญิง', symbol: '♀' },
];

const STEPS = [
  { key: 'species', title: 'น้องเป็นสัตว์ชนิดไหนเอ่ย?', subtitle: 'เลือกแล้วอัปโหลดรูปน้องสวยๆ ได้เลย' },
  { key: 'identity', title: 'น้องชื่ออะไรครับ?', subtitle: 'มาทำความรู้จักน้องกันก่อนเลย' },
  { key: 'details', title: 'น้องเกิดวันที่เท่าไหร่ครับ?', subtitle: 'ข้อมูลเพิ่มเติมเล็กๆ น้อยๆ' },
] as const;

export default function AddPetManualScreen({ navigation, route }: Props) {
  const prefill = route.params?.prefill;
  const [stepIndex, setStepIndex] = useState(0);
  const [species, setSpecies] = useState<Species>('dog');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState(prefill?.name ?? '');
  const [breed, setBreed] = useState(prefill?.breed ?? '');
  const [birthDate, setBirthDate] = useState(prefill?.birthDate ?? '');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const canProceed =
    (step.key === 'species' && !!species) ||
    (step.key === 'identity' && name.trim().length > 0) ||
    step.key === 'details';

  const onNext = () => {
    if (isLast) {
      navigation.goBack();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const onBack = () => {
    if (isFirst) {
      navigation.goBack();
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const currentEmoji = SPECIES.find((s) => s.key === species)?.emoji ?? '🐾';

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.stepperRow}>
        {STEPS.map((s, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <View key={s.key} style={styles.stepperItem}>
              <View
                style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  active && styles.stepDotActive,
                ]}
              >
                <Text
                  variant="caption"
                  weight="700"
                  color={active || done ? semantic.onPrimary : semantic.textMuted}
                  style={{ fontSize: 12 }}
                >
                  {i + 1}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>

      <Text variant="h1" align="center" style={styles.title}>
        {step.title}
      </Text>
      <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
        {step.subtitle}
      </Text>

      {step.key === 'species' && (
        <>
          <View style={styles.photoWrap}>
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.photoAvatar, pressed && { opacity: 0.9 }]}
            >
              <Text style={{ fontSize: 64 }}>{currentEmoji}</Text>
            </Pressable>
            <Text variant="caption" color={semantic.textSecondary}>
              แตะเพื่อใส่รูปน้อง
            </Text>
          </View>

          <View style={styles.speciesGrid}>
            {SPECIES.map((s) => (
              <Card
                key={s.key}
                variant="elevated"
                selected={species === s.key}
                padding="md"
                onPress={() => setSpecies(s.key)}
                style={styles.speciesTile}
              >
                <View style={styles.speciesInner}>
                  <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                  <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                    {s.label}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      {step.key === 'identity' && (
        <View style={styles.form}>
          <Input
            label="น้องชื่ออะไรครับ?"
            placeholder="เช่น ข้าวปั้น"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="น้องสายพันธุ์อะไรเอ่ย?"
            placeholder="เช่น ชิบะ อินุ"
            value={breed}
            onChangeText={setBreed}
          />
          <View>
            <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
              เด็กชาย หรือ เด็กหญิง?
            </Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <Card
                  key={g.key}
                  variant="elevated"
                  selected={gender === g.key}
                  padding="md"
                  onPress={() => setGender(g.key)}
                  style={styles.genderTile}
                >
                  <View style={styles.genderInner}>
                    <Text variant="bodyStrong">
                      {g.symbol}  {g.label}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </View>
      )}

      {step.key === 'details' && (
        <View style={styles.form}>
          <Input
            label="น้องเกิดวันที่เท่าไหร่ครับ?"
            placeholder="ปปปป-ดด-วว"
            value={birthDate}
            onChangeText={setBirthDate}
          />
          <Input
            label="น้องหนักเท่าไหร่ครับ? (กก.)"
            placeholder="เช่น 9.4"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
          <Input
            label="ขนน้องสีอะไรเอ่ย?"
            placeholder="เช่น ส้มขาว"
            value={color}
            onChangeText={setColor}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button
          label={isFirst ? 'ยกเลิก' : 'ย้อนกลับ'}
          variant="secondary"
          onPress={onBack}
          fullWidth={false}
          style={styles.actionBtn}
        />
        <Button
          label={isLast ? 'บันทึก' : 'ถัดไป'}
          onPress={onNext}
          disabled={!canProceed}
          fullWidth={false}
          style={styles.actionBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: semantic.border,
  },
  stepDotActive: {
    backgroundColor: semantic.primary,
    borderColor: semantic.primary,
  },
  stepDotDone: {
    backgroundColor: semantic.primary,
    borderColor: semantic.primary,
    opacity: 0.55,
  },
  stepLine: {
    width: 36,
    height: 2,
    backgroundColor: semantic.border,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: semantic.primary,
    opacity: 0.55,
  },
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  photoWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  photoAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: semantic.primary,
    borderStyle: 'dashed',
  },
  label: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  speciesTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  speciesInner: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderTile: {
    flex: 1,
  },
  genderInner: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1,
  },
});
