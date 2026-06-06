"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { appUrl, getStripePriceId, stripe } from "@/lib/stripe";

const checkoutPlans = new Set<string>([SubscriptionPlan.GROWTH, SubscriptionPlan.PRO]);

const getBillingContext = async () => {
  const session = await auth();

  if (!session?.user?.id || !session.user.workspaceId) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    include: {
      memberships: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
      subscription: true,
    },
    where: {
      id: session.user.workspaceId,
    },
  });

  if (!workspace) {
    redirect("/billing?billing=workspace-missing");
  }

  return {
    owner: workspace.memberships[0]?.user,
    session,
    workspace,
  };
};

export async function createCheckoutSessionAction(formData: FormData) {
  const requestedPlan = String(formData.get("plan") ?? "");

  if (!checkoutPlans.has(requestedPlan)) {
    redirect("/billing?billing=invalid-plan");
  }

  const priceId = getStripePriceId(requestedPlan as SubscriptionPlan);

  if (!priceId || !process.env["STRIPE_SECRET_KEY"]) {
    redirect("/billing?billing=stripe-not-configured");
  }

  const { owner, session, workspace } = await getBillingContext();
  let stripeCustomerId = workspace.subscription?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: owner?.email ?? session.user.email ?? undefined,
      metadata: {
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
      },
      name: owner?.name ?? workspace.name,
    });

    stripeCustomerId = customer.id;

    await prisma.subscription.upsert({
      create: {
        plan: workspace.subscription?.plan ?? SubscriptionPlan.FREE,
        status: workspace.subscription?.status ?? SubscriptionStatus.INCOMPLETE,
        stripeCustomerId,
        workspaceId: workspace.id,
      },
      update: {
        stripeCustomerId,
      },
      where: {
        workspaceId: workspace.id,
      },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    cancel_url: `${appUrl}/billing?checkout=canceled`,
    client_reference_id: workspace.id,
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      plan: requestedPlan,
      workspaceId: workspace.id,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        plan: requestedPlan,
        workspaceId: workspace.id,
      },
    },
    success_url: `${appUrl}/billing?checkout=success`,
  });

  if (!checkoutSession.url) {
    redirect("/billing?billing=checkout-unavailable");
  }

  redirect(checkoutSession.url);
}

export async function createCustomerPortalSessionAction() {
  if (!process.env["STRIPE_SECRET_KEY"]) {
    redirect("/billing?billing=stripe-not-configured");
  }

  const { workspace } = await getBillingContext();
  const stripeCustomerId = workspace.subscription?.stripeCustomerId;

  if (!stripeCustomerId) {
    redirect("/billing?billing=no-stripe-customer");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/billing?portal=returned`,
  });

  redirect(portalSession.url);
}
