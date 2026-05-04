import { Linking, StyleSheet, View, Pressable } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

const FAQ_TOPICS = [
  {
    icon: 'CalendarPlus',
    label: 'การจองนัดหมาย',
    description: 'จองนัด เลื่อน ยกเลิก',
  },
  {
    icon: 'PawPrint',
    label: 'การจัดการสัตว์เลี้ยง',
    description: 'เพิ่ม แก้ไข หรือลบข้อมูลน้อง',
  },
  {
    icon: 'Wallet',
    label: 'ค่าใช้จ่ายและงบประมาณ',
    description: 'บันทึกและสรุปรายจ่าย',
  },
  {
    icon: 'ShoppingBag',
    label: 'การสั่งซื้อสินค้า',
    description: 'การสั่งซื้อ จัดส่ง และคืนสินค้า',
  },
  {
    icon: 'Video',
    label: 'การปรึกษาออนไลน์',
    description: 'วิดีโอคอลกับสัตวแพทย์',
  },
  {
    icon: 'Lock',
    label: 'บัญชีและความปลอดภัย',
    description: 'รหัสผ่านและการยืนยันตัวตน',
  },
];

export default function HelpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader title="ช่วยเหลือ" onBack={() => navigation.goBack()} scrollY={scrollY} />

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
        {/* FAQ topics */}
        <SectionLabel>หัวข้อที่ถามบ่อย</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          {FAQ_TOPICS.map((t, i) => (
            <View key={t.label}>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={t.label}
              >
                <View style={styles.iconWrap}>
                  <Icon name={t.icon as never} size={18} color={semantic.primary} strokeWidth={2.2} />
                </View>
                <View style={styles.rowMain}>
                  <Text variant="bodyStrong" style={styles.rowValue}>{t.label}</Text>
                  <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                    {t.description}
                  </Text>
                </View>
                <Icon name="ChevronRight" size={18} color={semantic.textMuted} />
              </Pressable>
              {i < FAQ_TOPICS.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        {/* Contact us */}
        <SectionLabel>ติดต่อเรา</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          <ActionRow
            icon="MessageCircle"
            label="แชทกับทีมงาน"
            description="ตอบกลับใน 5-10 นาที (เปิด 24 ชม.)"
            iconBg={semantic.primaryMuted}
            iconColor={semantic.primary}
          />
          <Divider />
          <ActionRow
            icon="Phone"
            label="โทรหาเรา"
            description="02-123-4567 (จ.-ส. 09:00-18:00)"
            iconBg="#E7F5E9"
            iconColor="#4FB36C"
            onPress={() => Linking.openURL('tel:021234567')}
          />
          <Divider />
          <ActionRow
            icon="Mail"
            label="ส่งอีเมล"
            description="support@ehpvetcare.com"
            iconBg="#E1ECF5"
            iconColor="#1B5A77"
            onPress={() => Linking.openURL('mailto:support@ehpvetcare.com')}
          />
          <Divider />
          <ActionRow
            icon="AlertCircle"
            label="แจ้งปัญหาหรือข้อเสนอแนะ"
            description="แจ้งบั๊กหรือไอเดียพัฒนาแอป"
            iconBg="#FFF6DD"
            iconColor="#92400E"
          />
        </Card>

        {/* About app */}
        <SectionLabel>เกี่ยวกับแอป</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          <ActionRow icon="FileText" label="เงื่อนไขการใช้งาน" />
          <Divider />
          <ActionRow icon="Shield" label="นโยบายความเป็นส่วนตัว" />
          <Divider />
          <ActionRow icon="Star" label="ให้คะแนนแอป" description="แชร์ประสบการณ์ใน App Store" />
          <Divider />
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon name="Info" size={18} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.rowMain}>
              <Text variant="bodyStrong" style={styles.rowValue}>เวอร์ชัน</Text>
            </View>
            <Text variant="caption" color={semantic.textSecondary}>
              1.0.0 (build 42)
            </Text>
          </View>
        </Card>
      </Animated.ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      variant="caption"
      color={semantic.textSecondary}
      style={styles.sectionLabel}
    >
      {children}
    </Text>
  );
}

function ActionRow({
  icon,
  label,
  description,
  iconBg,
  iconColor,
  onPress,
}: {
  icon: string;
  label: string;
  description?: string;
  iconBg?: string;
  iconColor?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, iconBg ? { backgroundColor: iconBg } : null]}>
        <Icon
          name={icon as never}
          size={18}
          color={iconColor ?? semantic.primary}
          strokeWidth={2.2}
        />
      </View>
      <View style={styles.rowMain}>
        <Text variant="bodyStrong" style={styles.rowValue}>{label}</Text>
        {description && (
          <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>
      <Icon name="ChevronRight" size={18} color={semantic.textMuted} />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 17,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowValue: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginLeft: spacing.md + 36 + spacing.md,
  },
});
