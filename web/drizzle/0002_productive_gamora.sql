CREATE TABLE IF NOT EXISTS `ingestion_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text NOT NULL,
	`createdAt` integer NOT NULL,
	`durationMs` integer NOT NULL,
	`report` text NOT NULL
);
