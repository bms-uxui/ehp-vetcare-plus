import { Pressable, StyleSheet, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Button, Card, Icon, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';

type MenuItem = { icon: string; label: string; route?: keyof import('../../App').RootStackParamList };

const MENU: MenuItem[] = [
  { icon: 'User', label: 'ข้อมูลส่วนตัว' },
  { icon: 'CreditCard', label: 'ค่าใช้จ่ายและงบประมาณ', route: 'Expenses' },
  { icon: 'Bell', label: 'การแจ้งเตือน', route: 'Notifications' },
  { icon: 'Hospital', label: 'คลินิกที่เชื่อมต่อ' },
  { icon: 'Lock', label: 'ความปลอดภัย' },
  { icon: 'HelpCircle', label: 'ช่วยเหลือ' },
];

export default function ProfileScreen() {
  const navigation = useNavigation();

  const signOut = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
    );
  };

  return (
    <Screen scroll tabBarSpace>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text variant="display" color={semantic.onPrimary}>J</Text>
        </View>
        <Text variant="h1" align="center">คุณโจ</Text>
        <Text variant="caption" color={semantic.textSecondary} align="center">
          joeos@example.com
        </Text>
      </View>

      <Card variant="elevated" padding={0} style={styles.menuCard}>
        {MENU.map((m, idx) => {
          const row = (
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Icon name={m.icon as any} size={20} color={semantic.primary} />
              </View>
              <Text variant="body" style={styles.menuLabel}>{m.label}</Text>
              <Icon name="ChevronRight" size={18} color={semantic.textMuted} />
            </View>
          );
          return (
            <View key={m.label}>
              {m.route ? (
                <Pressable
                  onPress={() => navigation.navigate(m.route as never)}
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                  {row}
                </Pressable>
              ) : (
                row
              )}
              {idx < MENU.length - 1 && <View style={styles.menuDivider} />}
            </View>
          );
        })}
      </Card>

      <View style={styles.signOut}>
        <Button label="ออกจากระบบ" variant="ghost" uppercase={false} onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  menuCard: {
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  menuDivider: {
    height: 1,
    marginLeft: spacing.xl + 28 + spacing.md,
    backgroundColor: semantic.border,
  },
  signOut: {
    marginBottom: spacing.xl,
  },
});
