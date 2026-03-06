CREATE TABLE `automation_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` enum('form_submission','lead_status_change','campaign_event','schedule','manual') NOT NULL,
	`triggerConfig` json,
	`actions` json,
	`isActive` boolean DEFAULT false,
	`lastRunAt` timestamp,
	`runCount` int DEFAULT 0,
	`status` enum('draft','active','paused','error') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_voices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`documentUrls` json,
	`voiceProfile` json,
	`isDefault` boolean DEFAULT false,
	`status` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_voices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` text,
	`textBody` text,
	`fromName` varchar(128),
	`replyTo` varchar(320),
	`recipientListId` int,
	`status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`delivered` int DEFAULT 0,
	`opened` int DEFAULT 0,
	`clicked` int DEFAULT 0,
	`bounced` int DEFAULT 0,
	`unsubscribed` int DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`tags` json,
	`unsubscribed` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contactCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`landingPageId` int NOT NULL,
	`data` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `landing_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`templateId` varchar(64),
	`components` json,
	`customCss` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedUrl` text,
	`visits` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landing_pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_publish_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scheduledPostId` int,
	`contentId` int,
	`platform` varchar(64) NOT NULL,
	`connectionId` int,
	`postContent` text,
	`mediaUrls` json,
	`status` enum('queued','publishing','published','failed','cancelled') NOT NULL DEFAULT 'queued',
	`publishedAt` timestamp,
	`externalPostId` varchar(255),
	`externalPostUrl` text,
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`scheduledFor` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_publish_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_renders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoAdId` int,
	`platform` varchar(64),
	`status` enum('queued','rendering','completed','failed') NOT NULL DEFAULT 'queued',
	`videoUrl` text,
	`thumbnailUrl` text,
	`duration` int,
	`resolution` varchar(32),
	`format` varchar(16) DEFAULT 'mp4',
	`frames` json,
	`audioUrl` text,
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_renders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`events` json,
	`secret` varchar(128),
	`isActive` boolean DEFAULT true,
	`lastTriggeredAt` timestamp,
	`failureCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
