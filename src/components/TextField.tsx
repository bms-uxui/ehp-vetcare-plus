import { forwardRef, ReactNode, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { semantic } from '../theme';
import Text from './Text';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: TextInputProps['keyboardType'];
  placeholder?: string;
  multiline?: boolean;
  error?: string;
  /** Mask input (password). */
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  /** Right-side decoration (e.g., a password eye toggle). */
  trailing?: ReactNode;
};

const TextField = forwardRef<TextInput, Props>(function TextField(
  {
    label,
    value,
    onChange,
    keyboardType,
    placeholder,
    multiline,
    error,
    secureTextEntry,
    autoCapitalize,
    autoCorrect,
    returnKeyType,
    onSubmitEditing,
    trailing,
  },
  ref,
) {
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
          ref={ref}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? 'default'}
          placeholder={placeholder}
          placeholderTextColor="#9A9AA0"
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            !!trailing && styles.inputWithTrailing,
          ]}
        />
        {trailing}
      </View>
      {showError && (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { gap: 4, paddingTop: 6 },
  label: { fontSize: 12, color: '#6E6E74', fontWeight: '500' },
  underline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  inputWithTrailing: {
    paddingRight: 8,
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
