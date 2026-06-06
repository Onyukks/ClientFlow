import { DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DealListItem, DealsData } from "@/types/deals";

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
  [DealStage.DISCOVERY]: "bg-amber-50 text-amber-700",
  [DealStage.LOST]: "bg-slate-100 text-slate-700",
  [DealStage.NEGOTIATION]: "bg-emerald-50 text-emerald-700",
  [DealStage.PROPOSAL]: "bg-blue-50 text-blue-700",
  [DealStage.QUALIFIED]: "bg-rose-50 text-rose-700",
  [DealStage.WON]: "bg-emerald-50 text-emerald-700",
};

const openStageOrder = [DealStage.QUALIFIED, DealStage.DISCOVERY, DealStage.PROPOSAL, DealStage.NEGOTIATION];

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCompactCurrency = (value: number) => compactCurrencyFormatter.format(value);

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (date: Date | null) => {
  if (!date) {
    return "No date";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
};

const mapDeal = (deal: {
  client: {
    contacts: { name: string }[];
    id: string;
    name: string;
  };
  expectedCloseDate: Date | null;
  id: string;
  probability: number;
  stage: DealStage;
  title: string;
  value: unknown;
}): DealListItem => {
  const value = Number(deal.value);

  return {
    clientId: deal.client.id,
    clientName: deal.client.name,
    closeDate: formatDate(deal.expectedCloseDate),
    contact: deal.client.contacts[0]?.name ?? "No contact",
    id: deal.id,
    probability: `${deal.probability}%`,
    stage: formatEnumLabel(deal.stage),
    stageColor: stageStyles[deal.stage],
    title: deal.title,
    value: formatCurrency(value),
    weightedValue: formatCompactCurrency(value * (deal.probability / 100)),
  };
};

export async function getDealsData(workspaceId: string): Promise<DealsData> {
  const deals = await prisma.deal.findMany({
    include: {
      client: {
        include: {
          contacts: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              name: true,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: [
      {
        expectedCloseDate: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
    where: {
      workspaceId,
    },
  });

  const openDeals = deals.filter((deal) => deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const weightedValue = openDeals.reduce((total, deal) => total + Number(deal.value) * (deal.probability / 100), 0);
  const averageProbability = openDeals.length
    ? Math.round(openDeals.reduce((total, deal) => total + deal.probability, 0) / openDeals.length)
    : 0;
  const hotDeals = openDeals.filter((deal) => deal.probability >= 70);
  const wonDeals = deals.filter((deal) => deal.stage === DealStage.WON);
  const wonValue = wonDeals.reduce((total, deal) => total + Number(deal.value), 0);
  const mappedDeals = deals.map(mapDeal);

  return {
    deals: mappedDeals,
    metrics: [
      {
        accent: "bg-emerald-500",
        change: `${openDeals.length} open`,
        label: "Pipeline value",
        note: "active opportunities",
        tint: "bg-emerald-50 text-emerald-700",
        value: formatCurrency(pipelineValue),
      },
      {
        accent: "bg-blue-500",
        change: `${hotDeals.length} hot`,
        label: "Weighted forecast",
        note: "probability adjusted",
        tint: "bg-blue-50 text-blue-700",
        value: formatCompactCurrency(weightedValue),
      },
      {
        accent: "bg-amber-500",
        change: `${averageProbability}% avg`,
        label: "Win confidence",
        note: "across open deals",
        tint: "bg-amber-50 text-amber-700",
        value: `${averageProbability}%`,
      },
      {
        accent: "bg-rose-500",
        change: `${wonDeals.length} won`,
        label: "Closed won",
        note: "booked value",
        tint: "bg-rose-50 text-rose-700",
        value: formatCompactCurrency(wonValue),
      },
    ],
    stageGroups: openStageOrder.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);
      const totalValue = stageDeals.reduce((total, deal) => total + Number(deal.value), 0);

      return {
        count: String(stageDeals.length),
        deals: stageDeals.map(mapDeal),
        label: formatEnumLabel(stage),
        totalValue: formatCompactCurrency(totalValue),
      };
    }),
  };
}
