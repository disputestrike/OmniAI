CREATE TABLE `publishing_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('medium','substack','wordpress') NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`apiUrl` text,
	`siteUrl` text,
	`status` enum('connected','expired','disconnected') NOT NULL DEFAULT 'connected',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishing_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repurposed_contents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`formatType` varchar(64) NOT NULL,
	`title` varchar(255),
	`body` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`externalId` varchar(255),
	`publishedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repurposed_contents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repurposing_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceType` enum('video_url','video_upload','audio_upload','transcript_paste') NOT NULL,
	`sourceUrl` text,
	`sourceTranscript` text,
	`status` enum('pending','transcribing','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`brandVoiceId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repurposing_projects_id` PRIMARY KEY(`id`)
);
