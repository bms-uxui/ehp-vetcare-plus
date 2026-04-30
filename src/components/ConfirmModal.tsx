import { Modal, Pressable, StyleSheet, View } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import Icon from './Icon';
import Text from './Text';
import { semantic, spacing } from '../theme';

type IconName = keyof typeof LucideIcons;
type Tone = 'warning' | 'danger' | 'info' | 'primary';

const TONE_MAP: Record<Tone, { fg: string; bg: string }> = {
  warning: { fg: '#B45309', bg: '#FFF6DD' },
  danger: { fg: '#C25450', bg: '#FDECEC' },
  info: { fg: '#1B5A77', bg: '#E1ECF5' },
  primary: { fg: semantic.primary, bg: semantic.primaryMuted },
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  icon?: IconName;
  /** Color of the icon + circle */
  tone?: Tone;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual style of the confirm button */
  confirmTone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  /** Hide the cancel button — single OK button */
  singleAction?: boolean;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  icon,
  tone = 'warning',
  confirmLabel = 'ตกลง',
  cancelLabel = 'ยกเลิก',
  confirmTone = 'primary',
  onConfirm,
  onCancel,
  singleAction = false,
}: Props) {
  const toneColors = TONE_MAP[tone];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={() => {}} style={styles.card}>
          {icon && (
            <View style={[styles.iconCircle, { backgroundColor: toneColors.bg }]}>
              <Icon name={icon} size={28} color={toneColors.fg} strokeWidth={2.2} />
            </View>
          )}

          <Text variant="bodyStrong" align="center" style={styles.title}>
            {title}
          </Text>

          {message ? (
            <Text
              variant="body"
              color={semantic.textSecondary}
              align="center"
              style={styles.message}
            >
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {!singleAction && (
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnCancel,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text variant="bodyStrong" color={semantic.textPrimary} style={styles.btnText}>
                  {cancelLabel}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                confirmTone === 'danger' ? styles.btnDanger : styles.btnPrimary,
                singleAction && { flex: 1 },
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text variant="bodyStrong" color={'#FFFFFF'} style={styles.btnText}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing['2xl'],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    color: semantic.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  btnCancel: {
    backgroundColor: '#F2F2F3',
  },
  btnPrimary: {
    backgroundColor: semantic.primary,
  },
  btnDanger: {
    backgroundColor: '#C25450',
  },
  btnText: {
    fontSize: 15,
  },
});
