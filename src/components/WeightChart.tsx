import { StyleSheet, View } from 'react-native';
import { radii, semantic, spacing } from '../theme';
import Text from './Text';

type Point = { label: string; value: number };

type Props = {
  points: Point[];
  unit?: string;
  height?: number;
};

/**
 * Simple bar chart for weight history. Pure RN Views — no deps.
 * Bars scale against min/max with a small floor so short bars stay visible.
 */
export default function WeightChart({ points, unit = 'กก.', height = 140 }: Props) {
  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text variant="caption" color={semantic.textMuted}>ยังไม่มีข้อมูล</Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.01);

  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {points.map((p, idx) => {
          const normalized = (p.value - min) / range;
          // Floor at 18% so small differences still read visually.
          const barHeight = 0.18 + normalized * 0.82;
          const isLast = idx === points.length - 1;
          return (
            <View key={idx} style={styles.col}>
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${barHeight * 100}%`,
                      backgroundColor: isLast ? semantic.primary : semantic.primaryMuted,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={isLast ? semantic.onPrimary : semantic.primary}
                    style={styles.value}
                    weight="600"
                  >
                    {p.value}
                  </Text>
                </View>
              </View>
              <Text variant="caption" color={semantic.textMuted} style={styles.label}>
                {p.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.axisRow}>
        <Text variant="overline" color={semantic.textMuted}>หน่วย</Text>
        <Text variant="overline" color={semantic.textMuted}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
    alignItems: 'center',
    paddingTop: 6,
  },
  value: {
    fontSize: 11,
  },
  label: {
    fontSize: 11,
  },
  axisRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
