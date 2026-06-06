import Stripe from "stripe";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/client";

export const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
  appInfo: {
    name: "ClientFlow",
    version: "0.1.0",
  },
});

export const stripeWebhookSecret = process.env["STRIPE_WEBHOOK_SECRET"] ?? "";

export const appUrl = (process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000").replace(/\/$/, "");

export const stripePriceByPlan: Partial<Record<SubscriptionPlan, string>> = {
  [SubscriptionPlan.GROWTH]: process.env["STRIPE_GROWTH_PRICE_ID"],
  [SubscriptionPlan.PRO]: process.env["STRIPE_PRO_PRICE_ID"],
};

export const stripePlanByPrice = Object.fromEntries(
  Object.entries(stripePriceByPlan)
    .filter((entry): entry is [SubscriptionPlan, string] => Boolean(entry[1]))
    .map(([plan, priceId]) => [priceId, plan]),
) as Record<string, SubscriptionPlan>;

export const isStripeConfigured = () =>
  Boolean(
    process.env["STRIPE_SECRET_KEY"] &&
      process.env["STRIPE_WEBHOOK_SECRET"] &&
      process.env["STRIPE_GROWTH_PRICE_ID"] &&
      process.env["STRIPE_PRO_PRICE_ID"],
  );

export const getStripePriceId = (plan: SubscriptionPlan) => stripePriceByPlan[plan] ?? null;

export const getPlanFromStripePrice = (priceId: string | null | undefined) =>
  priceId ? (stripePlanByPrice[priceId] ?? null) : null;

export const mapStripeSubscriptionStatus = (status: Stripe.Subscription.Status): SubscriptionStatus => {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    case "unpaid":
      return SubscriptionStatus.INCOMPLETE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
};

export const getPeriodEnd = (subscription: Stripe.Subscription) => {
  const periodEnd = (subscription as { current_period_end?: number }).current_period_end;

  return typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null;
};
