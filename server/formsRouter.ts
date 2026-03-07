import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "./security";

const fieldTypeEnum = z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "number"]);

export const formsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getFormsByUser(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const form = await db.getFormById(input.id);
    if (!form || form.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    const fields = await db.getFormFields(input.id);
    return { ...form, fields };
  }),

  getPublic: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const form = await db.getFormById(input.id);
    if (!form || form.status !== "active") return null;
    const fields = await db.getFormFields(input.id);
    return { formId: form.id, name: form.name, description: form.description, submitButtonText: form.submitButtonText, redirectUrl: form.redirectUrl, fields };
  }),

  getPublicBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const form = await db.getFormBySlugPublic(input.slug);
    if (!form) return null;
    const fields = await db.getFormFields(form.id);
    return { formId: form.id, name: form.name, description: form.description, submitButtonText: form.submitButtonText, redirectUrl: form.redirectUrl, fields };
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    submitButtonText: z.string().optional(),
    redirectUrl: z.string().optional(),
    createLeadOnSubmit: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const existing = await db.getFormBySlug(ctx.user.id, input.slug);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug already in use" });
    return db.createForm({
      userId: ctx.user.id,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      submitButtonText: input.submitButtonText ?? "Submit",
      redirectUrl: input.redirectUrl ?? null,
      createLeadOnSubmit: input.createLeadOnSubmit ?? true,
      status: "draft",
    });
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    submitButtonText: z.string().optional(),
    redirectUrl: z.string().optional(),
    createLeadOnSubmit: z.boolean().optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const form = await db.getFormById(input.id);
    if (!form || form.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    const { id, ...data } = input;
    await db.updateForm(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const form = await db.getFormById(input.id);
    if (!form || form.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    const fields = await db.getFormFields(input.id);
    for (const f of fields) await db.deleteFormField(f.id);
    await db.deleteForm(input.id);
    return { success: true };
  }),

  addField: protectedProcedure.input(z.object({
    formId: z.number(),
    fieldType: fieldTypeEnum,
    label: z.string().min(1),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    orderIndex: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const form = await db.getFormById(input.formId);
    if (!form || form.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    const fields = await db.getFormFields(input.formId);
    const orderIndex = input.orderIndex ?? fields.length;
    return db.createFormField({
      formId: input.formId,
      orderIndex,
      fieldType: input.fieldType,
      label: input.label,
      placeholder: input.placeholder ?? null,
      required: input.required ?? true,
      options: input.options ?? null,
    });
  }),

  updateField: protectedProcedure.input(z.object({
    id: z.number(),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    orderIndex: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateFormField(id, data);
    return { success: true };
  }),

  deleteField: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteFormField(input.id);
    return { success: true };
  }),

  getResponses: protectedProcedure.input(z.object({ formId: z.number() })).query(async ({ ctx, input }) => {
    const form = await db.getFormById(input.formId);
    if (!form || form.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    return db.getFormResponses(input.formId);
  }),

  submit: publicProcedure.input(z.object({
    formId: z.number(),
    data: z.record(z.string()),
  })).mutation(async ({ input, ctx }) => {
    try {
      checkRateLimit(ctx.req?.ip || "unknown", "form-submit", 60000, 30);
    } catch (e) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many submissions. Try again in a minute." });
    }
    const form = await db.getFormById(input.formId);
    if (!form || form.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or inactive" });
    const response = await db.createFormResponse({
      formId: input.formId,
      userId: form.userId,
      data: input.data,
      leadId: null,
    });
    await db.incrementFormSubmissionCount(input.formId);
    let leadId: number | null = null;
    if (form.createLeadOnSubmit && (input.data.email || input.data.name)) {
      const lead = await db.createLead({
        userId: form.userId,
        name: input.data.name ?? input.data.email ?? null,
        email: input.data.email ?? null,
        phone: input.data.phone ?? null,
        company: input.data.company ?? null,
        source: `Form: ${form.name}`,
        status: "new",
        score: 0,
      });
      leadId = lead.id;
      await db.updateFormResponse(response.id, { leadId });
      const setting = await db.getAssignmentSetting(form.userId);
      if (setting?.mode === "round_robin" && setting.memberOrder?.length) {
        const nextIndex = ((setting.lastAssignedIndex ?? 0) + 1) % setting.memberOrder.length;
        const assigneeId = setting.memberOrder[nextIndex];
        await db.updateLead(lead.id, { assignedToUserId: assigneeId });
        await db.upsertAssignmentSetting(form.userId, { lastAssignedIndex: nextIndex, memberOrder: setting.memberOrder });
      }
    }
    return { success: true, responseId: response.id, leadId, redirectUrl: form.redirectUrl ?? undefined };
  }),
});
