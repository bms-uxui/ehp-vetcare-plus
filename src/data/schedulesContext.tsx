import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FeedingSchedule, mockSchedules } from './reminders';
import {
  cancelById,
  scheduleDaily,
  scheduleWeekly,
  FEEDING_FOOD_CATEGORY,
  FEEDING_WATER_CATEGORY,
} from '../lib/notifications';

const HEADING_FOOD = 'ถึงเวลาให้อาหาร';
const HEADING_WATER = 'ถึงเวลาเปลี่ยนน้ำ';

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':');
  return { hour: Number(h) || 0, minute: Number(m) || 0 };
}

function scheduleIds(schedule: FeedingSchedule): string[] {
  if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
    return [`feed-${schedule.id}`];
  }
  return schedule.daysOfWeek.map((d) => `feed-${schedule.id}-${d}`);
}

async function cancelScheduleNotifications(schedule: FeedingSchedule) {
  await Promise.all(scheduleIds(schedule).map(cancelById));
}

async function syncScheduleNotifications(schedule: FeedingSchedule) {
  await cancelScheduleNotifications(schedule);
  if (!schedule.enabled) return;

  const { hour, minute } = parseTime(schedule.time);
  const isFood = schedule.type === 'food';
  const heading = isFood ? HEADING_FOOD : HEADING_WATER;
  const body = `${schedule.petName} · ${schedule.amount}`;
  const data = { kind: 'feeding', scheduleId: schedule.id, type: schedule.type };
  const categoryIdentifier = isFood
    ? FEEDING_FOOD_CATEGORY
    : FEEDING_WATER_CATEGORY;

  if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
    await scheduleDaily({
      hour,
      minute,
      title: heading,
      body,
      identifier: `feed-${schedule.id}`,
      data,
      categoryIdentifier,
    });
    return;
  }

  await Promise.all(
    schedule.daysOfWeek.map((d) =>
      scheduleWeekly({
        weekdayJs: d,
        hour,
        minute,
        title: heading,
        body,
        identifier: `feed-${schedule.id}-${d}`,
        data,
        categoryIdentifier,
      }),
    ),
  );
}

type SchedulesContextValue = {
  schedules: FeedingSchedule[];
  addSchedule: (schedule: Omit<FeedingSchedule, 'id'>) => FeedingSchedule;
  updateSchedule: (
    id: string,
    patch: Partial<Omit<FeedingSchedule, 'id'>>,
  ) => void;
  toggleSchedule: (id: string) => void;
  removeSchedule: (id: string) => void;
  confirmSchedule: (id: string) => void;
};

const SchedulesContext = createContext<SchedulesContextValue | null>(null);

// Module-scoped escape hatch so the iOS notification response listener (which
// runs outside React) can mark a schedule as confirmed when the user taps the
// "ให้อาหารแล้ว" / "เปลี่ยนน้ำแล้ว" button on the banner.
let externalConfirm: ((id: string) => void) | null = null;
export function confirmScheduleFromExternal(id: string) {
  externalConfirm?.(id);
}

let counter = 0;
const makeId = () => {
  counter += 1;
  return `s-${Date.now().toString(36)}-${counter}`;
};

export function SchedulesProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<FeedingSchedule[]>(() => [
    ...mockSchedules,
  ]);

  // Register iOS local notifications for whatever is currently enabled when
  // the provider mounts (covers app cold-start). Re-running syncScheduleNotifications
  // is idempotent because we cancel-then-schedule under stable identifiers.
  useEffect(() => {
    schedules.forEach((s) => {
      syncScheduleNotifications(s).catch(() => {});
    });
    // Only on mount — subsequent changes are handled per-action below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSchedule = useCallback(
    (schedule: Omit<FeedingSchedule, 'id'>) => {
      const created: FeedingSchedule = { ...schedule, id: makeId() };
      setSchedules((prev) => [...prev, created]);
      syncScheduleNotifications(created).catch(() => {});
      return created;
    },
    [],
  );

  const updateSchedule = useCallback(
    (id: string, patch: Partial<Omit<FeedingSchedule, 'id'>>) => {
      setSchedules((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
        const updated = next.find((s) => s.id === id);
        if (updated) syncScheduleNotifications(updated).catch(() => {});
        return next;
      });
    },
    [],
  );

  const toggleSchedule = useCallback((id: string) => {
    setSchedules((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s,
      );
      const toggled = next.find((s) => s.id === id);
      if (toggled) syncScheduleNotifications(toggled).catch(() => {});
      return next;
    });
  }, []);

  const removeSchedule = useCallback((id: string) => {
    setSchedules((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) cancelScheduleNotifications(target).catch(() => {});
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const confirmSchedule = useCallback((id: string) => {
    const now = new Date().toISOString();
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lastConfirmedAt: now } : s)),
    );
  }, []);

  // Expose confirmSchedule to the module-scoped escape hatch so the iOS
  // notification response listener can mark a schedule as confirmed.
  useEffect(() => {
    externalConfirm = confirmSchedule;
    return () => {
      externalConfirm = null;
    };
  }, [confirmSchedule]);

  const value = useMemo<SchedulesContextValue>(
    () => ({
      schedules,
      addSchedule,
      updateSchedule,
      toggleSchedule,
      removeSchedule,
      confirmSchedule,
    }),
    [
      schedules,
      addSchedule,
      updateSchedule,
      toggleSchedule,
      removeSchedule,
      confirmSchedule,
    ],
  );

  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
}

export function useSchedules(): SchedulesContextValue {
  const ctx = useContext(SchedulesContext);
  if (!ctx)
    throw new Error('useSchedules must be used within SchedulesProvider');
  return ctx;
}
