import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Input, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type Errors = Partial<Record<'cid' | 'name' | 'phone' | 'email' | 'password', string>>;

const formatCID = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  const parts = [
    digits.slice(0, 1),
    digits.slice(1, 5),
    digits.slice(5, 10),
    digits.slice(10, 12),
    digits.slice(12, 13),
  ].filter(Boolean);
  return parts.join('-');
};

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function SignupScreen({ navigation }: Props) {
  const [cid, setCid] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const next: Errors = {};
    const cidDigits = cid.replace(/\D/g, '');
    if (!cidDigits) next.cid = 'กรุณากรอก';
    else if (cidDigits.length !== 13) next.cid = 'เลขบัตรต้องเป็น 13 หลัก';

    if (!name.trim()) next.name = 'กรุณากรอก';

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits) next.phone = 'กรุณากรอก';
    else if (phoneDigits.length < 9) next.phone = 'เบอร์โทรไม่ถูกต้อง';

    if (!email.trim()) next.email = 'กรุณากรอก';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'อีเมลไม่ถูกต้อง';

    if (!password) next.password = 'กรุณากรอก';
    else if (password.length < 8) next.password = 'อย่างน้อย 8 ตัวอักษร';

    return next;
  };

  const onSubmit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length === 0) {
      navigation.replace('Main');
    }
  };

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.header}>
        <Text variant="h1">สมัครสมาชิก</Text>
        <Text variant="body" color={semantic.textSecondary}>
          เราจะเชื่อมข้อมูลสัตว์เลี้ยงจาก EHP VetCare ด้วยเลขบัตรประชาชนของคุณ
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="เลขบัตรประชาชน"
          placeholder="1-2345-67890-12-3"
          keyboardType="number-pad"
          value={cid}
          onChangeText={(v) => setCid(formatCID(v))}
          error={errors.cid}
          hint={!errors.cid ? 'เลขประจำตัวประชาชน 13 หลัก' : undefined}
        />
        <Input
          label="ชื่อ-นามสกุล"
          placeholder="เช่น สมชาย ใจดี"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <Input
          label="เบอร์มือถือ"
          placeholder="081-234-5678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(v) => setPhone(formatPhone(v))}
          error={errors.phone}
        />
        <Input
          label="อีเมล"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
        <Input
          label="รหัสผ่าน"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Button label="สมัครสมาชิก" onPress={onSubmit} />

        <View style={styles.footer}>
          <Text variant="caption" color={semantic.textSecondary}>
            มีบัญชีอยู่แล้ว?
          </Text>
          <Button
            label="เข้าสู่ระบบ"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
