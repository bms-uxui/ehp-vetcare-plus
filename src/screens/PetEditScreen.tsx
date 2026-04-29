import { useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  ZoomIn,
  ZoomOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, Icon, Text } from '../components';
import { semantic } from '../theme';
import { mockPets, Pet } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'PetEdit'>;

type PetErrors = {
  name?: string;
  breed?: string;
  weightKg?: string;
  color?: string;
  microchipId?: string;
};

function validatePet(p: Pet): PetErrors {
  const errs: PetErrors = {};
  if (!p.name.trim()) errs.name = 'กรุณากรอกชื่อ';
  if (!p.breed.trim()) errs.breed = 'กรุณากรอกสายพันธุ์';
  if (!p.color.trim()) errs.color = 'กรุณากรอกสี';
  if (!Number.isFinite(p.weightKg) || p.weightKg <= 0)
    errs.weightKg = 'น้ำหนักต้องมากกว่า 0';
  if (p.microchipId && !/^\d+$/.test(p.microchipId))
    errs.microchipId = 'ไมโครชิปต้องเป็นตัวเลข';
  return errs;
}

const hasAnyError = (e: object) => Object.values(e).some(Boolean);

export default function PetEditScreen({ route, navigation }: Props) {
  const { petId } = route.params;
  const insets = useSafeAreaInsets();
  const initial = useMemo(() => mockPets.find((p) => p.id === petId), [petId]);

  const [draft, setDraft] = useState<Pet | null>(
    initial ? { ...initial } : null,
  );

  if (!draft) {
    return (
      <View style={styles.root}>
        <AppBackground />
        <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon name="ChevronLeft" size={20} color="#1A1A1A" strokeWidth={2.4} />
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text variant="h3">ไม่พบข้อมูลสัตว์เลี้ยง</Text>
        </View>
      </View>
    );
  }

  const update = <K extends keyof Pet>(key: K, value: Pet[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      update('photo', { uri: result.assets[0].uri });
    }
  };

  const neuterProgress = useSharedValue(draft.neutered ? 1 : 0);
  useEffect(() => {
    neuterProgress.value = withTiming(draft.neutered ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [draft.neutered, neuterProgress]);
  const checkboxAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      neuterProgress.value,
      [0, 1],
      ['#FFFFFF', '#9F5266'],
    ),
    borderColor: interpolateColor(
      neuterProgress.value,
      [0, 1],
      ['#D0D0D4', '#9F5266'],
    ),
  }));

  const errs = validatePet(draft);
  const hasErrors = hasAnyError(errs);

  const save = () => {
    if (hasErrors || !draft) return;
    const idx = mockPets.findIndex((p) => p.id === draft.id);
    if (idx >= 0) mockPets[idx] = draft;
    navigation.popTo('PetDetail', {
      petId: draft.id,
      flashMessage: 'บันทึกเรียบร้อยแล้ว',
    });
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.appbarBtn}
        >
          <Icon name="ChevronLeft" size={20} color="#1A1A1A" strokeWidth={2.4} />
        </Pressable>
        <Text variant="bodyStrong" style={styles.appbarTitle}>
          แก้ไขข้อมูล
        </Text>
        <Pressable
          onPress={save}
          disabled={hasErrors}
          hitSlop={8}
          style={({ pressed }) => [
            styles.appbarBtn,
            hasErrors && { opacity: 0.4 },
            pressed && !hasErrors && { opacity: 0.6 },
          ]}
        >
          <Text variant="bodyStrong" style={styles.appbarSave}>
            บันทึก
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={pickAvatar}
          style={({ pressed }) => [
            styles.avatarWrap,
            pressed && { opacity: 0.9 },
          ]}
        >
          <View style={styles.avatar}>
            {draft.photo ? (
              <Image
                source={
                  typeof draft.photo === 'number'
                    ? draft.photo
                    : draft.photo
                }
                style={styles.avatarImage}
              />
            ) : (
              <Text style={{ fontSize: 56 }}>{draft.emoji}</Text>
            )}
          </View>
          <View style={styles.avatarCameraBadge}>
            <Icon name="Camera" size={14} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        </Pressable>

        <EditField
          label="ชื่อ"
          value={draft.name}
          error={errs.name}
          onChange={(v) => update('name', v)}
        />

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <EditField
              label="สายพันธุ์"
              value={draft.breed}
              error={errs.breed}
              onChange={(v) => update('breed', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <EditField
              label="สี"
              value={draft.color}
              error={errs.color}
              onChange={(v) => update('color', v)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <EditField
              label="น้ำหนัก (กก.)"
              value={String(draft.weightKg)}
              keyboardType="decimal-pad"
              error={errs.weightKg}
              onChange={(v) => update('weightKg', Number(v) || 0)}
            />
          </View>
          <View style={styles.fieldCol}>
            <View style={styles.fieldWrap}>
              <Text variant="caption" style={styles.fieldLabel}>
                เพศ
              </Text>
              <View style={styles.toggleRow}>
                {(['male', 'female'] as const).map((g) => {
                  const active = draft.gender === g;
                  const accent = g === 'male' ? '#4A8FD6' : '#D6478D';
                  return (
                    <Pressable
                      key={g}
                      onPress={() => update('gender', g)}
                      style={[
                        styles.genderChip,
                        { borderColor: accent },
                        active && { backgroundColor: accent },
                      ]}
                    >
                      <Icon
                        name={g === 'male' ? 'Mars' : 'Venus'}
                        size={14}
                        color={active ? '#FFFFFF' : accent}
                        strokeWidth={2.4}
                      />
                      <Text
                        variant="bodyStrong"
                        style={[
                          styles.genderChipText,
                          { color: active ? '#FFFFFF' : accent },
                        ]}
                      >
                        {g === 'male' ? 'ผู้' : 'เมีย'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <EditField
          label="ไมโครชิป"
          value={draft.microchipId ?? ''}
          keyboardType="number-pad"
          error={errs.microchipId}
          onChange={(v) => update('microchipId', v)}
        />

        <Pressable
          onPress={() => update('neutered', !draft.neutered)}
          style={({ pressed }) => [
            styles.statusCard,
            pressed && { opacity: 0.92 },
          ]}
        >
          <View style={styles.statusTextWrap}>
            <Text variant="bodyStrong" style={styles.statusTitle}>
              น้อง{draft.name}ทำหมันแล้วหรือยัง?
            </Text>
            <Text variant="caption" style={styles.statusSubtitle}>
              แตะเพื่อยืนยันสถานะการทำหมัน
            </Text>
          </View>
          <Animated.View style={[styles.checkbox, checkboxAnimStyle]}>
            {draft.neutered && (
              <Animated.View
                entering={ZoomIn.duration(180)}
                exiting={ZoomOut.duration(140)}
              >
                <Icon name="Check" size={16} color="#FFFFFF" strokeWidth={3} />
              </Animated.View>
            )}
          </Animated.View>
        </Pressable>

        <EditField
          label="โรคประจำตัว"
          placeholder="เช่น ภูมิแพ้ผิวหนัง (คั่นด้วยจุลภาค)"
          multiline
          value={draft.conditions.map((c) => c.name).join(', ')}
          onChange={(text) => {
            const names = text
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            update(
              'conditions',
              names.map((name, i) => ({
                id: draft.conditions[i]?.id ?? `c-${i}`,
                name,
                since:
                  draft.conditions[i]?.since ??
                  new Date().toISOString().slice(0, 10),
                notes: draft.conditions[i]?.notes,
              })),
            );
          }}
        />
      </ScrollView>
    </View>
  );
}

function EditField({
  label,
  value,
  onChange,
  keyboardType,
  placeholder,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  placeholder?: string;
  multiline?: boolean;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const showError = !!error && !focused;
  const accent = showError ? '#C25450' : semantic.primary;
  return (
    <View style={styles.fieldWrap}>
      <Text
        variant="caption"
        style={[
          styles.fieldLabel,
          (focused || showError) && { color: accent },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.fieldUnderline,
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
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        />
      </View>
      {showError && (
        <Text variant="caption" style={styles.fieldError}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF3F4' },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  appbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appbarTitle: { fontSize: 16, color: '#1A1A1A', flex: 1, textAlign: 'center' },
  appbarSave: {
    fontSize: 15,
    color: '#9F5266',
    fontWeight: '700',
  },
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
    width: 120,
    height: 120,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1ECEC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9F5266',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fieldWrap: { gap: 4, paddingTop: 6 },
  fieldRow: { flexDirection: 'row', gap: 16 },
  fieldCol: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#6E6E74', fontWeight: '500' },
  fieldUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
  },
  fieldInput: {
    height: 40,
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  fieldInputMultiline: {
    height: undefined,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 6,
    textAlignVertical: 'top',
  },
  fieldError: { fontSize: 11, color: '#C25450', marginTop: 4 },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5E4E7',
  },
  toggleChipActive: { backgroundColor: '#9F5266' },
  toggleChipText: { fontSize: 13, color: '#9F5266', fontWeight: '700' },
  toggleChipTextActive: { color: '#FFFFFF' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statusTextWrap: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#6E6E74',
  },
  statusSwitch: {
    alignSelf: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D0D0D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#9F5266',
    borderColor: '#9F5266',
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  snackbarText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  genderChipText: { fontSize: 13, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FBF3F4',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0E6E8',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#9F5266',
  },
  btnSecondaryText: { fontSize: 16, color: '#9F5266' },
  btnPrimary: { backgroundColor: '#9F5266' },
  btnPrimaryText: { fontSize: 16, color: '#FFFFFF' },
});
