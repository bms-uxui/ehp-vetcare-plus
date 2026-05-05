import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Card,
  Icon,
  PetAvatar,
  Screen,
  SkeletonBox,
  SkeletonShimmer,
  Text,
  WeightChart,
  useSkeletonShimmer,
} from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { visitsForPet, thDate } from '../data/visits';

type Props = NativeStackScreenProps<RootStackParamList, 'HealthRecords'>;

const monthShort = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });

export default function HealthRecordsScreen({ route, navigation }: Props) {
  const { petId } = route.params;
  const pet = mockPets.find((p) => p.id === petId);
  const visits = visitsForPet(petId);
  const shimmerStyle = useSkeletonShimmer();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (!pet) {
    return (
      <Screen>
        <Text variant="h3">ไม่พบข้อมูล</Text>
      </Screen>
    );
  }

  const weightPoints = [...visits]
    .reverse()
    .map((v) => ({ label: monthShort(v.dateISO), value: v.weightKg }));

  return (
    <Screen scroll>
      <View style={styles.header}>
        <PetAvatar
          pet={pet}
          size={72}
          backgroundColor={semantic.primaryMuted}
        />
        <View style={styles.headerText}>
          <Text variant="overline" color={semantic.primary}>ประวัติสุขภาพ</Text>
          <Text variant="h2">{pet.name}</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            {visits.length} การเข้ารับบริการ
          </Text>
        </View>
      </View>

      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        พัฒนาการน้ำหนัก
      </Text>
      {loading ? (
        <View style={[styles.skelChart, { overflow: 'hidden' }]}>
          <SkeletonBox width="100%" height={140} radius={12} />
          <SkeletonShimmer shimmerStyle={shimmerStyle} />
        </View>
      ) : (
        <Card variant="elevated" padding="lg" style={styles.chartCard}>
          <WeightChart points={weightPoints} />
        </Card>
      )}

      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        ประวัติการเข้ารับบริการ
      </Text>

      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.skelVisit, { overflow: 'hidden' }]}>
              <View style={styles.visitRow}>
                <SkeletonBox width={44} height={44} radius={22} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonBox width={90} height={10} />
                  <SkeletonBox width="70%" height={13} />
                  <SkeletonBox width="50%" height={10} />
                </View>
              </View>
              <SkeletonShimmer shimmerStyle={shimmerStyle} />
            </View>
          ))}
        </View>
      ) : visits.length === 0 ? (
        <Card variant="elevated" padding="2xl">
          <View style={styles.empty}>
            <Icon name="ClipboardList" size={40} color={semantic.textMuted} strokeWidth={1.5} />
            <Text variant="bodyStrong">ยังไม่มีประวัติ</Text>
            <Text variant="caption" color={semantic.textSecondary} align="center">
              ประวัติการเข้ารับบริการจะปรากฎเมื่อมีการบันทึกจาก EHP VetCare
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {visits.map((v) => (
            <Card
              key={v.id}
              variant="elevated"
              padding="lg"
              onPress={() => navigation.navigate('VisitDetail', { visitId: v.id })}
            >
              <View style={styles.visitRow}>
                <View style={styles.visitIcon}>
                  <Icon name="Stethoscope" size={22} color={semantic.primary} />
                </View>
                <View style={styles.visitBody}>
                  <Text variant="caption" color={semantic.primary}>
                    {thDate(v.dateISO)}
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={1}>{v.diagnosis}</Text>
                  <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                    {v.vetName} · {v.weightKg} กก.
                  </Text>
                </View>
                <Icon name="ChevronRight" size={18} color={semantic.textMuted} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  chartCard: {
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  visitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitBody: {
    flex: 1,
    gap: 2,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  skelChart: {
    backgroundColor: semantic.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  skelVisit: {
    backgroundColor: semantic.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
