import { ClientStatus, DealStage, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ClientListItem, ClientsData } from "@/types/clients";

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

const formatWebsite = (website: string | null) => website?.replace(/^https?:\/\//, "") ?? "Not added";

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
