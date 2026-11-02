import "server-only";
import { createAdminClient } from "./supabase/admin";

// Called when a politician's payment succeeds (Stripe webhook) or, in demo
// mode, straight after the upgrade form. Gives the account politician access
// and moves their request into the admin review queue. Their public page goes
// live only after an admin approves it.
export async function activatePolitician(opts: {
  userId: string;
  requestId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string;
}) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", opts.userId).maybeSingle();

  const update: Record<string, unknown> = { subscription_status: opts.status ?? "active" };
  if (profile?.role !== "admin") update.role = "politician";
  if (opts.stripeCustomerId) update.stripe_customer_id = opts.stripeCustomerId;
  if (opts.stripeSubscriptionId) update.stripe_subscription_id = opts.stripeSubscriptionId;

  const { error } = await admin.from("profiles").update(update).eq("id", opts.userId);
  if (error) throw error;

  let query = admin
    .from("politician_requests")
    .update({ status: "pending_review" })
    .eq("user_id", opts.userId)
    .eq("status", "awaiting_payment");
  if (opts.requestId) query = query.eq("id", opts.requestId);
  const { error: reqError } = await query;
  if (reqError) throw reqError;
}

// Mirrors a Stripe subscription status onto the profile. When it is no longer
// active, Row Level Security locks publishing; the public record stays.
export async function syncSubscription(opts: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: opts.status, stripe_subscription_id: opts.stripeSubscriptionId })
    .eq("stripe_customer_id", opts.stripeCustomerId);
  if (error) throw error;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "politician";
}
