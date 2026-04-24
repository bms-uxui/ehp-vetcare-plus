import * as LucideIcons from 'lucide-react-native';

type Props = {
  name: keyof typeof LucideIcons;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
};

export default function Icon({
  name,
  size = 20,
  color = '#2E2E33',
  strokeWidth = 2,
  fill,
}: Props) {
  const Component = (LucideIcons as any)[name];
  if (!Component) return null;
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={fill ?? 'none'}
    />
  );
}
