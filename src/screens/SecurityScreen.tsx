import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View, Pressable } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Card, ConfirmModal, Icon, SubPageHeader, Text } from '../components';
import { semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Security'>;

type Device = {
  id: string;
  name: string;
  osLabel: string;
  location: string;
  lastActiveISO: string;
  current?: boolean;
};

const MOCK_DEVICES: Device[] = [
  {
    id: 'd1',
    name: 'iPhone 15 Pro',
    osLabel: 'iOS 18.2',
    location: 'กรุงเทพฯ',
    lastActiveISO: '2026-04-30T08:22:00',
    current: true,
  },
  {
    id: 'd2',
    name: 'iPad Air',
    osLabel: 'iPadOS 18.1',
    location: 'กรุงเทพฯ',
    lastActiveISO: '2026-04-28T14:05:00',
  },
  {
    id: 'd3',
    name: 'MacBook Air M2',
    osLabel: 'macOS 15.2',
    location: 'นนทบุรี',
    lastActiveISO: '2026-04-22T19:40:00',
  },
];

const fmtRelative = (iso: string) => {
  const diffH = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
  if (diffH < 1) return 'เมื่อสักครู่';
  if (diffH < 24) return `${diffH} ชม.ที่แล้ว`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
};

export default function SecurityScreen({ navigation }: Props) {
  const [biometric, setBiometric] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);

  const onLogoutAll = () => {
    setLogoutAllOpen(false);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
    );
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <SubPageHeader title="ความปลอดภัย" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Login & access */}
        <SectionLabel>การเข้าสู่ระบบ</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          <ActionRow
            icon="KeyRound"
            label="เปลี่ยนรหัสผ่าน"
            description="แก้ไขครั้งล่าสุด 2 เดือนที่แล้ว"
          />
          <Divider />
          <ToggleRow
            icon="Fingerprint"
            label="Face ID / Touch ID"
            description="ใช้ biometric เข้าสู่ระบบแทนรหัสผ่าน"
            value={biometric}
            onValueChange={setBiometric}
          />
          <Divider />
          <ToggleRow
            icon="ShieldCheck"
            label="ยืนยันตัวตน 2 ขั้น (2FA)"
            description="รับรหัส OTP ทุกครั้งที่เข้าสู่ระบบ"
            value={twoFA}
            onValueChange={setTwoFA}
          />
        </Card>

        {/* Active devices */}
        <SectionLabel>อุปกรณ์ที่เข้าสู่ระบบอยู่</SectionLabel>
        <Card variant="elevated" padding={0} style={styles.card}>
          {MOCK_DEVICES.map((d, i) => (
            <View key={d.id}>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Icon
                    name={d.name.toLowerCase().includes('mac') ? 'Laptop' : d.name.toLowerCase().includes('pad') ? 'Tablet' : 'Smartphone'}
                    size={18}
                    color={semantic.primary}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.rowMain}>
                  <View style={styles.deviceTitleRow}>
                    <Text variant="bodyStrong" style={styles.rowValue} numberOfLines={1}>
                      {d.name}
                    </Text>
                    {d.current && (
                      <View style={styles.currentBadge}>
                        <Text variant="caption" style={styles.currentText}>เครื่องนี้</Text>
                      </View>
                    )}
                  </View>
                  <Text variant="caption" color={semantic.textSecondary} numberOfLines={1}>
                    {d.osLabel} · {d.location} · {fmtRelative(d.lastActiveISO)}
                  </Text>
                </View>
                {!d.current && (
                  <Pressable
                    style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.6 }]}
                    accessibilityLabel={`ออกจากระบบ ${d.name}`}
                  >
                    <Icon name="LogOut" size={16} color="#C25450" strokeWidth={2.4} />
                  </Pressable>
                )}
              </View>
              {i < MOCK_DEVICES.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        {/* Danger zone */}
        <Pressable
          onPress={() => setLogoutAllOpen(true)}
          style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="ออกจากระบบทุกอุปกรณ์"
        >
          <Icon name="LogOut" size={16} color="#C25450" strokeWidth={2.4} />
          <Text variant="bodyStrong" style={styles.dangerBtnText}>
            ออกจากระบบทุกอุปกรณ์
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={logoutAllOpen}
        icon="LogOut"
        tone="danger"
        title="ออกจากระบบทุกอุปกรณ์?"
        message="ทุกเครื่องที่ login อยู่จะถูก sign out ออก คุณต้องเข้าสู่ระบบใหม่"
        cancelLabel="ยกเลิก"
        confirmLabel="ออกจากระบบ"
        confirmTone="danger"
        onCancel={() => setLogoutAllOpen(false)}
        onConfirm={onLogoutAll}
      />
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
}: {
  icon: string;
  label: string;
  description?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Icon name={icon as never} size={18} color={semantic.primary} strokeWidth={2.2} />
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

function ToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon name={icon as never} size={18} color={semantic.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.rowMain}>
        <Text variant="bodyStrong" style={styles.rowValue}>{label}</Text>
        {description && (
          <Text variant="caption" color={semantic.textSecondary} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5E5', true: semantic.primary }}
      />
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
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentBadge: {
    backgroundColor: '#E7F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  currentText: {
    fontSize: 10,
    color: '#4FB36C',
    fontWeight: '600',
  },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDECEC',
    backgroundColor: '#FDECEC',
    marginTop: spacing.xl,
  },
  dangerBtnText: {
    fontSize: 14,
    color: '#C25450',
  },
});
