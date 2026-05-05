import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SHEET_HIDDEN = 800;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, CalendarSheet, Card, Icon, SubPageHeader, Text } from '../components';
import { semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileInfo'>;

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const fmtThaiDate = (d: Date) =>
  `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;

const GENDER_OPTIONS = [
  { value: 'male', label: 'ชาย' },
  { value: 'female', label: 'หญิง' },
  { value: 'other', label: 'อื่น ๆ' },
] as const;

type EditingField = 'fullName' | 'username' | 'address' | null;

export default function ProfileInfoScreen({ navigation }: Props) {
  // Editable state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('โจ ทดสอบ');
  const [username, setUsername] = useState('@joe_test');
  const [dob, setDob] = useState<Date>(new Date(1995, 2, 15));
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [address, setAddress] = useState(
    '123 ถ.สุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  );

  // Edit modals state
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editingValue, setEditingValue] = useState('');
  const [dobPickerOpen, setDobPickerOpen] = useState(false);
  const [genderSheetOpen, setGenderSheetOpen] = useState(false);

  // ── Avatar pick ──
  const onPickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // ── Open editors ──
  const openEdit = (field: EditingField, current: string) => {
    setEditingField(field);
    setEditingValue(current);
  };
  const saveEdit = () => {
    const v = editingValue.trim();
    if (!v) {
      setEditingField(null);
      return;
    }
    if (editingField === 'fullName') setFullName(v);
    else if (editingField === 'username') {
      // ensure starts with @
      setUsername(v.startsWith('@') ? v : `@${v}`);
    } else if (editingField === 'address') setAddress(v);
    setEditingField(null);
  };
  const cancelEdit = () => setEditingField(null);

  const editingMeta: Record<
    Exclude<EditingField, null>,
    { title: string; placeholder: string; multiline?: boolean }
  > = {
    fullName: { title: 'แก้ไขชื่อ-นามสกุล', placeholder: 'ชื่อ นามสกุล' },
    username: { title: 'แก้ไข Username', placeholder: '@username' },
    address: { title: 'แก้ไขที่อยู่จัดส่ง', placeholder: 'ที่อยู่...', multiline: true },
  };
  const meta = editingField ? editingMeta[editingField] : null;

  // Edit sheet animations + pan-to-dismiss
  const editTy = useSharedValue(SHEET_HIDDEN);
  useEffect(() => {
    if (editingField) {
      editTy.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 });
    } else {
      editTy.value = SHEET_HIDDEN;
    }
  }, [editingField, editTy]);
  const editSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: editTy.value }],
  }));
  const editPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) editTy.value = g.dy;
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.6) {
            editTy.value = withTiming(SHEET_HIDDEN, { duration: 220 }, (done) => {
              if (done) runOnJS(cancelEdit)();
            });
          } else {
            editTy.value = withSpring(0, { damping: 22, stiffness: 200 });
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Gender sheet animations + pan-to-dismiss
  const genderTy = useSharedValue(SHEET_HIDDEN);
  useEffect(() => {
    if (genderSheetOpen) {
      genderTy.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 });
    } else {
      genderTy.value = SHEET_HIDDEN;
    }
  }, [genderSheetOpen, genderTy]);
  const genderSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: genderTy.value }],
  }));
  const closeGender = () => setGenderSheetOpen(false);
  const genderPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) genderTy.value = g.dy;
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.6) {
            genderTy.value = withTiming(SHEET_HIDDEN, { duration: 220 }, (done) => {
              if (done) runOnJS(closeGender)();
            });
          } else {
            genderTy.value = withSpring(0, { damping: 22, stiffness: 200 });
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader title="ข้อมูลส่วนตัว" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text variant="display" color={semantic.onPrimary}>J</Text>
              )}
            </View>
            <Pressable
              onPress={onPickAvatar}
              style={({ pressed }) => [styles.avatarEdit, pressed && { opacity: 0.85 }]}
              accessibilityLabel="แก้ไขรูปโปรไฟล์"
            >
              <Icon name="Camera" size={14} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>
          <Text variant="h2" align="center" style={styles.name}>{fullName}</Text>
          <View style={styles.memberBadge}>
            <Icon name="Crown" size={12} color="#B45309" strokeWidth={2.4} />
            <Text variant="caption" style={styles.memberText}>EHP Plus · เป็นสมาชิกตั้งแต่ ม.ค. 2565</Text>
          </View>
        </View>

        {/* Personal info */}
        <SectionLabel>ข้อมูลส่วนตัว</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          <Row
            icon="User"
            label="ชื่อ-นามสกุล"
            value={fullName}
            onPress={() => openEdit('fullName', fullName)}
          />
          <Divider />
          <Row
            icon="AtSign"
            label="Username Account"
            value={username}
            onPress={() => openEdit('username', username)}
          />
          <Divider />
          <Row
            icon="Cake"
            label="วันเกิด"
            value={fmtThaiDate(dob)}
            onPress={() => setDobPickerOpen(true)}
          />
          <Divider />
          <Row
            icon="UserCircle2"
            label="เพศ"
            value={GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? 'ชาย'}
            onPress={() => setGenderSheetOpen(true)}
          />
        </Card>

        {/* Contact */}
        <SectionLabel>ข้อมูลติดต่อ</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          <Row
            icon="Mail"
            label="อีเมล"
            value="joeos@example.com"
            verified
            requiresVerify
            onPress={() => {}}
          />
          <Divider />
          <Row
            icon="Phone"
            label="เบอร์โทร"
            value="081-234-5678"
            verified
            requiresVerify
            onPress={() => {}}
          />
          <Divider />
          <Row
            icon="MapPin"
            label="ที่อยู่จัดส่ง"
            value={address}
            valueLines={2}
            onPress={() => openEdit('address', address)}
          />
        </Card>

        {/* Connected accounts */}
        <SectionLabel>บัญชีที่เชื่อมต่อ</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          <ConnectedRow
            logo={require('../../assets/Facebook logo.png')}
            label="Facebook"
            connectedValue="Joe Tester"
            connected
          />
          <Divider />
          <ConnectedRow
            logo={require('../../assets/Google logo.png')}
            label="Google"
            connected={false}
          />
          <Divider />
          <ConnectedRow
            logo={require('../../assets/Line logo.png')}
            label="LINE"
            connected={false}
          />
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Edit text sheet (fullName / username / address) */}
      {editingField && meta ? (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={cancelEdit}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.editBackdropWrap}
          >
            <AnimatedPressable
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(180)}
              style={styles.editBackdrop}
              onPress={cancelEdit}
            >
              <Animated.View style={editSheetStyle} {...editPan.panHandlers}>
              <Pressable
                onPress={() => {}}
                style={[styles.editSheet, { paddingBottom: spacing.lg }]}
              >
                <View style={styles.editHandle} />
                <Text variant="bodyStrong" style={styles.editTitle}>
                  {meta.title}
                </Text>
                <TextInput
                  value={editingValue}
                  onChangeText={setEditingValue}
                  placeholder={meta.placeholder}
                  placeholderTextColor={semantic.textMuted}
                  multiline={meta.multiline}
                  autoFocus
                  style={[
                    styles.editInput,
                    meta.multiline && { height: 88, textAlignVertical: 'top' },
                  ]}
                />
                <View style={styles.editActions}>
                  <Pressable
                    onPress={cancelEdit}
                    style={({ pressed }) => [
                      styles.editBtn,
                      styles.editCancelBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text variant="bodyStrong" style={styles.editCancelText}>ยกเลิก</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveEdit}
                    style={({ pressed }) => [
                      styles.editBtn,
                      styles.editSaveBtn,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <Text variant="bodyStrong" style={styles.editSaveText}>บันทึก</Text>
                  </Pressable>
                </View>
              </Pressable>
              </Animated.View>
            </AnimatedPressable>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}

      {/* DOB calendar */}
      <CalendarSheet
        visible={dobPickerOpen}
        value={dob}
        onChange={setDob}
        onClose={() => setDobPickerOpen(false)}
      />

      {/* Gender sheet */}
      {genderSheetOpen && (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={() => setGenderSheetOpen(false)}
          statusBarTranslucent
        >
          <AnimatedPressable
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(180)}
            style={styles.editBackdrop}
            onPress={() => setGenderSheetOpen(false)}
          >
            <Animated.View style={genderSheetStyle} {...genderPan.panHandlers}>
            <Pressable
              onPress={() => {}}
              style={[styles.editSheet, { paddingBottom: spacing.lg }]}
            >
              <View style={styles.editHandle} />
              <Text variant="bodyStrong" style={styles.editTitle}>เลือกเพศ</Text>
              {GENDER_OPTIONS.map((opt) => {
                const selected = gender === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setGender(opt.value);
                      setGenderSheetOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.choiceRow,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text variant="bodyStrong" style={styles.choiceText}>
                      {opt.label}
                    </Text>
                    {selected && (
                      <Icon name="Check" size={20} color={semantic.primary} strokeWidth={2.6} />
                    )}
                  </Pressable>
                );
              })}
            </Pressable>
            </Animated.View>
          </AnimatedPressable>
        </Modal>
      )}
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

function Row({
  icon,
  label,
  value,
  verified,
  valueLines = 1,
  onPress,
  requiresVerify = false,
}: {
  icon: string;
  label: string;
  value: string;
  verified?: boolean;
  valueLines?: number;
  onPress?: () => void;
  requiresVerify?: boolean;
}) {
  const interactive = !!onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      style={({ pressed }) => [
        styles.row,
        interactive && pressed && { opacity: 0.6 },
      ]}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={interactive ? `แก้ไข ${label}` : `${label}: ${value}`}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon as never} size={18} color={semantic.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.rowMain}>
        <View style={styles.rowLabelRow}>
          <Text variant="caption" color={semantic.textSecondary} style={styles.rowLabel}>
            {label}
          </Text>
          {requiresVerify && (
            <Text variant="caption" color={semantic.textMuted} style={styles.rowLabelHint}>
              · ต้องยืนยันใหม่
            </Text>
          )}
        </View>
        <Text variant="bodyStrong" style={styles.rowValue} numberOfLines={valueLines}>
          {value}
        </Text>
      </View>
      {verified && (
        <View style={styles.verifiedBadge}>
          <Icon name="ShieldCheck" size={12} color="#4FB36C" strokeWidth={2.4} />
          <Text variant="caption" style={styles.verifiedText}>ยืนยันแล้ว</Text>
        </View>
      )}
      {interactive ? (
        <Icon name="ChevronRight" size={18} color={semantic.textMuted} />
      ) : null}
    </Pressable>
  );
}

function ConnectedRow({
  logo,
  label,
  connectedValue,
  connected,
}: {
  logo: number;
  label: string;
  connectedValue?: string;
  connected: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLogoWrap}>
        <Image source={logo} style={styles.rowLogo} resizeMode="contain" />
      </View>
      <View style={styles.rowMain}>
        <Text variant="bodyStrong" style={styles.rowValue}>
          {label}
        </Text>
        {connected && connectedValue ? (
          <Text variant="caption" color={semantic.textSecondary} style={styles.rowLabel}>
            {connectedValue}
          </Text>
        ) : (
          <Text variant="caption" color={semantic.textMuted} style={styles.rowLabel}>
            ยังไม่เชื่อมต่อ
          </Text>
        )}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.connectBtn,
          connected && styles.connectedBtn,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text
          variant="bodyStrong"
          style={[styles.connectBtnText, connected && styles.connectedBtnText]}
        >
          {connected ? 'เชื่อมต่อแล้ว' : 'เชื่อมต่อ'}
        </Text>
      </Pressable>
    </View>
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
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    marginTop: spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF6DD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  memberText: {
    fontSize: 11,
    color: '#92400E',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLogoWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLogo: {
    width: 32,
    height: 32,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowLabel: {
    fontSize: 11,
  },
  rowLabelHint: {
    fontSize: 11,
    marginLeft: 0,
  },
  rowValue: {
    fontSize: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    color: '#4FB36C',
    fontWeight: '600',
  },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  connectedBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  connectBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  connectedBtnText: {
    color: semantic.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginLeft: spacing.md + 36 + spacing.md,
  },
  // Edit modal
  editBackdropWrap: {
    flex: 1,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  editHandle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#D0D0D4',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  editTitle: {
    fontSize: 16,
    color: semantic.textPrimary,
    marginBottom: spacing.md,
  },
  editInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F2F2F3',
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: semantic.textPrimary,
    fontFamily: 'GoogleSans_400Regular',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelBtn: {
    backgroundColor: '#F2F2F3',
  },
  editCancelText: {
    fontSize: 15,
    color: semantic.textPrimary,
  },
  editSaveBtn: {
    backgroundColor: semantic.primary,
  },
  editSaveText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  // Choice (gender)
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  choiceText: {
    fontSize: 16,
    color: semantic.textPrimary,
  },
});
