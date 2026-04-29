import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../App';
import { AppBackground, Button, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPetScan'>;

const TARGET_W = 280;
const TARGET_H = 180;

async function handleOcrCapture(): Promise<{
  name?: string;
  breed?: string;
  birthDate?: string;
  microchipId?: string;
  neutered?: boolean;
  neuteredDate?: string;
  neuteredClinic?: string;
}> {
  // TODO: integrate expo-camera + an OCR service (Vision Kit, GCP, AWS Textract, etc.)
  // For now: simulate latency + return a dummy extraction (incl. neutered = true so
  // the locked checkbox state can be previewed in the manual form).
  await new Promise((r) => setTimeout(r, 1400));
  return {
    name: 'ลูกเกด',
    breed: 'โกลเด้น รีทรีฟเวอร์',
    birthDate: '2024-02-14',
    microchipId: '900164000654321',
    neutered: true,
    neuteredDate: '2566-11-02',
    neuteredClinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic',
  };
}

export default function AddPetScanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!started) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: TARGET_H - 4,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanY, started]);

  if (!started) {
    return (
      <View style={styles.introRoot}>
        <AppBackground />

        <View style={[styles.introHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.introBackBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel="ย้อนกลับ"
          >
            <Icon name="ChevronLeft" size={20} color="#1A1A1F" strokeWidth={2.4} />
          </Pressable>
          <Text variant="bodyStrong" style={styles.introTitle}>
            สแกนบัตรประจำตัวสัตว์เลี้ยง
          </Text>
        </View>

        <View style={styles.introBody}>
          <View style={styles.introIllus}>
            <Icon name="ScanLine" size={56} color="#9F5266" strokeWidth={2.2} />
          </View>

          <Text variant="bodyStrong" style={styles.introHeading}>
            กรุณาเตรียมบัตรประจำตัว{'\n'}สัตว์เลี้ยงให้พร้อม
          </Text>

          <View style={styles.tipsList}>
            <View style={styles.tipRow}>
              <Icon name="Sun" size={20} color="#9F5266" strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={styles.tipTitle}>
                  สภาพแวดล้อม
                </Text>
                <Text variant="caption" style={styles.tipBody}>
                  ควรมีแสงสว่างเพียงพอและเห็นรายละเอียดบนบัตรชัดเจน
                </Text>
              </View>
            </View>
            <View style={styles.tipRow}>
              <Icon name="Crop" size={20} color="#9F5266" strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={styles.tipTitle}>
                  ตำแหน่งบัตร
                </Text>
                <Text variant="caption" style={styles.tipBody}>
                  วางบัตรให้อยู่ตรงกลางและไม่มีอะไรบดบัง
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.introFooter, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={() => setStarted(true)}
            style={({ pressed }) => [
              styles.startBtn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text variant="bodyStrong" style={styles.startBtnText}>
              เริ่มเลย
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const onCapture = async () => {
    setBusy(true);
    // TODO: Haptics.notificationAsync(Success) on result
    const extracted = await handleOcrCapture();
    setBusy(false);
    navigation.replace('AddPetManual', { prefill: extracted } as any);
  };

  return (
    <Screen padded={false} backgroundColor="#0E0B0C">
      <View style={styles.viewfinder}>
        {/* darken outside the target — top, bottom, left, right strips */}
        <View style={[styles.mask, styles.maskTop]} />
        <View style={[styles.mask, styles.maskBottom]} />
        <View style={[styles.mask, styles.maskLeft]} />
        <View style={[styles.mask, styles.maskRight]} />

        <View style={styles.target}>
          {/* corner markers */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* animated laser line */}
          <Animated.View style={[styles.laserWrap, { transform: [{ translateY: scanY }] }]}>
            <LinearGradient
              colors={['rgba(217,134,146,0)', '#EFA5B8', 'rgba(217,134,146,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.laser}
            />
          </Animated.View>
        </View>

        <View style={styles.tooltip}>
          <Icon name="Info" size={16} color={semantic.onPrimary} strokeWidth={2.2} />
          <Text variant="caption" color={semantic.onPrimary} style={{ fontSize: 12 }}>
            วางบัตรของน้องให้พอดีกรอบเลยนะ
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={busy ? 'กำลังอ่านบัตรของน้อง...' : 'ถ่ายรูปบัตรน้อง'}
          onPress={onCapture}
          loading={busy}
          fullWidth
        />
        <Button
          label="ขอกรอกเองดีกว่า"
          variant="ghost"
          onPress={() => navigation.replace('AddPetManual')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  introRoot: { flex: 1 },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  introBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  introTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  introBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  introIllus: {
    width: 276,
    height: 171,
    borderRadius: 16,
    backgroundColor: '#F1ECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introHeading: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1A1F',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  tipsList: {
    alignSelf: 'stretch',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9D9D9',
  },
  tipTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4A50',
  },
  introFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  startBtn: {
    height: 56,
    borderRadius: 100,
    backgroundColor: '#9F5266',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#0E0B0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  maskTop: {
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%',
    marginBottom: TARGET_H / 2,
  },
  maskBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    top: '50%',
    marginTop: TARGET_H / 2,
  },
  maskLeft: {
    top: '50%',
    left: 0,
    width: '50%',
    height: TARGET_H,
    marginTop: -TARGET_H / 2,
    marginRight: TARGET_W / 2,
    transform: [{ translateX: -TARGET_W / 2 }],
  },
  maskRight: {
    top: '50%',
    right: 0,
    width: '50%',
    height: TARGET_H,
    marginTop: -TARGET_H / 2,
    transform: [{ translateX: TARGET_W / 2 }],
  },
  target: {
    width: TARGET_W,
    height: TARGET_H,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#EFA5B8',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radii.md },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radii.md },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radii.md },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radii.md },
  laserWrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
  },
  laser: {
    height: 2,
    borderRadius: 1,
  },
  tooltip: {
    position: 'absolute',
    bottom: '50%',
    marginBottom: TARGET_H / 2 + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    backgroundColor: '#0E0B0C',
  },
});
