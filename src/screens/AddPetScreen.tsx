import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Input, Screen, Text } from '../components';
import { radii, semantic, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPet'>;

type Species = 'dog' | 'cat' | 'rabbit' | 'other';

const SPECIES: { key: Species; label: string; emoji: string }[] = [
  { key: 'dog', label: 'สุนัข', emoji: '🐶' },
  { key: 'cat', label: 'แมว', emoji: '🐱' },
  { key: 'rabbit', label: 'กระต่าย', emoji: '🐰' },
  { key: 'other', label: 'อื่นๆ', emoji: '🐾' },
];

const GENDERS: { key: 'male' | 'female'; label: string; symbol: string }[] = [
  { key: 'male', label: 'ชาย', symbol: '♂' },
  { key: 'female', label: 'หญิง', symbol: '♀' },
];

export default function AddPetScreen({ navigation }: Props) {
  const [species, setSpecies] = useState<Species>('dog');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');

  const onSubmit = () => {
    navigation.goBack();
  };

  const currentEmoji = SPECIES.find((s) => s.key === species)?.emoji ?? '🐾';

  return (
    <Screen scroll keyboardAvoiding>
      <Text variant="h1" align="center" style={styles.title}>
        เพิ่มสัตว์เลี้ยง
      </Text>
      <Text variant="body" color={semantic.textSecondary} align="center" style={styles.subtitle}>
        ระบุข้อมูลเพื่อนตัวน้อยของคุณ
      </Text>

      <View style={styles.photoWrap}>
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.photoAvatar, pressed && { opacity: 0.9 }]}
        >
          <Text style={{ fontSize: 64 }}>{currentEmoji}</Text>
        </Pressable>
        <Text variant="caption" color={semantic.textSecondary}>
          แตะเพื่ออัปโหลดรูป
        </Text>
      </View>

      <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
        ประเภทสัตว์
      </Text>
      <View style={styles.speciesGrid}>
        {SPECIES.map((s) => (
          <Card
            key={s.key}
            variant="elevated"
            selected={species === s.key}
            padding="md"
            onPress={() => setSpecies(s.key)}
            style={styles.speciesTile}
          >
            <View style={styles.speciesInner}>
              <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
              <Text variant="bodyStrong" style={{ fontSize: 13 }}>{s.label}</Text>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.form}>
        <Input label="ชื่อสัตว์เลี้ยง" placeholder="เช่น ข้าวปั้น" value={name} onChangeText={setName} />
        <Input label="สายพันธุ์" placeholder="เช่น ชิบะ อินุ" value={breed} onChangeText={setBreed} />

        <View>
          <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
            เพศ
          </Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <Card
                key={g.key}
                variant="elevated"
                selected={gender === g.key}
                padding="md"
                onPress={() => setGender(g.key)}
                style={styles.genderTile}
              >
                <View style={styles.genderInner}>
                  <Text variant="bodyStrong">{g.symbol}  {g.label}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        <Input
          label="วันเกิด"
          placeholder="ปปปป-ดด-วว"
          value={birthDate}
          onChangeText={setBirthDate}
        />
        <Input
          label="น้ำหนัก (กก.)"
          placeholder="เช่น 9.4"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <Input label="สี" placeholder="เช่น ส้มขาว" value={color} onChangeText={setColor} />

        <Button label="บันทึก" onPress={onSubmit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  photoWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  photoAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: semantic.primary,
    borderStyle: 'dashed',
  },
  label: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  speciesTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  speciesInner: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderTile: {
    flex: 1,
  },
  genderInner: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
