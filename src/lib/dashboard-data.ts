import {
  DealStage,
  SubscriptionPlan,
  SubscriptionStatus,
  TaskPriority,
  TaskStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardData, DashboardDeal, DashboardTask } from "@/types/dashboard";

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

const stageStyles: Record<DealStage, string> = {
  [DealStage.QUALIFIED]: "bg-rose-50 text-rose-700",
  [DealStage.DISCOVERY]: "bg-amber-50 text-amber-700",
  [DealStage.PROPOSAL]: "bg-blue-50 text-blue-700",
  [DealStage.NEGOTIATION]: "bg-emerald-50 text-emerald-700",
  [DealStage.WON]: "bg-emerald-50 text-emerald-700",
  [DealStage.LOST]: "bg-slate-100 text-slate-700",
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "High",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.LOW]: "Low",
};

const planPrices: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: "$0",
  [SubscriptionPlan.GROWTH]: "$29",
  [SubscriptionPlan.PRO]: "$79",
};

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCompactCurrency = (value: number) => compactCurrencyFormatter.format(value);

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDueLabel = (dueDate: Date | null) => {
  if (!dueDate) {
    return "No date";
  }

  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const tomorrow = addDays(today, 1);

  if (due.getTime() === today.getTime()) {
    return "Today";
  }

  if (due.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const mapDeal = (deal: {
  client: {
    contacts: { name: string }[];
    name: string;
  };
  probability: number;
  stage: DealStage;
  value: unknown;
}): DashboardDeal => ({
  company: deal.client.name,
  contact: deal.client.contacts[0]?.name ?? "No contact",
  stage: formatEnumLabel(deal.stage),
  value: formatCurrency(Number(deal.value)),
  probability: `${deal.probability}%`,
  color: stageStyles[deal.stage],
});

const mapTask = (task: {
  assignee: { name: string } | null;
  dueDate: Date | null;
  priority: TaskPriority;
  title: string;
}): DashboardTask => ({
  title: task.title,
  owner: task.assignee?.name ?? "Unassigned",
  due: formatDueLabel(task.dueDate),
  priority: priorityLabels[task.priority],
});

export async function getDashboardData(workspaceId: string): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -7);
  const nextMonth = addDays(todayStart, 30);

  const [workspace, activeClients, recentClients, openTasksCount, dueTodayCount] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        activities: {
          include: {
            actor: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        },
        deals: {
          include: {
            client: {
              include: {
                contacts: {
                  orderBy: {
                    createdAt: "asc",
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        subscription: true,
        tasks: {
          include: {
            assignee: true,
          },
          orderBy: [
            {
              dueDate: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 4,
        },
      },
    }),
    prisma.client.count({
      where: {
        status: "ACTIVE",
        workspaceId,
      },
    }),
    prisma.client.count({
      where: {
        createdAt: {
          gte: weekStart,
        },
        workspaceId,
      },
    }),
    prisma.task.count({
      where: {
        status: {
          not: TaskStatus.DONE,
        },
        workspaceId,
      },
    }),
    prisma.task.count({
      where: {
        dueDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
        status: {
          not: TaskStatus.DONE,
        },
        workspaceId,
      },
    }),
  ]);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const openDeals = workspace.deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const weightedPipelineValue = openDeals.reduce(
    (total, deal) => total + Number(deal.value) * (deal.probability / 100),
    0,
  );
  const expectedCloseValue = openDeals
    .filter((deal) => deal.expectedCloseDate && deal.expectedCloseDate <= nextMonth)
    .reduce((total, deal) => total + Number(deal.value), 0);
  const hotDeals = openDeals.filter((deal) => deal.probability >= 70);
  const averageProbability = openDeals.length
    ? Math.round(openDeals.reduce((total, deal) => total + deal.probability, 0) / openDeals.length)
    : 0;
  const targetProgress = Math.min(Math.round((pipelineValue / 200000) * 100), 100);
  const chartBars = openDeals.map((deal) => Math.max(22, deal.probability));

  while (chartBars.length < 7) {
    chartBars.push(28 + chartBars.length * 8);
  }

  const subscription = workspace.subscription;
  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const subscriptionStatus = subscription?.status ?? SubscriptionStatus.TRIALING;

  return {
    workspaceName: workspace.name,
    metrics: [
      {
        label: "Pipeline value",
        value: formatCurrency(pipelineValue),
        change: `${openDeals.length} open`,
        note: "active deals",
        accent: "bg-emerald-500",
        tint: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Active clients",
        value: String(activeClients),
        change: `+${recentClients}`,
        note: "new this week",
        accent: "bg-blue-500",
        tint: "bg-blue-50 text-blue-700",
      },
      {
        label: "Open tasks",
        value: String(openTasksCount),
        change: String(dueTodayCount),
        note: "due today",
        accent: "bg-amber-500",
        tint: "bg-amber-50 text-amber-700",
      },
      {
        label: "Win confidence",
        value: `${averageProbability}%`,
        change: String(hotDeals.length),
        note: "hot accounts",
        accent: "bg-rose-500",
        tint: "bg-rose-50 text-rose-700",
      },
    ],
    pipeline: openDeals.slice(0, 5).map(mapDeal),
    tasks: workspace.tasks.map(mapTask),
    activity: workspace.activities.map((item) => ({
      message: item.message,
      meta: item.actor?.name ? `Updated by ${item.actor.name}` : "Workspace activity",
    })),
    summary: {
      pipelineValue: formatCurrency(pipelineValue),
      weightedPipelineValue: formatCompactCurrency(weightedPipelineValue),
      revenueHeadline: `Your CRM has ${openDeals.length} open deals worth ${formatCurrency(pipelineValue)}.`,
      expectedCloseValue: formatCompactCurrency(expectedCloseValue),
      hotAccounts: String(hotDeals.length),
      dueToday: String(dueTodayCount),
      targetProgress,
      targetProgressLabel: `${targetProgress}%`,
      chartBars: chartBars.slice(0, 7),
      alertCount: dueTodayCount + hotDeals.length,
    },
    subscription: {
      plan: formatEnumLabel(plan),
      status: formatEnumLabel(subscriptionStatus),
      price: planPrices[plan],
      note: subscriptionStatus === SubscriptionStatus.ACTIVE ? "test billing mode" : "setup pending",
    },
  };
}
