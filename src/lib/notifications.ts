import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// How notifications behave when received while the app is foregrounded.
// We show the banner + play sound + bump the badge on iOS so users see them
// inside the app too — matches "in-app + outside-app" behavior.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type ScheduleInput = {
  /**
   * Notification heading — what is this notification about? Shown as the
   * subtitle line of the iOS banner. The bold top line of the banner is
   * always the app name (APP_NAME), set by us so notifications consistently
   * read as coming from "EHP VetCare Plus".
   */
  title: string;
  /** Detail text. Keep concise — iOS shows up to ~3 lines on the banner. */
  body: string;
  /** Fire after this many seconds. */
  seconds?: number;
  /** Or fire at this specific Date. Takes precedence over `seconds`. */
  date?: Date;
  data?: Record<string, unknown>;
  /** Attach a registered category so the banner shows action buttons. */
  categoryIdentifier?: string;
};

const APP_NAME = 'EHP VetCare Plus';

// iOS notification action button identifiers — referenced by category and
// response listener so taps on banner buttons can be handled in JS.
export const FEEDING_FOOD_CATEGORY = 'feeding-food';
export const FEEDING_WATER_CATEGORY = 'feeding-water';
export const ACTION_CONFIRM_FEED = 'CONFIRM_FEED';
export const ACTION_CONFIRM_WATER = 'CONFIRM_WATER';
export const ACTION_SNOOZE_5MIN = 'SNOOZE_5MIN';

const SNOOZE_SECONDS = 5 * 60;

/**
 * Register category buttons once at app start. iOS keeps these in its category
 * registry; subsequent notifications referencing the category id will display
 * the buttons under the banner when the user long-presses or pulls down.
 */
export async function setupNotificationCategories() {
  await Promise.all([
    Notifications.setNotificationCategoryAsync(FEEDING_FOOD_CATEGORY, [
      {
        identifier: ACTION_CONFIRM_FEED,
        buttonTitle: 'ให้อาหารแล้ว',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_SNOOZE_5MIN,
        buttonTitle: 'เตือนอีกครั้งใน 5 นาที',
        options: { opensAppToForeground: false },
      },
    ]),
    Notifications.setNotificationCategoryAsync(FEEDING_WATER_CATEGORY, [
      {
        identifier: ACTION_CONFIRM_WATER,
        buttonTitle: 'เปลี่ยนน้ำแล้ว',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_SNOOZE_5MIN,
        buttonTitle: 'เตือนอีกครั้งใน 5 นาที',
        options: { opensAppToForeground: false },
      },
    ]),
  ]);
}

/**
 * Re-schedule the same notification 5 minutes from now. Pulled from the
 * incoming response's content so we keep the same heading/body/category
 * (and the action buttons keep working on the snoozed banner).
 */
export async function snoozeFromResponse(
  response: Notifications.NotificationResponse,
): Promise<string | null> {
  const content = response.notification.request.content;
  const ok = await ensurePermission();
  if (!ok) return null;
  return Notifications.scheduleNotificationAsync({
    identifier: `snooze-${Date.now()}`,
    content: {
      title: content.title ?? APP_NAME,
      subtitle: content.subtitle ?? undefined,
      body: content.body ?? '',
      data: content.data ?? undefined,
      sound: 'default',
      ...(content.categoryIdentifier
        ? { categoryIdentifier: content.categoryIdentifier }
        : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_SECONDS,
      repeats: false,
    },
  });
}

let permissionStatus: 'granted' | 'denied' | 'undetermined' = 'undetermined';

export async function ensurePermission(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulators (iOS) can show local notifications, but remote push needs a real device.
    // Local-only flow: still try to request — on iOS Simulator it succeeds.
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'การแจ้งเตือนทั่วไป',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9F5266',
    });
  }

  // expo-notifications types extend PermissionResponse from a nested
  // expo-modules-core copy that TS can't resolve here — cast to access
  // `granted` boolean which is part of the runtime contract.
  const existing = (await Notifications.getPermissionsAsync()) as unknown as {
    granted: boolean;
  };
  let granted = existing.granted;
  if (!granted) {
    const req = (await Notifications.requestPermissionsAsync()) as unknown as {
      granted: boolean;
    };
    granted = req.granted;
  }
  permissionStatus = granted ? 'granted' : 'denied';
  return granted;
}

export function getPermissionStatus() {
  return permissionStatus;
}

export async function scheduleLocal({
  title,
  body,
  seconds,
  date,
  data,
  categoryIdentifier,
}: ScheduleInput): Promise<string | null> {
  const ok = await ensurePermission();
  if (!ok) return null;

  const trigger: Notifications.NotificationTriggerInput = date
    ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date }
    : seconds && seconds > 0
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        }
      : null;

  // Banner layout we want iOS to render:
  //   [icon]  EHP VetCare Plus           ← iOS title field (always APP_NAME)
  //           <heading>                  ← iOS subtitle field (caller's `title`)
  //           <details, up to 3 lines>   ← iOS body field (caller's `body`)
  return Notifications.scheduleNotificationAsync({
    content: buildContent(title, body, data, categoryIdentifier),
    trigger,
  });
}

/** Fire a notification right now (1s delay so iOS shows the banner reliably). */
export function notifyNow(input: Omit<ScheduleInput, 'seconds' | 'date'>) {
  return scheduleLocal({ ...input, seconds: 1 });
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelById(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Already gone or never scheduled — safe to ignore.
  }
}

/**
 * Build the notification content the way every banner in this app should look:
 * top line is always APP_NAME, subtitle is the heading, body is details.
 */
function buildContent(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  categoryIdentifier?: string,
): Notifications.NotificationContentInput {
  return {
    title: APP_NAME,
    subtitle: title,
    body,
    data,
    sound: 'default',
    ...(categoryIdentifier ? { categoryIdentifier } : {}),
  };
}

/**
 * Schedule a one-shot notification at a specific Date with a stable identifier
 * so we can cancel it later (e.g. user disables the appointment reminder).
 */
export async function scheduleAt({
  date,
  title,
  body,
  identifier,
  data,
}: {
  date: Date;
  title: string;
  body: string;
  identifier: string;
  data?: Record<string, unknown>;
}): Promise<string | null> {
  if (date.getTime() <= Date.now()) return null;
  const ok = await ensurePermission();
  if (!ok) return null;
  await cancelById(identifier);
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: buildContent(title, body, data),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/**
 * Repeat every day at hour:minute. Used for feeding schedules with `daysOfWeek = []`.
 * iOS DAILY trigger ignores seconds — fires at the next hh:mm and every 24h.
 */
export async function scheduleDaily({
  hour,
  minute,
  title,
  body,
  identifier,
  data,
  categoryIdentifier,
}: {
  hour: number;
  minute: number;
  title: string;
  body: string;
  identifier: string;
  data?: Record<string, unknown>;
  categoryIdentifier?: string;
}): Promise<string | null> {
  const ok = await ensurePermission();
  if (!ok) return null;
  await cancelById(identifier);
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: buildContent(title, body, data, categoryIdentifier),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Repeat weekly on a single weekday. iOS weekday convention is 1=Sunday..7=Saturday.
 * Caller passes JS weekday (0=Sunday..6=Saturday) — we add 1.
 */
export async function scheduleWeekly({
  weekdayJs,
  hour,
  minute,
  title,
  body,
  identifier,
  data,
  categoryIdentifier,
}: {
  weekdayJs: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
  identifier: string;
  data?: Record<string, unknown>;
  categoryIdentifier?: string;
}): Promise<string | null> {
  const ok = await ensurePermission();
  if (!ok) return null;
  await cancelById(identifier);
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: buildContent(title, body, data, categoryIdentifier),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weekdayJs + 1,
      hour,
      minute,
    },
  });
}
