import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, StepProgress, Text, TextField } from '../components';
import { colors, semantic } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type Step = 'phone' | 'otp' | 'name' | 'done';
const STEPS: Step[] = ['phone', 'otp', 'name', 'done'];

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function SignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('phone');
  const stepIdx = STEPS.indexOf(step);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0); // countdown for "ส่งอีกครั้ง"

  const otpRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  // Resend countdown tick
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const onBack = () => {
    setError(null);
    if (step === 'phone') return navigation.goBack();
    if (step === 'otp') return setStep('phone');
    if (step === 'name') return setStep('otp');
    if (step === 'done') return setStep('name');
  };

  const sendOtp = () => {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setError('เบอร์โทรไม่ถูกต้อง');
      return;
    }
    setError(null);
    setOtp('');
    setResendIn(30);
    setStep('otp');
    // Refocus the OTP input on next frame
    setTimeout(() => otpRef.current?.focus(), 80);
  };

  const verifyOtpWith = (code: string) => {
    if (code.replace(/\D/g, '').length !== 6) {
      setError('กรุณากรอก OTP 6 หลัก');
      return;
    }
    // Mock — any 6 digits passes
    setError(null);
    setStep('name');
    setTimeout(() => nameRef.current?.focus(), 80);
  };
  const verifyOtp = () => verifyOtpWith(otp);

  const submitName = () => {
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ');
      return;
    }
    setError(null);
    setStep('done');
  };

  const finishToHome = () => navigation.replace('Main');
  const goAddPet = () => navigation.replace('AddPet');

  return (
    <View style={styles.root}>
      <AppBackground />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,253,251,0)', 'rgba(255,253,251,0.6)', '#FFFDFB']}
        locations={[0, 0.32, 0.55]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top,
              // Reserve space for the absolutely-positioned footer so the
              // last form field never sits under it.
              paddingBottom: 200 + insets.bottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar: back button only */}
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityLabel="ย้อนกลับ"
            >
              <Icon
                name="ChevronLeft"
                size={22}
                color={semantic.textPrimary}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>

          {/* Step indicator (hidden on the celebration "done" step) */}
          {step !== 'done' && (
            <View style={styles.stepperWrap}>
              <StepProgress
                steps={[
                  { icon: 'Phone' },
                  { icon: 'KeyRound' },
                  { icon: 'User' },
                ]}
                currentStep={stepIdx}
              />
            </View>
          )}

          {/* Step content (re-mounts so entering animation re-fires) */}
          <View key={step}>
            {step === 'phone' && (
              <PhoneStep
                phone={phone}
                error={error}
                onChange={(v) => {
                  setPhone(formatPhone(v));
                  setError(null);
                }}
                onNext={sendOtp}
              />
            )}

            {step === 'otp' && (
              <OtpStep
                phone={phone}
                otp={otp}
                error={error}
                inputRef={otpRef}
                onChange={(v) => {
                  const next = v.replace(/\D/g, '').slice(0, 6);
                  setOtp(next);
                  setError(null);
                  if (next.length === 6) {
                    setTimeout(() => verifyOtpWith(next), 80);
                  }
                }}
                onVerify={verifyOtp}
              />
            )}

            {step === 'name' && (
              <NameStep
                name={name}
                error={error}
                inputRef={nameRef}
                onChange={(v) => {
                  setName(v);
                  setError(null);
                }}
                onNext={submitName}
              />
            )}

            {step === 'done' && <DoneStep name={name} />}
          </View>

        </ScrollView>

        {/* ── Bottom action bar ── */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
          ]}
        >
          {step === 'phone' && (
            <PrimaryButton label="ส่ง OTP" onPress={sendOtp} />
          )}

          {step === 'otp' && (
            <>
              <Pressable
                disabled={resendIn > 0}
                onPress={() => {
                  setResendIn(30);
                  setOtp('');
                }}
                hitSlop={6}
                style={styles.resendRow}
              >
                <Text
                  style={[
                    styles.resendText,
                    resendIn > 0 && { opacity: 0.45 },
                  ]}
                >
                  {resendIn > 0
                    ? `ส่งรหัสอีกครั้งภายใน ${resendIn} วินาที`
                    : 'ส่งรหัสอีกครั้ง'}
                </Text>
              </Pressable>
              <PrimaryButton label="ยืนยัน" onPress={verifyOtp} />
            </>
          )}

          {step === 'name' && (
            <PrimaryButton label="ถัดไป" onPress={submitName} />
          )}

          {step === 'done' && (
            <>
              <PrimaryButton label="เพิ่มสัตว์เลี้ยง" onPress={goAddPet} />
              <Pressable
                onPress={finishToHome}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.skipBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.skipBtnText}>ข้าม ไปที่หน้าหลัก</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── Steps ──────────────────────────────────────────────────────────

function PhoneStep({
  phone,
  error,
  onChange,
  onNext,
}: {
  phone: string;
  error: string | null;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(420).delay(80)}
      style={styles.stepBlock}
    >
      <Animated.View entering={FadeInDown.duration(420).delay(40)} style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>กรอก</Text>
          <Text style={[styles.title, { color: semantic.primary }]}>เบอร์โทร</Text>
        </View>
        <Text style={styles.description}>
          เราจะส่งรหัส OTP ไปยังเบอร์ที่คุณกรอก
        </Text>
      </Animated.View>

      <View style={styles.formBlock}>
        <TextField
          label="เบอร์มือถือ"
          value={phone}
          error={error ?? undefined}
          keyboardType="phone-pad"
          placeholder="081-234-5678"
          returnKeyType="done"
          onChange={onChange}
          onSubmitEditing={onNext}
        />
      </View>
    </Animated.View>
  );
}

function OtpStep({
  phone,
  otp,
  error,
  inputRef,
  onChange,
  onVerify,
}: {
  phone: string;
  otp: string;
  error: string | null;
  inputRef: React.RefObject<TextInput | null>;
  onChange: (v: string) => void;
  onVerify: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(420).delay(80)}
      style={styles.stepBlock}
    >
      <Animated.View entering={FadeInDown.duration(420).delay(40)} style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>ยืนยัน</Text>
          <Text style={[styles.title, { color: semantic.primary }]}>OTP</Text>
        </View>
        <Text style={styles.description}>ส่งรหัส 6 หลักไปยัง {phone}</Text>
      </Animated.View>

      <View style={styles.formBlock}>
        <View style={styles.otpBoxesWrap}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                otp.length === i && styles.otpBoxFocus,
                otp.length > i && styles.otpBoxFilled,
              ]}
            >
              <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
            </View>
          ))}
          {/* Hidden input drives the whole row */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={onChange}
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={onVerify}
            autoFocus
            caretHidden
            style={styles.otpHiddenInput}
          />
        </View>

        {error && (
          <Text variant="caption" style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function NameStep({
  name,
  error,
  inputRef,
  onChange,
  onNext,
}: {
  name: string;
  error: string | null;
  inputRef: React.RefObject<TextInput | null>;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(420).delay(80)}
      style={styles.stepBlock}
    >
      <Animated.View entering={FadeInDown.duration(420).delay(40)} style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>ชื่อ</Text>
          <Text style={[styles.title, { color: semantic.primary }]}>คุณ</Text>
        </View>
        <Text style={styles.description}>เราจะเรียกคุณว่าอะไรดี?</Text>
      </Animated.View>

      <View style={styles.formBlock}>
        <TextField
          ref={inputRef}
          label="ชื่อของคุณ"
          value={name}
          error={error ?? undefined}
          placeholder="เช่น สมชาย"
          returnKeyType="done"
          onChange={onChange}
          onSubmitEditing={onNext}
        />
      </View>
    </Animated.View>
  );
}

function DoneStep({ name }: { name: string }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(420).delay(80)}
      style={styles.stepBlock}
    >
      <Animated.View entering={FadeInDown.duration(420).delay(40)} style={styles.titleBlock}>
        <Text style={styles.title}>ยินดีต้อนรับ</Text>
        <Text style={[styles.title, { color: semantic.primary }]}>
          คุณ{name}
        </Text>
        <Text style={styles.description}>
          มาเริ่มเพิ่มน้องคนแรกของคุณกันเลย
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  topBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  stepBlock: {
    paddingHorizontal: 24,
  },

  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: semantic.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: semantic.textSecondary,
    textAlign: 'center',
  },

  formBlock: {
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 8,
    backgroundColor: '#FFFDFB',
  },

  primaryBtn: {
    height: 56,
    borderRadius: 100,
    backgroundColor: colors.rose[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#5E303C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  skipBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    color: colors.neutral[400],
    textDecorationLine: 'underline',
  },

  // OTP boxes
  otpBoxesWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  otpBox: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocus: {
    borderColor: semantic.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: semantic.primary,
    backgroundColor: '#FFFFFF',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#C25450',
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 13,
    color: semantic.primary,
    fontWeight: '500',
  },

});
