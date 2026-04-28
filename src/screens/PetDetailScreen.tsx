import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, PetAvatar, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockPets, petAgeString } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'PetDetail'>;

const thDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function PetDetailScreen({ route, navigation }: Props) {
  const { petId } = route.params;
  const pet = mockPets.find((p) => p.id === petId);

  if (!pet) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบข้อมูลสัตว์เลี้ยง</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <PetAvatar
          pet={pet}
          size={140}
          backgroundColor={semantic.primaryMuted}
          style={styles.avatar}
        />
        <Text variant="display" align="center" style={styles.name}>
          {pet.name}
        </Text>
        <Text variant="body" color={semantic.textSecondary} align="center">
          {pet.speciesLabel} · {pet.breed}
        </Text>
      </View>

      <Card variant="elevated" padding="lg" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <StatTile label="อายุ" value={petAgeString(pet.birthDate)} />
          <Divider />
          <StatTile label="น้ำหนัก" value={`${pet.weightKg}`} unit="กก." />
          <Divider />
          <StatTile label="เพศ" value={pet.gender === 'male' ? 'ชาย' : 'หญิง'} />
        </View>
      </Card>

      <Section title="ข้อมูลทั่วไป">
        <InfoRow label="วันเกิด" value={thDate(pet.birthDate)} />
        <InfoRow label="สี" value={pet.color} />
        {pet.microchipId && <InfoRow label="ไมโครชิพ" value={pet.microchipId} />}
        <InfoRow
          label="ทำหมัน"
          value={
            pet.neutered
              ? `แล้ว · ${pet.neuteredDate ? thDate(pet.neuteredDate) : ''}`
              : 'ยังไม่ได้ทำ'
          }
        />
      </Section>

      <Section title="ประวัติวัคซีน" count={pet.vaccines.length}>
        {pet.vaccines.length === 0 ? (
          <Text variant="caption" color={semantic.textMuted}>
            ยังไม่มีข้อมูลวัคซีน
          </Text>
        ) : (
          pet.vaccines.map((v) => (
            <View key={v.id} style={styles.vaccineRow}>
              <View style={styles.vaccineDot} />
              <View style={styles.vaccineBody}>
                <Text variant="bodyStrong">{v.name}</Text>
                <Text variant="caption" color={semantic.textSecondary}>
                  ฉีดเมื่อ {thDate(v.date)}
                </Text>
                {v.nextDue && (
                  <Text variant="caption" color={semantic.primary}>
                    ครั้งถัดไป {thDate(v.nextDue)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="โรคประจำตัว" count={pet.conditions.length}>
        {pet.conditions.length === 0 ? (
          <Text variant="caption" color={semantic.textMuted}>
            ไม่มีโรคประจำตัว
          </Text>
        ) : (
          pet.conditions.map((c) => (
            <View key={c.id} style={styles.conditionRow}>
              <Text variant="bodyStrong">{c.name}</Text>
              <Text variant="caption" color={semantic.textSecondary}>
                ตั้งแต่ {thDate(c.since)}
              </Text>
              {c.notes && (
                <Text variant="caption" color={semantic.textMuted}>
                  {c.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </Section>

      <View style={styles.actions}>
        <Button
          label="ดูประวัติสุขภาพ"
          onPress={() => navigation.navigate('HealthRecords', { petId: pet.id })}
        />
        <Button label="แก้ไขข้อมูล" variant="secondary" uppercase={false} onPress={() => {}} />
      </View>
    </Screen>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="overline" color={semantic.textSecondary}>{title}</Text>
        {count !== undefined && (
          <View style={styles.badge}>
            <Text variant="caption" color={semantic.primary}>{count}</Text>
          </View>
        )}
      </View>
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

function StatTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statTile}>
      <Text variant="overline" color={semantic.textMuted}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text variant="h2">{value}</Text>
        {unit && <Text variant="caption" color={semantic.textSecondary}>{unit}</Text>}
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.statDivider} />;
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  avatar: {
    marginBottom: spacing.md,
  },
  name: {
    marginTop: spacing.xs,
  },
  statsCard: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: semantic.border,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: semantic.primaryMuted,
  },
  sectionBody: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaccineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  vaccineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: semantic.primary,
    marginTop: 6,
  },
  vaccineBody: {
    flex: 1,
    gap: 2,
  },
  conditionRow: {
    gap: 2,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
