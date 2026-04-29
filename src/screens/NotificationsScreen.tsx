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
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
  StickyAppBar,
  Text,
} from '../components';
import { radii, semantic, spacing } from '../theme';
import {
  mockReminders,
  mockSchedules,
  reminderMeta,
  relativeTime,
  Reminder,
  FeedingSchedule,
} from '../data/reminders';
import { notifyNow, scheduleLocal } from '../lib/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type FilterKey =
  | 'all'
  | 'feeding'
  | 'appointment'
  | 'vaccine'
  | 'contact'
  | 'order';

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'ทั้งหมด', icon: 'Bell' },
  { key: 'feeding', label: 'ให้อาหาร', icon: 'UtensilsCrossed' },
  { key: 'appointment', label: 'นัดหมาย', icon: 'Calendar' },
  { key: 'vaccine', label: 'วัคซีน', icon: 'Syringe' },
  { key: 'contact', label: 'ติดต่อ', icon: 'MessageCircle' },
  { key: 'order', label: 'การสั่งซื้อ', icon: 'Package' },
];

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [schedules, setSchedules] = useState(mockSchedules);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(false);

  const [preAppointment, setPreAppointment] = useState({
    week: true,
    day: true,
    hour: true,
  });
  const [preVaccine, setPreVaccine] = useState(true);
  const [preTreatment, setPreTreatment] = useState(true);
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

  const markAllRead = () => {
    setReadIds(new Set(mockReminders.map((r) => r.id)));
  };

  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
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
      borderRadius: 22 - 6 * v,
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
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Icon
                  name={f.icon as any}
                  size={12}
                  color={active ? '#FFFFFF' : '#3C3C43'}
                  strokeWidth={2.4}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
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
          <Card key={r.id} variant="elevated" padding="lg">
            <View style={styles.reminderRow}>
              <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                <Icon name={meta.icon as any} size={20} color={meta.fg} />
              </View>
              <View style={styles.reminderBody}>
                <View style={styles.reminderTopRow}>
                  <Text variant="overline" color={meta.fg}>
                    {meta.label}
                  </Text>
                  <Text variant="caption" color={semantic.textMuted}>
                    {relativeTime(r.dueISO)}
                  </Text>
                </View>
                <Text variant="bodyStrong">{r.title}</Text>
                <Text variant="caption" color={semantic.textSecondary}>
                  {r.description}
                </Text>
                {r.petName && (
                  <Text variant="caption" color={semantic.textMuted}>
                    {r.petEmoji} {r.petName}
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
          </Card>
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

/* ---------- Schedules sheet ---------- */

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

        {/* Section: ตารางให้อาหาร */}
        <View style={styles.settingsSection}>
          <Text weight="500" style={styles.settingsSectionLabel}>
            ตารางให้อาหาร
          </Text>
          <View style={styles.settingsOptionCard}>
            {schedules.map((s, idx) => {
              const isFood = s.type === 'food';
              const isLast = idx === schedules.length - 1;
              return (
                <View key={s.id}>
                  <View style={styles.scheduleRowV2}>
                    <View style={styles.scheduleRowTop}>
                      <View style={styles.scheduleRowLeft}>
                        <View
                          style={[
                            styles.scheduleIcon,
                            { backgroundColor: '#FFFFFF' },
                          ]}
                        >
                          <Icon
                            name={isFood ? 'UtensilsCrossed' : 'Droplet'}
                            size={14}
                            color={isFood ? '#D99A20' : '#4A8FD1'}
                            strokeWidth={2.2}
                          />
                        </View>
                        <Text weight="500" style={styles.scheduleTime}>
                          {s.time}
                        </Text>
                      </View>
                      <View style={styles.scheduleRowRight}>
                        <Text style={styles.scheduleFreq}>ทุกวัน</Text>
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
                    </View>
                    <View style={styles.scheduleRowBottom}>
                      <Text style={styles.scheduleAmount}>{s.amount}</Text>
                      <View style={styles.schedulePetRow}>
                        <Text style={styles.schedulePetEmoji}>{s.petEmoji}</Text>
                      </View>
                    </View>
                  </View>
                  {!isLast && <View style={styles.settingsOptionDivider} />}
                </View>
              );
            })}
          </View>
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

        {/* Section: test notification */}
        <View style={styles.settingsSection}>
          <Text weight="500" style={styles.settingsSectionLabel}>
            ทดสอบการแจ้งเตือน
          </Text>
          <Pressable
            onPress={() =>
              notifyNow({
                title: '🐾 EHP VetCare',
                body: 'ระบบแจ้งเตือนพร้อมใช้งานแล้ว!',
              })
            }
            style={({ pressed }) => [
              styles.settingsTestBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text weight="500" style={styles.settingsTestBtnText}>
              ส่งแจ้งเตือนเดี๋ยวนี้
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              scheduleLocal({
                title: '⏰ ครบกำหนด',
                seconds: 5,
                body: 'นี่คือตัวอย่างแจ้งเตือนที่ตั้งล่วงหน้า — ทำงานแม้ปิดหน้าจอ',
              })
            }
            style={({ pressed }) => [
              styles.settingsTestBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text weight="500" style={styles.settingsTestBtnText}>
              แจ้งเตือนใน 5 วินาที (ลองล็อกหน้าจอดู)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
      <AppleToggle value={value} onChange={onChange} />
    </View>
  );
}

/* ---------- AppleToggle — visually matches iOS Switch (51×31, white knob 27)
   without relying on UISwitch's tintColor which can desync on Fabric. */

const TOGGLE_W = 51;
const TOGGLE_H = 31;
const KNOB_SIZE = 27;
const TOGGLE_PAD = 2;
const KNOB_TRAVEL = TOGGLE_W - KNOB_SIZE - TOGGLE_PAD * 2;

function AppleToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const anim = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    anim.value = withSpring(value ? 1 : 0, {
      damping: 24,
      stiffness: 320,
      mass: 0.6,
    });
  }, [value, anim]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      anim.value,
      [0, 1],
      ['#E9E9EA', semantic.primary],
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: anim.value * KNOB_TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={6}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={styles.toggleTrack}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.toggleBg, trackStyle]} />
      <Animated.View style={[styles.toggleKnob, knobStyle]} />
    </Pressable>
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
    paddingVertical: spacing.sm,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 1000,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  chipActive: {
    backgroundColor: semantic.primary,
  },
  chipText: {
    fontSize: 13,
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
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
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
    borderRadius: 16,
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
  scheduleTime: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  scheduleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleFreq: {
    fontSize: 10,
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
  schedulePetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schedulePetEmoji: {
    fontSize: 14,
  },

  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },

  // iOS Switch lookalike (51×31)
  toggleTrack: {
    width: TOGGLE_W,
    height: TOGGLE_H,
    borderRadius: TOGGLE_H / 2,
    padding: TOGGLE_PAD,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toggleBg: {
    borderRadius: TOGGLE_H / 2,
  },
  toggleKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
// Reference radii constant to avoid unused import warning when downstream
// theming changes simplify this file.
void radii;
