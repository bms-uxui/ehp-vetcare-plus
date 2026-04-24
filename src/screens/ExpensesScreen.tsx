import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Icon, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';
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
} from '../data/expenses';

type Props = NativeStackScreenProps<RootStackParamList, 'Expenses'>;

export default function ExpensesScreen({ navigation }: Props) {
  // Available months from data.
  const months = useMemo(() => {
    const set = new Set(mockExpenses.map((e) => monthKey(e.dateISO)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] ?? '2026-04');

  const expensesThisMonth = mockExpenses.filter((e) => monthKey(e.dateISO) === selectedMonth);
  const total = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = sumByCategory(expensesThisMonth);
  const budget = DEFAULT_MONTHLY_BUDGET;
  const percent = Math.min(total / budget, 1);
  const overBudget = total > budget;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">ค่าใช้จ่าย</Text>
        <Text variant="body" color={semantic.textSecondary}>
          สรุปรายเดือนและงบประมาณ
        </Text>
      </View>

      {/* Month selector */}
      <View style={styles.monthRow}>
        {months.map((m) => (
          <Pressable
            key={m}
            onPress={() => setSelectedMonth(m)}
            style={[
              styles.monthChip,
              selectedMonth === m && styles.monthChipActive,
            ]}
          >
            <Text
              variant="bodyStrong"
              color={selectedMonth === m ? semantic.onPrimary : semantic.textSecondary}
              style={{ fontSize: 13 }}
            >
              {thMonth(m)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary card */}
      <Card variant="elevated" padding="xl" style={styles.summaryCard}>
        <Text variant="overline" color={semantic.textSecondary}>ยอดรวมเดือนนี้</Text>
        <Text variant="display" color={overBudget ? '#C25450' : semantic.textPrimary} style={styles.totalNumber}>
          {fmtBaht(total)}
        </Text>
        <Text variant="caption" color={semantic.textMuted}>
          จากงบ {fmtBaht(budget)}
        </Text>

        {/* Budget bar */}
        <View style={styles.budgetBar}>
          <View
            style={[
              styles.budgetFill,
              {
                width: `${percent * 100}%`,
                backgroundColor: overBudget ? '#C25450' : semantic.primary,
              },
            ]}
          />
        </View>
        <View style={styles.budgetRow}>
          <Text variant="caption" color={semantic.textSecondary}>
            {Math.round(percent * 100)}% ของงบ
          </Text>
          <Text variant="caption" color={overBudget ? '#C25450' : semantic.textSecondary}>
            {overBudget ? `เกินงบ ${fmtBaht(total - budget)}` : `คงเหลือ ${fmtBaht(budget - total)}`}
          </Text>
        </View>

        {overBudget && (
          <View style={styles.alert}>
            <Icon name="AlertTriangle" size={18} color="#C25450" />
            <Text variant="caption" color="#C25450" style={{ flex: 1 }}>
              ใช้จ่ายเกินงบประมาณที่ตั้งไว้
            </Text>
          </View>
        )}
      </Card>

      {/* Category breakdown */}
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        แยกตามหมวดหมู่
      </Text>
      <Card variant="elevated" padding="lg" style={styles.card}>
        {(Object.keys(categoryMeta) as ExpenseCategory[])
          .filter((c) => byCategory[c] > 0)
          .sort((a, b) => byCategory[b] - byCategory[a])
          .map((cat, idx, arr) => {
            const meta = categoryMeta[cat];
            const amount = byCategory[cat];
            const pct = total > 0 ? amount / total : 0;
            return (
              <View key={cat}>
                <View style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: meta.bg }]}>
                    <Icon name={meta.icon as any} size={18} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catTopRow}>
                      <Text variant="bodyStrong">{meta.label}</Text>
                      <Text variant="bodyStrong">{fmtBaht(amount)}</Text>
                    </View>
                    <View style={styles.catBar}>
                      <View
                        style={[
                          styles.catBarFill,
                          { width: `${pct * 100}%`, backgroundColor: meta.color },
                        ]}
                      />
                    </View>
                    <Text variant="caption" color={semantic.textMuted}>
                      {Math.round(pct * 100)}%
                    </Text>
                  </View>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
      </Card>

      {/* Transactions */}
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        รายการ ({expensesThisMonth.length})
      </Text>
      <View style={styles.list}>
        {expensesThisMonth
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
          .map((e) => {
            const meta = categoryMeta[e.category];
            return (
              <Card key={e.id} variant="elevated" padding="lg">
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: meta.bg }]}>
                    <Icon name={meta.icon as any} size={20} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>{e.title}</Text>
                    <Text variant="caption" color={semantic.textSecondary}>
                      {thDate(e.dateISO)} · {meta.label}
                      {e.petName ? ` · ${e.petEmoji} ${e.petName}` : ''}
                    </Text>
                  </View>
                  <Text variant="bodyStrong">{fmtBaht(e.amount)}</Text>
                </View>
              </Card>
            );
          })}
      </View>

      <View style={styles.addWrap}>
        <Button label="+ บันทึกค่าใช้จ่าย" onPress={() => navigation.navigate('AddExpense')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  monthRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  monthChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  monthChipActive: {
    backgroundColor: semantic.primary,
    borderColor: semantic.primary,
  },
  summaryCard: {
    marginBottom: spacing.xl,
  },
  totalNumber: {
    marginVertical: 4,
  },
  budgetBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: semantic.surfaceMuted,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FDECEC',
    borderRadius: radii.md,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  card: {
    marginBottom: spacing.xl,
  },
  catRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  catBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.surfaceMuted,
    marginTop: 6,
    marginBottom: 2,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: semantic.border,
    marginVertical: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
