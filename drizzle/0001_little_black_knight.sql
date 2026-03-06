CREATE TABLE `ab_test_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`contentId` int,
	`creativeId` int,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`ctr` text,
	`conversionRate` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_test_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`name` varchar(255) NOT NULL,
	`status` enum('draft','running','completed','cancelled') NOT NULL DEFAULT 'draft',
	`winnerVariantId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`platform` varchar(64),
	`eventType` varchar(64) NOT NULL,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`spend` text,
	`revenue` text,
	`metadata` json,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`platforms` json,
	`objective` enum('awareness','traffic','engagement','leads','sales','app_installs') NOT NULL DEFAULT 'awareness',
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`budget` text,
	`targetAudience` json,
	`startDate` timestamp,
	`endDate` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`campaignId` int,
	`type` enum('ad_copy_short','ad_copy_long','blog_post','seo_meta','social_caption','video_script','email_copy') NOT NULL,
	`platform` varchar(64),
	`title` varchar(255),
	`body` text,
	`metadata` json,
	`status` enum('draft','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`campaignId` int,
	`type` enum('ad_image','social_graphic','thumbnail','banner','story') NOT NULL,
	`prompt` text,
	`imageUrl` text,
	`platform` varchar(64),
	`dimensions` varchar(32),
	`status` enum('generating','completed','failed','approved') NOT NULL DEFAULT 'generating',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(32),
	`company` varchar(255),
	`source` varchar(128),
	`platform` varchar(64),
	`status` enum('new','contacted','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`score` int DEFAULT 0,
	`notes` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`url` text,
	`imageUrls` json,
	`category` varchar(128),
	`features` json,
	`benefits` json,
	`targetAudience` json,
	`positioning` text,
	`keywords` json,
	`tone` varchar(64),
	`analysisStatus` enum('pending','analyzing','completed','failed') NOT NULL DEFAULT 'pending',
	`rawAnalysis` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`contentId` int,
	`creativeId` int,
	`platform` varchar(64) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`publishedAt` timestamp,
	`status` enum('scheduled','publishing','published','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`postUrl` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`campaignId` int,
	`platform` varchar(64),
	`script` text,
	`storyboard` json,
	`voiceoverText` text,
	`avatarStyle` varchar(64),
	`duration` int,
	`thumbnailUrl` text,
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_ads_id` PRIMARY KEY(`id`)
);
