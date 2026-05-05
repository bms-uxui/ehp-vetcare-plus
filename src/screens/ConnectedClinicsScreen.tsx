import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Card, Icon, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectedClinics'>;

type Clinic = {
  id: string;
  name: string;
  branch: string;
  address: string;
  phone: string;
  status: 'active' | 'pending';
  joinedISO: string;
  isPrimary?: boolean;
};

const MOCK_CLINICS: Clinic[] = [
  {
    id: 'c1',
    name: 'EHP VetCare',
    branch: 'สาขาสุขุมวิท',
    address: '12/3 ถ.สุขุมวิท ซอย 21, กรุงเทพฯ',
    phone: '02-123-4567',
    status: 'active',
    joinedISO: '2024-08-15',
    isPrimary: true,
  },
  {
    id: 'c2',
    name: 'EHP VetCare',
    branch: 'สาขาทองหล่อ',
    address: '88/9 ถ.ทองหล่อ ซอย 13, กรุงเทพฯ',
    phone: '02-987-6543',
    status: 'active',
    joinedISO: '2025-02-03',
  },
  {
    id: 'c3',
    name: 'Pet Pawradise Clinic',
    branch: 'สาขาอารีย์',
    address: '45 ถ.พหลโยธิน อารีย์, กรุงเทพฯ',
    phone: '02-555-1212',
    status: 'pending',
    joinedISO: '2026-04-12',
  },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function ConnectedClinicsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader
        title="คลินิกที่เชื่อมต่อ"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + HEADER_HEIGHT + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Text variant="caption" color={semantic.textSecondary} style={styles.intro}>
          คลินิกที่เชื่อมต่อจะแชร์ประวัติการรักษาและข้อมูลสัตว์เลี้ยงของคุณโดยอัตโนมัติ
        </Text>

        <View style={styles.list}>
          {MOCK_CLINICS.map((c) => (
            <Card key={c.id} variant="elevated" padding="md" style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.iconWrap}>
                  <Icon name="Hospital" size={22} color={semantic.primary} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text variant="bodyStrong" style={styles.title} numberOfLines={1}>
                      {c.name}
                    </Text>
                    {c.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text variant="caption" style={styles.primaryText}>หลัก</Text>
                      </View>
                    )}
                  </View>
                  <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                    {c.branch}
                  </Text>
                </View>
                <StatusPill status={c.status} />
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Icon name="MapPin" size={13} color={semantic.textMuted} strokeWidth={2} />
                <Text variant="caption" color={semantic.textSecondary} style={styles.infoText} numberOfLines={2}>
                  {c.address}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="Phone" size={13} color={semantic.textMuted} strokeWidth={2} />
                <Text variant="caption" color={semantic.textSecondary}>
                  {c.phone}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="Link2" size={13} color={semantic.textMuted} strokeWidth={2} />
                <Text variant="caption" color={semantic.textSecondary}>
                  เชื่อมต่อเมื่อ {fmtDate(c.joinedISO)}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="เพิ่มคลินิก"
        >
          <Icon name="Plus" size={18} color={semantic.primary} strokeWidth={2.4} />
          <Text variant="bodyStrong" color={semantic.primary} style={styles.addBtnText}>
            เพิ่มคลินิกที่เชื่อมต่อ
          </Text>
        </Pressable>
      </Animated.ScrollView>
    </View>
  );
}

function StatusPill({ status }: { status: 'active' | 'pending' }) {
  const map = {
    active: { label: 'ใช้งานอยู่', bg: '#E7F5E9', fg: '#4FB36C' },
    pending: { label: 'รอยืนยัน', bg: '#FFF6DD', fg: '#92400E' },
  } as const;
  const s = map[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text variant="caption" style={[styles.statusText, { color: s.fg }]}>
        {s.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  intro: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    flexShrink: 1,
  },
  primaryBadge: {
    backgroundColor: semantic.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  primaryText: {
    fontSize: 10,
    color: semantic.primary,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  infoText: {
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: semantic.borderStrong,
    marginTop: spacing.lg,
  },
  addBtnText: {
    fontSize: 14,
  },
});
