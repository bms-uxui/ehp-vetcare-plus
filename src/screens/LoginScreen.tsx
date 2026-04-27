import { useEffect, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { Button, Icon, Input, Text } from '../components';
import { radii, semantic, shadows, spacing } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const LIQUID_GLASS = isLiquidGlassAvailable();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const logoScale = useSharedValue(1);
  const logoGlow = useSharedValue(0.6);

  useEffect(() => {
    logoScale.value = withRepeat(
      withTiming(1.06, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    logoGlow.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
    transform: [{ scale: 0.85 + logoGlow.value * 0.3 }],
  }));

  const onSubmit = () => {
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setError(null);
    navigation.replace('Main');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FFFDFB', '#FBE9EC', '#F0CCD5']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Aurora blobs for depth */}
      <View style={[styles.blob, styles.blobRose]} />
      <View style={[styles.blob, styles.blobCream]} />
      <View style={[styles.blob, styles.blobAccent]} />

      {/* Floating paw prints */}
      <FloatingPaw delay={0}    style={{ top: 80,   left: 32 }}  size={22} opacity={0.16} />
      <FloatingPaw delay={500}  style={{ top: 140,  right: 48 }} size={28} opacity={0.12} />
      <FloatingPaw delay={1000} style={{ top: 320,  left: 20 }}  size={18} opacity={0.18} />
      <FloatingPaw delay={1500} style={{ top: 480,  right: 28 }} size={24} opacity={0.13} />
      <FloatingPaw delay={2000} style={{ bottom: 200, left: 56 }} size={20} opacity={0.14} />
      <FloatingPaw delay={700}  style={{ bottom: 80, right: 64 }} size={26} opacity={0.10} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — logo with breathing glow */}
          <Animated.View entering={FadeInDown.duration(700).delay(100)} style={styles.heroLogo}>
            <Animated.View style={[styles.logoGlow, glowStyle]} />
            <Animated.View style={[styles.logoMark, logoStyle, shadows.lift]}>
              <LinearGradient
                colors={['#EFA5B8', '#DA8AA1', '#B86A7C']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={styles.logoSheen} />
              <Icon name="PawPrint" size={56} color={semantic.onPrimary} strokeWidth={2.2} />
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(220)} style={styles.heroText}>
            <Text variant="display" align="center" style={styles.title}>
              VetCare
              <Text variant="display" color={semantic.primary}>+</Text>
            </Text>
            <Text variant="body" color={semantic.textSecondary} align="center" style={styles.tagline}>
              ดูแลด้วยใจ เพื่อเพื่อนตัวน้อยของคุณ
            </Text>
          </Animated.View>

          {/* Stat pills — premium feel */}
          <Animated.View entering={FadeInDown.duration(600).delay(320)} style={styles.statsRow}>
            <StatPill icon="Heart" label="10K+ ตัว" />
            <StatPill icon="Stethoscope" label="200+ สัตวแพทย์" />
            <StatPill icon="Clock" label="24 / 7" />
          </Animated.View>

          {/* Glass card — form */}
          <Animated.View entering={FadeInUp.duration(700).delay(420)}>
            <GlassCard>
              <Input
                label="อีเมล"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                error={error && !email ? 'กรุณากรอก' : undefined}
                leftElement={<Icon name="Mail" size={20} color={semantic.textSecondary} />}
              />
              <Input
                label="รหัสผ่าน"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={error && !password ? 'กรุณากรอก' : undefined}
                leftElement={<Icon name="Lock" size={20} color={semantic.textSecondary} />}
              />

              <View style={styles.forgotRow}>
                <Pressable onPress={() => {}} hitSlop={8}>
                  <Text variant="caption" color={semantic.primary} style={styles.linkText}>
                    ลืมรหัสผ่าน?
                  </Text>
                </Pressable>
              </View>

              <Button label="เข้าสู่ระบบ" onPress={onSubmit} size="lg" />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text variant="caption" color={semantic.textMuted}>หรือเข้าสู่ระบบด้วย</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton brand="google" onPress={() => {}} />
                <SocialButton brand="facebook" onPress={() => {}} />
                <SocialButton brand="line" onPress={() => {}} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Signup */}
          <Animated.View entering={FadeInUp.duration(600).delay(560)} style={styles.signupRow}>
            <Text variant="caption" color={semantic.textSecondary}>
              ยังไม่มีบัญชี?
            </Text>
            <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={8} style={styles.signupBtn}>
              <Text variant="bodyStrong" color={semantic.primary} style={styles.signupText}>
                สมัครสมาชิก
              </Text>
              <Icon name="ArrowRight" size={16} color={semantic.primary} strokeWidth={2.4} />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* --- Sub-components --- */

type FloatingPawProps = {
  delay: number;
  size: number;
  opacity: number;
  style: { top?: number; bottom?: number; left?: number; right?: number };
};

function FloatingPaw({ delay, size, opacity, style }: FloatingPawProps) {
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withTiming(-14, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    rot.value = withDelay(
      delay,
      withRepeat(
        withTiming(10, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', opacity, ...style }, animStyle]}
    >
      <Icon name="PawPrint" size={size} color={semantic.primary} strokeWidth={2} />
    </Animated.View>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Icon name={icon as any} size={13} color={semantic.primary} strokeWidth={2.4} />
      <Text variant="caption" style={styles.statText}>
        {label}
      </Text>
    </View>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.cardWrap, shadows.lg]}>
      {LIQUID_GLASS ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme="light"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <>
          <BlurView
            intensity={80}
            tint="systemThinMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cardTint]} />
        </>
      )}
      <View pointerEvents="none" style={styles.cardHairline} />
      <View style={styles.cardInner}>{children}</View>
    </View>
  );
}

const SOCIAL_CONFIG: Record<string, { bg: string; fg: string; label: string; fontSize: number; bordered?: boolean }> = {
  google:   { bg: '#FFFFFF', fg: '#4285F4', label: 'G', fontSize: 24, bordered: true },
  facebook: { bg: '#1877F2', fg: '#FFFFFF', label: 'f', fontSize: 24 },
  line:     { bg: '#06C755', fg: '#FFFFFF', label: 'LINE', fontSize: 11 },
};

function SocialButton({ brand, onPress }: { brand: keyof typeof SOCIAL_CONFIG; onPress: () => void }) {
  const cfg = SOCIAL_CONFIG[brand];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialBtn,
        { backgroundColor: cfg.bg },
        cfg.bordered && styles.socialBtnBordered,
        shadows.sm,
        pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
      ]}
    >
      <Text
        style={{
          color: cfg.fg,
          fontWeight: '800',
          fontSize: cfg.fontSize,
          letterSpacing: cfg.label.length > 1 ? 0.5 : 0,
        }}
      >
        {cfg.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: '#FFFDFB',
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },

  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobRose: {
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    backgroundColor: 'rgba(220, 138, 161, 0.35)',
    top: -SCREEN_W * 0.3,
    right: -SCREEN_W * 0.3,
    opacity: 0.7,
  },
  blobCream: {
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    backgroundColor: 'rgba(249, 236, 224, 0.6)',
    top: SCREEN_W * 0.5,
    left: -SCREEN_W * 0.3,
  },
  blobAccent: {
    width: SCREEN_W * 0.6,
    height: SCREEN_W * 0.6,
    backgroundColor: 'rgba(232, 168, 124, 0.18)',
    bottom: -SCREEN_W * 0.2,
    right: -SCREEN_W * 0.2,
  },

  heroLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    height: 140,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(216, 138, 161, 0.45)',
  },
  logoMark: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  heroText: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 15,
    opacity: 0.9,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(184, 106, 124, 0.2)',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.primary,
  },

  cardWrap: {
    borderRadius: radii['2xl'],
    overflow: 'hidden',
  },
  cardTint: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cardHairline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardInner: {
    padding: spacing.xl,
    gap: spacing.lg,
  },

  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
  },
  linkText: {
    fontWeight: '600',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(184, 106, 124, 0.25)',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnBordered: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },

  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  signupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
