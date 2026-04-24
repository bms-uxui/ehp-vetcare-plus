import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Input, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import {
  COMMON_SYMPTOMS,
  DURATION_OPTIONS,
  SEVERITY_OPTIONS,
  analyzeSymptoms,
  urgencyMeta,
} from '../data/smart';

type Props = NativeStackScreenProps<RootStackParamList, 'SymptomCheck'>;

type Step = 'pet' | 'symptoms' | 'details' | 'result';

export default function SymptomCheckScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>('pet');
  const [petId, setPetId] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');

  const result = step === 'result' ? analyzeSymptoms({ symptoms: selectedSymptoms, severity, duration }) : null;

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const reset = () => {
    setStep('pet');
    setPetId(null);
    setSelectedSymptoms([]);
    setSeverity(null);
    setDuration(null);
    setCustomNote('');
  };

  const steps: Step[] = ['pet', 'symptoms', 'details', 'result'];
  const stepIndex = steps.indexOf(step);
  const progress = (stepIndex + 1) / steps.length;

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {step === 'pet' && (
        <>
          <Text variant="h1" align="center" style={styles.title}>
            เลือกสัตว์เลี้ยง
          </Text>
          <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
            สัตว์เลี้ยงตัวไหนที่มีอาการ?
          </Text>
          <View style={styles.petGrid}>
            {mockPets.map((p) => (
              <Card
                key={p.id}
                variant="elevated"
                selected={petId === p.id}
                padding="lg"
                onPress={() => setPetId(p.id)}
                style={styles.petTile}
              >
                <View style={styles.petInner}>
                  <View style={styles.petAvatar}>
                    <Text style={{ fontSize: 40 }}>{p.emoji}</Text>
                  </View>
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="caption" color={semantic.textSecondary}>
                    {p.speciesLabel}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
          <View style={styles.actionsColumn}>
            <Button label="ถัดไป" onPress={() => setStep('symptoms')} disabled={!petId} />
          </View>
        </>
      )}

      {step === 'symptoms' && (
        <>
          <Text variant="h1" align="center" style={styles.title}>
            มีอาการอะไรบ้าง?
          </Text>
          <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
            เลือกได้หลายข้อ
          </Text>
          <View style={styles.symptomGrid}>
            {COMMON_SYMPTOMS.map((s) => (
              <Card
                key={s.id}
                variant="elevated"
                selected={selectedSymptoms.includes(s.id)}
                padding="md"
                onPress={() => toggleSymptom(s.id)}
                style={styles.symptomTile}
              >
                <View style={styles.symptomInner}>
                  <Icon
                    name={s.icon as any}
                    size={26}
                    color={selectedSymptoms.includes(s.id) ? semantic.primary : semantic.textSecondary}
                  />
                  <Text variant="bodyStrong" style={{ fontSize: 13 }} align="center">
                    {s.label}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
          <View style={styles.noteWrap}>
            <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
              อาการเพิ่มเติม (ถ้ามี)
            </Text>
            <Input
              placeholder="เช่น ดื่มน้ำมากกว่าปกติ"
              value={customNote}
              onChangeText={setCustomNote}
              multiline
            />
          </View>
          <View style={styles.actions}>
            <Button
              label="ย้อนกลับ"
              variant="ghost"
              uppercase={false}
              onPress={() => setStep('pet')}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <Button
              label="ถัดไป"
              onPress={() => setStep('details')}
              disabled={selectedSymptoms.length === 0}
              fullWidth={false}
              style={{ flex: 2 }}
            />
          </View>
        </>
      )}

      {step === 'details' && (
        <>
          <Text variant="h1" align="center" style={styles.title}>
            รายละเอียดเพิ่มเติม
          </Text>
          <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
            เพื่อให้ AI วิเคราะห์ได้แม่นยำขึ้น
          </Text>

          <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
            อาการเป็นมานานแค่ไหน?
          </Text>
          <View style={styles.chipRow}>
            {DURATION_OPTIONS.map((d) => (
              <Card
                key={d.key}
                variant="elevated"
                selected={duration === d.key}
                padding="md"
                onPress={() => setDuration(d.key)}
                style={styles.durTile}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text variant="bodyStrong" style={{ fontSize: 13 }}>{d.label}</Text>
                </View>
              </Card>
            ))}
          </View>

          <Text variant="caption" color={semantic.textSecondary} style={[styles.label, { marginTop: spacing.xl }]}>
            ความรุนแรงของอาการ
          </Text>
          <View style={styles.chipRow}>
            {SEVERITY_OPTIONS.map((s) => (
              <Card
                key={s.key}
                variant="elevated"
                selected={severity === s.key}
                padding="md"
                onPress={() => setSeverity(s.key)}
                style={styles.sevTile}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.sevDot, { backgroundColor: s.color }]} />
                  <Text variant="bodyStrong" style={{ fontSize: 13, marginTop: 4 }}>
                    {s.label}
                  </Text>
                </View>
              </Card>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              label="ย้อนกลับ"
              variant="ghost"
              uppercase={false}
              onPress={() => setStep('symptoms')}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <Button
              label="วิเคราะห์"
              onPress={() => setStep('result')}
              disabled={!severity || !duration}
              fullWidth={false}
              style={{ flex: 2 }}
            />
          </View>
        </>
      )}

      {step === 'result' && result && (
        <>
          <View style={styles.resultHero}>
            <View style={[styles.urgencyCircle, { backgroundColor: urgencyMeta[result.urgency].bg }]}>
              <Icon name={urgencyMeta[result.urgency].icon as any} size={40} color={urgencyMeta[result.urgency].color} strokeWidth={1.8} />
            </View>
            <Text variant="overline" color={urgencyMeta[result.urgency].color} style={{ marginTop: spacing.md }}>
              ผลการวิเคราะห์
            </Text>
            <Text variant="h2" align="center" style={styles.title}>
              {urgencyMeta[result.urgency].label}
            </Text>
          </View>

          <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
            สาเหตุที่เป็นไปได้
          </Text>
          <Card variant="elevated" padding="lg" style={styles.card}>
            <View style={styles.bullets}>
              {result.possibleConditions.map((c, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text variant="body" style={{ flex: 1 }}>{c}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
            คำแนะนำ
          </Text>
          <Card variant="elevated" padding="lg" style={styles.card}>
            <View style={styles.bullets}>
              {result.recommendations.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Icon name="Check" size={16} color={semantic.primary} strokeWidth={2.5} />
                  <Text variant="body" style={{ flex: 1 }}>{r}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card variant="outlined" padding="lg" style={styles.disclaimerCard}>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              ⚠️ AI วิเคราะห์นี้เป็นข้อมูลเบื้องต้น ไม่สามารถทดแทนการวินิจฉัยโดยสัตวแพทย์ได้
            </Text>
          </Card>

          <View style={styles.actionsColumn}>
            {result.shouldBook && (
              <Button
                label="จองนัดสัตวแพทย์"
                onPress={() => navigation.replace('BookAppointment')}
              />
            )}
            <Button
              label="ตรวจอาการใหม่"
              variant="secondary"
              uppercase={false}
              onPress={reset}
            />
            <Button
              label="กลับ"
              variant="ghost"
              uppercase={false}
              onPress={() => navigation.goBack()}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: {
    height: 4,
    backgroundColor: semantic.surfaceMuted,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressFill: {
    height: '100%',
    backgroundColor: semantic.primary,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  petTile: {
    flexBasis: '30%',
    flexGrow: 1,
  },
  petInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  petAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  symptomTile: {
    flexBasis: '30%',
    flexGrow: 1,
  },
  symptomInner: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  noteWrap: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  label: {
    marginLeft: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  durTile: { flex: 1 },
  sevTile: { flex: 1 },
  sevDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  actions: {
    gap: spacing.sm,
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  resultHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  urgencyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  card: {
    marginBottom: spacing.xl,
  },
  bullets: {
    gap: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.primary,
    marginTop: 8,
  },
  disclaimerCard: {
    marginBottom: spacing.xl,
  },
});
