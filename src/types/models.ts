export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const REMINDER_KINDS = [
  'DEADLINE',
  'REPEAT_30M',
  'REPEAT_2H',
  'NEXT_MORNING',
  'SNOOZE',
  'EVENING_REVIEW',
] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMINDER_STATUSES = ['PENDING', 'FIRED', 'CANCELLED', 'SNOOZED'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export type AppSettings = {
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  eveningReviewEnabled: boolean;
  eveningReviewTime: string; // HH:mm
  reminderRepeatsEnabled: boolean;
  nextMorningEnabled: boolean;
  nextMorningTime: string; // HH:mm
  timezone: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  eveningReviewEnabled: true,
  eveningReviewTime: '20:00',
  reminderRepeatsEnabled: true,
  nextMorningEnabled: true,
  nextMorningTime: '08:00',
  timezone: 'Asia/Phnom_Penh',
};
