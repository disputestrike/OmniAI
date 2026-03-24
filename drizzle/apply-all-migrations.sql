CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
CREATE TABLE IF NOT EXISTS `ab_test_variants` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ab_test_variants_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`name` varchar(255) NOT NULL,
	`status` enum('draft','running','completed','cancelled') NOT NULL DEFAULT 'draft',
	`winnerVariantId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `analytics_events` (
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
	`recordedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `campaigns` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `contents` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contents_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `creatives` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `creatives_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`assignedToUserId` int,
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `products` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `scheduled_posts` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_posts_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `video_ads` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `video_ads_id` PRIMARY KEY(`id`)
);
ALTER TABLE `contents` MODIFY COLUMN `type` enum('ad_copy_short','ad_copy_long','blog_post','seo_meta','social_caption','video_script','email_copy','pr_release','podcast_script','tv_script','radio_script','copywriting','amazon_listing','google_ads','youtube_seo','twitter_thread','linkedin_article','whatsapp_broadcast','sms_copy','story_content','ugc_script','landing_page') NOT NULL;
CREATE TABLE IF NOT EXISTS `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(128) NOT NULL,
	`stripePriceId` varchar(128) NOT NULL,
	`status` enum('active','past_due','canceled','incomplete','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `stripeCustomerId` varchar(128);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `subscriptionPlan` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `stripeSubscriptionId` varchar(128);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordHash` varchar(255) NULL;
CREATE TABLE IF NOT EXISTS `activities` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `ad_platform_campaigns` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ad_platform_campaigns_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `ad_platform_connections` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_platform_connections_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `approval_workflows` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `approval_workflows_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `deals` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `predictive_scores` (
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
	`scoredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `predictive_scores_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `seo_audits` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `seo_audits_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`role` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
	`inviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`inviteToken` varchar(128),
	`permissions` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
ALTER TABLE `users` MODIFY COLUMN `subscriptionPlan` enum('free','starter','professional','business','enterprise') NOT NULL DEFAULT 'free';
CREATE TABLE IF NOT EXISTS `automation_workflows` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_workflows_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `brand_voices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`documentUrls` json,
	`voiceProfile` json,
	`isDefault` boolean DEFAULT false,
	`status` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_voices_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `email_campaigns` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `email_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`tags` json,
	`unsubscribed` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_contacts_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `email_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contactCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_lists_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `form_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`landingPageId` int NOT NULL,
	`data` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `form_submissions_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `landing_pages` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landing_pages_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `social_publish_queue` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `social_publish_queue_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `video_renders` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `video_renders_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`events` json,
	`secret` varchar(128),
	`isActive` boolean DEFAULT true,
	`lastTriggeredAt` timestamp,
	`failureCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `competitor_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('new_ad','seo_change','social_spike','content_change','traffic_change','new_campaign') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`alertSeverity` enum('info','warning','critical') DEFAULT 'info',
	`isRead` boolean DEFAULT false,
	`alertData` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_alerts_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `competitor_profiles` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_profiles_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `competitor_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`userId` int NOT NULL,
	`snapshotType` enum('full_analysis','ad_scan','seo_check','social_check','content_check') DEFAULT 'full_analysis',
	`snapshotData` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_snapshots_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `customer_interactions` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customer_interactions_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `customer_profiles` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_profiles_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `customer_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`segmentDescription` text,
	`segmentType` enum('rfm','behavioral','demographic','psychographic','custom') DEFAULT 'custom',
	`segmentCriteria` json,
	`customerCount` int DEFAULT 0,
	`color` varchar(20) DEFAULT '#6366f1',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_segments_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `personal_videos` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_videos_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `publishing_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('medium','substack','wordpress') NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`apiUrl` text,
	`siteUrl` text,
	`status` enum('connected','expired','disconnected') NOT NULL DEFAULT 'connected',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishing_credentials_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `repurposed_contents` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `repurposed_contents_id` PRIMARY KEY(`id`)
);
;
CREATE TABLE IF NOT EXISTS `repurposing_projects` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repurposing_projects_id` PRIMARY KEY(`id`)
);

-- Extra tables (from schema, no separate migration file yet)
CREATE TABLE IF NOT EXISTS `brand_kits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(32),
	`secondaryColor` varchar(32),
	`accentColor` varchar(32),
	`fontHeading` varchar(128),
	`fontBody` varchar(128),
	`toneOfVoice` varchar(64),
	`toneDescription` text,
	`brandPersonality` json,
	`tagline` varchar(255),
	`missionStatement` text,
	`targetAudience` text,
	`doList` json,
	`dontList` json,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_kits_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `ad_performance_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`platform` varchar(64) NOT NULL,
	`reportType` enum('campaign','adset','ad','account') DEFAULT 'campaign',
	`dateRange` varchar(64),
	`rawData` json,
	`aiAnalysis` text,
	`topPerformers` json,
	`winningPatterns` json,
	`recommendations` json,
	`adReportStatus` enum('pending','analyzing','complete','error') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_performance_reports_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `publisher_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`platform` varchar(64) NOT NULL,
	`adName` varchar(255) NOT NULL,
	`adType` enum('image','video','carousel','text') DEFAULT 'image',
	`headline` text,
	`body` text,
	`imageUrl` text,
	`videoUrl` text,
	`destinationUrl` text,
	`callToAction` varchar(64),
	`budget` text,
	`budgetType` enum('daily','lifetime') DEFAULT 'daily',
	`startDate` timestamp,
	`endDate` timestamp,
	`targetAudience` json,
	`publishStatus` enum('draft','queued','publishing','live','paused','completed','failed') DEFAULT 'draft',
	`externalAdId` varchar(255),
	`errorMessage` text,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publisher_queue_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `performance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`externalCampaignId` varchar(255),
	`campaignName` varchar(255),
	`platform` varchar(64) NOT NULL,
	`alertType` enum('underperforming','budget_depleted','high_cpa','low_ctr','opportunity') NOT NULL,
	`severity` enum('info','warning','critical') DEFAULT 'warning',
	`metric` varchar(64),
	`currentValue` text,
	`benchmarkValue` text,
	`aiSuggestion` text,
	`isRead` boolean DEFAULT false,
	`isDismissed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `performance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `creator_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(128),
	`bio` text,
	`tagline` varchar(255),
	`avatarUrl` text,
	`coverImageUrl` text,
	`website` text,
	`instagram` varchar(128),
	`twitter` varchar(128),
	`linkedin` varchar(128),
	`tiktok` varchar(128),
	`specialties` json,
	`isPublic` boolean DEFAULT false,
	`profileSlug` varchar(128),
	`totalCreations` int DEFAULT 0,
	`totalViews` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `creator_profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `creator_profiles_profileSlug_unique` UNIQUE(`profileSlug`)
);
CREATE TABLE IF NOT EXISTS `portfolio_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`contentType` enum('image','video','copy','email','social','ad','other') DEFAULT 'other',
	`thumbnailUrl` text,
	`contentUrl` text,
	`contentText` text,
	`platform` varchar(64),
	`tags` json,
	`isPublic` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`sourceType` varchar(64),
	`sourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_items_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `projects2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`projectStatus` enum('active','paused','completed','archived') DEFAULT 'active',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects2_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `chat_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`title` varchar(255),
	`messages` json,
	`agentMode` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_conversations_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`contentType` varchar(100),
	`platform` varchar(100),
	`body` text,
	`variables` json,
	`metadata` json,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `content_templates_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int,
	`platform` varchar(100),
	`postUrl` text,
	`likes` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`reach` int DEFAULT 0,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`engagementRate` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);

-- Funnels, Reviews, Forms, Reports (added with 5-feature plan)
CREATE TABLE IF NOT EXISTS `funnels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnels_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `funnel_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`stepType` enum('landing','form','payment','thank_you') NOT NULL,
	`title` varchar(255) NOT NULL,
	`landingPageId` int,
	`formId` int,
	`stripePriceId` varchar(128),
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_steps_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `funnel_step_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`funnelStepId` int NOT NULL,
	`eventType` enum('view','complete') NOT NULL,
	`sessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_step_events_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `funnel_ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`funnelStepId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('draft','running','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_ab_tests_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `funnel_ab_test_variations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`config` json,
	`trafficPercent` int NOT NULL DEFAULT 50,
	`views` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_ab_test_variations_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `review_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceType` enum('google','facebook','yelp','manual') NOT NULL,
	`name` varchar(255),
	`externalId` varchar(255),
	`accessToken` text,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'connected',
	`lastSyncAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_sources_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceId` int NOT NULL,
	`externalId` varchar(255),
	`authorName` varchar(255),
	`rating` int NOT NULL,
	`text` text,
	`reply` text,
	`reviewUrl` text,
	`reviewedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`submitButtonText` varchar(64) DEFAULT 'Submit',
	`redirectUrl` text,
	`createLeadOnSubmit` boolean DEFAULT true,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`submissionCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `form_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`fieldType` enum('text','email','phone','textarea','select','checkbox','number') NOT NULL,
	`label` varchar(255) NOT NULL,
	`placeholder` varchar(255),
	`required` boolean DEFAULT true,
	`options` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_fields_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `form_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`data` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `form_responses_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `report_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportType` enum('dashboard','analytics','ad_performance','campaign') NOT NULL,
	`title` varchar(255) NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`payload` json,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `report_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_snapshots_shareToken_unique` UNIQUE(`shareToken`)
);
CREATE TABLE IF NOT EXISTS `assignment_settings` (
	`userId` int NOT NULL,
	`mode` enum('manual','round_robin') NOT NULL DEFAULT 'manual',
	`memberOrder` json,
	`lastAssignedIndex` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignment_settings_userId` PRIMARY KEY(`userId`)
);
CREATE TABLE IF NOT EXISTS `flywheel_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` varchar(64) NOT NULL,
	`format` varchar(128),
	`hookLengthBand` varchar(32),
	`emotion` varchar(64),
	`ctrBand` varchar(32),
	`conversionBand` varchar(32),
	`sampleSize` int NOT NULL DEFAULT 0,
	`patternSummary` text,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `flywheel_patterns_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `campaign_winning_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`platform` varchar(64),
	`format` varchar(128),
	`hookLength` varchar(32),
	`emotion` varchar(64),
	`ctr` text,
	`conversionRate` text,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_winning_patterns_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `narratives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`summary` text NOT NULL,
	`topics` json,
	`emotion` varchar(64),
	`suggestedAngles` json,
	`sourceUrl` text,
	`detectedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `narratives_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `influence_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('persona','channel') NOT NULL,
	`segmentId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `influence_nodes_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
CREATE TABLE IF NOT EXISTS `referral_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerUserId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `referral_signups_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `user_monthly_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`aiGenerationsUsed` int NOT NULL DEFAULT 0,
	`aiImagesUsed` int NOT NULL DEFAULT 0,
	`videoScriptsUsed` int NOT NULL DEFAULT 0,
	`videoMinutesUsed` int NOT NULL DEFAULT 0,
	`websiteAnalysesUsed` int NOT NULL DEFAULT 0,
	`abTestsUsed` int NOT NULL DEFAULT 0,
	`scheduledPostsUsed` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_monthly_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_monthly_usage_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE IF NOT EXISTS `credit_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purchasedCredits` int NOT NULL DEFAULT 0,
	`lifetimePurchased` int NOT NULL DEFAULT 0,
	`lifetimeUsed` int NOT NULL DEFAULT 0,
	`lastPurchaseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_wallets_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE IF NOT EXISTS `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`actionType` varchar(64) NOT NULL,
	`stripePaymentId` varchar(128),
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `tier_limits_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` varchar(20) NOT NULL,
	`displayName` varchar(50) NOT NULL,
	`priceMonthlyCents` int NOT NULL,
	`priceAnnualCents` int NOT NULL,
	`stripePriceMonthlyId` varchar(255),
	`stripePriceAnnualId` varchar(255),
	`maxAiGenerations` int NOT NULL,
	`maxAiImages` int NOT NULL,
	`maxVideoScripts` int NOT NULL,
	`maxVideoMinutes` int NOT NULL,
	`maxScheduledPosts` int NOT NULL,
	`maxAbTests` int NOT NULL,
	`maxWebsiteAnalyses` int NOT NULL,
	`maxProducts` int NOT NULL,
	`maxCampaigns` int NOT NULL,
	`maxLeads` int NOT NULL,
	`maxTeamSeats` int NOT NULL,
	`maxAdPlatformConnections` int NOT NULL,
	`featureScheduling` tinyint(1) DEFAULT 0,
	`featureAbTesting` tinyint(1) DEFAULT 0,
	`featureVoiceInput` tinyint(1) DEFAULT 0,
	`featureVideoGeneration` tinyint(1) DEFAULT 0,
	`featureAvatars` tinyint(1) DEFAULT 0,
	`featureCrm` tinyint(1) DEFAULT 0,
	`featureCompetitorIntel` tinyint(1) DEFAULT 0,
	`featurePredictiveAi` tinyint(1) DEFAULT 0,
	`featureApiAccess` tinyint(1) DEFAULT 0,
	`featureWhiteLabel` tinyint(1) DEFAULT 0,
	`featureMusicStudio` tinyint(1) DEFAULT 0,
	`featureDspAccess` tinyint(1) DEFAULT 0,
	`dspMinAdSpendCents` int DEFAULT 0,
	`dspMarkupRateBps` int DEFAULT 0,
	`creditTopupDiscountBps` int DEFAULT 0,
	`watermarkContent` tinyint(1) DEFAULT 1,
	`aiChatModel` varchar(50) DEFAULT 'forge',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tier_limits_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `tier_limits_config_tier_unique` UNIQUE(`tier`)
);
CREATE TABLE IF NOT EXISTS `subscription_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','starter','professional','business','agency') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`status` varchar(50) DEFAULT 'active',
	`trialUsed` tinyint(1) DEFAULT 0,
	`trialEndsAt` timestamp NULL,
	`periodStart` timestamp NULL,
	`periodEnd` timestamp NULL,
	`usedAiGenerations` int DEFAULT 0,
	`usedAiImages` int DEFAULT 0,
	`usedVideoScripts` int DEFAULT 0,
	`usedVideoMinutes` int DEFAULT 0,
	`usedScheduledPosts` int DEFAULT 0,
	`usedAbTests` int DEFAULT 0,
	`usedWebsiteAnalyses` int DEFAULT 0,
	`dspWalletBalanceCents` int DEFAULT 0,
	`dspEpomAccountId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_limits_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_limits_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE IF NOT EXISTS `dsp_ad_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balanceCents` int NOT NULL DEFAULT 0,
	`totalDepositedCents` int NOT NULL DEFAULT 0,
	`totalSpentCents` int NOT NULL DEFAULT 0,
	`totalMarkupEarnedCents` int NOT NULL DEFAULT 0,
	`epomAccountId` varchar(255),
	`isActive` tinyint(1) DEFAULT 0,
	`activatedAt` timestamp NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dsp_ad_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `dsp_ad_wallets_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE IF NOT EXISTS `dsp_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`epomCampaignId` varchar(255),
	`name` varchar(255) NOT NULL,
	`status` varchar(50) DEFAULT 'draft',
	`dailyBudgetCents` int,
	`totalBudgetCents` int,
	`spentCents` int DEFAULT 0,
	`markupEarnedCents` int DEFAULT 0,
	`markupRateBps` int NOT NULL,
	`targetingGeo` json,
	`targetingDemographics` json,
	`targetingInterests` json,
	`targetingDevices` json,
	`creativeType` varchar(50),
	`creativeUrl` varchar(500),
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`ctr` int DEFAULT 0,
	`aiQualityScore` int,
	`aiScoreReasoning` text,
	`aiScoredAt` timestamp NULL,
	`aiModelUsed` varchar(50),
	`startsAt` timestamp NULL,
	`endsAt` timestamp NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dsp_campaigns_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `dsp_wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`transactionType` varchar(50) NOT NULL,
	`grossAmountCents` int NOT NULL,
	`markupCents` int NOT NULL DEFAULT 0,
	`netAmountCents` int NOT NULL,
	`stripePaymentId` varchar(255),
	`epomReference` varchar(255),
	`balanceAfterCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dsp_wallet_transactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `dsp_performance_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`snapshotDate` date NOT NULL,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`spendCents` int DEFAULT 0,
	`ctr` int DEFAULT 0,
	`cpm` int DEFAULT 0,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dsp_performance_snapshots_id` PRIMARY KEY(`id`),
	UNIQUE KEY `uq_campaign_date` (`campaignId`,`snapshotDate`)
);

-- campaign_assets (was missing from migrations)
CREATE TABLE IF NOT EXISTS `campaign_assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int NOT NULL,
  `assetType` varchar(32) NOT NULL,
  `assetId` int NOT NULL,
  `status` enum('draft','approved','live','paused','completed') NOT NULL DEFAULT 'draft',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaign_assets_campaignId` (`campaignId`)
);

-- ─── Add campaignId columns to tables that were created before this column existed ───
-- Uses IF NOT EXISTS (MySQL 8+) so safe to run multiple times on same DB
ALTER TABLE `contents` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `creatives` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `video_ads` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `video_renders` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `scheduled_posts` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `analytics_events` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `email_campaigns` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `landing_pages` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `ab_tests` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `approval_workflows` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `ad_platform_campaigns` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `customer_interactions` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `social_publish_queue` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;
ALTER TABLE `report_snapshots` ADD COLUMN IF NOT EXISTS `campaignId` int NULL;

-- ─── Add columns missing from initial CREATE TABLE definitions ───
-- Safe to run multiple times (IF NOT EXISTS, MySQL 8+)

-- users: trialUsed column added in later schema revision
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `trialUsed` boolean DEFAULT false;

-- campaigns: extra analytics/budget columns added in later schema revision
ALTER TABLE `campaigns` ADD COLUMN IF NOT EXISTS `goal` varchar(64) NULL;
ALTER TABLE `campaigns` ADD COLUMN IF NOT EXISTS `totalBudget` decimal(12,2) NULL;
ALTER TABLE `campaigns` ADD COLUMN IF NOT EXISTS `totalSpend` decimal(12,2) NULL;
ALTER TABLE `campaigns` ADD COLUMN IF NOT EXISTS `totalLeads` int DEFAULT 0;
ALTER TABLE `campaigns` ADD COLUMN IF NOT EXISTS `totalRevenue` decimal(12,2) NULL;

-- subscriptions: extra lifecycle columns added in later schema revision
ALTER TABLE `subscriptions` ADD COLUMN IF NOT EXISTS `currentPeriodStart` timestamp NULL;
ALTER TABLE `subscriptions` ADD COLUMN IF NOT EXISTS `trialEndsAt` timestamp NULL;
ALTER TABLE `subscriptions` ADD COLUMN IF NOT EXISTS `pastDueAt` timestamp NULL;
ALTER TABLE `subscriptions` ADD COLUMN IF NOT EXISTS `canceledAt` timestamp NULL;

-- user_monthly_usage: usage80EmailSent flag added in later schema revision
ALTER TABLE `user_monthly_usage` ADD COLUMN IF NOT EXISTS `usage80EmailSent` boolean DEFAULT false;
