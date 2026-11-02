import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { activatePolitician, syncSubscription } from "@/lib/politician";

// Stripe → app. Add this URL in Stripe Dashboard → Developers → Webhooks:
//   https://<your-domain>/api/stripe/webhook
// Events: checkout.session.completed, customer.subscription.created,
//         customer.subscription.updated, customer.subscription.deleted
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        if (!userId) break;
        await activatePolitician({
          userId,
          requestId: session.metadata?.request_id ?? null,
          stripeCustomerId: idOf(session.customer),
          stripeSubscriptionId: idOf(session.subscription),
          status: "active",
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = idOf(sub.customer);
        if (!customerId) break;
        await syncSubscription({
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // 500 makes Stripe retry the event later.
    console.error("Stripe webhook failed", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
