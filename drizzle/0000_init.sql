CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`subject` text,
	`type` text DEFAULT 'entrega' NOT NULL,
	`due_date` integer,
	`all_day` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'media' NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`notes` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`external_id` text,
	`external_url` text,
	`google_event_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_external_id_unique` ON `tasks` (`external_id`);