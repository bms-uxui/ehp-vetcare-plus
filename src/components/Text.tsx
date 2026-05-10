import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';
import { fontFamily, semantic, typography, TypographyVariant } from '../theme';
import { useFontScale } from '../lib/responsive';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
};

// Map RN fontWeight to Prompt variant family (since we load weight-specific families).
const weightToFamily: Record<string, string> = {
  '100': fontFamily.light,
  '200': fontFamily.light,
  '300': fontFamily.light,
  '400': fontFamily.regular,
  '500': fontFamily.medium,
  '600': fontFamily.semibold,
  '700': fontFamily.bold,
  '800': fontFamily.bold,
  '900': fontFamily.bold,
  normal: fontFamily.regular,
  bold: fontFamily.bold,
};

export default function Text({
  variant = 'body',
  color = semantic.textPrimary,
  align,
  weight,
  style,
  children,
  ...rest
}: Props) {
  const fontScale = useFontScale();
  // Android falls back to system Roboto whenever fontWeight is set without a
  // matching fontFamily. Inspect the incoming style for fontWeight, translate
  // it to the right Google Sans family, and strip the raw fontWeight so iOS
  // doesn't get a duplicate either.
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight: styleWeight, fontFamily: styleFamily, ...restStyle } = flat;
  const effectiveWeight = weight ?? styleWeight;
  const resolvedFamily =
    styleFamily ??
    (effectiveWeight !== undefined
      ? weightToFamily[String(effectiveWeight)] ?? fontFamily.regular
      : undefined);
  const familyStyle = resolvedFamily ? { fontFamily: resolvedFamily } : undefined;

  // Compute final fontSize/lineHeight from variant + inline override, then
  // scale by tablet factor so iPad gets uniformly larger typography.
  const variantStyle = typography[variant];
  const baseSize =
    typeof restStyle.fontSize === 'number' ? restStyle.fontSize : variantStyle.fontSize;
  const baseLine =
    typeof restStyle.lineHeight === 'number' ? restStyle.lineHeight : variantStyle.lineHeight;
  const scaled =
    fontScale !== 1
      ? {
          fontSize: baseSize !== undefined ? baseSize * fontScale : undefined,
          lineHeight: baseLine !== undefined ? baseLine * fontScale : undefined,
        }
      : undefined;

  return (
    <RNText
      style={[
        variantStyle,
        { color },
        align && { textAlign: align },
        familyStyle,
        restStyle,
        scaled,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
