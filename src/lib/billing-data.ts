import {
  DealStage,
  MemberRole,
  SubscriptionPlan,
  SubscriptionStatus,
  TaskStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { BillingData, BillingHistoryItem, BillingPlanCard, BillingUsageItem } from "@/types/billing";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

const planCatalog: Record<
  SubscriptionPlan,
  {
    description: string;
    features: string[];
    limits: {
      clients: number;
      deals: number;
      members: number;
      tasks: number;
    };
    name: string;
    price: number;
  }
> = {
  [SubscriptionPlan.FREE]: {
    description: "A lightweight workspace for early CRM experiments.",
    features: ["10 client accounts", "5 active opportunities", "Basic task tracking"],
    limits: {
      clients: 10,
      deals: 5,
      members: 1,
      tasks: 20,
    },
    name: "Free",
    price: 0,
  },
  [SubscriptionPlan.GROWTH]: {
    description: "The portfolio demo plan for a growing sales workspace.",
    features: ["100 client accounts", "50 active opportunities", "Team workspace", "Reports dashboard"],
    limits: {
      clients: 100,
      deals: 50,
      members: 5,
      tasks: 150,
    },
    name: "Growth",
    price: 29,
  },
  [SubscriptionPlan.PRO]: {
    description: "Advanced controls for larger teams and deeper reporting.",
    features: ["Unlimited client accounts", "Advanced analytics", "Priority support", "Custom billing flows"],
    limits: {
      clients: 500,
      deals: 250,
      members: 25,
      tasks: 1000,
    },
    name: "Pro",
    price: 79,
  },
};

const statusStyles: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: "bg-emerald-50 text-emerald-700",
  [SubscriptionStatus.CANCELED]: "bg-slate-100 text-slate-700",
  [SubscriptionStatus.INCOMPLETE]: "bg-amber-50 text-amber-700",
  [SubscriptionStatus.PAST_DUE]: "bg-rose-50 text-rose-700",
  [SubscriptionStatus.TRIALING]: "bg-blue-50 text-blue-700",
};

const roleLabels: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MEMBER]: "Member",
  [MemberRole.OWNER]: "Owner",
};

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCompactCurrency = (value: number) => compactCurrencyFormatter.format(value);

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const usagePercent = (value: number, limit: number) => Math.min(100, Math.max(6, Math.round((value / limit) * 100)));

const makeUsageItem = (label: string, value: number, limit: number, color: string): BillingUsageItem => ({
  color,
  label,
  limit: limit >= 500 ? "Unlimited demo" : `${limit} included`,
  percent: usagePercent(value, limit),
  value: String(value),
});

export async function getBillingData(workspaceId: string): Promise<BillingData> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    include: {
      clients: {
        select: {
          id: true,
        },
      },
      deals: {
        select: {
          stage: true,
          value: true,
        },
      },
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
      },
      subscription: true,
      tasks: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const subscription = workspace.subscription;
  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const planDetails = planCatalog[plan];
  const status = subscription?.status ?? SubscriptionStatus.TRIALING;
  const renewalDate = subscription?.currentPeriodEnd ?? addDays(new Date(), 14);
  const openDeals = workspace.deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const openTasks = workspace.tasks.filter((task) => task.status !== TaskStatus.DONE);
  const daysRemaining = Math.max(0, Math.ceil((renewalDate.getTime() - Date.now()) / 86_400_000));

  const usage: BillingUsageItem[] = [
    makeUsageItem("Client accounts", workspace.clients.length, planDetails.limits.clients, "bg-emerald-500"),
    makeUsageItem("Open deals", openDeals.length, planDetails.limits.deals, "bg-blue-500"),
    makeUsageItem("Team seats", workspace.memberships.length, planDetails.limits.members, "bg-amber-500"),
    makeUsageItem("Open tasks", openTasks.length, planDetails.limits.tasks, "bg-rose-500"),
  ];

  const planCards: BillingPlanCard[] = Object.values(SubscriptionPlan).map((planKey) => {
    const catalogPlan = planCatalog[planKey];
    const highlighted = planKey === plan;

    return {
      cta: highlighted ? "Current plan" : `Preview ${catalogPlan.name}`,
      description: catalogPlan.description,
      features: catalogPlan.features,
      highlighted,
      name: catalogPlan.name,
      price: `${formatCurrency(catalogPlan.price)}/mo`,
    };
  });

  const history: BillingHistoryItem[] = [
    {
      amount: formatCurrency(planDetails.price),
      date: formatDate(addDays(renewalDate, -30)),
      id: "INV-DEMO-003",
      label: `${planDetails.name} plan - current cycle`,
      status: "Paid",
      statusColor: "bg-emerald-50 text-emerald-700",
    },
    {
      amount: "$0",
      date: formatDate(addDays(renewalDate, -60)),
      id: "INV-DEMO-002",
      label: "Portfolio billing test credit",
      status: "Demo",
      statusColor: "bg-blue-50 text-blue-700",
    },
    {
      amount: "$0",
      date: formatDate(addDays(renewalDate, -90)),
      id: "INV-DEMO-001",
      label: "Workspace setup preview",
      status: "Demo",
      statusColor: "bg-blue-50 text-blue-700",
    },
  ];

  return {
    currentPlan: planDetails.name,
    currentPrice: `${formatCurrency(planDetails.price)}/mo`,
    history,
    members: workspace.memberships.map((membership) => ({
      email: membership.user.email,
      name: membership.user.name,
      role: roleLabels[membership.role],
    })),
    metrics: [
      {
        accent: "bg-emerald-500",
        change: status === SubscriptionStatus.ACTIVE ? "live test mode" : formatEnumLabel(status),
        label: "Current plan",
        note: "no real card charged",
        tint: statusStyles[status],
        value: planDetails.name,
      },
      {
        accent: "bg-blue-500",
        change: `${daysRemaining} days`,
        label: "Next renewal",
        note: "demo billing cycle",
        tint: "bg-blue-50 text-blue-700",
        value: formatDate(renewalDate),
      },
      {
        accent: "bg-amber-500",
        change: `${openDeals.length} open`,
        label: "Billable usage",
        note: "tracked opportunities",
        tint: "bg-amber-50 text-amber-700",
        value: formatCompactCurrency(pipelineValue),
      },
      {
        accent: "bg-rose-500",
        change: `${workspace.memberships.length} seat`,
        label: "Monthly price",
        note: "portfolio test plan",
        tint: "bg-rose-50 text-rose-700",
        value: formatCurrency(planDetails.price),
      },
    ],
    paymentMode: subscription?.stripeCustomerId ? "Stripe test customer connected" : "Stripe test mode preview",
    planCards,
    renewalDate: formatDate(renewalDate),
    status: formatEnumLabel(status),
    statusColor: statusStyles[status],
    summary: `${workspace.name} is on the ${planDetails.name} plan at ${formatCurrency(
      planDetails.price,
    )}/month with ${daysRemaining} days left in the current demo cycle.`,
    usage,
  };
}
