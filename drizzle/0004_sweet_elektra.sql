CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dealId` int,
	`leadId` int,
	`type` enum('call','email','meeting','note','task','follow_up') NOT NULL DEFAULT 'note',
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_platform_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`campaignId` int,
	`externalCampaignId` varchar(255) NOT NULL,
	`platform` varchar(64) NOT NULL,
	`name` varchar(255),
	`status` varchar(64),
	`budget` text,
	`spend` text,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`lastSyncedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_platform_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_platform_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` varchar(64) NOT NULL,
	`accountId` varchar(255),
	`accountName` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`status` enum('connected','expired','disconnected','error') NOT NULL DEFAULT 'connected',
	`scopes` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_platform_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int,
	`creativeId` int,
	`campaignId` int,
	`type` enum('content','creative','campaign','ad_launch') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('pending','approved','rejected','revision_requested') NOT NULL DEFAULT 'pending',
	`requestedById` int NOT NULL,
	`reviewerId` int,
	`reviewerComment` text,
	`reviewedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`campaignId` int,
	`title` varchar(255) NOT NULL,
	`value` text,
	`currency` varchar(8) DEFAULT 'USD',
	`stage` enum('prospecting','qualification','proposal','negotiation','closed_won','closed_lost') NOT NULL DEFAULT 'prospecting',
	`probability` int DEFAULT 0,
	`expectedCloseDate` timestamp,
	`actualCloseDate` timestamp,
	`notes` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictive_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('campaign','content','creative','ad') NOT NULL,
	`entityId` int NOT NULL,
	`predictedCtr` text,
	`predictedConversionRate` text,
	`predictedRoas` text,
	`engagementScore` int,
	`viralityScore` int,
	`qualityScore` int,
	`recommendations` json,
	`confidence` text,
	`metadata` json,
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictive_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seo_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` text NOT NULL,
	`overallScore` int,
	`technicalScore` int,
	`contentScore` int,
	`authorityScore` int,
	`keywords` json,
	`issues` json,
	`backlinks` json,
	`competitors` json,
	`recommendations` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seo_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`role` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
	`inviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`inviteToken` varchar(128),
	`permissions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
