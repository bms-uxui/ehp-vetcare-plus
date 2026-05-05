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
    prompt: 'อธิบายวิธีการจองนัดหมาย เลื่อนนัด และยกเลิกนัดหมายในแอปแบบละเอียดให้หน่อยค่ะ',
    reply:
      'ได้เลยค่ะ ขออธิบายทีละขั้นตอนนะคะ\n\n' +
      '📅 จองนัดหมาย\n' +
      '1. ที่หน้าหลัก กดเมนู "จองนัดหมาย" หรือไอคอน + ที่แท็บนัดหมาย\n' +
      '2. เลือกน้องที่ต้องการพาไปตรวจ\n' +
      '3. เลือกประเภทบริการ (ตรวจสุขภาพ / ฉีดวัคซีน / ฯลฯ)\n' +
      '4. เลือกวันและเวลาที่ว่าง แล้วกด "ยืนยันการจอง"\n\n' +
      '🔄 เลื่อนนัด\n' +
      'เปิดรายละเอียดนัดหมาย → กด "เลื่อนนัด" → เลือกวันเวลาใหม่ → ยืนยัน\n\n' +
      '❌ ยกเลิกนัด\n' +
      'เปิดรายละเอียดนัดหมาย → กด "ยกเลิกนัด" → ระบุเหตุผล → ยืนยัน\n\n' +
      'แนะนำให้เลื่อน/ยกเลิกล่วงหน้าอย่างน้อย 24 ชม. นะคะ 🐾',
  },
  {
    icon: 'PawPrint',
    label: 'การจัดการสัตว์เลี้ยง',
    description: 'เพิ่ม แก้ไข หรือลบข้อมูลน้อง',
    prompt: 'วิธีเพิ่ม แก้ไข และลบข้อมูลสัตว์เลี้ยงในแอปทำยังไงคะ?',
    reply:
      'ได้ค่ะ มาดูทีละส่วนเลยนะคะ 🐶🐱\n\n' +
      '➕ เพิ่มน้องใหม่\n' +
      '1. ไปแท็บ "สัตว์เลี้ยง" หรือกด + ที่หน้าหลัก\n' +
      '2. เลือก "เพิ่มสัตว์เลี้ยง"\n' +
      '3. กรอกชื่อ ชนิด สายพันธุ์ เพศ วันเกิด และอัปโหลดรูป\n' +
      '4. กดบันทึก\n\n' +
      '✏️ แก้ไขข้อมูล\n' +
      'เลือกน้องที่ต้องการ → กดไอคอนแก้ไข (ปากกา) → ปรับข้อมูล → บันทึก\n\n' +
      '🗑️ ลบข้อมูล\n' +
      'หน้าโปรไฟล์น้อง → เมนู (จุด 3 จุด) → "ลบข้อมูลสัตว์เลี้ยง"\n' +
      '⚠️ การลบจะลบประวัติสุขภาพและนัดหมายของน้องด้วย แนะนำให้สำรองข้อมูลก่อนนะคะ',
  },
  {
    icon: 'Wallet',
    label: 'ค่าใช้จ่ายและงบประมาณ',
    description: 'บันทึกและสรุปรายจ่าย',
    prompt: 'วิธีบันทึกค่าใช้จ่ายและตั้งงบประมาณรายเดือนทำยังไงคะ?',
    reply:
      'มาดูวิธีจัดการค่าใช้จ่ายของน้องกันค่ะ 💰\n\n' +
      '📝 บันทึกรายจ่าย\n' +
      '1. ไปเมนู "ค่าใช้จ่าย" จากหน้าหลัก\n' +
      '2. กดปุ่ม + เพื่อเพิ่มรายการ\n' +
      '3. เลือกหมวด (อาหาร / ยา / ตรวจสุขภาพ / อุปกรณ์)\n' +
      '4. ระบุจำนวนเงิน วันที่ และน้องที่เกี่ยวข้อง\n' +
      '5. แนบรูปใบเสร็จได้ (ไม่บังคับ) → บันทึก\n\n' +
      '📊 ตั้งงบประมาณ\n' +
      'หน้าค่าใช้จ่าย → "ตั้งงบประมาณ" → กำหนดวงเงินต่อเดือน\n' +
      'ระบบจะแจ้งเตือนเมื่อใกล้ถึงงบที่ตั้งไว้\n\n' +
      '📈 ดูสรุป\n' +
      'แท็บ "สรุป" จะเห็นกราฟแยกตามหมวดและรายเดือนค่ะ',
  },
  {
    icon: 'ShoppingBag',
    label: 'การสั่งซื้อสินค้า',
    description: 'การสั่งซื้อ จัดส่ง และคืนสินค้า',
    prompt: 'วิธีสั่งซื้อสินค้า ติดตามการจัดส่ง และคืนสินค้าทำยังไงคะ?',
    reply:
      'ได้ค่ะ ขั้นตอนการช็อปปิงในแอปเป็นแบบนี้ค่ะ 🛍️\n\n' +
      '🛒 สั่งซื้อสินค้า\n' +
      '1. ไปแท็บ "ร้านค้า" เลือกหมวดหรือค้นหาสินค้า\n' +
      '2. กดสินค้า → เลือกจำนวน → "เพิ่มลงตะกร้า"\n' +
      '3. เปิดตะกร้า → ตรวจสอบรายการ → กด "ชำระเงิน"\n' +
      '4. เลือกที่อยู่จัดส่งและวิธีชำระเงิน → ยืนยัน\n\n' +
      '🚚 ติดตามการจัดส่ง\n' +
      'เมนูโปรไฟล์ → "คำสั่งซื้อของฉัน" → เลือกออเดอร์ → ดูสถานะการจัดส่งและเลขพัสดุ\n\n' +
      '↩️ คืนสินค้า\n' +
      'เปิดรายละเอียดออเดอร์ → "ขอคืนสินค้า" → ระบุเหตุผลและแนบรูป\n' +
      'ขอคืนได้ภายใน 7 วันหลังรับสินค้านะคะ',
  },
  {
    icon: 'Video',
    label: 'การปรึกษาออนไลน์',
    description: 'วิดีโอคอลกับสัตวแพทย์',
    prompt: 'วิธีจองและใช้งานบริการปรึกษาออนไลน์ (วิดีโอคอลกับสัตวแพทย์) ทำยังไงคะ?',
    reply:
      'ปรึกษาคุณหมอออนไลน์สะดวกมากเลยค่ะ 📹\n\n' +
      '📅 จองคิวปรึกษา\n' +
      '1. ไปเมนู "ปรึกษาออนไลน์" หรือ "TeleVet"\n' +
      '2. เลือกสัตวแพทย์จากรายชื่อ (ดูประวัติ คะแนน รีวิวได้)\n' +
      '3. เลือกวันเวลาที่ว่าง → ระบุอาการเบื้องต้น → ยืนยันและชำระเงิน\n\n' +
      '💬 ก่อนถึงเวลานัด\n' +
      'แอปจะแจ้งเตือนล่วงหน้า 15 นาที เปิดแชทกับคุณหมอเพื่อส่งรูป/วิดีโอน้องล่วงหน้าได้\n\n' +
      '📞 เริ่มวิดีโอคอล\n' +
      'เมื่อถึงเวลา กด "เข้าร่วมการปรึกษา" ในแชท\n' +
      'แนะนำให้อยู่ในที่แสงสว่าง อินเทอร์เน็ตเสถียร และเตรียมน้องไว้ใกล้ๆ ค่ะ',
  },
  {
    icon: 'Lock',
    label: 'บัญชีและความปลอดภัย',
    description: 'รหัสผ่านและการยืนยันตัวตน',
    prompt: 'วิธีเปลี่ยนรหัสผ่านและตั้งค่าความปลอดภัยของบัญชีทำยังไงคะ?',
    reply:
      'ความปลอดภัยของบัญชีสำคัญมากเลยค่ะ 🔒\n\n' +
      '🔑 เปลี่ยนรหัสผ่าน\n' +
      '1. โปรไฟล์ → "ตั้งค่า" → "บัญชีและความปลอดภัย"\n' +
      '2. กด "เปลี่ยนรหัสผ่าน" → กรอกรหัสเดิม → ตั้งรหัสใหม่ → ยืนยัน\n' +
      'รหัสควรมีอย่างน้อย 8 ตัว ผสมตัวอักษร ตัวเลข และอักขระพิเศษ\n\n' +
      '👆 เปิดใช้ Face ID / Touch ID\n' +
      'ตั้งค่า → "ล็อกอินด้วยไบโอเมตริก" → เปิดสวิตช์\n\n' +
      '🛡️ ยืนยันตัวตน 2 ชั้น (2FA)\n' +
      'ตั้งค่า → "การยืนยันตัวตน 2 ขั้นตอน" → ผูกเบอร์มือถือหรือแอป Authenticator\n\n' +
      'หากลืมรหัสผ่าน กด "ลืมรหัสผ่าน" ที่หน้าล็อกอิน ระบบจะส่งลิงก์รีเซ็ตไปที่อีเมลค่ะ',
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
        {/* FAQ topics — tap to ask AI about that topic and get a tutorial reply */}
        <SectionLabel>หัวข้อที่ถามบ่อย</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          {FAQ_TOPICS.map((t, i) => (
            <View key={t.label}>
              <Pressable
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: 'c-ai',
                    vetId: 'tv-ai',
                    aiMode: true,
                    initialPrompt: t.prompt,
                    initialReply: t.reply,
                  })
                }
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={`ถาม AI เกี่ยวกับ ${t.label}`}
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
