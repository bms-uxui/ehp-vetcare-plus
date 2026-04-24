import { useState, forwardRef, ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { radii, semantic, spacing } from '../theme';
import Text from './Text';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  containerStyle?: ViewStyle;
};

const Input = forwardRef<TextInput, Props>(function Input(
  { label, hint, error, leftElement, rightElement, containerStyle, onFocus, onBlur, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {leftElement}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={semantic.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightElement}
      </View>
      {(error || hint) && (
        <Text
          variant="caption"
          color={error ? '#E14B4B' : semantic.textMuted}
          style={styles.meta}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: semantic.surface,
    borderWidth: 1.5,
    borderColor: semantic.border,
    borderRadius: radii.lg,
  },
  fieldFocused: {
    borderColor: semantic.primary,
  },
  fieldError: {
    borderColor: '#E14B4B',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: semantic.textPrimary,
    paddingVertical: spacing.md,
  },
  meta: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
