/**
 * Platform-Specific Formatting Intelligence
 * 
 * Comprehensive specs for all 21+ supported platforms including:
 * - Character limits for different content types
 * - Image/video aspect ratios and dimensions
 * - Video length limits
 * - Hashtag strategies
 * - Best posting times by day of week
 * - Peak engagement windows
 * - Content format recommendations
 */

export interface PlatformSpec {
  id: string;
  name: string;
  icon: string;
  category: "social" | "ads" | "messaging" | "content" | "commerce" | "media";
  characterLimits: {
    post: number;
    caption: number;
    bio: number;
    title?: number;
    description?: number;
    hashtags?: number;
    comment?: number;
  };
  imageSpecs: {
    feedAspectRatio: string;
    storyAspectRatio?: string;
    minWidth: number;
    maxWidth: number;
    maxFileSize: string;
    formats: string[];
  };
  videoSpecs: {
    maxLength: number; // seconds
    minLength?: number;
    aspectRatios: string[];
    maxFileSize: string;
    formats: string[];
    recommendedLength?: number; // seconds
  };
  hashtagStrategy: {
    maxHashtags: number;
    recommendedHashtags: number;
    placement: "inline" | "end" | "first-comment" | "none";
    tips: string;
  };
  bestPostingTimes: {
    [day: string]: { hours: number[]; peak: number };
  };
  peakEngagement: {
    days: string[];
    timeRange: string;
    timezone: string;
    notes: string;
  };
  contentTips: string[];
  formatRecommendations: {
    type: string;
    description: string;
    performanceRating: "high" | "medium" | "low";
  }[];
}

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "instagram",
    category: "social",
    characterLimits: {
      post: 2200,
      caption: 2200,
      bio: 150,
      hashtags: 30,
      comment: 2200,
    },
    imageSpecs: {
      feedAspectRatio: "1:1",
      storyAspectRatio: "9:16",
      minWidth: 320,
      maxWidth: 1440,
      maxFileSize: "30MB",
      formats: ["JPEG", "PNG"],
    },
    videoSpecs: {
      maxLength: 90,
      minLength: 3,
      aspectRatios: ["1:1", "4:5", "9:16"],
      maxFileSize: "4GB",
      formats: ["MP4", "MOV"],
      recommendedLength: 30,
    },
    hashtagStrategy: {
      maxHashtags: 30,
      recommendedHashtags: 8,
      placement: "first-comment",
      tips: "Use 3-5 niche hashtags + 3-5 medium-reach hashtags. Place in first comment for cleaner captions. Mix branded and community hashtags.",
    },
    bestPostingTimes: {
      monday: { hours: [6, 10, 14], peak: 10 },
      tuesday: { hours: [6, 9, 14], peak: 9 },
      wednesday: { hours: [7, 11, 14], peak: 11 },
      thursday: { hours: [7, 11, 15], peak: 11 },
      friday: { hours: [7, 11, 14], peak: 11 },
      saturday: { hours: [9, 11, 14], peak: 11 },
      sunday: { hours: [8, 10, 14], peak: 10 },
    },
    peakEngagement: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      timeRange: "9:00 AM - 12:00 PM",
      timezone: "EST",
      notes: "Reels get 2x more reach than static posts. Carousel posts have highest save rate.",
    },
    contentTips: [
      "Reels get 2x more reach than static posts",
      "Carousel posts have the highest save rate",
      "First line of caption is most important (above the fold)",
      "Use alt text for accessibility and SEO",
      "Post consistently at the same times",
      "Stories with polls/questions get 20% more engagement",
    ],
    formatRecommendations: [
      { type: "Reels (9:16)", description: "Short-form video, 15-30 seconds", performanceRating: "high" },
      { type: "Carousel (1:1)", description: "Multi-image educational content", performanceRating: "high" },
      { type: "Stories (9:16)", description: "Behind-the-scenes, polls, Q&A", performanceRating: "medium" },
      { type: "Single Image (4:5)", description: "Product showcase, quotes", performanceRating: "medium" },
    ],
  },

  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: "tiktok",
    category: "social",
    characterLimits: {
      post: 2200,
      caption: 2200,
      bio: 80,
      title: 150,
    },
    imageSpecs: {
      feedAspectRatio: "9:16",
      minWidth: 720,
      maxWidth: 1920,
      maxFileSize: "10MB",
      formats: ["JPEG", "PNG"],
    },
    videoSpecs: {
      maxLength: 600,
      minLength: 5,
      aspectRatios: ["9:16"],
      maxFileSize: "4GB",
      formats: ["MP4", "MOV", "WebM"],
      recommendedLength: 21,
    },
    hashtagStrategy: {
      maxHashtags: 100,
      recommendedHashtags: 4,
      placement: "inline",
      tips: "Use 3-5 relevant hashtags. Mix trending and niche. Don't use #fyp or #foryou — they're oversaturated. Use hashtags that describe your content.",
    },
    bestPostingTimes: {
      monday: { hours: [6, 10, 22], peak: 22 },
      tuesday: { hours: [7, 9, 20], peak: 9 },
      wednesday: { hours: [7, 11, 19], peak: 19 },
      thursday: { hours: [9, 12, 19], peak: 12 },
      friday: { hours: [5, 13, 19], peak: 13 },
      saturday: { hours: [11, 19, 21], peak: 19 },
      sunday: { hours: [7, 8, 16], peak: 16 },
    },
    peakEngagement: {
      days: ["Tuesday", "Thursday", "Friday"],
      timeRange: "7:00 PM - 11:00 PM",
      timezone: "EST",
      notes: "Hook viewers in first 1-3 seconds. Videos under 30 seconds get more completions. Trending sounds boost reach.",
    },
    contentTips: [
      "Hook viewers in the first 1-3 seconds",
      "Videos under 30 seconds get more completions",
      "Use trending sounds to boost reach",
      "Native-looking content outperforms polished ads",
      "Post 1-3 times per day for best growth",
      "Reply to comments with video for extra reach",
    ],
    formatRecommendations: [
      { type: "Short Video (9:16)", description: "15-30 second trending content", performanceRating: "high" },
      { type: "Duet/Stitch", description: "React to trending content", performanceRating: "high" },
      { type: "Tutorial/How-to", description: "Educational step-by-step", performanceRating: "medium" },
      { type: "Photo Carousel", description: "Multi-image slideshow", performanceRating: "medium" },
    ],
  },

  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: "youtube",
    category: "social",
    characterLimits: {
      post: 5000,
      caption: 5000,
      bio: 1000,
      title: 100,
      description: 5000,
    },
    imageSpecs: {
      feedAspectRatio: "16:9",
      minWidth: 1280,
      maxWidth: 3840,
      maxFileSize: "6MB",
      formats: ["JPEG", "PNG", "GIF", "BMP"],
    },
    videoSpecs: {
      maxLength: 43200,
      minLength: 1,
      aspectRatios: ["16:9", "9:16"],
      maxFileSize: "256GB",
      formats: ["MP4", "MOV", "AVI", "WMV", "FLV", "WebM"],
      recommendedLength: 480,
    },
    hashtagStrategy: {
      maxHashtags: 60,
      recommendedHashtags: 5,
      placement: "end",
      tips: "Use 3-5 relevant hashtags in description. First 3 appear above title. Focus on searchable keywords rather than trending tags.",
    },
    bestPostingTimes: {
      monday: { hours: [14, 15, 16], peak: 15 },
      tuesday: { hours: [14, 15, 16], peak: 15 },
      wednesday: { hours: [14, 15, 16], peak: 15 },
      thursday: { hours: [12, 15, 16], peak: 15 },
      friday: { hours: [12, 15, 16], peak: 15 },
      saturday: { hours: [9, 10, 11], peak: 10 },
      sunday: { hours: [9, 10, 11], peak: 10 },
    },
    peakEngagement: {
      days: ["Thursday", "Friday", "Saturday"],
      timeRange: "2:00 PM - 4:00 PM (weekdays), 9:00 AM - 11:00 AM (weekends)",
      timezone: "EST",
      notes: "Upload 2 hours before peak time for indexing. First 48 hours are critical for algorithm. Shorts get separate algorithm treatment.",
    },
    contentTips: [
      "First 48 hours are critical for the algorithm",
      "Upload 2 hours before peak time for indexing",
      "Shorts (under 60s) get separate algorithm treatment",
      "Custom thumbnails increase CTR by 30%",
      "Include keywords in first 2 lines of description",
      "End screens and cards boost watch time",
    ],
    formatRecommendations: [
      { type: "Long-form (16:9)", description: "8-15 minute educational/entertainment", performanceRating: "high" },
      { type: "Shorts (9:16)", description: "Under 60 seconds, vertical", performanceRating: "high" },
      { type: "Tutorial", description: "How-to content with chapters", performanceRating: "high" },
      { type: "Live Stream", description: "Real-time engagement", performanceRating: "medium" },
    ],
  },

  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: "facebook",
    category: "social",
    characterLimits: {
      post: 63206,
      caption: 63206,
      bio: 101,
      title: 255,
      description: 500,
    },
    imageSpecs: {
      feedAspectRatio: "1.91:1",
      storyAspectRatio: "9:16",
      minWidth: 600,
      maxWidth: 4096,
      maxFileSize: "30MB",
      formats: ["JPEG", "PNG", "GIF", "TIFF"],
    },
    videoSpecs: {
      maxLength: 14400,
      minLength: 1,
      aspectRatios: ["16:9", "1:1", "4:5", "9:16"],
      maxFileSize: "10GB",
      formats: ["MP4", "MOV"],
      recommendedLength: 60,
    },
    hashtagStrategy: {
      maxHashtags: 30,
      recommendedHashtags: 3,
      placement: "end",
      tips: "Use 1-3 hashtags maximum. Facebook hashtags have lower impact than other platforms. Focus on branded hashtags and trending topics.",
    },
    bestPostingTimes: {
      monday: { hours: [9, 12, 15], peak: 12 },
      tuesday: { hours: [9, 12, 15], peak: 9 },
      wednesday: { hours: [9, 11, 13], peak: 11 },
      thursday: { hours: [9, 12, 14], peak: 12 },
      friday: { hours: [9, 11, 14], peak: 11 },
      saturday: { hours: [9, 11, 13], peak: 11 },
      sunday: { hours: [9, 11, 13], peak: 11 },
    },
    peakEngagement: {
      days: ["Wednesday", "Thursday", "Friday"],
      timeRange: "9:00 AM - 1:00 PM",
      timezone: "EST",
      notes: "Video posts get 6x more engagement than photo posts. Reels are prioritized in the algorithm. Groups drive higher organic reach.",
    },
    contentTips: [
      "Video posts get 6x more engagement than photos",
      "Reels are prioritized in the algorithm",
      "Groups drive higher organic reach",
      "Keep text posts under 80 characters for best engagement",
      "Native video outperforms YouTube links",
      "Respond to comments within 1 hour for algorithm boost",
    ],
    formatRecommendations: [
      { type: "Reels (9:16)", description: "Short-form vertical video", performanceRating: "high" },
      { type: "Video Post (16:9)", description: "1-3 minute engaging video", performanceRating: "high" },
      { type: "Carousel", description: "Multi-image product showcase", performanceRating: "medium" },
      { type: "Link Post", description: "Article/blog sharing with preview", performanceRating: "medium" },
    ],
  },

  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    category: "social",
    characterLimits: {
      post: 3000,
      caption: 3000,
      bio: 2600,
      title: 150,
      description: 2000,
    },
    imageSpecs: {
      feedAspectRatio: "1.91:1",
      minWidth: 552,
      maxWidth: 4096,
      maxFileSize: "10MB",
      formats: ["JPEG", "PNG", "GIF"],
    },
    videoSpecs: {
      maxLength: 600,
      minLength: 3,
      aspectRatios: ["16:9", "1:1", "9:16"],
      maxFileSize: "5GB",
      formats: ["MP4"],
      recommendedLength: 90,
    },
    hashtagStrategy: {
      maxHashtags: 30,
      recommendedHashtags: 5,
      placement: "end",
      tips: "Use 3-5 industry-specific hashtags. Follow hashtags relevant to your niche. Create a branded hashtag for your company.",
    },
    bestPostingTimes: {
      monday: { hours: [7, 10, 12], peak: 10 },
      tuesday: { hours: [7, 10, 12], peak: 10 },
      wednesday: { hours: [7, 10, 12], peak: 10 },
      thursday: { hours: [7, 10, 12], peak: 10 },
      friday: { hours: [7, 10, 12], peak: 10 },
      saturday: { hours: [10, 11, 12], peak: 10 },
      sunday: { hours: [10, 11, 12], peak: 10 },
    },
    peakEngagement: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      timeRange: "7:00 AM - 12:00 PM",
      timezone: "EST",
      notes: "Text-only posts often outperform image posts. First line is critical (hook before 'see more'). Document/carousel posts get highest engagement.",
    },
    contentTips: [
      "Text-only posts often outperform image posts",
      "First line is critical — hook before 'see more'",
      "Document/carousel posts get highest engagement",
      "Personal stories outperform corporate content",
      "Comment on others' posts to boost your visibility",
      "Newsletters build subscriber base on-platform",
    ],
    formatRecommendations: [
      { type: "Document/Carousel", description: "PDF slides, educational content", performanceRating: "high" },
      { type: "Text Post", description: "Thought leadership, stories", performanceRating: "high" },
      { type: "Video (1:1)", description: "Professional tips, behind-scenes", performanceRating: "medium" },
      { type: "Newsletter", description: "Long-form articles", performanceRating: "medium" },
    ],
  },

  twitter: {
    id: "twitter",
    name: "Twitter/X",
    icon: "twitter",
    category: "social",
    characterLimits: {
      post: 280,
      caption: 280,
      bio: 160,
      title: 280,
    },
    imageSpecs: {
      feedAspectRatio: "16:9",
      minWidth: 600,
      maxWidth: 4096,
      maxFileSize: "5MB",
      formats: ["JPEG", "PNG", "GIF", "WebP"],
    },
    videoSpecs: {
      maxLength: 140,
      minLength: 0.5,
      aspectRatios: ["16:9", "1:1"],
      maxFileSize: "512MB",
      formats: ["MP4", "MOV"],
      recommendedLength: 30,
    },
    hashtagStrategy: {
      maxHashtags: 280,
      recommendedHashtags: 2,
      placement: "inline",
      tips: "Use 1-2 hashtags maximum. Tweets with 1-2 hashtags get 21% more engagement than those with 3+. Use trending hashtags when relevant.",
    },
    bestPostingTimes: {
      monday: { hours: [8, 10, 12], peak: 10 },
      tuesday: { hours: [8, 10, 12], peak: 10 },
      wednesday: { hours: [9, 12, 17], peak: 12 },
      thursday: { hours: [8, 10, 12], peak: 10 },
      friday: { hours: [8, 10, 12], peak: 10 },
      saturday: { hours: [9, 10, 11], peak: 10 },
      sunday: { hours: [9, 10, 11], peak: 10 },
    },
    peakEngagement: {
      days: ["Monday", "Tuesday", "Wednesday"],
      timeRange: "8:00 AM - 12:00 PM",
      timezone: "EST",
      notes: "Tweets with images get 150% more retweets. Threads perform well for long-form content. Reply to trending topics for visibility.",
    },
    contentTips: [
      "Tweets with images get 150% more retweets",
      "Threads perform well for long-form content",
      "Reply to trending topics for visibility",
      "Keep tweets under 100 characters for best engagement",
      "Tweet 3-5 times per day for optimal reach",
      "Use polls for easy engagement",
    ],
    formatRecommendations: [
      { type: "Thread", description: "Multi-tweet educational content", performanceRating: "high" },
      { type: "Image + Text", description: "Visual with concise copy", performanceRating: "high" },
      { type: "Poll", description: "Interactive engagement", performanceRating: "medium" },
      { type: "Video (16:9)", description: "Short clips, under 30s", performanceRating: "medium" },
    ],
  },

  google_ads: {
    id: "google_ads",
    name: "Google Ads",
    icon: "google",
    category: "ads",
    characterLimits: {
      post: 90,
      caption: 90,
      bio: 0,
      title: 30,
      description: 90,
    },
    imageSpecs: {
      feedAspectRatio: "1.91:1",
      minWidth: 300,
      maxWidth: 1200,
      maxFileSize: "5MB",
      formats: ["JPEG", "PNG", "GIF"],
    },
    videoSpecs: {
      maxLength: 180,
      aspectRatios: ["16:9", "1:1", "9:16", "4:5"],
      maxFileSize: "256MB",
      formats: ["MP4", "AVI", "MOV"],
      recommendedLength: 15,
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "Google Ads don't use hashtags. Focus on keywords in headlines and descriptions.",
    },
    bestPostingTimes: {
      monday: { hours: [8, 12, 17], peak: 12 },
      tuesday: { hours: [8, 12, 17], peak: 12 },
      wednesday: { hours: [8, 12, 17], peak: 12 },
      thursday: { hours: [8, 12, 17], peak: 12 },
      friday: { hours: [8, 12, 17], peak: 12 },
      saturday: { hours: [10, 14, 18], peak: 14 },
      sunday: { hours: [10, 14, 18], peak: 14 },
    },
    peakEngagement: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      timeRange: "10:00 AM - 2:00 PM",
      timezone: "EST",
      notes: "B2B: weekday business hours. B2C: evenings and weekends. Use ad scheduling to match your audience's active hours.",
    },
    contentTips: [
      "Headlines: 30 characters max, include primary keyword",
      "Descriptions: 90 characters max, include CTA",
      "Use all available headline slots (up to 15)",
      "Include price, promotions, and unique selling points",
      "Responsive search ads outperform expanded text ads",
      "Use ad extensions for additional real estate",
    ],
    formatRecommendations: [
      { type: "Responsive Search Ad", description: "Multiple headlines + descriptions", performanceRating: "high" },
      { type: "Performance Max", description: "AI-optimized across all Google surfaces", performanceRating: "high" },
      { type: "Display Ad (1.91:1)", description: "Visual banner ads", performanceRating: "medium" },
      { type: "Video Ad (YouTube)", description: "Pre-roll, in-stream", performanceRating: "medium" },
    ],
  },

  amazon: {
    id: "amazon",
    name: "Amazon",
    icon: "amazon",
    category: "commerce",
    characterLimits: {
      post: 2000,
      caption: 2000,
      bio: 0,
      title: 200,
      description: 2000,
    },
    imageSpecs: {
      feedAspectRatio: "1:1",
      minWidth: 1000,
      maxWidth: 10000,
      maxFileSize: "10MB",
      formats: ["JPEG", "PNG", "TIFF", "GIF"],
    },
    videoSpecs: {
      maxLength: 300,
      aspectRatios: ["16:9", "1:1"],
      maxFileSize: "5GB",
      formats: ["MP4", "MOV"],
      recommendedLength: 60,
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "Amazon uses backend search terms instead of hashtags. Use all 250 bytes of backend keywords. Focus on relevant, non-repetitive keywords.",
    },
    bestPostingTimes: {
      monday: { hours: [10, 14, 20], peak: 20 },
      tuesday: { hours: [10, 14, 20], peak: 20 },
      wednesday: { hours: [10, 14, 20], peak: 20 },
      thursday: { hours: [10, 14, 20], peak: 20 },
      friday: { hours: [10, 14, 20], peak: 20 },
      saturday: { hours: [10, 14, 20], peak: 14 },
      sunday: { hours: [10, 14, 20], peak: 14 },
    },
    peakEngagement: {
      days: ["Sunday", "Monday"],
      timeRange: "Evening hours (7:00 PM - 10:00 PM)",
      timezone: "EST",
      notes: "Product listings should be optimized for search, not time-based. Sponsored Products perform best with competitive bids during peak shopping hours.",
    },
    contentTips: [
      "Main image must be on white background",
      "Use all 7 image slots (lifestyle + infographic)",
      "Bullet points: 200 characters each, benefit-focused",
      "A+ Content increases conversion by 5-10%",
      "Backend search terms: use all 250 bytes",
      "Video on listing increases conversion by 9.7%",
    ],
    formatRecommendations: [
      { type: "Product Listing", description: "Optimized title, bullets, description", performanceRating: "high" },
      { type: "A+ Content", description: "Enhanced brand content with images", performanceRating: "high" },
      { type: "Sponsored Products", description: "Keyword-targeted PPC ads", performanceRating: "high" },
      { type: "Product Video", description: "Demo/lifestyle video on listing", performanceRating: "medium" },
    ],
  },

  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    icon: "pinterest",
    category: "social",
    characterLimits: {
      post: 500,
      caption: 500,
      bio: 160,
      title: 100,
      description: 500,
    },
    imageSpecs: {
      feedAspectRatio: "2:3",
      minWidth: 600,
      maxWidth: 6000,
      maxFileSize: "20MB",
      formats: ["JPEG", "PNG"],
    },
    videoSpecs: {
      maxLength: 900,
      minLength: 4,
      aspectRatios: ["2:3", "1:1", "9:16"],
      maxFileSize: "2GB",
      formats: ["MP4", "MOV"],
      recommendedLength: 15,
    },
    hashtagStrategy: {
      maxHashtags: 20,
      recommendedHashtags: 5,
      placement: "end",
      tips: "Use 2-5 relevant hashtags in pin description. Pinterest hashtags work like keywords. Focus on searchable, descriptive terms.",
    },
    bestPostingTimes: {
      monday: { hours: [14, 20, 21], peak: 20 },
      tuesday: { hours: [14, 20, 21], peak: 20 },
      wednesday: { hours: [14, 20, 21], peak: 20 },
      thursday: { hours: [14, 20, 21], peak: 20 },
      friday: { hours: [14, 15, 21], peak: 15 },
      saturday: { hours: [14, 20, 21], peak: 20 },
      sunday: { hours: [14, 20, 21], peak: 20 },
    },
    peakEngagement: {
      days: ["Saturday", "Sunday"],
      timeRange: "8:00 PM - 11:00 PM",
      timezone: "EST",
      notes: "Pinterest content has the longest shelf life of any social platform (months vs hours). Seasonal content should be pinned 45 days before the event.",
    },
    contentTips: [
      "Vertical images (2:3) get the most engagement",
      "Content has months-long shelf life",
      "Pin seasonal content 45 days before the event",
      "Text overlay on images increases saves",
      "Rich Pins provide more context and drive clicks",
      "Idea Pins (multi-page) get prioritized in feed",
    ],
    formatRecommendations: [
      { type: "Standard Pin (2:3)", description: "Vertical image with text overlay", performanceRating: "high" },
      { type: "Idea Pin", description: "Multi-page interactive content", performanceRating: "high" },
      { type: "Video Pin (2:3)", description: "Short vertical video", performanceRating: "medium" },
      { type: "Product Pin", description: "Shoppable product showcase", performanceRating: "medium" },
    ],
  },

  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "whatsapp",
    category: "messaging",
    characterLimits: {
      post: 65536,
      caption: 1024,
      bio: 139,
      title: 25,
    },
    imageSpecs: {
      feedAspectRatio: "any",
      minWidth: 100,
      maxWidth: 4096,
      maxFileSize: "16MB",
      formats: ["JPEG", "PNG"],
    },
    videoSpecs: {
      maxLength: 120,
      aspectRatios: ["any"],
      maxFileSize: "16MB",
      formats: ["MP4", "3GP"],
      recommendedLength: 30,
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "WhatsApp doesn't use hashtags. Focus on personalized, conversational messaging.",
    },
    bestPostingTimes: {
      monday: { hours: [9, 12, 18], peak: 12 },
      tuesday: { hours: [9, 12, 18], peak: 12 },
      wednesday: { hours: [9, 12, 18], peak: 12 },
      thursday: { hours: [9, 12, 18], peak: 12 },
      friday: { hours: [9, 12, 18], peak: 12 },
      saturday: { hours: [10, 14, 18], peak: 14 },
      sunday: { hours: [10, 14, 18], peak: 14 },
    },
    peakEngagement: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      timeRange: "10:00 AM - 1:00 PM",
      timezone: "EST",
      notes: "Open rates for WhatsApp business messages are 98%. Keep messages concise and personal. Use broadcast lists for segmented messaging.",
    },
    contentTips: [
      "98% open rate for business messages",
      "Keep messages concise and personal",
      "Use broadcast lists for segmented messaging",
      "Include clear CTA in every message",
      "Use WhatsApp Business catalog for products",
      "Status updates reach all contacts",
    ],
    formatRecommendations: [
      { type: "Text Message", description: "Personalized, conversational", performanceRating: "high" },
      { type: "Image + Caption", description: "Product image with CTA", performanceRating: "high" },
      { type: "Catalog", description: "Product showcase", performanceRating: "medium" },
      { type: "Status Update", description: "24-hour stories", performanceRating: "medium" },
    ],
  },

  email: {
    id: "email",
    name: "Email",
    icon: "mail",
    category: "messaging",
    characterLimits: {
      post: 100000,
      caption: 100000,
      bio: 0,
      title: 60,
      description: 150,
    },
    imageSpecs: {
      feedAspectRatio: "any",
      minWidth: 200,
      maxWidth: 600,
      maxFileSize: "1MB",
      formats: ["JPEG", "PNG", "GIF"],
    },
    videoSpecs: {
      maxLength: 0,
      aspectRatios: [],
      maxFileSize: "0",
      formats: [],
      recommendedLength: 0,
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "Email doesn't use hashtags. Focus on compelling subject lines and preview text.",
    },
    bestPostingTimes: {
      monday: { hours: [6, 10, 14], peak: 10 },
      tuesday: { hours: [6, 10, 14], peak: 10 },
      wednesday: { hours: [6, 10, 14], peak: 10 },
      thursday: { hours: [8, 10, 14], peak: 10 },
      friday: { hours: [6, 10, 14], peak: 10 },
      saturday: { hours: [9, 10, 11], peak: 10 },
      sunday: { hours: [9, 10, 11], peak: 10 },
    },
    peakEngagement: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      timeRange: "10:00 AM - 11:00 AM",
      timezone: "Recipient's local time",
      notes: "Subject line under 50 characters gets highest open rate. Preview text is equally important. Personalized emails get 6x more transactions.",
    },
    contentTips: [
      "Subject line under 50 characters for best open rate",
      "Preview text is equally important as subject line",
      "Personalized emails get 6x more transactions",
      "Single CTA emails get 371% more clicks",
      "Mobile-optimized design is essential (60%+ opens on mobile)",
      "Send time optimization based on recipient timezone",
    ],
    formatRecommendations: [
      { type: "Newsletter", description: "Regular value-driven content", performanceRating: "high" },
      { type: "Promotional", description: "Sale/offer announcement", performanceRating: "high" },
      { type: "Drip Sequence", description: "Automated nurture series", performanceRating: "high" },
      { type: "Transactional", description: "Order confirmations, receipts", performanceRating: "medium" },
    ],
  },

  sms: {
    id: "sms",
    name: "SMS",
    icon: "sms",
    category: "messaging",
    characterLimits: {
      post: 160,
      caption: 160,
      bio: 0,
    },
    imageSpecs: {
      feedAspectRatio: "any",
      minWidth: 0,
      maxWidth: 0,
      maxFileSize: "0",
      formats: [],
    },
    videoSpecs: {
      maxLength: 0,
      aspectRatios: [],
      maxFileSize: "0",
      formats: [],
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "SMS doesn't use hashtags. Keep messages under 160 characters for single SMS. Include clear CTA and opt-out option.",
    },
    bestPostingTimes: {
      monday: { hours: [10, 12, 14], peak: 12 },
      tuesday: { hours: [10, 12, 14], peak: 12 },
      wednesday: { hours: [10, 12, 14], peak: 12 },
      thursday: { hours: [10, 12, 14], peak: 12 },
      friday: { hours: [10, 12, 14], peak: 12 },
      saturday: { hours: [10, 12, 14], peak: 12 },
      sunday: { hours: [10, 12, 14], peak: 12 },
    },
    peakEngagement: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      timeRange: "10:00 AM - 2:00 PM",
      timezone: "Recipient's local time",
      notes: "SMS has 98% open rate and 45% response rate. Keep under 160 characters. Always include opt-out. Don't send before 8 AM or after 9 PM.",
    },
    contentTips: [
      "98% open rate, 45% response rate",
      "Keep under 160 characters for single SMS",
      "Always include opt-out option (required by law)",
      "Don't send before 8 AM or after 9 PM",
      "Personalize with recipient's name",
      "Include urgency and clear CTA",
    ],
    formatRecommendations: [
      { type: "Promotional SMS", description: "Sale/offer with link", performanceRating: "high" },
      { type: "Reminder", description: "Appointment/event reminder", performanceRating: "high" },
      { type: "MMS", description: "Image + text message", performanceRating: "medium" },
      { type: "Two-way SMS", description: "Conversational marketing", performanceRating: "medium" },
    ],
  },

  reddit: {
    id: "reddit",
    name: "Reddit",
    icon: "reddit",
    category: "social",
    characterLimits: {
      post: 40000,
      caption: 40000,
      bio: 200,
      title: 300,
    },
    imageSpecs: {
      feedAspectRatio: "any",
      minWidth: 0,
      maxWidth: 20000,
      maxFileSize: "20MB",
      formats: ["JPEG", "PNG", "GIF"],
    },
    videoSpecs: {
      maxLength: 900,
      aspectRatios: ["16:9", "1:1"],
      maxFileSize: "1GB",
      formats: ["MP4", "MOV"],
      recommendedLength: 60,
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "Reddit doesn't use hashtags. Focus on providing genuine value. Overtly promotional content gets downvoted.",
    },
    bestPostingTimes: {
      monday: { hours: [6, 7, 8], peak: 7 },
      tuesday: { hours: [6, 7, 8], peak: 7 },
      wednesday: { hours: [6, 7, 8], peak: 7 },
      thursday: { hours: [6, 7, 8], peak: 7 },
      friday: { hours: [6, 7, 8], peak: 7 },
      saturday: { hours: [7, 8, 9], peak: 8 },
      sunday: { hours: [7, 8, 9], peak: 8 },
    },
    peakEngagement: {
      days: ["Monday", "Tuesday", "Wednesday"],
      timeRange: "6:00 AM - 9:00 AM",
      timezone: "EST",
      notes: "Early morning posts get the most upvotes. Be genuinely helpful, not promotional. Subreddit rules vary widely — always read before posting.",
    },
    contentTips: [
      "Be genuinely helpful, not promotional",
      "Read subreddit rules before posting",
      "Early morning posts get the most upvotes",
      "AMA format works well for brands",
      "Engage in comments — Reddit values discussion",
      "Use Reddit Ads for targeted promotion",
    ],
    formatRecommendations: [
      { type: "Text Post", description: "Valuable discussion/advice", performanceRating: "high" },
      { type: "AMA", description: "Ask Me Anything format", performanceRating: "high" },
      { type: "Image Post", description: "Infographic or visual", performanceRating: "medium" },
      { type: "Reddit Ads", description: "Promoted posts in feed", performanceRating: "medium" },
    ],
  },

  snapchat: {
    id: "snapchat",
    name: "Snapchat",
    icon: "snapchat",
    category: "social",
    characterLimits: {
      post: 250,
      caption: 250,
      bio: 0,
    },
    imageSpecs: {
      feedAspectRatio: "9:16",
      minWidth: 1080,
      maxWidth: 1920,
      maxFileSize: "5MB",
      formats: ["JPEG", "PNG"],
    },
    videoSpecs: {
      maxLength: 60,
      minLength: 3,
      aspectRatios: ["9:16"],
      maxFileSize: "1GB",
      formats: ["MP4", "MOV"],
      recommendedLength: 10,
    },
    hashtagStrategy: {
      maxHashtags: 0,
      recommendedHashtags: 0,
      placement: "none",
      tips: "Snapchat doesn't use traditional hashtags. Use Snap Map and location features for discovery.",
    },
    bestPostingTimes: {
      monday: { hours: [10, 13, 22], peak: 22 },
      tuesday: { hours: [10, 13, 22], peak: 22 },
      wednesday: { hours: [10, 13, 22], peak: 22 },
      thursday: { hours: [10, 13, 22], peak: 22 },
      friday: { hours: [10, 13, 22], peak: 22 },
      saturday: { hours: [11, 14, 22], peak: 22 },
      sunday: { hours: [11, 14, 22], peak: 22 },
    },
    peakEngagement: {
      days: ["Friday", "Saturday", "Sunday"],
      timeRange: "10:00 PM - 1:00 AM",
      timezone: "EST",
      notes: "Snapchat audience skews younger (13-34). Content disappears after 24 hours. AR lenses and filters drive high engagement.",
    },
    contentTips: [
      "Content disappears after 24 hours — create urgency",
      "AR lenses and filters drive high engagement",
      "Audience skews younger (13-34)",
      "Spotlight (TikTok-like) feature for viral reach",
      "Keep snaps under 10 seconds for best completion",
      "Use Snap Ads for full-screen vertical video ads",
    ],
    formatRecommendations: [
      { type: "Snap Ad (9:16)", description: "Full-screen vertical video", performanceRating: "high" },
      { type: "Story Ad", description: "Multi-snap narrative", performanceRating: "high" },
      { type: "AR Lens", description: "Interactive branded filter", performanceRating: "medium" },
      { type: "Spotlight", description: "TikTok-style viral content", performanceRating: "medium" },
    ],
  },
};

/**
 * Get the best posting time for a specific platform and day
 */
export function getBestPostingTime(platformId: string, day: string): { hours: number[]; peak: number } | null {
  const spec = PLATFORM_SPECS[platformId];
  if (!spec) return null;
  const dayLower = day.toLowerCase();
  return spec.bestPostingTimes[dayLower] || null;
}

/**
 * Get all platform specs as an array
 */
export function getAllPlatformSpecs(): PlatformSpec[] {
  return Object.values(PLATFORM_SPECS);
}

/**
 * Auto-format content for a specific platform
 */
export function autoFormatContent(content: string, platformId: string): {
  formatted: string;
  warnings: string[];
  suggestions: string[];
} {
  const spec = PLATFORM_SPECS[platformId];
  if (!spec) return { formatted: content, warnings: ["Unknown platform"], suggestions: [] };

  const warnings: string[] = [];
  const suggestions: string[] = [];
  let formatted = content;

  // Check character limit
  const limit = spec.characterLimits.post;
  if (content.length > limit) {
    warnings.push(`Content exceeds ${spec.name} character limit (${content.length}/${limit})`);
    formatted = content.substring(0, limit - 3) + "...";
  }

  // Platform-specific suggestions
  if (platformId === "twitter" && content.length > 200) {
    suggestions.push("Consider shortening to under 200 characters for better engagement");
  }
  if (platformId === "instagram" && !content.includes("#")) {
    suggestions.push("Add 5-8 relevant hashtags in a first comment for better reach");
  }
  if (platformId === "linkedin" && content.length < 100) {
    suggestions.push("LinkedIn posts with 1,300-2,000 characters get the most engagement");
  }
  if (platformId === "tiktok") {
    suggestions.push("Keep caption concise — the video is the main content");
  }
  if (platformId === "email") {
    suggestions.push("Subject line should be under 50 characters for best open rate");
  }
  if (platformId === "sms" && content.length > 160) {
    warnings.push("SMS over 160 characters will be split into multiple messages");
  }

  return { formatted, warnings, suggestions };
}

/**
 * Get recommended aspect ratio for a platform and content type
 */
export function getRecommendedAspectRatio(platformId: string, contentType: "feed" | "story" | "video"): string {
  const spec = PLATFORM_SPECS[platformId];
  if (!spec) return "1:1";

  if (contentType === "story" && spec.imageSpecs.storyAspectRatio) {
    return spec.imageSpecs.storyAspectRatio;
  }
  if (contentType === "video" && spec.videoSpecs.aspectRatios.length > 0) {
    return spec.videoSpecs.aspectRatios[0];
  }
  return spec.imageSpecs.feedAspectRatio;
}

/**
 * Get today's best posting time for a platform
 */
export function getTodayBestTime(platformId: string): { hours: number[]; peak: number } | null {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  return getBestPostingTime(platformId, today);
}
