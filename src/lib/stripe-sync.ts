import Stripe from "stripe";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getPeriodEnd,
  getPlanFromStripePrice,
  mapStripeSubscriptionStatus,
  stripe,
} from "@/lib/stripe";

const getStripeObjectId = (value: string | { id: string } | null | undefined) => {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
};

const getSubscriptionPriceId = (subscription: Stripe.Subscription) => subscription.items.data[0]?.price.id ?? null;

const getCheckoutPlan = (plan: string | undefined) =>
  plan && Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan) ? (plan as SubscriptionPlan) : null;

const findWorkspaceIdForStripeSubscription = async (subscription: Stripe.Subscription, customerId: string | null) => {
  const metadataWorkspaceId = subscription.metadata["workspaceId"];

  if (metadataWorkspaceId) {
    return metadataWorkspaceId;
  }

  const filters: Array<{ stripeCustomerId?: string; stripeSubscriptionId?: string }> = [
    {
      stripeSubscriptionId: subscription.id,
    },
  ];

  if (customerId) {
    filters.push({
      stripeCustomerId: customerId,
    });
  }

  const subscriptionRecord = await prisma.subscription.findFirst({
    select: {
      workspaceId: true,
    },
    where: {
      OR: filters,
    },
  });

  return subscriptionRecord?.workspaceId ?? null;
};

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  fallback?: {
    customerId?: string | null;
    plan?: SubscriptionPlan | null;
    workspaceId?: string | null;
  },
) {
  const customerId = getStripeObjectId(subscription.customer) ?? fallback?.customerId ?? null;
  const workspaceId = fallback?.workspaceId ?? (await findWorkspaceIdForStripeSubscription(subscription, customerId));

  if (!workspaceId) {
    return;
  }

  const pricePlan = getPlanFromStripePrice(getSubscriptionPriceId(subscription));
  const plan = pricePlan ?? fallback?.plan ?? SubscriptionPlan.GROWTH;

  await prisma.subscription.upsert({
    create: {
      currentPeriodEnd: getPeriodEnd(subscription),
      plan,
      status: mapStripeSubscriptionStatus(subscription.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      workspaceId,
    },
    update: {
      currentPeriodEnd: getPeriodEnd(subscription),
      plan,
      status: mapStripeSubscriptionStatus(subscription.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    },
    where: {
      workspaceId,
    },
  });
}

export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  const subscriptionId = getStripeObjectId(session.subscription);
  const customerId = getStripeObjectId(session.customer);
  const workspaceId = session.metadata?.["workspaceId"] ?? session.client_reference_id ?? null;
  const requestedPlan = getCheckoutPlan(session.metadata?.["plan"]);

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await syncStripeSubscription(subscription, {
      customerId,
      plan: requestedPlan,
      workspaceId,
    });

    return;
  }

  if (workspaceId && customerId) {
    await prisma.subscription.upsert({
      create: {
        plan: requestedPlan ?? SubscriptionPlan.GROWTH,
        status: SubscriptionStatus.INCOMPLETE,
        stripeCustomerId: customerId,
        workspaceId,
      },
      update: {
        stripeCustomerId: customerId,
      },
      where: {
        workspaceId,
      },
    });
  }
}

export async function updateSubscriptionStatusByCustomer(customer: string | { id: string } | null, status: SubscriptionStatus) {
  const customerId = getStripeObjectId(customer);

  if (!customerId) {
    return;
  }

  await prisma.subscription.updateMany({
    data: {
      status,
    },
    where: {
      stripeCustomerId: customerId,
    },
  });
}
