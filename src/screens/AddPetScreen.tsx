import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../App';
import { Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPet'>;

type PathOption = {
  key: 'scan' | 'manual';
  title: string;
  subtitle: string;
  badge: string;
  icon: 'Camera' | 'Sparkles';
  route: keyof RootStackParamList;
  recommended?: boolean;
};

const OPTIONS: PathOption[] = [
  {
    key: 'scan',
    title: 'ถ่ายรูปบัตรประจำตัวน้อง',
    subtitle:
      'แค่เล็งกล้องไปที่บัตรสัตว์เลี้ยง หรือสมุดนัดใบเดิม ระบบจะช่วยกรอกข้อมูลให้ทันที สะดวกสุดๆ เลย!',
    badge: 'เร็วและง่ายที่สุด',
    icon: 'Camera',
    route: 'AddPetScan',
    recommended: true,
  },
  {
    key: 'manual',
    title: 'ค่อยๆ กรอกข้อมูลเอง',
    subtitle:
      'สำหรับน้องตัวใหม่ที่ยังไม่มีประวัติ มาสร้างโปรไฟล์น่ารักๆ และอัปโหลดรูปสวยๆ ของน้องด้วยตัวเองกันครับ',
    badge: 'ทำเองได้สบายๆ',
    icon: 'Sparkles',
    route: 'AddPetManual',
  },
];

export default function AddPetScreen({ navigation }: Props) {
  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>
        เริ่มต้นด้วยน้องคนไหนดีครับ?
      </Text>
      <Text variant="body" color={semantic.textSecondary} style={styles.subtitle}>
        เลือกวิธีที่สะดวกที่สุด แล้วเรามาทำความรู้จักน้องไปด้วยกันนะ
      </Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <Card
            key={opt.key}
            variant="elevated"
            padding="xl"
            onPress={() => {
              // TODO: trigger Haptics.selectionAsync() when expo-haptics is wired
              navigation.navigate(opt.route as any);
            }}
          >
            <View style={styles.cardBody}>
              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={['#EFA5B8', '#DA8AA1', '#C87390']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Icon name={opt.icon} size={36} color={semantic.onPrimary} strokeWidth={2.2} />
              </View>

              <View style={styles.titleRow}>
                <Text variant="h3" style={{ fontSize: 18 }}>
                  {opt.title}
                </Text>
                {opt.recommended && (
                  <View style={styles.recommendBadge}>
                    <Text variant="caption" color={semantic.onPrimary} style={{ fontSize: 10 }} weight="700">
                      แนะนำ
                    </Text>
                  </View>
                )}
              </View>

              <Text variant="body" color={semantic.textSecondary} style={styles.subtitleLine}>
                {opt.subtitle}
              </Text>

              <Text variant="caption" color={semantic.primary} weight="600" style={styles.badge}>
                {opt.badge}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl },
  list: { gap: spacing.lg },
  cardBody: {
    gap: spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recommendBadge: {
    backgroundColor: semantic.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  subtitleLine: { fontSize: 13, lineHeight: 19 },
  badge: { fontSize: 12, marginTop: spacing.xs },
});
