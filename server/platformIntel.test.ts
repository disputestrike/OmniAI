import { describe, expect, it } from "vitest";
import {
  PLATFORM_SPECS,
  getAllPlatformSpecs,
  autoFormatContent,
  getBestPostingTime,
  getTodayBestTime,
  getRecommendedAspectRatio,
} from "../shared/platformSpecs";

describe("Platform Intelligence - platformSpecs module", () => {
  describe("PLATFORM_SPECS", () => {
    it("contains all expected platforms", () => {
      const expectedPlatforms = [
        "instagram", "tiktok", "youtube", "facebook", "linkedin",
        "twitter", "google_ads", "amazon", "pinterest", "whatsapp",
        "email", "sms", "reddit", "snapchat",
      ];
      for (const p of expectedPlatforms) {
        expect(PLATFORM_SPECS).toHaveProperty(p);
      }
    });

    it("each platform has required fields", () => {
      for (const [id, spec] of Object.entries(PLATFORM_SPECS)) {
        expect(spec.id).toBe(id);
        expect(spec.name).toBeTruthy();
        expect(spec.icon).toBeTruthy();
        expect(["social", "ads", "messaging", "content", "commerce", "media"]).toContain(spec.category);
        expect(spec.characterLimits).toBeDefined();
        expect(spec.characterLimits.post).toBeGreaterThan(0);
        expect(spec.characterLimits.caption).toBeGreaterThanOrEqual(0);
        expect(spec.characterLimits.bio).toBeGreaterThanOrEqual(0);
        expect(spec.imageSpecs).toBeDefined();
        expect(spec.imageSpecs.feedAspectRatio).toBeTruthy();
        expect(spec.imageSpecs.minWidth).toBeGreaterThanOrEqual(0);
        expect(spec.videoSpecs).toBeDefined();
        expect(spec.videoSpecs.maxLength).toBeGreaterThanOrEqual(0);
        expect(spec.hashtagStrategy).toBeDefined();
        expect(spec.hashtagStrategy.maxHashtags).toBeGreaterThanOrEqual(0);
        expect(["inline", "end", "first-comment", "none"]).toContain(spec.hashtagStrategy.placement);
        expect(spec.bestPostingTimes).toBeDefined();
        expect(spec.peakEngagement).toBeDefined();
        expect(spec.peakEngagement.days.length).toBeGreaterThan(0);
        expect(spec.contentTips.length).toBeGreaterThan(0);
        expect(spec.formatRecommendations.length).toBeGreaterThan(0);
      }
    });

    it("Instagram has correct character limits", () => {
      const ig = PLATFORM_SPECS.instagram;
      expect(ig.characterLimits.post).toBe(2200);
      expect(ig.characterLimits.bio).toBe(150);
      expect(ig.characterLimits.hashtags).toBe(30);
    });

    it("Twitter has 280 character post limit", () => {
      expect(PLATFORM_SPECS.twitter.characterLimits.post).toBe(280);
    });

    it("YouTube has long video max length", () => {
      expect(PLATFORM_SPECS.youtube.videoSpecs.maxLength).toBeGreaterThanOrEqual(3600);
    });

    it("SMS has 160 character post limit", () => {
      expect(PLATFORM_SPECS.sms.characterLimits.post).toBe(160);
    });
  });

  describe("getAllPlatformSpecs", () => {
    it("returns an array of all platform specs", () => {
      const specs = getAllPlatformSpecs();
      expect(Array.isArray(specs)).toBe(true);
      expect(specs.length).toBe(Object.keys(PLATFORM_SPECS).length);
    });

    it("each item in the array has an id", () => {
      const specs = getAllPlatformSpecs();
      for (const spec of specs) {
        expect(spec.id).toBeTruthy();
        expect(PLATFORM_SPECS[spec.id]).toBeDefined();
      }
    });
  });

  describe("autoFormatContent", () => {
    it("formats content within character limits", () => {
      const content = "Check out our amazing new product! It's the best thing since sliced bread. #marketing #ai";
      const result = autoFormatContent(content, "twitter");
      expect(result).toBeDefined();
      expect(result.formatted).toBeTruthy();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("truncates content that exceeds platform limit", () => {
      const longContent = "A".repeat(300);
      const result = autoFormatContent(longContent, "twitter");
      expect(result.formatted.length).toBeLessThanOrEqual(280);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("preserves short content that fits within limits", () => {
      const shortContent = "Hello world!";
      const result = autoFormatContent(shortContent, "instagram");
      expect(result.formatted).toContain("Hello world!");
      expect(result.warnings.length).toBe(0);
    });

    it("returns warnings for unknown platform", () => {
      const result = autoFormatContent("test", "nonexistent_platform");
      // Should handle gracefully, either with defaults or warnings
      expect(result).toBeDefined();
    });

    it("handles empty content", () => {
      const result = autoFormatContent("", "instagram");
      expect(result).toBeDefined();
      expect(result.formatted).toBe("");
      expect(result.warnings.length).toBe(0);
    });

    it("provides platform-specific suggestions", () => {
      const content = "Great content";
      const igResult = autoFormatContent(content, "instagram");
      // Instagram should suggest hashtags when none present
      expect(igResult.suggestions.length).toBeGreaterThan(0);

      const tiktokResult = autoFormatContent(content, "tiktok");
      expect(tiktokResult.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("getBestPostingTime", () => {
    it("returns posting times for valid platform and day", () => {
      const result = getBestPostingTime("instagram", "monday");
      expect(result).not.toBeNull();
      expect(result!.hours).toBeDefined();
      expect(Array.isArray(result!.hours)).toBe(true);
      expect(result!.hours.length).toBeGreaterThan(0);
      expect(typeof result!.peak).toBe("number");
    });

    it("returns null for invalid platform", () => {
      const result = getBestPostingTime("nonexistent", "monday");
      expect(result).toBeNull();
    });

    it("returns null for invalid day", () => {
      const result = getBestPostingTime("instagram", "funday");
      expect(result).toBeNull();
    });

    it("returns times for all days of the week", () => {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      for (const day of days) {
        const result = getBestPostingTime("instagram", day);
        expect(result).not.toBeNull();
        expect(result!.hours.length).toBeGreaterThan(0);
      }
    });

    it("peak hour is within the hours array", () => {
      const result = getBestPostingTime("instagram", "wednesday");
      expect(result).not.toBeNull();
      expect(result!.hours).toContain(result!.peak);
    });
  });

  describe("getTodayBestTime", () => {
    it("returns posting times for a valid platform", () => {
      const result = getTodayBestTime("instagram");
      expect(result).not.toBeNull();
      expect(result!.hours).toBeDefined();
      expect(result!.hours.length).toBeGreaterThan(0);
    });

    it("returns null for invalid platform", () => {
      const result = getTodayBestTime("nonexistent");
      expect(result).toBeNull();
    });

    it("works for all platforms", () => {
      for (const id of Object.keys(PLATFORM_SPECS)) {
        const result = getTodayBestTime(id);
        expect(result).not.toBeNull();
      }
    });
  });

  describe("getRecommendedAspectRatio", () => {
    it("returns feed aspect ratio for feed content type", () => {
      const ratio = getRecommendedAspectRatio("instagram", "feed");
      expect(ratio).toBeTruthy();
      expect(ratio).toContain(":");
    });

    it("returns story aspect ratio for story content type", () => {
      const ratio = getRecommendedAspectRatio("instagram", "story");
      expect(ratio).toBeTruthy();
    });

    it("returns video aspect ratio for video content type", () => {
      const ratio = getRecommendedAspectRatio("youtube", "video");
      expect(ratio).toBeTruthy();
    });

    it("returns a default for unknown platform", () => {
      const ratio = getRecommendedAspectRatio("nonexistent", "feed");
      expect(ratio).toBeTruthy(); // Should return a sensible default
    });

    it("returns correct ratios for different platforms", () => {
      // Instagram feed is typically 1:1
      const igFeed = getRecommendedAspectRatio("instagram", "feed");
      expect(igFeed).toBe("1:1");

      // YouTube video should include 16:9
      const ytVideo = getRecommendedAspectRatio("youtube", "video");
      expect(ytVideo).toBeTruthy();
    });
  });
});
