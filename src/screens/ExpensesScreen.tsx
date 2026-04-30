import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Icon,
  IconButton,
  PetAvatar,
  StickyAppBar,
  Text,
} from '../components';
import { semantic, spacing } from '../theme';
import {
  mockExpenses,
  categoryMeta,
  sumByCategory,
  monthKey,
  fmtBaht,
  thDate,
  thMonth,
  DEFAULT_MONTHLY_BUDGET,
  ExpenseCategory,
  Expense,
} from '../data/expenses';

type Props = NativeStackScreenProps<RootStackParamList, 'Expenses'>;

const HERO_IMAGE = require('../../assets/illustrations/pet-budget.png');
const SUMMARY_IMAGE = require('../../assets/illustrations/expense-cat.png');

const CATEGORY_ILLUSTRATIONS: Record<ExpenseCategory, number> = {
  food: require('../../assets/illustrations/cat-food.png'),
  treatment: require('../../assets/illustrations/cat-treatment.png'),
  grooming: require('../../assets/illustrations/cat-grooming.png'),
  supplies: require('../../assets/illustrations/cat-supplies.png'),
  other: require('../../assets/illustrations/cat-another.png'),
};

export default function ExpensesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const months = useMemo(() => {
    const set = new Set(mockExpenses.map((e) => monthKey(e.dateISO)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    months[0] ?? '2026-04',
  );
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Budget is editable — tap summary card to open the sheet. Stepper inside
  // adjusts the working value by 100 baht per tap.
  const BUDGET_STEP = 100;
  const [budget, setBudget] = useState<number>(DEFAULT_MONTHLY_BUDGET);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(DEFAULT_MONTHLY_BUDGET);
  const budgetInputRef = useRef<TextInput>(null);

  const openBudgetEdit = () => {
    setBudgetInput(budget);
    setBudgetEditOpen(true);
    // Focus the input after the iOS pageSheet slide-up animation completes
    // (~300ms). autoFocus alone is unreliable inside Modal on iOS.
    setTimeout(() => budgetInputRef.current?.focus(), 350);
  };
  const closeBudgetEdit = () => {
    Keyboard.dismiss();
    setBudgetEditOpen(false);
  };
  const saveBudget = () => {
    if (budgetInput > 0) setBudget(budgetInput);
    closeBudgetEdit();
  };
  const decBudget = () =>
    setBudgetInput((v) => Math.max(0, v - BUDGET_STEP));
  const incBudget = () => setBudgetInput((v) => v + BUDGET_STEP);

  const expensesThisMonth = mockExpenses.filter(
    (e) => monthKey(e.dateISO) === selectedMonth,
  );
  const total = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = sumByCategory(expensesThisMonth);
  const percent = budget > 0 ? Math.min(total / budget, 1) : 0;
  const overBudget = total > budget;

  const sortedCategories = (Object.keys(categoryMeta) as ExpenseCategory[])
    .filter((c) => byCategory[c] > 0)
    .sort((a, b) => byCategory[b] - byCategory[a]);

  const sortedExpenses = [...expensesThisMonth].sort((a, b) =>
    b.dateISO.localeCompare(a.dateISO),
  );

  // Animated summary bar — fills from 0 to current percent on mount and
  // whenever the value changes (budget edited / month switched).
  const summaryProgress = useSharedValue(0);
  useEffect(() => {
    summaryProgress.value = withTiming(Math.min(percent, 1), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent]);
  const summaryFillStyle = useAnimatedStyle(() => ({
    width: `${summaryProgress.value * 100}%`,
  }));

  return (
    <View style={styles.root}>
      <AppBackground />

      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={60}
        fadeEndAt={120}
        title="ค่าใช้จ่าย"
        leading={{
          icon: 'ChevronLeft',
          onPress: () => navigation.goBack(),
          accessibilityLabel: 'ย้อนกลับ',
        }}
        trailing={{
          icon: 'Plus',
          onPress: () => navigation.navigate('AddExpense'),
          accessibilityLabel: 'บันทึกค่าใช้จ่าย',
        }}
      />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero — large title + description */}
        <View style={styles.hero}>
          <Text variant="h1" style={styles.heroTitle}>
            ค่าใช้จ่าย
          </Text>
          <Text
            weight="500"
            style={styles.heroDescription}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            สรุปรายเดือนและงบประมาณ
          </Text>
        </View>

        {/* Month chip filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {months.map((m) => (
            <Pressable
              key={m}
              onPress={() => setSelectedMonth(m)}
              style={({ pressed }) => [
                styles.chip,
                selectedMonth === m && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedMonth === m && styles.chipTextActive,
                ]}
              >
                {thMonth(m)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Summary card with pet illustration — tap to edit budget */}
        <View style={styles.section}>
          <Pressable
            onPress={openBudgetEdit}
            style={({ pressed }) => [
              styles.summaryCardShadow,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
            ]}
          >
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={['#9F5266', '#DDA8B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.summaryContent}>
                <Text weight="500" style={styles.summaryLabel}>
                  ค่าใช้จ่ายเดือนนี้
                </Text>
                <View style={styles.summaryAmountBlock}>
                  <Text weight="500" style={styles.summaryAmount}>
                    {fmtBaht(total)}
                  </Text>
                  <Text weight="500" style={styles.summaryBudget}>
                    จากงบ {fmtBaht(budget)}
                  </Text>
                </View>
                <View style={styles.summaryBar}>
                  <View pointerEvents="none" style={styles.summaryBarInset} />
                  <Animated.View
                    style={[styles.summaryBarFill, summaryFillStyle]}
                  >
                    <LinearGradient
                      colors={
                        overBudget
                          ? ['#FFE4DA', '#E8B5A3']
                          : ['#FFFFFF', '#F0DFE3']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      pointerEvents="none"
                      style={styles.summaryBarSheen}
                    />
                  </Animated.View>
                </View>
                <View style={styles.summaryFooter}>
                  <Text weight="500" style={styles.summaryFooterText}>
                    {Math.round(percent * 100)}% ของงบ
                  </Text>
                  <Text
                    weight="500"
                    style={[
                      styles.summaryFooterText,
                      overBudget && { color: '#C25450' },
                    ]}
                  >
                    {overBudget
                      ? `เกินงบ ${fmtBaht(total - budget)}`
                      : `คงเหลือ ${fmtBaht(budget - total)}`}
                  </Text>
                </View>
              </View>
              <View pointerEvents="none" style={styles.summaryImageCol}>
                <Image
                  source={SUMMARY_IMAGE}
                  style={styles.summaryImageInner}
                  resizeMode="cover"
                />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Category breakdown */}
        <View style={styles.section}>
          <Text weight="500" style={styles.sectionTitle}>
            หมวดหมู่
          </Text>
          <View style={styles.groupCard}>
            {sortedCategories.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text weight="500" style={styles.emptyText}>
                  ยังไม่มีรายการเดือนนี้
                </Text>
              </View>
            ) : (
              sortedCategories.map((cat, idx) => {
                const meta = categoryMeta[cat];
                const amount = byCategory[cat];
                const pct = total > 0 ? amount / total : 0;
                const isLast = idx === sortedCategories.length - 1;
                return (
                  <CategoryRow
                    key={cat}
                    label={meta.label}
                    icon={meta.icon}
                    color={meta.color}
                    iconBg={meta.bg}
                    amount={amount}
                    pct={pct}
                    isLast={isLast}
                    delay={idx * 80}
                  />
                );
              })
            )}
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text weight="500" style={styles.sectionTitle}>
            รายการ ({sortedExpenses.length})
          </Text>
          <View style={styles.txList}>
            {sortedExpenses.length === 0 ? (
              <View style={styles.txCard}>
                <Text weight="500" style={styles.emptyText}>
                  ยังไม่มีรายการ
                </Text>
              </View>
            ) : (
              sortedExpenses.map((e) => (
                <SwipeableExpenseRow
                  key={e.id}
                  expense={e}
                  onPress={() => setSelectedExpense(e)}
                  onEdit={() => navigation.navigate('AddExpense')}
                  onDelete={() =>
                    Alert.alert(
                      'ลบรายการ',
                      `ต้องการลบ "${e.title}" ใช่ไหม?`,
                      [
                        { text: 'ยกเลิก', style: 'cancel' },
                        { text: 'ลบ', style: 'destructive' },
                      ],
                    )
                  }
                />
              ))
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Budget edit — iOS native pageSheet (same pattern as CheckoutScreen
          payment sheet): slides up, native grabber + swipe-down to dismiss */}
      <Modal
        visible={budgetEditOpen}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={closeBudgetEdit}
      >
        <View style={styles.iosSheetRoot}>
          {/* Header — title centered + glass X close on the right */}
          <View style={styles.payHeader}>
            <Text weight="500" style={styles.payHeaderTitle}>
              ตั้งงบรายเดือน
            </Text>
            <Pressable
              onPress={closeBudgetEdit}
              hitSlop={8}
              accessibilityLabel="ปิด"
              style={styles.payHeaderClose}
            >
              <View style={styles.payHeaderCloseBtn}>
                <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
              </View>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBodyScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Banner — preview with soft rose gradient + pet illustration */}
            <View style={styles.sheetSection}>
              <View style={styles.sheetBanner}>
                <LinearGradient
                  colors={['#F5E4E7', '#FBF3F4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.sheetBannerContent}>
                  <Text weight="500" style={styles.sheetBannerLabel}>
                    วางแผนค่าใช้จ่าย
                  </Text>
                  <Text
                    weight="700"
                    style={styles.sheetBannerHeadline}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    ตั้งงบเพื่อน้องที่คุณรัก
                  </Text>
                  <Text weight="500" style={styles.sheetBannerHint}>
                    เราจะติดตามทุกหมวดและแจ้งเตือนเมื่อใกล้ครบงบ
                    ช่วยให้คุณดูแลน้องได้อย่างไม่ขาดตก
                  </Text>
                </View>
                <View pointerEvents="none" style={styles.sheetBannerImageWrap}>
                  <Image
                    source={HERO_IMAGE}
                    style={styles.summaryImageInner}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            {/* Stepper — −100 / value / +100 */}
            <View style={styles.sheetSection}>
              <View style={styles.stepperCard}>
                <IconButton
                  icon="Minus"
                  size="md"
                  onPress={decBudget}
                  disabled={budgetInput <= 0}
                  accessibilityLabel="ลดงบ 100 บาท"
                />
                <TextInput
                  ref={budgetInputRef}
                  value={budgetInput ? budgetInput.toLocaleString('en-US') : ''}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9]/g, '');
                    const n = cleaned === '' ? 0 : parseInt(cleaned, 10);
                    if (!isNaN(n)) setBudgetInput(n);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={semantic.textMuted}
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  style={styles.stepperInput}
                  accessibilityLabel="จำนวนงบ"
                />
                <IconButton
                  icon="Plus"
                  size="md"
                  onPress={incBudget}
                  accessibilityLabel="เพิ่มงบ 100 บาท"
                />
              </View>
            </View>
          </ScrollView>

          {/* Pinned bottom action bar */}
          <View
            style={[
              styles.sheetActions,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <Pressable
              onPress={closeBudgetEdit}
              style={({ pressed }) => [
                styles.sheetBtn,
                styles.sheetBtnSecondary,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text weight="500" style={styles.sheetBtnSecondaryText}>
                ยกเลิก
              </Text>
            </Pressable>
            <Pressable
              onPress={saveBudget}
              style={({ pressed }) => [
                styles.sheetBtn,
                styles.sheetBtnPrimary,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text weight="500" style={styles.sheetBtnPrimaryText}>
                บันทึก
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Expense detail — iOS native pageSheet, opens when a tx row is tapped */}
      <Modal
        visible={selectedExpense !== null}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => setSelectedExpense(null)}
      >
        <View style={styles.iosSheetRoot}>
          {/* Header — title + glass X close on the right */}
          <View style={styles.payHeader}>
            <Text weight="500" style={styles.payHeaderTitle}>
              รายละเอียดรายการ
            </Text>
            <Pressable
              onPress={() => setSelectedExpense(null)}
              hitSlop={8}
              accessibilityLabel="ปิด"
              style={styles.payHeaderClose}
            >
              <View style={styles.payHeaderCloseBtn}>
                <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
              </View>
            </Pressable>
          </View>

          {selectedExpense && (
            <ScrollView
              contentContainerStyle={styles.detailScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero — amount + category chip + illustration */}
              <View style={styles.detailAmountCard}>
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    categoryMeta[selectedExpense.category].bg,
                    categoryMeta[selectedExpense.category].color + '33',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.detailAmountTextCol}>
                  <View
                    style={[
                      styles.detailCategoryChip,
                      {
                        backgroundColor:
                          categoryMeta[selectedExpense.category].color + '22',
                      },
                    ]}
                  >
                    <Icon
                      name={categoryMeta[selectedExpense.category].icon as any}
                      size={14}
                      color={categoryMeta[selectedExpense.category].color}
                      strokeWidth={2.2}
                    />
                    <Text
                      weight="600"
                      style={[
                        styles.detailCategoryLabel,
                        { color: categoryMeta[selectedExpense.category].color },
                      ]}
                    >
                      {categoryMeta[selectedExpense.category].label}
                    </Text>
                  </View>
                  <Text weight="700" style={styles.detailAmount}>
                    {fmtBaht(selectedExpense.amount)}
                  </Text>
                  <Text style={styles.detailTitle} numberOfLines={2}>
                    {selectedExpense.title}
                  </Text>
                </View>
                <View pointerEvents="none" style={styles.detailIllustrationWrap}>
                  <Image
                    source={CATEGORY_ILLUSTRATIONS[selectedExpense.category]}
                    style={styles.detailIllustration}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Info rows */}
              <View style={styles.detailGroup}>
                <View style={styles.detailRow}>
                  <View style={styles.detailRowIcon}>
                    <Icon
                      name="Calendar"
                      size={16}
                      color={semantic.primary}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View style={styles.detailRowBody}>
                    <Text style={styles.detailRowLabel}>วันที่</Text>
                    <Text weight="600" style={styles.detailRowValue}>
                      {thDate(selectedExpense.dateISO)}
                    </Text>
                  </View>
                </View>

                {selectedExpense.petId && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <PetAvatar
                        petId={selectedExpense.petId}
                        fallbackEmoji={selectedExpense.petEmoji}
                        size={32}
                        backgroundColor="#F2F2F3"
                      />
                      <View style={styles.detailRowBody}>
                        <Text style={styles.detailRowLabel}>สัตว์เลี้ยง</Text>
                        <Text weight="600" style={styles.detailRowValue}>
                          {selectedExpense.petName ?? 'ไม่ระบุ'}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {selectedExpense.note && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <View style={styles.detailRowIcon}>
                        <Icon
                          name="FileText"
                          size={16}
                          color={semantic.primary}
                          strokeWidth={2.2}
                        />
                      </View>
                      <View style={styles.detailRowBody}>
                        <Text style={styles.detailRowLabel}>หมายเหตุ</Text>
                        <Text style={styles.detailRowValue}>
                          {selectedExpense.note}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Action buttons — Edit + Delete */}
              <View style={styles.detailActions}>
                <Pressable
                  onPress={() => {
                    setSelectedExpense(null);
                    navigation.navigate('AddExpense');
                  }}
                  style={({ pressed }) => [
                    styles.detailActionBtn,
                    styles.detailEditBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Icon
                    name="Pencil"
                    size={16}
                    color={semantic.primary}
                    strokeWidth={2.2}
                  />
                  <Text
                    weight="600"
                    style={[
                      styles.detailActionText,
                      { color: semantic.primary },
                    ]}
                  >
                    แก้ไข
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'ลบรายการ',
                      `ต้องการลบ "${selectedExpense.title}" ใช่ไหม?`,
                      [
                        { text: 'ยกเลิก', style: 'cancel' },
                        {
                          text: 'ลบ',
                          style: 'destructive',
                          onPress: () => setSelectedExpense(null),
                        },
                      ],
                    );
                  }}
                  style={({ pressed }) => [
                    styles.detailActionBtn,
                    styles.detailDeleteBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Icon
                    name="Trash2"
                    size={16}
                    color="#C25450"
                    strokeWidth={2.2}
                  />
                  <Text
                    weight="600"
                    style={[styles.detailActionText, { color: '#C25450' }]}
                  >
                    ลบ
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Swipeable transaction row — mirrors CartScreen pattern ---------- */

const ACTIONS_W = 200; // 56 each × 3 buttons (details, edit, delete) + spacing

function SwipeableExpenseRow({
  expense,
  onPress,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = categoryMeta[expense.category];
  const translateX = useSharedValue(0);
  const isOpenRef = useRef(false);

  const closeSwipe = () => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    isOpenRef.current = false;
  };
  const openSwipe = () => {
    translateX.value = withSpring(-ACTIONS_W, { damping: 18, stiffness: 220 });
    isOpenRef.current = true;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
      onPanResponderMove: (_, g) => {
        const start = isOpenRef.current ? -ACTIONS_W : 0;
        const next = start + g.dx;
        translateX.value = Math.max(-ACTIONS_W * 1.3, Math.min(0, next));
      },
      onPanResponderRelease: (_, g) => {
        const start = isOpenRef.current ? -ACTIONS_W : 0;
        const final = start + g.dx;
        if (final < -ACTIONS_W * 0.3 || g.vx < -0.3) openSwipe();
        else closeSwipe();
      },
      onPanResponderTerminate: (_, g) => {
        const start = isOpenRef.current ? -ACTIONS_W : 0;
        const final = start + g.dx;
        if (final < -ACTIONS_W * 0.3) openSwipe();
        else closeSwipe();
      },
    }),
  ).current;

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Staggered reveal: Delete (rightmost, first) → Edit → Details (leftmost, last)
  const delBtnStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, -translateX.value / ACTIONS_W);
    return {
      opacity: interpolate(progress, [0, 0.4, 1], [0, 0.4, 1], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(progress, [0, 0.5, 1], [0.3, 0.75, 1], Extrapolation.CLAMP) },
        { translateX: interpolate(progress, [0, 1], [70, 0], Extrapolation.CLAMP) },
      ],
    };
  });
  const editBtnStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, -translateX.value / ACTIONS_W);
    return {
      opacity: interpolate(progress, [0.15, 0.55, 1], [0, 0.4, 1], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(progress, [0.15, 0.65, 1], [0.3, 0.75, 1], Extrapolation.CLAMP) },
        { translateX: interpolate(progress, [0, 1], [50, 0], Extrapolation.CLAMP) },
      ],
    };
  });
  const infoBtnStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, -translateX.value / ACTIONS_W);
    return {
      opacity: interpolate(progress, [0.3, 0.7, 1], [0, 0.4, 1], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(progress, [0.3, 0.8, 1], [0.3, 0.75, 1], Extrapolation.CLAMP) },
        { translateX: interpolate(progress, [0, 1], [30, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const handlePress = () => {
    if (isOpenRef.current) {
      closeSwipe();
      return;
    }
    onPress();
  };

  return (
    <View style={styles.swipeContainer} {...panResponder.panHandlers}>
      <View style={styles.swipeActions} pointerEvents="box-none">
        <Animated.View style={[styles.actionSlot, infoBtnStyle]}>
          <Pressable
            onPress={() => {
              closeSwipe();
              onPress();
            }}
            style={({ pressed }) => [
              styles.actionCircle,
              styles.actionCircleInfo,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
            ]}
            accessibilityLabel="ดูรายละเอียด"
          >
            <Icon name="Info" size={20} color="#1A1A1A" strokeWidth={2.4} />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.actionSlot, editBtnStyle]}>
          <Pressable
            onPress={() => {
              closeSwipe();
              onEdit();
            }}
            style={({ pressed }) => [
              styles.actionCircle,
              styles.actionCircleEdit,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
            ]}
            accessibilityLabel="แก้ไข"
          >
            <Icon name="Pencil" size={20} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.actionSlot, delBtnStyle]}>
          <Pressable
            onPress={() => {
              closeSwipe();
              onDelete();
            }}
            style={({ pressed }) => [
              styles.actionCircle,
              styles.actionCircleDel,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
            ]}
            accessibilityLabel="ลบ"
          >
            <Icon name="Trash2" size={20} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View style={swipeStyle}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.txCard,
            pressed && { opacity: 0.85 },
          ]}
        >
          <PetAvatar
            petId={expense.petId}
            fallbackEmoji={expense.petEmoji}
            size={40}
            backgroundColor="#F2F2F3"
          />
          <View style={styles.txBody}>
            <View style={styles.txTopRow}>
              <Text style={styles.txTitle} numberOfLines={1}>
                {expense.title}
              </Text>
              <Text weight="600" style={styles.txAmount}>
                {fmtBaht(expense.amount)}
              </Text>
            </View>
            <View style={styles.txMetaRow}>
              <View style={styles.txMetaItem}>
                <Icon
                  name="Calendar"
                  size={11}
                  color={semantic.textMuted}
                  strokeWidth={2.2}
                />
                <Text style={styles.txMetaText}>{thDate(expense.dateISO)}</Text>
              </View>
              <View style={styles.txMetaItem}>
                <Icon
                  name={meta.icon as any}
                  size={11}
                  color={meta.color}
                  strokeWidth={2.2}
                />
                <Text style={styles.txMetaText}>{meta.label}</Text>
              </View>
            </View>
          </View>
          <Icon
            name="ChevronRight"
            size={16}
            color={semantic.textMuted}
            strokeWidth={2}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/* ---------- Category row with animated mini progress bar ---------- */

function CategoryRow({
  label,
  icon,
  color,
  iconBg,
  amount,
  pct,
  isLast,
  delay = 0,
}: {
  label: string;
  icon: string;
  color: string;
  iconBg: string;
  amount: number;
  pct: number;
  isLast: boolean;
  delay?: number;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct, delay]);

  // Slight stagger so bars animate in one after another
  useEffect(() => {
    const t = setTimeout(() => {
      width.value = withTiming(pct, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(t);
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.groupRow, isLast && styles.groupRowLast]}>
      <View style={[styles.catIcon, { backgroundColor: iconBg }]}>
        <Icon
          name={icon as any}
          size={20}
          color={color}
          strokeWidth={2.2}
        />
      </View>
      <View style={styles.groupRowBody}>
        <View style={styles.groupRowTop}>
          <Text weight="500" style={styles.groupRowLabel}>
            {label}
          </Text>
          <Text weight="500" style={styles.groupRowAmount}>
            {fmtBaht(amount)}
          </Text>
        </View>
        <View style={styles.miniBar}>
          <View pointerEvents="none" style={styles.miniBarInset} />
          <Animated.View
            style={[
              styles.miniBarFill,
              { backgroundColor: color },
              fillStyle,
            ]}
          >
            <View pointerEvents="none" style={styles.miniBarSheen} />
          </Animated.View>
        </View>
        <Text style={styles.groupRowPct}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const SECTION_PAD = 16;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semantic.background,
  },
  scroll: {
    paddingBottom: 120,
  },

  // Hero header — large title + description
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 48,
    color: '#1A1A1A',
    letterSpacing: 0,
  },
  heroDescription: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Month chips — horizontal scroll
  chipsScroll: {
    paddingHorizontal: SECTION_PAD,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 1000,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  chipActive: {
    backgroundColor: semantic.primary,
  },
  chipText: {
    fontSize: 13,
    color: '#3C3C43',
    letterSpacing: -0.2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Sections
  section: {
    paddingHorizontal: SECTION_PAD,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Summary card — Figma node 488:723. Light gray bg, content + image
  // arranged in a row, image fills the right 91px column.
  summaryCardShadow: {
    borderRadius: 16,
    backgroundColor: '#F5E4E7',
    shadowColor: '#9F5266',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#9F5266',
    borderRadius: 16,
    overflow: 'hidden',
    gap: 10,
  },
  summaryContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summaryAmountBlock: {
    gap: 4,
  },
  summaryAmount: {
    fontSize: 22,
    lineHeight: 30,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  summaryBudget: {
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  summaryBar: {
    height: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.18)',
    overflow: 'hidden',
    position: 'relative',
  },
  // Top inset shadow — gives the track a recessed feel
  summaryBarInset: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  // Glossy highlight near the top of the fill — adds the convex sheen
  summaryBarSheen: {
    position: 'absolute',
    top: 1.5,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryFooterText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.95)',
  },
  summaryImageCol: {
    width: 91,
    aspectRatio: 145 / 160,
    alignSelf: 'flex-end',
  },
  summaryImageInner: {
    width: '100%',
    height: '100%',
  },

  // Category group card (multiple rows in one rounded container)
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0E6E8',
  },
  groupRowLast: {
    borderBottomWidth: 0,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRowBody: {
    flex: 1,
    gap: 4,
  },
  groupRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  groupRowLabel: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  groupRowAmount: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  miniBar: {
    height: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginTop: 2,
    position: 'relative',
  },
  miniBarInset: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  miniBarSheen: {
    position: 'absolute',
    top: 1.5,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  groupRowPct: {
    fontSize: 10,
    color: '#6E6E74',
  },

  // Transaction list — each row is its own gray card
  txList: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  txAvatar: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#F2F2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txAvatarEmoji: {
    fontSize: 22,
  },
  txBody: {
    flex: 1,
    gap: 4,
  },
  txTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txTitle: {
    fontSize: 12,
    color: '#1A1A1A',
    flex: 1,
  },
  txAmount: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txMetaText: {
    fontSize: 10,
    color: '#9A9AA0',
  },

  // Empty
  emptyRow: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: semantic.textSecondary,
  },

  // iOS native pageSheet root
  iosSheetRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  payHeader: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  payHeaderTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  payHeaderClose: {
    position: 'absolute',
    right: 16,
    top: 8,
  },
  payHeaderCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sheetBodyScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  // Sheet header — title centered + X close button on the right
  sheetHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    letterSpacing: -0.2,
    maxWidth: '60%',
    textAlign: 'center',
  },
  sheetClose: {
    position: 'absolute',
    right: 0,
    top: 6,
  },
  sheetSection: {
    paddingTop: 4,
  },

  // Banner — rose gradient + pet illustration
  sheetBanner: {
    flexDirection: 'row',
    minHeight: 120,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#5E303C',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sheetBannerContent: {
    flex: 1,
    gap: 4,
  },
  sheetBannerLabel: {
    fontSize: 11,
    color: semantic.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sheetBannerHeadline: {
    fontSize: 18,
    lineHeight: 26,
    color: '#1A1A1A',
    letterSpacing: 0,
    marginTop: 2,
  },
  sheetBannerHint: {
    fontSize: 11,
    lineHeight: 15,
    color: '#6E6E74',
    marginTop: 4,
  },
  sheetBannerImageWrap: {
    width: 100,
    height: 120,
    marginRight: -12,
  },

  // Stepper card — −100 / value / +100
  stepperCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperValue: {
    fontSize: 20,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  stepperInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
    textAlign: 'center',
    paddingVertical: 0,
    marginHorizontal: 8,
  },

  // Bottom action buttons (Cancel / Save)
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnSecondary: {
    backgroundColor: semantic.surface,
    borderWidth: 1.5,
    borderColor: semantic.primary,
    shadowColor: '#5E303C',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sheetBtnSecondaryText: {
    fontSize: 16,
    color: semantic.primary,
  },
  sheetBtnPrimary: {
    backgroundColor: semantic.primary,
  },
  sheetBtnPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Expense detail sheet
  detailScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16,
  },
  detailAmountCard: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingRight: 130,
    overflow: 'hidden',
    position: 'relative',
  },
  detailAmountTextCol: {
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIllustrationWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 130,
    height: 150,
  },
  detailIllustration: {
    width: '100%',
    height: '100%',
  },
  detailCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  detailCategoryLabel: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  detailAmount: {
    fontSize: 36,
    lineHeight: 44,
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  detailTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1A1A',
  },
  detailGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE7E9',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  detailRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRowBody: {
    flex: 1,
    gap: 2,
  },
  detailRowLabel: {
    fontSize: 11,
    color: '#9A9AA0',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailRowValue: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFE7E9',
    marginLeft: 44,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailEditBtn: {
    backgroundColor: semantic.primaryMuted,
    borderColor: semantic.primary + '33',
  },
  detailDeleteBtn: {
    backgroundColor: '#FBE9E8',
    borderColor: '#C25450' + '33',
  },
  detailActionText: {
    fontSize: 15,
    letterSpacing: -0.1,
  },

  // Swipe-to-reveal — outer container clips overflow, action buttons sit underneath
  swipeContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  swipeActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTIONS_W,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  actionSlot: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  actionCircleInfo: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D4',
  },
  actionCircleEdit: {
    backgroundColor: semantic.primary,
  },
  actionCircleDel: {
    backgroundColor: '#C25450',
  },
});
