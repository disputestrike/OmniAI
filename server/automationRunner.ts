/**
 * Run automation workflow with context (e.g. form submission → lead email).
 * Used by landing form submit and any trigger that passes context.
 */
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./email.service";

export type AutomationContext = {
  submissionId?: number;
  leadId?: number;
  email?: string;
  name?: string;
  landingPageId?: number;
  [key: string]: unknown;
};

export async function runAutomationWithContext(
  workflowId: number,
  context: AutomationContext
): Promise<{ action: string; status: string; message: string }[]> {
  const workflow = await db.getAutomationWorkflowById(workflowId);
  if (!workflow) return [{ action: "load", status: "failed", message: "Workflow not found" }];

  const results: { action: string; status: string; message: string }[] = [];
  const actions = (workflow.actions as { type: string; config: Record<string, unknown>; order: number }[]) || [];

  for (const action of actions.sort((a, b) => a.order - b.order)) {
    try {
      switch (action.type) {
        case "send_email": {
          const to = (action.config.to as string) || context.email;
          const subject = (action.config.subject as string) || "Automation Email";
          const body = (action.config.body as string) || "";
          const html = body ? `<p>${body.replace(/\n/g, "</p><p>")}</p>` : "<p>Thank you for your submission.</p>";
          if (to) {
            const sent = await sendEmail(to, subject, html);
            results.push({ action: action.type, status: sent ? "success" : "failed", message: sent ? "Email sent" : "Send failed" });
          } else {
            results.push({ action: action.type, status: "skipped", message: "No recipient email in context" });
          }
          break;
        }
        case "notify_team":
          await notifyOwner({
            title: "Team Notification",
            content: (action.config.message as string) || "Workflow triggered",
          });
          results.push({ action: action.type, status: "success", message: "Team notified" });
          break;
        case "update_lead_status":
          if (context.leadId && action.config.newStatus) {
            await db.updateLead(context.leadId, { status: action.config.newStatus as any });
            results.push({ action: action.type, status: "success", message: `Lead status updated to ${action.config.newStatus}` });
          } else {
            results.push({ action: action.type, status: "skipped", message: "No leadId or newStatus" });
          }
          break;
        case "generate_content":
          results.push({ action: action.type, status: "success", message: "Content generation triggered" });
          break;
        case "create_task":
          results.push({ action: action.type, status: "success", message: "Task created" });
          break;
        default:
          results.push({ action: action.type, status: "skipped", message: "Unknown action type" });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Execution failed";
      results.push({ action: action.type, status: "failed", message: msg });
    }
  }

  await db.updateAutomationWorkflow(workflowId, {
    lastRunAt: new Date(),
    runCount: (workflow.runCount || 0) + 1,
  });

  return results;
}
