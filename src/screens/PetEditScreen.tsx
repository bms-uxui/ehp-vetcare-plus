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
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  DropdownField,
  Icon,
  Text,
  TextField,
} from '../components';
import { semantic } from '../theme';
import { breedOptions } from '../data/breeds';
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
  // Keep the weight input as a string locally so users can type intermediate
  // states like "9." or "9.4" — converting to Number() on every keystroke
  // would strip the trailing dot and trap the cursor before the decimal.
  const [weightInput, setWeightInput] = useState<string>(
    initial ? String(initial.weightKg) : '',
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

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickFromLibrary = async () => {
    setPickerOpen(false);
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
  const pickFromCamera = async () => {
    setPickerOpen(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
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
            styles.appbarSaveBtn,
            hasErrors && { opacity: 0.4 },
            pressed && !hasErrors && { opacity: 0.6 },
          ]}
        >
          <Text
            variant="bodyStrong"
            style={styles.appbarSave}
            numberOfLines={1}
          >
            บันทึก
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setPickerOpen(true)}
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

        <TextField
          label="ชื่อ"
          value={draft.name}
          error={errs.name}
          onChange={(v) => update('name', v)}
        />

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <DropdownField
              label="สายพันธุ์"
              value={draft.breed}
              options={breedOptions[draft.species]}
              onChange={(v) => update('breed', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <TextField
              label="สี"
              value={draft.color}
              error={errs.color}
              onChange={(v) => update('color', v)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <TextField
              label="น้ำหนัก (กก.)"
              value={weightInput}
              keyboardType="decimal-pad"
              error={errs.weightKg}
              onChange={(v) => {
                // Allow only digits + a single dot. Preserve the raw string so
                // intermediate states like "9." remain typeable.
                const cleaned = v.replace(/[^\d.]/g, '');
                const parts = cleaned.split('.');
                const next =
                  parts.length > 2
                    ? parts[0] + '.' + parts.slice(1).join('')
                    : cleaned;
                setWeightInput(next);
                const parsed = parseFloat(next);
                update('weightKg', Number.isFinite(parsed) ? parsed : 0);
              }}
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

        <TextField
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

        <TextField
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
      </KeyboardAwareScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.pickerBackdrop}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            style={[styles.pickerSheet, { paddingBottom: insets.bottom + 12 }]}
            onPress={() => {}}
          >
            <Text variant="bodyStrong" style={styles.pickerTitle}>
              เปลี่ยนรูปน้อง
            </Text>
            <Pressable
              onPress={pickFromCamera}
              style={({ pressed }) => [
                styles.pickerItem,
                pressed && { backgroundColor: '#FBF3F4' },
              ]}
            >
              <Icon name="Camera" size={20} color="#9F5266" strokeWidth={2.2} />
              <Text variant="bodyStrong" style={styles.pickerItemText}>
                ถ่ายภาพ
              </Text>
            </Pressable>
            <View style={styles.pickerDivider} />
            <Pressable
              onPress={pickFromLibrary}
              style={({ pressed }) => [
                styles.pickerItem,
                pressed && { backgroundColor: '#FBF3F4' },
              ]}
            >
              <Icon name="Image" size={20} color="#9F5266" strokeWidth={2.2} />
              <Text variant="bodyStrong" style={styles.pickerItemText}>
                เลือกจากเครื่อง
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={({ pressed }) => [
                styles.pickerCancel,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text variant="bodyStrong" style={styles.pickerCancelText}>
                ยกเลิก
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  appbarSaveBtn: {
    width: 'auto',
    minWidth: 56,
    paddingHorizontal: 8,
  },
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
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 12,
    gap: 10,
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingTop: 8,
  },
  pickerTitle: {
    fontSize: 13,
    color: '#6E6E74',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E8',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  pickerItemText: {
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  pickerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E8',
    marginHorizontal: 16,
  },
  pickerCancel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 17,
    color: '#9F5266',
    fontWeight: '700',
  },
  fieldWrap: { gap: 4, paddingTop: 6 },
  fieldRow: { flexDirection: 'row', gap: 16 },
  fieldCol: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#6E6E74', fontWeight: '500' },
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
