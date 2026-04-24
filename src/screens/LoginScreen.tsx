import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Icon, Input, Screen, Text } from '../components';
import { semantic, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setError(null);
    navigation.replace('Main');
  };

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.header}>
        <View style={[styles.logoMark, shadows.lift]}>
          <Icon name="PawPrint" size={48} color={semantic.onPrimary} strokeWidth={2} />
        </View>
        <Text variant="display" align="center" style={styles.title}>
          VetCare
        </Text>
        <Text variant="body" color={semantic.textSecondary} align="center">
          ดูแลด้วยใจ เพื่อเพื่อนตัวน้อยของคุณ
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="อีเมล"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={error && !email ? 'กรุณากรอก' : undefined}
        />
        <Input
          label="รหัสผ่าน"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={error && !password ? 'กรุณากรอก' : undefined}
        />

        <Button label="เข้าสู่ระบบ" onPress={onSubmit} />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text variant="caption" color={semantic.textMuted}>หรือเข้าสู่ระบบด้วย</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <Button label="Google" variant="secondary" uppercase={false} onPress={() => {}} fullWidth={false} style={styles.socialBtn} />
          <Button label="Facebook" variant="secondary" uppercase={false} onPress={() => {}} fullWidth={false} style={styles.socialBtn} />
          <Button label="LINE" variant="secondary" uppercase={false} onPress={() => {}} fullWidth={false} style={styles.socialBtn} />
        </View>

        <Button
          label="ลืมรหัสผ่าน?"
          variant="ghost"
          uppercase={false}
          onPress={() => {}}
        />

        <View style={styles.signupRow}>
          <Text variant="caption" color={semantic.textSecondary}>
            ยังไม่มีบัญชี?
          </Text>
          <Button
            label="สมัครสมาชิก"
            variant="ghost"
            uppercase={false}
            size="sm"
            fullWidth={false}
            onPress={() => navigation.navigate('Signup')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: semantic.border,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialBtn: {
    flex: 1,
    paddingHorizontal: 0,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
