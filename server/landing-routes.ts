/**
 * Public API for landing page form submission.
 * POST /api/landing/submit — create submission, create lead/crm if configured, run automations, return redirect URL.
 */
import express from "express";
import * as db from "./db";
import { runAutomationWithContext } from "./automationRunner";

interface LeadDestinationConfig {
  leadManager?: boolean;
  crm?: boolean;
  emailListId?: number;
  emailSequenceId?: number;
}

export function registerLandingRoutes(app: express.Application) {
  app.post("/api/landing/submit", async (req, res) => {
    try {
      const { landingPageId, data } = req.body as { landingPageId?: number; data?: Record<string, string> };
      if (!landingPageId || !data || typeof data !== "object") {
        return res.status(400).json({ success: false, error: "landingPageId and data required" });
      }

      const page = await db.getLandingPageById(landingPageId);
      if (!page) return res.status(404).json({ success: false, error: "Landing page not found" });

      const email = data.email || data.Email || "";
      const name = data.name || data.Name || data.fullName || "";

      const submission = await db.createFormSubmission({
        userId: page.userId,
        landingPageId,
        data,
        ipAddress: req.ip || req.socket?.remoteAddress?.slice(0, 64),
        userAgent: req.get("user-agent")?.slice(0, 512) || undefined,
      });

      let leadId: number | undefined;
      const metadata = (page.metadata as { leadDestination?: LeadDestinationConfig; redirectAfterSubmit?: string | number }) || {};
      const leadDest = metadata.leadDestination as LeadDestinationConfig | undefined;

      if (leadDest?.leadManager && email) {
        const lead = await db.createLead({
          userId: page.userId,
          campaignId: page.campaignId ?? undefined,
          name: name || undefined,
          email,
          phone: data.phone || data.Phone || undefined,
          company: data.company || data.Company || undefined,
          source: "landing_page",
          status: "new",
        });
        leadId = lead.id;
      }

      if (leadDest?.crm && (email || name)) {
        await db.createDeal({
          userId: page.userId,
          leadId: leadId ?? undefined,
          campaignId: page.campaignId ?? undefined,
          title: name || email || "New lead from landing page",
        });
      }

      if (leadDest?.emailListId && email) {
        try {
          await db.createEmailContact({
            userId: page.userId,
            listId: leadDest.emailListId,
            email,
            name: name || null,
            tags: ["landing_page"],
          });
        } catch {
          // List or contact may already exist
        }
      }

      const automations = await db.getAutomationsForFormSubmit(page.userId, landingPageId);
      const context = { submissionId: submission.id, leadId, email, name, landingPageId };
      for (const w of automations) {
        await runAutomationWithContext(w.id, context);
      }

      let redirectUrl: string | undefined;
      if (metadata.redirectAfterSubmit) {
        if (typeof metadata.redirectAfterSubmit === "number") {
          const targetPage = await db.getLandingPageById(metadata.redirectAfterSubmit);
          if (targetPage?.publishedUrl) redirectUrl = targetPage.publishedUrl;
          else redirectUrl = `/lp/${targetPage?.slug || metadata.redirectAfterSubmit}`;
        } else redirectUrl = String(metadata.redirectAfterSubmit);
      }

      return res.status(200).json({
        success: true,
        submissionId: submission.id,
        redirectUrl: redirectUrl || undefined,
      });
    } catch (e) {
      console.error("[landing/submit]", e);
      return res.status(500).json({ success: false, error: "Submission failed" });
    }
  });
}
