import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { fontFamily, semantic, typography, TypographyVariant } from '../theme';

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
  const weightStyle =
    weight !== undefined
      ? { fontFamily: weightToFamily[String(weight)] ?? fontFamily.regular }
      : undefined;

  return (
    <RNText
      style={[
        typography[variant],
        { color },
        align && { textAlign: align },
        weightStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
