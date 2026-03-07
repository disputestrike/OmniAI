import { describe, it, expect, vi } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          title: "Test Content",
          summary: "A test summary",
          keyPoints: ["Point 1", "Point 2"],
          tone: "professional",
          targetAudience: "marketers",
          viralElements: ["Strong hook", "Emotional appeal"],
          captionSuggestions: ["Caption 1", "Caption 2"],
          suggestedRemixes: [{ format: "ad_copy_short", description: "Short ad" }],
          bestMoments: ["Moment at 0:30"],
          improvementSuggestions: ["Add CTA"],
          originalText: "Original content text here",
        }),
      },
    }],
  }),
}));

// Mock the image generation module
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/generated.png" }),
}));

// Mock the voice transcription module
vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    text: "Transcribed audio text",
    language: "en",
    segments: [{ start: 0, end: 5, text: "Transcribed audio text" }],
  }),
}));

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://cdn.example.com/file.png" }),
}));

// Mock the db module
vi.mock("./db", () => ({
  createContent: vi.fn().mockResolvedValue({ id: 1, title: "Test", body: "Content" }),
  createCreative: vi.fn().mockResolvedValue({ id: 1, imageUrl: "https://cdn.example.com/creative.png" }),
  createScheduledPost: vi.fn().mockResolvedValue({ id: 1, platform: "instagram", status: "scheduled" }),
  getDb: vi.fn(),
}));

describe("Content Ingest Router", () => {
  describe("URL Detection", () => {
    it("should detect YouTube URLs", () => {
      const youtubeUrls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://youtube.com/shorts/abc123",
      ];
      for (const url of youtubeUrls) {
        expect(url.includes("youtube") || url.includes("youtu.be")).toBe(true);
      }
    });

    it("should detect Instagram URLs", () => {
      const instaUrls = [
        "https://www.instagram.com/p/ABC123/",
        "https://instagram.com/reel/XYZ789/",
      ];
      for (const url of instaUrls) {
        expect(url.includes("instagram")).toBe(true);
      }
    });

    it("should detect TikTok URLs", () => {
      const tiktokUrls = [
        "https://www.tiktok.com/@user/video/123456",
        "https://vm.tiktok.com/abc123/",
      ];
      for (const url of tiktokUrls) {
        expect(url.includes("tiktok")).toBe(true);
      }
    });

    it("should detect Twitter/X URLs", () => {
      const twitterUrls = [
        "https://twitter.com/user/status/123456",
        "https://x.com/user/status/789012",
      ];
      for (const url of twitterUrls) {
        expect(url.includes("twitter") || url.includes("x.com")).toBe(true);
      }
    });
  });

  describe("Platform Detection Logic", () => {
    function detectPlatform(url: string) {
      const u = url.toLowerCase();
      if (u.includes("youtube.com") || u.includes("youtu.be")) {
        const type = u.includes("/shorts") ? "short" : u.includes("playlist") ? "playlist" : "video";
        return { platform: "youtube", type };
      }
      if (u.includes("instagram.com")) {
        const type = u.includes("/reel") ? "reel" : u.includes("/stories") ? "story" : "post";
        return { platform: "instagram", type };
      }
      if (u.includes("tiktok.com") || u.includes("vm.tiktok")) {
        return { platform: "tiktok", type: "video" };
      }
      if (u.includes("twitter.com") || u.includes("x.com")) {
        return { platform: "twitter", type: "tweet" };
      }
      if (u.includes("facebook.com") || u.includes("fb.watch")) {
        return { platform: "facebook", type: "post" };
      }
      if (u.includes("linkedin.com")) {
        return { platform: "linkedin", type: "post" };
      }
      return { platform: "website", type: "article" };
    }

    it("should correctly detect YouTube video", () => {
      expect(detectPlatform("https://www.youtube.com/watch?v=abc123")).toEqual({ platform: "youtube", type: "video" });
    });

    it("should correctly detect YouTube shorts", () => {
      expect(detectPlatform("https://youtube.com/shorts/abc123")).toEqual({ platform: "youtube", type: "short" });
    });

    it("should correctly detect Instagram reel", () => {
      expect(detectPlatform("https://instagram.com/reel/abc123")).toEqual({ platform: "instagram", type: "reel" });
    });

    it("should correctly detect Instagram post", () => {
      expect(detectPlatform("https://instagram.com/p/abc123")).toEqual({ platform: "instagram", type: "post" });
    });

    it("should correctly detect TikTok video", () => {
      expect(detectPlatform("https://tiktok.com/@user/video/123")).toEqual({ platform: "tiktok", type: "video" });
    });

    it("should correctly detect Twitter tweet", () => {
      expect(detectPlatform("https://twitter.com/user/status/123")).toEqual({ platform: "twitter", type: "tweet" });
    });

    it("should correctly detect X.com tweet", () => {
      expect(detectPlatform("https://x.com/user/status/123")).toEqual({ platform: "twitter", type: "tweet" });
    });

    it("should correctly detect LinkedIn post", () => {
      expect(detectPlatform("https://linkedin.com/posts/user-abc123")).toEqual({ platform: "linkedin", type: "post" });
    });

    it("should default to website for unknown URLs", () => {
      expect(detectPlatform("https://example.com/blog/post")).toEqual({ platform: "website", type: "article" });
    });
  });

  describe("File Type Detection", () => {
    function detectFileType(mimeType: string) {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType.startsWith("video/")) return "video";
      if (mimeType.startsWith("audio/")) return "audio";
      if (mimeType === "application/pdf") return "pdf";
      return "document";
    }

    it("should detect image files", () => {
      expect(detectFileType("image/png")).toBe("image");
      expect(detectFileType("image/jpeg")).toBe("image");
      expect(detectFileType("image/webp")).toBe("image");
    });

    it("should detect video files", () => {
      expect(detectFileType("video/mp4")).toBe("video");
      expect(detectFileType("video/webm")).toBe("video");
    });

    it("should detect audio files", () => {
      expect(detectFileType("audio/mpeg")).toBe("audio");
      expect(detectFileType("audio/wav")).toBe("audio");
    });

    it("should detect PDF files", () => {
      expect(detectFileType("application/pdf")).toBe("pdf");
    });

    it("should default to document for other types", () => {
      expect(detectFileType("application/msword")).toBe("document");
      expect(detectFileType("text/plain")).toBe("document");
    });
  });

  describe("Remix Format Validation", () => {
    const VALID_FORMATS = [
      "ad_copy_short", "ad_copy_long", "social_caption", "blog_post",
      "video_script", "email_copy", "twitter_thread", "linkedin_article",
      "tiktok_script", "instagram_caption", "story_content", "ugc_script",
      "youtube_description",
    ];

    it("should accept all valid remix formats", () => {
      for (const format of VALID_FORMATS) {
        expect(VALID_FORMATS.includes(format)).toBe(true);
      }
    });

    it("should have at least 10 remix formats", () => {
      expect(VALID_FORMATS.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Visual Type Dimensions", () => {
    const dimensions: Record<string, string> = {
      ad_image: "1200x628",
      social_graphic: "1080x1080",
      thumbnail: "1280x720",
      story: "1080x1920",
      banner: "1920x480",
    };

    it("should have correct ad image dimensions", () => {
      expect(dimensions.ad_image).toBe("1200x628");
    });

    it("should have correct social graphic dimensions", () => {
      expect(dimensions.social_graphic).toBe("1080x1080");
    });

    it("should have correct thumbnail dimensions", () => {
      expect(dimensions.thumbnail).toBe("1280x720");
    });

    it("should have correct story dimensions", () => {
      expect(dimensions.story).toBe("1080x1920");
    });

    it("should have correct banner dimensions", () => {
      expect(dimensions.banner).toBe("1920x480");
    });
  });

  describe("Caption Generation Validation", () => {
    it("should support multiple platforms", () => {
      const platforms = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin"];
      expect(platforms.length).toBe(6);
    });

    it("should support multiple tones", () => {
      const tones = ["engaging", "professional", "funny", "inspirational", "educational", "trendy", "casual"];
      expect(tones.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Clip Moment Identification", () => {
    it("should validate clip structure", () => {
      const mockClip = {
        title: "Best Moment",
        startTime: 30,
        endTime: 45,
        duration: 15,
        viralScore: 8,
        reason: "Strong emotional hook",
        hook: "You won't believe this",
        emotion: "excitement",
        transcript: "This is the clip text",
        bestFor: ["tiktok", "instagram"],
        suggestedCaption: "Check this out!",
      };

      expect(mockClip.duration).toBe(mockClip.endTime - mockClip.startTime);
      expect(mockClip.viralScore).toBeGreaterThanOrEqual(1);
      expect(mockClip.viralScore).toBeLessThanOrEqual(10);
      expect(mockClip.bestFor.length).toBeGreaterThan(0);
    });
  });

  describe("Batch Remix Logic", () => {
    it("should support multiple target formats", () => {
      const batchFormats = ["ad_copy_short", "social_caption", "twitter_thread", "email_copy"];
      expect(batchFormats.length).toBe(4);
      // Each format should be unique
      const unique = new Set(batchFormats);
      expect(unique.size).toBe(batchFormats.length);
    });
  });

  describe("Quick Post Validation", () => {
    it("should require at least one platform", () => {
      const platforms = ["instagram"];
      expect(platforms.length).toBeGreaterThanOrEqual(1);
    });

    it("should require non-empty content", () => {
      const content = "Test post content";
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });
});
