PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS `notes` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `project_id` text,
  `task_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`)
);

CREATE INDEX IF NOT EXISTS `idx_notes_updated` ON `notes` (`updated_at`);
CREATE INDEX IF NOT EXISTS `idx_notes_project` ON `notes` (`project_id`);
CREATE INDEX IF NOT EXISTS `idx_notes_task` ON `notes` (`task_id`);
CREATE INDEX IF NOT EXISTS `idx_projects_archived` ON `projects` (`archived_at`);
