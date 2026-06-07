import { ActivityType, ClientStatus, DealStage, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ReportActivityItem,
  ReportForecastBar,
  ReportHealthSegment,
  ReportStageRow,
  ReportTaskSegment,
  ReportsData,
} from "@/types/reports";

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

const stageOrder = [DealStage.QUALIFIED, DealStage.DISCOVERY, DealStage.PROPOSAL, DealStage.NEGOTIATION];

const stageBars: Record<DealStage, string> = {
  [DealStage.DISCOVERY]: "bg-amber-500",
  [DealStage.LOST]: "bg-slate-500",
  [DealStage.NEGOTIATION]: "bg-emerald-500",
  [DealStage.PROPOSAL]: "bg-blue-500",
  [DealStage.QUALIFIED]: "bg-rose-500",
  [DealStage.WON]: "bg-emerald-500",
};

const healthColors: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: "bg-emerald-500",
  [ClientStatus.AT_RISK]: "bg-rose-500",
  [ClientStatus.INACTIVE]: "bg-slate-500",
  [ClientStatus.PROSPECT]: "bg-blue-500",
};

const taskColors: Record<TaskStatus, string> = {
  [TaskStatus.DONE]: "bg-emerald-500",
  [TaskStatus.IN_PROGRESS]: "bg-amber-500",
  [TaskStatus.TODO]: "bg-blue-500",
};

const activityLabels: Record<ActivityType, string> = {
  [ActivityType.CLIENT_CREATED]: "Client",
  [ActivityType.DEAL_UPDATED]: "Deal",
  [ActivityType.NOTE]: "Note",
  [ActivityType.TASK_CREATED]: "Task",
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

const formatActivityDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });

export async function getReportsData(workspaceId: string): Promise<ReportsData> {
  const now = startOfDay(new Date());
  const nextThirtyDays = addDays(now, 30);

  const [clients, deals, tasks, activities] = await Promise.all([
    prisma.client.findMany({
      where: {
        workspaceId,
      },
      select: {
        estimatedValue: true,
        status: true,
      },
    }),
    prisma.deal.findMany({
      where: {
        workspaceId,
      },
      select: {
        expectedCloseDate: true,
        probability: true,
        stage: true,
        value: true,
      },
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
      },
      select: {
        dueDate: true,
        status: true,
      },
    }),
    prisma.activity.findMany({
      where: {
        workspaceId,
      },
      include: {
        actor: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  const openDeals = deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const weightedForecast = openDeals.reduce((total, deal) => total + Number(deal.value) * (deal.probability / 100), 0);
  const nextThirtyDayValue = openDeals
    .filter((deal) => deal.expectedCloseDate && deal.expectedCloseDate >= now && deal.expectedCloseDate <= nextThirtyDays)
    .reduce((total, deal) => total + Number(deal.value), 0);
  const activeClients = clients.filter((client) => client.status === ClientStatus.ACTIVE).length;
  const atRiskClients = clients.filter((client) => client.status === ClientStatus.AT_RISK);
  const totalEstimatedValue = clients.reduce((total, client) => total + Number(client.estimatedValue), 0);
  const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);
  const dueSoonTasks = openTasks.filter((task) => task.dueDate && task.dueDate >= now && task.dueDate <= addDays(now, 7));
  const activeRate = clients.length ? Math.round((activeClients / clients.length) * 100) : 0;
  const taskCompletionRate = tasks.length
    ? Math.round((tasks.filter((task) => task.status === TaskStatus.DONE).length / tasks.length) * 100)
    : 0;

  const stageRows: ReportStageRow[] = stageOrder.map((stage) => {
    const stageDeals = openDeals.filter((deal) => deal.stage === stage);
    const stageValue = stageDeals.reduce((total, deal) => total + Number(deal.value), 0);
    const weightedValue = stageDeals.reduce((total, deal) => total + Number(deal.value) * (deal.probability / 100), 0);
    const averageProbability = stageDeals.length
      ? Math.round(stageDeals.reduce((total, deal) => total + deal.probability, 0) / stageDeals.length)
      : 0;

    return {
      averageProbability: `${averageProbability}%`,
      barColor: stageBars[stage],
      count: String(stageDeals.length),
      label: formatEnumLabel(stage),
      share: pipelineValue ? Math.max(8, Math.round((stageValue / pipelineValue) * 100)) : 0,
      totalValue: formatCompactCurrency(stageValue),
      weightedValue: formatCompactCurrency(weightedValue),
    };
  });

  const weightedValuesByStage = stageOrder.map((stage) =>
    openDeals
      .filter((deal) => deal.stage === stage)
      .reduce((total, deal) => total + Number(deal.value) * (deal.probability / 100), 0),
  );
  const maxWeightedValue = Math.max(1, ...weightedValuesByStage);

  const forecastBars: ReportForecastBar[] = stageRows.map((stage, index) => {
    const weightedNumber = weightedValuesByStage[index] ?? 0;

    return {
      barColor: stage.barColor,
      height: Math.max(18, Math.round((weightedNumber / maxWeightedValue) * 100)),
      label: stage.label,
      value: stage.totalValue,
      weightedValue: stage.weightedValue,
    };
  });

  const healthSegments: ReportHealthSegment[] = [
    ClientStatus.ACTIVE,
    ClientStatus.PROSPECT,
    ClientStatus.AT_RISK,
    ClientStatus.INACTIVE,
  ].map((status) => {
    const count = clients.filter((client) => client.status === status).length;

    return {
      color: healthColors[status],
      count: String(count),
      label: formatEnumLabel(status),
      value: clients.length ? Math.max(8, Math.round((count / clients.length) * 100)) : 0,
    };
  });

  const taskSegments: ReportTaskSegment[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((status) => {
    const count = tasks.filter((task) => task.status === status).length;

    return {
      color: taskColors[status],
      count: String(count),
      label: formatEnumLabel(status),
      percent: tasks.length ? Math.max(8, Math.round((count / tasks.length) * 100)) : 0,
    };
  });

  const activity: ReportActivityItem[] = activities.map((item) => ({
    id: item.id,
    message: item.message,
    meta: `${item.client?.name ?? "Workspace"} - ${formatActivityDate(item.createdAt)} - ${
      item.actor?.name ?? "System"
    }`,
    type: activityLabels[item.type],
  }));

  return {
    activity,
    forecastBars,
    headline: `${clients.length} accounts, ${formatCompactCurrency(pipelineValue)} open, ${formatCompactCurrency(
      weightedForecast,
    )} forecast.`,
    healthSegments,
    metrics: [
      {
        accent: "bg-emerald-500",
        change: `${openDeals.length} open`,
        label: "Open pipeline",
        note: "active opportunities",
        tint: "bg-emerald-50 text-emerald-700",
        value: formatCurrency(pipelineValue),
      },
      {
        accent: "bg-blue-500",
        change: `${activeRate}% active`,
        label: "Weighted forecast",
        note: "probability adjusted",
        tint: "bg-blue-50 text-blue-700",
        value: formatCompactCurrency(weightedForecast),
      },
      {
        accent: "bg-amber-500",
        change: `${dueSoonTasks.length} due soon`,
        label: "Next 30 days",
        note: "expected closes",
        tint: "bg-amber-50 text-amber-700",
        value: formatCompactCurrency(nextThirtyDayValue),
      },
      {
        accent: "bg-rose-500",
        change: `${atRiskClients.length} watched`,
        label: "Portfolio value",
        note: `${taskCompletionRate}% tasks complete`,
        tint: "bg-rose-50 text-rose-700",
        value: formatCompactCurrency(totalEstimatedValue),
      },
    ],
    stageRows,
    taskSegments,
  };
}
