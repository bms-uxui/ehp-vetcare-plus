import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import {
  AppBackground,
  Button,
  Card,
  Icon,
  PetAvatar,
  StickyAppBar,
  Text,
} from '../components';
import { radii, semantic, spacing } from '../theme';
import {
  mockReminders,
  reminderMeta,
  relativeTime,
  Reminder,
  FeedingSchedule,
} from '../data/reminders';
import { useSchedules } from '../data/schedulesContext';
import { useNotifyPrefs } from '../data/notifyPrefsContext';
import {
  notifyNow,
  scheduleLocal,
  FEEDING_FOOD_CATEGORY,
  FEEDING_WATER_CATEGORY,
} from '../lib/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type FilterKey =
  | 'all'
  | 'feeding'
  | 'appointment'
  | 'vaccine'
  | 'contact'
  | 'order';

const FILTERS: {
  key: FilterKey;
  label: string;
  icon: string;
  activeBg: string;
  /** [lighter top, base/darker bottom] for the active chip background. */
  activeGradient: [string, string];
}[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    icon: 'Bell',
    activeBg: semantic.primary,
    activeGradient: ['#C77E91', '#9F5266'],
  },
  {
    key: 'feeding',
    label: 'ให้อาหาร',
    icon: 'UtensilsCrossed',
    activeBg: '#D99A20',
    activeGradient: ['#E5B048', '#C8881A'],
  },
  {
    key: 'appointment',
    label: 'นัดหมาย',
    icon: 'Calendar',
    activeBg: '#B86A7C',
    activeGradient: ['#C77E91', '#A75D6F'],
  },
  {
    key: 'vaccine',
    label: 'วัคซีน',
    icon: 'Syringe',
    activeBg: '#4FB36C',
    activeGradient: ['#5EC57C', '#42A35E'],
  },
  {
    key: 'contact',
    label: 'ติดต่อ',
    icon: 'MessageCircle',
    activeBg: '#4A8FD1',
    activeGradient: ['#5BA3E2', '#3D7AB8'],
  },
  {
    key: 'order',
    label: 'การสั่งซื้อ',
    icon: 'Package',
    activeBg: '#D17A4A',
    activeGradient: ['#E08D5E', '#B96A3F'],
  },
];

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { schedules, toggleSchedule } = useSchedules();
  const {
    preAppointment,
    setPreAppointment,
    preVaccine,
    setPreVaccine,
    preTreatment,
    setPreTreatment,
  } = useNotifyPrefs();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(mockReminders.filter((r) => r.read).map((r) => r.id)),
  );

  const remindersWithRead = useMemo(
    () =>
      mockReminders.map((r) => ({
        ...r,
        read: r.read || readIds.has(r.id),
      })),
    [readIds],
  );

  const filteredReminders = useMemo(() => {
    if (filter === 'all') return remindersWithRead;
    if (filter === 'contact') {
      return remindersWithRead.filter(
        (r) => r.type === 'chat' || r.type === 'call',
      );
    }
    return remindersWithRead.filter((r) => r.type === filter);
  }, [filter, remindersWithRead]);

  // Unread count per filter chip — drives the dot indicator on the chip.
  const unreadByFilter = useMemo(() => {
    const map: Record<FilterKey, number> = {
      all: 0,
      feeding: 0,
      appointment: 0,
      vaccine: 0,
      contact: 0,
      order: 0,
    };
    for (const r of remindersWithRead) {
      if (r.read) continue;
      map.all += 1;
      if (r.type === 'chat' || r.type === 'call') map.contact += 1;
      else if (r.type === 'feeding') map.feeding += 1;
      else if (r.type === 'appointment') map.appointment += 1;
      else if (r.type === 'vaccine') map.vaccine += 1;
      else if (r.type === 'order') map.order += 1;
    }
    return map;
  }, [remindersWithRead]);

  const markAllRead = () => {
    setReadIds(new Set(mockReminders.map((r) => r.id)));
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Morph dimensions
  const BTN_SIZE = 44;
  const MENU_W = 240;
  const MENU_H = 150;

  const openMoreMenu = () => {
    setMenuOpen(true);
    menuAnim.value = withSpring(1, { damping: 22, stiffness: 240, mass: 0.8 });
  };
  const closeMoreMenu = () => {
    menuAnim.value = withTiming(0, { duration: 220 });
    setTimeout(() => setMenuOpen(false), 220);
  };

  const morphStyle = useAnimatedStyle(() => {
    const v = menuAnim.value;
    return {
      width: BTN_SIZE + (MENU_W - BTN_SIZE) * v,
      height: BTN_SIZE + (MENU_H - BTN_SIZE) * v,
      borderRadius: 22 + 2 * v,
    };
  });
  const morphIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, menuAnim.value * 3),
  }));
  const morphItemsStyle = useAnimatedStyle(() => {
    const v = menuAnim.value;
    return {
      opacity: v < 0.6 ? 0 : (v - 0.6) / 0.4,
      transform: [{ translateY: (1 - v) * -4 }],
    };
  });

  return (
    <View style={styles.root}>
      <AppBackground />

      <StickyAppBar
        scrollY={scrollY}
        fadeStartAt={60}
        fadeEndAt={120}
        title="แจ้งเตือน"
        leading={{
          icon: 'ChevronLeft',
          onPress: () => navigation.goBack(),
          accessibilityLabel: 'ย้อนกลับ',
        }}
        trailing={
          <Pressable
            onPress={openMoreMenu}
            style={({ pressed }) => [
              styles.appbarMoreBtn,
              menuOpen && { opacity: 0 },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel="เพิ่มเติม"
          >
            <Icon
              name="MoreHorizontal"
              size={20}
              color="#1A1A1A"
              strokeWidth={2.4}
            />
          </Pressable>
        }
      />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56, paddingBottom: insets.top + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >

        {/* Hero header — large title + subtitle */}
        <View style={styles.hero}>
          <Text variant="h1" style={styles.heroTitle}>
            แจ้งเตือน
          </Text>
          <Text
            style={styles.heroSubtitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            จัดการการแจ้งเตือนและตารางให้อาหาร
          </Text>
        </View>

        {/* Filter chips — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              filter={f}
              active={filter === f.key}
              hasUnread={unreadByFilter[f.key] > 0}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* Content — list of reminders filtered by chip */}
        <View style={styles.content}>
          <RemindersContent reminders={filteredReminders} />
        </View>
      </Animated.ScrollView>

      {/* More menu — morph from button into popover, anchored to the same spot */}
      {menuOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeMoreMenu}
        >
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.morph,
              { top: insets.top + 6, right: 16 },
              morphStyle,
            ]}
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.morphInside, morphStyle]}
              pointerEvents="box-none"
            >
              <BlurView
                intensity={90}
                tint="systemMaterialLight"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.menuTint} />
              <View
                aria-hidden
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, styles.morphBorder]}
              />

              {/* Button icon — visible while collapsed, fades out as menu expands */}
              <Animated.View
                pointerEvents="none"
                style={[styles.morphIcon, morphIconStyle]}
              >
                <Icon
                  name="MoreHorizontal"
                  size={20}
                  color="#1A1A1A"
                  strokeWidth={2.4}
                />
              </Animated.View>

            {/* Menu items — fade in once the shape has expanded */}
            <Animated.View style={[styles.menuInner, morphItemsStyle]}>
              <Pressable
                onPress={() => {
                  closeMoreMenu();
                  markAllRead();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Icon
                  name="CheckCheck"
                  size={18}
                  color="#1A1A1A"
                  strokeWidth={2.2}
                />
                <Text style={styles.menuItemText}>อ่านทั้งหมด</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable
                onPress={() => {
                  closeMoreMenu();
                  setSchedulesOpen(true);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Icon
                  name="UtensilsCrossed"
                  size={18}
                  color="#1A1A1A"
                  strokeWidth={2.2}
                />
                <Text style={styles.menuItemText}>ตารางให้อาหาร</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable
                onPress={() => {
                  closeMoreMenu();
                  setSettingsOpen(true);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Icon
                  name="Settings"
                  size={18}
                  color="#1A1A1A"
                  strokeWidth={2.2}
                />
                <Text style={styles.menuItemText}>ตั้งค่าแจ้งเตือน</Text>
              </Pressable>
            </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      )}

      {/* Settings — opened from More menu */}
      <Modal
        visible={settingsOpen}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <SettingsSheet
          preAppointment={preAppointment}
          setPreAppointment={setPreAppointment}
          preVaccine={preVaccine}
          setPreVaccine={setPreVaccine}
          preTreatment={preTreatment}
          setPreTreatment={setPreTreatment}
          onClose={() => setSettingsOpen(false)}
        />
      </Modal>

      {/* Feeding schedules — opened from More menu */}
      <Modal
        visible={schedulesOpen}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => setSchedulesOpen(false)}
      >
        <SchedulesSheet
          schedules={schedules}
          onToggle={toggleSchedule}
          onAdd={() => {
            setSchedulesOpen(false);
            navigation.navigate('AddFeedingSchedule');
          }}
          onClose={() => setSchedulesOpen(false)}
        />
      </Modal>
    </View>
  );
}

/* ---------- Reminders list ---------- */

function RemindersContent({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return (
      <Card variant="elevated" padding="2xl">
        <View style={styles.empty}>
          <Icon
            name="Bell"
            size={48}
            color={semantic.textMuted}
            strokeWidth={1.5}
          />
          <Text variant="bodyStrong">ไม่มีแจ้งเตือน</Text>
          <Text variant="caption" color={semantic.textSecondary} align="center">
            การแจ้งเตือนใหม่จะปรากฎที่นี่
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {reminders.map((r) => {
        const meta = reminderMeta[r.type];
        return (
          <View key={r.id} style={styles.reminderCard}>
            <View style={styles.reminderRow}>
              <View style={styles.iconStack}>
                <View
                  style={[styles.iconCircle, { backgroundColor: meta.bg }]}
                >
                  <Icon name={meta.icon as any} size={20} color={meta.fg} />
                </View>
                {r.petName ? (
                  <View style={styles.iconPetBadge}>
                    <PetAvatar
                      petId={r.petId}
                      fallbackEmoji={r.petEmoji}
                      size={16}
                    />
                  </View>
                ) : null}
              </View>
              <View style={styles.reminderBody}>
                <View style={styles.reminderTopRow}>
                  <Text variant="bodyStrong" style={styles.reminderTitle}>
                    {r.title}
                  </Text>
                  <Text variant="caption" color={semantic.textMuted}>
                    {relativeTime(r.dueISO)}
                  </Text>
                </View>
                <Text variant="caption" color={semantic.textSecondary}>
                  {r.description}
                </Text>
                {r.petName && (
                  <Text variant="caption" color={semantic.textMuted}>
                    {r.petName}
                    {r.leadTimeLabel ? ` · ${r.leadTimeLabel}` : ''}
                  </Text>
                )}
                {r.type === 'feeding' && !r.read && (
                  <View style={styles.feedingActions}>
                    <Pressable
                      onPress={() => {}}
                      style={({ pressed }) => [
                        styles.feedingBtnPrimary,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Icon
                        name="Check"
                        size={14}
                        color="#FFFFFF"
                        strokeWidth={2.4}
                      />
                      <Text weight="600" style={styles.feedingBtnPrimaryText}>
                        ให้อาหารแล้ว
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {}}
                      style={({ pressed }) => [
                        styles.feedingBtnSecondary,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Icon
                        name="Clock"
                        size={14}
                        color={semantic.primary}
                        strokeWidth={2.4}
                      />
                      <Text weight="600" style={styles.feedingBtnSecondaryText}>
                        เลื่อน 15 นาที
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
              {!r.read && <View style={styles.unreadDot} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- Feeding schedules ---------- */

function SchedulesContent({
  schedules,
  onToggle,
  onAdd,
}: {
  schedules: FeedingSchedule[];
  onToggle: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <View style={styles.list}>
        {schedules.map((s) => {
          const isFood = s.type === 'food';
          return (
            <Card key={s.id} variant="elevated" padding="lg">
              <View style={styles.scheduleRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isFood ? '#FFF6D9' : '#E0F0FB' },
                  ]}
                >
                  <Icon
                    name={isFood ? 'UtensilsCrossed' : 'Droplet'}
                    size={20}
                    color={isFood ? '#D99A20' : '#4A8FD1'}
                  />
                </View>
                <View style={styles.scheduleBody}>
                  <View style={styles.scheduleTopRow}>
                    <Text variant="h3">{s.time}</Text>
                    <Text variant="caption" color={semantic.textMuted}>
                      ทุกวัน
                    </Text>
                  </View>
                  <Text variant="body">{s.amount}</Text>
                  {s.note && (
                    <Text variant="caption" color={semantic.textSecondary}>
                      {s.note}
                    </Text>
                  )}
                  <Text variant="caption" color={semantic.textMuted}>
                    {s.petEmoji} {s.petName}
                  </Text>
                </View>
                <Switch
                  value={s.enabled}
                  onValueChange={() => onToggle(s.id)}
                  trackColor={{ false: semantic.border, true: semantic.primary }}
                />
              </View>
            </Card>
          );
        })}
      </View>
      <View style={styles.addWrap}>
        <Button
          label="+ เพิ่มตารางให้อาหาร"
          variant="secondary"
          uppercase={false}
          onPress={onAdd}
        />
      </View>
    </>
  );
}

/* ---------- Filter chip — morph + scale-bump animation ---------- */

function FilterChip({
  filter: f,
  active,
  hasUnread,
  onPress,
}: {
  filter: (typeof FILTERS)[number];
  active: boolean;
  hasUnread: boolean;
  onPress: () => void;
}) {
  // Bump scale (1 → 1.08 → 1) every time the chip flips to active so the
  // selection feels responsive on top of the LinearTransition width morph.
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 140 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <Animated.View
        layout={LinearTransition.springify()
          .mass(0.55)
          .damping(22)
          .stiffness(180)}
        style={[
          styles.chip,
          active
            ? [
                styles.chipActive,
                { backgroundColor: f.activeBg, shadowColor: f.activeBg },
              ]
            : styles.chipCompact,
          animatedStyle,
        ]}
      >
        {active ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(100)}
            style={styles.chipGradient}
          >
            <LinearGradient
              pointerEvents="none"
              colors={f.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.chipGradient}
            />
          </Animated.View>
        ) : null}
        <Icon
          name={f.icon as any}
          size={16}
          color={active ? '#FFFFFF' : '#3C3C43'}
          strokeWidth={2.2}
        />
        {active ? (
          <Animated.Text
            entering={FadeIn.duration(240).delay(80)}
            exiting={FadeOut.duration(120)}
            style={[styles.chipText, styles.chipTextActive]}
          >
            {f.label}
          </Animated.Text>
        ) : null}
        {hasUnread ? (
          <View
            style={[styles.chipDotFloating, active && styles.chipDotActive]}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Schedules sheet ---------- */

const DAY_LABELS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function isSameLocalDay(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDays(daysOfWeek: number[]): string {
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) {
    return 'ทุกวัน';
  }
  const sorted = [...daysOfWeek].sort((a, b) => a - b);
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  const isWeekdays =
    sorted.length === 5 && sorted.every((d, i) => d === weekdays[i]);
  if (isWeekdays) return 'จันทร์–ศุกร์';
  const isWeekend =
    sorted.length === 2 && sorted.every((d, i) => d === weekend[i]);
  if (isWeekend) return 'เสาร์–อาทิตย์';
  return sorted.map((d) => DAY_LABELS_TH[d]).join(' ');
}

function groupSchedulesByPet(schedules: FeedingSchedule[]) {
  const groups = new Map<
    string,
    { petId: string; petName: string; petEmoji: string; items: FeedingSchedule[] }
  >();
  for (const s of schedules) {
    const g = groups.get(s.petId);
    if (g) {
      g.items.push(s);
    } else {
      groups.set(s.petId, {
        petId: s.petId,
        petName: s.petName,
        petEmoji: s.petEmoji,
        items: [s],
      });
    }
  }
  // Sort each group's items by time
  for (const g of groups.values()) {
    g.items.sort((a, b) => a.time.localeCompare(b.time));
  }
  return Array.from(groups.values());
}

function SchedulesSheet({
  schedules,
  onToggle,
  onAdd,
  onClose,
}: {
  schedules: FeedingSchedule[];
  onToggle: (id: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const grouped = groupSchedulesByPet(schedules);
  const enabledCount = schedules.filter((s) => s.enabled).length;
  return (
    <View style={styles.sheetRoot}>
      <View style={styles.sheetHeader}>
        <Text weight="500" style={styles.sheetTitle}>
          ตารางให้อาหาร
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={styles.sheetClose}
          accessibilityLabel="ปิด"
        >
          <View style={styles.sheetCloseBtn}>
            <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.sheetBody}>
        {/* Banner — soft pink gradient + title/desc + add button + illustration */}
        <View style={styles.scheduleBanner}>
          <LinearGradient
            pointerEvents="none"
            colors={['#FFE9EC', '#FBF3F4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.scheduleBannerText}>
            <Text weight="500" style={styles.scheduleBannerTitle} numberOfLines={1}>
              จัดตารางให้อาหารน้อง
            </Text>
            <Text style={styles.scheduleBannerDesc} numberOfLines={2}>
              ตั้งเวลาและปริมาณ ระบบจะเตือนทุกมื้อ
            </Text>
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => [
                styles.scheduleBannerBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Icon name="Plus" size={14} color="#FFFFFF" strokeWidth={2.4} />
              <Text weight="500" style={styles.scheduleBannerBtnText}>
                เพิ่มเลย
              </Text>
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.scheduleBannerImageWrap}>
            <Image
              source={require('../../assets/pet-meal-time.png')}
              style={styles.scheduleBannerImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Section: ตารางให้อาหาร — grouped per pet */}
        <View style={styles.settingsSection}>
          <View style={styles.scheduleSectionHeader}>
            <Text weight="500" style={styles.settingsSectionLabel}>
              ตารางให้อาหาร
            </Text>
            {schedules.length > 0 ? (
              <Text style={styles.scheduleSectionMeta}>
                เปิดอยู่ {enabledCount}/{schedules.length} รายการ
              </Text>
            ) : null}
          </View>

          {grouped.length === 0 ? (
            <View style={styles.scheduleEmpty}>
              <Text weight="500" style={styles.scheduleEmptyTitle}>
                ยังไม่มีตาราง
              </Text>
              <Text style={styles.scheduleEmptyDesc}>
                กด “เพิ่มเลย” ด้านบนเพื่อสร้างตารางให้อาหารมื้อแรก
              </Text>
            </View>
          ) : (
            grouped.map((group) => (
              <View key={group.petId} style={styles.schedulePetGroup}>
                <View style={styles.schedulePetHeader}>
                  <PetAvatar
                    petId={group.petId}
                    fallbackEmoji={group.petEmoji}
                    size={32}
                  />
                  <View style={{ flex: 1 }}>
                    <Text weight="500" style={styles.schedulePetHeaderName}>
                      {group.petName}
                    </Text>
                    <Text style={styles.schedulePetHeaderMeta}>
                      {group.items.length} มื้อ
                    </Text>
                  </View>
                </View>
                <View style={styles.settingsOptionCard}>
                  {group.items.map((s, idx) => {
                    const isFood = s.type === 'food';
                    const isLast = idx === group.items.length - 1;
                    const tintBg = isFood ? '#FFF6D9' : '#E0F0FB';
                    const tintFg = isFood ? '#D99A20' : '#4A8FD1';
                    const typeLabel = isFood ? 'อาหาร' : 'น้ำ';
                    return (
                      <View key={s.id}>
                        <Pressable
                          onPress={() => onToggle(s.id)}
                          style={({ pressed }) => [
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <View style={styles.scheduleRowV2}>
                            <View style={styles.scheduleRowTop}>
                              <View style={styles.scheduleRowLeft}>
                                <View
                                  style={[
                                    styles.scheduleIcon,
                                    { backgroundColor: tintBg },
                                  ]}
                                >
                                  <Icon
                                    name={
                                      isFood ? 'UtensilsCrossed' : 'Droplet'
                                    }
                                    size={16}
                                    color={tintFg}
                                    strokeWidth={2.2}
                                  />
                                </View>
                                <View style={styles.scheduleTimeBlock}>
                                  <Text
                                    weight="500"
                                    style={styles.scheduleTime}
                                  >
                                    {s.time}
                                  </Text>
                                  <Text style={styles.scheduleFreq}>
                                    {typeLabel} · {formatDays(s.daysOfWeek)}
                                  </Text>
                                </View>
                              </View>
                              <Switch
                                value={s.enabled}
                                onValueChange={() => onToggle(s.id)}
                                trackColor={{
                                  false: '#E9E9EA',
                                  true: semantic.primary,
                                }}
                                ios_backgroundColor="#E9E9EA"
                              />
                            </View>
                            <View style={styles.scheduleRowBottom}>
                              <Text style={styles.scheduleAmount}>
                                {s.amount}
                              </Text>
                              {s.note ? (
                                <Text
                                  style={styles.scheduleNote}
                                  numberOfLines={1}
                                >
                                  {s.note}
                                </Text>
                              ) : null}
                            </View>
                            {s.lastConfirmedAt &&
                            isSameLocalDay(s.lastConfirmedAt) ? (
                              <View style={styles.scheduleConfirmedRow}>
                                <Icon
                                  name="CheckCircle2"
                                  size={12}
                                  color="#4FB36C"
                                  strokeWidth={2.4}
                                />
                                <Text style={styles.scheduleConfirmedText}>
                                  {isFood ? 'ให้แล้ว' : 'เปลี่ยนน้ำแล้ว'} ·{' '}
                                  {formatHHMM(s.lastConfirmedAt)}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                        {!isLast && (
                          <View style={styles.settingsOptionDivider} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Settings sheet ---------- */

function SettingsSheet({
  preAppointment,
  setPreAppointment,
  preVaccine,
  setPreVaccine,
  preTreatment,
  setPreTreatment,
  onClose,
}: {
  preAppointment: { week: boolean; day: boolean; hour: boolean };
  setPreAppointment: (v: { week: boolean; day: boolean; hour: boolean }) => void;
  preVaccine: boolean;
  setPreVaccine: (v: boolean) => void;
  preTreatment: boolean;
  setPreTreatment: (v: boolean) => void;
  onClose: () => void;
}) {
  // Pull the first food / water schedule so the test feeding notification
  // carries a real scheduleId — tapping the action button will then update
  // that real schedule's `lastConfirmedAt` and the chip will appear in the
  // SchedulesSheet.
  const { schedules } = useSchedules();
  const firstFoodSchedule = schedules.find((s) => s.type === 'food');
  const firstWaterSchedule = schedules.find((s) => s.type === 'water');
  return (
    <View style={styles.sheetRoot}>
      <View style={styles.sheetHeader}>
        <Text weight="500" style={styles.sheetTitle}>
          ตั้งค่าแจ้งเตือน
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={styles.sheetClose}
          accessibilityLabel="ปิด"
        >
          <View style={styles.sheetCloseBtn}>
            <Icon name="X" size={14} color="#1A1A1A" strokeWidth={2.6} />
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.sheetBody}>
        {/* Banner — soft rose gradient + cat illustration */}
        <View style={styles.settingsBanner}>
          <LinearGradient
            pointerEvents="none"
            colors={['#FFE9EC', '#FBF3F4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.settingsBannerText}>
            <Text weight="500" style={styles.settingsBannerTitle} numberOfLines={1}>
              การแจ้งเตือนของคุณ
            </Text>
            <Text style={styles.settingsBannerDesc} numberOfLines={2}>
              เลือกประเภทและช่วงเวลาที่ต้องการให้เราเตือน
            </Text>
          </View>
          <Image
            source={require('../../assets/illustrations/cat-notification.png')}
            style={styles.settingsBannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Section: เตือนก่อนนัดหมาย */}
        <View style={styles.settingsSection}>
          <Text weight="500" style={styles.settingsSectionLabel}>
            เตือนก่อนนัดหมาย
          </Text>
          <View style={styles.settingsOptionCard}>
            <SettingsOption
              icon="CalendarDays"
              iconColor="#B86A7C"
              iconBg="#F5E4E7"
              label="ล่วงหน้า 1 สัปดาห์"
              value={preAppointment.week}
              onChange={(v) => setPreAppointment({ ...preAppointment, week: v })}
            />
            <View style={styles.settingsOptionDivider} />
            <SettingsOption
              icon="Calendar"
              iconColor="#D99A20"
              iconBg="#FFF6D9"
              label="ล่วงหน้า 1 วัน"
              value={preAppointment.day}
              onChange={(v) => setPreAppointment({ ...preAppointment, day: v })}
            />
            <View style={styles.settingsOptionDivider} />
            <SettingsOption
              icon="Clock"
              iconColor="#4A8FD1"
              iconBg="#E0F0FB"
              label="ล่วงหน้า 1 ชั่วโมง"
              value={preAppointment.hour}
              onChange={(v) => setPreAppointment({ ...preAppointment, hour: v })}
            />
          </View>
        </View>

        {/* Section: แจ้งเตือนจาก EHP VetCare */}
        <View style={styles.settingsSection}>
          <Text weight="500" style={styles.settingsSectionLabel}>
            แจ้งเตือนจาก EHP VetCare
          </Text>
          <View style={styles.settingsOptionCard}>
            <SettingsOption
              icon="Syringe"
              iconColor="#4FB36C"
              iconBg="#E7F5E9"
              label="วัคซีน"
              value={preVaccine}
              onChange={setPreVaccine}
            />
            <View style={styles.settingsOptionDivider} />
            <SettingsOption
              icon="Stethoscope"
              iconColor="#B86A7C"
              iconBg="#F5E4E7"
              label="การรักษา"
              value={preTreatment}
              onChange={setPreTreatment}
            />
          </View>
        </View>

        {/* Section: test notification — fire each banner type after 5 seconds
            so the user can lock the screen and see the banner with action
            buttons. Feeding/water tests carry a real scheduleId so confirming
            updates the SchedulesSheet's "ให้แล้ว HH:MM" chip. */}
        <View style={styles.settingsSection}>
          <Text weight="500" style={styles.settingsSectionLabel}>
            ทดสอบการแจ้งเตือน
          </Text>
          <TestRow
            label="ทดสอบ: ให้อาหาร (5 วินาที)"
            onPress={() =>
              scheduleLocal({
                title: 'ถึงเวลาให้อาหาร',
                body: firstFoodSchedule
                  ? `${firstFoodSchedule.petName} · ${firstFoodSchedule.amount}`
                  : 'ข้าวปั้น · 80 กรัม',
                seconds: 5,
                categoryIdentifier: FEEDING_FOOD_CATEGORY,
                data: {
                  kind: 'feeding',
                  type: 'food',
                  scheduleId: firstFoodSchedule?.id,
                },
              })
            }
          />
          <TestRow
            label="ทดสอบ: เปลี่ยนน้ำ (5 วินาที)"
            onPress={() =>
              scheduleLocal({
                title: 'ถึงเวลาเปลี่ยนน้ำ',
                body: firstWaterSchedule
                  ? `${firstWaterSchedule.petName} · ${firstWaterSchedule.amount}`
                  : 'ข้าวปั้น · 1 ชาม',
                seconds: 5,
                categoryIdentifier: FEEDING_WATER_CATEGORY,
                data: {
                  kind: 'feeding',
                  type: 'water',
                  scheduleId: firstWaterSchedule?.id,
                },
              })
            }
          />
          <TestRow
            label="ทดสอบ: นัดหมาย (5 วินาที)"
            onPress={() =>
              scheduleLocal({
                title: 'ใกล้ถึงวันนัดแล้ว',
                body: 'ตรวจสุขภาพประจำปี · ข้าวปั้น · พรุ่งนี้ 14:30',
                seconds: 5,
                data: { kind: 'appointment-test' },
              })
            }
          />
          <TestRow
            label="ทดสอบ: วัคซีน (5 วินาที)"
            onPress={() =>
              scheduleLocal({
                title: 'วัคซีนใกล้ครบกำหนด',
                body: 'มะลิ · วัคซีนรวม 5 โรค ครบกำหนด 15 มี.ค.',
                seconds: 5,
                data: { kind: 'vaccine-test' },
              })
            }
          />
          <TestRow
            label="ทดสอบ: ให้ยา (5 วินาที)"
            onPress={() =>
              scheduleLocal({
                title: 'ใกล้เวลาให้ยา',
                body: 'ข้าวปั้น · Apoquel 5.4mg · มื้อเย็น',
                seconds: 5,
                data: { kind: 'medication-test' },
              })
            }
          />
          <TestRow
            label="ทดสอบ: คำสั่งซื้อ (5 วินาที)"
            onPress={() =>
              scheduleLocal({
                title: 'คำสั่งซื้อจัดส่งแล้ว',
                body: 'Order #ORD-2025 · Prescription Diet 7kg · ถึงภายใน 2 วัน',
                seconds: 5,
                data: { kind: 'order-test' },
              })
            }
          />
          <TestRow
            label="ส่งแจ้งเตือนเดี๋ยวนี้ (no delay)"
            onPress={() =>
              notifyNow({
                title: 'ระบบแจ้งเตือนพร้อมใช้งาน',
                body: 'ระบบแจ้งเตือนพร้อมใช้งานแล้ว!',
              })
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

function TestRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsTestBtn,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text weight="500" style={styles.settingsTestBtnText}>
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsOption({
  icon,
  label,
  value,
  onChange,
  iconColor = semantic.primary,
  iconBg = semantic.primaryMuted,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <View style={styles.settingsOptionRow}>
      <View style={styles.settingsOptionLeft}>
        <View style={[styles.settingsOptionIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon as any} size={16} color={iconColor} strokeWidth={2.2} />
        </View>
        <Text weight="500" style={styles.settingsOptionLabel}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E9E9EA', true: semantic.primary }}
        ios_backgroundColor="#E9E9EA"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingBottom: 60,
  },

  // Floating toolbar at top
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: spacing.sm,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  // Hero header
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 48,
    color: '#1A1A1A',
    letterSpacing: 0,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: '#8E8E93',
    letterSpacing: -0.1,
  },

  // Filter chips
  chipsScroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 1000,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  chipActive: {
    backgroundColor: semantic.primary,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 1000,
  },
  chipCompact: {
    width: 40,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.primary,
    marginLeft: 2,
  },
  chipDotFloating: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.primary,
  },
  chipDotActive: {
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3C3C43',
    letterSpacing: -0.2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Content
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },

  // Reminder card
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  reminderTitle: {
    flex: 1,
    paddingRight: 8,
  },
  reminderPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  iconStack: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  iconPetBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  reminderBody: {
    flex: 1,
    gap: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semantic.primary,
    marginTop: 8,
  },
  inlineAction: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  feedingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  feedingBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: semantic.primary,
  },
  feedingBtnPrimaryText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  feedingBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: semantic.primary + '55',
  },
  feedingBtnSecondaryText: {
    fontSize: 13,
    color: semantic.primary,
  },

  // Schedule card
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleBody: {
    flex: 1,
    gap: 2,
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  addWrap: {
    marginTop: spacing.xl,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Settings sheet
  sheetRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sheetHeader: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sheetTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  sheetClose: {
    position: 'absolute',
    right: 16,
    top: 8,
  },
  sheetCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginLeft: spacing.xl + 32 + spacing.md,
    backgroundColor: semantic.border,
  },

  // Dropdown menu — anchored to the More button
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Trailing slot inside StickyAppBar — same look as IconButton md
  appbarMoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  // Outer wrapper — carries the shadow (no overflow:hidden so iOS renders shadow)
  morph: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  // Inner wrapper — clips content (BlurView, items) to rounded shape
  morphInside: {
    overflow: 'hidden',
  },
  morphBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 24,
  },
  morphIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  menuInner: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
    letterSpacing: -0.1,
    fontFamily: 'GoogleSans_500Medium',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 0,
  },

  // Settings sheet — Figma design
  settingsBanner: {
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 91,
    position: 'relative',
  },
  settingsBannerText: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  settingsBannerTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000000',
  },
  settingsBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#1A1A1A',
  },
  settingsBannerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
  },
  settingsSection: {
    marginTop: 16,
    gap: 10,
  },
  settingsSectionLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  settingsOptionCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    overflow: 'hidden',
  },
  settingsOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsOptionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsOptionLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  settingsOptionDivider: {
    height: 1,
    backgroundColor: '#F2F2F3',
  },
  settingsTestBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D0D0D4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  settingsTestBtnText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
  },

  // Feeding schedule banner — gray card + text/btn left + illustration right
  scheduleBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingRight: 91,
    minHeight: 130,
    position: 'relative',
  },
  scheduleBannerText: {
    flex: 1,
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  scheduleBannerTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000000',
  },
  scheduleBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#1A1A1A',
  },
  scheduleBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: semantic.primary,
    marginTop: 4,
  },
  scheduleBannerBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  scheduleBannerImageWrap: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    width: 100,
    height: 100,
  },
  scheduleBannerImage: {
    width: '100%',
    height: '100%',
  },

  // Schedule row v2 — top: icon + time + freq + toggle, bottom: amount + pets
  scheduleRowV2: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  scheduleRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTimeBlock: {
    gap: 2,
  },
  scheduleTime: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  scheduleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleFreq: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9A9AA0',
  },
  scheduleRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 42,
  },
  scheduleAmount: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  scheduleNote: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9A9AA0',
    flexShrink: 1,
    textAlign: 'right',
  },
  scheduleConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 42,
    marginTop: 2,
  },
  scheduleConfirmedText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#4FB36C',
  },
  scheduleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  scheduleSectionMeta: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9A9AA0',
  },
  schedulePetGroup: {
    gap: 8,
  },
  schedulePetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  schedulePetHeaderName: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  schedulePetHeaderMeta: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9A9AA0',
  },
  scheduleEmpty: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
  },
  scheduleEmptyTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  scheduleEmptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9A9AA0',
    textAlign: 'center',
  },

  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },

});
// Reference radii constant to avoid unused import warning when downstream
// theming changes simplify this file.
void radii;
