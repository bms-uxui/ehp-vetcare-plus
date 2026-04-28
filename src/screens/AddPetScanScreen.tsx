import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../App';
import { Button, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPetScan'>;

const TARGET_W = 280;
const TARGET_H = 180;

async function handleOcrCapture(): Promise<{
  name?: string;
  breed?: string;
  birthDate?: string;
  microchipId?: string;
}> {
  // TODO: integrate expo-camera + an OCR service (Vision Kit, GCP, AWS Textract, etc.)
  // For now: simulate latency + return a dummy extraction
  await new Promise((r) => setTimeout(r, 1400));
  return {
    name: 'ลูกเกด',
    breed: 'โกลเด้น รีทรีฟเวอร์',
    birthDate: '2024-02-14',
    microchipId: '900164000654321',
  };
}

export default function AddPetScanScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [scanY]);

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
