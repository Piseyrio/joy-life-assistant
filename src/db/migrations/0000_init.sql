PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `color` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `notes` text,
  `status` text DEFAULT 'TODO' NOT NULL,
  `priority` text DEFAULT 'MEDIUM' NOT NULL,
  `project_id` text,
  `due_at` integer,
  `completed_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);

CREATE TABLE IF NOT EXISTS `reminders` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text,
  `kind` text NOT NULL,
  `fire_at` integer NOT NULL,
  `status` text DEFAULT 'PENDING' NOT NULL,
  `repeat_index` integer DEFAULT 0 NOT NULL,
  `notification_id` text,
  `local_date_key` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`)
);

CREATE TABLE IF NOT EXISTS `task_activity` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `action` text NOT NULL,
  `detail` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`)
);

CREATE TABLE IF NOT EXISTS `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `notification_history` (
  `id` text PRIMARY KEY NOT NULL,
  `reminder_id` text,
  `task_id` text,
  `title` text NOT NULL,
  `body` text,
  `event` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_projects_updated` ON `projects` (`updated_at`);
CREATE INDEX IF NOT EXISTS `idx_tasks_status` ON `tasks` (`status`);
CREATE INDEX IF NOT EXISTS `idx_tasks_due_at` ON `tasks` (`due_at`);
CREATE INDEX IF NOT EXISTS `idx_tasks_priority` ON `tasks` (`priority`);
CREATE INDEX IF NOT EXISTS `idx_tasks_project` ON `tasks` (`project_id`);
CREATE INDEX IF NOT EXISTS `idx_reminders_task` ON `reminders` (`task_id`);
CREATE INDEX IF NOT EXISTS `idx_reminders_fire` ON `reminders` (`fire_at`);
CREATE INDEX IF NOT EXISTS `idx_reminders_status` ON `reminders` (`status`);
CREATE INDEX IF NOT EXISTS `idx_reminders_notif` ON `reminders` (`notification_id`);
CREATE INDEX IF NOT EXISTS `idx_activity_task` ON `task_activity` (`task_id`);
CREATE INDEX IF NOT EXISTS `idx_activity_created` ON `task_activity` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_notif_history_created` ON `notification_history` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_notif_history_task` ON `notification_history` (`task_id`);
