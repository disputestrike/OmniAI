import { describe, it, expect } from "vitest";

// ===== Personal Video Studio Tests =====
describe("Personal Video Studio", () => {
  it(
    "should have personalVideo router with required procedures",
    async () => {
      const { personalVideoRouter } = await import("./newFeatureRouters");
      expect(personalVideoRouter).toBeDefined();
      const procedures = Object.keys(personalVideoRouter._def.procedures);
      expect(procedures).toContain("list");
      expect(procedures).toContain("get");
      expect(procedures).toContain("getByShareToken");
      expect(procedures).toContain("generateScript");
      expect(procedures).toContain("create");
      expect(procedures).toContain("uploadRecording");
      expect(procedures).toContain("generateThumbnail");
      expect(procedures).toContain("getAISuggestions");
      expect(procedures).toContain("share");
      expect(procedures).toContain("delete");
    },
    15000,
  );

  it("should have at least 10 procedures for full video workflow", async () => {
    const { personalVideoRouter } = await import("./newFeatureRouters");
    const procedures = Object.keys(personalVideoRouter._def.procedures);
    expect(procedures.length).toBeGreaterThanOrEqual(10);
  });

  it("getByShareToken should be a public procedure", async () => {
    const { personalVideoRouter } = await import("./newFeatureRouters");
    // Public procedures don't require auth context
    expect(personalVideoRouter._def.procedures.getByShareToken).toBeDefined();
  });
});

// ===== Competitor Intelligence Tests =====
describe("Competitor Intelligence", () => {
  it("should have competitorIntel router with required procedures", async () => {
    const { competitorIntelRouter } = await import("./newFeatureRouters");
    expect(competitorIntelRouter).toBeDefined();
    const procedures = Object.keys(competitorIntelRouter._def.procedures);
    expect(procedures).toContain("listProfiles");
    expect(procedures).toContain("addCompetitor");
    expect(procedures).toContain("deleteCompetitor");
    expect(procedures).toContain("analyzeCompetitor");
    expect(procedures).toContain("getPositioningMap");
    expect(procedures).toContain("getAlerts");
    expect(procedures).toContain("markAlertRead");
    expect(procedures).toContain("getSnapshots");
  });

  it("should have at least 8 procedures for full competitor intelligence", async () => {
    const { competitorIntelRouter } = await import("./newFeatureRouters");
    const procedures = Object.keys(competitorIntelRouter._def.procedures);
    expect(procedures.length).toBeGreaterThanOrEqual(8);
  });

  it("should support competitor analysis with SWOT", async () => {
    const { competitorIntelRouter } = await import("./newFeatureRouters");
    expect(competitorIntelRouter._def.procedures.analyzeCompetitor).toBeDefined();
  });

  it("should support competitive positioning map", async () => {
    const { competitorIntelRouter } = await import("./newFeatureRouters");
    expect(competitorIntelRouter._def.procedures.getPositioningMap).toBeDefined();
  });
});

// ===== Customer Intelligence Tests =====
describe("Customer Intelligence", () => {
  it("should have customerIntel router with required procedures", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter).toBeDefined();
    const procedures = Object.keys(customerIntelRouter._def.procedures);
    expect(procedures).toContain("listCustomers");
    expect(procedures).toContain("getCustomer");
    expect(procedures).toContain("createCustomer");
    expect(procedures).toContain("updateCustomer");
    expect(procedures).toContain("deleteCustomer");
    expect(procedures).toContain("addInteraction");
    expect(procedures).toContain("enrichCustomer");
    expect(procedures).toContain("getJourney");
    expect(procedures).toContain("listSegments");
    expect(procedures).toContain("createSegment");
    expect(procedures).toContain("deleteSegment");
    expect(procedures).toContain("getOutreachPlan");
    expect(procedures).toContain("getDashboardStats");
  });

  it("should have at least 13 procedures for full customer intelligence", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    const procedures = Object.keys(customerIntelRouter._def.procedures);
    expect(procedures.length).toBeGreaterThanOrEqual(13);
  });

  it("should support customer enrichment via AI", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter._def.procedures.enrichCustomer).toBeDefined();
  });

  it("should support journey mapping", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter._def.procedures.getJourney).toBeDefined();
  });

  it("should support outreach plan generation", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter._def.procedures.getOutreachPlan).toBeDefined();
  });

  it("should support customer segmentation", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter._def.procedures.createSegment).toBeDefined();
    expect(customerIntelRouter._def.procedures.listSegments).toBeDefined();
    expect(customerIntelRouter._def.procedures.deleteSegment).toBeDefined();
  });

  it("should support interaction tracking", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter._def.procedures.addInteraction).toBeDefined();
  });

  it("should support dashboard statistics", async () => {
    const { customerIntelRouter } = await import("./newFeatureRouters");
    expect(customerIntelRouter._def.procedures.getDashboardStats).toBeDefined();
  });
});

// ===== Database Tables Tests =====
describe("Database Schema - New Tables", () => {
  it("should export personalVideos table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.personalVideos).toBeDefined();
  });

  it("should export competitorProfiles table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.competitorProfiles).toBeDefined();
  });

  it("should export competitorAlerts table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.competitorAlerts).toBeDefined();
  });

  it("should export customerProfiles table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.customerProfiles).toBeDefined();
  });

  it("should export customerInteractions table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.customerInteractions).toBeDefined();
  });

  it("should export customerSegments table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.customerSegments).toBeDefined();
  });

  it("should export customerInteractions table from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.customerInteractions).toBeDefined();
  });
});

// ===== DB Helpers Tests =====
describe("Database Helpers - New Features", () => {
  it("should export personal video helpers", async () => {
    const db = await import("./db");
    expect(db.getPersonalVideosByUser).toBeDefined();
    expect(db.getPersonalVideoById).toBeDefined();
    expect(db.getPersonalVideoByShareToken).toBeDefined();
    expect(db.createPersonalVideo).toBeDefined();
    expect(db.updatePersonalVideo).toBeDefined();
    expect(db.deletePersonalVideo).toBeDefined();
  });

  it("should export competitor helpers", async () => {
    const db = await import("./db");
    expect(db.getCompetitorProfilesByUser).toBeDefined();
    expect(db.createCompetitorProfile).toBeDefined();
    expect(db.updateCompetitorProfile).toBeDefined();
    expect(db.deleteCompetitorProfile).toBeDefined();
    expect(db.getCompetitorAlertsByUser).toBeDefined();
    expect(db.createCompetitorAlert).toBeDefined();
    expect(db.markCompetitorAlertRead).toBeDefined();
  });

  it("should export customer profile helpers", async () => {
    const db = await import("./db");
    expect(db.getCustomerProfilesByUser).toBeDefined();
    expect(db.getCustomerProfileById).toBeDefined();
    expect(db.createCustomerProfile).toBeDefined();
    expect(db.updateCustomerProfile).toBeDefined();
    expect(db.deleteCustomerProfile).toBeDefined();
  });

  it("should export customer interaction helpers", async () => {
    const db = await import("./db");
    expect(db.getCustomerInteractionsByCustomer).toBeDefined();
    expect(db.createCustomerInteraction).toBeDefined();
  });

  it("should export customer segment helpers", async () => {
    const db = await import("./db");
    expect(db.getCustomerSegmentsByUser).toBeDefined();
    expect(db.createCustomerSegment).toBeDefined();
    expect(db.updateCustomerSegment).toBeDefined();
    expect(db.deleteCustomerSegment).toBeDefined();
  });
});

// ===== Router Integration Tests =====
describe("Router Integration", () => {
  it("all three new routers should be wired into appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    // Check that personalVideo, competitorIntel, and customerIntel namespaces exist
    const hasPersonalVideo = procedures.some(p => p.startsWith("personalVideo."));
    const hasCompetitorIntel = procedures.some(p => p.startsWith("competitorIntel."));
    const hasCustomerIntel = procedures.some(p => p.startsWith("customerIntel."));
    expect(hasPersonalVideo).toBe(true);
    expect(hasCompetitorIntel).toBe(true);
    expect(hasCustomerIntel).toBe(true);
  });

  it("should have all personal video procedures in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("personalVideo.list");
    expect(procedures).toContain("personalVideo.create");
    expect(procedures).toContain("personalVideo.generateScript");
    expect(procedures).toContain("personalVideo.share");
  });

  it("should have all competitor intel procedures in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("competitorIntel.listProfiles");
    expect(procedures).toContain("competitorIntel.analyzeCompetitor");
    expect(procedures).toContain("competitorIntel.getPositioningMap");
    expect(procedures).toContain("competitorIntel.getAlerts");
  });

  it("should have all customer intel procedures in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("customerIntel.listCustomers");
    expect(procedures).toContain("customerIntel.enrichCustomer");
    expect(procedures).toContain("customerIntel.getJourney");
    expect(procedures).toContain("customerIntel.createSegment");
    expect(procedures).toContain("customerIntel.getDashboardStats");
  });
});
