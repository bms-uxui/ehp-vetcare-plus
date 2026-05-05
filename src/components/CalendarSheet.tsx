import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import Text from './Text';
import { semantic, spacing } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  visible: boolean;
  value: Date | null;
  onChange: (d: Date) => void;
  onClose: () => void;
  /** Earliest selectable date (inclusive). Defaults to today. */
  minDate?: Date;
};

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(viewMonth: Date): { date: Date; isOtherMonth: boolean }[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: { date: Date; isOtherMonth: boolean }[] = [];

  // Leading days from previous month
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isOtherMonth: true,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isOtherMonth: false });
  }

  // Trailing days to fill 6 rows × 7 cols
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay++), isOtherMonth: true });
  }

  return cells;
}

export default function CalendarSheet({
  visible,
  value,
  onChange,
  onClose,
  minDate,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const initialMonth = useMemo(() => value ?? new Date(), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const [pickerMode, setPickerMode] = useState<'date' | 'year'>('date');
  // Anchor year for the year grid (renders 12 years starting from this year)
  const [yearGridStart, setYearGridStart] = useState<number>(
    () => Math.floor(initialMonth.getFullYear() / 12) * 12,
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const min = useMemo(() => (minDate ? startOfDay(minDate) : null), [minDate]);

  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goPrev = () => {
    if (pickerMode === 'year') {
      setYearGridStart((y) => y - 12);
    } else {
      setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }
  };
  const goNext = () => {
    if (pickerMode === 'year') {
      setYearGridStart((y) => y + 12);
    } else {
      setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }
  };

  const toggleMode = () => {
    if (pickerMode === 'date') {
      setYearGridStart(Math.floor(viewMonth.getFullYear() / 12) * 12);
      setPickerMode('year');
    } else {
      setPickerMode('date');
    }
  };

  const onPickYear = (year: number) => {
    setViewMonth((m) => new Date(year, m.getMonth(), 1));
    setPickerMode('date');
  };

  const handleSelect = (d: Date) => {
    onChange(d);
    onClose();
  };

  const yearLabel =
    pickerMode === 'year'
      ? `${yearGridStart} - ${yearGridStart + 11}`
      : monthLabel;

  // Manual translateY — controls both entry/exit and pan-to-dismiss.
  // Avoids fighting Reanimated layout animations.
  const SHEET_HIDDEN = 800;
  const ty = useSharedValue(SHEET_HIDDEN);
  useEffect(() => {
    if (visible) {
      ty.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 });
    } else {
      ty.value = SHEET_HIDDEN;
    }
  }, [visible, ty]);
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) ty.value = g.dy;
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.6) {
            ty.value = withTiming(SHEET_HIDDEN, { duration: 220 }, (done) => {
              if (done) runOnJS(onClose)();
            });
          } else {
            ty.value = withSpring(0, { damping: 22, stiffness: 200 });
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <AnimatedPressable
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(180)}
        style={[styles.backdrop, isTablet && styles.backdropTablet]}
        onPress={onClose}
      >
        <Animated.View
          entering={isTablet ? FadeIn.duration(200) : undefined}
          exiting={isTablet ? FadeOut.duration(180) : undefined}
          style={!isTablet && sheetAnimStyle}
          {...(isTablet ? {} : panResponder.panHandlers)}
        >
        <Pressable
          onPress={() => {}}
          style={[
            isTablet ? styles.sheetTablet : styles.sheet,
            { paddingBottom: isTablet ? spacing.lg : insets.bottom + spacing.lg },
          ]}
        >
          {!isTablet && <View style={styles.handle} />}

          {/* Header — title (tap to toggle) + chevrons */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={toggleMode}
              hitSlop={6}
              style={styles.headerLeft}
              accessibilityRole="button"
              accessibilityLabel="สลับเลือกปี/เดือน"
            >
              <Text variant="bodyStrong" style={styles.monthLabel}>
                {yearLabel}
              </Text>
              <Icon
                name={pickerMode === 'date' ? 'ChevronDown' : 'ChevronUp'}
                size={20}
                color={semantic.primary}
                strokeWidth={2.5}
              />
            </Pressable>
            <View style={styles.navRow}>
              <Pressable hitSlop={8} onPress={goPrev} style={styles.navBtn}>
                <Icon name="ChevronLeft" size={22} color={semantic.primary} strokeWidth={2.4} />
              </Pressable>
              <Pressable hitSlop={8} onPress={goNext} style={styles.navBtn}>
                <Icon name="ChevronRight" size={22} color={semantic.primary} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>

          {/* Weekday labels — only in date mode */}
          {pickerMode === 'date' && (
            <View style={styles.weekRow}>
              {WEEK_LABELS.map((d) => (
                <View key={d} style={styles.weekCell}>
                  <Text variant="caption" color={semantic.textSecondary} style={styles.weekLabel}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Year grid */}
          {pickerMode === 'year' && (
            <View style={styles.yearGrid}>
              {Array.from({ length: 12 }).map((_, i) => {
                const yr = yearGridStart + i;
                const selected = yr === viewMonth.getFullYear();
                return (
                  <Pressable
                    key={yr}
                    onPress={() => onPickYear(yr)}
                    style={({ pressed }) => [
                      styles.yearCell,
                      pressed && !selected && { opacity: 0.6 },
                    ]}
                  >
                    <View style={[styles.yearBox, selected && styles.yearSelected]}>
                      <Text
                        variant={selected ? 'bodyStrong' : 'body'}
                        style={[styles.yearText, selected && styles.yearSelectedText]}
                      >
                        {yr}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Date grid */}
          {pickerMode === 'date' && (
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              const selected = value ? isSameDay(cell.date, value) : false;
              const isToday = isSameDay(cell.date, today);
              const cellStart = startOfDay(cell.date);
              const isPast = min ? cellStart.getTime() < min.getTime() : false;
              const dim = cell.isOtherMonth || isPast;
              return (
                <Pressable
                  key={i}
                  onPress={isPast ? undefined : () => handleSelect(cell.date)}
                  disabled={isPast}
                  style={({ pressed }) => [
                    styles.cell,
                    pressed && !selected && !isPast && { opacity: 0.6 },
                  ]}
                >
                  <View style={[styles.dayBox, selected && styles.daySelected]}>
                    <Text
                      variant={selected ? 'bodyStrong' : 'body'}
                      style={[
                        styles.dayText,
                        dim && styles.dayDim,
                        isToday && !selected && styles.dayToday,
                        selected && styles.daySelectedText,
                      ]}
                    >
                      {cell.date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          )}
        </Pressable>
        </Animated.View>
      </AnimatedPressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetTablet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    width: 420,
    maxWidth: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#D0D0D4',
    marginTop: 4,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthLabel: {
    fontSize: 17,
    color: semantic.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  navBtn: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 16,
    color: semantic.textPrimary,
  },
  dayDim: {
    color: semantic.textMuted,
  },
  dayToday: {
    color: '#007AFF',
  },
  daySelectedText: {
    color: '#FFFFFF',
  },
  // Year picker
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: spacing.sm,
  },
  yearCell: {
    width: '25%',
    aspectRatio: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  yearBox: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F3',
  },
  yearSelected: {
    backgroundColor: '#007AFF',
  },
  yearText: {
    fontSize: 16,
    color: semantic.textPrimary,
  },
  yearSelectedText: {
    color: '#FFFFFF',
  },
});
