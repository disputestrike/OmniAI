CREATE TABLE `competitor_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('new_ad','seo_change','social_spike','content_change','traffic_change','new_campaign') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`alertSeverity` enum('info','warning','critical') DEFAULT 'info',
	`isRead` boolean DEFAULT false,
	`alertData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitor_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`logoUrl` text,
	`industry` varchar(100),
	`description` text,
	`socialLinks` json,
	`competitorMetrics` json,
	`threatLevel` enum('low','medium','high','critical') DEFAULT 'medium',
	`lastAnalyzedAt` timestamp,
	`isMonitored` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`userId` int NOT NULL,
	`snapshotType` enum('full_analysis','ad_scan','seo_check','social_check','content_check') DEFAULT 'full_analysis',
	`snapshotData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitor_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`userId` int NOT NULL,
	`interactionType` enum('email_sent','email_opened','email_clicked','call_made','call_received','meeting','social_interaction','ad_click','website_visit','purchase','support_ticket','feedback','content_viewed','form_submitted','chat_message') NOT NULL,
	`channel` varchar(50),
	`subject` varchar(255),
	`interactionDetails` text,
	`interactionSentiment` enum('positive','neutral','negative'),
	`campaignId` int,
	`contentId` int,
	`interactionMeta` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`company` varchar(255),
	`jobTitle` varchar(255),
	`avatarUrl` text,
	`demographics` json,
	`psychographics` json,
	`behaviorData` json,
	`segment` varchar(100),
	`engagementScore` int DEFAULT 0,
	`sentimentScore` int DEFAULT 50,
	`lifetimeValue` int DEFAULT 0,
	`clvPrediction` int DEFAULT 0,
	`temperature` enum('hot','warm','cold','dormant') DEFAULT 'warm',
	`lastContactAt` timestamp,
	`nextBestAction` text,
	`customerTags` json,
	`customerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`segmentDescription` text,
	`segmentType` enum('rfm','behavioral','demographic','psychographic','custom') DEFAULT 'custom',
	`segmentCriteria` json,
	`customerCount` int DEFAULT 0,
	`color` varchar(20) DEFAULT '#6366f1',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personal_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`script` text,
	`videoUrl` text,
	`thumbnailUrl` text,
	`duration` int,
	`aspectRatio` varchar(20) DEFAULT '16:9',
	`platform` varchar(50),
	`shareToken` varchar(64),
	`shareUrl` text,
	`embedCode` text,
	`personalVideoStatus` enum('draft','recording','processing','ready','shared') DEFAULT 'draft',
	`viewCount` int DEFAULT 0,
	`aiSuggestions` json,
	`personalVideoMetadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_videos_id` PRIMARY KEY(`id`)
);
