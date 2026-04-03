/**
 * Email sending via Resend. All emails from hello@otobi.ai.
 * 12 sequences wired to their triggers (see triggers in auth, stripe, jobs).
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";

const FROM = "OTOBI AI <hello@nationalsolaracademy.com>";
const resend = ENV.resendApiKey ? new Resend(ENV.resendApiKey) : null;

export function getBaseUrl(): string {
  const u = process.env.PUBLIC_URL || process.env.BASE_URL || "https://app.otobi.ai";
  return u.replace(/\/$/, "");
}

function wrapHtml(title: string, body: string, ctaLabel?: string, ctaUrl?: string, unsubscribeUrl?: string): string {
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0"><a href="${ctaUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">${ctaLabel}</a></p>`
      : "";
  const unsub =
    unsubscribeUrl ?
      `<p style="margin-top:24px;font-size:12px;color:#6b7280"><a href="${unsubscribeUrl}" style="color:#6b7280">Unsubscribe</a></p>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;line-height:1.6;color:#1f2937">
${body}
${ctaBlock}
${unsub}
<p style="margin-top:32px;font-size:12px;color:#9ca3af">OTOBI AI — One platform for all your marketing.</p></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set; skipping send:", subject);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Email] Send failed:", e);
    return false;
  }
}

// ─── EMAIL 1 — Welcome Free ─────────────────────────────────────────────
export function getWelcomeFreeHtml(name: string, dashboardUrl: string): string {
  const displayName = name || "there";
  return wrapHtml(
    "Welcome to OTOBI AI",
    `<h1 style="font-size:24px">Hi ${displayName}, welcome to OTOBI AI!</h1>
<p>Here’s how to get started:</p>
<ul>
<li><strong>Product Analyzer</strong> — Upload any product and get AI-powered insights.</li>
<li><strong>Content Studio</strong> — Generate ad copy, blogs, social posts, and more.</li>
<li><strong>Creative Engine</strong> — Create images and video scripts for every platform.</li>
</ul>
<p>Your free tier limits: <strong>5</strong> AI generations, <strong>2</strong> images, <strong>1</strong> video script per month.</p>
<p style="color:#6b7280;font-size:14px">Need more? Upgrade to Starter for $49/month.</p>`,
    "Go to Dashboard",
    dashboardUrl,
  );
}

// ─── EMAIL 2 — Trial Started ────────────────────────────────────────────
export function getTrialStartedHtml(
  name: string,
  tier: string,
  chargeDate: string,
  fiveThings: string[],
  limitsSummary: string,
  dashboardUrl: string,
  cancelUrl: string,
): string {
  const displayName = name || "there";
  const list = fiveThings.map((t) => `<li>${t}</li>`).join("");
  return wrapHtml(
    "Your 7-day free trial has started",
    `<h1 style="font-size:24px">Hi ${displayName}, your 7-day free trial has started!</h1>
<p>You’re on the <strong>${tier}</strong> plan. Here’s what to do first:</p>
<ol>${list}</ol>
<p>Your limits for this tier: ${limitsSummary}</p>
<p>Your card will be charged on <strong>${chargeDate}</strong>.</p>
<p><a href="${cancelUrl}" style="color:#6b7280">Cancel anytime before ${chargeDate} and you will not be charged.</a></p>`,
    "Go to Dashboard",
    dashboardUrl,
  );
}

// ─── EMAIL 3 — Trial Day 3 Nurture ───────────────────────────────────────
export function getTrialDay3Html(dashboardUrl: string): string {
  return wrapHtml(
    "Day 3 — are you getting value from OTOBI?",
    `<h1 style="font-size:24px">Quick check-in</h1>
<p>Have you tried the AI Campaign Wizard or Content Studio yet?</p>
<p>One quick win: <strong>Generate a week of social posts in under 5 minutes.</strong></p>
<p>You might also like our <strong>Product Analyzer</strong> — paste a product URL and get instant positioning and copy ideas.</p>
<p style="color:#6b7280">4 days left in your trial.</p>`,
    "Try it now",
    dashboardUrl,
  );
}

// ─── EMAIL 4 — Trial Day 6 Last Warning ───────────────────────────────────
export function getTrialDay6Html(amount: string, date: string, dashboardUrl: string, cancelUrl: string): string {
  return wrapHtml(
    "Your trial ends tomorrow",
    `<h1 style="font-size:24px">Your trial ends tomorrow</h1>
<p>Your card will be charged <strong>${amount}</strong> on <strong>${date}</strong>.</p>
<p>You’ll keep access to all features on your current plan.</p>
<p><a href="${cancelUrl}" style="color:#dc2626;font-weight:bold">Cancel my trial</a> — no charge if you cancel before ${date}.</p>`,
    "Keep my plan",
    dashboardUrl,
  );
}

// ─── EMAIL 5 — Charge Confirmed ──────────────────────────────────────────
export function getChargeConfirmedHtml(
  tierName: string,
  amount: string,
  date: string,
  nextBillingDate: string,
  invoiceNumber: string,
  portalUrl: string,
  dashboardUrl: string,
): string {
  return wrapHtml(
    "Payment confirmed",
    `<h1 style="font-size:24px">Payment confirmed — welcome to OTOBI ${tierName}</h1>
<p>We charged <strong>${amount}</strong> on ${date}. Invoice #${invoiceNumber}.</p>
<p>Your next billing date: <strong>${nextBillingDate}</strong>.</p>
<p><a href="${portalUrl}">Manage payment method</a></p>`,
    "Go to Dashboard",
    dashboardUrl,
  );
}

// ─── EMAIL 6 — Trial Cancelled ──────────────────────────────────────────
export function getTrialCancelledHtml(reactivationUrl: string, replyEmail: string): string {
  return wrapHtml(
    "Your trial has been cancelled",
    `<h1 style="font-size:24px">Your trial has been cancelled</h1>
<p>No charge was made. Your Free tier access continues.</p>
<p>What made you decide not to continue? Reply to this email or <a href="mailto:${replyEmail}">contact us</a> — we’d love to hear.</p>
<p><a href="${reactivationUrl}">Changed your mind? Restart your trial.</a></p>`,
  );
}

// ─── EMAIL 7 — Renewal Reminder ──────────────────────────────────────────
export function getRenewalReminderHtml(
  amount: string,
  date: string,
  portalUrl: string,
  usageSummary: string,
): string {
  return wrapHtml(
    "Your OTOBI subscription renews in 3 days",
    `<h1 style="font-size:24px">Renewal reminder</h1>
<p>Your subscription will renew on <strong>${date}</strong> for <strong>${amount}</strong>.</p>
<p>Current month usage: ${usageSummary}</p>
<p><a href="${portalUrl}">Manage billing</a></p>`,
  );
}

// ─── EMAIL 8 — Payment Failed ────────────────────────────────────────────
export function getPaymentFailedHtml(portalUrl: string): string {
  return wrapHtml(
    "Action required — your OTOBI payment failed",
    `<h1 style="font-size:24px">Your payment failed</h1>
<p>Please update your card within 3 days to avoid losing access.</p>
<p><strong>If your card is not updated within 3 days, your account will revert to Free.</strong></p>
<p><a href="${portalUrl}">Update your card now</a></p>`,
    "Update payment method",
    portalUrl,
  );
}

// ─── EMAIL 9 — Downgraded Due to Failed Payment ──────────────────────────
export function getDowngradedHtml(featuresLost: string[], resubscribeUrl: string, discountCode: string): string {
  const list = featuresLost.map((f) => `<li>${f}</li>`).join("");
  return wrapHtml(
    "Your account has been downgraded to Free",
    `<h1 style="font-size:24px">Your account has been downgraded to Free</h1>
<p>We couldn’t process your payment after several attempts. Here’s what changed:</p>
<ul>${list}</ul>
<p>Your data is safe. <a href="${resubscribeUrl}">Resubscribe here</a> to restore access.</p>
<p>Come back this week and get your first month at 10% off. Use code: <strong>${discountCode}</strong></p>`,
    "Resubscribe",
    resubscribeUrl,
  );
}

// ─── EMAIL 10 — Usage Alert 80% ─────────────────────────────────────────
export function getUsage80Html(
  generationsLeft: number,
  resetDate: string,
  creditTopUpUrl: string,
  upgradeUrl: string,
): string {
  return wrapHtml(
    "You have used 80% of your monthly generations",
    `<h1 style="font-size:24px">80% of your monthly generations used</h1>
<p>You have <strong>${generationsLeft}</strong> generations left. Your limit resets on ${resetDate}.</p>
<p>Get 150 more for $19 with a <a href="${creditTopUpUrl}">credit top-up</a>, or <a href="${upgradeUrl}">upgrade your plan</a> for higher limits.</p>`,
  );
}

// ─── EMAIL 11 — Upgrade Confirmed ─────────────────────────────────────────
export function getUpgradeConfirmedHtml(
  tierName: string,
  amount: string,
  newFeatures: string[],
  newLimits: string,
  dashboardUrl: string,
): string {
  const list = newFeatures.map((f) => `<li>${f}</li>`).join("");
  return wrapHtml(
    `You are now on OTOBI ${tierName}`,
    `<h1 style="font-size:24px">You’re now on ${tierName}</h1>
<p>Your new monthly amount: <strong>${amount}</strong>.</p>
<p>New features: <ul>${list}</ul></p>
<p>New limits: ${newLimits}</p>`,
    "Explore your new features",
    dashboardUrl,
  );
}

// ─── EMAIL 12 — Win-Back ───────────────────────────────────────────────
export function getWinBackHtml(featuresNew: string[], resubscribeUrl: string): string {
  const list = featuresNew.map((f) => `<li>${f}</li>`).join("");
  return wrapHtml(
    "We’ve been building since you left",
    `<h1 style="font-size:24px">Here’s what’s new</h1>
<p>We’ve added and improved:</p>
<ul>${list}</ul>
<p>Your data is still here. <a href="${resubscribeUrl}">Resubscribe</a> to pick up where you left off.</p>`,
    "Resubscribe",
    resubscribeUrl,
  );
}
