ALTER TABLE `article_classifications` RENAME TO `consumed_articles`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_consumed_articles` (
	`feedId` integer NOT NULL,
	`guid` text NOT NULL,
	`processedAt` integer NOT NULL,
	FOREIGN KEY (`feedId`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_consumed_articles`("feedId", "guid", "processedAt") SELECT "feedId", "guid", "processedAt" FROM `consumed_articles`;--> statement-breakpoint
DROP TABLE `consumed_articles`;--> statement-breakpoint
ALTER TABLE `__new_consumed_articles` RENAME TO `consumed_articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `consumed_articles_feed_id_guid_unique` ON `consumed_articles` (`feedId`,`guid`);