import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Icon, Screen, Text } from '../components';
import { gradients, radii, semantic, shadows, spacing } from '../theme';
import { mockPets } from '../data/pets';
import { mockAppointments, typeMeta, thDateShort, thWeekday } from '../data/appointments';
import { mockProducts, categoryMeta, fmtBaht } from '../data/products';
import {
  mockExpenses,
  monthKey,
  DEFAULT_MONTHLY_BUDGET,
  fmtBaht as fmtExpBaht,
  thMonth,
} from '../data/expenses';
import { mockVets, mockConversations } from '../data/televet';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const nextAppt = mockAppointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];

  const recommendedProducts = mockProducts
    .filter((p) => p.recommendedFor.some((k) => mockPets.map((x) => x.species).includes(k as any)))
    .slice(0, 5);

  // Current month expense summary
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = mockExpenses.filter((e) => monthKey(e.dateISO) === thisMonth);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budget = DEFAULT_MONTHLY_BUDGET;
  const budgetPercent = Math.min(monthTotal / budget, 1);
  const overBudget = monthTotal > budget;

  // Vet summary for bento menu
  const upcomingApptsCount = mockAppointments.filter((a) => a.status === 'upcoming').length;
  const onlineVets = mockVets.filter((v) => v.status === 'online');
  const unreadChats = mockConversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <Screen scroll tabBarSpace>
      {/* Greeting + name */}
      <View style={styles.greeting}>
        <Text variant="caption" color={semantic.textSecondary}>
          สวัสดีตอนเช้า
        </Text>
        <Text variant="h1">สวัสดี คุณโจ 👋</Text>
      </View>

      {/* Appointment hero card */}
      {nextAppt && (
        <Card variant="elevated" padding="xl" style={styles.heroCard}>
          <View style={styles.heroOverlineRow}>
            <Icon name={typeMeta[nextAppt.type].icon as any} size={14} color={semantic.primary} />
            <Text variant="overline" color={semantic.primary}>นัดหมายถัดไป</Text>
          </View>
          <Text variant="h2" style={styles.heroTitle}>
            {nextAppt.typeLabel}
          </Text>
          <Text variant="body" color={semantic.textSecondary}>
            {thWeekday(nextAppt.dateISO)} {thDateShort(nextAppt.dateISO)} · {nextAppt.time} น.
          </Text>
          <Text variant="caption" color={semantic.textMuted}>
            {nextAppt.petEmoji} {nextAppt.petName} · {nextAppt.vetName}
          </Text>
          <View style={styles.heroButton}>
            <Button
              label="ดูรายละเอียด"
              size="sm"
              uppercase={false}
              fullWidth={false}
              onPress={() =>
                navigation.navigate('AppointmentDetail', { appointmentId: nextAppt.id })
              }
            />
          </View>
        </Card>
      )}

      {/* Pets — section + horizontal row */}
      <View style={styles.sectionHeader}>
        <Text variant="overline" color={semantic.textSecondary}>
          สัตว์เลี้ยงของคุณ
        </Text>
        <Pressable
          onPress={() => navigation.navigate('PetsList' as never)}
          hitSlop={8}
        >
          <View style={styles.seeAllRow}>
            <Text variant="caption" color={semantic.primary} weight="600">ดูทั้งหมด</Text>
            <Icon name="ChevronRight" size={14} color={semantic.primary} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.petsRow}
      >
        {mockPets.map((pet) => (
          <Pressable
            key={pet.id}
            onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
            style={styles.petItem}
          >
            <View style={[styles.petAvatar, shadows.pop]}>
              <LinearGradient
                colors={gradients.roseSoft}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.petAvatarHighlight} />
              <Text style={{ fontSize: 40 }}>{pet.emoji}</Text>
            </View>
            <Text variant="caption" color={semantic.textPrimary} weight="600" align="center">
              {pet.name}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => navigation.navigate('AddPet')}
          style={styles.petItem}
        >
          <View style={styles.addPetAvatar}>
            <Icon name="Plus" size={28} color={semantic.primary} strokeWidth={2.4} />
          </View>
          <Text variant="caption" color={semantic.textSecondary} align="center">
            เพิ่ม
          </Text>
        </Pressable>
      </ScrollView>

      {/* Bento grid: menu (left tall) + expense + ai-feature (right stacked) */}
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        เมนู
      </Text>

      <View style={styles.bentoRow}>
        {/* Left tall card: Vet consult menu — illustration on top, title banner at bottom */}
        <Card
          variant="elevated"
          padding={0}
          onPress={() => navigation.navigate('Vet' as never)}
          style={styles.bentoLeft}
        >
          {/* Illustration area with 3D gradient background */}
          <View style={styles.vetIllus}>
            <LinearGradient
              colors={gradients.roseSoft}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.vetIllusCircle, shadows.lift]}>
              <LinearGradient
                colors={gradients.orbRose}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.orbHighlight} />
              <Icon name="Stethoscope" size={52} color={semantic.onPrimary} strokeWidth={2} />
            </View>
            {unreadChats > 0 && (
              <View style={styles.vetUnreadBadge}>
                <Icon name="MessageCircle" size={12} color={semantic.onPrimary} />
                <Text variant="caption" color={semantic.onPrimary} weight="600" style={{ fontSize: 11 }}>
                  {unreadChats}
                </Text>
              </View>
            )}
          </View>

          {/* Title banner + description */}
          <View style={styles.vetFooter}>
            <View style={styles.titleBanner}>
              <Text variant="bodyStrong" color={semantic.onPrimary} style={{ fontSize: 14 }}>
                ปรึกษาสัตวแพทย์
              </Text>
            </View>
            <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 12 }}>
              {upcomingApptsCount} นัดหมายกำลังจะถึง
            </Text>
            <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 11 }}>
              {onlineVets.length} สัตวแพทย์ออนไลน์
            </Text>
          </View>
        </Card>

        {/* Right column: expense + ai-feature stacked */}
        <View style={styles.bentoRight}>
          {/* Expense tile */}
          <Card
            variant="elevated"
            padding="lg"
            onPress={() => navigation.navigate('Expenses')}
            style={styles.bentoRightTile}
          >
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIcon}>
                <Icon name="Wallet" size={20} color={semantic.primary} />
              </View>
              <Text
                variant="bodyStrong"
                color={overBudget ? '#C25450' : semantic.primary}
                style={{ fontSize: 12 }}
              >
                {Math.round(budgetPercent * 100)}%
              </Text>
            </View>
            <Text variant="caption" color={semantic.textSecondary} style={{ fontSize: 11 }}>
              ค่าใช้จ่ายเดือนนี้
            </Text>
            <Text
              variant="h3"
              color={overBudget ? '#C25450' : semantic.textPrimary}
              numberOfLines={1}
            >
              {fmtExpBaht(monthTotal)}
            </Text>
            <View style={styles.budgetBar}>
              <View
                style={[
                  styles.budgetFill,
                  {
                    width: `${budgetPercent * 100}%`,
                    backgroundColor: overBudget ? '#C25450' : semantic.primary,
                  },
                ]}
              />
            </View>
          </Card>

          {/* AI feature tile */}
          <Card
            variant="elevated"
            padding="lg"
            onPress={() => navigation.navigate('SmartFeatures')}
            style={styles.bentoRightTile}
          >
            <View style={styles.bentoHeader}>
              <View style={[styles.bentoIcon, { backgroundColor: '#EEE4FF' }]}>
                <Icon name="Sparkles" size={20} color="#7B5CC8" />
              </View>
            </View>
            <Text variant="caption" color="#7B5CC8" weight="600" style={{ fontSize: 10 }}>
              AI ผู้ช่วย
            </Text>
            <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={2}>
              ตรวจอาการเบื้องต้น
            </Text>
            <View style={[styles.seeAllRow, { marginTop: 4 }]}>
              <Text variant="caption" color={semantic.primary} weight="600" style={{ fontSize: 11 }}>
                เริ่ม
              </Text>
              <Icon name="ChevronRight" size={12} color={semantic.primary} />
            </View>
          </Card>
        </View>
      </View>

      {/* Tele-vet promo */}
      <Text variant="overline" color={semantic.textSecondary} style={styles.sectionLabel}>
        ปรึกษาสัตวแพทย์
      </Text>
      <Card variant="elevated" padding="lg" onPress={() => navigation.navigate('Vet' as never)}>
        <View style={styles.teleRow}>
          <View style={styles.teleIcon}>
            <Icon name="MessageCircle" size={32} color={semantic.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">ปรึกษาสัตวแพทย์ออนไลน์</Text>
            <Text variant="caption" color={semantic.textSecondary}>
              แชทหรือวิดีโอคอลได้ทุกเวลา
            </Text>
            <View style={[styles.seeAllRow, { marginTop: 4 }]}>
              <Text variant="caption" color={semantic.primary} weight="600">เริ่มสนทนา</Text>
              <Icon name="ChevronRight" size={14} color={semantic.primary} />
            </View>
          </View>
        </View>
      </Card>

      {/* Product recommendations */}
      <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
        <Text variant="overline" color={semantic.textSecondary}>
          แนะนำสำหรับสัตว์ของคุณ
        </Text>
        <Pressable onPress={() => navigation.navigate('PetShop' as never)} hitSlop={8}>
          <View style={styles.seeAllRow}>
            <Text variant="caption" color={semantic.primary} weight="600">ดูทั้งหมด</Text>
            <Icon name="ChevronRight" size={14} color={semantic.primary} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsRow}
      >
        {recommendedProducts.map((p) => {
          const cat = categoryMeta[p.category];
          return (
            <Pressable
              key={p.id}
              onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
              style={styles.productCard}
            >
              <View style={[styles.productImage, { backgroundColor: cat.bg }]}>
                <Text style={{ fontSize: 48 }}>{p.emoji}</Text>
                {p.originalPriceBaht && (
                  <View style={styles.saleBadge}>
                    <Text variant="caption" color={semantic.onPrimary} weight="600" style={{ fontSize: 9 }}>
                      SALE
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text variant="caption" color={semantic.textMuted} style={{ fontSize: 10 }}>
                  {p.brand}
                </Text>
                <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 12, lineHeight: 16 }}>
                  {p.name}
                </Text>
                <Text variant="bodyStrong" color={semantic.primary} style={{ marginTop: 4 }}>
                  {fmtBaht(p.priceBaht)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  heroOverlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  heroCard: {
    marginBottom: spacing.xl,
  },
  heroTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroButton: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
    marginTop: spacing.xl,
  },
  petsRow: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  petItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 80,
  },
  petAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  petAvatarHighlight: {
    position: 'absolute',
    top: 8,
    left: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  addPetAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: semantic.primary,
    borderStyle: 'dashed',
    backgroundColor: semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  budgetBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.surfaceMuted,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 3,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
    minHeight: 340,
  },
  bentoLeft: {
    flex: 1,
  },
  bentoRight: {
    flex: 1,
    gap: spacing.md,
  },
  bentoRightTile: {
    flex: 1,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: semantic.primary,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetIllus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    overflow: 'hidden',
  },
  vetIllusCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  orbHighlight: {
    position: 'absolute',
    top: 10,
    left: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  vetUnreadBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  vetFooter: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  titleBanner: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: semantic.textPrimary,
    marginBottom: spacing.xs,
  },
  teleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsRow: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  productCard: {
    width: 156,
    backgroundColor: semantic.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: semantic.border,
    overflow: 'hidden',
  },
  productImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: semantic.primary,
  },
  productInfo: {
    padding: spacing.md,
    gap: 2,
  },
});
