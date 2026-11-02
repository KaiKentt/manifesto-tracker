"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { activatePolitician } from "@/lib/politician";
import { getStripe } from "@/lib/stripe";
import { isDemoMode, isStripeConfigured, siteUrl } from "@/lib/config";
import { fail, type FormState } from "@/lib/forms";

function text(formData: FormData, key: string, max = 500) {
  const value = String(formData.get(key) ?? "").trim().slice(0, max);
  return value || null;
}

// Step 1 of the politician upgrade: save the verification request, then
// send the user to Stripe Checkout (or activate straight away in demo mode).
export async function startUpgrade(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?next=/upgrade");

  const fullName = text(formData, "full_name", 120);
  if (!fullName || fullName.length < 3) return fail("Enter your full name as it appears on official records.", formData);
  if (formData.get("agree") !== "on") return fail("Please confirm the declaration before continuing.", formData);

  const { data: request, error } = await supabase
    .from("politician_requests")
    .insert({
      full_name: fullName,
      party_id: text(formData, "party_id", 64),
      position: text(formData, "position", 120),
      constituency: text(formData, "constituency", 120),
      bio: text(formData, "bio", 2000),
      claim_entity_id: text(formData, "claim_entity_id", 64),
    })
    .select("id")
    .single();
  if (error || !request) return fail(error?.message ?? "Could not save your request.", formData);

  if (isDemoMode()) {
    await activatePolitician({ userId: user.id, requestId: request.id, status: "active" });
    redirect("/dashboard?upgraded=1");
  }

  if (!isStripeConfigured()) {
    return fail("Payments are not configured yet. Set the Stripe keys, or DEMO_MODE=true for testing.", formData);
  }

  // Reuse the Stripe customer if this user already has one.
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: fullName,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    metadata: { user_id: user.id, request_id: request.id },
    subscription_data: { metadata: { user_id: user.id, request_id: request.id } },
    allow_promotion_codes: true,
    success_url: `${siteUrl()}/dashboard?upgraded=1`,
    cancel_url: `${siteUrl()}/upgrade?canceled=1`,
  });

  if (!session.url) return fail("Stripe did not return a checkout link.", formData);
  redirect(session.url);
}
