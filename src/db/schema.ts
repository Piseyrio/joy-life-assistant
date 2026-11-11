import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color'),
    archivedAt: integer('archived_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('idx_projects_updated').on(t.updatedAt), index('idx_projects_archived').on(t.archivedAt)],
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default('TODO'),
    priority: text('priority').notNull().default('MEDIUM'),
    projectId: text('project_id'),
    dueAt: integer('due_at'),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('idx_tasks_status').on(t.status),
    index('idx_tasks_due_at').on(t.dueAt),
    index('idx_tasks_priority').on(t.priority),
    index('idx_tasks_project').on(t.projectId),
  ],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    projectId: text('project_id'),
    taskId: text('task_id'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('idx_notes_updated').on(t.updatedAt),
    index('idx_notes_project').on(t.projectId),
    index('idx_notes_task').on(t.taskId),
  ],
);

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id'),
    kind: text('kind').notNull(),
    fireAt: integer('fire_at').notNull(),
    status: text('status').notNull().default('PENDING'),
    repeatIndex: integer('repeat_index').notNull().default(0),
    notificationId: text('notification_id'),
    localDateKey: text('local_date_key').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('idx_reminders_task').on(t.taskId),
    index('idx_reminders_fire').on(t.fireAt),
    index('idx_reminders_status').on(t.status),
    index('idx_reminders_notif').on(t.notificationId),
  ],
);

export const taskActivity = sqliteTable(
  'task_activity',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id').notNull(),
    action: text('action').notNull(),
    detail: text('detail'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('idx_activity_task').on(t.taskId),
    index('idx_activity_created').on(t.createdAt),
  ],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const notificationHistory = sqliteTable(
  'notification_history',
  {
    id: text('id').primaryKey(),
    reminderId: text('reminder_id'),
    taskId: text('task_id'),
    title: text('title').notNull(),
    body: text('body'),
    event: text('event').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('idx_notif_history_created').on(t.createdAt),
    index('idx_notif_history_task').on(t.taskId),
  ],
);

export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type TaskActivity = typeof taskActivity.$inferSelect;
export type SettingRow = typeof settings.$inferSelect;
export type NotificationHistory = typeof notificationHistory.$inferSelect;
