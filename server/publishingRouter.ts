/**
 * Native publishing: Medium, Substack, WordPress.
 * Store credentials per user; publish repurposed content to connected platforms.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

const MEDIUM_ME = "https://api.medium.com/v1/me";
const MEDIUM_POSTS = (userId: string) => `https://api.medium.com/v1/users/${userId}/posts`;

async function publishToMedium(accessToken: string, title: string, body: string, publishStatus: "draft" | "public" = "draft") {
  const meRes = await fetch(MEDIUM_ME, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!meRes.ok) throw new Error("Medium token invalid or expired");
  const me = (await meRes.json()) as { data?: { id: string } };
  const userId = me.data?.id;
  if (!userId) throw new Error("Could not get Medium user id");

  const res = await fetch(MEDIUM_POSTS(userId), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      title,
      contentFormat: "markdown",
      content: body,
      publishStatus,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Medium publish failed: ${err}`);
  }
  const data = (await res.json()) as { data?: { id: string; url: string } };
  return { id: data.data?.id, url: data.data?.url };
}

async function publishToWordPress(siteUrl: string, accessToken: string, title: string, body: string) {
  const base = siteUrl.replace(/\/$/, "");
  const url = `${base}/wp-json/wp/v2/posts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${accessToken}`,
    },
    body: JSON.stringify({
      title,
      content: body,
      status: "publish",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WordPress publish failed: ${err}`);
  }
  const data = (await res.json()) as { id: number; link?: string };
  return { id: String(data.id), url: data.link };
}

export const publishingRouter = router({
  listCredentials: protectedProcedure.query(async ({ ctx }) => {
    const list = await db.getPublishingCredentialsByUser(ctx.user.id);
    return list.map((c) => ({
      id: c.id,
      platform: c.platform,
      siteUrl: c.siteUrl,
      status: c.status,
      createdAt: c.createdAt,
    }));
  }),

  connect: protectedProcedure.input(z.object({
    platform: z.enum(["medium", "substack", "wordpress"]),
    accessToken: z.string().min(1),
    siteUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    if (input.platform === "wordpress" && !input.siteUrl) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "WordPress requires site URL (e.g. https://yoursite.com)" });
    }
    const { id } = await db.createPublishingCredential({
      userId: ctx.user.id,
      platform: input.platform,
      accessToken: input.accessToken,
      siteUrl: input.siteUrl ?? null,
      status: "connected",
    });
    return { id };
  }),

  disconnect: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const cred = await db.getPublishingCredentialById(input.id);
    if (!cred || cred.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    await db.updatePublishingCredential(input.id, { status: "disconnected" });
    return { success: true };
  }),

  publish: protectedProcedure.input(z.object({
    contentId: z.number(),
    platform: z.enum(["medium", "substack", "wordpress"]),
    publishStatus: z.enum(["draft", "public"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const content = await db.getRepurposedContentById(input.contentId);
    if (!content || content.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });

    const creds = await db.getPublishingCredentialsByUser(ctx.user.id);
    const cred = creds.find((c) => c.platform === input.platform && c.status === "connected");
    if (!cred?.accessToken) throw new TRPCError({ code: "BAD_REQUEST", message: `No connected ${input.platform} account. Connect in settings first.` });

    const title = content.title || content.formatType;
    const body = content.body || "";

    if (input.platform === "medium") {
      const result = await publishToMedium(cred.accessToken, title, body, input.publishStatus ?? "draft");
      await db.updateRepurposedContent(input.contentId, { status: "published", externalId: result.id, publishedAt: new Date() });
      return { success: true, url: result.url, externalId: result.id };
    }

    if (input.platform === "wordpress") {
      if (!cred.siteUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "WordPress site URL not set" });
      const result = await publishToWordPress(cred.siteUrl, cred.accessToken, title, body);
      await db.updateRepurposedContent(input.contentId, { status: "published", externalId: result.id, publishedAt: new Date() });
      return { success: true, url: result.url, externalId: result.id };
    }

    if (input.platform === "substack") {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Substack programmatic publish is limited. Copy content from the repurposer and paste into Substack." });
    }

    throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown platform" });
  }),
});
