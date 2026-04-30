import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { semantic } from '../theme';
import Text from './Text';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  placeholder?: string;
  multiline?: boolean;
  error?: string;
};

export default function TextField({
  label,
  value,
  onChange,
  keyboardType,
  placeholder,
  multiline,
  error,
}: Props) {
  const [focused, setFocused] = useState(false);
  const showError = !!error && !focused;
  const accent = showError ? '#C25450' : semantic.primary;
  return (
    <View style={styles.wrap}>
      <Text
        variant="caption"
        style={[styles.label, (focused || showError) && { color: accent }]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.underline,
          (focused || showError) && {
            borderBottomColor: accent,
            borderBottomWidth: 1.5,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? 'default'}
          placeholder={placeholder}
          placeholderTextColor="#9A9AA0"
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
      </View>
      {showError && (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, paddingTop: 6 },
  label: { fontSize: 12, color: '#6E6E74', fontWeight: '500' },
  underline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
  },
  input: {
    height: 40,
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  inputMultiline: {
    height: undefined,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 6,
    textAlignVertical: 'top',
  },
  error: { fontSize: 11, color: '#C25450', marginTop: 4 },
});
