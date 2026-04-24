import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { semantic, spacing } from '../theme';
import AppBackground from './AppBackground';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  backgroundColor?: string;
  tabBarSpace?: boolean;
  // Legacy prop — accepted but ignored.
  gradient?: 'app' | 'soft' | 'none';
};

const TAB_BAR_SPACE = 110;

export default function Screen({
  children,
  scroll = false,
  keyboardAvoiding = false,
  padded = true,
  edges = ['top'],
  style,
  backgroundColor = semantic.background,
  tabBarSpace = false,
}: Props) {
  const contentStyle = [
    padded && styles.padded,
    tabBarSpace && { paddingBottom: TAB_BAR_SPACE },
    style,
  ];

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View style={[styles.flex, { backgroundColor }]}>
      <AppBackground />
      <SafeAreaView style={styles.flex} edges={edges}>
        {wrapped}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});
