import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as LucideIcons from 'lucide-react-native';
import Icon from './Icon';

type IconName = keyof typeof LucideIcons;

type Step = { icon: IconName };

type Props = {
  steps: Step[];
  currentStep: number;
};

export default function StepProgress({ steps, currentStep }: Props) {
  const progress = useSharedValue(currentStep);

  useEffect(() => {
    progress.value = withTiming(currentStep, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStep, progress]);

  return (
    <View style={styles.card}>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={[styles.cell, !isLast && { flex: 1 }]}>
            <StepDot index={i} progress={progress} icon={s.icon} />
            {!isLast && <StepLine index={i} progress={progress} />}
          </View>
        );
      })}
    </View>
  );
}

function StepDot({
  index,
  progress,
  icon,
}: {
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  icon: IconName;
}) {
  const dotStyle = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, progress.value - index + 0.5));
    return {
      backgroundColor: interpolateColor(t, [0, 1], ['#E6E6E8', '#9F5266']),
    };
  });
  const iconColorStyle = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, progress.value - index + 0.5));
    return { opacity: 0.5 + t * 0.5 };
  });
  return (
    <Animated.View style={[styles.dot, dotStyle]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.iconCenter}>
          <Icon name={icon} size={12} color="#9A9AA0" strokeWidth={2.4} />
        </View>
      </View>
      <Animated.View
        style={[StyleSheet.absoluteFill, iconColorStyle]}
        pointerEvents="none"
      >
        <View style={styles.iconCenter}>
          <Icon name={icon} size={12} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function StepLine({
  index,
  progress,
}: {
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
}) {
  const lineStyle = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, progress.value - index));
    return {
      backgroundColor: interpolateColor(t, [0, 1], ['#E6E6E8', '#9F5266']),
    };
  });
  return <Animated.View style={[styles.line, lineStyle]} />;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 999,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
  },
});
