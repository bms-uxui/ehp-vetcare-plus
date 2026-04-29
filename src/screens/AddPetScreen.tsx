import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Text } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPet'>;

type PathOption = {
  key: 'scan' | 'manual';
  title: string;
  subtitle: string;
  route: keyof RootStackParamList;
  recommended?: boolean;
};

const OPTIONS: PathOption[] = [
  {
    key: 'scan',
    title: 'สแกนบัตรประจำตัวสัตว์เลี้ยง',
    subtitle: 'ถ่ายรูปบัตรเพื่อดึงข้อมูลอัตโนมัติ',
    route: 'AddPetScan',
    recommended: true,
  },
  {
    key: 'manual',
    title: 'กรอกข้อมูลเอง',
    subtitle: 'กรอกข้อมูลเอง',
    route: 'AddPetManual',
  },
];

export default function AddPetScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityLabel="ย้อนกลับ"
        >
          <Icon name="ChevronLeft" size={20} color="#1A1A1F" strokeWidth={2.4} />
        </Pressable>
        <Text variant="bodyStrong" style={styles.title}>
          เพิ่มสัตว์เลี้ยง
        </Text>
      </View>

      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => navigation.navigate(opt.route as any)}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={styles.cardImage}>
              {opt.recommended && (
                <View style={styles.recommendBadge}>
                  <Text variant="bodyStrong" style={styles.recommendText}>
                    แนะนำ
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardText}>
              <Text variant="bodyStrong" style={styles.cardTitle}>
                {opt.title}
              </Text>
              <Text variant="body" style={styles.cardSubtitle}>
                {opt.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  card: {
    height: 230,
    borderRadius: 16,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  cardImage: {
    height: 158,
    backgroundColor: '#B2B2B2',
    position: 'relative',
  },
  recommendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  recommendText: {
    fontSize: 12,
    lineHeight: 20,
    color: '#000000',
    fontWeight: '500',
  },
  cardText: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4A50',
  },
});
