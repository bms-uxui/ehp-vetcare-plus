import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AppBackground, DropdownField, Icon, Text } from '../components';
import { semantic } from '../theme';
import { breedOptions } from '../data/breeds';
import { mockPets, Pet } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPetManual'>;

type Species = 'dog' | 'cat' | 'rabbit' | 'other';

const SPECIES: {
  key: Species;
  label: string;
  emoji: string;
  photo?: number;
}[] = [
  {
    key: 'dog',
    label: 'สุนัข',
    emoji: '🐶',
    photo: require('../../assets/shiba.jpg'),
  },
  {
    key: 'cat',
    label: 'แมว',
    emoji: '🐱',
    photo: require('../../assets/mali.jpg'),
  },
  {
    key: 'rabbit',
    label: 'กระต่าย',
    emoji: '🐰',
    photo: require('../../assets/rabbit.jpg'),
  },
  { key: 'other', label: 'อื่นๆ', emoji: '🐾' },
];

const STEPS = [
  { title: 'เลือกชนิดสัตว์เลี้ยง', subtitle: 'เลือกชนิดที่ใกล้เคียงน้องของคุณที่สุด' },
  { title: 'ข้อมูลพื้นฐาน', subtitle: 'กรอกชื่อและข้อมูลเบื้องต้นของน้อง' },
  { title: 'ตรวจสอบข้อมูล', subtitle: 'ตรวจสอบความถูกต้องก่อนบันทึก' },
] as const;

export default function AddPetManualScreen({ navigation, route }: Props) {
  const prefill = route.params?.prefill;
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(
    Math.max(0, Math.min(2, route.params?.startStep ?? 0)),
  );
  const [species, setSpecies] = useState<Species>('dog');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState(prefill?.name ?? '');
  const [breed, setBreed] = useState(prefill?.breed ?? '');
  const [birthDate, setBirthDate] = useState(prefill?.birthDate ?? '');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [microchipId, setMicrochipId] = useState(prefill?.microchipId ?? '');
  const neuteredFromApi = prefill?.neutered === true;
  const [neutered, setNeutered] = useState(prefill?.neutered ?? false);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const progress = useSharedValue(stepIndex);
  const scrollRef = useRef<React.ComponentRef<typeof KeyboardAwareScrollView>>(null);
  useEffect(() => {
    progress.value = withTiming(stepIndex, {
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
    });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [stepIndex, progress]);

  const speciesMeta = SPECIES.find((s) => s.key === species);
  const speciesLabel = speciesMeta?.label ?? '';
  const speciesEmoji = speciesMeta?.emoji ?? '🐾';
  const speciesPhoto = speciesMeta?.photo;

  const canProceed =
    (stepIndex === 0 && !!species) ||
    (stepIndex === 1 && name.trim().length > 0) ||
    stepIndex === 2;

  const onNext = () => {
    if (isLast) {
      const newPet: Pet = {
        id: `p-${Date.now()}`,
        name: name.trim() || 'น้องใหม่',
        emoji: speciesEmoji,
        photo: speciesPhoto,
        species,
        speciesLabel,
        breed: breed.trim(),
        gender,
        birthDate: birthDate || new Date().toISOString().slice(0, 10),
        weightKg: Number(weight) || 0,
        color: color.trim(),
        microchipId: microchipId.trim() || undefined,
        neutered,
        neuteredDate: neutered && prefill?.neuteredDate ? prefill.neuteredDate : undefined,
        vaccines: [],
        conditions: [],
        visits: [],
      };
      mockPets.push(newPet);
      navigation.reset({
        index: 1,
        routes: [
          {
            name: 'Main',
            state: {
              index: 0,
              routes: [{ name: 'PetsList' }],
            },
          } as never,
          {
            name: 'PetDetail',
            params: {
              petId: newPet.id,
              flashMessage: 'เพิ่มน้องใหม่เรียบร้อยแล้ว',
            },
          },
        ],
      });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const onBack = () => {
    if (isFirst) {
      navigation.goBack();
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="ย้อนกลับ"
        >
          <Icon name="ChevronLeft" size={20} color="#1A1A1F" strokeWidth={2.4} />
        </Pressable>
        <Text variant="bodyStrong" style={styles.headerTitle}>
          กรอกข้อมูลเอง
        </Text>
      </View>

      <View style={styles.stepperCard}>
        {(
          [
            { icon: 'PawPrint' as const },
            { icon: 'Pencil' as const },
            { icon: 'ClipboardCheck' as const },
          ]
        ).map((s, i) => (
          <View key={i} style={[styles.stepCell, i < 2 && { flex: 1 }]}>
            <StepDot index={i} progress={progress} icon={s.icon} />
            {i < 2 && <StepLine index={i} progress={progress} />}
          </View>
        ))}
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        bottomOffset={24}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodyStrong" style={styles.titleText}>
          {step.title}
        </Text>
        <Text variant="caption" style={styles.subtitleText}>
          {step.subtitle}
        </Text>

        {stepIndex !== 1 && (
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.avatar,
              !speciesPhoto && styles.avatarDashed,
              pressed && { opacity: 0.9 },
            ]}
          >
            {speciesPhoto ? (
              <Image source={speciesPhoto} style={styles.avatarImage} />
            ) : (
              <Text style={{ fontSize: 56 }}>{speciesEmoji}</Text>
            )}
          </Pressable>
        )}

        {stepIndex === 0 && (
          <View style={styles.speciesSection}>
            <Text variant="caption" style={styles.fieldLabel}>
              ชนิดสัตว์
            </Text>
            <View style={styles.speciesGrid}>
              {SPECIES.map((s) => {
                const active = species === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSpecies(s.key)}
                    style={({ pressed }) => [
                      styles.speciesTile,
                      active && styles.speciesTileActive,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                    <Text
                      variant="bodyStrong"
                      style={[
                        styles.speciesLabel,
                        active && styles.speciesLabelActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {stepIndex === 1 && (
          <View style={styles.form}>
            <FormField label="ชื่อ" value={name} onChange={setName} placeholder="เช่น ข้าวปั้น" />
            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <DropdownField
                  label="สายพันธุ์"
                  value={breed}
                  options={breedOptions[species]}
                  onChange={setBreed}
                />
              </View>
              <View style={styles.fieldCol}>
                <FormField
                  label="สี"
                  value={color}
                  onChange={setColor}
                  placeholder="เช่น ส้มขาว"
                />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <FormField
                  label="น้ำหนัก (กก.)"
                  value={weight}
                  onChange={setWeight}
                  placeholder="เช่น 9.4"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.fieldCol}>
                <View style={styles.fieldWrap}>
                  <Text variant="caption" style={styles.fieldLabel}>
                    เพศ
                  </Text>
                  <View style={styles.genderRow}>
                    {(['male', 'female'] as const).map((g) => {
                      const active = gender === g;
                      const accent = g === 'male' ? '#4A8FD6' : '#D6478D';
                      return (
                        <Pressable
                          key={g}
                          onPress={() => setGender(g)}
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
            <FormField
              label="ไมโครชิป"
              value={microchipId}
              onChange={setMicrochipId}
              placeholder="900164000123456"
              keyboardType="number-pad"
            />
            <Pressable
              onPress={() => {
                if (neuteredFromApi) return;
                setNeutered((v) => !v);
              }}
              style={({ pressed }) => [
                styles.neuterCard,
                pressed && !neuteredFromApi && { opacity: 0.92 },
              ]}
            >
              <View style={styles.neuterBody}>
                <View style={styles.neuterTextWrap}>
                  <Text variant="caption" style={styles.neuterCaption}>
                    ประวัติการทำหมัน
                  </Text>
                  <Text variant="bodyStrong" style={styles.neuterTitle}>
                    {neuteredFromApi
                      ? 'ทำหมันแล้ว'
                      : `น้อง${name || 'ของคุณ'}ทำหมันแล้วหรือยัง?`}
                  </Text>
                  {neuteredFromApi && prefill?.neuteredDate && (
                    <Text variant="caption" style={styles.neuterCaption}>
                      เมื่อ {prefill.neuteredDate}
                    </Text>
                  )}
                </View>
                {!neuteredFromApi && (
                  <View
                    style={[styles.checkbox, neutered && styles.checkboxChecked]}
                  >
                    {neutered && (
                      <Icon name="Check" size={16} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </View>
                )}
              </View>
              {neuteredFromApi && prefill?.neuteredClinic && (
                <View style={styles.neuterFooter}>
                  <Text
                    variant="caption"
                    style={styles.neuterClinicText}
                    numberOfLines={2}
                  >
                    {prefill.neuteredClinic}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {stepIndex === 2 && (
          <View style={styles.reviewList}>
            <ReviewRow label="ชื่อ" value={name || '-'} />
            <ReviewRow label="ชนิด" value={speciesLabel} />
            <ReviewRow label="สายพันธุ์" value={breed || '-'} />
            <ReviewRow label="เพศ" value={gender === 'male' ? 'ผู้' : 'เมีย'} />
            <ReviewRow label="สี" value={color || '-'} />
            <ReviewRow label="น้ำหนัก" value={weight ? `${weight} กก.` : '-'} />
            <ReviewRow label="วันเกิด" value={birthDate || '-'} />
            <ReviewRow label="ไมโครชิป" value={microchipId || '-'} />
          </View>
        )}
      </KeyboardAwareScrollView>

      <View
        style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}
      >
        {stepIndex > 0 && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnSecondary,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text variant="bodyStrong" style={styles.actionBtnSecondaryText}>
              ย้อนกลับ
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={onNext}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnPrimary,
            !canProceed && { opacity: 0.4 },
            pressed && canProceed && { opacity: 0.9 },
          ]}
        >
          <Text variant="bodyStrong" style={styles.actionBtnPrimaryText}>
            {isLast ? 'บันทึก' : 'ถัดไป'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function StepDot({
  index,
  progress,
  icon,
}: {
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  icon: 'PawPrint' | 'Pencil' | 'ClipboardCheck';
}) {
  const dotStyle = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, progress.value - index + 0.5));
    return {
      backgroundColor: interpolateColor(
        t,
        [0, 1],
        ['#E6E6E8', '#9F5266'],
      ),
    };
  });
  const iconColorStyle = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, progress.value - index + 0.5));
    return {
      opacity: 0.5 + t * 0.5,
    };
  });
  // Icon color we cross-fade by stacking idle gray + active white via opacity
  return (
    <Animated.View style={[styles.stepDot, dotStyle]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.stepIconCenter}>
          <Icon name={icon} size={12} color="#9A9AA0" strokeWidth={2.4} />
        </View>
      </View>
      <Animated.View
        style={[StyleSheet.absoluteFill, iconColorStyle]}
        pointerEvents="none"
      >
        <View style={styles.stepIconCenter}>
          <Icon name={icon} size={12} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function StepLine({
  index,
  progress,
}: {
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
}) {
  const lineStyle = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, progress.value - index));
    return {
      backgroundColor: interpolateColor(
        t,
        [0, 1],
        ['#E6E6E8', '#9F5266'],
      ),
    };
  });
  return <Animated.View style={[styles.stepLine, lineStyle]} />;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text
        variant="caption"
        style={[
          styles.fieldLabel,
          focused && { color: semantic.primary },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.fieldUnderline,
          focused && {
            borderBottomColor: semantic.primary,
            borderBottomWidth: 1.5,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9A9AA0"
          keyboardType={keyboardType ?? 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
        />
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text variant="caption" style={styles.reviewLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.reviewValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 999,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stepIconCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotIdle: {
    backgroundColor: '#E6E6E8',
  },
  stepDotActive: {
    backgroundColor: '#9F5266',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 4,
  },
  stepLineIdle: {
    backgroundColor: '#E6E6E8',
  },
  stepLineActive: {
    backgroundColor: '#9F5266',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 8,
  },
  titleText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#1A1A1F',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6E6E74',
    textAlign: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
    backgroundColor: '#F1ECEC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  avatarDashed: {
    borderWidth: 1.5,
    borderColor: '#1A1A1F',
    borderStyle: 'dashed',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  speciesSection: {
    gap: 12,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesTile: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  speciesTileActive: {
    backgroundColor: '#FBF3F4',
    borderColor: '#9F5266',
  },
  speciesLabel: {
    fontSize: 14,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  speciesLabelActive: {
    color: '#9F5266',
    fontWeight: '700',
  },
  form: {
    gap: 12,
    marginTop: 8,
  },
  fieldWrap: {
    gap: 4,
    paddingTop: 6,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6E6E74',
    fontWeight: '500',
  },
  fieldUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D4',
  },
  fieldInput: {
    height: 40,
    paddingHorizontal: 0,
    fontSize: 17,
    color: '#1A1A1F',
    fontWeight: '500',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldCol: {
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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
  genderChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  neuterCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184,106,124,0.12)',
    marginTop: 6,
    shadowColor: '#7E3D4F',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  neuterBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  neuterTextWrap: { flex: 1, gap: 4 },
  neuterCaption: {
    fontSize: 12,
    color: '#6E6E74',
  },
  neuterFooter: {
    backgroundColor: '#F5E4E7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184,106,124,0.18)',
  },
  neuterClinicText: {
    fontSize: 12,
    color: '#9F5266',
    fontWeight: '500',
  },
  neuterTitle: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '700',
  },
  neuterSubtitle: {
    fontSize: 12,
    color: '#6E6E74',
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
  checkboxLocked: {
    backgroundColor: '#9F5266',
    borderColor: '#9F5266',
    opacity: 1,
  },
  reviewList: {
    marginTop: 8,
    gap: 0,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9D9D9',
    gap: 16,
  },
  reviewLabel: {
    fontSize: 13,
    color: '#6E6E74',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 15,
    color: '#1A1A1F',
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: '#9F5266',
  },
  actionBtnPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(159,82,102,0.1)',
  },
  actionBtnSecondaryText: {
    fontSize: 16,
    color: '#9F5266',
    fontWeight: '700',
  },
});
