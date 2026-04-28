import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card, Icon, PetAvatar, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
import { mockRecommendations, recTypeMeta } from '../data/smart';
import { mockPets } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'SmartFeatures'>;

const FEATURES: { key: string; icon: string; title: string; subtitle: string; accent: string; color: string }[] = [
  { key: 'symptom', icon: 'Stethoscope', title: 'ตรวจอาการเบื้องต้น', subtitle: 'วิเคราะห์อาการด้วย AI', accent: '#F5E4E7', color: '#B86A7C' },
  { key: 'recs', icon: 'Sparkles', title: 'คำแนะนำเฉพาะตัว', subtitle: 'อาหาร กิจกรรม สุขภาพ', accent: '#FFF6D9', color: '#D99A20' },
  { key: 'face', icon: 'Camera', title: 'จดจำใบหน้าสัตว์เลี้ยง', subtitle: 'ยืนยันตัวตนด้วยกล้อง', accent: '#E0F0FB', color: '#4A8FD1' },
];

export default function SmartFeaturesScreen({ navigation }: Props) {
  const onFace = () => {
    Alert.alert(
      'จดจำใบหน้าสัตว์เลี้ยง',
      'เปิดกล้องเพื่อสแกนใบหน้าสัตว์เลี้ยง\n(ในเวอร์ชันนี้ยังเป็นตัวอย่าง UI)',
      [{ text: 'ตกลง' }],
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <Icon name="Sparkles" size={14} color={semantic.primary} />
          <Text variant="overline" color={semantic.primary}>AI ผู้ช่วย</Text>
        </View>
        <Text variant="h1">ผู้ช่วยอัจฉริยะ</Text>
        <Text variant="body" color={semantic.textSecondary}>
          ใช้ AI ช่วยดูแลเพื่อนตัวน้อยของคุณ
        </Text>
      </View>

      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <Card
            key={f.key}
            variant="elevated"
            padding="lg"
            onPress={() => {
              if (f.key === 'symptom') navigation.navigate('SymptomCheck');
              else if (f.key === 'face') onFace();
            }}
            style={styles.featureTile}
          >
            <View style={[styles.featureIcon, { backgroundColor: f.accent }]}>
              <Icon name={f.icon as any} size={28} color={f.color} />
            </View>
            <Text variant="bodyStrong">{f.title}</Text>
            <Text variant="caption" color={semantic.textSecondary}>{f.subtitle}</Text>
          </Card>
        ))}
      </View>

      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        คำแนะนำสำหรับสัตว์เลี้ยงของคุณ
      </Text>

      <View style={styles.list}>
        {mockPets.map((pet) => {
          const recs = mockRecommendations.filter((r) => r.petId === pet.id);
          if (recs.length === 0) return null;
          return (
            <Card key={pet.id} variant="elevated" padding="lg">
              <View style={styles.petHeader}>
                <PetAvatar
                  pet={pet}
                  size={56}
                  backgroundColor={semantic.primaryMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{pet.name}</Text>
                  <Text variant="caption" color={semantic.textSecondary}>
                    {pet.speciesLabel} · {pet.breed}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text variant="caption" color={semantic.primary} weight="600">
                    {recs.length} รายการ
                  </Text>
                </View>
              </View>

              <View style={styles.recList}>
                {recs.map((r) => {
                  const m = recTypeMeta[r.type];
                  return (
                    <View key={r.id} style={styles.recRow}>
                      <View style={[styles.recIcon, { backgroundColor: m.bg }]}>
                        <Icon name={r.icon as any} size={18} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.recTopRow}>
                          <Text variant="caption" color={m.color} weight="600">
                            {m.label}
                          </Text>
                        </View>
                        <Text variant="bodyStrong">{r.title}</Text>
                        <Text variant="caption" color={semantic.textSecondary}>
                          {r.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </View>

      <View style={styles.disclaimer}>
        <Text variant="caption" color={semantic.textMuted} align="center">
          ⚠️ คำแนะนำจาก AI เป็นเพียงข้อมูลเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: semantic.primaryMuted,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureTile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: semantic.primaryMuted,
  },
  recList: {
    gap: spacing.md,
  },
  recRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTopRow: {
    marginBottom: 2,
  },
  disclaimer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
});
