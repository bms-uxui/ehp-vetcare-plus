import { Linking, Pressable, StyleSheet, View } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

/** มีผลบังคับใช้ฉบับล่าสุด */
const EFFECTIVE_LABEL = 'ฉบับปรับปรุง 1/2567 · มีผลตั้งแต่ 1 มกราคม 2567';

type Section = {
  no: string;
  icon: string;
  title: string;
  /** ย่อหน้า (string) หรือรายการหัวข้อย่อย (string[]) */
  blocks: (string | string[])[];
};

const SECTIONS: Section[] = [
  {
    no: '1',
    icon: 'FileCheck',
    title: 'การยอมรับเงื่อนไข',
    blocks: [
      'เงื่อนไขการใช้งานนี้เป็นข้อตกลงระหว่างท่านกับบริษัท เอ็กเซลเลนท์ เฮลท์ แพลตฟอร์ม จำกัด ("บริษัท") การลงทะเบียนหรือใช้งานแอปพลิเคชัน Pawmely ถือว่าท่านได้อ่าน เข้าใจ และยอมรับเงื่อนไขทั้งหมดแล้ว',
      'หากท่านไม่ยอมรับเงื่อนไขข้อใดข้อหนึ่ง โปรดงดใช้บริการ',
    ],
  },
  {
    no: '2',
    icon: 'UserCheck',
    title: 'คุณสมบัติผู้ใช้งาน',
    blocks: [
      'ท่านต้องมีอายุครบ 20 ปีบริบูรณ์ หรือได้รับความยินยอมจากผู้แทนโดยชอบธรรม และให้ข้อมูลที่ถูกต้องครบถ้วนเป็นความจริงในการลงทะเบียน',
    ],
  },
  {
    no: '3',
    icon: 'Lock',
    title: 'บัญชีผู้ใช้และความปลอดภัย',
    blocks: [
      'ท่านมีหน้าที่รักษารหัสผ่านและข้อมูลบัญชีเป็นความลับ และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน',
      'หากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต โปรดแจ้งบริษัททันที',
    ],
  },
  {
    no: '4',
    icon: 'Stethoscope',
    title: 'บริการนัดหมายและปรึกษาออนไลน์',
    blocks: [
      'บริการนัดหมายและปรึกษาสัตวแพทย์ออนไลน์ (TeleVet) มีไว้เพื่อให้คำแนะนำเบื้องต้นเท่านั้น',
      [
        'ข้อมูลและคำแนะนำไม่ทดแทนการตรวจวินิจฉัยหรือรักษา ณ สถานพยาบาลจริง',
        'กรณีฉุกเฉินหรืออาการรุนแรง โปรดพาสัตว์เลี้ยงไปพบสัตวแพทย์ทันที',
        'การจอง เลื่อน หรือยกเลิกนัด ควรดำเนินการล่วงหน้าตามที่ระบุในแอป',
      ],
    ],
  },
  {
    no: '5',
    icon: 'ShoppingBag',
    title: 'การสั่งซื้อ ชำระเงิน และจัดส่ง',
    blocks: [
      'ราคาสินค้าและบริการเป็นไปตามที่แสดงในแอป ณ เวลาที่สั่งซื้อ บริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงราคาและยกเลิกคำสั่งซื้อที่ผิดพลาด',
      'การคืนสินค้าและคืนเงินเป็นไปตามนโยบายที่ระบุไว้ โดยทั่วไปขอคืนได้ภายใน 7 วันหลังได้รับสินค้า',
    ],
  },
  {
    no: '6',
    icon: 'Ban',
    title: 'ข้อห้ามในการใช้งาน',
    blocks: [
      'ท่านตกลงว่าจะไม่ดำเนินการดังต่อไปนี้',
      [
        'ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือละเมิดสิทธิผู้อื่น',
        'ให้ข้อมูลเท็จ แอบอ้างเป็นบุคคลอื่น หรือใช้บัญชีผู้อื่น',
        'รบกวน เจาะระบบ หรือทำให้ระบบเสียหาย',
        'คัดลอก ดัดแปลง หรือเผยแพร่เนื้อหาของแอปโดยไม่ได้รับอนุญาต',
      ],
    ],
  },
  {
    no: '7',
    icon: 'Copyright',
    title: 'ทรัพย์สินทางปัญญา',
    blocks: [
      'เนื้อหา โลโก้ ชื่อทางการค้า ซอฟต์แวร์ และส่วนประกอบทั้งหมดของแอปเป็นทรัพย์สินทางปัญญาของบริษัทหรือผู้ให้สิทธิ ห้ามนำไปใช้โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร',
    ],
  },
  {
    no: '8',
    icon: 'ShieldAlert',
    title: 'ข้อจำกัดความรับผิด',
    blocks: [
      'บริษัทให้บริการตามสภาพที่เป็นอยู่ ("as is") และไม่รับประกันว่าบริการจะปราศจากข้อผิดพลาดหรือหยุดชะงัก',
      'บริษัทไม่รับผิดต่อความเสียหายที่เกิดจากการใช้หรือไม่สามารถใช้บริการ เว้นแต่เป็นความเสียหายที่เกิดจากความจงใจหรือประมาทเลินเล่ออย่างร้ายแรงของบริษัท',
    ],
  },
  {
    no: '9',
    icon: 'UserX',
    title: 'การระงับและยกเลิกบัญชี',
    blocks: [
      'บริษัทขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของท่าน หากพบการละเมิดเงื่อนไขการใช้งานหรือการกระทำที่อาจก่อให้เกิดความเสียหาย',
    ],
  },
  {
    no: '10',
    icon: 'RefreshCw',
    title: 'การเปลี่ยนแปลงเงื่อนไข',
    blocks: [
      'บริษัทอาจแก้ไขเปลี่ยนแปลงเงื่อนไขนี้เป็นครั้งคราว โดยจะประกาศในแอปหรือเว็บไซต์ การใช้บริการต่อไปหลังการเปลี่ยนแปลงถือว่าท่านยอมรับเงื่อนไขฉบับใหม่',
    ],
  },
  {
    no: '11',
    icon: 'Scale',
    title: 'กฎหมายที่ใช้บังคับ',
    blocks: [
      'เงื่อนไขนี้อยู่ภายใต้บังคับและตีความตามกฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทใด ๆ ให้อยู่ในเขตอำนาจของศาลไทย',
    ],
  },
];

export default function TermsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <View style={styles.root}>
      <AppBackground />

      <SubPageHeader
        title="เงื่อนไขการใช้งาน"
        onBack={() => navigation.goBack()}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="FileText" size={30} color={semantic.primary} strokeWidth={2.2} />
          </View>
          <Text
            variant="caption"
            color={semantic.textSecondary}
            align="center"
            style={styles.heroSub}
          >
            {EFFECTIVE_LABEL}
          </Text>
        </View>

        <Text variant="body" color={semantic.textSecondary} style={styles.intro}>
          โปรดอ่านเงื่อนไขการใช้งานแอปพลิเคชัน Pawmely อย่างละเอียด การใช้บริการของท่าน
          ถือว่าท่านยอมรับเงื่อนไขทั้งหมดที่ระบุไว้นี้
        </Text>

        {SECTIONS.map((s) => (
          <Card key={s.no} variant="elevated" style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Icon name={s.icon as never} size={18} color={semantic.primary} strokeWidth={2.2} />
              </View>
              <Text variant="bodyStrong" style={styles.sectionTitle}>
                {s.no}. {s.title}
              </Text>
            </View>
            {s.blocks.map((block, i) =>
              Array.isArray(block) ? (
                <View key={i} style={styles.bullets}>
                  {block.map((item, j) => (
                    <View key={j} style={styles.bulletRow}>
                      <View style={styles.dot} />
                      <Text
                        variant="caption"
                        color={semantic.textSecondary}
                        style={styles.bulletText}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  key={i}
                  variant="caption"
                  color={semantic.textSecondary}
                  style={styles.paragraph}
                >
                  {block}
                </Text>
              ),
            )}
          </Card>
        ))}

        {/* Contact */}
        <Card variant="filled" style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Icon name="Mail" size={18} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <Text variant="bodyStrong" style={styles.sectionTitle}>
              ติดต่อสอบถาม
            </Text>
          </View>
          <Text variant="caption" color={semantic.textSecondary} style={styles.paragraph}>
            หากมีข้อสงสัยเกี่ยวกับเงื่อนไขการใช้งาน โปรดติดต่อบริษัท
          </Text>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@ehpvetcare.com')}
            style={styles.contactRow}
            hitSlop={6}
          >
            <Icon name="Mail" size={14} color={semantic.primary} strokeWidth={2.2} />
            <Text variant="caption" color={semantic.primary}>support@ehpvetcare.com</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('tel:022577000')}
            style={styles.contactRow}
            hitSlop={6}
          >
            <Icon name="Phone" size={14} color={semantic.primary} strokeWidth={2.2} />
            <Text variant="caption" color={semantic.primary}>0 2257 7000</Text>
          </Pressable>
        </Card>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.background },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSub: { paddingHorizontal: spacing.lg },
  intro: {
    marginBottom: spacing.xs,
  },
  card: {
    marginTop: spacing.xs,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 15 },
  paragraph: { marginTop: 2 },
  bullets: { gap: spacing.xs, marginTop: spacing.xs },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: semantic.primary,
    marginTop: 7,
  },
  bulletText: { flex: 1 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
