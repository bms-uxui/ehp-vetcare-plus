import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Button, Card, ConfirmModal, Icon, SubPageHeader, Text } from '../components';
import { HEADER_HEIGHT } from '../components/SubPageHeader';
import { colors, radii, semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyConsent'>;

/** Effective date — ประกาศที่ 1/2567 มีผล 1 มกราคม 2567 */
const EFFECTIVE_LABEL = 'ประกาศที่ 1/2567 · มีผลตั้งแต่ 1 มกราคม 2567';

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
    icon: 'Database',
    title: 'ข้อมูลที่บริษัทเก็บรวบรวม',
    blocks: [
      'บริษัทเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน ซึ่งรวมถึงแต่ไม่จำกัดเพียง',
      [
        'ชื่อ–นามสกุล วันเดือนปีเกิด อายุ และรูปถ่าย',
        'ที่อยู่ ทะเบียนบ้าน บัตรประชาชน หรือหนังสือเดินทาง',
        'หมายเลขโทรศัพท์ อีเมล และบัญชีผู้ใช้สื่อสังคมออนไลน์',
        'ข้อมูลการชำระเงิน เช่น บัตรเครดิต/เดบิต และบัญชีธนาคาร',
        'อาชีพ สถานที่ทำงาน และเลขประจำตัวผู้เสียภาษี',
        'ข้อมูลจราจรคอมพิวเตอร์ (IP Address, คุกกี้) และตำแหน่งที่ตั้ง',
      ],
      'ข้อมูลอ่อนไหว (มาตรา 26): บริษัทอาจเก็บข้อมูลสุขภาพ ความพิการ ข้อมูลชีวภาพ พันธุกรรม เชื้อชาติ ศาสนา ฯลฯ ด้วยความระมัดระวังตามขอบเขตที่กฎหมายกำหนด และจะแจ้งให้ทราบก่อนหรือขณะเก็บรวบรวม',
    ],
  },
  {
    no: '2',
    icon: 'Target',
    title: 'วัตถุประสงค์ในการใช้ข้อมูล',
    blocks: [
      'บริษัทประมวลผลข้อมูลของท่านเพื่อวัตถุประสงค์ดังนี้',
      [
        'ระบุและยืนยันตัวตน ลงทะเบียน และให้บริการแก่ท่าน',
        'ซื้อขายสินค้า/บริการ ออกใบแจ้งหนี้ รับชำระเงินและคืนเงิน',
        'พัฒนาและปรับปรุงสินค้า บริการ และประสบการณ์ใช้งาน',
        'ดูแลลูกค้า ตอบข้อสงสัย และจัดการข้อร้องเรียน',
        'การตลาดและประชาสัมพันธ์ (ท่านเลือกไม่รับได้)',
        'ป้องกันอันตรายต่อชีวิต ร่างกาย สุขภาพ และปฏิบัติตามกฎหมาย',
      ],
    ],
  },
  {
    no: '3',
    icon: 'Share2',
    title: 'ผู้รับข้อมูลของท่าน',
    blocks: [
      'บริษัทจำกัดการเข้าถึงข้อมูลเฉพาะผู้ที่จำเป็น ได้แก่ พนักงานและบุคลากรของบริษัทในเครือ พันธมิตรทางธุรกิจ และผู้ให้บริการภายนอกที่มีสัญญารักษาความลับ',
      'บริษัทอาจเปิดเผยข้อมูลแก่หน่วยงานราชการหรือหน่วยงานกำกับดูแลตามที่กฎหมายกำหนด',
    ],
  },
  {
    no: '4',
    icon: 'Globe',
    title: 'การโอนข้อมูลไปต่างประเทศ',
    blocks: [
      'บริษัทอาจโอนข้อมูลของท่านไปยังต่างประเทศเท่าที่จำเป็นเพื่อดำเนินกิจการ โดยจะจัดให้มีมาตรการคุ้มครองความปลอดภัยในระดับเดียวกับกฎหมายคุ้มครองข้อมูลส่วนบุคคลของประเทศไทย',
    ],
  },
  {
    no: '5',
    icon: 'ShieldCheck',
    title: 'การรักษาความปลอดภัยและระยะเวลาเก็บ',
    blocks: [
      'บริษัทมีมาตรการรักษาความมั่นคงปลอดภัยทั้งทางกายภาพและอิเล็กทรอนิกส์ตามมาตรฐานสากล เพื่อป้องกันการเข้าถึง รั่วไหล หรือเปลี่ยนแปลงข้อมูลโดยมิชอบ',
      'บริษัทเก็บรักษาข้อมูลเท่าที่จำเป็นและภายใต้กรอบระยะเวลาที่กฎหมายกำหนด',
    ],
  },
  {
    no: '6',
    icon: 'UserCheck',
    title: 'สิทธิของเจ้าของข้อมูล',
    blocks: [
      'ท่านมีสิทธิตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล ได้แก่',
      [
        'สิทธิเข้าถึงและขอสำเนาข้อมูล',
        'สิทธิขอแก้ไขให้ถูกต้องเป็นปัจจุบัน',
        'สิทธิคัดค้านหรือจำกัดการประมวลผล',
        'สิทธิขอให้ลบหรือทำลายข้อมูล',
        'สิทธิขอให้โอนย้ายข้อมูล และสิทธิร้องเรียนต่อหน่วยงานกำกับดูแล',
      ],
      'การถอนความยินยอมหรือใช้สิทธิดังกล่าว อาจทำให้บริษัทไม่สามารถให้บริการบางส่วนแก่ท่านได้ และต้องเป็นไปตามหลักเกณฑ์ที่บริษัทกำหนด',
    ],
  },
  {
    no: '7',
    icon: 'Baby',
    title: 'กรณีผู้เยาว์',
    blocks: [
      'หากท่านอายุไม่ถึง 20 ปีบริบูรณ์ ท่านยืนยันว่ามีอายุเกิน 15 ปีและทำนิติกรรมที่สมแก่ฐานะได้ หรือกรณีอายุไม่เกิน 15 ปี ได้รับความยินยอมจากผู้แทนโดยชอบธรรมแล้ว',
    ],
  },
];

export default function PrivacyConsentScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const isView = route.params?.mode === 'view';
  const [agreed, setAgreed] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      const reachedEnd =
        e.contentOffset.y + e.layoutMeasurement.height >=
        e.contentSize.height - 48;
      if (reachedEnd) {
        runOnJS(setScrolledToEnd)(true);
      }
    },
  });

  const canAccept = agreed && scrolledToEnd;

  const onAccept = () => {
    if (!canAccept) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    navigation.replace('Login');
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      {isView && (
        <SubPageHeader
          title="นโยบายความเป็นส่วนตัว"
          onBack={() => navigation.goBack()}
          scrollY={scrollY}
        />
      )}

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: isView
              ? insets.top + HEADER_HEIGHT + spacing.md
              : insets.top + spacing.xl,
            paddingBottom: isView ? insets.bottom + spacing.xl : spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero header — scrolls with content */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="ShieldCheck" size={30} color={semantic.primary} strokeWidth={2.2} />
          </View>
          {!isView && (
            <Text variant="h2" align="center" style={styles.heroTitle}>
              นโยบายความเป็นส่วนตัว
            </Text>
          )}
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
          บริษัท เอ็กเซลเลนท์ เฮลท์ แพลตฟอร์ม จำกัด มุ่งมั่นคุ้มครองข้อมูลส่วนบุคคลของท่าน
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 โปรดอ่านสาระสำคัญของนโยบายฉบับนี้
          ก่อนให้ความยินยอม
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

        {/* DPO contact */}
        <Card variant="filled" style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Icon name="Phone" size={18} color={semantic.primary} strokeWidth={2.2} />
            </View>
            <Text variant="bodyStrong" style={styles.sectionTitle}>
              ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)
            </Text>
          </View>
          <Text variant="caption" color={semantic.textSecondary} style={styles.paragraph}>
            บริษัท เอ็กเซลเลนท์ เฮลท์ แพลตฟอร์ม จำกัด{'\n'}
            1768 อาคารไทยซัมมิท ทาวเวอร์ ชั้น 16 ถ.เพชรบุรีตัดใหม่{'\n'}
            แขวงบางกะปิ เขตห้วยขวาง กรุงเทพฯ 10310
          </Text>
          <Pressable
            onPress={() => Linking.openURL('tel:022577000')}
            style={styles.contactRow}
            hitSlop={6}
          >
            <Icon name="Phone" size={14} color={semantic.primary} strokeWidth={2.2} />
            <Text variant="caption" color={semantic.primary}>0 2257 7000</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('mailto:info@ehp.co.th')}
            style={styles.contactRow}
            hitSlop={6}
          >
            <Icon name="Mail" size={14} color={semantic.primary} strokeWidth={2.2} />
            <Text variant="caption" color={semantic.primary}>info@ehp.co.th</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('https://www.ehp.co.th')}
            style={styles.contactRow}
            hitSlop={6}
          >
            <Icon name="Globe" size={14} color={semantic.primary} strokeWidth={2.2} />
            <Text variant="caption" color={semantic.primary}>www.ehp.co.th</Text>
          </Pressable>
        </Card>

        {!isView && !scrolledToEnd && (
          <View style={styles.scrollHint}>
            <Icon name="ChevronsDown" size={16} color={semantic.textMuted} strokeWidth={2.2} />
            <Text variant="caption" color={semantic.textMuted}>
              เลื่อนอ่านจนสุดเพื่อดำเนินการต่อ
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Sticky footer — consent gate only */}
      {!isView && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            style={styles.checkRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
              {agreed && <Icon name="Check" size={14} color={semantic.onPrimary} strokeWidth={3} />}
            </View>
            <Text variant="caption" style={styles.checkLabel}>
              ข้าพเจ้าได้อ่านและยอมรับนโยบายการคุ้มครองข้อมูลส่วนบุคคลฉบับนี้
              และยินยอมให้บริษัทเก็บรวบรวม ใช้ และเปิดเผยข้อมูลตามที่ระบุไว้
            </Text>
          </Pressable>

          <Button
            label="ยอมรับและดำเนินการต่อ"
            onPress={onAccept}
            disabled={!canAccept}
          />
          <Button
            label="ไม่ยอมรับ"
            variant="ghost"
            size="sm"
            onPress={() => setDeclineOpen(true)}
          />
        </View>
      )}

      <ConfirmModal
        visible={declineOpen}
        icon="ShieldAlert"
        tone="danger"
        title="ไม่ยอมรับนโยบาย?"
        message="ท่านจำเป็นต้องยอมรับนโยบายความเป็นส่วนตัวก่อน จึงจะสามารถเข้าสู่ระบบและใช้งานแอปพลิเคชันได้"
        cancelLabel="กลับไปอ่าน"
        confirmLabel="เข้าใจแล้ว"
        confirmTone="primary"
        onCancel={() => setDeclineOpen(false)}
        onConfirm={() => setDeclineOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.background },
  flex: { flex: 1 },
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
  heroTitle: { marginTop: spacing.xs },
  heroSub: { paddingHorizontal: spacing.lg },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
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
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: semantic.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: semantic.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: semantic.primary,
    borderColor: semantic.primary,
  },
  checkLabel: { flex: 1, color: colors.neutral[600] },
});
