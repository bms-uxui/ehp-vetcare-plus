import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import Text from './Text';
import { radii, semantic, shadows, spacing } from '../theme';

export type CoachRect = { x: number; y: number; width: number; height: number };

export type CoachStep = {
  /** ตรงกับ key ที่หน้าจอใช้ลงทะเบียนตำแหน่ง */
  key: string;
  title: string;
  body: string;
  /** ไม่มี rect = ไฮไลต์ไม่ได้ ให้แสดง tooltip กลางจอแทน (เช่น แท็บล่าง) */
  fallbackAnchor?: 'bottom' | 'center';
  /**
   * มุมโค้งของช่องไฮไลต์ ให้รับกับความโค้งจริงของ target — ปกติคือ
   * radius ของการ์ด + PAD (8) เพื่อให้ขอบโค้งขนานกัน. ปุ่มแคปซูล/วงกลม
   * ใส่ 999 ได้เลย (คลายเป็นครึ่งความสูงให้เอง). ไม่ใส่ = 24.
   */
  holeRadius?: number;
};

type Props = {
  visible: boolean;
  steps: CoachStep[];
  /** ตำแหน่งจริงบนจอ — undefined = ยังไม่วัด, null = วัดแล้วแต่ไม่มีบนจอ */
  rects: Record<string, CoachRect | null | undefined>;
  step: number;
  onStepChange: (next: number) => void;
  onFinish: () => void;
  onSkip: () => void;
  /**
   * โหมดทัวร์ต่อเนื่อง: ชื่อหน้าถัดไป + สิ่งที่ต้องทำเมื่อกดข้าม —
   * แสดงปุ่ม "ข้ามไปหน้า…" ให้คนที่รู้หน้านี้แล้วโดดไปหน้าถัดไปได้เลย
   */
  nextPage?: { label: string; onPress: () => void };
};

const DIM = 'rgba(30,12,18,0.62)';
/** มุมโค้งของช่องไฮไลต์ — ให้กลมกลืนกับความโค้งของการ์ดที่มันครอบอยู่ */
const HOLE_RADIUS = 24;
/** เผื่อขอบรอบช่องโหว่ ให้ไฮไลต์ไม่บีบติดขอบการ์ดพอดีเป๊ะ */
const PAD = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_MAX_W = 340;

/**
 * ทรานสิชันร่วมของ spotlight/tooltip — ใช้ spring แทน linear เพราะ easing
 * เส้นตรงทำให้การเคลื่อนดู "แข็ง" เหมือนเครื่องจักร (ออกตัวกับหยุดกึก).
 * ค่า damping สูงพอที่จะไม่เด้งเกิน แค่ผ่อนตอนเข้าจอด.
 */
const GLIDE = LinearTransition.springify().damping(26).stiffness(220).mass(0.9);

export default function CoachMarks({
  visible,
  steps,
  rects,
  step,
  onStepChange,
  onFinish,
  onSkip,
  nextPage,
}: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tooltipH, setTooltipH] = useState(180);

  const current = steps[step];
  const measured = current ? rects[current.key] : undefined;

  // ทิศของการเปลี่ยนขั้น ให้เนื้อหาในการ์ดสไลด์แบบ pageview: ถัดไปไหลเข้า
  // จากขวา ย้อนกลับไหลเข้าจากซ้าย
  const prevStep = useRef(step);
  const dir = step >= prevStep.current ? 1 : -1;
  useEffect(() => {
    prevStep.current = step;
  }, [step]);

  // Hold the last committed rect while the new step is still scrolling into
  // view — swapping to "no hole" mid-transition makes the dim flash full-screen
  // and the spotlight teleport instead of glide.
  const [shown, setShown] = useState<CoachRect | null>(null);
  useEffect(() => {
    if (measured !== undefined) setShown(measured);
  }, [measured]);
  useEffect(() => {
    if (!visible) setShown(null);
  }, [visible]);

  // Reset the measured tooltip height between steps so a tall step followed by
  // a short one doesn't keep reserving the tall gap.
  useEffect(() => {
    setTooltipH(180);
  }, [step]);

  if (!visible || !current) return null;

  const hole = shown
    ? {
        x: Math.max(0, shown.x - PAD),
        y: Math.max(0, shown.y - PAD),
        width: Math.min(winW, shown.width + PAD * 2),
        height: shown.height + PAD * 2,
      }
    : null;

  // Place the tooltip below the hole when there is room, otherwise above.
  let tooltipTop: number;
  if (!hole) {
    tooltipTop =
      current.fallbackAnchor === 'bottom'
        ? winH - insets.bottom - tooltipH - 120
        : (winH - tooltipH) / 2;
  } else {
    const below = hole.y + hole.height + TOOLTIP_GAP;
    const fitsBelow = below + tooltipH < winH - insets.bottom - spacing.lg;
    tooltipTop = fitsBelow ? below : hole.y - TOOLTIP_GAP - tooltipH;
    // Never let it slide off the top edge (first steps sit near the status bar)
    tooltipTop = Math.max(insets.top + spacing.sm, tooltipTop);
  }

  const isLast = step === steps.length - 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={StyleSheet.absoluteFill}>
        {/* Tap anywhere on the dim to advance. It sits under the cut-out so the
            highlighted element itself is not covered by a press target. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => (isLast ? onFinish() : onStepChange(step + 1))}
        />

        {/* The cut-out is one rounded view whose huge boxShadow *spread* paints
            the dim outward. Four dim rectangles around a hole could never round
            its corners; a spread shadow follows the borderRadius exactly. */}
        {hole ? (
          <Animated.View
            pointerEvents="none"
            entering={FadeIn.duration(160)}
            // Layout transition = the spotlight glides between steps instead of
            // teleporting; the spread-shadow dim follows along for free.
            layout={GLIDE}
            style={[
              styles.hole,
              {
                top: hole.y,
                left: hole.x,
                width: hole.width,
                height: hole.height,
                borderRadius: current.holeRadius ?? HOLE_RADIUS,
              },
            ]}
          />
        ) : (
          <Animated.View
            pointerEvents="none"
            entering={FadeIn.duration(160)}
            style={[styles.dimFull, StyleSheet.absoluteFillObject]}
          />
        )}

        <Animated.View
          layout={GLIDE}
          onLayout={(e) => setTooltipH(e.nativeEvent.layout.height)}
          style={[
            styles.tooltip,
            {
              top: tooltipTop,
              width: Math.min(TOOLTIP_MAX_W, winW - spacing.xl * 2),
              left: (winW - Math.min(TOOLTIP_MAX_W, winW - spacing.xl * 2)) / 2,
            },
          ]}
        >
          <View style={styles.tooltipHeader}>
            <Text variant="caption" weight="700" style={styles.counter}>
              {`${step + 1} / ${steps.length}`}
            </Text>
            <Pressable onPress={onSkip} hitSlop={10} accessibilityRole="button" accessibilityLabel="ข้ามคำแนะนำ">
              <Icon name="X" size={18} color={semantic.textMuted} strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* key ตามขั้น = เนื้อหาเก่า fade-slide ออก เนื้อหาใหม่ไหลเข้าตามทิศ
              ที่กด (แบบ pageview) แทนการสลับข้อความทันที ตัวที่กำลังออก
              ไม่กินพื้นที่ layout จึงไม่ดันความสูงการ์ดระหว่างทาง */}
          <Animated.View
            key={current.key}
            entering={(dir === 1 ? FadeInRight : FadeInLeft).duration(260).delay(40)}
            exiting={(dir === 1 ? FadeOutLeft : FadeOutRight).duration(150)}
          >
            <Text variant="bodyStrong" style={styles.title}>
              {current.title}
            </Text>
            <Text variant="caption" color={semantic.textSecondary} style={styles.body}>
              {current.body}
            </Text>
          </Animated.View>

          <View style={styles.dotsRow}>
            {steps.map((s, i) => (
              <Animated.View
                key={s.key}
                layout={GLIDE}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {/* ขั้นสุดท้าย: ปุ่มหลักกลายเป็น "ไปหน้าถัดไป" อยู่แล้ว —
                ปุ่มข้ามซ้ายมือจึงซ้ำหน้าที่ ซ่อนทิ้ง */}
            {nextPage && !isLast && (
              <Pressable
                onPress={nextPage.onPress}
                style={({ pressed }) => [styles.nextPageBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={`ข้ามไปคำแนะนำหน้า${nextPage.label}`}
              >
                <Text variant="caption" weight="600" color={semantic.textSecondary} style={styles.nextPageText}>
                  {`${nextPage.label} ›`}
                </Text>
              </Pressable>
            )}
            <View style={styles.actionSpacer} />
            {step > 0 && (
              <Pressable
                onPress={() => onStepChange(step - 1)}
                style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                <Text variant="bodyStrong" color={semantic.textSecondary} style={styles.btnText}>
                  ย้อนกลับ
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => (isLast ? onFinish() : onStepChange(step + 1))}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
            >
              <Text variant="bodyStrong" color={semantic.onPrimary} style={styles.btnText}>
                {!isLast ? 'ถัดไป' : nextPage ? nextPage.label : 'เริ่มใช้งาน'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimFull: {
    backgroundColor: DIM,
  },
  hole: {
    position: 'absolute',
    borderRadius: HOLE_RADIUS,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    // spread of 9999 → the dim covers the whole screen except this rounded view
    boxShadow: `0px 0px 0px 9999px ${DIM}`,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: semantic.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  counter: {
    color: semantic.primary,
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 17,
    lineHeight: 26,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  dotActive: {
    width: 18,
    backgroundColor: semantic.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionSpacer: {
    flex: 1,
  },
  nextPageBtn: {
    height: 40,
    justifyContent: 'center',
  },
  nextPageText: {
    fontSize: 12.5,
  },
  ghostBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.primary,
  },
  btnText: {
    fontSize: 14,
  },
});
