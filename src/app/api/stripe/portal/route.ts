import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/config";

// Opens the Stripe Billing Portal so a politician can update their card or cancel.
export async function POST() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(`${siteUrl()}/login?next=/dashboard`, 303);

  const customerId = viewer.profile?.stripe_customer_id;
  if (!customerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(`${siteUrl()}/dashboard?billing=unavailable`, 303);
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl()}/dashboard`,
  });
  return NextResponse.redirect(session.url, 303);
}
