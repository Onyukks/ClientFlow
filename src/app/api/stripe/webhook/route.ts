import Stripe from "stripe";
import { SubscriptionStatus } from "@/generated/prisma/client";
import { stripe, stripeWebhookSecret } from "@/lib/stripe";
import {
  syncCheckoutSession,
  syncStripeSubscription,
  updateSubscriptionStatusByCustomer,
} from "@/lib/stripe-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe webhook signature." }, { status: 400 });
  }

  if (!stripeWebhookSecret) {
    return Response.json({ error: "Missing Stripe webhook secret." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";

    return Response.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await updateSubscriptionStatusByCustomer(
        (event.data.object as Stripe.Invoice).customer,
        SubscriptionStatus.PAST_DUE,
      );
      break;
    case "invoice.payment_succeeded":
      await updateSubscriptionStatusByCustomer(
        (event.data.object as Stripe.Invoice).customer,
        SubscriptionStatus.ACTIVE,
      );
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}
