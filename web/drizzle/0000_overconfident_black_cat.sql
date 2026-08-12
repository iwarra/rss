CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feedId` integer NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`description` text,
	`pubDate` integer NOT NULL,
	`guid` text NOT NULL,
	`media_content` text,
	`sourceCategory` text,
	`categories` text,
	FOREIGN KEY (`feedId`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_feed_id_guid_unique` ON `articles` (`feedId`,`guid`);--> statement-breakpoint
CREATE TABLE `article_classifications` (
	`feedId` integer NOT NULL,
	`guid` text NOT NULL,
	`status` text NOT NULL,
	`isRelevant` integer NOT NULL,
	`processedAt` integer NOT NULL,
	FOREIGN KEY (`feedId`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_classifications_feed_id_guid_unique` ON `article_classifications` (`feedId`,`guid`);--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`rssLink` text NOT NULL,
	`description` text,
	`language` text,
	`sy_updatePeriod` text,
	`sy_updateFrequency` text,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feeds_link_unique` ON `feeds` (`link`);--> statement-breakpoint
CREATE UNIQUE INDEX `feeds_rssLink_unique` ON `feeds` (`rssLink`);