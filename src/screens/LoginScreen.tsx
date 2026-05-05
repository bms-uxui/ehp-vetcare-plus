import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Text } from '../components';
import { colors, semantic } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const SOCIAL_LOGOS: Record<'google' | 'facebook' | 'line', ImageSourcePropType> = {
  google:   require('../../assets/social/google.png'),
  facebook: require('../../assets/social/facebook.png'),
  line:     require('../../assets/social/line.png'),
};

// Sized large enough that the rotated grid fully covers the screen on any device
const PATTERN_DIM = 10;
const PATTERN_SIZE = 1200;
const PATTERN_TILE = PATTERN_SIZE / PATTERN_DIM;
const TILE_COUNT = PATTERN_DIM * PATTERN_DIM;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // EHP badge — bounce in + breathing scale loop
  const badgeScale = useSharedValue(0);
  const badgeRot = useSharedValue(0);
  useEffect(() => {
    badgeScale.value = withDelay(
      700,
      withSequence(
        withSpring(1.12, { damping: 8, stiffness: 180, mass: 0.6 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
        withDelay(
          400,
          withRepeat(
            withSequence(
              withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
              withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
          ),
        ),
      ),
    );
    badgeRot.value = withDelay(
      700,
      withSequence(
        withTiming(-8, { duration: 180 }),
        withTiming(6, { duration: 220 }),
        withTiming(0, { duration: 180 }),
      ),
    );
  }, []);
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRot.value}deg` },
    ],
  }));

  const onSubmit = () => {
    navigation.replace('Main');
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      {/* Decorative 5×5 rotated tile pattern in the top half */}
      <BgPattern />

      {/* Full-screen white wash — transparent at top → solid white in lower half.
          Single continuous gradient so the bg pattern fades smoothly into the form area. */}
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
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP HERO — illustration + EHP badge + black underline */}
          <Animated.View
            entering={FadeIn.duration(700).delay(80)}
            style={styles.topHero}
          >
            <View style={styles.topHeroInner}>
              <Image
                source={require('../../assets/illustrations/vet-girl-hero.png')}
                style={styles.heroImg}
                resizeMode="contain"
              />

              {/* EHP badge — top-right of inner container */}
              <Animated.View style={[styles.brandBadge, badgeStyle]}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.brandBadgeImg}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </Animated.View>

          {/* Title + form + social */}
          <View style={styles.bottomSection}>
            {/* TITLE */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(180)}
              style={styles.titleBlock}
            >
              <View style={styles.titleRow}>
                <Text style={styles.title}>EHP </Text>
                <Text style={[styles.title, { color: semantic.primary }]}>VetCare+</Text>
              </View>
              <Text style={styles.description}>
                ดูแลด้วยใจ เพื่อเพื่อนตัวน้อย
              </Text>
            </Animated.View>

            {/* FORM */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(280)}
              style={styles.formBlock}
            >
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>อีเมล</Text>
                <Pressable
                  onPress={() => emailRef.current?.focus()}
                  style={[
                    styles.inputBox,
                    emailFocus && styles.inputBoxFocused,
                  ]}
                >
                  <TextInput
                    ref={emailRef}
                    style={[styles.input, styles.inputFlex]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.neutral[400]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                  />
                </Pressable>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>รหัสผ่าน</Text>
                <Pressable
                  onPress={() => passwordRef.current?.focus()}
                  style={[
                    styles.inputBox,
                    passwordFocus && styles.inputBoxFocused,
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.inputFlex]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.neutral[400]}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                    accessibilityLabel={
                      showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'
                    }
                    style={({ pressed }) => [
                      styles.eyeBtn,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Icon
                      name={showPassword ? 'EyeOff' : 'Eye'}
                      size={20}
                      color={colors.neutral[500]}
                      strokeWidth={2}
                    />
                  </Pressable>
                </Pressable>
              </View>

              <View style={styles.forgotRow}>
                <Pressable hitSlop={8}>
                  <Text style={styles.forgotText}>ลืมรหัสผ่าน</Text>
                </Pressable>
              </View>

              {/* Login button — rose 600 pill */}
              <Pressable
                onPress={onSubmit}
                style={({ pressed }) => [
                  styles.loginBtn,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
              </Pressable>
            </Animated.View>

            {/* SOCIAL */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(380)}
              style={styles.socialBlock}
            >
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>หรือ ลงชื่อเข้าใช้งานโดย</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <SocialPill
                  brand="google"
                  label="Google"
                  onPress={() => navigation.replace('Main')}
                />
                <SocialPill brand="facebook" label="Facebook" onPress={() => {}} />
                <SocialPill brand="line" label="Line" onPress={() => {}} />
              </View>

              <Pressable
                hitSlop={8}
                onPress={() => navigation.navigate('Signup')}
                style={styles.signupRow}
              >
                <Text style={styles.signupText}>สมัครสมาชิก</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const TILE_PALETTE = [
  'rgba(255,156,182,0.28)',  // pink
  'rgba(184,106,124,0.28)',  // rose
  'rgba(247,177,151,0.28)',  // peach
  'rgba(210,195,254,0.28)',  // lavender
  'rgba(255,214,199,0.28)',  // peach light
  'rgba(159,82,102,0.28)',   // rose dark
] as const;

function pickRandom<T>(list: readonly T[], avoid?: T): T {
  if (list.length <= 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  while (next === avoid) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

function PatternTile({ dim }: { dim: boolean }) {
  const rotation = useSharedValue(0);
  const [color, setColor] = useState(() => pickRandom(TILE_PALETTE));

  useEffect(() => {
    let alive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let currentColor = color;

    const swap = () => {
      if (!alive) return;
      const next = pickRandom(TILE_PALETTE, currentColor);
      currentColor = next;
      setColor(next);
      // Snap to flipped-over (-90) so the second half rotates back into view
      rotation.value = -90;
      rotation.value = withTiming(
        0,
        { duration: 700, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(scheduleNext)();
        },
      );
    };

    const scheduleNext = () => {
      if (!alive) return;
      const delay = 5000 + Math.random() * 10000;
      timeoutId = setTimeout(() => {
        if (!alive) return;
        rotation.value = withTiming(
          90,
          { duration: 700, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(swap)();
          },
        );
      }, delay);
    };

    scheduleNext();
    return () => {
      alive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.bgPatternTile,
        dim && { opacity: 0.55 },
        animStyle,
      ]}
    >
      {/* Tinted base — translucent rose/peach color */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: color }]}
      />
      {/* Glass top-left highlight (light from upper-left) */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Subtle bottom shadow — gives depth */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0)', 'rgba(0,0,0,0.06)']}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Diagonal sheen — thin glossy stripe */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.22)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0.35, 0.5, 0.65]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

function BgPattern() {
  return (
    <View pointerEvents="none" style={styles.bgPatternHost}>
      <View style={styles.bgPatternRotate}>
        <View style={styles.bgPatternGrid}>
          {Array.from({ length: TILE_COUNT }).map((_, i) => {
            const row = Math.floor(i / PATTERN_DIM);
            const col = i % PATTERN_DIM;
            const dim = (row + col) % 2 === 0;
            return <PatternTile key={i} dim={dim} />;
          })}
        </View>
      </View>
    </View>
  );
}

function SocialPill({
  brand,
  label,
  onPress,
}: {
  brand: keyof typeof SOCIAL_LOGOS;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialPill,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Image
        source={SOCIAL_LOGOS[brand]}
        style={styles.socialPillIcon}
        resizeMode="contain"
      />
      <Text style={styles.socialPillLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── BG PATTERN ──
  bgPatternHost: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgPatternRotate: {
    width: PATTERN_SIZE,
    height: PATTERN_SIZE,
    transform: [{ rotate: '75deg' }],
  },
  bgPatternGrid: {
    width: PATTERN_SIZE,
    height: PATTERN_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bgPatternTile: {
    width: PATTERN_TILE,
    height: PATTERN_TILE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },

  // ── TOP HERO ──
  topHero: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  topHeroInner: {
    width: 300,
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroImg: {
    width: 181,
    height: 160,
  },
  brandBadge: {
    position: 'absolute',
    top: 24,
    right: 52,
    width: 67,
    height: 67,
    borderRadius: 33.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#5E303C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  brandBadgeImg: {
    width: '100%',
    height: '100%',
  },

  // ── BOTTOM SECTION ──
  bottomSection: {
    flex: 1,
    width: '100%',
  },

  // ── TITLE ──
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: semantic.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: semantic.textSecondary,
    textAlign: 'center',
  },

  // ── FORM ──
  formBlock: {
    padding: 16,
    gap: 10,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  inputBox: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxFocused: {
    borderColor: semantic.primary,
    borderWidth: 1.5,
  },
  input: {
    fontSize: 16,
    color: semantic.textPrimary,
    paddingVertical: 0,
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  forgotRow: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    color: colors.neutral[400],
    textDecorationLine: 'underline',
  },
  loginBtn: {
    height: 56,
    borderRadius: 100,
    backgroundColor: colors.rose[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#5E303C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── SOCIAL ──
  socialBlock: {
    padding: 16,
    gap: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dividerText: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialPill: {
    flex: 1,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  socialPillIcon: {
    width: 20,
    height: 20,
  },
  socialPillLabel: {
    fontSize: 12,
    color: '#040404',
    fontWeight: '500',
  },
  signupRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signupText: {
    fontSize: 14,
    color: colors.neutral[400],
    textDecorationLine: 'underline',
  },
});
