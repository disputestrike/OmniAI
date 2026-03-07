/**
 * Content Repurposing Engine — video/audio/transcript → all content formats in one go.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

const REPURPOSE_FORMATS = [
  "blog_post", "linkedin_article", "twitter_thread", "social_caption", "email_copy",
  "pr_release", "podcast_script", "video_script", "ad_copy_short", "ad_copy_long",
  "seo_meta", "copywriting", "youtube_seo", "google_ads", "sms_copy", "story_content",
  "ugc_script", "landing_page", "whatsapp_broadcast", "amazon_listing", "tv_script", "radio_script",
] as const;

const formatLabels: Record<string, string> = {
  blog_post: "Blog post",
  linkedin_article: "LinkedIn article",
  twitter_thread: "Twitter/X thread",
  social_caption: "Social caption",
  email_copy: "Email newsletter",
  pr_release: "Press release",
  podcast_script: "Podcast script",
  video_script: "Video script",
  ad_copy_short: "Short ad copy",
  ad_copy_long: "Long ad copy",
  seo_meta: "SEO meta",
  copywriting: "Sales copy",
  youtube_seo: "YouTube SEO",
  google_ads: "Google Ads",
  sms_copy: "SMS copy",
  story_content: "Story content",
  ugc_script: "UGC script",
  landing_page: "Landing page copy",
  whatsapp_broadcast: "WhatsApp broadcast",
  amazon_listing: "Amazon listing",
  tv_script: "TV script",
  radio_script: "Radio script",
};

export const repurposingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getRepurposingProjectsByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const project = await db.getRepurposingProjectById(input.id);
    if (!project || project.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    return project;
  }),

  getContents: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
    const project = await db.getRepurposingProjectById(input.projectId);
    if (!project || project.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    return db.getRepurposedContentsByProject(input.projectId);
  }),

  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    sourceType: z.enum(["video_url", "video_upload", "audio_upload", "transcript_paste"]),
    sourceUrl: z.string().optional(),
    sourceTranscript: z.string().optional(),
    brandVoiceId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id } = await db.createRepurposingProject({
      userId: ctx.user.id,
      title: input.title,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl ?? null,
      sourceTranscript: input.sourceTranscript ?? null,
      brandVoiceId: input.brandVoiceId ?? null,
      status: "pending",
    });
    return { id };
  }),

  generateAllFormats: protectedProcedure.input(z.object({ projectId: z.number() })).mutation(async ({ ctx, input }) => {
    const project = await db.getRepurposingProjectById(input.projectId);
    if (!project || project.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const transcript = project.sourceTranscript?.trim();
    if (!transcript) throw new TRPCError({ code: "BAD_REQUEST", message: "No transcript to repurpose. Add a transcript or paste content first." });

    await db.updateRepurposingProject(input.projectId, { status: "generating" });

    let brandContext = "";
    if (project.brandVoiceId) {
      const voice = await db.getBrandVoiceById(project.brandVoiceId);
      if (voice?.voiceProfile) {
        const v = voice.voiceProfile as { tone?: string; style?: string };
        brandContext = `Brand voice: ${v.tone || ""} ${v.style || ""}. `;
      }
    }

    const systemPrompt = `You are an expert content repurposer. Turn the given transcript/content into the requested format. Preserve the core message and key points. Output only the content (no meta-commentary). ${brandContext}`;

    for (const formatType of REPURPOSE_FORMATS) {
      try {
        const label = formatLabels[formatType] || formatType;
        const res = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Convert this into ${label}.\n\n---\n${transcript}\n---` },
          ],
        });
        const body = (res.choices[0]?.message?.content as string) || "";
        const title = body.split("\n")[0]?.replace(/^#+\s*/, "").substring(0, 255) || label;
        await db.createRepurposedContent({
          projectId: input.projectId,
          userId: ctx.user.id,
          formatType,
          title,
          body,
          status: "draft",
        });
      } catch (e) {
        console.error("[Repurposing] Format failed:", formatType, e);
      }
    }

    await db.updateRepurposingProject(input.projectId, { status: "completed" });
    return { success: true, count: REPURPOSE_FORMATS.length };
  }),

  updateContent: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const content = await db.getRepurposedContentById(input.id);
    if (!content || content.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const { id, ...data } = input;
    await db.updateRepurposedContent(id, data);
    return { success: true };
  }),
});
