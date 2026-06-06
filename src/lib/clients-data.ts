import { ClientStatus, DealStage, TaskPriority, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ClientDetailActivity,
  ClientDetailData,
  ClientDetailDeal,
  ClientDetailTask,
  ClientListItem,
  ClientsData,
} from "@/types/clients";

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

const statusStyles: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: "bg-emerald-50 text-emerald-700",
  [ClientStatus.AT_RISK]: "bg-rose-50 text-rose-700",
  [ClientStatus.INACTIVE]: "bg-slate-100 text-slate-700",
  [ClientStatus.PROSPECT]: "bg-blue-50 text-blue-700",
};

const stageStyles: Record<DealStage, string> = {
  [DealStage.QUALIFIED]: "bg-rose-50 text-rose-700",
  [DealStage.DISCOVERY]: "bg-amber-50 text-amber-700",
  [DealStage.PROPOSAL]: "bg-blue-50 text-blue-700",
  [DealStage.NEGOTIATION]: "bg-emerald-50 text-emerald-700",
  [DealStage.WON]: "bg-emerald-50 text-emerald-700",
  [DealStage.LOST]: "bg-slate-100 text-slate-700",
};

const priorityStyles: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "bg-rose-50 text-rose-700",
  [TaskPriority.LOW]: "bg-slate-100 text-slate-700",
  [TaskPriority.MEDIUM]: "bg-amber-50 text-amber-700",
};

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCompactCurrency = (value: number) => compactCurrencyFormatter.format(value);

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });

const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatWebsite = (website: string | null) => website?.replace(/^https?:\/\//, "") ?? "Not added";

const formatDueLabel = (dueDate: Date | null) => {
  if (!dueDate) {
    return "No date";
  }

  return formatDate(dueDate);
};

const mapClient = (client: {
  contacts: {
    email: string | null;
    name: string;
  }[];
  deals: {
    stage: DealStage;
    value: unknown;
  }[];
  estimatedValue: unknown;
  id: string;
  industry: string | null;
  name: string;
  status: ClientStatus;
  tasks: { id: string }[];
  updatedAt: Date;
  website: string | null;
}): ClientListItem => {
  const openDeals = client.deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const contact = client.contacts[0];

  return {
    estimatedValue: formatCurrency(Number(client.estimatedValue)),
    id: client.id,
    industry: client.industry ?? "General",
    name: client.name,
    openDeals: String(openDeals.length),
    openTasks: String(client.tasks.length),
    pipelineValue: formatCompactCurrency(pipelineValue),
    primaryContact: contact?.name ?? "No contact",
    primaryContactEmail: contact?.email ?? "No email",
    status: formatEnumLabel(client.status),
    statusColor: statusStyles[client.status],
    updatedAt: formatDate(client.updatedAt),
    website: formatWebsite(client.website),
  };
};

export async function getClientsData(workspaceId: string): Promise<ClientsData> {
  const clients = await prisma.client.findMany({
    include: {
      contacts: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          email: true,
          name: true,
        },
        take: 1,
      },
      deals: {
        select: {
          stage: true,
          value: true,
        },
      },
      tasks: {
        select: {
          id: true,
        },
        where: {
          status: {
            not: TaskStatus.DONE,
          },
        },
      },
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
    where: {
      workspaceId,
    },
  });

  const totalEstimatedValue = clients.reduce((total, client) => total + Number(client.estimatedValue), 0);
  const activeClients = clients.filter((client) => client.status === ClientStatus.ACTIVE).length;
  const atRiskClients = clients.filter((client) => client.status === ClientStatus.AT_RISK).length;
  const openDeals = clients.flatMap((client) =>
    client.deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST),
  );
  const openTasks = clients.reduce((total, client) => total + client.tasks.length, 0);

  return {
    clients: clients.map(mapClient),
    metrics: [
      {
        accent: "bg-emerald-500",
        change: `${activeClients} active`,
        label: "Total clients",
        note: "in workspace",
        tint: "bg-emerald-50 text-emerald-700",
        value: String(clients.length),
      },
      {
        accent: "bg-blue-500",
        change: `${openDeals.length} open`,
        label: "Pipeline",
        note: "active deals",
        tint: "bg-blue-50 text-blue-700",
        value: formatCompactCurrency(totalEstimatedValue),
      },
      {
        accent: "bg-amber-500",
        change: `${openTasks} open`,
        label: "Client tasks",
        note: "needs follow-up",
        tint: "bg-amber-50 text-amber-700",
        value: String(openTasks),
      },
      {
        accent: "bg-rose-500",
        change: `${atRiskClients} watched`,
        label: "Risk watch",
        note: "health alerts",
        tint: "bg-rose-50 text-rose-700",
        value: String(atRiskClients),
      },
    ],
  };
}

const mapDeal = (deal: {
  expectedCloseDate: Date | null;
  id: string;
  probability: number;
  stage: DealStage;
  title: string;
  value: unknown;
}): ClientDetailDeal => ({
  expectedCloseDate: deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "No date",
  id: deal.id,
  probability: `${deal.probability}%`,
  stage: formatEnumLabel(deal.stage),
  stageColor: stageStyles[deal.stage],
  title: deal.title,
  value: formatCurrency(Number(deal.value)),
});

const mapTask = (task: {
  description: string | null;
  dueDate: Date | null;
  id: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}): ClientDetailTask => ({
  description: task.description ?? "No description",
  due: formatDueLabel(task.dueDate),
  id: task.id,
  priority: formatEnumLabel(task.priority),
  priorityColor: priorityStyles[task.priority],
  status: formatEnumLabel(task.status),
  title: task.title,
});

const mapActivity = (activity: {
  actor: { name: string } | null;
  createdAt: Date;
  id: string;
  message: string;
  type: string;
}): ClientDetailActivity => ({
  actor: activity.actor?.name ?? "System",
  date: formatLongDate(activity.createdAt),
  id: activity.id,
  message: activity.message,
  type: formatEnumLabel(activity.type),
});

export async function getClientDetailsData(workspaceId: string, clientId: string): Promise<ClientDetailData | null> {
  const client = await prisma.client.findFirst({
    include: {
      activities: {
        include: {
          actor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      },
      contacts: {
        orderBy: {
          createdAt: "asc",
        },
      },
      deals: {
        orderBy: [
          {
            expectedCloseDate: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
      },
      tasks: {
        orderBy: [
          {
            dueDate: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
      },
    },
    where: {
      id: clientId,
      workspaceId,
    },
  });

  if (!client) {
    return null;
  }

  const openDeals = client.deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST);
  const openTasks = client.tasks.filter((task) => task.status !== TaskStatus.DONE);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const weightedPipelineValue = openDeals.reduce(
    (total, deal) => total + Number(deal.value) * (deal.probability / 100),
    0,
  );

  return {
    activities: client.activities.map(mapActivity),
    contacts: client.contacts.map((contact) => ({
      email: contact.email ?? "No email",
      id: contact.id,
      name: contact.name,
      phone: contact.phone ?? "No phone",
      title: contact.title ?? "No title",
    })),
    deals: client.deals.map(mapDeal),
    estimatedValue: formatCurrency(Number(client.estimatedValue)),
    id: client.id,
    industry: client.industry ?? "General",
    metrics: [
      {
        label: "Estimated value",
        note: "account potential",
        value: formatCurrency(Number(client.estimatedValue)),
      },
      {
        label: "Open pipeline",
        note: `${openDeals.length} active deals`,
        value: formatCurrency(pipelineValue),
      },
      {
        label: "Weighted forecast",
        note: "probability adjusted",
        value: formatCompactCurrency(weightedPipelineValue),
      },
      {
        label: "Open tasks",
        note: "follow-ups",
        value: String(openTasks.length),
      },
    ],
    name: client.name,
    status: formatEnumLabel(client.status),
    statusColor: statusStyles[client.status],
    tasks: client.tasks.map(mapTask),
    updatedAt: formatLongDate(client.updatedAt),
    website: formatWebsite(client.website),
  };
}
