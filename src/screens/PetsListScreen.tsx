import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, Screen, Text } from '../components';
import { semantic, spacing } from '../theme';
import { mockPets, petAgeString, Pet } from '../data/pets';

type Props = NativeStackScreenProps<RootStackParamList, 'PetsList'>;

export default function PetsListScreen({ navigation }: Props) {
  return (
    <Screen scroll tabBarSpace>
      <View style={styles.header}>
        <Text variant="h1">สัตว์เลี้ยงของฉัน</Text>
        <Text variant="body" color={semantic.textSecondary}>
          {mockPets.length} ตัว · ซิงค์กับ EHP VetCare
        </Text>
      </View>

      <View style={styles.list}>
        {mockPets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
          />
        ))}
      </View>

      <View style={styles.addWrap}>
        <Button
          label="+ เพิ่มสัตว์เลี้ยง"
          variant="secondary"
          uppercase={false}
          onPress={() => navigation.navigate('AddPet')}
        />
      </View>
    </Screen>
  );
}

function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  return (
    <Card variant="elevated" padding="lg" onPress={onPress}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 40 }}>{pet.emoji}</Text>
        </View>

        <View style={styles.info}>
          <Text variant="h3">{pet.name}</Text>
          <Text variant="caption" color={semantic.textSecondary}>
            {pet.speciesLabel} · {pet.breed}
          </Text>
          <View style={styles.statRow}>
            <Stat label="อายุ" value={petAgeString(pet.birthDate)} />
            <View style={styles.statDivider} />
            <Stat label="น้ำหนัก" value={`${pet.weightKg} กก.`} />
            <View style={styles.statDivider} />
            <Stat label="เพศ" value={pet.gender === 'male' ? '♂' : '♀'} />
          </View>
        </View>
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="overline" color={semantic.textMuted}>{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stat: {
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: semantic.border,
  },
  addWrap: {
    marginTop: spacing.xl,
  },
});
