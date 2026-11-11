import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { initDatabase } from '../db/client';
import type { Task } from '../db/schema';
import {
  completeTask,
  createTask,
  getTodayDashboard,
  listInboxTasks,
  permanentlyDeleteTask,
  quickCapture,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../services/taskService';
import {
  cancelTaskReminders,
  reconcileNotifications,
  scheduleRemindersForTask,
  snoozeTask,
  listNotificationHistory,
} from '../services/reminderService';
import {
  requestNotificationPermissions,
  setupNotificationInfrastructure,
} from '../services/notificationService';
import { getSettings, updateSettings } from '../services/settingsService';
import type { AppSettings } from '../types/models';

type TodayData = Awaited<ReturnType<typeof getTodayDashboard>>;

type AppContextValue = {
  ready: boolean;
  error: string | null;
  permissionMessage?: string;
  inbox: Task[];
  today: TodayData | null;
  settings: AppSettings | null;
  refresh: () => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  capture: (title: string) => Promise<Task>;
  editTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
  markDone: (id: string) => Promise<void>;
  saveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  loadHistory: () => ReturnType<typeof listNotificationHistory>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | undefined>();
  const [inbox, setInbox] = useState<Task[]>([]);
  const [today, setToday] = useState<TodayData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const refresh = useCallback(async () => {
    const [inboxRows, todayData, s] = await Promise.all([
      listInboxTasks(),
      getTodayDashboard(),
      getSettings(),
    ]);
    setInbox(inboxRows);
    setToday(todayData);
    setSettings(s);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDatabase();
        await setupNotificationInfrastructure();
        const perm = await requestNotificationPermissions();
        if (mounted && perm.message) setPermissionMessage(perm.message);
        await reconcileNotifications();
        await refresh();
        if (mounted) setReady(true);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to start');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as {
        taskId?: string;
      };
      const action = response.actionIdentifier;
      const taskId = data?.taskId;
      if (!taskId) return;

      try {
        if (action === 'DONE' || action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          if (action === 'DONE') {
            await completeTask(taskId);
            await cancelTaskReminders(taskId);
          }
        } else if (action === 'SNOOZE_15') {
          await snoozeTask(taskId, 15);
        } else if (action === 'SNOOZE_30') {
          await snoozeTask(taskId, 30);
        } else if (action === 'SNOOZE_60') {
          await snoozeTask(taskId, 60);
        } else if (action === 'SNOOZE_TOMORROW') {
          await snoozeTask(taskId, 'tomorrow');
        }
        await refresh();
      } catch {
        // keep app stable
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      const task = await createTask(input);
      if (task.dueAt) await scheduleRemindersForTask(task.id);
      await refresh();
      return task;
    },
    [refresh],
  );

  const capture = useCallback(
    async (title: string) => {
      const task = await quickCapture(title);
      await refresh();
      return task;
    },
    [refresh],
  );

  const editTask = useCallback(
    async (id: string, input: UpdateTaskInput) => {
      const task = await updateTask(id, input);
      if (task.status === 'DONE' || task.status === 'CANCELLED') {
        await cancelTaskReminders(id);
      } else if (task.dueAt) {
        await scheduleRemindersForTask(id);
      } else {
        await cancelTaskReminders(id);
      }
      await refresh();
      return task;
    },
    [refresh],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await cancelTaskReminders(id);
      await permanentlyDeleteTask(id);
      await refresh();
    },
    [refresh],
  );

  const markDone = useCallback(
    async (id: string) => {
      await completeTask(id);
      await cancelTaskReminders(id);
      await refresh();
    },
    [refresh],
  );

  const saveSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const next = await updateSettings(partial);
      setSettings(next);
      await reconcileNotifications();
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      error,
      permissionMessage,
      inbox,
      today,
      settings,
      refresh,
      addTask,
      capture,
      editTask,
      removeTask,
      markDone,
      saveSettings,
      loadHistory: listNotificationHistory,
    }),
    [
      ready,
      error,
      permissionMessage,
      inbox,
      today,
      settings,
      refresh,
      addTask,
      capture,
      editTask,
      removeTask,
      markDone,
      saveSettings,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
