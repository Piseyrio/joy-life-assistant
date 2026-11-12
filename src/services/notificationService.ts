import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking } from 'react-native';
import { createId } from '../utils/ids';

export const CHANNEL_ID = 'joy-reminders';
export const CATEGORY_ID = 'JOY_TASK_ACTIONS';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PermissionResult = {
  granted: boolean;
  canAskAgain: boolean;
  exactAlarmLikely: boolean;
  message?: string;
};

export async function setupNotificationInfrastructure(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Joy Reminders',
      // 5 === AndroidImportance.MAX (avoid fragile namespace re-export typing)
      importance: 5,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B9EFF',
      bypassDnd: false,
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: 'SNOOZE_15',
      buttonTitle: '15 min',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE_30',
      buttonTitle: '30 min',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE_60',
      buttonTitle: '1 hour',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE_TOMORROW',
      buttonTitle: 'Tomorrow',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'DONE',
      buttonTitle: 'Done',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

export async function requestNotificationPermissions(): Promise<PermissionResult> {
  if (!Device.isDevice && Platform.OS === 'android') {
    // Emulators still work for local notifications on Android
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;
  if (current.status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    finalStatus = asked.status;
  }

  const granted = finalStatus === 'granted';
  let exactAlarmLikely = true;
  let message: string | undefined;

  if (!granted) {
    message =
      'Notifications are off. Enable them in system settings so Joy can remind you on time.';
  }

  if (Platform.OS === 'android' && Platform.Version >= 31) {
    try {
      // Expo exposes exact alarm APIs on recent SDKs; fall back gracefully if unavailable
      const anyNotif = Notifications as unknown as {
        getPermissionsAsync?: typeof Notifications.getPermissionsAsync;
        canScheduleExactNotificationsAsync?: () => Promise<boolean>;
        requestExactNotificationPermissionsAsync?: () => Promise<boolean>;
      };
      if (typeof anyNotif.canScheduleExactNotificationsAsync === 'function') {
        exactAlarmLikely = await anyNotif.canScheduleExactNotificationsAsync();
        if (!exactAlarmLikely && typeof anyNotif.requestExactNotificationPermissionsAsync === 'function') {
          exactAlarmLikely = await anyNotif.requestExactNotificationPermissionsAsync();
        }
        if (!exactAlarmLikely) {
          message =
            (message ? message + ' ' : '') +
            'Exact alarms are disabled. Reminders may be delayed. Open system settings → Alarms & reminders and allow JOY LIFE ASSISTANT.';
        }
      }
    } catch {
      exactAlarmLikely = false;
      message =
        (message ? message + ' ' : '') +
        'Could not verify exact alarm permission. Reminders will still be scheduled with best-effort timing.';
    }
  }

  return {
    granted,
    canAskAgain: current.canAskAgain ?? true,
    exactAlarmLikely,
    message,
  };
}

export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  fireAtUtcMs: number;
  data: Record<string, unknown>;
  useExact?: boolean;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data,
      categoryIdentifier: CATEGORY_ID,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(params.fireAtUtcMs),
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
  return id;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already gone
  }
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduled(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.openSettings();
    } catch {
      // ignore
    }
  }
}

export function makeNotificationClientId(): string {
  return createId();
}
