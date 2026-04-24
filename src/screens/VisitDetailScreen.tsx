import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card, Icon, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockVisits, thDate, LabResult, Medication } from '../data/visits';
import { mockPets } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'VisitDetail'>;

export default function VisitDetailScreen({ route }: Props) {
  const { visitId } = route.params;
  const visit = mockVisits.find((v) => v.id === visitId);

  if (!visit) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบข้อมูล</Text>
      </Screen>
    );
  }

  const pet = mockPets.find((p) => p.id === visit.petId);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Icon name="Stethoscope" size={40} color={semantic.primary} strokeWidth={1.8} />
        </View>
        <Text variant="caption" color={semantic.primary} style={{ marginTop: spacing.md }}>
          {thDate(visit.dateISO)}
        </Text>
        <Text variant="h2" align="center" style={styles.title}>
          {visit.diagnosis}
        </Text>
        {pet && (
          <Text variant="caption" color={semantic.textSecondary} align="center">
            {pet.emoji} {pet.name}
          </Text>
        )}
      </View>

      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.vitalsRow}>
          <Vital label="น้ำหนัก" value={`${visit.weightKg}`} unit="กก." />
          <VitalDivider />
          <Vital
            label="อุณหภูมิ"
            value={`${visit.temperatureC}`}
            unit="°C"
            warn={visit.temperatureC > 39.2 || visit.temperatureC < 37.8}
          />
          {visit.heightCm !== undefined && (
            <>
              <VitalDivider />
              <Vital label="ส่วนสูง" value={`${visit.heightCm}`} unit="ซม." />
            </>
          )}
        </View>
      </Card>

      <Section label="สัตวแพทย์และคลินิก">
        <InfoRow label="สัตวแพทย์" value={visit.vetName} />
        <Divider />
        <InfoRow label="คลินิก" value={visit.clinicName} />
      </Section>

      <Section label="อาการเบื้องต้น">
        <Text variant="body">{visit.symptoms}</Text>
      </Section>

      <Section label="การวินิจฉัย">
        <Text variant="body">{visit.diagnosis}</Text>
      </Section>

      {visit.labs.length > 0 && (
        <Section label={`ผลตรวจ (${visit.labs.length})`}>
          <View style={styles.labList}>
            {visit.labs.map((lab) => (
              <LabRow key={lab.id} lab={lab} />
            ))}
          </View>
        </Section>
      )}

      {visit.medications.length > 0 && (
        <Section label={`รายการยา (${visit.medications.length})`}>
          <View style={styles.medList}>
            {visit.medications.map((med) => (
              <MedRow key={med.id} med={med} />
            ))}
          </View>
        </Section>
      )}

      {visit.notes && (
        <Section label="หมายเหตุ">
          <Text variant="body">{visit.notes}</Text>
        </Section>
      )}

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        {label}
      </Text>
      <Card variant="elevated" padding="lg">
        <View style={styles.sectionBody}>{children}</View>
      </Card>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="caption" color={semantic.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Vital({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <View style={styles.vital}>
      <Text variant="overline" color={semantic.textMuted}>{label}</Text>
      <View style={styles.vitalValueRow}>
        <Text variant="h2" color={warn ? '#E14B4B' : semantic.textPrimary}>{value}</Text>
        <Text variant="caption" color={semantic.textSecondary}>{unit}</Text>
      </View>
    </View>
  );
}

function VitalDivider() {
  return <View style={styles.vitalDivider} />;
}

function LabRow({ lab }: { lab: LabResult }) {
  const statusMap = {
    normal: { label: 'ปกติ', bg: '#E7F5E9', fg: '#4FB36C' },
    attention: { label: 'ควรติดตาม', bg: '#FFF4E0', fg: '#D98A20' },
    abnormal: { label: 'ผิดปกติ', bg: '#FDECEC', fg: '#E14B4B' },
  } as const;
  const typeMap = {
    lab: 'TestTube',
    xray: 'Scan',
    ultrasound: 'Microscope',
  } as const;
  const s = statusMap[lab.resultStatus];
  return (
    <View style={styles.labRow}>
      <View style={styles.labIcon}>
        <Icon name={typeMap[lab.type] as any} size={20} color={semantic.textSecondary} />
      </View>
      <View style={styles.labBody}>
        <Text variant="bodyStrong">{lab.name}</Text>
        <Text variant="caption" color={semantic.textSecondary}>{lab.result}</Text>
      </View>
      <View style={[styles.labBadge, { backgroundColor: s.bg }]}>
        <Text variant="caption" color={s.fg} weight="600">{s.label}</Text>
      </View>
    </View>
  );
}

function MedRow({ med }: { med: Medication }) {
  return (
    <View style={styles.medRow}>
      <View style={styles.medIcon}>
        <Icon name="Pill" size={20} color={semantic.primary} />
      </View>
      <View style={styles.medBody}>
        <Text variant="bodyStrong">{med.name}</Text>
        <Text variant="caption" color={semantic.textSecondary}>
          {med.dose} · {med.frequency} · {med.duration}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.xl,
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vital: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  vitalDivider: {
    width: 1,
    height: 36,
    backgroundColor: semantic.border,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    marginLeft: spacing.sm,
  },
  sectionBody: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs / 2,
  },
  divider: {
    height: 1,
    backgroundColor: semantic.border,
  },
  labList: {
    gap: spacing.md,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  labIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labBody: {
    flex: 1,
    gap: 2,
  },
  labBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  medList: {
    gap: spacing.md,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medBody: {
    flex: 1,
    gap: 2,
  },
});
