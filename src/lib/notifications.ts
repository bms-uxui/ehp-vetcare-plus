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
  title: string;
  body: string;
  /** Fire after this many seconds. */
  seconds?: number;
  /** Or fire at this specific Date. Takes precedence over `seconds`. */
  date?: Date;
  data?: Record<string, unknown>;
};

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

  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
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
